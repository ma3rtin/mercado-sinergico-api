import { PedidoPagoService } from "../../../src/services/pedidoPago.service";
import { ESTADO_PAQUETE } from "../../../src/constants/estado-paquete";
import { ESTADO_PEDIDO } from "../../../src/constants/estado-pedido";

jest.mock("../../../src/prisma/client", () => {
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
    mocks.mockPaqueteBaseProductoFindMany.mockResolvedValue([]);
    mercadoPagoService = {
      crearPreferencia: jest.fn(),
      obtenerPago: jest.fn(),
    };
    service = new PedidoPagoService(mercadoPagoService as never);
  });

  it("permite iniciar pago para paquetes SINERGICOS", async () => {
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
            nombre: "Producto sinergico",
            tipo: "SINERGICO",
            stock: null,
          },
          varianteId: null,
          variante: null,
        },
      ],
      paquetePublicado: {
        tipo: "SINERGICO",
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

  it("iniciarPago rechaza paquetes ENERGICOS (usan reserva sin Mercado Pago)", async () => {
    mocks.mockPedidoFindUnique.mockResolvedValue({
      id_pedido: 1,
      usuarioId: 10,
      estadoId: ESTADO_PEDIDO.PENDIENTE,
      monto_total: 300,
      detalles: [],
      paquetePublicado: {
        tipo: "ENERGICO",
        estadoId: ESTADO_PAQUETE.ACTIVO,
      },
    });

    await expect(service.iniciarPago(1, 10)).rejects.toThrow(
      "Los paquetes ENÉRGICOS se confirman como reserva con pago contra entrega, sin Mercado Pago."
    );
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
        tipo: "SINERGICO",
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

  describe("confirmarReservaEnergica", () => {
    it("confirma reserva exitosamente, descuenta stock físico atómicamente y actualiza pedido a RESERVADO", async () => {
      mocks.mockPedidoFindUnique.mockResolvedValue({
        id_pedido: 10,
        usuarioId: 5,
        estadoId: ESTADO_PEDIDO.PENDIENTE,
        paquetePublicadoId: 50,
        detalles: [
          {
            cantidad: 2,
            productoId: 100,
            varianteId: null,
            producto: { id_producto: 100, nombre: "Item con stock", tipo: "ENERGICO", stock: 5 },
          },
        ],
        paquetePublicado: {
          id_paquete_publicado: 50,
          tipo: "ENERGICO",
          estadoId: ESTADO_PAQUETE.ACTIVO,
          cant_productos: 10,
          cant_productos_reservados: 2,
          paqueteBaseId: 200,
        },
      });
      mocks.mockPaqueteBaseProductoFindMany.mockResolvedValue([{ productoId: 100 }]);

      const mockPaqueteUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const mockPedidoUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const mockProductoUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const tx = {
        paquetePublicado: {
          findUnique: jest.fn().mockResolvedValue({
            id_paquete_publicado: 50,
            tipo: "ENERGICO",
            cant_productos: 10,
            cant_productos_reservados: 2,
            estadoId: ESTADO_PAQUETE.ACTIVO,
            paqueteBaseId: 200,
          }),
          updateMany: mockPaqueteUpdateMany,
          update: jest.fn().mockResolvedValue({}),
        },
        pedido: {
          updateMany: mockPedidoUpdateMany,
          findMany: jest.fn().mockResolvedValue([{ usuarioId: 5 }]),
        },
        producto: {
          findUnique: jest.fn().mockResolvedValue({
            id_producto: 100,
            nombre: "Item con stock",
            tipo: "ENERGICO",
            stock: 5,
          }),
          updateMany: mockProductoUpdateMany,
        },
      };
      mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

      const res = await service.confirmarReservaEnergica(10, 5);

      expect(res).toEqual({
        ok: true,
        pedidoId: 10,
        estado: "RESERVADO",
        mensaje: "Reserva confirmada. Pagás al recibirla.",
      });
      expect(mockPedidoUpdateMany).toHaveBeenCalledWith({
        where: { id_pedido: 10, estadoId: ESTADO_PEDIDO.PENDIENTE },
        data: { estadoId: ESTADO_PEDIDO.RESERVADO },
      });
      expect(mockProductoUpdateMany).toHaveBeenCalledWith({
        where: { id_producto: 100, stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(mockPaqueteUpdateMany).toHaveBeenCalledWith({
        where: {
          id_paquete_publicado: 50,
          cant_productos_reservados: { lte: 8 },
        },
        data: { cant_productos_reservados: { increment: 2 } },
      });
      expect(mercadoPagoService.crearPreferencia).not.toHaveBeenCalled();
    });

    it("rechaza si el paquete no es de tipo ENERGICO", async () => {
      mocks.mockPedidoFindUnique.mockResolvedValue({
        id_pedido: 10,
        usuarioId: 5,
        estadoId: ESTADO_PEDIDO.PENDIENTE,
        paquetePublicado: {
          tipo: "SINERGICO",
          estadoId: ESTADO_PAQUETE.ACTIVO,
        },
        detalles: [{ cantidad: 1, productoId: 100 }],
      });

      await expect(service.confirmarReservaEnergica(10, 5)).rejects.toThrow(
        "Solo los paquetes ENÉRGICOS pueden confirmarse como reserva sin pago anticipado."
      );
    });

    it("rechaza si el stock físico es insuficiente", async () => {
      mocks.mockPedidoFindUnique.mockResolvedValue({
        id_pedido: 10,
        usuarioId: 5,
        estadoId: ESTADO_PEDIDO.PENDIENTE,
        paquetePublicadoId: 50,
        detalles: [
          {
            cantidad: 10,
            productoId: 100,
            varianteId: null,
            producto: { id_producto: 100, nombre: "Item con stock", tipo: "ENERGICO", stock: 2 },
          },
        ],
        paquetePublicado: {
          id_paquete_publicado: 50,
          tipo: "ENERGICO",
          estadoId: ESTADO_PAQUETE.ACTIVO,
          cant_productos: 20,
          cant_productos_reservados: 0,
          paqueteBaseId: 200,
        },
      });
      mocks.mockPaqueteBaseProductoFindMany.mockResolvedValue([{ productoId: 100 }]);

      const tx = {
        paquetePublicado: {
          findUnique: jest.fn().mockResolvedValue({
            id_paquete_publicado: 50,
            tipo: "ENERGICO",
            cant_productos: 20,
            cant_productos_reservados: 0,
            estadoId: ESTADO_PAQUETE.ACTIVO,
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        pedido: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        producto: {
          findUnique: jest.fn().mockResolvedValue({
            id_producto: 100,
            nombre: "Item con stock",
            tipo: "ENERGICO",
            stock: 2,
          }),
        },
      };
      mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

      await expect(service.confirmarReservaEnergica(10, 5)).rejects.toThrow(
        "Stock insuficiente para el producto Item con stock."
      );
    });
  });

  describe("cancelarPaqueteYReembolsar", () => {
    it("para paquete ENERGICO: restaura stock y pasa a CANCELADO sin llamar a Mercado Pago", async () => {
      const mockPaqueteFindUnique = jest.fn().mockResolvedValue({
        id_paquete_publicado: 100,
        tipo: "ENERGICO",
        pedidos: [
          {
            id_pedido: 1,
            estadoId: ESTADO_PEDIDO.RESERVADO,
            paymentId: null,
            detalles: [{ productoId: 50, varianteId: null, cantidad: 3 }],
          },
          {
            id_pedido: 2,
            estadoId: ESTADO_PEDIDO.PENDIENTE,
            paymentId: null,
            detalles: [{ productoId: 50, varianteId: null, cantidad: 1 }],
          },
        ],
      });

      // Modificamos temporalmente prisma para soportar paquetePublicado.findUnique
      (service as any).prisma.paquetePublicado = {
        findUnique: mockPaqueteFindUnique,
      };

      const mockProductoUpdate = jest.fn().mockResolvedValue({});
      const mockPedidoUpdate = jest.fn().mockResolvedValue({});
      const mockPaqueteUpdate = jest.fn().mockResolvedValue({});

      const tx = {
        paquetePublicado: { update: mockPaqueteUpdate },
        producto: { update: mockProductoUpdate },
        pedido: { update: mockPedidoUpdate },
      };
      mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

      const result = await service.cancelarPaqueteYReembolsar(100);

      expect(result.message).toContain("stock de reservas restaurado");
      // Restauró stock solo para pedido 1 (RESERVADO), no para pedido 2 (PENDIENTE)
      expect(mockProductoUpdate).toHaveBeenCalledTimes(1);
      expect(mockProductoUpdate).toHaveBeenCalledWith({
        where: { id_producto: 50 },
        data: { stock: { increment: 3 } },
      });
      // Marcó ambos pedidos como CANCELADO
      expect(mockPedidoUpdate).toHaveBeenCalledWith({
        where: { id_pedido: 1 },
        data: { estadoId: ESTADO_PEDIDO.CANCELADO },
      });
      expect(mockPedidoUpdate).toHaveBeenCalledWith({
        where: { id_pedido: 2 },
        data: { estadoId: ESTADO_PEDIDO.CANCELADO },
      });
      expect(mercadoPagoService.obtenerPago).not.toHaveBeenCalled();
    });
  });

  describe("reembolsarPedidoIndividual", () => {
    it("para pedido ENERGICO en RESERVADO: cancela reserva y restaura stock sin llamar a MP", async () => {
      mocks.mockPedidoFindUnique.mockResolvedValue({
        id_pedido: 77,
        usuarioId: 10,
        estadoId: ESTADO_PEDIDO.RESERVADO,
        paquetePublicadoId: 200,
        detalles: [{ productoId: 88, varianteId: null, cantidad: 2 }],
        paquetePublicado: {
          estadoId: ESTADO_PAQUETE.ACTIVO,
          tipo: "ENERGICO",
          cant_productos_reservados: 5,
        },
      });

      const mockPedidoUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const mockProductoUpdate = jest.fn().mockResolvedValue({});
      const mockPaqueteUpdate = jest.fn().mockResolvedValue({});
      const tx = {
        pedido: {
          updateMany: mockPedidoUpdateMany,
          findMany: jest.fn().mockResolvedValue([]),
        },
        producto: { update: mockProductoUpdate },
        paquetePublicado: { update: mockPaqueteUpdate },
      };
      mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

      const res = await service.reembolsarPedidoIndividual(77, 10);

      expect(res.message).toContain("Reserva cancelada correctamente y stock liberado");
      expect(mockPedidoUpdateMany).toHaveBeenCalledWith({
        where: { id_pedido: 77, estadoId: ESTADO_PEDIDO.RESERVADO },
        data: { estadoId: ESTADO_PEDIDO.CANCELADO },
      });
      expect(mockProductoUpdate).toHaveBeenCalledWith({
        where: { id_producto: 88 },
        data: { stock: { increment: 2 } },
      });
      expect(mockPaqueteUpdate).toHaveBeenCalledWith({
        where: { id_paquete_publicado: 200 },
        data: { cant_productos_reservados: 3 }, // 5 - 2
      });
    });
  });
});
