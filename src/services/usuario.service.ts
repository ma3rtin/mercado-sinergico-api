import { cifrarContraseña, compararContraseñas } from "../auth/bcrypt";
import { crearToken } from "../auth/jwt";
import { DireccionDTO } from "../dtos/direccion.dto";
import { LoginDTO } from "../dtos/login.dto";
import { UsuarioDTO } from "../dtos/usuario/usuario.dto";
import { Direccion, PrismaClient, Usuario } from "../generated/prisma";
import { CustomError } from "../errors/custom.error";
import { UsuarioUpdateDTO } from "../dtos/usuario/usuarioUpdate.dto";
import { FirebaseUser } from "../middlewares/firebaseAuth.middleware";
import { ImagenService } from "../services/imagen.service";
import { generarAvatar } from "../utils/avatar";

export class UsuarioService {
  private prismaClient = new PrismaClient();
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
      const apellido = (usuario as any).apellido ?? "";
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
        rol: { connect: { nombre: "Usuario" } },
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
    return await this.prismaClient.$transaction(async (tx) => {
      const localidad = await tx.localidad.findUnique({
        where: { id_localidad: direccion.localidad_id },
      });
      if (!localidad) {
        throw new CustomError('Localidad no encontrada en la base de datos', 404);
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

  public async obtenerUsuario(userId: number): Promise<any> {
    return await this.prismaClient.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: { select: { nombre: true } },
        direccion: {
          include: { localidad: true },
        },
      },
    });
  }

  public async actualizarUsuario(
    userId: number,
    datos: Partial<UsuarioDTO>
  ): Promise<Usuario> {
    const { email, nombre, telefono, fecha_nac, contraseña } = datos;

    let contraseñaHash: string | undefined = undefined;
    if (contraseña) {
      contraseñaHash = await cifrarContraseña(contraseña);
    }

    return await this.prismaClient.usuario.update({
      where: { id: userId },
      data: {
        email: email ?? undefined,
        nombre: nombre ?? undefined,
        telefono: telefono ?? undefined,
        fecha_nac: fecha_nac ? new Date(fecha_nac) : undefined,
        contraseña: contraseñaHash ?? undefined,
      },
    });
  }

  public async loginConFirebase(firebaseUser: FirebaseUser): Promise<Usuario & { rol: { nombre: string } }> {
    const { uid, email, name, picture } = firebaseUser;

    if (!email) {
      throw new CustomError('Email no disponible en la información de Firebase', 400);
    }

    let usuario = await this.buscarPorEmail(email);

    if (!usuario) {
      // Subir imagen de Firebase o generar avatar por defecto
      let imagen_url: string;
      if (picture) {
        // Subir imagen de Google a Cloudinary
        const axios = await import("axios");
        const response = await axios.default.get(picture, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");
        imagen_url = await this.imagenService.uploadToCloudinary(buffer);
      } else {
        // Generar avatar con iniciales
        const [nombre, apellido = ""] = (name ?? "Usuario Firebase").split(" ");
        const avatarBuffer = generarAvatar(nombre, apellido);
        imagen_url = await this.imagenService.uploadToCloudinary(avatarBuffer);
      }

      usuario = await this.prismaClient.usuario.create({
        data: {
          email,
          nombre: name || "Usuario Firebase",
          contraseña: "", // No se usa para Firebase
          telefono: "",
          fecha_nac: null,
          imagen_url,
          rol: { connect: { nombre: "Usuario" } },
        },
        include: { rol: { select: { nombre: true } } },
      });
    }

    return usuario;
  }

  public async crearTokenPersonalizado(usuario: Usuario & { rol: { nombre: string } }): Promise<string> {
    return await crearToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol?.nombre || 'Usuario',
    });
  }
}
