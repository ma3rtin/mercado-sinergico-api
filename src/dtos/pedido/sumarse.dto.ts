import { IsNotEmpty, IsNumber } from "class-validator";

export class SumarseDTO {
    @IsNumber()
    @IsNotEmpty( { message: 'El id del paquete publicado es obligatorio' } )
    productoId!: number

    @IsNumber()
    @IsNotEmpty( { message: 'La cantidad es obligatoria' } )
    cantidad!: number
}