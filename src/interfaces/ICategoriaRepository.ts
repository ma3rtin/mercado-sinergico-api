import { Categoria, Prisma } from '../../prisma/generated/client';

export interface ICategoriaRepository {
    getAll(): Promise<Categoria[]>;
    getById(id: number): Promise<Categoria | null>;
    create(data: Prisma.CategoriaCreateInput): Promise<Categoria>;
}
