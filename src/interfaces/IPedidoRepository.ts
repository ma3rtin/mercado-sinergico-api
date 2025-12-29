import { Pedido, Prisma } from '../../prisma/generated/client';

export interface IPedidoRepository {
    getAll(): Promise<Pedido[]>;
    getById(id: number): Promise<Pedido | null>;
    create(data: Prisma.PedidoCreateInput): Promise<Pedido>;
    update(id: number, data: Prisma.PedidoUpdateInput): Promise<Pedido>;
    delete(id: number): Promise<Pedido>;
    getByUser(usuarioId: number): Promise<Pedido[]>;
    findActive(userId: number, paqueteId: number): Promise<Pedido | null>;
    addItem(userId: number, paqueteId: number, item: { productoId: number; cantidad: number; precio: number; descuento: number }): Promise<Pedido>;
    removeItem(userId: number, pedidoId: number, productoId: number): Promise<Pedido | null>;
    updateItemQuantity(userId: number, pedidoId: number, productoId: number, quantity: number): Promise<Pedido>;
    cancelOrder(userId: number, paqueteId: number): Promise<{ message: string; pedidoEliminado: Pedido }>;
}
