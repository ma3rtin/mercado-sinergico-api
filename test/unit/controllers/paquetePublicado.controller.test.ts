import { PaquetePublicadoController } from "../../../src/controllers/paquetePublicado.controller";
import { PaquetePublicadoService } from "../../../src/services/paquetePublicado.service";

// asyncHandler no devuelve la promesa del handler, así que hay que dejar
// correr la microtask antes de asertar sobre res/next.
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("PaquetePublicadoController", () => {
  let service: PaquetePublicadoService;
  let controller: PaquetePublicadoController;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    service = {
      getPorCerrarse: jest.fn().mockResolvedValue([]),
    } as any;

    controller = new PaquetePublicadoController(service);

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe("getPorCerrarse", () => {
    it("debería responder 200 con los paquetes encontrados", async () => {
      const paquetes = [{ id_paquete_publicado: 1 }, { id_paquete_publicado: 2 }];
      (service.getPorCerrarse as jest.Mock).mockResolvedValue(paquetes);

      controller.getPorCerrarse(req, res, next);
      await flush();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(paquetes);
      expect(next).not.toHaveBeenCalled();
    });

    it("debería responder 200 con un array vacío cuando no hay paquetes por cerrarse", async () => {
      (service.getPorCerrarse as jest.Mock).mockResolvedValue([]);

      controller.getPorCerrarse(req, res, next);
      await flush();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
      // "sin resultados" no es un error: el front tiene que poder distinguir
      // una lista vacía de una falla real para mostrar su estado vacío.
      expect(next).not.toHaveBeenCalled();
    });

    it("debería delegar en next() si el servicio falla", async () => {
      const error = new Error("se cayó la base");
      (service.getPorCerrarse as jest.Mock).mockRejectedValue(error);

      controller.getPorCerrarse(req, res, next);
      await flush();

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
