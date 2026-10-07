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
  const mockLocalidadFindUnique = jest.fn();

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
      localidad: { findUnique: mockLocalidadFindUnique },
    },
    __mocks: {
      mockUsuarioCreate,
      mockUsuarioFindUnique,
      mockUsuarioUpdate,
      mockRolFindUnique,
      mockTransaction,
      mockLocalidadFindUnique,
    },
  };
});

jest.mock("../../../src/auth/jwt", () => ({
  crearToken: jest.fn().mockResolvedValue("fakeToken123"),
  decodificarToken: jest.fn(),
}));

jest.mock("../../../src/services/imagen.service", () => ({
  ImagenService: class {
    uploadToCloudinary = jest.fn().mockResolvedValue("http://cloudinary/fake.jpg");
  },
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

  it.each([null, { id_localidad: 1, activa: false }])(
    'rechaza una localidad inexistente o histórica antes de modificar el perfil',
    async (localidad) => {
      mocks.mockLocalidadFindUnique.mockResolvedValue(localidad);
      await expect(service.actualizarUsuario(1, { localidad_id: 1 } as any))
        .rejects.toMatchObject({ status: 400 });
      expect(mocks.mockUsuarioUpdate).not.toHaveBeenCalled();
    }
  );

  it('rechaza registrar una dirección con localidad histórica', async () => {
    const create = jest.fn();
    mocks.mockTransaction.mockImplementation(async (cb: any) => cb({
      localidad: { findUnique: jest.fn().mockResolvedValue({ activa: false }) },
      direccion: { create },
    }));
    await expect(service.registrarDireccion(1, { localidad_id: 1 } as any))
      .rejects.toThrow('Seleccioná una localidad vigente');
    expect(create).not.toHaveBeenCalled();
  });

  it.each([1708, null])('guarda el CP del domicilio sin reemplazarlo por la referencia %s', async (referencia) => {
    const create = jest.fn().mockResolvedValue({ id: 1, codigo_postal: 1706 });
    mocks.mockTransaction.mockImplementation(async (cb: any) => cb({
      localidad: { findUnique: jest.fn().mockResolvedValue({ activa: true, codigo_postal: referencia }) },
      direccion: { create },
    }));
    await service.registrarDireccion(1, {
      localidad_id: 1, codigo_postal: 1706, calle: 'Prueba', numero: 100,
    } as any);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ codigo_postal: 1706 }),
    }));
  });

  it("debería lanzar un error al registrar un usuario con un email ya existente", async () => {
    mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
    });

    await expect(
      service.registrar({
        email: "test@example.com",
        nombre: "Test User",
        telefono: "1234567890",
        fecha_nac: "2000-01-01",
      } as any)
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

  describe("loginConFirebase", () => {
    it("debería crear el usuario si no existe en la DB", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce(null);
      mocks.mockUsuarioCreate.mockResolvedValueOnce({
        id: 10,
        firebaseUid: "firebase-uid-123",
        email: "nuevo@example.com",
        nombre: "Nuevo User",
        contraseña: null,
        rol: { nombre: "Usuario" },
      });

      const result = await service.loginConFirebase({
        uid: "firebase-uid-123",
        email: "nuevo@example.com",
        name: "Nuevo User",
        picture: undefined,
      });

      expect(result.email).toBe("nuevo@example.com");
      expect(result.firebaseUid).toBe("firebase-uid-123");
      expect(mocks.mockUsuarioCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firebaseUid: "firebase-uid-123",
            email: "nuevo@example.com",
            contraseña: null,
            rol: { connect: { nombre: "Usuario" } },
          }),
        })
      );
    });

    it("debería linkear firebaseUid a un usuario existente que aún no lo tiene (soft-migración)", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 5,
        email: "existente@example.com",
        firebaseUid: null,
        contraseña: "hashedLegacy",
        nombre: "Legacy User",
        telefono: "1234567890",
        rol: { nombre: "Usuario" },
      });
      mocks.mockUsuarioUpdate.mockResolvedValueOnce({
        id: 5,
        email: "existente@example.com",
        firebaseUid: "firebase-uid-456",
        nombre: "Legacy User",
        rol: { nombre: "Usuario" },
      });

      const result = await service.loginConFirebase({
        uid: "firebase-uid-456",
        email: "existente@example.com",
        name: "Legacy User",
      });

      expect(result.firebaseUid).toBe("firebase-uid-456");
      expect(mocks.mockUsuarioUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5 },
          data: { firebaseUid: "firebase-uid-456" },
        })
      );
    });

    it("debería devolver el usuario existente si ya tiene firebaseUid (sin update)", async () => {
      mocks.mockUsuarioFindUnique.mockResolvedValueOnce({
        id: 7,
        firebaseUid: "firebase-uid-789",
        email: "ya@example.com",
        contraseña: null,
        nombre: "Ya User",
        telefono: "1234567890",
        rol: { nombre: "Usuario" },
      });

      const result = await service.loginConFirebase({
        uid: "firebase-uid-789",
        email: "ya@example.com",
      });

      expect(result.id).toBe(7);
      expect(mocks.mockUsuarioUpdate).not.toHaveBeenCalled();
      expect(mocks.mockUsuarioCreate).not.toHaveBeenCalled();
    });

    it("debería lanzar error si Firebase no provee email", async () => {
      await expect(
        service.loginConFirebase({
          uid: "firebase-uid-000",
          email: undefined,
        })
      ).rejects.toMatchObject({ status: 400 });
    });
  });
});