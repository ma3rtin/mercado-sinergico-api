import { PrismaClient, Usuario, Rol, Direccion } from '@prisma/client';
import { IUsuarioRepository, IRolRepository, IDireccionRepository } from '../interfaces/IAuthRepository';

export class PrismaUsuarioRepository implements IUsuarioRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<Usuario[]> {
        return this.prisma.usuario.findMany();
    }
    async getById(id: number): Promise<Usuario | null> {
        return this.prisma.usuario.findUnique({ where: { id } });
    }
    async create(data: any): Promise<Usuario> {
        return this.prisma.usuario.create({ data });
    }
    async update(id: number, data: any): Promise<Usuario> {
        return this.prisma.usuario.update({ where: { id }, data });
    }
    async delete(id: number): Promise<Usuario> {
        return this.prisma.usuario.delete({ where: { id } });
    }
    async findByEmail(email: string): Promise<Usuario | null> {
        return this.prisma.usuario.findUnique({ where: { email } });
    }

    async findByEmailWithRole(email: string): Promise<any> {
        return this.prisma.usuario.findUnique({
            where: { email },
            include: { rol: { select: { nombre: true } } },
        });
    }

    async getByIdWithDetails(id: number): Promise<any> {
        return this.prisma.usuario.findUnique({
            where: { id },
            include: {
                rol: { select: { nombre: true } },
                localidad: true,
                direccion: {
                    include: { localidad: true },
                },
            },
        });
    }

    async createWithRole(data: any): Promise<Usuario> {
        return this.prisma.usuario.create({
            data,
            include: { rol: { select: { nombre: true } } },
        });
    }
}

export class PrismaRolRepository implements IRolRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<Rol[]> {
        return this.prisma.rol.findMany();
    }
    async getById(id: number): Promise<Rol | null> {
        return this.prisma.rol.findUnique({ where: { id } });
    }
    async create(data: any): Promise<Rol> {
        return this.prisma.rol.create({ data });
    }
    async update(id: number, data: any): Promise<Rol> {
        return this.prisma.rol.update({ where: { id }, data });
    }
    async delete(id: number): Promise<Rol> {
        return this.prisma.rol.delete({ where: { id } });
    }
    async findByName(name: string): Promise<Rol | null> {
        return this.prisma.rol.findUnique({ where: { nombre: name } });
    }
}

export class PrismaDireccionRepository implements IDireccionRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<Direccion[]> {
        return this.prisma.direccion.findMany();
    }
    async getById(id: number): Promise<Direccion | null> {
        return this.prisma.direccion.findUnique({ where: { id } });
    }
    async create(data: any): Promise<Direccion> {
        return this.prisma.direccion.create({ data });
    }
    async update(id: number, data: any): Promise<Direccion> {
        return this.prisma.direccion.update({ where: { id }, data });
    }
    async delete(id: number): Promise<Direccion> {
        return this.prisma.direccion.delete({ where: { id } });
    }
    async findByUserId(userId: number): Promise<Direccion | null> {
        return this.prisma.direccion.findUnique({ where: { usuarioId: userId } });
    }

    async createForUser(userId: number, data: any): Promise<Direccion> {
        return this.prisma.$transaction(async (tx: any) => {
            const localidad = await tx.localidad.findUnique({
                where: { id_localidad: data.localidad_id },
            });
            if (!localidad) {
                throw new Error('Localidad no encontrada en la base de datos');
            }

            return await tx.direccion.create({
                data: {
                    usuarioId: userId,
                    localidadId: data.localidad_id,
                    codigo_postal: data.codigo_postal,
                    calle: data.calle,
                    numero: data.numero,
                    piso: data.piso,
                    departamento: data.departamento,
                },
            });
        });
    }
}
