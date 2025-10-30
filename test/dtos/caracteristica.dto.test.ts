// tests/dto/caracteristica.dto.spec.ts
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CaracteristicaDTO } from '../../src/dtos/dtos-plantilla/caracteristica.dto';

describe('CaracteristicaDTO validation', () => {
    it('debe fallar si falta nombre u opciones', async () => {
        const plain = { opciones: [] }; // falta nombre
        const dto = plainToInstance(CaracteristicaDTO, plain);
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const props = errors.map(e => e.property);
        expect(props).toContain('nombre');
    });

    it('debe fallar si opciones no es array o está vacío', async () => {
        const plain = { nombre: 'Color', opciones: [] }; // según tu DTO, opciones no puede estar vacía
        const dto = plainToInstance(CaracteristicaDTO, plain);
        const errors = await validate(dto);
        // encontrás constraint de isNotEmpty en opciones
        const optErr = errors.find(e => e.property === 'opciones');
        expect(optErr).toBeDefined();
    });

    it('valida OK con payload correcto', async () => {
        const plain = { nombre: 'Color', opciones: [{ nombre: 'Rojo' }, { nombre: 'Azul' }] };
        const dto = plainToInstance(CaracteristicaDTO, plain);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });
});
