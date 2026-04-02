import { despachadorEventosApp, DespachadorEventos } from '../despachadorEventos.js';
import { prisma } from '../../prisma/client.js';
import { EmailService } from '../../services/email.service.js';

// ─── Estados canónicos ──────────────────────────────────────────────────────
// Este listener se activa cuando el cupo del paquete se completa.
// Cambia el paquete a "Completo" y notifica a compradores y admins.
// Los pedidos activos se actualizan a "Completo" (excepto Cancelado/Reembolsando).
// ────────────────────────────────────────────────────────────────────────────

const emailService = new EmailService();

despachadorEventosApp.on(
    DespachadorEventos.PAQUETE_COMPLETADO,
    async (paqueteId: number) => {
        try {
            console.log(`[Event Listener] Procesando PAQUETE_COMPLETADO para paquete ID: ${paqueteId}`);

            // 1. Obtener estado "Completo" de publicación y pedido
            const [estadoPaqueteCompleto, estadoPedidoCompleto] = await Promise.all([
                prisma.estadoPaquetePublicado.findUnique({ where: { nombre: 'Completo' } }),
                prisma.estadoPedido.findUnique({ where: { nombre: 'Completo' } }),
            ]);

            if (!estadoPaqueteCompleto || !estadoPedidoCompleto) {
                console.error('[Event Listener] Estados "Completo" no encontrados en la BD.');
                return;
            }

            // 2. Marcar el paquete como "Completo"
            await prisma.paquetePublicado.update({
                where: { id_paquete_publicado: paqueteId },
                data: { estadoId: estadoPaqueteCompleto.id_estado },
            });

            // 3. Actualizar en cascada los pedidos activos a "Completo" (excepto Cancelado y Reembolsando)
            await prisma.pedido.updateMany({
                where: {
                    paquetePublicadoId: paqueteId,
                    estado: { nombre: { notIn: ['Cancelado', 'Reembolsando'] } },
                },
                data: { estadoId: estadoPedidoCompleto.id_estado },
            });

            // 4. Obtener información del paquete
            const paquete = await prisma.paquetePublicado.findUnique({
                where: { id_paquete_publicado: paqueteId },
                include: {
                    paqueteBase: true,
                },
            });

            if (!paquete) {
                console.error(`[Event Listener] Paquete ${paqueteId} no encontrado.`);
                return;
            }

            // 5. Obtener compradores activos (estado "Completo")
            const pedidosCompletos = await prisma.pedido.findMany({
                where: {
                    paquetePublicadoId: paqueteId,
                    estadoId: estadoPedidoCompleto.id_estado,
                },
                include: {
                    usuario: true,
                },
            });

            const correosCompradores = [...new Set(pedidosCompletos.map(p => p.usuario.email))];

            // 6. Obtener administradores
            const admins = await prisma.usuario.findMany({
                where: {
                    rol: {
                        nombre: 'Administrador',
                    },
                },
            });

            const correosAdmins = admins.map(a => a.email);

            // 7. Enviar correos a compradores
            if (correosCompradores.length > 0) {
                await emailService.enviarEmail({
                    para: correosCompradores,
                    asunto: `¡Grupo Completado! - ${paquete.paqueteBase.nombre}`,
                    template: 'comprador-paquete-completado',
                    context: {
                        nombrePaquete: paquete.paqueteBase.nombre
                    }
                });
                console.log(`[Event Listener] Correo enviado a ${correosCompradores.length} compradores.`);
            }

            // 8. Enviar correo a administradores
            if (correosAdmins.length > 0) {
                await emailService.enviarEmail({
                    para: correosAdmins,
                    asunto: `🚨 Acción Requerida: Paquete Completado - ${paquete.paqueteBase.nombre}`,
                    template: 'admin-paquete-completado',
                    context: {
                        nombrePaquete: paquete.paqueteBase.nombre,
                        paqueteId: paquete.id_paquete_publicado
                    }
                });
                console.log(`[Event Listener] Correo de alerta enviado a ${correosAdmins.length} administradores.`);
            }

        } catch (error) {
            console.error('[Event Listener Error] Fallo al procesar PAQUETE_COMPLETADO:', error);
        }
    }
);
