import { Router } from 'express';
import { ZonaController } from '../../controllers/zona.controller';
import { localidadRouter } from './localidad.route';
import { validarDto } from './../../middlewares/validateDTO.middleware';
import { ZonaDTO } from '../../dtos/zona.dto';
import { ZonaService } from '../../services/zona.service';
import { rolMiddleware } from '../../middlewares/auth.middleware';

export const zonaRouter = Router();
const service = new ZonaService();
const controller = new ZonaController(service);


zonaRouter.get('/', controller.getAll.bind(controller));
zonaRouter.get('/:id', controller.getById.bind(controller));
zonaRouter.post('/', rolMiddleware(['admin']), validarDto(ZonaDTO), controller.create.bind(controller));
zonaRouter.put('/:id', rolMiddleware(['admin']), controller.update.bind(controller));
zonaRouter.delete('/:id', rolMiddleware(['admin']), controller.delete.bind(controller));

zonaRouter.use('/:id/localidades', localidadRouter);