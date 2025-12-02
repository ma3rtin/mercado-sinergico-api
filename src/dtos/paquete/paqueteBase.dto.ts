import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum EstadoPaquete {
  ABIERTO = 'Abierto',
  CERRADO = 'Cerrado',
  CANCELADO = 'Cancelado',
  INCOMPLETO = 'Incompleto',
  PENDIENTE = 'Pendiente',
}

export enum TipoPaquete {
  SINERGICO = 'Sinérgico',
  ENERGICO = 'Enérgico',
}

export class PaqueteBaseDTO {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, {
    message: 'El nombre debe contener un mínimo de 3 caracteres',
  })
  nombre!: string;

  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  descripcion!: string;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser una cadena de texto' })
  imagen_url!: string;

  @IsNotEmpty()
  @IsNumber({}, { message: 'El id de la categoría debe ser un número' })
  @Type(() => Number)
  categoria_id!: number;

  @IsNotEmpty()
  @IsNumber({}, { message: 'El id de la marca debe ser un número' })
  @Type(() => Number)
  marcaId!: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true, message: 'Cada producto debe ser un número' })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    return [Number(value)];
  })
  productos?: number[];
}
