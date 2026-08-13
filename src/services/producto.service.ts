import { ProductoDTO } from '../dtos/producto/producto.dto.js';
import { Prisma, Producto, TipoPaquete } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { ProductoItemListaDTO } from '../dtos/producto/productoItemLista.dto.js';
import { ProductoDetalleRespuestaDTO } from '../dtos/producto/productoDetalleRespuesta.dto.js';

export class ProductoService {
  private prisma = prisma;

  public async getAll(
    name?: string,
    skip?: number,
    take?: number,
    includeArchived = false,
    categorias?: number[],
    marcas?: number[],
    precioMin?: number,
    precioMax?: number,
    zonas?: number[]
  ) {
    const where: Prisma.ProductoWhereInput = {};
    if (name) {
      where.nombre = { contains: name };
    }
    if (!includeArchived) {
      where.archivado = false;
    }
    if (categorias && categorias.length > 0) {
      where.categoria_id = { in: categorias };
    }
    if (marcas && marcas.length > 0) {
      where.marca_id = { in: marcas };
    }
    if (precioMin !== undefined || precioMax !== undefined) {
      where.precio = {};
      if (precioMin !== undefined) {
        where.precio.gte = precioMin;
      }
      if (precioMax !== undefined) {
        where.precio.lte = precioMax;
      }
    }
    if (!includeArchived) {
      where.paquetes = {
        some: {
          paqueteBase: {
            publicados: {
              some: {
                estadoId: 1, // ESTADO_PAQUETE.ACTIVO
                archivado: false,
                fecha_fin: { gte: new Date() },
                ...(zonas && zonas.length > 0 && { zonaId: { in: zonas } })
              }
            }
          }
        }
      };
    }

    const productos = await this.prisma.producto.findMany({
      where,
      include: {
        categoria: true,
        marca: true,
        imagenes: true,
        plantilla: true,
        variantes: true,
      },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      orderBy: { id_producto: 'asc' },
    });

    return productos.map((p) => new ProductoItemListaDTO(p));
  }

  public async countAll(
    name?: string,
    includeArchived = false,
    categorias?: number[],
    marcas?: number[],
    precioMin?: number,
    precioMax?: number,
    zonas?: number[]
  ): Promise<number> {
    const where: Prisma.ProductoWhereInput = {};
    if (name) {
      where.nombre = { contains: name };
    }
    if (!includeArchived) {
      where.archivado = false;
    }
    if (categorias && categorias.length > 0) {
      where.categoria_id = { in: categorias };
    }
    if (marcas && marcas.length > 0) {
      where.marca_id = { in: marcas };
    }
    if (precioMin !== undefined || precioMax !== undefined) {
      where.precio = {};
      if (precioMin !== undefined) {
        where.precio.gte = precioMin;
      }
      if (precioMax !== undefined) {
        where.precio.lte = precioMax;
      }
    }
    if (!includeArchived) {
      where.paquetes = {
        some: {
          paqueteBase: {
            publicados: {
              some: {
                estadoId: 1, // ESTADO_PAQUETE.ACTIVO
                archivado: false,
                fecha_fin: { gte: new Date() },
                ...(zonas && zonas.length > 0 && { zonaId: { in: zonas } })
              }
            }
          }
        }
      };
    }

    return this.prisma.producto.count({ where });
  }

