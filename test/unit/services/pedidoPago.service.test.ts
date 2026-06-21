import { PedidoPagoService } from "../../../src/services/pedidoPago.service";
import { ESTADO_PAQUETE } from "../../../src/constants/estado-paquete";
import { ESTADO_PEDIDO } from "../../../src/constants/estado-pedido";

jest.mock("../../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockPedidoFindUnique = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction,
      pedido: { findUnique: mockPedidoFindUnique },
    },
    __mocks: {
      mockTransaction,
      mockPedidoFindUnique,
    },
  };
});

jest.mock("../../../src/events/despachadorEventos", () => ({
  despachadorEventosApp: { emit: jest.fn() },
  DespachadorEventos: { PAQUETE_COMPLETO: "PAQUETE_COMPLETO" },
}));

describe("PedidoPagoService", () => {
  let service: PedidoPagoService;
  let mocks: Record<string, jest.Mock>;
  let mercadoPagoService: {
    crearPreferencia: jest.Mock;
    obtenerPago: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mocks = require("../../../src/prisma/client").__mocks;
    mercadoPagoService = {
      crearPreferencia: jest.fn(),
      obtenerPago: jest.fn(),
    };
    service = new PedidoPagoService(mercadoPagoService as never);
  });

  it("permite iniciar pago para paquetes sin cupo limite si hay stock", async () => {
    mocks.mockPedidoFindUnique.mockResolvedValue({
      id_pedido: 1,
      usuarioId: 10,
      estadoId: ESTADO_PEDIDO.PENDIENTE,
      monto_total: 300,
      detalles: [
        {
          cantidad: 3,
          producto: {
            nombre: "Producto energetico",
            tipo: "ENERGICO",
            stock: 3,
          },
          varianteId: null,
          variante: null,
        },
      ],
      paquetePublicado: {
        tipo: "ENERGICO",
        estadoId: ESTADO_PAQUETE.ACTIVO,
        cant_productos: null,
        cant_productos_reservados: 0,
      },
    });
    mercadoPagoService.crearPreferencia.mockResolvedValue({ id: "pref-1" });

    await expect(service.iniciarPago(1, 10)).resolves.toEqual({ id: "pref-1" });
  });

  it("confirma pago sin condicion de cupo cuando cant_productos es null", async () => {
    mocks.mockPedidoFindUnique.mockResolvedValue({
      id_pedido: 1,
      usuarioId: 10,
      estadoId: ESTADO_PEDIDO.PENDIENTE,
      paquetePublicadoId: 20,
      detalles: [
        {
          cantidad: 2,
          productoId: 5,
          varianteId: null,
          producto: {
            nombre: "Producto energetico",
            tipo: "ENERGICO",
            stock: 5,
          },
        },
      ],
      paquetePublicado: {
        tipo: "ENERGICO",
        cant_productos: null,
      },
    });
    mercadoPagoService.obtenerPago.mockResolvedValue({
      id: 99,
      status: "approved",
      external_reference: "1",
    });

    const mockPaqueteUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const tx = {
      paquetePublicado: {
        findUnique: jest.fn().mockResolvedValue({
          id_paquete_publicado: 20,
          tipo: "ENERGICO",
          cant_productos: null,
          cant_productos_reservados: 0,
          estadoId: ESTADO_PAQUETE.ACTIVO,
        }),
        updateMany: mockPaqueteUpdateMany,
        update: jest.fn().mockResolvedValue({}),
      },
      producto: {
        findUnique: jest.fn().mockResolvedValue({
          id_producto: 5,
          stock: 5,
          tipo: "ENERGICO",
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      pedido: {
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([{ usuarioId: 10 }]),
      },
    };
    mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

    await expect(service.confirmarPago(99)).resolves.toEqual({
      pedidoId: 1,
      status: "approved",
    });
    expect(mockPaqueteUpdateMany).toHaveBeenCalledWith({
      where: { id_paquete_publicado: 20 },
      data: { cant_productos_reservados: { increment: 2 } },
    });
  });
});
