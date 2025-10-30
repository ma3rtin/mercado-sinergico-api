import { Request, Response } from "express";
import { PedidoService } from "../services/pedido.service";

const pedidoService = new PedidoService();

export class PedidoController {
  public async crearPedido(req: Request, res: Response) {
    try {
      const pedido = await pedidoService.crearPedido(req.body);
      res.status(201).json(pedido);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public async getAll(req: Request, res: Response) {
    try {
      const pedidos = await pedidoService.getAll();
      res.json(pedidos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const pedido = await pedidoService.getById(id);
      if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
      res.json(pedido);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
