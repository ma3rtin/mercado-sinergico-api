import { EventEmitter } from 'events';

export class DespachadorEventos extends EventEmitter {
    public static readonly PAQUETE_COMPLETADO = 'paquete.completado';
}

export const despachadorEventosApp = new DespachadorEventos();
