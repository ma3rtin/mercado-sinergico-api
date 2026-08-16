import { VarianteService } from "../../../src/services/variante.service";
import { TipoPaquete } from "@prisma/client";

jest.mock("../../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockProductoFindUnique = jest.fn();
  const mockProductoVarianteCreate = jest.fn();
  const mockProductoVarianteCount = jest.fn();
  const mockProductoVarianteFindMany = jest.fn();
  const mockProductoVarianteUpdate = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction.mockImplementation(async (promisesOrCb) => {
        if (typeof promisesOrCb === "function") {
          const tx = {
            productoVariante: {
              update: mockProductoVarianteUpdate,
            },
          };
          return promisesOrCb(tx);
        }
        return Promise.all(promisesOrCb);
      }),
      producto: {
        findUnique: mockProductoFindUnique,
      },
      productoVariante: {
        create: mockProductoVarianteCreate,
        count: mockProductoVarianteCount,
        findMany: mockProductoVarianteFindMany,
        update: mockProductoVarianteUpdate,
      },
    },
    __mocks: {
      mockTransaction,
      mockProductoFindUnique,
      mockProductoVarianteCreate,
      mockProductoVarianteCount,
      mockProductoVarianteFindMany,
      mockProductoVarianteUpdate,
    },
  };
});

function makeProducto(productoId: number, overrides: Partial<any> = {}) {
  return {
    id_producto: productoId,
    nombre: "Producto Super Test",
    tipo: TipoPaquete.SINERGICO,
    plantilla: {
      id: 1,
      nombre: "Plantilla Test",
      caracteristicas: [
        {
          id: 10,
          nombre: "Talle",
          opciones: [
            { id: 101, nombre: "S" },
            { id: 102, nombre: "M" },
          ],
        },
      ],
    },
    ...overrides,
  };
}

