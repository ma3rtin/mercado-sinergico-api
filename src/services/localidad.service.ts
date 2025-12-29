import { ILocalidadRepository } from '../interfaces/ILocalidadRepository';

export class LocalidadService {
  constructor(private localidadRepository: ILocalidadRepository) { }

  async getAll() {
    return this.localidadRepository.getAll();
  }

  async getAllByZona(zonaId: number) {
    return this.localidadRepository.getAllByZona(zonaId);
  }
}
