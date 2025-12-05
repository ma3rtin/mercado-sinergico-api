import { Localidad, Zona, LocalidadZona } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';

export interface ILocalidadRepository extends IBaseRepository<Localidad> {
    findByZipCode(zipCode: number): Promise<Localidad | null>;
}

export interface IZonaRepository extends IBaseRepository<Zona> {
    findByName(name: string): Promise<Zona | null>;
}

export interface ILocalidadZonaRepository extends IBaseRepository<LocalidadZona> {
    findByZonaId(zonaId: number): Promise<LocalidadZona[]>;
    findByLocalidadId(localidadId: number): Promise<LocalidadZona[]>;
}