describe("VarianteService - generarVariantes", () => {
  let service: VarianteService;
  let mocks: any;

  beforeEach(() => {
    service = new VarianteService();
    jest.clearAllMocks();
    mocks = require("../../../src/prisma/client").__mocks;

    mocks.mockProductoVarianteCount.mockResolvedValue(0);
    mocks.mockProductoVarianteCreate.mockImplementation(({ data }: any) => {
      return Promise.resolve({
        id: Math.floor(Math.random() * 1000),
        ...data,
      });
    });
  });

  it("debería generar variantes con SKU conteniendo el productoId", async () => {
    const productoId = 42;
    const opcionesDisponibles = { "10": [101, 102] };

    mocks.mockProductoFindUnique.mockResolvedValue(makeProducto(productoId));

    const resultado = await service.generarVariantes({
      productoId,
      opcionesDisponibles,
    });

    expect(resultado.variantes).toHaveLength(2);
    expect(resultado.variantes[0].sku).toContain("-42-");
    expect(resultado.variantes[1].sku).toContain("-42-");
    expect(mocks.mockProductoVarianteCreate).toHaveBeenCalledTimes(2);
  });

  describe("guard de idempotencia", () => {
    it("debería generar variantes cuando el producto no tiene variantes previas (count=0)", async () => {
      const productoId = 10;
      mocks.mockProductoFindUnique.mockResolvedValue(makeProducto(productoId));
      mocks.mockProductoVarianteCount.mockResolvedValue(0);

      const resultado = await service.generarVariantes({
        productoId,
        opcionesDisponibles: { "10": [101] },
      });

      expect(resultado.variantes).toHaveLength(1);
      expect(mocks.mockTransaction).toHaveBeenCalled();
    });

    it("debería lanzar CustomError 409 y NO llamar a $transaction cuando ya existen variantes", async () => {
      const productoId = 10;
      mocks.mockProductoFindUnique.mockResolvedValue(makeProducto(productoId));
      mocks.mockProductoVarianteCount.mockResolvedValue(3);

      await expect(
        service.generarVariantes({
          productoId,
          opcionesDisponibles: { "10": [101] },
        })
      ).rejects.toMatchObject({
        status: 409,
        message: expect.stringContaining("ya tiene variantes generadas"),
      });

      expect(mocks.mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe("unicidad de SKU", () => {
    it("debería generar SKUs distintos incluso si los nombres de opciones colisionarían al truncar", async () => {
      const productoId = 50;
      mocks.mockProductoFindUnique.mockResolvedValue({
        ...makeProducto(productoId),
        plantilla: {
          id: 2,
          nombre: "Plantilla CPU",
          caracteristicas: [
            {
              id: 20,
              nombre: "Procesador",
              opciones: [
                { id: 201, nombre: "Intel Core i5" },
                { id: 202, nombre: "Intel Core i7" },
              ],
            },
          ],
        },
      });

      const resultado = await service.generarVariantes({
        productoId,
        opcionesDisponibles: { "20": [201, 202] },
      });

      const skus = resultado.variantes.map((v: any) => v.sku);
      expect(skus).toHaveLength(2);
      expect(new Set(skus).size).toBe(2);

      expect(skus[0]).toContain("201");
      expect(skus[1]).toContain("202");
    });

    it("debería generar SKUs únicos con múltiples características y opciones", async () => {
      const productoId = 60;
      mocks.mockProductoFindUnique.mockResolvedValue({
        ...makeProducto(productoId),
        plantilla: {
          id: 3,
          nombre: "Plantilla Multi",
          caracteristicas: [
            {
              id: 30,
              nombre: "Color",
              opciones: [
                { id: 301, nombre: "Rojo" },
                { id: 302, nombre: "Azul" },
              ],
            },
            {
              id: 31,
              nombre: "Talle",
              opciones: [
                { id: 311, nombre: "S" },
                { id: 312, nombre: "M" },
              ],
            },
          ],
        },
      });

      const resultado = await service.generarVariantes({
        productoId,
        opcionesDisponibles: { "30": [301, 302], "31": [311, 312] },
      });

      const skus = resultado.variantes.map((v: any) => v.sku);
      expect(skus).toHaveLength(4);
      expect(new Set(skus).size).toBe(4);
    });
  });

  describe("formato del SKU", () => {
    it("debería seguir el patrón NOMBRE-productoId-id1-id2-...", async () => {
      const productoId = 70;
      mocks.mockProductoFindUnique.mockResolvedValue({
        ...makeProducto(productoId),
        nombre: "Notebook Lenovo",
        plantilla: {
          id: 4,
          nombre: "Plantilla NB",
          caracteristicas: [
            {
              id: 40,
              nombre: "RAM",
              opciones: [
                { id: 401, nombre: "8GB" },
                { id: 402, nombre: "16GB" },
              ],
            },
            {
              id: 41,
              nombre: "Disco",
              opciones: [
                { id: 411, nombre: "256GB" },
                { id: 412, nombre: "512GB" },
              ],
            },
          ],
        },
      });

      const resultado = await service.generarVariantes({
        productoId,
        opcionesDisponibles: { "40": [401, 402], "41": [411, 412] },
      });

      const skuRegex = /^[A-Z0-9]+(-[A-Z0-9]+)*-\d+-\d+(-\d+)*$/;

      for (const variante of resultado.variantes) {
        expect(variante.sku).toMatch(skuRegex);
      }

      expect(resultado.variantes[0].sku).toMatch(/^NOTEBOOK-/);
    });

    it("debería generar SKU sin doble guión cuando el nombre corta en un espacio", async () => {
      const productoId = 71;
      mocks.mockProductoFindUnique.mockResolvedValue({
        ...makeProducto(productoId),
        nombre: "Casco con aire",
        plantilla: {
          id: 5,
          nombre: "Plantilla Casco",
          caracteristicas: [
            {
              id: 50,
              nombre: "Color",
              opciones: [
                { id: 501, nombre: "Negro" },
                { id: 502, nombre: "Blanco" },
              ],
            },
          ],
        },
      });

      const resultado = await service.generarVariantes({
        productoId,
        opcionesDisponibles: { "50": [501, 502] },
      });

      for (const variante of resultado.variantes) {
        expect(variante.sku).not.toContain("--");
        expect(variante.sku).toMatch(/^CASCO-CON-\d+-\d+$/);
      }
    });
  });

  describe("producto sin plantilla", () => {
    it("debería lanzar CustomError 400 cuando el producto no tiene plantilla", async () => {
      const productoId = 80;
      mocks.mockProductoFindUnique.mockResolvedValue({
        id_producto: productoId,
        nombre: "Sin Plantilla",
        tipo: TipoPaquete.SINERGICO,
        plantilla: null,
      });

      await expect(
        service.generarVariantes({
          productoId,
          opcionesDisponibles: { "10": [101] },
        })
      ).rejects.toMatchObject({
        status: 400,
        message: "El producto no tiene plantilla asignada",
      });
    });
  });
});

describe("actualizarVariante - colisión de SKU", () => {
  let service: VarianteService;
  let mocks: any;

  beforeEach(() => {
    service = new VarianteService();
    jest.clearAllMocks();
    mocks = require("../../../src/prisma/client").__mocks;
  });

  it("debería lanzar CustomError 409 cuando el SKU ya existe (P2002)", async () => {
    mocks.mockProductoVarianteUpdate.mockRejectedValue({ code: "P2002" });

    await expect(
      service.actualizarVariante(1, { sku: "SKU-DUPLICADO" })
    ).rejects.toMatchObject({
      status: 409,
      message: "Ya existe una variante con ese SKU. Elegí un SKU distinto.",
    });
  });

  it("debería actualizar la variante sin colisión de SKU", async () => {
    mocks.mockProductoVarianteUpdate.mockResolvedValue({ id: 1, sku: "SKU-NUEVO" });

    const resultado = await service.actualizarVariante(1, { sku: "SKU-NUEVO" });
    expect(resultado.sku).toBe("SKU-NUEVO");
  });

  it("debería relanzar errores que no son P2002", async () => {
    mocks.mockProductoVarianteUpdate.mockRejectedValue(new Error("boom"));

    await expect(
      service.actualizarVariante(1, { sku: "X" })
    ).rejects.toThrow("boom");
  });
});

describe("actualizarVarianteBulk - colisión de SKU", () => {
  let service: VarianteService;
  let mocks: any;

  beforeEach(() => {
    service = new VarianteService();
    jest.clearAllMocks();
    mocks = require("../../../src/prisma/client").__mocks;
  });

  it("debería lanzar CustomError 409 cuando un SKU ya existe (P2002)", async () => {
    mocks.mockProductoVarianteFindMany.mockResolvedValue([
      { id: 1, productoId: 5 },
      { id: 2, productoId: 5 },
    ]);
    mocks.mockProductoVarianteUpdate.mockRejectedValue({ code: "P2002" });

    await expect(
      service.actualizarVarianteBulk(5, {
        variantes: [
          { id: 1, sku: "NUEVO-1" },
          { id: 2, sku: "NUEVO-2" },
        ],
      })
    ).rejects.toMatchObject({
      status: 409,
      message: "Ya existe una variante con ese SKU. Elegí un SKU distinto.",
    });
  });

  it("debería actualizar las variantes correctamente sin colisión", async () => {
    mocks.mockProductoVarianteFindMany.mockResolvedValue([
      { id: 1, productoId: 5 },
      { id: 2, productoId: 5 },
    ]);
    mocks.mockProductoVarianteUpdate.mockResolvedValue({});

    const resultado = await service.actualizarVarianteBulk(5, {
      variantes: [
        { id: 1, activo: true },
        { id: 2, activo: false },
      ],
    });

    expect(resultado.message).toContain("2");
    expect(mocks.mockTransaction).toHaveBeenCalled();
    expect(mocks.mockProductoVarianteUpdate).toHaveBeenCalledTimes(2);
  });
});
