import { Router } from 'express';
import { PaquetePublicadoService } from '../../services/paquetePublicado.service.js';
import { PaquetePublicadoController } from '../../controllers/paquetePublicado.controller.js';

import { authMiddleware, rolMiddleware } from '../../middlewares/auth.middleware.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { PaquetePublicadoUpdateDTO } from '../../dtos/paquete/paquetePublicadoUpdate.dto.js';
import { procesarSubidaImagen } from '../../middlewares/uploadFiles.middleware.js';

export const paquetePublicadoRouter = Router();

const service = new PaquetePublicadoService();
const controller = new PaquetePublicadoController(service);

const soloAdmin = [authMiddleware, rolMiddleware(['Admin'])];

// ─── Rutas de consulta (públicas) ─────────────────────────────────────────────
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

// ─── Rutas de mutación (solo Admin) ───────────────────────────────────────────
paquetePublicadoRouter.post('/', ...soloAdmin, procesarSubidaImagen('imagen'), controller.create.bind(controller));
paquetePublicadoRouter.put('/:id', ...soloAdmin, procesarSubidaImagen('imagen'), validarDto(PaquetePublicadoUpdateDTO), controller.update.bind(controller));
paquetePublicadoRouter.delete('/:id', ...soloAdmin, controller.delete.bind(controller));

// ─── Rutas de gestión (solo Admin) ────────────────────────────────────────────
paquetePublicadoRouter.post('/:id/duplicar',         ...soloAdmin, controller.duplicar.bind(controller));
paquetePublicadoRouter.post('/:id/completar',        ...soloAdmin, controller.completar.bind(controller));
paquetePublicadoRouter.post('/:id/confirmar',        ...soloAdmin, controller.confirmarCompraFabricante.bind(controller));
paquetePublicadoRouter.post('/:id/entregar',         ...soloAdmin, controller.marcarEntregado.bind(controller));
paquetePublicadoRouter.post('/:id/marcar-en-camino', ...soloAdmin, controller.marcarPedidosEnCamino.bind(controller));
paquetePublicadoRouter.post('/:id/cancelar',         ...soloAdmin, controller.cancelar.bind(controller));
paquetePublicadoRouter.post('/:id/notificar',        ...soloAdmin, controller.notificar.bind(controller));
