import { AgregarProductoPaqueteDTO } from '../dtos/producto/agregarProductoPaquete.dto';
import { PaqueteBaseDTO } from '../dtos/paquete/paqueteBase.dto';
import { CustomError } from '../errors/custom.error';

import { IPaqueteBaseRepository } from '../repositories/interfaces/IBundleRepository';

export class PaqueteBaseService {
  constructor(private paqueteBaseRepository: IPaqueteBaseRepository) { }

  public async getAll() {
    return this.paqueteBaseRepository.findAllWithProducts();
  }

  public async getById(id: number) {
    const paquete = await this.paqueteBaseRepository.getByIdWithProducts(id);

    if (!paquete) {
      throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
    }

    return paquete;
  }

  public async create(data: PaqueteBaseDTO) {
    return this.paqueteBaseRepository.createWithProducts(data);
  }

  public async update(id: number, data: PaqueteBaseDTO) {
    try {
      return await this.paqueteBaseRepository.updateWithCategoryCheck(id, data);
    } catch (error: any) {
      if (error.message === 'La categoría no existe') {
        throw new CustomError('La categoría no existe', 400);
      }
      throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
    }
  }

  public async delete(id: number) {
    try {
      return await this.paqueteBaseRepository.delete(id);
    } catch {
      throw new CustomError(`Paquete con id=${id} no encontrado`, 404);
    }
  }

  public async agregarProductos(data: AgregarProductoPaqueteDTO) {
    return this.paqueteBaseRepository.addProducts(data);
  }

  public async getProductosByPaquete(id: number) {
    return this.paqueteBaseRepository.getProductosByPaquete(id);
  }
}
