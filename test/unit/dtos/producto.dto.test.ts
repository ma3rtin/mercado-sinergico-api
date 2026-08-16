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
