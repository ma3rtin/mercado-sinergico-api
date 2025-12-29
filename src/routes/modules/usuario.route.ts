import { Router } from 'express';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioController } from '../../controllers/usuario.controller';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { UsuarioDTO } from '../../dtos/usuario/usuario.dto';
import { LoginDTO } from '../../dtos/usuario/login.dto';
import { DireccionDTO } from '../../dtos/direccion/direccion.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { firebaseAuthMiddleware } from '../../middlewares/firebaseAuth.middleware';
import { UsuarioUpdateDTO } from '../../dtos/usuario/usuarioUpdate.dto';
import { procesarSubidaImagen } from './../../middlewares/uploadFiles.middleware';
import { ImagenService } from '../../services/imagen.service';
import multer from 'multer';
import { UsuarioRepository } from '../../repositories/usuario.repository';
import { DireccionRepository } from '../../repositories/direccion.repository';
import { LocalidadRepository } from '../../repositories/localidad.repository';

const upload = multer();

// Repositories
const usuarioRepository = new UsuarioRepository();
const direccionRepository = new DireccionRepository();
const localidadRepository = new LocalidadRepository();

// Services
const imagenService = new ImagenService();
const usuarioService = new UsuarioService(
    usuarioRepository,
    direccionRepository,
    localidadRepository,
    imagenService
);

// Controller
const usuarioController = new UsuarioController(usuarioService, imagenService);

export const usuarioRouter = Router();

usuarioRouter.get('/me', authMiddleware, usuarioController.obtenerUsuario);
usuarioRouter.patch('/me', authMiddleware, upload.single('imagen'), validarDto(UsuarioUpdateDTO), usuarioController.actualizarUsuario);
usuarioRouter.post('/registrar', validarDto(UsuarioDTO), usuarioController.registrar.bind(usuarioController));
usuarioRouter.post('/login', validarDto(LoginDTO), usuarioController.iniciarSesion.bind(usuarioController));
usuarioRouter.post('/login-firebase', firebaseAuthMiddleware, usuarioController.loginConFirebase.bind(usuarioController));
usuarioRouter.post('/direccion', authMiddleware, procesarSubidaImagen('imagen'), validarDto(DireccionDTO), usuarioController.registrarDireccion.bind(usuarioController));