import { IsInt, IsArray, ArrayNotEmpty} from 'class-validator';

export class AgregarProductoPaqueteDTO {
  @IsInt({ message: 'El ID del paquete debe ser un número entero' })
  paqueteBaseId!: number;

  @IsArray({ message: 'Se requiere un array de IDs de productos' })
  @ArrayNotEmpty({ message: 'Debe haber al menos un producto' })
  @IsInt({ each: true, message: 'Cada ID de producto debe ser un número entero' })
  productosId!: number[];
}
