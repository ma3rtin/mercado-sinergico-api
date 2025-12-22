import { PrismaClient, Pedido, EstadoPedido } from '@prisma/client';
import { IPedidoRepository, IEstadoPedidoRepository } from '../interfaces/IOrderRepository';

export class PrismaPedidoRepository implements IPedidoRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<Pedido[]> {
        return this.prisma.pedido.findMany();
    }

    async getById(id: number): Promise<Pedido | null> {
        return this.prisma.pedido.findUnique({ where: { id_pedido: id } });
    }

    async create(data: any): Promise<Pedido> {
        return this.prisma.pedido.create({ data });
    }

    async update(id: number, data: any): Promise<Pedido> {
        return this.prisma.pedido.update({ where: { id_pedido: id }, data });
    }

    async delete(id: number): Promise<Pedido> {
        return this.prisma.pedido.delete({ where: { id_pedido: id } });
    }

    async findByUserId(userId: number): Promise<Pedido[]> {
        return this.prisma.pedido.findMany({
            where: { usuarioId: userId },
            include: {
                detalles: {
                    include: {
                        producto: {
                            include: {
                                marca: true,
                                imagenes: { take: 1 }
                            }
                        }
                    }
                },
                paquetePublicado: {
                    include: {
                        paqueteBase: {
                            include: {
                                marca: true,
                                categoria: true
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

    async findPending(userId: number, paqueteId: number): Promise<Pedido | null> {
        return this.prisma.pedido.findFirst({
            where: {
                usuarioId: userId,
                paquetePublicadoId: paqueteId,
                estadoId: 1
            },
            include: { detalles: true }
        });
    }

    async createWithDetails(data: any): Promise<Pedido> {
        return this.prisma.pedido.create({
            data,
            include: {
                detalles: { include: { producto: true } },
                paquetePublicado: { include: { paqueteBase: true } }
            }
        });
    }

    async updateWithDetails(id: number, data: any): Promise<Pedido> {
        return this.prisma.pedido.update({
            where: { id_pedido: id },
            data,
            include: {
                detalles: { include: { producto: true } },
                paquetePublicado: { include: { paqueteBase: true } }
            }
        });
    }

    async getWithDetails(id: number): Promise<Pedido | null> {
        return this.prisma.pedido.findUnique({
            where: { id_pedido: id },
            include: {
                detalles: {
                    include: {
                        producto: {
                            include: {
                                marca: true,
                                imagenes: true,
                                categoria: true
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
                                productos: {
                                    include: { producto: true }
                                }
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
                }
            }
        });
    }
}

export class PrismaEstadoPedidoRepository implements IEstadoPedidoRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<EstadoPedido[]> {
        return this.prisma.estadoPedido.findMany();
    }

    async getById(id: number): Promise<EstadoPedido | null> {
        return this.prisma.estadoPedido.findUnique({ where: { id_estado: id } });
    }

    async create(data: any): Promise<EstadoPedido> {
        return this.prisma.estadoPedido.create({ data });
    }

    async update(id: number, data: any): Promise<EstadoPedido> {
        return this.prisma.estadoPedido.update({ where: { id_estado: id }, data });
    }

    async delete(id: number): Promise<EstadoPedido> {
        return this.prisma.estadoPedido.delete({ where: { id_estado: id } });
    }

    async findByName(name: string): Promise<EstadoPedido | null> {
        return this.prisma.estadoPedido.findUnique({ where: { nombre: name } });
    }
}
