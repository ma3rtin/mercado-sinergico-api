import * as XLSX from 'xlsx';
import { ProductoImportResultDto } from '../dtos/producto-import.dto.js';
import { prisma } from '../prisma/client.js';
import { TipoPaquete } from '@prisma/client';

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
    /**
     * Importa productos desde un archivo Excel con soporte para UPSERT
     * Si el producto tiene id_producto o SKU, lo actualiza; si no, lo crea
     */
    async importarProductos(buffer: Buffer): Promise<ProductoImportResultDto> {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convertir la hoja a JSON
            const data: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

            if (data.length === 0) {
                return new ProductoImportResultDto(false, 'El archivo Excel está vacío');
            }

            const errores: Array<{ fila: number; mensaje: string; datos: ExcelRow }> = [];
            let creados = 0;
            let actualizados = 0;

            for (let i = 0; i < data.length; i++) {
                const fila = i + 2; // +2 porque Excel empieza en 1 y tiene header
                const row = data[i];

                try {
                    // Validar que los campos requeridos existan
                    if (!row.nombre || !row.descripcion || !row.precio || !row.marca || !row.categoria) {
                        errores.push({
                            fila,
                            mensaje: 'Faltan campos requeridos (nombre, descripcion, precio, marca, categoria)',
                            datos: row,
                        });
                        continue;
                    }

                    // Buscar o crear la marca
                    let marca = await prisma.marca.findFirst({
                        where: { nombre: row.marca },
                    });

                    if (!marca) {
                        marca = await prisma.marca.create({
                            data: { nombre: row.marca },
                        });
                    }

                    // Buscar o crear la categoría
                    let categoria = await prisma.categoria.findFirst({
                        where: { nombre: row.categoria },
                    });

                    if (!categoria) {
                        categoria = await prisma.categoria.create({
                            data: { nombre: row.categoria },
                        });
                    }

                    // Buscar plantilla si se especifica
                    let plantillaId: number | null = null;
                    if (row.plantilla) {
                        const plantilla = await prisma.plantilla.findFirst({
                            where: { nombre: row.plantilla },
                        });
                        plantillaId = plantilla?.id || null;
                    }

                    // Determinar el tipo de producto
                    let tipo: TipoPaquete = TipoPaquete.SINERGICO;
                    if (row.tipo) {
                        const tipoUpper = row.tipo.toString().toUpperCase().trim();
                        if (tipoUpper === 'SINERGICO') {
                            tipo = TipoPaquete.SINERGICO;
                        } else if (tipoUpper === 'ENERGICO' || tipoUpper === 'ENERGETICO') {
                            tipo = TipoPaquete.ENERGICO;
                        } else if (tipoUpper === 'POR_DEFINIR') {
                            tipo = TipoPaquete.SINERGICO;
                        } else {
                            throw new Error(`El valor '${row.tipo}' en la columna 'tipo' no es válido. Usa 'Sinergico' o 'Energetico'.`);
                        }
                    }

                    // Preparar los datos del producto (sin relaciones)
                    const productoDataBase = {
                        nombre: row.nombre,
                        descripcion: row.descripcion,
                        precio: parseFloat(row.precio),
                        imagen_url: row.imagen_url || null,
                        altura: row.altura ? parseFloat(row.altura) : null,
                        ancho: row.ancho ? parseFloat(row.ancho) : null,
                        profundidad: row.profundidad ? parseFloat(row.profundidad) : null,
                        peso: row.peso ? parseFloat(row.peso) : null,
                        stock: (() => {
                            const parsedStock = row.stock ? parseInt(row.stock) : null;
                            if (parsedStock !== null && parsedStock < 0) {
                                throw new Error('El stock no puede ser negativo.');
                            } return parsedStock;
                        })(),
                        tipo: tipo,
                    };

                    // Datos para actualización (con IDs directos)
                    const productoDataUpdate = {
                        ...productoDataBase,
                        marca_id: marca.id_marca,
                        categoria_id: categoria.id_categoria,
                        plantillaId: plantillaId,
                    };

                    // Datos para creación (con relaciones connect)
                    const productoDataCreate = {
                        ...productoDataBase,
                        marca: { connect: { id_marca: marca.id_marca } },
                        categoria: { connect: { id_categoria: categoria.id_categoria } },
                        plantilla: plantillaId ? { connect: { id: plantillaId } } : undefined,
                    };

                    let producto;

                    // Intentar encontrar producto existente por ID o SKU
                    if (row.id_producto) {
                        // Buscar por ID
                        const productoExistente = await prisma.producto.findUnique({
                            where: { id_producto: parseInt(row.id_producto) },
                        });

                        if (productoExistente) {
                            // ACTUALIZAR producto existente
                            producto = await prisma.producto.update({
                                where: { id_producto: parseInt(row.id_producto) },
                                data: productoDataUpdate,
                            });
                            actualizados++;
                        } else {
                            errores.push({
                                fila,
                                mensaje: `No se encontró producto con ID ${row.id_producto}`,
                                datos: row,
                            });
                            continue;
                        }
                    } else if (row.sku) {
                        // Buscar por SKU
                        const varianteExistente = await prisma.productoVariante.findUnique({
                            where: { sku: row.sku },
                            include: { producto: true },
                        });

                        if (varianteExistente) {
                            // ACTUALIZAR producto existente
                            producto = await prisma.producto.update({
                                where: { id_producto: varianteExistente.productoId },
                                data: productoDataUpdate,
                            });

                            // Actualizar también la variante
                            await prisma.productoVariante.update({
                                where: { sku: row.sku },
                                data: {
                                    // Validar stockFisico no negativo
                                    stockFisico: (() => {
                                        const parsedStockFisico = row.stock ? parseInt(row.stock) : null;
                                        if (parsedStockFisico !== null && parsedStockFisico < 0) {
                                            throw new Error('El stock físico no puede ser negativo.');
                                        }
                                        return parsedStockFisico;
                                    })(),
                                    activo: true,
                                },
                            });

                            actualizados++;
                        } else {
                            // CREAR nuevo producto con variante
                            producto = await prisma.producto.create({
                                data: productoDataCreate,
                            });

                            // Crear variante
                            await prisma.productoVariante.create({
                                data: {
                                    productoId: producto.id_producto, // Validar stockFisico no negativo
                                    stockFisico: (() => {
                                        const parsedStockFisico = row.stock ? parseInt(row.stock) : null;
                                        if (parsedStockFisico !== null && parsedStockFisico < 0) { throw new Error('El stock físico no puede ser negativo.'); } return parsedStockFisico;
                                    })(),
                                    sku: row.sku,
                                    activo: true,
                                },
                            });

                            creados++;
                        }
                    } else {
                        // CREAR nuevo producto sin ID ni SKU
                        producto = await prisma.producto.create({
                            data: productoDataCreate,
                        });
                        creados++;
                    }
                } catch (error) {
                    let msg = error instanceof Error ? error.message : 'Error desconocido al procesar esta fila';
                    
                    // Hacer que los errores de Prisma sean amigables para el administrador
                    if (msg.includes('Invalid `prisma.')) {
                        if (msg.includes('Unique constraint failed')) {
                            msg = 'Ya existe un producto con este registro único (ej: SKU repetido).';
                        } else if (msg.includes('Foreign key constraint failed')) {
                            msg = 'Hay una referencia a un dato que no existe o es inválido.';
                        } else if (msg.includes('Invalid value for argument')) {
                            const match = msg.match(/Invalid value for argument `(.*?)`/);
                            if (match) {
                                msg = `El valor en la columna '${match[1]}' tiene un formato incorrecto o no es permitido.`;
                            } else {
                                msg = 'Un dato en esta fila tiene un formato equivocado o un tipo incorrecto.';
                            }
                        } else {
                            msg = 'Hubo un problema de validación al intentar guardar este producto en la base de datos.';
                        }
                    }

                    errores.push({
                        fila,
                        mensaje: msg,
                        datos: row,
                    });
                }
            }

            const total = creados + actualizados;
            return new ProductoImportResultDto(
                true,
                `Importación completada. ${creados} creados, ${actualizados} actualizados, ${errores.length} errores`,
                {
                    importados: total,
                    creados,
                    actualizados,
                    errores,
                }
            );
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return new ProductoImportResultDto(false, `Error al procesar el archivo: ${msg}`);
        }
    }

    /**
     * Exporta productos a un archivo Excel
     */
    async exportarProductos(): Promise<Buffer> {
        try {
            // Obtener todos los productos con sus relaciones
            const productos = await prisma.producto.findMany({
                include: {
                    marca: true,
                    categoria: true,
                    plantilla: true,
                    variantes: true,
                },
                orderBy: {
                    id_producto: 'asc',
                },
            });

            // Preparar los datos para Excel
            const data = productos.map((producto) => ({
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                descripcion: producto.descripcion,
                precio: producto.precio,
                marca: producto.marca.nombre,
                categoria: producto.categoria.nombre,
                imagen_url: producto.imagen_url || '',
                altura: producto.altura || '',
                ancho: producto.ancho || '',
                profundidad: producto.profundidad || '',
                peso: producto.peso || '',
                stock: producto.stock || '',
                tipo: producto.tipo || '',
                plantilla: producto.plantilla?.nombre || '',
                sku: producto.variantes[0]?.sku || '',
                createdAt: producto.createdAt,
                updatedAt: producto.updatedAt,
            }));

            // Crear el workbook y worksheet
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

            // Ajustar el ancho de las columnas
            const colWidths = [
                { wch: 10 }, // id_producto
                { wch: 30 }, // nombre
                { wch: 50 }, // descripcion
                { wch: 10 }, // precio
                { wch: 20 }, // marca
                { wch: 20 }, // categoria
                { wch: 40 }, // imagen_url
                { wch: 10 }, // altura
                { wch: 10 }, // ancho
                { wch: 10 }, // profundidad
                { wch: 10 }, // peso
                { wch: 10 }, // stock
                { wch: 15 }, // tipo
                { wch: 20 }, // plantilla
                { wch: 20 }, // sku
                { wch: 20 }, // createdAt
                { wch: 20 }, // updatedAt
            ];
            worksheet['!cols'] = colWidths;

            // Convertir a buffer
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            return buffer as Buffer;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`Error al exportar productos: ${msg}`);
        }
    }

    /**
     * Genera una plantilla de Excel con los campos necesarios
     */
    async generarPlantilla(): Promise<Buffer> {
        try {
            const data = [
                {
                    id_producto: '',
                    nombre: 'Ejemplo Producto 1',
                    descripcion: 'Descripción del producto',
                    precio: 1000,
                    marca: 'Marca Ejemplo',
                    categoria: 'Categoría Ejemplo',
                    imagen_url: 'https://ejemplo.com/imagen.jpg',
                    altura: 10,
                    ancho: 20,
                    profundidad: 15,
                    peso: 2.5,
                    stock: 100,
                    tipo: 'ENERGICO',
                    plantilla: '',
                    sku: 'SKU-001',
                },
                {
                    id_producto: '',
                    nombre: 'Ejemplo Producto 2',
                    descripcion: 'Otro producto de ejemplo',
                    precio: 2000,
                    marca: 'Marca Ejemplo',
                    categoria: 'Categoría Ejemplo',
                    imagen_url: '',
                    altura: '',
                    ancho: '',
                    profundidad: '',
                    peso: '',
                    stock: 50,
                    tipo: 'SINERGICO',
                    plantilla: '',
                    sku: 'SKU-002',
                },
            ];

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

            // Ajustar el ancho de las columnas
            const colWidths = [
                { wch: 10 }, // id_producto
                { wch: 30 }, // nombre
                { wch: 50 }, // descripcion
                { wch: 10 }, // precio
                { wch: 20 }, // marca
                { wch: 20 }, // categoria
                { wch: 40 }, // imagen_url
                { wch: 10 }, // altura
                { wch: 10 }, // ancho
                { wch: 10 }, // profundidad
                { wch: 10 }, // peso
                { wch: 10 }, // stock
                { wch: 15 }, // tipo
                { wch: 20 }, // plantilla
                { wch: 20 }, // sku
            ];
            worksheet['!cols'] = colWidths;

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            return buffer as Buffer;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`Error al generar plantilla: ${msg}`);
        }
    }
}

export const productoExcelService = new ProductoExcelService();
