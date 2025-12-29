import { PrismaClient, PaquetePublicado, Prisma } from '../../prisma/generated/client';
import { IPaquetePublicadoRepository } from '../interfaces/IPaquetePublicadoRepository';
import { prisma } from '../prisma/client';

export class PaquetePublicadoRepository implements IPaquetePublicadoRepository {
    private prisma: PrismaClient = prisma;

    async getAll(): Promise<PaquetePublicado[]> {
        return this.prisma.paquetePublicado.findMany({
            include: {
                paqueteBase: {
                    include: {
                        marca: true,
                        categoria: true,
                    },
                },
                zona: true,
                estado: true,
                pedidos: true,
            },
        });
    }

    async getById(id: number): Promise<PaquetePublicado | null> {
        return this.prisma.paquetePublicado.findUnique({
            where: { id_paquete_publicado: id },
            include: {
                paqueteBase: {
                    include: {
                        marca: true,
                        categoria: true,
                        productos: {
                            include: {
                                producto: {
                                    include: {
                                        imagenes: true,
                                    },
                                },
                            },
                        },
                    },
                },
                zona: true,
                estado: true,
                pedidos: true,
            },
        });
    }

    async countByProductId(productId: number): Promise<number> {
        return this.prisma.paquetePublicado.count({
            where: { paqueteBase: { productos: { some: { productoId: productId } } } },
        });
    }

    async getByZonas(zonaIds: number[]): Promise<PaquetePublicado[]> {
        return this.prisma.paquetePublicado.findMany({
            where: {
                zonaId: { in: zonaIds },
                estado: { nombre: 'Activo' },
            },
            include: {
                paqueteBase: {
                    include: {
                        marca: true,
                        categoria: true,
                        productos: {
                            include: {
                                producto: {
                                    include: {
                                        imagenes: true,
                                    },
                                },
                            },
                        },
                    },
                },
                zona: true,
                estado: true,
            },
        });
    }

    async getByProductId(productId: number): Promise<PaquetePublicado[]> {
        return this.prisma.paquetePublicado.findMany({
            where: {
                paqueteBase: {
                    productos: {
                        some: {
                            productoId: productId,
                        },
                    },
                },
                estado: { nombre: 'Activo' },
            },
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
        });
    }

    async create(data: Prisma.PaquetePublicadoCreateInput): Promise<PaquetePublicado> {
        return this.prisma.paquetePublicado.create({
            data,
            include: {
                paqueteBase: true,
                zona: true,
                estado: true,
            },
        });
    }

    async update(id: number, data: Prisma.PaquetePublicadoUpdateInput): Promise<PaquetePublicado> {
        return this.prisma.paquetePublicado.update({
            where: { id_paquete_publicado: id },
            data,
            include: {
                paqueteBase: true,
                zona: true,
                estado: true,
            },
        });
    }

    async getPorCerrarse(startDate: Date, endDate: Date): Promise<PaquetePublicado[]> {
        return this.prisma.paquetePublicado.findMany({
            where: {
                estado: {
                    nombre: { in: ['Activo', 'Pendiente'] },
                },
                fecha_fin: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                paqueteBase: {
                    include: {
                        marca: true,
                        categoria: true,
                    },
                },
                zona: {
                    select: { nombre: true, id_zona: true },
                },
                estado: {
                    select: { nombre: true, id_estado: true },
                },
                pedidos: true,
            },
            orderBy: { fecha_fin: 'asc' },
        });
    }

    async getCandidates(excludeId: number): Promise<PaquetePublicado[]> {
        return this.prisma.paquetePublicado.findMany({
            where: {
                id_paquete_publicado: { not: excludeId },
                estado: { nombre: { in: ['Activo', 'Abierto'] } },
            },
            include: {
                paqueteBase: {
                    include: {
                        marca: true,
                        categoria: true,
                    },
                },
                zona: true,
                estado: true,
                pedidos: true,
            },
        });
    }
}
