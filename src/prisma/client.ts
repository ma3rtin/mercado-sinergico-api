import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient | null = globalForPrisma.prisma || null;

if (!prismaInstance) {
  try {
    // Si DATABASE_URL está presente, armar el adapter con pool tuneado.
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      const database = url.pathname ? url.pathname.replace(/^\//, '') : undefined;
      const configObj = {
        host: url.hostname,
        port: url.port ? Number(url.port) : 3306,
        user: url.username,
        password: url.password,
        database,
        // pool tuning
        // minimumIdle: 1 => pool perezoso; el default de mariadb es
        // minimumIdle = connectionLimit, que llenaba 20 conexiones idle
        // serialmente (1.4s c/u) y las reponía al instante con idleTimeout corto.
        connectionLimit: 10,
        minimumIdle: 1,
        connectTimeout: 20000,
        acquireTimeout: 30000,
        // El ping de validación de conexiones idle usa pingTimeout con
        // default 250ms, pero la latencia real a Aiven es ~360ms: el
        // ping destruía conexiones sanas y el pool creaba una nueva
        // (~1.4s) en cada primera query. Con 2000ms el ping responde.
        pingTimeout: 2000,
        // Si la conexión se reutilizó hace < 2000ms se entrega sin
        // ping (default 500ms), evitando el round-trip de validación
        // y acercando la primera query a ~350-400ms.
        minDelayValidation: 2000,
      };

      const factoryOptions = { database };
      const adapterInstance = new PrismaMariaDb(configObj, factoryOptions);

      prismaInstance = new PrismaClient({ adapter: adapterInstance });
    } else {
      prismaInstance = new PrismaClient({});
    }
  } catch (ex) {
    console.error('Error instantiating PrismaMariaDb adapter:', ex);
    prismaInstance = new PrismaClient({});
  }
}

if (prismaInstance && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance as PrismaClient;
