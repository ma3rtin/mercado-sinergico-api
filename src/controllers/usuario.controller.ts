import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { UsuarioService } from '../services/usuario.service';
import { UsuarioDTO } from '../dtos/usuario/usuario.dto';
import { LoginDTO } from '../dtos/login.dto';
import { DatosEncriptados } from '../auth/jwt';
import { ImagenService } from './../services/imagen.service';
import { FirebaseAuthenticatedRequest, FirebaseUser } from '../middlewares/firebaseAuth.middleware';

export class UsuarioController {
  constructor(private usuarioService: UsuarioService, private imagenService: ImagenService) { }

  // 🧾 Registro normal
  public registrar = asyncHandler(async (req: Request, res: Response) => {
    const usuario: UsuarioDTO = req.body;
    const resultado = await this.usuarioService.registrar(usuario);
    res.status(201).json(resultado);
  });

  // 🏠 Registrar dirección
  public registrarDireccion = asyncHandler(async (req: Request, res: Response) => {
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
  });

  // 🔐 Login normal
  public iniciarSesion = asyncHandler(async (req: Request, res: Response) => {
    const credenciales: LoginDTO = req.body;
    const token = await this.usuarioService.iniciarSesion(credenciales);

    if (!token) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    return res.status(200).json({ token });
  });

  // 👤 Obtener perfil
  public obtenerUsuario = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user?: DatosEncriptados }).user;
    if (!user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const usuario = await this.usuarioService.obtenerUsuario(user.id);
    res.status(200).json(usuario);
  });

  // 🧩 Actualizar perfil (datos o imagen)
  public actualizarUsuario = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user?: DatosEncriptados }).user;
    if (!user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const usuario: UsuarioDTO = req.body;
    const file = req.file as Express.Multer.File | undefined;

    // 📸 Si hay imagen, subir a Cloudinary
    if (file) {
      const url = await this.imagenService.uploadToCloudinary(
        file.buffer,
        'mercado_sinergico/perfiles'
      );
      usuario.imagen_url = url;
    }

    const resultado = await this.usuarioService.actualizarUsuario(user.id, usuario);

    res.status(200).json({
      message: file
        ? 'Perfil e imagen actualizados correctamente'
        : 'Perfil actualizado correctamente',
      usuario: resultado,
    });
  });

  // 🔵 Login con Firebase
  public loginConFirebase = asyncHandler(async (req: Request, res: Response) => {
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
  });
}
