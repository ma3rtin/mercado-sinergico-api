import { PaqueteBase, Prisma } from '../../prisma/generated/client';

export interface IPaqueteBaseRepository {
    getAll(): Promise<PaqueteBase[]>;
    getById(id: number): Promise<PaqueteBase | null>;
    create(data: Prisma.PaqueteBaseCreateInput): Promise<PaqueteBase>;
    update(id: number, data: Prisma.PaqueteBaseUpdateInput): Promise<PaqueteBase>;
    delete(id: number): Promise<PaqueteBase>;
    addProducts(paqueteId: number, productIds: number[]): Promise<void>;
    getWithFullProducts(id: number): Promise<PaqueteBase | null>;
}
