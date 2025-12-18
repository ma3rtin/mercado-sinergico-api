import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ActualizarCantidadDTO {
  @IsNumber()
  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @Min(1)
  cantidad!: number;
}