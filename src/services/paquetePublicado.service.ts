import { PaquetePublicadoDTO } from '../dtos/paquete/paquetePublicado.dto.js';
import { PaquetePublicadoUpdateDTO } from '../dtos/paquete/paquetePublicadoUpdate.dto.js';
import { CustomError } from '../errors/custom.error.js';
import { prisma } from '../prisma/client.js';
import { EmailService } from './email.service.js';

// ─── Estados canónicos ──────────────────────────────────────────────────────
// EstadoPaquetePublicado: Activo | Completo | Confirmado | Recibido | Cancelado | Eliminado
// EstadoPedido          : Pendiente | Confirmado | Completo | Recibido | Cancelado | Reembolsando
// ────────────────────────────────────────────────────────────────────────────
import { PedidoPagoService } from './pedidoPago.service.js';
import { mercadoPagoService } from '../payments/mercadopago/mercadopago.service.js';
import { ImagenService } from './imagen.service.js';
import { despachadorEventosApp, DespachadorEventos } from '../events/despachadorEventos.js';

// ─── IDs de estado (sincronizados con script.sql) ───────────────────────────
const ESTADO_PAQUETE = {
  ACTIVO: 1,
  COMPLETO: 2,
  CONFIRMADO: 3,
  ENTREGADO: 4,
  CANCELADO: 5,
} as const;

const ESTADO_PEDIDO = {
  PENDIENTE: 1,
  PAGADO: 2,
  REEMBOLSADO: 3,
  EN_PREPARACION: 4,
  EN_CAMINO: 5,
  RECIBIDO: 6,
} as const;

// ─── Tipos utilitarios ────────────────────────────────────────────────────────
export type DetalleComputable = { cantidad?: number;[key: string]: unknown };

export type PedidoComputable = {
  estadoId?: number;
  estado?: { nombre?: string } | null;
  usuario?: { id?: number };
  usuarioId?: number;
  detalles?: DetalleComputable[];
  pedidoProductos?: DetalleComputable[];
  monto_total?: string | number | null;
  [key: string]: unknown;
};

export type PaqueteComputable = {
  pedidos?: PedidoComputable[];
  cant_usuarios_registrados?: number;
  cant_productos_reservados?: number;
  monto_total?: number | string | null;
  [key: string]: unknown;
};

// Pedidos considerados "activos" para el cómputo de métricas del paquete
const ESTADOS_PEDIDO_ACTIVOS = ['Pendiente', 'Confirmado', 'Completo', 'Recibido'];

export class PaquetePublicadoService {
  private prisma = prisma;
  private emailService = new EmailService();
  private imagenService = new ImagenService();

  // ─── Helpers de estado ─────────────────────────────────────────────────────

  /** Busca un EstadoPaquetePublicado por nombre y lanza error si no existe. */
  private async getEstadoPaquete(nombre: string) {
    const estado = await this.prisma.estadoPaquetePublicado.findUnique({
      where: { nombre },
    });
    if (!estado) throw new CustomError(`Estado de publicación "${nombre}" no encontrado en la BD`, 500);
    return estado;
  }

  /** Busca un EstadoPedido por nombre y lanza error si no existe. */
  private async getEstadoPedido(nombre: string) {
    const estado = await this.prisma.estadoPedido.findUnique({
      where: { nombre },
    });
    if (!estado) throw new CustomError(`Estado de pedido "${nombre}" no encontrado en la BD`, 500);
    return estado;
  }

  // ─── Cómputo de métricas ───────────────────────────────────────────────────

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
      cant_usuarios_registrados: usuariosIds.size > 0 ? usuariosIds.size : paquete.cant_usuarios_registrados,
      cant_productos_reservados: reservados > 0 ? reservados : paquete.cant_productos_reservados,
      monto_total: recaudacion > 0 ? recaudacion : paquete.monto_total,
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
            estado: { select: { nombre: true } },
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

    if (zonaIds.length === 0) return [];

    return this.prisma.paquetePublicado.findMany({
      where: {
        zonaId: { in: zonaIds },
        estadoId: ESTADO_PAQUETE.ACTIVO,
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

    const paqueteBase = await this.prisma.paqueteBase.findUnique({ where: { id_paquete_base: dto.paqueteBaseId } });
    if (!paqueteBase) throw new CustomError('El paquete base no existe', 404);

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
        nombre: dto.nombre,
        cant_productos: dto.cant_productos,
        fecha_inicio: new Date(dto.fecha_inicio),
        fecha_fin: new Date(dto.fecha_fin),
        descuento: dto.descuento,
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

      if (dto.nombre || dto.descripcion) {
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
          // Priorizar nombre sobre ID para evitar desincronización
          ...(dto.estadoNombre
            ? { estado: { connect: { nombre: dto.estadoNombre } } }
            : dto.estadoId
              ? { estado: { connect: { id_estado: Number(dto.estadoId) } } }
              : {}),
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
    // Borrado físico cuando no tiene pedidos
    return this.prisma.paquetePublicado.delete({ where: { id_paquete_publicado: id } });
  }

  async duplicar(id: number) {
    const original = await this.prisma.paquetePublicado.findUnique({ where: { id_paquete_publicado: id } });
    if (!original) throw new CustomError(`Publicación con id=${id} no encontrada`, 404);

    return this.prisma.paquetePublicado.create({
      data: {
        nombre: original.nombre,
        paqueteBaseId: original.paqueteBaseId,
        zonaId: original.zonaId,
        fecha_inicio: new Date(),
        fecha_fin: original.fecha_fin,
        cant_productos: original.cant_productos,
        imagen_url: original.imagen_url,
        tipo: original.tipo,
        descuento: original.descuento,
        estadoId: ESTADO_PAQUETE.ACTIVO,
      },
    });
  }

  // ─── Transiciones de estado ───────────────────────────────────────────────────

  /**
   * Activo → Completo (llamado por el evento PAQUETE_COMPLETO o manualmente).
   * Notifica a compradores y admin.
   */
  async marcarCompleto(id: number) {
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
        asunto: `¡Grupo completo! - ${paquete.paqueteBase.nombre}`,
        template: 'comprador-paquete-completo',
        context: {
          nombrePaquete: paquete.paqueteBase.nombre,
          nombreUsuario: 'Comprador',
        },
      });
    }

    // Notificar admins
    const admins = await this.prisma.usuario.findMany({ where: { rol: { nombre: 'Administrador' } } });
    const correosAdmins = admins.map((a: { email: string }) => a.email);
    if (correosAdmins.length > 0) {
      this.emailService.enviarEmail({
        para: correosAdmins,
        asunto: `Acción requerida: Paquete completo - ${paquete.paqueteBase.nombre}`,
        template: 'admin-paquete-completo',
        context: {
          nombrePaquete: paquete.paqueteBase.nombre,
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

    // Notificar a todos los pedidos activos (no cancelados ni reembolsando)
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
