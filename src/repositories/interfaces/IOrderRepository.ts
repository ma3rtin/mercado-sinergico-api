import {
    Pedido,
    EstadoPedido,
    Carrito,
    CarritoProducto,
    CarritoPaquetePublicado
} from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';

export interface IPedidoRepository extends IBaseRepository<Pedido> {
    findByUserId(userId: number): Promise<Pedido[]>;
}

export interface IEstadoPedidoRepository extends IBaseRepository<EstadoPedido> {
    findByName(name: string): Promise<EstadoPedido | null>;
}

export interface ICarritoRepository extends IBaseRepository<Carrito> {
    findByUserId(userId: number): Promise<Carrito | null>;
}

export interface ICarritoProductoRepository extends IBaseRepository<CarritoProducto> {
    findByCarritoId(carritoId: number): Promise<CarritoProducto[]>;
}

export interface ICarritoPaquetePublicadoRepository extends IBaseRepository<CarritoPaquetePublicado> {
    findByCarritoId(carritoId: number): Promise<CarritoPaquetePublicado[]>;
}
