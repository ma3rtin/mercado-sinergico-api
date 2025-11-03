import { ZonaDTO } from '../dtos/zona.dto';
import { PrismaClient } from '@prisma/client';

export class ZonaService {
  private prisma = new PrismaClient();
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
    if (exists) throw new Error('La zona ya existe');

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
    if (!zona) throw new Error('Zona no encontrada');

    // Validación: si cambia nombre, que no se repita
    if (data.nombre) {
      const duplicate = await this.prisma.zona.findUnique({
        where: { nombre: data.nombre },
      });
      if (duplicate && duplicate.id_zona !== id) {
        throw new Error('Ya existe otra zona con ese nombre');
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
    if (!zona) throw new Error('Zona no encontrada');
    if (zona.localidades.length > 0) {
      throw new Error(
        'No se puede eliminar la zona porque tiene localidades asociadas'
      );
    }

    return this.prisma.zona.delete({ where: { id_zona: id } });
  }
}
