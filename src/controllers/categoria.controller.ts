import { CategoriaService } from '../services/categoria.service';
import { Request, Response } from 'express';
import { CustomError } from '../errors/custom.error';
import { asyncHandler } from '../utils/asyncHandler';

export class CategoriaController {
  constructor(private service: CategoriaService) {}

  public getAll = asyncHandler(async (_req: Request, res: Response) => {
    const categorias = await this.service.getAll();
    res.status(200).json(categorias);
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const id: number = parseInt(req.params.id, 10);
    const categoria = await this.service.getById(id);

    if (!categoria) {
      throw new CustomError('Categoria no encontrada', 404);
    }

    res.status(200).json(categoria);
  });

  public create = asyncHandler(async (req: Request, res: Response) => {
    const { nombre } = req.body;
    if (!nombre) {
      throw new CustomError('El nombre es requerido', 400);
    }

    const newCategoria = await this.service.create(nombre);
    res.status(201).json(newCategoria);
  });
}
