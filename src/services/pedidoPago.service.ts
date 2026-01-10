import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { MercadoPagoService } from '../payments/mercadopago/mercadopago.service.js';

export class PedidoPagoService {
  private prisma = prisma;

  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  private validarStockFinal(
    stock: number | null,
    cantidad: number,
    nombre: string
  ) {
    if (stock !== null && stock < cantidad) {
      throw new CustomError(`Stock insuficiente para ${nombre}`, 400);
    }
  }

  public async iniciarPago(pedidoId: number, usuarioId: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: pedidoId },
      include: {
        detalles: {
          include: {
            producto: {
              select: {
                nombre: true,
                stock: true,
                tipo: true,
              },
            },
            variante: {
              select: {
                stockFisico: true,
                opciones: {
                  include: {
                    opcion: {
                      select: {
                        nombre: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        paquetePublicado: {
          select: {
            tipo: true,
            cant_productos: true,
            cant_productos_reservados: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new CustomError('Pedido no encontrado', 404);
    }

    if (pedido.usuarioId !== usuarioId) {
      throw new CustomError('No autorizado', 403);
    }

    if (pedido.estadoId !== 1) {
      throw new CustomError('El pedido no puede pagarse', 400);
    }

    const disponibles =
      (pedido.paquetePublicado.cant_productos || 0) -
      (pedido.paquetePublicado.cant_productos_reservados || 0);

    const solicitados = pedido.detalles.reduce((sum, d) => sum + d.cantidad, 0);

    if (solicitados > disponibles) {
      throw new CustomError(
        `Capacidad insuficiente. Disponibles: ${disponibles}`,
        400
      );
    }

    if (pedido.paquetePublicado.tipo === 'ENERGETICO') {
      for (const detalle of pedido.detalles) {
        let stockAValidar = detalle.producto.stock;
        let nombreCompleto = detalle.producto.nombre;

        if (detalle.varianteId && detalle.variante) {
          stockAValidar = detalle.variante.stockFisico;
          
          const opcionesNombres = detalle.variante.opciones
            .map((vo) => vo.opcion.nombre)
            .join(' - ');
          
          nombreCompleto = `${detalle.producto.nombre} (${opcionesNombres})`;
        }

        this.validarStockFinal(stockAValidar, detalle.cantidad, nombreCompleto);
      }
    }

    const preference = await this.mercadoPagoService.crearPreferencia({
      pedidoId,
      titulo: `Pedido #${pedidoId}`,
      precioTotal: pedido.monto_total,
    });

    return preference;
  }

  public async confirmarPago(paymentId: number) {
    const pago = await this.mercadoPagoService.obtenerPago(paymentId);
    const pedidoId = Number(pago.external_reference);

    if (!pedidoId) return;

    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: pedidoId },
      include: {
        paquetePublicado: {
          select: {
            tipo: true,
          },
        },
        detalles: {
          include: {
            producto: {
              select: {
                tipo: true,
              },
            },
          },
        },
      },
    });

    if (!pedido) {
      throw new CustomError('Pedido no encontrado', 404);
    }

    if (pago.status === 'approved') {
      const totalProductos = pedido.detalles.reduce(
        (sum, d) => sum + d.cantidad,
        0
      );

      await this.prisma.$transaction(async (prisma) => {
        await prisma.paquetePublicado.update({
          where: { id_paquete_publicado: pedido.paquetePublicadoId },
          data: {
            cant_productos_reservados: { increment: totalProductos },
          },
        });

        if (pedido.paquetePublicado.tipo === 'ENERGETICO') {
          for (const detalle of pedido.detalles) {
            if (detalle.varianteId) {
              await prisma.productoVariante.update({
                where: { id: detalle.varianteId },
                data: {
                  stockFisico: { decrement: detalle.cantidad },
                },
              });
            } else {
              await prisma.producto.update({
                where: { id_producto: detalle.productoId },
                data: {
                  stock: { decrement: detalle.cantidad },
                },
              });
            }
          }
        }
        await prisma.pedido.update({
          where: { id_pedido: pedidoId },
          data: { estadoId: 3 },
        });
      });
    }

    if (pago.status === 'rejected') {
      await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: { estadoId: 4 },
      });
    }

    if (pago.status === 'pending') {
      await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: { estadoId: 2 },
      });
    }

    return { pedidoId, status: pago.status };
  }
}