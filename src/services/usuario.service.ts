import { cifrarContraseña, compararContraseñas } from '../auth/bcrypt.js';
import { crearToken } from '../auth/jwt.js';
import { DireccionDTO } from '../dtos/direccion/direccion.dto.js';
import { LoginDTO } from '../dtos/usuario/login.dto.js';
import { UsuarioDTO } from '../dtos/usuario/usuario.dto.js';
import { UsuarioUpdateDTO } from '../dtos/usuario/usuarioUpdate.dto.js';
import type { Direccion, Prisma, Usuario, Localidad, Zona } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

export type UsuarioMapeado = Usuario & {
  rol: { nombre: string } | null;
  localidad: (Localidad & { zonas: Zona[] }) | null;
  direccion: (Direccion & { localidad: (Localidad & { zonas: Zona[] }) | null }) | null;
};
import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { FirebaseUser } from '../middlewares/firebaseAuth.middleware.js';
import { ImagenService } from '../services/imagen.service.js';
import { generarAvatar } from '../utils/avatar.js';
import { EmailService } from './email.service.js';
import { envs } from '../config/envs.js';

export class UsuarioService {
  private prismaClient = prisma;
  private imagenService = new ImagenService();
  private emailService = new EmailService();

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async crearYEnviarTokenVerificacion(usuario: Pick<Usuario, 'id' | 'email' | 'nombre'>): Promise<void> {
    const tokenPlano = randomBytes(32).toString('base64url');
    const ahora = new Date();
    const expiraEn = new Date(
      ahora.getTime() + envs.EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000
    );

    await this.prismaClient.$transaction(async (tx) => {
      await tx.tokenVerificacionEmail.updateMany({
        where: { usuarioId: usuario.id, usadoEn: null },
        data: { usadoEn: ahora },
      });

      await tx.tokenVerificacionEmail.create({
        data: {
          usuarioId: usuario.id,
          tokenHash: this.hashToken(tokenPlano),
          expiraEn,
        },
      });
    });

    const enlaceActivacion = new URL('/verificar-email', envs.FRONTEND_URL);
    enlaceActivacion.searchParams.set('token', tokenPlano);

    const enviado = await this.emailService.enviarEmail({
      para: usuario.email,
      asunto: 'Activá tu cuenta en Mercado Sinérgico',
      template: 'verificacion-email',
      context: {
        nombreUsuario: usuario.nombre,
        enlaceActivacion: enlaceActivacion.toString(),
        vencimientoHoras: Math.ceil(envs.EMAIL_VERIFICATION_TTL_MINUTES / 60),
      },
    });

    if (!enviado) {
      throw new CustomError(
        'No pudimos enviar el email de activación. Intentá reenviarlo nuevamente.',
        503,
        undefined,
        'EMAIL_VERIFICACION_NO_ENVIADO'
      );
    }
  }

  public async registrar(usuario: UsuarioDTO): Promise<Usuario> {
    const { email, contraseña, nombre, telefono, fecha_nac } = usuario;

    const usuarioExistente = await this.buscarPorEmail(email);
    if (usuarioExistente) {
      throw new CustomError('El email ya se encuentra registrado', 400);
    }

    const contraseñaHash = await cifrarContraseña(contraseña);

    // Generar imagen si no se proporciona
    let imagen_url = usuario.imagen_url;
    if (!imagen_url) {
      const apellido = usuario.nombre.split(' ')[1] || '';
      const avatarBuffer = generarAvatar(nombre, apellido);
      imagen_url = await this.imagenService.uploadToCloudinary(avatarBuffer);
    }

    const usuarioCreado = await this.prismaClient.usuario.create({
      data: {
        email,
        nombre,
        contraseña: contraseñaHash,
        telefono,
        fecha_nac: fecha_nac ? new Date(fecha_nac) : null,
        imagen_url,
        rol: { connect: { nombre: 'Usuario' } },
      },
    });

    try {
      await this.crearYEnviarTokenVerificacion(usuarioCreado);
    } catch (error) {
      // No abortamos el registro si falla el envío: la cuenta ya existe y el
      // usuario puede pedir un reenvío desde el login.
      console.error('No se pudo enviar el email de activación al registrarse:', error);
    }

    return usuarioCreado;
  }

  public async iniciarSesion(credenciales: LoginDTO): Promise<string | null> {
    const { email, contraseña } = credenciales;

    const usuario = (await this.buscarPorEmail(email)) as Usuario & {
      rol: { nombre: string };
    };

    if (!usuario) return null;

    const contraseñaCorrecta = await compararContraseñas(
      contraseña,
      usuario.contraseña
    );
    if (!contraseñaCorrecta) return null;

    if (!usuario.emailVerificadoEn) {
      throw new CustomError(
        'Confirmá tu correo electrónico antes de iniciar sesión',
        403,
        undefined,
        'EMAIL_NO_VERIFICADO'
      );
    }

    return await crearToken({
      email: usuario.email,
      id: usuario.id,
      rol: usuario.rol?.nombre,
    });
  }

