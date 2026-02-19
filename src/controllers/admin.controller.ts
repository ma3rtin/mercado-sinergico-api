import { Request, Response } from 'express';
import { PaqueteBaseService } from '../services/paqueteBase.service.js';
import { ProductoService } from '../services/producto.service.js';
import { ProductoDTO } from '../dtos/producto/producto.dto.js';
import { AgregarProductoPaqueteDTO } from '../dtos/producto/agregarProductoPaquete.dto.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class AdminController {
  constructor(
    private productoService: ProductoService,
    private paqueteService: PaqueteBaseService
  ) {}

  public crearPaquete = asyncHandler(async (req: Request, res: Response) => {
    const paqueteDto = req.body;
    const paquete = await this.paqueteService.create(paqueteDto);
    res.status(201).json(paquete);
  });

  public crearProducto = asyncHandler(async (req: Request, res: Response) => {
    const producto: ProductoDTO = req.body;
    const newProducto = await this.productoService.create(producto);
    res.status(201).json(newProducto);
  });

  public actualizarProducto = asyncHandler(async (req: Request, res: Response) => {
    const id: number = Number(req.params.id);
    const producto: ProductoDTO = req.body;
    const updatedProducto = await this.productoService.update(id, producto);
    res.status(200).json(updatedProducto);
  });

  public eliminarProducto = asyncHandler(async (req: Request, res: Response) => {
    const id: number = Number(req.params.id);
    await this.productoService.delete(id);
    res.status(200).json({ message: 'Product deleted successfully' });
  });

  public agregarProductoAPaquete = asyncHandler(async (req: Request, res: Response) => {
    const data: AgregarProductoPaqueteDTO = req.body;
    const paquete = await this.paqueteService.agregarProductos(data);
    res.status(200).json(paquete);
  });

  public obtenerProductos = asyncHandler(async (req: Request, res: Response) => {
    const productos = await this.productoService.getAll();
    res.json(productos);
  });

  public obtenerProductoPorId = asyncHandler(async (req: Request, res: Response) => {
    const id: number = Number(req.params.id);
    const producto = await this.productoService.getById(id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(producto);
  });
}
