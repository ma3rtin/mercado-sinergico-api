import { AgregarProductoPaqueteDTO } from '../dtos/agregarProductoPaquete.dto';
import { PaqueteBaseDTO } from '../dtos/paqueteBase.dto';
import { PrismaClient } from '../generated/prisma';

export class PaqueteBaseService {
  private prisma = new PrismaClient();

  public async getAll() {
    try {
      const paquetes = await this.prisma.paqueteBase.findMany({
        include: {
          productos: {
            include: { producto: true },
          },
        },
      });
      return paquetes;
    } catch (error: any) {
      throw new Error(`Error al obtener paquetes: ${error.message}`);
    }
  }

  public async getById(id: number) {
    try {
      const paquete = await this.prisma.paqueteBase.findUnique({
        where: { id_paquete_base: id },
        include: {
          productos: {
            include: { producto: true },
          },
        },
      });
      return paquete;
    } catch (error: any) {
      throw new Error(
        `Error al obtener paquete con id=${id}: ${error.message}`
      );
    }
  }

  public async create(data: PaqueteBaseDTO) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const categoria = await tx.categoria.findUnique({
          where: { id_categoria: data.categoria_id },
        });

        if (!categoria) {
          throw new Error('La categoría no existe');
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

        if (data.productos && data.productos.length > 0) {
          await tx.paqueteBaseProducto.createMany({
            data: data.productos.map((productoId) => ({
              productoId,
              paqueteBaseId: paqueteCreado.id_paquete_base,
            })),
          });
        }

        return paqueteCreado;
      });
    } catch (error: any) {
      throw new Error(`Error al crear paquete: ${error.message}`);
    }
  }

  public async update(id: number, data: PaqueteBaseDTO) {
    try {
      if (
        data.categoria_id &&
        (await this.prisma.categoria.findUnique({
          where: { id_categoria: data.categoria_id },
        })) === null
      )
        throw new Error('La categoría no existe');
      const paquete = await this.prisma.paqueteBase.update({
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
      return paquete;
    } catch (error: any) {
      throw new Error(
        `Error al modificar paquete con id=${id}: ${error.message}`
      );
    }
  }

  public async delete(id: number) {
    try {
      const paquete = await this.prisma.paqueteBase.delete({
        where: { id_paquete_base: id },
      });
      return paquete;
    } catch (error: any) {
      throw new Error(
        `Error al eliminar paquete con id=${id}: ${error.message}`
      );
    }
  }

  public async agregarProductos(data: AgregarProductoPaqueteDTO) {
    try {
      const { paqueteBaseId, productosId } = data;
      await this.prisma.paqueteBaseProducto.createMany({
        data: productosId.map((id) => ({ paqueteBaseId, productoId: id })),
      });
      const paquete = await this.prisma.paqueteBase.findUnique({
        where: { id_paquete_base: paqueteBaseId },
        include: {
          productos: {
            include: { producto: true },
          },
        },
      });
      return paquete;
    } catch (error: any) {
      throw new Error(
        `Error al obtener agregar productos al paquete: ${error.message}`
      );
    }
  }
}
