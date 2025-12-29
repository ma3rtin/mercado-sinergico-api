import { PrismaClient, Plantilla, Prisma } from '../../prisma/generated/client';
import { IPlantillaRepository } from '../interfaces/IPlantillaRepository';
import { prisma } from '../prisma/client';
import { PlantillaDTO } from '../dtos/plantilla/plantilla.dto';

export class PlantillaRepository implements IPlantillaRepository {
    private prisma: PrismaClient = prisma;

    async getAll(): Promise<Plantilla[]> {
        return this.prisma.plantilla.findMany({
            include: {
                caracteristicas: { include: { opciones: true } },
            },
        });
    }

    async getById(id: number): Promise<Plantilla | null> {
        return this.prisma.plantilla.findUnique({
            where: { id },
            include: {
                caracteristicas: { include: { opciones: true } },
            },
        });
    }

    async create(data: Prisma.PlantillaCreateInput): Promise<Plantilla> {
        return this.prisma.plantilla.create({
            data,
            include: {
                caracteristicas: { include: { opciones: true } },
            },
        });
    }

    async update(id: number, data: Prisma.PlantillaUpdateInput): Promise<Plantilla> {
        return this.prisma.plantilla.update({
            where: { id },
            data,
            include: {
                caracteristicas: { include: { opciones: true } },
            },
        });
    }

    async delete(id: number): Promise<Plantilla> {
        // Delete with include? Usually delete returns the object.
        // If relations cascade, it works.
        return this.prisma.plantilla.delete({
            where: { id },
            include: {
                caracteristicas: { include: { opciones: true } },
            }
        });
    }

    async updateWithDetails(id: number, dto: PlantillaDTO): Promise<Plantilla | null> {
        return this.prisma.$transaction(async (tx) => {
            // 1. Actualizo nombre de la plantilla
            await tx.plantilla.update({
                where: { id },
                data: { nombre: dto.nombre },
            });

            // 2. Traigo las caracteristicas actuales
            const actuales = await tx.caracteristica.findMany({
                where: { plantillaId: id },
                include: { opciones: true },
            });

            // 3. Armo sets de ids
            const idsActuales = actuales.map(c => c.id);
            const idsNuevos = dto.caracteristicas.map(c => c.id).filter(Boolean);

            // 3.a Eliminar características
            const idsEliminar = idsActuales.filter(idC => !idsNuevos.includes(idC));
            for (const eliminarId of idsEliminar) {
                await tx.caracteristica.delete({ where: { id: eliminarId } });
            }

            // 3.b Crear o actualizar características y sus opciones
            for (const c of dto.caracteristicas) {
                if (c.id) {
                    // actualizar característica
                    await tx.caracteristica.update({
                        where: { id: c.id },
                        data: { nombre: c.nombre },
                    });

                    const actualesOpc = actuales.find(a => a.id === c.id)?.opciones ?? [];
                    const idsOpcActuales = actualesOpc.map(o => o.id);
                    const idsOpcNuevas = c.opciones.map(o => o.id).filter(Boolean);

                    // eliminar opciones
                    const idsOpcEliminar = idsOpcActuales.filter(idO => !idsOpcNuevas.includes(idO));
                    for (const eliminarOpc of idsOpcEliminar) {
                        await tx.opcion.delete({ where: { id: eliminarOpc } });
                    }

                    // crear o actualizar opciones
                    for (const o of c.opciones) {
                        if (o.id) {
                            await tx.opcion.update({
                                where: { id: o.id },
                                data: { nombre: o.nombre },
                            });
                        } else {
                            await tx.opcion.create({
                                data: { nombre: o.nombre, caracteristicaId: c.id },
                            });
                        }
                    }
                } else {
                    // crear característica nueva con opciones
                    await tx.caracteristica.create({
                        data: {
                            nombre: c.nombre,
                            plantillaId: id,
                            opciones: { create: c.opciones.map(o => ({ nombre: o.nombre })) },
                        },
                    });
                }
            }

            return tx.plantilla.findUnique({
                where: { id },
                include: {
                    caracteristicas: { include: { opciones: true } },
                },
            });
        });
    }
}
