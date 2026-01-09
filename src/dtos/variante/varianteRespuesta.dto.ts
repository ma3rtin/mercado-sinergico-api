export class VarianteRespuestaDTO {
    id: number;
    sku: string | null;
    stockFisico: number | null;
    precioExtra: number;
    precioTotal: number;
    activo: boolean;
    opciones: VarianteOpcionDTO[];
  
    constructor(variante: any, precioBase: number) {
      this.id = variante.id;
      this.sku = variante.sku;
      this.stockFisico = variante.stockFisico;
      this.precioExtra = variante.precioExtra || 0;
      this.precioTotal = precioBase + (variante.precioExtra || 0);
      this.activo = variante.activo;
      this.opciones = variante.opciones?.map((vo: any) => new VarianteOpcionDTO(vo)) || [];
    }
  }

  export class VarianteOpcionDTO {
    caracteristica: string;
    opcion: string;
  
    constructor(opcionVariante: any) {
      this.caracteristica = opcionVariante.caracteristica.nombre;
      this.opcion = opcionVariante.opcion.nombre;
    }
  }