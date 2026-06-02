import { Router } from 'express';
import { CategoriaController } from '../../controllers/categoria.controller.js';
import { CategoriaService } from '../../services/categoria.service.js';

export const categoriaRouter = Router();
const service = new CategoriaService();
const controller = new CategoriaController(service);

categoriaRouter.get('/', controller.getAll.bind(controller));
categoriaRouter.get('/:id', controller.getById.bind(controller));
categoriaRouter.post('/',  controller.create.bind(controller));
categoriaRouter.put('/:id',  controller.updateCategoria);

export default categoriaRouter;