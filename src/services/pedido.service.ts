import { PrismaClient } from "../generated/prisma";

export class PedidoService {
  private prisma = new PrismaClient();

  public async crearPedido(usuarioId: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const carrito = await tx.carrito.findUnique({
          where: { usuarioId },
          include: {
            paquetes: true, // CarritoPaqueteBase[]
            productos: true, // CarritoProducto[]
          },
        });

        if (!carrito) {
          throw new Error("El usuario no tiene carrito o no existe");
        }

        const pedido = await tx.pedido.create({
          data: {
            usuarioId,
            fecha: new Date(),
            estadoId: 1, // estado inicial
          },
        });

        for (const cp of carrito.paquetes) {
          const paquetePublicado = await tx.paquetePublicado.findFirst({
            where: { paqueteBaseId: cp.paquetePublicadoId },
          });

          if (paquetePublicado) {
            await tx.pedidoPaquetePublicado.create({
              data: {
                pedidoId: pedido.id_pedido,
                paquetePublicadoId: paquetePublicado.id_paquete_publicado,
              },
            });
          }
        }
        await tx.carritoProducto.deleteMany({ where: { carritoId: carrito.id_carrito } });
        await tx.carritoPaquetePublicado.deleteMany({ where: { carritoId: carrito.id_carrito } });

        return pedido;
      });
    } catch (error: any) {
      throw new Error(`Error al crear el pedido: ${error.message}`);
    }
  }

  public async getAll() {
    try {
      return await this.prisma.pedido.findMany({
        include: {
          usuario: true,
          pedidosPaquetePublicado: {
            include: { paquetePublicado: { include: { paqueteBase: true } } },
          },
        },
      });
    } catch (error: any) {
      throw new Error(`Error al obtener pedidos: ${error.message}`);
    }
  }

  public async getById(id: number) {
    try {
      return await this.prisma.pedido.findUnique({
        where: { id_pedido: id },
        include: {
          usuario: true,
          pedidosPaquetePublicado: {
            include: { paquetePublicado: { include: { paqueteBase: true } } },
          },
        },
      });
    } catch (error: any) {
      throw new Error(`Error al obtener pedido con id=${id}: ${error.message}`);
    }
  }
}
