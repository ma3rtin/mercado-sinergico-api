import { Request, Response } from 'express';
import { ZonaService } from '../services/zona.service';
import { ZonaDTO } from '../dtos/direccion/zona.dto';
import { asyncHandler } from '../utils/asyncHandler';

export class ZonaController {
  constructor(private service: ZonaService) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const zonas = await this.service.getAll();
    res.json(zonas);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const zona = await this.service.getById(Number(id));
    if (!zona) {
      return res.status(404).json({ message: 'Zona no encontrada' });
    }
    res.json(zona);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const zonaDto: ZonaDTO = req.body;

    if (!zonaDto) {
      return res.status(400).json({ message: 'Zona no proporcionada' });
    }

    const zona = await this.service.create(zonaDto);
    res.status(201).json(zona);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const zona = await this.service.update(Number(id), req.body);
    res.json(zona);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.service.delete(Number(id));
    res.status(204).send();
  });
}
