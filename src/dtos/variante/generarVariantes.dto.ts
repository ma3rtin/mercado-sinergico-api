import { Type } from 'class-transformer';
import { IsDefined, IsNumber, IsPositive } from 'class-validator';
import { IsOpcionesDisponibles } from '../validators/isOpcionesDisponibles.validator.js';

export class GenerarVariantesDTO {
    @IsNumber({}, { message: 'El id del producto debe ser un número' })
    @IsPositive()
    @Type(() => Number)
    productoId!: number;

    // { caracteristicaId: [opcionId, opcionId, ...] }
    @IsDefined({ message: 'opcionesDisponibles es obligatorio' })
    @IsOpcionesDisponibles()
    opcionesDisponibles!: Record<string, number[]>;
  }