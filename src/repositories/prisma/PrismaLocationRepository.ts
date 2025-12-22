import { PrismaClient, Localidad, Zona, LocalidadZona } from '@prisma/client';
import { ILocalidadRepository, IZonaRepository, ILocalidadZonaRepository } from '../interfaces/ILocationRepository';

export class PrismaLocalidadRepository implements ILocalidadRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<Localidad[]> {
        return this.prisma.localidad.findMany();
    }
    async getById(id: number): Promise<Localidad | null> {
        return this.prisma.localidad.findUnique({ where: { id_localidad: id } });
    }
    async create(data: any): Promise<Localidad> {
        return this.prisma.localidad.create({ data });
    }
    async update(id: number, data: any): Promise<Localidad> {
        return this.prisma.localidad.update({ where: { id_localidad: id }, data });
    }
    async delete(id: number): Promise<Localidad> {
        return this.prisma.localidad.delete({ where: { id_localidad: id } });
    }
    async findByZipCode(zipCode: number): Promise<Localidad | null> {
        return this.prisma.localidad.findFirst({ where: { codigo_postal: zipCode } });
    }
}

export class PrismaZonaRepository implements IZonaRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<Zona[]> {
        return this.prisma.zona.findMany();
    }
    async getById(id: number): Promise<Zona | null> {
        return this.prisma.zona.findUnique({ where: { id_zona: id } });
    }
    async create(data: any): Promise<Zona> {
        return this.prisma.zona.create({ data });
    }
    async update(id: number, data: any): Promise<Zona> {
        return this.prisma.zona.update({ where: { id_zona: id }, data });
    }
    async delete(id: number): Promise<Zona> {
        return this.prisma.zona.delete({ where: { id_zona: id } });
    }
    async findByName(name: string): Promise<Zona | null> {
        return this.prisma.zona.findUnique({ where: { nombre: name } });
    }

    async findAllWithRelations(): Promise<any[]> {
        return this.prisma.zona.findMany({
            include: { localidades: true, paquetes: true },
        });
    }

    async getByIdWithRelations(id: number): Promise<any> {
        return this.prisma.zona.findUnique({
            where: { id_zona: id },
            include: { localidades: true, paquetes: true },
        });
    }
}

export class PrismaLocalidadZonaRepository implements ILocalidadZonaRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<LocalidadZona[]> {
        return this.prisma.localidadZona.findMany();
    }
    async getById(id: number): Promise<LocalidadZona | null> {
        return this.prisma.localidadZona.findUnique({ where: { id } });
    }
    async create(data: any): Promise<LocalidadZona> {
        return this.prisma.localidadZona.create({ data });
    }
    async update(id: number, data: any): Promise<LocalidadZona> {
        return this.prisma.localidadZona.update({ where: { id }, data });
    }
    async delete(id: number): Promise<LocalidadZona> {
        return this.prisma.localidadZona.delete({ where: { id } });
    }
    async findByZonaId(zonaId: number): Promise<LocalidadZona[]> {
        return this.prisma.localidadZona.findMany({ where: { zonaId } });
    }
    async findByLocalidadId(localidadId: number): Promise<LocalidadZona[]> {
        return this.prisma.localidadZona.findMany({ where: { localidadId } });
    }
}
