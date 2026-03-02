import { Router } from 'express';
import { PaquetePublicadoService } from '../../services/paquetePublicado.service.js';
import { PaquetePublicadoController } from '../../controllers/paquetePublicado.controller.js';

import { authMiddleware } from '../../middlewares/auth.middleware.js';

export const paquetePublicadoRouter = Router();

const service = new PaquetePublicadoService();
const controller = new PaquetePublicadoController(service);

paquetePublicadoRouter.get('/por-cerrarse', controller.getPorCerrarse.bind(controller));
paquetePublicadoRouter.get('/relacionados/:id', controller.getRelacionados.bind(controller));
paquetePublicadoRouter.get('/zona', (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        authMiddleware(req, res, next);
    } else {
        next();
    }
}, controller.getByLocation.bind(controller));
paquetePublicadoRouter.get('/producto/:id', controller.getByProductId.bind(controller));
paquetePublicadoRouter.get('/', controller.getAll.bind(controller));
paquetePublicadoRouter.get('/:id', controller.getById.bind(controller));
paquetePublicadoRouter.post('/:id/confirmar', controller.confirmarCompraFabricante.bind(controller));
paquetePublicadoRouter.post('/:id/test-email', controller.testEmail.bind(controller));
paquetePublicadoRouter.put('/:id', controller.update.bind(controller));
paquetePublicadoRouter.delete('/:id', controller.delete.bind(controller));