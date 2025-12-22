import { ILocalidadRepository, ILocalidadZonaRepository } from '../repositories/interfaces/ILocationRepository';

export class LocalidadService {
  constructor(
    private localidadRepository: ILocalidadRepository,
    private localidadZonaRepository: ILocalidadZonaRepository
  ) { }

  async getAll() {
    return this.localidadRepository.getAll();
  }

  async getAllByZona(zonaId: number) {
    return this.localidadZonaRepository.findByZonaId(zonaId);
  }

  // async create(zonaId: number, data: { nombre: string }) {
  //   // Validación: zona debe existir
  //   const zona = await prisma.zona.findUnique({ where: { id_zona: zonaId } });
  //   if (!zona) throw new Error("Zona no encontrada");

  //   // Validación: nombre único dentro de la misma zona
  //   const exists = await prisma.localidad.findFirst({
  //     where: { zonaId, nombre: data.nombre },
  //   });
  //   if (exists) throw new Error("Ya existe una localidad con ese nombre en esta zona");

  //   return prisma.localidad.create({
  //     data: {
  //       ...data,
  //       zonaId,
  //     },
  //   });
  // }

  // async delete(zonaId: number, id: number) {
  //   const localidad = await prisma.localidad.findFirst({
  //     where: { id_localidad: id, zonaId },
  //   });
  //   if (!localidad) throw new Error("Localidad no encontrada en esta zona");

  //   return prisma.localidad.delete({
  //     where: { id_localidad: id },
  //   });
  // }
}
