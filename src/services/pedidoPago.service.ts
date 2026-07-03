import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { MercadoPagoService } from '../payments/mercadopago/mercadopago.service.js';
import { despachadorEventosApp, DespachadorEventos } from '../events/despachadorEventos.js';

import { ESTADO_PEDIDO } from '../constants/estado-pedido.js';
import { ESTADO_PAQUETE } from '../constants/estado-paquete.js';

export class PedidoPagoService {
  private prisma = prisma;

  constructor(private readonly mercadoPagoService: MercadoPagoService) { }

  private calcularCuposRestantes(cantProductos: number | null, cantReservados: number) {
    return cantProductos === null ? null : cantProductos - cantReservados;
  }

  private calcularDisponibilidadReal(
    tipoPaquete: string,
    cuposRestantes: number | null,
    stockFisico: number | null,
    productoNombre: string
  ) {
    if (tipoPaquete === 'SINERGICO') {
      return cuposRestantes;
    }

    if (stockFisico === null) {
      throw new CustomError(`Producto ENÉRGICO (${productoNombre}) sin stock físico definido.`, 500);
    }

    return cuposRestantes === null ? stockFisico : Math.min(cuposRestantes, stockFisico);
  }

  private validarDisponibilidad(
    disponibilidadReal: number | null,
    cantidad: number,
    productoNombre: string
  ) {
    if (disponibilidadReal !== null && disponibilidadReal < cantidad) {
      throw new CustomError(
        `No hay suficiente disponibilidad para ${productoNombre}. Disponibilidad real: ${disponibilidadReal}, Solicitado: ${cantidad}.`,
        409
      );
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
                tipo: true, // Necesario para validar ENERGICO/SINERGICO
                stock: true,
              },
            },
            variante: {
              select: {
                stockFisico: true,
                activo: true, // Necesario para validar variantes activas
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
            estadoId: true, // Necesario para validar paquete activo
            cant_productos: true,
            cant_productos_reservados: true,
            paqueteBaseId: true,
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

    // A. El paquete sigue abierto
    if (pedido.paquetePublicado.estadoId !== ESTADO_PAQUETE.ACTIVO) { // Redundante con la línea de arriba, pero explícito
      throw new CustomError('El paquete ya no está activo para pagos', 400);
    }

    // Validar que todos los productos del pedido sigan perteneciendo al paquete base
    const productosBase = await this.prisma.paqueteBaseProducto.findMany({
      where: { paqueteBaseId: pedido.paquetePublicado.paqueteBaseId },
      select: { productoId: true },
    });
    const productosBaseIds = new Set(productosBase.map((p) => p.productoId));

    for (const detalle of pedido.detalles) {
      if (!productosBaseIds.has(detalle.productoId)) {
        throw new CustomError(
          'El pedido contiene productos que ya no están disponibles en este paquete. Actualizá tu pedido antes de pagar.',
          400
        );
      }
    }

    // Validar cupo global del paquete: total del pedido contra reservas confirmadas
    const totalProductosSolicitados = pedido.detalles.reduce(
      (sum: number, d: { cantidad: number }) => sum + d.cantidad,
      0
    );
    const cuposRestantesPaquete = this.calcularCuposRestantes(
      pedido.paquetePublicado.cant_productos,
      pedido.paquetePublicado.cant_productos_reservados || 0
    );
    if (cuposRestantesPaquete !== null && totalProductosSolicitados > cuposRestantesPaquete) {
      throw new CustomError(
        'Ya no hay cupo suficiente para completar este pedido. Actualizá tu pedido antes de pagar.',
        400
      );
    }

    // Validar disponibilidad por producto/variante
    for (const detalle of pedido.detalles) {
      const productoNombre = detalle.producto.nombre;
      let stockFisicoVariante: number | null = null;

      // D. La cantidad solicitada es válida
      if (detalle.cantidad <= 0) {
        throw new CustomError(`Cantidad solicitada inválida para ${productoNombre}.`, 400);
      }

      // E. La variante pertenece al producto correcto y está activa
      if (detalle.varianteId && detalle.variante) {
        if (!detalle.variante.activo) {
          throw new CustomError(`La variante ${productoNombre} no está activa.`, 400);
        }
        stockFisicoVariante = detalle.variante.stockFisico;
      } else {
        // Si el producto tiene variantes pero no se seleccionó ninguna (estado inválido)
        if (detalle.producto.tipo === 'ENERGICO' && !detalle.producto.stock) {
          throw new CustomError(`Producto ENÉRGICO (${productoNombre}) sin variante y sin stock físico definido.`, 500);
        }
        stockFisicoVariante = detalle.producto.stock;
      }

      // F. El producto pertenece al tipo correcto de paquete
      if (pedido.paquetePublicado.tipo === 'ENERGICO' && detalle.producto.tipo !== 'ENERGICO') {
        throw new CustomError('Un paquete ENÉRGICO solo puede contener productos ENÉRGICOS.', 400);
      }

      // Stock físico por producto/variante (solo aplica a ENERGICO; cupo global ya validado)
      if (pedido.paquetePublicado.tipo === 'ENERGICO') {
        const disponibilidadReal = this.calcularDisponibilidadReal(
          pedido.paquetePublicado.tipo,
          null,
          stockFisicoVariante,
          productoNombre
        );
        this.validarDisponibilidad(disponibilidadReal, detalle.cantidad, productoNombre);
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
            cant_productos: true, // Para validación de cupos
          },
        },
        detalles: {
          include: {
            producto: {
              select: {
                tipo: true,
                nombre: true,
                stock: true, // Para productos sin variantes
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
      // Guard de idempotencia: MP puede enviar el mismo webhook más de una vezs.
      // Si el pedido ya fue procesado (no está Pendiente), ignorar silenciosamente.
      if (pedido.estadoId !== ESTADO_PEDIDO.PENDIENTE) {
        return { pedidoId, status: pago.status };
      }

      const totalProductosSolicitados = pedido.detalles.reduce(
        (sum: number, d: { cantidad: number }) => sum + d.cantidad,
        0
      );

      let emitirEvento = false;

      await this.prisma.$transaction(async (tx) => {
        // Re-fetch paquetePublicado dentro de la transacción para asegurar los datos más recientes
        const paqueteActualizado = await tx.paquetePublicado.findUnique({
          where: { id_paquete_publicado: pedido.paquetePublicadoId },
          select: {
            id_paquete_publicado: true,
            tipo: true,
            cant_productos: true,
            cant_productos_reservados: true,
            estadoId: true,
            paqueteBaseId: true,
          },
        });

        if (!paqueteActualizado) {
          throw new CustomError('Paquete no encontrado durante la confirmación de pago', 404);
        }

        // A. El paquete sigue abierto (doble check)
        if (paqueteActualizado.estadoId !== ESTADO_PAQUETE.ACTIVO) {
          throw new CustomError('El paquete ya no está activo para pagos. El pedido será reembolsado si el pago se procesa.', 400);
        }

        // Validar que todos los productos del pedido sigan perteneciendo al paquete base (defensa de carrera)
        const productosBase = await tx.paqueteBaseProducto.findMany({
          where: { paqueteBaseId: paqueteActualizado.paqueteBaseId },
          select: { productoId: true },
        });
        const productosBaseIds = new Set(productosBase.map((p) => p.productoId));

        for (const detalle of pedido.detalles) {
          if (!productosBaseIds.has(detalle.productoId)) {
            throw new CustomError(
              'El pedido contiene productos que ya no están disponibles en este paquete. Actualizá tu pedido antes de pagar.',
              400
            );
          }
        }

        const cuposDisponibles = this.calcularCuposRestantes(
          paqueteActualizado.cant_productos,
          paqueteActualizado.cant_productos_reservados || 0
        );
        if (cuposDisponibles !== null && totalProductosSolicitados > cuposDisponibles) {
          throw new CustomError(
            `No hay suficientes cupos disponibles en el paquete. Solicitados: ${totalProductosSolicitados}, Disponibles: ${cuposDisponibles}.`,
            409
          );
        }

        const pedidoClaim = await tx.pedido.updateMany({
          where: {
            id_pedido: pedidoId,
            estadoId: ESTADO_PEDIDO.PENDIENTE,
          },
          data: {
            estadoId: ESTADO_PEDIDO.PAGADO,
            paymentId: pago.id?.toString(),
          },
        });

        if (pedidoClaim.count === 0) {
          return;
        }

        const wherePaquete =
          paqueteActualizado.cant_productos === null
            ? { id_paquete_publicado: pedido.paquetePublicadoId }
            : {
                id_paquete_publicado: pedido.paquetePublicadoId,
                cant_productos_reservados: {
                  lte: paqueteActualizado.cant_productos - totalProductosSolicitados,
                },
              };

        // Intento atómico de reservar cupos del paquete
        const updatedPaqueteCount = await tx.paquetePublicado.updateMany({
          where: wherePaquete,
          data: {
            cant_productos_reservados: { increment: totalProductosSolicitados },
          },
        });

        if (updatedPaqueteCount.count === 0) {
          // Esto significa que otra transacción ya tomó los últimos cupos
          throw new CustomError('No hay suficientes cupos disponibles en el paquete. Intenta de nuevo.', 409);
        }

        // C. La variante tiene stock físico suficiente (optimistic locking)
        if (paqueteActualizado.tipo === 'ENERGICO') {
          for (const detalle of pedido.detalles) {
            const productoNombre = detalle.producto.nombre;
            let targetId: number;
            let targetModel: 'producto' | 'variante';

            // D. La cantidad solicitada es válida
            if (detalle.cantidad <= 0) {
              throw new CustomError(`Cantidad solicitada inválida para ${productoNombre}.`, 400);
            }

            if (detalle.varianteId) {
              // Re-fetch variante dentro de la transacción para asegurar los datos más recientes
              const varianteActualizada = await tx.productoVariante.findUnique({
                where: { id: detalle.varianteId },
                select: { id: true, stockFisico: true, activo: true },
              });
              if (!varianteActualizada || !varianteActualizada.activo) {
                throw new CustomError(`La variante ${productoNombre} no existe o no está activa.`, 400);
              }
              if (varianteActualizada.stockFisico === null || varianteActualizada.stockFisico < detalle.cantidad) {
                throw new CustomError(`Stock insuficiente para la variante ${productoNombre}. Stock actual: ${varianteActualizada.stockFisico || 0}, Solicitado: ${detalle.cantidad}.`, 409);
              }
              targetId = detalle.varianteId;
              targetModel = 'variante';
            } else {
              // Re-fetch producto dentro de la transacción para asegurar los datos más recientes
              const productoActualizado = await tx.producto.findUnique({
                where: { id_producto: detalle.productoId },
                select: { id_producto: true, stock: true, tipo: true },
              });
              if (!productoActualizado || productoActualizado.stock === null || productoActualizado.stock < detalle.cantidad) {
                throw new CustomError(`Stock insuficiente para el producto ${productoNombre}. Stock actual: ${productoActualizado?.stock || 0}, Solicitado: ${detalle.cantidad}.`, 409);
              }
              targetId = detalle.productoId;
              targetModel = 'producto';
            }

            // Intento atómico de decrementar stock físico
            let updatedStockCount;
            if (targetModel === 'variante') {
              updatedStockCount = await tx.productoVariante.updateMany({
                where: { id: targetId, stockFisico: { gte: detalle.cantidad } },
                data: { stockFisico: { decrement: detalle.cantidad } },
              });
            } else { // targetModel === 'producto'
              updatedStockCount = await tx.producto.updateMany({
                where: { id_producto: targetId, stock: { gte: detalle.cantidad } },
                data: { stock: { decrement: detalle.cantidad } },
              });
            }

            if (updatedStockCount.count === 0) {
              throw new CustomError(`Stock insuficiente para ${productoNombre}. Intenta de nuevo.`, 409);
            }
          }
        }

        // Recalcular cant_usuarios_registrados con el conteo real post-pago.
        // Se usa SET (no increment) para que sea siempre consistente.
        const estadosActivosParaUsuarios = [
          ESTADO_PEDIDO.PAGADO,
          ESTADO_PEDIDO.EN_PREPARACION,
          ESTADO_PEDIDO.EN_CAMINO,
          ESTADO_PEDIDO.RECIBIDO,
        ];
        const usuariosActivos = await tx.pedido.findMany({
          where: {
            paquetePublicadoId: pedido.paquetePublicadoId,
            estadoId: { in: estadosActivosParaUsuarios },
          },
          select: { usuarioId: true },
          distinct: ['usuarioId'],
        });
        await tx.paquetePublicado.update({
          where: { id_paquete_publicado: pedido.paquetePublicadoId },
          data: {
            cant_usuarios_registrados: usuariosActivos.length,
          },
        });

        // Verificar si el paquete alcanzó su capacidad → transición automática a Completo
        if (
          paqueteActualizado &&
          paqueteActualizado.estadoId === ESTADO_PAQUETE.ACTIVO &&
          paqueteActualizado.cant_productos !== null &&
          paqueteActualizado.cant_productos_reservados + totalProductosSolicitados >= paqueteActualizado.cant_productos
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
      (p) => p.estadoId === ESTADO_PEDIDO.PAGADO && p.paymentId
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
    await this.prisma.$transaction(async (tx) => {
      // Cancelar el paquete
      await tx.paquetePublicado.update({
        where: { id_paquete_publicado: paqueteId },
        data: { 
          estadoId: ESTADO_PAQUETE.CANCELADO,
          cant_productos_reservados: 0
        }
      });

      for (const pedido of paquete.pedidos) {
        if (pedido.estadoId === ESTADO_PEDIDO.PAGADO) {
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
            cant_productos_reservados: true,
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
    await this.prisma.$transaction(async (tx) => {
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

      // Descontar del contador reservado de forma segura
      const nuevasReservas = Math.max(0, (pedido.paquetePublicado.cant_productos_reservados || 0) - totalProductosPedido);
      await tx.paquetePublicado.update({
        where: { id_paquete_publicado: pedido.paquetePublicadoId },
        data: { cant_productos_reservados: nuevasReservas }
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
