import { IsNumber, IsPositive, IsNotEmpty, IsDateString } from 'class-validator';

export class PaquetePublicadoDTO{
  @IsNumber({}, { message: 'El id del paquete base debe ser un número' })
  @IsPositive({ message: 'El id del paquete base debe ser un número positivo' })  
  paqueteBaseId!: number;

  @IsNumber({}, { message: 'El id de la zona debe ser un número' })
  @IsPositive({ message: 'El id de la zona debe ser un número positivo' })  
  zonaId!: number;

  @IsNumber({}, { message: 'La cantidad de productos debe ser un número' })
  @IsPositive({ message: 'La cantidad de productos debe ser un número positivo' })  
  cant_productos!: number;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_inicio!: Date;

  @IsNotEmpty({ message: 'La fecha final es obligatoria' })
  @IsDateString({}, { message: 'La fecha final debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_fin!: Date;
}

