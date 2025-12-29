import { Usuario, Prisma } from '../../prisma/generated/client';

export interface IUsuarioRepository {
    getAll(): Promise<Usuario[]>;
    getById(id: number): Promise<Usuario | null>;
    getByEmail(email: string): Promise<Usuario | null>;
    create(data: Prisma.UsuarioCreateInput): Promise<Usuario>;
    update(id: number, data: Prisma.UsuarioUpdateInput): Promise<Usuario>;
    delete(id: number): Promise<Usuario>;
}
