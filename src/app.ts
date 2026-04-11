import 'reflect-metadata';
import { AppRoutes } from './routes/router.js';
import { Server } from './server/server.js';

import './events/oyentes/oyentePaquete.js';
import { iniciarTareasProgramadas } from './jobs/tareasProgramadas.js';

(async () => {
  main();
})();

function main() {
  const server = new Server({
    port: Number(process.env.PORT) || 3000,
    routes: AppRoutes.routes,
  });
  server.start();
  iniciarTareasProgramadas();
  console.log('Servidor iniciado');
}
