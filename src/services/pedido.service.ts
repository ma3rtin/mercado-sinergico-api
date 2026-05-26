import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { CrearPedidoDTO } from '../dtos/pedido/crearPedido.dto.js';

import { ESTADO_PEDIDO } from '../constants/estado-pedido.js';
import { ESTADO_PAQUETE } from '../constants/estado-paquete.js';

import { 
  PaqueteComputable 
} from '../types/computable.types.js';

export type PedidoConPaquete = {
  paquetePublicado?: PaqueteComputable;
  [key: string]: unknown;
};


export class PedidoService {
  private prisma = prisma;

  private _mapComputedFields<T extends PedidoConPaquete>(pedido: T) {
    if (!pedido || !pedido.paquetePublicado) return pedido;

    const paquete = pedido.paquetePublicado;
    // "Involucrados": Pagado (2), En preparación (4), En camino (5), Recibido (6)
    const estadosActivos: number[] = [ESTADO_PEDIDO.PAGADO, ESTADO_PEDIDO.EN_PREPARACION, ESTADO_PEDIDO.EN_CAMINO, ESTADO_PEDIDO.RECIBIDO];
    const pedidosActivos = (paquete.pedidos || []).filter((p) => p.estadoId && estadosActivos.includes(p.estadoId as number));

    const usuariosIds = new Set(pedidosActivos.map((p) => p.usuario?.id || p.usuarioId));

    let reservados = 0;
    pedidosActivos.forEach((ped) => {
      const arr = ped.detalles || ped.pedidoProductos || [];
      reservados += arr.reduce((sum: number, det) => sum + (det.cantidad || 0), 0);
    });

    let recaudacion = 0;
    pedidosActivos.forEach((ped) => {
      recaudacion += Number(ped.monto_total || 0);
    });

    return {
      ...pedido,
      paquetePublicado: {
        ...paquete,
        cant_usuarios_registrados: usuariosIds.size > 0 ? usuariosIds.size : paquete.cant_usuarios_registrados,
        cant_productos_reservados: reservados > 0 ? reservados : paquete.cant_productos_reservados,
        monto_total: recaudacion > 0 ? recaudacion : paquete.monto_total
      }
    };
  }

  private calcularPrecioConDescuento(precioBase: number, descuento: number) {
    return precioBase * (1 - descuento / 100);
  }

  private async recalcularMontoTotal(pedidoId: number) {
    const total = await this.prisma.pedidoDetalle.aggregate({
      where: { pedidoId },
      _sum: { subtotal: true },
    });

    await this.prisma.pedido.update({
      where: { id_pedido: pedidoId },
      data: {
        monto_total: total._sum.subtotal || 0,
      },
    });
  }

  private async getPedidoCarrito(usuarioId: number, paqueteId: number) {
    return this.prisma.pedido.findFirst({
      where: {
        usuarioId,
        paquetePublicadoId: paqueteId,
        estadoId: ESTADO_PEDIDO.PENDIENTE,
      },
      select: { id_pedido: true },
    });
  }

