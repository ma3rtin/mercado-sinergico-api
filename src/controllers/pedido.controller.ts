import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PedidoService } from '../services/pedido.service.js';
import { PedidoPagoService } from '../services/pedidoPago.service.js';
import { CustomError } from '../errors/custom.error.js';
import { CrearPedidoDTO } from '../dtos/pedido/crearPedido.dto.js';
import { ActualizarCantidadDTO } from '../dtos/pedido/actualizarCantidad.dto.js';

export class PedidoController {
  constructor(
    private readonly pedidoService: PedidoService,
    private readonly pagoService: PedidoPagoService
  ) { }

  public crearPedido = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { paqueteId } = req.params;
    const idNum = Number(paqueteId);

    if (!paqueteId || isNaN(idNum)) {
      throw new CustomError('Paquete id inválido o no proporcionado', 400);
    }

    const pedidoId = await this.pedidoService.crearPedido(
      user!.id,
      idNum,
      req.body as CrearPedidoDTO
    );

    res.status(201).json({ pedidoId });
  });

  public eliminarProducto = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { pedidoId, detalleId } = req.params;

    const pIdNum = Number(pedidoId);
    const dIdNum = Number(detalleId);

    if (!pedidoId || !detalleId || isNaN(pIdNum) || isNaN(dIdNum)) {
      throw new CustomError('ID de pedido o detalle inválido', 400);
    }

    await this.pedidoService.eliminarProducto(
      user!.id,
      pIdNum,
      dIdNum
    );

    res.status(200).json({ ok: true });
  });

  public actualizarCantidad = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { pedidoId, detalleId } = req.params;
    const dto = req.body as ActualizarCantidadDTO;

    const pIdNum = Number(pedidoId);
    const dIdNum = Number(detalleId);

    if (!pedidoId || !detalleId || isNaN(pIdNum) || isNaN(dIdNum)) {
      throw new CustomError('ID de pedido o detalle inválido', 400);
    }

    await this.pedidoService.actualizarCantidad(
      user!.id,
      pIdNum,
      dIdNum,
      dto.cantidad
    );

    res.status(200).json({ ok: true });
  });

  public iniciarPago = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { pedidoId } = req.params;
    const pIdNum = Number(pedidoId);

    if (!pedidoId || isNaN(pIdNum)) {
      throw new CustomError('ID de pedido inválido o no proporcionado', 400);
    }

    const checkoutUrl = await this.pagoService.iniciarPago(
      pIdNum,
      user!.id
    );

    res.status(200).json({ checkoutUrl });
  });

  public confirmarPago = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.body;

    const result = await this.pagoService.confirmarPago(Number(paymentId));

    res.status(200).json(result);
  });

  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    const pedidos = await this.pedidoService.obtenerPedidosUsuario(user!.id);

    res.status(200).json(pedidos);
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { id } = req.params;
    const idNum = Number(id);

    if (!id || isNaN(idNum)) {
      throw new CustomError('Pedido id inválido o no proporcionado', 400);
    }

    const pedido = await this.pedidoService.obtenerPedidoPorId(
      user!.id,
      idNum
    );

    res.status(200).json(pedido);
  });

  public bajarse = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { paqueteId } = req.params;
    const idNum = Number(paqueteId);

    if (!paqueteId || isNaN(idNum)) {
      throw new CustomError('Paquete id inválido o no proporcionado', 400);
    }

    await this.pedidoService.bajarseDePaquete(
      user!.id,
      idNum
    );

    res.status(200).json({ ok: true });
  });

  public solicitarReembolso = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { pedidoId } = req.params;
    const pIdNum = Number(pedidoId);

    if (!pedidoId || isNaN(pIdNum)) {
      throw new CustomError('Falta el ID del pedido o es inválido', 400);
    }

    const result = await this.pagoService.reembolsarPedidoIndividual(
      pIdNum,
      user!.id
    );

    res.status(200).json(result);
  });

  public notificarEnvio = asyncHandler(async (req: Request, res: Response) => {
    const { pedidoIds } = req.body;
    const result = await this.pedidoService.notificarEnvio(pedidoIds as number[]);
    res.status(200).json(result);
  });
}