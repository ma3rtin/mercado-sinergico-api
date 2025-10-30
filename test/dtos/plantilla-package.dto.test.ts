// test/dtos/plantilla-package.dto.test.ts
import { validate } from "class-validator";
import { PlantillaDTO } from '../../src/dtos/dtos-plantilla/plantilla.dto';
import { CaracteristicaDTO } from '../../src/dtos/dtos-plantilla/caracteristica.dto';
import { OpcionDTO } from '../../src/dtos/dtos-plantilla/opcion.dto';

describe("DTOs de Plantilla", () => {

    describe("OpcionDTO", () => {
        it("debería fallar la validación si falta el nombre", async () => {
            const dto = new OpcionDTO();
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toEqual(
                expect.objectContaining({
                    isNotEmpty: "El nombre es obligatorio"
                })
            );
        });

        it("debería pasar la validación con datos correctos (solo nombre)", async () => {
            const dto = Object.assign(new OpcionDTO(), {
                nombre: "Rojo"
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it("debería pasar la validación con ID y nombre", async () => {
            const dto = Object.assign(new OpcionDTO(), {
                id: 1,
                nombre: "Azul"
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it("debería fallar si el ID no es un número entero", async () => {
            const dto = Object.assign(new OpcionDTO(), {
                id: "no-es-numero",
                nombre: "Verde"
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const idError = errors.find(error => error.property === 'id');
            expect(idError?.constraints).toEqual(
                expect.objectContaining({
                    isInt: "El id debe ser un número entero"
                })
            );
        });

        it("debería fallar si el nombre está vacío", async () => {
            const dto = Object.assign(new OpcionDTO(), {
                nombre: ""
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toEqual(
                expect.objectContaining({
                    isNotEmpty: "El nombre es obligatorio"
                })
            );
        });
    });

    describe("CaracteristicaDTO", () => {
        it("debería fallar la validación si faltan datos obligatorios", async () => {
            const dto = new CaracteristicaDTO();
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);

            // Verificar que falla por nombre y opciones
            const nombreError = errors.find(error => error.property === 'nombre');
            const opcionesError = errors.find(error => error.property === 'opciones');

            expect(nombreError?.constraints).toEqual(
                expect.objectContaining({
                    isNotEmpty: "El nombre es obligatorio"
                })
            );

            // aquí comprobamos que existan ambas constraints: isNotEmpty (tu mensaje original)
            // y arrayMinSize (la validación real para arrays vacíos)
            expect(opcionesError?.constraints).toEqual(
                expect.objectContaining({
                    arrayMinSize: "Las opciones no deben estar vacías",
                    isNotEmpty: "Las opciones no deben estar vacías"
                })
            );
        });

        it("debería pasar la validación con datos correctos", async () => {
            const opciones = [
                Object.assign(new OpcionDTO(), { nombre: "Opción 1" }),
                Object.assign(new OpcionDTO(), { nombre: "Opción 2" })
            ];

            const dto = Object.assign(new CaracteristicaDTO(), {
                nombre: "Color",
                opciones: opciones
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it("debería pasar la validación con ID", async () => {
            const opciones = [
                Object.assign(new OpcionDTO(), { id: 1, nombre: "Rojo" }),
                Object.assign(new OpcionDTO(), { id: 2, nombre: "Azul" })
            ];

            const dto = Object.assign(new CaracteristicaDTO(), {
                id: 1,
                nombre: "Color",
                opciones: opciones
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it("debería fallar si el ID no es un número entero", async () => {
            const opciones = [
                Object.assign(new OpcionDTO(), { nombre: "Opción 1" })
            ];

            const dto = Object.assign(new CaracteristicaDTO(), {
                id: "no-es-numero",
                nombre: "Tamaño",
                opciones: opciones
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const idError = errors.find(error => error.property === 'id');
            expect(idError?.constraints).toEqual(
                expect.objectContaining({
                    isInt: "El id debe ser un número entero"
                })
            );
        });

        it("debería fallar si el nombre está vacío", async () => {
            const opciones = [
                Object.assign(new OpcionDTO(), { nombre: "Opción 1" })
            ];

            const dto = Object.assign(new CaracteristicaDTO(), {
                nombre: "",
                opciones: opciones
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const nombreError = errors.find(error => error.property === 'nombre');
            expect(nombreError?.constraints).toEqual(
                expect.objectContaining({
                    isNotEmpty: "El nombre es obligatorio"
                })
            );
        });

        it("debería fallar si opciones no es un array", async () => {
            const dto = Object.assign(new CaracteristicaDTO(), {
                nombre: "Color",
                opciones: "no-es-array"
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const opcionesError = errors.find(error => error.property === 'opciones');
            // si no es array, debería incluir isArray; además puede contener arrayMinSize dependiendo del orden/ejecución,
            // pero comprobamos al menos isArray y arrayMinSize (ambos mensajes están presentes con tus DTOs).
            expect(opcionesError?.constraints).toEqual(
                expect.objectContaining({
                    isArray: "Las opciones deben ser un array",
                    arrayMinSize: "Las opciones no deben estar vacías"
                })
            );
        });
        /*
                it("debería fallar si opciones es un array vacío", async () => {
                    const dto = Object.assign(new CaracteristicaDTO(), {
                        nombre: "Color",
                        opciones: []
                    });
        
                    const errors = await validate(dto);
                    expect(errors.length).toBeGreaterThan(0);
        
                    const opcionesError = errors.find(error => error.property === 'opciones');
                    expect(opcionesError?.constraints).toEqual(
                        expect.objectContaining({
                            arrayMinSize: "Las opciones no deben estar vacías",
                            isNotEmpty: "Las opciones no deben estar vacías"
        
                        })
                    );
                });
            });
        */
        describe("PlantillaDTO", () => {
            it("debería fallar la validación si faltan datos obligatorios", async () => {
                const dto = new PlantillaDTO();
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);

                // Verificar que falla por nombre y características
                const nombreError = errors.find(error => error.property === 'nombre');
                const caracteristicasError = errors.find(error => error.property === 'caracteristicas');

                expect(nombreError?.constraints).toEqual(
                    expect.objectContaining({
                        isNotEmpty: "El nombre es obligatorio"
                    })
                );

                expect(caracteristicasError?.constraints).toEqual(
                    expect.objectContaining({
                        isNotEmpty: "Las características no deben estar vacías"
                    })
                );
            });

            it("debería pasar la validación con datos correctos", async () => {
                const opciones = [
                    Object.assign(new OpcionDTO(), { nombre: "Rojo" }),
                    Object.assign(new OpcionDTO(), { nombre: "Azul" })
                ];

                const caracteristicas = [
                    Object.assign(new CaracteristicaDTO(), {
                        nombre: "Color",
                        opciones: opciones
                    })
                ];

                const dto = Object.assign(new PlantillaDTO(), {
                    nombre: "Plantilla Test",
                    caracteristicas: caracteristicas
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it("debería pasar la validación con ID y múltiples características", async () => {
                const opcionesColor = [
                    Object.assign(new OpcionDTO(), { id: 1, nombre: "Rojo" }),
                    Object.assign(new OpcionDTO(), { id: 2, nombre: "Azul" })
                ];

                const opcionesTamaño = [
                    Object.assign(new OpcionDTO(), { nombre: "Grande" }),
                    Object.assign(new OpcionDTO(), { nombre: "Pequeño" })
                ];

                const caracteristicas = [
                    Object.assign(new CaracteristicaDTO(), {
                        id: 1,
                        nombre: "Color",
                        opciones: opcionesColor
                    }),
                    Object.assign(new CaracteristicaDTO(), {
                        nombre: "Tamaño",
                        opciones: opcionesTamaño
                    })
                ];

                const dto = Object.assign(new PlantillaDTO(), {
                    id: 1,
                    nombre: "Plantilla Completa",
                    caracteristicas: caracteristicas
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it("debería fallar si el ID no es un número entero", async () => {
                const opciones = [
                    Object.assign(new OpcionDTO(), { nombre: "Opción 1" })
                ];

                const caracteristicas = [
                    Object.assign(new CaracteristicaDTO(), {
                        nombre: "Color",
                        opciones: opciones
                    })
                ];

                const dto = Object.assign(new PlantillaDTO(), {
                    id: "no-es-numero",
                    nombre: "Plantilla Test",
                    caracteristicas: caracteristicas
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);

                const idError = errors.find(error => error.property === 'id');
                expect(idError?.constraints).toEqual(
                    expect.objectContaining({
                        isInt: "El id debe ser un número entero"
                    })
                );
            });

            it("debería fallar si el nombre está vacío", async () => {
                const opciones = [
                    Object.assign(new OpcionDTO(), { nombre: "Opción 1" })
                ];

                const caracteristicas = [
                    Object.assign(new CaracteristicaDTO(), {
                        nombre: "Color",
                        opciones: opciones
                    })
                ];

                const dto = Object.assign(new PlantillaDTO(), {
                    nombre: "",
                    caracteristicas: caracteristicas
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);

                const nombreError = errors.find(error => error.property === 'nombre');
                expect(nombreError?.constraints).toEqual(
                    expect.objectContaining({
                        isNotEmpty: "El nombre es obligatorio"
                    })
                );
            });

            it("debería fallar si características no es un array", async () => {
                const dto = Object.assign(new PlantillaDTO(), {
                    nombre: "Plantilla Test",
                    caracteristicas: "no-es-array"
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);

                const caracteristicasError = errors.find(error => error.property === 'caracteristicas');
                // comprobamos que existan tanto isArray como arrayMinSize constraints (según tus mensajes en DTO)
                expect(caracteristicasError?.constraints).toEqual(
                    expect.objectContaining({
                        isArray: "Las opciones deben ser un array",
                        arrayMinSize: "Las características no deben estar vacías"
                    })
                );
            });
            /*
                    it("debería fallar si características es un array vacío", async () => {
                        const dto = Object.assign(new PlantillaDTO(), {
                            nombre: "Plantilla Test",
                            caracteristicas: []
                        });
            
                        const errors = await validate(dto);
                        expect(errors.length).toBeGreaterThan(0);
            
                        const caracteristicasError = errors.find(error => error.property === 'caracteristicas');
                        expect(caracteristicasError?.constraints).toEqual(
                            expect.objectContaining({
                                isNotEmpty: "Las características no deben estar vacías",
                                arrayMinSize: "Las características no deben estar vacías"
                            })
                        );
                    });
            */
            it("debería fallar si el nombre no es string", async () => {
                const opciones = [
                    Object.assign(new OpcionDTO(), { nombre: "Opción 1" })
                ];

                const caracteristicas = [
                    Object.assign(new CaracteristicaDTO(), {
                        nombre: "Color",
                        opciones: opciones
                    })
                ];

                const dto = Object.assign(new PlantillaDTO(), {
                    nombre: 123, // número en lugar de string
                    caracteristicas: caracteristicas
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);

                const nombreError = errors.find(error => error.property === 'nombre');
                expect(nombreError?.constraints).toEqual(
                    expect.objectContaining({
                        isString: "El nombre debe ser una cadena de texto"
                    })
                );
            });
        });

        describe("Casos edge y combinaciones", () => {
            it("debería validar correctamente una plantilla compleja", async () => {
                const opcionesColor = [
                    Object.assign(new OpcionDTO(), { id: 1, nombre: "Rojo" }),
                    Object.assign(new OpcionDTO(), { id: 2, nombre: "Verde" }),
                    Object.assign(new OpcionDTO(), { nombre: "Azul" }) // Sin ID
                ];

                const opcionesTamaño = [
                    Object.assign(new OpcionDTO(), { nombre: "XS" }),
                    Object.assign(new OpcionDTO(), { nombre: "M" }),
                    Object.assign(new OpcionDTO(), { nombre: "XL" })
                ];

                const opcionesMaterial = [
                    Object.assign(new OpcionDTO(), { id: 10, nombre: "Algodón" })
                ];

                const caracteristicas = [
                    Object.assign(new CaracteristicaDTO(), {
                        id: 1,
                        nombre: "Color",
                        opciones: opcionesColor
                    }),
                    Object.assign(new CaracteristicaDTO(), {
                        nombre: "Tamaño", // Sin ID
                        opciones: opcionesTamaño
                    }),
                    Object.assign(new CaracteristicaDTO(), {
                        id: 3,
                        nombre: "Material",
                        opciones: opcionesMaterial
                    })
                ];

                const dto = Object.assign(new PlantillaDTO(), {
                    id: 1,
                    nombre: "Plantilla Camisetas",
                    caracteristicas: caracteristicas
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it("debería manejar IDs opcionales correctamente", async () => {
                const opciones = [
                    Object.assign(new OpcionDTO(), { nombre: "Sin ID" })
                ];

                const caracteristicas = [
                    Object.assign(new CaracteristicaDTO(), {
                        nombre: "Sin ID también",
                        opciones: opciones
                    })
                ];

                const dto = Object.assign(new PlantillaDTO(), {
                    // Sin ID en plantilla
                    nombre: "Plantilla Nueva",
                    caracteristicas: caracteristicas
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });
    });
});