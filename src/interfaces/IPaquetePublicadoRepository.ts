import { PaquetePublicado, Prisma } from '../../prisma/generated/client';

export interface IPaquetePublicadoRepository {
    getAll(): Promise<PaquetePublicado[]>;
    getById(id: number): Promise<PaquetePublicado | null>;
    countByProductId(productId: number): Promise<number>;
    getByZonas(zonaIds: number[]): Promise<PaquetePublicado[]>;
    getByProductId(productId: number): Promise<PaquetePublicado[]>;
    create(data: Prisma.PaquetePublicadoCreateInput): Promise<PaquetePublicado>;
    update(id: number, data: Prisma.PaquetePublicadoUpdateInput): Promise<PaquetePublicado>;
    getPorCerrarse(startDate: Date, endDate: Date): Promise<PaquetePublicado[]>;
    getCandidates(excludeId: number): Promise<PaquetePublicado[]>;
}
