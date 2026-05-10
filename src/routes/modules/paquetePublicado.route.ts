import { Router } from 'express';
import { PaquetePublicadoService } from '../../services/paquetePublicado.service.js';
import { PaquetePublicadoController } from '../../controllers/paquetePublicado.controller.js';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { PaquetePublicadoUpdateDTO } from '../../dtos/paquete/paquetePublicadoUpdate.dto.js';
import { procesarSubidaImagen } from '../../middlewares/uploadFiles.middleware.js';

export const paquetePublicadoRouter = Router();

const service = new PaquetePublicadoService();
const controller = new PaquetePublicadoController(service);

// ─── Rutas de consulta ────────────────────────────────────────────────────────
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
paquetePublicadoRouter.post('/', controller.create.bind(controller));
paquetePublicadoRouter.get('/', controller.getAll.bind(controller));
paquetePublicadoRouter.get('/:id', controller.getById.bind(controller));

// ─── Rutas de mutación ────────────────────────────────────────────────────────
paquetePublicadoRouter.post('/', procesarSubidaImagen('imagen'), controller.create.bind(controller));
paquetePublicadoRouter.put('/:id', procesarSubidaImagen('imagen'), validarDto(PaquetePublicadoUpdateDTO), controller.update.bind(controller));
paquetePublicadoRouter.delete('/:id', controller.delete.bind(controller));

// ─── Rutas de gestión (admin) ─────────────────────────────────────────────────
paquetePublicadoRouter.post('/:id/duplicar', controller.duplicar.bind(controller));
paquetePublicadoRouter.post('/:id/descartar', controller.descartar.bind(controller));
paquetePublicadoRouter.post('/:id/completar', controller.completar.bind(controller));         // Activo → Completo (manual)
paquetePublicadoRouter.post('/:id/confirmar', controller.confirmarCompraFabricante.bind(controller)); // Completo → Confirmado
paquetePublicadoRouter.post('/:id/entregar', controller.marcarEntregado.bind(controller));   // Confirmado → Entregado
paquetePublicadoRouter.post('/:id/marcar-en-camino', controller.marcarPedidosEnCamino.bind(controller)); // Pedidos → En camino
paquetePublicadoRouter.post('/:id/cancelar', controller.cancelar.bind(controller));          // Cancelar + reembolsar
paquetePublicadoRouter.post('/:id/notificar', controller.notificar.bind(controller));         // Notificar compradores
