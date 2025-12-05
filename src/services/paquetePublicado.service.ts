import { PaquetePublicadoDTO } from '../dtos/paquetePublicado.dto';
import { PaquetePublicadoUpdateDTO } from '../dtos/paquetePublicadoUpdate.dto';
import { IPaquetePublicadoRepository } from '../repositories/interfaces/IPaquetePublicadoRepository';

export class PaquetePublicadoService {
  constructor(private repository: IPaquetePublicadoRepository) { }

  async getAll() {
    try {
      console.log('obteniendo todos los paquetes');
      return await this.repository.getAll();
    } catch (error: any) {
      throw new Error(`Error al obtener paquetes: ${error.message}`);
    }
  }

  async getById(id: number) {
    try {
      return await this.repository.getById(id);
    } catch (error: any) {
      throw new Error(
        `Error al obtener paquete con id=${id}: ${error.message}`
      );
    }
  }

  async create(paquetePublicadoDTO: PaquetePublicadoDTO) {
    try {
      return await this.repository.create(paquetePublicadoDTO);
    } catch (error: any) {
      throw error;
    }
  }

  async update(id: number, dto: PaquetePublicadoUpdateDTO) {
    try {
      return await this.repository.update(id, dto);
    } catch (error: any) {
      throw new Error(
        `Error al actualizar paquete publicado: ${error.message}`
      );
    }
  }

  delete(id: number) {
    return this.repository.delete(id);
  }

  async getPorCerrarse() {
    try {
      console.log('🔎 Buscando paquetes por cerrarse');
      const paquetes = await this.repository.getPorCerrarse();
      console.log(`✅ ${paquetes.length} paquetes encontrados`);
      return paquetes;
    } catch (error: any) {
      console.error('💥 Error en getPorCerrarse:', error);
      throw new Error(`Error al obtener paquetes por cerrarse: ${error.message}`);
    }
  }
}
