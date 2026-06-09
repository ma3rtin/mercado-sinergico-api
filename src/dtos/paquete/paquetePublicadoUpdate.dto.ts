import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class PaquetePublicadoUpdateDTO {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un string' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un string' })
  descripcion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID del estado debe ser un numero' })
  estadoId?: number;

  @IsOptional()
  @IsString({ message: 'El nombre del estado' })
  estadoNombre?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha final debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_fin?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID del paquete base debe ser un numero' })
  paqueteBaseId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de la zona debe ser un numero' })
  zonaId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_inicio?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad de productos debe ser un numero' })
  cant_productos?: number;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser un string base64 o URL' })
  imagen_base64?: string;

  @IsOptional()
  @IsNumber()
  descuento?: number;
}
