import { Router } from 'express';
import { MarcaController } from '../../controllers/marca.controller';
import { MarcaService } from '../../services/marca.service';

const marcaRouter = Router();
const service = new MarcaService();
const controller = new MarcaController(service);

marcaRouter.get('/', controller.getAll.bind(controller));
marcaRouter.get('/:id', controller.getById.bind(controller));
marcaRouter.post('/', controller.create.bind(controller));





export default marcaRouter;
