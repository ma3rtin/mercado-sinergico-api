import { PaqueteBaseService } from "../../src/services/paqueteBase.service.js";
import { PaqueteBaseDTO, TipoPaquete } from "../../src/dtos/paquete/paqueteBase.dto.js";

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
  const mockPaqueteBaseProductoFindMany = jest.fn();
  const mockProductoFindMany = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          categoria: { findUnique: mockCategoriaFindUnique },
          producto: { findMany: mockProductoFindMany },
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
      producto: { findMany: mockProductoFindMany },
      paqueteBaseProducto: {
        createMany: mockPaqueteBaseProductoCreateMany,
        findMany: mockPaqueteBaseProductoFindMany,
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
      mockPaqueteBaseProductoFindMany,
      mockProductoFindMany,
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
      mockPaqueteBaseProductoFindMany,
      mockProductoFindMany,
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
    mockPaqueteBaseProductoFindMany.mockResolvedValue([]);

    // Default mock implementation
    mockProductoFindMany.mockImplementation(async (params: any) => {
      if (params?.where?.OR || params?.where?.tipo) {
        return [];
      }
      return [
        { id_producto: 1, nombre: "Prod 1", tipo: "SINERGICO" },
        { id_producto: 2, nombre: "Prod 2", tipo: "SINERGICO" },
        { id_producto: 3, nombre: "Prod 3", tipo: "SINERGICO" },
      ];
    });
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

  it("debería fallar al crear si la categoría no existe", async () => {
    const { mockCategoriaFindUnique } = require("../../src/prisma/client").__mocks;
    mockCategoriaFindUnique.mockResolvedValue(null);

    const dto: PaqueteBaseDTO = {
      nombre: "Test Fail",
      descripcion: "Desc",
      categoria_id: 999,
      productos: [],
      imagen_url: "",
      marcaId: 1,
    };

    await expect(service.create(dto)).rejects.toThrow("La categoría no existe");
  });

  it("debería fallar al crear si uno o más productos no existen", async () => {
    const { mockProductoFindMany } = require("../../src/prisma/client").__mocks;
    mockProductoFindMany.mockImplementationOnce(async () => [
      { id_producto: 1, nombre: "Prod 1", tipo: "SINERGICO" }
    ]);

    const dto: PaqueteBaseDTO = {
      nombre: "Test Fail",
      descripcion: "Desc",
      categoria_id: 1,
      productos: [1, 2],
      imagen_url: "",
      marcaId: 1,
    };

    await expect(service.create(dto)).rejects.toThrow("Uno o más productos seleccionados no existen.");
  });

  it("debería fallar al crear un paquete ENERGICO con productos de tipo SINERGICO", async () => {
    const { mockProductoFindMany } = require("../../src/prisma/client").__mocks;
    mockProductoFindMany
      .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Sinergico", tipo: "SINERGICO" }])
      .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Sinergico", tipo: "SINERGICO" }]);

    const dto: PaqueteBaseDTO = {
      nombre: "Test Energico Fail",
      descripcion: "Desc",
      categoria_id: 1,
      tipo: TipoPaquete.ENERGICO,
      productos: [1],
      imagen_url: "",
      marcaId: 1,
    };

    await expect(service.create(dto)).rejects.toThrow("Un paquete de tipo ENÉRGICO solo puede contener productos de tipo ENÉRGICO");
  });

  it("debería crear un paquete ENERGICO si contiene solo productos de tipo ENERGICO", async () => {
    const { mockProductoFindMany } = require("../../src/prisma/client").__mocks;
    mockProductoFindMany
      .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Energico", tipo: "ENERGICO" }])
      .mockResolvedValueOnce([]);

    const dto: PaqueteBaseDTO = {
      nombre: "Test Energico Ok",
      descripcion: "Desc",
      categoria_id: 1,
      tipo: TipoPaquete.ENERGICO,
      productos: [1],
      imagen_url: "",
      marcaId: 1,
    };

    const result = await service.create(dto);
    expect(result).toHaveProperty("id_paquete_base");
  });

  it("debería fallar al crear un paquete SINERGICO con productos de tipo ENERGICO", async () => {
    const { mockProductoFindMany } = require("../../src/prisma/client").__mocks;
    mockProductoFindMany
      .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Energico", tipo: "ENERGICO" }])
      .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Energico", tipo: "ENERGICO" }]);

    const dto: PaqueteBaseDTO = {
      nombre: "Test Sinergico Fail",
      descripcion: "Desc",
      categoria_id: 1,
      tipo: TipoPaquete.SINERGICO,
      productos: [1],
      imagen_url: "",
      marcaId: 1,
    };

    await expect(service.create(dto)).rejects.toThrow("Un paquete de tipo SINÉRGICO solo puede contener productos de tipo SINÉRGICO");
  });

  it("debería fallar al agregar productos si el paquete no existe", async () => {
    const { mockPaqueteBaseFindUnique } = require("../../src/prisma/client").__mocks;
    mockPaqueteBaseFindUnique.mockResolvedValue(null);

    await expect(service.sincronizarProductos(999, [1]))
      .rejects.toThrow("Paquete no encontrado");
  });

  it("debería fallar al agregar productos si uno o más productos no existen", async () => {
    const { mockPaqueteBaseFindUnique, mockProductoFindMany } = require("../../src/prisma/client").__mocks;
    mockPaqueteBaseFindUnique.mockResolvedValue({ id_paquete_base: 1, tipo: "SINERGICO" });
    mockProductoFindMany.mockResolvedValueOnce([]);

    await expect(service.sincronizarProductos(1, [999]))
      .rejects.toThrow("Uno o más productos seleccionados no existen.");
  });

  it("debería fallar al agregar productos ENERGICOS a un paquete SINERGICO", async () => {
    const { mockPaqueteBaseFindUnique, mockProductoFindMany } = require("../../src/prisma/client").__mocks;
    mockPaqueteBaseFindUnique.mockResolvedValue({ id_paquete_base: 1, tipo: "SINERGICO" });
    mockProductoFindMany
      .mockResolvedValueOnce([{ id_producto: 5, nombre: "Prod Energico", tipo: "ENERGICO" }])
      .mockResolvedValueOnce([{ id_producto: 5, nombre: "Prod Energico", tipo: "ENERGICO" }]);

    await expect(service.sincronizarProductos(1, [5]))
      .rejects.toThrow("Un paquete de tipo SINÉRGICO solo puede contener productos de tipo SINÉRGICO");
  });

  it("debería fallar al agregar productos SINERGICOS a un paquete ENERGICO", async () => {
    const { mockPaqueteBaseFindUnique, mockProductoFindMany } = require("../../src/prisma/client").__mocks;
    mockPaqueteBaseFindUnique.mockResolvedValue({ id_paquete_base: 1, tipo: "ENERGICO" });
    mockProductoFindMany
      .mockResolvedValueOnce([{ id_producto: 6, nombre: "Prod Sinergico", tipo: "SINERGICO" }])
      .mockResolvedValueOnce([{ id_producto: 6, nombre: "Prod Sinergico", tipo: "SINERGICO" }]);

    await expect(service.sincronizarProductos(1, [6]))
      .rejects.toThrow("Un paquete de tipo ENÉRGICO solo puede contener productos de tipo ENÉRGICO");
  });

  it("debería fallar al cambiar tipo a ENERGICO en update si contiene productos SINERGICOS", async () => {
    const { mockPaqueteBaseProductoFindMany, mockProductoFindMany } = require("../../src/prisma/client").__mocks;
    mockPaqueteBaseProductoFindMany.mockResolvedValue([{ productoId: 10 }]);
    mockProductoFindMany.mockResolvedValueOnce([{ id_producto: 10, nombre: "Prod Sinergico", tipo: "SINERGICO" }]);

    const dto: PaqueteBaseDTO = {
      nombre: "Test Update Fail",
      descripcion: "Desc",
      categoria_id: 1,
      tipo: TipoPaquete.ENERGICO,
      productos: [],
      imagen_url: "",
      marcaId: 1,
    };

    await expect(service.update(1, dto)).rejects.toThrow("No se puede cambiar el tipo a ENÉRGICO: el paquete contiene productos incompatibles de tipo SINÉRGICO");
  });

  it("debería fallar al cambiar tipo a SINERGICO en update si contiene productos ENERGICOS", async () => {
    const { mockPaqueteBaseProductoFindMany, mockProductoFindMany } = require("../../src/prisma/client").__mocks;
    mockPaqueteBaseProductoFindMany.mockResolvedValue([{ productoId: 11 }]);
    mockProductoFindMany.mockResolvedValueOnce([{ id_producto: 11, nombre: "Prod Energico", tipo: "ENERGICO" }]);

    const dto: PaqueteBaseDTO = {
      nombre: "Test Update Fail",
      descripcion: "Desc",
      categoria_id: 1,
      tipo: TipoPaquete.SINERGICO,
      productos: [],
      imagen_url: "",
      marcaId: 1,
    };

    await expect(service.update(1, dto)).rejects.toThrow("No se puede cambiar el tipo a SINÉRGICO: el paquete contiene productos incompatibles de tipo ENÉRGICO");
  });
});
