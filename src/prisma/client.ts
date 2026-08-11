import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient | null = globalForPrisma.prisma || null;

if (!prismaInstance) {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const database = url.pathname ? url.pathname.replace(/^\//, '') : undefined;
      
      const sslMode = url.searchParams.get('ssl-mode') || url.searchParams.get('ssl');
      let sslConfig: any = undefined;
      if (sslMode && sslMode.toLowerCase() !== 'disabled' && sslMode.toLowerCase() !== 'false') {
        sslConfig = { rejectUnauthorized: false };
      }

      const configObj: any = {
        host: url.hostname,
        port: url.port ? Number(url.port) : 3306,
        user: url.username,
        password: url.password,
        database,
        ssl: sslConfig,
        connectionLimit: 20,
        connectTimeout: 20000,
        acquireTimeout: 30000,
      };

      const factoryOptions = { database };
      const adapterInstance = new PrismaMariaDb(configObj, factoryOptions);
      
      prismaInstance = new PrismaClient({ adapter: adapterInstance });
    } catch (ex) {
      console.error('Error instantiating PrismaMariaDb adapter:', ex);
      prismaInstance = new PrismaClient({});
    }
  } else {
    prismaInstance = new PrismaClient({});
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance as PrismaClient;

