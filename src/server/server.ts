import express, { Router } from 'express';
import cors from 'cors';
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
    this.app.use('/api/payments/webhook', express.raw({ type: '*/*' }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(
      cors({
        origin: ['http://localhost:4200', 'http://127.0.0.1:4200', '*'], // Mantengo '*' por si hay otros clientes pero permito explícito 4200
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
      })
    );

    this.app.use(this.routes);
    this.app.use(errorHandler);

    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en el puerto: ${this.port}`);
    });
  }
}
