import { prisma } from '../prisma/client';
import { CustomError } from '../errors/custom.error';

export class PedidoService {
  private prisma = prisma;

  public async crearPedido(usuarioId: number) {
    return this.prisma.$transaction(async (tx) => {
      const carrito = await tx.carrito.findUnique({
        where: { usuarioId },
        include: {
          paquetes: true,
          productos: true,
        },
      });

      if (!carrito) {
        throw new CustomError('El usuario no tiene carrito o no existe', 404);
      }

      const pedido = await tx.pedido.create({
        data: {
          usuarioId,
          fecha: new Date(),
          estadoId: 1,
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

      await tx.carritoProducto.deleteMany({
        where: { carritoId: carrito.id_carrito },
      });

      await tx.carritoPaquetePublicado.deleteMany({
        where: { carritoId: carrito.id_carrito },
      });

      return pedido;
    });
  }

  public async getAll() {
    return this.prisma.pedido.findMany({
      include: {
        usuario: true,
        pedidosPaquetePublicado: {
          include: { paquetePublicado: { include: { paqueteBase: true } } },
        },
      },
    });
  }

  public async getById(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: {
        usuario: true,
        pedidosPaquetePublicado: {
          include: { paquetePublicado: { include: { paqueteBase: true } } },
        },
      },
    });

    if (!pedido) {
      throw new CustomError(`Pedido con id=${id} no encontrado`, 404);
    }

    return pedido;
  }
}
