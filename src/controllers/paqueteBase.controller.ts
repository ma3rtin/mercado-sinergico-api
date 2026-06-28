import { Request, Response } from 'express';
import { PaqueteBaseService } from '../services/paqueteBase.service.js';
import { PaqueteBaseDTO, TipoPaquete } from '../dtos/paquete/paqueteBase.dto.js';
import { ImagenService } from '../services/imagen.service.js';
import { CustomError } from '../errors/custom.error.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class PaqueteController {
  constructor(
    private paqueteService: PaqueteBaseService,
    private imagenService: ImagenService
  ) { }

  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const includeArchived = req.query.includeArchived === 'true';
    const paquetes = await this.paqueteService.getAll(includeArchived);
    if (!paquetes) throw new CustomError('Paquetes no encontrados', 404);

    res.status(200).json(paquetes);
  });

  public getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const paquete = await this.paqueteService.getById(Number(id));
    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    res.status(200).json(paquete);
  });

  public create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;

    if (!body) {
      throw new CustomError(
        'Datos de formulario no recibidos o body vacío.',
        400
      );
    }

    if (!body.nombre || !body.descripcion || !body.categoria_id) {
      throw new CustomError(
        'Faltan datos obligatorios del paquete (nombre, descripción, categoría).',
        400
      );
    }

    const productosRaw = body.productos;
    let productosArray: number[] = [];

    if (productosRaw) {
      if (Array.isArray(productosRaw)) {
        productosArray = productosRaw
          .map((n) => parseInt(String(n).trim(), 10))
          .filter((n) => !isNaN(n));
      } else if (typeof productosRaw === 'string') {
        productosArray = productosRaw
          .split(',')
          .map((n: string) => parseInt(n.trim(), 10))
          .filter((n: number) => !isNaN(n));
      }
    }

    if (productosArray.length === 0) {
      throw new CustomError(
        'El paquete debe contener al menos un producto.',
        400
      );
    }

    const paqueteDto: PaqueteBaseDTO = {
      nombre: body.nombre,
      descripcion: body.descripcion,
      categoria_id: Number(body.categoria_id),
      marcaId: Number(body.marcaId),
      productos: productosArray,
      imagen_url: '',
      tipo: body.tipo === 'ENERGICO' ? TipoPaquete.ENERGICO : TipoPaquete.SINERGICO,
    };

    if (req.file) {
      const url = await this.imagenService.uploadToCloudinary(req.file.buffer);
      paqueteDto.imagen_url = url;
    } else {
      throw new CustomError('La imagen es obligatoria', 400);
    }

    const paquete = await this.paqueteService.create(paqueteDto);

    if (!paquete) throw new CustomError('Error al crear paquete', 400);

    res.status(201).json(paquete);
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const paqueteDto = req.body;

    if (!paqueteDto) {
      throw new CustomError('Paquete no proporcionado', 400);
    }

    const paquete = await this.paqueteService.update(Number(id), paqueteDto);

    res.status(200).json(paquete);
  });

  public delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const paquete = await this.paqueteService.delete(Number(id));

    res.status(200).json(paquete);
  });

  public archivar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de paquete no proporcionado o inválido', 400);

    const { archivado } = req.body;
    if (typeof archivado !== 'boolean') {
      throw new CustomError('El campo "archivado" debe ser un booleano', 400);
    }

    const result = await this.paqueteService.archivar(idNum, archivado);
    res.status(200).json(result);
  });

  public sincronizarProductos = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError('ID de paquete inválido', 400);

    const productosId: number[] = req.body.productosId ?? [];

    const paquete = await this.paqueteService.sincronizarProductos(id, productosId);
    res.status(200).json(paquete);
  });

  public getProductosByPaquete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const productos = await this.paqueteService.getProductosByPaquete(Number(id));

    res.status(200).json(productos);
  });

  public duplicar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const paqueteDuplicado = await this.paqueteService.duplicar(Number(id));

    res.status(201).json(paqueteDuplicado);
  });
}
