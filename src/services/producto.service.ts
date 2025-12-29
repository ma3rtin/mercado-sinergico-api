import { ProductoDTO } from '../dtos/producto/producto.dto';
import { Producto, Prisma } from '../../prisma/generated/client';
import { CustomError } from '../errors/custom.error';
import { IProductoRepository } from '../interfaces/IProductoRepository';
import { IPaquetePublicadoRepository } from '../interfaces/IPaquetePublicadoRepository';
import { ICategoriaRepository } from '../interfaces/ICategoriaRepository';

export class ProductoService {
  constructor(
    private productoRepository: IProductoRepository,
    private paquetePublicadoRepository: IPaquetePublicadoRepository,
    private categoriaRepository: ICategoriaRepository
  ) { }

  public async getAll(name?: string, skip = 0, take = 10): Promise<Producto[]> {
    return this.productoRepository.getAll(name, skip, take);
  }

  public async getById(id: number): Promise<{ producto: Producto, cantPaquetes: number } | null> {
    const cantPaquetes = await this.paquetePublicadoRepository.countByProductId(id);

    const producto = await this.productoRepository.getById(id);

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }

    return { producto, cantPaquetes };
  }

  public async create(producto: ProductoDTO): Promise<Producto> {
    const { categoria_id, marca_id, imagenes, plantillaId, ...rest } = producto;

    const categoria = await this.categoriaRepository.getById(categoria_id);

    if (!categoria) {
      throw new CustomError('Categoria no encontrada', 404);
    }

    const data: Prisma.ProductoCreateInput = {
      ...rest,
      categoria: { connect: { id_categoria: categoria_id } },
      marca: { connect: { id_marca: marca_id } },
      plantilla: plantillaId ? { connect: { id: plantillaId } } : undefined,
      imagenes: {
        create: imagenes?.map((url) => ({ url })) || [],
      },
    };

    return this.productoRepository.create(data);
  }

  public async update(id: number, producto: ProductoDTO) {
    const { categoria_id, marca_id, imagenes, ...rest } = producto;

    const data: Prisma.ProductoUpdateInput = {
      ...rest,
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

    return this.productoRepository.update(id, data);
  }

  public async delete(id: number) {
    return this.productoRepository.delete(id);
  }

  public async duplicarProducto(id: number) {
    const producto = await this.productoRepository.getById(id);

    if (!producto) {
      throw new CustomError('Producto no encontrado', 404);
    }

    // Explicitly casting to expected type with relations
    const productoWithRelations = producto as Producto & { imagenes: { url: string }[] };
    const imagenes = productoWithRelations.imagenes || [];

    const data: Prisma.ProductoCreateInput = {
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
        create: imagenes.map((img) => ({ url: img.url })),
      },
    };

    return this.productoRepository.create(data);
  }
}
