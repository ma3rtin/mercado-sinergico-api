import { Router } from 'express';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioController } from '../../controllers/usuario.controller';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { UsuarioDTO } from '../../dtos/usuario/usuario.dto';
import { LoginDTO } from '../../dtos/login.dto';
import { DireccionDTO } from '../../dtos/direccion.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { firebaseAuthMiddleware } from '../../middlewares/firebaseAuth.middleware';
import { UsuarioUpdateDTO } from '../../dtos/usuario/usuarioUpdate.dto';
import { procesarSubidaImagen } from './../../middlewares/uploadFiles.middleware';
import { ImagenService } from '../../services/imagen.service';
import multer from 'multer';

const upload = multer();
const usuarioService = new UsuarioService();
const imagenService = new ImagenService();
const usuarioController = new UsuarioController(usuarioService, imagenService);
export const usuarioRouter = Router();

usuarioRouter.get('/me', authMiddleware, usuarioController.obtenerUsuario);
usuarioRouter.patch('/me', authMiddleware, upload.single('imagen'), validarDto(UsuarioUpdateDTO), usuarioController.actualizarUsuario);
usuarioRouter.post('/registrar', validarDto(UsuarioDTO),usuarioController.registrar.bind(usuarioController));
usuarioRouter.post('/login', validarDto(LoginDTO), usuarioController.iniciarSesion.bind(usuarioController));
usuarioRouter.post('/login-firebase', firebaseAuthMiddleware, usuarioController.loginConFirebase.bind(usuarioController));
usuarioRouter.post('/direccion', authMiddleware, procesarSubidaImagen('imagen'), validarDto(DireccionDTO), usuarioController.registrarDireccion.bind(usuarioController));