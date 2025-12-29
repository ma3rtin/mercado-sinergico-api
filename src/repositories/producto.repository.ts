import { PrismaClient, Producto, Prisma } from '../../prisma/generated/client';
import { IProductoRepository } from '../interfaces/IProductoRepository';
import { prisma } from '../prisma/client';

export class ProductoRepository implements IProductoRepository {
    private prisma: PrismaClient = prisma;

    async getAll(name?: string, skip = 0, take = 10): Promise<Producto[]> {
        return this.prisma.producto.findMany({
            where: name ? { nombre: { contains: name } } : undefined,
            include: {
                categoria: true,
                marca: true,
            },
            skip,
            take,
            orderBy: { id_producto: 'asc' },
        });
    }

    async getById(id: number): Promise<Producto | null> {
        return this.prisma.producto.findUnique({
            where: { id_producto: id },
            include: { categoria: true, marca: true, imagenes: true },
        });
    }

    async create(data: Prisma.ProductoCreateInput): Promise<Producto> {
        return this.prisma.producto.create({
            data,
            include: { imagenes: true, categoria: true, marca: true },
        });
    }

    async update(id: number, data: Prisma.ProductoUpdateInput): Promise<Producto> {
        return this.prisma.producto.update({
            where: { id_producto: id },
            data,
            include: { imagenes: true },
        });
    }

    async delete(id: number): Promise<Producto> {
        return this.deleteWithDependencies(id);
    }

    async deleteWithDependencies(id: number): Promise<Producto> {
        return this.prisma.$transaction(async (tx) => {
            await tx.paqueteBaseProducto.deleteMany({ where: { productoId: id } });
            await tx.productoImagen.deleteMany({ where: { productoId: id } });

            return tx.producto.delete({ where: { id_producto: id } });
        });
    }
}
