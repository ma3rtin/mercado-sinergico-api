import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class VarianteBulkItemDTO {
    @IsNotEmpty({ message: 'El id de la variante es obligatorio' })
    @IsNumber({}, { message: 'El id de la variante debe ser un número' })
    id!: number;

    @IsOptional()
    @IsString({ message: 'El sku debe ser una cadena de texto' })
    sku?: string;

    @IsOptional()
    @IsNumber({}, { message: 'El stock físico debe ser un número' })
    stockFisico?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El precio extra debe ser un número' })
    precioExtra?: number;

    @IsOptional()
    @IsBoolean({ message: 'El estado activo debe ser booleano' })
    activo?: boolean;
}

export class ActualizarVarianteBulkDTO {
    @IsArray({ message: 'Las variantes deben ser un array' })
    @ValidateNested({ each: true })
    @Type(() => VarianteBulkItemDTO)
    variantes!: VarianteBulkItemDTO[];
}
