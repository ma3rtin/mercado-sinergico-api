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
					try {
						const url = new URL(process.env.DATABASE_URL);
						const database = url.pathname ? url.pathname.replace(/^\//, '') : undefined;
						const configObj: any = {
							host: url.hostname,
							port: url.port ? Number(url.port) : 3306,
							user: url.username,
							password: url.password,
							database,
							connectionLimit: 20,
							connectTimeout: 20000,
							acquireTimeout: 30000,
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
