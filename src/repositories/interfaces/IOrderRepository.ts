import {
    Pedido,
    EstadoPedido
} from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';

export interface IPedidoRepository extends IBaseRepository<Pedido> {
    findByUserId(userId: number): Promise<Pedido[]>;
    findPending(userId: number, paqueteId: number): Promise<Pedido | null>;
    createWithDetails(data: any): Promise<Pedido>;
    updateWithDetails(id: number, data: any): Promise<Pedido>;
    getWithDetails(id: number): Promise<Pedido | null>;
}

export interface IEstadoPedidoRepository extends IBaseRepository<EstadoPedido> {
    findByName(name: string): Promise<EstadoPedido | null>;
}