  public async registrarDireccion(
    userId: number,
    direccion: DireccionDTO
  ): Promise<Direccion> {
    return await this.prismaClient.$transaction(async (tx: Prisma.TransactionClient) => {
      const localidad = await tx.localidad.findUnique({
        where: { id_localidad: direccion.localidad_id },
      });
      if (!localidad) {
        throw new CustomError(
          'Localidad no encontrada en la base de datos',
          404
        );
      }

      const resultado = await tx.direccion.create({
        data: {
          usuarioId: userId,
          localidadId: direccion.localidad_id,
          codigo_postal: direccion.codigo_postal,
          calle: direccion.calle,
          numero: direccion.numero,
          piso: direccion.piso,
          departamento: direccion.departamento,
          observaciones: direccion.observaciones,
        },
      });

      return resultado;
    });
  }

  public async buscarPorEmail(
    email: string
  ): Promise<(Usuario & { rol: { nombre: string } }) | null> {
    return await this.prismaClient.usuario.findUnique({
      where: { email },
      include: { rol: { select: { nombre: true } } },
    });
  }

  public async obtenerUsuario(userId: number): Promise<UsuarioMapeado | null> {
    const user = await this.prismaClient.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: { select: { nombre: true } },
        localidad: {
          include: {
            zonas: {
              include: { zona: true }
            }
          }
        },
        direccion: {
          include: {
            localidad: {
              include: {
                zonas: {
                  include: { zona: true }
                }
              }
            }
          },
        },
      },
    });

    if (!user) return null;

    const mapLocalidad = (loc: (Localidad & { zonas: { zona: Zona }[] }) | null) => {
      if (!loc) return null;
      return {
        ...loc,
        zonas: loc.zonas ? loc.zonas.map((lz: { zona: Zona }) => lz.zona) : [],
      };
    };

    return {
      ...user,
      localidad: mapLocalidad(user.localidad),
      direccion: user.direccion ? {
        ...user.direccion,
        localidad: mapLocalidad(user.direccion.localidad),
      } : null,
    };
  }

  public async actualizarUsuario(
    userId: number,
    datos: Partial<UsuarioDTO>
  ): Promise<Usuario> {
    const { email, nombre, telefono, fecha_nac, contraseña, imagen_url, localidad_id, calle, numero, piso, dpto, cp, observaciones, contraseñaActual } = datos as UsuarioUpdateDTO;

    let contraseñaHash: string | undefined = undefined;
    if (contraseña) {
      contraseñaHash = await cifrarContraseña(contraseña);
    }

    let emailCambiando = false;
    if (email) {
      const usuarioActual = await this.prismaClient.usuario.findUnique({
        where: { id: userId },
        select: { email: true, contraseña: true },
      });

      if (usuarioActual && email !== usuarioActual.email) {
        // Si la cuenta tiene contraseña propia (no es sólo Firebase), confirmamos
        // identidad antes de mover el email: una sesión robada no alcanza para
        // redirigir la cuenta a un correo ajeno.
        if (usuarioActual.contraseña) {
          if (!contraseñaActual) {
            throw new CustomError('Ingresá tu contraseña actual para cambiar el email', 400);
          }
          const contraseñaCorrecta = await compararContraseñas(contraseñaActual, usuarioActual.contraseña);
          if (!contraseñaCorrecta) {
            throw new CustomError('La contraseña actual es incorrecta', 403);
          }
        }
        emailCambiando = true;
      }
    }

    const localidadIdNum = localidad_id ? Number(localidad_id) : undefined;
    const numeroNum = numero ? Number(numero) : undefined;
    const pisoNum = piso ? Number(piso) : undefined;
    const cpNum = cp ? Number(cp) : undefined;

    const usuario = await this.prismaClient.usuario.update({
      where: { id: userId },
      data: {
        email: email ?? undefined,
        nombre: nombre ?? undefined,
        telefono: telefono ?? undefined,
        fecha_nac: fecha_nac ? new Date(fecha_nac) : undefined,
        contraseña: contraseñaHash ?? undefined,
        imagen_url: imagen_url ?? undefined,
        localidadId: localidadIdNum ?? undefined,
        emailVerificadoEn: emailCambiando ? null : undefined,
      },
    });

    if (emailCambiando) {
      try {
        await this.crearYEnviarTokenVerificacion(usuario);
      } catch (error) {
        console.error('No se pudo enviar el email de activación tras cambiar el email:', error);
      }
    }

    const hayDatosDeDireccion  = localidadIdNum || calle || numeroNum || pisoNum || dpto || cpNum || observaciones;
    if (hayDatosDeDireccion  && localidadIdNum) {
      await this.prismaClient.direccion.upsert({
        where: { usuarioId: userId },
        update: {
          localidadId: localidadIdNum,
          calle: calle ?? undefined,
          numero: numeroNum ?? undefined,
          piso: pisoNum ?? undefined,
          departamento: dpto ?? undefined,
          codigo_postal: cpNum ?? undefined,
          observaciones: observaciones ?? undefined,
        },
        create: {
          usuarioId: userId,
          localidadId: localidadIdNum,
          calle: calle ?? '',
          numero: numeroNum ?? 0,
          piso: pisoNum ?? undefined,
          departamento: dpto ?? undefined,
          codigo_postal: cpNum ?? 0,
          observaciones: observaciones ?? undefined,
        },
      });
    }

    return (await this.obtenerUsuario(userId)) ?? usuario;
  }

  public async verificarEmail(tokenPlano: string): Promise<void> {
    const ahora = new Date();
    const token = await this.prismaClient.tokenVerificacionEmail.findUnique({
      where: { tokenHash: this.hashToken(tokenPlano) },
      select: { id: true, usuarioId: true, usadoEn: true, expiraEn: true },
    });

    if (!token || token.usadoEn || token.expiraEn <= ahora) {
      throw new CustomError(
        'El enlace de activación es inválido o venció',
        400,
        undefined,
        'TOKEN_VERIFICACION_INVALIDO'
      );
    }

    await this.prismaClient.$transaction(async (tx) => {
      const tokenActualizado = await tx.tokenVerificacionEmail.updateMany({
        where: { id: token.id, usadoEn: null, expiraEn: { gt: ahora } },
        data: { usadoEn: ahora },
      });

      if (tokenActualizado.count === 0) {
        throw new CustomError(
          'El enlace de activación es inválido o venció',
          400,
          undefined,
          'TOKEN_VERIFICACION_INVALIDO'
        );
      }

      await tx.usuario.update({
        where: { id: token.usuarioId },
        data: { emailVerificadoEn: ahora },
      });

      await tx.tokenVerificacionEmail.updateMany({
        where: { usuarioId: token.usuarioId, usadoEn: null },
        data: { usadoEn: ahora },
      });
    });
  }

  public async reenviarVerificacionEmail(email: string): Promise<void> {
    const usuario = await this.prismaClient.usuario.findUnique({
      where: { email },
      select: { id: true, email: true, nombre: true, emailVerificadoEn: true },
    });

    if (!usuario || usuario.emailVerificadoEn) {
      return;
    }

    await this.crearYEnviarTokenVerificacion(usuario);
  }

  public async loginConFirebase(
    firebaseUser: FirebaseUser
  ): Promise<Usuario & { rol: { nombre: string } }> {
    const { email, name, picture, emailVerified } = firebaseUser;

    if (!email) {
      throw new CustomError(
        'Email no disponible en la información de Firebase',
        400
      );
    }

    if (!emailVerified) {
      throw new CustomError(
        'Google no confirmó este correo electrónico',
        403,
        undefined,
        'EMAIL_NO_VERIFICADO'
      );
    }

    let usuario = await this.buscarPorEmail(email);

    if (!usuario) {
      // Subir imagen de Firebase o generar avatar por defecto
      let imagen_url: string;
      if (picture) {
        // Subir imagen de Google a Cloudinary
        const axios = await import('axios');
        const response = await axios.default.get(picture, {
          responseType: 'arraybuffer',
        });
        const buffer = Buffer.from(response.data, 'binary');
        imagen_url = await this.imagenService.uploadToCloudinary(buffer);
      } else {
        // Generar avatar con iniciales
        const [nombre, apellido = ''] = (name ?? 'Usuario Firebase').split(' ');
        const avatarBuffer = generarAvatar(nombre, apellido);
        imagen_url = await this.imagenService.uploadToCloudinary(avatarBuffer);
      }

      usuario = await this.prismaClient.usuario.create({
        data: {
          email,
          nombre: name || 'Usuario Firebase',
          contraseña: '', // No se usa para Firebase
          telefono: '',
          fecha_nac: null,
          imagen_url,
          emailVerificadoEn: new Date(),
          rol: { connect: { nombre: 'Usuario' } },
        },
        include: { rol: { select: { nombre: true } } },
      });
    } else if (!usuario.emailVerificadoEn) {
      usuario = await this.prismaClient.usuario.update({
        where: { id: usuario.id },
        data: { emailVerificadoEn: new Date() },
        include: { rol: { select: { nombre: true } } },
      });
    }

    return usuario;
  }

  public async crearTokenPersonalizado(
    usuario: Usuario & { rol: { nombre: string } }
  ): Promise<string> {
    return await crearToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol?.nombre || 'Usuario',
    });
  }
}
