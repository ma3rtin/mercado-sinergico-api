import { prisma } from '../prisma/client';

export class CategoriaService {
  private client = prisma;

  public async getAll() {
    return this.client.categoria.findMany();
  }

  public async getById(id: number) {
    return this.client.categoria.findUnique({
      where: { id_categoria: id },
    });
  }

  public async create(nombre: string) {
    return this.client.categoria.create({
      data: { nombre },
    });
  }
}
