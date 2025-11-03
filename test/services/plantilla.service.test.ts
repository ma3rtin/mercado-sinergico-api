import { PlantillaService } from "../../src/services/plantilla.service";
import { PlantillaDTO } from "../../src/dtos/dtos-plantilla/plantilla.dto";

// Mock de Prisma Client
const mockTransaction = jest.fn();
const mockPlantillaUpdate = jest.fn();
const mockCaracteristicaFindMany = jest.fn();
const mockCaracteristicaDelete = jest.fn();
const mockCaracteristicaUpdate = jest.fn();
const mockCaracteristicaCreate = jest.fn();
const mockOpcionDelete = jest.fn();
const mockOpcionUpdate = jest.fn();
const mockOpcionCreate = jest.fn();
const mockPlantillaFindUnique = jest.fn();

jest.mock("@prisma/client", () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            $transaction: mockTransaction,
            plantilla: {
                update: mockPlantillaUpdate,
                findUnique: mockPlantillaFindUnique,
            },
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
        })),
    };
});

describe("PlantillaService - actualizarPlantilla", () => {
    let service: PlantillaService;

    beforeEach(() => {
        service = new PlantillaService();
        jest.clearAllMocks();

        // Mock del transaction que ejecuta la función callback
        mockTransaction.mockImplementation(async (callback) => {
            const tx = {
                plantilla: {
                    update: mockPlantillaUpdate,
                    findUnique: mockPlantillaFindUnique,
                },
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
        });
    });

    describe("Caso exitoso - Actualización completa", () => {
        it("debería actualizar plantilla con características y opciones existentes", async () => {
            const plantillaId = 1;
            const dto: PlantillaDTO = {
                nombre: "Plantilla Actualizada",
                caracteristicas: [
                    {
                        id: 1,
                        nombre: "Color Actualizado",
                        opciones: [
                            { id: 1, nombre: "Rojo Actualizado" },
                            { id: 2, nombre: "Azul" },
                        ],
                    },
                ],
            };

            // Mock de características actuales
            const caracteristicasActuales = [
                {
                    id: 1,
                    nombre: "Color",
                    plantillaId: 1,
                    opciones: [
                        { id: 1, nombre: "Rojo" },
                        { id: 2, nombre: "Azul" },
                        { id: 3, nombre: "Verde" }, // Esta será eliminada
                    ],
                },
            ];

            const plantillaActualizada = {
                id: 1,
                nombre: "Plantilla Actualizada",
                caracteristicas: [
                    {
                        id: 1,
                        nombre: "Color Actualizado",
                        opciones: [
                            { id: 1, nombre: "Rojo Actualizado" },
                            { id: 2, nombre: "Azul" },
                        ],
                    },
                ],
            };

            mockCaracteristicaFindMany.mockResolvedValue(caracteristicasActuales);
            mockPlantillaFindUnique.mockResolvedValue(plantillaActualizada);

            const resultado = await service.actualizarPlantilla(plantillaId, dto);

            // Verificar que se actualizó el nombre de la plantilla
            expect(mockPlantillaUpdate).toHaveBeenCalledWith({
                where: { id: plantillaId },
                data: { nombre: dto.nombre },
            });

            // Verificar que se buscaron las características actuales
            expect(mockCaracteristicaFindMany).toHaveBeenCalledWith({
                where: { plantillaId },
                include: { opciones: true },
            });

            // Verificar que se actualizó la característica
            expect(mockCaracteristicaUpdate).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { nombre: "Color Actualizado" },
            });

            // Verificar que se eliminó la opción sobrante
            expect(mockOpcionDelete).toHaveBeenCalledWith({
                where: { id: 3 },
            });

            // Verificar que se actualizó la opción
            expect(mockOpcionUpdate).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { nombre: "Rojo Actualizado" },
            });

            // Verificar que se devolvió la plantilla actualizada
            expect(mockPlantillaFindUnique).toHaveBeenCalledWith({
                where: { id: plantillaId },
                include: {
                    caracteristicas: { include: { opciones: true } },
                },
            });

            expect(resultado).toEqual(plantillaActualizada);
        });
    });

    describe("Caso - Eliminar características", () => {
        it("debería eliminar características que no están en el DTO", async () => {
            const plantillaId = 1;
            const dto: PlantillaDTO = {
                nombre: "Plantilla",
                caracteristicas: [
                    {
                        id: 1,
                        nombre: "Color",
                        opciones: [{ id: 1, nombre: "Rojo" }],
                    },
                ],
            };

            const caracteristicasActuales = [
                {
                    id: 1,
                    nombre: "Color",
                    plantillaId: 1,
                    opciones: [{ id: 1, nombre: "Rojo" }],
                },
                {
                    id: 2,
                    nombre: "Tamaño", // Esta será eliminada
                    plantillaId: 1,
                    opciones: [{ id: 2, nombre: "Grande" }],
                },
            ];

            mockCaracteristicaFindMany.mockResolvedValue(caracteristicasActuales);
            mockPlantillaFindUnique.mockResolvedValue({});

            await service.actualizarPlantilla(plantillaId, dto);

            // Verificar que se eliminó la característica que no está en el DTO
            expect(mockCaracteristicaDelete).toHaveBeenCalledWith({
                where: { id: 2 },
            });
        });
    });

    describe("Caso - Crear nuevas características", () => {
        it("debería crear características nuevas sin id", async () => {
            const plantillaId = 1;
            const dto: PlantillaDTO = {
                nombre: "Plantilla",
                caracteristicas: [
                    {
                        // Sin id - será creada
                        nombre: "Nueva Característica",
                        opciones: [
                            { nombre: "Opción 1" },
                            { nombre: "Opción 2" },
                        ],
                    },
                ],
            };

            mockCaracteristicaFindMany.mockResolvedValue([]);
            mockPlantillaFindUnique.mockResolvedValue({});

            await service.actualizarPlantilla(plantillaId, dto);

            // Verificar que se creó la nueva característica
            expect(mockCaracteristicaCreate).toHaveBeenCalledWith({
                data: {
                    nombre: "Nueva Característica",
                    plantillaId,
                    opciones: {
                        create: [
                            { nombre: "Opción 1" },
                            { nombre: "Opción 2" },
                        ],
                    },
                },
            });
        });
    });

    describe("Caso - Crear nuevas opciones", () => {
        it("debería crear opciones nuevas sin id en características existentes", async () => {
            const plantillaId = 1;
            const dto: PlantillaDTO = {
                nombre: "Plantilla",
                caracteristicas: [
                    {
                        id: 1,
                        nombre: "Color",
                        opciones: [
                            { id: 1, nombre: "Rojo" },
                            { nombre: "Nuevo Verde" }, // Nueva opción sin id
                        ],
                    },
                ],
            };

            const caracteristicasActuales = [
                {
                    id: 1,
                    nombre: "Color",
                    plantillaId: 1,
                    opciones: [{ id: 1, nombre: "Rojo" }],
                },
            ];

            mockCaracteristicaFindMany.mockResolvedValue(caracteristicasActuales);
            mockPlantillaFindUnique.mockResolvedValue({});

            await service.actualizarPlantilla(plantillaId, dto);

            // Verificar que se creó la nueva opción
            expect(mockOpcionCreate).toHaveBeenCalledWith({
                data: { nombre: "Nuevo Verde", caracteristicaId: 1 },
            });
        });
    });

    describe("Caso - Eliminar opciones", () => {
        it("debería eliminar opciones que no están en el DTO", async () => {
            const plantillaId = 1;
            const dto: PlantillaDTO = {
                nombre: "Plantilla",
                caracteristicas: [
                    {
                        id: 1,
                        nombre: "Color",
                        opciones: [
                            { id: 1, nombre: "Rojo" },
                        ],
                    },
                ],
            };

            const caracteristicasActuales = [
                {
                    id: 1,
                    nombre: "Color",
                    plantillaId: 1,
                    opciones: [
                        { id: 1, nombre: "Rojo" },
                        { id: 2, nombre: "Azul" }, // Esta será eliminada
                    ],
                },
            ];

            mockCaracteristicaFindMany.mockResolvedValue(caracteristicasActuales);
            mockPlantillaFindUnique.mockResolvedValue({});

            await service.actualizarPlantilla(plantillaId, dto);

            // Verificar que se eliminó la opción que no está en el DTO
            expect(mockOpcionDelete).toHaveBeenCalledWith({
                where: { id: 2 },
            });
        });
    });

    describe("Casos edge", () => {
        it("debería manejar características sin opciones actuales", async () => {
            const plantillaId = 1;
            const dto: PlantillaDTO = {
                nombre: "Plantilla",
                caracteristicas: [
                    {
                        id: 1,
                        nombre: "Color",
                        opciones: [{ nombre: "Nueva Opción" }],
                    },
                ],
            };

            const caracteristicasActuales = [
                {
                    id: 1,
                    nombre: "Color",
                    plantillaId: 1,
                    opciones: [], // Sin opciones actuales
                },
            ];

            mockCaracteristicaFindMany.mockResolvedValue(caracteristicasActuales);
            mockPlantillaFindUnique.mockResolvedValue({});

            await service.actualizarPlantilla(plantillaId, dto);

            // Verificar que se creó la nueva opción
            expect(mockOpcionCreate).toHaveBeenCalledWith({
                data: { nombre: "Nueva Opción", caracteristicaId: 1 },
            });

            // No debe intentar eliminar opciones
            expect(mockOpcionDelete).not.toHaveBeenCalled();
        });

        it("debería manejar DTO con características vacías", async () => {
            const plantillaId = 1;
            const dto: PlantillaDTO = {
                nombre: "Plantilla Vacía",
                caracteristicas: [],
            };

            const caracteristicasActuales = [
                {
                    id: 1,
                    nombre: "Color",
                    plantillaId: 1,
                    opciones: [{ id: 1, nombre: "Rojo" }],
                },
            ];

            mockCaracteristicaFindMany.mockResolvedValue(caracteristicasActuales);
            mockPlantillaFindUnique.mockResolvedValue({});

            await service.actualizarPlantilla(plantillaId, dto);

            // Debe eliminar todas las características actuales
            expect(mockCaracteristicaDelete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });
    });

    describe("Casos de error", () => {
        it("debería propagar errores de la transacción", async () => {
            const plantillaId = 1;
            const dto: PlantillaDTO = {
                nombre: "Plantilla",
                caracteristicas: [],
            };

            mockTransaction.mockRejectedValue(new Error("Error de BD"));

            await expect(service.actualizarPlantilla(plantillaId, dto))
                .rejects
                .toThrow("Error de BD");
        });

        it("debería manejar error al buscar características actuales", async () => {
            const plantillaId = 1;
            const dto: PlantillaDTO = {
                nombre: "Plantilla",
                caracteristicas: [],
            };

            mockCaracteristicaFindMany.mockRejectedValue(new Error("Error findMany"));

            // Restaurar implementación del transaction para este test
            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    plantilla: { update: mockPlantillaUpdate },
                    caracteristica: { findMany: mockCaracteristicaFindMany },
                };
                return await callback(tx);
            });

            await expect(service.actualizarPlantilla(plantillaId, dto))
                .rejects
                .toThrow("Error findMany");
        });
    });
});