import { PaqueteBase, PaqueteBaseProducto, EstadoPaquetePublicado } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';

export interface IPaqueteBaseRepository extends IBaseRepository<PaqueteBase> {
    findByCategory(categoryId: number): Promise<PaqueteBase[]>;
    findAllWithProducts(): Promise<PaqueteBase[]>;
    getByIdWithProducts(id: number): Promise<PaqueteBase | null>;
    createWithProducts(data: any): Promise<PaqueteBase>;
    addProducts(data: any): Promise<PaqueteBase>;
    getProductosByPaquete(id: number): Promise<any[]>;
    updateWithCategoryCheck(id: number, data: any): Promise<PaqueteBase>;
}

export interface IPaqueteBaseProductoRepository extends IBaseRepository<PaqueteBaseProducto> {
    findByPaqueteBaseId(paqueteBaseId: number): Promise<PaqueteBaseProducto[]>;
}

export interface IEstadoPaquetePublicadoRepository extends IBaseRepository<EstadoPaquetePublicado> {
    findByName(name: string): Promise<EstadoPaquetePublicado | null>;
}
