import { prisma } from '../prisma/client.js';
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { UsuarioService } from '../services/usuario.service.js';
import { UsuarioDTO } from '../dtos/usuario/usuario.dto.js';
import { DatosEncriptados } from '../auth/jwt.js';
import { ImagenService } from './../services/imagen.service.js';
import { FirebaseAuthenticatedRequest, FirebaseUser } from '../middlewares/firebaseAuth.middleware.js';

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
    const tokens = await this.usuarioService.iniciarSesion(req.body);

    if (!tokens) {
      // 🚨 AUDITORÍA DE SEGURIDAD: Falla de login
      await prisma.securityAudit.create({
        data: { evento: 'LOGIN_FALLIDO', email: req.body.email, ip: req.ip }
      });
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    // 🍪 Secure Cookie para Refresh Token (Elite Config)
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      path: '/api/usuarios', // Restringido solo a rutas de usuario (refresh/logout)
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    return res.status(200).json({ success: true, token: tokens.token }); 
  });

  // 🔄 Refresh Token
  public refrescarSesion = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      // 🚨 ALERTA: Intento de refresh sin cookie (posible robo de sesión o CSRF fallido)
      await prisma.securityAudit.create({
        data: { evento: 'REFRESH_MISSING_COOKIE', ip: req.ip }
      });
      return res.status(400).json({ success: false, message: 'Refresh token cookie missing' });
    }

    try {
      const tokens = await this.usuarioService.refrescarSesion(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/usuarios',
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });

      return res.status(200).json({ success: true, token: tokens.token });
    } catch (error) {
      // 🚨 ALERTA CRÍTICA: Fallo en rotación (posible reúso detectado en el service)
      const errMessage = (error as Error).message;
      await prisma.securityAudit.create({
        data: { evento: 'REFRESH_TOKEN_ALERT', ip: req.ip, detalles: errMessage }
      });
      return res.status(401).json({ success: false, message: errMessage });
    }
  });


  // 🚪 Logout
  public cerrarSesion = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
      await this.usuarioService.logout(refreshToken);
    }
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
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

    const tokens = await this.usuarioService.crearTokenPersonalizado(usuario);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.status(200).json({
      success: true,
      token: tokens.token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });

  });
}
