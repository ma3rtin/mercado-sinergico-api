import { PlantillaService } from "../../../src/services/plantilla.service";
import { PlantillaDTO } from "../../../src/dtos/plantilla/plantilla.dto";

jest.mock("../../../src/prisma/client", () => {
  const mockTransaction = jest.fn();
  const mockPlantillaUpdate = jest.fn();
  const mockPlantillaFindUnique = jest.fn();
  const mockCaracteristicaFindMany = jest.fn();
  const mockCaracteristicaDelete = jest.fn();
  const mockCaracteristicaUpdate = jest.fn();
  const mockCaracteristicaCreate = jest.fn();
  const mockOpcionDelete = jest.fn();
  const mockOpcionUpdate = jest.fn();
  const mockOpcionCreate = jest.fn();

  return {
    prisma: {
      $transaction: mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          plantilla: { update: mockPlantillaUpdate, findUnique: mockPlantillaFindUnique },
          caracteristica: {
            findMany: mockCaracteristicaFindMany,
            delete: mockCaracteristicaDelete,
            update: mockCaracteristicaUpdate,
            create: mockCaracteristicaCreate,
          },
          opcion: {
            delete: mockOpcionDelete,
            update: mockOpcionUpdate,
            create: mockOpcionCreate,
          },
        };
        return await callback(tx);
      }),
      plantilla: { update: mockPlantillaUpdate, findUnique: mockPlantillaFindUnique },
      caracteristica: {
        findMany: mockCaracteristicaFindMany,
        delete: mockCaracteristicaDelete,
        update: mockCaracteristicaUpdate,
        create: mockCaracteristicaCreate,
      },
      opcion: { delete: mockOpcionDelete, update: mockOpcionUpdate, create: mockOpcionCreate },
    },
    __mocks: {
      mockTransaction,
      mockPlantillaUpdate,
      mockPlantillaFindUnique,
      mockCaracteristicaFindMany,
      mockCaracteristicaDelete,
      mockCaracteristicaUpdate,
      mockCaracteristicaCreate,
      mockOpcionDelete,
      mockOpcionUpdate,
      mockOpcionCreate,
    },
  };
});

describe("PlantillaService - actualizarPlantilla", () => {
  let service: PlantillaService;
  let mocks: any;

  beforeEach(() => {
    service = new PlantillaService();
    jest.clearAllMocks();

    mocks = require("../../../src/prisma/client").__mocks;

    mocks.mockPlantillaUpdate.mockResolvedValue({});
    mocks.mockPlantillaFindUnique.mockResolvedValue({});
    mocks.mockCaracteristicaFindMany.mockResolvedValue([]);
    mocks.mockCaracteristicaCreate.mockResolvedValue({});
    mocks.mockCaracteristicaUpdate.mockResolvedValue({});
    mocks.mockCaracteristicaDelete.mockResolvedValue({});
    mocks.mockOpcionCreate.mockResolvedValue({});
    mocks.mockOpcionUpdate.mockResolvedValue({});
    mocks.mockOpcionDelete.mockResolvedValue({});
    mocks.mockTransaction.mockClear();
  });

  it("debería actualizar plantilla con características y opciones", async () => {
    const plantillaId = 1;
    const dto: PlantillaDTO = { nombre: "Test", caracteristicas: [] };
    await service.actualizarPlantilla(plantillaId, dto);
    expect(mocks.mockPlantillaUpdate).toHaveBeenCalled();
  });
});
