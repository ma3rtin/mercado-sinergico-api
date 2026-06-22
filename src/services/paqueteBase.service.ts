import { AgregarProductoPaqueteDTO } from '../dtos/producto/agregarProductoPaquete.dto.js';
import { PaqueteBaseDTO, TipoPaquete } from '../dtos/paquete/paqueteBase.dto.js';
import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { Prisma } from '@prisma/client';

export class PaqueteBaseService {
  private prisma = prisma;

  public async getAll() {
    return this.prisma.paqueteBase.findMany({
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
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const categoria = await tx.categoria.findUnique({
        where: { id_categoria: data.categoria_id },
      });

      if (!categoria) {
        throw new CustomError('La categoría no existe', 400);
      }

      // Validar existencia de productos
      if (data.productos?.length) {
        const productosExistentes = await tx.producto.findMany({
          where: {
            id_producto: { in: data.productos },
          },
          select: { id_producto: true },
        });

        if (productosExistentes.length !== data.productos.length) {
          throw new CustomError(
            'Uno o más productos seleccionados no existen.',
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
    try {
      return await this.prisma.paqueteBase.delete({
        where: { id_paquete_base: id },
      });
    } catch {
      throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
    }
  }

  public async agregarProductos(data: AgregarProductoPaqueteDTO) {
    const paqueteEncontrado = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: data.paqueteBaseId },
    });

    if (!paqueteEncontrado) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    // Validar existencia de productos
    if (data.productosId?.length) {
      const productosExistentes = await this.prisma.producto.findMany({
        where: {
          id_producto: { in: data.productosId },
        },
        select: { id_producto: true },
      });

      if (productosExistentes.length !== data.productosId.length) {
        throw new CustomError(
          'Uno o más productos seleccionados no existen.',
          400
        );
      }
    }

    if (paqueteEncontrado.tipo === 'ENERGICO') {
      const productosIncompatibles = await this.prisma.producto.findMany({
        where: {
          id_producto: { in: data.productosId },
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

    if (paqueteEncontrado.tipo === 'SINERGICO') {
      const productosIncompatibles = await this.prisma.producto.findMany({
        where: {
          id_producto: { in: data.productosId },
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

    await this.prisma.paqueteBaseProducto.createMany({
      data: data.productosId.map((id) => ({
        paqueteBaseId: data.paqueteBaseId,
        productoId: id,
      })),
    });

    const paquete = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: data.paqueteBaseId },
      include: {
        productos: {
          include: { producto: true },
        },
      },
    });

    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    return paquete;
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
    return this.prisma.$transaction(async (tx) => {
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
          categoria_id: paqueteOriginal.categoria_id,
          marcaId: paqueteOriginal.marcaId,
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
