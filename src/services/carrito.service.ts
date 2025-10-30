import { PrismaClient } from "../generated/prisma";

export class CarritoService {
  private prisma = new PrismaClient();

  async getByUsuario(usuarioId: number) {
    return this.prisma.carrito.findUnique({
      where: { usuarioId },
    });
  }
}
