import { PrismaClient } from '@prisma/client';

import { PlantillaDTO } from '../dtos/dtos-plantilla/plantilla.dto';

export class PlantillaService {
    private prismaClient = new PrismaClient();
    constructor() { }
    async crearPlantilla(dto: PlantillaDTO) {
        return this.prismaClient.plantilla.create({
            data: {
                nombre: dto.nombre,
                caracteristicas: {
                    create: dto.caracteristicas.map(c => ({
                        nombre: c.nombre,
                        opciones: { create: c.opciones.map(o => ({ nombre: o.nombre })) }
                    }))
                }
            },
            include: {
                caracteristicas: { include: { opciones: true } },
            },
        });
    }
    async actualizarPlantilla(id: number, dto: PlantillaDTO) {
        return this.prismaClient.$transaction(async (tx) => {
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

            // 🔑 Traigo la plantilla final con todo actualizado
            return tx.plantilla.findUnique({
                where: { id },
                include: {
                    caracteristicas: { include: { opciones: true } },
                },
            });
        });
    }





    async obtenerPlantillas() {
        return this.prismaClient.plantilla.findMany({
            include: {
                caracteristicas: { include: { opciones: true } },
            },
        });
    }

    async asignarPlantillaAProducto(plantillaId: number, productoId: number) {
        return this.prismaClient.producto.update({
            where: { id_producto: productoId },
            data: { plantilla: { connect: { id: plantillaId } } },
        });
    }
    async eliminarPlantilla(id: number) {
        return this.prismaClient.plantilla.delete({
            where: { id },
            include: {
                caracteristicas: { include: { opciones: true } },
            }
        });
    }
    async getPlantillaById(id: number) {
        return this.prismaClient.plantilla.findUnique({
            where: { id },
            include: {
                caracteristicas: { include: { opciones: true } },
            },
        });
    }
}
