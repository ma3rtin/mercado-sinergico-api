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
  res.redirect(
    'http://localhost:4200/mis-pedidos'
  );
});

mercadoPagoRouter.get('/failure', (req, res) => {
  res.redirect(
    'http://localhost:4200/mis-pedidos'
  );
});

mercadoPagoRouter.get('/pending', (req, res) => {
  res.redirect(
    'http://localhost:4200/mis-pedidos'
  );
});
