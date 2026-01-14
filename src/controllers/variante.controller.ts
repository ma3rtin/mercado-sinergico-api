import { Request, Response } from 'express';
import { VarianteService } from '../services/variante.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { VarianteDTO } from '../dtos/variante/variante.dto.js';
import { GenerarVariantesDTO } from '../dtos/variante/generarVariantes.dto.js';
import { ActualizarStockVariantesDTO } from '../dtos/variante/actualizarStockVariantes.dto.js';

export class VarianteController {
  constructor(private varianteService: VarianteService) {}

  public getVariantesByProducto = asyncHandler(
    async (req: Request, res: Response) => {
      const productoId = parseInt(req.params.id, 10);

      const resultado = await this.varianteService.getVariantesByProducto(
        productoId
      );

      res.status(200).json(resultado);
    }
  );

  public generarVariantes = asyncHandler(
    async (req: Request, res: Response) => {
      const productoId = parseInt(req.params.id, 10);
      const { opcionesDisponibles } = req.body;

      const data: GenerarVariantesDTO = {
        productoId,
        opcionesDisponibles,
      };

      const resultado = await this.varianteService.generarVariantes(data);

      res.status(201).json(resultado);
    }
  );

  public actualizarStockBulk = asyncHandler(
    async (req: Request, res: Response) => {
      const productoId = parseInt(req.params.id, 10);
      const data: ActualizarStockVariantesDTO = req.body;

      const resultado = await this.varianteService.actualizarStockBulk(
        productoId,
        data
      );

      res.status(200).json(resultado);
    }
  );

  public actualizarVariante = asyncHandler(
    async (req: Request, res: Response) => {
      const varianteId = parseInt(req.params.id, 10);
      const data: Partial<VarianteDTO> = req.body;

      const resultado = await this.varianteService.actualizarVariante(
        varianteId,
        data
      );

      res.status(200).json(resultado);
    }
  );

  public eliminarVariante = asyncHandler(
    async (req: Request, res: Response) => {
      const varianteId = parseInt(req.params.id, 10);

      await this.varianteService.eliminarVariante(varianteId);

      res.status(200).json({ message: 'Variante eliminada correctamente' });
    }
  );

  public getStockGlobal = asyncHandler(async (req: Request, res: Response) => {
    const productoId = parseInt(req.params.id, 10);

    const resultado = await this.varianteService.getStockGlobal(productoId);

    res.status(200).json(resultado);
  });
}
