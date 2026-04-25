import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { CrearPedidoDTO } from '../dtos/pedido/crearPedido.dto.js';

// ─── IDs de estado (sincronizados con script.sql) ───────────────────────────
const ESTADO_PAQUETE_ACTIVO = 1;

const ESTADO_PEDIDO = {
  PENDIENTE: 1,
  PAGADO: 2,
  EN_PREPARACION: 4,
  EN_CAMINO: 5,
  RECIBIDO: 6,
} as const;

export type DetalleComputable = { cantidad?: number;[key: string]: unknown };

export type PedidoComputable = {
  estadoId?: number;
  estado?: { nombre?: string } | null;
  usuario?: { id?: number };
  usuarioId?: number;
  detalles?: DetalleComputable[];
  pedidoProductos?: DetalleComputable[];
  monto_total?: string | number | null;
  [key: string]: unknown;
};

export type PaqueteComputable = {
  pedidos?: PedidoComputable[];
  cant_usuarios_registrados?: number;
  cant_productos_reservados?: number;
  monto_total?: number | string | null;
  [key: string]: unknown;
};

export type PedidoConPaquete = {
  paquetePublicado?: PaqueteComputable;
  [key: string]: unknown;
};

// Pedidos considerados "activos" para el cómputo de métricas del paquete
const ESTADOS_PEDIDO_ACTIVOS = ['Pendiente', 'Confirmado', 'Completo', 'Enviado', 'Recibido'];

