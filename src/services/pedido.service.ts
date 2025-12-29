import { CustomError } from '../errors/custom.error';
import { SumarseDTO } from '../dtos/pedido/sumarse.dto';
import { IPedidoRepository } from '../interfaces/IPedidoRepository';
import { IPaquetePublicadoRepository } from '../interfaces/IPaquetePublicadoRepository';
import { Prisma } from '../../prisma/generated/client';

export class PedidoService {
  constructor(
    private pedidoRepository: IPedidoRepository,
    private paquetePublicadoRepository: IPaquetePublicadoRepository
  ) { }

  public async crearPedido(
    usuarioId: number,
    paqueteId: number,
    productoAComprar: SumarseDTO
  ) {
    // 1. Validar Paquete
    const paquete = await this.paquetePublicadoRepository.getById(paqueteId);

    if (!paquete) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    // Check estado. "estado" is included in getById impl.
    // Assuming type allows accessing it.
    if ((paquete as any).estado?.nombre !== 'Activo') {
      throw new CustomError('El paquete no está activo', 400);
    }

    // 2. Validar Producto en Paquete
    const productosEnPaquete = (paquete as any).paqueteBase?.productos || [];
    const productoEnPaquete = productosEnPaquete.find(
      (p: any) => p.productoId === productoAComprar.productoId
    );

    if (!productoEnPaquete) {
      throw new CustomError('El producto no pertenece a este paquete', 400);
    }

    const producto = productoEnPaquete.producto;

    // 3. Check Stock
    if (producto.stock && producto.stock < productoAComprar.cantidad) {
      throw new CustomError('Stock insuficiente', 400);
    }

    // 4. Calculate Price
    const descuento = (paquete as any).descuento || 10; // Repo might not return descuento field if it's computed in service getById. 
    // Wait, PaquetePublicado model has 'descuento' field (Float?).
    // Schema says: descuento Float?
    // Service getById adds `descuento: 10`.
    // But here we used repo.getById which returns raw DB object.
    // We should use the DB value or default.
    const discountVal = (paquete as any).descuento || 0;
    const precioConDescuento = producto.precio * (1 - discountVal / 100);

    // 5. Add Item via Repository
    return this.pedidoRepository.addItem(usuarioId, paqueteId, {
      productoId: productoAComprar.productoId,
      cantidad: productoAComprar.cantidad,
      precio: precioConDescuento,
      descuento: discountVal
    });
  }

  public async getAll(usuarioId: number) {
    return this.pedidoRepository.getByUser(usuarioId);
  }

  public async getById(pedidoId: number, usuarioId: number) {
    const pedido = await this.pedidoRepository.getById(pedidoId);

    if (!pedido) {
      throw new CustomError('Pedido no encontrado', 404);
    }

    if (pedido.usuarioId !== usuarioId) {
      throw new CustomError('No tienes permiso para ver este pedido', 403);
    }

    return pedido;
  }

  public async bajarse(userId: number, paqueteId: number) {
    // Repository handles logic including verifying existence
    return this.pedidoRepository.cancelOrder(userId, paqueteId);
  }

  public async eliminarProducto(
    userId: number,
    pedidoId: number,
    productoId: number
  ) {
    // Repository handles logic
    return this.pedidoRepository.removeItem(userId, pedidoId, productoId);
  }

  public async actualizarCantidad(
    userId: number,
    pedidoId: number,
    productoId: number,
    nuevaCantidad: number
  ) {
    // Need to validate stock again?
    // Repository updateItemQuantity logic I wrote doesn't check stock.
    // Validation should happen here.

    // Fetch info to check stock
    const pedido = await this.pedidoRepository.getById(pedidoId);
    if (!pedido) throw new CustomError('Pedido no encontrado', 404);

    // Find product in package via pedido -> paquetePublicado
    // This requires deep includes in getById.
    // PedidoRepository.getById includes paquetePublicado -> paqueteBase -> productos -> producto.

    // Logic to find product and check stock:
    const paquete = (pedido as any).paquetePublicado;
    const productos = (paquete as any).paqueteBase?.productos || [];
    const prodRelation = productos.find((p: any) => p.productoId === productoId);

    if (!prodRelation || !prodRelation.producto) throw new CustomError('Producto no encontrado', 404);

    if (prodRelation.producto.stock < nuevaCantidad) {
      throw new CustomError('Stock insuficiente', 400);
    }

    return this.pedidoRepository.updateItemQuantity(userId, pedidoId, productoId, nuevaCantidad);
  }
}
