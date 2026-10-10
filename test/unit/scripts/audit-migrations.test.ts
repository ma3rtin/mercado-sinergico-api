import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const auditor = path.resolve('scripts/audit-migrations.js');
let cwd: string;
const git = (...args: string[]) => execFileSync('git', args, { cwd, stdio: 'pipe' }).toString().trim();
const migration = (sql: string) => {
  mkdirSync(path.join(cwd, 'prisma/migrations/prueba'), { recursive: true });
  writeFileSync(path.join(cwd, 'prisma/migrations/prueba/migration.sql'), sql);
};
const audit = (env: NodeJS.ProcessEnv = {}) => spawnSync(process.execPath, [auditor], {
  cwd, encoding: 'utf8',
  env: { ...process.env, GITHUB_BASE_REF: 'dev', GITHUB_EVENT_NAME: '', GITHUB_EVENT_PATH: '', ...env },
});

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'migration-audit-'));
  git('init', '-b', 'dev');
  git('config', 'user.email', 'audit@example.invalid');
  git('config', 'user.name', 'Prueba de auditoría');
  git('commit', '--allow-empty', '-m', 'Base');
  git('update-ref', 'refs/remotes/origin/dev', 'HEAD');
});

afterEach(() => rmSync(cwd, { recursive: true, force: true }));

it('aprueba un diff vacío válido', () => {
  expect(audit().status).toBe(0);
});

it('rechaza una base ausente en lugar de aprobar sin auditar', () => {
  const result = audit({ GITHUB_BASE_REF: 'inexistente' });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('Auditoría rechazada');
  expect(result.stdout).not.toContain('Audit Success');
});

it.each(['nuevo', 'staged', 'commit'])('rechaza un DROP en un archivo %s', (state) => {
  migration('ALTER TABLE PaquetePublicado DROP COLUMN zonaId;');
  if (state !== 'nuevo') git('add', '.');
  if (state === 'commit') git('commit', '-m', 'Migración');
  expect(audit().status).toBe(1);
});

it('permite la excepción explícita', () => {
  migration('-- prisma-audit: allow-drop\nALTER TABLE PaquetePublicado DROP COLUMN zonaId;');
  expect(audit().status).toBe(0);
});

it.each([
  '-- Ejemplo: -- prisma-audit: allow-drop\nDROP TABLE Pedido;',
  "SELECT '-- prisma-audit: allow-drop';\nDROP TABLE Pedido;",
  '-- comentario\n-- prisma-audit: allow-drop\nDROP TABLE Pedido;',
])('no acepta menciones de la excepción fuera de la primera línea', (sql) => {
  migration(sql);
  expect(audit().status).toBe(1);
});

it('permite la excepción con saltos de línea de Windows', () => {
  migration('-- prisma-audit: allow-drop\r\nDROP TABLE Vieja;');
  expect(audit().status).toBe(0);
});

it('una excepción no habilita otros archivos destructivos', () => {
  migration('-- prisma-audit: allow-drop\nDROP TABLE Vieja;');
  mkdirSync(path.join(cwd, 'prisma/migrations/otra'));
  writeFileSync(path.join(cwd, 'prisma/migrations/otra/migration.sql'), 'DROP TABLE Pedido;');
  expect(audit().status).toBe(1);
});

it('audita todos los commits de un push aunque HEAD sea dev', () => {
  const before = git('rev-parse', 'HEAD');
  migration('DROP TABLE Pedido;');
  git('add', '.');
  git('commit', '-m', 'Migración');
  git('commit', '--allow-empty', '-m', 'Otro cambio');
  const event = path.join(cwd, 'push.json');
  writeFileSync(event, JSON.stringify({ before }));
  const result = audit({ GITHUB_BASE_REF: '', GITHUB_EVENT_NAME: 'push', GITHUB_EVENT_PATH: event });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('Operación destructiva detectada');
});

it('aprueba un push con una migración aditiva', () => {
  const before = git('rev-parse', 'HEAD');
  migration('ALTER TABLE Localidad ADD COLUMN activa BOOLEAN NOT NULL DEFAULT true;');
  git('add', '.');
  git('commit', '-m', 'Migración aditiva');
  const event = path.join(cwd, 'push.json');
  writeFileSync(event, JSON.stringify({ before }));
  const result = audit({ GITHUB_BASE_REF: '', GITHUB_EVENT_NAME: 'push', GITHUB_EVENT_PATH: event });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('prisma/migrations/prueba/migration.sql');
});
