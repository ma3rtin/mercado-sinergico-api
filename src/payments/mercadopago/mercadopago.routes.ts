import { Router } from 'express';
import { MercadoPagoController } from './mercadopago.controller';
import { PedidoService } from '../../services/pedido.service';
import { MercadoPagoService } from './mercadopago.service';

export const mercadoPagoRouter = Router();

const mercadoPagoService = new MercadoPagoService();
const pedidoService = new PedidoService(mercadoPagoService);
const mercadoPagoController = new MercadoPagoController(pedidoService);

mercadoPagoRouter.post(
  '/webhook',
  mercadoPagoController.webhook.bind(mercadoPagoController)
);

mercadoPagoRouter.get('/success', (req, res) => {
  return res.send('Pago aprobado');
});

mercadoPagoRouter.get('/failure', (req, res) => {
  return res.send('Pago fallido');
});

mercadoPagoRouter.get('/pending', (req, res) => {
  return res.send('Pago pendiente');
});
