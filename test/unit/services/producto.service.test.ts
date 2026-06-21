import { ProductoService } from "../../../src/services/producto.service";
import { ProductoDTO } from "../../../src/dtos/producto/producto.dto";

jest.mock("../../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockProductoFindMany = jest.fn();
  const mockProductoFindUnique = jest.fn();
  const mockProductoCreate = jest.fn();
  const mockProductoUpdate = jest.fn();
  const mockProductoDelete = jest.fn();
  const mockCategoriaFindUnique = jest.fn();
  const mockMarcaFindUnique = jest.fn();
  const mockPlantillaFindUnique = jest.fn();
  const mockPaqueteBaseProductoDeleteMany = jest.fn();
  const mockProductoImagenDeleteMany = jest.fn();
  const mockProductoVarianteDeleteMany = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          producto: {
            findMany: mockProductoFindMany,
            findUnique: mockProductoFindUnique,
            create: mockProductoCreate,
            update: mockProductoUpdate,
            delete: mockProductoDelete,
          },
          categoria: { findUnique: mockCategoriaFindUnique },
          marca: { findUnique: mockMarcaFindUnique },
          plantilla: { findUnique: mockPlantillaFindUnique },
          paqueteBaseProducto: { deleteMany: mockPaqueteBaseProductoDeleteMany },
          productoImagen: { deleteMany: mockProductoImagenDeleteMany },
          productoVariante: { deleteMany: mockProductoVarianteDeleteMany },
        };
        return callback(tx);
      }),
      producto: {
        findMany: mockProductoFindMany,
        findUnique: mockProductoFindUnique,
        create: mockProductoCreate,
        update: mockProductoUpdate,
        delete: mockProductoDelete,
      },
      categoria: { findUnique: mockCategoriaFindUnique },
      marca: { findUnique: mockMarcaFindUnique },
      plantilla: { findUnique: mockPlantillaFindUnique },
      paqueteBaseProducto: { deleteMany: mockPaqueteBaseProductoDeleteMany },
      productoImagen: { deleteMany: mockProductoImagenDeleteMany },
      productoVariante: { deleteMany: mockProductoVarianteDeleteMany },
    },
    __mocks: {
      mockTransaction,
      mockProductoFindMany,
      mockProductoFindUnique,
      mockProductoCreate,
      mockProductoUpdate,
      mockProductoDelete,
      mockCategoriaFindUnique,
      mockMarcaFindUnique,
      mockPlantillaFindUnique,
      mockPaqueteBaseProductoDeleteMany,
      mockProductoImagenDeleteMany,
      mockProductoVarianteDeleteMany,
    },
  };
});

describe("ProductoService", () => {
  let service: ProductoService;

  beforeEach(() => {
    service = new ProductoService();
    jest.clearAllMocks();

    const {
      mockProductoFindMany,
      mockProductoFindUnique,
      mockProductoCreate,
      mockProductoUpdate,
      mockProductoDelete,
      mockCategoriaFindUnique,
      mockMarcaFindUnique,
      mockPlantillaFindUnique,
      mockPaqueteBaseProductoDeleteMany,
      mockProductoImagenDeleteMany,
    } = require("../../../src/prisma/client").__mocks;

    // mocks por defecto
    mockCategoriaFindUnique.mockResolvedValue({ id_categoria: 1, nombre: "Categoria Test" });
    mockMarcaFindUnique.mockResolvedValue({ id_marca: 1, nombre: "Marca Test" });
    mockProductoFindMany.mockResolvedValue([]);
    mockProductoFindUnique.mockResolvedValue(null);
    mockProductoCreate.mockResolvedValue({});
    mockProductoUpdate.mockResolvedValue({});
    mockProductoDelete.mockResolvedValue({});
    mockPaqueteBaseProductoDeleteMany.mockResolvedValue({ count: 0 });
    mockProductoImagenDeleteMany.mockResolvedValue({ count: 0 });
    mockPlantillaFindUnique.mockResolvedValue(null);
  });

  describe("getAll", () => {
    it("debería retornar array vacío por defecto", async () => {
      const resultado = await service.getAll();
      expect(resultado).toEqual([]);
    });

    it("debería filtrar por archivado = false por defecto", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll();
      expect(mockProductoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            archivado: false,
          }),
        })
      );
    });

    it("debería no filtrar por archivado cuando includeArchived es true", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, 0, 10, true);
      expect(mockProductoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            archivado: false,
          }),
        })
      );
    });
  });

  describe("create", () => {
    it("debería crear un producto básico", async () => {
      const dto: ProductoDTO = {
        nombre: "Producto Test",
        descripcion: "Desc",
        precio: 100,
        marca_id: 1,
        peso: 1,
        altura: 10,
        ancho: 10,
        profundidad: 10,
        categoria_id: 1,
      };

      const { mockProductoCreate } = require("../../../src/prisma/client").__mocks;
      mockProductoCreate.mockResolvedValue({ id_producto: 1, ...dto });

      const result = await service.create(dto);
      expect(result).toHaveProperty("id_producto");
      expect(result.nombre).toBe("Producto Test");
    });
  });

  describe("update", () => {
    it("debería actualizar un producto", async () => {
      const dto: ProductoDTO = { nombre: "Updated", descripcion: "Desc", precio: 100, marca_id: 1, peso: 1, altura: 1, ancho: 1, profundidad: 1, categoria_id: 1 };
      const { mockProductoUpdate } = require("../../../src/prisma/client").__mocks;
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dto });

      const result = await service.update(1, dto);
      expect(result.nombre).toBe("Updated");
    });
  });

  describe("delete", () => {
    it("debería archivar el producto al intentar eliminarlo", async () => {
      const { 
        mockProductoFindUnique,
        mockProductoUpdate,
      } = require("../../../src/prisma/client").__mocks;
      
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, nombre: "Test Product", archivado: false });
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, nombre: "Test Product", archivado: true });

      const result = await service.delete(1);
      expect(result.archivado).toBe(true);
      expect(mockProductoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_producto: 1 },
          data: { archivado: true },
        })
      );
    });
  });

  describe("archivar", () => {
    it("debería actualizar archivado a true", async () => {
      const { 
        mockProductoFindUnique,
        mockProductoUpdate,
      } = require("../../../src/prisma/client").__mocks;
      
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, nombre: "Test Product", archivado: false });
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, nombre: "Test Product", archivado: true });

      const result = await service.archivar(1, true);
      expect(result.archivado).toBe(true);
      expect(mockProductoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_producto: 1 },
          data: { archivado: true },
        })
      );
    });

    it("debería lanzar error si el producto no existe", async () => {
      const { mockProductoFindUnique } = require("../../../src/prisma/client").__mocks;
      mockProductoFindUnique.mockResolvedValue(null);

      await expect(service.archivar(99, true)).rejects.toThrow("Producto no encontrado");
    });
  });
});
