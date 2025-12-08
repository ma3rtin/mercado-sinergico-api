import { Router } from 'express';
import { PedidoController } from '../../controllers/pedido.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { SumarseDTO } from '../../dtos/pedido/sumarse.dto';
import { ActualizarCantidadDTO } from '../../dtos/pedido/actualizar-cantidad.dto';

const router = Router();
const controller = new PedidoController();

router.get('/', authMiddleware, controller.getAll);
router.post('/:paqueteId', authMiddleware, validarDto(SumarseDTO), controller.crearPedido);
router.get('/:id', authMiddleware, controller.getById);
router.get('/bajarse/:paqueteId', authMiddleware, controller.bajarse);
router.delete('/:pedidoId/producto/:productoId', authMiddleware, controller.eliminarProducto);
router.patch('/:pedidoId/producto/:productoId', authMiddleware, validarDto(ActualizarCantidadDTO), controller.actualizarCantidad);

export default router;
