import { Request, Response } from "express";
import { PedidoService } from "../services/pedido.service";
import { asyncHandler } from "../utils/asyncHandler";
import { CustomError } from "../errors/custom.error";

const pedidoService = new PedidoService();

export class PedidoController {
  public crearPedido = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { paqueteId } = req.params;
    if (!paqueteId) throw new CustomError("Paquete no encontrado", 404);

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

    if (!id) throw new CustomError("ID de pedido requerido", 400);

    const pedido = await pedidoService.getById(Number(id), user!.id);
    res.status(200).json(pedido);
  });

  public bajarse = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { paqueteId } = req.params;
    const pedido = await pedidoService.bajarse(user!.id, Number(paqueteId));
    res.status(200).json(pedido);
  });
}