  public async crearPedido(
    usuarioId: number,
    paqueteId: number,
    dto: CrearPedidoDTO
  ): Promise<number> {
    try {
      console.log(`[crearPedido] Iniciando con usuarioId=${usuarioId}, paqueteId=${paqueteId}, dto=`, dto);

      const paquete = await this.prisma.paquetePublicado.findUnique({
        where: { id_paquete_publicado: paqueteId },
        select: {
          descuento: true,
          tipo: true,
          estado: { select: { nombre: true, id_estado: true } },
          cant_productos: true, // Cupos totales del paquete
          cant_productos_reservados: true, // Cupos ya reservados
          paqueteBase: {
            select: {
              productos: {
                select: {
                  productoId: true,
                  producto: {
                    select: {
                      id_producto: true,
                      precio: true,
                      stock: true,
                      tipo: true,
                      plantillaId: true,
                      // Solo incluimos variantes activas para la validación
                      variantes: {
                        where: { activo: true },
                        select: {
                          id: true,
                          stockFisico: true,
                          precioExtra: true,
                          activo: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log('[crearPedido] paquete obtenido:', paquete ? 'SI' : 'NO');

      if (!paquete) {
        throw new CustomError('Paquete no encontrado', 404);
      }

      // A. El paquete sigue abierto
      if (paquete.estado.id_estado !== ESTADO_PAQUETE.ACTIVO) {
        throw new CustomError('El paquete no está activo para nuevos pedidos', 400);
      }

      const productoEnPaquete = paquete.paqueteBase.productos[0]; // Debería haber solo uno por el `where`
      if (!productoEnPaquete) {
        throw new CustomError('El producto no pertenece al paquete', 400);
      }
      const producto = productoEnPaquete.producto;

      // D. La cantidad solicitada es válida
      if (dto.cantidad <= 0) {
        throw new CustomError('La cantidad solicitada debe ser un número positivo', 400);
      }

      let varianteSeleccionada = null;
      let stockFisicoVariante: number | null = null;
      let precioExtra = 0;

      // E. La variante pertenece al producto correcto y está activa
      if (dto.varianteId) {
        const variante = producto.variantes.find(v => v.id === dto.varianteId);
        if (!variante) {
          throw new CustomError('La variante no existe para este producto', 400);
        }
        if (!variante.activo) {
          throw new CustomError('La variante seleccionada no está activa', 400);
        }
        varianteSeleccionada = variante;
        stockFisicoVariante = variante.stockFisico;
        precioExtra = variante.precioExtra || 0;
      } else {
        // Si el producto tiene variantes pero no se seleccionó ninguna
        if (producto.plantillaId !== null && producto.variantes.length > 0) {
          throw new CustomError(
            'Debe seleccionar una variante para este producto',
            400
          );
        }
        // Si el producto no tiene variantes, usamos el stock directo del producto
        stockFisicoVariante = producto.stock;
      }

      // F. El producto pertenece al tipo correcto de paquete
      if (paquete.tipo === 'ENERGICO' && producto.tipo !== 'ENERGICO') {
        throw new CustomError('Un paquete ENÉRGICO solo puede contener productos ENÉRGICOS.', 400);
      }

      // Calcular disponibilidadReal = MIN(cuposRestantesPaquete, stockFisicoVariante)
      const cuposRestantesPaquete = (paquete.cant_productos || 0) - (paquete.cant_productos_reservados || 0);
      let disponibilidadReal: number;
      if (paquete.tipo === 'SINERGICO') {
        disponibilidadReal = cuposRestantesPaquete; // Para SINERGICO, el stock físico es flexible, el límite es el cupo
      } else { // ENERGICO
        if (stockFisicoVariante === null) throw new CustomError('Producto ENÉRGICO sin stock físico definido.', 500);
        disponibilidadReal = Math.min(cuposRestantesPaquete, stockFisicoVariante);
      }

      // B. El paquete tiene cupos disponibles & C. La variante tiene stock físico suficiente
      if (disponibilidadReal < dto.cantidad) {
        throw new CustomError(`No hay suficiente disponibilidad para la cantidad solicitada. Disponibilidad real: ${disponibilidadReal}`, 409);
      }

      const precioBase = producto.precio + precioExtra;
      const precioUnitario = this.calcularPrecioConDescuento(
        precioBase,
        paquete.descuento || 0
      );

      const subtotal = precioUnitario * dto.cantidad;
      console.log(`[crearPedido] precioUnitario=${precioUnitario}, subtotal=${subtotal}`);

      // Buscar si ya existe un pedido "carrito" para este usuario y paquete
      let pedido = await this.getPedidoCarrito(usuarioId, paqueteId);
      console.log('[crearPedido] pedidoCarrito existente:', pedido ? 'SI' : 'NO');

      if (!pedido) {
        const nuevo = await this.prisma.pedido.create({
          data: {
            usuarioId,
            paquetePublicadoId: paqueteId,
            estadoId: ESTADO_PEDIDO.PENDIENTE,
            monto_total: subtotal,
            descuento_aplicado: paquete.descuento || 0,
            detalles: {
              create: {
                productoId: producto.id_producto, // E. La variante pertenece al paquete correcto (producto)
                varianteId: varianteSeleccionada?.id || null,
                cantidad: dto.cantidad,
                precio_unitario: precioUnitario,
                subtotal,
              },
            },
          },
          select: { id_pedido: true },
        });
        console.log(`[crearPedido] nuevo pedido creado: ${nuevo.id_pedido}`);
        return nuevo.id_pedido;
      }

      const detalleExistente = await this.prisma.pedidoDetalle.findFirst({
        where: {
          pedidoId: pedido.id_pedido,
          productoId: producto.id_producto,
          varianteId: varianteSeleccionada?.id ?? null,
        },
      });
      
      console.log('[crearPedido] detalleExistente:', detalleExistente ? 'SI' : 'NO');

      if (detalleExistente) {
        const nuevaCantidadTotal = detalleExistente.cantidad + dto.cantidad;
        if (disponibilidadReal < nuevaCantidadTotal) {
          throw new CustomError(`No hay suficiente disponibilidad para la cantidad total solicitada. Disponibilidad real: ${disponibilidadReal}`, 409);
        }
        await this.prisma.pedidoDetalle.update({
          where: { id: detalleExistente.id },
          data: {
            cantidad: nuevaCantidadTotal,
            subtotal: precioUnitario * nuevaCantidadTotal,
          },
        });
      } else {
        await this.prisma.pedidoDetalle.create({
          data: {
            pedidoId: pedido.id_pedido,
            productoId: producto.id_producto, // E. La variante pertenece al paquete correcto (producto)
            varianteId: varianteSeleccionada?.id || null,
            cantidad: dto.cantidad,
            precio_unitario: precioUnitario,
            subtotal,
          },
        });
      }

      await this.recalcularMontoTotal(pedido.id_pedido);
      console.log('[crearPedido] recalcularMontoTotal finalizado exitosamente.');
      return pedido.id_pedido;

    } catch (error) {
      console.error('[crearPedido ERROR] Fallo inesperado:', error);
      throw error;
    }
  }

  public async eliminarProducto(
    usuarioId: number,
    pedidoId: number,
    detalleId: number
  ) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id_pedido: pedidoId,
        usuarioId,
        estadoId: ESTADO_PEDIDO.PENDIENTE,
      },
      include: { detalles: true },
    });

    if (!pedido) {
      throw new CustomError('Pedido no encontrado', 404);
    }

    const detalle = pedido.detalles.find((d) => d.id === detalleId);
    if (!detalle) {
      throw new CustomError('Producto no encontrado en el pedido', 404);
    }

    await this.prisma.pedidoDetalle.delete({
      where: { id: detalle.id },
    });

    const restantes = await this.prisma.pedidoDetalle.count({
      where: { pedidoId },
    });

    if (restantes === 0) {
      await this.prisma.pedido.delete({
        where: { id_pedido: pedidoId },
      });
      return null;
    }

    await this.recalcularMontoTotal(pedidoId);

    return { ok: true };
  }

  public async actualizarCantidad(
    usuarioId: number,
    pedidoId: number,
    detalleId: number,
    nuevaCantidad: number
  ) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id_pedido: pedidoId,
        usuarioId,
        estadoId: ESTADO_PEDIDO.PENDIENTE,
      },
      include: {
        paquetePublicado: {
          select: {
            tipo: true,
            descuento: true,
            cant_productos: true, // Cupos totales del paquete
            cant_productos_reservados: true, // Cupos ya reservados
          },
        },
        detalles: {
          include: {
            producto: {
              select: {
                precio: true,
                stock: true, // Para productos sin variantes
                tipo: true,
                plantillaId: true,
              },
            },
            variante: {
              select: {
                id: true,
                stockFisico: true,
                precioExtra: true,
                activo: true,
              },
            },
          },
        },
      },
    });

    if (!pedido) {
      throw new CustomError('Pedido no encontrado', 404);
    }

    const detalle = pedido.detalles.find((d) => d.id === detalleId);
    if (!detalle) {
      throw new CustomError('Producto no encontrado', 404);
    }

    // D. Cantidad solicitada es válida
    if (nuevaCantidad <= 0) {
      throw new CustomError('La cantidad debe ser un número positivo', 400);
    }

    let stockFisicoVariante: number | null = null;

    // Determinar la fuente del stock
    if (detalle.varianteId && detalle.variante) {
      if (!detalle.variante.activo) {
        throw new CustomError('La variante de este producto no está activa.', 400);
      }
      stockFisicoVariante = detalle.variante.stockFisico;
    } else {
      // Si el producto tiene variantes pero no se seleccionó ninguna (estado inválido)
      if (detalle.producto.plantillaId !== null) {
        throw new CustomError('Este producto requiere una variante seleccionada.', 400);
      }
      // Si el producto no tiene variantes, usamos el stock directo del producto
      stockFisicoVariante = detalle.producto.stock;
    }

    // F. El producto pertenece al tipo correcto de paquete
    if (pedido.paquetePublicado.tipo === 'ENERGICO' && detalle.producto.tipo !== 'ENERGICO') {
      throw new CustomError('Un paquete ENÉRGICO solo puede contener productos ENÉRGICOS.', 400);
    }

    // Calcular disponibilidadReal = MIN(cuposRestantesPaquete, stockFisicoVariante)
    const cuposRestantesPaquete = (pedido.paquetePublicado.cant_productos || 0) - (pedido.paquetePublicado.cant_productos_reservados || 0);
    let disponibilidadReal: number;
    if (pedido.paquetePublicado.tipo === 'SINERGICO') {
      disponibilidadReal = cuposRestantesPaquete; // Para SINERGICO, el stock físico es flexible, el límite es el cupo
    } else { // ENERGICO
      if (stockFisicoVariante === null) {
        throw new CustomError('Producto ENÉRGICO sin stock físico definido.', 500);
      }
      disponibilidadReal = Math.min(cuposRestantesPaquete, stockFisicoVariante);
    }

    // B. El paquete tiene cupos disponibles & C. La variante tiene stock físico suficiente
    if (disponibilidadReal < nuevaCantidad) {
      throw new CustomError(`No hay suficiente disponibilidad para la cantidad solicitada. Disponibilidad real: ${disponibilidadReal}`, 409);
    }

    const precioBase =
      detalle.producto.precio + (detalle.variante?.precioExtra || 0);
    const precioUnitario = this.calcularPrecioConDescuento(
      precioBase,
      pedido.paquetePublicado.descuento || 0
    ); // E. La variante pertenece al paquete correcto (producto)

    await this.prisma.pedidoDetalle.update({
      where: { id: detalle.id },
      data: {
        cantidad: nuevaCantidad,
        subtotal: precioUnitario * nuevaCantidad,
      },
    });

    await this.recalcularMontoTotal(pedidoId);

    return { ok: true };
  }

  public async obtenerPedidosUsuario(usuarioId: number) {
    const pedidos = await this.prisma.pedido.findMany({
      where: { usuarioId },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        estado: true,
        detalles: {
          include: {
            producto: true,
            variante: {
              include: {
                opciones: {
                  include: {
                    caracteristica: true,
                    opcion: true,
                  },
                },
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
            pedidos: {
              include: {
                usuario: { select: { id: true } },
                detalles: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pedidos.map((p) => this._mapComputedFields(p as PedidoConPaquete));
  }
  public async obtenerPedidoPorId(usuarioId: number, pedidoId: number) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id_pedido: pedidoId,
        usuarioId,
      },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        estado: true,
        paquetePublicado: {
          include: {
            paqueteBase: true,
            zona: true,
            pedidos: {
              include: {
                usuario: { select: { id: true } },
                detalles: true
              }
            }
          },
        },
        detalles: {
          include: {
            producto: {
              include: {
                marca: true,
                categoria: true,
              },
            },
            variante: {
              include: {
                opciones: {
                  include: {
                    caracteristica: true,
                    opcion: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pedido) {
      throw new CustomError('Pedido no encontrado', 404);
    }

    return this._mapComputedFields(pedido as PedidoConPaquete);
  }

  public async bajarseDePaquete(usuarioId: number, paqueteId: number) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        usuarioId,
        paquetePublicadoId: paqueteId
      },
    });

    if (!pedido) {
      throw new CustomError('No hay un pedido activo en este paquete', 404);
    }

    if (pedido.estadoId !== ESTADO_PEDIDO.PENDIENTE) {
      throw new CustomError('Solo se puede cancelar un pedido pendiente de pago. Para reembolsar un pedido ya pagado, usá la opción de reembolso.', 400);
    }

    await this.prisma.pedido.delete({
      where: { id_pedido: pedido.id_pedido },
    });

    return { ok: true };
  }
}