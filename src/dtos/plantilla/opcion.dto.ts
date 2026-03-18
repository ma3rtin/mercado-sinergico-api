import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

interface OpcionData {
  id?: number;
  nombre: string;
}

export class OpcionDTO {
    @IsOptional()
    @IsInt({ message: 'El id debe ser un número entero' })
    id?: number;

    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre!: string;

    constructor(data?: OpcionData) {
        if (data) {
            this.id = data.id;
            this.nombre = data.nombre;
        }
    }
}