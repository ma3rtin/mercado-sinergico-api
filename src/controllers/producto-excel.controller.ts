import { Request, Response } from 'express';
import { productoExcelService } from '../services/producto-excel.service.js';

export class ProductoExcelController {
    /**
     * Importa productos desde un archivo Excel
     * POST /api/productos/importar
     */
    async importar(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No se ha enviado ningún archivo',
                });
                return;
            }

            const buffer = req.file.buffer;
            const resultado = await productoExcelService.importarProductos(buffer);

            if (resultado.success) {
                res.status(200).json(resultado);
            } else {
                res.status(400).json(resultado);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al importar productos',
                error: error.message,
            });
        }
    }

    /**
     * Exporta todos los productos a un archivo Excel
     * GET /api/productos/exportar
     */
    async exportar(req: Request, res: Response): Promise<void> {
        try {
            const buffer = await productoExcelService.exportarProductos();

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `productos_${timestamp}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(buffer);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al exportar productos',
                error: error.message,
            });
        }
    }

    /**
     * Genera una plantilla de Excel vacía para importación
     * GET /api/productos/plantilla
     */
    async generarPlantilla(req: Request, res: Response): Promise<void> {
        try {
            const buffer = await productoExcelService.generarPlantilla();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="plantilla_productos.xlsx"');
            res.send(buffer);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al generar plantilla',
                error: error.message,
            });
        }
    }
}

export const productoExcelController = new ProductoExcelController();
