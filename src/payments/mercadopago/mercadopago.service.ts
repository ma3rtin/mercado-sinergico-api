import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { envs } from '../../config/envs';

export class MercadoPagoService {
  private client: MercadoPagoConfig;

  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
  }

  async crearPreferencia(pedido: {
    pedidoId: number;
    titulo: string;
    precioTotal: number;
  }) {
    const preference = new Preference(this.client);
    console.log('📦 Pedido a pagar:', pedido);

    const result = await preference.create({
      body: {
        items: [
          {
            id: pedido.pedidoId.toString(),
            title: pedido.titulo,
            quantity: 1,
            unit_price: pedido.precioTotal,
            currency_id: 'ARS',
          },
        ],
        external_reference: pedido.pedidoId.toString(),
        back_urls: {
          success: envs.MP_SUCCESS_URL,
          failure: envs.MP_FAILURE_URL,
          pending: envs.MP_PENDING_URL,
        },
        auto_return: 'approved',
        notification_url: envs.MP_WEBHOOK_URL,
      },
    });

    return {
      preferenceId: result.id,
      checkoutUrl: result.init_point,
    };
  }

  async obtenerPago(paymentId: number) {
    const payment = new Payment(this.client);
    return await payment.get({ id: paymentId });
  }
}

export const mercadoPagoService = new MercadoPagoService();
