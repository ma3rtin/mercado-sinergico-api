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

  delete(id: number) {
    return this.prisma.paquetePublicado.update({
      where: { id_paquete_publicado: id },
      data: { estado: { connect: { nombre: 'Eliminado' } } },
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

  async enviarEmailPrueba(id: number, emailDestino: string) {
    const paquete = await this.prisma.paquetePublicado.findUnique({
      where: { id_paquete_publicado: id },
      include: { paqueteBase: true },
    });

    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    const baseUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    
    const context = {
      nombrePaquete: paquete.paqueteBase.nombre,
      paqueteId: paquete.id_paquete_publicado,
      userName: 'Usuario de Prueba',
      adminUrl: `${baseUrl}/admin/administrar-publicacion/${id}`,
      linkPublicacion: `${baseUrl}/mis-pedidos`
    };

    const timestamp = new Date().toLocaleTimeString();

    // 1. Comprador - Paquete Completado
    await this.emailService.enviarEmail({
      para: emailDestino,
      asunto: `[PRUEBA 1/3] [${timestamp}] ¡Grupo Completado! - ${paquete.paqueteBase.nombre}`,
      template: 'comprador-paquete-completado',
      context
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Admin - Alerta
    await this.emailService.enviarEmail({
      para: emailDestino,
      asunto: `[PRUEBA 2/3] [${timestamp}] 🚨 Alerta Admin: Paquete Completado - ${paquete.paqueteBase.nombre}`,
      template: 'admin-paquete-completado',
      context
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Comprador - Compra Confirmada
    await this.emailService.enviarEmail({
      para: emailDestino,
      asunto: `[PRUEBA 3/3] [${timestamp}] ✅ Compra Confirmada - ${paquete.paqueteBase.nombre}`,
      template: 'comprador-compra-confirmada',
      context
    });

    return { message: `Los 3 emails de prueba se enviaron a ${emailDestino} con éxito.` };
  }
}
