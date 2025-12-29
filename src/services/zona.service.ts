import { ZonaDTO } from '../dtos/direccion/zona.dto';
import { CustomError } from '../errors/custom.error';
import { IZonaRepository } from '../interfaces/IZonaRepository';
import { Prisma } from '../../prisma/generated/client';

export class ZonaService {
  constructor(private zonaRepository: IZonaRepository) { }

  async getAll() {
    return this.zonaRepository.getAll();
  }

  async getById(id: number) {
    return this.zonaRepository.getById(id);
  }

  async create(zonaDto: ZonaDTO) {
    const exists = await this.zonaRepository.findByName(zonaDto.nombre);

    if (exists) throw new CustomError('La zona ya existe', 409);

    const data: Prisma.ZonaCreateInput = {
      nombre: zonaDto.nombre,
      localidades: {
        create: zonaDto.localidades.map((localidadId) => ({
          localidad: { connect: { id_localidad: localidadId } }
        }))
      }
    };

    // Check if mapping for localities is correct.
    // Schema: LocalidadZona join table. 
    // ZonaCreateInput -> localities -> create -> LocalidadZonaCreateWithoutZonaInput
    // LocalidadZonaCreateWithoutZonaInput -> localidad: { connect: ... }
    // Yes, seems correct structure for implicit usage or explicit join model.
    // wait, `LocalidadZona` IS an explicit model in schema.
    // `model LocalidadZona`.
    // So `localidades` relation on `Zona` (fields: [localidades]) points to `LocalidadZona`.
    // `zonaDto.localidades` is array of `localidadId` numbers?
    // Service code used: `localidades: { create: zonaDto.localidades.map(localidadId => ({ localidadId })) }`.
    // Explicit model field `localidadId`.
    // Valid.

    // Refined input construction to match explicit model
    const refinedData: Prisma.ZonaCreateInput = {
      nombre: zonaDto.nombre,
      localidades: {
        create: zonaDto.localidades.map((localidadId) => ({
          localidadId: localidadId
        }))
      }
    };

    return this.zonaRepository.create(refinedData);
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
    const zona = await this.zonaRepository.getById(id);

    if (!zona) throw new CustomError('Zona no encontrada');

    // Check localities length. Prisma includes result is array.
    if ((zona as any).localidades && (zona as any).localidades.length > 0) {
      throw new CustomError(
        'No se puede eliminar la zona porque tiene localidades asociadas'
      );
    }

    return this.zonaRepository.delete(id);
  }
}
