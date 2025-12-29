import { IMarcaRepository } from '../interfaces/IMarcaRepository';

export class MarcaService {
  constructor(private marcaRepository: IMarcaRepository) { }

  public async getAll() {
    return this.marcaRepository.getAll();
  }

  public async getById(id: number) {
    return this.marcaRepository.getById(id);
  }

  public async create(nombre: string) {
    return this.marcaRepository.create({ nombre });
  }
}
