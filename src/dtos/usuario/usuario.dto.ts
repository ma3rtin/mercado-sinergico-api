import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum Rol {
  ADMIN = 'Admin',
  CLIENTE = 'Cliente',
}

export class UsuarioDTO {
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto'})
  nombre!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  @MinLength(6, {
    message: 'La contraseña debe contener un mínimo de 6 caracteres',
  })
  contraseña!: string;

  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MinLength(10, {
    message: 'El teléfono debe contener un mínimo de 10 caracteres',
  })
  telefono!: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_nac!: string;

  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser una cadena' })
  imagen_url?: string;
}
