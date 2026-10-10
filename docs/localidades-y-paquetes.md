# Catálogo de localidades y paquetes sin zona

La migración `20260927000000_localidades_y_paquetes_sin_zona` incorpora las 47 entradas acordadas, incluyendo Vicente López y Ensenada por separado.

- Retira `PaquetePublicado.zonaId`, su índice y su clave foránea. Conserva los paquetes y sus pedidos.
- Desactiva las localidades anteriores, reutiliza un ID por nombre coincidente y crea los nombres faltantes. No reasigna domicilios históricos a divisiones comerciales inferidas.
- Mantiene las localidades históricas referenciadas por usuarios/direcciones. Solo las activas aparecen en `/api/localidades`; los formularios deben elegir una vigente al guardar el domicilio.
- El CP del catálogo pasa a nullable; esta migración deja las localidades activadas con CP nulo. La migración posterior `20261001000000_codigos_postales_referencia` completa 37 referencias documentadas y mantiene 10 casos ambiguos sin CP. Los códigos guardados en domicilios se conservan.
- El endpoint de paquetes por zona se retira; los listados y conteos ignoran parámetros antiguos de zona. Publicación, duplicación, recomendaciones y reportes dejan de usarla.
- `script.sql` utiliza las localidades instaladas por la migración y busca IDs por nombre. Es una seed para bases vacías, no una actualización de datos existentes.

## Aplicación

Respaldar la base antes del despliegue. Coordinar backend y frontend: el código antiguo requiere la columna de zona que esta migración elimina. En una ventana sin tráfico, aplicar `npx prisma migrate deploy`, generar Prisma con `npm run generate`, compilar e iniciar el backend nuevo y publicar el frontend nuevo. No ejecutar `migrate reset` ni la seed contra una base con datos reales.

La excepción `-- prisma-audit: allow-drop` autoriza el descarte intencional de la zona histórica de los paquetes. No habilita otras migraciones. El archivo también elimina los CP del catálogo activo mediante `UPDATE`, operación que el auditor no detecta.

Antes de aplicar, comprobar el estado de las migraciones y ensayar sobre una copia aislada de los datos del entorno destino. Si esta migración ya fue aplicada, no volver a ejecutarla ni reemplazar su historial sin revisar su estado. Verificar la restauración del respaldo: volver al backend anterior por sí solo no recupera la columna ni sus datos. Detener las instancias antiguas durante la ventana; `npm start` también ejecuta `prisma migrate deploy`.

## Validación aislada del 30/09/2026

Se ejecutaron las migraciones anteriores versionadas y esta migración en MySQL 8.4, sin red ni datos reales, con paquetes, pedidos, domicilios y localidades duplicadas e históricas de prueba. Se verificaron 47 localidades activas sin nombres duplicados, conservación de referencias y CP de domicilios, eliminación de `zonaId` y creación de un paquete sin zona.

El ensayo detectó una incompatibilidad entre la collation de `Localidad.nombre` y el default de MySQL 8.4. La tabla temporal ahora hereda la definición de esa columna; el ensayo completo pasó con esa corrección. Esta prueba no reemplaza el ensayo con datos representativos del destino ni la comprobación del frontend.

El auditor rechaza fallos de Git y, en eventos `push`, compara contra el commit anterior al push. Sus pruebas se ejecutan con `npm test -- --runInBand test/unit/scripts/audit-migrations.test.ts`.

La migración queda preparada en el repositorio. No se aplica automáticamente a una base existente durante esta tarea. Las divisiones La Matanza Norte/Sur y La Plata Centro/Norte/Oeste requieren una definición comercial para convertir direcciones históricas; el cambio conserva su información original.

La investigación de validación externa está en [validacion-domicilios.md](validacion-domicilios.md). Actualizar el catálogo no equivale a validar la existencia de un domicilio.

Los códigos de referencia, las fuentes por localidad y sus límites están en [codigos-postales-localidades.md](codigos-postales-localidades.md). No usar el CP de referencia para sobrescribir el del domicilio ni como validación de pertenencia a una zona.
