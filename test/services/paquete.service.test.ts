import { PaqueteBaseService } from "../../src/services/paqueteBase.service";
import { PaqueteBaseDTO } from "../../src/dtos/paquete/paqueteBase.dto";

jest.mock("../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockPaqueteBaseCreate = jest.fn();
  const mockPaqueteBaseFindUnique = jest.fn();
  const mockPaqueteBaseFindMany = jest.fn();
  const mockPaqueteBaseUpdate = jest.fn();
  const mockPaqueteBaseDelete = jest.fn();
  const mockCategoriaFindUnique = jest.fn();
  const mockPaqueteBaseProductoCreateMany = jest.fn();
  const mockPaqueteBaseProductoDeleteMany = jest.fn();

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
          paqueteBaseProducto: {
            createMany: mockPaqueteBaseProductoCreateMany,
            deleteMany: mockPaqueteBaseProductoDeleteMany,
          },
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
      paqueteBaseProducto: {
        createMany: mockPaqueteBaseProductoCreateMany,
        deleteMany: mockPaqueteBaseProductoDeleteMany,
      },
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
      mockPaqueteBaseProductoDeleteMany,
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
    } = require("../../src/prisma/client").__mocks;

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
    mockPaqueteBaseUpdate.mockResolvedValue({ id_paquete_base: 1, nombre: "Test Updated" });
    mockPaqueteBaseDelete.mockResolvedValue({ id_paquete_base: 1, nombre: "Test" });
    mockPaqueteBaseProductoCreateMany.mockResolvedValue({ count: 2 });
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

  it("debería obtener todos los paquetes", async () => {
    const result = await service.getAll();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
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

  it("debería eliminar un paquete", async () => {
    const result = await service.delete(1);
    expect(result).toHaveProperty("id_paquete_base");
    expect(result.nombre).toBe("Test");
  });

  describe("sincronizarProductos", () => {
    let mockDeleteMany: jest.Mock;
    let mockCreateMany: jest.Mock;
    let mockTransaction: jest.Mock;

    beforeEach(() => {
      const m = require("../../src/prisma/client").__mocks;
      mockDeleteMany = m.mockPaqueteBaseProductoDeleteMany;
      mockCreateMany = m.mockPaqueteBaseProductoCreateMany;
      mockTransaction = m.mockTransaction;

      mockDeleteMany.mockResolvedValue({ count: 0 });
      mockCreateMany.mockResolvedValue({ count: 0 });
    });

    it("usa transacción para el reemplazo", async () => {
      await service.sincronizarProductos(1, [10, 20]);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it("llama a deleteMany antes de createMany para reemplazar la lista", async () => {
      const orden: string[] = [];
      mockDeleteMany.mockImplementation(() => { orden.push("delete"); return Promise.resolve({ count: 0 }); });
      mockCreateMany.mockImplementation(() => { orden.push("create"); return Promise.resolve({ count: 2 }); });

      await service.sincronizarProductos(1, [10, 20]);

      expect(orden).toEqual(["delete", "create"]);
    });

    it("pasa los productosId correctos a createMany", async () => {
      await service.sincronizarProductos(1, [10, 20]);

      expect(mockCreateMany).toHaveBeenCalledWith({
        data: [
          { paqueteBaseId: 1, productoId: 10 },
          { paqueteBaseId: 1, productoId: 20 },
        ],
      });
    });

    it("llama a deleteMany con el paqueteBaseId correcto", async () => {
      await service.sincronizarProductos(1, [10]);

      expect(mockDeleteMany).toHaveBeenCalledWith({ where: { paqueteBaseId: 1 } });
    });

    it("acepta productosId vacío y no llama a createMany", async () => {
      await service.sincronizarProductos(1, []);

      expect(mockDeleteMany).toHaveBeenCalled();
      expect(mockCreateMany).not.toHaveBeenCalled();
    });

    it("lanza error 404 si el paquete no existe", async () => {
      const { mockPaqueteBaseFindUnique } = require("../../src/prisma/client").__mocks;
      mockPaqueteBaseFindUnique.mockResolvedValueOnce(null);

      await expect(service.sincronizarProductos(999, [1])).rejects.toThrow("Paquete no encontrado");
    });

    it("rechaza productosId duplicados antes de tocar la base", async () => {
      await expect(service.sincronizarProductos(1, [10, 10])).rejects.toThrow(
        "La lista de productos no puede contener duplicados"
      );

      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("rechaza productosId no positivos antes de tocar la base", async () => {
      await expect(service.sincronizarProductos(1, [0])).rejects.toThrow(
        "Los productosId deben ser enteros positivos"
      );

      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });
});
