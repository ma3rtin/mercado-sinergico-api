import { Queue, Worker, Job } from 'bullmq';
import { prisma } from '../prisma/client.js';
import { productoExcelService } from '../services/producto-excel.service.js';
import { envs } from '../config/envs.js';

// --- CONFIGURACIÓN DE REDIS ---
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
};

// --- DEFINICIÓN DE COLA (API SIDE) ---
export const importQueue = new Queue('excel-import', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s...
    },
    removeOnComplete: { count: 100 }, // No saturar Redis
    removeOnFail: { count: 1000 },
  }
});

// --- DEFINICIÓN DEL WORKER (WORKER SIDE) ---
// En una arquitectura distribuida real este worker correría en una instancia separada
export const importWorker = new Worker('excel-import', async (job: Job) => {
    const { filePath, trackerId } = job.data;
    
    console.log(`[Worker] Iniciando procesamiento Job ${job.id} para Importación ${trackerId}`);
    
    try {
        await productoExcelService.procesarImportacionAsincrona(filePath, trackerId);
    } catch (error) {
        console.error(`[Worker] Fallo crítico en Job ${job.id}:`, error);
        throw error; // Esto disparará el retry automático de BullMQ
    }
}, { 
    connection,
    concurrency: 2 // Procesar hasta 2 excels simultáneos por instancia de worker
});

importWorker.on('failed', async (job, err) => {
    if (job) {
        // En el último intento, marcar como fallido definitivo en BD
        if (job.attemptsMade >= (job.opts.attempts || 1)) {
            await prisma.importacionExcel.update({
                where: { id: job.data.trackerId },
                data: { 
                    estado: 'FALLIDO', 
                    errorFatal: `Reintentos agotados: ${err.message}` 
                }
            });
        }
    }
});
