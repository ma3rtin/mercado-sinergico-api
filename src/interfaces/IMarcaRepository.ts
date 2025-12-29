import { Marca, Prisma } from '../../prisma/generated/client';

export interface IMarcaRepository {
    getAll(): Promise<Marca[]>;
    getById(id: number): Promise<Marca | null>;
    create(data: Prisma.MarcaCreateInput): Promise<Marca>;
    update(id: number, data: Prisma.MarcaUpdateInput): Promise<Marca>;
    delete(id: number): Promise<Marca>;
}
