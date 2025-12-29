import { Router } from 'express';
import { PedidoController } from '../../controllers/pedido.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { SumarseDTO } from '../../dtos/pedido/sumarse.dto';
import { ActualizarCantidadDTO } from '../../dtos/pedido/actualizar-cantidad.dto';
import { PedidoService } from '../../services/pedido.service';
import { PedidoRepository } from '../../repositories/pedido.repository';
import { PaquetePublicadoRepository } from '../../repositories/paquetePublicado.repository';

const router = Router();

// Repositories
const pedidoRepository = new PedidoRepository();
const paquetePublicadoRepository = new PaquetePublicadoRepository();

// Service
const pedidoService = new PedidoService(pedidoRepository, paquetePublicadoRepository);

// Controller
const controller = new PedidoController(pedidoService);

router.get('/', authMiddleware, controller.getAll.bind(controller));
router.post('/:paqueteId', authMiddleware, validarDto(SumarseDTO), controller.crearPedido.bind(controller));
router.get('/:id', authMiddleware, controller.getById.bind(controller));
router.get('/bajarse/:paqueteId', authMiddleware, controller.bajarse.bind(controller));
router.delete('/:pedidoId/producto/:productoId', authMiddleware, controller.eliminarProducto.bind(controller));
router.patch('/:pedidoId/producto/:productoId', authMiddleware, validarDto(ActualizarCantidadDTO), controller.actualizarCantidad.bind(controller));

export default router;
