import { Router } from 'express';
import { PaquetePublicadoService } from '../../services/paquetePublicado.service';
import { PaquetePublicadoController } from '../../controllers/paquetePublicado.controller';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { ComprarProductoDto } from '../../dtos/producto/comprarProducto.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';

export const paquetePublicadoRouter = Router();

const service = new PaquetePublicadoService();
const controller = new PaquetePublicadoController(service);

paquetePublicadoRouter.get('/por-cerrarse', controller.getPorCerrarse.bind(controller));
paquetePublicadoRouter.get('/', controller.getAll.bind(controller));
paquetePublicadoRouter.get('/:id', controller.getById.bind(controller));
paquetePublicadoRouter.post('/', controller.create.bind(controller));
paquetePublicadoRouter.put('/:id', controller.update.bind(controller));
paquetePublicadoRouter.delete('/:id', controller.delete.bind(controller));
paquetePublicadoRouter.post('/sumarse', authMiddleware, validarDto(ComprarProductoDto), controller.sumarse.bind(controller));
