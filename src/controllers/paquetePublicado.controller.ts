import { NextFunction, Request, Response } from 'express';
import { PaquetePublicadoService } from '../services/paquetePublicado.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { CustomError } from '../errors/custom.error.js';

export class PaquetePublicadoController {
  constructor(private service: PaquetePublicadoService) { }

  getAll = asyncHandler(async (req: Request, res: Response) => {
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
    const tiposPaquete = req.query.tiposPaquete
      ? (req.query.tiposPaquete as string).split(',')
      : undefined;
    const estados = req.query.estados
      ? (req.query.estados as string).split(',')
      : undefined;
    const orden = req.query.orden ? (req.query.orden as string) : undefined;

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const paquetes = await this.service.getAll(
      skip,
      take,
      includeArchived,
      categorias,
      marcas,
      zonas,
      tiposPaquete,
      estados,
      orden
    );

    if (!paquetes) throw new CustomError('Paquetes no encontrados', 404);

    if (page !== undefined && limit !== undefined) {
      const total = await this.service.countAll(
        includeArchived,
        categorias,
        marcas,
        zonas,
        tiposPaquete,
        estados
      );
      res.setHeader('X-Total-Count', total);
      res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
    }

    res.status(200).json(paquetes);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum))
      throw new CustomError('Id de paquete no proporcionado o inválido', 400);

    const paquete = await this.service.getById(idNum);
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
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de paquete no proporcionado o inválido', 400);

    const paquetePublicado = await this.service.update(idNum, req.body);
    if (!paquetePublicado)
      throw new CustomError('Error al actualizar paquete', 400);

    res.json(paquetePublicado);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum))
      throw new CustomError('Id de paquete no proporcionado o inválido', 400);

    const paquetePublicado = await this.service.delete(idNum);
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
      const idNum = Number(id);
      if (!id || isNaN(idNum)) {
        return res.status(400).json({ message: 'ID de producto no proporcionado o inválido' });
      }

      const paquetes = await this.service.getByProductId(idNum);
      res.status(200).json(paquetes);
    } catch (error) {
      next(error);
    }
  }

  getRelacionados = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de paquete no proporcionado o inválido', 400);

    const paquetes = await this.service.getRelacionados(idNum);
    if (!paquetes) throw new CustomError('No se pudieron obtener paquetes relacionados', 500);

    res.status(200).json(paquetes);
  });

  duplicar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de publicación no proporcionado o inválido', 400);

    const paquete = await this.service.duplicar(idNum);
    res.status(201).json(paquete);
  });

  descartar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de publicación no proporcionado', 400);

    const result = await this.service.descartar(Number(id));
    res.status(200).json(result);
  });

  /** Activo → Completo (manual, para casos de borde) */
  completar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de publicación no proporcionado o inválido', 400);

    const resultado = await this.service.marcarCompleto(idNum);
    res.status(200).json(resultado);
  });

  /** Completo (o Activo) → Confirmado */
  confirmarCompraFabricante = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de paquete no proporcionado o inválido', 400);

    const result = await this.service.confirmarCompraFabricante(idNum);
    res.status(200).json(result);
  });

  /** Confirmado → Entregado */
  marcarEntregado = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de publicación no proporcionado o inválido', 400);

    const result = await this.service.marcarEntregado(idNum);
    res.status(200).json(result);
  });

  /** Marca pedidos seleccionados (o todos) como En camino */
  marcarPedidosEnCamino = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de publicación no proporcionado o inválido', 400);

    const pedidoIds: number[] = Array.isArray(req.body.pedidoIds)
      ? req.body.pedidoIds.map(Number)
      : [];

    const result = await this.service.marcarPedidosEnCamino(idNum, pedidoIds);
    res.status(200).json(result);
  });

  /** Cancela el paquete y reembolsa todos los pedidos Pagados y Pendientes */
  cancelar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de publicación no proporcionado o inválido', 400);

    const resultado = await this.service.cancelarYReembolsar(idNum);
    res.status(200).json(resultado);
  });

  notificar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de publicación no proporcionado o inválido', 400);

    const result = await this.service.notificarCompradores(idNum);
    res.status(200).json(result);
  });

  archivar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de publicación no proporcionado o inválido', 400);

    const { archivado } = req.body;
    if (typeof archivado !== 'boolean') {
      throw new CustomError('El campo "archivado" debe ser un booleano', 400);
    }

    const result = await this.service.archivar(idNum, archivado);
    res.status(200).json(result);
  });

  exportarFabrica = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de publicación no proporcionado o inválido', 400);

    const buffer = await this.service.exportarFabrica(idNum);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=plantilla_fabrica_${idNum}.xlsx`);
    res.status(200).send(buffer);
  });

  exportarLogistica = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!id || isNaN(idNum)) throw new CustomError('Id de publicación no proporcionado o inválido', 400);

    const buffer = await this.service.exportarLogistica(idNum);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=plantilla_logistica_${idNum}.xlsx`);
    res.status(200).send(buffer);
  });
}
