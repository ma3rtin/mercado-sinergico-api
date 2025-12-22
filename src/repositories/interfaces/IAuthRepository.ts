import { Usuario, Rol, Direccion } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';

export interface IUsuarioRepository extends IBaseRepository<Usuario> {
    findByEmail(email: string): Promise<Usuario | null>;
    findByEmailWithRole(email: string): Promise<any>;
    getByIdWithDetails(id: number): Promise<any>;
    createWithRole(data: any): Promise<Usuario>;
}

export interface IRolRepository extends IBaseRepository<Rol> {
    findByName(name: string): Promise<Rol | null>;
}

export interface IDireccionRepository extends IBaseRepository<Direccion> {
    findByUserId(userId: number): Promise<Direccion | null>;
    createForUser(userId: number, data: any): Promise<Direccion>;
}
