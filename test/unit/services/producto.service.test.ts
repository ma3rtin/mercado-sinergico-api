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
  const mockProductoImagenCreateMany = jest.fn();
  const mockProductoVarianteDeleteMany = jest.fn();
  const mockProductoVarianteOpcionCreateMany = jest.fn();
  const mockProductoVarianteCreate = jest.fn();
  const mockProductoVarianteCount = jest.fn();
  const mockProductoVarianteCreateMany = jest.fn();
  const mockProductoVarianteFindMany = jest.fn();
  const mockPedidoDetalleCount = jest.fn();
  const mockTxPedidoDetalleCount = jest.fn();
  const mockTxQueryRaw = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: mockTxQueryRaw,
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
          productoImagen: { deleteMany: mockProductoImagenDeleteMany, createMany: mockProductoImagenCreateMany },
          productoVariante: {
            create: mockProductoVarianteCreate,
            count: mockProductoVarianteCount,
            createMany: mockProductoVarianteCreateMany,
            findMany: mockProductoVarianteFindMany,
            deleteMany: mockProductoVarianteDeleteMany,
          },
          productoVarianteOpcion: { createMany: mockProductoVarianteOpcionCreateMany },
          // Mock propio, distinto del de prisma.pedidoDetalle: así los tests
          // pueden verificar que el chequeo de pedidos corre con el cliente
          // de la transacción y no con el cliente normal.
          pedidoDetalle: { count: mockTxPedidoDetalleCount },
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
      productoImagen: { deleteMany: mockProductoImagenDeleteMany, createMany: mockProductoImagenCreateMany },
      productoVariante: {
        create: mockProductoVarianteCreate,
        count: mockProductoVarianteCount,
        createMany: mockProductoVarianteCreateMany,
        findMany: mockProductoVarianteFindMany,
        deleteMany: mockProductoVarianteDeleteMany,
      },
      productoVarianteOpcion: { createMany: mockProductoVarianteOpcionCreateMany },
      pedidoDetalle: { count: mockPedidoDetalleCount },
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
      mockProductoImagenCreateMany,
      mockProductoVarianteDeleteMany,
      mockProductoVarianteCreate,
      mockProductoVarianteCount,
      mockProductoVarianteCreateMany,
      mockProductoVarianteFindMany,
      mockProductoVarianteOpcionCreateMany,
      mockPedidoDetalleCount,
      mockTxPedidoDetalleCount,
      mockTxQueryRaw,
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
      mockProductoImagenCreateMany,
      mockProductoVarianteCreate,
      mockProductoVarianteCount,
      mockProductoVarianteCreateMany,
      mockProductoVarianteFindMany,
      mockProductoVarianteOpcionCreateMany,
      mockPedidoDetalleCount,
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
      mockProductoImagenCreateMany.mockResolvedValue({ count: 0 });
    mockPlantillaFindUnique.mockResolvedValue(null);
    mockProductoVarianteCreate.mockResolvedValue({});
    mockProductoVarianteCount.mockResolvedValue(0);
    mockProductoVarianteCreateMany.mockResolvedValue({ count: 0 });
    mockProductoVarianteFindMany.mockResolvedValue([]);
    mockProductoVarianteOpcionCreateMany.mockResolvedValue({ count: 0 });
    mockPedidoDetalleCount.mockResolvedValue(0);
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

    it("ya no envía skip/take a prisma (la paginación se resuelve en memoria para poder ordenar por cantPaquetes)", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockProductoFindMany.mockResolvedValue([]);
      await service.getAll(undefined, 10, 5);
      const arg = mockProductoFindMany.mock.calls[0][0];
      expect(arg).not.toHaveProperty("skip");
      expect(arg).not.toHaveProperty("take");
    });

    it("ordena por id ascendente cuando no se pide ningún orden", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll();
      expect(mockProductoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ id_producto: "asc" }] })
      );
    });

    it.each([
      ["recientes", { createdAt: "desc" }],
      ["a-z", { nombre: "asc" }],
      ["z-a", { nombre: "desc" }],
      ["precio-asc", { precio: "asc" }],
      ["precio-desc", { precio: "desc" }],
      ["mas-stock", { stock: "desc" }],
    ])("traduce el orden '%s' a la cláusula de prisma correcta", async (orden, esperado) => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, 0, 10, false, undefined, undefined, undefined, undefined, undefined, orden as string);
      expect(mockProductoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [esperado, { id_producto: "asc" }] })
      );
    });

    it("agrega el id como desempate para que la paginación sea estable", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, 0, 10, false, undefined, undefined, undefined, undefined, undefined, "precio-asc");
      const orderBy = mockProductoFindMany.mock.calls[0][0].orderBy;
      expect(orderBy).toHaveLength(2);
      expect(orderBy[1]).toEqual({ id_producto: "asc" });
    });

    it("cae al orden por defecto si el valor es desconocido", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, 0, 10, false, undefined, undefined, undefined, undefined, undefined, "no-existe");
      expect(mockProductoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ id_producto: "asc" }] })
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

    it("debería pedir el conteo de paquetes publicados activos en el include", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, 0, 10);
      const arg = mockProductoFindMany.mock.calls[0][0];
      expect(arg.include.paquetes.select.paqueteBase.select._count.select.publicados).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({
            estadoId: 1,
            archivado: false,
            fecha_fin: { gte: expect.any(Date) },
          }),
        })
      );
    });

    it("debería mapear cantPaquetes contando paquetes publicados activos únicos por base", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockProductoFindMany.mockResolvedValue([
        {
          id_producto: 1,
          nombre: "Sin paquetes",
          precio: 100,
          tipo: "SINERGICO",
          stock: null,
          imagen_url: null,
          plantillaId: null,
          archivado: false,
          paquetes: [],
        },
        {
          id_producto: 2,
          nombre: "Con dos bases",
          precio: 200,
          tipo: "SINERGICO",
          stock: null,
          imagen_url: null,
          plantillaId: null,
          archivado: false,
          paquetes: [
            {
              paqueteBase: {
                id_paquete_base: 10,
                _count: { publicados: 2 },
              },
            },
            {
              // Misma base repetida en otro PaqueteBaseProducto: no debe sumar de nuevo
              paqueteBase: {
                id_paquete_base: 10,
                _count: { publicados: 2 },
              },
            },
            {
              paqueteBase: {
                id_paquete_base: 11,
                _count: { publicados: 1 },
              },
            },
          ],
        },
      ]);

      const resultado = await service.getAll(undefined, 0, 10);
      expect(resultado).toHaveLength(2);
      // El sort agrupa primero los que tienen paquetes activos
      expect(resultado[0]).toHaveProperty("cantPaquetes", 3);
      expect(resultado[1]).toHaveProperty("cantPaquetes", 0);
    });

    it("ordena en memoria: productos con paquetes activos primero, luego los sin paquetes", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockProductoFindMany.mockResolvedValue([
        {
          id_producto: 1, nombre: "Sin paquetes", precio: 10, tipo: "SINERGICO",
          stock: null, imagen_url: null, plantillaId: null, archivado: false, paquetes: [],
        },
        {
          id_producto: 2, nombre: "Un paquete", precio: 20, tipo: "SINERGICO",
          stock: null, imagen_url: null, plantillaId: null, archivado: false,
          paquetes: [{ paqueteBase: { id_paquete_base: 10, _count: { publicados: 1 } } }],
        },
        {
          id_producto: 3, nombre: "Sin paquetes 2", precio: 30, tipo: "SINERGICO",
          stock: null, imagen_url: null, plantillaId: null, archivado: false, paquetes: [],
        },
        {
          id_producto: 4, nombre: "Dos paquetes", precio: 40, tipo: "SINERGICO",
          stock: null, imagen_url: null, plantillaId: null, archivado: false,
          paquetes: [{ paqueteBase: { id_paquete_base: 11, _count: { publicados: 2 } } }],
        },
      ]);

      const resultado = await service.getAll(undefined, undefined, undefined);
      // Los que tienen paquetes (2 y 4) primero, y entre los sin paquetes se
      // conserva el orden original (estable): 1 antes de 3.
      expect(resultado.map((r) => [r.id as number, r.cantPaquetes])).toEqual([
        [4, 2],
        [2, 1],
        [1, 0],
        [3, 0],
      ]);
    });

    it("aplica la paginación en memoria sobre el set ya ordenado por paquetes", async () => {
      const { mockProductoFindMany } = require("../../../src/prisma/client").__mocks;
      mockProductoFindMany.mockResolvedValue([
        {
          id_producto: 1, nombre: "A-sin", precio: 10, tipo: "SINERGICO",
          stock: null, imagen_url: null, plantillaId: null, archivado: false, paquetes: [],
        },
        {
          id_producto: 2, nombre: "B-con", precio: 20, tipo: "SINERGICO",
          stock: null, imagen_url: null, plantillaId: null, archivado: false,
          paquetes: [{ paqueteBase: { id_paquete_base: 10, _count: { publicados: 1 } } }],
        },
        {
          id_producto: 3, nombre: "C-sin", precio: 30, tipo: "SINERGICO",
          stock: null, imagen_url: null, plantillaId: null, archivado: false, paquetes: [],
        },
      ]);

      // Página 2 (skip=1, take=1): sobre el set ordenado [con(2), sin(1), sin(3)],
      // debería devolver solo el del medio (2 ya consumido por la página 1).
      const resultado = await service.getAll(undefined, 1, 1);
      expect(resultado.map((r) => r.id as number)).toEqual([1]);
      expect(resultado[0]).toHaveProperty("cantPaquetes", 0);
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

      // 1 lookup por SKU para mapear id de variante, + 1 refetch final con
      // includes (opciones/característica) para la respuesta.
      expect(mockProductoVarianteFindMany).toHaveBeenCalledTimes(2);
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
    const dtoBase: ProductoDTO = {
      nombre: "Updated",
      descripcion: "Desc",
      precio: 100,
      marca_id: 1,
      peso: 1,
      altura: 1,
      ancho: 1,
      profundidad: 1,
      categoria_id: 1,
    };

    it("debería actualizar un producto sin plantillaId (campo no enviado)", async () => {
      const {
        mockProductoFindUnique,
        mockProductoUpdate,
        mockProductoVarianteDeleteMany,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: null }]);
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, plantillaId: null, plantilla: null, ...dtoBase });
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dtoBase });

      const result = await service.update(1, dtoBase);

      expect(result.nombre).toBe("Updated");
      expect(mockProductoVarianteDeleteMany).not.toHaveBeenCalled();
      // Cubre una regresión silenciosa del fix de la condición de carrera:
      // si alguien vuelve a leer plantillaId con un findUnique común en vez
      // del SELECT ... FOR UPDATE, este mock ya no se llamaría y ningún otro
      // assert de este archivo lo notaría (solo les importa el valor que
      // devuelve, no cómo se obtuvo).
      expect(mockTxQueryRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("FOR UPDATE")]),
        1
      );
    });

    it("debería rechazar con 404 si el producto no existe (lock de fila sin resultado)", async () => {
      const { mockTxQueryRaw } = require("../../../src/prisma/client").__mocks;
      mockTxQueryRaw.mockResolvedValue([]);

      await expect(service.update(999, dtoBase)).rejects.toMatchObject({
        status: 404,
        message: expect.stringContaining("no encontrado"),
      });
    });

    it("debería borrar las variantes existentes al cambiar de plantilla si no tienen pedidos", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteCount,
        mockTxPedidoDetalleCount,
        mockProductoVarianteDeleteMany,
        mockProductoUpdate,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;
      const plantilla = { id: 2, caracteristicas: [{ id: 1, opciones: [{ id: 1 }] }] };
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: 1 }]);
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, nombre: "Updated", tipo: "SINERGICO", plantilla });
      mockProductoVarianteCount
        .mockResolvedValueOnce(2) // variantes existentes antes del borrado
        .mockResolvedValueOnce(0); // conteo post-borrado, habilita la regeneración
      mockTxPedidoDetalleCount.mockResolvedValue(0);
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dtoBase });
      mockProductoVarianteCreateMany.mockResolvedValue({ count: 1 });
      mockProductoVarianteFindMany.mockResolvedValue([{ id: 1, sku: "UPDATED-1-1" }]);

      await service.update(1, { ...dtoBase, plantillaId: 2, opcionesDisponibles: { "1": [1] } });

      expect(mockProductoVarianteDeleteMany).toHaveBeenCalledWith({
        where: { productoId: 1 },
      });
      expect(mockProductoUpdate).toHaveBeenCalled();
    });

    it("debería rechazar con 409 el cambio de plantilla si las variantes tienen pedidos", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteCount,
        mockTxPedidoDetalleCount,
        mockProductoVarianteDeleteMany,
        mockProductoUpdate,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: 1 }]);
      mockProductoVarianteCount.mockResolvedValue(2);
      mockTxPedidoDetalleCount.mockResolvedValue(1);

      await expect(
        service.update(1, { ...dtoBase, plantillaId: 2, opcionesDisponibles: { "1": [1] } })
      ).rejects.toMatchObject({
        status: 409,
        message: expect.stringContaining("pedidos asociados"),
      });

      expect(mockProductoVarianteDeleteMany).not.toHaveBeenCalled();
      expect(mockProductoUpdate).not.toHaveBeenCalled();
    });

    it("debería permitir cambiar de plantilla sin mandar opcionesDisponibles (las variantes se generan después, en un segundo request)", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteCount,
        mockProductoUpdate,
        mockProductoVarianteCreateMany,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: 1 }]);
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, plantillaId: 1, plantilla: null, ...dtoBase });
      mockProductoVarianteCount.mockResolvedValue(0);
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dtoBase });

      const result = await service.update(1, { ...dtoBase, plantillaId: 2 });

      expect(result.id_producto).toBe(1);
      expect(mockProductoUpdate).toHaveBeenCalled();
      expect(mockProductoVarianteCreateMany).not.toHaveBeenCalled();
    });

    it("debería permitir cambiar de plantilla sin borrar nada si no hay variantes generadas", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteCount,
        mockProductoVarianteDeleteMany,
        mockProductoUpdate,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;
      const plantilla = { id: 5, caracteristicas: [{ id: 1, opciones: [{ id: 1 }] }] };
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: 8 }]);
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, nombre: "Updated", tipo: "SINERGICO", plantilla });
      mockProductoVarianteCount.mockResolvedValue(0);
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dtoBase });
      mockProductoVarianteCreateMany.mockResolvedValue({ count: 1 });
      mockProductoVarianteFindMany.mockResolvedValue([{ id: 1, sku: "UPDATED-1-1" }]);

      await service.update(1, { ...dtoBase, plantillaId: 5, opcionesDisponibles: { "1": [1] } });

      expect(mockProductoVarianteDeleteMany).not.toHaveBeenCalled();
      expect(mockProductoUpdate).toHaveBeenCalled();
    });

    it("debería rechazar con 409 (no quedar en silencio) si manda opcionesDisponibles con la plantilla sin cambiar y ya hay variantes", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteCount,
        mockProductoUpdate,
        mockProductoVarianteCreateMany,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;
      const plantilla = { id: 8, caracteristicas: [{ id: 1, opciones: [{ id: 1 }] }] };
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: 8 }]);
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, nombre: "Updated", tipo: "SINERGICO", plantilla });
      mockProductoVarianteCount.mockResolvedValue(2); // ya tiene variantes generadas
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dtoBase });

      await expect(
        service.update(1, { ...dtoBase, plantillaId: 8, opcionesDisponibles: { "1": [1] } })
      ).rejects.toMatchObject({
        status: 409,
        message: expect.stringContaining("ya tiene variantes generadas"),
      });

      expect(mockProductoVarianteCreateMany).not.toHaveBeenCalled();
    });

    it("debería mantener la misma plantilla sin disparar borrado (plantillaId igual al actual)", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteDeleteMany,
        mockProductoUpdate,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: 8 }]);
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, plantillaId: 8, plantilla: null, ...dtoBase });
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dtoBase });

      await service.update(1, { ...dtoBase, plantillaId: 8 });

      expect(mockProductoVarianteDeleteMany).not.toHaveBeenCalled();
      expect(mockProductoUpdate).toHaveBeenCalled();
    });

    it("debería tratar null (quitar plantilla) como cambio y validar pedidos", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteCount,
        mockTxPedidoDetalleCount,
        mockProductoVarianteDeleteMany,
        mockProductoUpdate,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: 1 }]);
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, plantillaId: null, plantilla: null, ...dtoBase });
      mockProductoVarianteCount.mockResolvedValue(1);
      mockTxPedidoDetalleCount.mockResolvedValue(0);
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dtoBase });

      await service.update(1, { ...dtoBase, plantillaId: null });

      expect(mockProductoVarianteDeleteMany).toHaveBeenCalledWith({
        where: { productoId: 1 },
      });
      expect(mockProductoUpdate).toHaveBeenCalled();
    });

    it("chequea los pedidos con el cliente de la transacción, no con prisma directo", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteCount,
        mockPedidoDetalleCount,
        mockTxPedidoDetalleCount,
        mockProductoUpdate,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;
      const plantilla = { id: 2, caracteristicas: [{ id: 1, opciones: [{ id: 1 }] }] };
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: 1 }]);
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, nombre: "Updated", tipo: "SINERGICO", plantilla });
      mockProductoVarianteCount
        .mockResolvedValueOnce(2) // variantesExistentes antes del borrado
        .mockResolvedValueOnce(0); // variantesActuales post-borrado
      mockTxPedidoDetalleCount.mockResolvedValue(0);
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dtoBase });
      mockProductoVarianteCreateMany.mockResolvedValue({ count: 1 });
      mockProductoVarianteFindMany.mockResolvedValue([{ id: 1, sku: "UPDATED-1-1" }]);

      await service.update(1, { ...dtoBase, plantillaId: 2, opcionesDisponibles: { "1": [1] } });

      expect(mockTxPedidoDetalleCount).toHaveBeenCalled();
      expect(mockPedidoDetalleCount).not.toHaveBeenCalled();
    });

    it("genera las variantes nuevas dentro de la misma transacción al cambiar de plantilla", async () => {
      const {
        mockProductoFindUnique,
        mockProductoVarianteCount,
        mockProductoUpdate,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
        mockProductoVarianteOpcionCreateMany,
        mockTxQueryRaw,
      } = require("../../../src/prisma/client").__mocks;

      const plantilla = {
        id: 5,
        caracteristicas: [{ id: 1, nombre: "Color", opciones: [{ id: 1 }] }],
      };
      mockTxQueryRaw.mockResolvedValue([{ plantillaId: null }]);
      mockProductoFindUnique.mockResolvedValue({ id_producto: 1, nombre: "Updated", tipo: "SINERGICO", plantilla });
      mockProductoVarianteCount.mockResolvedValue(0);
      mockProductoUpdate.mockResolvedValue({ id_producto: 1, ...dtoBase });
      mockProductoVarianteCreateMany.mockResolvedValue({ count: 1 });
      mockProductoVarianteFindMany.mockResolvedValue([{ id: 1, sku: "UPDATED-1-1" }]);
      mockProductoVarianteOpcionCreateMany.mockResolvedValue({ count: 1 });

      await service.update(1, { ...dtoBase, plantillaId: 5, opcionesDisponibles: { "1": [1] } });

      expect(mockProductoVarianteCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ productoId: 1, sku: "UPDATED-1-1" }),
        ]),
      });
      expect(mockProductoVarianteOpcionCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { varianteId: 1, caracteristicaId: 1, opcionId: 1 },
        ]),
      });
    });
  });

  describe("productoTieneVariantesConPedidos", () => {
    it("debería devolver true si hay pedidos asociados a alguna variante del producto", async () => {
      const { mockPedidoDetalleCount } =
        require("../../../src/prisma/client").__mocks;
      mockPedidoDetalleCount.mockResolvedValue(3);

      const resultado = await service.productoTieneVariantesConPedidos(26);

      expect(resultado).toBe(true);
      expect(mockPedidoDetalleCount).toHaveBeenCalledWith({
        where: { variante: { productoId: 26 } },
      });
    });

    it("debería devolver false si ninguna variante tiene pedidos asociados", async () => {
      const { mockPedidoDetalleCount } =
        require("../../../src/prisma/client").__mocks;
      mockPedidoDetalleCount.mockResolvedValue(0);

      const resultado = await service.productoTieneVariantesConPedidos(26);

      expect(resultado).toBe(false);
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


  describe("duplicarProducto", () => {
    const baseProducto = {
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
    };

    it("debería duplicar un producto sin variantes correctamente", async () => {
      const {
        mockProductoFindUnique,
        mockProductoCreate,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoFindUnique.mockResolvedValue({
        ...baseProducto,
        imagenes: [],
        variantes: [],
      });
      mockProductoCreate.mockResolvedValue({ id_producto: 2 });

      const result = await service.duplicarProducto(1);
      expect(result).toBeTruthy();
      expect(mockProductoVarianteCreateMany).not.toHaveBeenCalled();
      expect(mockProductoVarianteFindMany).not.toHaveBeenCalled();
    });

    it("debería usar createMany batch (no N creates) para variantes", async () => {
      const {
        mockProductoFindUnique,
        mockProductoCreate,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
        mockProductoVarianteOpcionCreateMany,
        mockProductoImagenCreateMany,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoFindUnique.mockResolvedValue({
        ...baseProducto,
        imagenes: [{ id: 1, url: "img.jpg" }],
        variantes: [
          { id: 10, sku: "SKU-A", stockFisico: 5, precioExtra: 10, activo: true, opciones: [
            { caracteristicaId: 1, opcionId: 10 },
            { caracteristicaId: 2, opcionId: 20 },
          ]},
          { id: 11, sku: "SKU-B", stockFisico: null, precioExtra: 0, activo: false, opciones: [
            { caracteristicaId: 1, opcionId: 11 },
          ]},
        ],
      });
      mockProductoCreate.mockResolvedValue({ id_producto: 2 });
      mockProductoVarianteFindMany.mockResolvedValueOnce([
        { id: 20, sku: "SKU-A-COPIA-2" },
        { id: 21, sku: "SKU-B-COPIA-2" },
      ]);
      mockProductoVarianteCreateMany.mockResolvedValue({ count: 2 });
      mockProductoVarianteOpcionCreateMany.mockResolvedValue({ count: 3 });

      await service.duplicarProducto(1);

      expect(mockProductoVarianteCreateMany).toHaveBeenCalledTimes(1);
      expect(mockProductoVarianteCreateMany).toHaveBeenCalledWith({
        data: [
          { productoId: 2, sku: "SKU-A-COPIA-2", stockFisico: 5, precioExtra: 10, activo: true },
          { productoId: 2, sku: "SKU-B-COPIA-2", stockFisico: null, precioExtra: 0, activo: false },
        ],
      });

      // Solo la recuperación de IDs: ya no hay consulta previa de colisiones.
      expect(mockProductoVarianteFindMany).toHaveBeenCalledTimes(1);

      expect(mockProductoVarianteOpcionCreateMany).toHaveBeenCalledTimes(1);
      expect(mockProductoVarianteOpcionCreateMany).toHaveBeenCalledWith({
        data: [
          { varianteId: 20, caracteristicaId: 1, opcionId: 10 },
          { varianteId: 20, caracteristicaId: 2, opcionId: 20 },
          { varianteId: 21, caracteristicaId: 1, opcionId: 11 },
        ],
      });
    });

    it("debería derivar el SKU de la copia del id del producto nuevo", async () => {
      const {
        mockProductoFindUnique,
        mockProductoCreate,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoFindUnique.mockResolvedValue({
        ...baseProducto,
        imagenes: [],
        variantes: [
          { id: 10, sku: "ABC-1-1", stockFisico: null, precioExtra: 0, activo: true, opciones: [] },
        ],
      });
      mockProductoCreate.mockResolvedValue({ id_producto: 47 });
      mockProductoVarianteFindMany.mockResolvedValue([{ id: 20, sku: "ABC-1-1-COPIA-47" }]);
      mockProductoVarianteCreateMany.mockResolvedValue({ count: 1 });

      await service.duplicarProducto(1);

      expect(mockProductoVarianteCreateMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ sku: "ABC-1-1-COPIA-47" })],
      });
    });

    // Es el caso que rompía antes: la resolución de sufijos solo consultaba los
    // "-COPIA", así que a partir de la tercera duplicación repetía "-COPIA-2".
    it("debería dar SKUs distintos al duplicar el mismo original varias veces", async () => {
      const {
        mockProductoFindUnique,
        mockProductoCreate,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoFindUnique.mockResolvedValue({
        ...baseProducto,
        imagenes: [],
        variantes: [
          { id: 10, sku: "ABC-1-1", stockFisico: null, precioExtra: 0, activo: true, opciones: [] },
        ],
      });
      mockProductoVarianteFindMany.mockResolvedValue([{ id: 20, sku: null }]);
      mockProductoVarianteCreateMany.mockResolvedValue({ count: 1 });

      const skus: (string | null)[] = [];
      for (const idNuevo of [2, 3, 4]) {
        mockProductoCreate.mockResolvedValue({ id_producto: idNuevo });
        await service.duplicarProducto(1);
        const { data } = mockProductoVarianteCreateMany.mock.calls.at(-1)![0];
        skus.push(data[0].sku);
      }

      expect(skus).toEqual(["ABC-1-1-COPIA-2", "ABC-1-1-COPIA-3", "ABC-1-1-COPIA-4"]);
      expect(new Set(skus).size).toBe(3);
    });

    it("debería manejar variantes con sku null (sinérgicos) sin intentar dupicar SKU", async () => {
      const {
        mockProductoFindUnique,
        mockProductoCreate,
        mockProductoVarianteCreateMany,
        mockProductoVarianteFindMany,
        mockProductoVarianteOpcionCreateMany,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoFindUnique.mockResolvedValue({
        ...baseProducto,
        imagenes: [],
        variantes: [
          { id: 10, sku: null, stockFisico: null, precioExtra: 0, activo: true, opciones: [
            { caracteristicaId: 1, opcionId: 10 },
          ]},
          { id: 11, sku: null, stockFisico: null, precioExtra: 0, activo: true, opciones: [] },
        ],
      });
      mockProductoCreate.mockResolvedValue({ id_producto: 2 });
      mockProductoVarianteFindMany
        .mockResolvedValueOnce([
          { id: 20, sku: null },
          { id: 21, sku: null },
        ]);
      mockProductoVarianteCreateMany.mockResolvedValue({ count: 2 });
      mockProductoVarianteOpcionCreateMany.mockResolvedValue({ count: 1 });

      await service.duplicarProducto(1);

      expect(mockProductoVarianteCreateMany).toHaveBeenCalledWith({
        data: [
          { productoId: 2, sku: null, stockFisico: null, precioExtra: 0, activo: true },
          { productoId: 2, sku: null, stockFisico: null, precioExtra: 0, activo: true },
        ],
      });

      expect(mockProductoVarianteOpcionCreateMany).toHaveBeenCalledWith({
        data: [
          { varianteId: 20, caracteristicaId: 1, opcionId: 10 },
        ],
      });
    });

    it("debería traducir el conflicto de SKU (P2002) a un CustomError 409 como safety net", async () => {
      const {
        mockProductoFindUnique,
        mockProductoCreate,
        mockProductoVarianteCreateMany,
      } = require("../../../src/prisma/client").__mocks;

      mockProductoFindUnique.mockResolvedValue({
        ...baseProducto,
        imagenes: [],
        variantes: [
          { id: 10, sku: "ABC-1-1", stockFisico: null, precioExtra: 0, activo: true, opciones: [] },
        ],
      });
      mockProductoCreate.mockResolvedValue({ id_producto: 2 });
      mockProductoVarianteCreateMany.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed on the fields: (`sku`)",
          { code: "P2002", clientVersion: "7.0.0" }
        )
      );

      await expect(service.duplicarProducto(1)).rejects.toMatchObject({
        status: 409,
        message:
          "No se puede duplicar: ya existe una variante con ese SKU. Cambiá el SKU de la variante original antes de volver a duplicar.",
      });
    });
  });
});
