import { Router } from 'express';
import { MarcaController } from '../../controllers/marca.controller.js';
import { MarcaService } from '../../services/marca.service.js';
import { authMiddleware, rolMiddleware } from '../../middlewares/auth.middleware.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { MarcaDTO } from '../../dtos/marca.dto.js';

const marcaRouter = Router();
const service = new MarcaService();
const controller = new MarcaController(service);

const soloAdmin = [authMiddleware, rolMiddleware(['Administrador'])];

marcaRouter.get('/', controller.getAll.bind(controller));
marcaRouter.get('/:id', controller.getById.bind(controller));
marcaRouter.post('/', ...soloAdmin, validarDto(MarcaDTO), controller.create.bind(controller));
marcaRouter.put('/:id', ...soloAdmin, validarDto(MarcaDTO), controller.updateMarca.bind(controller));

export default marcaRouter;
