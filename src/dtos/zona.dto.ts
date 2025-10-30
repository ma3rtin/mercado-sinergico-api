import { IsNotEmpty, IsString } from 'class-validator';

export class ZonaDTO {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    nombre!: string;

    @IsNotEmpty({ message: 'Las localidades son obligatorias' })
    @IsString({ each: true, message: 'Cada localidad debe ser un número' })
    localidades!: number[];
}