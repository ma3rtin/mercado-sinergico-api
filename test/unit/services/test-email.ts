import { EmailService } from '../../../src/services/email.service';
import { notificarProcesoPedido } from '../../../src/templates/pedidos/pedido-procesado.template';
import { notificarEnvioPedido } from '../../../src/templates/pedidos/pedido-enviado.template';
import { envs } from '../../../src/config/envs';

const emailService = new EmailService();

const main = async () => {

    // IMPORTANT: Make sure to set MAILER_SERVICE, MAILER_EMAIL, MAILER_SECRET_KEY in your .env file
    // Example for Resend:
    // MAILER_SERVICE=resend
    // MAILER_EMAIL=onboarding@resend.dev
    // MAILER_SECRET_KEY=re_123456789

    // Validate if env vars are present (basic check)
    if (!envs.MAILER_EMAIL || !envs.MAILER_SECRET_KEY || !envs.MAILER_SERVICE) {
        console.error('Missing MAILER environment variables. Please configure them in .env');
        return;
    }

    const recipient = 'mutuverria00@gmail.com'; // Send to self for testing

    console.log(`Enviando emails de prueba a ${recipient}...`);

    // Test Order Processed
    await emailService.enviarEmail({
        para: recipient,
        asunto: 'Test: Tu pedido ha sido procesado',
        cuerpoHtml: notificarProcesoPedido('Martin', '12345'),
    });

    // Test Order Shipped
    await emailService.enviarEmail({
        para: recipient,
        asunto: 'Test: Tu pedido ha sido enviado',
        cuerpoHtml: notificarEnvioPedido('Martin', '987654321'),
    });

    // Test Handlebars Templates
    console.log('Test: Plantillas de Paquete Completado...');

    await emailService.enviarEmail({
        para: recipient,
        asunto: 'Test: ¡Grupo Completado! (Comprador)',
        template: 'comprador-paquete-completado',
        context: { nombrePaquete: 'iPhone 14 Mayorista' }
    });

    await emailService.enviarEmail({
        para: recipient,
        asunto: 'Test: Acción Requerida (Admin)',
        template: 'admin-paquete-completado',
        context: { nombrePaquete: 'iPhone 14 Mayorista', paqueteId: 7 }
    });

    console.log('Test: Plantilla de Compra Confirmada (Admin hacia Comprador)...');

    await emailService.enviarEmail({
        para: recipient,
        asunto: 'Test: ✅ Compra Confirmada - iPhone 14 Mayorista',
        template: 'comprador-compra-confirmada',
        context: { nombrePaquete: 'iPhone 14 Mayorista' }
    });

};

main();
