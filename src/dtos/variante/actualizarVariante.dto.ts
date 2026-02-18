import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';


export class ActualizarVarianteDTO {
    @IsString({ message: 'El SKU debe ser una cadena de texto' })
    @IsOptional()
    sku?: string;

    @IsInt({ message: 'El stock físico debe ser un número entero' })
    @Min(0, { message: 'El stock físico no puede ser negativo' })
    @IsOptional()
    @Type(() => Number)
    stockFisico?: number | null;

    @IsNumber({}, { message: 'El precio extra debe ser un número' })
    @Min(0, { message: 'El precio extra no puede ser negativo' })
    @IsOptional()
    @Type(() => Number)
    precioExtra?: number;

    @IsBoolean({ message: 'El campo activo debe ser un booleano' })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    activo?: boolean;
}
