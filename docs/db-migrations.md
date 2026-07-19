# Guía de Cambios en la Base de Datos y Migraciones

Este documento detalla el estándar y flujo de trabajo para cualquier modificación estructural en la base de datos del proyecto **Mercado Sinérgico** utilizando **Prisma ORM** y **MariaDB/MySQL**. 

Esta guía es de cumplimiento obligatorio tanto para desarrolladores humanos como para agentes de Inteligencia Artificial (AIs/Coding Assistants).

---

## 🚀 Resumen del Flujo de Trabajo

```
          [ Cambio en Requisito de DB ]
                        │
                        ▼
          Editar prisma/schema.prisma
                        │
                        ▼
     npx prisma migrate dev --name <nombre>
                        │
      ├─ Aplica cambio en DB local
      ├─ Genera prisma/migrations/.../migration.sql
      └─ Regenera el cliente de Prisma
                        │
                        ▼
          Actualizar código del Backend
                        │
                        ▼
    Commitear schema + migration.sql + código
                        │
                        ▼
           Push -> Deploy en Producción
                        │
                        ▼
            prisma migrate deploy 
     (Corre automático antes de iniciar el server)
```

---

## 🛠️ Comandos de Desarrollo (Día a Día)

### 1. Crear una nueva migración local (Cambio de Schema)
Cuando realices un cambio en `prisma/schema.prisma` (agregar campo, modelo, enum, etc.), ejecuta en la carpeta `api`:
```bash
npx prisma migrate dev --name descripcion_corta_del_cambio
```
* **Nombre de la migración:** Debe ser descriptivo, corto y en `snake_case` (ej. `add_archivado_to_paquete_base`, `create_tabla_notificaciones`).
* **Qué hace:** Aplica el cambio a tu base de datos de desarrollo, regenera el cliente Prisma y crea el archivo SQL incremental en `prisma/migrations/<timestamp>_nombre/migration.sql`.

### 2. Resetear base de datos local y cargar datos de prueba (Seed)
Si necesitas limpiar tu base de datos local por completo y volver a importar los registros iniciales definidos en `script.sql`, ejecuta en la carpeta `api`:
```bash
npm run reset-db
```
* **Qué hace:** Lanza `npx prisma migrate reset --force` (el cual borra todas las tablas, lee y ejecuta las migraciones de `prisma/migrations` en orden cronológico para recrear el esquema limpio) y seguidamente ejecuta `npm run seed` para cargar la base de datos con los datos de prueba del archivo `script.sql`.

### 3. Aplicar migraciones en Producción (CI/CD)
El servidor de producción ejecuta el siguiente comando antes de levantar el servidor de Node.js:
```bash
npx prisma migrate deploy
```
* **Qué hace:** Lee las migraciones del historial y aplica de manera incremental y segura las pendientes en la base de datos de producción. **Este comando nunca borra datos de producción.**

---

## ❌ Reglas de Oro (Nunca Romper)

| Acción Prohibida | Motivo |
| :--- | :--- |
| **Usar `db push` en producción** | No genera historial de migraciones; puede causar pérdida silenciosa de datos. |
| **Modificar archivos de migración commiteados a mano** | Rompe la integridad del historial de base de datos; fallará el deploy en producción. |
| **Borrar la carpeta `prisma/migrations/`** | Se pierde la línea de tiempo histórica; producción no sabrá qué aplicar y fallará el pipeline. |
| **Commitear cambios de schema sin su migración** | El deploy en producción no aplicará los cambios de base de datos, causando fallos de ejecución en la API. |

---

## 🤖 Guía Especial para Asistentes de IA (AI Coding Assistants)

Si eres una Inteligencia Artificial trabajando en este repositorio, debes acatar estrictamente las siguientes reglas:

1. **Detección de Drift**: Antes de realizar cualquier cambio en el esquema, comprueba la carpeta `api/prisma/migrations` para asegurarte de que el historial está alineado.
2. **Generación Obligatoria**: Si modificas `schema.prisma`, **debes** proponer o ejecutar `npx prisma migrate dev --name <nombre>` para generar los archivos de migración correspondientes en el mismo commit.
3. **Casos Especiales**:
   * **Renombrar columnas:** Prisma interpreta un renombre como `DROP` y `ADD` (pérdida de datos). Corrige manualmente el archivo SQL de la migración temporal para usar `RENAME COLUMN` antes de commitear.
   * **Campos `NOT NULL` con datos preexistentes:** Agrégalos en la migración como opcionales (`NULL`), realiza un bloque de backfill SQL en la misma migración para poblar los valores preexistentes (o asigna un `DEFAULT`), y finalmente altera la columna a `NOT NULL`.
