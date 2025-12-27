import { IsOptional, IsString } from 'class-validator';
import { PaquetePublicadoDTO } from './paquetePublicado.dto.js';

export class PaquetePublicadoUpdateDTO extends PaquetePublicadoDTO {
  @IsOptional()
  @IsString({ message: 'El estado debe ser un string' })
  estadoNombre?: string;
}
