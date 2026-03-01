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
  fecha_fin?: Date;
}
