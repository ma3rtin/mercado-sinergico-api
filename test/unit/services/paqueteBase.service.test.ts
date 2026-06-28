import { PaqueteBaseService } from "../../../src/services/paqueteBase.service";
import { PaqueteBaseDTO } from "../../../src/dtos/paquete/paqueteBase.dto";

jest.mock("../../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockPaqueteBaseCreate = jest.fn();
  const mockPaqueteBaseFindUnique = jest.fn();
  const mockPaqueteBaseFindMany = jest.fn();
  const mockPaqueteBaseUpdate = jest.fn();
  const mockPaqueteBaseDelete = jest.fn();
  const mockCategoriaFindUnique = jest.fn();
  const mockPaqueteBaseProductoCreateMany = jest.fn();
  const mockProductoFindMany = jest.fn();
  const mockProductoFindUnique = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          categoria: { findUnique: mockCategoriaFindUnique },
          paqueteBase: {
            create: mockPaqueteBaseCreate,
            findUnique: mockPaqueteBaseFindUnique,
            update: mockPaqueteBaseUpdate,
            delete: mockPaqueteBaseDelete,
            findMany: mockPaqueteBaseFindMany,
          },
          paqueteBaseProducto: { createMany: mockPaqueteBaseProductoCreateMany },
          producto: { findMany: mockProductoFindMany, findUnique: mockProductoFindUnique },
        };
        return await callback(tx);
      }),
      paqueteBase: {
        create: mockPaqueteBaseCreate,
        findUnique: mockPaqueteBaseFindUnique,
        findMany: mockPaqueteBaseFindMany,
        update: mockPaqueteBaseUpdate,
        delete: mockPaqueteBaseDelete,
      },
      categoria: { findUnique: mockCategoriaFindUnique },
      paqueteBaseProducto: { createMany: mockPaqueteBaseProductoCreateMany },
      producto: { findMany: mockProductoFindMany, findUnique: mockProductoFindUnique },
    },
    __mocks: {
      mockTransaction,
      mockPaqueteBaseCreate,
      mockPaqueteBaseFindUnique,
      mockPaqueteBaseFindMany,
      mockPaqueteBaseUpdate,
      mockPaqueteBaseDelete,
      mockCategoriaFindUnique,
      mockPaqueteBaseProductoCreateMany,
      mockProductoFindMany,
      mockProductoFindUnique,
    },
  };
});

