import express, { Router } from "express";
import cors from "cors";
import { errorHandler } from "../middlewares/errorHandler.middleware";
import { envs } from "../config/envs";

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
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    const allowedOrigins = envs.FRONTEND_URL.split(",").map((url) =>
      url.trim()
    );

    const corsOptions = {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    };

    this.app.use(cors(corsOptions));
    this.app.use(this.routes);
    this.app.use(errorHandler);

    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en el puerto: ${this.port}`);
    });
  }
}
