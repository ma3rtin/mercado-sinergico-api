import { PrismaClient, Usuario, Prisma } from '../../prisma/generated/client';
import { IUsuarioRepository } from '../interfaces/IUsuarioRepository';
import { prisma } from '../prisma/client';

export class UsuarioRepository implements IUsuarioRepository {
    private prisma: PrismaClient = prisma;

    async getAll(): Promise<Usuario[]> {
        return this.prisma.usuario.findMany({
            include: {
                rol: true,
                localidad: true,
                direccion: {
                    include: {
                        localidad: true,
                    },
                },
            },
        });
    }

    async getById(id: number): Promise<Usuario | null> {
        return this.prisma.usuario.findUnique({
            where: { id },
            include: {
                rol: true,
                localidad: { include: { zonas: true } },
                direccion: {
                    include: {
                        localidad: { include: { zonas: true } },
                    },
                },
            },
        });
    }

    async getByEmail(email: string): Promise<Usuario | null> {
        return this.prisma.usuario.findUnique({
            where: { email },
            include: {
                rol: true,
            },
        });
    }

    async create(data: Prisma.UsuarioCreateInput): Promise<Usuario> {
        return this.prisma.usuario.create({
            data,
            include: {
                rol: true,
            },
        });
    }

    async update(id: number, data: Prisma.UsuarioUpdateInput): Promise<Usuario> {
        return this.prisma.usuario.update({
            where: { id },
            data,
            include: {
                rol: true,
                localidad: true,
                direccion: true,
            },
        });
    }

    async delete(id: number): Promise<Usuario> {
        return this.prisma.usuario.delete({
            where: { id },
        });
    }
}
