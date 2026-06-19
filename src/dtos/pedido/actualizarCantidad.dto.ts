import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class ActualizarCantidadDTO {
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad!: number;
}