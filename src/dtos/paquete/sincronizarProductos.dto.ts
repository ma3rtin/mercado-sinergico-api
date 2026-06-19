import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class SincronizarProductosDTO {
  @IsArray({ message: 'productosId debe ser un array' })
  @ArrayUnique({ message: 'productosId no puede contener duplicados' })
  @IsInt({ each: true, message: 'Cada ID de producto debe ser un número entero' })
  @Min(1, { each: true, message: 'Cada ID de producto debe ser mayor a 0' })
  productosId!: number[];
}
