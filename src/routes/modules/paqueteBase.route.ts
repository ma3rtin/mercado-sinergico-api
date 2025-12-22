import { Router } from 'express';
import { PaqueteController } from '../../controllers/paqueteBase.controller';
import { PaqueteBaseService } from '../../services/paqueteBase.service';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { PaqueteBaseDTO } from '../../dtos/paquete/paqueteBase.dto';
import { AgregarProductoPaqueteDTO } from '../../dtos/producto/agregarProductoPaquete.dto';
import { ImagenService } from './../../services/imagen.service';
import { procesarSubidaImagen } from '../../middlewares/uploadFiles.middleware';

import { PrismaPaqueteBaseRepository } from '../../repositories/prisma/PrismaBundleRepository';

export const paqueteBaseRouter = Router();
const paqueteBaseRepository = new PrismaPaqueteBaseRepository();
const paqueteService = new PaqueteBaseService(paqueteBaseRepository);
const imagenService = new ImagenService();
const controller = new PaqueteController(paqueteService, imagenService);

paqueteBaseRouter.get('/', controller.getAll.bind(controller));
paqueteBaseRouter.get('/:id', controller.getById.bind(controller));
paqueteBaseRouter.post('/', procesarSubidaImagen('imagen'), validarDto(PaqueteBaseDTO), controller.create.bind(controller));
paqueteBaseRouter.put('/:id', validarDto(PaqueteBaseDTO), controller.update.bind(controller));
paqueteBaseRouter.delete('/:id', controller.delete.bind(controller));
paqueteBaseRouter.post('/agregar-productos', validarDto(AgregarProductoPaqueteDTO), controller.agregarProductos.bind(controller));
paqueteBaseRouter.get('/:id/productos', controller.getProductosByPaquete.bind(controller));
