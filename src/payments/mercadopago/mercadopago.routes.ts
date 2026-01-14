import { Router } from 'express';
import { MercadoPagoController } from './mercadopago.controller.js';
import { PedidoPagoService } from '../../services/pedidoPago.service.js';
import { MercadoPagoService } from './mercadopago.service.js';

export const mercadoPagoRouter = Router();

const mercadoPagoService = new MercadoPagoService();
const pedidoService = new PedidoPagoService(mercadoPagoService);
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
