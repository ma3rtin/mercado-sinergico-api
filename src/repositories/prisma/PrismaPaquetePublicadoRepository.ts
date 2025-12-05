import { PrismaClient, PaquetePublicado } from '@prisma/client';
import { IPaquetePublicadoRepository } from '../interfaces/IPaquetePublicadoRepository';
import { PaquetePublicadoDTO } from '../../dtos/paquetePublicado.dto';
import { PaquetePublicadoUpdateDTO } from '../../dtos/paquetePublicadoUpdate.dto';

export class PrismaPaquetePublicadoRepository implements IPaquetePublicadoRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<PaquetePublicado[]> {
        return await this.prisma.paquetePublicado.findMany({
            include: {
                paqueteBase: {
                    include: {
                        marca: true,
                        categoria: true
                    }
                },
                zona: true,
                estado: true,
                pedidos: true
            }
        });
    }

    async getById(id: number): Promise<PaquetePublicado | null> {
        return await this.prisma.paquetePublicado.findUnique({
            where: { id_paquete_publicado: id },
            include: {
                paqueteBase: {
                    include: { marca: true, categoria: true }
                },
                zona: true,
                estado: true,
                pedidos: true
            }
        });
    }

    async create(data: PaquetePublicadoDTO): Promise<PaquetePublicado> {
        const fecha_inicio = new Date(data.fecha_inicio);
        const fecha_fin = new Date(data.fecha_fin);

        return await this.prisma.paquetePublicado.create({
            data: {
                cant_productos: data.cant_productos,
                fecha_inicio,
                fecha_fin,
                zona: { connect: { id_zona: Number(data.zonaId) } },
                paqueteBase: {
                    connect: { id_paquete_base: data.paqueteBaseId },
                },
                estado: { connect: { nombre: 'Activo' } },
            },
        });
    }

    async update(id: number, dto: PaquetePublicadoUpdateDTO): Promise<PaquetePublicado> {
        return await this.prisma.paquetePublicado.update({
            where: { id_paquete_publicado: id },
            data: {
                cant_productos: dto.cant_productos,
                fecha_inicio: dto.fecha_inicio,
                fecha_fin: dto.fecha_fin,
                zona: {
                    connect: { id_zona: dto.zonaId },
                },
                paqueteBase: {
                    connect: { id_paquete_base: dto.paqueteBaseId },
                },
                ...(dto.estadoNombre && {
                    estado: { connect: { nombre: dto.estadoNombre } },
                }),
            },
        });
    }

    async delete(id: number): Promise<PaquetePublicado> {
        return await this.prisma.paquetePublicado.update({
            where: { id_paquete_publicado: id },
            data: { estado: { connect: { nombre: 'Eliminado' } } },
        });
    }

    async getPorCerrarse(): Promise<PaquetePublicado[]> {
        const hoy = new Date();
        const dentroDe5Dias = new Date(hoy);
        dentroDe5Dias.setDate(hoy.getDate() + 5);

        return await this.prisma.paquetePublicado.findMany({
            where: {
                estado: {
                    nombre: { in: ['Activo', 'Pendiente'] }
                },
                fecha_fin: {
                    gte: hoy,
                    lte: dentroDe5Dias
                }
            },
            include: {
                paqueteBase: {
                    select: { nombre: true, descripcion: true, imagen_url: true }
                },
                zona: { select: { nombre: true } },
                estado: { select: { nombre: true } }
            },
            orderBy: { fecha_fin: 'asc' }
        });
    }
}
