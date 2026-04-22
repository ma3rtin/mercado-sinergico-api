import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { MercadoPagoService } from '../payments/mercadopago/mercadopago.service.js';
import { despachadorEventosApp, DespachadorEventos } from '../events/despachadorEventos.js';

import { ESTADO_PEDIDO } from '../constants/estado-pedido.js';
import { ESTADO_PAQUETE } from '../constants/estado-paquete.js';

export class PedidoPagoService {
  private prisma = prisma;

  constructor(private readonly mercadoPagoService: MercadoPagoService) { }

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
            estadoId: true,
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

    if (pedido.estadoId !== ESTADO_PEDIDO.PENDIENTE) {
      throw new CustomError('El pedido no puede pagarse en su estado actual', 400);
    }

    if (pedido.paquetePublicado.estadoId !== ESTADO_PAQUETE.ACTIVO) {
      throw new CustomError('El paquete ya no está activo para pagos', 400);
    }

    const disponibles =
      (pedido.paquetePublicado.cant_productos || 0) -
      (pedido.paquetePublicado.cant_productos_reservados || 0);

    const solicitados = pedido.detalles.reduce((sum: number, d: { cantidad: number }) => sum + d.cantidad, 0);

    if (solicitados > disponibles) {
      throw new CustomError(
        `Capacidad insuficiente. Disponibles: ${disponibles}`,
        400
      );
    }

