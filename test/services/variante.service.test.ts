import { VarianteService } from "../../src/services/variante.service";
import { TipoPaquete } from "@prisma/client";

jest.mock("../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockProductoFindUnique = jest.fn();
  const mockOpcionFindMany = jest.fn();
  const mockProductoVarianteCreateMany = jest.fn();
  const mockProductoVarianteFindMany = jest.fn();
  const mockProductoVarianteOpcionCreateMany = jest.fn();

  const mockPrisma = {
    $transaction: mockTransaction,
    producto: {
      findUnique: mockProductoFindUnique,
    },
    opcion: {
      findMany: mockOpcionFindMany,
    },
    productoVariante: {
      createMany: mockProductoVarianteCreateMany,
      findMany: mockProductoVarianteFindMany,
    },
    productoVarianteOpcion: {
      createMany: mockProductoVarianteOpcionCreateMany,
    },
  };

  mockTransaction.mockImplementation(async (arg) => {
    if (typeof arg === "function") {
      return arg(mockPrisma);
    }
    return Promise.all(arg);
  });

  return {
    prisma: mockPrisma,
    __mocks: {
      mockTransaction,
      mockProductoFindUnique,
      mockOpcionFindMany,
      mockProductoVarianteCreateMany,
      mockProductoVarianteFindMany,
      mockProductoVarianteOpcionCreateMany,
    },
  };
});

describe("VarianteService - generarVariantes", () => {
  let service: VarianteService;
  let mocks: any;

  beforeEach(() => {
    service = new VarianteService();
    jest.clearAllMocks();
    mocks = require("../../src/prisma/client").__mocks;
  });

  it("debería generar variantes con SKU conteniendo el productoId", async () => {
    const productoId = 42;
    const opcionesDisponibles = {
      "10": [101, 102], // Caracteristica 10, Opciones 101 y 102
    };

    mocks.mockProductoFindUnique.mockResolvedValue({
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
    });

    mocks.mockOpcionFindMany.mockResolvedValue([
      { id: 101, nombre: "S" },
      { id: 102, nombre: "M" },
    ]);

    mocks.mockProductoVarianteCreateMany.mockResolvedValue({ count: 2 });

    let findManyCallCount = 0;
    mocks.mockProductoVarianteFindMany.mockImplementation(({ where, include }: any) => {
      findManyCallCount++;
      const baseVariants = [
        { id: 1001, productoId, sku: "PRODUCTOSUPERTE-42-S", stockFisico: null, precioExtra: 0, activo: true },
        { id: 1002, productoId, sku: "PRODUCTOSUPERTE-42-M", stockFisico: null, precioExtra: 0, activo: true },
      ];
      if (findManyCallCount === 1) {
        // First call: check existing. Return empty array to simulate all variants are new.
        return Promise.resolve([]);
      }
      if (include) {
        return Promise.resolve(
          baseVariants.map(v => ({
            ...v,
            opciones: [
              {
                caracteristica: { nombre: "Talle" },
                opcion: { nombre: v.sku.endsWith("-S") ? "S" : "M" },
                caracteristicaId: 10,
                opcionId: v.sku.endsWith("-S") ? 101 : 102,
              }
            ]
          }))
        );
      }
      return Promise.resolve(baseVariants);
    });
    mocks.mockProductoVarianteOpcionCreateMany.mockResolvedValue({ count: 2 });

    const resultado = await service.generarVariantes({
      productoId,
      opcionesDisponibles,
    });

    expect(resultado.variantes).toHaveLength(2);
    expect(resultado.variantes[0].sku).toBe("PRODUCTOSUPERTE-42-S");
    expect(resultado.variantes[1].sku).toBe("PRODUCTOSUPERTE-42-M");

    expect(mocks.mockProductoVarianteCreateMany).toHaveBeenCalledTimes(1);
    expect(mocks.mockProductoVarianteOpcionCreateMany).toHaveBeenCalledTimes(1);
  });
});
