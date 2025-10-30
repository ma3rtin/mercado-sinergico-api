import { Router } from 'express';
import { PaqueteController } from '../../controllers/paqueteBase.controller';
import { PaqueteBaseService } from '../../services/paqueteBase.service';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { PaqueteBaseDTO } from '../../dtos/paqueteBase.dto';
import { AgregarProductoPaqueteDTO } from '../../dtos/agregarProductoPaquete.dto';
import { ImagenService } from './../../services/imagen.service';
import { procesarSubidaImagen } from '../../middlewares/uploadFiles.middleware';

export const paqueteBaseRouter = Router();
const paqueteService = new PaqueteBaseService();
const imagenService = new ImagenService();
const controller = new PaqueteController(paqueteService, imagenService);

paqueteBaseRouter.get('/', controller.getAll.bind(controller));
paqueteBaseRouter.get('/:id', controller.getById.bind(controller));
paqueteBaseRouter.post('/', procesarSubidaImagen('imagen'), validarDto(PaqueteBaseDTO), controller.create.bind(controller));
paqueteBaseRouter.put('/:id', validarDto(PaqueteBaseDTO), controller.update.bind(controller));
paqueteBaseRouter.delete('/:id', controller.delete.bind(controller));
paqueteBaseRouter.post('/agregar-productos', validarDto(AgregarProductoPaqueteDTO), controller.agregarProductos.bind(controller));
