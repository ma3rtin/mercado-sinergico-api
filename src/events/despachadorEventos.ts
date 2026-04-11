import { EventEmitter } from 'events';

export class DespachadorEventos extends EventEmitter {
    public static readonly PAQUETE_COMPLETO       = 'paquete.completo';
    public static readonly PAQUETE_CONFIRMADO     = 'paquete.confirmado';
    public static readonly PAQUETE_ENTREGADO      = 'paquete.entregado';
    public static readonly PAQUETE_CANCELADO      = 'paquete.cancelado';
    public static readonly PEDIDOS_EN_CAMINO      = 'pedidos.en_camino';
}

export const despachadorEventosApp = new DespachadorEventos();
