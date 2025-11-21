import { ProductoDTO } from '../dtos/producto.dto';
import type { Prisma, Producto } from '../../prisma/generated/client';
import { prisma } from '../prisma/client';
import { CustomError } from '../errors/custom.error';

export class ProductoService {
  private prisma = prisma;

  public async getAll(name?: string, skip = 0, take = 10): Promise<Producto[]> {
    return this.prisma.producto.findMany({
      where: name
        ? { nombre: { contains: name } }
        : undefined,
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

  public async getById(id: number): Promise<Producto | null> {
    const producto = await this.prisma.producto.findUnique({
      where: { id_producto: id },
      include: { categoria: true, marca: true, imagenes: true },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }

    return producto;
  }

  public async create(producto: ProductoDTO): Promise<Producto> {
    const { categoria_id, marca_id, imagenes, plantillaId, ...rest } = producto;

    const categoria = await this.prisma.categoria.findUnique({
      where: { id_categoria: categoria_id },
    });

    if (!categoria) {
      throw new CustomError('Categoria no encontrada', 404);
    }

    return this.prisma.producto.create({
      data: {
        ...rest,
        categoria: { connect: { id_categoria: categoria_id } },
        marca: { connect: { id_marca: marca_id } },
        plantilla: plantillaId
          ? { connect: { id: plantillaId } }
          : undefined,
        imagenes: {
          create: imagenes?.map((url) => ({ url })) || [],
        },
      },
      include: { imagenes: true, categoria: true, marca: true },
    });
  }

  public async update(id: number, producto: ProductoDTO) {
    const { categoria_id, marca_id, imagenes, ...rest } = producto;

    const data: Prisma.ProductoUpdateInput = {
      ...rest,
      categoria: categoria_id
        ? { connect: { id_categoria: categoria_id } }
        : undefined,
      marca: marca_id
        ? { connect: { id_marca: marca_id } }
        : undefined,
    };

    if (imagenes) {
      data.imagenes = {
        deleteMany: {},
        create: imagenes.map((url) => ({ url })),
      };
    }

    return this.prisma.producto.update({
      where: { id_producto: id },
      data,
      include: { imagenes: true },
    });
  }

  public async delete(id: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.paqueteBaseProducto.deleteMany({ where: { productoId: id } });
      await tx.productoImagen.deleteMany({ where: { productoId: id } });

      return tx.producto.delete({ where: { id_producto: id } });
    });
  }

  public async duplicarProducto(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id_producto: id },
      include: { imagenes: true },
    });

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
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
          create: producto.imagenes.map((img) => ({ url: img.url })),
        },
      },
      include: { imagenes: true },
    });
  }
}
