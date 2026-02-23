import nodemailer from 'nodemailer';
import { envs } from '../config/envs.js';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

interface EnviarEmailOptions {
    para: string | string[];
    asunto: string;
    template?: string; // Name of the hbs file without extension
    context?: Record<string, unknown>;     // Variables to pass to the template
    cuerpoHtml?: string; // Fallback HTML
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
        const { para, asunto, template, context, cuerpoHtml, adjuntos = [] } = opciones;

        let htmlToSend = cuerpoHtml || '';

        try {
            if (template) {
                // templates in src/templates/emails/
                const templatePath = path.join(process.cwd(), 'src', 'templates', 'emails', `${template}.hbs`);
                const templateFile = fs.readFileSync(templatePath, 'utf8');
                const compiledTemplate = handlebars.compile(templateFile);
                htmlToSend = compiledTemplate(context || {});
            } else if (!cuerpoHtml) {
                throw new Error('Se debe proveer \'template\' o \'cuerpoHtml\'');
            }

            await this.transporter.sendMail({
                from: envs.MAILER_EMAIL,
                to: para,
                subject: asunto,
                html: htmlToSend,
                attachments: adjuntos,
            });

            return true;
        } catch (error) {
            console.error('Error enviando email: ', error);
            return false;
        }
    }
}
