import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const git = (...args) => execFileSync('git', args, {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
});

// Determinar la rama base de comparación
let baseBranch = 'origin/main';
if (process.env.GITHUB_BASE_REF) {
  baseBranch = `origin/${process.env.GITHUB_BASE_REF}`;
} else if (process.env.GITHUB_EVENT_NAME === 'push') {
  // Comparar todo el push, incluso cuando HEAD ya es dev/main.
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (!event.before || /^0+$/.test(event.before)) {
    console.error('[Audit Error] No se pudo determinar el commit anterior al push.');
    process.exit(1);
  }
  baseBranch = event.before;
} else {
  // Localmente, intentar ver si existe 'main' o 'dev' en el repo local
  try {
    git('show-ref', '--verify', '--quiet', 'refs/heads/main');
    baseBranch = 'main';
  } catch (e) {
    try {
      git('show-ref', '--verify', '--quiet', 'refs/heads/dev');
      baseBranch = 'dev';
    } catch (err) {
      baseBranch = 'HEAD~1'; // Último recurso local
    }
  }
}

console.log(`\x1b[36m[Audit Info] Rama base de comparación determinada: ${baseBranch}\x1b[0m`);

// Obtener todos los archivos agregados o modificados en la rama actual
const getModifiedFiles = () => {
  const files = new Set();
  
  const range = process.env.GITHUB_EVENT_NAME === 'push'
    ? `${baseBranch}..HEAD`
    : `${baseBranch}...HEAD`;
  const commands = [
    ['diff', '--name-only', '--diff-filter=ACMRT', range],
    ['diff', '--name-only', '--diff-filter=ACMRT'],
    ['diff', '--cached', '--name-only', '--diff-filter=ACMRT'],
    ['ls-files', '--others', '--exclude-standard'],
  ];
  for (const args of commands) {
    try {
      git(...args).split('\n').forEach(file => { if (file.trim()) files.add(file.trim()); });
    } catch {
      console.error(`[Audit Error] No se pudo ejecutar git ${args.join(' ')}. Auditoría rechazada: no se pueden determinar las migraciones a revisar.`);
      process.exit(1);
    }
  }

  return Array.from(files);
};

const modifiedFiles = getModifiedFiles();
const sqlFiles = modifiedFiles.filter(file => 
  file.includes('prisma/migrations') && file.endsWith('.sql')
);

if (sqlFiles.length === 0) {
  console.log('\x1b[32m[Audit Success] No se detectaron archivos de migración SQL nuevos o modificados para analizar.\x1b[0m');
  process.exit(0);
}

console.log(`\x1b[36m[Audit Info] Analizando ${sqlFiles.length} archivo(s) de migración:\x1b[0m`);
sqlFiles.forEach(f => console.log(` - ${f}`));

let hasErrors = false;

for (const file of sqlFiles) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf8');

  // La excepción debe ocupar la primera línea, como indica el flujo documentado.
  if (content.split(/\r?\n/, 1)[0] === '-- prisma-audit: allow-drop') {
    console.log(`\x1b[36m[Audit Bypass] Ignorando validaciones en: ${file} (Bypass explícito detectado)\x1b[0m`);
    continue;
  }

  // Regex para buscar operaciones destructivas en SQL
  const dropTableRegex = /drop\s+table\b/i;
  const dropColumnRegex = /drop\s+column\b/i;
  const alterDropRegex = /alter\s+table\s+\S+\s+drop\b/i;

  if (dropTableRegex.test(content) || dropColumnRegex.test(content) || alterDropRegex.test(content)) {
    console.error(`\n\x1b[31m[Audit Error] Operación destructiva detectada en el archivo:\x1b[0m`);
    console.error(`\x1b[33m${file}\x1b[0m`);
    console.error(`\x1b[31mSe detectó una sentencia DROP que podría borrar tablas o columnas en producción.\x1b[0m`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n\x1b[41m\x1b[37m MIGRACIÓN RECHAZADA POR SEGURIDAD \x1b[0m');
  console.error('\nSe han detectado cambios destructivos en la base de datos.');
  console.error('\n\x1b[1m¿Cómo resolver esto?\x1b[0m');
  console.error('1. \x1b[1mSi querías renombrar una tabla/columna:\x1b[0m');
  console.error('   - Deshaz la migración localmente.');
  console.error('   - Usa el flujo seguro de Prisma con `npx prisma migrate dev --create-only`.');
  console.error('   - Edita el archivo SQL reemplazando el DROP/CREATE por una instrucción RENAME TABLE nativa.');
  console.error('2. \x1b[1mSi la eliminación es intencional (querés borrar los datos):\x1b[0m');
  console.error('   - Abre el archivo de migración en tu editor.');
  console.error('   - Agrega la siguiente línea al principio de tu archivo SQL:');
  console.error('     \x1b[32m-- prisma-audit: allow-drop\x1b[0m');
  console.error('   - Guarda el archivo, haz commit y vuelve a subir.');
  process.exit(1);
} else {
  console.log('\n\x1b[32m[Audit Success] Todas las migraciones nuevas pasaron la verificación de seguridad.\x1b[0m');
  process.exit(0);
}
