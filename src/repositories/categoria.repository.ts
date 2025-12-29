import { PrismaClient, Categoria, Prisma } from '../../prisma/generated/client';
import { ICategoriaRepository } from '../interfaces/ICategoriaRepository';
import { prisma } from '../prisma/client';

export class CategoriaRepository implements ICategoriaRepository {
    private prisma: PrismaClient = prisma;

    async getAll(): Promise<Categoria[]> {
        return this.prisma.categoria.findMany();
    }

    async getById(id: number): Promise<Categoria | null> {
        return this.prisma.categoria.findUnique({
            where: { id_categoria: id },
        });
    }

    async create(data: Prisma.CategoriaCreateInput): Promise<Categoria> {
        return this.prisma.categoria.create({ data });
    }
}
