import { PrismaClient, Pedido, Prisma } from '../../prisma/generated/client';
import { IPedidoRepository } from '../interfaces/IPedidoRepository';
import { prisma } from '../prisma/client';
import { CustomError } from '../errors/custom.error';

export class PedidoRepository implements IPedidoRepository {
    private prisma: PrismaClient = prisma;

    async getAll(): Promise<Pedido[]> {
        return this.prisma.pedido.findMany({
            include: {
                usuario: true,
                estado: true,
                paquetePublicado: true,
                detalles: true,
            },
        });
    }

    async getById(id: number): Promise<Pedido | null> {
        return this.prisma.pedido.findUnique({
            where: { id_pedido: id },
            include: {
                detalles: {
                    include: {
                        producto: {
                            include: {
                                marca: true,
                                imagenes: true,
                                categoria: true,
                            }
                        }
                    }
                },
                paquetePublicado: {
                    include: {
                        paqueteBase: {
                            include: {
                                marca: true,
                                categoria: true,
                                productos: { include: { producto: true } }
                            }
                        },
                        zona: true,
                        estado: true
                    }
                },
                estado: true,
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        telefono: true,
                        imagen_url: true
                    }
                } // Adjusted include based on service needs
            } as any, // Cast to any to avoid strict type checks on partial includes if needed, or refine type
        });
    }

    async create(data: Prisma.PedidoCreateInput): Promise<Pedido> {
        return this.prisma.pedido.create({
            data,
            include: {
                usuario: true,
                estado: true,
                paquetePublicado: true,
                detalles: true,
            },
        });
    }

    async update(id: number, data: Prisma.PedidoUpdateInput): Promise<Pedido> {
        return this.prisma.pedido.update({
            where: { id_pedido: id },
            data,
            include: {
                usuario: true,
                estado: true,
                paquetePublicado: true,
                detalles: true,
            },
        });
    }

    async delete(id: number): Promise<Pedido> {
        return this.prisma.pedido.delete({
            where: { id_pedido: id },
        });
    }

    async getByUser(usuarioId: number): Promise<Pedido[]> {
        return this.prisma.pedido.findMany({
            where: { usuarioId },
            include: {
                detalles: {
                    include: {
                        producto: {
                            include: {
                                marca: true,
                                imagenes: true,
                            }
                        }
                    }
                },
                paquetePublicado: {
                    include: {
                        paqueteBase: {
                            include: {
                                marca: true,
                                categoria: true,
                            }
                        },
                        zona: true,
                        estado: true
                    }
                },
                estado: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findActive(userId: number, paqueteId: number): Promise<Pedido | null> {
        return this.prisma.pedido.findFirst({
            where: {
                usuarioId: userId,
                paquetePublicadoId: paqueteId,
                estadoId: 1
            },
            include: { detalles: true }
        });
    }

    async addItem(userId: number, paqueteId: number, item: { productoId: number; cantidad: number; precio: number; descuento: number }): Promise<Pedido> {
        const subtotal = item.precio * item.cantidad;

        let pedido = await this.prisma.pedido.findFirst({
            where: {
                usuarioId: userId,
                paquetePublicadoId: paqueteId,
                estadoId: 1, // Pendiente
            },
            include: { detalles: true }
        });

        if (!pedido) {
            pedido = await this.prisma.pedido.create({
                data: {
                    usuarioId: userId,
                    paquetePublicadoId: paqueteId,
                    estadoId: 1,
                    monto_total: subtotal,
                    descuento_aplicado: item.descuento,
                    detalles: {
                        create: {
                            productoId: item.productoId,
                            cantidad: item.cantidad,
                            precio_unitario: item.precio,
                            subtotal: subtotal
                        }
                    }
                },
                include: { detalles: true }
            });
        } else {
            const detalleExistente = pedido.detalles.find(d => d.productoId === item.productoId);

            if (detalleExistente) {
                const nuevaCantidad = detalleExistente.cantidad + item.cantidad;
                const nuevoSubtotal = item.precio * nuevaCantidad;

                await this.prisma.pedidoDetalle.update({
                    where: { id: detalleExistente.id },
                    data: {
                        cantidad: nuevaCantidad,
                        subtotal: nuevoSubtotal
                    }
                });
            } else {
                await this.prisma.pedidoDetalle.create({
                    data: {
                        pedidoId: pedido.id_pedido,
                        productoId: item.productoId,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio,
                        subtotal: subtotal
                    }
                });
            }
            // Update total
            const nuevoMontoTotal = await this.prisma.pedidoDetalle.aggregate({
                where: { pedidoId: pedido.id_pedido },
                _sum: { subtotal: true }
            });

            pedido = await this.prisma.pedido.update({
                where: { id_pedido: pedido.id_pedido },
                data: { monto_total: nuevoMontoTotal._sum.subtotal || 0 },
                include: { detalles: true }
            });
        }
        return this.getById(pedido.id_pedido) as Promise<Pedido>; // Return full object
    }

    async removeItem(userId: number, pedidoId: number, productoId: number): Promise<Pedido | null> {
        return this.prisma.$transaction(async (tx) => {
            const pedido = await tx.pedido.findFirst({
                where: { id_pedido: pedidoId, usuarioId: userId, estadoId: { in: [1, 2] } },
                include: { detalles: true }
            });

            if (!pedido) return null;

            const detalle = pedido.detalles.find(d => d.productoId === productoId);
            if (!detalle) throw new CustomError('Producto no encontrado en el pedido', 404);

            await tx.pedidoDetalle.delete({ where: { id: detalle.id } });

            const detallesRestantes = await tx.pedidoDetalle.count({ where: { pedidoId } });

            if (detallesRestantes === 0) {
                await tx.pedido.delete({ where: { id_pedido: pedidoId } });
                return null;
            }

            const nuevoMontoTotal = await tx.pedidoDetalle.aggregate({
                where: { pedidoId },
                _sum: { subtotal: true }
            });

            return tx.pedido.update({
                where: { id_pedido: pedidoId },
                data: { monto_total: nuevoMontoTotal._sum.subtotal || 0 },
                include: {
                    detalles: { include: { producto: { include: { marca: true, imagenes: true } } } },
                    paquetePublicado: { include: { paqueteBase: true } },
                    estado: true
                }
            });
        });
    }

    async updateItemQuantity(userId: number, pedidoId: number, productoId: number, quantity: number): Promise<Pedido> {
        // Fetch details handled in Service (stock check), here we just update
        // But we need price info. Simplification: Assume service passes needed info?
        // Or we fetch again.
        // To strictly follow pattern, logic should be here or simple atomic update.
        // Let's assume logic stays here to keep Service clean of DB calls.
        const pedido = await this.prisma.pedido.findFirst({
            where: { id_pedido: pedidoId, usuarioId: userId, estadoId: { in: [1, 2] } },
            include: { detalles: true, paquetePublicado: true }
        });

        if (!pedido) throw new CustomError('Pedido no encontrado', 404);

        const detalle = pedido.detalles.find(d => d.productoId === productoId);
        if (!detalle) throw new CustomError('Detalle no encontrado', 404);

        // Price logic? We need the unit price from detail or re-calculate.
        // Use existing detail unit price.
        const nuevoSubtotal = detalle.precio_unitario * quantity;

        await this.prisma.pedidoDetalle.update({
            where: { id: detalle.id },
            data: { cantidad: quantity, subtotal: nuevoSubtotal }
        });

        const nuevoMontoTotal = await this.prisma.pedidoDetalle.aggregate({
            where: { pedidoId },
            _sum: { subtotal: true }
        });

        return this.prisma.pedido.update({
            where: { id_pedido: pedidoId },
            data: { monto_total: nuevoMontoTotal._sum.subtotal || 0 },
            include: {
                detalles: { include: { producto: { include: { marca: true, imagenes: true } } } },
                paquetePublicado: { include: { paqueteBase: { include: { productos: { include: { producto: true } } } } } }, // Deep include needed?
                estado: true
            }
        });
    }

    async cancelOrder(userId: number, paqueteId: number): Promise<{ message: string; pedidoEliminado: Pedido }> {
        return this.prisma.$transaction(async (tx) => {
            const pedido = await tx.pedido.findFirst({
                where: {
                    usuarioId: userId,
                    paquetePublicadoId: paqueteId,
                    estadoId: 1
                },
                include: { detalles: true }
            });

            if (!pedido) throw new CustomError('No tienes pedido pendiente', 404);

            const totalReservados = pedido.detalles.reduce((sum, d) => sum + d.cantidad, 0);

            await tx.paquetePublicado.update({
                where: { id_paquete_publicado: paqueteId },
                data: { cant_productos_reservados: { decrement: totalReservados } }
            });

            await tx.pedidoDetalle.deleteMany({ where: { pedidoId: pedido.id_pedido } });
            const deleted = await tx.pedido.delete({ where: { id_pedido: pedido.id_pedido } });

            return { message: 'Baja exitosa', pedidoEliminado: deleted };
        });
    }
}
