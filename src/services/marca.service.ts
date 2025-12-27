import { prisma } from '../prisma/client.js';

export class MarcaService {
  private client = prisma;

  public async getAll() {
    return this.client.marca.findMany();
  }

  public async getById(id: number) {
    return this.client.marca.findUnique({
      where: { id_marca: id },
    });
  }

  public async create(nombre: string) {
    return this.client.marca.create({
      data: { nombre },
    });
  }
}
