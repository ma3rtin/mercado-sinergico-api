import { PaquetePublicadoDTO } from '../dtos/paquete/paquetePublicado.dto.js';
import { PaquetePublicadoUpdateDTO } from '../dtos/paquete/paquetePublicadoUpdate.dto.js';
import { CustomError } from '../errors/custom.error.js';
import { prisma } from '../prisma/client.js';
import { EmailService } from './email.service.js';

export class PaquetePublicadoService {
  private prisma = prisma;
  private emailService = new EmailService();

  async getAll() {
    return await this.prisma.paquetePublicado.findMany({
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
        pedidos: true,
      },
    });

    if (paquete) {
      return {
        ...paquete,
        descuento: 10, // Descuento fijo del 10%
      };
    }
    return null;
  }

  async getByLocation(userId?: number, localidadId?: number) {
    let zonaIds: number[] = [];

    // 1. Si se proporciona localidadId explícitamente, usarla
    if (localidadId) {
      console.log('🔎 Buscando zonas para localidad ID:', localidadId);
      const localidad = await this.prisma.localidad.findUnique({
        where: { id_localidad: localidadId },
        include: { zonas: true },
      });

      if (localidad) {
        zonaIds = localidad.zonas.map((z: { id: number; localidadId: number; zonaId: number }) => z.zonaId);
      }
    }
    // 2. Si no hay localidadId pero hay userId, buscar la del usuario
    else if (userId) {
      console.log('🔎 Buscando zonas para usuario ID:', userId);
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: userId },
        include: {
          localidad: {
            // Primero revisar preferencia de localidad
            include: { zonas: true },
          },
          direccion: {
            // Fallback a dirección física
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

      return await tx.paquetePublicado.update({
        where: { id_paquete_publicado: id },
        data: {
          ...(dto.fecha_inicio && { fecha_inicio: new Date(dto.fecha_inicio) }),
          ...(dto.fecha_fin && { fecha_fin: new Date(dto.fecha_fin) }),
          ...(dto.cant_productos && { cant_productos: Number(dto.cant_productos) }),
          ...(dto.zonaId && { zona: { connect: { id_zona: Number(dto.zonaId) } } }),
          ...(dto.paqueteBaseId && { paqueteBase: { connect: { id_paquete_base: Number(dto.paqueteBaseId) } } }),
          ...(dto.estadoId && { estado: { connect: { id_estado: Number(dto.estadoId) } } }),
          ...(dto.estadoNombre && { estado: { connect: { nombre: dto.estadoNombre } } }),
        },
      });
    });
  }

  async delete(id: number) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { pedidos: true },
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
          paqueteBaseId: paqueteOriginal.paqueteBaseId,
          zonaId: paqueteOriginal.zonaId,
          fecha_inicio: new Date(),
          fecha_fin: paqueteOriginal.fecha_fin,
          cant_productos: paqueteOriginal.cant_productos,
          monto_total: paqueteOriginal.monto_total,
          imagen_url: paqueteOriginal.imagen_url,
          tipo: paqueteOriginal.tipo,
          descuento: paqueteOriginal.descuento,
          estadoId: estadoActivo.id_estado,
          cant_productos_reservados: 0,
          cant_usuarios_registrados: 0,
        },
      });
    });
  }

  async completar(id: number) {
    const estadoFinalizado = await this.prisma.estadoPaquetePublicado.findUnique({
      where: { nombre: 'Finalizado' },
    });

    if (!estadoFinalizado) throw new CustomError('Estado "Finalizado" no encontrado', 500);

    const result = await this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: {
        estado: { connect: { id_estado: estadoFinalizado.id_estado } },
      },
      include: {
        paqueteBase: { include: { marca: true, categoria: true } },
        zona: true,
        estado: true,
        pedidos: true,
      },
    });

    // 1. Ya tenemos el paquete con nombre en result
    const paquete = result;

    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    // 2. Obtener compradores
    const pedidosAprobados = await this.prisma.pedido.findMany({
      where: {
        paquetePublicadoId: id,
        estadoId: 3, // Asumiendo que 3 = Aprobado
      },
      include: {
        usuario: true,
      },
    });

    const correosCompradores = [...new Set(pedidosAprobados.map((p) => p.usuario.email))];

    // 3. Enviar correo a compradores
    if (correosCompradores.length > 0) {
      this.emailService.enviarEmail({
        para: correosCompradores,
        asunto: `🎉 ¡Paquete Completado! - ${paquete.paqueteBase?.nombre}`,
        template: 'comprador-paquete-completado',
        context: { nombrePaquete: paquete.paqueteBase?.nombre },
      });
    }

    // 4. Enviar correo al admin
    // Por simplicidad del ejemplo enviamos al mail maestro configurado en ENVS
    this.emailService.enviarEmail({
      para: process.env.MAILER_EMAIL || 'admin@mercadosinergico.com',
      asunto: `🚨 Acción Requerida: Paquete Completado - ${paquete.paqueteBase?.nombre}`,
      template: 'admin-paquete-completado',
      context: {
        nombrePaquete: paquete.paqueteBase?.nombre,
        paqueteId: paquete.id_paquete_publicado
      },
    });

    return result;
  }

  async cerrarManual(id: number) {
    try {
      const estadoEnPreparacion = await this.prisma.estadoPaquetePublicado.findUnique({
        where: { nombre: 'En Preparación' },
      });

      if (!estadoEnPreparacion) {
        throw new CustomError('Estado "En Preparación" no encontrado en la base de datos (solicita al admin agregarlo)', 500);
      }

      // 1. Obtener paquete y su capacidad
      const paquete = await this.prisma.paquetePublicado.findUnique({
        where: { id_paquete_publicado: id },
        include: { paqueteBase: true },
      });

      if (!paquete) throw new CustomError('Paquete no encontrado', 404);

      const result = await this.prisma.paquetePublicado.update({
        where: { id_paquete_publicado: id },
        data: {
          estado: { connect: { id_estado: estadoEnPreparacion.id_estado } },
        },
        include: {
          paqueteBase: { include: { marca: true, categoria: true } },
          zona: true,
          estado: true,
          pedidos: true,
        },
      });

      const faltantes = (paquete.cant_productos || 0) - (paquete.cant_usuarios_registrados || 0);

      // 2. Obtener compradores
      const pedidosActivos = await this.prisma.pedido.findMany({
        where: { paquetePublicadoId: id, estadoId: { in: [1, 2, 3] } }, // Pagados o aprobados
        include: { usuario: true },
      });
      const correos = [...new Set(pedidosActivos.map((p) => p.usuario.email))];

      // 3. Enviar correo (Solo si hay compradores y el nombre de paquete existe)
      if (correos.length > 0 && paquete.paqueteBase?.nombre) {
        this.emailService.enviarEmail({
          para: correos,
          asunto: `📦 Preparación Anticipada - ${paquete.paqueteBase.nombre}`,
          template: 'comprador-paquete-cerrado-anticipado',
          context: { nombrePaquete: paquete.paqueteBase.nombre },
        });
      }

      return { result, faltantes };
    } catch (error: any) {
      console.error('Error al cerrar manual:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Error interno al cerrar manualmente el paquete. ' + error.message, 500);
    }
  }

  async cancelarYReembolsar(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener paquete
      const paquete = await tx.paquetePublicado.findUnique({
        where: { id_paquete_publicado: id },
        include: { pedidos: true, paqueteBase: true },
      });

      if (!paquete) throw new CustomError('Paquete no encontrado', 404);

      // 2. Cambiar estado a Cerrado (o Cancelado, pero las instrucciones dicen 'Cerrado')
      const estadoCerrado = await tx.estadoPaquetePublicado.findUnique({
        where: { nombre: 'Cerrado' },
      });

      if (!estadoCerrado) throw new CustomError('Estado "Cerrado" no encontrado', 500);

      await tx.paquetePublicado.update({
        where: { id_paquete_publicado: id },
        data: { estadoId: estadoCerrado.id_estado },
      });

      // 3. Obtener estado Cancelado/Reembolsado para Pedidos
      const estadoPedido = await tx.estadoPedido.findFirst({
        where: { nombre: 'Reembolsando' },
      });

      // Asegurarse de que exista el estado
      if (!estadoPedido) {
        throw new CustomError('Estado de pedido "Reembolsando" no encontrado en la base de datos (solicita al admin agregarlo)', 500);
      }

      if (estadoPedido) {
        // Marcamos los pedidos como reembolsando
        // ANTES del updateMany de pedidos
        const pedidosAfectados = await tx.pedido.findMany({
          where: { paquetePublicadoId: id, estadoId: { in: [1, 2, 3] } },
          include: { usuario: true },
        });
        const correosCompradores = [...new Set(pedidosAfectados.map(p => p.usuario.email))];

        // DESPUÉS hacés el updateMany
        await tx.pedido.updateMany({
          where: { paquetePublicadoId: id },
          data: { estadoId: estadoPedido.id_estado },
        });

        if (correosCompradores.length > 0) {
          this.emailService.enviarEmail({
            para: correosCompradores,
            asunto: `🚫 Paquete Cancelado - ${paquete.paqueteBase?.nombre}`,
            template: 'comprador-paquete-cancelado',
            context: { nombrePaquete: paquete.paqueteBase?.nombre },
          });
        }

        // TODO: Aquí llamarías a mercadoPagoService.refund() si guardaras el payment_id en cada pedido
        // Ejemplo:
        // for (const pedido of paquete.pedidos) {
        //   if (pedido.paymentId) await mercadoPagoService.obtenerPago(pedido.paymentId... refund);
        // }

        const paqueteCompleto = await tx.paquetePublicado.findUnique({
          where: { id_paquete_publicado: id },
          include: {
            paqueteBase: { include: { marca: true, categoria: true } },
            zona: true,
            estado: true,
            pedidos: true,
          },
        });

        return paqueteCompleto;
      }
    });
  }

  // 🔥 ESTE ES EL MÉTODO QUE NECESITA ARREGLARSE sisi, eso....
  async getPorCerrarse() {
    const hoy = new Date();
    const dentroDexDias = new Date(hoy);
    dentroDexDias.setDate(hoy.getDate() + 30);

    console.log('🔎 Buscando paquetes entre:', hoy, 'y', dentroDexDias);

    // ✅ CAMBIO IMPORTANTE: Agregar el include de paqueteBase
    const paquetes = await this.prisma.paquetePublicado.findMany({
      where: {
        estado: {
          nombre: { in: ['Activo', 'Pendiente'] },
        },
        fecha_fin: {
          gte: hoy,
          lte: dentroDexDias,
        },
      },
      include: {
        // ✅ ESTO FALTABA - Ahora trae la info de paqueteBase
        paqueteBase: {
          include: {
            marca: true, // ✅ Trae la marca
            categoria: true, // ✅ Trae la categoría
          },
        },
        zona: {
          select: { nombre: true, id_zona: true },
        },
        estado: {
          select: { nombre: true, id_estado: true },
        },
        pedidos: true,
      },
      orderBy: { fecha_fin: 'asc' },
    });

    console.log(`✅ ${paquetes.length} paquetes encontrados`);
    return paquetes;
  }

  async getRelacionados(id: number) {
    // 1. Obtener el paquete actual para contexto
    const currentPaquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: {
        paqueteBase: true,
      },
    });

    if (!currentPaquete) throw new Error('Paquete no encontrado');

    const currentZonaId = currentPaquete.zonaId;
    const currentCategoriaId = currentPaquete.paqueteBase?.categoria_id;

    // 2. Buscar candidatos (Activos y no el actual)
    const candidatos = await this.prisma.paquetePublicado.findMany({
      where: {
        id_paquete_publicado: { not: id },
        estado: { nombre: { in: ['Activo', 'Abierto'] } },
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
        pedidos: true,
      },
    });

    // 3. Puntuar
    const scoredPackages = candidatos.map((p) => {
      let score = 0;

      // Criterio 1: Misma Zona (+1000)
      if (p.zonaId === currentZonaId) {
        score += 1000;
      }

      // Criterio 2: FOMO / Hot Packages (>80%) (+500)
      const capacidad = p.cant_productos || 1;
      const ocupacion = (p.cant_usuarios_registrados || 0) / capacidad;
      if (ocupacion >= 0.8) {
        score += 500;
      }

      // Criterio 3: Misma Categoría (+200)
      if (
        currentCategoriaId &&
        p.paqueteBase?.categoria_id === currentCategoriaId
      ) {
        score += 200;
      }

      return { paquete: p, score };
    });

    // 4. Ordenar y devolver Top 4
    scoredPackages.sort((a, b) => b.score - a.score);

    return scoredPackages.slice(0, 4).map((x) => x.paquete);
  }

  async confirmarCompraFabricante(id: number) {
    // 1. Verificar paquete
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });

    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    // 2. Obtener estado "Cerrado"
    const estadoCerrado = await this.prisma.estadoPaquetePublicado.findFirst({
      where: { nombre: { in: ['Cerrado'] } }
    });

    // 3. Actualizar estado
    await this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: {
        ...(estadoCerrado && { estado: { connect: { id_estado: estadoCerrado.id_estado } } })
      },
    });

    // 4. Obtener compradores
    const pedidosAprobados = await this.prisma.pedido.findMany({
      where: {
        paquetePublicadoId: id,
        estadoId: 3,
      },
      include: {
        usuario: true,
      },
    });

    const correosCompradores = [...new Set(pedidosAprobados.map(p => p.usuario.email))];

    // 5. Enviar correo final
    if (correosCompradores.length > 0) {
      await this.emailService.enviarEmail({
        para: correosCompradores,
        asunto: `✅ Compra Confirmada - ${paquete.paqueteBase.nombre}`,
        template: 'comprador-compra-confirmada',
        context: { nombrePaquete: paquete.paqueteBase.nombre }
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

    const pedidosActivos = await this.prisma.pedido.findMany({
      where: { paquetePublicadoId: id, estadoId: { in: [1, 2, 3] } },
      include: { usuario: true },
    });

    const correos = [...new Set(pedidosActivos.map(p => p.usuario.email))];

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
