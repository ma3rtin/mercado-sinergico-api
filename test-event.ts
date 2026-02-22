import { despachadorEventosApp, DespachadorEventos } from './src/events/despachadorEventos.js';
import './src/events/oyentes/oyentePaquete.js';

async function run() {
    console.log("Emitiendo evento PAQUETE_COMPLETADO para paquete ID 1...");
    despachadorEventosApp.emit(DespachadorEventos.PAQUETE_COMPLETADO, 1);

    // Wait a bit to see background tasks
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("Script terminado.");
}

run();
