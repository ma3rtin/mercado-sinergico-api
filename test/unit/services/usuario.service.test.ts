jest.mock("canvas", () => ({
  createCanvas: () => ({
    getContext: () => ({
      fillStyle: "",
      fillRect: jest.fn(),
      font: "",
      fillText: jest.fn(),
      measureText: () => ({ width: 10 }),
    }),
    toBuffer: () => Buffer.from("fake"),
  }),
}));
import { UsuarioService } from "../../../src/services/usuario.service";
import { compararContraseñas } from "../../../src/auth/bcrypt";

jest.mock("../../../src/prisma/client", () => {
  const mockUsuarioCreate = jest.fn();
  const mockUsuarioFindUnique = jest.fn();
  const mockUsuarioUpdate = jest.fn();
  const mockTokenCreate = jest.fn();
  const mockTokenFindUnique = jest.fn();
  const mockTokenUpdateMany = jest.fn();
  const mockRolFindUnique = jest.fn();
  const mockTransaction = jest.fn();

  return {
    prisma: {
      usuario: {
        create: mockUsuarioCreate,
        findUnique: mockUsuarioFindUnique,
        update: mockUsuarioUpdate,
      },
      tokenVerificacionEmail: {
        create: mockTokenCreate,
        findUnique: mockTokenFindUnique,
        updateMany: mockTokenUpdateMany,
      },
      rol: {
        findUnique: mockRolFindUnique,
      },
      $transaction: mockTransaction,
    },
    __mocks: {
      mockUsuarioCreate,
      mockUsuarioFindUnique,
      mockUsuarioUpdate,
      mockTokenCreate,
      mockTokenFindUnique,
      mockTokenUpdateMany,
      mockRolFindUnique,
      mockTransaction,
    },
  };
});

jest.mock("../../../src/auth/jwt", () => ({
  crearToken: jest.fn().mockResolvedValue("fakeToken123"),
  decodificarToken: jest.fn(),
}));

jest.mock("../../../src/auth/bcrypt", () => ({
  cifrarContraseña: jest.fn().mockResolvedValue("hashedPassword"),
  compararContraseñas: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../../src/services/imagen.service", () => ({
  ImagenService: jest.fn().mockImplementation(() => ({
    uploadToCloudinary: jest.fn().mockResolvedValue("https://cloudinary.com/avatar.jpg"),
  })),
}));

jest.mock("../../../src/services/email.service", () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    enviarEmail: jest.fn().mockResolvedValue(true),
  })),
}));

