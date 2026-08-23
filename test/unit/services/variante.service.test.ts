import { VarianteService } from "../../../src/services/variante.service";
import { TipoPaquete } from "@prisma/client";

jest.mock("../../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockProductoFindUnique = jest.fn();
  const mockProductoVarianteCreateMany = jest.fn();
  const mockProductoVarianteFindMany = jest.fn();
  const mockProductoVarianteOpcionCreateMany = jest.fn();
  const mockProductoVarianteCount = jest.fn();
  const mockExecuteRaw = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction,
      producto: {
        findUnique: mockProductoFindUnique,
      },
      productoVariante: {
        createMany: mockProductoVarianteCreateMany,
        findMany: mockProductoVarianteFindMany,
        count: mockProductoVarianteCount,
      },
      productoVarianteOpcion: {
        createMany: mockProductoVarianteOpcionCreateMany,
      },
    },
    __mocks: {
      mockTransaction,
      mockProductoFindUnique,
      mockProductoVarianteCreateMany,
      mockProductoVarianteFindMany,
      mockProductoVarianteOpcionCreateMany,
      mockProductoVarianteCount,
      mockExecuteRaw,
    },
  };
});

function sqlString(q: any): string {
  let result = q.strings[0];
  for (let i = 0; i < q.values.length; i++) {
    result += String(q.values[i]) + q.strings[i + 1];
  }
  return result;
}

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
  let lastVariantesData: any[] = [];

  beforeEach(() => {
    service = new VarianteService();
    jest.clearAllMocks();
    mocks = require("../../../src/prisma/client").__mocks;
    lastVariantesData = [];

    mocks.mockProductoVarianteCount.mockResolvedValue(0);
    mocks.mockTransaction.mockImplementation(async (callback: any) => {
      const tx = {
        productoVariante: {
          createMany: mocks.mockProductoVarianteCreateMany,
          findMany: mocks.mockProductoVarianteFindMany,
        },
        productoVarianteOpcion: {
          createMany: mocks.mockProductoVarianteOpcionCreateMany,
        },
        $executeRaw: mocks.mockExecuteRaw,
      };
      return callback(tx);
    });
    mocks.mockExecuteRaw.mockResolvedValue(0);
    mocks.mockProductoVarianteCreateMany.mockImplementation(
      async ({ data }: any) => {
        lastVariantesData = data;
        return { count: data.length };
      }
    );
    mocks.mockProductoVarianteFindMany.mockImplementation(
      async ({ where }: any) => {
        const ids: number[] = where.id?.in ?? [];
        const skus: string[] = where.sku?.in ?? [];
        return lastVariantesData
          .map((v: any, i: number) => ({ id: i + 1, ...v }))
          .filter((v: any) =>
            skus.length ? skus.includes(v.sku) : ids.includes(v.id)
          );
      }
    );
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
    expect(mocks.mockProductoVarianteCreateMany).toHaveBeenCalledTimes(1);
    expect(mocks.mockProductoVarianteCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ sku: expect.stringContaining("-42-") }),
      ]),
    });
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

describe("VarianteService - actualizarStockBulk", () => {
  let service: VarianteService;
  let mocks: any;

  beforeEach(() => {
    service = new VarianteService();
    jest.clearAllMocks();
    mocks = require("../../../src/prisma/client").__mocks;

    mocks.mockProductoVarianteFindMany.mockResolvedValue([
      { id: 1, sku: "A", stockFisico: 10 },
      { id: 2, sku: "B", stockFisico: 20 },
    ]);
    mocks.mockTransaction.mockImplementation(async (callback: any) => {
      const tx = { $executeRaw: mocks.mockExecuteRaw };
      return callback(tx);
    });
    mocks.mockExecuteRaw.mockResolvedValue(2);
  });

  it("debería actualizar todo el stock con un único $executeRaw y un CASE sin comas entre WHEN", async () => {
    await service.actualizarStockBulk(59, {
      variantes: [
        { id: 1, stockFisico: 5 },
        { id: 2, stockFisico: null },
      ],
    });

    expect(mocks.mockExecuteRaw).toHaveBeenCalledTimes(1);
    const query = mocks.mockExecuteRaw.mock.calls[0][0];
    const sql = sqlString(query);
    expect(sql).toContain("UPDATE ProductoVariante");
    expect(sql).toContain("stockFisico = CASE id");
    expect(sql).toContain("ELSE stockFisico END");
    expect(sql).toContain("WHERE id IN");
    expect(sql).not.toContain(",WHEN");
    expect(sql).toMatch(/CASE id WHEN \d+ THEN [^,]+ WHEN \d+ THEN [^,]+ END/);
    expect(query.values).toEqual([1, 5, 2, null, 1, 2]);
  });

  it("debería lanzar 400 con stock negativo sin llamar a $executeRaw", async () => {
    await expect(
      service.actualizarStockBulk(59, {
        variantes: [
          { id: 1, stockFisico: -3 },
          { id: 2, stockFisico: 5 },
        ],
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "El stock físico no puede ser negativo.",
    });

    expect(mocks.mockExecuteRaw).not.toHaveBeenCalled();
  });

  it("debería lanzar 400 si alguna variante no pertenece al producto", async () => {
    mocks.mockProductoVarianteFindMany.mockResolvedValue([{ id: 1 }]);

    await expect(
      service.actualizarStockBulk(59, {
        variantes: [
          { id: 1, stockFisico: 5 },
          { id: 2, stockFisico: 5 },
        ],
      })
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("no pertenecen"),
    });

    expect(mocks.mockExecuteRaw).not.toHaveBeenCalled();
  });

  it("debería ser un no-op exitoso con variantes vacías", async () => {
    mocks.mockProductoVarianteFindMany.mockResolvedValue([]);
    const resultado = await service.actualizarStockBulk(59, { variantes: [] });

    expect(resultado.message).toBe("Stock actualizado para 0 variantes");
    expect(mocks.mockExecuteRaw).not.toHaveBeenCalled();
  });
});

