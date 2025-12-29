import { PrismaClient, PaqueteBase, Prisma } from '../../prisma/generated/client';
import { IPaqueteBaseRepository } from '../interfaces/IPaqueteBaseRepository';
import { prisma } from '../prisma/client';

export class PaqueteBaseRepository implements IPaqueteBaseRepository {
    private prisma: PrismaClient = prisma;

    async getAll(): Promise<PaqueteBase[]> {
        return this.prisma.paqueteBase.findMany({
            include: {
                categoria: true,
                marca: true,
                productos: {
                    include: {
                        producto: true,
                    },
                },
            },
        });
    }

    async getById(id: number): Promise<PaqueteBase | null> {
        return this.prisma.paqueteBase.findUnique({
            where: { id_paquete_base: id },
            include: {
                categoria: true,
                marca: true,
                productos: {
                    include: {
                        producto: true,
                    },
                },
            },
        });
    }

    async create(data: Prisma.PaqueteBaseCreateInput): Promise<PaqueteBase> {
        return this.prisma.paqueteBase.create({
            data,
            include: {
                categoria: true,
                marca: true,
            },
        });
    }

    async update(id: number, data: Prisma.PaqueteBaseUpdateInput): Promise<PaqueteBase> {
        return this.prisma.paqueteBase.update({
            where: { id_paquete_base: id },
            data,
            include: {
                categoria: true,
                marca: true,
            },
        });
    }

    async delete(id: number): Promise<PaqueteBase> {
        return this.prisma.paqueteBase.delete({
            where: { id_paquete_base: id },
        });
    }

    async addProducts(paqueteId: number, productIds: number[]): Promise<void> {
        await this.prisma.paqueteBaseProducto.createMany({
            data: productIds.map((id) => ({
                paqueteBaseId: paqueteId,
                productoId: id,
            })),
        });
    }

    async getWithFullProducts(id: number): Promise<PaqueteBase | null> {
        return this.prisma.paqueteBase.findUnique({
            where: { id_paquete_base: id },
            include: {
                productos: {
                    include: {
                        producto: {
                            include: {
                                categoria: true,
                                marca: true,
                                imagenes: true,
                            },
                        },
                    },
                },
            },
        });
    }
}
