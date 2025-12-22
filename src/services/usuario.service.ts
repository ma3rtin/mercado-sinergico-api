import { cifrarContraseña, compararContraseñas } from '../auth/bcrypt';
import { crearToken } from '../auth/jwt';
import { DireccionDTO } from '../dtos/direccion/direccion.dto';
import { LoginDTO } from '../dtos/usuario/login.dto';
import { UsuarioDTO } from '../dtos/usuario/usuario.dto';
import { UsuarioUpdateDTO } from '../dtos/usuario/usuarioUpdate.dto';
import type { Direccion, Usuario } from '../../prisma/generated/client';
import { CustomError } from '../errors/custom.error';
import { FirebaseUser } from '../middlewares/firebaseAuth.middleware';
import { ImagenService } from '../services/imagen.service';
import { generarAvatar } from '../utils/avatar';

import { IUsuarioRepository, IDireccionRepository } from '../repositories/interfaces/IAuthRepository';

export class UsuarioService {
  constructor(
    private usuarioRepository: IUsuarioRepository,
    private direccionRepository: IDireccionRepository,
    private imagenService: ImagenService = new ImagenService()
  ) { }

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

    return await this.usuarioRepository.create({
      email,
      nombre,
      contraseña: contraseñaHash,
      telefono,
      fecha_nac: fecha_nac ? new Date(fecha_nac) : null,
      imagen_url,
      rol: { connect: { nombre: 'Usuario' } },
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
    return await this.direccionRepository.createForUser(userId, direccion);
  }

  public async buscarPorEmail(
    email: string
  ): Promise<(Usuario & { rol: { nombre: string } }) | null> {
    return await this.usuarioRepository.findByEmailWithRole(email);
  }

  public async obtenerUsuario(userId: number): Promise<any> {
    return await this.usuarioRepository.getByIdWithDetails(userId);
  }

  public async actualizarUsuario(
    userId: number,
    datos: Partial<UsuarioDTO>
  ): Promise<Usuario> {
    const { email, nombre, telefono, fecha_nac, contraseña, imagen_url, localidad_id } = datos as UsuarioUpdateDTO;

    let contraseñaHash: string | undefined = undefined;
    if (contraseña) {
      contraseñaHash = await cifrarContraseña(contraseña);
    }

    return await this.usuarioRepository.update(userId, {
      email: email ?? undefined,
      nombre: nombre ?? undefined,
      telefono: telefono ?? undefined,
      fecha_nac: fecha_nac ? new Date(fecha_nac) : undefined,
      contraseña: contraseñaHash ?? undefined,
      imagen_url: imagen_url ?? undefined,
      localidadId: localidad_id ?? undefined,
    });
  }

  public async loginConFirebase(
    firebaseUser: FirebaseUser
  ): Promise<Usuario & { rol: { nombre: string } }> {
    const { uid, email, name, picture } = firebaseUser;

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

      usuario = await this.usuarioRepository.createWithRole({
        email,
        nombre: name || 'Usuario Firebase',
        contraseña: '', // No se usa para Firebase
        telefono: '',
        fecha_nac: null,
        imagen_url,
        rol: { connect: { nombre: 'Usuario' } },
      }) as Usuario & { rol: { nombre: string } };
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
