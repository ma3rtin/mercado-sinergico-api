import { PrismaClient, Marca, Prisma } from '../../prisma/generated/client';
import { IMarcaRepository } from '../interfaces/IMarcaRepository';
import { prisma } from '../prisma/client';

export class MarcaRepository implements IMarcaRepository {
    private prisma: PrismaClient = prisma;

    async getAll(): Promise<Marca[]> {
        return this.prisma.marca.findMany();
    }

    async getById(id: number): Promise<Marca | null> {
        return this.prisma.marca.findUnique({
            where: { id_marca: id },
        });
    }

    async create(data: Prisma.MarcaCreateInput): Promise<Marca> {
        return this.prisma.marca.create({ data });
    }

    async update(id: number, data: Prisma.MarcaUpdateInput): Promise<Marca> {
        return this.prisma.marca.update({
            where: { id_marca: id },
            data,
        });
    }

    async delete(id: number): Promise<Marca> {
        return this.prisma.marca.delete({
            where: { id_marca: id },
        });
    }
}
