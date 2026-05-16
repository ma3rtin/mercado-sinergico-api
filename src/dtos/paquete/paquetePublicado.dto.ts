import { IsNumber, IsPositive, IsNotEmpty, IsDateString, IsString, IsOptional } from 'class-validator';

export class PaquetePublicadoDTO {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre!: string;

  @IsNumber({}, { message: 'El id del paquete base debe ser un número' })
  @IsPositive({ message: 'El id del paquete base debe ser un número positivo' })
  paqueteBaseId!: number;

  @IsNumber({}, { message: 'El id de la zona debe ser un número' })
  @IsPositive({ message: 'El id de la zona debe ser un número positivo' })
  zonaId!: number;

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad de productos debe ser un número' })
  cant_productos?: number;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_inicio!: string;

  @IsNotEmpty({ message: 'La fecha final es obligatoria' })
  @IsDateString({}, { message: 'La fecha final debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_fin!: string;

  @IsOptional()
  @IsNumber()
  descuento?: number;
}