describe("VarianteService - actualizarVarianteBulk", () => {
  let service: VarianteService;
  let mocks: any;

  beforeEach(() => {
    service = new VarianteService();
    jest.clearAllMocks();
    mocks = require("../../../src/prisma/client").__mocks;

    mocks.mockProductoVarianteFindMany.mockResolvedValue([
      { id: 1, sku: "A" },
      { id: 2, sku: "B" },
    ]);
    mocks.mockTransaction.mockImplementation(async (callback: any) => {
      const tx = { $executeRaw: mocks.mockExecuteRaw };
      return callback(tx);
    });
    mocks.mockExecuteRaw.mockResolvedValue(2);
  });

  it("debería armar un CASE por columna solo con las variantes que la definen", async () => {
    await service.actualizarVarianteBulk(59, {
      variantes: [
        { id: 1, sku: "SKU-1", stockFisico: 5, precioExtra: 1.5, activo: true },
        { id: 2, sku: "SKU-2", stockFisico: 8, activo: false },
      ],
    });

    expect(mocks.mockExecuteRaw).toHaveBeenCalledTimes(1);
    const query = mocks.mockExecuteRaw.mock.calls[0][0];
    const sql = sqlString(query);
    expect(sql).toContain("UPDATE ProductoVariante");
    expect(sql).toContain("sku = CASE id");
    expect(sql).toContain("stockFisico = CASE id");
    expect(sql).toContain("activo = CASE id");
    expect(sql).toContain("precioExtra = CASE id");
    expect(sql).toContain("WHERE id IN");

    expect(sql).not.toContain(",WHEN");
    expect(sql).toMatch(/CASE id WHEN \d+ THEN [^,]+ WHEN \d+ THEN [^,]+ END/);
    expect(sql).toMatch(/ELSE \w+ END, \w+ = CASE/);

    expect(query.values).toEqual([
      1, "SKU-1", 2, "SKU-2",
      1, 5, 2, 8,
      1, 1.5,
      1, true, 2, false,
      1, 2,
    ]);
  });

  it("debería lanzar 400 con stock negativo sin llamar a $executeRaw", async () => {
    await expect(
      service.actualizarVarianteBulk(59, {
        variantes: [
          { id: 1, stockFisico: -1 },
          { id: 2, sku: "B" },
        ],
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "El stock físico no puede ser negativo.",
    });

    expect(mocks.mockExecuteRaw).not.toHaveBeenCalled();
  });

  it("debería ser un no-op exitoso cuando ninguna variante trae campos", async () => {
    const resultado = await service.actualizarVarianteBulk(59, {
      variantes: [{ id: 1 }, { id: 2 }],
    });

    expect(resultado.message).toBe("Se actualizaron exitosamente 2 variantes.");
    expect(mocks.mockExecuteRaw).not.toHaveBeenCalled();
  });

  it("debería lanzar 400 si alguna variante no pertenece al producto", async () => {
    mocks.mockProductoVarianteFindMany.mockResolvedValue([{ id: 1 }]);

    await expect(
      service.actualizarVarianteBulk(59, {
        variantes: [{ id: 1, sku: "A" }, { id: 2, sku: "B" }],
      })
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("no pertenecen"),
    });

    expect(mocks.mockExecuteRaw).not.toHaveBeenCalled();
  });
});
