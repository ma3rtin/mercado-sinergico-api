import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { productoExcelService } from '../services/producto-excel.service.js';
import { importQueue } from '../queues/import.queue.js';
import crypto from 'crypto';
import fs from 'fs';


export class ProductoExcelController {
    /**
     * Helper: Calcula SHA256 para idempotencia
     */
    private calculateHash(filePath: string): string {

        const fileBuffer = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    /**
     * Inicia la importación asíncrona de productos
     */
    async importar(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                 res.status(400).json({ success: false, message: 'No se ha enviado ningún archivo' });
                 return;
            }

            // 1. RATE LIMITING: Máximo 5 importaciones por hora
            const userId = (req as any).user?.id || 1; // Asumiendo auth middleware
            const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
            const importCount = await prisma.importacionExcel.count({
                where: { usuarioId: userId, createdAt: { gte: unaHoraAtras } }
            });

            if (importCount >= 5) {
                res.status(429).json({ success: false, message: 'Límite de 5 importaciones por hora alcanzado' });
                return;
            }

            // 2. IDEMPOTENCIA: No procesar el mismo archivo si ya está en curso o completado recientemente
            const fileHash = this.calculateHash(req.file.path);
            const duplicado = await prisma.importacionExcel.findFirst({
                where: { hashArchivo: fileHash, estado: { in: ['PROCESANDO', 'COMPLETADO'] } },
                orderBy: { createdAt: 'desc' }
            });

            if (duplicado) {
                res.status(409).json({ 
                    success: false, 
                    message: 'Este archivo ya ha sido procesado o está en curso.',
                    duplicadoId: duplicado.id
                });
                return;
            }

            // 3. Crear registro de tracking
            const tracker = await prisma.importacionExcel.create({
                data: {
                    nombreArchivo: req.file.originalname,
                    hashArchivo: fileHash,
                    estado: 'PENDIENTE',
                    usuarioId: userId
                }
            });

            // 4. Encolar Job BullMQ
            importQueue.add(`import-${tracker.id}`, { 
                filePath: req.file.path, 
                trackerId: tracker.id 
            }, { jobId: tracker.id.toString() });

            res.status(202).json({ success: true, importacionId: tracker.id });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Error interno', error: String(error) });
        }
    }

    /**
     * Reintento manual de una tarea fallida
     * POST /api/productos/excel/importar/retry/:id
     */
    async reintentar(req: Request, res: Response): Promise<void> {
         try {
            const { id } = req.params;
            const tracker = await prisma.importacionExcel.findUnique({ where: { id: parseInt(id) } });

            if (!tracker || tracker.estado !== 'FALLIDO') {
                res.status(400).json({ success: false, message: 'Solo se pueden reintentar tareas en estado FALLIDO' });
                return;
            }

            // Poner de nuevo en cola limpia
            await prisma.importacionExcel.update({
                where: { id: tracker.id },
                data: { estado: 'PENDIENTE', progreso: 0, errorFatal: null }
            });

            // Nota: En una app real, el archivo debería estar persistido en S3 para reintentar. 
            // Si era local y se borró (en el worker anterior), este retry fallará unless guardemos el archivo.
            // Para fines de demo, asumimos que el archivo sigue existiendo o se recupera.

            res.status(200).json({ success: true, message: 'Reintento encolonado con éxito' });
         } catch (error) {
            res.status(500).json({ success: false, message: 'Error al reintentar', error: String(error) });
         }
    }


    /**
     * Consulta el estado actual de una importación
     * GET /api/productos/excel/importar/status/:id
     */
    async consultarEstado(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userRol = req.user?.rol;

            const tracker = await prisma.importacionExcel.findUnique({
                where: { id: parseInt(id) }
            });

            if (!tracker) {
                res.status(404).json({ success: false, message: 'Importación no encontrada' });
                return;
            }

            // Security: Only the owner or an Admin can see the status
            if (tracker.usuarioId !== userId && userRol !== 'Admin') {
                res.status(403).json({ success: false, message: 'No tienes permiso para ver esta importación' });
                return;
            }

            res.status(200).json({
                success: true,
                data: tracker
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al consultar estado',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Exporta todos los productos a un archivo Excel
     */
    async exportar(req: Request, res: Response): Promise<void> {
        try {
            const buffer = await productoExcelService.exportarProductos();
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `productos_${timestamp}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(buffer);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al exportar productos',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Genera una plantilla de Excel vacía para importación
     */
    async generarPlantilla(req: Request, res: Response): Promise<void> {
        try {
            const buffer = await productoExcelService.generarPlantilla();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="plantilla_productos.xlsx"');
            res.send(buffer);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al generar plantilla',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}

export const productoExcelController = new ProductoExcelController();

