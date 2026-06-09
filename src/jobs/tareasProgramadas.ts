import cron from 'node-cron';
import { prisma } from '../prisma/client.js';
import { PaquetePublicadoService } from '../services/paquetePublicado.service.js';

import { ESTADO_PAQUETE } from '../constants/estado-paquete.js';

const service = new PaquetePublicadoService();

/**
 * Inicializa todas las tareas programadas de la aplicación.
 * Llamar una sola vez al arrancar el servidor.
 */
export function iniciarTareasProgramadas(): void {
  // Todos los días a las 00:05 revisa paquetes cuya fecha_fin venció
  cron.schedule('5 0 * * *', async () => {
    await procesarPaquetesVencidos();
  });

  console.log('[Cron] Tareas programadas iniciadas.');
}

/**
 * Recorre todos los paquetes Activos con fecha_fin <= ahora y los procesa:
 * - Si alcanzaron la capacidad → marcarCompleto
 * - Si no la alcanzaron → cancelarYReembolsar
 */
async function procesarPaquetesVencidos(): Promise<void> {
  console.log('[Cron] Verificando paquetes con fecha_fin vencida...');
  const ahora = new Date();

  try {
    const paquetesVencidos = await prisma.paquetePublicado.findMany({
      where: {
        estadoId: ESTADO_PAQUETE.ACTIVO,
        fecha_fin: { lte: ahora },
      },
      select: {
        id_paquete_publicado: true,
        cant_productos: true,
        cant_productos_reservados: true,
      },
    });

    console.log(`[Cron] ${paquetesVencidos.length} paquete/s vencido/s a procesar.`);

    for (const paquete of paquetesVencidos) {
      const reservados = paquete.cant_productos_reservados || 0;
      const necesarios = paquete.cant_productos || 0;

      if (necesarios > 0 && reservados >= necesarios) {
        // Capacidad alcanzada → Completo
        try {
          await service.marcarCompleto(paquete.id_paquete_publicado);
          console.log(`[Cron] Paquete ${paquete.id_paquete_publicado} → Completo.`);
        } catch (err) {
          console.error(`[Cron] Error al marcar completo paquete ${paquete.id_paquete_publicado}:`, err);
        }
      } else {
        // Cupo insuficiente → Cancelado con reembolso automático
        try {
          await service.cancelarYReembolsar(paquete.id_paquete_publicado);
          console.log(`[Cron] Paquete ${paquete.id_paquete_publicado} → Cancelado y reembolsado.`);
        } catch (err) {
          console.error(`[Cron] Error al cancelar paquete ${paquete.id_paquete_publicado}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Error al consultar paquetes vencidos:', err);
  }
}
