import { IsArray, IsInt } from 'class-validator';

export class NotificarEnvioDTO {
  @IsArray()
  @IsInt({ each: true })
  pedidoIds!: number[];
}
