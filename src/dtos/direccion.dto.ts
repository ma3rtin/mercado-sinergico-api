import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class DireccionDTO {
  @IsNotEmpty({ message: 'El id de la localidad es obligatorio' })
  @IsNumber({}, { message: 'El id de la localidad debe ser un número' })
  @IsPositive({ message: 'El id de la localidad debe ser positivo' })
  @Type(() => Number)
  localidad_id!: number;

  @IsNotEmpty({ message: 'El codigo postal es obligatorio' })
  @IsNumber({}, { message: 'El codigo postal debe ser un número' })
  @IsPositive({ message: 'El codigo postal debe ser un número positivo' })
  @Type(() => Number)
  codigo_postal!: number;

  @IsNotEmpty({ message: 'La calle es obligatoria' })
  @IsString({ message: 'La calle debe ser una cadena de texto' })
  calle!: string;

  @IsNotEmpty({ message: 'El numero es obligatorio' })
  @IsNumber({}, { message: 'El numero debe ser un número' })
  @IsPositive({ message: 'El numero debe ser un número positivo' })
  @Type(() => Number)
  numero!: number;

  @IsOptional()
  @IsNumber({}, { message: 'El piso debe ser un número' })
  @Type(() => Number)
  piso?: number;

  @IsOptional()
  @IsString({ message: 'El departamento debe ser una cadena de texto' })
  departamento?: string;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser una cadena de texto' })
  imagen_url!: string;
}
