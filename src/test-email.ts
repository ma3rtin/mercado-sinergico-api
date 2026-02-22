import { EmailService } from './services/email.service';
import { notificarProcesoPedido } from './templates/pedidos/pedido-procesado.template';
import { notificarEnvioPedido } from './templates/pedidos/pedido-enviado.template';
import { envs } from './config/envs';

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

    const recipient = envs.MAILER_EMAIL; // Send to self for testing

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
};

main();
