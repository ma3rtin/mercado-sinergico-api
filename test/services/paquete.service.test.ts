import { PaqueteBaseService } from "../../src/services/paqueteBase.service";
import { PaqueteBaseDTO } from "../../src/dtos/paqueteBase.dto";

jest.mock("../../src/generated/prisma", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $transaction: jest.fn().mockImplementation(async (callback) => {
        // Mock transaction context (tx)
        const tx = {
          categoria: {
            findUnique: jest.fn().mockResolvedValue({ 
              id_categoria: 1, 
              nombre: "Categoria Test" 
            }),
          },
          paqueteBase: {
            create: jest.fn().mockResolvedValue({ 
              id_paquete_base: 1, 
              nombre: "Test",
              descripcion: "Desc",
              imagen_url: "",
              categoria_id: 1
            }),
            findUnique: jest.fn().mockResolvedValue({
              id_paquete_base: 1,
              nombre: "Test"
            }),
            update: jest.fn().mockResolvedValue({
              id_paquete_base: 1,
              nombre: "Test Updated"
            }),
            delete: jest.fn().mockResolvedValue({
              id_paquete_base: 1,
              nombre: "Test"
            }),
            findMany: jest.fn().mockResolvedValue([
              { id_paquete_base: 1, nombre: "Test" }
            ])
          },
          paqueteBaseProducto: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        // Execute the callback with the mocked tx
        return callback(tx);
      }),
      paqueteBase: {
        findMany: jest.fn().mockResolvedValue([
          { 
            id_paquete_base: 1, 
            nombre: "Test",
            productos: []
          }
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id_paquete_base: 1,
          nombre: "Test",
          productos: []
        }),
        update: jest.fn().mockResolvedValue({
          id_paquete_base: 1,
          nombre: "Test Updated"
        }),
        delete: jest.fn().mockResolvedValue({
          id_paquete_base: 1,
          nombre: "Test"
        }),
      },
      categoria: {
        findUnique: jest.fn().mockResolvedValue({ 
          id_categoria: 1,
          nombre: "Categoria Test"
        }),
      },
      paqueteBaseProducto: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    })),
  };
});

describe("PaqueteService", () => {
  const service = new PaqueteBaseService();
  /*
//import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export enum EstadoPaquete {
  ABIERTO = "Abierto",
  CERRADO = "Cerrado",
  CANCELADO = "Cancelado",
  INCOMPLETO = "Incompleto",
  PENDIENTE = "Pendiente",
}

export enum TipoPaquete {
  SINERGICO = "Sinérgico",
  ENERGICO = "Enérgico",
}

export class PaqueteBaseDTO {
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @IsString({ message: "El nombre debe ser una cadena de texto" })
  @MinLength(3, {
    message: "El nombre debe contener un mínimo de 3 caracteres",
  })
  nombre!: string;

  @IsNotEmpty({ message: "La descripción es obligatoria" })
  @IsString({ message: "La descripción debe ser una cadena de texto" })
  descripcion!: string;

  @IsOptional()
  @IsString({ message: "La imagen debe ser una cadena de texto" })
  imagen_url!: string;

  @IsNotEmpty()
  @IsNumber({}, { message: "El id de la categoría debe ser un número" })
  @Type(() => Number)
  categoria_id!: number;

  @IsNotEmpty()
  @IsNumber({}, { message: "El id de la marca debe ser un número" })
  @Type(() => Number)
  marcaId!: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true, message: "Cada producto debe ser un número" })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number);
    return [Number(value)];
  })
  productos?: number[];
}
*/
  it("debería crear un paquete y devolverlo", async () => {
    const dto: PaqueteBaseDTO = {
      nombre: "Test",
      descripcion: "Descripción de prueba",
      categoria_id: 1,
      marcaId: 1,
      imagen_url: "http://example.com/image.png",
      productos: [1, 2, 3],
    };
    
    const result = await service.create(dto);
    
    expect(result).toHaveProperty("id_paquete_base");
    expect(result.nombre).toBe("Test");
  });

  it("debería obtener todos los paquetes", async () => {
    const result = await service.getAll();
    
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("debería obtener un paquete por id", async () => {
    const result = await service.getById(1);
    
    expect(result).toHaveProperty("id_paquete_base");
    expect(result?.nombre).toBe("Test");
  });

  it("debería actualizar un paquete", async () => {
    const dto: PaqueteBaseDTO = {
      nombre: "Test Updated",
      descripcion: "Desc Updated",
      categoria_id: 1,
      marcaId: 1,
      productos: [],
      imagen_url: "",
    };
    
    const result = await service.update(1, dto);
    
    expect(result).toHaveProperty("id_paquete_base");
  });

  it("debería eliminar un paquete", async () => {
    const result = await service.delete(1);
    
    expect(result).toHaveProperty("id_paquete_base");
  });
});