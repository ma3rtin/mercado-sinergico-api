# Revisión de localidades, paquetes sin zona y referencias postales

Fecha: 01/10/2026. Alcance: cambios de la rama respecto a `origin/dev`, ajustes locales del auditor, migraciones, consumidores del catálogo, DTO, pruebas y compatibilidad del perfil frontend mediante lectura del código.

## Veredicto

El cambio funciona con las migraciones presentes en el workspace y datos de prueba en MySQL 8.4. No se encontraron referencias activas a la zona del paquete en sus servicios, DTO o consultas revisadas. La API de localidades mantiene su contrato y la carga postal no modifica domicilios.

Esto no certifica el estado de una base desplegada: no se consultó ni modificó producción. Antes de desplegar hay que revisar el historial de migraciones del destino y ensayar con una copia representativa.

## Hallazgos atendidos

- El auditor rechazaba la eliminación intencional de `PaquetePublicado.zonaId`: la excepción está documentada en esa migración.
- La tabla temporal del catálogo podía tener una collation incompatible: hereda la definición de `Localidad.nombre`. El SQL pasó en MySQL 8.4 con default distinto al de la tabla.
- Los errores de Git podían terminar en una aprobación sin auditoría: ahora rechazan la ejecución.
- Un push podía compararse con la misma rama y omitir cambios: se usa el commit anterior del evento.
- La excepción podía activarse por una mención dentro de otro comentario o literal SQL: ahora requiere la primera línea exacta, admitiendo saltos de línea LF o CRLF.
- Faltaban CP de referencia: una migración adicional completa 37 entradas sin reemplazar valores existentes. Las diez entradas ambiguas no reciben códigos inventados. Ver [investigación y fuentes](codigos-postales-localidades.md).

## Pendientes y límites

1. **Migración previa sin versionar.** `prisma/migrations/20260812235000_complete_schema_columns/migration.sql` estaba sin seguimiento antes de esta tarea. Agrega `PaquetePublicado.nombre`, `Direccion.observaciones` y `Pedido.paymentId`, que el esquema actual necesita. La prueba de instalación completa la incluyó. Revisarla e incluirla en la entrega si corresponde al historial del destino; no asumir que un clon con solo archivos ya versionados contiene esos cambios. No se alteró este archivo.
2. **Compatibilidad del despliegue.** El backend viejo requiere `zonaId`; detener instancias anteriores durante la ventana acordada. `npm start` ejecuta migraciones. Tener un respaldo cuya restauración se haya probado; retroceder el código no recupera datos descartados.
3. **Localidades históricas.** Sus IDs y domicilios se conservan. Los endpoints de escritura rechazan una localidad inactiva; el perfil frontend revisado deja la selección vacía para que se elija una vigente y conserva el CP del domicilio. No se ejecutó una prueba visual del frontend en esta tarea.
4. **Alcance del auditor.** Sigue siendo una comprobación por patrones, no un analizador SQL ni una garantía contra toda pérdida de datos. No detecta todos los `UPDATE`, `DELETE` o cambios de tipos peligrosos, y puede marcar borrados de índices o claves. La excepción autoriza el archivo entero.
5. **CPA completo.** `Direccion.codigo_postal` sigue siendo entero. Esta entrega implementa referencias numéricas, no CPA alfanuméricos ni validación de domicilio. Un CP diferente de la referencia no se rechaza por ese motivo.

## Verificación realizada

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | Correcto |
| ESLint sobre `src/**/*.ts`, sin `--fix` | 0 errores, 0 advertencias |
| `npm test -- --runInBand --silent` | 282 aprobados; 1 omitido preexistente |
| Auditor con `GITHUB_BASE_REF=dev` | Aprobado; revisa tres migraciones del workspace |
| MySQL 8.4 aislado, con históricos ficticios | 14 comprobaciones correctas |
| Instalación vacía: migraciones del workspace y `script.sql` | 47 localidades activas, 37 CP de referencia, 11 paquetes, 7 direcciones |

Las comprobaciones SQL verificaron los 37 valores exactos, los diez nulos, ausencia de duplicados activos, conservación de IDs, localidades históricas y sus CP, direcciones y CP, pedidos y referencias, usuarios y relaciones de zonas; también eliminación de `zonaId`, creación de paquetes sin zona, repetición sin sobrescribir personalizaciones y ausencia de CP inventado para una entrada desconocida.

Los ensayos ejecutaron el SQL mediante el cliente MySQL en un contenedor sin red ni volúmenes del proyecto. No validan el historial `_prisma_migrations` de ningún entorno existente. La seed se ejecutó solamente sobre una base temporal vacía.
