import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';
import { TipoPaquete } from '@prisma/client';
import { IsOpcionesDisponibles } from '../validators/isOpcionesDisponibles.validator.js';

export class ProductoDTO {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre!: string;

  @IsString({ message: 'La descripcion debe ser una cadena de texto' })
  descripcion!: string;

  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsPositive({ message: 'El precio debe ser un número positivo' })
  @Type(() => Number)
  precio!: number;

  @IsNumber({}, { message: 'El id de la marca debe ser un numero' })
  @IsPositive({ message: 'El id de la marca debe ser un número positivo' })
  @Type(() => Number)
  marca_id!: number;

  @IsNumber({}, { message: 'El peso debe ser un número' })
  @IsPositive({ message: 'El peso debe ser un número positivo' })
  @IsOptional()
  @Type(() => Number)
  peso?: number;

  @IsNumber({}, { message: 'El alto debe ser un número' })
  @IsPositive({ message: 'El alto debe ser un número positivo' })
  @IsOptional()
  @Type(() => Number)
  altura?: number;

  @IsNumber({}, { message: 'El ancho debe ser un número' })
  @IsPositive({ message: 'El ancho debe ser un número positivo' })
  @IsOptional()
  @Type(() => Number)
  ancho?: number;

  @IsNumber({}, { message: 'La profundidad debe ser un número' })
  @IsPositive({ message: 'La profundidad debe ser un número positivo' })
  @IsOptional()
  @Type(() => Number)
  profundidad?: number;

  @IsNumber({}, { message: 'El id de la categoría debe ser un número' })
  @IsPositive({ message: 'El id de la categoría debe ser un número positivo' })
  @Type(() => Number)
  categoria_id!: number;

  @IsString({ message: 'La imagen debe ser una cadena de texto' })
  @IsOptional()
  imagen_url?: string;

  @IsArray({ message: 'Las imagenes deben ser un array' })
  @IsString({ each: true, message: 'Cada imagen debe ser una cadena de texto' })
  @IsOptional()
  imagenes?: string[];

  @ValidateIf((o) => !o.plantillaId)
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @IsPositive({ message: 'El stock debe ser un número positivo' })
  @IsOptional()
  @Type(() => Number)
  stock?: number;

@Transform(({ value }) => {
  // '' | 'null' | null → el usuario pidió quitar la plantilla
  if (value === '' || value === 'null' || value === null) return null;
  // undefined → el campo no se envió, no tocar
  if (value === undefined) return undefined;
  // Cualquier otra cosa que no sea un número válido (ej. "abc") queda como
  // NaN para que @IsNumber la rechace con 400, en vez de convertirse en
  // null y disparar "quitar la plantilla" por un valor basura.
  return Number(value);
})
@IsNumber({}, { message: 'El id de la plantilla debe ser un número' })
@IsPositive({ message: 'El id de la plantilla debe ser un número positivo' })
@IsOptional()
plantillaId?: number | null;

  @IsIn([TipoPaquete.SINERGICO, TipoPaquete.ENERGICO], {
    message: 'El tipo debe ser SINERGICO o ENERGICO',
  })
  @IsOptional()
  tipo?: TipoPaquete;

  @Transform(({ value }) => {
    // multipart/form-data manda el objeto como JSON string; si viene mal
    // formado se deja pasar tal cual para que @IsOpcionesDisponibles lo
    // rechace con un mensaje claro en vez de romper el parseo acá.
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  @IsOpcionesDisponibles()
  @IsOptional()
  opcionesDisponibles?: Record<string, number[]>;
}