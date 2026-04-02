import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { MercadoPagoService } from '../payments/mercadopago/mercadopago.service.js';
import { despachadorEventosApp, DespachadorEventos } from '../events/despachadorEventos.js';

// ─── Estados canónicos ──────────────────────────────────────────────────────
// EstadoPedido: Pendiente | Confirmado | Completo | Recibido | Cancelado | Reembolsando
//
// Flujo de pago:
//  MP approved  → Pedido "Pendiente"  (usuario pagó, espera que el grupo se llene)
//  MP rejected  → Pedido "Cancelado"
//  MP pending   → Pedido "Pendiente"  (pago aún en proceso)
//
//  Cuando el paquete se llena → evento PAQUETE_COMPLETADO → paquete y pedidos pasan a "Completo"
//  El admin confirma el PAQUETE ENTERO → paquete y pedidos pasan a "Confirmado" (dinero acreditado a Pablo)
// ────────────────────────────────────────────────────────────────────────────

export class PedidoPagoService {
  private prisma = prisma;

  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async getEstadoPedido(nombre: string) {
    const estado = await this.prisma.estadoPedido.findUnique({ where: { nombre } });
    if (!estado) throw new CustomError(`Estado de pedido "${nombre}" no encontrado en la BD`, 500);
    return estado;
  }

  private validarStockFinal(
    stock: number | null,
    cantidad: number,
    nombre: string
  ) {
    if (stock !== null && stock < cantidad) {
      throw new CustomError(`Stock insuficiente para ${nombre}`, 400);
    }
  }

  // ─── Operaciones ───────────────────────────────────────────────────────────

  public async iniciarPago(pedidoId: number, usuarioId: number) {
    const estadoPendiente = await this.getEstadoPedido('Pendiente');

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

    // Solo se puede iniciar pago en pedidos "Pendiente"
    if (pedido.estadoId !== estadoPendiente.id_estado) {
      throw new CustomError('El pedido no puede pagarse en su estado actual', 400);
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

    if (pedido.paquetePublicado.tipo === 'ENERGICO') {
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

      // El pago se acredita en la cuenta del admin.
      // El pedido queda en "Pendiente" hasta que el admin lo confirme.
      const estadoPendiente = await this.getEstadoPedido('Pendiente');

      let emitirEvento = false;

      await this.prisma.$transaction(async (prisma) => {
        // Incrementar reservas en el paquete
        await prisma.paquetePublicado.update({
          where: { id_paquete_publicado: pedido.paquetePublicadoId },
          data: {
            cant_productos_reservados: { increment: totalProductos },
          },
        });

        // Descontar stock físico si es ENERGICO
        if (pedido.paquetePublicado.tipo === 'ENERGICO') {
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

        // El pedido pasa a "Pendiente" (pago recibido, esperando confirmación admin)
        await prisma.pedido.update({
          where: { id_pedido: pedidoId },
          data: {
            estadoId: estadoPendiente.id_estado,
            paymentId: pago.id?.toString()
          },
        });

        // Verificar si el paquete se completó
        const paqueteActualizado = await prisma.paquetePublicado.findUnique({
          where: { id_paquete_publicado: pedido.paquetePublicadoId },
        });

        if (
          paqueteActualizado &&
          paqueteActualizado.cant_productos_reservados >= (paqueteActualizado.cant_productos || 0)
        ) {
          emitirEvento = true;
        }
      });

      if (emitirEvento) {
        despachadorEventosApp.emit(
          DespachadorEventos.PAQUETE_COMPLETADO,
          pedido.paquetePublicadoId
        );
      }
    }

    if (pago.status === 'rejected') {
      const estadoCancelado = await this.getEstadoPedido('Cancelado');
      await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: { estadoId: estadoCancelado.id_estado },
      });
    }

    if (pago.status === 'pending' || pago.status === 'in_process') {
      const estadoPendiente = await this.getEstadoPedido('Pendiente');
      await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: { estadoId: estadoPendiente.id_estado },
      });
    }

    return { pedidoId, status: pago.status };
  }

  public async procesarPaqueteCompletado(paqueteId: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: paqueteId }
    });

    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    // Actualizamos el paquete a estado Finalizado o en proceso
    await this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: paqueteId },
      data: { estadoId: 9 } // 9 = Finalizado
    });

    return { message: 'Paquete procesado correctamente', paqueteId };
  }

  public async cancelarPaqueteYReembolsar(paqueteId: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: paqueteId },
      include: {
        pedidos: {
          where: {
            estadoId: 2, // Pedidos que fueron pagados
            paymentId: { not: null }
          },
          include: {
            detalles: true
          }
        }
      }
    });

    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    // Primero reembolsamos todos los pagos vía MP
    // @ts-ignore
    for (const pedido of paquete.pedidos) {
      if (pedido.paymentId) {
        try {
          await this.mercadoPagoService.reembolsarPago(Number(pedido.paymentId));
        } catch (error) {
          console.error(`Error reembolsando pago ${pedido.paymentId}:`, error);
          // Omitimos errores individuales en caso de que ya hayan sido devueltos manualmente
        }
      }
    }

    // Luego actualizamos la base de datos dentro de una transaction
    await this.prisma.$transaction(async (tx) => {
      // Cancelamos el paquete
      await tx.paquetePublicado.update({
        where: { id_paquete_publicado: paqueteId },
        data: { estadoId: 4 } // 4 = Cancelado
      });

      // @ts-ignore
      for (const pedido of paquete.pedidos) {
        let totalProductosPedido = 0;

        // Si el paquete es ENERGICO, devolvemos el stock
        if (paquete.tipo === 'ENERGICO') {
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
          totalProductosPedido = pedido.detalles.reduce((sum: number, d: { cantidad: number }) => sum + d.cantidad, 0);
        }

        // Restamos las cantidades reservadas del paquete
        await tx.paquetePublicado.update({
          where: { id_paquete_publicado: paqueteId },
          data: { cant_productos_reservados: { decrement: totalProductosPedido } }
        });

        // Marcamos el pedido como Reembolsando/Cancelado
        await tx.pedido.update({
          where: { id_pedido: pedido.id_pedido },
          data: { estadoId: 6 } // 6 = Reembolsando
        });
      }
    });

    return { message: 'Paquete cancelado y dinero reembolsado', paqueteId };
  }
}