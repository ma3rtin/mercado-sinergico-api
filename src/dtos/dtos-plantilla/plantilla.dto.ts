import { CaracteristicaDTO } from './caracteristica.dto';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class PlantillaDTO {
    @IsOptional()
    @IsInt({ message: 'El id debe ser un número entero' })
    id?: number;

    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    nombre!: string;
    
    @IsArray({ message: 'Las opciones deben ser un array' })
    @IsNotEmpty({ message: 'Las características no deben estar vacías' })
    @ArrayMinSize(1, { message: 'Las características no deben estar vacías' })
    caracteristicas!: CaracteristicaDTO[];
}


