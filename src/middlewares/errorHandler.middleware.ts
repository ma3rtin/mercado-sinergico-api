import { CustomError } from '../errors/custom.error.js';
import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.log(`[ErrorHandler] Capturando error en ruta: ${req.method} ${req.url}`);

  if (err instanceof CustomError) {
    if (err.status === 500) {
      console.error('[ErrorHandler] CustomError con status 500 detectado:', err);
    }
    return res.status(err.status).json({ error: err.message, message: err.message });
  }

  console.error('[ErrorHandler] Unexpected error:', err);
  return res.status(500).json({ error: 'Internal Server Error', message: 'Internal Server Error' });
}
