import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';
import { IsOpcionesDisponibles } from '../validators/isOpcionesDisponibles.validator.js';

export class GenerarVariantesDTO {
    @IsNumber({}, { message: 'El id del producto debe ser un número' })
    @IsPositive()
    @Type(() => Number)
    productoId!: number;

    // { caracteristicaId: [opcionId, opcionId, ...] }
    // IsOpcionesDisponibles ya rechaza undefined/null (no requiere @IsDefined
    // aparte): agregarlo duplicaba el error, porque @ValidateIf en
    // class-validator aplica a TODOS los decoradores de la propiedad, no solo
    // al que sigue, así que tampoco sirve para separar los mensajes acá.
    @IsOpcionesDisponibles()
    opcionesDisponibles!: Record<string, number[]>;
  }