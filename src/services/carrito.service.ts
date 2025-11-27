import { prisma } from '../prisma/client';

export class CarritoService {
  private prisma = prisma;

  async getByUsuario(usuarioId: number) {
    return this.prisma.carrito.findUnique({
      where: { usuarioId },
    });
  }
}
