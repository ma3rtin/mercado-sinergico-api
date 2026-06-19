import { IsInt, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearPedidoDTO {
    @IsNumber()
    @IsNotEmpty({ message: 'El id del paquete publicado es obligatorio' })
    productoId!: number;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    varianteId?: number;

    @IsInt({ message: 'La cantidad debe ser un número entero' })
    @IsNotEmpty({ message: 'La cantidad es obligatoria' })
    @Min(1, { message: 'La cantidad debe ser al menos 1' })
    cantidad!: number;
}