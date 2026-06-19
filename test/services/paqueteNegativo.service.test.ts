import { PedidoPagoService } from "../../src/services/pedidoPago.service";
import { PaquetePublicadoService } from "../../src/services/paquetePublicado.service";
import { PedidoService } from "../../src/services/pedido.service";
import { ESTADO_PAQUETE } from "../../src/constants/estado-paquete";
import { ESTADO_PEDIDO } from "../../src/constants/estado-pedido";

jest.mock("../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockPaqueteFindUnique = jest.fn();
  const mockPedidoFindUnique = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction,
      paquetePublicado: {
        findUnique: mockPaqueteFindUnique,
      },
      pedido: {
        findUnique: mockPedidoFindUnique,
      },
    },
    __mocks: {
      mockTransaction,
      mockPaqueteFindUnique,
      mockPedidoFindUnique,
    },
  };
});

describe("Pruebas de regresión para evitar reservas negativas en paquetes", () => {
  let pedidoPagoService: PedidoPagoService;
  let packageService: PaquetePublicadoService;
  let pedidoService: PedidoService;
  let mocks: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mocks = require("../../src/prisma/client").__mocks;
    pedidoPagoService = new PedidoPagoService({
      crearPreferencia: jest.fn(),
      obtenerPago: jest.fn(),
      reembolsarPago: jest.fn().mockResolvedValue({}),
    } as any);
    packageService = new PaquetePublicadoService();
    pedidoService = new PedidoService();
  });

  describe("cancelarPaqueteYReembolsar", () => {
    it("establece cant_productos_reservados en 0 directamente y no decrementa por debajo de 0", async () => {
      // Configurar un paquete que tiene 0 reservas en la base de datos, pero tiene 1 pedido pagado con cantidad 2
      const fakePackage = {
        id_paquete_publicado: 999,
        tipo: "SINERGICO",
        estadoId: ESTADO_PAQUETE.ACTIVO,
        cant_productos_reservados: 0,
        pedidos: [
          {
            id_pedido: 101,
            estadoId: ESTADO_PEDIDO.PAGADO,
            paymentId: "12345",
            detalles: [
              {
                cantidad: 2,
                productoId: 10,
              },
            ],
          },
        ],
      };

      mocks.mockPaqueteFindUnique.mockResolvedValue(fakePackage);

      const mockPaqueteUpdate = jest.fn().mockResolvedValue({});
      const mockPedidoUpdate = jest.fn().mockResolvedValue({});

      const tx = {
        paquetePublicado: {
          update: mockPaqueteUpdate,
        },
        pedido: {
          update: mockPedidoUpdate,
        },
      };

      mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

      await pedidoPagoService.cancelarPaqueteYReembolsar(999);

      // Verificar que la transacción canceló el paquete estableciendo las reservas en 0 directamente
      expect(mockPaqueteUpdate).toHaveBeenCalledWith({
        where: { id_paquete_publicado: 999 },
        data: {
          estadoId: ESTADO_PAQUETE.CANCELADO,
          cant_productos_reservados: 0,
        },
      });

      // Verificar que no se llamaron a otras actualizaciones en paquetePublicado (ej. decrementar)
      expect(mockPaqueteUpdate).toHaveBeenCalledTimes(1);

      // Verificar que el pedido fue marcado como reembolsado
      expect(mockPedidoUpdate).toHaveBeenCalledWith({
        where: { id_pedido: 101 },
        data: { estadoId: ESTADO_PEDIDO.REEMBOLSADO },
      });
    });
  });

  describe("reembolsarPedidoIndividual", () => {
    it("no permite que cant_productos_reservados sea negativo", async () => {
      const fakePedido = {
        id_pedido: 102,
        usuarioId: 5,
        estadoId: ESTADO_PEDIDO.PAGADO,
        paymentId: "54321",
        paquetePublicadoId: 999,
        paquetePublicado: {
          estadoId: ESTADO_PAQUETE.ACTIVO,
          tipo: "SINERGICO",
          cant_productos_reservados: 1, // La base de datos solo tiene 1, pero el pedido es por 3 (discrepancia)
        },
        detalles: [
          {
            cantidad: 3,
            productoId: 10,
          },
        ],
      };

      mocks.mockPedidoFindUnique.mockResolvedValue(fakePedido);

      const mockPaqueteUpdate = jest.fn().mockResolvedValue({});
      const mockPedidoUpdate = jest.fn().mockResolvedValue({});

      const tx = {
        paquetePublicado: {
          update: mockPaqueteUpdate,
        },
        pedido: {
          update: mockPedidoUpdate,
        },
      };

      mocks.mockTransaction.mockImplementation(async (callback) => callback(tx));

      await pedidoPagoService.reembolsarPedidoIndividual(102, 5);

      // La nueva reserva esperada debería ser Math.max(0, 1 - 3) = 0
      expect(mockPaqueteUpdate).toHaveBeenCalledWith({
        where: { id_paquete_publicado: 999 },
        data: { cant_productos_reservados: 0 },
      });
    });
  });

  describe("capa de mapeo _mapComputedFields", () => {
    it("PaquetePublicadoService mapea valores negativos de la base de datos a 0", () => {
      const fakePackageEntity = {
        id_paquete_publicado: 1,
        cant_productos_reservados: -3,
        cant_usuarios_registrados: -2,
        pedidos: [], // sin pedidos activos
      };

      const result = (packageService as any)._mapComputedFields(fakePackageEntity);

      expect(result.cant_productos_reservados).toBe(0);
    });

    it("PedidoService mapea valores negativos de la base de datos a 0", () => {
      const fakePedidoEntity = {
        id_pedido: 1,
        paquetePublicado: {
          id_paquete_publicado: 1,
          cant_productos_reservados: -2,
          pedidos: [],
        },
      };

      const result = (pedidoService as any)._mapComputedFields(fakePedidoEntity);

      expect(result.paquetePublicado.cant_productos_reservados).toBe(0);
    });

    it("PaquetePublicadoService excluye pedidos Pendientes de cant_productos_reservados", () => {
      const fakePackageEntity = {
        id_paquete_publicado: 1,
        cant_productos_reservados: 5,
        cant_usuarios_registrados: 0,
        pedidos: [
          {
            estadoId: ESTADO_PEDIDO.PENDIENTE,
            usuarioId: 42,
            detalles: [{ cantidad: 5 }],
          },
        ],
      };

      const result = (packageService as any)._mapComputedFields(fakePackageEntity);

      expect(result.cant_productos_reservados).toBe(0);
    });

    it("PedidoService excluye pedidos Pendientes aunque el contador persistido tenga reservas viejas", () => {
      const fakePedidoEntity = {
        id_pedido: 1,
        paquetePublicado: {
          id_paquete_publicado: 1,
          cant_productos_reservados: 4,
          pedidos: [
            {
              estadoId: ESTADO_PEDIDO.PENDIENTE,
              usuarioId: 42,
              detalles: [{ cantidad: 4 }],
            },
          ],
        },
      };

      const result = (pedidoService as any)._mapComputedFields(fakePedidoEntity);

      expect(result.paquetePublicado.cant_productos_reservados).toBe(0);
    });

    it("PaquetePublicadoService incluye pedidos Pagados en cant_productos_reservados", () => {
      const fakePackageEntity = {
        id_paquete_publicado: 1,
        cant_productos_reservados: 0,
        cant_usuarios_registrados: 0,
        pedidos: [
          {
            estadoId: ESTADO_PEDIDO.PAGADO,
            usuarioId: 42,
            detalles: [{ cantidad: 3 }],
          },
        ],
      };

      const result = (packageService as any)._mapComputedFields(fakePackageEntity);

      expect(result.cant_productos_reservados).toBe(3);
    });
  });
});
