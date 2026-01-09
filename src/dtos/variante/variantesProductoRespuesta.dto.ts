import { PlantillaDTO } from "../plantilla/plantilla.dto";
import { VarianteRespuestaDTO } from "./varianteRespuesta.dto";

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
  
    constructor(data: any) {
      this.producto = {
        id: data.producto.id,
        nombre: data.producto.nombre,
        tipo: data.producto.tipo,
        precio: data.producto.precio || 0,
      };
      
      this.plantilla = data.producto.plantilla 
        ? new PlantillaDTO(data.producto.plantilla)
        : null;
      
      this.variantes = data.variantes.map(
        (v: any) => new VarianteRespuestaDTO(v, this.producto.precio)
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