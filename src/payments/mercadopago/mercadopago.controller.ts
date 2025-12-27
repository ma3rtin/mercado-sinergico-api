import { Request, Response } from 'express';
import { PedidoService } from '../../services/pedido.service.js';

export class MercadoPagoController {
  constructor(private pedidoService: PedidoService) {}
  async webhook(req: Request, res: Response) {
    try {
      const { type, data } = req.body;

      if (type === 'payment') {
        const paymentId = Number(data.id);
        await this.pedidoService.confirmarPago(paymentId);
      }

      return res.status(200).send('OK');
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Webhook error' });
    }
  }
}
