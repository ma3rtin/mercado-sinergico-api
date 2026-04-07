import { IsDateString, IsEmail, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UsuarioUpdateDTO {
    @IsOptional()
    @IsEmail({}, { message: 'Email inválido' })
    email?: string;

    @IsOptional()
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    nombre?: string;

    @IsOptional()
    @IsString()
    @MinLength(6, { message: 'La contraseña debe contener un mínimo de 6 caracteres' })
    contraseña?: string;

    @IsOptional()
    @IsString({ message: 'El teléfono debe ser una cadena de texto' })
    @MinLength(10, { message: 'El teléfono debe contener un mínimo de 10 caracteres' })
    telefono?: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
    fecha_nac?: string;

    @IsOptional()
    @IsString({ message: 'La URL de la imagen debe ser una cadena' })
    imagen_url?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El id de la localidad debe ser un número' })
    localidad_id?: number;

    @IsOptional()
    @IsString()
    calle?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    numero?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    piso?: number;

    @IsOptional()
    @IsString()
    dpto?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    cp?: number;
}
