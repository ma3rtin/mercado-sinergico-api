# Feature: Soft-Delete (Archivado) en Productos y Paquetes

Este documento registra la implementación del sistema de **Soft-Delete (Archivado)** en la aplicación, la cual reemplaza las eliminaciones físicas que causaban errores de clave foránea en la base de datos debido a relaciones históricas (como compras y pedidos de usuarios).

---

## 1. Motivación y Problema Resuelto
Previamente, al intentar eliminar un producto o un paquete base que estuviera involucrado en pedidos históricos o publicaciones activas, la base de datos arrojaba un error de violación de clave foránea (`ForeignKeyConstraintViolation`):
- `prisma.producto.delete()` fallaba debido a referencias obligatorias en `PedidoDetalle.productoId`.
- No era seguro usar eliminaciones en cascada en registros de pedidos porque se perdería el historial de compras de los usuarios.

La solución implementada consiste en un **archivado lógico** (`archivado = true`) para ocultar los elementos de la vista general del usuario administrador y comprador, mientras se mantiene su integridad referencial en el historial de transacciones.

---

## 2. Cambios Implementados

### A. Base de Datos & Modelado (Prisma)
- **`schema.prisma`**:
  - Se agregó el campo `archivado Boolean @default(false)` al modelo `PaqueteBase` (los moldes de paquetes).
  - El modelo `Producto` y `PaquetePublicado` ya contaban con esta propiedad, por lo que ahora todas las entidades principales están unificadas bajo el mismo estándar.
- Se sincronizó la base de datos de manera segura mediante `npx prisma db push` y se regeneraron las clases cliente de Prisma (`prisma generate`).

### B. Backend (API - `api`)
- **Unificación de Semántica de Eliminación (Soft-Delete)**:
  - **`ProductoService`**: Su método `delete(id)` ahora redirige internamente a `archivar(id, true)`.
  - **`PaqueteBaseService`**: Su método `delete(id)` se modificó para redirigir internamente a `archivar(id, true)` en lugar de realizar un borrado físico, unificando la lógica.
  - **`PaquetePublicadoService`**: Su método `delete(id)` se modificó para redirigir internamente a `archivar(id, true)` en lugar de aplicar el estado "Cerrado/Cancelado" o hacer hard delete.
  - **Excepción Documentada (`descartar`)**: El método `descartar(id)` en `PaquetePublicadoService` mantiene el borrado físico de la publicación y su paquete base (si no tiene otras publicaciones). Esta es una excepción deliberada y segura, ya que está estrictamente limitado a copias duplicadas de borradores que **no contienen ningún pedido asociado** (`paquete.pedidos.length === 0`).
- **`PaqueteBaseService`**:
  - Se modificó `getAll` para filtrar paquetes donde `archivado = false` por defecto.
  - Se implementó el método `archivar(id, archivado)` para actualizar el estado de archivado.
  - Se agregaron validaciones anti-reuso: `create` y `agregarProductos` fallan con un error `400` si se intentan asociar productos archivados.
- **`PaquetePublicadoService`**:
  - Se agregaron validaciones anti-reuso: `create` y `update` fallan con un error `400` si se intentan asociar paquetes base que estén archivados.
- **`PaqueteController` & Rutas**:
  - Se expuso la ruta `PATCH /api/paquetes-base/:id/archivar` mapeada a la lógica del controlador.
- **`ProductoItemListaDTO`**:
  - Se agregó el campo `archivado` (el cual estaba ausente en el DTO de transferencia de datos de productos para listados) para que el frontend pueda conocer correctamente el estado lógico de archivado de un producto y renderizar el botón y el icono correctos en la UI.
- **`PaquetePublicadoService` (Filtros de Catálogo Público)**:
  - Se modificaron las consultas destinadas al comprador/catálogo público para que **excluyan** publicaciones archivadas (`where.archivado = false`). Las consultas actualizadas son:
    * `getByLocation`: Para que no se listen en el home del comprador según su ubicación.
    * `getByProductId`: Para que no se listen campañas inactivas al buscar productos.
    * `getPorCerrarse`: Para que no aparezcan alertas de cierre inminente de campañas archivadas.
    * `getRelacionados`: Para que las publicaciones archivadas no se recomienden en el carrusel de otros paquetes.

