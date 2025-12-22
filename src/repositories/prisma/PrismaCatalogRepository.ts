import { PrismaClient, Producto, Marca, Categoria, Plantilla, Caracteristica, Opcion, ProductoImagen } from '@prisma/client';
import {
    IProductoRepository,
    IMarcaRepository,
    ICategoriaRepository,
    IPlantillaRepository,
    ICaracteristicaRepository,
    IOpcionRepository,
    IProductoImagenRepository
} from '../interfaces/ICatalogRepository';

export class PrismaProductoRepository implements IProductoRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<Producto[]> {
        return this.prisma.producto.findMany();
    }
    async getById(id: number): Promise<Producto | null> {
        return this.prisma.producto.findUnique({ where: { id_producto: id } });
    }
    async create(data: any): Promise<Producto> {
        return this.prisma.producto.create({ data });
    }
    async update(id: number, data: any): Promise<Producto> {
        return this.prisma.producto.update({ where: { id_producto: id }, data });
    }
    async delete(id: number): Promise<Producto> {
        return this.prisma.producto.delete({ where: { id_producto: id } });
    }
    async findByCategory(categoryId: number): Promise<Producto[]> {
        return this.prisma.producto.findMany({ where: { categoria_id: categoryId } });
    }
    async findByBrand(brandId: number): Promise<Producto[]> {
        return this.prisma.producto.findMany({ where: { marca_id: brandId } });
    }
    async findAll(params?: { name?: string, skip?: number, take?: number }): Promise<Producto[]> {
        const { name, skip, take } = params || {};
        return this.prisma.producto.findMany({
            where: name ? { nombre: { contains: name } } : undefined,
            include: {
                categoria: true,
                marca: true,
                imagenes: true,
            },
            skip,
            take,
            orderBy: { id_producto: 'asc' },
        });
    }

    async deleteWithRelations(id: number): Promise<Producto> {
        return this.prisma.$transaction(async (tx: any) => {
            await tx.paqueteBaseProducto.deleteMany({ where: { productoId: id } });
            await tx.productoImagen.deleteMany({ where: { productoId: id } });
            return tx.producto.delete({ where: { id_producto: id } });
        });
    }

    async duplicate(id: number): Promise<Producto> {
        const producto = await this.prisma.producto.findUnique({
            where: { id_producto: id },
            include: { imagenes: true },
        });

        if (!producto) {
            throw new Error('Producto no encontrado');
        }

        return this.prisma.producto.create({
            data: {
                nombre: `${producto.nombre} (Copia)`,
                descripcion: producto.descripcion,
                precio: producto.precio,
                peso: producto.peso,
                altura: producto.altura,
                ancho: producto.ancho,
                profundidad: producto.profundidad,
                stock: producto.stock,
                imagen_url: producto.imagen_url,
                categoria: { connect: { id_categoria: producto.categoria_id } },
                marca: { connect: { id_marca: producto.marca_id } },
                imagenes: {
                    create: producto.imagenes.map((img: any) => ({ url: img.url })),
                },
            },
            include: { imagenes: true },
        });
    }
}

export class PrismaMarcaRepository implements IMarcaRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<Marca[]> {
        return this.prisma.marca.findMany();
    }
    async getById(id: number): Promise<Marca | null> {
        return this.prisma.marca.findUnique({ where: { id_marca: id } });
    }
    async create(data: any): Promise<Marca> {
        return this.prisma.marca.create({ data });
    }
    async update(id: number, data: any): Promise<Marca> {
        return this.prisma.marca.update({ where: { id_marca: id }, data });
    }
    async delete(id: number): Promise<Marca> {
        return this.prisma.marca.delete({ where: { id_marca: id } });
    }
    async findByName(name: string): Promise<Marca | null> {
        return this.prisma.marca.findUnique({ where: { nombre: name } });
    }
}

export class PrismaCategoriaRepository implements ICategoriaRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<Categoria[]> {
        return this.prisma.categoria.findMany();
    }
    async getById(id: number): Promise<Categoria | null> {
        return this.prisma.categoria.findUnique({ where: { id_categoria: id } });
    }
    async create(data: any): Promise<Categoria> {
        return this.prisma.categoria.create({ data });
    }
    async update(id: number, data: any): Promise<Categoria> {
        return this.prisma.categoria.update({ where: { id_categoria: id }, data });
    }
    async delete(id: number): Promise<Categoria> {
        return this.prisma.categoria.delete({ where: { id_categoria: id } });
    }
    async findByName(name: string): Promise<Categoria | null> {
        // 'nombre' is not unique in schema possibly? Helper shows findFirst usually if not unique. Schema calls Categoria.nombre String.
        return this.prisma.categoria.findFirst({ where: { nombre: name } });
    }
}

export class PrismaPlantillaRepository implements IPlantillaRepository {
    private prisma = new PrismaClient();
    async getAll(): Promise<Plantilla[]> { return this.prisma.plantilla.findMany(); }
    async getById(id: number): Promise<Plantilla | null> { return this.prisma.plantilla.findUnique({ where: { id } }); }
    async create(data: any): Promise<Plantilla> { return this.prisma.plantilla.create({ data }); }
    async update(id: number, data: any): Promise<Plantilla> { return this.prisma.plantilla.update({ where: { id }, data }); }
    async delete(id: number): Promise<Plantilla> { return this.prisma.plantilla.delete({ where: { id } }); }
}

export class PrismaCaracteristicaRepository implements ICaracteristicaRepository {
    private prisma = new PrismaClient();
    async getAll(): Promise<Caracteristica[]> { return this.prisma.caracteristica.findMany(); }
    async getById(id: number): Promise<Caracteristica | null> { return this.prisma.caracteristica.findUnique({ where: { id } }); }
    async create(data: any): Promise<Caracteristica> { return this.prisma.caracteristica.create({ data }); }
    async update(id: number, data: any): Promise<Caracteristica> { return this.prisma.caracteristica.update({ where: { id }, data }); }
    async delete(id: number): Promise<Caracteristica> { return this.prisma.caracteristica.delete({ where: { id } }); }
}

export class PrismaOpcionRepository implements IOpcionRepository {
    private prisma = new PrismaClient();
    async getAll(): Promise<Opcion[]> { return this.prisma.opcion.findMany(); }
    async getById(id: number): Promise<Opcion | null> { return this.prisma.opcion.findUnique({ where: { id } }); }
    async create(data: any): Promise<Opcion> { return this.prisma.opcion.create({ data }); }
    async update(id: number, data: any): Promise<Opcion> { return this.prisma.opcion.update({ where: { id }, data }); }
    async delete(id: number): Promise<Opcion> { return this.prisma.opcion.delete({ where: { id } }); }
}

export class PrismaProductoImagenRepository implements IProductoImagenRepository {
    private prisma = new PrismaClient();
    async getAll(): Promise<ProductoImagen[]> { return this.prisma.productoImagen.findMany(); }
    async getById(id: number): Promise<ProductoImagen | null> { return this.prisma.productoImagen.findUnique({ where: { id } }); }
    async create(data: any): Promise<ProductoImagen> { return this.prisma.productoImagen.create({ data }); }
    async update(id: number, data: any): Promise<ProductoImagen> { return this.prisma.productoImagen.update({ where: { id }, data }); }
    async delete(id: number): Promise<ProductoImagen> { return this.prisma.productoImagen.delete({ where: { id } }); }
    async findByProductId(productId: number): Promise<ProductoImagen[]> {
        return this.prisma.productoImagen.findMany({ where: { productoId: productId } });
    }
}
