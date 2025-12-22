import { Router } from 'express';
import { LocalidadController } from '../../controllers/localidad.controller';

// export const localidadRouter = Router({ mergeParams: true });
// const controller = new LocalidadController();

// rutas bajo /api/zonas/:id/localidades
// localidadRouter.get("/", controller.getAllByZona.bind(controller));
// localidadRouter.post("/", controller.create.bind(controller));
// localidadRouter.delete("/:localidadId", controller.delete.bind(controller));

// rutas globales bajo /api/localidades
import { LocalidadService } from '../../services/localidad.service';
import { PrismaLocalidadRepository, PrismaLocalidadZonaRepository } from '../../repositories/prisma/PrismaLocationRepository';

// rutas globales bajo /api/localidades
export const localidadRouter = Router();
const localidadRepository = new PrismaLocalidadRepository();
const localidadZonaRepository = new PrismaLocalidadZonaRepository();
const service = new LocalidadService(localidadRepository, localidadZonaRepository);
const controller = new LocalidadController(service);
localidadRouter.get('/', controller.getAll.bind(controller));
