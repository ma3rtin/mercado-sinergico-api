import { PaquetePublicadoDTO } from '../dtos/paquete/paquetePublicado.dto';
import { PaquetePublicadoUpdateDTO } from '../dtos/paquete/paquetePublicadoUpdate.dto';
import { prisma } from '../prisma/client';
import { CustomError } from '../errors/custom.error';
import { ComprarProductoDto } from '../dtos/producto/comprarProducto.dto';

export class PaquetePublicadoService {
  private prisma = prisma;

  async getAll() {
    return this.prisma.paquetePublicado.findMany({
      include: {
        paqueteBase: {
          include: {
            marca: true,
            categoria: true,
          },
        },
        zona: true,
        estado: true,
        pedidos: true,
      },
    });
  }

  async getById(id: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: {
        paqueteBase: { include: { marca: true, categoria: true } },
        zona: true,
        estado: true,
        pedidos: true,
      },
    });

    if (!paquete) {
      throw new CustomError(`Paquete publicado con id ${id} no encontrado`, 404);
    }

    return paquete;
  }

  async create(dto: PaquetePublicadoDTO) {
    const fecha_inicio = new Date(dto.fecha_inicio);
    const fecha_fin = new Date(dto.fecha_fin);

    // Validar zona
    const zona = await this.prisma.zona.findUnique({
      where: { id_zona: Number(dto.zonaId) },
    });

    if (!zona) throw new CustomError('La zona no existe', 404);

    // Validar paquete base
    const paqueteBase = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: dto.paqueteBaseId },
    });

    if (!paqueteBase) throw new CustomError('El paquete base no existe', 404);

    return this.prisma.paquetePublicado.create({
      data: {
        cant_productos: dto.cant_productos,
        fecha_inicio,
        fecha_fin,
        zona: { connect: { id_zona: Number(dto.zonaId) } },
        paqueteBase: { connect: { id_paquete_base: dto.paqueteBaseId } },
        estado: { connect: { nombre: 'Activo' } },
      },
    });
  }

  async update(id: number, dto: PaquetePublicadoUpdateDTO) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
    });

    if (!paquete) throw new CustomError('Paquete publicado no encontrado', 404);

    return this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: {
        cant_productos: dto.cant_productos,
        fecha_inicio: dto.fecha_inicio,
        fecha_fin: dto.fecha_fin,
        zona: { connect: { id_zona: dto.zonaId } },
        paqueteBase: { connect: { id_paquete_base: dto.paqueteBaseId } },
        ...(dto.estadoNombre && {
          estado: { connect: { nombre: dto.estadoNombre } },
        }),
      },
    });
  }

  delete(id: number) {
    return this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: { estado: { connect: { nombre: 'Eliminado' } } },
    });
  }

  async getPorCerrarse() {
    const hoy = new Date();
    const dentroDe5Dias = new Date();
    dentroDe5Dias.setDate(hoy.getDate() + 5);

    return this.prisma.paquetePublicado.findMany({
      where: {
        estado: { nombre: { in: ['Activo', 'Pendiente'] } },
        fecha_fin: {
          gte: hoy,
          lte: dentroDe5Dias,
        },
      },
      include: {
        paqueteBase: {
          select: {
            nombre: true,
            descripcion: true,
            imagen_url: true,
          },
        },
        zona: { select: { nombre: true } },
        estado: { select: { nombre: true } },
      },
      orderBy: { fecha_fin: 'asc' },
    });
  }
}
