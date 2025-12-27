import { ZonaDTO } from '../dtos/direccion/zona.dto.js';
import { CustomError } from '../errors/custom.error.js';
import { prisma } from '../prisma/client.js';

export class ZonaService {
  private prisma = prisma;
  async getAll() {
    return this.prisma.zona.findMany({
      include: { localidades: true, paquetes: true },
    });
  }

  async getById(id: number) {
    return this.prisma.zona.findUnique({
      where: { id_zona: id },
      include: { localidades: true, paquetes: true },
    });
  }

  async create(zonaDto: ZonaDTO) {
    const exists = await this.prisma.zona.findUnique({
      where: { nombre: zonaDto.nombre },
    });
    if (exists) throw new CustomError('La zona ya existe', 409);

    const zona = await this.prisma.zona.create({
      data: {
        nombre: zonaDto.nombre,
        localidades: {
          create: zonaDto.localidades.map((localidadId) => ({
            localidadId,
          })),
        },
      },
    });

    return zona;
  }

  async update(id: number, data: { nombre?: string }) {
    // Validación: que la zona exista
    const zona = await this.prisma.zona.findUnique({ where: { id_zona: id } });
    if (!zona) throw new CustomError('Zona con id ' + id + ' no encontrada', 404);

    // Validación: si cambia nombre, que no se repita
    if (data.nombre) {
      const duplicate = await this.prisma.zona.findUnique({
        where: { nombre: data.nombre },
      });
      if (duplicate && duplicate.id_zona !== id) {
        throw new CustomError('Ya existe otra zona con ese nombre');
      }
    }

    return this.prisma.zona.update({
      where: { id_zona: id },
      data,
    });
  }

  async delete(id: number) {
    // Validación: no borrar si tiene localidades asociadas
    const zona = await this.prisma.zona.findUnique({
      where: { id_zona: id },
      include: { localidades: true },
    });
    if (!zona) throw new CustomError('Zona no encontrada');
    if (zona.localidades.length > 0) {
      throw new CustomError(
        'No se puede eliminar la zona porque tiene localidades asociadas'
      );
    }

    return this.prisma.zona.delete({ where: { id_zona: id } });
  }
}
