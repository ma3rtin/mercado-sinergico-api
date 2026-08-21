/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Logging diagnóstico de Prisma activable por env var.
 * Ej: PRISMA_LOG=query,error,warn  (valores: query | info | warn | error)
 * Si no se define, no se suscribe ningún evento (comportamiento por defecto).
 */
type NivelPrisma = 'query' | 'info' | 'warn' | 'error';

const nivelesPrisma = (process.env.PRISMA_LOG ?? '')
	.split(',')
	.map((n) => n.trim().toLowerCase())
	.filter((n): n is NivelPrisma => ['query', 'info', 'warn', 'error'].includes(n));

const logOptions = nivelesPrisma.length
	? { log: nivelesPrisma.map((level) => ({ emit: 'event' as const, level })) }
	: {};

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

// Attempt to dynamically import and instantiate the MariaDB adapter if available.
// Use top-level await so the module exports a ready-to-use `prisma` instance.
let prismaInstance: PrismaClient | null = null;
try {
	const clientOpts: any = { ...logOptions };

	// Prefer explicit accelerate URL from env when provided.
	if (process.env.ACCELERATE_URL) {
		clientOpts.accelerateUrl = process.env.ACCELERATE_URL;
	}

	// If DATABASE_URL is present and adapter package is installed, try to load it.
	if (process.env.DATABASE_URL) {
		try {
			const mod = await import('@prisma/adapter-mariadb');
			// pick a constructor export: default or any exported function/class
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
						connectionLimit: 20,
						connectTimeout: 20000,
						acquireTimeout: 30000,
					};

					// options passed to the factory (used by adapter.getConnectionInfo)
					const factoryOptions = { database };

					// Instantiate the adapter factory with the config object
					const factoryInstance = new (AdapterCtor as any)(configObj, factoryOptions);
					prismaInstance = new PrismaClient({ adapter: factoryInstance, ...logOptions } as any);
				} catch (ex) {
					 
					console.warn('Failed to instantiate PrismaMariaDb adapter factory with config object:', (ex as Error)?.message ?? ex);
				}
			}
		} catch (e) {
			// If adapter import failed, fall back to clientOpts (accelerateUrl or default).
			// We'll attempt default construction below.
			 
			console.warn('Could not load @prisma/adapter-mariadb dynamically, falling back to default PrismaClient init:', (e as Error)?.message ?? e);
		}
	}

	if (!prismaInstance) {
		prismaInstance = new PrismaClient(clientOpts as any);
	}
} catch (err) {
	 
	console.error(buildHelpMessage(err));
	throw err;
}

// El tipado de $on depende de las opciones pasadas al constructor; como se
// resuelven en runtime desde PRISMA_LOG, casteamos a any.
const clienteEventos = prismaInstance as any;
if (nivelesPrisma.includes('query')) {
	clienteEventos.$on('query', (e: any) => {
		console.log(`[Prisma][query ${e.duration}ms] ${e.query}`);
	});
}
if (nivelesPrisma.includes('info')) {
	clienteEventos.$on('info', (e: any) => {
		console.log(`[Prisma][info] ${e.message}`);
	});
}
if (nivelesPrisma.includes('warn')) {
	clienteEventos.$on('warn', (e: any) => {
		console.warn(`[Prisma][warn] ${e.message}`);
	});
}
if (nivelesPrisma.includes('error')) {
	clienteEventos.$on('error', (e: any) => {
		console.error(`[Prisma][error] ${e.message}`);
	});
}

export const prisma = prismaInstance as PrismaClient;
