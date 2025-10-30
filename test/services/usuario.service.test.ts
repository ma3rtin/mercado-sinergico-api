import { UsuarioService } from "../../src/services/usuario.service";

// Mock de Prisma
jest.mock("../../src/generated/prisma", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      usuario: {
        create: jest.fn().mockResolvedValue({
          id: 1,
          email: "test@example.com",
          nombre: "Test User",
          telefono: "1234567890",
        }),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      rol: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, nombre: "Usuario" }),
      },
    })),
  };
});

// Mock de helpers de contraseña
jest.mock("../../src/auth/jwt", () => ({
  crearToken: jest.fn().mockResolvedValue("fakeToken123"),
  decodificarToken: jest.fn(),
}));

// Mock de helpers de contraseña
jest.mock("../../src/auth/bcrypt", () => ({
  cifrarContraseña: jest.fn().mockResolvedValue("hashedPassword"),
  compararContraseñas: jest.fn().mockResolvedValue(true),
}));

describe("UsuarioService", () => {
  const service = new UsuarioService();

  it("debería registrar un usuario nuevo", async () => {
    const result = await service.registrar({
      email: "test@example.com",
      contraseña: "Password123",
      nombre: "Test User",
      telefono: "1234567890",
      fecha_nac: "2000-01-01",
    });
    expect(result).toHaveProperty("id");
    expect(result.email).toBe("test@example.com");
  });

  it("debería iniciar sesión con credenciales correctas", async () => {
    const prisma = (service as any).prismaClient;
    prisma.usuario.findUnique.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      contraseña: "hashedPassword",
      nombre: "Test User",
      telefono: "1234567890",
      rol: { nombre: "Usuario" },
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

  it("debería lanzar un error al registrar un usuario con un email ya existente", async () => {
    const prisma = (service as any).prismaClient;
    prisma.usuario.findUnique.mockResolvedValueOnce({
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
  });
/*
    it.skip("debería registrar una dirección para un usuario", async () => {
        const prisma = (service as any).prismaClient;

    prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return callback({
        localidad: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({ id_localidad: 1, nombre: "Localidad1" }),
        },
        direccion: {
          create: jest.fn().mockResolvedValueOnce({
            id: 1,
            calle: "Calle Falsa",
            numero: 123,
            localidadId: 1,
            codigo_postal: 1000,
          }),
        },
      });
    });

    const result = await service.registrarDireccion(1, {
      calle: "Calle Falsa",
      numero: 123,
      localidad_id: 1,
      codigo_postal: 1000,
      imagen_url: "",
    });

    expect(result).toHaveProperty("id");
    expect(result.calle).toBe("Calle Falsa");
  });

    it.skip("debería lanzar un error al registrar una dirección con una localidad inexistente", async () => {
        const prisma = (service as any).prismaClient;

    prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return callback({
        localidad: {
          findUnique: jest.fn().mockResolvedValueOnce(null),
        },
        direccion: {
          create: jest.fn().mockResolvedValueOnce({
            id: 1,
            calle: "Calle Falsa",
            numero: 123,
            localidadId: 1,
            codigo_postal: 1000,
          }),
        },
      });
    });

        await expect(
            service.registrarDireccion(1, {
              calle: "Calle Falsa",
              numero: 123,
              localidad_id: 1,
              codigo_postal: 1000,
              imagen_url: "",
            })
        ).rejects.toThrow("Localidad no encontrada en la base de datos");
    });
*/
  it("debería buscar un usuario por email", async () => {
    const prisma = (service as any).prismaClient;
    prisma.usuario.findUnique.mockResolvedValueOnce({
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
    const prisma = (service as any).prismaClient;
    prisma.usuario.findUnique.mockResolvedValueOnce({
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
    expect(result?.rol.nombre).toBe("Usuario");
  });

  it("debería actualizar un usuario", async () => {
    const prisma = (service as any).prismaClient;
    prisma.usuario.update.mockResolvedValueOnce({
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
});
