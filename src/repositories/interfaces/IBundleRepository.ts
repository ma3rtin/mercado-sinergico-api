import { PaqueteBase, PaqueteBaseProducto, PaquetePublicado, EstadoPaquetePublicado } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';
import { IPaquetePublicadoRepository } from './IPaquetePublicadoRepository';

export interface IPaqueteBaseRepository extends IBaseRepository<PaqueteBase> {
    findByCategory(categoryId: number): Promise<PaqueteBase[]>;
}

export interface IPaqueteBaseProductoRepository extends IBaseRepository<PaqueteBaseProducto> {
    findByPaqueteBaseId(paqueteBaseId: number): Promise<PaqueteBaseProducto[]>;
}

export interface IEstadoPaquetePublicadoRepository extends IBaseRepository<EstadoPaquetePublicado> {
    findByName(name: string): Promise<EstadoPaquetePublicado | null>;
}
