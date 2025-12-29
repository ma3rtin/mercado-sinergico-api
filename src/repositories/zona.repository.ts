import { PrismaClient, Zona, Prisma } from '../../prisma/generated/client';
import { IZonaRepository } from '../interfaces/IZonaRepository';
import { prisma } from '../prisma/client';

export class ZonaRepository implements IZonaRepository {
    private prisma: PrismaClient = prisma;

    async getAll(): Promise<Zona[]> {
        return this.prisma.zona.findMany({
            include: { localidades: true },
        });
    }

    async getById(id: number): Promise<Zona | null> {
        return this.prisma.zona.findUnique({
            where: { id_zona: id },
            include: { localidades: true },
        });
    }

    async create(data: Prisma.ZonaCreateInput): Promise<Zona> {
        return this.prisma.zona.create({
            data,
            include: { localidades: true },
        });
    }

    async update(id: number, data: Prisma.ZonaUpdateInput): Promise<Zona> {
        return this.prisma.zona.update({
            where: { id_zona: id },
            data,
            include: { localidades: true },
        });
    }

    async delete(id: number): Promise<Zona> {
        return this.prisma.zona.delete({
            where: { id_zona: id },
        });
    }

    async findByName(nombre: string): Promise<Zona | null> {
        return this.prisma.zona.findUnique({
            where: { nombre },
            include: { localidades: true },
        });
    }
}
