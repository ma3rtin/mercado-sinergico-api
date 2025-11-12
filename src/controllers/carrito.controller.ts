import { Request, Response, NextFunction } from 'express';
import { CarritoService } from '../services/carrito.service';

export class CarritoController {
  constructor(private carritoService: CarritoService) {}

  async getCarritoUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) return res.status(401).json({ message: 'Usuario no autenticado' });

      const carrito = await this.carritoService.getByUsuario(usuarioId);

      if (!carrito) return res.status(404).json({ message: 'Carrito vacío' });

      res.status(200).json(carrito);
    } catch (error) {
      next(error);
    }
  }
}
