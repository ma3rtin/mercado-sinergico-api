import { Request, Response } from "express";
import { PlantillaDTO } from "../../src/dtos/dtos-plantilla/plantilla.dto";
import { CustomError } from "../../src/errors/custom.error";
import { PlantillaController } from "../../src/controllers/ControladoresPlantilla/plantilla.controller";

// Mock del PlantillaService
const mockPlantillaService = {
    obtenerPlantillas: jest.fn(),
    crearPlantilla: jest.fn(),
    asignarPlantillaAProducto: jest.fn(),
    actualizarPlantilla: jest.fn(),
    eliminarPlantilla: jest.fn(),
    getPlantillaById: jest.fn(),
};

// Mock de console.error para evitar logs en tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe("PlantillaController", () => {
    let controller: PlantillaController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        controller = new PlantillaController(mockPlantillaService as any);

        mockRequest = {
            body: {},
            params: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    afterAll(() => {
        mockConsoleError.mockRestore();
    });

    describe("getPlantillas", () => {
        it("debería retornar todas las plantillas exitosamente", async () => {
            const plantillas = [
                { id: 1, nombre: "Plantilla 1", caracteristicas: [] },
                { id: 2, nombre: "Plantilla 2", caracteristicas: [] },
            ];

            mockPlantillaService.obtenerPlantillas.mockResolvedValue(plantillas);

            await controller.getPlantillas(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.obtenerPlantillas).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(plantillas);
        });

        it("debería manejar errores y retornar 500", async () => {
            const error = new Error("Error de BD");
            mockPlantillaService.obtenerPlantillas.mockRejectedValue(error);

            await controller.getPlantillas(mockRequest as Request, mockResponse as Response);

            expect(mockConsoleError).toHaveBeenCalledWith("Error obteniendo plantillas:", error);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith(
                new CustomError("Error al traer las plantillas", 500)
            );
        });
    });

    describe("crearPlantilla", () => {
        const validDto: PlantillaDTO = {
            nombre: "Nueva Plantilla",
            caracteristicas: [
                {
                    nombre: "Color",
                    opciones: [{ nombre: "Rojo" }, { nombre: "Azul" }],
                },
            ],
        };

        it("debería crear una plantilla exitosamente", async () => {
            const nuevaPlantilla = { id: 1, ...validDto };
            mockRequest.body = validDto;
            mockPlantillaService.crearPlantilla.mockResolvedValue(nuevaPlantilla);

            await controller.crearPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.crearPlantilla).toHaveBeenCalledWith(validDto);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(nuevaPlantilla);
        });

        it("debería manejar errores de duplicados", async () => {
            mockRequest.body = validDto;
            const error = new Error("unique constraint violation");
            mockPlantillaService.crearPlantilla.mockRejectedValue(error);

            await controller.crearPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockConsoleError).toHaveBeenCalledWith("Error creando plantilla:", error);
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Ya existe una plantilla con ese nombre",
            });
        });

        it("debería manejar errores generales", async () => {
            mockRequest.body = validDto;
            const error = new Error("Error de BD");
            mockPlantillaService.crearPlantilla.mockRejectedValue(error);

            await controller.crearPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockConsoleError).toHaveBeenCalledWith("Error creando plantilla:", error);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith(
                new CustomError("Error al crear la plantilla", 500)
            );
        });
    });

    describe("asignarPlantillaAProducto", () => {
        it("debería asignar plantilla a producto exitosamente", async () => {
            mockRequest.params = { productoId: "1", plantillaId: "2" };
            const productoActualizado = { id: 1, plantillaId: 2 };
            mockPlantillaService.asignarPlantillaAProducto.mockResolvedValue(productoActualizado);

            await controller.asignarPlantillaAProducto(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.asignarPlantillaAProducto).toHaveBeenCalledWith(2, 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(productoActualizado);
        });

        it("debería validar ID de producto inválido", async () => {
            mockRequest.params = { productoId: "invalid", plantillaId: "2" };

            await controller.asignarPlantillaAProducto(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.asignarPlantillaAProducto).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "ID de producto inválido",
            });
        });

        it("debería validar ID de plantilla inválido", async () => {
            mockRequest.params = { productoId: "1", plantillaId: "0" };

            await controller.asignarPlantillaAProducto(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.asignarPlantillaAProducto).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "ID de plantilla inválido",
            });
        });

        it("debería manejar errores de foreign key", async () => {
            mockRequest.params = { productoId: "1", plantillaId: "999" };
            const error = new Error("foreign key constraint violation");
            mockPlantillaService.asignarPlantillaAProducto.mockRejectedValue(error);

            await controller.asignarPlantillaAProducto(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Producto o plantilla no encontrada",
            });
        });

        it("debería manejar errores de constraint", async () => {
            mockRequest.params = { productoId: "1", plantillaId: "2" };
            const error = new Error("constraint violation");
            mockPlantillaService.asignarPlantillaAProducto.mockRejectedValue(error);

            await controller.asignarPlantillaAProducto(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Conflicto de integridad de datos",
            });
        });
    });

    describe("actualizarPlantilla", () => {
        const validDto: PlantillaDTO = {
            nombre: "Plantilla Actualizada",
            caracteristicas: [
                {
                    id: 1,
                    nombre: "Color",
                    opciones: [{ id: 1, nombre: "Rojo" }],
                },
            ],
        };

        it("debería actualizar plantilla exitosamente", async () => {
            mockRequest.params = { id: "1" };
            mockRequest.body = validDto;
            const plantillaActualizada = { id: 1, ...validDto };
            mockPlantillaService.actualizarPlantilla.mockResolvedValue(plantillaActualizada);

            await controller.actualizarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.actualizarPlantilla).toHaveBeenCalledWith(1, validDto);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(plantillaActualizada);
        });

        it("debería validar ID inválido", async () => {
            mockRequest.params = { id: "invalid" };
            mockRequest.body = validDto;

            await controller.actualizarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.actualizarPlantilla).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "ID de plantilla inválido",
            });
        });

        it("debería manejar plantilla no encontrada", async () => {
            mockRequest.params = { id: "999" };
            mockRequest.body = validDto;
            mockPlantillaService.actualizarPlantilla.mockResolvedValue(null);

            await controller.actualizarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Plantilla no encontrada",
            });
        });

        it("debería manejar errores de foreign key", async () => {
            mockRequest.params = { id: "1" };
            mockRequest.body = validDto;
            const error = new Error("foreign key constraint");
            mockPlantillaService.actualizarPlantilla.mockRejectedValue(error);

            await controller.actualizarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Conflicto de integridad de datos",
            });
        });

        it("debería manejar errores de not found del service", async () => {
            mockRequest.params = { id: "1" };
            mockRequest.body = validDto;
            const error = new Error("Plantilla not found");
            mockPlantillaService.actualizarPlantilla.mockRejectedValue(error);

            await controller.actualizarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Plantilla no encontrada",
            });
        });

        it("debería manejar errores de duplicados", async () => {
            mockRequest.params = { id: "1" };
            mockRequest.body = validDto;
            const error = new Error("unique constraint violation");
            mockPlantillaService.actualizarPlantilla.mockRejectedValue(error);

            await controller.actualizarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Ya existe una plantilla con ese nombre",
            });
        });
    });

    describe("eliminarPlantilla", () => {
        it("debería eliminar plantilla exitosamente", async () => {
            mockRequest.params = { id: "1" };
            mockPlantillaService.eliminarPlantilla.mockResolvedValue(undefined);

            await controller.eliminarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.eliminarPlantilla).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalledWith();
        });

        it("debería validar ID inválido", async () => {
            mockRequest.params = { id: "-1" };

            await controller.eliminarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.eliminarPlantilla).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "ID de plantilla inválido",
            });
        });

        it("debería manejar plantilla no encontrada", async () => {
            mockRequest.params = { id: "999" };
            const error = new Error("Plantilla not found");
            mockPlantillaService.eliminarPlantilla.mockRejectedValue(error);

            await controller.eliminarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Plantilla no encontrada",
            });
        });

        it("debería manejar errores generales", async () => {
            mockRequest.params = { id: "1" };
            const error = new Error("Error general");
            mockPlantillaService.eliminarPlantilla.mockRejectedValue(error);

            await controller.eliminarPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockConsoleError).toHaveBeenCalledWith("Error eliminando plantilla:", error);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith(
                new CustomError("Error al eliminar la plantilla", 500)
            );
        });
    });

    describe("getPlantillaById", () => {
        const plantilla = {
            id: 1,
            nombre: "Plantilla Test",
            caracteristicas: [
                {
                    id: 1,
                    nombre: "Color",
                    opciones: [{ id: 1, nombre: "Rojo" }],
                },
            ],
        };

        it("debería obtener plantilla por ID exitosamente", async () => {
            mockRequest.params = { id: "1" };
            mockPlantillaService.getPlantillaById.mockResolvedValue(plantilla);

            await controller.getPlantillaById(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.getPlantillaById).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(plantilla);
        });

        it("debería validar ID inválido", async () => {
            mockRequest.params = { id: "abc" };

            await controller.getPlantillaById(mockRequest as Request, mockResponse as Response);

            expect(mockPlantillaService.getPlantillaById).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "ID de plantilla inválido",
            });
        });

        it("debería manejar plantilla no encontrada", async () => {
            mockRequest.params = { id: "999" };
            mockPlantillaService.getPlantillaById.mockResolvedValue(null);

            await controller.getPlantillaById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Plantilla no encontrada",
            });
        });

        it("debería manejar errores generales", async () => {
            mockRequest.params = { id: "1" };
            const error = new Error("Error de BD");
            mockPlantillaService.getPlantillaById.mockRejectedValue(error);

            await controller.getPlantillaById(mockRequest as Request, mockResponse as Response);

            expect(mockConsoleError).toHaveBeenCalledWith("Error obteniendo plantilla por ID:", error);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith(
                new CustomError("Error al traer la plantilla", 500)
            );
        });
    });

    describe("Casos edge adicionales", () => {
        it("debería manejar IDs con valor 0", async () => {
            mockRequest.params = { id: "0" };

            await controller.getPlantillaById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "ID de plantilla inválido",
            });
        });

        it("debería manejar IDs negativos", async () => {
            mockRequest.params = { productoId: "-5", plantillaId: "2" };

            await controller.asignarPlantillaAProducto(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "ID de producto inválido",
            });
        });

        it("debería manejar errores que no son instancia de Error", async () => {
            mockRequest.body = { nombre: "Test" };
            mockPlantillaService.crearPlantilla.mockRejectedValue("String error");

            await controller.crearPlantilla(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith(
                new CustomError("Error al crear la plantilla", 500)
            );
        });
    });
});