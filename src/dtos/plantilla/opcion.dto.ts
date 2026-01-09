import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class OpcionDTO {
    @IsOptional()
    @IsInt({ message: 'El id debe ser un número entero' })
    id?: number;

    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre!: string;

    constructor(data: any) {
        this.id = data.id;
        this.nombre = data.nombre;
    }
}