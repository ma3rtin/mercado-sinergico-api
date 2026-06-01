import { MarcaService } from '../services/marca.service.js';
import { Request, Response } from 'express';
import { CustomError } from '../errors/custom.error.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class MarcaController {
  constructor(private service: MarcaService) {}

  public getAll = asyncHandler(async (_req: Request, res: Response) => {
    const marcas = await this.service.getAll();
    res.status(200).json(marcas);
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new CustomError('ID inválido', 400);
    }

    const marca = await this.service.getById(id);
    if (!marca) {
      throw new CustomError('Marca no encontrada', 404);
    }

    res.status(200).json(marca);
  });

  public create = asyncHandler(async (req: Request, res: Response) => {
    const { nombre } = req.body;
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      throw new CustomError('El nombre es requerido', 400);
    }

    const newMarca = await this.service.create(nombre);
    res.status(201).json(newMarca);
  });
}
