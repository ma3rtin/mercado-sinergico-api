import { Router } from 'express';
import { CategoriaController } from '../../controllers/categoria.controller';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaRepository } from '../../repositories/categoria.repository';

export const categoriaRouter = Router();
const repository = new CategoriaRepository();
const service = new CategoriaService(repository);
const controller = new CategoriaController(service);

categoriaRouter.get('/', controller.getAll.bind(controller));
categoriaRouter.post('/', controller.create.bind(controller));
categoriaRouter.get('/:id', controller.getById.bind(controller));

export default categoriaRouter;