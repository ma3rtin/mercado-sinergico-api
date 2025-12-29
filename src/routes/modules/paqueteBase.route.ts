import { Router } from 'express';
import { PaqueteController } from '../../controllers/paqueteBase.controller';
import { PaqueteBaseService } from '../../services/paqueteBase.service';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { PaqueteBaseDTO } from '../../dtos/paquete/paqueteBase.dto';
import { AgregarProductoPaqueteDTO } from '../../dtos/producto/agregarProductoPaquete.dto';
import { ImagenService } from './../../services/imagen.service';
import { procesarSubidaImagen } from '../../middlewares/uploadFiles.middleware';
import { PaqueteBaseRepository } from '../../repositories/paqueteBase.repository';
import { CategoriaRepository } from '../../repositories/categoria.repository';

export const paqueteBaseRouter = Router();

// Repositories
const paqueteBaseRepository = new PaqueteBaseRepository();
const categoriaRepository = new CategoriaRepository();

// Services
const paqueteService = new PaqueteBaseService(paqueteBaseRepository, categoriaRepository);
const imagenService = new ImagenService();

// Controller
const controller = new PaqueteController(paqueteService, imagenService);

paqueteBaseRouter.get('/', controller.getAll.bind(controller));
paqueteBaseRouter.get('/:id', controller.getById.bind(controller));
paqueteBaseRouter.post('/', procesarSubidaImagen('imagen'), validarDto(PaqueteBaseDTO), controller.create.bind(controller));
paqueteBaseRouter.put('/:id', validarDto(PaqueteBaseDTO), controller.update.bind(controller));
paqueteBaseRouter.delete('/:id', controller.delete.bind(controller));
paqueteBaseRouter.post('/agregar-productos', validarDto(AgregarProductoPaqueteDTO), controller.agregarProductos.bind(controller));
paqueteBaseRouter.get('/:id/productos', controller.getProductosByPaquete.bind(controller));
