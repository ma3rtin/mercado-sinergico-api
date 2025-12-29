import { PrismaClient, Localidad, Prisma } from '../../prisma/generated/client';
import { ILocalidadRepository } from '../interfaces/ILocalidadRepository';
import { prisma } from '../prisma/client';

export class LocalidadRepository implements ILocalidadRepository {
    private prisma: PrismaClient = prisma;

    async getAll(): Promise<Localidad[]> {
        return this.prisma.localidad.findMany({
            include: {
                zonas: {
                    include: {
                        zona: true,
                    },
                },
            },
        });
    }

    async getById(id: number): Promise<Localidad | null> {
        return this.prisma.localidad.findUnique({
            where: { id_localidad: id },
            include: {
                zonas: {
                    include: {
                        zona: true,
                    },
                },
            },
        });
    }

    async create(data: Prisma.LocalidadCreateInput): Promise<Localidad> {
        return this.prisma.localidad.create({
            data,
        });
    }

    async update(id: number, data: Prisma.LocalidadUpdateInput): Promise<Localidad> {
        return this.prisma.localidad.update({
            where: { id_localidad: id },
            data,
        });
    }

    async delete(id: number): Promise<Localidad> {
        return this.prisma.localidad.delete({
            where: { id_localidad: id },
        });
    }

    async getAllByZona(zonaId: number): Promise<{ localidad: Localidad }[]> {
        return this.prisma.localidadZona.findMany({
            where: { zonaId },
            include: { localidad: true },
        });
    }
}
