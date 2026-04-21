import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { UsuarioService } from '../../services/usuario.service.js';
import { UsuarioController } from '../../controllers/usuario.controller.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { UsuarioDTO } from '../../dtos/usuario/usuario.dto.js';
import { LoginDTO } from '../../dtos/usuario/login.dto.js';
import { DireccionDTO } from '../../dtos/direccion/direccion.dto.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { firebaseAuthMiddleware } from '../../middlewares/firebaseAuth.middleware.js';
import { UsuarioUpdateDTO } from '../../dtos/usuario/usuarioUpdate.dto.js';
import { procesarSubidaImagen } from './../../middlewares/uploadFiles.middleware.js';
import { ImagenService } from '../../services/imagen.service.js';
import multer from 'multer';

const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
});

const upload = multer();
const usuarioService = new UsuarioService();
const imagenService = new ImagenService();
const usuarioController = new UsuarioController(usuarioService, imagenService);
export const usuarioRouter = Router();

usuarioRouter.get('/me', authMiddleware, usuarioController.obtenerUsuario);
usuarioRouter.patch('/me', authMiddleware, upload.single('imagen'), validarDto(UsuarioUpdateDTO), usuarioController.actualizarUsuario);
usuarioRouter.post('/registrar', limiteAuth, validarDto(UsuarioDTO), usuarioController.registrar.bind(usuarioController));
usuarioRouter.post('/login', limiteAuth, validarDto(LoginDTO), usuarioController.iniciarSesion.bind(usuarioController));
usuarioRouter.post('/login-firebase', limiteAuth, firebaseAuthMiddleware, usuarioController.loginConFirebase.bind(usuarioController));
usuarioRouter.post('/direccion', authMiddleware, procesarSubidaImagen('imagen'), validarDto(DireccionDTO), usuarioController.registrarDireccion.bind(usuarioController));