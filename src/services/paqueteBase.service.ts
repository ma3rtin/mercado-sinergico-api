import { PaqueteBaseDTO, TipoPaquete } from '../dtos/paquete/paqueteBase.dto.js';
import { prisma } from '../prisma/client.js';
import { TX_OPTIONS } from '../prisma/transaccion.js';
import { CustomError } from '../errors/custom.error.js';
import { Prisma } from '@prisma/client';

export class PaqueteBaseService {
  private prisma = prisma;

  /**
   * Ejecuta una transacción interactiva con TX_OPTIONS y logging de
   * diagnóstico: mide el tiempo hasta la falla y distingue errores de Prisma
   * (ej. P2028 "unable to start a transaction") de errores de negocio.
   */
  private async ejecutarTransaccion<T>(
    nombre: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    const inicio = Date.now();
    try {
      return await this.prisma.$transaction(fn, TX_OPTIONS);
    } catch (error) {
      const elapsedMs = Date.now() - inicio;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error(
          `[PaqueteBaseService] Transaccion '${nombre}' fallo tras ${elapsedMs}ms | code=${error.code} | message=${error.message} | meta=${JSON.stringify(error.meta ?? {})}`
        );
      } else if (!(error instanceof CustomError)) {
        console.error(
          `[PaqueteBaseService] Transaccion '${nombre}' fallo tras ${elapsedMs}ms con error inesperado:`,
          error
        );
      }
      throw error;
    }
  }

  public async getAll(includeArchived = false) {
    const where: Prisma.PaqueteBaseWhereInput = {};
    if (!includeArchived) {
      where.archivado = false;
    }

    return this.prisma.paqueteBase.findMany({
      where,
      include: {
        productos: {
          include: { producto: true },
        },
      },
    });
  }

  public async getById(id: number) {
    const paquete = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: id },
      include: {
        productos: {
          include: { producto: true },
        },
      },
    });

    if (!paquete) {
      throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
    }

    return paquete;
  }

  public async create(data: PaqueteBaseDTO) {
    return this.ejecutarTransaccion('create', async (tx: Prisma.TransactionClient) => {
      const categoria = await tx.categoria.findUnique({
        where: { id_categoria: data.categoria_id },
      });

      if (!categoria) {
        throw new CustomError('La categoría no existe', 400);
      }

      // Validar existencia de productos y que no estén archivados
      if (data.productos?.length) {
        const productosExistentes = await tx.producto.findMany({
          where: {
            id_producto: { in: data.productos },
          },
          select: { id_producto: true, nombre: true, archivado: true },
        });

        if (productosExistentes.length !== data.productos.length) {
          throw new CustomError(
            'Uno o más productos seleccionados no existen.',
            400
          );
        }

        const productosArchivados = productosExistentes.filter((p) => p.archivado);
        if (productosArchivados.length > 0) {
          const nombres = productosArchivados.map((p) => p.nombre).join(', ');
          throw new CustomError(
            `No se pueden agregar productos archivados a un paquete base: ${nombres}`,
            400
          );
        }
      }

      // Validar tipo de paquete base y composición de productos
      if (data.tipo === 'ENERGICO' && data.productos?.length) {
        const productosIncompatibles = await tx.producto.findMany({
          where: {
            id_producto: { in: data.productos },
            OR: [
              { tipo: { not: 'ENERGICO' } },
              { tipo: null }
            ]
          },
          select: { nombre: true }
        });

        if (productosIncompatibles.length > 0) {
          const nombres = productosIncompatibles.map(p => p.nombre).join(', ');
          throw new CustomError(
            `Un paquete de tipo ENÉRGICO solo puede contener productos de tipo ENÉRGICO. Los siguientes productos no son válidos: ${nombres}`,
            400
          );
        }
      }

      if (data.tipo === 'SINERGICO' && data.productos?.length) {
        const productosIncompatibles = await tx.producto.findMany({
          where: {
            id_producto: { in: data.productos },
            tipo: 'ENERGICO',
          },
          select: { nombre: true }
        });

        if (productosIncompatibles.length > 0) {
          const nombres = productosIncompatibles.map(p => p.nombre).join(', ');
          throw new CustomError(
            `Un paquete de tipo SINÉRGICO solo puede contener productos de tipo SINÉRGICO. Los siguientes productos no son válidos: ${nombres}`,
            400
          );
        }
      }

      const paqueteCreado = await tx.paqueteBase.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          imagen_url: data.imagen_url,
          tipo: data.tipo || TipoPaquete.SINERGICO,
          categoria: {
            connect: { id_categoria: data.categoria_id },
          },
          ...(data.marcaId && {
            marca: {
              connect: { id_marca: data.marcaId },
            },
          }),
        },
      });

      if (data.productos?.length) {
        await tx.paqueteBaseProducto.createMany({
          data: data.productos.map((productoId) => ({
            productoId,
            paqueteBaseId: paqueteCreado.id_paquete_base,
          })),
        });
      }

      return paqueteCreado;
    });
  }
  public async update(id: number, data: PaqueteBaseDTO) {
    if (data.categoria_id) {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id_categoria: data.categoria_id },
      });

      if (!categoria) {
        throw new CustomError('La categoría no existe', 400);
      }
    }

    // Validar tipo de paquete base y composición de productos actuales
    if (data.tipo === 'ENERGICO') {
      const productosVinculados = await this.prisma.paqueteBaseProducto.findMany({
        where: { paqueteBaseId: id },
        select: { productoId: true }
      });
      const idsProductos = productosVinculados.map(pv => pv.productoId);

      if (idsProductos.length > 0) {
        const productosIncompatibles = await this.prisma.producto.findMany({
          where: {
            id_producto: { in: idsProductos },
            OR: [
              { tipo: { not: 'ENERGICO' } },
              { tipo: null }
            ]
          },
          select: { nombre: true }
        });

        if (productosIncompatibles.length > 0) {
          const nombres = productosIncompatibles.map(p => p.nombre).join(', ');
          throw new CustomError(
            `No se puede cambiar el tipo a ENÉRGICO: el paquete contiene productos incompatibles de tipo SINÉRGICO: ${nombres}`,
            400
          );
        }
      }
    }

    if (data.tipo === 'SINERGICO') {
      const productosVinculados = await this.prisma.paqueteBaseProducto.findMany({
        where: { paqueteBaseId: id },
        select: { productoId: true }
      });
      const idsProductos = productosVinculados.map(pv => pv.productoId);

      if (idsProductos.length > 0) {
        const productosIncompatibles = await this.prisma.producto.findMany({
          where: {
            id_producto: { in: idsProductos },
            tipo: 'ENERGICO',
          },
          select: { nombre: true }
        });

        if (productosIncompatibles.length > 0) {
          const nombres = productosIncompatibles.map(p => p.nombre).join(', ');
          throw new CustomError(
            `No se puede cambiar el tipo a SINÉRGICO: el paquete contiene productos incompatibles de tipo ENÉRGICO: ${nombres}`,
            400
          );
        }
      }
    }

    try {
      return await this.prisma.paqueteBase.update({
        where: { id_paquete_base: id },
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          imagen_url: data.imagen_url,
          tipo: data.tipo,
          categoria: {
            connect: { id_categoria: data.categoria_id },
          },
          ...(data.marcaId && {
            marca: {
              connect: { id_marca: data.marcaId },
            },
          }),
        },
      });
    } catch {
      throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
    }
  }

  public async delete(id: number) {
    return this.archivar(id, true);
  }

  public async archivar(id: number, archivado: boolean) {
    const paquete = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: id },
    });
    if (!paquete) {
      throw new CustomError('Paquete base no encontrado', 404);
    }
    return this.prisma.paqueteBase.update({
      where: { id_paquete_base: id },
      data: { archivado },
    });
  }

  // Endpoi
  public async agregarProductos(params: { paqueteBaseId: number; productosId: number[] }) {
    return this.sincronizarProductos(params.paqueteBaseId, params.productosId);
  }
  /**
   * Reemplaza la lista completa de productos de un paquete base.
   * Elimina todas las asociaciones existentes y crea las nuevas en una sola transacción.
   * Permite productosId vacío para dejar el paquete sin productos.
   */
   public async sincronizarProductos(paqueteBaseId: number, productosId: number[]) {
    if (productosId.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new CustomError('Los productosId deben ser enteros positivos', 400);
    }

    if (new Set(productosId).size !== productosId.length) {
      throw new CustomError('La lista de productos no puede contener duplicados', 400);
    }

    const paquete = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: paqueteBaseId },
    });

    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    // Validar existencia de productos y que no estén archivados
    if (productosId.length > 0) {
      const productosExistentes = await this.prisma.producto.findMany({
        where: {
          id_producto: { in: productosId },
        },
        select: { id_producto: true, nombre: true, archivado: true },
      });

      if (productosExistentes.length !== productosId.length) {
        throw new CustomError(
          'Uno o más productos seleccionados no existen.',
          400
        );
      }

      const productosArchivados = productosExistentes.filter((p) => p.archivado);
      if (productosArchivados.length > 0) {
        const nombres = productosArchivados.map((p) => p.nombre).join(', ');
        throw new CustomError(
          `No se pueden agregar productos archivados a un paquete base: ${nombres}`,
          400
        );
      }
    }

    if (paquete.tipo === 'ENERGICO' && productosId.length > 0) {
      const incompatibles = await this.prisma.producto.findMany({
        where: {
          id_producto: { in: productosId },
          OR: [{ tipo: { not: 'ENERGICO' } }, { tipo: null }],
        },
        select: { nombre: true },
      });

      if (incompatibles.length > 0) {
        const nombres = incompatibles.map(p => p.nombre).join(', ');
        throw new CustomError(
          `Un paquete ENÉRGICO solo puede contener productos ENÉRGICOS. Incompatibles: ${nombres}`,
          400
        );
      }
    }

    if (paquete.tipo === 'SINERGICO' && productosId.length > 0) {
      const incompatibles = await this.prisma.producto.findMany({
        where: {
          id_producto: { in: productosId },
          tipo: 'ENERGICO',
        },
        select: { nombre: true },
      });

      if (incompatibles.length > 0) {
        const nombres = incompatibles.map(p => p.nombre).join(', ');
        throw new CustomError(
          `Un paquete SINÉRGICO solo puede contener productos SINÉRGICOS. Incompatibles: ${nombres}`,
          400
        );
      }
    }

    await this.ejecutarTransaccion('sincronizarProductos', async (tx) => {
      await tx.paqueteBaseProducto.deleteMany({
        where: { paqueteBaseId },
      });

      if (productosId.length > 0) {
        await tx.paqueteBaseProducto.createMany({
          data: productosId.map((productoId) => ({
            paqueteBaseId,
            productoId,
          })),
        });
      }
    });

    const paqueteActualizado = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: paqueteBaseId },
      include: {
        productos: {
          include: { producto: true },
        },
      },
    });

    if (!paqueteActualizado) {
      throw new CustomError('Paquete no encontrado tras sincronizar', 404);
    }

    return paqueteActualizado;
  }

  public async getProductosByPaquete(id: number) {
    const paquete = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: id },
      include: {
        productos: {
          include: {
            producto: {
              include: {
                categoria: true,
                marca: true,
                imagenes: true
              }
            }
          }
        }
      }
    });

    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    return paquete.productos.map(p => p.producto);
  }

  public async duplicar(id: number) {
    return this.ejecutarTransaccion('duplicar', async (tx) => {
      const paqueteOriginal = await tx.paqueteBase.findUnique({
        where: { id_paquete_base: id },
        include: {
          productos: true,
        },
      });

      if (!paqueteOriginal) {
        throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
      }

      const paqueteDuplicado = await tx.paqueteBase.create({
        data: {
          nombre: `${paqueteOriginal.nombre} (Copia)`,
          descripcion: paqueteOriginal.descripcion,
          imagen_url: paqueteOriginal.imagen_url,
          categoria: {
            connect: { id_categoria: paqueteOriginal.categoria_id },
          },
          ...(paqueteOriginal.marcaId && {
            marca: {
              connect: { id_marca: paqueteOriginal.marcaId },
            },
          }),
          tipo: paqueteOriginal.tipo,
        },
      });

      if (paqueteOriginal.productos.length > 0) {
        await tx.paqueteBaseProducto.createMany({
          data: paqueteOriginal.productos.map((p) => ({
            productoId: p.productoId,
            paqueteBaseId: paqueteDuplicado.id_paquete_base,
          })),
        });
      }

      return await tx.paqueteBase.findUnique({
        where: { id_paquete_base: paqueteDuplicado.id_paquete_base },
        include: {
          productos: {
            include: { producto: true },
          },
        },
      });
    });
  }
}
