import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { TipoPaquete } from '@prisma/client';
import { GenerarVariantesDTO } from '../dtos/variante/generarVariantes.dto.js';
import { ActualizarStockVariantesDTO } from '../dtos/variante/actualizarStockVariantes.dto.js';
import { ActualizarVarianteDTO } from '../dtos/variante/actualizarVariante.dto.js';
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
        tipo: productoWithTipo.tipo ?? TipoPaquete.POR_DEFINIR,
        plantilla: producto.plantilla,
      },
      variantes: variantes.map((v) => ({
        id: v.id,
        sku: v.sku,
        stockFisico: v.stockFisico,
        precioExtra: v.precioExtra,
        activo: v.activo,
        imagen_url: v.imagen_url ?? null,
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
    const { productoId, opcionesDisponibles } = data;

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

    if (!producto.plantilla) {
      throw new CustomError('El producto no tiene plantilla asignada', 400);
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

    let stockInicial: number | null;
    type ProductoWithTipo = typeof producto & { tipo: TipoPaquete | null };
    const productoWithTipo = producto as ProductoWithTipo;
    if (productoWithTipo.tipo === TipoPaquete.ENERGETICO) {
      stockInicial = 0;
    } else {
      stockInicial = null;
    }

    const variantesCreadas = [];
    for (const combinacion of combinaciones) {
      const opcionesNombres = await Promise.all(
        Object.values(combinacion).map((opcionId) =>
          this.prisma.opcion.findUnique({ where: { id: opcionId } })
        )
      );

      const sku = `${producto.nombre
        .substring(0, 10)
        .toUpperCase()
        .replace(/\s+/g, '-')}-${opcionesNombres
          .map((o) => o?.nombre.substring(0, 4).toUpperCase().replace(/\s+/g, ''))
          .join('-')}`;

      const variante = await this.prisma.productoVariante.create({
        data: {
          productoId,
          sku,
          stockFisico: stockInicial,
          precioExtra: 0,
          activo: true,
          opciones: {
            create: Object.entries(combinacion).map(([caracId, opcionId]) => ({
              caracteristicaId: parseInt(caracId),
              opcionId: opcionId as number,
            })),
          },
        },
        include: {
          opciones: {
            include: {
              caracteristica: true,
              opcion: true,
            },
          },
        },
      });

      variantesCreadas.push(variante);
    }

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

    await this.prisma.$transaction(
      variantes.map((v) =>
        this.prisma.productoVariante.update({
          where: { id: v.id },
          data: { stockFisico: v.stockFisico },
        })
      )
    );

    return {
      message: `Stock actualizado para ${variantes.length} variantes`,
    };
  }

  public async actualizarVariante(
    varianteId: number,
    data: ActualizarVarianteDTO,
    imagenBuffer?: Buffer
  ) {
    const variante = await this.prisma.productoVariante.findUnique({
      where: { id: varianteId },
    });

    if (!variante) {
      throw new CustomError('Variante no encontrada', 404);
    }

    // Si hay imagen, subirla a Cloudinary
    let imagen_url: string | undefined = undefined;
    if (imagenBuffer) {
      imagen_url = await this.imagenService.uploadToCloudinary(
        imagenBuffer,
        'mercado_sinergico/variantes'
      );
    }

    return this.prisma.productoVariante.update({
      where: { id: varianteId },
      data: {
        sku: data.sku,
        stockFisico: data.stockFisico,
        precioExtra: data.precioExtra,
        activo: data.activo,
        ...(imagen_url !== undefined && { imagen_url }),
      },
      include: {
        opciones: {
          include: {
            caracteristica: true,
            opcion: true,
          },
        },
      },
    });
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

    type ProductoWithTipo = typeof producto & { tipo: TipoPaquete | null };
    const productoWithTipo = producto as ProductoWithTipo;

    return {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      marca_id: producto.marca_id,
      categoria_id: producto.categoria_id,
      stockTotal: productoWithTipo.tipo === TipoPaquete.POR_DEFINIR ? null : stockTotal,
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
