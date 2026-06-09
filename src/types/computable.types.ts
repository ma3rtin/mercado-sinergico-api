export type DetalleComputable = { 
  cantidad?: number; 
};

export type PedidoComputable = {
  estadoId?: number;
  usuario?: { id?: number };
  usuarioId?: number;
  detalles?: DetalleComputable[];
  pedidoProductos?: DetalleComputable[];
  monto_total?: string | number | null;
};

export type PaqueteComputable = {
  pedidos?: PedidoComputable[];
  cant_usuarios_registrados?: number;
  cant_productos_reservados?: number;
  monto_total?: number | string | null;
  tipo?: string;
  paqueteBase?: {
    tipo?: string;
  };
};
