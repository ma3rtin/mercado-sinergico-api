import { NextFunction, Request, Response } from 'express';
import { PaquetePublicadoService } from '../services/paquetePublicado.service';
import { asyncHandler } from '../utils/asyncHandler';
import { CustomError } from '../errors/custom.error';

export class PaquetePublicadoController {
  constructor(private service: PaquetePublicadoService) { }

  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const paquetes = await this.service.getAll();
    if (!paquetes) throw new CustomError('Paquetes no encontrados', 404);
    res.status(200).json(paquetes);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || id === '')
      throw new CustomError('Id de paquete no proporcionado', 400);

    const paquete = await this.service.getById(Number(id));
    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    res.status(200).json(paquete);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const paquetePublicadoDTO = req.body;
    if (!paquetePublicadoDTO)
      throw new CustomError('Paquete no proporcionado', 400);

    const paquetePublicado = await this.service.create(paquetePublicadoDTO);
    if (!paquetePublicado) throw new CustomError('Error al crear paquete', 400);

    res.status(201).json(paquetePublicado);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const paquetePublicado = await this.service.update(Number(id), req.body);
    if (!paquetePublicado)
      throw new CustomError('Error al actualizar paquete', 400);

    res.json(paquetePublicado);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || id === '')
      throw new CustomError('Id de paquete no proporcionado', 400);

    const paquetePublicado = await this.service.delete(Number(id));
    if (!paquetePublicado)
      throw new CustomError('Error al eliminar paquete', 400);

    res.status(200).json({ message: 'Paquete eliminado' });
  });

  getPorCerrarse = asyncHandler(async (_req: Request, res: Response) => {
    const paquetes = await this.service.getPorCerrarse();
    if (!paquetes || paquetes.length === 0)
      throw new CustomError('No hay paquetes por cerrarse', 404);

    res.status(200).json(paquetes);
  });

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

  getRelacionados = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const paquetes = await this.service.getRelacionados(Number(id));
    if (!paquetes) throw new CustomError('No se pudieron obtener paquetes relacionados', 500);

    res.status(200).json(paquetes);
  });
}
