import * as XLSX from 'xlsx';
import { PaquetePublicadoDTO } from '../dtos/paquete/paquetePublicado.dto.js';
import { PaquetePublicadoUpdateDTO } from '../dtos/paquete/paquetePublicadoUpdate.dto.js';
import { CustomError } from '../errors/custom.error.js';
import { prisma } from '../prisma/client.js';
import { Prisma, TipoPaquete } from '@prisma/client';
import { EmailService } from './email.service.js';
import { PedidoPagoService } from './pedidoPago.service.js';
import { mercadoPagoService } from '../payments/mercadopago/mercadopago.service.js';
import { ImagenService } from './imagen.service.js';
import { despachadorEventosApp, DespachadorEventos } from '../events/despachadorEventos.js';

import { ESTADO_PEDIDO } from '../constants/estado-pedido.js';
import { ESTADO_PAQUETE } from '../constants/estado-paquete.js';

import {
  PedidoComputable,
  PaqueteComputable
} from '../types/computable.types.js';


export class PaquetePublicadoService {
  private prisma = prisma;
  private emailService = new EmailService();
  private imagenService = new ImagenService();

  // ─── Computed fields ─────────────────────────────────────────────────────────

  private _mapComputedFields<T extends PaqueteComputable>(paquete: T) {
    if (!paquete) return paquete;

    // "Involucrados": Pagado (2), En preparación (4), En camino (5), Recibido (6)
    const estadosActivos: number[] = [
      ESTADO_PEDIDO.PAGADO,
      ESTADO_PEDIDO.EN_PREPARACION,
      ESTADO_PEDIDO.EN_CAMINO,
      ESTADO_PEDIDO.RECIBIDO,
    ];
    const pedidosActivos = (paquete.pedidos || []).filter(
      (p) => p.estadoId && estadosActivos.includes(p.estadoId as number)
    );

    const usuariosIds = new Set(pedidosActivos.map((p) => p.usuario?.id || p.usuarioId));

    let reservados = 0;
    pedidosActivos.forEach((ped) => {
      const arr = ped.detalles || ped.pedidoProductos || [];
      reservados += arr.reduce((sum: number, det) => sum + (det.cantidad || 0), 0);
    });

    let recaudacion = 0;
    pedidosActivos.forEach((ped) => {
      recaudacion += Number(ped.monto_total || 0);
    });

    const pedidosIncluidos = Array.isArray(paquete.pedidos);

    return {
      ...paquete,
      tipo: paquete.tipo === 'POR_DEFINIR' && paquete.paqueteBase?.tipo 
        ? paquete.paqueteBase.tipo 
        : paquete.tipo,
      cant_usuarios_registrados: usuariosIds.size > 0 ? usuariosIds.size : paquete.cant_usuarios_registrados,
      cant_productos_reservados: Math.max(
        0,
        pedidosIncluidos ? reservados : (paquete.cant_productos_reservados || 0)
      ),
      monto_total: recaudacion > 0 ? recaudacion : paquete.monto_total
    };
  }

  // ─── Include estándar para includes completos ────────────────────────────────

