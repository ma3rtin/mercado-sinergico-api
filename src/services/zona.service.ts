import { ZonaDTO } from '../dtos/direccion/zona.dto';
import { CustomError } from '../errors/custom.error';
import { prisma } from '../prisma/client';

import { IZonaRepository } from '../repositories/interfaces/ILocationRepository';

export class ZonaService {
  constructor(private zonaRepository: IZonaRepository) { }
  async getAll() {
    return this.zonaRepository.findAllWithRelations();
  }

  async getById(id: number) {
    return this.zonaRepository.getByIdWithRelations(id);
  }

  async create(zonaDto: ZonaDTO) {
    const exists = await this.zonaRepository.findByName(zonaDto.nombre);
    if (exists) throw new CustomError('La zona ya existe', 409);

    const zona = await this.zonaRepository.create({
      nombre: zonaDto.nombre,
      localidades: {
        create: zonaDto.localidades.map((localidadId) => ({
          localidadId,
        })),
      },
    });

    return zona;
  }

  async update(id: number, data: { nombre?: string }) {
    // Validación: que la zona exista
    const zona = await this.zonaRepository.getById(id);
    if (!zona) throw new CustomError('Zona con id ' + id + ' no encontrada', 404);

    // Validación: si cambia nombre, que no se repita
    if (data.nombre) {
      const duplicate = await this.zonaRepository.findByName(data.nombre);
      if (duplicate && duplicate.id_zona !== id) {
        throw new CustomError('Ya existe otra zona con ese nombre');
      }
    }

    return this.zonaRepository.update(id, data);
  }

  async delete(id: number) {
    // Validación: no borrar si tiene localidades asociadas
    const zona = await this.zonaRepository.getByIdWithRelations(id);
    if (!zona) throw new CustomError('Zona no encontrada');
    if (zona.localidades.length > 0) {
      throw new CustomError(
        'No se puede eliminar la zona porque tiene localidades asociadas'
      );
    }

    return this.zonaRepository.delete(id);
  }
}
