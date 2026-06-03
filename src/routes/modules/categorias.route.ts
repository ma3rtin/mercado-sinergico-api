import { Router } from 'express';
import { CategoriaController } from '../../controllers/categoria.controller.js';
import { CategoriaService } from '../../services/categoria.service.js';
import { authMiddleware, rolMiddleware } from '../../middlewares/auth.middleware.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { CategoriaDTO } from '../../dtos/categoria.dto.js';

export const categoriaRouter = Router();
const service = new CategoriaService();
const controller = new CategoriaController(service);

const soloAdmin = [authMiddleware, rolMiddleware(['Administrador'])];

categoriaRouter.get('/', controller.getAll.bind(controller));
categoriaRouter.get('/:id', controller.getById.bind(controller));
categoriaRouter.post('/', ...soloAdmin, validarDto(CategoriaDTO), controller.create.bind(controller));
categoriaRouter.put('/:id', ...soloAdmin, validarDto(CategoriaDTO), controller.updateCategoria.bind(controller));

export default categoriaRouter;