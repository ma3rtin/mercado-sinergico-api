import { despachadorEventosApp, DespachadorEventos } from '../despachadorEventos.js';
import { prisma } from '../../prisma/client.js';
import { EmailService } from '../../services/email.service.js';

const emailService = new EmailService();

despachadorEventosApp.on(
    DespachadorEventos.PAQUETE_COMPLETADO,
    async (paqueteId: number) => {
        try {
            console.log(`[Event Listener] Procesando PAQUETE_COMPLETADO para paquete ID: ${paqueteId}`);

            // 1. Obtener información del paquete
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

            // 2. Obtener usuarios con pedidos aprobados (estadoId = 3) para este paquete
            const pedidosAprobados = await prisma.pedido.findMany({
                where: {
                    paquetePublicadoId: paqueteId,
                    estadoId: 3, // Asumiendo que 3 es "Aprobado" / "Pagado"
                },
                include: {
                    usuario: true,
                },
            });

            // Extraer correos únicos de compradores
            const correosCompradores = [...new Set(pedidosAprobados.map(p => p.usuario.email))];

            // 3. Obtener administradores
            const admins = await prisma.usuario.findMany({
                where: {
                    rol: {
                        nombre: 'Administrador',
                    },
                },
            });

            const correosAdmins = admins.map(a => a.email);

            // 4. Enviar correos a compradores
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

            // 5. Enviar correo a administradores
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
            console.error(`[Event Listener Error] Fallo al procesar PAQUETE_COMPLETADO:`, error);
        }
    }
);
