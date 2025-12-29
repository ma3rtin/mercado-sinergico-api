import { PlantillaDTO } from '../dtos/plantilla/plantilla.dto';
import { IPlantillaRepository } from '../interfaces/IPlantillaRepository';
import { IProductoRepository } from '../interfaces/IProductoRepository';
import { Prisma } from '../../prisma/generated/client';

export class PlantillaService {
    constructor(
        private plantillaRepository: IPlantillaRepository,
        private productoRepository: IProductoRepository
    ) { }

    async crearPlantilla(dto: PlantillaDTO) {
        // Construct detailed input
        const data: Prisma.PlantillaCreateInput = {
            nombre: dto.nombre,
            caracteristicas: {
                create: dto.caracteristicas.map(c => ({
                    nombre: c.nombre,
                    opciones: { create: c.opciones.map(o => ({ nombre: o.nombre })) }
                }))
            }
        };
        return this.plantillaRepository.create(data);
    }

    async actualizarPlantilla(id: number, dto: PlantillaDTO) {
        return this.plantillaRepository.updateWithDetails(id, dto);
    }

    async obtenerPlantillas() {
        return this.plantillaRepository.getAll();
    }

    async asignarPlantillaAProducto(plantillaId: number, productoId: number) {
        // Use generic update of IProductoRepository if possible, or cast input
        // IProductoRepository.update takes Prisma.ProductoUpdateInput.
        const input: Prisma.ProductoUpdateInput = {
            plantilla: { connect: { id: plantillaId } }
        };
        return this.productoRepository.update(productoId, input);
    }

    async eliminarPlantilla(id: number) {
        return this.plantillaRepository.delete(id);
    }

    async getPlantillaById(id: number) {
        return this.plantillaRepository.getById(id);
    }
}
