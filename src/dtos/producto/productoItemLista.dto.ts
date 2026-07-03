interface ProductoItemData {
  id_producto: number;
  nombre: string;
  precio: number;
  tipo: string | null;
  stock: number | null;
  imagen_url: string | null;
  plantillaId: number | null;
  marca?: {
    id_marca: number;
    nombre: string;
  } | null;
  categoria?: {
    id_categoria: number;
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
    marca: {
      id_marca: number;
      nombre: string;
    };
    categoria: {
      id_categoria: number;
      nombre: string;
    };
    tieneVariantes: boolean;
    cantidadVariantes: number;

    constructor(producto: ProductoItemData) {
      this.id = producto.id_producto;
      this.nombre = producto.nombre;
      this.precio = producto.precio;
      this.tipo = producto.tipo || 'POR_DEFINIR';
      this.stock = producto.stock;
      this.imagen = producto.imagen_url;
      this.marca = {
        id_marca: producto.marca?.id_marca ?? 0,
        nombre: producto.marca?.nombre || '',
      };
      this.categoria = {
        id_categoria: producto.categoria?.id_categoria ?? 0,
        nombre: producto.categoria?.nombre || '',
      };
      this.tieneVariantes = producto.plantillaId !== null;
      this.cantidadVariantes = producto.variantes?.length || 0;
    }
  }