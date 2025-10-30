import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

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
}