export class PedidoService {
  private prisma = prisma;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Busca un EstadoPedido por nombre y lanza error si no existe. */
  private async getEstadoPedido(nombre: string) {
    const estado = await this.prisma.estadoPedido.findUnique({ where: { nombre } });
    if (!estado) throw new CustomError(`Estado de pedido "${nombre}" no encontrado en la BD`, 500);
    return estado;
  }

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
        monto_total: recaudacion > 0 ? recaudacion : paquete.monto_total,
      },
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

  private validarStockInformativo(
    stock: number | null,
    cantidad: number,
    mensaje = 'Stock insuficiente'
  ) {
    if (stock !== null && stock < cantidad) {
      throw new CustomError(mensaje, 400);
    }
  }

  private async getPedidoCarrito(usuarioId: number, paqueteId: number) {
    // Busca el pedido en estado "Pendiente" (carrito activo)
    const estadoPendiente = await this.getEstadoPedido('Pendiente');
    return this.prisma.pedido.findFirst({
      where: {
        usuarioId,
        paquetePublicadoId: paqueteId,
        estadoId: ESTADO_PEDIDO.PENDIENTE,
      },
      select: { id_pedido: true },
    });
  }

  // ─── Operaciones de pedido ─────────────────────────────────────────────────

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
                      variantes: {
                        where: { activo: true },
                        select: {
                          id: true,
                          stockFisico: true,
                          precioExtra: true,
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

      if (paquete.estado.id_estado !== ESTADO_PAQUETE_ACTIVO) {
        throw new CustomError('El paquete no está activo para nuevos pedidos', 400);
      }

      const productoEnPaquete = paquete.paqueteBase.productos.find(
        (p) => p.productoId === dto.productoId
      );

      console.log('[crearPedido] productoEnPaquete:', productoEnPaquete ? 'SI' : 'NO');

      if (!productoEnPaquete) {
        throw new CustomError('El producto no pertenece al paquete', 400);
      }

      const producto = productoEnPaquete.producto;
      let varianteId = dto.varianteId || null;
      let stockAValidar = producto.stock;
      let precioExtra = 0;

      if (dto.varianteId) {
        const variante = producto.variantes.find(
          (v) => v.id === dto.varianteId
        );
        if (!variante) {
          throw new CustomError('La variante no existe para este producto', 400);
        }
        varianteId = variante.id;
        stockAValidar = variante.stockFisico;
        precioExtra = variante.precioExtra || 0;
      } else {
        if (producto.plantillaId !== null && producto.variantes.length > 0) {
          throw new CustomError(
            'Debe seleccionar una variante para este producto',
            400
          );
        }
      }

      if (paquete.tipo === 'ENERGICO') {
        this.validarStockInformativo(stockAValidar, dto.cantidad);
      }

      const precioBase = producto.precio + precioExtra;
      const precioUnitario = this.calcularPrecioConDescuento(
        precioBase,
        paquete.descuento || 0
      );

      const subtotal = precioUnitario * dto.cantidad;
      console.log(`[crearPedido] precioUnitario=${precioUnitario}, subtotal=${subtotal}`);

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
                productoId: producto.id_producto,
                varianteId: varianteId,
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
          varianteId: varianteId ?? null,
        },
      });

      console.log('[crearPedido] detalleExistente:', detalleExistente ? 'SI' : 'NO');

      if (detalleExistente) {
        const nuevaCantidad = detalleExistente.cantidad + dto.cantidad;
        if (paquete.tipo === 'ENERGICO') {
          this.validarStockInformativo(stockAValidar, nuevaCantidad);
        }
        await this.prisma.pedidoDetalle.update({
          where: { id: detalleExistente.id },
          data: {
            cantidad: nuevaCantidad,
            subtotal: precioUnitario * nuevaCantidad,
          },
        });
      } else {
        await this.prisma.pedidoDetalle.create({
          data: {
            pedidoId: pedido.id_pedido,
            productoId: producto.id_producto,
            varianteId: varianteId,
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
    const estadoPendiente = await this.getEstadoPedido('Pendiente');
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
    const estadoPendiente = await this.getEstadoPedido('Pendiente');
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
          },
        },
        detalles: {
          include: {
            producto: {
              select: {
                precio: true,
                stock: true,
                tipo: true,
              },
            },
            variante: {
              select: {
                stockFisico: true,
                precioExtra: true,
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

    if (pedido.paquetePublicado.tipo === 'ENERGICO') {
      let stockAValidar = detalle.producto.stock;

      if (detalle.varianteId && detalle.variante) {
        stockAValidar = detalle.variante.stockFisico;
      }

      this.validarStockInformativo(stockAValidar, nuevaCantidad);
    }

    const precioBase = detalle.producto.precio + (detalle.variante?.precioExtra || 0);
    const precioUnitario = this.calcularPrecioConDescuento(
      precioBase,
      pedido.paquetePublicado.descuento || 0
    );

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

  public async notificarEnvio(pedidoIds: number[]) {
    const estadoEnviado = await this.getEstadoPedido('Enviado');

    const pedidos = await this.prisma.pedido.findMany({
      where: {
        id_pedido: { in: pedidoIds },
        estado: { nombre: 'Confirmado' },
      },
      include: {
        usuario: { select: { email: true, nombre: true } },
        paquetePublicado: {
          include: { paqueteBase: { select: { nombre: true } } },
        },
      },
    });

    if (pedidos.length === 0) {
      throw new CustomError('No se encontraron pedidos válidos para notificar. Deben estar en estado "Confirmado".', 400);
    }

    await this.prisma.pedido.updateMany({
      where: { id_pedido: { in: pedidos.map((p) => p.id_pedido) } },
      data: { estadoId: estadoEnviado.id_estado },
    });

    const emailService = new EmailService();
    for (const pedido of pedidos) {
      await emailService.enviarEmail({
        para: pedido.usuario.email,
        asunto: `🚚 ¡Tu pedido está en camino! - ${pedido.paquetePublicado?.paqueteBase?.nombre}`,
        template: 'comprador-pedido-enviado',
        context: {
          nombreComprador: pedido.usuario.nombre,
          nombrePaquete: pedido.paquetePublicado?.paqueteBase?.nombre,
        },
      });
    }

    return {
      pedidosActualizados: pedidos.length,
      notificados: pedidos.length,
    };
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
                estado: { select: { nombre: true } },
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
                estado: { select: { nombre: true } },
                usuario: { select: { id: true } },
                detalles: true,
              },
            },
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
    const estadoPendiente = await this.getEstadoPedido('Pendiente');

    const pedido = await this.prisma.pedido.findFirst({
      where: {
        usuarioId,
        paquetePublicadoId: paqueteId,
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