import { PlantillaDTO } from '../plantilla/plantilla.dto';
import { VarianteRespuestaDTO } from './varianteRespuesta.dto';

interface PlantillaData {
  id: number;
  nombre: string;
  caracteristicas: Array<{
    id: number;
    nombre: string;
    opciones: Array<{
      id: number;
      nombre: string;
    }>;
  }>;
}

interface VarianteFromServiceData {
  id: number;
  sku: string | null;
  stockFisico: number | null;
  precioExtra: number;
  activo: boolean;
  opciones: Array<{
    caracteristica: string;
    opcion: string;
    caracteristicaId: number;
    opcionId: number;
  }>;
}

interface ProductoData {
  id: number;
  nombre: string;
  tipo: string;
  precio?: number;
  plantilla: unknown | null;
}

interface VariantesProductoData {
  producto: ProductoData;
  variantes: VarianteFromServiceData[];
}

export class VariantesProductoRespuestaDTO {
    producto: {
      id: number;
      nombre: string;
      tipo: string;
      precio: number;
    };
    
    plantilla: PlantillaDTO | null;
    variantes: VarianteRespuestaDTO[];
    stockTotal: number | null;
  
    constructor(data: VariantesProductoData) {
      this.producto = {
        id: data.producto.id,
        nombre: data.producto.nombre,
        tipo: data.producto.tipo,
        precio: data.producto.precio || 0,
      };
      
      this.plantilla = data.producto.plantilla 
        ? new PlantillaDTO(data.producto.plantilla as PlantillaData)
        : null;
      
      // Convert service data to VarianteRespuestaDTO format
      const variantesConverted = data.variantes.map((v) => ({
        id: v.id,
        sku: v.sku,
        stockFisico: v.stockFisico,
        precioExtra: v.precioExtra,
        activo: v.activo,
        opciones: v.opciones.map((vo) => ({
          caracteristica: { nombre: vo.caracteristica },
          opcion: { nombre: vo.opcion },
        })),
      }));
      
      this.variantes = variantesConverted.map(
        (v) => new VarianteRespuestaDTO(v, this.producto.precio)
      );
      
      if (data.producto.tipo === 'ENERGETICO') {
        this.stockTotal = this.variantes.reduce(
          (sum, v) => sum + (v.stockFisico || 0), 
          0
        );
      } else {
        this.stockTotal = null;
      }
    }
  }