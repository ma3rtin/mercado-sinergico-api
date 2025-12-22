import { PrismaClient, PaqueteBase, PaqueteBaseProducto, EstadoPaquetePublicado } from '@prisma/client';
import { IPaqueteBaseRepository, IPaqueteBaseProductoRepository, IEstadoPaquetePublicadoRepository } from '../interfaces/IBundleRepository';

export class PrismaPaqueteBaseRepository implements IPaqueteBaseRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<PaqueteBase[]> {
        return this.prisma.paqueteBase.findMany();
    }
    async getById(id: number): Promise<PaqueteBase | null> {
        return this.prisma.paqueteBase.findUnique({ where: { id_paquete_base: id } });
    }
    async create(data: any): Promise<PaqueteBase> {
        return this.prisma.paqueteBase.create({ data });
    }
    async update(id: number, data: any): Promise<PaqueteBase> {
        return this.prisma.paqueteBase.update({ where: { id_paquete_base: id }, data });
    }
    async delete(id: number): Promise<PaqueteBase> {
        return this.prisma.paqueteBase.delete({ where: { id_paquete_base: id } });
    }
    async findByCategory(categoryId: number): Promise<PaqueteBase[]> {
        return this.prisma.paqueteBase.findMany({ where: { categoria_id: categoryId } });
    }

    async findAllWithProducts(): Promise<PaqueteBase[]> {
        return this.prisma.paqueteBase.findMany({
            include: {
                productos: {
                    include: { producto: true },
                },
            },
        });
    }

    async getByIdWithProducts(id: number): Promise<PaqueteBase | null> {
        return this.prisma.paqueteBase.findUnique({
            where: { id_paquete_base: id },
            include: {
                productos: {
                    include: { producto: true },
                },
            },
        });
    }

    async createWithProducts(data: any): Promise<PaqueteBase> {
        return this.prisma.$transaction(async (tx: any) => {
            const categoria = await tx.categoria.findUnique({
                where: { id_categoria: data.categoria_id },
            });

            if (!categoria) {
                throw new Error('La categoría no existe');
            }

            const paqueteCreado = await tx.paqueteBase.create({
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    imagen_url: data.imagen_url,
                    categoria: {
                        connect: { id_categoria: data.categoria_id },
                    },
                },
            });

            if (data.productos?.length) {
                await tx.paqueteBaseProducto.createMany({
                    data: data.productos.map((productoId: number) => ({
                        productoId,
                        paqueteBaseId: paqueteCreado.id_paquete_base,
                    })),
                });
            }

            return paqueteCreado;
        });
    }

    async addProducts(data: any): Promise<PaqueteBase> {
        await this.prisma.paqueteBaseProducto.createMany({
            data: data.productosId.map((id: number) => ({
                paqueteBaseId: data.paqueteBaseId,
                productoId: id,
            })),
        });

        const paquete = await this.prisma.paqueteBase.findUnique({
            where: { id_paquete_base: data.paqueteBaseId },
            include: {
                productos: {
                    include: { producto: true },
                },
            },
        });

        if (!paquete) {
            throw new Error('Paquete no encontrado');
        }

        return paquete;
    }

    async getProductosByPaquete(id: number): Promise<any[]> {
        const paquete = await this.prisma.paqueteBase.findUnique({
            where: { id_paquete_base: id },
            include: {
                productos: {
                    include: {
                        producto: {
                            include: {
                                categoria: true,
                                marca: true,
                                imagenes: true
                            }
                        }
                    }
                }
            }
        });

        if (!paquete) {
            throw new Error('Paquete no encontrado');
        }

        return paquete.productos.map((p: any) => p.producto);
    }

    async updateWithCategoryCheck(id: number, data: any): Promise<PaqueteBase> {
        if (data.categoria_id) {
            const categoria = await this.prisma.categoria.findUnique({
                where: { id_categoria: data.categoria_id },
            });

            if (!categoria) {
                throw new Error('La categoría no existe');
            }
        }

        return this.prisma.paqueteBase.update({
            where: { id_paquete_base: id },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                imagen_url: data.imagen_url,
                categoria: data.categoria_id ? {
                    connect: { id_categoria: data.categoria_id },
                } : undefined,
            },
        });
    }
}

export class PrismaPaqueteBaseProductoRepository implements IPaqueteBaseProductoRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<PaqueteBaseProducto[]> {
        return this.prisma.paqueteBaseProducto.findMany();
    }
    async getById(id: number): Promise<PaqueteBaseProducto | null> {
        return this.prisma.paqueteBaseProducto.findUnique({ where: { id } });
    }
    async create(data: any): Promise<PaqueteBaseProducto> {
        return this.prisma.paqueteBaseProducto.create({ data });
    }
    async update(id: number, data: any): Promise<PaqueteBaseProducto> {
        return this.prisma.paqueteBaseProducto.update({ where: { id }, data });
    }
    async delete(id: number): Promise<PaqueteBaseProducto> {
        return this.prisma.paqueteBaseProducto.delete({ where: { id } });
    }
    async findByPaqueteBaseId(paqueteBaseId: number): Promise<PaqueteBaseProducto[]> {
        return this.prisma.paqueteBaseProducto.findMany({ where: { paqueteBaseId } });
    }
}

export class PrismaEstadoPaquetePublicadoRepository implements IEstadoPaquetePublicadoRepository {
    private prisma = new PrismaClient();

    async getAll(): Promise<EstadoPaquetePublicado[]> {
        return this.prisma.estadoPaquetePublicado.findMany();
    }
    async getById(id: number): Promise<EstadoPaquetePublicado | null> {
        return this.prisma.estadoPaquetePublicado.findUnique({ where: { id_estado: id } });
    }
    async create(data: any): Promise<EstadoPaquetePublicado> {
        return this.prisma.estadoPaquetePublicado.create({ data });
    }
    async update(id: number, data: any): Promise<EstadoPaquetePublicado> {
        return this.prisma.estadoPaquetePublicado.update({ where: { id_estado: id }, data });
    }
    async delete(id: number): Promise<EstadoPaquetePublicado> {
        return this.prisma.estadoPaquetePublicado.delete({ where: { id_estado: id } });
    }
    async findByName(name: string): Promise<EstadoPaquetePublicado | null> {
        return this.prisma.estadoPaquetePublicado.findUnique({ where: { nombre: name } });
    }
}
