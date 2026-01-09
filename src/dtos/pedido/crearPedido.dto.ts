import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CrearPedidoDTO {
    @IsNumber()
    @IsNotEmpty( { message: 'El id del paquete publicado es obligatorio' } )
    productoId!: number;

    @IsNumber()
    @IsOptional()
    varianteId?: number;

    @IsNumber()
    @IsNotEmpty( { message: 'La cantidad es obligatoria' } )
    cantidad!: number;
}