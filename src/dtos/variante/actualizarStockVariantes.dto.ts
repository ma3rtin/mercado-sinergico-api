import { IsArray } from "class-validator";

export class ActualizarStockVariantesDTO {
    @IsArray({ message: 'Las variantes deben ser un array' })
    variantes!: {
      id: number;
      stockFisico: number | null;
    }[];
  }