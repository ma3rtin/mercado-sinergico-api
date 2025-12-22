import { Request, Response } from 'express';
import { PedidoService } from '../services/pedido.service';
import { asyncHandler } from '../utils/asyncHandler';
import { CustomError } from '../errors/custom.error';

import { PrismaPedidoRepository } from '../repositories/prisma/PrismaOrderRepository';
import { PrismaPaquetePublicadoRepository } from '../repositories/prisma/PrismaPaquetePublicadoRepository'; // We have this specific file or bundle?
// Check if PrismaPaquetePublicadoRepository is in PrismaOrderRepository or its own file?
// It was in src/repositories/prisma/PrismaPaquetePublicadoRepository.ts
import { PrismaProductoRepository } from '../repositories/prisma/PrismaCatalogRepository'; // Check export name

const pedidoRepository = new PrismaPedidoRepository();
// Wait, I need to check where PrismaPaquetePublicadoRepository is exporting.
const paqueteRepository = new PrismaPaquetePublicadoRepository();
const productoRepository = new PrismaProductoRepository();

const pedidoService = new PedidoService(pedidoRepository, paqueteRepository, productoRepository);

export class PedidoController {
  public crearPedido = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { paqueteId } = req.params;
    if (!paqueteId) throw new CustomError('Paquete no encontrado', 404);

    const { productoId, cantidad } = req.body;

    const pedido = await pedidoService.crearPedido(
      user!.id,
      Number(paqueteId),
      {
        productoId: Number(productoId),
        cantidad: Number(cantidad),
      }
    );
    res.status(201).json(pedido);
  });

  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const pedidos = await pedidoService.getAll(user!.id);
    res.status(200).json(pedidos);
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { id } = req.params;

    if (!id) throw new CustomError('ID de pedido requerido', 400);

    const pedido = await pedidoService.getById(Number(id), user!.id);
    res.status(200).json(pedido);
  });

  public bajarse = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { paqueteId } = req.params;
    const pedido = await pedidoService.bajarse(user!.id, Number(paqueteId));
    res.status(200).json({ pedidoEliminado: pedido });
  });

  public eliminarProducto = asyncHandler(
    async (req: Request, res: Response) => {
      const user = req.user;
      const { pedidoId, productoId } = req.params;

      const pedido = await pedidoService.eliminarProducto(
        user!.id,
        Number(pedidoId),
        Number(productoId)
      );

      res.status(200).json({ pedidoActualizado: pedido });
    }
  );

  public actualizarCantidad = asyncHandler(
    async (req: Request, res: Response) => {
      const user = req.user;
      const { pedidoId, productoId } = req.params;
      const { cantidad } = req.body;

      const pedido = await pedidoService.actualizarCantidad(
        user!.id,
        Number(pedidoId),
        Number(productoId),
        Number(cantidad)
      );

      res.status(200).json({ pedidoActualizado: pedido });
    }
  );
}
