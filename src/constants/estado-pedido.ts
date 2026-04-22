export const ESTADO_PEDIDO = {
  PENDIENTE: 1,
  PAGADO: 2,
  REEMBOLSADO: 3,
  EN_PREPARACION: 4,
  EN_CAMINO: 5,
  RECIBIDO: 6,
} as const;

export type EstadoPedido = typeof ESTADO_PEDIDO[keyof typeof ESTADO_PEDIDO];
