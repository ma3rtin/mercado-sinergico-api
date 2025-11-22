import { UsuarioController } from "../../src/controllers/usuario.controller";
import { ImagenService } from "../../src/services/imagen.service";
import { UsuarioService } from "../../src/services/usuario.service";

jest.mock("../../src/utils/asyncHandler", () => ({
  asyncHandler: (fn: any) => async (req: any, res: any, next: any) => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      const status = error.status || 400;
      res.status(status).json({ message: error.message });
    }
  },
}));

describe("UsuarioController", () => {
  let service: UsuarioService;
  let imagenService: ImagenService;
  let controller: UsuarioController;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    service = {
      registrar: jest.fn(),
      registrarDireccion: jest.fn(),
      iniciarSesion: jest.fn(),
      obtenerUsuario: jest.fn(),
      actualizarUsuario: jest.fn()
    } as any;

    imagenService = {
      uploadToCloudinary: jest.fn().mockResolvedValue('http://example.com/fake.jpg'),
      uploadFromUrl: jest.fn().mockResolvedValue('http://example.com/fake.jpg')
    };
    controller = new UsuarioController(service, imagenService);

    req = {
      body: {
        email: "test@example.com",
        contraseña: "Password123",
        nombre: "Test User",
        telefono: "1234567890",
        fecha_nac: "2000-01-01",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  it("debería registrar un usuario y devolver estado 201", async () => {
    (service.registrar as jest.Mock).mockResolvedValue({ id: 1, email: "test@example.com" });

    await controller.registrar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("debería devolver estado 400 si el service lanza un error", async () => {
    (service.registrar as jest.Mock).mockRejectedValue({
      message: "El email ya se encuentra registrado",
      status: 400
    });

    await controller.registrar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "El email ya se encuentra registrado" })
    );
  });

  it("debería iniciar sesión y devolver un token con estado 200", async () => {
    (service.iniciarSesion as jest.Mock).mockResolvedValue("fakeToken123");
    req.body = { email: "test@example.com", contraseña: "Password123" };

    await controller.iniciarSesion(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "fakeToken123" }));
  });

  it("debería devolver estado 400 si el service lanza un error al iniciar sesión", async () => {
    (service.iniciarSesion as jest.Mock).mockRejectedValue({
      message: "Error inesperado",
      status: 400
    });
    req.body = { email: "test@example.com", contraseña: "Password123" };

    await controller.iniciarSesion(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error inesperado" }));
  });

  it("debería obtener el usuario y devolver estado 200", async () => {
    (service.obtenerUsuario as jest.Mock).mockResolvedValue({ id: 1, email: "test@example.com" });
    req.user = { id: 1 };

    await controller.obtenerUsuario(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("debería devolver estado 400 si el service lanza un error al obtener usuario", async () => {
    (service.obtenerUsuario as jest.Mock).mockRejectedValue({
      message: "Error inesperado",
      status: 400
    });
    req.user = { id: 1 };

    await controller.obtenerUsuario(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error inesperado" }));
  });

  it("debería actualizar el usuario y devolver estado 200", async () => {
    (service.actualizarUsuario as jest.Mock).mockResolvedValue({ id: 1, email: "test@example.com" });
    req.user = { id: 1 };
    req.body = { email: "test@example.com" };

    await controller.actualizarUsuario(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
        usuario: expect.objectContaining({ id: 1, email: "test@example.com" }),
      })
    );
  });

  it("debería devolver estado 400 si el service lanza un error al actualizar usuario", async () => {
    (service.actualizarUsuario as jest.Mock).mockRejectedValue({
      message: "Error inesperado",
      status: 400
    });
    req.user = { id: 1 };
    req.body = { email: "test@example.com" };

    await controller.actualizarUsuario(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error inesperado" }));
  });

  it("debería devolver 401 si usuario no autenticado al registrar dirección", async () => {
    req.user = undefined;
    req.body = { calle: "Calle Falsa 123", numero: "123", localidadId: 1, codigo_postal: "1000" };

    await controller.registrarDireccion(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Usuario no autenticado" })
    );
  });

  it("debería devolver 401 si usuario no autenticado al obtener usuario", async () => {
    req.user = undefined;

    await controller.obtenerUsuario(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Usuario no autenticado" })
    );
  });

  it("debería devolver 401 si usuario no autenticado al actualizar usuario", async () => {
    req.user = undefined;
    req.body = { email: "test@example.com" };

    await controller.actualizarUsuario(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Usuario no autenticado" })
    );
  });
});
