import { PaquetePublicadoService } from "../../../src/services/paquetePublicado.service";

jest.mock("../../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockPaquetePublicadoFindMany = jest.fn();
  const mockPaquetePublicadoFindUnique = jest.fn();
  const mockPaquetePublicadoUpdate = jest.fn();
  const mockPaquetePublicadoCreate = jest.fn();
  const mockPaquetePublicadoCount = jest.fn();
  const mockLocalidadFindUnique = jest.fn();
  const mockUsuarioFindUnique = jest.fn();
  const mockPaqueteBaseFindUnique = jest.fn();
  const mockPaqueteBaseUpdate = jest.fn();
  const mockZonaFindUnique = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          paquetePublicado: {
            findMany: mockPaquetePublicadoFindMany,
            findUnique: mockPaquetePublicadoFindUnique,
            update: mockPaquetePublicadoUpdate,
            create: mockPaquetePublicadoCreate,
            count: mockPaquetePublicadoCount,
          },
          localidad: { findUnique: mockLocalidadFindUnique },
          usuario: { findUnique: mockUsuarioFindUnique },
          paqueteBase: { findUnique: mockPaqueteBaseFindUnique, update: mockPaqueteBaseUpdate },
          zona: { findUnique: mockZonaFindUnique },
        };
        return callback(tx);
      }),
      paquetePublicado: {
        findMany: mockPaquetePublicadoFindMany,
        findUnique: mockPaquetePublicadoFindUnique,
        update: mockPaquetePublicadoUpdate,
        create: mockPaquetePublicadoCreate,
        count: mockPaquetePublicadoCount,
      },
      localidad: { findUnique: mockLocalidadFindUnique },
      usuario: { findUnique: mockUsuarioFindUnique },
      paqueteBase: { findUnique: mockPaqueteBaseFindUnique, update: mockPaqueteBaseUpdate },
      zona: { findUnique: mockZonaFindUnique },
      pedido: { findMany: jest.fn().mockResolvedValue([]) },
    },
    __mocks: {
      mockTransaction,
      mockPaquetePublicadoFindMany,
      mockPaquetePublicadoFindUnique,
      mockPaquetePublicadoUpdate,
      mockPaquetePublicadoCreate,
      mockPaquetePublicadoCount,
      mockLocalidadFindUnique,
      mockUsuarioFindUnique,
      mockPaqueteBaseFindUnique,
      mockPaqueteBaseUpdate,
      mockZonaFindUnique,
    },
  };
});

