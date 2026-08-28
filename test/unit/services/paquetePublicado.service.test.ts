import { PaquetePublicadoService } from "../../../src/services/paquetePublicado.service";
import { ESTADO_PAQUETE } from "../../../src/constants/estado-paquete";

jest.mock("../../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockPaquetePublicadoFindMany = jest.fn();
  const mockPaquetePublicadoFindUnique = jest.fn();
  const mockPaquetePublicadoUpdate = jest.fn();
  const mockPaquetePublicadoCreate = jest.fn();
  const mockPaquetePublicadoCount = jest.fn();
  const mockPaquetePublicadoFindFirst = jest.fn();
  const mockTxPaquetePublicadoFindFirst = jest.fn();
  const mockLocalidadFindUnique = jest.fn();
  const mockUsuarioFindUnique = jest.fn();
  const mockPaqueteBaseFindUnique = jest.fn();
  const mockPaqueteBaseUpdate = jest.fn();
  const mockZonaFindUnique = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          paquetePublicado: {
            findMany: mockPaquetePublicadoFindMany,
            findUnique: mockPaquetePublicadoFindUnique,
            update: mockPaquetePublicadoUpdate,
            create: mockPaquetePublicadoCreate,
            count: mockPaquetePublicadoCount,
            // Mock propio, distinto del de prisma.paquetePublicado.findFirst:
            // así los tests pueden verificar que validarNombreUnico corre con
            // el cliente de la transacción y no con el cliente normal.
            findFirst: mockTxPaquetePublicadoFindFirst,
          },
          localidad: { findUnique: mockLocalidadFindUnique },
          usuario: { findUnique: mockUsuarioFindUnique },
          paqueteBase: { findUnique: mockPaqueteBaseFindUnique, update: mockPaqueteBaseUpdate },
          zona: { findUnique: mockZonaFindUnique },
        };
        return callback(tx);
      }),
      paquetePublicado: {
        findMany: mockPaquetePublicadoFindMany,
        findUnique: mockPaquetePublicadoFindUnique,
        update: mockPaquetePublicadoUpdate,
        create: mockPaquetePublicadoCreate,
        count: mockPaquetePublicadoCount,
        findFirst: mockPaquetePublicadoFindFirst,
      },
      localidad: { findUnique: mockLocalidadFindUnique },
      usuario: { findUnique: mockUsuarioFindUnique },
      paqueteBase: { findUnique: mockPaqueteBaseFindUnique, update: mockPaqueteBaseUpdate },
      zona: { findUnique: mockZonaFindUnique },
      pedido: { findMany: jest.fn().mockResolvedValue([]) },
    },
    __mocks: {
      mockTransaction,
      mockPaquetePublicadoFindMany,
      mockPaquetePublicadoFindUnique,
      mockPaquetePublicadoUpdate,
      mockPaquetePublicadoCreate,
      mockPaquetePublicadoCount,
      mockPaquetePublicadoFindFirst,
      mockTxPaquetePublicadoFindFirst,
      mockLocalidadFindUnique,
      mockUsuarioFindUnique,
      mockPaqueteBaseFindUnique,
      mockPaqueteBaseUpdate,
      mockZonaFindUnique,
    },
  };
});

