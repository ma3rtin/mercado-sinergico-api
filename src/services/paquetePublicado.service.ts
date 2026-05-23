import { PaquetePublicadoDTO } from '../dtos/paquete/paquetePublicado.dto.js';
import { PaquetePublicadoUpdateDTO } from '../dtos/paquete/paquetePublicadoUpdate.dto.js';
import { CustomError } from '../errors/custom.error.js';
import { prisma } from '../prisma/client.js';
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

    return {
      ...paquete,
      tipo: paquete.tipo === 'POR_DEFINIR' && paquete.paqueteBase?.tipo 
        ? paquete.paqueteBase.tipo 
        : paquete.tipo,
      cant_usuarios_registrados: usuariosIds.size > 0 ? usuariosIds.size : paquete.cant_usuarios_registrados,
      cant_productos_reservados: reservados > 0 ? reservados : paquete.cant_productos_reservados,
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

  async getAll(skip?: number, take?: number) {
    const paquetes = await this.prisma.paquetePublicado.findMany({
      orderBy: { id_paquete_publicado: 'desc' },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      include: {
        paqueteBase: { include: { marca: true, categoria: true } },
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

    return this.prisma.paquetePublicado.create({
      data: {
        nombre: paqueteBase.nombre,
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

      // Actualizar paqueteBase: descripcion y/o imagen
      const baseUpdate: Record<string, unknown> = {};
      if (dto.descripcion) baseUpdate.descripcion = dto.descripcion;
      if (dto.nombre) baseUpdate.nombre = dto.nombre;

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
            ...(dto.nombre && { nombre: dto.nombre }),
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
          ...(dto.nombre && { nombre: dto.nombre }),
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

  async delete(id: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { pedidos: { select: { id_pedido: true } } },
    });
    if (!paquete) throw new CustomError('No encontrado', 404);
    if (paquete.pedidos.length > 0) {
      throw new CustomError('No se puede borrar: tiene pedidos asociados.', 400);
    }

    // Intentar soft-delete con estado Cerrado (más seguro que Eliminado que puede no existir)
    const estadoCerrado = await this.prisma.estadoPaquetePublicado.findFirst({
      where: { nombre: { in: ['Cerrado', 'Cancelado', 'Eliminado'] } },
      orderBy: { id_estado: 'asc' },
    });

    if (estadoCerrado) {
      return this.prisma.paquetePublicado.update({
        where: { id_paquete_publicado: id },
        data: { estadoId: estadoCerrado.id_estado },
      });
    }

    // Si no existe ningún estado terminal, hacer hard delete
    return this.prisma.paquetePublicado.delete({
      where: { id_paquete_publicado: id },
    });
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
          nombre: paqueteOriginal.paqueteBase.nombre,
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
        asunto: `¡Tu pedido está confirmado! - ${paquete.paqueteBase.nombre}`,
        template: 'comprador-pedido-confirmado',
        context: { nombrePaquete: paquete.paqueteBase.nombre },
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
        asunto: `Tu pedido llega hoy - ${paquete.paqueteBase.nombre}`,
        template: 'comprador-pedido-en-camino',
        context: { nombrePaquete: paquete.paqueteBase.nombre },
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
        asunto: `Paquete cancelado y reembolsado - ${paquete.paqueteBase.nombre}`,
        template: 'comprador-paquete-cancelado',
        context: { nombrePaquete: paquete.paqueteBase.nombre },
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
}
