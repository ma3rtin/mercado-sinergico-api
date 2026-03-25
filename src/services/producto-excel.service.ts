import * as XLSX from 'xlsx';
import { prisma } from '../prisma/client.js';
import { TipoPaquete } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export interface ExcelRow {
    id_producto?: string;
    sku?: string;
    nombre?: string;
    descripcion?: string;
    precio?: string;
    marca?: string;
    categoria?: string;
    plantilla?: string;
    tipo?: string;
    imagen_url?: string;
    altura?: string;
    ancho?: string;
    profundidad?: string;
    peso?: string;
    stock?: string;
    [key: string]: unknown;
}

export class ProductoExcelService {
    async limpiarArchivosHuerfanos(): Promise<void> {
        const uploadDir = 'uploads/imports';
        if (!fs.existsSync(uploadDir)) return;
        const files = fs.readdirSync(uploadDir);
        const limit = Date.now() - 24 * 60 * 60 * 1000;
        files.forEach(file => {
            const filePath = path.join(uploadDir, file);
            if (fs.statSync(filePath).mtimeMs < limit) fs.unlinkSync(filePath);
        });
    }

    private parseSafeNumber(value: any, decimal = true): number | null {
        if (value === undefined || value === null || value === '') return null;
        const parsed = decimal ? parseFloat(value) : parseInt(value);
        return isNaN(parsed) ? null : parsed;
    }

    private sanitizeString(value: any): string {
        return (value ?? '').toString().trim();
    }

    async procesarImportacionAsincrona(filePath: string, trackerId: number): Promise<void> {
        const marcaCache = new Map<string, number>();
        const categoriaCache = new Map<string, number>();
        const errores: any[] = [];
        let creados = 0;
        let actualizados = 0;
        const startTime = Date.now();

        try {
            await prisma.importacionExcel.update({ where: { id: trackerId }, data: { estado: 'PROCESANDO' } });

            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const data: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName], { defval: '' });
            const totalRows = data.length;

            await prisma.importacionExcel.update({ where: { id: trackerId }, data: { totalFilas: totalRows } });

            for (let i = 0; i < totalRows; i++) {
                const fila = i + 2;
                const row = data[i];

                try {
                    const nombre = this.sanitizeString(row.nombre);
                    const descripcion = this.sanitizeString(row.descripcion);
                    const marcaNombre = this.sanitizeString(row.marca);
                    const categoriaNombre = this.sanitizeString(row.categoria);
                    const sku = this.sanitizeString(row.sku);
                    const idProductoStr = this.sanitizeString(row.id_producto);

                    if (!nombre || !descripcion || !row.precio || !marcaNombre || !categoriaNombre) {
                        errores.push({ fila, mensaje: 'Faltan campos obligatorios' });
                        continue;
                    }

                    const precio = this.parseSafeNumber(row.precio);
                    if (precio === null || precio < 0) {
                        errores.push({ fila, mensaje: `Precio inválido: ${row.precio}` });
                        continue;
                    }

                    let marcaId = marcaCache.get(marcaNombre);
                    if (!marcaId) {
                        const m = await prisma.marca.upsert({ where: { nombre: marcaNombre }, update: {}, create: { nombre: marcaNombre } });
                        marcaId = m.id_marca;
                        marcaCache.set(marcaNombre, marcaId);
                    }

                    let categoriaId = categoriaCache.get(categoriaNombre);
                    if (!categoriaId) {
                        const c = await prisma.categoria.findFirst({ where: { nombre: categoriaNombre } }) || await prisma.categoria.create({ data: { nombre: categoriaNombre } });
                        categoriaId = c.id_categoria;
                        categoriaCache.set(categoriaNombre, categoriaId);
                    }

                    const commonData = {
                        nombre, descripcion, precio,
                        imagen_url: row.imagen_url ? this.sanitizeString(row.imagen_url) : null,
                        stock: this.parseSafeNumber(row.stock, false) || 0,
                        tipo: (row.tipo?.toString().toUpperCase() as any) || 'POR_DEFINIR',
                        marca_id: marcaId, categoria_id: categoriaId
                    };

                    if (idProductoStr) {
                        const id = parseInt(idProductoStr);
                        const ant = await prisma.producto.findUnique({ where: { id_producto: id } });
                        await prisma.producto.upsert({ where: { id_producto: id }, update: commonData, create: commonData });
                        await prisma.auditoriaProducto.create({ data: { productoId: id, accion: ant ? 'ACTUALIZAR' : 'CREAR', valorAnterior: ant ? JSON.stringify(ant) : null, valorNuevo: JSON.stringify(commonData) } });
                        actualizados++;
                    } else if (sku) {
                        const v = await prisma.productoVariante.findUnique({ where: { sku }, include: { producto: true } });
                        if (v) {
                            await prisma.producto.update({ where: { id_producto: v.productoId }, data: commonData });
                            await prisma.auditoriaProducto.create({ data: { productoId: v.productoId, accion: 'ACTUALIZAR_V', valorAnterior: `SKU:${v.sku}`, valorNuevo: `Stock:${commonData.stock}` } });
                            actualizados++;
                        } else {
                            const p = await prisma.producto.create({ data: commonData });
                            await prisma.productoVariante.create({ data: { productoId: p.id_producto, sku, stockFisico: commonData.stock, activo: true } });
                            creados++;
                        }
                    } else {
                        const p = await prisma.producto.create({ data: commonData });
                        creados++;
                    }
                } catch (err) {
                    errores.push({ fila, mensaje: `Error: ${err instanceof Error ? err.message : 'DB Error'}` });
                }

                if (i % 50 === 0 || i === totalRows - 1) {
                    await prisma.importacionExcel.update({ where: { id: trackerId }, data: { progreso: Math.round(((i + 1) / totalRows) * 100), procesadas: i + 1 } });
                }
            }

            const duracionMs = Date.now() - startTime;
            await prisma.importacionExcel.update({
                where: { id: trackerId },
                data: {
                    estado: 'COMPLETADO', progreso: 100, procesadas: totalRows,
                    duracionMs, filasPorSegundo: totalRows > 0 ? (totalRows / (duracionMs / 1000)) : 0,
                    errores: errores.length > 0 ? errores : null,
                    resultado: { creados, actualizados, total: creados + actualizados }
                }
            });
        } catch (error) {
            await prisma.importacionExcel.update({ where: { id: trackerId }, data: { estado: 'FALLIDO', errorFatal: String(error) } });
        } finally {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    }

    async exportarProductos(): Promise<Buffer> {
        const productos = await prisma.producto.findMany({ include: { marca: true, categoria: true, plantilla: true, variantes: true }, orderBy: { id_producto: 'asc' } });
        const rows: any[] = [];
        productos.forEach(p => {
            const base = { id_producto: p.id_producto, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, marca: p.marca.nombre, categoria: p.categoria.nombre, imagen_url: p.imagen_url || '', tipo: p.tipo || '', createdAt: p.createdAt.toISOString().split('T')[0] };
            if (p.variantes.length > 0) p.variantes.forEach(v => rows.push({ ...base, sku: v.sku, stock: v.stockFisico || 0 }));
            else rows.push({ ...base, sku: '', stock: p.stock || 0 });
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    }

    async generarPlantilla(): Promise<Buffer> {
        const data = [{ id_producto: '', nombre: 'Ejemplo', descripcion: 'Desc', precio: 100, marca: 'Marca', categoria: 'Cat', stock: 10, tipo: 'ENERGETICO', sku: 'SKU-001' }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    }
}

export const productoExcelService = new ProductoExcelService();
