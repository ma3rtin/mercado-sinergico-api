import { ProductoService } from "../../../src/services/producto.service";
import { ProductoDTO } from "../../../src/dtos/producto/producto.dto";
import { TipoPaquete } from "@prisma/client";
import { Prisma } from "@prisma/client";

jest.mock("../../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockProductoFindMany = jest.fn();
  const mockProductoFindUnique = jest.fn();
  const mockProductoCreate = jest.fn();
  const mockProductoUpdate = jest.fn();
  const mockProductoDelete = jest.fn();
  const mockProductoCount = jest.fn();
  const mockCategoriaFindUnique = jest.fn();
  const mockMarcaFindUnique = jest.fn();
  const mockPlantillaFindUnique = jest.fn();
  const mockPaqueteBaseProductoDeleteMany = jest.fn();
  const mockProductoImagenDeleteMany = jest.fn();
  const mockProductoVarianteDeleteMany = jest.fn();
  const mockProductoVarianteOpcionCreateMany = jest.fn();
  const mockProductoVarianteCreateMany = jest.fn();
  const mockProductoVarianteFindMany = jest.fn();


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
            count: mockProductoCount,
          },
          categoria: { findUnique: mockCategoriaFindUnique },
          marca: { findUnique: mockMarcaFindUnique },
          plantilla: { findUnique: mockPlantillaFindUnique },
          paqueteBaseProducto: { deleteMany: mockPaqueteBaseProductoDeleteMany },
          productoImagen: { deleteMany: mockProductoImagenDeleteMany },
          productoVariante: {
            createMany: mockProductoVarianteCreateMany,
            findMany: mockProductoVarianteFindMany,
            deleteMany: mockProductoVarianteDeleteMany,
          },
          productoVarianteOpcion: { createMany: mockProductoVarianteOpcionCreateMany },
        };
        return callback(tx);
      }),
      producto: {
        findMany: mockProductoFindMany,
        findUnique: mockProductoFindUnique,
        create: mockProductoCreate,
        update: mockProductoUpdate,
        delete: mockProductoDelete,
        count: mockProductoCount,
      },
      categoria: { findUnique: mockCategoriaFindUnique },
      marca: { findUnique: mockMarcaFindUnique },
      plantilla: { findUnique: mockPlantillaFindUnique },
      paqueteBaseProducto: { deleteMany: mockPaqueteBaseProductoDeleteMany },
      productoImagen: { deleteMany: mockProductoImagenDeleteMany },
      productoVariante: {
        createMany: mockProductoVarianteCreateMany,
        findMany: mockProductoVarianteFindMany,
        deleteMany: mockProductoVarianteDeleteMany,
      },
      productoVarianteOpcion: { createMany: mockProductoVarianteOpcionCreateMany },
    },
    __mocks: {
      mockTransaction,
      mockProductoFindMany,
      mockProductoFindUnique,
      mockProductoCreate,
      mockProductoUpdate,
      mockProductoDelete,
      mockProductoCount,
      mockCategoriaFindUnique,
      mockMarcaFindUnique,
      mockPlantillaFindUnique,
      mockPaqueteBaseProductoDeleteMany,
      mockProductoImagenDeleteMany,
      mockProductoVarianteDeleteMany,
      mockProductoVarianteCreateMany,
      mockProductoVarianteFindMany,
      mockProductoVarianteOpcionCreateMany,
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
      mockProductoCount,
      mockCategoriaFindUnique,
      mockMarcaFindUnique,
      mockPlantillaFindUnique,
      mockPaqueteBaseProductoDeleteMany,
      mockProductoImagenDeleteMany,
      mockProductoVarianteCreateMany,
      mockProductoVarianteFindMany,
      mockProductoVarianteOpcionCreateMany,
    } = require("../../../src/prisma/client").__mocks;

    // mocks por defecto
    mockCategoriaFindUnique.mockResolvedValue({ id_categoria: 1, nombre: "Categoria Test" });
    mockMarcaFindUnique.mockResolvedValue({ id_marca: 1, nombre: "Marca Test" });
    mockProductoFindMany.mockResolvedValue([]);
    mockProductoFindUnique.mockResolvedValue(null);
    mockProductoCreate.mockResolvedValue({});
    mockProductoUpdate.mockResolvedValue({});
    mockProductoDelete.mockResolvedValue({});
    mockProductoCount.mockResolvedValue(0);
    mockPaqueteBaseProductoDeleteMany.mockResolvedValue({ count: 0 });
    mockProductoImagenDeleteMany.mockResolvedValue({ count: 0 });
    mockPlantillaFindUnique.mockResolvedValue(null);
    mockProductoVarianteCreateMany.mockResolvedValue({ count: 0 });
    mockProductoVarianteFindMany.mockResolvedValue([]);
    mockProductoVarianteOpcionCreateMany.mockResolvedValue({ count: 0 });
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

    it("debería pasar skip y take a prisma para la paginación", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, 10, 5);
      expect(mockProductoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
    });

    it("debería aplicar filtros de categorías, marcas, precios y tipo de producto", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, 0, 10, false, [1, 2], [3], 100, 500);
      expect(mockProductoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoria_id: { in: [1, 2] },
            marca_id: { in: [3] },
            precio: { gte: 100, lte: 500 },
          }),
        })
      );
    });
  });

  describe("countAll", () => {
    it("debería llamar a prisma.producto.count con los filtros indicados", async () => {
      const { mockProductoCount } = require("../../../src/prisma/client").__mocks;
      await service.countAll(undefined, false, [1, 2], [3], 100, 500);
      expect(mockProductoCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            archivado: false,
            categoria_id: { in: [1, 2] },
            marca_id: { in: [3] },
            precio: { gte: 100, lte: 500 },
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

      const {
        mockProductoCreate,
        mockProductoFindUnique,
      } = require("../../../src/prisma/client").__mocks;
      mockProductoCreate.mockResolvedValue({ id_producto: 1, ...dto });
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, ...dto });

      const result = await service.create(dto);
      expect(result).toHaveProperty("id_producto");
      expect(result.nombre).toBe("Producto Test");
    });

    it("debería generar las variantes con createMany (batch) en vez de un create por combinación", async () => {
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
        plantillaId: 1,
        opcionesDisponibles: { "11": [1, 2], "12": [3, 4] },
      };

      const productoConPlantilla = {
        id_producto: 56,
        nombre: "Producto Test",
        tipo: "SINERGICO",
        plantilla: {
          id: 1,
          caracteristicas: [
            { id: 11, nombre: "Talle", opciones: [{ id: 1 }, { id: 2 }] },
            { id: 12, nombre: "Color", opciones: [{ id: 3 }, { id: 4 }] },
          ],
        },
      };

      const {
        mockProductoCreate,
        mockProductoFindUnique,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
        mockProductoVarianteOpcionCreateMany,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoCreate.mockResolvedValue({ id_producto: 56, ...dto });
      mockProductoFindUnique.mockResolvedValue(productoConPlantilla);
      mockProductoVarianteCreateMany.mockResolvedValue({ count: 4 });
      mockProductoVarianteFindMany.mockResolvedValue([
        { id: 1, sku: "PRODUCTO-T-56-1-3" },
        { id: 2, sku: "PRODUCTO-T-56-1-4" },
        { id: 3, sku: "PRODUCTO-T-56-2-3" },
        { id: 4, sku: "PRODUCTO-T-56-2-4" },
      ]);
      mockProductoVarianteOpcionCreateMany.mockResolvedValue({ count: 8 });

      await service.create(dto);

      expect(mockProductoVarianteCreateMany).toHaveBeenCalledTimes(1);
      expect(mockProductoVarianteCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            productoId: 56,
            sku: "PRODUCTO-T-56-1-3",
            stockFisico: null,
            precioExtra: 0,
            activo: true,
          }),
        ]),
      });

      expect(mockProductoVarianteFindMany).toHaveBeenCalledTimes(1);
      expect(mockProductoVarianteFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productoId: 56,
            sku: { in: expect.arrayContaining([
              "PRODUCTO-T-56-1-3",
              "PRODUCTO-T-56-1-4",
              "PRODUCTO-T-56-2-3",
              "PRODUCTO-T-56-2-4",
            ]) },
          }),
        })
      );

      expect(mockProductoVarianteOpcionCreateMany).toHaveBeenCalledTimes(1);
      const opcionesData =
        mockProductoVarianteOpcionCreateMany.mock.calls[0][0].data;
      expect(opcionesData).toHaveLength(8);
      expect(opcionesData).toEqual(
        expect.arrayContaining([
          { varianteId: 1, caracteristicaId: 11, opcionId: 1 },
          { varianteId: 1, caracteristicaId: 12, opcionId: 3 },
          { varianteId: 4, caracteristicaId: 11, opcionId: 2 },
          { varianteId: 4, caracteristicaId: 12, opcionId: 4 },
        ])
      );
    });

    it("debería traducir el conflicto de SKU (P2002) a un CustomError 409", async () => {
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
        plantillaId: 1,
        opcionesDisponibles: { "11": [1, 2], "12": [3, 4] },
      };

      const {
        mockProductoCreate,
        mockProductoFindUnique,
        mockProductoVarianteCreateMany,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoCreate.mockResolvedValue({ id_producto: 56, ...dto });
      mockProductoFindUnique.mockResolvedValue({
        id_producto: 56,
        nombre: "Producto Test",
        plantilla: {
          id: 1,
          caracteristicas: [
            { id: 11, nombre: "Talle", opciones: [{ id: 1 }, { id: 2 }] },
            { id: 12, nombre: "Color", opciones: [{ id: 3 }, { id: 4 }] },
          ],
        },
      });
      mockProductoVarianteCreateMany.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed on the fields: (`sku`)",
          { code: "P2002", clientVersion: "7.0.0" }
        )
      );

      await expect(service.create(dto)).rejects.toMatchObject({
        status: 409,
        message: expect.stringContaining("SKU"),
      });
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

  describe("create - guard de variantes existentes", () => {
    it("debería lanzar CustomError 409 si el producto ya tiene variantes y se regeneran", async () => {
      const {
        mockProductoCreate,
        mockProductoFindUnique,
        mockProductoVarianteCount,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoCreate.mockResolvedValue({ id_producto: 5 });
      mockProductoFindUnique.mockResolvedValue({
        id_producto: 5,
        nombre: "Producto Con Plantilla",
        plantilla: { id: 1, nombre: "T", caracteristicas: [] },
      });
      mockProductoVarianteCount.mockResolvedValue(2);

      const dto: ProductoDTO = {
        nombre: "Producto Con Plantilla",
        descripcion: "Desc",
        precio: 100,
        marca_id: 1,
        categoria_id: 1,
        plantillaId: 1,
        tipo: TipoPaquete.SINERGICO,
        opcionesDisponibles: { "10": [101] },
      };

      await expect(service.create(dto)).rejects.toMatchObject({
        status: 409,
        message: expect.stringContaining("ya tiene variantes generadas"),
      });
    });
  });

  describe("duplicarProducto", () => {
    it("debería lanzar CustomError 409 si un SKU -COPIA ya existe (P2002)", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteCreate,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoFindUnique.mockResolvedValue({
        id_producto: 1,
        nombre: "Producto Original",
        descripcion: "Desc",
        precio: 100,
        peso: 1,
        altura: 1,
        ancho: 1,
        profundidad: 1,
        stock: null,
        tipo: "SINERGICO",
        imagen_url: null,
        plantillaId: null,
        categoria_id: 1,
        marca_id: 1,
        imagenes: [],
        variantes: [
          { id: 10, sku: "ABC-1-1", stockFisico: null, precioExtra: 0, activo: true, opciones: [] },
        ],
      });
      mockProductoVarianteCreate.mockRejectedValue({ code: "P2002" });

      await expect(service.duplicarProducto(1)).rejects.toMatchObject({
        status: 409,
        message:
          "No se puede duplicar: ya existe una variante con ese SKU. Cambiá el SKU de la variante original antes de volver a duplicar.",
      });
    });

    it("debería duplicar un producto sin variantes correctamente", async () => {
      const {
        mockProductoFindUnique,
        mockProductoCreate,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoFindUnique.mockResolvedValue({
        id_producto: 1,
        nombre: "Producto Original",
        descripcion: "Desc",
        precio: 100,
        peso: null,
        altura: null,
        ancho: null,
        profundidad: null,
        stock: null,
        tipo: "SINERGICO",
        imagen_url: null,
        plantillaId: null,
        categoria_id: 1,
        marca_id: 1,
        imagenes: [],
        variantes: [],
      });
      mockProductoCreate.mockResolvedValue({ id_producto: 2 });

      const result = await service.duplicarProducto(1);
      expect(result).toBeTruthy();
    });
  });
});
