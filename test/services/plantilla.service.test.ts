import { PlantillaService } from "../../src/services/plantilla.service";
import { PlantillaDTO } from "../../src/dtos/plantilla/plantilla.dto";

jest.mock("../../src/prisma/client", () => {
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

    mocks = require("../../src/prisma/client").__mocks;

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

  it("debería procesar correctamente características y opciones cuando los IDs vienen como strings en el DTO", async () => {
    const plantillaId = 1;
    mocks.mockCaracteristicaFindMany.mockResolvedValue([
      {
        id: 10,
        nombre: "Color",
        opciones: [
          { id: 100, nombre: "Rojo" }
        ]
      }
    ]);

    const dto: any = {
      nombre: "Test String IDs",
      caracteristicas: [
        {
          id: "10", // ID como String
          nombre: "Color Modificado",
          opciones: [
            { id: "100", nombre: "Rojo Modificado" } // ID como String
          ]
        }
      ]
    };

    await service.actualizarPlantilla(plantillaId, dto);

    // No se deben haber eliminado ni la característica ni la opción
    expect(mocks.mockCaracteristicaDelete).not.toHaveBeenCalled();
    expect(mocks.mockOpcionDelete).not.toHaveBeenCalled();

    // Se deben haber actualizado la característica y la opción con los IDs numéricos correctos
    expect(mocks.mockCaracteristicaUpdate).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { nombre: "Color Modificado" }
    });
    expect(mocks.mockOpcionUpdate).toHaveBeenCalledWith({
      where: { id: 100 },
      data: { nombre: "Rojo Modificado" }
    });
  });
});
