import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';

export class CategoriaService {
  private client = prisma;

  public async getAll() {
    return this.client.categoria.findMany();
  }

  public async getById(id: number) {
    const categoria = await this.client.categoria.findUnique({
      where: { id_categoria: id },
    });

    return categoria;
  }

  public async create(nombre: string) {
    if (!nombre || nombre.trim().length === 0) {
      throw new CustomError('El nombre de la categoría es obligatorio', 400);
    }

    try {
      return await this.client.categoria.create({
        data: { nombre: nombre.trim() },
      });
    } catch (error: unknown) {
      const err = error as { code?: string };

      if (err.code === 'P2002') {
        throw new CustomError('La categoría ya existe', 400, { cause: error });
      }

      throw new CustomError('Error al crear la categoría', 500, {
        cause: error,
      });
    }
  }
}
