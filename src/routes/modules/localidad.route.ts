import { Router } from 'express';
import { LocalidadController } from '../../controllers/localidad.controller';

// export const localidadRouter = Router({ mergeParams: true });
// const controller = new LocalidadController();

// rutas bajo /api/zonas/:id/localidades
// localidadRouter.get("/", controller.getAllByZona.bind(controller));
// localidadRouter.post("/", controller.create.bind(controller));
// localidadRouter.delete("/:localidadId", controller.delete.bind(controller));

// rutas globales bajo /api/localidades
export const localidadRouter = Router();
const controller = new LocalidadController();
localidadRouter.get('/', controller.getAll.bind(controller));
