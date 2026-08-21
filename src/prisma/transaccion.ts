/**
 * Opciones por defecto para transacciones interactivas de Prisma.
 *
 * Los defaults de Prisma son maxWait=2000ms / timeout=5000ms, muy ajustados
 * para una DB remota con latencia alta (~360ms RTT) y pool perezoso
 * (minimumIdle: 1): cuando el pool debe crear una conexión nueva
 * (TCP + TLS + auth ~1.4s+), iniciar la transacción supera los 2s y Prisma
 * corta con P2028 "Unable to start a transaction in the given time".
 *
 * maxWait: tiempo máximo para CONSEGUIR conexión e INICIAR la transacción.
 * timeout: tiempo máximo que puede durar la transacción en ejecución.
 */
export const TX_OPTIONS = {
  maxWait: 15000,
  timeout: 30000,
} as const;
