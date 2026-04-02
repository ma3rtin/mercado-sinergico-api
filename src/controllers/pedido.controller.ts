import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PedidoService } from '../services/pedido.service.js';
import { PedidoPagoService } from '../services/pedidoPago.service.js';
import { CustomError } from '../errors/custom.error.js';
import { CrearPedidoDTO } from '../dtos/pedido/crearPedido.dto.js';

export class PedidoController {
  constructor(
    private readonly pedidoService: PedidoService,
    private readonly pagoService: PedidoPagoService
  ) {}

  public crearPedido = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { paqueteId } = req.params;

    if (!paqueteId) {
      throw new CustomError('Paquete no encontrado', 404);
    }

    const pedidoId = await this.pedidoService.crearPedido(
      user!.id,
      Number(paqueteId),
      req.body as CrearPedidoDTO
    );

    res.status(201).json({ pedidoId });
  });

  public eliminarProducto = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { pedidoId, detalleId } = req.params;

    await this.pedidoService.eliminarProducto(
      user!.id,
      Number(pedidoId),
      Number(detalleId)
    );

    res.status(200).json({ ok: true });
  });

  public actualizarCantidad = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { pedidoId, detalleId } = req.params;
    const { cantidad } = req.body;

    await this.pedidoService.actualizarCantidad(
      user!.id,
      Number(pedidoId),
      Number(detalleId),
      Number(cantidad)
    );

    res.status(200).json({ ok: true });
  });

  public iniciarPago = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { pedidoId } = req.params;

    const checkoutUrl = await this.pagoService.iniciarPago(
      Number(pedidoId),
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

    const pedido = await this.pedidoService.obtenerPedidoPorId(
      user!.id,
      Number(id)
    );

    res.status(200).json(pedido);
  });

  public bajarse = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { paqueteId } = req.params;

    await this.pedidoService.bajarseDePaquete(
      user!.id,
      Number(paqueteId)
    );

    res.status(200).json({ ok: true });
  });

  public notificarEnvio = asyncHandler(async (req: Request, res: Response) => {
    const { pedidoIds } = req.body;
    const result = await this.pedidoService.notificarEnvio(pedidoIds as number[]);
    res.status(200).json(result);
  });
}