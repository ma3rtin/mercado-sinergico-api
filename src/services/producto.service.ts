import { ProductoDTO } from '../dtos/producto.dto';
import { PrismaClient, Producto } from '../generated/prisma';

export class ProductoService {
  private prisma = new PrismaClient();

  public async getAll(name?: string, skip = 0, take = 10): Promise<Producto[]> {
    try {
      const productos = await this.prisma.producto.findMany({
        where: name
          ? {
              nombre: {
                contains: name,
              },
            }
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

      return productos;
    } catch (error) {
      throw error;
    }
  }

  public async getById(id: number): Promise<Producto | null> {
    try {
      const producto = await this.prisma.producto.findUnique({
        where: { id_producto: id },
        include: { categoria: true, marca: true, imagenes: true },
      });
      return producto;
    } catch (error) {
      throw error;
    }
  }

  public async create(producto: ProductoDTO): Promise<Producto> {
    const {
      nombre,
      descripcion,
      precio,
      marca_id,
      peso,
      altura,
      ancho,
      profundidad,
      categoria_id,
      imagen_url,
      imagenes,
      stock,
      plantillaId,
    } = producto;

    try {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id_categoria: categoria_id },
      });

      if (!categoria) {
        throw new Error('Categoria no encontrada');
      }

      const newProducto = await this.prisma.producto.create({
        data: {
          nombre,
          descripcion,
          precio,
          peso,
          altura,
          ancho,
          profundidad,
          stock,
          imagen_url,
          categoria: { connect: { id_categoria: categoria_id } },
          marca: { connect: { id_marca: marca_id } },
          plantilla: plantillaId ? { connect: { id: plantillaId } } : undefined,
          imagenes: {
            create: imagenes?.map((url) => ({ url })) || [],
          },
        },
        include: { imagenes: true, categoria: true, marca: true },
      });

      return newProducto;
    } catch (error) {
      throw error;
    }
  }

  public async update(id: number, producto: ProductoDTO) {
    try {
      const {
        nombre,
        descripcion,
        precio,
        marca_id,
        peso,
        altura,
        ancho,
        profundidad,
        categoria_id,
        imagen_url,
        imagenes,
      } = producto;

      const data: any = {
        nombre,
        descripcion,
        precio,
        peso,
        altura,
        ancho,
        profundidad,
        imagen_url,
        categoria: categoria_id
          ? { connect: { id_categoria: categoria_id } }
          : undefined,
        marca: marca_id ? { connect: { id_marca: marca_id } } : undefined,
      };

      if (imagenes) {
        data.imagenes = {
          deleteMany: {},
          create: imagenes.map((url) => ({ url })),
        };
      }

      const updated = await this.prisma.producto.update({
        where: { id_producto: id },
        data,
        include: { imagenes: true },
      });
      return updated;
    } catch (error) {
      throw error;
    }
  }

  public async delete(id: number) {
    try {
      // Borra registros relacionados y luego el producto en una transacción
      const deleted = await this.prisma.$transaction(async (tx) => {
        // Borrar relaciones many-to-many / children que referencian producto
        await tx.paqueteBaseProducto.deleteMany({
          where: { productoId: id },
        });

        await tx.productoImagen.deleteMany({
          where: { productoId: id },
        });

        // Finalmente borrar el producto
        const prodDeleted = await tx.producto.delete({
          where: { id_producto: id },
        });

        return prodDeleted;
      });

      return deleted;
    } catch (error) {
      throw error;
    }
  }
  public async duplicarProducto(id: number) {
    try {
      const producto = await this.prisma.producto.findUnique({
        where: { id_producto: id },
        include: { imagenes: true },
      });
      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      const duplicado = await this.prisma.producto.create({
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
            create: producto.imagenes.map((imagen) => ({ url: imagen.url })),
          },
        },
        include: { imagenes: true },
      });

      return duplicado;
    } catch (error) {
      throw error;
    }
  }
}
