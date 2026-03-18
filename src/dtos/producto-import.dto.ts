import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum TipoProducto {
    SINERGICO = 'SINERGICO',
    ENERGETICO = 'ENERGETICO',
    POR_DEFINIR = 'POR_DEFINIR',
}

export class ProductoImportDto {
    @IsString()
    nombre!: string;

    @IsString()
    descripcion!: string;

    @IsNumber()
    precio!: number;

    @IsString()
    marca!: string;

    @IsString()
    categoria!: string;

    @IsOptional()
    @IsString()
    imagen_url?: string;

    @IsOptional()
    @IsNumber()
    altura?: number;

    @IsOptional()
    @IsNumber()
    ancho?: number;

    @IsOptional()
    @IsNumber()
    profundidad?: number;

    @IsOptional()
    @IsNumber()
    peso?: number;

    @IsOptional()
    @IsNumber()
    stock?: number;

    @IsOptional()
    @IsEnum(TipoProducto)
    tipo?: TipoProducto;

    @IsOptional()
    @IsString()
    plantilla?: string;

    @IsOptional()
    @IsString()
    sku?: string;
}

export class ProductoImportResultDto {
    success: boolean;
    message: string;
    data?: {
        importados: number;
        creados?: number;
        actualizados?: number;
        errores: Array<{
            fila: number;
            mensaje: string;
            datos: Record<string, unknown>;
        }>;
    };

    constructor(success: boolean, message: string, data?: ProductoImportResultDto['data']) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
}
