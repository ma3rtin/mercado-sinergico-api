import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UsuarioService } from '../services/usuario.service.js';
import { UsuarioDTO } from '../dtos/usuario/usuario.dto.js';
import { LoginDTO } from '../dtos/usuario/login.dto.js';
import { DatosEncriptados } from '../auth/jwt.js';
import { ImagenService } from './../services/imagen.service.js';
import { FirebaseAuthenticatedRequest, FirebaseUser } from '../middlewares/firebaseAuth.middleware.js';
import { VerificarEmailDTO } from '../dtos/usuario/verificarEmail.dto.js';
import { ReenviarVerificacionEmailDTO } from '../dtos/usuario/reenviarVerificacionEmail.dto.js';

export class UsuarioController {
  constructor(private usuarioService: UsuarioService, private imagenService: ImagenService) { }

  // 🧾 Registro normal
  public registrar = asyncHandler(async (req: Request, res: Response) => {
    const usuario: UsuarioDTO = req.body;
    const resultado = await this.usuarioService.registrar(usuario);
    res.status(201).json({
      id: resultado.id,
      message: 'Registro exitoso. Revisá tu correo para activar la cuenta.',
    });
  });

  public verificarEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body as VerificarEmailDTO;
    await this.usuarioService.verificarEmail(token);
    res.status(200).json({ message: 'Tu correo fue verificado correctamente.' });
  });

  public reenviarVerificacionEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as ReenviarVerificacionEmailDTO;
    await this.usuarioService.reenviarVerificacionEmail(email);
    res.status(200).json({
      message: 'Si existe una cuenta pendiente de activación, enviamos un nuevo correo.',
    });
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
