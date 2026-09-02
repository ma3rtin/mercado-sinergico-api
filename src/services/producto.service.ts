import { ProductoDTO } from '../dtos/producto/producto.dto.js';
import { Prisma, Producto, TipoPaquete } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { ProductoItemListaDTO } from '../dtos/producto/productoItemLista.dto.js';
import { ProductoDetalleRespuestaDTO } from '../dtos/producto/productoDetalleRespuesta.dto.js';
import { generarVariantesEnTransaccion } from './variante-generacion.helper.js';

type PrismaOrTx = Prisma.TransactionClient | typeof prisma;

const ORDEN_PRODUCTOS: Record<string, Prisma.ProductoOrderByWithRelationInput> = {
  recientes: { createdAt: 'desc' },
  'a-z': { nombre: 'asc' },
  'z-a': { nombre: 'desc' },
  'precio-asc': { precio: 'asc' },
  'precio-desc': { precio: 'desc' },
  'mas-stock': { stock: 'desc' },
};

// El id como desempate deja la paginacion estable: sin el, dos productos con
// el mismo precio pueden repetirse o saltearse entre paginas.
const DESEMPATE: Prisma.ProductoOrderByWithRelationInput = { id_producto: 'asc' };

function construirOrderBy(orden?: string): Prisma.ProductoOrderByWithRelationInput[] {
  const criterio = orden ? ORDEN_PRODUCTOS[orden] : undefined;
  return criterio ? [criterio, DESEMPATE] : [DESEMPATE];
}

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
    zonas?: number[],
    orden?: string
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
    if (!includeArchived && zonas && zonas.length > 0) {
      where.paquetes = {
        some: {
          paqueteBase: {
            publicados: {
              some: {
                estadoId: 1, // ESTADO_PAQUETE.ACTIVO
                archivado: false,
                fecha_fin: { gte: new Date() },
                zonaId: { in: zonas }
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
        // Conteo de paquetes publicados ACTIVOS que contienen este producto.
        // Mismo criterio que el filtro de zonas: estadoId=1, no archivado, en vigencia.
        paquetes: {
          select: {
            paqueteBase: {
              select: {
                id_paquete_base: true,
                _count: {
                  select: {
                    publicados: {
                      where: {
                        estadoId: 1,
                        archivado: false,
                        fecha_fin: { gte: new Date() },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      orderBy: construirOrderBy(orden),
    });

    return productos.map((p) => {
      // Conteo de paquetes publicados ACTIVOS únicos que contienen este producto.
      // Se deduplica por paqueteBase por si el producto figura en más de un
      // PaqueteBaseProducto apuntando a la misma base.
      const basesVistas = new Set<number>();
      const paquetesActivos = (p.paquetes ?? []).reduce((acc, paq) => {
        const base = paq.paqueteBase;
        if (!base || basesVistas.has(base.id_paquete_base)) return acc;
        basesVistas.add(base.id_paquete_base);
        return acc + (base._count.publicados ?? 0);
      }, 0);
      return new ProductoItemListaDTO({ ...p, cantPaquetes: paquetesActivos });
    });
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
    if (!includeArchived && zonas && zonas.length > 0) {
      where.paquetes = {
        some: {
          paqueteBase: {
            publicados: {
              some: {
                estadoId: 1, // ESTADO_PAQUETE.ACTIVO
                archivado: false,
                fecha_fin: { gte: new Date() },
                zonaId: { in: zonas }
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

  /**
   * Indica si alguna ProductoVariante del producto está referenciada por un
   * PedidoDetalle (es decir, si el producto tiene historial de ventas ligado a
   * sus variantes actuales).
   */
  public async productoTieneVariantesConPedidos(
    productoId: number,
    client: PrismaOrTx = this.prisma
  ): Promise<boolean> {
    const pedidosConVariante = await client.pedidoDetalle.count({
      where: {
        variante: {
          productoId,
        },
      },
    });

    return pedidosConVariante > 0;
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

    if (!plantillaId && tipo === TipoPaquete.ENERGICO && (rest.stock === undefined || rest.stock === null)) {
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

    return this.prisma.$transaction(
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

        if (plantillaId && opcionesDisponibles) {
          const productoConPlantilla = await tx.producto.findUnique({
            where: { id_producto: productoCreado.id_producto },
            include: {
              plantilla: { include: { caracteristicas: { include: { opciones: true } } } },
            },
          });

          if (!productoConPlantilla?.plantilla) {
            throw new CustomError('El producto no tiene plantilla asignada', 400);
          }

          await generarVariantesEnTransaccion(tx, productoConPlantilla, opcionesDisponibles);
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
            variantes: {
              include: {
                opciones: { include: { caracteristica: true, opcion: true } },
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
  }

  public async update(id: number, producto: ProductoDTO) {
    const { categoria_id, marca_id, imagenes, plantillaId, tipo, opcionesDisponibles, ...rest } =
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

    return this.prisma.$transaction(
      async (tx) => {
        // SELECT ... FOR UPDATE: toma el lock de la fila ya dentro de la
        // transacción, así un update() concurrente sobre el mismo producto
        // espera a que esta transacción termine en vez de decidir
        // huboCambioPlantilla con un plantillaId que quedó desactualizado.
        const filas = await tx.$queryRaw<{ plantillaId: number | null }[]>`
          SELECT plantillaId FROM Producto WHERE id_producto = ${id} FOR UPDATE
        `;
        const productoActual = filas[0];

        if (!productoActual) {
          throw new CustomError('Producto no encontrado', 404);
        }

        // Cambio de plantilla = el payload trae plantillaId (null para quitarla) y
        // difiere del valor actual en base. plantillaId === undefined → no se tocó,
        // no se compara ni se regenera nada.
        const huboCambioPlantilla =
          plantillaId !== undefined &&
          (plantillaId ?? null) !== (productoActual.plantillaId ?? null);

        if (huboCambioPlantilla) {
          const variantesExistentes = await tx.productoVariante.count({
            where: { productoId: id },
          });

          if (variantesExistentes > 0) {
            const tienePedidos = await this.productoTieneVariantesConPedidos(id, tx);

            if (tienePedidos) {
              throw new CustomError(
                'No se puede cambiar la plantilla: el producto tiene pedidos asociados a sus variantes actuales.',
                409
              );
            }

            // Eliminar las variantes viejas (sus opciones se borran en cascada)
            // para permitir regenerarlas con la nueva plantilla.
            await tx.productoVariante.deleteMany({
              where: { productoId: id },
            });
          }
        }

        const includeRespuesta = {
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
        } as const;

        const productoActualizado = await tx.producto.update({
          where: { id_producto: id },
          data,
          include: includeRespuesta,
        });

        if (!opcionesDisponibles) {
          return productoActualizado;
        }

        // Si hay que generar variantes, el update de arriba ya no las
        // refleja: se necesita un refetch después de generarlas.
        const productoConPlantilla = await tx.producto.findUnique({
          where: { id_producto: id },
          include: {
            plantilla: { include: { caracteristicas: { include: { opciones: true } } } },
          },
        });

        if (!productoConPlantilla?.plantilla) {
          throw new CustomError('El producto no tiene plantilla asignada', 400);
        }

        const variantesActuales = await tx.productoVariante.count({
          where: { productoId: id },
        });

        if (variantesActuales > 0) {
          throw new CustomError(
            'Este producto ya tiene variantes generadas. Elimínalas primero si querés regenerarlas.',
            409
          );
        }

        await generarVariantesEnTransaccion(tx, productoConPlantilla, opcionesDisponibles);

        const productoConVariantesNuevas = await tx.producto.findUnique({
          where: { id_producto: id },
          include: includeRespuesta,
        });

        if (!productoConVariantesNuevas) {
          throw new CustomError('Error al recuperar el producto actualizado', 500);
        }

        return productoConVariantesNuevas;
      },
      {
        timeout: 20000,
      }
    );
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

    try {
      return await this.prisma.$transaction(
        async (tx) => {
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
            // El id del producto nuevo alcanza para hacer único el SKU de la
            // copia, así que no hace falta consultar colisiones ni escalar sufijos.
            const variantesData = producto.variantes.map((variante) => ({
              productoId: nuevoProducto.id_producto,
              sku: variante.sku
                ? `${variante.sku}-COPIA-${nuevoProducto.id_producto}`
                : null,
              stockFisico: variante.stockFisico,
              precioExtra: variante.precioExtra,
              activo: variante.activo,
            }));

            await tx.productoVariante.createMany({ data: variantesData });

            const variantesCreadas = await tx.productoVariante.findMany({
              where: { productoId: nuevoProducto.id_producto },
              orderBy: { id: 'asc' },
            });

            const opcionesData = variantesCreadas.flatMap((nuevaVariante, i) => {
              const original = producto.variantes[i];
              return original.opciones.map((vo) => ({
                varianteId: nuevaVariante.id,
                caracteristicaId: vo.caracteristicaId,
                opcionId: vo.opcionId,
              }));
            });

            if (opcionesData.length > 0) {
              await tx.productoVarianteOpcion.createMany({ data: opcionesData });
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
        },
        {
          timeout: 20000,
        }
      );
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === 'P2002') {
        throw new CustomError(
          'No se puede duplicar: ya existe una variante con ese SKU. Cambiá el SKU de la variante original antes de volver a duplicar.',
          409
        );
      }
      throw error;
    }
  }

}
