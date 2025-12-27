import 'reflect-metadata';
import { envs } from './config/envs.js';
import { AppRoutes } from './routes/router.js';
import { Server } from './server/server.js';

(async () => {
  main();
})();

function main() {
  const server = new Server({
    port: Number(process.env.PORT) || 3000,
    routes: AppRoutes.routes,
  });
  server.start();
  console.log('Servidor iniciado');
}
