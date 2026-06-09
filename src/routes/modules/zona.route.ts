import { Router } from 'express';
import { ZonaController } from '../../controllers/zona.controller.js';
import { localidadRouter } from './localidad.route.js';
import { validarDto } from './../../middlewares/validateDTO.middleware.js';
import { ZonaDTO } from '../../dtos/direccion/zona.dto.js';
import { ZonaService } from '../../services/zona.service.js';
import { authMiddleware, rolMiddleware } from '../../middlewares/auth.middleware.js';

export const zonaRouter = Router();
const service = new ZonaService();
const controller = new ZonaController(service);

const soloAdmin = [authMiddleware, rolMiddleware(['Administrador'])];

zonaRouter.get('/', controller.getAll.bind(controller));
zonaRouter.get('/:id', controller.getById.bind(controller));
zonaRouter.post('/', ...soloAdmin, validarDto(ZonaDTO), controller.create.bind(controller));
zonaRouter.put('/:id', ...soloAdmin, controller.update.bind(controller));
zonaRouter.delete('/:id', ...soloAdmin, controller.delete.bind(controller));

zonaRouter.use('/:id/localidades', localidadRouter);