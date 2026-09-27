# Catálogo de localidades y paquetes sin zona

La migración `20260927000000_localidades_y_paquetes_sin_zona` incorpora las 47 entradas acordadas, incluyendo Vicente López y Ensenada por separado.

- Retira `PaquetePublicado.zonaId`, su índice y su clave foránea. Conserva los paquetes y sus pedidos.
- Desactiva las localidades anteriores, reutiliza un ID por nombre coincidente y crea los nombres faltantes. No reasigna domicilios históricos a divisiones comerciales inferidas.
- Mantiene las localidades históricas referenciadas por usuarios/direcciones. Solo las activas aparecen en `/api/localidades`; los formularios deben elegir una vigente al guardar el domicilio.
- El CP del catálogo pasa a nullable y no se copia a las direcciones. Los códigos ya guardados en domicilios se conservan.
- El endpoint de paquetes por zona se retira; los listados y conteos ignoran parámetros antiguos de zona. Publicación, duplicación, recomendaciones y reportes dejan de usarla.
- `script.sql` utiliza las localidades instaladas por la migración y busca IDs por nombre. Es una seed para bases vacías, no una actualización de datos existentes.

## Aplicación

Respaldar la base antes del despliegue. Coordinar backend y frontend: el código antiguo requiere la columna de zona que esta migración elimina. En una ventana sin tráfico, aplicar `npx prisma migrate deploy`, generar Prisma con `npm run generate`, compilar e iniciar el backend nuevo y publicar el frontend nuevo. No ejecutar `migrate reset` ni la seed contra una base con datos reales.

La migración queda preparada en el repositorio. No se aplica automáticamente a una base existente durante esta tarea. Las divisiones La Matanza Norte/Sur y La Plata Centro/Norte/Oeste requieren una definición comercial para convertir direcciones históricas; el cambio conserva su información original.

La investigación de validación externa está en [validacion-domicilios.md](validacion-domicilios.md). Actualizar el catálogo no equivale a validar la existencia de un domicilio.