describe("PaqueteBaseService", () => {
  let service: PaqueteBaseService;

  beforeEach(() => {
    service = new PaqueteBaseService();
    jest.clearAllMocks();

    // Default mocks
    const {
      mockCategoriaFindUnique,
      mockPaqueteBaseCreate,
      mockPaqueteBaseFindUnique,
      mockPaqueteBaseFindMany,
      mockPaqueteBaseUpdate,
      mockPaqueteBaseDelete,
      mockPaqueteBaseProductoCreateMany,
      mockProductoFindMany,
      mockProductoFindUnique,
    } = require("../../../src/prisma/client").__mocks;

    mockCategoriaFindUnique.mockResolvedValue({ id_categoria: 1, nombre: "Categoria Test" });
    mockPaqueteBaseCreate.mockResolvedValue({
      id_paquete_base: 1,
      nombre: "Test",
      descripcion: "Desc",
      imagen_url: "",
      categoria_id: 1,
    });
    mockPaqueteBaseFindUnique.mockResolvedValue({ id_paquete_base: 1, nombre: "Test", productos: [] });
    mockPaqueteBaseFindMany.mockResolvedValue([{ id_paquete_base: 1, nombre: "Test", productos: [] }]);
    mockPaqueteBaseUpdate.mockResolvedValue({ id_paquete_base: 1, nombre: "Test Updated", archivado: false });
    mockPaqueteBaseDelete.mockResolvedValue({ id_paquete_base: 1, nombre: "Test" });
    mockPaqueteBaseProductoCreateMany.mockResolvedValue({ count: 2 });
    mockProductoFindMany.mockResolvedValue([]); // No archived products by default
    mockProductoFindUnique.mockResolvedValue({ id_producto: 1, nombre: "Prod 1", archivado: false });
  });

  it("debería crear un paquete y devolverlo", async () => {
    const dto: PaqueteBaseDTO = {
      nombre: "Test",
      descripcion: "Descripción de prueba",
      categoria_id: 1,
      marcaId: 1,
      imagen_url: "http://example.com/image.png",
      productos: [1, 2, 3],
    };

    const result = await service.create(dto);

    expect(result).toHaveProperty("id_paquete_base");
    expect(result.nombre).toBe("Test");
  });

  it("debería lanzar un error si se intenta crear un paquete con productos archivados", async () => {
    const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
    mockProductoFindMany.mockResolvedValueOnce([{ id_producto: 2, nombre: "Producto Archivado", archivado: true }]);

    const dto: PaqueteBaseDTO = {
      nombre: "Test",
      descripcion: "Descripción de prueba",
      categoria_id: 1,
      marcaId: 1,
      productos: [1, 2],
      imagen_url: "",
    };

    await expect(service.create(dto)).rejects.toThrow("No se pueden agregar productos archivados a un paquete base");
  });

  it("debería obtener todos los paquetes", async () => {
    const result = await service.getAll();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("debería filtrar por archivado = false por defecto al obtener todos los paquetes", async () => {
    const { mockPaqueteBaseFindMany } = require("../../../src/prisma/client").__mocks;
    await service.getAll();
    expect(mockPaqueteBaseFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          archivado: false,
        }),
      })
    );
  });

  it("debería no filtrar por archivado cuando includeArchived es true al obtener todos los paquetes", async () => {
    const { mockPaqueteBaseFindMany } = require("../../../src/prisma/client").__mocks;
    await service.getAll(true);
    expect(mockPaqueteBaseFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          archivado: false,
        }),
      })
    );
  });

  it("debería obtener un paquete por id", async () => {
    const result = await service.getById(1);
    expect(result).toHaveProperty("id_paquete_base");
    expect(result?.nombre).toBe("Test");
  });

  it("debería actualizar un paquete", async () => {
    const dto: PaqueteBaseDTO = {
      nombre: "Test Updated",
      descripcion: "Desc Updated",
      categoria_id: 1,
      marcaId: 1,
      productos: [],
      imagen_url: "",
    };

    const result = await service.update(1, dto);
    expect(result).toHaveProperty("id_paquete_base");
    expect(result.nombre).toBe("Test Updated");
  });

  it("debería archivar un paquete al intentar eliminarlo (soft-delete)", async () => {
    const { mockPaqueteBaseFindUnique, mockPaqueteBaseUpdate } = require("../../../src/prisma/client").__mocks;
    mockPaqueteBaseFindUnique.mockResolvedValueOnce({ id_paquete_base: 1, nombre: "Test", archivado: false });
    mockPaqueteBaseUpdate.mockResolvedValueOnce({ id_paquete_base: 1, nombre: "Test", archivado: true });

    const result = await service.delete(1);
    expect(result).toHaveProperty("id_paquete_base");
    expect(result.archivado).toBe(true);
  });

  describe("sincronizarProductos", () => {
    it("debería lanzar un error si se intenta agregar productos archivados", async () => {
      const { mockPaqueteBaseFindUnique, mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseFindUnique.mockResolvedValueOnce({ id_paquete_base: 1, nombre: "Test", tipo: "SINERGICO" });
      mockProductoFindMany.mockResolvedValueOnce([{ id_producto: 2, nombre: "Producto Archivado", archivado: true }]);

      await expect(service.sincronizarProductos(1, [2])).rejects.toThrow(
        "No se pueden agregar productos archivados a un paquete base"
      );
    });
  });

  describe("archivar", () => {
    it("debería archivar un paquete base existente", async () => {
      const { 
        mockPaqueteBaseFindUnique,
        mockPaqueteBaseUpdate,
      } = require("../../../src/prisma/client").__mocks;

      mockPaqueteBaseFindUnique.mockResolvedValue({ id_paquete_base: 1, nombre: "Test", archivado: false });
      mockPaqueteBaseUpdate.mockResolvedValue({ id_paquete_base: 1, nombre: "Test", archivado: true });

      const result = await service.archivar(1, true);
      expect(result.archivado).toBe(true);
      expect(mockPaqueteBaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_paquete_base: 1 },
          data: { archivado: true },
        })
      );
    });

    it("debería lanzar error si el paquete base no existe al archivar", async () => {
      const { mockPaqueteBaseFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseFindUnique.mockResolvedValue(null);

      await expect(service.archivar(99, true)).rejects.toThrow("Paquete base no encontrado");
    });
  });
});
