import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';

export class MarcaService {
  private client = prisma;

  public async getAll() {
    return this.client.marca.findMany();
  }

  public async getById(id: number) {
    return this.client.marca.findUnique({
      where: { id_marca: id },
    });
  }

  public async create(nombre: string) {
    if (!nombre || nombre.trim().length === 0) {
      throw new CustomError('El nombre de la marca es obligatorio', 400);
    }

    try {
      return await this.client.marca.create({
        data: { nombre: nombre.trim() },
      });
    } catch (error: unknown) {
      const err = error as { code?: string };

      if (err.code === 'P2002') {
        throw new CustomError('Ya existe una marca con ese nombre', 400);
      }

      throw new CustomError('Error al crear la marca', 500, {
        cause: error,
      });
    }
  }

  public async update(id: number, nombre: string) {
    if (!nombre || nombre.trim().length === 0) {
      throw new CustomError('El nombre de la marca es obligatorio', 400);
    }

    try {
      return await this.client.marca.update({
        where: { id_marca: id },
        data: { nombre: nombre.trim() },
      });
    } catch (error: unknown) {
      const err = error as { code?: string };

      if (err.code === 'P2025') {
        throw new CustomError('Marca no encontrada', 404);
      }

      if (err.code === 'P2002') {
        throw new CustomError('Ya existe una marca con ese nombre', 400);
      }

      throw new CustomError('Error al actualizar la marca', 500, {
        cause: error,
      });
    }
  }
}
