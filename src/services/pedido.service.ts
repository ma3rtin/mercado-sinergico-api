import { prisma } from "../prisma/client";
import { CustomError } from "../errors/custom.error";
import { SumarseDTO } from "../dtos/pedido/sumarse.dto";

export class PedidoService {
  private prisma = prisma;

  public async crearPedido(
    usuarioId: number,
    paqueteId: number,
    productoAComprar: SumarseDTO
  ) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: paqueteId },
      include: {
        paqueteBase: {
          include: {
            productos: {
              include: { producto: true },
            },
          },
        },
        estado: true,
      },
    });

    if (!paquete) {
      throw new CustomError("Paquete no encontrado", 404);
    }

    if (paquete.estado.nombre !== "Activo") {
      throw new CustomError("El paquete no está activo", 400);
    }

    const productoEnPaquete = paquete.paqueteBase.productos.find(
      (p) => p.productoId === productoAComprar.productoId
    );

    if (!productoEnPaquete) {
      throw new CustomError("El producto no pertenece a este paquete", 400);
    }

    const producto = productoEnPaquete.producto;

    if (producto.stock && producto.stock < productoAComprar.cantidad) {
      throw new CustomError("Stock insuficiente", 400);
    }

    // aplicar descuento provisorio
    const descuento = paquete.descuento || 0;
    const precioConDescuento = producto.precio * (1 - descuento / 100);
    const subtotal = precioConDescuento * productoAComprar.cantidad;

    let pedido = await this.prisma.pedido.findFirst({
      where: {
        usuarioId: usuarioId,
        paquetePublicadoId: paqueteId,
        estadoId: 1,
      },
      include: {
        detalles: true,
      },
    });

    if (!pedido) {
      pedido = await this.prisma.pedido.create({
        data: {
          usuarioId: usuarioId,
          paquetePublicadoId: paqueteId,
          estadoId: 1,
          monto_total: subtotal,
          descuento_aplicado: descuento,
          detalles: {
            create: {
              productoId: productoAComprar.productoId,
              cantidad: productoAComprar.cantidad,
              precio_unitario: precioConDescuento,
              subtotal: subtotal,
            },
          },
        },
        include: {
          detalles: {
            include: { producto: true },
          },
          paquetePublicado: {
            include: { paqueteBase: true },
          },
        },
      });
    } else {
      const detalleExistente = pedido.detalles.find(
        (d) => d.productoId === productoAComprar.productoId
      );

      if (detalleExistente) {
        const nuevaCantidad =
          detalleExistente.cantidad + productoAComprar.cantidad;
        const nuevoSubtotal = precioConDescuento * nuevaCantidad;

        await this.prisma.pedidoDetalle.update({
          where: { id: detalleExistente.id },
          data: {
            cantidad: nuevaCantidad,
            subtotal: nuevoSubtotal,
          },
        });
      } else {
        await this.prisma.pedidoDetalle.create({
          data: {
            pedidoId: pedido.id_pedido,
            productoId: productoAComprar.productoId,
            cantidad: productoAComprar.cantidad,
            precio_unitario: precioConDescuento,
            subtotal: subtotal,
          },
        });
      }

      const nuevoMontoTotal = await this.prisma.pedidoDetalle.aggregate({
        where: { pedidoId: pedido.id_pedido },
        _sum: { subtotal: true },
      });

      pedido = await this.prisma.pedido.update({
        where: { id_pedido: pedido.id_pedido },
        data: {
          monto_total: nuevoMontoTotal._sum.subtotal || 0,
        },
        include: {
          detalles: {
            include: { producto: true },
          },
          paquetePublicado: {
            include: { paqueteBase: true },
          },
        },
      });
    }

    await this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: paqueteId },
      data: {
        cant_productos_reservados: {
          increment: productoAComprar.cantidad,
        },
      },
    });

    // si hacemos que pague al sumarse tenemos que actualizar el stock, sino se maneja cuando se pague
    // if (producto.stock) {
    //   await this.prisma.producto.update({
    //     where: { id_producto: productoAComprar.productoId },
    //     data: {
    //       stock: {
    //         decrement: productoAComprar.cantidad,
    //       },
    //     },
    //   });
    // }

    return pedido;
  }
  public async getAll(usuarioId: number) {
    const pedidos = await this.prisma.pedido.findMany({
      where: { usuarioId: usuarioId },
      include: {
        detalles: {
          include: {
            producto: {
              include: {
                marca: true,
                imagenes: true,
              },
            },
          },
        },
        paquetePublicado: {
          include: {
            paqueteBase: {
              include: {
                marca: true,
                categoria: true,
              },
            },
            zona: true,
            estado: true,
          },
        },
        estado: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return pedidos;
  }

  public async getById(pedidoId: number, usuarioId: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: {
        id_pedido: pedidoId,
      },
      include: {
        detalles: {
          include: {
            producto: {
              include: {
                marca: true,
                imagenes: true,
                categoria: true,
              },
            },
          },
        },
        paquetePublicado: {
          include: {
            paqueteBase: {
              include: {
                marca: true,
                categoria: true,
                productos: {
                  include: {
                    producto: true,
                  },
                },
              },
            },
            zona: true,
            estado: true,
          },
        },
        estado: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            imagen_url: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new CustomError("Pedido no encontrado", 404);
    }

    if (pedido.usuarioId !== usuarioId) {
      throw new CustomError("No tienes permiso para ver este pedido", 403);
    }

    return pedido;
  }

  public async bajarse(userId: number, paqueteId: number) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        usuarioId: userId,
        paquetePublicadoId: paqueteId,
        estadoId: 1,
      },
      include: {
        detalles: true,
      },
    });

    if (!pedido) {
      throw new CustomError(
        "No tenés un pedido pendiente en este paquete",
        404
      );
    }

    if (pedido.estadoId > 2) {
      throw new CustomError("Este pedido ya no se puede cancelar", 400);
    }

    const resultado = await this.prisma.$transaction(async (prisma) => {
      const totalProductosReservados = pedido.detalles.reduce(
        (sum, detalle) => sum + detalle.cantidad,
        0
      );

      await prisma.paquetePublicado.update({
        where: { id_paquete_publicado: paqueteId },
        data: {
          cant_productos_reservados: {
            decrement: totalProductosReservados,
          },
        },
      });

      await prisma.pedidoDetalle.deleteMany({
        where: { pedidoId: pedido.id_pedido },
      });

      const pedidoEliminado = await prisma.pedido.delete({
        where: { id_pedido: pedido.id_pedido },
      });

      return pedidoEliminado;
    });

    return {
      message: "Baja de pedido exitosa",
      pedidoEliminado: resultado,
    };
  }
}