    if (pedido.paquetePublicado.tipo === 'ENERGICO') {
      for (const detalle of pedido.detalles) {
        let stockAValidar = detalle.producto.stock;
        let nombreCompleto = detalle.producto.nombre;

        if (detalle.varianteId && detalle.variante) {
          stockAValidar = detalle.variante.stockFisico;

          const opcionesNombres = detalle.variante.opciones
            .map((vo: { opcion: { nombre: string } }) => vo.opcion.nombre)
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
        (sum: number, d: { cantidad: number }) => sum + d.cantidad,
        0
      );

      let emitirEvento = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.prisma.$transaction(async (tx: any) => {
        await tx.paquetePublicado.update({
          where: { id_paquete_publicado: pedido.paquetePublicadoId },
          data: {
            cant_productos_reservados: { increment: totalProductos },
          },
        });

        if (pedido.paquetePublicado.tipo === 'ENERGICO') {
          for (const detalle of pedido.detalles) {
            if (detalle.varianteId) {
              await tx.productoVariante.update({
                where: { id: detalle.varianteId },
                data: {
                  stockFisico: { decrement: detalle.cantidad },
                },
              });
            } else {
              await tx.producto.update({
                where: { id_producto: detalle.productoId },
                data: {
                  stock: { decrement: detalle.cantidad },
                },
              });
            }
          }
        }

        // Pedido pasa a Pagado (2)
        await tx.pedido.update({
          where: { id_pedido: pedidoId },
          data: {
            estadoId: ESTADO_PEDIDO.PAGADO,
            paymentId: pago.id?.toString()
          },
        });

        const paqueteActualizado = await tx.paquetePublicado.findUnique({
          where: { id_paquete_publicado: pedido.paquetePublicadoId }
        });

        // Verificar si el paquete alcanzó su capacidad → transición automática a Completo
        if (
          paqueteActualizado &&
          paqueteActualizado.estadoId === ESTADO_PAQUETE.ACTIVO &&
          paqueteActualizado.cant_productos !== null &&
          paqueteActualizado.cant_productos_reservados >= paqueteActualizado.cant_productos
        ) {
          emitirEvento = true;
        }
      });

      if (emitirEvento) {
        despachadorEventosApp.emit(DespachadorEventos.PAQUETE_COMPLETO, pedido.paquetePublicadoId);
      }
    }

    if (pago.status === 'rejected') {
      // Pago rechazado → el pedido vuelve a Pendiente para que pueda reintentar
      await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: { estadoId: ESTADO_PEDIDO.PENDIENTE },
      });
    }

    if (pago.status === 'pending' || pago.status === 'in_process') {
      await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: { estadoId: ESTADO_PEDIDO.PENDIENTE },
      });
    }

    return { pedidoId, status: pago.status };
  }

  /**
   * Reembolsa todos los pedidos Pagados de un paquete y lo marca como Cancelado.
   * También cancela los pedidos Pendientes (sin reembolso MP porque aún no pagaron).
   */
  public async cancelarPaqueteYReembolsar(paqueteId: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: paqueteId },
      include: {
        pedidos: {
          where: {
            estadoId: { in: [ESTADO_PEDIDO.PAGADO, ESTADO_PEDIDO.PENDIENTE] },
          },
          include: {
            detalles: true
          }
        }
      }
    });

    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    // Reembolsar vía MP solo los pedidos Pagados con paymentId
    const pedidosPagados = paquete.pedidos.filter(
      (p: { estadoId: number; paymentId: string | null }) => p.estadoId === ESTADO_PEDIDO.PAGADO && p.paymentId
    );

    for (const pedido of pedidosPagados) {
      if (pedido.paymentId) {
        try {
          await this.mercadoPagoService.reembolsarPago(Number(pedido.paymentId));
        } catch (error) {
          console.error(`Error reembolsando pago ${pedido.paymentId}:`, error);
          // Continuamos con los demás aunque uno falle
        }
      }
    }

    // Actualizar la base de datos en transacción
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.prisma.$transaction(async (tx: any) => {
      // Cancelar el paquete
      await tx.paquetePublicado.update({
        where: { id_paquete_publicado: paqueteId },
        data: { estadoId: ESTADO_PAQUETE.CANCELADO }
      });

      for (const pedido of paquete.pedidos) {
        let totalProductosPedido = 0;

        if (pedido.estadoId === ESTADO_PEDIDO.PAGADO) {
          totalProductosPedido = pedido.detalles.reduce(
            (sum: number, d: { cantidad: number }) => sum + d.cantidad, 0
          );

          if (paquete.tipo === 'ENERGICO') {
            // Devolver stock físico para paquetes ENÉRGICO
            for (const detalle of pedido.detalles) {
              if (detalle.varianteId) {
                await tx.productoVariante.update({
                  where: { id: detalle.varianteId },
                  data: { stockFisico: { increment: detalle.cantidad } }
                });
              } else {
                await tx.producto.update({
                  where: { id_producto: detalle.productoId },
                  data: { stock: { increment: detalle.cantidad } }
                });
              }
            }
          }

          // Descontar del contador reservado (tanto ENÉRGICO como SINÉRGICO)
          await tx.paquetePublicado.update({
            where: { id_paquete_publicado: paqueteId },
            data: { cant_productos_reservados: { decrement: totalProductosPedido } }
          });
        }

        // Marcar pedido como Reembolsado (tanto Pagados como Pendientes)
        await tx.pedido.update({
          where: { id_pedido: pedido.id_pedido },
          data: { estadoId: ESTADO_PEDIDO.REEMBOLSADO }
        });
      }
    });

    return { message: 'Paquete cancelado y dinero reembolsado', paqueteId };
  }

  /**
   * Reembolsa un pedido individual (usuario solicita devolución mientras el paquete está Activo).
   */
  public async reembolsarPedidoIndividual(pedidoId: number, usuarioId: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: pedidoId },
      include: {
        paquetePublicado: {
          select: {
            estadoId: true,
            tipo: true,
          }
        },
        detalles: true,
      }
    });

    if (!pedido) throw new CustomError('Pedido no encontrado', 404);
    if (pedido.usuarioId !== usuarioId) throw new CustomError('No autorizado', 403);
    if (pedido.estadoId !== ESTADO_PEDIDO.PAGADO) {
      throw new CustomError('Solo se pueden reembolsar pedidos en estado Pagado', 400);
    }
    if (pedido.paquetePublicado.estadoId !== ESTADO_PAQUETE.ACTIVO) {
      throw new CustomError('No se puede solicitar reembolso: el paquete ya no está activo', 400);
    }

    // Reembolsar vía MP
    if (pedido.paymentId) {
      try {
        await this.mercadoPagoService.reembolsarPago(Number(pedido.paymentId));
      } catch (error) {
        console.error(`Error al reembolsar pago ${pedido.paymentId}:`, error);
        throw new CustomError('Error al procesar el reembolso con Mercado Pago', 500);
      }
    }

    // Actualizar en transacción
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.prisma.$transaction(async (tx: any) => {
      let totalProductosPedido = 0;

      if (pedido.paquetePublicado.tipo === 'ENERGICO') {
        for (const detalle of pedido.detalles) {
          totalProductosPedido += detalle.cantidad;
          if (detalle.varianteId) {
            await tx.productoVariante.update({
              where: { id: detalle.varianteId },
              data: { stockFisico: { increment: detalle.cantidad } }
            });
          } else {
            await tx.producto.update({
              where: { id_producto: detalle.productoId },
              data: { stock: { increment: detalle.cantidad } }
            });
          }
        }
      } else {
        totalProductosPedido = pedido.detalles.reduce(
          (sum: number, d: { cantidad: number }) => sum + d.cantidad, 0
        );
      }

      // Descontar del contador reservado
      await tx.paquetePublicado.update({
        where: { id_paquete_publicado: pedido.paquetePublicadoId },
        data: { cant_productos_reservados: { decrement: totalProductosPedido } }
      });

      // Marcar pedido como Reembolsado
      await tx.pedido.update({
        where: { id_pedido: pedidoId },
        data: { estadoId: ESTADO_PEDIDO.REEMBOLSADO }
      });
    });

    return { message: 'Reembolso procesado correctamente', pedidoId };
  }
}
