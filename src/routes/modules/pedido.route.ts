import { Router } from 'express';
import { PedidoController } from '../../controllers/pedido.controller.js';
import { authMiddleware, rolMiddleware } from '../../middlewares/auth.middleware.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { CrearPedidoDTO } from '../../dtos/pedido/crearPedido.dto.js';
import { NotificarEnvioDTO } from '../../dtos/pedido/notificarEnvio.dto.js';
import { ActualizarCantidadDTO } from '../../dtos/pedido/actualizarCantidad.dto.js';
import { PedidoService } from '../../services/pedido.service.js';
import { PedidoPagoService } from '../../services/pedidoPago.service.js';
import { MercadoPagoService } from '../../payments/mercadopago/mercadopago.service.js';

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
  validarDto(CrearPedidoDTO),
  controller.crearPedido
);

router.delete('/:paqueteId/bajarse', authMiddleware, controller.bajarse);

router.patch(
  '/notificar-envio',
  authMiddleware,
  rolMiddleware(['Administrador']),
  validarDto(NotificarEnvioDTO),
  controller.notificarEnvio
);

router.get('/:id', authMiddleware, controller.getById);

router.delete(
  '/:pedidoId/detalle/:detalleId',
  authMiddleware,
  controller.eliminarProducto
);

router.patch(
  '/:pedidoId/detalle/:detalleId/cantidad',
  authMiddleware,
  validarDto(ActualizarCantidadDTO),
  controller.actualizarCantidad
);

router.post(
  '/:pedidoId/checkout',
  authMiddleware,
  controller.iniciarPago
);

router.post(
  '/:pedidoId/solicitar-reembolso',
  authMiddleware,
  controller.solicitarReembolso
);

export default router;