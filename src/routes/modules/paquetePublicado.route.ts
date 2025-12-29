import { Router } from 'express';
import { PaquetePublicadoService } from '../../services/paquetePublicado.service';
import { PaquetePublicadoController } from '../../controllers/paquetePublicado.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { PaquetePublicadoRepository } from '../../repositories/paquetePublicado.repository';
import { LocalidadRepository } from '../../repositories/localidad.repository';
import { UsuarioRepository } from '../../repositories/usuario.repository';
import { ZonaRepository } from '../../repositories/zona.repository';
import { PaqueteBaseRepository } from '../../repositories/paqueteBase.repository';

export const paquetePublicadoRouter = Router();

// Repositories
const paquetePublicadoRepository = new PaquetePublicadoRepository();
const localidadRepository = new LocalidadRepository();
const usuarioRepository = new UsuarioRepository();
const zonaRepository = new ZonaRepository();
const paqueteBaseRepository = new PaqueteBaseRepository();

// Service
const service = new PaquetePublicadoService(
    paquetePublicadoRepository,
    localidadRepository,
    usuarioRepository,
    zonaRepository,
    paqueteBaseRepository
);

// Controller
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
paquetePublicadoRouter.post('/', controller.create.bind(controller));
paquetePublicadoRouter.put('/:id', controller.update.bind(controller));
paquetePublicadoRouter.delete('/:id', controller.delete.bind(controller));