import { Router } from 'express';
import { PedidoController } from '../../controllers/pedido.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { SumarseDTO } from '../../dtos/pedido/sumarse.dto.js';
import { ActualizarCantidadDTO } from '../../dtos/pedido/actualizar-cantidad.dto.js';
import { PedidoService } from '../../services/pedido.service.js';
import { MercadoPagoService } from '../../payments/mercadopago/mercadopago.service.js';

const router = Router();
const mercadoPagoService = new MercadoPagoService();
const pedidoService = new PedidoService(mercadoPagoService);
const controller = new PedidoController(pedidoService);

router.get('/', authMiddleware, controller.getAll);
router.post('/:paqueteId', authMiddleware, validarDto(SumarseDTO), controller.crearPedido);
router.get('/bajarse/:paqueteId', authMiddleware, controller.bajarse);
router.get('/:id', authMiddleware, controller.getById);
router.delete('/:pedidoId/producto/:productoId', authMiddleware, controller.eliminarProducto);
router.patch('/:pedidoId/producto/:productoId', authMiddleware, validarDto(ActualizarCantidadDTO), controller.actualizarCantidad);
router.post('/:pedidoId/checkout', authMiddleware, controller.iniciarPago);

export default router;