### C. Frontend (Angular - `app`)
- **Modelos (`PaqueteBase.ts`)**:
  - Se añadió la propiedad opcional `archivado?: boolean` a la interfaz.
- **Servicios (`paquete-base.service.ts`)**:
  - Se actualizó `getPaquetes(includeArchived)` para que pase el parámetro opcional como query param al backend (`?includeArchived=true`).
  - Se implementó la llamada `archivarPaquete(id, archivado)` mapeada al nuevo endpoint PATCH.
- **Iconos (`app.config.ts` y `icons.service.ts`)**:
  - Se importaron y registraron los iconos `featherArchive` y `featherRotateCcw` en `NgIconsModule.withIcons(...)` de `app.config.ts`.
  - Se importaron y agregaron los alias `archive: featherArchive` y `rotateCcw: featherRotateCcw` en `IconsService` (`icons.service.ts`) para solucionar el problema de visualización que causaba que el botón de archivar/desarchivar se renderizara vacío.
- **Administración de Productos (`administrar-producto`)**:
  - Se **eliminó por completo el botón de eliminación física (Trash)** del HTML para evitar confusiones, manteniendo exclusivamente el botón de archivar/desarchivar (el cual ahora se renderiza correctamente con el icono `archive`).
  - Se removió la función huérfana `deleteProducto()` y su respectiva entrada explicativa en el modal de "Guía de símbolos".
  - Se reubicó el botón **"Mostrar productos archivados"** directamente al lado del selector de ordenamiento ("Ordenar: Nombre A-Z") compartiendo línea de manera más integrada.
  - Se implementó el diseño de toggle estandarizado con la paleta de la aplicación: **amarillo (`bg-brand-cta`) con sombra cuando está activo, y blanco/gris cuando está inactivo**, mostrando el ícono de caja de archivo (`archive`) y un tooltip/title explicativo al hacer hover.
- **Administración de Paquetes Base (`administrar-paquetes`)**:
  - Se reubicó el botón toggle **"Mostrar paquetes archivados"** al lado derecho del input del buscador de texto principal, compartiendo la misma fila del contenedor blanco.
  - Se rediseñó bajo el mismo formato estandarizado (ícono de caja de archivo, activo en amarillo `bg-brand-cta` e inactivo en blanco/gris, con tooltip explicativo).
  - Se agregó un badge visual de **"Archivado"** en la card de cada paquete base si este se encuentra archivado.
  - Se **reemplazó el botón de eliminar (tacho de basura) por el botón de archivar/desarchivar** (caja de archivo).
  - Se implementó el método `archivarPaqueteBase()` en el componente, que solicita confirmación al usuario utilizando SweetAlert2 y llama al servicio de archivado correspondiente.
- **Card de Administración de Publicaciones (`admin-paquete-card` y `administrar-publicaciones`)**:
  - Se restauró el botón disparador del menú "Acciones" (kebab dropdown) que estaba ausente en el HTML para publicaciones en estados no terminales (`!esEntregado && !esCancelado`).
  - Se agregó la opción **"Archivar/Desarchivar publicación"** dentro de la sección "Gestión" de este menú desplegable, permitiendo archivar campañas en cualquier estado.
  - Se reubicó el botón toggle **"Mostrar publicaciones archivadas"** integrándolo a la derecha de la barra de búsqueda de publicaciones y dándole el formato de toggle amarillo (`bg-brand-cta` activo / blanco inactivo, ícono `archive`, con tooltip explicativo).

---

## 3. Guía de Estilos y Consistencia UI
Los cambios visuales siguen los lineamientos y variables de diseño descritos en `CONTEXT.md`:
- El botón de archivado utiliza la clase `hover:text-brand-primary hover:bg-brand-primary/5` y el color del popup de SweetAlert2 está ajustado a la paleta corporativa (`confirmButtonColor: '#2E608C'`).
- El badge de Archivado utiliza tonos grises consistentes con los estados inactivos (`bg-gray-700/80` y texto blanco).

---

## 4. Verificación Realizada
- **Backend:** Se construyó la API mediante `npm run build` confirmando la ausencia de errores TypeScript y dependencias rotas.
- **Frontend:** Se compiló la aplicación de Angular exitosamente a través de `npm run build`, verificando la integridad de las plantillas HTML modificadas y los métodos asociados de los componentes.