describe("PaquetePublicadoService", () => {
  let service: PaquetePublicadoService;

  beforeEach(() => {
    service = new PaquetePublicadoService();
    jest.clearAllMocks();

    const {
      mockPaquetePublicadoFindMany,
      mockPaquetePublicadoFindUnique,
      mockPaquetePublicadoUpdate,
      mockPaquetePublicadoCreate,
      mockPaquetePublicadoCount,
      mockPaquetePublicadoFindFirst,
      mockTxPaquetePublicadoFindFirst,
      mockLocalidadFindUnique,
      mockUsuarioFindUnique,
      mockPaqueteBaseFindUnique,
      mockPaqueteBaseUpdate,
      mockZonaFindUnique,
    } = require("../../../src/prisma/client").__mocks;

    mockPaquetePublicadoFindMany.mockResolvedValue([]);
    mockPaquetePublicadoFindUnique.mockResolvedValue(null);
    mockPaquetePublicadoUpdate.mockResolvedValue({});
    mockPaquetePublicadoCreate.mockResolvedValue({});
    mockPaquetePublicadoCount.mockResolvedValue(0);
    mockPaquetePublicadoFindFirst.mockResolvedValue(null);
    mockTxPaquetePublicadoFindFirst.mockResolvedValue(null);
    mockLocalidadFindUnique.mockResolvedValue(null);
    mockUsuarioFindUnique.mockResolvedValue(null);
    mockPaqueteBaseFindUnique.mockResolvedValue({ id_paquete_base: 1, nombre: "Base", archivado: false, productos: [] });
    mockPaqueteBaseUpdate.mockResolvedValue({});
    mockZonaFindUnique.mockResolvedValue({ id_zona: 1, nombre: "Zona 1" });
  });

  describe("getAll", () => {
    it("debería retornar array vacío por defecto", async () => {
      const result = await service.getAll();
      expect(result).toEqual([]);
    });

    it("debería filtrar por archivado = false por defecto", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll();
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            archivado: false,
          }),
        })
      );
    });

    it("debería mostrar sólo paquetes Activos aunque no se filtre por zona", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll();
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estadoId: ESTADO_PAQUETE.ACTIVO,
          }),
        })
      );
    });

    it("debería excluir los paquetes vencidos aunque no se filtre por zona", async () => {
      jest.useFakeTimers();
      const ahora = new Date("2026-08-28T10:00:00.000Z");
      jest.setSystemTime(ahora);

      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll();

      const { where } = mockPaquetePublicadoFindMany.mock.calls[0][0];
      expect(where.fecha_fin).toEqual({ gte: ahora });

      jest.useRealTimers();
    });

    it("debería aplicar el mismo filtro con y sin zona", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;

      await service.getAll();
      const sinZona = mockPaquetePublicadoFindMany.mock.calls[0][0].where;

      mockPaquetePublicadoFindMany.mockClear();
      await service.getAll(undefined, undefined, false, undefined, undefined, [4]);
      const conZona = mockPaquetePublicadoFindMany.mock.calls[0][0].where;

      expect(sinZona.estadoId).toBe(conZona.estadoId);
      expect(Object.keys(sinZona.fecha_fin)).toEqual(Object.keys(conZona.fecha_fin));
    });

    it("debería devolver los paquetes cerrados cuando se piden con incluirCerrados", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(
        undefined, undefined, false, undefined, undefined, undefined, undefined, undefined, undefined, true
      );

      const { where } = mockPaquetePublicadoFindMany.mock.calls[0][0];
      expect(where.estadoId).toBeUndefined();
      expect(where.fecha_fin).toBeUndefined();
      // el admin igual no quiere ver los archivados
      expect(where.archivado).toBe(false);
    });

    it("countAll debería contar igual que getAll cuando se piden los cerrados", async () => {
      const { mockPaquetePublicadoCount } = require("../../../src/prisma/client").__mocks;
      await service.countAll(false, undefined, undefined, undefined, undefined, undefined, true);

      const { where } = mockPaquetePublicadoCount.mock.calls[0][0];
      expect(where.estadoId).toBeUndefined();
      expect(where.fecha_fin).toBeUndefined();
    });

    it("no debería filtrar por estado ni por fecha cuando includeArchived es true", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, undefined, true);

      const { where } = mockPaquetePublicadoFindMany.mock.calls[0][0];
      expect(where.estadoId).toBeUndefined();
      expect(where.fecha_fin).toBeUndefined();
    });

    it("ordena por id descendente cuando no se pide ningún orden", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll();
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ id_paquete_publicado: "desc" }] })
      );
    });

    it.each([
      ["recientes", { createdAt: "desc" }],
      ["a-z", { nombre: "asc" }],
      ["z-a", { nombre: "desc" }],
      ["mas-participantes", { cant_usuarios_registrados: "desc" }],
    ])("traduce el orden '%s' a la cláusula de prisma correcta", async (orden, esperado) => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, undefined, false, undefined, undefined, undefined, undefined, undefined, orden as string);
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [esperado, { id_paquete_publicado: "desc" }],
        })
      );
    });

    it("cae al orden por defecto si el valor es desconocido", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, undefined, false, undefined, undefined, undefined, undefined, undefined, "no-existe");
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ id_paquete_publicado: "desc" }] })
      );
    });

    it("debería no filtrar por archivado cuando includeArchived es true", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(undefined, undefined, true);
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            archivado: false,
          }),
        })
      );
    });

    it("debería pasar skip y take a prisma para la paginación de paquetes", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(10, 5);
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
    });

    it("debería aplicar filtros de categorías, marcas, zonas, tipos de paquetes y estados en paquetes", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getAll(0, 10, false, [1, 2], [3], [4], ["SINERGICO"], ["por-cerrar"]);
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paqueteBase: expect.objectContaining({
              categoria_id: { in: [1, 2] },
              marcaId: { in: [3] },
            }),
            zonaId: { in: [4] },
            tipo: { in: ["SINERGICO"] },
          }),
        })
      );
    });

    describe("estados especiales", () => {
      const ahora = new Date("2026-08-28T10:00:00.000Z");

      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(ahora);
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      const whereDe = async (estados: string[]) => {
        const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
        await service.getAll(
          undefined, undefined, false, undefined, undefined, undefined, undefined, estados
        );
        return mockPaquetePublicadoFindMany.mock.calls[0][0].where;
      };

      // El resto de la cobertura de estados especiales (por-cerrar,
      // recien-abiertos, populares) va con el testeo de la vista Paquetes:
      // el home no usa ese filtro.
      it("sigue escondiendo los paquetes cerrados al filtrar por estado", async () => {
        const where = await whereDe(["populares"]);

        expect(where.estadoId).toBe(ESTADO_PAQUETE.ACTIVO);
        expect(where.fecha_fin).toEqual({ gte: ahora });
      });
    });
  });

  describe("countAll", () => {
    it("debería llamar a prisma.paquetePublicado.count con los filtros de paquetes correspondientes", async () => {
      const { mockPaquetePublicadoCount } = require("../../../src/prisma/client").__mocks;
      await service.countAll(false, [1, 2], [3], [4], ["SINERGICO"], ["por-cerrar"]);
      expect(mockPaquetePublicadoCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            archivado: false,
            paqueteBase: expect.objectContaining({
              categoria_id: { in: [1, 2] },
              marcaId: { in: [3] },
            }),
            zonaId: { in: [4] },
            tipo: { in: ["SINERGICO"] },
          }),
        })
      );
    });
  });

  describe("getById", () => {
    it("debería retornar null si el paquete publicado no existe", async () => {
      const result = await service.getById(99);
      expect(result).toBeNull();
    });

    it("debería retornar el paquete publicado si existe", async () => {
      const { mockPaquetePublicadoFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindUnique.mockResolvedValue({
        id_paquete_publicado: 1,
        nombre: "Paquete Publicado Test",
        pedidos: [],
        descuento: 0,
      });

      const result = await service.getById(1);
      expect(result).toHaveProperty("id_paquete_publicado", 1);
      expect((result as any)?.nombre).toBe("Paquete Publicado Test");
    });
  });

  describe("create", () => {
    it("debería lanzar un error si el paquete base está archivado", async () => {
      const { mockPaqueteBaseFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaqueteBaseFindUnique.mockResolvedValueOnce({
        id_paquete_base: 1,
        nombre: "Base",
        archivado: true,
        productos: [],
      });

      const dto = {
        nombre: "Test Publicado",
        zonaId: 1,
        paqueteBaseId: 1,
        cant_productos: 10,
        fecha_inicio: "2026-06-20",
        fecha_fin: "2026-07-20",
        descuento: 0,
      };

      await expect(service.create(dto)).rejects.toThrow("No se puede publicar un paquete base archivado");
    });

    const dtoValido = {
      nombre: "Test Publicado",
      zonaId: 1,
      paqueteBaseId: 1,
      cant_productos: 10,
      fecha_inicio: "2026-06-20",
      fecha_fin: "2026-07-20",
      descuento: 0,
    };

    it("debería rechazar con 409 si ya existe una publicación con ese nombre", async () => {
      const { mockTxPaquetePublicadoFindFirst } = require("../../../src/prisma/client").__mocks;
      mockTxPaquetePublicadoFindFirst.mockResolvedValue({ id_paquete_publicado: 99 });

      await expect(service.create(dtoValido)).rejects.toMatchObject({
        status: 409,
        message: expect.stringContaining("Test Publicado"),
      });
    });

    it("debería crear la publicación cuando el nombre es único", async () => {
      const { mockPaquetePublicadoCreate } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoCreate.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Test Publicado" });

      const resultado = await service.create(dtoValido);

      expect(mockPaquetePublicadoCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ nombre: "Test Publicado" }) })
      );
      expect((resultado as any).id_paquete_publicado).toBe(1);
    });

    it("valida el nombre único con el cliente de la transacción, no con prisma directo", async () => {
      const { mockPaquetePublicadoFindFirst, mockTxPaquetePublicadoFindFirst } =
        require("../../../src/prisma/client").__mocks;

      await service.create(dtoValido);

      expect(mockTxPaquetePublicadoFindFirst).toHaveBeenCalled();
      expect(mockPaquetePublicadoFindFirst).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("debería lanzar un error si el nuevo paquete base está archivado", async () => {
      const { mockPaquetePublicadoFindUnique, mockPaqueteBaseFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindUnique.mockResolvedValueOnce({ id_paquete_publicado: 1, paqueteBaseId: 1 });
      mockPaqueteBaseFindUnique.mockResolvedValueOnce({ id_paquete_base: 2, nombre: "Archived Base", archivado: true });

      const dto = {
        paqueteBaseId: 2,
      };

      await expect(service.update(1, dto)).rejects.toThrow("No se puede conectar un paquete base archivado");
    });

    it("debería rechazar con 409 si otra publicación ya tiene ese nombre", async () => {
      const {
        mockPaquetePublicadoFindUnique,
        mockTxPaquetePublicadoFindFirst,
      } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindUnique.mockResolvedValueOnce({
        id_paquete_publicado: 1,
        nombre: "Nombre viejo",
        paqueteBaseId: 1,
      });
      mockTxPaquetePublicadoFindFirst.mockResolvedValue({ id_paquete_publicado: 2 });

      await expect(
        service.update(1, { nombre: "Nombre repetido" } as any)
      ).rejects.toMatchObject({ status: 409 });
    });

    it("no debería contarse a sí misma como duplicado al mantener el nombre", async () => {
      const {
        mockPaquetePublicadoFindUnique,
        mockTxPaquetePublicadoFindFirst,
        mockPaquetePublicadoUpdate,
      } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindUnique.mockResolvedValueOnce({
        id_paquete_publicado: 1,
        nombre: "Mismo nombre",
        paqueteBaseId: 1,
      });
      mockPaquetePublicadoUpdate.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Mismo nombre" });

      await service.update(1, { nombre: "Mismo nombre" } as any);

      expect(mockTxPaquetePublicadoFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id_paquete_publicado: { not: 1 },
          }),
        })
      );
    });
  });

  describe("delete", () => {
    it("debería archivar la publicación al intentar eliminarla (soft-delete)", async () => {
      const { 
        mockPaquetePublicadoFindUnique,
        mockPaquetePublicadoUpdate,
      } = require("../../../src/prisma/client").__mocks;

      mockPaquetePublicadoFindUnique.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Test", archivado: false });
      mockPaquetePublicadoUpdate.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Test", archivado: true });

      const result = await service.delete(1);
      expect((result as any).archivado).toBe(true);
      expect(mockPaquetePublicadoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_paquete_publicado: 1 },
          data: { archivado: true },
        })
      );
    });
  });

  describe("archivar", () => {
    it("debería archivar un paquete publicado existente", async () => {
      const { 
        mockPaquetePublicadoFindUnique,
        mockPaquetePublicadoUpdate,
      } = require("../../../src/prisma/client").__mocks;

      mockPaquetePublicadoFindUnique.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Test", archivado: false });
      mockPaquetePublicadoUpdate.mockResolvedValue({ id_paquete_publicado: 1, nombre: "Test", archivado: true });

      const result = await service.archivar(1, true);
      expect((result as any).archivado).toBe(true);
      expect(mockPaquetePublicadoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_paquete_publicado: 1 },
          data: { archivado: true },
        })
      );
    });

    it("debería lanzar un error si el paquete publicado no existe", async () => {
      const { mockPaquetePublicadoFindUnique } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindUnique.mockResolvedValue(null);

      await expect(service.archivar(99, true)).rejects.toThrow("Paquete no encontrado");
    });
  });

  describe("getPorCerrarse", () => {
    const paqueteCrudo = {
      id_paquete_publicado: 1,
      nombre: "Paquete cerca de cerrar",
      tipo: "SINERGICO",
      cant_usuarios_registrados: 0,
      cant_productos_reservados: 0,
      monto_total: 0,
      pedidos: [
        {
          estadoId: 2,
          usuario: { id: 7 },
          monto_total: 1500,
          detalles: [{ cantidad: 3 }],
        },
      ],
    };

    it("debería pedir sólo paquetes activos y no archivados", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getPorCerrarse();
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estadoId: 1, archivado: false }),
        })
      );
    });

    it("debería acotar la búsqueda a los que cierran dentro de los próximos 30 días", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      const ahora = new Date("2026-03-01T12:00:00Z");
      jest.useFakeTimers().setSystemTime(ahora);

      const limiteEsperado = new Date("2026-03-01T12:00:00Z");
      limiteEsperado.setDate(limiteEsperado.getDate() + 30);

      await service.getPorCerrarse();

      // La cota inferior no es decorativa: sin el gte, un paquete ACTIVO ya
      // vencido se colaba al home y la card lo mostraba como "Finaliza en
      // Finalizado".
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ fecha_fin: { gte: ahora, lte: limiteEsperado } }),
        })
      );
      jest.useRealTimers();
    });

    it("debería ordenar por fecha de cierre ascendente", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      await service.getPorCerrarse();
      expect(mockPaquetePublicadoFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { fecha_fin: "asc" } })
      );
    });

    it("debería retornar un array vacío cuando no hay paquetes por cerrarse", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindMany.mockResolvedValue([]);

      const result = await service.getPorCerrarse();

      expect(result).toEqual([]);
    });

    it("debería devolver los paquetes con los campos computados aplicados", async () => {
      const { mockPaquetePublicadoFindMany } = require("../../../src/prisma/client").__mocks;
      mockPaquetePublicadoFindMany.mockResolvedValue([paqueteCrudo]);

      const [result] = await service.getPorCerrarse();

      expect(result).toEqual(
        expect.objectContaining({
          id_paquete_publicado: 1,
          cant_usuarios_registrados: 1,
          cant_productos_reservados: 3,
          monto_total: 1500,
        })
      );
    });
  });
});
