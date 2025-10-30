import { Request, Response, NextFunction } from 'express';
import { ZonaService } from '../services/zona.service';
import { ZonaDTO } from '../dtos/zona.dto';

export class ZonaController {
  constructor(private service: ZonaService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const zonas = await this.service.getAll();
      res.json(zonas);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const zona = await this.service.getById(Number(id));
      if (!zona) {
        return res.status(404).json({ message: 'Zona no encontrada' });
      }
      res.json(zona);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const zonaDto: ZonaDTO = req.body;
      if (!zonaDto) {
        return res.status(400).json({ message: 'Zona no proporcionada' });
      }
      const zona = await this.service.create(zonaDto);
      res.status(201).json(zona);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const zona = await this.service.update(Number(id), req.body);
      res.json(zona);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.service.delete(Number(id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}