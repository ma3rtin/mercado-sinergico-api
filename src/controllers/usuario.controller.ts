import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { UsuarioDTO } from '../dtos/usuario/usuario.dto';
import { LoginDTO } from '../dtos/login.dto';
import { DatosEncriptados } from '../auth/jwt';
import { ImagenService } from './../services/imagen.service';
import { FirebaseAuthenticatedRequest, FirebaseUser } from '../middlewares/firebaseAuth.middleware';

export class UsuarioController {
  constructor(private usuarioService: UsuarioService, private imagenService: ImagenService) { }

  public registrar = async (
    req: Request,
    res: Response
  ) => {
    try {
      const usuario: UsuarioDTO = req.body;
      const resultado = await this.usuarioService.registrar(usuario);
      res.status(201).json(resultado);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  };

  public registrarDireccion = async (
    req: Request,
    res: Response
  ) => {
    try {
      const direccion = req.body;
      const imagen = req.file as Express.Multer.File;

      if (imagen) {
        const url = await this.imagenService.uploadToCloudinary(
          imagen.buffer
        );
        direccion.imagen_url = url;
      }
      const user = (req as Request & { user?: DatosEncriptados }).user;
      if (!user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }
      const resultado = await this.usuarioService.registrarDireccion(
        user.id,
        direccion
      );
      res.status(201).json(resultado);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  };

  public iniciarSesion = async (
    req: Request,
    res: Response
  ) => {
    try {
      const credenciales: LoginDTO = req.body;
      const token = await this.usuarioService.iniciarSesion(credenciales);
      if (!token) {
        return res.status(401).json({ message: 'Credenciales incorrectas' });
      }
      return res.status(200).json({ token });
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  };

  public obtenerUsuario = async (
    req: Request,
    res: Response
  ) => {
    try {
      const user = (req as Request & { user?: DatosEncriptados }).user;
      if (!user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const usuario = await this.usuarioService.obtenerUsuario(user.id);
      res.status(200).json(usuario);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  };

  public actualizarUsuario = async (
    req: Request,
    res: Response
  ) => {
    try {
      const user = (req as Request & { user?: DatosEncriptados }).user;
      if (!user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const usuario: UsuarioDTO = req.body;
      const resultado = await this.usuarioService.actualizarUsuario(user.id, usuario);
      res.status(200).json(resultado);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  };

  public loginConFirebase = async (
    req: Request,
    res: Response
  ) => {
    try {
      const firebaseUser: FirebaseUser = (req as FirebaseAuthenticatedRequest).firebaseUser!;
      
      // Buscar o crear usuario en la base de datos
      const usuario = await this.usuarioService.loginConFirebase(firebaseUser);
      
      // Crear token JWT personalizado para el usuario
      const token = await this.usuarioService.crearTokenPersonalizado(usuario);
      
      res.status(200).json({
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol
        }
      });
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  };
}