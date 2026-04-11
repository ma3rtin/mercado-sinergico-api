import { Request, Response } from 'express';
import { PaquetePublicadoService } from '../services/paquetePublicado.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { CustomError } from '../errors/custom.error.js';

export class PaquetePublicadoController {
  constructor(private service: PaquetePublicadoService) { }

  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const paquetes = await this.service.getAll();
    if (!paquetes) throw new CustomError('Paquetes no encontrados', 404);
    res.status(200).json(paquetes);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || id === '')
      throw new CustomError('Id de paquete no proporcionado', 400);

    const paquete = await this.service.getById(Number(id));
    if (!paquete) throw new CustomError('Paquete no encontrado', 404);

    res.status(200).json(paquete);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    const file = req.file as Express.Multer.File | undefined;

    if (!body) throw new CustomError('Datos del paquete no proporcionados', 400);

    const dto = {
      nombre: body.nombre,
      paqueteBaseId: Number(body.paqueteBaseId),
      zonaId: Number(body.zonaId),
      cant_productos: body.cant_productos ? Number(body.cant_productos) : undefined,
      fecha_inicio: body.fecha_inicio,
      fecha_fin: body.fecha_fin,
      descuento: body.descuento ? Number(body.descuento) : undefined,
    };

    const paquetePublicado = await this.service.create(dto, file?.buffer);
    if (!paquetePublicado) throw new CustomError('Error al crear paquete', 400);

    res.status(201).json(paquetePublicado);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const file = req.file as Express.Multer.File | undefined;

    const paquetePublicado = await this.service.update(Number(id), req.body, file?.buffer);
    if (!paquetePublicado)
      throw new CustomError('Error al actualizar paquete', 400);

    res.json(paquetePublicado);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || id === '')
      throw new CustomError('Id de paquete no proporcionado', 400);

    const paquetePublicado = await this.service.delete(Number(id));
    if (!paquetePublicado)
      throw new CustomError('Error al eliminar paquete', 400);

    res.status(200).json({ message: 'Paquete eliminado' });
  });

  getPorCerrarse = asyncHandler(async (_req: Request, res: Response) => {
    const paquetes = await this.service.getPorCerrarse();
    res.status(200).json(paquetes || []);
  });

  getByLocation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const localidadIdQuery = req.query.localidadId;
    const localidadId = localidadIdQuery ? Number(localidadIdQuery) : undefined;

    if (!userId && !localidadId) {
      res.status(400).json({ message: 'Se requiere iniciar sesión o seleccionar una localidad.' });
      return;
    }

    const paquetes = await this.service.getByLocation(userId, localidadId);
    res.status(200).json(paquetes);
  });

  getByProductId = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'ID de producto no proporcionado' });
      return;
    }

    const paquetes = await this.service.getByProductId(Number(id));
    res.status(200).json(paquetes);
  });

  getRelacionados = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const paquetes = await this.service.getRelacionados(Number(id));
    if (!paquetes) throw new CustomError('No se pudieron obtener paquetes relacionados', 500);

    res.status(200).json(paquetes);
  });

  duplicar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de publicación no proporcionado', 400);

    const paquete = await this.service.duplicar(Number(id));
    res.status(201).json(paquete);
  });

  /** Activo → Completo (manual, para casos de borde) */
  completar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de publicación no proporcionado', 400);

    const resultado = await this.service.marcarCompleto(Number(id));
    res.status(200).json(resultado);
  });

  /** Completo (o Activo) → Confirmado */
  confirmarCompraFabricante = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de paquete no proporcionado', 400);

    const result = await this.service.confirmarCompraFabricante(Number(id));
    res.status(200).json(result);
  });

  /** Confirmado → Entregado */
  marcarEntregado = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de publicación no proporcionado', 400);

    const result = await this.service.marcarEntregado(Number(id));
    res.status(200).json(result);
  });

  /** Marca pedidos seleccionados (o todos) como En camino */
  marcarPedidosEnCamino = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de publicación no proporcionado', 400);

    const pedidoIds: number[] = Array.isArray(req.body.pedidoIds)
      ? req.body.pedidoIds.map(Number)
      : [];

    const result = await this.service.marcarPedidosEnCamino(Number(id), pedidoIds);
    res.status(200).json(result);
  });

  /** Cancela el paquete y reembolsa todos los pedidos Pagados y Pendientes */
  cancelar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de publicación no proporcionado', 400);

    const resultado = await this.service.cancelarYReembolsar(Number(id));
    res.status(200).json(resultado);
  });

  notificar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new CustomError('Id de publicación no proporcionado', 400);

    const result = await this.service.notificarCompradores(Number(id));
    res.status(200).json(result);
  });
}
