import { Direccion, Prisma } from '../../prisma/generated/client';

export interface IDireccionRepository {
    create(data: Prisma.DireccionCreateInput): Promise<Direccion>;
    getAll(): Promise<Direccion[]>;
    getById(id: number): Promise<Direccion | null>;
    update(id: number, data: Prisma.DireccionUpdateInput): Promise<Direccion>;
    delete(id: number): Promise<Direccion>;
}
