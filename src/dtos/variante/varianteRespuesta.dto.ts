interface VarianteOpcionData {
  caracteristicaId: number;
  caracteristica: {
    nombre: string;
  };
  opcionId: number;
  opcion: {
    nombre: string;
  };
}

interface VarianteData {
  id: number;
  sku: string | null;
  stockFisico: number | null;
  precioExtra: number | null;
  activo: boolean;
  opciones?: VarianteOpcionData[];
}

export class VarianteRespuestaDTO {
  id: number;
  sku: string | null;
  stockFisico: number | null;
  precioExtra: number;
  precioTotal: number;
  activo: boolean;
  opciones: VarianteOpcionDTO[];

  constructor(variante: VarianteData, precioBase: number) {
    this.id = variante.id;
    this.sku = variante.sku;
    this.stockFisico = variante.stockFisico;
    this.precioExtra = variante.precioExtra || 0;
    this.precioTotal = precioBase + (variante.precioExtra || 0);
    this.activo = variante.activo;
    this.opciones = variante.opciones?.map((vo: VarianteOpcionData) => new VarianteOpcionDTO(vo)) || [];
  }
}

export class VarianteOpcionDTO {
  caracteristicaId: number;
  caracteristica: string;
  opcionId: number;
  opcion: string;

  constructor(opcionVariante: VarianteOpcionData) {
    this.caracteristicaId = opcionVariante.caracteristicaId;
    this.caracteristica = opcionVariante.caracteristica.nombre;
    this.opcionId = opcionVariante.opcionId;
    this.opcion = opcionVariante.opcion.nombre;
  }
}