import { despachadorEventosApp, DespachadorEventos } from '../despachadorEventos.js';
import { prisma } from '../../prisma/client.js';
import { EmailService } from '../../services/email.service.js';

const emailService = new EmailService();

// ─── IDs de estado ────────────────────────────────────────────────────────────
const ESTADO_PAQUETE = { COMPLETO: 2 } as const;
const ESTADO_PEDIDO  = { PAGADO: 2, EN_PREPARACION: 4, EN_CAMINO: 5, RECIBIDO: 6 } as const;

// ─── PAQUETE_COMPLETO ─────────────────────────────────────────────────────────
// Triggered by: pago aprobado que llena la capacidad del paquete.
// Acción: cambiar estado a Completo, notificar compradores y admins.
despachadorEventosApp.on(DespachadorEventos.PAQUETE_COMPLETO, async (paqueteId: number) => {
    try {
        console.log(`[Evento] PAQUETE_COMPLETO → paquete ID: ${paqueteId}`);

        const paquete = await prisma.paquetePublicado.findUnique({
            where: { id_paquete_publicado: paqueteId },
            include: { paqueteBase: true },
        });
        if (!paquete) {
            console.error(`[Evento] Paquete ${paqueteId} no encontrado.`);
            return;
        }

        // Marcar paquete como Completo
        await prisma.paquetePublicado.update({
            where: { id_paquete_publicado: paqueteId },
            data: { estadoId: ESTADO_PAQUETE.COMPLETO },
        });

        // Compradores con pedido Pagado
        const pedidosPagados = await prisma.pedido.findMany({
            where: { paquetePublicadoId: paqueteId, estadoId: ESTADO_PEDIDO.PAGADO },
            include: { usuario: true },
        });
        const correosCompradores = [...new Set(pedidosPagados.map(p => p.usuario.email))];

        if (correosCompradores.length > 0) {
            await emailService.enviarEmail({
                para: correosCompradores,
                asunto: `¡Grupo completo! - ${paquete.paqueteBase.nombre}`,
                template: 'comprador-paquete-completo',
                context: { nombrePaquete: paquete.paqueteBase.nombre },
            });
            console.log(`[Evento] Mail "paquete completo" enviado a ${correosCompradores.length} comprador/es.`);
        }

        // Notificar admins
        const admins = await prisma.usuario.findMany({ where: { rol: { nombre: 'Administrador' } } });
        const correosAdmins = admins.map((a: { email: string }) => a.email);
        if (correosAdmins.length > 0) {
            await emailService.enviarEmail({
                para: correosAdmins,
                asunto: `Acción requerida: Paquete completo - ${paquete.paqueteBase.nombre}`,
                template: 'admin-paquete-completo',
                context: { nombrePaquete: paquete.paqueteBase.nombre, paqueteId },
            });
            console.log(`[Evento] Alerta admin enviada a ${correosAdmins.length} administrador/es.`);
        }
    } catch (error) {
        console.error('[Evento Error] PAQUETE_COMPLETO:', error);
    }
});

// ─── PAQUETE_ENTREGADO ────────────────────────────────────────────────────────
// Triggered by: admin marca el paquete como Entregado.
// Acción: solo logging (los pedidos ya se actualizaron en el servicio).
despachadorEventosApp.on(DespachadorEventos.PAQUETE_ENTREGADO, async (paqueteId: number) => {
    try {
        console.log(`[Evento] PAQUETE_ENTREGADO → paquete ID: ${paqueteId}`);

        const pedidosRecibidos = await prisma.pedido.findMany({
            where: { paquetePublicadoId: paqueteId, estadoId: ESTADO_PEDIDO.RECIBIDO },
            include: { usuario: true },
        });
        console.log(`[Evento] ${pedidosRecibidos.length} pedidos marcados como Recibido.`);
    } catch (error) {
        console.error('[Evento Error] PAQUETE_ENTREGADO:', error);
    }
});

// ─── PAQUETE_CANCELADO ────────────────────────────────────────────────────────
// Triggered by: admin cancela o cron de fecha_fin.
// Acción: solo logging (reembolsos y notificaciones se hacen en cancelarYReembolsar).
despachadorEventosApp.on(DespachadorEventos.PAQUETE_CANCELADO, async (paqueteId: number) => {
    console.log(`[Evento] PAQUETE_CANCELADO → paquete ID: ${paqueteId}`);
});

// ─── PEDIDOS_EN_CAMINO ────────────────────────────────────────────────────────
// Triggered by: admin marca pedidos en camino.
// Acción: solo logging (emails se envían en marcarPedidosEnCamino).
despachadorEventosApp.on(DespachadorEventos.PEDIDOS_EN_CAMINO, async (payload: { paqueteId: number; pedidoIds: number[] }) => {
    console.log(`[Evento] PEDIDOS_EN_CAMINO → paquete ID: ${payload.paqueteId}, pedidos: ${payload.pedidoIds.join(', ')}`);
});
