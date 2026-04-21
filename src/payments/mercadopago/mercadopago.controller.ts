import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import { PedidoPagoService } from '../../services/pedidoPago.service.js';
import { envs } from '../../config/envs.js';

export class MercadoPagoController {
  constructor(private pedidoPagoService: PedidoPagoService) {}

  async webhook(req: Request, res: Response) {
    try {
      // El body llega como Buffer (express.raw) — lo parseamos a objeto
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : JSON.stringify(req.body);
      let body: Record<string, any>;
      try {
        body = JSON.parse(rawBody);
      } catch {
        return res.status(400).json({ error: 'Payload inválido' });
      }

      // Verificación de firma de MP (si MP_WEBHOOK_SECRET está configurado)
      const secret = envs.MP_WEBHOOK_SECRET;
      if (secret) {
        const xSignature = req.headers['x-signature'] as string | undefined;
        const xRequestId = req.headers['x-request-id'] as string | undefined;

        if (!xSignature || !xRequestId) {
          console.warn('[Webhook] Firma de MP ausente — rechazado');
          return res.status(401).json({ error: 'Firma requerida' });
        }

        const ts = xSignature.match(/ts=([^,]+)/)?.[1];
        const v1 = xSignature.match(/v1=([^,]+)/)?.[1];

        if (!ts || !v1) {
          return res.status(401).json({ error: 'Formato de firma inválido' });
        }

        const dataId = body?.data?.id ?? '';
        const plantilla = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const hmac = createHmac('sha256', secret).update(plantilla).digest('hex');

        const hmacBuffer = Buffer.from(hmac, 'hex');
        const v1Buffer = Buffer.from(v1, 'hex');

        if (hmacBuffer.length !== v1Buffer.length || !timingSafeEqual(hmacBuffer, v1Buffer)) {
          console.warn('[Webhook] Firma de MP inválida');
          return res.status(401).json({ error: 'Firma inválida' });
        }
      } else {
        console.warn('[Webhook] MP_WEBHOOK_SECRET no configurado — verificación de firma deshabilitada');
      }

      const { type, data } = body;

      if (type === 'payment') {
        const paymentId = Number(data?.id);
        if (!paymentId || isNaN(paymentId)) {
          return res.status(400).json({ error: 'paymentId inválido' });
        }
        await this.pedidoPagoService.confirmarPago(paymentId);
      }

      return res.status(200).send('OK');
    } catch (error) {
      console.error('[Webhook] Error:', error);
      return res.status(500).json({ error: 'Webhook error' });
    }
  }
}
