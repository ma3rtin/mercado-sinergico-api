import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ProductoDTO } from "../../../src/dtos/producto/producto.dto";

describe("ProductoDTO - transform de plantillaId", () => {
  const baseBody = {
    nombre: "Producto Test",
    descripcion: "Descripción válida del producto",
    precio: 100,
    marca_id: 1,
    categoria_id: 1,
  };

  function transformarPlantillaId(body: Record<string, unknown>) {
    const dto = plainToInstance(ProductoDTO, { ...baseBody, ...body });
    return dto.plantillaId;
  }

  it("debería convertir '' en null (el usuario pidió quitar la plantilla)", () => {
    expect(transformarPlantillaId({ plantillaId: "" })).toBeNull();
  });

  it("debería convertir 'null' en null (el usuario pidió quitar la plantilla)", () => {
    expect(transformarPlantillaId({ plantillaId: "null" })).toBeNull();
  });

  it("debería convertir null en null (el usuario pidió quitar la plantilla)", () => {
    expect(transformarPlantillaId({ plantillaId: null })).toBeNull();
  });

  it("debería convertir '8' en el número 8 (asignar o mantener plantilla)", () => {
    expect(transformarPlantillaId({ plantillaId: "8" })).toBe(8);
  });

  it("debería preservar undefined cuando el campo no se envió (no tocar)", () => {
    expect(transformarPlantillaId({})).toBeUndefined();
  });

  it("un valor no numérico no debería convertirse en null (evita disparar 'quitar plantilla')", () => {
    expect(transformarPlantillaId({ plantillaId: "abc" })).not.toBeNull();
  });

  it("un valor no numérico debería fallar la validación con un error claro", async () => {
    const dto = plainToInstance(ProductoDTO, { ...baseBody, plantillaId: "abc" });
    const errores = await validate(dto);
    const errorPlantilla = errores.find((e) => e.property === "plantillaId");

    expect(errorPlantilla).toBeDefined();
    expect(errorPlantilla?.constraints).toHaveProperty("isNumber");
  });
});

describe("ProductoDTO - validación de opcionesDisponibles", () => {
  const baseBody = {
    nombre: "Producto Test",
    descripcion: "Descripción válida del producto",
    precio: 100,
    marca_id: 1,
    categoria_id: 1,
  };

  async function validarOpciones(opcionesDisponibles: unknown) {
    const dto = plainToInstance(ProductoDTO, { ...baseBody, opcionesDisponibles });
    const errores = await validate(dto);
    return errores.find((e) => e.property === "opcionesDisponibles");
  }

  it("no debería fallar si el campo no se envía (es opcional)", async () => {
    expect(await validarOpciones(undefined)).toBeUndefined();
  });

  it("debería aceptar un objeto { caracteristicaId: [opcionId, ...] } válido", async () => {
    expect(await validarOpciones({ "1": [10, 11] })).toBeUndefined();
  });

  it("debería parsear un JSON string válido (multipart/form-data) y aceptarlo", async () => {
    const dto = plainToInstance(ProductoDTO, {
      ...baseBody,
      opcionesDisponibles: JSON.stringify({ "1": [10, 11] }),
    });
    const errores = await validate(dto);

    expect(errores.find((e) => e.property === "opcionesDisponibles")).toBeUndefined();
    expect(dto.opcionesDisponibles).toEqual({ "1": [10, 11] });
  });

  it("debería rechazar un JSON string mal formado con un error claro (no debe explotar)", async () => {
    const dto = plainToInstance(ProductoDTO, {
      ...baseBody,
      opcionesDisponibles: "{esto no es json",
    });
    const errores = await validate(dto);
    const error = errores.find((e) => e.property === "opcionesDisponibles");

    expect(error).toBeDefined();
    expect(error?.constraints).toHaveProperty("isOpcionesDisponibles");
  });

  it("debería rechazar un array en vez de un objeto", async () => {
    const error = await validarOpciones([1, 2, 3]);
    expect(error?.constraints).toHaveProperty("isOpcionesDisponibles");
  });

  it("debería rechazar valores que no son arrays de números", async () => {
    const error = await validarOpciones({ "1": "no-es-un-array" });
    expect(error?.constraints).toHaveProperty("isOpcionesDisponibles");
  });

  it("debería rechazar un array vacío para una característica", async () => {
    const error = await validarOpciones({ "1": [] });
    expect(error?.constraints).toHaveProperty("isOpcionesDisponibles");
  });

  it("debería rechazar ids negativos o no enteros", async () => {
    expect((await validarOpciones({ "1": [-1] }))?.constraints).toHaveProperty("isOpcionesDisponibles");
    expect((await validarOpciones({ "1": [1.5] }))?.constraints).toHaveProperty("isOpcionesDisponibles");
  });
});
