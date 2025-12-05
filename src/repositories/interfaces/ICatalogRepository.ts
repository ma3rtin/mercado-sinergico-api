import {
    Producto,
    Marca,
    Categoria,
    Plantilla,
    Caracteristica,
    Opcion,
    ProductoImagen
} from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';

export interface IProductoRepository extends IBaseRepository<Producto> {
    findByCategory(categoryId: number): Promise<Producto[]>;
    findByBrand(brandId: number): Promise<Producto[]>;
}

export interface IMarcaRepository extends IBaseRepository<Marca> {
    findByName(name: string): Promise<Marca | null>;
}

export interface ICategoriaRepository extends IBaseRepository<Categoria> {
    findByName(name: string): Promise<Categoria | null>;
}

export interface IPlantillaRepository extends IBaseRepository<Plantilla> { }

export interface ICaracteristicaRepository extends IBaseRepository<Caracteristica> { }

export interface IOpcionRepository extends IBaseRepository<Opcion> { }

export interface IProductoImagenRepository extends IBaseRepository<ProductoImagen> {
    findByProductId(productId: number): Promise<ProductoImagen[]>;
}
