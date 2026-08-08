import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { TipoPaquete, Prisma } from '@prisma/client';
import { GenerarVariantesDTO } from '../dtos/variante/generarVariantes.dto.js';
import { ActualizarStockVariantesDTO } from '../dtos/variante/actualizarStockVariantes.dto.js';
import { ActualizarVarianteDTO } from '../dtos/variante/actualizarVariante.dto.js';
import { ActualizarVarianteBulkDTO } from '../dtos/variante/actualizarVarianteBulk.dto.js';
import { ImagenService } from './imagen.service.js';

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

    const variantesExistentes = await this.prisma.productoVariante.count({
      where: { productoId },
    });
    if (variantesExistentes > 0) {
      throw new CustomError(
        'Este producto ya tiene variantes generadas. Elimínalas primero si querés regenerarlas.',
        409
      );
    }

    const caracteristicasIds = Object.keys(opcionesDisponibles).map(Number);
    const caracteristicasValidas = producto.plantilla.caracteristicas.map(
      (c) => c.id
    );

    for (const caracId of caracteristicasIds) {
      if (!caracteristicasValidas.includes(caracId)) {
        throw new CustomError(
          `La característica ${caracId} no pertenece a la plantilla del producto`,
          400
        );
      }
    }

    const combinaciones = this.generarCombinaciones(opcionesDisponibles);

    if (combinaciones.length > 200) {
      throw new CustomError('No se pueden generar más de 200 variantes a la vez', 400);
    }

    let stockInicial: number | null;
    type ProductoWithTipo = typeof producto & { tipo: TipoPaquete | null };
    const productoWithTipo = producto as ProductoWithTipo;
    if (productoWithTipo.tipo === TipoPaquete.ENERGICO) {
      stockInicial = 0;
    } else {
      stockInicial = null;
    }

    if (combinaciones.length === 0) {
      return {
        message: '0 variantes generadas correctamente',
        variantes: [],
      };
    }

    const nombreLimpio = producto.nombre
      .substring(0, 10)
      .toUpperCase()
      .replace(/\s+/g, '-');

    const variantesCreadas = await this.prisma.$transaction(
      async (tx) => {
        const variantesData = combinaciones.map((combinacion) => {
          const idsOpciones = Object.values(combinacion).join('-');
          const sku = `${nombreLimpio}-${productoId}-${idsOpciones}`;

          return {
            productoId,
            sku,
            stockFisico: stockInicial,
            precioExtra: 0,
            activo: true,
          };
        });

        const skusGenerados = variantesData.map((v) => v.sku);

        try {
          await tx.productoVariante.createMany({ data: variantesData });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            throw new CustomError(
              'Ya existe una variante con ese SKU. Verificá que el producto no tenga variantes previas.',
              409,
              error
            );
          }
          throw error;
        }

        const variantes = await tx.productoVariante.findMany({
          where: {
            productoId,
            sku: { in: skusGenerados },
          },
          orderBy: { id: 'asc' },
        });

        const varianteIdPorSku = new Map(
          variantes.map((v) => [v.sku, v.id])
        );

        const opcionesData = combinaciones.flatMap((combinacion) => {
          const idsOpciones = Object.values(combinacion).join('-');
          const sku = `${nombreLimpio}-${productoId}-${idsOpciones}`;
          const varianteId = varianteIdPorSku.get(sku);

          if (varianteId === undefined) {
            throw new CustomError(
              'Error al recuperar las variantes creadas',
              500
            );
          }

          return Object.entries(combinacion).map(([caracId, opcionId]) => ({
            varianteId,
            caracteristicaId: parseInt(caracId),
            opcionId: opcionId as number,
          }));
        });

        await tx.productoVarianteOpcion.createMany({ data: opcionesData });

        const variantesFinales = await tx.productoVariante.findMany({
          where: {
            id: { in: variantes.map((v) => v.id) },
          },
          orderBy: { id: 'asc' },
          include: {
            opciones: {
              include: { caracteristica: true, opcion: true },
            },
          },
        });

        return variantesFinales;
      },
      {
        timeout: 20000,
      }
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

    await this.prisma.$transaction(
      async (tx) => {
        await Promise.all(
          variantes.map((v) =>
            tx.productoVariante.update({
              where: { id: v.id },
              data: { stockFisico: v.stockFisico },
            })
          )
        );
      },
      {
        timeout: 20000,
      }
    );

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

    await this.prisma.$transaction(
      async (tx) => {
        await Promise.all(
          variantes.map((v) => {
            const dataToUpdate: {
              sku?: string;
              stockFisico?: number | null;
              precioExtra?: number;
              activo?: boolean;
            } = {};
            if (v.sku !== undefined) dataToUpdate.sku = v.sku;
            if (v.stockFisico !== undefined) {
              if (v.stockFisico !== null && v.stockFisico < 0) {
                throw new CustomError('El stock físico no puede ser negativo.', 400);
              }
              dataToUpdate.stockFisico = v.stockFisico;
            }
            if (v.precioExtra !== undefined) dataToUpdate.precioExtra = v.precioExtra;
            if (v.activo !== undefined) dataToUpdate.activo = v.activo;

            return tx.productoVariante.update({
              where: { id: v.id },
              data: dataToUpdate,
            });
          })
        );
      },
      {
        timeout: 20000,
      }
    );

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

  private generarCombinaciones(
    opcionesDisponibles: Record<string, number[]>
  ): Record<string, number>[] {
    const caracteristicas = Object.keys(opcionesDisponibles);
    const valores = Object.values(opcionesDisponibles);

    if (caracteristicas.length === 0) return [];

    const resultado: Record<string, number>[] = [];

    const generarRecursivo = (
      index: number,
      combinacionActual: Record<string, number>
    ) => {
      if (index === caracteristicas.length) {
        resultado.push({ ...combinacionActual });
        return;
      }

      const caracId = caracteristicas[index];
      const opciones = valores[index];

      for (const opcionId of opciones) {
        combinacionActual[caracId] = opcionId;
        generarRecursivo(index + 1, combinacionActual);
      }
    };

    generarRecursivo(0, {});
    return resultado;
  }
}
