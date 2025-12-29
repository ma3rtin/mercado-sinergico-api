import { Router } from 'express';
import { LocalidadController } from '../../controllers/localidad.controller';
import { LocalidadRepository } from '../../repositories/localidad.repository';
import { LocalidadService } from '../../services/localidad.service';

// rutas globales bajo /api/localidades
export const localidadRouter = Router();

// Repo, Service, Controller
const localidadRepository = new LocalidadRepository();
const service = new LocalidadService(localidadRepository);
const controller = new LocalidadController(service);

localidadRouter.get('/', controller.getAll.bind(controller));
