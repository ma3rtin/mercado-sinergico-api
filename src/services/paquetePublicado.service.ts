import { PaquetePublicadoDTO } from '../dtos/paquete/paquetePublicado.dto';
import { PaquetePublicadoUpdateDTO } from '../dtos/paquete/paquetePublicadoUpdate.dto';
import { CustomError } from '../errors/custom.error';
import { IPaquetePublicadoRepository } from '../interfaces/IPaquetePublicadoRepository';
import { ILocalidadRepository } from '../interfaces/ILocalidadRepository';
import { IUsuarioRepository } from '../interfaces/IUsuarioRepository';
import { IZonaRepository } from '../interfaces/IZonaRepository';
import { IPaqueteBaseRepository } from '../interfaces/IPaqueteBaseRepository';
import { Prisma } from '../../prisma/generated/client';

export class PaquetePublicadoService {
  constructor(
    private paquetePublicadoRepository: IPaquetePublicadoRepository,
    private localidadRepository: ILocalidadRepository,
    private usuarioRepository: IUsuarioRepository,
    private zonaRepository: IZonaRepository,
    private paqueteBaseRepository: IPaqueteBaseRepository
  ) { }

  async getAll() {
    return await this.paquetePublicadoRepository.getAll();
  }

  async getById(id: number) {
    const paquete = await this.paquetePublicadoRepository.getById(id);

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
      const localidad = await this.localidadRepository.getById(localidadId);

      // Localidad repository includes zonas
      if (localidad && (localidad as any).zonas) {
        zonaIds = (localidad as any).zonas.map((z: any) => z.zonaId);
      }
    }
    // 2. Si no hay localidadId pero hay userId, buscar la del usuario
    else if (userId) {
      const usuario = await this.usuarioRepository.getById(userId);

      if (usuario) {
        const userWithRelations = usuario as any;
        if (userWithRelations.localidad) {
          const loc = userWithRelations.localidad;
          if (loc.zonas) {
            zonaIds = loc.zonas.map((z: any) => z.zonaId);
          }
        } else if (userWithRelations.direccion && userWithRelations.direccion.localidad) {
          const loc = userWithRelations.direccion.localidad;
          if (loc.zonas) {
            zonaIds = loc.zonas.map((z: any) => z.zonaId);
          }
        }
      }
    }

    if (zonaIds.length === 0) {
      console.warn('⚠️ No se encontraron zonas para la ubicación dada.');
      return [];
    }

    return await this.paquetePublicadoRepository.getByZonas(zonaIds);
  }

  async getByProductId(productId: number) {
    return await this.paquetePublicadoRepository.getByProductId(productId);
  }

  async create(dto: PaquetePublicadoDTO) {
    const fecha_inicio = new Date(dto.fecha_inicio);
    const fecha_fin = new Date(dto.fecha_fin);

    // Validar zona
    const zona = await this.zonaRepository.getById(Number(dto.zonaId));

    if (!zona) throw new CustomError('La zona no existe', 404);

    // Validar paquete base
    const paqueteBase = await this.paqueteBaseRepository.getById(dto.paqueteBaseId);

    if (!paqueteBase) throw new CustomError('El paquete base no existe', 404);

    const data: Prisma.PaquetePublicadoCreateInput = {
      cant_productos: dto.cant_productos,
      fecha_inicio,
      fecha_fin,
      zona: { connect: { id_zona: Number(dto.zonaId) } },
      paqueteBase: { connect: { id_paquete_base: dto.paqueteBaseId } },
      estado: { connect: { nombre: 'Activo' } },
    }

    return this.paquetePublicadoRepository.create(data);
  }

  async update(id: number, dto: PaquetePublicadoUpdateDTO) {
    const data: Prisma.PaquetePublicadoUpdateInput = {
      cant_productos: dto.cant_productos,
      fecha_inicio: dto.fecha_inicio,
      fecha_fin: dto.fecha_fin,
      zona: dto.zonaId ? { connect: { id_zona: dto.zonaId } } : undefined,
      paqueteBase: dto.paqueteBaseId ? { connect: { id_paquete_base: dto.paqueteBaseId } } : undefined,
      ...(dto.estadoNombre && {
        estado: { connect: { nombre: dto.estadoNombre } },
      }),
    };
    return await this.paquetePublicadoRepository.update(id, data);
  }

  delete(id: number) {
    return this.paquetePublicadoRepository.update(id, { estado: { connect: { nombre: 'Eliminado' } } });
  }

  async getPorCerrarse() {
    const hoy = new Date();
    const dentroDexDias = new Date(hoy);
    dentroDexDias.setDate(hoy.getDate() + 30);

    return this.paquetePublicadoRepository.getPorCerrarse(hoy, dentroDexDias);
  }

  async getRelacionados(id: number) {
    // 1. Obtener el paquete actual para contexto
    const currentPaquete = await this.paquetePublicadoRepository.getById(id);

    if (!currentPaquete) throw new Error('Paquete no encontrado');

    const currentZonaId = currentPaquete.zonaId;

    // @ts-ignore
    const currentCategoriaId = (currentPaquete.paqueteBase as any)?.categoria_id;

    // 2. Buscar candidatos (Activos y no el actual)
    const candidatos = await this.paquetePublicadoRepository.getCandidates(id);

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
        // @ts-ignore
        (p.paqueteBase as any)?.categoria_id === currentCategoriaId
      ) {
        score += 200;
      }

      return { paquete: p, score };
    });

    // 4. Ordenar y devolver Top 4
    scoredPackages.sort((a, b) => b.score - a.score);

    return scoredPackages.slice(0, 4).map((x) => x.paquete);
  }
}
