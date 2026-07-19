import { PaqueteBaseService } from "../../../src/services/paqueteBase.service";
import { PaqueteBaseDTO, TipoPaquete } from "../../../src/dtos/paquete/paqueteBase.dto";

jest.mock("../../../src/prisma/client", () => {
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
          paqueteBaseProducto: {
            createMany: mockPaqueteBaseProductoCreateMany,
            deleteMany: mockPaqueteBaseProductoDeleteMany,
          },
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
      paqueteBaseProducto: {
        createMany: mockPaqueteBaseProductoCreateMany,
        deleteMany: mockPaqueteBaseProductoDeleteMany,
        findMany: mockPaqueteBaseProductoFindMany,
      },
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
      mockPaqueteBaseProductoDeleteMany,
      mockPaqueteBaseProductoFindMany,
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
      mockPaqueteBaseProductoDeleteMany,
      mockPaqueteBaseProductoFindMany,
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
    mockPaqueteBaseFindUnique.mockResolvedValue({ id_paquete_base: 1, nombre: "Test", productos: [], tipo: "SINERGICO" });
    mockPaqueteBaseFindMany.mockResolvedValue([{ id_paquete_base: 1, nombre: "Test", productos: [] }]);
    mockPaqueteBaseUpdate.mockResolvedValue({ id_paquete_base: 1, nombre: "Test Updated", archivado: false });
    mockPaqueteBaseDelete.mockResolvedValue({ id_paquete_base: 1, nombre: "Test" });
    mockPaqueteBaseProductoCreateMany.mockResolvedValue({ count: 2 });
    mockPaqueteBaseProductoDeleteMany.mockResolvedValue({ count: 0 });
    mockPaqueteBaseProductoFindMany.mockResolvedValue([]);
    mockProductoFindUnique.mockResolvedValue({ id_producto: 1, nombre: "Prod 1", archivado: false, tipo: "SINERGICO" });

    // Por defecto, todos los productos pedidos "existen" y son SINERGICO,
    // para que la validación de existencia y compatibilidad pase por defecto.
    mockProductoFindMany.mockImplementation(async (params: any) => {
      const ids: number[] = params?.where?.id_producto?.in ?? [];
      if (params?.where?.OR || params?.where?.tipo) {
        return []; // sin incompatibles por defecto
      }
      return ids.map((id) => ({ id_producto: id, nombre: `Prod ${id}`, tipo: "SINERGICO", archivado: false }));
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

  it("debería lanzar un error si se intenta crear un paquete con productos archivados", async () => {
    const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
    mockProductoFindMany.mockResolvedValueOnce([
      { id_producto: 1, nombre: "Prod 1", archivado: false, tipo: "SINERGICO" },
      { id_producto: 2, nombre: "Producto Archivado", archivado: true, tipo: "SINERGICO" }
    ]);

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
    let mockDeleteMany: jest.Mock;
    let mockCreateMany: jest.Mock;
    let mockTransaction: jest.Mock;
    let mockProductoFindMany: jest.Mock;

    beforeEach(() => {
      const m = require("../../../src/prisma/client").__mocks;
      mockDeleteMany = m.mockPaqueteBaseProductoDeleteMany;
      mockCreateMany = m.mockPaqueteBaseProductoCreateMany;
      mockTransaction = m.mockTransaction;
      mockProductoFindMany = m.mockProductoFindMany;

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
      const { mockPaqueteBaseFindUnique } = require("../../../src/prisma/client").__mocks;
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

    it("debería fallar al sincronizar si uno o más productos no existen", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockProductoFindMany.mockResolvedValueOnce([]);

      await expect(service.sincronizarProductos(1, [999])).rejects.toThrow(
        "Uno o más productos seleccionados no existen."
      );
    });

    it("debería lanzar un error si se intenta agregar productos archivados", async () => {
      const { mockPaqueteBaseFindUnique, mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseFindUnique.mockResolvedValueOnce({ id_paquete_base: 1, nombre: "Test", tipo: "SINERGICO" });
      mockProductoFindMany.mockResolvedValueOnce([{ id_producto: 2, nombre: "Producto Archivado", archivado: true, tipo: "SINERGICO" }]);

      await expect(service.sincronizarProductos(1, [2])).rejects.toThrow(
        "No se pueden agregar productos archivados a un paquete base"
      );
    });

    it("debería fallar al sincronizar productos ENERGICOS en un paquete SINERGICO", async () => {
      const { mockPaqueteBaseFindUnique, mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseFindUnique.mockResolvedValueOnce({ id_paquete_base: 1, tipo: "SINERGICO" });
      mockProductoFindMany
        .mockResolvedValueOnce([{ id_producto: 5, nombre: "Prod Energico", tipo: "ENERGICO", archivado: false }])
        .mockResolvedValueOnce([{ id_producto: 5, nombre: "Prod Energico", tipo: "ENERGICO", archivado: false }]);

      await expect(service.sincronizarProductos(1, [5])).rejects.toThrow(
        "Un paquete SINÉRGICO solo puede contener productos SINÉRGICOS"
      );
    });

    it("debería fallar al sincronizar productos SINERGICOS en un paquete ENERGICO", async () => {
      const { mockPaqueteBaseFindUnique, mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseFindUnique.mockResolvedValueOnce({ id_paquete_base: 1, tipo: "ENERGICO" });
      mockProductoFindMany
        .mockResolvedValueOnce([{ id_producto: 6, nombre: "Prod Sinergico", tipo: "SINERGICO", archivado: false }])
        .mockResolvedValueOnce([{ id_producto: 6, nombre: "Prod Sinergico", tipo: "SINERGICO", archivado: false }]);

      await expect(service.sincronizarProductos(1, [6])).rejects.toThrow(
        "Un paquete ENÉRGICO solo puede contener productos ENÉRGICOS"
      );
    });
  });

  describe("crear y actualizar con compatibilidad", () => {
    it("debería fallar al crear si la categoría no existe", async () => {
      const { mockCategoriaFindUnique } = require("../../../src/prisma/client").__mocks;
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
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockProductoFindMany.mockImplementationOnce(async () => [
        { id_producto: 1, nombre: "Prod 1", tipo: "SINERGICO", archivado: false }
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
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockProductoFindMany
        .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Sinergico", tipo: "SINERGICO", archivado: false }])
        .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Sinergico", tipo: "SINERGICO", archivado: false }]);

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
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockProductoFindMany
        .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Energico", tipo: "ENERGICO", archivado: false }])
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
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockProductoFindMany
        .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Energico", tipo: "ENERGICO", archivado: false }])
        .mockResolvedValueOnce([{ id_producto: 1, nombre: "Prod Energico", tipo: "ENERGICO", archivado: false }]);

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

    it("debería fallar al cambiar tipo a ENERGICO en update si contiene productos SINERGICOS", async () => {
      const { mockPaqueteBaseProductoFindMany, mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseProductoFindMany.mockResolvedValue([{ productoId: 10 }]);
      mockProductoFindMany.mockResolvedValueOnce([{ id_producto: 10, nombre: "Prod Sinergico", tipo: "SINERGICO", archivado: false }]);

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
      const { mockPaqueteBaseProductoFindMany, mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseProductoFindMany.mockResolvedValue([{ productoId: 11 }]);
      mockProductoFindMany.mockResolvedValueOnce([{ id_producto: 11, nombre: "Prod Energico", tipo: "ENERGICO", archivado: false }]);

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

  describe("duplicar", () => {
    it("debería duplicar un paquete base con marcaId asignada", async () => {
      const {
        mockPaqueteBaseFindUnique,
        mockPaqueteBaseCreate,
        mockPaqueteBaseProductoCreateMany,
      } = require("../../../src/prisma/client").__mocks;

      const paqueteOriginalMock = {
        id_paquete_base: 1,
        nombre: "Original",
        descripcion: "Desc",
        imagen_url: "url",
        categoria_id: 2,
        marcaId: 3,
        tipo: "SINERGICO",
        productos: [{ productoId: 10 }, { productoId: 20 }],
      };

      mockPaqueteBaseFindUnique.mockResolvedValueOnce(paqueteOriginalMock);

      const result = await service.duplicar(1);

      expect(result).toHaveProperty("id_paquete_base", 1);
      expect(mockPaqueteBaseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: "Original (Copia)",
            categoria: { connect: { id_categoria: 2 } },
            marca: { connect: { id_marca: 3 } },
          }),
        })
      );
      expect(mockPaqueteBaseProductoCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            { productoId: 10, paqueteBaseId: 1 },
            { productoId: 20, paqueteBaseId: 1 },
          ],
        })
      );
    });

    it("debería duplicar un paquete base sin marcaId asignada (marcaId es null)", async () => {
      const {
        mockPaqueteBaseFindUnique,
        mockPaqueteBaseCreate,
      } = require("../../../src/prisma/client").__mocks;

      const paqueteOriginalMock = {
        id_paquete_base: 1,
        nombre: "Original",
        descripcion: "Desc",
        imagen_url: "url",
        categoria_id: 2,
        marcaId: null,
        tipo: "SINERGICO",
        productos: [],
      };

      mockPaqueteBaseFindUnique.mockResolvedValueOnce(paqueteOriginalMock);

      const result = await service.duplicar(1);

      expect(result).toHaveProperty("id_paquete_base", 1);
      expect(mockPaqueteBaseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: "Original (Copia)",
            categoria: { connect: { id_categoria: 2 } },
          }),
        })
      );
      const calls = mockPaqueteBaseCreate.mock.calls;
      const lastCallData = calls[calls.length - 1][0].data;
      expect(lastCallData.marca).toBeUndefined();
    });

    it("debería lanzar un error si el paquete original no existe al duplicar", async () => {
      const { mockPaqueteBaseFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseFindUnique.mockResolvedValueOnce(null);

      await expect(service.duplicar(999)).rejects.toThrow("Paquete con id=999 no encontrado");
    });
  });
});