describe("UsuarioService", () => {
  let service: UsuarioService;
  let mocks: ReturnType<typeof require>["__mocks"];

  beforeEach(() => {
    service = new UsuarioService();
    jest.clearAllMocks();

    mocks = require("../../../src/prisma/client").__mocks;

    mocks.mockUsuarioCreate.mockResolvedValue({
      id: 1,
      email: "test@example.com",
      nombre: "Test User",
      telefono: "1234567890",
    });
    mocks.mockUsuarioFindUnique.mockResolvedValue(null);
    mocks.mockUsuarioUpdate.mockResolvedValue({
      id: 1,
      email: "test@example.com",
      nombre: "Test User",
      telefono: "1234567890",
    });
    mocks.mockRolFindUnique.mockResolvedValue({ id: 1, nombre: "Usuario" });
    mocks.mockTransaction.mockImplementation(async (cb: any) => cb({
      tokenVerificacionEmail: {
        create: mocks.mockTokenCreate,
        updateMany: mocks.mockTokenUpdateMany,
      },
      usuario: { update: mocks.mockUsuarioUpdate },
    }));
  });

  it("debería iniciar sesión con credenciales correctas", async () => {
    mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      contraseña: "hashedPassword",
      nombre: "Test User",
      telefono: "1234567890",
      rol: { nombre: "Usuario" },
      emailVerificadoEn: new Date(),
    });

    const result = await service.iniciarSesion({
      email: "test@example.com",
      contraseña: "Password123",
    });

    expect(typeof result).toBe("string");
    expect(result).toBe("fakeToken123");
  });

  it("debería devolver null al iniciar sesión con credenciales incorrectas", async () => {
    const result = await service.iniciarSesion({
      email: "fail@example.com",
      contraseña: "wrongpass",
    });
    expect(result).toBeNull();
  });

  it("debería bloquear el inicio de sesión si el email no está verificado", async () => {
    mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      contraseña: "hashedPassword",
      rol: { nombre: "Usuario" },
      emailVerificadoEn: null,
    });

    await expect(service.iniciarSesion({
      email: "test@example.com",
      contraseña: "Password123",
    })).rejects.toMatchObject({ status: 403, code: "EMAIL_NO_VERIFICADO" });
  });

  it("debería verificar un token válido una única vez", async () => {
    mocks.mockTokenFindUnique.mockResolvedValueOnce({
      id: 9,
      usuarioId: 1,
      usadoEn: null,
      expiraEn: new Date(Date.now() + 60_000),
    });
    mocks.mockTokenUpdateMany.mockResolvedValue({ count: 1 });

    await service.verificarEmail("token-valido");

    expect(mocks.mockUsuarioUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 1 },
      data: expect.objectContaining({ emailVerificadoEn: expect.any(Date) }),
    }));
    expect(mocks.mockTokenUpdateMany).toHaveBeenCalled();
  });

  it("debería rechazar un token vencido", async () => {
    mocks.mockTokenFindUnique.mockResolvedValueOnce({
      id: 9,
      usuarioId: 1,
      usadoEn: null,
      expiraEn: new Date(Date.now() - 60_000),
    });

    await expect(service.verificarEmail("token-vencido"))
      .rejects.toMatchObject({ status: 400, code: "TOKEN_VERIFICACION_INVALIDO" });
  });

  it("debería lanzar un error al registrar un usuario con un email ya existente", async () => {
    mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
    });

    await expect(
      service.registrar({
        email: "test@example.com",
        contraseña: "Password123",
        nombre: "Test User",
        telefono: "1234567890",
        fecha_nac: "2000-01-01",
      })
    ).rejects.toThrow("El email ya se encuentra registrado");

    expect(mocks.mockUsuarioCreate).not.toHaveBeenCalled();
  });

  it("no debería fallar el registro si el envío del email de verificación falla", async () => {
    (service as any).emailService.enviarEmail.mockResolvedValueOnce(false);

    const resultado = await service.registrar({
      email: "nuevo@example.com",
      contraseña: "Password123",
      nombre: "Nuevo Usuario",
      telefono: "1234567890",
      fecha_nac: "2000-01-01",
    });

    expect(resultado).toHaveProperty("id");
    expect(mocks.mockUsuarioCreate).toHaveBeenCalled();
  });

  it("debería buscar un usuario por email", async () => {
    mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      contraseña: "hashedPassword",
      nombre: "Test User",
      telefono: "1234567890",
      rol: { nombre: "Usuario" },
    });

    const result = await service.buscarPorEmail("test@example.com");
    expect(result).toHaveProperty("id");
    expect(result?.email).toBe("test@example.com");
    expect(result?.rol.nombre).toBe("Usuario");
  });

  it("debería buscar un usuario por id", async () => {
    mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      contraseña: "hashedPassword",
      nombre: "Test User",
      telefono: "1234567890",
      rol: { nombre: "Usuario" },
    });

    const result = await service.obtenerUsuario(1);
    expect(result).toHaveProperty("id");
    expect(result?.email).toBe("test@example.com");
  });

  it("debería actualizar un usuario", async () => {
    mocks.mockUsuarioUpdate.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      contraseña: "hashedPassword",
      nombre: "Test User",
      telefono: "1234567890",
    });

    const result = await service.actualizarUsuario(1, {
      email: "test@example.com",
    });
    expect(result).toHaveProperty("id");
    expect(result.email).toBe("test@example.com");
  });

  describe("actualizarUsuario - cambio de email", () => {
    it("debería rechazar el cambio de email sin la contraseña actual", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 1,
        email: "viejo@example.com",
        contraseña: "hashedPassword",
      });

      await expect(
        service.actualizarUsuario(1, { email: "nuevo@example.com" })
      ).rejects.toMatchObject({ status: 400 });

      expect(mocks.mockUsuarioUpdate).not.toHaveBeenCalled();
    });

    it("debería rechazar el cambio de email con la contraseña actual incorrecta", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 1,
        email: "viejo@example.com",
        contraseña: "hashedPassword",
      });
      (compararContraseñas as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.actualizarUsuario(1, {
          email: "nuevo@example.com",
          contraseñaActual: "incorrecta",
        } as any)
      ).rejects.toMatchObject({ status: 403 });

      expect(mocks.mockUsuarioUpdate).not.toHaveBeenCalled();
    });

    it("debería resetear emailVerificadoEn y reenviar la verificación al cambiar el email con la contraseña correcta", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 1,
        email: "viejo@example.com",
        contraseña: "hashedPassword",
      });
      mocks.mockUsuarioUpdate.mockResolvedValueOnce({
        id: 1,
        email: "nuevo@example.com",
        nombre: "Test User",
      });

      await service.actualizarUsuario(1, {
        email: "nuevo@example.com",
        contraseñaActual: "Password123",
      } as any);

      expect(mocks.mockUsuarioUpdate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ emailVerificadoEn: null }),
      }));
      expect(mocks.mockTransaction).toHaveBeenCalled();
    });

    it("debería rechazar el cambio de email en cuentas sin contraseña propia (Firebase)", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 4,
        email: "viejo@example.com",
        contraseña: "",
      });

      await expect(
        service.actualizarUsuario(4, { email: "nuevo@example.com" })
      ).rejects.toMatchObject({ status: 400 });

      expect(mocks.mockUsuarioUpdate).not.toHaveBeenCalled();
    });

    it("no debería tocar emailVerificadoEn si el email no cambia", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 1,
        email: "test@example.com",
        contraseña: "hashedPassword",
      });
      mocks.mockUsuarioUpdate.mockResolvedValueOnce({
        id: 1,
        email: "test@example.com",
        nombre: "Test User Editado",
      });

      await service.actualizarUsuario(1, {
        email: "test@example.com",
        nombre: "Test User Editado",
      });

      expect(mocks.mockUsuarioUpdate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ emailVerificadoEn: undefined }),
      }));
    });
  });

  describe("reenviarVerificacionEmail", () => {
    it("no debería hacer nada si el usuario no existe para no filtrar emails", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce(null);

      await expect(service.reenviarVerificacionEmail("noexiste@example.com")).resolves.toBeUndefined();
      expect(mocks.mockTransaction).not.toHaveBeenCalled();
    });

    it("no debería reenviar si el usuario ya tiene su email verificado", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 2,
        email: "verificado@example.com",
        nombre: "Usuario Verificado",
        emailVerificadoEn: new Date(),
      });

      await expect(service.reenviarVerificacionEmail("verificado@example.com")).resolves.toBeUndefined();
      expect(mocks.mockTransaction).not.toHaveBeenCalled();
    });

    it("debería invalidar tokens previos, crear uno nuevo y enviar el correo si está pendiente", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 3,
        email: "pendiente@example.com",
        nombre: "Usuario Pendiente",
        emailVerificadoEn: null,
      });

      await service.reenviarVerificacionEmail("pendiente@example.com");

      expect(mocks.mockTransaction).toHaveBeenCalled();
      expect(mocks.mockTokenUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { usuarioId: 3, usadoEn: null },
      }));
      expect(mocks.mockTokenCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ usuarioId: 3 }),
      }));
    });
  });

  describe("loginConFirebase", () => {
    it("debería rechazar el acceso si Firebase indica que el email no está verificado", async () => {
      await expect(
        service.loginConFirebase({
          uid: "firebase-123",
          email: "google@example.com",
          name: "Google User",
          emailVerified: false,
        })
      ).rejects.toMatchObject({ status: 403, code: "EMAIL_NO_VERIFICADO" });
    });

    it("debería crear un usuario nuevo marcado como verificado si el email de Firebase está verificado", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce(null); // buscarPorEmail
      mocks.mockUsuarioCreate.mockResolvedValueOnce({
        id: 10,
        email: "nuevo-google@example.com",
        nombre: "Google User",
        emailVerificadoEn: new Date(),
        rol: { nombre: "Usuario" },
      });

      const usuario = await service.loginConFirebase({
        uid: "firebase-456",
        email: "nuevo-google@example.com",
        name: "Google User",
        emailVerified: true,
      });

      expect(usuario).toHaveProperty("id", 10);
      expect(mocks.mockUsuarioCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          email: "nuevo-google@example.com",
          emailVerificadoEn: expect.any(Date),
        }),
      }));
    });

    it("debería activar una cuenta local existente no verificada cuando ingresa con Google verificado", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 11,
        email: "local@example.com",
        nombre: "Local User",
        emailVerificadoEn: null,
        rol: { nombre: "Usuario" },
      });
      mocks.mockUsuarioUpdate.mockResolvedValueOnce({
        id: 11,
        email: "local@example.com",
        nombre: "Local User",
        emailVerificadoEn: new Date(),
        rol: { nombre: "Usuario" },
      });

      const usuario = await service.loginConFirebase({
        uid: "firebase-789",
        email: "local@example.com",
        name: "Local User",
        emailVerified: true,
      });

      expect(usuario.id).toBe(11);
      expect(mocks.mockUsuarioUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 11 },
        data: expect.objectContaining({
          emailVerificadoEn: expect.any(Date),
        }),
      }));
    });
  });
});
