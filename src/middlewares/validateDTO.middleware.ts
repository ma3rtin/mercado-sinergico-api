import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';

export function validarDto<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    if (
      !contentType.includes('application/json') &&
      !contentType.includes('multipart/form-data')
    ) {
      return res.status(400).json({
        message: 'El body debe enviarse en formato JSON o multipart/form-data',
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'El body no puede estar vacío',
      });
    }

    const dto = plainToInstance(dtoClass, req.body);

    const errors = await validate(dto);
    if (errors.length > 0) {
      console.log('[DEBUG] validarDto RECHAZANDO:', errors.map(e => ({
        property: e.property,
        constraints: e.constraints,
      })));
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        })),
      });
    }

    req.body = dto;
    next();
  };
}
