import { Type } from "class-transformer";
import { IsNumber, IsPositive } from "class-validator";

export class GenerarVariantesDTO {
    @IsNumber({}, { message: 'El id del producto debe ser un número' })
    @IsPositive()
    @Type(() => Number)
    productoId!: number;
  
    // { caracteristicaId: [opcionId, opcionId, ...] }
    opcionesDisponibles!: Record<string, number[]>;
  }