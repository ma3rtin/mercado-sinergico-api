import { prisma } from '../prisma/client';

export class CarritoService {
  private prisma = prisma;

  async getByUsuario(usuarioId: number) {
    return this.prisma.carrito.findUnique({
      where: { usuarioId },
      include: {
        paquetes: {
          include: {
            paquetePublicado: {
              include: {
                paqueteBase: true
              }
            }
          }
        },
        productos: {
          include: {
            producto: true
          }
        }
      }
    });
  }

  async addPaquete(usuarioId: number, paquetePublicadoId: number, cantidad: number) {
    try {
      let carrito = await this.prisma.carrito.findUnique({
        where: { usuarioId }
      });

      if (!carrito) {
        carrito = await this.prisma.carrito.create({
          data: { usuarioId }
        });
      }

      const existingItem = await this.prisma.carritoPaquetePublicado.findFirst({
        where: {
          carritoId: carrito.id_carrito,
          paquetePublicadoId: paquetePublicadoId
        }
      });

      if (existingItem) {
        return await this.prisma.carritoPaquetePublicado.update({
          where: { id_carrito_paquete: existingItem.id_carrito_paquete },
          data: { cantidad: existingItem.cantidad + cantidad }
        });
      } else {
        return await this.prisma.carritoPaquetePublicado.create({
          data: {
            carritoId: carrito.id_carrito,
            paquetePublicadoId,
            cantidad
          }
        });
      }
    } catch (error: any) {
      throw new Error(`Error al agregar paquete al carrito: ${error.message}`);
    }
  }
}
