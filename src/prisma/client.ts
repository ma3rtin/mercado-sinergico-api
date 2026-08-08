/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

function buildHelpMessage(err: unknown) {
	const lines = [
		'Prisma Client failed to initialize.',
		'This usually means Prisma v7 expects either a driver adapter or an "accelerateUrl" when using the new client engine.',
		'',
		'Two ways to resolve this:',
		'  1) Install and pass a driver adapter that matches your datasource provider (recommended for Direct TCP).',
		'     Example: `npm install @prisma/adapter-mariadb`',
		'  2) Use Prisma Accelerate (remote execution): set `ACCELERATE_URL` and ensure it\'s valid.',
		'',
		`Original error: ${String((err as Error)?.message ?? err)}`,
	];

	return lines.join('\n');
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient | null = globalForPrisma.prisma || null;

if (!prismaInstance) {
	try {
		const clientOpts: any = {};

		// Prefer explicit accelerate URL from env when provided.
		if (process.env.ACCELERATE_URL) {
			clientOpts.accelerateUrl = process.env.ACCELERATE_URL;
		}

		// If DATABASE_URL is present and adapter package is installed, try to load it.
		if (process.env.DATABASE_URL) {
			try {
				const mod = await import('@prisma/adapter-mariadb');
				const AdapterCtor = (mod && (mod.default ?? (mod as any).PrismaMariaDb ?? Object.values(mod).find((v: any) => typeof v === 'function')));

			if (AdapterCtor) {
				// Parse DATABASE_URL and build a pool config object with slightly larger timeouts
				try {
					const url = new URL(process.env.DATABASE_URL);
					const database = url.pathname ? url.pathname.replace(/^\//, '') : undefined;
					const configObj: any = {
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
						const factoryInstance = new (AdapterCtor as any)(configObj, factoryOptions);
						prismaInstance = new PrismaClient({ adapter: factoryInstance } as any);
					} catch (ex) {
						console.warn('Failed to instantiate PrismaMariaDb adapter factory with config object:', (ex as Error)?.message ?? ex);
					}
				}
			} catch (e) {
				console.warn('Could not load @prisma/adapter-mariadb dynamically, falling back to default PrismaClient init:', (e as Error)?.message ?? e);
			}
		}

		if (!prismaInstance) {
			prismaInstance = new PrismaClient(clientOpts as any);
		}

		if (process.env.NODE_ENV !== 'production') {
			globalForPrisma.prisma = prismaInstance;
		}
	} catch (err) {
		console.error(buildHelpMessage(err));
		throw err;
	}
}

export const prisma = prismaInstance as PrismaClient;
