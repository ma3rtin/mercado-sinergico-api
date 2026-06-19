import { Router } from 'express';
import { PaqueteController } from '../../controllers/paqueteBase.controller.js';
import { PaqueteBaseService } from '../../services/paqueteBase.service.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { PaqueteBaseDTO } from '../../dtos/paquete/paqueteBase.dto.js';
import { SincronizarProductosDTO } from '../../dtos/paquete/sincronizarProductos.dto.js';
import { ImagenService } from './../../services/imagen.service.js';
import { procesarSubidaImagen } from '../../middlewares/uploadFiles.middleware.js';
import { authMiddleware, rolMiddleware } from '../../middlewares/auth.middleware.js';

export const paqueteBaseRouter = Router();
const paqueteService = new PaqueteBaseService();
const imagenService = new ImagenService();
const controller = new PaqueteController(paqueteService, imagenService);

const soloAdmin = [authMiddleware, rolMiddleware(['Administrador'])];

// ─── Consultas (públicas) ──────────────────────────────────────────────────────
paqueteBaseRouter.get('/', controller.getAll.bind(controller));
paqueteBaseRouter.get('/:id', controller.getById.bind(controller));
paqueteBaseRouter.get('/:id/productos', controller.getProductosByPaquete.bind(controller));

// ─── Escritura (solo Admin) ────────────────────────────────────────────────────
paqueteBaseRouter.post('/', ...soloAdmin, procesarSubidaImagen('imagen'), validarDto(PaqueteBaseDTO), controller.create.bind(controller));
paqueteBaseRouter.put('/:id', ...soloAdmin, validarDto(PaqueteBaseDTO), controller.update.bind(controller));
paqueteBaseRouter.delete('/:id', ...soloAdmin, controller.delete.bind(controller));
paqueteBaseRouter.post('/:id/productos', ...soloAdmin, validarDto(SincronizarProductosDTO), controller.sincronizarProductos.bind(controller));
paqueteBaseRouter.post('/:id/duplicar', ...soloAdmin, controller.duplicar.bind(controller));
