import { Router } from "express";
import { MercadoPagoController } from "./mercadopago.controller";
import { PedidoService } from "../../services/pedido.service";
import { MercadoPagoService } from "./mercadopago.service";

export const mercadoPagoRouter = Router();

const mercadoPagoService = new MercadoPagoService();
const pedidoService = new PedidoService(mercadoPagoService);
const mercadoPagoController = new MercadoPagoController(pedidoService);

mercadoPagoRouter.post(
  "/webhook",
  mercadoPagoController.webhook.bind(mercadoPagoController)
);

mercadoPagoRouter.get("/success", (req, res) => {
  const { payment_id, external_reference, status } = req.query;
  res.redirect(
    `http://localhost:4200/pago/success?payment_id=${payment_id}&external_reference=${external_reference}&status=${status}`
  );
});

mercadoPagoRouter.get("/failure", (req, res) => {
  const { payment_id, external_reference, status } = req.query;
  res.redirect(
    `http://localhost:4200/pago/failure?payment_id=${payment_id}&external_reference=${external_reference}&status=${status}`
  );
});

mercadoPagoRouter.get("/pending", (req, res) => {
  const { payment_id, external_reference, status } = req.query;
  res.redirect(
    `http://localhost:4200/pago/pending?payment_id=${payment_id}&external_reference=${external_reference}&status=${status}`
  );
});
