import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { UsuarioDTO } from '../dtos/usuario/usuario.dto';
import { LoginDTO } from '../dtos/login.dto';
import { DatosEncriptados } from '../auth/jwt';
import { ImagenService } from './../services/imagen.service';
import { FirebaseAuthenticatedRequest, FirebaseUser } from '../middlewares/firebaseAuth.middleware';

export class UsuarioController {
  constructor(private usuarioService: UsuarioService, private imagenService: ImagenService) { }

  // 🧾 Registro normal
  public registrar = async (req: Request, res: Response) => {
    try {
      const usuario: UsuarioDTO = req.body;
      const resultado = await this.usuarioService.registrar(usuario);
      res.status(201).json(resultado);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Error interno del servidor' });
    }
  };

  // 🏠 Registrar dirección
  public registrarDireccion = async (req: Request, res: Response) => {
    try {
      const direccion = req.body;
      const imagen = req.file as Express.Multer.File;

      if (imagen) {
        const url = await this.imagenService.uploadToCloudinary(imagen.buffer);
        direccion.imagen_url = url;
      }

      const user = (req as Request & { user?: DatosEncriptados }).user;
      if (!user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const resultado = await this.usuarioService.registrarDireccion(user.id, direccion);
      res.status(201).json(resultado);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Error interno del servidor' });
    }
  };

  // 🔐 Login normal
  public iniciarSesion = async (req: Request, res: Response) => {
    try {
      const credenciales: LoginDTO = req.body;
      const token = await this.usuarioService.iniciarSesion(credenciales);
      if (!token) {
        return res.status(401).json({ message: 'Credenciales incorrectas' });
      }
      return res.status(200).json({ token });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Error interno del servidor' });
    }
  };

  // 👤 Obtener perfil
  public obtenerUsuario = async (req: Request, res: Response) => {
    try {
      const user = (req as Request & { user?: DatosEncriptados }).user;
      if (!user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const usuario = await this.usuarioService.obtenerUsuario(user.id);
      res.status(200).json(usuario);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Error interno del servidor' });
    }
  };

  // 🧩 Actualizar perfil (datos o imagen)
  public actualizarUsuario = async (req: Request, res: Response) => {
    try {
      const user = (req as Request & { user?: DatosEncriptados }).user;
      if (!user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const usuario: UsuarioDTO = req.body;
      const file = req.file as Express.Multer.File | undefined;

      // 📸 Si hay imagen, subir a Cloudinary
      if (file) {
        const url = await this.imagenService.uploadToCloudinary(file.buffer, 'mercado_sinergico/perfiles');
        usuario.imagen_url = url;
      }

      const resultado = await this.usuarioService.actualizarUsuario(user.id, usuario);
      res.status(200).json({
        message: file ? 'Perfil e imagen actualizados correctamente' : 'Perfil actualizado correctamente',
        usuario: resultado,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Error interno del servidor' });
    }
  };

  // 🔵 Login con Firebase
  public loginConFirebase = async (req: Request, res: Response) => {
    try {
      const firebaseUser: FirebaseUser = (req as FirebaseAuthenticatedRequest).firebaseUser!;
      const usuario = await this.usuarioService.loginConFirebase(firebaseUser);
      const token = await this.usuarioService.crearTokenPersonalizado(usuario);

      res.status(200).json({
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
        },
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Error interno del servidor' });
    }
  };
}
