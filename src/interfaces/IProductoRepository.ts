import { Producto, Prisma } from '../../prisma/generated/client';
import { ProductoDTO } from '../dtos/producto/producto.dto';

export interface IProductoRepository {
    getAll(name?: string, skip?: number, take?: number): Promise<Producto[]>;
    getById(id: number): Promise<Producto | null>;
    create(data: Prisma.ProductoCreateInput): Promise<Producto>;
    update(id: number, data: Prisma.ProductoUpdateInput): Promise<Producto>;
    delete(id: number): Promise<Producto>;
    deleteWithDependencies(id: number): Promise<Producto>;
}
