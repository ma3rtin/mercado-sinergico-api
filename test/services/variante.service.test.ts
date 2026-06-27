import { VarianteService } from "../../src/services/variante.service";
import { TipoPaquete } from "@prisma/client";

jest.mock("../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockProductoFindUnique = jest.fn();
  const mockOpcionFindMany = jest.fn();
  const mockProductoVarianteCreate = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction.mockImplementation(async (promises) => {
        return Promise.all(promises);
      }),
      producto: {
        findUnique: mockProductoFindUnique,
      },
      opcion: {
        findMany: mockOpcionFindMany,
      },
      productoVariante: {
        create: mockProductoVarianteCreate,
      },
    },
    __mocks: {
      mockTransaction,
      mockProductoFindUnique,
      mockOpcionFindMany,
      mockProductoVarianteCreate,
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

    mocks.mockProductoVarianteCreate.mockImplementation(({ data }: any) => {
      return Promise.resolve({
        id: Math.floor(Math.random() * 1000),
        ...data,
      });
    });

    const resultado = await service.generarVariantes({
      productoId,
      opcionesDisponibles,
    });

    expect(resultado.variantes).toHaveLength(2);
    // El SKU generado debe contener el productoId (42) y el nombre de la opcion
    expect(resultado.variantes[0].sku).toBe("PRODUCTO-S-42-S");
    expect(resultado.variantes[1].sku).toBe("PRODUCTO-S-42-M");

    expect(mocks.mockProductoVarianteCreate).toHaveBeenCalledTimes(2);
  });
});
