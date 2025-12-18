import { PaquetePublicadoDTO } from '../dtos/paquete/paquetePublicado.dto';
import { PaquetePublicadoUpdateDTO } from '../dtos/paquete/paquetePublicadoUpdate.dto';
import { CustomError } from '../errors/custom.error';
import { prisma } from '../prisma/client';

export class PaquetePublicadoService {
  private prisma = prisma;

  async getAll() {
    try {
      console.log('obteniendo todos los paquetes');
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
      const paquete = await this.prisma.paquetePublicado.findUnique({
        where: { id_paquete_publicado: id },
        include: {
          paqueteBase: {
            include: {
              marca: true,
              categoria: true,
              productos: {
                include: {
                  producto: {
                    include: {
                      imagenes: true
                    }
                  }
                }
              }
            }
          },
          zona: true,
          estado: true,
          pedidos: true
        }
      });

      if (paquete) {
        return {
          ...paquete,
          descuento: 10 // Descuento fijo del 10%
        };
      }
      return null;
    } catch (error: any) {
      throw new Error(
        `Error al obtener paquete con id=${id}: ${error.message}`
      );
    }
  }

  async getByLocation(userId?: number, localidadId?: number) {
    try {
      let zonaIds: number[] = [];

      // 1. Si se proporciona localidadId explícitamente, usarla
      if (localidadId) {
        console.log('🔎 Buscando zonas para localidad ID:', localidadId);
        const localidad = await this.prisma.localidad.findUnique({
          where: { id_localidad: localidadId },
          include: { zonas: true }
        });

        if (localidad) {
          zonaIds = localidad.zonas.map((z: any) => z.zonaId);
        }
      }
      // 2. Si no hay localidadId pero hay userId, buscar la del usuario
      else if (userId) {
        console.log('🔎 Buscando zonas para usuario ID:', userId);
        const usuario = await this.prisma.usuario.findUnique({
          where: { id: userId },
          include: {
            localidad: { // Primero revisar preferencia de localidad
              include: { zonas: true }
            },
            direccion: { // Fallback a dirección física
              include: {
                localidad: {
                  include: {
                    zonas: true
                  }
                }
              }
            }
          }
        });

        if (usuario) {
          if (usuario.localidad) {
            console.log('✅ Usando localidad preferida del usuario');
            zonaIds = usuario.localidad.zonas.map((z: any) => z.zonaId);
          } else if (usuario.direccion && usuario.direccion.localidad) {
            console.log('✅ Usando dirección del usuario');
            zonaIds = usuario.direccion.localidad.zonas.map((z: any) => z.zonaId);
          }
        }
      }

      if (zonaIds.length === 0) {
        console.warn('⚠️ No se encontraron zonas para la ubicación dada.');
        return [];
      }

      return await this.prisma.paquetePublicado.findMany({
        where: {
          zonaId: { in: zonaIds },
          estado: { nombre: 'Activo' }
        },
        include: {
          paqueteBase: {
            include: {
              marca: true,
              categoria: true,
              productos: {
                include: {
                  producto: {
                    include: {
                      imagenes: true
                    }
                  }
                }
              }
            }
          },
          zona: true,
          estado: true
        }
      });
    } catch (error: any) {
      throw new Error(`Error al obtener paquetes por ubicación: ${error.message}`);
    }
  }

  async getByProductId(productId: number) {
    try {
      return await this.prisma.paquetePublicado.findMany({
        where: {
          paqueteBase: {
            productos: {
              some: {
                productoId: productId
              }
            }
          },
          estado: { nombre: 'Activo' }
        },
        include: {
          paqueteBase: {
            include: {
              marca: true,
              categoria: true
            }
          },
          zona: true,
          estado: true
        }
      });
    } catch (error: any) {
      throw new Error(`Error al obtener paquetes por producto: ${error.message}`);
    }
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

  // 🔥 ESTE ES EL MÉTODO QUE NECESITA ARREGLARSE sisi, eso....
  async getPorCerrarse() {
    try {
      const hoy = new Date();
      const dentroDexDias = new Date(hoy);
      dentroDexDias.setDate(hoy.getDate() + 30);

      console.log('🔎 Buscando paquetes entre:', hoy, 'y', dentroDexDias);

      // ✅ CAMBIO IMPORTANTE: Agregar el include de paqueteBase
      const paquetes = await this.prisma.paquetePublicado.findMany({
        where: {
          estado: {
            nombre: { in: ['Activo', 'Pendiente'] }
          },
          fecha_fin: {
            gte: hoy,
            lte: dentroDexDias
          }
        },
        include: {
          // ✅ ESTO FALTABA - Ahora trae la info de paqueteBase
          paqueteBase: {
            include: {
              marca: true,      // ✅ Trae la marca
              categoria: true   // ✅ Trae la categoría
            }
          },
          zona: {
            select: { nombre: true, id_zona: true }
          },
          estado: {
            select: { nombre: true, id_estado: true }
          },
          pedidos: true
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