  public async getById(id: number) {
    const paquetesConProducto = await this.prisma.paquetePublicado.findMany({
      where: { paqueteBase: { productos: { some: { productoId: id } } } },
    });

    const producto = await this.prisma.producto.findUnique({
      where: { id_producto: id },
      include: {
        categoria: true,
        marca: true,
        imagenes: true,
        plantilla: {
          include: {
            caracteristicas: {
              include: {
                opciones: true,
              },
            },
          },
        },
        variantes: {
          include: {
            opciones: {
              include: {
                caracteristica: true,
                opcion: true,
              },
            },
          },
        },
      },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }

    return new ProductoDetalleRespuestaDTO({
      producto,
      cantPaquetes: paquetesConProducto.length,
    });
  }

  public async create(producto: ProductoDTO): Promise<Producto> {
    const {
      categoria_id,
      marca_id,
      imagenes,
      plantillaId,
      tipo,
      opcionesDisponibles,
      ...rest
    } = producto;

    if (plantillaId && rest.stock !== undefined && rest.stock !== null) {
      throw new CustomError(
        'Los productos con plantilla no pueden tener stock directo. El stock se maneja por variantes.',
        400
      );
    }

    if (!plantillaId && tipo === TipoPaquete.ENERGICO && !rest.stock) {
      throw new CustomError(
        'Los productos enérgicos sin variantes deben tener stock definido.',
        400
      );
    }

    const categoria = await this.prisma.categoria.findUnique({
      where: { id_categoria: categoria_id },
    });

    if (!categoria) {
      throw new CustomError('Categoria no encontrada', 404);
    }

    const nuevoProducto = await this.prisma.$transaction(
      async (tx) => {
        const productoCreado = await tx.producto.create({
          data: {
            ...rest,
            tipo: tipo || TipoPaquete.SINERGICO,
            categoria: { connect: { id_categoria: categoria_id } },
            marca: { connect: { id_marca: marca_id } },
            plantilla: plantillaId ? { connect: { id: plantillaId } } : undefined,
          },
        });

        if (imagenes && imagenes.length > 0) {
          await tx.productoImagen.createMany({
            data: imagenes.map((url) => ({
              url,
              productoId: productoCreado.id_producto,
            })),
          });
        }

        const productoFinal = await tx.producto.findUnique({
          where: { id_producto: productoCreado.id_producto },
          include: {
            imagenes: true,
            categoria: true,
            marca: true,
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

        if (!productoFinal) {
          throw new CustomError('Error al recuperar el producto recién creado', 500);
        }

        return productoFinal;
      },
      {
        timeout: 20000,
      }
    );

    if (plantillaId && opcionesDisponibles) {
      await this.generarVariantesAutomaticas(
        nuevoProducto.id_producto,
        opcionesDisponibles,
        tipo
      );
    }

    return nuevoProducto;
  }

  public async update(id: number, producto: ProductoDTO) {
    const { categoria_id, marca_id, imagenes, plantillaId, tipo, ...rest } =
      producto;

    if (plantillaId && rest.stock !== undefined && rest.stock !== null) {
      throw new CustomError(
        'Los productos con plantilla no pueden tener stock directo.',
        400
      );
    }

    const data: Prisma.ProductoUpdateInput = {
      ...rest,
      tipo: tipo || undefined,
      categoria: categoria_id
        ? { connect: { id_categoria: categoria_id } }
        : undefined,
      marca: marca_id ? { connect: { id_marca: marca_id } } : undefined,
      plantilla: plantillaId === null 
        ? { disconnect: true } 
        : (plantillaId ? { connect: { id: plantillaId } } : undefined),
    };

    if (imagenes) {
      data.imagenes = {
        deleteMany: {},
        create: imagenes.map((url) => ({ url })),
      };
    }

    return this.prisma.producto.update({
      where: { id_producto: id },
      data,
      include: {
        imagenes: true,
        variantes: {
          include: {
            opciones: {
              include: {
                caracteristica: true,
                opcion: true,
              },
            },
          },
        },
      },
    });
  }

  public async delete(id: number) {
    return this.archivar(id, true);
  }

  public async archivar(id: number, archivado: boolean) {
    const producto = await this.prisma.producto.findUnique({
      where: { id_producto: id },
    });
    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }
    return this.prisma.producto.update({
      where: { id_producto: id },
      data: { archivado },
    });
  }

  public async duplicarProducto(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id_producto: id },
      include: {
        imagenes: true,
        variantes: {
          include: {
            opciones: true,
          },
        },
      },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }

    return this.prisma.$transaction(async (tx) => {
      const nuevoProducto = await tx.producto.create({
        data: {
          nombre: `${producto.nombre} (Copia)`,
          descripcion: producto.descripcion,
          precio: producto.precio,
          peso: producto.peso,
          altura: producto.altura,
          ancho: producto.ancho,
          profundidad: producto.profundidad,
          stock: producto.stock,
          tipo: producto.tipo,
          imagen_url: producto.imagen_url,
          plantillaId: producto.plantillaId,
          categoria_id: producto.categoria_id,
          marca_id: producto.marca_id,
        },
      });

      if (producto.imagenes.length > 0) {
        await tx.productoImagen.createMany({
          data: producto.imagenes.map((img) => ({
            url: img.url,
            productoId: nuevoProducto.id_producto,
          })),
        });
      }

      if (producto.variantes.length > 0) {
        for (const variante of producto.variantes) {
          const nuevaVariante = await tx.productoVariante.create({
            data: {
              productoId: nuevoProducto.id_producto,
              sku: variante.sku ? `${variante.sku}-COPIA` : null,
              stockFisico: variante.stockFisico,
              precioExtra: variante.precioExtra,
              activo: variante.activo,
            },
          });

          if (variante.opciones.length > 0) {
            await tx.productoVarianteOpcion.createMany({
              data: variante.opciones.map((vo) => ({
                varianteId: nuevaVariante.id,
                caracteristicaId: vo.caracteristicaId,
                opcionId: vo.opcionId,
              })),
            });
          }
        }
      }

      return tx.producto.findUnique({
        where: { id_producto: nuevoProducto.id_producto },
        include: {
          imagenes: true,
          variantes: {
            include: {
              opciones: {
                include: {
                  caracteristica: true,
                  opcion: true,
                },
              },
            },
          },
        },
      });
    });
  }



  private async generarVariantesAutomaticas(
    productoId: number,
    opcionesDisponibles: Record<string, number[]>,
    tipo?: TipoPaquete
  ) {
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

    if (!producto || !producto.plantilla) {
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

    if (combinaciones.length === 0) {
      return;
    }

    const nombreLimpio = producto.nombre
      .substring(0, 10)
      .toUpperCase()
      .replace(/\s+/g, '-');

    const stockInicial = tipo === TipoPaquete.ENERGICO ? 0 : null;

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

    await this.prisma.$transaction(
      async (tx) => {
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
      },
      {
        timeout: 20000,
      }
    );
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
