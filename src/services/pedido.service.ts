import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { CrearPedidoDTO } from '../dtos/pedido/crearPedido.dto.js';

export class PedidoService {
  private prisma = prisma;

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
    return this.prisma.pedido.findFirst({
      where: {
        usuarioId,
        paquetePublicadoId: paqueteId,
      },
      select: { id_pedido: true },
    });
  }

  public async crearPedido(
    usuarioId: number,
    paqueteId: number,
    dto: CrearPedidoDTO
  ): Promise<number> {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: paqueteId },
      select: {
        descuento: true,
        tipo: true,
        estado: { select: { nombre: true } },
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

    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    if (paquete.estado.nombre !== 'Activo') {
      throw new CustomError('El paquete no está activo', 400);
    }

    const productoEnPaquete = paquete.paqueteBase.productos.find(
      (p) => p.productoId === dto.productoId
    );

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

      if (paquete.tipo === 'ENERGICO') {
        stockAValidar = variante.stockFisico;
      }

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

    let pedido = await this.getPedidoCarrito(usuarioId, paqueteId);

    if (!pedido) {
      const nuevo = await this.prisma.pedido.create({
        data: {
          usuarioId,
          paquetePublicadoId: paqueteId,
          estadoId: 1,
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

      return nuevo.id_pedido;
    }

    const detalleExistente = await this.prisma.pedidoDetalle.findFirst({
      where: {
        pedidoId: pedido.id_pedido,
        productoId: producto.id_producto,
        varianteId: varianteId,
      },
    });

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

    return pedido.id_pedido;
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
        estadoId: 1,
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
        estadoId: 1,
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

    const precioBase =
      detalle.producto.precio + (detalle.variante?.precioExtra || 0);
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

public async obtenerPedidosUsuario(usuarioId: number) {
  return this.prisma.pedido.findMany({
    where: { usuarioId },
    include: {
      estado: true,
      paquetePublicado: {
        include: {
          paqueteBase: {
            include: {
              marca: true,
              categoria: true,
            },
          },
          zona: true,
        },
      },
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
    },
    orderBy: { createdAt: 'desc' },
  });
}
  
  public async obtenerPedidoPorId(usuarioId: number, pedidoId: number) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id_pedido: pedidoId,
        usuarioId,
      },
      include: {
        estado: true,
        paquetePublicado: {
          include: {
            paqueteBase: true,
            zona: true,
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
  
    return pedido;
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

    if(pedido.estadoId != 1){
      throw new CustomError('El pedido tiene que estar pendiente para poder bajarse');
    }
  
    await this.prisma.pedido.delete({
      where: { id_pedido: pedido.id_pedido },
    });
  
    return { ok: true };
  }
}