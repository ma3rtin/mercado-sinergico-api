import { PrismaClient, Direccion, Prisma } from '../../prisma/generated/client';
import { IDireccionRepository } from '../interfaces/IDireccionRepository';
import { prisma } from '../prisma/client';

export class DireccionRepository implements IDireccionRepository {
    private prisma: PrismaClient = prisma;

    async create(data: Prisma.DireccionCreateInput): Promise<Direccion> {
        return this.prisma.direccion.create({
            data,
            include: {
                localidad: true,
            },
        });
    }

    async getAll(): Promise<Direccion[]> {
        return this.prisma.direccion.findMany({
            include: {
                localidad: true,
            },
        });
    }

    async getById(id: number): Promise<Direccion | null> {
        return this.prisma.direccion.findUnique({
            where: { id },
            include: {
                localidad: true,
            },
        });
    }

    async update(id: number, data: Prisma.DireccionUpdateInput): Promise<Direccion> {
        return this.prisma.direccion.update({
            where: { id },
            data,
            include: {
                localidad: true,
            },
        });
    }

    async delete(id: number): Promise<Direccion> {
        return this.prisma.direccion.delete({
            where: { id },
        });
    }
}
