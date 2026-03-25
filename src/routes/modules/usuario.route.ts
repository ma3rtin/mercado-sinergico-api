import { Router } from 'express';
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

import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';

const upload = multer();
const usuarioService = new UsuarioService();
const imagenService = new ImagenService();
const usuarioController = new UsuarioController(usuarioService, imagenService);
export const usuarioRouter = Router();

usuarioRouter.get('/me', authMiddleware, usuarioController.obtenerUsuario);
usuarioRouter.patch('/me', authMiddleware, upload.single('imagen'), validarDto(UsuarioUpdateDTO), usuarioController.actualizarUsuario);
usuarioRouter.post('/registrar', authLimiter, validarDto(UsuarioDTO),usuarioController.registrar.bind(usuarioController));
usuarioRouter.post('/login', authLimiter, validarDto(LoginDTO), usuarioController.iniciarSesion.bind(usuarioController));
usuarioRouter.post('/refresh', authLimiter, usuarioController.refrescarSesion.bind(usuarioController));
usuarioRouter.post('/logout', usuarioController.cerrarSesion.bind(usuarioController));
usuarioRouter.post('/login-firebase', authLimiter, firebaseAuthMiddleware, usuarioController.loginConFirebase.bind(usuarioController));


usuarioRouter.post('/direccion', authMiddleware, procesarSubidaImagen('imagen'), validarDto(DireccionDTO), usuarioController.registrarDireccion.bind(usuarioController));