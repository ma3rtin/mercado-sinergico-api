import { Router } from 'express';
import { PaqueteController } from '../../controllers/paqueteBase.controller.js';
import { PaqueteBaseService } from '../../services/paqueteBase.service.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { PaqueteBaseDTO } from '../../dtos/paquete/paqueteBase.dto.js';
import { AgregarProductoPaqueteDTO } from '../../dtos/producto/agregarProductoPaquete.dto.js';
import { ImagenService } from './../../services/imagen.service.js';
import { procesarSubidaImagen } from '../../middlewares/uploadFiles.middleware.js';

import { authMiddleware, rolMiddleware } from '../../middlewares/auth.middleware.js';

export const paqueteBaseRouter = Router();
const paqueteService = new PaqueteBaseService();
const imagenService = new ImagenService();
const controller = new PaqueteController(paqueteService, imagenService);

paqueteBaseRouter.get('/', controller.getAll.bind(controller));
paqueteBaseRouter.get('/:id', controller.getById.bind(controller));
paqueteBaseRouter.get('/:id/productos', controller.getProductosByPaquete.bind(controller));

// Admin only operations
paqueteBaseRouter.post('/', authMiddleware, rolMiddleware(['Admin']), procesarSubidaImagen('imagen'), validarDto(PaqueteBaseDTO), controller.create.bind(controller));
paqueteBaseRouter.put('/:id', authMiddleware, rolMiddleware(['Admin']), validarDto(PaqueteBaseDTO), controller.update.bind(controller));
paqueteBaseRouter.delete('/:id', authMiddleware, rolMiddleware(['Admin']), controller.delete.bind(controller));
paqueteBaseRouter.post('/agregar-productos', authMiddleware, rolMiddleware(['Admin']), validarDto(AgregarProductoPaqueteDTO), controller.agregarProductos.bind(controller));
paqueteBaseRouter.post('/:id/duplicar', authMiddleware, rolMiddleware(['Admin']), controller.duplicar.bind(controller));

