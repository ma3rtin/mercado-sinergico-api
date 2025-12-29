import { Plantilla, Prisma } from '../../prisma/generated/client';
import { PlantillaDTO } from '../dtos/plantilla/plantilla.dto';

export interface IPlantillaRepository {
    getAll(): Promise<Plantilla[]>;
    getById(id: number): Promise<Plantilla | null>;
    create(data: Prisma.PlantillaCreateInput): Promise<Plantilla>;
    update(id: number, data: Prisma.PlantillaUpdateInput): Promise<Plantilla>;
    delete(id: number): Promise<Plantilla>;
    updateWithDetails(id: number, dto: PlantillaDTO): Promise<Plantilla | null>;
}
