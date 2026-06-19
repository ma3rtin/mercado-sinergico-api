import { PedidoPagoService } from "../../src/services/pedidoPago.service";
import { ESTADO_PAQUETE } from "../../src/constants/estado-paquete";
import { ESTADO_PEDIDO } from "../../src/constants/estado-pedido";

jest.mock("../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockPedidoFindUnique = jest.fn();
  const mockPaqueteBaseProductoFindMany = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction,
      pedido: { findUnique: mockPedidoFindUnique },
      paqueteBaseProducto: { findMany: mockPaqueteBaseProductoFindMany },
    },
    __mocks: {
      mockTransaction,
      mockPedidoFindUnique,
      mockPaqueteBaseProductoFindMany,
    },
  };
});

jest.mock("../../src/events/despachadorEventos", () => ({
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
    mocks = require("../../src/prisma/client").__mocks;
    mocks.mockPaqueteBaseProductoFindMany.mockResolvedValue([]);
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
          productoId: 2,
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
        paqueteBaseId: 123,
      },
    });
    mocks.mockPaqueteBaseProductoFindMany.mockResolvedValue([{ productoId: 2 }]);
    mercadoPagoService.crearPreferencia.mockResolvedValue({ id: "pref-1" });

    await expect(service.iniciarPago(1, 10)).resolves.toEqual({ id: "pref-1" });
  });

  it("iniciarPago rechaza un pedido cuyo estado no es Pendiente", async () => {
    mocks.mockPedidoFindUnique.mockResolvedValue({
      id_pedido: 1,
      usuarioId: 10,
      estadoId: ESTADO_PEDIDO.PAGADO,
      monto_total: 300,
      detalles: [],
      paquetePublicado: {
        tipo: "SINERGICO",
        estadoId: ESTADO_PAQUETE.ACTIVO,
        cant_productos: null,
        cant_productos_reservados: 0,
      },
    });

    await expect(service.iniciarPago(1, 10)).rejects.toThrow(
      "El pedido no puede pagarse en su estado actual"
    );
  });

  it("confirmarPago retorna silenciosamente si el pedido ya no es Pendiente (idempotencia webhook)", async () => {
    mercadoPagoService.obtenerPago.mockResolvedValue({
      id: 99,
      status: "approved",
      external_reference: "1",
    });
    mocks.mockPedidoFindUnique.mockResolvedValue({
      id_pedido: 1,
      usuarioId: 10,
      estadoId: ESTADO_PEDIDO.PAGADO,
      paquetePublicadoId: 20,
      detalles: [],
      paquetePublicado: { tipo: "SINERGICO", cant_productos: null },
    });

    const resultado = await service.confirmarPago(99);

    expect(resultado).toEqual({ pedidoId: 1, status: "approved" });
    expect(mocks.mockTransaction).not.toHaveBeenCalled();
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
          paqueteBaseId: 100,
        }),
        updateMany: mockPaqueteUpdateMany,
        update: jest.fn().mockResolvedValue({}),
      },
      paqueteBaseProducto: {
        findMany: jest.fn().mockResolvedValue([{ productoId: 5 }]),
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
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
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
    expect(tx.pedido.updateMany).toHaveBeenCalledWith({
      where: { id_pedido: 1, estadoId: ESTADO_PEDIDO.PENDIENTE },
      data: { estadoId: ESTADO_PEDIDO.PAGADO, paymentId: "99" },
    });
  });

  it("confirmarPago no reserva cupo ni stock si otro webhook ya reclamó el pedido dentro de la transacción", async () => {
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

    const mockPaqueteUpdateMany = jest.fn();
    const mockProductoUpdateMany = jest.fn();
    const tx = {
      paquetePublicado: {
        findUnique: jest.fn().mockResolvedValue({
          id_paquete_publicado: 20,
          tipo: "ENERGICO",
          cant_productos: null,
          cant_productos_reservados: 0,
          estadoId: ESTADO_PAQUETE.ACTIVO,
          paqueteBaseId: 100,
        }),
        updateMany: mockPaqueteUpdateMany,
      },
      paqueteBaseProducto: {
        findMany: jest.fn().mockResolvedValue([{ productoId: 5 }]),
      },
      pedido: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      producto: {
        updateMany: mockProductoUpdateMany,
      },
    };
    mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

    await expect(service.confirmarPago(99)).resolves.toEqual({
      pedidoId: 1,
      status: "approved",
    });
    expect(mockPaqueteUpdateMany).not.toHaveBeenCalled();
    expect(mockProductoUpdateMany).not.toHaveBeenCalled();
  });

  it("iniciarPago lanza 400 si algún producto del pedido ya no pertenece al paquete base", async () => {
    mocks.mockPedidoFindUnique.mockResolvedValue({
      id_pedido: 1,
      usuarioId: 10,
      estadoId: ESTADO_PEDIDO.PENDIENTE,
      monto_total: 300,
      detalles: [
        {
          cantidad: 3,
          productoId: 999, // Producto que no estará en el paquete base
          producto: {
            nombre: "Producto eliminado",
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
        paqueteBaseId: 123,
      },
    });
    mocks.mockPaqueteBaseProductoFindMany.mockResolvedValue([{ productoId: 2 }]);

    await expect(service.iniciarPago(1, 10)).rejects.toThrow(
      "El pedido contiene productos que ya no están disponibles en este paquete. Actualizá tu pedido antes de pagar."
    );
  });

  it("iniciarPago rechaza con 400 cuando el total del pedido supera el cupo disponible confirmado", async () => {
    mocks.mockPedidoFindUnique.mockResolvedValue({
      id_pedido: 1,
      usuarioId: 10,
      estadoId: ESTADO_PEDIDO.PENDIENTE,
      monto_total: 300,
      detalles: [
        {
          cantidad: 2,
          productoId: 2,
          producto: { nombre: "Producto A", tipo: "SINERGICO", stock: null },
          varianteId: null,
          variante: null,
        },
        {
          cantidad: 2,
          productoId: 3,
          producto: { nombre: "Producto B", tipo: "SINERGICO", stock: null },
          varianteId: null,
          variante: null,
        },
      ],
      paquetePublicado: {
        tipo: "SINERGICO",
        estadoId: ESTADO_PAQUETE.ACTIVO,
        cant_productos: 10,
        cant_productos_reservados: 7, // 10 - 7 = 3 cupos, pedido pide 4 en total
        paqueteBaseId: 123,
      },
    });
    mocks.mockPaqueteBaseProductoFindMany.mockResolvedValue([
      { productoId: 2 },
      { productoId: 3 },
    ]);

    await expect(service.iniciarPago(1, 10)).rejects.toThrow(
      "Ya no hay cupo suficiente para completar este pedido. Actualizá tu pedido antes de pagar."
    );
  });

  it("confirmarPago rechaza dentro de la transacción cuando el cupo confirmado no alcanza", async () => {
    mercadoPagoService.obtenerPago.mockResolvedValue({
      id: 99,
      status: "approved",
      external_reference: "1",
    });
    mocks.mockPedidoFindUnique.mockResolvedValue({
      id_pedido: 1,
      usuarioId: 10,
      estadoId: ESTADO_PEDIDO.PENDIENTE,
      paquetePublicadoId: 20,
      detalles: [
        {
          cantidad: 5,
          productoId: 5,
          varianteId: null,
          producto: { nombre: "Producto A", tipo: "SINERGICO", stock: null },
        },
      ],
      paquetePublicado: { tipo: "SINERGICO", cant_productos: 10 },
    });

    const tx = {
      paquetePublicado: {
        findUnique: jest.fn().mockResolvedValue({
          id_paquete_publicado: 20,
          tipo: "SINERGICO",
          cant_productos: 10,
          cant_productos_reservados: 8, // solo 2 cupos disponibles, se piden 5
          estadoId: ESTADO_PAQUETE.ACTIVO,
          paqueteBaseId: 100,
        }),
      },
      paqueteBaseProducto: {
        findMany: jest.fn().mockResolvedValue([{ productoId: 5 }]),
      },
    };
    mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

    await expect(service.confirmarPago(99)).rejects.toThrow(
      "No hay suficientes cupos disponibles en el paquete."
    );
  });

  it("confirmarPago lanza 400 dentro de la transaccion si algún producto del pedido ya no pertenece al paquete base", async () => {
    mocks.mockPedidoFindUnique.mockResolvedValue({
      id_pedido: 1,
      usuarioId: 10,
      estadoId: ESTADO_PEDIDO.PENDIENTE,
      paquetePublicadoId: 20,
      detalles: [
        {
          cantidad: 2,
          productoId: 999, // Producto eliminado del paquete base
          varianteId: null,
          producto: {
            nombre: "Producto eliminado",
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

    const tx = {
      paquetePublicado: {
        findUnique: jest.fn().mockResolvedValue({
          id_paquete_publicado: 20,
          tipo: "ENERGICO",
          cant_productos: null,
          cant_productos_reservados: 0,
          estadoId: ESTADO_PAQUETE.ACTIVO,
          paqueteBaseId: 100,
        }),
      },
      paqueteBaseProducto: {
        findMany: jest.fn().mockResolvedValue([{ productoId: 5 }]), // Solo producto 5 está en el base
      },
    };
    mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

    await expect(service.confirmarPago(99)).rejects.toThrow(
      "El pedido contiene productos que ya no están disponibles en este paquete. Actualizá tu pedido antes de pagar."
    );
  });
});
