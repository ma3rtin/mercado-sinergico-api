import { Usuario, Rol, Direccion } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';

export interface IUsuarioRepository extends IBaseRepository<Usuario> {
    findByEmail(email: string): Promise<Usuario | null>;
}

export interface IRolRepository extends IBaseRepository<Rol> {
    findByName(name: string): Promise<Rol | null>;
}

export interface IDireccionRepository extends IBaseRepository<Direccion> {
    findByUserId(userId: number): Promise<Direccion | null>;
}
