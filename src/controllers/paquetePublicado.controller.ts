import { NextFunction, Request, Response } from 'express';
import { PaquetePublicadoService } from '../services/paquetePublicado.service';
import { CustomError } from '../errors/custom.error';

export class PaquetePublicadoController {
  constructor(private service: PaquetePublicadoService) { }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const paquetes = await this.service.getAll();
      if (paquetes) res.status(200).json(paquetes);
      else res.status(404).json({ message: 'Paquetes no encontrados' });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || id === '')
        return res
          .status(400)
          .json({ message: 'Id de paquete no proporcionado' });
      else {
        const paquete = await this.service.getById(Number(id));
        if (!paquete)
          return res.status(404).json({ message: 'Paquete no encontrado' });
        res.status(200).json(paquete);
      }
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const paquetePublicadoDTO = req.body;
      if (!paquetePublicadoDTO)
        return res.status(400).json({ message: 'Paquete no proporcionado' });
      else {
        const paquetePublicado = await this.service.create(paquetePublicadoDTO);
        if (!paquetePublicado)
          return res.status(400).json({ message: 'Error al crear paquete' });
        else res.status(201).json(paquetePublicado);
      }
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id)
        return res
          .status(400)
          .json({ message: 'Id de paquete no proporcionado' });
      else {
        const paquetePublicado = await this.service.update(
          Number(id),
          req.body
        );
        if (!paquetePublicado)
          return res
            .status(400)
            .json({ message: 'Error al actualizar paquete' });
        else res.json(paquetePublicado);
      }
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || id === '')
        res.status(400).json({ message: 'Id de paquete no proporcionado' });
      else {
        const paquetePublicado = await this.service.delete(Number(id));
        if (!paquetePublicado)
          res.status(400).json({ message: 'Error al eliminar paquete' });
        else res.status(200).json({ message: 'Paquete eliminado' });
      }
    } catch (error) {
      next(error);
    }
  }
  async getPorCerrarse(req: Request, res: Response, next: NextFunction) {
    try {
      const paquetes = await this.service.getPorCerrarse();

      if (!paquetes || paquetes.length === 0)
        return res.status(404).json({ message: 'No hay paquetes por cerrarse' });

      res.status(200).json(paquetes);
    } catch (error) {
      next(error);
    }
  }

  async getByLocation(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Intentar obtener ID de usuario autenticado (si middleware lo inyectó)
      const userId = req.user?.id;

      // 2. Intentar obtener ID de localidad de los query params
      const localidadIdQuery = req.query.localidadId;
      const localidadId = localidadIdQuery ? Number(localidadIdQuery) : undefined;

      if (!userId && !localidadId) {
        // Opción: Retornar error o lista vacía. Retornamos error para forzar selección.
        return res.status(400).json({ message: 'Se requiere iniciar sesión o seleccionar una localidad.' });
      }

      const paquetes = await this.service.getByLocation(userId, localidadId);
      res.status(200).json(paquetes);
    } catch (error) {
      next(error);
    }
  }

  async getByProductId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: 'ID de producto no proporcionado' });
      }

      const paquetes = await this.service.getByProductId(Number(id));
      res.status(200).json(paquetes);
    } catch (error) {
      next(error);
    }
  }
}
