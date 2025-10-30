import { Request, Response } from 'express';
import { LocalidadService } from '../services/localidad.service';

const service = new LocalidadService();

export class LocalidadController {
  async getAll(req: Request, res: Response) {
    const localidades = await service.getAll();
    res.json(localidades);
  }
  async getAllByZona(req: Request, res: Response) {
    const { id } = req.params; // id = id de zona
    const localidades = await service.getAllByZona(Number(id));
    res.json(localidades);
  }

  async create(req: Request, res: Response) {
    try {
      // const { id } = req.params; // id de zona
      // const localidad = await service.create(Number(id), req.body);
      // res.status(201).json(localidad);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      // const { id, localidadId } = req.params; // id = zonaId, localidadId = id_localidad
      // await service.delete(Number(id), Number(localidadId));
      // res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
