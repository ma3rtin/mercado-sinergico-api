import { prisma } from '../prisma/client';
import { CustomError } from '../errors/custom.error';
import { SumarseDTO } from '../dtos/pedido/sumarse.dto';
import { MercadoPagoService } from '../payments/mercadopago/mercadopago.service';
import { Prisma } from '../../prisma/generated/client';

export class PedidoService {
  private prisma = prisma;

  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

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
      throw new CustomError('Paquete no encontrado', 404);
    }

    if (paquete.estado.nombre !== 'Activo') {
      throw new CustomError('El paquete no está activo', 400);
    }

    const productoEnPaquete = paquete.paqueteBase.productos.find(
      (p) => p.productoId === productoAComprar.productoId
    );

    if (!productoEnPaquete) {
      throw new CustomError('El producto no pertenece a este paquete', 400);
    }

    const producto = productoEnPaquete.producto;

    if (producto.stock && producto.stock < productoAComprar.cantidad) {
      throw new CustomError('Stock insuficiente', 400);
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
        createdAt: 'desc',
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
      throw new CustomError('Pedido no encontrado', 404);
    }

    if (pedido.usuarioId !== usuarioId) {
      throw new CustomError('No tienes permiso para ver este pedido', 403);
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
        'No tenés un pedido pendiente en este paquete',
        404
      );
    }

    if (pedido.estadoId > 2) {
      throw new CustomError('Este pedido ya no se puede cancelar', 400);
    }

    const resultado = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      await prisma.pedidoDetalle.deleteMany({
        where: { pedidoId: pedido.id_pedido },
      });

      const pedidoEliminado = await prisma.pedido.delete({
        where: { id_pedido: pedido.id_pedido },
      });

      return pedidoEliminado;
    });

    return {
      message: 'Baja de pedido exitosa',
      pedidoEliminado: resultado,
    };
  }

  public async eliminarProducto(
    userId: number,
    pedidoId: number,
    productoId: number
  ) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id_pedido: pedidoId,
        usuarioId: userId,
        estadoId: { in: [1, 2] },
      },
      include: {
        detalles: true,
      },
    });

    if (!pedido) {
      throw new CustomError(
        'Pedido no encontrado o no se puede modificar',
        404
      );
    }

    const detalle = pedido.detalles.find((d) => d.productoId === productoId);

    if (!detalle) {
      throw new CustomError('Producto no encontrado en el pedido', 404);
    }

    const resultado = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      await prisma.pedidoDetalle.delete({
        where: { id: detalle.id },
      });

      const detallesRestantes = await prisma.pedidoDetalle.count({
        where: { pedidoId: pedidoId },
      });

      if (detallesRestantes === 0) {
        await prisma.pedido.delete({
          where: { id_pedido: pedidoId },
        });
        return null;
      }

      const nuevoMontoTotal = await prisma.pedidoDetalle.aggregate({
        where: { pedidoId: pedidoId },
        _sum: { subtotal: true },
      });

      const pedidoActualizado = await prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: {
          monto_total: nuevoMontoTotal._sum.subtotal || 0,
        },
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
              paqueteBase: true,
            },
          },
          estado: true,
        },
      });

      return pedidoActualizado;
    });

    return resultado;
  }

  public async actualizarCantidad(
    userId: number,
    pedidoId: number,
    productoId: number,
    nuevaCantidad: number
  ) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id_pedido: pedidoId,
        usuarioId: userId,
        estadoId: { in: [1, 2] },
      },
      include: {
        detalles: true,
        paquetePublicado: {
          include: {
            paqueteBase: {
              include: {
                productos: {
                  include: { producto: true },
                },
              },
            },
          },
        },
      },
    });

    if (!pedido) {
      throw new CustomError(
        'Pedido no encontrado o no se puede modificar',
        404
      );
    }

    const detalle = pedido.detalles.find((d) => d.productoId === productoId);

    if (!detalle) {
      throw new CustomError('Producto no encontrado en el pedido', 404);
    }

    const producto = pedido.paquetePublicado.paqueteBase.productos.find(
      (p) => p.productoId === productoId
    )?.producto;

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }

    if (producto.stock && producto.stock < nuevaCantidad) {
      throw new CustomError('Stock insuficiente', 400);
    }

    const descuento = pedido.paquetePublicado.descuento || 0;
    const precioConDescuento = producto.precio * (1 - descuento / 100);
    const nuevoSubtotal = precioConDescuento * nuevaCantidad;

    await this.prisma.pedidoDetalle.update({
      where: { id: detalle.id },
      data: {
        cantidad: nuevaCantidad,
        subtotal: nuevoSubtotal,
      },
    });

    const nuevoMontoTotal = await this.prisma.pedidoDetalle.aggregate({
      where: { pedidoId: pedidoId },
      _sum: { subtotal: true },
    });

    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id_pedido: pedidoId },
      data: {
        monto_total: nuevoMontoTotal._sum.subtotal || 0,
      },
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
            paqueteBase: true,
          },
        },
        estado: true,
      },
    });

    return pedidoActualizado;
  }
  
  public async iniciarPago(pedidoId: number, usuarioId: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: pedidoId },
      include: {
        usuario: true,
        paquetePublicado: {
          include: {
            paqueteBase: {
              include: {
                productos: {
                  include: { producto: true },
                },
              },
            },
          },
        },
        detalles: {
          include: { producto: true },
        },
      },
    });

    if (!pedido) {
      throw new CustomError('Pedido no encontrado', 404);
    }

    if (pedido.usuarioId !== usuarioId) {
      throw new CustomError('No tienes permiso para pagar este pedido', 403);
    }

    if (pedido.estadoId !== 1) {
      throw new CustomError('Este pedido no puede pagarse', 400);
    }

    const paquete = pedido.paquetePublicado;
    const capacidadTotal = paquete.cant_productos || 0;
    const yaReservados = paquete.cant_productos_reservados || 0;
    
    const productosDelPedido = pedido.detalles.reduce(
      (total, detalle) => total + detalle.cantidad,
      0
    );
    
    const disponibles = capacidadTotal - yaReservados;
    
    if (productosDelPedido > disponibles) {
      throw new CustomError(
        `No hay suficiente capacidad en el paquete. Disponibles: ${disponibles}, solicitados: ${productosDelPedido}`,
        400
      );
    }

    for (const detalle of pedido.detalles) {
      const productoInfo = paquete.paqueteBase.productos.find(
        (p) => p.productoId === detalle.productoId
      )?.producto;

      if (!productoInfo) {
        throw new CustomError(
          `Producto ${detalle.producto.nombre} no encontrado en el paquete`,
          400
        );
      }

      if (productoInfo.stock && productoInfo.stock < detalle.cantidad) {
        throw new CustomError(
          `Stock insuficiente para ${detalle.producto.nombre}. Disponible: ${productoInfo.stock}, solicitado: ${detalle.cantidad}`,
          400
        );
      }
    }

    const titulo = `Paquete ${pedido.paquetePublicado.paqueteBase.nombre}`;
    const precioTotal = pedido.monto_total;

    const preference = await this.mercadoPagoService.crearPreferencia({
      pedidoId,
      titulo,
      precioTotal,
    });

    return preference;
  }

  public async confirmarPago(paymentId: number) {
    const pago = await this.mercadoPagoService.obtenerPago(paymentId);

    const status = pago.status;
    const pedidoId = Number(pago.external_reference);

    if (!pedidoId) {
      console.error('No se pudo obtener el pedidoId desde external_reference');
      return;
    }

    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: pedidoId },
      include: {
        detalles: true,
        paquetePublicado: true,
      },
    });

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (status === 'approved') {
      const totalProductos = pedido.detalles.reduce(
        (sum, detalle) => sum + detalle.cantidad,
        0
      );

      const yaPagoAntes = await this.prisma.pedido.findFirst({
        where: {
          usuarioId: pedido.usuarioId,
          paquetePublicadoId: pedido.paquetePublicadoId,
          id_pedido: { not: pedidoId },
        },
      });

      await this.prisma.$transaction(async (prisma) => {
        await prisma.paquetePublicado.update({
          where: { id_paquete_publicado: pedido.paquetePublicadoId },
          data: {
            cant_usuarios_registrados: yaPagoAntes
              ? undefined
              : { increment: 1 },
            
            cant_productos_reservados: { increment: totalProductos },
          },
        });

        await prisma.pedido.update({
          where: { id_pedido: pedidoId },
          data: {
            estadoId: 3, // pagado
          },
        });
      });

      console.log(`✅ Pago confirmado para pedido ${pedidoId}`);
      console.log(`   - Productos reservados: +${totalProductos}`);
      console.log(`   - Usuario nuevo en paquete: ${!yaPagoAntes ? 'SÍ' : 'NO'}`);
    }

    if (status === 'rejected') {
      await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: {
          estadoId: 4, // rechazado
        },
      });
      console.log(`❌ Pago rechazado para pedido ${pedidoId}`);
    }

    if (status === 'pending') {
      await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: {
          estadoId: 2, // pendiente
        },
      });
      console.log(`⏳ Pago pendiente para pedido ${pedidoId}`);
    }

    return { pedidoId, status };
  }
}