import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";
import { OpcionDTO } from "../plantilla/opcion.dto";

export class VarianteDTO {
    @IsNumber({}, { message: 'El id del producto debe ser un número' })
    @IsPositive()
    @Type(() => Number)
    productoId!: number;
  
    @IsString({ message: 'El SKU debe ser una cadena de texto' })
    @IsOptional()
    sku?: string;
  
    @IsInt({ message: 'El stock fisico debe ser un número' })
    @IsOptional()
    @IsInt({ message: 'El stock fisico debe ser un número entero' })
    @IsPositive({ message: 'El stock fisico debe ser un número positivo' })
    stockFisico?: number | null;
  
    @IsNumber({}, { message: 'El precio extra debe ser un número' })
    @IsOptional()
    @IsPositive({ message: 'El precio extra debe ser un número positivo' })
    @Type(() => Number)
    precioExtra?: number;
  
    @IsOptional()
    activo?: boolean;
    
    @IsArray({ message: 'Las opciones deben ser un array' })
    @IsNotEmpty({ message: 'Las opciones no deben estar vacías' })
    @ArrayMinSize(1, { message: 'Las opciones no deben estar vacías' })
    opciones!: OpcionDTO[];
  }