import { validate } from 'class-validator';
import { PaqueteBaseDTO } from './../../../src/dtos/paquete/paqueteBase.dto';

describe("PaqueteDTO", () => {
  it("deberia fallar la validacion si falta algun dato", async () => {
    const dto = new PaqueteBaseDTO();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("deberia pasar la validacion si los datos son correctos", async () => {
    const dto = Object.assign(new PaqueteBaseDTO(), {
      nombre: "Paquete Test",
      descripcion: "Descripción",
      categoria_id: 1,
      marcaId: 1,
      productos: [],
      imagen_url: "",
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
