import { Router } from 'express';
import { PedidoController } from '../../controllers/pedido.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { CrearPedidoDTO } from '../../dtos/pedido/crearPedido.dto.js';
import { ActualizarCantidadDTO } from '../../dtos/pedido/actualizarCantidad.dto.js';
import { PedidoService } from '../../services/pedido.service.js';
import { PedidoPagoService } from '../../services/pedidoPago.service.js';
import { MercadoPagoService } from '../../payments/mercadopago/mercadopago.service.js';

import { validateNumericParams } from '../../middlewares/validateParams.middleware.js';

const router = Router();
// Instanciar dependencias
const mercadoPagoService = new MercadoPagoService();
const pedidoService = new PedidoService();
const pagoService = new PedidoPagoService(mercadoPagoService);

const controller = new PedidoController(pedidoService, pagoService);

router.get('/', authMiddleware, controller.getAll);

router.post(
  '/:paqueteId',
  authMiddleware,
  validateNumericParams(['paqueteId']),
  validarDto(CrearPedidoDTO),
  controller.crearPedido
);

router.delete('/:paqueteId/bajarse', authMiddleware, validateNumericParams(['paqueteId']), controller.bajarse);

router.get('/:id', authMiddleware, validateNumericParams(['id']), controller.getById);

router.delete(
  '/:pedidoId/detalle/:detalleId',
  authMiddleware,
  validateNumericParams(['pedidoId', 'detalleId']),
  controller.eliminarProducto
);

router.patch(
  '/:pedidoId/detalle/:detalleId/cantidad',
  authMiddleware,
  validateNumericParams(['pedidoId', 'detalleId']),
  validarDto(ActualizarCantidadDTO),
  controller.actualizarCantidad
);

router.post(
  '/:pedidoId/checkout',
  authMiddleware,
  validateNumericParams(['pedidoId']),
  controller.iniciarPago
);


export default router;