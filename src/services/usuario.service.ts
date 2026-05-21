import { cifrarContraseña, compararContraseñas } from '../auth/bcrypt.js';
import { crearToken } from '../auth/jwt.js';
import { DireccionDTO } from '../dtos/direccion/direccion.dto.js';
import { LoginDTO } from '../dtos/usuario/login.dto.js';
import { UsuarioDTO } from '../dtos/usuario/usuario.dto.js';
import { UsuarioUpdateDTO } from '../dtos/usuario/usuarioUpdate.dto.js';
import type { Direccion, Prisma, Usuario } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { CustomError } from '../errors/custom.error.js';
import { FirebaseUser } from '../middlewares/firebaseAuth.middleware.js';
import { ImagenService } from '../services/imagen.service.js';
import { generarAvatar } from '../utils/avatar.js';

export class UsuarioService {
  private prismaClient = prisma;
  private imagenService = new ImagenService();
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

    return await this.prismaClient.usuario.create({
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

  public async obtenerUsuario(userId: number): Promise<any | null> {
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

    const mapLocalidad = (loc: any) => {
      if (!loc) return null;
      return {
        ...loc,
        zonas: loc.zonas ? loc.zonas.map((lz: any) => lz.zona) : [],
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
    const { email, nombre, telefono, fecha_nac, contraseña, imagen_url, localidad_id, calle, numero, piso, dpto, cp } = datos as UsuarioUpdateDTO;

    let contraseñaHash: string | undefined = undefined;
    if (contraseña) {
      contraseñaHash = await cifrarContraseña(contraseña);
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
      },
    });

    const hayDatosDeDireccion  = localidadIdNum || calle || numeroNum || pisoNum || dpto || cpNum;
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
        },
        create: {
          usuarioId: userId,
          localidadId: localidadIdNum,
          calle: calle ?? '',
          numero: numeroNum ?? 0,
          piso: pisoNum ?? undefined,
          departamento: dpto ?? undefined,
          codigo_postal: cpNum ?? 0,
        },
      });
    }

    return (await this.obtenerUsuario(userId)) ?? usuario;
  }

  public async loginConFirebase(
    firebaseUser: FirebaseUser
  ): Promise<Usuario & { rol: { nombre: string } }> {
    const { email, name, picture } = firebaseUser;

    if (!email) {
      throw new CustomError(
        'Email no disponible en la información de Firebase',
        400
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
          rol: { connect: { nombre: 'Usuario' } },
        },
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
