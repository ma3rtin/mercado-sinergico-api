import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL es obligatorio para ejecutar la seed');
}

const url = new URL(databaseUrl);
const sql = await readFile(new URL('../script.sql', import.meta.url), 'utf8');

await new Promise<void>((resolve, reject) => {
  const mysql = spawn('mysql', [
    `--host=${url.hostname}`,
    `--port=${url.port || '3306'}`,
    `--user=${decodeURIComponent(url.username)}`,
    `--password=${decodeURIComponent(url.password)}`,
    url.pathname.slice(1),
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  mysql.on('error', (error) => reject(new Error(`No se pudo ejecutar mysql: ${error.message}`)));
  mysql.on('close', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`La seed terminó con código ${code}`));
  });

  mysql.stdin.end(sql);
});

console.log('Base de datos poblada correctamente.');
