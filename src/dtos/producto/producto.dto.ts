import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ProductoDTO {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre!: string;

  @IsString({ message: 'La descripcion debe ser una cadena de texto' })
  descripcion!: string;

  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsPositive({ message: 'El precio debe ser un número positivo' })
  @Type(() => Number)
  precio!: number;

  @IsNumber({}, { message: 'El id de la marca debe ser una un numero' })
  @IsPositive({ message: 'El precio debe ser un número positivo' })
  @Type(() => Number)
  marca_id!: number;

  @IsNumber({}, { message: 'El peso debe ser un número' })
  @IsPositive({ message: 'El peso debe ser un número positivo' })
  @Type(() => Number)
  peso!: number;

  @IsNumber({}, { message: 'El alto debe ser un número' })
  @IsPositive({ message: 'El alto debe ser un número positivo' })
  @Type(() => Number)
  altura!: number;

  @IsNumber({}, { message: 'El ancho debe ser un número' })
  @IsPositive({ message: 'El ancho debe ser un número positivo' })
  @Type(() => Number)
  ancho!: number;

  @IsNumber({}, { message: 'La profundidad debe ser un número' })
  @IsPositive({ message: 'La profundidad debe ser un número positivo' })
  @Type(() => Number)
  profundidad!: number;

  @IsNumber({}, { message: 'El id de la categoría debe ser un número' })
  @IsPositive({ message: 'La profundidad debe ser un número positivo' })
  @Type(() => Number)
  categoria_id!: number;

  @IsString({ message: 'La imagen debe ser una cadena de texto' })
  @IsOptional()
  imagen_url?: string;

  @IsArray({ message: 'Las imagenes deben ser un array' })
  @IsString({ each: true, message: 'Cada imagen debe ser una cadena de texto' })
  @IsOptional()
  imagenes?: string[];

  @IsNumber({}, { message: 'El stock debe ser un número' })
  @IsPositive({ message: 'El stock debe ser un número positivo' })
    @IsOptional()
  @Type(() => Number)
  stock?: number;

  @IsNumber({}, { message: 'El id de la plantilla debe ser un número' })
  @IsPositive({ message: 'El id de la plantilla debe ser un número positivo' })
  @IsOptional()
  @Type(() => Number)
  plantillaId?: number;
}
