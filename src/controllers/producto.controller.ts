import { Request, Response } from 'express';
import { ProductoService } from '../services/producto.service.js';
import { ProductoDTO } from '../dtos/producto/producto.dto.js';
import { ImagenService } from '../services/imagen.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { CustomError } from '../errors/custom.error.js';

export class ProductoController {
  constructor(
    private productoService: ProductoService,
    private imagenService: ImagenService
  ) {}

  public getProductos = asyncHandler(async (req: Request, res: Response) => {
    const name = req.query.name as string | undefined;
    const includeArchived = req.query.includeArchived === 'true';

    const pageVal = req.query.page;
    const limitVal = req.query.limit;

    let page = pageVal ? parseInt(pageVal as string, 10) : undefined;
    let limit = limitVal ? parseInt(limitVal as string, 10) : undefined;

    // Validaciones
    if (pageVal !== undefined && (isNaN(page!) || page! < 1)) {
      return res.status(400).json({ message: 'El parámetro "page" debe ser un número entero mayor o igual a 1' });
    }
    if (limitVal !== undefined && (isNaN(limit!) || limit! < 1 || limit! > 100)) {
      return res.status(400).json({ message: 'El parámetro "limit" debe ser un número entero entre 1 y 100' });
    }

    // Filtros opcionales
    const categorias = req.query.categorias
      ? (req.query.categorias as string).split(',').map(Number).filter((n) => !isNaN(n))
      : undefined;
    const marcas = req.query.marcas
      ? (req.query.marcas as string).split(',').map(Number).filter((n) => !isNaN(n))
      : undefined;
    const zonas = req.query.zonas
      ? (req.query.zonas as string).split(',').map(Number).filter((n) => !isNaN(n))
      : undefined;
    const precioMin = req.query.precioMin ? parseFloat(req.query.precioMin as string) : undefined;
    const precioMax = req.query.precioMax ? parseFloat(req.query.precioMax as string) : undefined;

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const productos = await this.productoService.getAll(
      name,
      skip,
      take,
      includeArchived,
      categorias,
      marcas,
      precioMin,
      precioMax,
      zonas
    );

    if (page !== undefined && limit !== undefined) {
      const total = await this.productoService.countAll(
        name,
        includeArchived,
        categorias,
        marcas,
        precioMin,
        precioMax,
        zonas
      );
      res.setHeader('X-Total-Count', total);
      res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
    }

    res.status(200).json(productos);
  });

  public getProductoById = asyncHandler(async (req: Request, res: Response) => {
    const id: number = parseInt(req.params.id, 10);
    const resultado = await this.productoService.getById(id);

    if (!resultado) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(resultado);
  });

  public createProducto = asyncHandler(async (req: Request, res: Response) => {
    const start = Date.now();
    const body = req.body;
    const campos = req.files as { [fieldname: string]: Express.Multer.File[] };

    const producto: ProductoDTO = {
      nombre: body.nombre,
      descripcion: body.descripcion,
      precio: Number(body.precio),
      marca_id: Number(body.marca_id),
      categoria_id: Number(body.categoria_id),
      peso: body.peso ? Number(body.peso) : undefined,
      altura: body.altura ? Number(body.altura) : undefined,
      ancho: body.ancho ? Number(body.ancho) : undefined,
      profundidad: body.profundidad ? Number(body.profundidad) : undefined,
      stock: body.stock ? Number(body.stock) : undefined,
      plantillaId: body.plantillaId ? Number(body.plantillaId) : undefined,
      tipo: body.tipo || 'SINERGICO',
      opcionesDisponibles:
        typeof body.opcionesDisponibles === 'string'
          ? (JSON.parse(body.opcionesDisponibles) as Record<string, number[]>)
          : body.opcionesDisponibles,
    };

    if (!campos?.icono?.[0]) {
      return res
        .status(400)
        .json({ message: 'La imagen principal es obligatoria' });
    }

    const [urlPrincipal, urlsAdicionales] = await Promise.all([
      this.imagenService.uploadToCloudinary(campos.icono[0].buffer),
      Promise.all(
        (campos?.imagenes || []).map((file) =>
          this.imagenService.uploadToCloudinary(file.buffer)
        )
      ),
    ]);
    console.log(
      `[createProducto] Imágenes subidas en ${Date.now() - start}ms (${
        (campos?.imagenes || []).length + 1
      } imágenes)`
    );

    producto.imagen_url = urlPrincipal;
    if (campos?.imagenes?.length) {
      producto.imagenes = urlsAdicionales;
    }

    const newProducto = await this.productoService.create(producto);

    console.log(`[createProducto] Total: ${Date.now() - start}ms`);
    res.status(201).json(newProducto);
  });

  public updateProducto = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const producto: ProductoDTO = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // multipart/form-data manda objetos anidados como JSON string; a
    // diferencia de plantillaId, opcionesDisponibles no tiene @Transform
    // en el DTO, así que llega sin parsear si vino por FormData.
    if (typeof producto.opcionesDisponibles === 'string') {
      producto.opcionesDisponibles = JSON.parse(
        producto.opcionesDisponibles
      ) as Record<string, number[]>;
    }

    if (files?.icono?.[0]) {
      producto.imagen_url = await this.imagenService.uploadToCloudinary(
        files.icono[0].buffer
      );
    }

    if (files?.imagenes?.length) {
      producto.imagenes = await Promise.all(
        files.imagenes.map((file) =>
          this.imagenService.uploadToCloudinary(file.buffer)
        )
      );
    }

    const updatedProducto = await this.productoService.update(id, producto);
    res.status(200).json(updatedProducto);
  });

  public deleteProducto = asyncHandler(async (req: Request, res: Response) => {
    const id: number = parseInt(req.params.id, 10);
    const deleted = await this.productoService.delete(id);

    res
      .status(200)
      .json({ message: 'Product deleted successfully', deleted });
  });

  public duplicateProducto = asyncHandler(
    async (req: Request, res: Response) => {
      const id: number = parseInt(req.params.id, 10);

      await this.productoService.duplicarProducto(id);

      res.status(200).json({ message: 'Product duplicated successfully' });
    }
  );

  public getProductosFiltrados = asyncHandler(
    async (req: Request, res: Response) => {
      const search = String(req.query.search || '').trim();
      const offset = Number(req.query.offset || 0);
      const limit = Number(req.query.limit || 10);
      const includeArchived = req.query.includeArchived === 'true';

      const productos = await this.productoService.getAll(
        search.length > 0 ? search : undefined,
        offset,
        limit,
        includeArchived
      );

      res.json(productos);
    }
  );

  public archivarProducto = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { archivado } = req.body;

    if (typeof archivado !== 'boolean') {
      throw new CustomError('El campo "archivado" debe ser un booleano', 400);
    }

    const updated = await this.productoService.archivar(id, archivado);
    res.status(200).json(updated);
  });
}