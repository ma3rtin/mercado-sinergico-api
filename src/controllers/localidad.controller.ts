import { Request, Response } from 'express';
import { LocalidadService } from '../services/localidad.service';
import { CustomError } from '../errors/custom.error';
import { asyncHandler } from '../utils/asyncHandler';

export class LocalidadController {
  constructor(private service: LocalidadService) { }

  getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const localidades = await this.service.getAll();
    res.status(200).json(localidades);
  });

  getAllByZona = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      if (!id) {
        throw new CustomError('Id de zona no proporcionado', 400);
      }

      const localidades = await this.service.getAllByZona(Number(id));
      res.status(200).json(localidades);
    }
  );

  create = asyncHandler(
    async (_req: Request, _res: Response): Promise<void> => {
      throw new CustomError('Método no implementado', 501);
    }
  );

  delete = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      throw new CustomError('Método no implementado', 501);
    }
  );
}
