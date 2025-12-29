import { CustomError } from '../errors/custom.error';
import { ICategoriaRepository } from '../interfaces/ICategoriaRepository';

export class CategoriaService {
  constructor(private categoriaRepository: ICategoriaRepository) { }

  public async getAll() {
    return this.categoriaRepository.getAll();
  }

  public async getById(id: number) {
    return this.categoriaRepository.getById(id);
  }

  public async create(nombre: string) {
    if (!nombre || nombre.trim().length === 0) {
      throw new CustomError('El nombre de la categoría es obligatorio', 400);
    }

    try {
      return await this.categoriaRepository.create({ nombre });
    } catch (error: unknown) {
      const err = error as { code?: string };

      if (err.code === 'P2002') {
        throw new CustomError('La categoría ya existe', 409, { cause: error });
      }

      throw new CustomError('Error al crear la categoría', 500, {
        cause: error,
      });
    }
  }
}
