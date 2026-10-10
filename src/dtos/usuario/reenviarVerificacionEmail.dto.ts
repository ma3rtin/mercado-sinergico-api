import { IsEmail, IsNotEmpty } from 'class-validator';

export class ReenviarVerificacionEmailDTO {
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;
}
