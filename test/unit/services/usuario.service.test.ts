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

jest.mock("../../../src/prisma/client", () => {
  const mockUsuarioCreate = jest.fn();
  const mockUsuarioFindUnique = jest.fn();
  const mockUsuarioUpdate = jest.fn();
  const mockRolFindUnique = jest.fn();
  const mockTransaction = jest.fn();

  return {
    prisma: {
      usuario: {
        create: mockUsuarioCreate,
        findUnique: mockUsuarioFindUnique,
        update: mockUsuarioUpdate,
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
    mocks.mockTransaction.mockImplementation(async (cb: any) => cb({}));
  });

  it("debería iniciar sesión con credenciales correctas", async () => {
    mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
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
});
