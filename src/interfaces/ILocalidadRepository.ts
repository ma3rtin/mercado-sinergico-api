import { Localidad, Prisma } from '../../prisma/generated/client';

export interface ILocalidadRepository {
    getAll(): Promise<Localidad[]>;
    getById(id: number): Promise<Localidad | null>;
    create(data: Prisma.LocalidadCreateInput): Promise<Localidad>;
    update(id: number, data: Prisma.LocalidadUpdateInput): Promise<Localidad>;
    delete(id: number): Promise<Localidad>;
    getAllByZona(zonaId: number): Promise<{ localidad: Localidad }[]>;
}
