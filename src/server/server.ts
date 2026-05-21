import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

  get instance() {
    return this.app;
  }

  public start(): void {
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }),
    );

    this.app.use('/api/pagos/webhook', express.raw({ type: '*/*' }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(
      cors({
        origin: [
          'http://localhost:4200',
          'http://127.0.0.1:4200',
          'https://www.mercadosinergico.com.ar',
          'https://mercadosinergico.com.ar',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        credentials: true,
      }),
    );

    this.app.use(this.routes);
    this.app.use(errorHandler);

    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en el puerto: ${this.port}`);
    });
  }
}
