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

  private _mapComputedFields<T extends PaqueteComputable>(paquete: T) {
    if (!paquete) return paquete;

    // Filtra pedidos activos: usa el nombre si viene incluido, o excluye Cancelado(5)/Reembolsando(6) por ID como fallback
    const pedidosActivos = (paquete.pedidos || []).filter((p) => {
      if (p.estado?.nombre) return ESTADOS_PEDIDO_ACTIVOS.includes(p.estado.nombre);
      return p.estadoId !== undefined && ![5, 6].includes(p.estadoId);
    });

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

  // ─── Pedidos include con estado ────────────────────────────────────────────

  private get pedidosIncludeConEstado() {
    return {
      include: {
        estado: { select: { nombre: true } },
        usuario: { select: { id: true, nombre: true, email: true } },
        detalles: true,
      },
    };
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  async getAll() {
    const paquetes = await this.prisma.paquetePublicado.findMany({
      include: {
        paqueteBase: {
          include: {
            marca: true,
            categoria: true,
          },
        },
        zona: true,
        estado: true,
        pedidos: this.pedidosIncludeConEstado,
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
                producto: {
                  include: {
                    imagenes: true,
                  },
                },
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
            detalles: {
              include: {
                producto: {
                  include: {
                    imagenes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (paquete) {
      const { pedidos, ...rest } = paquete;
      const mappedPedidos = pedidos.map((p) => {
        const pRecord = p as PedidoComputable;
        const { detalles, ...pRest } = pRecord;
        return {
          ...pRest,
          pedidoProductos: detalles,
        };
      });

      const paqueteMapeado = {
        ...rest,
        pedidos: mappedPedidos,
        descuento: 10,
      };

      return this._mapComputedFields(paqueteMapeado as PaqueteComputable);
    }
    return null;
  }

  async getByLocation(userId?: number, localidadId?: number) {
    let zonaIds: number[] = [];

    if (localidadId) {
      console.log('🔎 Buscando zonas para localidad ID:', localidadId);
      const localidad = await this.prisma.localidad.findUnique({
        where: { id_localidad: localidadId },
        include: { zonas: true },
      });

      if (localidad) {
        zonaIds = localidad.zonas.map((z: { id: number; localidadId: number; zonaId: number }) => z.zonaId);
      }
    } else if (userId) {
      console.log('🔎 Buscando zonas para usuario ID:', userId);
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: userId },
        include: {
          localidad: {
            include: { zonas: true },
          },
          direccion: {
            include: {
              localidad: {
                include: {
                  zonas: true,
                },
              },
            },
          },
        },
      });

      if (usuario) {
        if (usuario.localidad) {
          console.log('✅ Usando localidad preferida del usuario');
          zonaIds = usuario.localidad.zonas.map(
            (z: { id: number; localidadId: number; zonaId: number }) => z.zonaId
          );
        } else if (usuario.direccion && usuario.direccion.localidad) {
          console.log('✅ Usando dirección del usuario');
          zonaIds = usuario.direccion.localidad.zonas.map(
            (z: { id: number; localidadId: number; zonaId: number }) => z.zonaId
          );
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
        estado: { nombre: 'Activo' },
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
                    imagenes: true,
                  },
                },
              },
            },
          },
        },
        zona: true,
        estado: true,
      },
    });
  }

  async getByProductId(productId: number) {
    return await this.prisma.paquetePublicado.findMany({
      where: {
        paqueteBase: {
          productos: {
            some: {
              productoId: productId,
            },
          },
        },
        estado: { nombre: 'Activo' },
      },
      include: {
        paqueteBase: {
          include: {
            marca: true,
            categoria: true,
          },
        },
        zona: true,
        estado: true,
      },
    });
  }

  async create(dto: Omit<PaquetePublicadoDTO, 'imagen_base64'>, imagenBuffer?: Buffer) {
    const fecha_inicio = new Date(dto.fecha_inicio);
    const fecha_fin = new Date(dto.fecha_fin);

    const zona = await this.prisma.zona.findUnique({
      where: { id_zona: Number(dto.zonaId) },
    });

    if (!zona) throw new CustomError('La zona no existe', 404);

    const paqueteBase = await this.prisma.paqueteBase.findUnique({
      where: { id_paquete_base: dto.paqueteBaseId },
    });

    if (!paqueteBase) throw new CustomError('El paquete base no existe', 404);

    let imagen_url: string | undefined = undefined;
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
        fecha_inicio,
        fecha_fin,
        descuento: dto.descuento,
        ...(imagen_url && { imagen_url }),
        zona: { connect: { id_zona: Number(dto.zonaId) } },
        paqueteBase: { connect: { id_paquete_base: dto.paqueteBaseId } },
        estado: { connect: { nombre: 'Activo' } },
      },
    });
  }

  async update(id: number, dto: PaquetePublicadoUpdateDTO, imagenBuffer?: Buffer) {
    return this.prisma.$transaction(async (tx) => {
      const paqueteExistente = await tx.paquetePublicado.findUnique({
        where: { id_paquete_publicado: id },
      });

      if (!paqueteExistente) throw new CustomError('No encontrado', 404);

      if (dto.nombre || dto.descripcion) {
        await tx.paqueteBase.update({
          where: { id_paquete_base: paqueteExistente.paqueteBaseId },
          data: {
            ...(dto.nombre && { nombre: dto.nombre }),
            ...(dto.descripcion && { descripcion: dto.descripcion }),
          },
        });
      }

      let imagen_url: string | undefined = undefined;
      if (imagenBuffer) {
        try {
          imagen_url = await this.imagenService.uploadToCloudinary(imagenBuffer, 'mercado_sinergico/paquetes_publicados');
        } catch (error) {
          console.error('Error al subir imagen de paquete publicado:', error);
        }
      }

      return await tx.paquetePublicado.update({
        where: { id_paquete_publicado: id },
        data: {
          ...(dto.nombre && { nombre: dto.nombre }),
          ...(dto.fecha_inicio && { fecha_inicio: new Date(dto.fecha_inicio) }),
          ...(dto.fecha_fin && { fecha_fin: new Date(dto.fecha_fin) }),
          ...(dto.cant_productos && { cant_productos: Number(dto.cant_productos) }),
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
      include: {
        pedidos: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
          },
        },
      },
    });

    if (!paquete) throw new CustomError('No encontrado', 404);
    if (paquete.pedidos.length > 0) {
      throw new CustomError('No se puede borrar: tiene pedidos asociados.', 400);
    }

    return this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: { estado: { connect: { nombre: 'Eliminado' } } },
    });
  }

  async duplicar(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const paqueteOriginal = await tx.paquetePublicado.findUnique({
        where: { id_paquete_publicado: id },
      });

      if (!paqueteOriginal) {
        throw new CustomError(`Publicación con id=${id} no encontrada`, 404);
      }

      const estadoActivo = await tx.estadoPaquetePublicado.findUnique({
        where: { nombre: 'Activo' },
      });

      if (!estadoActivo) {
        throw new CustomError('Estado "Activo" no encontrado en la BD', 500);
      }

      return await tx.paquetePublicado.create({
        data: {
          nombre: paqueteOriginal.nombre,
          paqueteBaseId: paqueteOriginal.paqueteBaseId,
          zonaId: paqueteOriginal.zonaId,
          fecha_inicio: new Date(),
          fecha_fin: paqueteOriginal.fecha_fin,
          cant_productos: paqueteOriginal.cant_productos,
          monto_total: paqueteOriginal.monto_total,
          imagen_url: paqueteOriginal.imagen_url,
          tipo: paqueteOriginal.tipo,
          descuento: paqueteOriginal.descuento,
          estadoId: estadoActivo.id_estado
        },
      });
    });
  }

  /**
   * Marca el paquete como "Completo" (cupo lleno).
   * Actualiza en cascada todos los pedidos activos a estado "Completo".
   * El usuario NO puede cancelar a partir de este momento.
   */
  async completar(id: number) {
    const estadoCompleto = await this.getEstadoPaquete('Completo');
    const estadoPedidoCompleto = await this.getEstadoPedido('Completo');

    const result = await this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: {
        estado: { connect: { id_estado: estadoCompleto.id_estado } },
      },
      include: {
        paqueteBase: { include: { marca: true, categoria: true } },
        zona: true,
        estado: true,
        pedidos: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
          },
        },
      },
    });

    // Actualizar en cascada todos los pedidos activos del paquete (excepto Cancelado y Reembolsando)
    await this.prisma.pedido.updateMany({
      where: {
        paquetePublicadoId: id,
        estado: { nombre: { notIn: ['Cancelado', 'Reembolsando'] } },
      },
      data: { estadoId: estadoPedidoCompleto.id_estado },
    });

    const paquete = result;
    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    // Obtener compradores para notificación
    const pedidosActivos = await this.prisma.pedido.findMany({
      where: {
        paquetePublicadoId: id,
        estado: { nombre: 'Completo' },
      },
      include: { usuario: true },
    });

    const correosCompradores = [...new Set(pedidosActivos.map((p) => p.usuario.email))];

    if (correosCompradores.length > 0) {
      this.emailService.enviarEmail({
        para: correosCompradores,
        asunto: `🎉 ¡Paquete Completado! - ${paquete.paqueteBase?.nombre}`,
        template: 'comprador-paquete-completado',
        context: { nombrePaquete: paquete.paqueteBase?.nombre },
      });
    }

    // Notificar al admin
    this.emailService.enviarEmail({
      para: process.env.MAILER_EMAIL || 'admin@mercadosinergico.com',
      asunto: `🚨 Acción Requerida: Paquete Completado - ${paquete.paqueteBase?.nombre}`,
      template: 'admin-paquete-completado',
      context: {
        nombrePaquete: paquete.paqueteBase?.nombre,
        paqueteId: paquete.id_paquete_publicado,
      },
    });

    return result;
  }

  /**
   * Cierre manual del paquete por el admin (antes de llegar al cupo).
   * El paquete pasa igualmente a "Completo" y los pedidos también.
   */
  async cerrarManual(id: number) {
    try {
      const estadoCompleto = await this.getEstadoPaquete('Completo');
      const estadoPedidoCompleto = await this.getEstadoPedido('Completo');

      const paquete = await this.prisma.paquetePublicado.findUnique({
        where: { id_paquete_publicado: id },
        include: { paqueteBase: true },
      });

      if (!paquete) throw new CustomError('Paquete no encontrado', 404);

      const result = await this.prisma.paquetePublicado.update({
        where: { id_paquete_publicado: id },
        data: {
          estado: { connect: { id_estado: estadoCompleto.id_estado } },
        },
        include: {
          paqueteBase: { include: { marca: true, categoria: true } },
          zona: true,
          estado: true,
          pedidos: {
            include: {
              usuario: { select: { id: true, nombre: true, email: true } },
            },
          },
        },
      });

      // Actualizar pedidos activos en cascada
      await this.prisma.pedido.updateMany({
        where: {
          paquetePublicadoId: id,
          estado: { nombre: { notIn: ['Cancelado', 'Reembolsando'] } },
        },
        data: { estadoId: estadoPedidoCompleto.id_estado },
      });

      const faltantes = (paquete.cant_productos || 0) - (paquete.cant_usuarios_registrados || 0);

      // Notificar compradores
      const pedidosActivos = await this.prisma.pedido.findMany({
        where: { paquetePublicadoId: id, estadoId: estadoPedidoCompleto.id_estado },
        include: { usuario: true },
      });
      const correos = [...new Set(pedidosActivos.map((p) => p.usuario.email))];

      if (correos.length > 0 && paquete.paqueteBase?.nombre) {
        this.emailService.enviarEmail({
          para: correos,
          asunto: `📦 Paquete Completo - ${paquete.paqueteBase.nombre}`,
          template: 'comprador-paquete-cerrado-anticipado',
          context: { nombrePaquete: paquete.paqueteBase.nombre },
        });
      }

      return { result, faltantes };
    } catch (error) {
      console.error('Error al cerrar manual:', error);
      if (error instanceof CustomError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      throw new CustomError('Error interno al cerrar manualmente el paquete. ' + msg, 500);
    }
  }

  /**
   * Cancela el paquete y dispara el reembolso de todos los pedidos pendientes.
   * Los pedidos ya cancelados o en reembolso se omiten.
   */
  async cancelarYReembolsar(id: number) {
    const paqueteInicial = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });

    if (!paqueteInicial) throw new CustomError('Paquete no encontrado', 404);

    // 1. Obtener los pedidos afectados ANTES de actualizarlos (para extraer correos)
    const pedidosAfectados = await this.prisma.pedido.findMany({
      where: {
        paquetePublicadoId: id,
        estado: { nombre: { notIn: ['Cancelado', 'Reembolsando'] } },
      },
      include: { usuario: true },
    });
    const correosCompradores = [...new Set(pedidosAfectados.map((p) => p.usuario.email))];

    // 2. Usar el PedidoPagoService para cancelar, devolver stock, reembolsar a los pagados y cambiar estados
    const pedidoPagoService = new PedidoPagoService(mercadoPagoService);
    await pedidoPagoService.cancelarPaqueteYReembolsar(id);

    // 3. Notificar a los compradores
    if (correosCompradores.length > 0 && paqueteInicial.paqueteBase?.nombre) {
      this.emailService.enviarEmail({
        para: correosCompradores,
        asunto: `🚫 Paquete Cancelado y Reembolsado - ${paqueteInicial.paqueteBase.nombre}`,
        template: 'comprador-paquete-cancelado',
        context: { nombrePaquete: paqueteInicial.paqueteBase.nombre },
      });
    }

    const paqueteFinal = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: {
        paqueteBase: { include: { marca: true, categoria: true } },
        zona: true,
        estado: true,
        pedidos: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
          },
        },
      },
    });

    return paqueteFinal;
  }

  async getPorCerrarse() {
    const hoy = new Date();
    const dentroDexDias = new Date(hoy);
    dentroDexDias.setDate(hoy.getDate() + 30);

    console.log('🔎 Buscando paquetes entre:', hoy, 'y', dentroDexDias);

    const paquetes = await this.prisma.paquetePublicado.findMany({
      where: {
        estado: {
          // Solo paquetes Activos pueden "cerrarse" próximamente
          nombre: 'Activo',
        },
        fecha_fin: {
          lte: dentroDexDias,
        },
      },
      include: {
        paqueteBase: {
          include: {
            marca: true,
            categoria: true,
          },
        },
        zona: {
          select: { nombre: true, id_zona: true },
        },
        estado: {
          select: { nombre: true, id_estado: true },
        },
        pedidos: this.pedidosIncludeConEstado,
      },
      orderBy: { fecha_fin: 'asc' },
    });

    console.log(`✅ ${paquetes.length} paquetes encontrados`);
    return paquetes.map((p) => this._mapComputedFields(p as PaqueteComputable));
  }

  async getRelacionados(id: number) {
    const currentPaquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: {
        paqueteBase: true,
      },
    });

    if (!currentPaquete) throw new Error('Paquete no encontrado');

    const currentZonaId = currentPaquete.zonaId;
    const currentCategoriaId = currentPaquete.paqueteBase?.categoria_id;

    // Solo paquetes activos (los únicos a los que puede sumarse un usuario)
    const candidatos = await this.prisma.paquetePublicado.findMany({
      where: {
        id_paquete_publicado: { not: id },
        estado: { nombre: 'Activo' },
      },
      include: {
        paqueteBase: {
          include: {
            marca: true,
            categoria: true,
          },
        },
        zona: true,
        estado: true,
        pedidos: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
          },
        },
      },
    });

    const scoredPackages = candidatos.map((p) => {
      let score = 0;

      if (p.zonaId === currentZonaId) {
        score += 1000;
      }

      const capacidad = p.cant_productos || 1;
      const ocupacion = (p.cant_usuarios_registrados || 0) / capacidad;
      if (ocupacion >= 0.8) {
        score += 500;
      }

      if (currentCategoriaId && p.paqueteBase?.categoria_id === currentCategoriaId) {
        score += 200;
      }

      return { paquete: p, score };
    });

    scoredPackages.sort((a, b) => b.score - a.score);

    return scoredPackages.slice(0, 4).map((x) => x.paquete);
  }

  /**
   * El admin confirma la compra con el fabricante.
   * El paquete pasa a "Confirmado" y los pedidos (excepto Cancelado/Reembolsando) también.
   * El pago ya no es reembolsable.
   */
  async confirmarCompraFabricante(id: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });

    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    const estadoConfirmado = await this.getEstadoPaquete('Confirmado');
    const estadoPedidoConfirmado = await this.getEstadoPedido('Confirmado');

    // Actualizar paquete
    await this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: { estado: { connect: { id_estado: estadoConfirmado.id_estado } } },
    });

    // Actualizar en cascada pedidos activos (excluye Cancelado y Reembolsando)
    await this.prisma.pedido.updateMany({
      where: {
        paquetePublicadoId: id,
        estado: { nombre: { notIn: ['Cancelado', 'Reembolsando'] } },
      },
      data: { estadoId: estadoPedidoConfirmado.id_estado },
    });

    // Obtener compradores confirmados para notificación
    const pedidosConfirmados = await this.prisma.pedido.findMany({
      where: {
        paquetePublicadoId: id,
        estadoId: estadoPedidoConfirmado.id_estado,
      },
      include: { usuario: true },
    });

    const correosCompradores = [...new Set(pedidosConfirmados.map((p) => p.usuario.email))];

    if (correosCompradores.length > 0) {
      await this.emailService.enviarEmail({
        para: correosCompradores,
        asunto: `✅ Compra Confirmada - ${paquete.paqueteBase.nombre}`,
        template: 'comprador-compra-confirmada',
        context: { nombrePaquete: paquete.paqueteBase.nombre },
      });
    }

    return { message: 'Compra confirmada y usuarios notificados.' };
  }

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
        estado: { nombre: { notIn: ['Cancelado', 'Reembolsando'] } },
      },
      include: { usuario: true },
    });

    const correos = [...new Set(pedidosActivos.map((p) => p.usuario.email))];

    if (correos.length === 0) {
      return { mensaje: 'No hay compradores activos para notificar.', notificados: 0 };
    }

    await this.emailService.enviarEmail({
      para: correos,
      asunto: `⏰ Recordatorio de cierre - ${paquete.paqueteBase?.nombre}`,
      template: 'comprador-aviso-cierre',
      context: { nombrePaquete: paquete.paqueteBase?.nombre },
    });

    return { mensaje: 'Notificación enviada correctamente.', notificados: correos.length };
  }
}
