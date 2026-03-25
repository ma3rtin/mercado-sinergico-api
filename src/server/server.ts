import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../middlewares/errorHandler.middleware.js';


interface Options {
  port: number;
  routes: Router;
}

export class Server {
  private app = express();
  private port: number;
  private routes: Router;

  constructor(options: Options) {
    const { port, routes } = options;
    this.port = port;
    this.routes = routes;
  }

  public start(): void {
    // 🛡️ Elite Security Headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ['\'self\''],
          scriptSrc: ['\'self\''],
          imgSrc: ['\'self\'', 'data:', 'https://res.cloudinary.com'], // Permite Cloudinary
          connectSrc: ['\'self\''],
        }
      }
    }));

    // 🚦 Global Rate Limit
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100, 
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' }
    });
    this.app.use(globalLimiter);

    this.app.use('/api/payments/webhook', express.raw({ type: '*/*' }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser()); // Habilitar lectura de cookies

    // Configuración de CORS de élite (Restrictiva)
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://localhost:5173'
    ];

    
    this.app.use(cors({ 
      origin: (origin, callback) => {
        // En desarrollo permitir si no hay origin (ej: Postman) o si está en la lista
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.error(`🛑 CORS Blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));


    this.app.use(this.routes);
    this.app.use(errorHandler);


    this.app.listen(this.port, () => {
      console.log(`🚀 Servidor de élite corriendo en: ${this.port}`);
    });
  }
}

