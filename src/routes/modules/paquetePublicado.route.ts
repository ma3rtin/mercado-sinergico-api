import { Router } from 'express';
import { PaquetePublicadoService } from '../../services/paquetePublicado.service.js';
import { PaquetePublicadoController } from '../../controllers/paquetePublicado.controller.js';

import { authMiddleware, rolMiddleware } from '../../middlewares/auth.middleware.js';


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

// Admin only mutations
paquetePublicadoRouter.post('/:id/confirmar', authMiddleware, rolMiddleware(['Admin']), controller.confirmarCompraFabricante.bind(controller));
paquetePublicadoRouter.put('/:id', authMiddleware, rolMiddleware(['Admin']), controller.update.bind(controller));
paquetePublicadoRouter.delete('/:id', authMiddleware, rolMiddleware(['Admin']), controller.delete.bind(controller));
paquetePublicadoRouter.get('/:id/exportar-fabrica', authMiddleware, rolMiddleware(['Admin']), controller.exportarFabrica.bind(controller));
paquetePublicadoRouter.get('/:id/exportar-logistica', authMiddleware, rolMiddleware(['Admin']), controller.exportarLogistica.bind(controller));
paquetePublicadoRouter.post('/:id/duplicar', authMiddleware, rolMiddleware(['Admin']), controller.duplicar.bind(controller));
paquetePublicadoRouter.post('/:id/completar', authMiddleware, rolMiddleware(['Admin']), controller.completar.bind(controller));
paquetePublicadoRouter.post('/:id/cancelar', authMiddleware, rolMiddleware(['Admin']), controller.cancelar.bind(controller));
paquetePublicadoRouter.post('/:id/cerrar', authMiddleware, rolMiddleware(['Admin']), controller.cerrar.bind(controller));
paquetePublicadoRouter.post('/:id/notificar', authMiddleware, rolMiddleware(['Admin']), controller.notificar.bind(controller));

