import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Determinar la rama base de comparación
let baseBranch = 'origin/dev';
if (process.env.GITHUB_BASE_REF) {
  baseBranch = `origin/${process.env.GITHUB_BASE_REF}`;
} else {
  // Localmente, intentar ver si existe 'dev' o 'main' en el repo local
  try {
    execSync('git show-ref --verify --quiet refs/heads/dev', { stdio: 'ignore' });
    baseBranch = 'dev';
  } catch (e) {
    try {
      execSync('git show-ref --verify --quiet refs/heads/main', { stdio: 'ignore' });
      baseBranch = 'main';
    } catch (err) {
      baseBranch = 'HEAD~1'; // Último recurso local
    }
  }
}

console.log(`\x1b[36m[Audit Info] Rama base de comparación determinada: ${baseBranch}\x1b[0m`);

// Obtener todos los archivos agregados o modificados en la rama actual
const getModifiedFiles = () => {
  const files = new Set();
  
  // 1. Archivos en commits entre la rama base y HEAD
  try {
    const diffCommits = execSync(`git diff --name-only --diff-filter=ACMRT ${baseBranch}...HEAD`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    diffCommits.split('\n').forEach(f => { if (f.trim()) files.add(f.trim()); });
  } catch (e) {
    console.warn(`\x1b[33m[Audit Warning] No se pudo obtener el diff de commits contra ${baseBranch}. Continuando con cambios locales.\x1b[0m`);
  }

  // 2. Archivos modificados en el working tree (no commiteados)
  try {
    const diffWorking = execSync(`git diff --name-only --diff-filter=ACMRT`, { encoding: 'utf8' });
    diffWorking.split('\n').forEach(f => { if (f.trim()) files.add(f.trim()); });
  } catch (e) {}

  // 3. Archivos staged (para commit)
  try {
    const diffStaged = execSync(`git diff --cached --name-only --diff-filter=ACMRT`, { encoding: 'utf8' });
    diffStaged.split('\n').forEach(f => { if (f.trim()) files.add(f.trim()); });
  } catch (e) {}

  // 4. Archivos sin trackear (nuevas migraciones locales)
  try {
    const untracked = execSync(`git ls-files --others --exclude-standard`, { encoding: 'utf8' });
    untracked.split('\n').forEach(f => { if (f.trim()) files.add(f.trim()); });
  } catch (e) {}

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

  // Verificar si existe bypass explícito
  if (content.includes('-- prisma-audit: allow-drop')) {
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
