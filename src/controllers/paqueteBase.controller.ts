import { Request, Response } from 'express';
import { PaqueteBaseService } from '../services/paqueteBase.service';
import { PaqueteBaseDTO } from '../dtos/paqueteBase.dto';
import { AgregarProductoPaqueteDTO } from '../dtos/agregarProductoPaquete.dto';
import { ImagenService } from '../services/imagen.service';

export class PaqueteController {
  constructor(
    private paqueteService: PaqueteBaseService,
    private imagenService: ImagenService
  ) {}

  public async getAll(req: Request, res: Response) {
    try {
      const paquetes = await this.paqueteService.getAll();
      if (!paquetes) {
        return res.status(404).json({ message: 'Paquetes no encontrados' });
      }
      res.status(200).json(paquetes);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ message: 'Id de paquete no proporcionado' });
      }
      const paquete = await this.paqueteService.getById(Number(id));
      if (!paquete) {
        return res.status(404).json({ message: 'Paquete no encontrado' });
      }
      res.status(200).json(paquete);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const body = req.body;

      if (!body) {
        return res
          .status(400)
          .json({ message: 'Datos de formulario no recibidos o body vacío.' });
      }

      if (!body.nombre || !body.descripcion || !body.categoria_id) {
        return res.status(400).json({
          message:
            'Faltan datos obligatorios del paquete (nombre, descripción, categoría).',
        });
      }

      const productosRaw = body.productos;
      let productosArray: number[] = [];

      if (productosRaw) {
        if (Array.isArray(productosRaw)) {
          productosArray = productosRaw
            .map((n) => parseInt(String(n).trim(), 10))
            .filter((n) => !isNaN(n));
        } else if (typeof productosRaw === 'string') {
          productosArray = body.productos
            .split(',')
            .map((n: string) => parseInt(n.trim(), 10))
            .filter((n: number) => !isNaN(n));
        }
      }

      if (productosArray.length === 0) {
        return res
          .status(400)
          .json({ message: 'El paquete debe contener al menos un producto.' });
      }

      const paqueteDto: PaqueteBaseDTO = {
        nombre: body.nombre,
        descripcion: body.descripcion,
        categoria_id: Number(body.categoria_id),
        marcaId: Number(body.marcaId),
        productos: productosArray,
        imagen_url: '',
      };

      if (req.file) {
        const url = await this.imagenService.uploadToCloudinary(
          req.file.buffer
        );
        paqueteDto.imagen_url = url;
      } else {
        return res.status(400).json({ message: 'La imagen es obligatoria' });
      }

      const paquete = await this.paqueteService.create(paqueteDto);
      if (!paquete) {
        return res.status(400).json({ message: 'Error al crear paquete' });
      }
      res.status(201).json(paquete);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const paqueteDto = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ message: 'Id de paquete no proporcionado' });
      }
      if (!paqueteDto) {
        return res.status(400).json({ message: 'Paquete no proporcionado' });
      }

      const paquete = await this.paqueteService.update(
        Number(id),
        paqueteDto
      );
      res.status(200).json(paquete);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ message: 'Id de paquete no proporcionado' });
      }

      const paquete = await this.paqueteService.delete(Number(id));
      res.status(200).json(paquete);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }

  public async agregarProductos(req: Request, res: Response) {
    try {
      const dto: AgregarProductoPaqueteDTO = req.body;
      const paquete = await this.paqueteService.agregarProductos(dto);
      res.status(200).json(paquete);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Error interno del servidor';
      res.status(status).json({ message });
    }
  }
}