import { Request, Response } from 'express';
import { LocalidadService } from '../services/localidad.service.js';
import { CustomError } from '../errors/custom.error.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const service = new LocalidadService();

export class LocalidadController {
  getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const localidades = await service.getAll();
    res.status(200).json(localidades);
  });

  getAllByZona = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Id de zona no proporcionado', 400);
      }

      const localidades = await service.getAllByZona(Number(id));
      res.status(200).json(localidades);
    }
  );

  create = asyncHandler(
    async (_req: Request, _res: Response): Promise<void> => {
      // try {
      //   const { id } = req.params; // id de zona
      //   const localidad = await service.create(Number(id), req.body);
      //   res.status(201).json(localidad);
      // } catch (err) {
      //   next(err);
      // }

      throw new CustomError('Método no implementado', 501);
    }
  );

  delete = asyncHandler(
    async (_req: Request, _res: Response): Promise<void> => {
      // try {
      //   const { id, localidadId } = req.params; 
      //   await service.delete(Number(id), Number(localidadId));
      //   res.status(204).send();
      // } catch (err) {
      //   next(err);
      // }

      throw new CustomError('Método no implementado', 501);
    }
  );
}
