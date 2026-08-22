import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { TipoPaquete, Prisma } from '@prisma/client';
import { GenerarVariantesDTO } from '../dtos/variante/generarVariantes.dto.js';
import { ActualizarStockVariantesDTO } from '../dtos/variante/actualizarStockVariantes.dto.js';
import { ActualizarVarianteDTO } from '../dtos/variante/actualizarVariante.dto.js';
import { ActualizarVarianteBulkDTO } from '../dtos/variante/actualizarVarianteBulk.dto.js';
import { ImagenService } from './imagen.service.js';
import { generarVariantesEnTransaccion } from './variante-generacion.helper.js';

export class VarianteService {
  private prisma = prisma;
  private imagenService = new ImagenService();

  public async getVariantesByProducto(productoId: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id_producto: productoId },
      include: {
        plantilla: {
          include: {
            caracteristicas: {
              include: {
                opciones: true,
              },
            },
          },
        },
      },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }

    const variantes = await this.prisma.productoVariante.findMany({
      where: { productoId },
      include: {
        opciones: {
          include: {
            caracteristica: true,
            opcion: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    type ProductoWithTipo = typeof producto & { tipo: TipoPaquete | null };
    const productoWithTipo = producto as ProductoWithTipo;

    return {
      producto: {
        id: producto.id_producto,
        nombre: producto.nombre,
        tipo: productoWithTipo.tipo ?? TipoPaquete.SINERGICO,
        plantilla: producto.plantilla,
      },
      variantes: variantes.map((v) => ({
        id: v.id,
        sku: v.sku,
        stockFisico: v.stockFisico,
        precioExtra: v.precioExtra,
        activo: v.activo,
        imagen_url: (v as { imagen_url?: string | null } & typeof v).imagen_url ?? null,
        opciones: v.opciones.map((vo) => ({
          caracteristica: vo.caracteristica.nombre,
          opcion: vo.opcion.nombre,
          caracteristicaId: vo.caracteristicaId,
          opcionId: vo.opcionId,
        })),
      })),
    };
  }

  public async generarVariantes(data: GenerarVariantesDTO) {
    const start = Date.now();
    const { productoId, opcionesDisponibles } = data;
    console.log(
      `[generarVariantes] Iniciando: productoId=${productoId}, opcionesDisponibles=${JSON.stringify(opcionesDisponibles)}`
    );

    const producto = await this.prisma.producto.findUnique({
      where: { id_producto: productoId },
      include: {
        plantilla: {
          include: {
            caracteristicas: {
              include: { opciones: true },
            },
          },
        },
      },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }

    if (!producto.plantilla) {
      throw new CustomError('El producto no tiene plantilla asignada', 400);
    }

    // Guard contra duplicados: si el producto ya tiene variantes, se rechaza la
    // regeneración. Cuando el cambio de plantilla se autoriza (ProductoService.update
    // sin pedidos asociados), las variantes viejas se eliminan en la misma transacción
    // del update, por lo que acá el count ya es 0 y la generación procede normal.
    const variantesExistentes = await this.prisma.productoVariante.count({
      where: { productoId },
    });
    if (variantesExistentes > 0) {
      throw new CustomError(
        'Este producto ya tiene variantes generadas. Elimínalas primero si querés regenerarlas.',
        409
      );
    }

    const variantesCreadas = await this.prisma.$transaction(
      (tx) => generarVariantesEnTransaccion(tx, producto, opcionesDisponibles),
      { timeout: 20000 }
    );

    console.log(
      `[generarVariantes] Total: ${Date.now() - start}ms (${variantesCreadas.length} variantes)`
    );

    return {
      message: `${variantesCreadas.length} variantes generadas correctamente`,
      variantes: variantesCreadas,
    };
  }

  public async actualizarStockBulk(
    productoId: number,
    data: ActualizarStockVariantesDTO
  ) {
    const { variantes } = data;

    const variantesIds = variantes.map((v) => v.id);
    const variantesExistentes = await this.prisma.productoVariante.findMany({
      where: {
        id: { in: variantesIds },
        productoId,
      },
    });

    if (variantesExistentes.length !== variantes.length) {
      throw new CustomError('Algunas variantes no pertenecen al producto', 400);
    }
    // Validar que el stock físico no sea negativo
    if (variantes.some(v => v.stockFisico !== null && v.stockFisico < 0)) {
      throw new CustomError('El stock físico no puede ser negativo.', 400);
    }

    if (variantes.length > 0) {
      const stockFragments = variantes
        .filter((v) => v.stockFisico !== undefined)
        .map((v) => Prisma.sql`WHEN ${v.id} THEN ${v.stockFisico}`);

      const query = Prisma.sql`
        UPDATE ProductoVariante
        SET stockFisico = CASE id ${Prisma.join(stockFragments, ' ')} ELSE stockFisico END
        WHERE id IN (${Prisma.join(variantesIds)})
      `;

      try {
        await this.prisma.$transaction(
          (tx) => tx.$executeRaw(query),
          {
            timeout: 20000,
          }
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new CustomError(
            'Ya existe una variante con ese SKU. Verificá que los SKUs no se repitan.',
            409,
            error
          );
        }
        throw error;
      }
    }

    return {
      message: `Stock actualizado para ${variantes.length} variantes`,
    };
  }

  public async actualizarVarianteBulk(
    productoId: number,
    data: ActualizarVarianteBulkDTO
  ) {
    const { variantes } = data;

    const variantesIds = variantes.map((v) => v.id);
    const variantesExistentes = await this.prisma.productoVariante.findMany({
      where: {
        id: { in: variantesIds },
        productoId,
      },
    });

    if (variantesExistentes.length !== variantes.length) {
      throw new CustomError('Algunas variantes no pertenecen al producto', 400);
    }

    for (const v of variantes) {
      if (v.stockFisico !== undefined && v.stockFisico !== null && v.stockFisico < 0) {
        throw new CustomError('El stock físico no puede ser negativo.', 400);
      }
    }

    const clauses: Prisma.Sql[] = [];

    const skuFragments = variantes
      .filter((v) => v.sku !== undefined)
      .map((v) => Prisma.sql`WHEN ${v.id} THEN ${v.sku}`);
    if (skuFragments.length > 0) {
      clauses.push(
        Prisma.sql`sku = CASE id ${Prisma.join(skuFragments, ' ')} ELSE sku END`
      );
    }

    const stockFragments = variantes
      .filter((v) => v.stockFisico !== undefined)
      .map((v) => Prisma.sql`WHEN ${v.id} THEN ${v.stockFisico}`);
    if (stockFragments.length > 0) {
      clauses.push(
        Prisma.sql`stockFisico = CASE id ${Prisma.join(stockFragments, ' ')} ELSE stockFisico END`
      );
    }

    const precioFragments = variantes
      .filter((v) => v.precioExtra !== undefined)
      .map((v) => Prisma.sql`WHEN ${v.id} THEN ${v.precioExtra}`);
    if (precioFragments.length > 0) {
      clauses.push(
        Prisma.sql`precioExtra = CASE id ${Prisma.join(precioFragments, ' ')} ELSE precioExtra END`
      );
    }

    const activoFragments = variantes
      .filter((v) => v.activo !== undefined)
      .map((v) => Prisma.sql`WHEN ${v.id} THEN ${v.activo}`);
    if (activoFragments.length > 0) {
      clauses.push(
        Prisma.sql`activo = CASE id ${Prisma.join(activoFragments, ' ')} ELSE activo END`
      );
    }

    if (clauses.length > 0) {
      const query = Prisma.sql`
        UPDATE ProductoVariante
        SET ${Prisma.join(clauses, ', ')}
        WHERE id IN (${Prisma.join(variantesIds)})
      `;

      try {
        await this.prisma.$transaction(
          (tx) => tx.$executeRaw(query),
          {
            timeout: 20000,
          }
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new CustomError(
            'Ya existe una variante con ese SKU. Verificá que los SKUs no se repitan.',
            409,
            error
          );
        }
        throw error;
      }
    }

    return {
      message: `Se actualizaron exitosamente ${variantes.length} variantes.`,
    };
  }

  public async actualizarVariante(
    varianteId: number,
    data: ActualizarVarianteDTO,
    imagenBuffer?: Buffer
  ) {
    // Validar que el stock físico no sea negativo
    if (data.stockFisico !== null && (data.stockFisico ?? 0) < 0) {
      throw new CustomError('El stock físico no puede ser negativo.', 400);
    }

    // Si hay imagen, subirla a Cloudinary
    let imagen_url: string | undefined = undefined;
    if (imagenBuffer) {
      imagen_url = await this.imagenService.uploadToCloudinary(
        imagenBuffer,
        'mercado_sinergico/variantes'
      );
    }

    const dataToUpdate: Prisma.ProductoVarianteUpdateInput = {};
    if (data.sku !== undefined) dataToUpdate.sku = data.sku;
    if (data.stockFisico !== undefined) dataToUpdate.stockFisico = data.stockFisico;
    if (data.precioExtra !== undefined) dataToUpdate.precioExtra = data.precioExtra;
    if (data.activo !== undefined) dataToUpdate.activo = data.activo;
    if (imagen_url !== undefined) dataToUpdate.imagen_url = imagen_url;

    try {
      return await this.prisma.productoVariante.update({
        where: { id: varianteId },
        data: dataToUpdate,
        include: {
          opciones: {
            include: {
              caracteristica: true,
              opcion: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new CustomError('Variante no encontrada', 404);
      }
      throw error;
    }
  }

  public async eliminarVariante(varianteId: number) {
    const pedidosConVariante = await this.prisma.pedidoDetalle.count({
      where: { varianteId },
    });

    if (pedidosConVariante > 0) {
      throw new CustomError(
        'No se puede eliminar la variante porque tiene pedidos asociados',
        400
      );
    }

    return this.prisma.productoVariante.delete({
      where: { id: varianteId },
    });
  }

  public async getStockGlobal(productoId: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id_producto: productoId },
      include: {
        variantes: {
          include: {
            opciones: {
              include: {
                caracteristica: true,
                opcion: true,
              },
            },
            disponibilidadEnPaquetes: {
              include: {
                paquetePublicado: {
                  select: {
                    id_paquete_publicado: true,
                    paqueteBase: { select: { nombre: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }

    const stockTotal = producto.variantes.reduce((sum, v) => {
      return sum + (v.stockFisico || 0);
    }, 0);

    const distribucion = producto.variantes.map((v) => ({
      variante: v.opciones.map((vo) => vo.opcion.nombre).join(' - '),
      stockFisico: v.stockFisico,
      paquetesActivos: v.disponibilidadEnPaquetes
        .filter((d) => d.activo)
        .map((d) => ({
          id: d.paquetePublicado.id_paquete_publicado,
          nombre: d.paquetePublicado.paqueteBase.nombre,
        })),
    }));

    return {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      marca_id: producto.marca_id,
      categoria_id: producto.categoria_id,
      stockTotal: stockTotal,
      distribucion,
    };
  }
}
