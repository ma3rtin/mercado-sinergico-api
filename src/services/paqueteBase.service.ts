import { AgregarProductoPaqueteDTO } from '../dtos/producto/agregarProductoPaquete.dto';
import { PaqueteBaseDTO } from '../dtos/paquete/paqueteBase.dto';
import { prisma } from '../prisma/client';
import { CustomError } from '../errors/custom.error';

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
    return this.prisma.$transaction(async (tx: any) => {
      const categoria = await tx.categoria.findUnique({
        where: { id_categoria: data.categoria_id },
      });

      if (!categoria) {
        throw new CustomError('La categoría no existe', 400);
      }

      const paqueteCreado = await tx.paqueteBase.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          imagen_url: data.imagen_url,
          categoria: {
            connect: { id_categoria: data.categoria_id },
          },
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

    try {
      return await this.prisma.paqueteBase.update({
        where: { id_paquete_base: id },
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          imagen_url: data.imagen_url,
          categoria: {
            connect: { id_categoria: data.categoria_id },
          },
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
}
