import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GenerarVariantesDTO } from "../../../src/dtos/variante/generarVariantes.dto";

describe("GenerarVariantesDTO", () => {
  async function validarBody(body: Record<string, unknown>) {
    const dto = plainToInstance(GenerarVariantesDTO, { productoId: 1, ...body });
    return validate(dto);
  }

  it("debería aceptar un payload válido", async () => {
    const errores = await validarBody({ opcionesDisponibles: { "1": [10, 11] } });
    expect(errores).toHaveLength(0);
  });

  it("debería rechazar si falta opcionesDisponibles (antes no había ninguna validación en runtime)", async () => {
    const errores = await validarBody({});
    const error = errores.find((e) => e.property === "opcionesDisponibles");

    expect(error).toBeDefined();
    // Un solo motivo de error, no uno duplicado por cada decorador.
    expect(error?.constraints).toEqual({ isOpcionesDisponibles: expect.any(String) });
  });

  it("debería rechazar opcionesDisponibles con forma inválida", async () => {
    const errores = await validarBody({ opcionesDisponibles: [1, 2, 3] });
    const error = errores.find((e) => e.property === "opcionesDisponibles");

    expect(error).toBeDefined();
    expect(error?.constraints).toHaveProperty("isOpcionesDisponibles");
  });

  it("debería rechazar productoId no numérico", async () => {
    const errores = await validarBody({ productoId: "abc", opcionesDisponibles: { "1": [1] } });
    expect(errores.find((e) => e.property === "productoId")).toBeDefined();
  });
});
