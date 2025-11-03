import { PaquetePublicadoDTO } from '../dtos/paquetePublicado.dto';
import { PaquetePublicadoUpdateDTO } from '../dtos/paquetePublicadoUpdate.dto';
import { PrismaClient } from '@prisma/client';

export class PaquetePublicadoService {
  private prisma = new PrismaClient();

  async getAll() {
    try {
      console.log("obteniendo todos los paquetes");
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
    } catch (error: any) {
      throw new Error(`Error al obtener paquetes: ${error.message}`);
    }
  }

  async getById(id: number) {
    try {
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
    } catch (error: any) {
      throw new Error(
        `Error al obtener paquete con id=${id}: ${error.message}`
      );
    }
  }

  async create(paquetePublicadoDTO: PaquetePublicadoDTO) {
    try {
      const fecha_inicio = new Date(paquetePublicadoDTO.fecha_inicio);
      const fecha_fin = new Date(paquetePublicadoDTO.fecha_fin);

      return await this.prisma.paquetePublicado.create({
        data: {
          cant_productos: paquetePublicadoDTO.cant_productos,
          fecha_inicio,
          fecha_fin,
          zona: { connect: { id_zona: Number(paquetePublicadoDTO.zonaId) } },
          paqueteBase: {
            connect: { id_paquete_base: paquetePublicadoDTO.paqueteBaseId },
          },
          estado: { connect: { nombre: 'Activo' } },
        },
      });
    } catch (error: any) {
      throw error;
    }
  }

  async update(id: number, dto: PaquetePublicadoUpdateDTO) {
    try {
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
    } catch (error: any) {
      throw new Error(
        `Error al actualizar paquete publicado: ${error.message}`
      );
    }
  }

  delete(id: number) {
    return this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: { estado: { connect: { nombre: 'Eliminado' } } },
    });
  }

  async getPorCerrarse() {
    try {
      const hoy = new Date();
      const dentroDe5Dias = new Date(hoy);
      dentroDe5Dias.setDate(hoy.getDate() + 5);

      console.log('🔎 Buscando paquetes entre:', hoy, 'y', dentroDe5Dias);

      const paquetes = await this.prisma.paquetePublicado.findMany({
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


      console.log(`✅ ${paquetes.length} paquetes encontrados`);
      return paquetes;
    } catch (error: any) {
      console.error('💥 Error en getPorCerrarse:', error);
      throw new Error(`Error al obtener paquetes por cerrarse: ${error.message}`);
    }
  }
}
