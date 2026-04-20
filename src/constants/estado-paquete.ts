export const ESTADO_PAQUETE = {
  ACTIVO: 1,
  COMPLETO: 2,
  CONFIRMADO: 3,
  ENTREGADO: 4,
  CANCELADO: 5,
} as const;

export type EstadoPaquete = typeof ESTADO_PAQUETE[keyof typeof ESTADO_PAQUETE];
