interface ProductoItemData {
  id_producto: number;
  nombre: string;
  precio: number;
  tipo: string | null;
  stock: number | null;
  imagen_url: string | null;
  plantillaId: number | null;
  marca?: {
    nombre: string;
  } | null;
  categoria?: {
    nombre: string;
  } | null;
  variantes?: unknown[] | null;
}

export class ProductoItemListaDTO {
    id: number;
    nombre: string;
    precio: number;
    tipo: string;
    stock: number | null;
    imagen: string | null;
    marca: string;
    categoria: string;
    tieneVariantes: boolean;
    cantidadVariantes: number;
  
    constructor(producto: ProductoItemData) {
      this.id = producto.id_producto;
      this.nombre = producto.nombre;
      this.precio = producto.precio;
      this.tipo = producto.tipo || 'POR_DEFINIR';
      this.stock = producto.stock;
      this.imagen = producto.imagen_url;
      this.marca = producto.marca?.nombre || '';
      this.categoria = producto.categoria?.nombre || '';
      this.tieneVariantes = producto.plantillaId !== null;
      this.cantidadVariantes = producto.variantes?.length || 0;
    }
  }