describe("PaquetePublicadoService", () => {
  let service: PaquetePublicadoService;

  beforeEach(() => {
    service = new PaquetePublicadoService();
    jest.clearAllMocks();

    const {
      mockPaquetePublicadoFindMany,
      mockPaquetePublicadoFindUnique,
      mockPaquetePublicadoUpdate,
      mockPaquetePublicadoCreate,
      mockPaquetePublicadoCount,
      mockLocalidadFindUnique,
      mockUsuarioFindUnique,
      mockPaqueteBaseFindUnique,
      mockPaqueteBaseUpdate,
      mockZonaFindUnique,
    } = require("../../../src/prisma/client").__mocks;

    mockPaquetePublicadoFindMany.mockResolvedValue([]);
    mockPaquetePublicadoFindUnique.mockResolvedValue(null);
    mockPaquetePublicadoUpdate.mockResolvedValue({});
    mockPaquetePublicadoCreate.mockResolvedValue({});
    mockPaquetePublicadoCount.mockResolvedValue(0);
    mockLocalidadFindUnique.mockResolvedValue(null);
    mockUsuarioFindUnique.mockResolvedValue(null);
    mockPaqueteBaseFindUnique.mockResolvedValue({ id_paquete_base: 1, nombre: "Base", archivado: false, productos: [] });
    mockPaqueteBaseUpdate.mockResolvedValue({});
    mockZonaFindUnique.mockResolvedValue({ id_zona: 1, nombre: "Zona 1" });
  });

  describe("getAll", () => {
    it("debería retornar array vacío por defecto", async () => {
      const result = await service.getAll();
      expect(result).toEqual([]);
    });

    it("debería filtrar por archivado = false por defecto", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll();
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            archivado: false,
          }),
        })
      );
    });

    it("debería no filtrar por archivado cuando includeArchived es true", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, undefined, true);
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            archivado: false,
          }),
        })
      );
    });

    it("debería pasar skip y take a prisma para la paginación de paquetes", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(10, 5);
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
    });

    it("debería aplicar filtros de categorías, marcas, zonas, tipos de paquetes y estados en paquetes", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(0, 10, false, [1, 2], [3], [4], ["SINERGICO"], ["por-cerrar"]);
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paqueteBase: expect.objectContaining({
              categoria_id: { in: [1, 2] },
              marcaId: { in: [3] },
            }),
            zonaId: { in: [4] },
            tipo: { in: ["SINERGICO"] },
          }),
        })
      );
    });
  });

  describe("countAll", () => {
    it("debería llamar a prisma.paquetePublicado.count con los filtros de paquetes correspondientes", async () => {
      const { mockPaquetePublicadoCount } = require("../../../src/prisma/client").__mocks;
      await service.countAll(false, [1, 2], [3], [4], ["SINERGICO"], ["por-cerrar"]);
      expect(mockPaquetePublicadoCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            archivado: false,
            paqueteBase: expect.objectContaining({
              categoria_id: { in: [1, 2] },
              marcaId: { in: [3] },
            }),
            zonaId: { in: [4] },
            tipo: { in: ["SINERGICO"] },
          }),
        })
      );
    });
  });

  describe("getById", () => {
    it("debería retornar null si el paquete publicado no existe", async () => {
      const result = await service.getById(99);
      expect(result).toBeNull();
    });

    it("debería retornar el paquete publicado si existe", async () => {
      const { mockPaquetePublicadoFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindUnique.mockResolvedValue({
        id_paquete_publicado: 1,
        nombre: "Paquete Publicado Test",
        pedidos: [],
        descuento: 0,
      });

      const result = await service.getById(1);
      expect(result).toHaveProperty("id_paquete_publicado", 1);
      expect((result as any)?.nombre).toBe("Paquete Publicado Test");
    });
  });

  describe("create", () => {
    it("debería lanzar un error si el paquete base está archivado", async () => {
      const { mockPaqueteBaseFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseFindUnique.mockResolvedValueOnce({
        id_paquete_base: 1,
        nombre: "Base",
        archivado: true,
        productos: [],
      });

      const dto = {
        nombre: "Test Publicado",
        zonaId: 1,
        paqueteBaseId: 1,
        cant_productos: 10,
        fecha_inicio: "2026-06-20",
        fecha_fin: "2026-07-20",
        descuento: 0,
      };

      await expect(service.create(dto)).rejects.toThrow("No se puede publicar un paquete base archivado");
    });
  });

  describe("update", () => {
    it("debería lanzar un error si el nuevo paquete base está archivado", async () => {
      const { mockPaquetePublicadoFindUnique, mockPaqueteBaseFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindUnique.mockResolvedValueOnce({ id_paquete_publicado: 1, paqueteBaseId: 1 });
      mockPaqueteBaseFindUnique.mockResolvedValueOnce({ id_paquete_base: 2, nombre: "Archived Base", archivado: true });

      const dto = {
        paqueteBaseId: 2,
      };

      await expect(service.update(1, dto)).rejects.toThrow("No se puede conectar un paquete base archivado");
    });
  });

  describe("delete", () => {
    it("debería archivar la publicación al intentar eliminarla (soft-delete)", async () => {
      const { 
        mockPaquetePublicadoFindUnique,
        mockPaquetePublicadoUpdate,
      } = require("../../../src/prisma/client").__mocks;

      mockPaquetePublicadoFindUnique.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Test", archivado: false });
      mockPaquetePublicadoUpdate.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Test", archivado: true });

      const result = await service.delete(1);
      expect((result as any).archivado).toBe(true);
      expect(mockPaquetePublicadoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_paquete_publicado: 1 },
          data: { archivado: true },
        })
      );
    });
  });

  describe("archivar", () => {
    it("debería archivar un paquete publicado existente", async () => {
      const { 
        mockPaquetePublicadoFindUnique,
        mockPaquetePublicadoUpdate,
      } = require("../../../src/prisma/client").__mocks;

      mockPaquetePublicadoFindUnique.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Test", archivado: false });
      mockPaquetePublicadoUpdate.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Test", archivado: true });

      const result = await service.archivar(1, true);
      expect((result as any).archivado).toBe(true);
      expect(mockPaquetePublicadoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_paquete_publicado: 1 },
          data: { archivado: true },
        })
      );
    });

    it("debería lanzar un error si el paquete publicado no existe", async () => {
      const { mockPaquetePublicadoFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindUnique.mockResolvedValue(null);

      await expect(service.archivar(99, true)).rejects.toThrow("Paquete no encontrado");
    });
  });
});
