import { IsNotEmpty, IsString } from 'class-validator';

export class VerificarEmailDTO {
  @IsString({ message: 'El token de verificación es inválido' })
  @IsNotEmpty({ message: 'El token de verificación es obligatorio' })
  token!: string;
}
