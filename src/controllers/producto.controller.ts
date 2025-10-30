import { Request, Response } from 'express';
import { ProductoService } from '../services/producto.service';
import { ProductoDTO } from '../dtos/producto.dto';
import { CustomError } from '../errors/custom.error';
import { ImagenService } from '../services/imagen.service';

export class ProductoController {
  constructor(
    private productoService: ProductoService,
    private imagenService: ImagenService
  ) { }

  public async getProductos(req: Request, res: Response) {
    try {
      const name = req.query.name as string | undefined;
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 10;
      const productos = await this.productoService.getAll(name, skip, take);
      res.status(200).json(productos);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }
  
  public async getProductoById(req: Request, res: Response) {
    try {
      const id: number = parseInt(req.params.id, 10);
      const producto = await this.productoService.getById(id);
      if (!producto) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json(producto);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

  public async createProducto(req: Request, res: Response) {
    try {
      const body = req.body;
      const campos = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      // Convertir strings a números (porque llegan como texto desde FormData)
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
      } as ProductoDTO;

      // imagen principal
      if (campos?.icono?.[0]) {
        producto.imagen_url = await this.imagenService.uploadToCloudinary(
          campos.icono[0].buffer
        );
      } else {
        return res.status(400).json({ message: 'La imagen principal es obligatoria' });
      }

      if (campos?.imagenes?.length) {
        producto.imagenes = [];
        for (const file of campos.imagenes) {
          const url = await this.imagenService.uploadToCloudinary(file.buffer);
          producto.imagenes.push(url);
        }
      }

      // Guardar en DB
      const newProducto = await this.productoService.create(producto);
      res.status(201).json(newProducto);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

  public async updateProducto(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const producto: ProductoDTO = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

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
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

  public async deleteProducto(req: Request, res: Response) {
    console.log('Entró al deleteProducto con id:', req.params.id);
    try {
      const id: number = parseInt(req.params.id, 10);
      const deleted = await this.productoService.delete(id);
      res.status(200).json({ message: 'Product deleted successfully', deleted });
    } catch (error: any) {
      console.error('Error en deleteProducto:', error);
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

  public async duplicateProducto(req: Request, res: Response) {
    try {
      const id: number = parseInt(req.params.id, 10);
      await this.productoService.duplicarProducto(id);
      res.status(200).json({ message: 'Product duplicated successfully' });
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

async getProductosFiltrados(req: Request, res: Response) {
  try {
    const search = String(req.query.search || '').trim();
    const offset = Number(req.query.offset || 0);
    const limit = Number(req.query.limit || 10);

    const productos = await this.productoService.getAll(
      search.length > 0 ? search : undefined,
      offset,
      limit
    );

    res.json(productos);
  } catch (error) {
    console.error('❌ Error en getProductosFiltrados:', error);
    res.status(500).json({
      message: 'Error al buscar productos',
      error: (error as Error).message,
    });
  }
}


}