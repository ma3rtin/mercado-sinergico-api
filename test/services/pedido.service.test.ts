import { PedidoService } from "../../src/services/pedido.service";
import { ESTADO_PAQUETE } from "../../src/constants/estado-paquete";

jest.mock("../../src/prisma/client", () => {
  const mockPaquetePublicadoFindUnique = jest.fn();
  const mockPedidoFindFirst = jest.fn();
  const mockPedidoCreate = jest.fn();
  const mockPedidoDetalleFindFirst = jest.fn();
  const mockPedidoDetalleCreate = jest.fn();
  const mockPedidoDetalleUpdate = jest.fn();
  const mockPedidoDetalleAggregate = jest.fn();
  const mockPedidoUpdate = jest.fn();

  return {
    prisma: {
      paquetePublicado: { findUnique: mockPaquetePublicadoFindUnique },
      pedido: {
        findFirst: mockPedidoFindFirst,
        create: mockPedidoCreate,
        update: mockPedidoUpdate,
      },
      pedidoDetalle: {
        findFirst: mockPedidoDetalleFindFirst,
        create: mockPedidoDetalleCreate,
        update: mockPedidoDetalleUpdate,
        aggregate: mockPedidoDetalleAggregate,
      },
    },
    __mocks: {
      mockPaquetePublicadoFindUnique,
      mockPedidoFindFirst,
      mockPedidoCreate,
      mockPedidoDetalleFindFirst,
      mockPedidoDetalleCreate,
      mockPedidoDetalleUpdate,
      mockPedidoDetalleAggregate,
      mockPedidoUpdate,
    },
  };
});

describe("PedidoService", () => {
  let service: PedidoService;
  let mocks: Record<string, jest.Mock>;

  beforeEach(() => {
    service = new PedidoService();
    jest.clearAllMocks();
    mocks = require("../../src/prisma/client").__mocks;
  });

  it("usa el producto solicitado del dto aunque el paquete tenga multiples productos", async () => {
    mocks.mockPaquetePublicadoFindUnique.mockResolvedValue({
      descuento: 10,
      tipo: "ENERGICO",
      estado: { id_estado: ESTADO_PAQUETE.ACTIVO, nombre: "Activo" },
      cant_productos: null,
      cant_productos_reservados: 0,
      paqueteBase: {
        productos: [
          {
            productoId: 1,
            producto: {
              id_producto: 1,
              precio: 50,
              stock: 1,
              tipo: "ENERGICO",
              plantillaId: null,
              variantes: [],
            },
          },
          {
            productoId: 2,
            producto: {
              id_producto: 2,
              precio: 200,
              stock: 10,
              tipo: "ENERGICO",
              plantillaId: null,
              variantes: [],
            },
          },
        ],
      },
    });
    mocks.mockPedidoFindFirst.mockResolvedValue(null);
    mocks.mockPedidoCreate.mockResolvedValue({ id_pedido: 123 });

    const pedidoId = await service.crearPedido(10, 20, {
      productoId: 2,
      cantidad: 2,
    });

    expect(pedidoId).toBe(123);
    expect(mocks.mockPedidoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monto_total: 360,
          detalles: {
            create: expect.objectContaining({
              productoId: 2,
              cantidad: 2,
              precio_unitario: 180,
              subtotal: 360,
            }),
          },
        }),
      })
    );
  });

  it("permite comprar paquetes sin cupo limite cuando hay stock fisico", async () => {
    mocks.mockPaquetePublicadoFindUnique.mockResolvedValue({
      descuento: 0,
      tipo: "ENERGICO",
      estado: { id_estado: ESTADO_PAQUETE.ACTIVO, nombre: "Activo" },
      cant_productos: null,
      cant_productos_reservados: 0,
      paqueteBase: {
        productos: [
          {
            productoId: 5,
            producto: {
              id_producto: 5,
              precio: 100,
              stock: 3,
              tipo: "ENERGICO",
              plantillaId: null,
              variantes: [],
            },
          },
        ],
      },
    });
    mocks.mockPedidoFindFirst.mockResolvedValue(null);
    mocks.mockPedidoCreate.mockResolvedValue({ id_pedido: 456 });

    await expect(
      service.crearPedido(10, 20, {
        productoId: 5,
        cantidad: 3,
      })
    ).resolves.toBe(456);
  });
});
