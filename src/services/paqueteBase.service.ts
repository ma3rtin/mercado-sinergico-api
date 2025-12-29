import { AgregarProductoPaqueteDTO } from '../dtos/producto/agregarProductoPaquete.dto';
import { PaqueteBaseDTO } from '../dtos/paquete/paqueteBase.dto';
import { CustomError } from '../errors/custom.error';
import { IPaqueteBaseRepository } from '../interfaces/IPaqueteBaseRepository';
import { ICategoriaRepository } from '../interfaces/ICategoriaRepository';
import { Prisma } from '../../prisma/generated/client';

export class PaqueteBaseService {
  constructor(
    private paqueteBaseRepository: IPaqueteBaseRepository,
    private categoriaRepository: ICategoriaRepository
  ) { }

  public async getAll() {
    return this.paqueteBaseRepository.getAll();
  }

  public async getById(id: number) {
    const paquete = await this.paqueteBaseRepository.getById(id);

    if (!paquete) {
      throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
    }

    return paquete;
  }

  public async create(data: PaqueteBaseDTO) {
    const categoria = await this.categoriaRepository.getById(data.categoria_id);

    if (!categoria) {
      throw new CustomError('La categoría no existe', 400);
    }

    const input: Prisma.PaqueteBaseCreateInput = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      imagen_url: data.imagen_url,
      categoria: {
        connect: { id_categoria: data.categoria_id },
      },
      productos: data.productos?.length ? {
        create: data.productos.map((productoId) => ({
          producto: { connect: { id_producto: productoId } }
        }))
      } : undefined
    };

    return this.paqueteBaseRepository.create(input);
  }

  public async update(id: number, data: PaqueteBaseDTO) {
    if (data.categoria_id) {
      const categoria = await this.categoriaRepository.getById(data.categoria_id);

      if (!categoria) {
        throw new CustomError('La categoría no existe', 400);
      }
    }

    try {
      const input: Prisma.PaqueteBaseUpdateInput = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        imagen_url: data.imagen_url,
        categoria: data.categoria_id ? {
          connect: { id_categoria: data.categoria_id },
        } : undefined,
      };

      return await this.paqueteBaseRepository.update(id, input);
    } catch {
      throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
    }
  }

  public async delete(id: number) {
    try {
      return await this.paqueteBaseRepository.delete(id);
    } catch {
      throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
    }
  }

  public async agregarProductos(data: AgregarProductoPaqueteDTO) {
    await this.paqueteBaseRepository.addProducts(data.paqueteBaseId, data.productosId);

    const paquete = await this.paqueteBaseRepository.getWithFullProducts(data.paqueteBaseId);

    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    return paquete;
  }

  public async getProductosByPaquete(id: number) {
    const paquete = await this.paqueteBaseRepository.getWithFullProducts(id);

    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    // Typescript: paquete.productos is array of PaqueteBaseProducto joined with Producto
    // We want to return array of Producto
    // Accessing (p as any).producto because PaqueteBase type might not conform to the deep include return structure perfectly
    // without using the specific return type of getWithFullProducts from repo.
    // However, the repo implementation returns the relation. 
    // And Prisma types usually include relations as optional.
    // Let's rely on what repo returns being compatible or cast it.

    // Using `any` cast for safety as done previously for relations not standard on scalar model
    const products = (paquete as any).productos?.map((p: any) => p.producto) || [];
    return products;
  }
}
