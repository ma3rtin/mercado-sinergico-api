import { Zona, Prisma } from '../../prisma/generated/client';

export interface IZonaRepository {
    getAll(): Promise<Zona[]>;
    getById(id: number): Promise<Zona | null>;
    create(data: Prisma.ZonaCreateInput): Promise<Zona>;
    update(id: number, data: Prisma.ZonaUpdateInput): Promise<Zona>;
    delete(id: number): Promise<Zona>;
    findByName(nombre: string): Promise<Zona | null>;
}
