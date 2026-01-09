import { PlantillaDTO } from "../plantilla/plantilla.dto";
import { VarianteRespuestaDTO } from "../variante/varianteRespuesta.dto";

export class ProductoDetalleRespuestaDTO {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    tipo: string;
    stock: number | null;
    imagen: string | null;
    imagenes: string[];
    
    marca: {
      id: number;
      nombre: string;
    };
    
    categoria: {
      id: number;
      nombre: string;
    };
    
    dimensiones: {
      altura: number | null;
      ancho: number | null;
      profundidad: number | null;
      peso: number | null;
    };
    
    plantilla: PlantillaDTO | null;
    variantes: VarianteRespuestaDTO[];
    cantPaquetes: number;
  
    constructor(data: any) {
      this.id = data.producto.id_producto;
      this.nombre = data.producto.nombre;
      this.descripcion = data.producto.descripcion;
      this.precio = data.producto.precio;
      this.tipo = data.producto.tipo;
      this.stock = data.producto.stock;
      this.imagen = data.producto.imagen_url;
      this.imagenes = data.producto.imagenes?.map((img: any) => img.url) || [];
      
      this.marca = {
        id: data.producto.marca.id_marca,
        nombre: data.producto.marca.nombre,
      };
      
      this.categoria = {
        id: data.producto.categoria.id_categoria,
        nombre: data.producto.categoria.nombre,
      };
      
      this.dimensiones = {
        altura: data.producto.altura,
        ancho: data.producto.ancho,
        profundidad: data.producto.profundidad,
        peso: data.producto.peso,
      };
      
      this.plantilla = data.producto.plantilla 
        ? new PlantillaDTO(data.producto.plantilla)
        : null;
      
      this.variantes = data.producto.variantes?.map(
        (v: any) => new VarianteRespuestaDTO(v, data.producto.precio)
      ) || [];
      
      this.cantPaquetes = data.cantPaquetes || 0;
    }
  }