  private get _includeCompleto() {
    return {
      paqueteBase: { include: { marca: true, categoria: true } },
      zona: true,
      estado: true,
      pedidos: {
        include: {
          usuario: { select: { id: true, nombre: true, email: true } },
          detalles: true,
        },
      },
    };
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async getAll(
    skip?: number,
    take?: number,
    includeArchived = false,
    categorias?: number[],
    marcas?: number[],
    zonas?: number[],
    tiposPaquete?: string[],
    estados?: string[]
  ) {
    const where: Prisma.PaquetePublicadoWhereInput = {};
    if (!includeArchived) {
      where.archivado = false;
      if (zonas && zonas.length > 0) {
        where.estadoId = 1; // ESTADO_PAQUETE.ACTIVO
        where.fecha_fin = { gte: new Date() };
      }
    }

    const paqueteBaseConditions: Prisma.PaqueteBaseWhereInput = {};
    let hasPaqueteBaseConditions = false;

    if (categorias && categorias.length > 0) {
      paqueteBaseConditions.categoria_id = { in: categorias };
      hasPaqueteBaseConditions = true;
    }
    if (marcas && marcas.length > 0) {
      paqueteBaseConditions.marcaId = { in: marcas };
      hasPaqueteBaseConditions = true;
    }

    if (hasPaqueteBaseConditions) {
      where.paqueteBase = paqueteBaseConditions;
    }
    if (zonas && zonas.length > 0) {
      where.zonaId = { in: zonas };
    }
    if (tiposPaquete && tiposPaquete.length > 0) {
      where.tipo = { in: tiposPaquete as TipoPaquete[] };
    }

    if (estados && estados.length > 0) {
      const andConditions: Prisma.PaquetePublicadoWhereInput[] = [];

      estados.forEach((est) => {
        if (est === 'por-cerrar') {
          const hoy = new Date();
          const dentroDe5Dias = new Date(hoy);
          dentroDe5Dias.setDate(hoy.getDate() + 5);
          andConditions.push({
            fecha_fin: {
              gte: hoy,
              lte: dentroDe5Dias
            }
          });
        }
        if (est === 'recien-abiertos') {
          const hoy = new Date();
          const hace7Dias = new Date(hoy);
          hace7Dias.setDate(hoy.getDate() - 7);
          andConditions.push({
            fecha_inicio: {
              gte: hace7Dias,
              lte: hoy
            }
          });
        }
        if (est === 'populares') {
          andConditions.push({
            cant_usuarios_registrados: {
              gte: 10
            }
          });
        }
      });

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }
    }

    const paquetes = await this.prisma.paquetePublicado.findMany({
      orderBy: { id_paquete_publicado: 'desc' },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      where,
      include: {
        paqueteBase: {
          include: {
            marca: true,
            categoria: true,
            productos: true,
          }
        },
        zona: true,
        estado: true,
        pedidos: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
            detalles: true,
          },
        },
      },
    });
    return paquetes.map((p) => this._mapComputedFields(p as PaqueteComputable));
  }

  async countAll(
    includeArchived = false,
    categorias?: number[],
    marcas?: number[],
    zonas?: number[],
    tiposPaquete?: string[],
    estados?: string[]
  ): Promise<number> {
    const where: Prisma.PaquetePublicadoWhereInput = {};
    if (!includeArchived) {
      where.archivado = false;
      where.estadoId = 1;
      where.fecha_fin = { gte: new Date() };
    }

    const paqueteBaseConditions: Prisma.PaqueteBaseWhereInput = {};
    let hasPaqueteBaseConditions = false;

    if (categorias && categorias.length > 0) {
      paqueteBaseConditions.categoria_id = { in: categorias };
      hasPaqueteBaseConditions = true;
    }
    if (marcas && marcas.length > 0) {
      paqueteBaseConditions.marcaId = { in: marcas };
      hasPaqueteBaseConditions = true;
    }

    if (hasPaqueteBaseConditions) {
      where.paqueteBase = paqueteBaseConditions;
    }
    if (zonas && zonas.length > 0) {
      where.zonaId = { in: zonas };
    }
    if (tiposPaquete && tiposPaquete.length > 0) {
      where.tipo = { in: tiposPaquete as TipoPaquete[] };
    }

    if (estados && estados.length > 0) {
      const andConditions: Prisma.PaquetePublicadoWhereInput[] = [];

      estados.forEach((est) => {
        if (est === 'por-cerrar') {
          const hoy = new Date();
          const dentroDe5Dias = new Date(hoy);
          dentroDe5Dias.setDate(hoy.getDate() + 5);
          andConditions.push({
            fecha_fin: {
              gte: hoy,
              lte: dentroDe5Dias
            }
          });
        }
        if (est === 'recien-abiertos') {
          const hoy = new Date();
          const hace7Dias = new Date(hoy);
          hace7Dias.setDate(hoy.getDate() - 7);
          andConditions.push({
            fecha_inicio: {
              gte: hace7Dias,
              lte: hoy
            }
          });
        }
        if (est === 'populares') {
          andConditions.push({
            cant_usuarios_registrados: {
              gte: 10
            }
          });
        }
      });

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }
    }

    return this.prisma.paquetePublicado.count({ where });
  }

  async getById(id: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: {
        paqueteBase: {
          include: {
            marca: true,
            categoria: true,
            productos: {
              include: {
                producto: { include: { imagenes: true } },
              },
            },
          },
        },
        zona: true,
        estado: true,
        pedidos: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
            estado: true,
            detalles: {
              include: {
                producto: { include: { imagenes: true } },
              },
            },
          },
        },
      },
    });

    if (!paquete) return null;

    const { pedidos, ...rest } = paquete;
    const mappedPedidos = pedidos.map((p) => {
      const pRecord = p as PedidoComputable;
      const { detalles, ...pRest } = pRecord;
      return { ...pRest, pedidoProductos: detalles };
    });

    return this._mapComputedFields({
      ...rest,
      pedidos: mappedPedidos,
      descuento: rest.descuento ?? 0,
    } as PaqueteComputable);
  }

  async getByLocation(userId?: number, localidadId?: number) {
    let zonaIds: number[] = [];

    if (localidadId) {
      const localidad = await this.prisma.localidad.findUnique({
        where: { id_localidad: localidadId },
        include: { zonas: true },
      });
      if (localidad) {
        zonaIds = localidad.zonas.map((z: { id: number; localidadId: number; zonaId: number }) => z.zonaId);
      }
    } else if (userId) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: userId },
        include: {
          localidad: { include: { zonas: true } },
          direccion: { include: { localidad: { include: { zonas: true } } } },
        },
      });
      if (usuario?.localidad) {
        zonaIds = usuario.localidad.zonas.map(
          (z: { id: number; localidadId: number; zonaId: number }) => z.zonaId
        );
      } else if (usuario?.direccion?.localidad) {
        zonaIds = usuario.direccion.localidad.zonas.map(
          (z: { id: number; localidadId: number; zonaId: number }) => z.zonaId
        );
      }
    }

    if (zonaIds.length === 0) {
      console.warn('⚠️ No se encontraron zonas para la ubicación dada.');
      return [];
    }

    const ahora = new Date();

    return this.prisma.paquetePublicado.findMany({
      where: {
        zonaId: { in: zonaIds },
        estadoId: ESTADO_PAQUETE.ACTIVO,
        fecha_fin: { gte: ahora },
        archivado: false,
      },
      include: {
        paqueteBase: {
          include: {
            marca: true,
            categoria: true,
            productos: { include: { producto: { include: { imagenes: true } } } },
          },
        },
        zona: true,
        estado: true,
      },
    });
  }

  async getByProductId(productId: number) {
    return this.prisma.paquetePublicado.findMany({
      where: {
        paqueteBase: { productos: { some: { productoId: productId } } },
        estadoId: ESTADO_PAQUETE.ACTIVO,
        archivado: false,
      },
      include: {
        paqueteBase: { include: { marca: true, categoria: true } },
        zona: true,
        estado: true,
      },
    });
  }

  async getPorCerrarse() {
    const hoy = new Date();
    const dentroDe30Dias = new Date(hoy);
    dentroDe30Dias.setDate(hoy.getDate() + 30);

    const paquetes = await this.prisma.paquetePublicado.findMany({
      where: {
        estadoId: ESTADO_PAQUETE.ACTIVO,
        fecha_fin: { lte: dentroDe30Dias },
        archivado: false,
      },
      include: {
        paqueteBase: { include: { marca: true, categoria: true } },
        zona: { select: { nombre: true, id_zona: true } },
        estado: { select: { nombre: true, id_estado: true } },
        pedidos: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
            detalles: true,
          },
        },
      },
      orderBy: { fecha_fin: 'asc' },
    });

    return paquetes.map((p) => this._mapComputedFields(p as PaqueteComputable));
  }

  async getRelacionados(id: number) {
    const actual = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });

    if (!actual) throw new Error('Paquete no encontrado');

    const candidatos = await this.prisma.paquetePublicado.findMany({
      where: {
        id_paquete_publicado: { not: id },
        estadoId: ESTADO_PAQUETE.ACTIVO,
        archivado: false,
      },
      include: {
        paqueteBase: { include: { marca: true, categoria: true } },
        zona: true,
        estado: true,
        pedidos: {
          include: { usuario: { select: { id: true, nombre: true, email: true } } },
        },
      },
    });

    const scored = candidatos.map((p) => {
      let score = 0;
      if (p.zonaId === actual.zonaId) score += 1000;
      const ocupacion = (p.cant_usuarios_registrados || 0) / (p.cant_productos || 1);
      if (ocupacion >= 0.8) score += 500;
      if (actual.paqueteBase?.categoria_id && p.paqueteBase?.categoria_id === actual.paqueteBase.categoria_id) {
        score += 200;
      }
      return { paquete: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map((x) => x.paquete);
  }

  // ─── Mutaciones ───────────────────────────────────────────────────────────────

  async create(dto: Omit<PaquetePublicadoDTO, 'imagen_base64'>, imagenBuffer?: Buffer) {
    const zona = await this.prisma.zona.findUnique({ where: { id_zona: Number(dto.zonaId) } });
    if (!zona) throw new CustomError('La zona no existe', 404);

    const paqueteBase = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: dto.paqueteBaseId },
      include: {
        productos: {
          include: {
            producto: {
              include: { variantes: true }
            }
          }
        }
      }
    });
    if (!paqueteBase) throw new CustomError('El paquete base no existe', 404);
    if (paqueteBase.archivado) {
      throw new CustomError('No se puede publicar un paquete base archivado', 400);
    }

    if (paqueteBase.tipo === 'ENERGICO') {
      let totalStock = 0;
      for (const bp of paqueteBase.productos) {
        if (bp.producto.variantes && bp.producto.variantes.length > 0) {
          totalStock += bp.producto.variantes.reduce((sum, v) => sum + (v.stockFisico || 0), 0);
        } else {
          totalStock += bp.producto.stock || 0;
        }
      }
      if (totalStock <= 0) {
        throw new CustomError('No se puede publicar un paquete Enérgico si sus productos tienen stock físico 0. Por favor, configurá el stock en Gestión de Variantes antes de publicar.', 400);
      }
    }

    let imagen_url: string | undefined;
    if (imagenBuffer) {
      try {
        imagen_url = await this.imagenService.uploadToCloudinary(imagenBuffer, 'mercado_sinergico/paquetes_publicados');
      } catch (error) {
        console.error('Error al subir imagen de paquete publicado:', error);
      }
    }

    const nombrePublicacion = dto.nombre?.trim() || paqueteBase.nombre;
    await this.validarNombreUnico(nombrePublicacion);

    return this.prisma.paquetePublicado.create({
      data: {
        nombre: nombrePublicacion,
        cant_productos: dto.cant_productos,
        fecha_inicio: new Date(dto.fecha_inicio),
        fecha_fin: new Date(dto.fecha_fin),
        descuento: dto.descuento,
        // Heredar el tipo del paquete base (ENERGICO / SINERGICO)
        tipo: paqueteBase.tipo,
        ...(imagen_url && { imagen_url }),
        zona: { connect: { id_zona: Number(dto.zonaId) } },
        paqueteBase: { connect: { id_paquete_base: dto.paqueteBaseId } },
        estado: { connect: { id_estado: ESTADO_PAQUETE.ACTIVO } },
      },
    });
  }

  async update(id: number, dto: PaquetePublicadoUpdateDTO, imagenBuffer?: Buffer) {
    return this.prisma.$transaction(async (tx) => {
      const existente = await tx.paquetePublicado.findUnique({ where: { id_paquete_publicado: id } });
      if (!existente) throw new CustomError('No encontrado', 404);

      const nombrePublicacion = dto.nombre?.trim() || existente.nombre;
      await this.validarNombreUnico(nombrePublicacion, id);

      if (dto.paqueteBaseId) {
        const pb = await tx.paqueteBase.findUnique({
          where: { id_paquete_base: Number(dto.paqueteBaseId) },
        });
        if (!pb) throw new CustomError('El paquete base no existe', 404);
        if (pb.archivado) {
          throw new CustomError('No se puede conectar un paquete base archivado', 400);
        }
      }

      // Actualizar paqueteBase: descripcion y/o imagen
      const baseUpdate: Record<string, unknown> = {};
      if (dto.descripcion) baseUpdate.descripcion = dto.descripcion;
      if (dto.nombre) baseUpdate.nombre = nombrePublicacion;

      if (dto.imagen_base64) {
        try {
          const { ImagenService } = await import('./imagen.service.js');
          const imagenService = new ImagenService();
          // Convertir base64 data URL a buffer
          const base64Data = dto.imagen_base64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const url = await imagenService.uploadToCloudinary(buffer, 'paquetes_publicados');
          baseUpdate.imagen_url = url;
        } catch (e) {
          console.error('Error subiendo imagen a Cloudinary:', e);
          // No falla la operación completa si la imagen falla
        }
      }

      if (Object.keys(baseUpdate).length > 0) {
        await tx.paqueteBase.update({
          where: { id_paquete_base: existente.paqueteBaseId },
          data: {
            ...(dto.nombre && { nombre: nombrePublicacion }),
            ...(dto.descripcion && { descripcion: dto.descripcion }),
          },
        });
      }

      let imagen_url: string | undefined;
      if (imagenBuffer) {
        try {
          imagen_url = await this.imagenService.uploadToCloudinary(imagenBuffer, 'mercado_sinergico/paquetes_publicados');
        } catch (error) {
          console.error('Error al subir imagen:', error);
        }
      }

      return tx.paquetePublicado.update({
        where: { id_paquete_publicado: id },
        data: {
          ...(dto.nombre && { nombre: nombrePublicacion }),
          ...(dto.fecha_inicio && { fecha_inicio: new Date(dto.fecha_inicio) }),
          ...(dto.fecha_fin && { fecha_fin: new Date(dto.fecha_fin) }),
          ...(dto.cant_productos && { cant_productos: Number(dto.cant_productos) }),
          ...(dto.descuento !== undefined && { descuento: dto.descuento }),
          ...(dto.zonaId && { zona: { connect: { id_zona: Number(dto.zonaId) } } }),
          ...(dto.paqueteBaseId && { paqueteBase: { connect: { id_paquete_base: Number(dto.paqueteBaseId) } } }),
          ...(dto.estadoId && { estado: { connect: { id_estado: Number(dto.estadoId) } } }),
          ...(dto.estadoNombre && { estado: { connect: { nombre: dto.estadoNombre } } }),
          ...(imagen_url && { imagen_url }),
        },
      });
    });
  }

  /**
   * Valida que no exista otra publicación (no archivada) con el mismo nombre,
   * ignorando la propia publicación en edición cuando corresponde.
   */
  private async validarNombreUnico(nombre: string, excluirId?: number) {
    const nombreLimpio = nombre?.trim();
    if (!nombreLimpio) return;

    const existente = await this.prisma.paquetePublicado.findFirst({
      where: {
        nombre: { equals: nombreLimpio },
        archivado: false,
        ...(excluirId ? { id_paquete_publicado: { not: excluirId } } : {}),
      },
      select: { id_paquete_publicado: true },
    });

    if (existente) {
      throw new CustomError(
        `Ya existe una publicación con el nombre "${nombreLimpio}". Elegí otro nombre.`,
        409
      );
    }
  }

  async delete(id: number) {
    return this.archivar(id, true);
  }

  /** Descarta un duplicado: hard delete de la publicación y su paqueteBase asociado */
  async descartar(id: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { pedidos: true },
    });

    if (!paquete) throw new CustomError('Publicación no encontrada', 404);
    if (paquete.pedidos.length > 0) {
      throw new CustomError('No se puede descartar: tiene pedidos asociados.', 400);
    }

    const paqueteBaseId = paquete.paqueteBaseId;

    // 1. Hard delete de la publicación
    await this.prisma.paquetePublicado.delete({
      where: { id_paquete_publicado: id },
    });

    // 2. Si el paqueteBase no tiene otras publicaciones, eliminarlo también
    const otrasPublicaciones = await this.prisma.paquetePublicado.count({
      where: { paqueteBaseId },
    });

    if (otrasPublicaciones === 0) {
      await this.prisma.paqueteBaseProducto.deleteMany({
        where: { paqueteBaseId },
      });
      await this.prisma.paqueteBase.delete({
        where: { id_paquete_base: paqueteBaseId },
      });
    }

    return { message: 'Duplicación descartada correctamente.' };
  }

  async duplicar(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const generarNombreCopia = (nombreOriginal: string) => {
        const matchNumero = nombreOriginal.match(/ \(Copia (\d+)\)$/);
        if (matchNumero) {
          const numero = parseInt(matchNumero[1], 10) + 1;
          return nombreOriginal.replace(/ \(Copia \d+\)$/, ` (Copia ${numero})`);
        }
        if (nombreOriginal.endsWith(' (Copia)')) {
          return nombreOriginal.replace(/ \(Copia\)$/, ' (Copia 2)');
        }
        return `${nombreOriginal} (Copia 1)`;
      };

      // 1. Obtener la publicación original con su paquete base y productos
      const paqueteOriginal = await tx.paquetePublicado.findUnique({
        where: { id_paquete_publicado: id },
        include: {
          paqueteBase: {
            include: {
              productos: {
                include: {
                  producto: {
                    include: { variantes: true }
                  }
                }
              }
            },
          },
        },
      });

      if (!paqueteOriginal) {
        throw new CustomError(`Publicación con id=${id} no encontrada`, 404);
      }

      if (!paqueteOriginal.paqueteBase) {
        throw new CustomError(`La publicación id=${id} no tiene paquete base asociado`, 500);
      }

      if (paqueteOriginal.paqueteBase.tipo === 'ENERGICO') {
        let totalStock = 0;
        for (const bp of paqueteOriginal.paqueteBase.productos) {
          if (bp.producto.variantes && bp.producto.variantes.length > 0) {
            totalStock += bp.producto.variantes.reduce((sum, v) => sum + (v.stockFisico || 0), 0);
          } else {
            totalStock += bp.producto.stock || 0;
          }
        }
        if (totalStock <= 0) {
          throw new CustomError('No se puede duplicar un paquete Enérgico si sus productos tienen stock físico 0. Por favor, configurá el stock en Gestión de Variantes antes de duplicar.', 400);
        }
      }

      const estadoActivo = await tx.estadoPaquetePublicado.findUnique({
        where: { nombre: 'Activo' },
      });

      if (!estadoActivo) {
        throw new CustomError('Estado "Activo" no encontrado en la BD', 500);
      }

      // 2. Duplicar el paqueteBase con " (Copia X)" para que sea independiente
      const baseOriginal = paqueteOriginal.paqueteBase;
      const baseDuplicado = await tx.paqueteBase.create({
        data: {
          nombre: generarNombreCopia(baseOriginal.nombre),
          descripcion: baseOriginal.descripcion,
          imagen_url: baseOriginal.imagen_url,
          categoria_id: baseOriginal.categoria_id,
          marcaId: baseOriginal.marcaId,
          // Preservar el tipo del paquete base original
          tipo: baseOriginal.tipo,
        },
      });

      // 3. Duplicar las relaciones de productos del paquete base
      if (baseOriginal.productos.length > 0) {
        await tx.paqueteBaseProducto.createMany({
          data: baseOriginal.productos.map((p) => ({
            productoId: p.productoId,
            paqueteBaseId: baseDuplicado.id_paquete_base,
          })),
        });
      }

      // 4. Crear la nueva publicación apuntando al paqueteBase duplicado
      // fecha_fin: 30 días desde hoy por defecto (el admin la ajustará al editar)
      const fechaFinDefault = new Date();
      fechaFinDefault.setDate(fechaFinDefault.getDate() + 30);

      return await tx.paquetePublicado.create({
        data: {
          nombre: generarNombreCopia(paqueteOriginal.nombre || paqueteOriginal.paqueteBase.nombre),
          paqueteBaseId: baseDuplicado.id_paquete_base,
          zonaId: paqueteOriginal.zonaId,
          cant_productos: paqueteOriginal.cant_productos,
          estadoId: estadoActivo.id_estado,
          fecha_inicio: new Date(),
          fecha_fin: fechaFinDefault,
          // Heredar el tipo del paquete original
          tipo: paqueteOriginal.paqueteBase.tipo,
          // Contadores en 0: publicación nueva limpia
          cant_productos_reservados: 0,
          cant_usuarios_registrados: 0,
        },
      });
    });
  }

  async marcarCompleto(id: number) {
    // Primero buscar, después actualizar
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });
    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    await this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: { estadoId: ESTADO_PAQUETE.COMPLETO },
    });

    // Obtener compradores con pedidos Pagados
    const pedidosPagados = await this.prisma.pedido.findMany({
      where: { paquetePublicadoId: id, estadoId: ESTADO_PEDIDO.PAGADO },
      include: { usuario: true },
    });
    const correosCompradores = [...new Set(pedidosPagados.map((p) => p.usuario.email))];

    if (correosCompradores.length > 0) {
      this.emailService.enviarEmail({
        para: correosCompradores,
        asunto: `¡Grupo completo! - ${paquete.paqueteBase?.nombre}`,
        template: 'comprador-paquete-completo',
        context: {
          nombrePaquete: paquete.paqueteBase?.nombre,
          nombreUsuario: 'Comprador',
        },
      });
    }

    const admins = await this.prisma.usuario.findMany({
      where: { rol: { nombre: 'Administrador' } },
    });
    const correosAdmins = admins.map((a: { email: string }) => a.email);
    if (correosAdmins.length > 0) {
      this.emailService.enviarEmail({
        para: correosAdmins,
        asunto: `Acción requerida: Paquete completo - ${paquete.paqueteBase?.nombre}`,
        template: 'admin-paquete-completo',
        context: {
          nombrePaquete: paquete.paqueteBase?.nombre,
          paqueteId: id,
        },
      });
    }

    return { message: 'Paquete marcado como completo', id };
  }

  /**
   * Completo → Confirmado.
   * Transiciona todos los pedidos Pagados a En preparación y notifica compradores.
   */
  async confirmarCompraFabricante(id: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });
    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    const estadosValidos: number[] = [ESTADO_PAQUETE.COMPLETO, ESTADO_PAQUETE.ACTIVO];
    if (!estadosValidos.includes(paquete.estadoId)) {
      throw new CustomError('El paquete debe estar en estado Completo o Activo para confirmar', 400);
    }

    // Transición en una sola transacción
    await this.prisma.$transaction(async (tx) => {
      // Cambiar estado del paquete a Confirmado
      await tx.paquetePublicado.update({
        where: { id_paquete_publicado: id },
        data: { estadoId: ESTADO_PAQUETE.CONFIRMADO },
      });

      // Todos los pedidos Pagados → En preparación
      await tx.pedido.updateMany({
        where: {
          paquetePublicadoId: id,
          estadoId: ESTADO_PEDIDO.PAGADO,
        },
        data: { estadoId: ESTADO_PEDIDO.EN_PREPARACION },
      });
    });

    // Notificar compradores
    const pedidosEnPrep = await this.prisma.pedido.findMany({
      where: { paquetePublicadoId: id, estadoId: ESTADO_PEDIDO.EN_PREPARACION },
      include: { usuario: true },
    });
    const correosCompradores = [...new Set(pedidosEnPrep.map((p) => p.usuario.email))];

    if (correosCompradores.length > 0) {
      this.emailService.enviarEmail({
        para: correosCompradores,
        asunto: `¡Tu pedido está confirmado! - ${paquete.nombre || paquete.paqueteBase.nombre}`,
        template: 'comprador-pedido-confirmado',
        context: { nombrePaquete: paquete.nombre || paquete.paqueteBase.nombre },
      });
    }

    return { message: 'Compra confirmada. Pedidos en preparación.', notificados: correosCompradores.length };
  }

  /**
   * Confirmado → Entregado.
   * Transiciona todos los pedidos En preparación y En camino a Recibido.
   */
  async marcarEntregado(id: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });
    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    if (paquete.estadoId !== ESTADO_PAQUETE.CONFIRMADO) {
      throw new CustomError('El paquete debe estar Confirmado para marcarlo como Entregado', 400);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paquetePublicado.update({
        where: { id_paquete_publicado: id },
        data: { estadoId: ESTADO_PAQUETE.ENTREGADO },
      });

      // Pedidos En preparación y En camino → Recibido
      await tx.pedido.updateMany({
        where: {
          paquetePublicadoId: id,
          estadoId: { in: [ESTADO_PEDIDO.EN_PREPARACION, ESTADO_PEDIDO.EN_CAMINO] },
        },
        data: { estadoId: ESTADO_PEDIDO.RECIBIDO },
      });
    });

    despachadorEventosApp.emit(DespachadorEventos.PAQUETE_ENTREGADO, id);

    return { message: 'Paquete entregado. Pedidos marcados como recibidos.' };
  }

  /**
   * Marca pedidos específicos como En camino y envía email de aviso de entrega.
   * Si pedidoIds está vacío, marca todos los En preparación del paquete.
   */
  async marcarPedidosEnCamino(id: number, pedidoIds: number[]) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });
    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    if (paquete.estadoId !== ESTADO_PAQUETE.CONFIRMADO) {
      throw new CustomError('El paquete debe estar Confirmado para marcar pedidos en camino', 400);
    }

    const filtroIds = pedidoIds.length > 0
      ? { id_pedido: { in: pedidoIds }, paquetePublicadoId: id }
      : { paquetePublicadoId: id, estadoId: ESTADO_PEDIDO.EN_PREPARACION };

    // Actualizar estado de los pedidos seleccionados
    await this.prisma.pedido.updateMany({
      where: {
        ...filtroIds,
        estadoId: { in: [ESTADO_PEDIDO.EN_PREPARACION, ESTADO_PEDIDO.PAGADO] },
      },
      data: { estadoId: ESTADO_PEDIDO.EN_CAMINO },
    });

    // Obtener correos de los compradores afectados
    const pedidosAfectados = await this.prisma.pedido.findMany({
      where: { ...filtroIds, estadoId: ESTADO_PEDIDO.EN_CAMINO },
      include: { usuario: true },
    });
    const correosCompradores = [...new Set(pedidosAfectados.map((p) => p.usuario.email))];

    if (correosCompradores.length > 0) {
      this.emailService.enviarEmail({
        para: correosCompradores,
        asunto: `Tu pedido llega hoy - ${paquete.nombre || paquete.paqueteBase.nombre}`,
        template: 'comprador-pedido-en-camino',
        context: { nombrePaquete: paquete.nombre || paquete.paqueteBase.nombre },
      });
    }

    despachadorEventosApp.emit(DespachadorEventos.PEDIDOS_EN_CAMINO, { paqueteId: id, pedidoIds });

    return {
      message: 'Pedidos marcados como en camino',
      notificados: correosCompradores.length,
    };
  }

  /**
   * Cancela el paquete y reembolsa todos los pedidos Pagados y Pendientes.
   * Puede ser llamado desde el admin o desde el cron automático.
   */
  async cancelarYReembolsar(id: number) {
    // Obtener correos antes de cancelar
    const pedidosAfectados = await this.prisma.pedido.findMany({
      where: {
        paquetePublicadoId: id,
        estadoId: { in: [ESTADO_PEDIDO.PENDIENTE, ESTADO_PEDIDO.PAGADO] },
      },
      include: { usuario: true },
    });
    const correosCompradores = [...new Set(pedidosAfectados.map((p) => p.usuario.email))];

    const pedidoPagoService = new PedidoPagoService(mercadoPagoService);
    await pedidoPagoService.cancelarPaqueteYReembolsar(id);

    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });

    if (correosCompradores.length > 0 && paquete?.paqueteBase?.nombre) {
      this.emailService.enviarEmail({
        para: correosCompradores,
        asunto: `Paquete cancelado y reembolsado - ${paquete.nombre || paquete.paqueteBase.nombre}`,
        template: 'comprador-paquete-cancelado',
        context: { nombrePaquete: paquete.nombre || paquete.paqueteBase.nombre },
      });
    }

    despachadorEventosApp.emit(DespachadorEventos.PAQUETE_CANCELADO, id);

    return paquete;
  }

  /**
   * Notifica a compradores activos (Pagados) con un mensaje genérico.
   * Útil para comunicaciones manuales del administrador.
   */
  async notificarCompradores(id: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });
    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    const pedidosActivos = await this.prisma.pedido.findMany({
      where: {
        paquetePublicadoId: id,
        estadoId: {
          in: [
            ESTADO_PEDIDO.PENDIENTE,
            ESTADO_PEDIDO.PAGADO,
            ESTADO_PEDIDO.EN_PREPARACION,
            ESTADO_PEDIDO.EN_CAMINO,
          ],
        },
      },
      include: { usuario: true },
    });

    const correos = [...new Set(pedidosActivos.map((p) => p.usuario.email))];

    if (correos.length === 0) {
      return { mensaje: 'No hay compradores activos para notificar.', notificados: 0 };
    }

    await this.emailService.enviarEmail({
      para: correos,
      asunto: `Aviso sobre tu pedido - ${paquete.paqueteBase?.nombre}`,
      template: 'comprador-aviso-cierre',
      context: { nombrePaquete: paquete.paqueteBase?.nombre },
    });

    return { mensaje: 'Notificación enviada correctamente.', notificados: correos.length };
  }

  async archivar(id: number, archivado: boolean) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
    });
    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }
    const updated = await this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: { archivado },
      include: this._includeCompleto,
    });
    return this._mapComputedFields(updated as PaqueteComputable);
  }

  async exportarFabrica(id: number): Promise<Buffer> {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: {
        paqueteBase: {
          include: {
            productos: {
              include: {
                producto: {
                  include: {
                    marca: true,
                    variantes: {
                      include: {
                        opciones: {
                          include: {
                            caracteristica: true,
                            opcion: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        zona: true,
        pedidos: {
          include: {
            detalles: {
              include: {
                producto: {
                  include: {
                    marca: true,
                  },
                },
                variante: {
                  include: {
                    opciones: {
                      include: {
                        caracteristica: true,
                        opcion: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    const pedidosAprobados = (paquete.pedidos || []).filter(
      (ped) => ped.estadoId !== 1 && ped.estadoId !== 3
    );

    const consolidado = new Map<
      string,
      {
        sku: string;
        producto: string;
        variante: string;
        marca: string;
        amount?: any;
        cantidadTotal: number;
      }
    >();

    pedidosAprobados.forEach((pedido: any) => {
      pedido.detalles?.forEach((pp: any) => {
        let varianteStr = '-';
        let skuVal = pp.variante?.sku || String(pp.productoId);

        if (pp.variante?.opciones?.length > 0) {
          varianteStr = pp.variante.opciones
            .map((o: any) => `${o.caracteristica.nombre}: ${o.opcion.nombre}`)
            .join(', ');
        }

        const key = `${pp.productoId}-${varianteStr}`;
        const current = consolidado.get(key) || {
          sku: skuVal,
          producto: pp.producto?.nombre || 'N/A',
          variante: varianteStr,
          marca: pp.producto?.marca?.nombre || 'N/A',
          cantidadTotal: 0,
        };

        current.cantidadTotal += pp.cantidad;
        consolidado.set(key, current);
      });
    });

    const dataRows: any[][] = [];
    consolidado.forEach((info) => {
      dataRows.push([
        info.sku,
        info.producto,
        info.variante,
        info.marca,
        info.cantidadTotal,
      ]);
    });

    const now = new Date().toLocaleString('es-AR');
    const rows = [
      ['# REPORTES MERCADO SINERGICO #'],
      ['Tipo', 'REPORTE PARA PROVEEDOR'],
      ['Paquete', `${paquete.paqueteBase?.nombre || 'N/A'} (ID: ${paquete.id_paquete_publicado})`],
      ['Zona', paquete.zona?.nombre || 'N/A'],
      ['Fecha Generacion', now],
      ['Pedidos Aprobados', pedidosAprobados.length],
      [],
      ['SKU', 'Producto', 'Variante/Modelo', 'Marca', 'Cantidad Total'],
      ...dataRows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 20 }, // SKU
      { wch: 30 }, // Producto
      { wch: 30 }, // Variante
      { wch: 20 }, // Marca
      { wch: 15 }, // Cantidad Total
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidado');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }

  async exportarLogistica(id: number): Promise<Buffer> {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: {
        paqueteBase: true,
        zona: true,
        pedidos: {
          include: {
            estado: true,
            usuario: {
              include: {
                direccion: {
                  include: {
                    localidad: true,
                  },
                },
              },
            },
            detalles: {
              include: {
                producto: {
                  include: {
                    marca: true,
                  },
                },
                variante: {
                  include: {
                    opciones: {
                      include: {
                        caracteristica: true,
                        opcion: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    // Filtrar pedidos aprobados (todos los que no son Pendientes (1) ni Reembolsados (3))
    const pedidosAprobados = (paquete.pedidos || []).filter(
      (ped) => ped.estadoId !== 1 && ped.estadoId !== 3
    );

    const dataRows: any[][] = [];

    pedidosAprobados.forEach((ped: any) => {
      const idPed = ped.id_pedido ?? 'N/A';
      const nombre = ped.usuario?.nombre || 'N/A';
      const telefono = ped.usuario?.telefono || 'N/A';
      const email = ped.usuario?.email || 'N/A';

      const dir = ped.usuario?.direccion;
      const direccion = dir
        ? `${dir.calle} ${dir.numero}${dir.piso ? ', Piso ' + dir.piso : ''}${
            dir.departamento ? ', Depto ' + dir.departamento : ''
          }${dir.localidad?.nombre ? ', ' + dir.localidad.nombre : ''}`
        : 'N/A';

      let estadoLabel = 'Desconocido';
      switch (ped.estadoId) {
        case 2: estadoLabel = 'Pagado'; break;
        case 4: estadoLabel = 'En preparación'; break;
        case 5: estadoLabel = 'En camino'; break;
        case 6: estadoLabel = 'Recibido'; break;
        default: estadoLabel = ped.estado?.nombre || 'N/A';
      }

      // Una fila por cada producto del pedido (datos divididos)
      (ped.detalles || []).forEach((det: any) => {
        let varianteStr = '-';
        if (det.variante?.opciones?.length > 0) {
          varianteStr = det.variante.opciones
            .map((o: any) => `${o.caracteristica.nombre}: ${o.opcion.nombre}`)
            .join(', ');
        } else if (det.variante?.sku) {
          varianteStr = det.variante.sku;
        }

        const productoNombre = det.producto?.nombre || 'N/A';
        const marcaNombre = det.producto?.marca?.nombre || 'N/A';
        const cantidad = det.cantidad ?? 0;

        dataRows.push([
          idPed,
          nombre,
          telefono,
          email,
          direccion,
          productoNombre,
          varianteStr,
          marcaNombre,
          cantidad,
          estadoLabel,
        ]);
      });
    });

    const now = new Date().toLocaleString('es-AR');
    const rows = [
      ['# REPORTES MERCADO SINERGICO #'],
      ['Tipo', 'HOJA DE RUTA / LOGISTICA'],
      ['Paquete', `${paquete.paqueteBase?.nombre || 'N/A'} (ID: ${paquete.id_paquete_publicado})`],
      ['Zona', paquete.zona?.nombre || 'N/A'],
      ['Fecha Generacion', now],
      ['Pedidos Aprobados', pedidosAprobados.length],
      [],
      [
        'ID Pedido',
        'Comprador',
        'Teléfono',
        'Email',
        'Dirección de Entrega',
        'Producto',
        'Variante',
        'Marca',
        'Cantidad',
        'Estado',
      ],
      ...dataRows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 10 }, // ID Pedido
      { wch: 22 }, // Comprador
      { wch: 15 }, // Teléfono
      { wch: 28 }, // Email
      { wch: 35 }, // Dirección
      { wch: 28 }, // Producto
      { wch: 28 }, // Variante
      { wch: 18 }, // Marca
      { wch: 10 }, // Cantidad
      { wch: 15 }, // Estado
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logistica');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }
}
