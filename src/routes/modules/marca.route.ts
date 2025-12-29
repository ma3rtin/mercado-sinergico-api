import { Router } from 'express';
import { MarcaController } from '../../controllers/marca.controller';
import { MarcaService } from '../../services/marca.service';
import { MarcaRepository } from '../../repositories/marca.repository';

const marcaRouter = Router();

// Repo, Service, Controller
const marcaRepository = new MarcaRepository();
const service = new MarcaService(marcaRepository);
const controller = new MarcaController(service);

marcaRouter.get('/', controller.getAll.bind(controller));
marcaRouter.get('/:id', controller.getById.bind(controller));
marcaRouter.post('/', controller.create.bind(controller));

export default marcaRouter;
