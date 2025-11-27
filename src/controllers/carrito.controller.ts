import { Request, Response, NextFunction } from 'express';
import { CarritoService } from '../services/carrito.service';
import { asyncHandler } from '../utils/asyncHandler';
import { CustomError } from '../errors/custom.error';

export class CarritoController {
  constructor(private carritoService: CarritoService) {}

  public getCarritoUsuario = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const usuarioId = req.user?.id;
      if (!usuarioId) throw new CustomError('Usuario no autenticado', 401);

      const carrito = await this.carritoService.getByUsuario(usuarioId);
      if (!carrito) throw new CustomError('Carrito vacío', 404);

      res.status(200).json(carrito);
    }
  );
}
