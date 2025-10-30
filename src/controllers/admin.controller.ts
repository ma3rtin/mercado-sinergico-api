import { NextFunction, Request, Response } from 'express';
import { PaqueteBaseService } from '../services/paqueteBase.service';
import { ProductoService } from '../services/producto.service';
import { CustomError } from '../errors/custom.error';
import { ProductoDTO } from '../dtos/producto.dto';
import { AgregarProductoPaqueteDTO } from '../dtos/agregarProductoPaquete.dto';

export class AdminController {
  constructor(
    private productoService: ProductoService,
    private paqueteService: PaqueteBaseService
  ) {}

  public async crearPaquete(req: Request, res: Response, next: NextFunction) {
    try {
      const paqueteDto = req.body;

      const paquete = await this.paqueteService.create(paqueteDto);
      res.status(201).json(paquete);
    } catch (error) {
      res.status(500).send(new CustomError('Error creating package', 500));
    }
  }

  public async crearProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const producto: ProductoDTO = req.body;
      const newProducto = await this.productoService.create(producto);
      res.status(201).json(newProducto);
    } catch (error) {
      next(error);
    }
  }

  public async actualizarProducto(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id: number = Number(req.params.id);
      const producto: ProductoDTO = req.body;
      const updatedProducto = await this.productoService.update(id, producto);
      res.status(200).json(updatedProducto);
    } catch (error) {
      next(error);
    }
  }

  public async eliminarProducto(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id: number = Number(req.params.id);
      await this.productoService.delete(id);
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async agregarProductoAPaquete(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data: AgregarProductoPaqueteDTO= req.body;
      const paquete = await this.paqueteService.agregarProductos(
        data
      );
      res.status(200).json(paquete);
    } catch (error) {
      next(error);
    }
  }

  public async obtenerProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const productos = await this.productoService.getAll();
      res.json(productos);
    } catch (error) {
      next(error);
    }
  }
  
  public async obtenerProductoPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const id: number = Number(req.params.id);
      const producto = await this.productoService.getById(id);
      if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
      res.json(producto);
    } catch (error) {
      next(error);
    }
  }
}
