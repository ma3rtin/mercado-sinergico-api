import { Router } from 'express';
import { CarritoController } from '../../controllers/carrito.controller';
import { CarritoService } from '../../services/carrito.service';
import { authMiddleware } from '../../middlewares/auth.middleware';

export const carritoRouter = Router();

const service = new CarritoService();
const controller = new CarritoController(service);

carritoRouter.get('/', authMiddleware, controller.getCarritoUsuario.bind(controller));
carritoRouter.post('/paquetes', authMiddleware, controller.addPaquete.bind(controller));
