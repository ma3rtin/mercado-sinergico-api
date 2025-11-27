import { Request, Response } from 'express';
import { PedidoService } from '../services/pedido.service';
import { asyncHandler } from '../utils/asyncHandler';

const pedidoService = new PedidoService();

export class PedidoController {
  public crearPedido = asyncHandler(async (req: Request, res: Response) => {
    const pedido = await pedidoService.crearPedido(req.body);
    res.status(201).json(pedido);
  });

  public getAll = asyncHandler(async (_req: Request, res: Response) => {
    const pedidos = await pedidoService.getAll();
    res.json(pedidos);
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const pedido = await pedidoService.getById(id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(pedido);
  });
}
