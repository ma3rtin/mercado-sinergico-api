import { validate } from "class-validator";
import { UsuarioDTO } from "../../src/dtos/usuario/usuario.dto";

describe("UsuarioDTO", () => {
    it("debería fallar si falta email o contraseña", async () => {
        const dto = new UsuarioDTO();
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it("debería pasar si los datos son correctos", async () => {
        const dto = Object.assign(new UsuarioDTO(), {
            email: "test@example.com",
            contraseña: "Password123",
            nombre: "User Test",
            telefono: "1234567890",
            fecha_nac: "2000-01-01"
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });
});
