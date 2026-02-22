import nodemailer from 'nodemailer';
import { envs } from '../config/envs';

interface EnviarEmailOptions {
    para: string | string[];
    asunto: string;
    cuerpoHtml: string;
    adjuntos?: nodemailer.SendMailOptions['attachments'];
}

export class EmailService {
    private transporter = nodemailer.createTransport({
        service: envs.MAILER_SERVICE === 'gmail' ? 'gmail' : undefined,
        host: envs.MAILER_SERVICE === 'resend' ? 'smtp.resend.com' : undefined,
        port: envs.MAILER_SERVICE === 'resend' ? 465 : undefined,
        secure: envs.MAILER_SERVICE === 'resend',
        auth: {
            user: envs.MAILER_SERVICE === 'resend' ? 'resend' : envs.MAILER_EMAIL,
            pass: envs.MAILER_SECRET_KEY,
        },
    });

    constructor() { }

    async enviarEmail(opciones: EnviarEmailOptions): Promise<boolean> {
        const { para, asunto, cuerpoHtml, adjuntos = [] } = opciones;

        try {
            const sentInformation = await this.transporter.sendMail({
                from: envs.MAILER_EMAIL,
                to: para,
                subject: asunto,
                html: cuerpoHtml,
                attachments: adjuntos,
            });

            console.log('Email enviado: ', sentInformation);
            return true;
        } catch (error) {
            console.error('Error enviando email: ', error);
            return false;
        }
    }
}
