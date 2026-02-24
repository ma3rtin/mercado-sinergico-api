import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearPedidoDTO {
    @IsNumber()
    @IsNotEmpty({ message: 'El id del paquete publicado es obligatorio' })
    productoId!: number;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    varianteId?: number;

    @IsNumber()
    @IsNotEmpty({ message: 'La cantidad es obligatoria' })
    cantidad!: number;
}