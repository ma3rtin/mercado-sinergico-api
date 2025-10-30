import { CustomError } from '../errors/custom.error';
import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof CustomError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error('Unexpected error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
}
