---
name: prisma-migrations
description: Asiste al equipo de desarrollo en la gestión segura de cambios de esquema en la base de datos a través de Prisma Migrations, previniendo operaciones destructivas de datos y automatizando renombrados seguros.
---

Cuando se invoque esta skill o se detecte que el usuario desea realizar cambios en el esquema de la base de datos (`schema.prisma`) o generar migraciones:

## Flujo de Trabajo para Modificaciones en la Base de Datos

### 1. Detección Preventiva de Pérdida de Datos
Antes de modificar el archivo `schema.prisma` o sugerir un cambio de base de datos, analiza si la modificación propuesta implica:
- Renombrar una tabla o un modelo.
- Renombrar una columna o campo de un modelo.
- Eliminar una tabla o columna.

Si identificas alguna de estas operaciones, **detén la ejecución** y pregúntale de forma interactiva al usuario en el chat:
> *"He detectado que el cambio propuesto incluye renombrar/eliminar la tabla o columna `[Nombre]`. Si aplicamos esto por defecto, Prisma borrará la tabla física (y sus datos) en producción para crear una nueva.*
> 
> *¿Deseas que generemos una migración segura de renombrado (RENAME) que conserve los datos existentes, o la eliminación de la información es intencional?"*

---

### 2. Flujo si el usuario desea Renombrar (Conservar Datos)
Si el usuario confirma que desea renombrar conservando los datos, sigue estrictamente este procedimiento:

1. **Modificar el Schema**: Realiza la edición necesaria en el archivo [schema.prisma](file:///c:/Users/mutuv/Documents/Proyectos/mercado-sinergico/api/prisma/schema.prisma) con los nuevos nombres de modelos o campos.
2. **Generar la Migración en Modo Creación**: Ejecuta la consola para crear la migración sin aplicarla en la base de datos de desarrollo local:
   ```bash
   npx prisma migrate dev --create-only --name renombrar_X_a_Y
   ```
3. **Modificar el SQL de la Migración**:
   - Abre el archivo `migration.sql` recién generado (se ubicará en una nueva subcarpeta bajo `prisma/migrations/`).
   - Localiza las líneas destructivas que hacen `DROP TABLE` y `CREATE TABLE` (o `DROP COLUMN` y `ADD COLUMN`).
   - Reemplázalas con comandos de renombrado nativo de MySQL/PostgreSQL:
     - **Para renombrar una Tabla en MySQL**:
       ```sql
       RENAME TABLE `OldTableName` TO `NewTableName`;
       ```
     - **Para renombrar una Columna en MySQL**:
       ```sql
       ALTER TABLE `TableName` RENAME COLUMN `old_column` TO `new_column`;
       ```
4. **Aplicar y Validar Localmente**:
   - Guarda el archivo `migration.sql` editado.
   - Ejecuta en consola `npx prisma migrate dev` para validar que el SQL editado es sintácticamente correcto y aplicarlo en la base de datos local.

---

### 3. Flujo si el usuario desea Eliminar (Destrucción Intencional)
Si el usuario confirma que el borrado de datos es deliberado y correcto:

1. **Generar la Migración**: Deja que Prisma genere la migración de forma normal con:
   ```bash
   npx prisma migrate dev --name eliminar_X
   ```
2. **Agregar el Bypass para el Pipeline de CI**:
   - Abre el archivo `migration.sql` autogenerado.
   - Agrega la siguiente línea exacta de comentario al inicio del archivo (línea 1):
     ```sql
     -- prisma-audit: allow-drop
     ```
   - Guarda el archivo. *Esto evitará que el script de auditoría automática en el pipeline de CI/CD rechace el PR por contener un DROP.*
   - Explica al usuario en el chat que se agregó el bypass debido a que la eliminación es intencionada.
