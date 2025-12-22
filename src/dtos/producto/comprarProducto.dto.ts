import { IsNotEmpty, IsNumber } from 'class-validator';

export class ComprarProductoDto{
    @IsNumber()
    @IsNotEmpty( { message: 'El id del paquete publicado es obligatorio' } )
    paquetePublicadoId!: number;
    @IsNumber()
    @IsNotEmpty( { message: 'El id del producto es obligatorio' } )
    productoId!: number;
    @IsNumber()
    @IsNotEmpty( { message: 'La cantidad es obligatoria' } )
    cantidad!: number;

}