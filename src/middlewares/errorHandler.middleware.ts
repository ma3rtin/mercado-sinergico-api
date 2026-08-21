import { CustomError } from '../errors/custom.error.js';
import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

/**
 * Mensajes amigables para errores conocidos de Prisma que no son CustomError.
 * P2028: la transacción interactiva no pudo iniciar/terminar a tiempo
 * (pool sin conexiones disponibles o DB lenta) => 503 reintentable.
 */
const MENSAJES_PRISMA: Record<string, { status: number; mensaje: string }> = {
  P2028: {
    status: 503,
    mensaje:
      'La base de datos no respondió a tiempo. Reintentá en unos segundos; si persiste, avisá al equipo de backend.',
  },
};

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.log(`[ErrorHandler] Capturando error en ruta: ${req.method} ${req.url}`);

  if (err instanceof CustomError) {
    if (err.status === 500) {
      console.error('[ErrorHandler] CustomError con status 500 detectado:', err);
    }
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapeo = MENSAJES_PRISMA[err.code];
    console.error(
      `[ErrorHandler] PrismaClientKnownRequestError code=${err.code} | ruta=${req.method} ${req.url} | message=${err.message} | meta=${JSON.stringify(err.meta ?? {})}`
    );
    if (mapeo) {
      return res.status(mapeo.status).json({ error: mapeo.mensaje });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  console.error('[ErrorHandler] Unexpected error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
}
