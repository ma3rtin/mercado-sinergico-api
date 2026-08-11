### 📦 PR - Mercado Sinérgico API

#### 🔗 Título Sugerido
`fix(backend): corregir timeout de conexion en prisma y habilitar trust proxy`

#### 📝 Tipo de Cambio
- [ ] ✨ Feat (Nueva funcionalidad)
- [x] 🐛 Fix (Corrección de error)
- [ ] ♻️ Refactor (Refactorización de código existente)
- [ ] 🧹 Chore (Tareas de mantenimiento, dependencias, etc.)
- [ ] 🧪 Test (Pruebas unitarias o de integración)
- [ ] 📝 Docs (Documentación)

#### 📖 Descripción General
Corrige la caída del backend en producción provocada por el agotamiento de conexiones (pool timeout) al instanciar el Driver Adapter de MariaDB de Prisma v7 sin soporte de SSL, y el error de validación de `express-rate-limit` al no confiar en el proxy inverso de producción.

#### 🛠️ Cambios Principales
- **[Modificación]** [src/server/server.ts](file:///c:/Users/mutuv/Documents/Proyectos/mercado-sinergico/api/src/server/server.ts): Se habilitó `trust proxy` en Express (`this.app.set('trust proxy', true)`) para interpretar correctamente las IPs de los clientes enviadas por el proxy inverso en cabeceras `X-Forwarded-For`, evitando errores de validación de `express-rate-limit`.
- **[Modificación]** [src/prisma/client.ts](file:///c:/Users/mutuv/Documents/Proyectos/mercado-sinergico/api/src/prisma/client.ts): Se configuró la instanciación de `PrismaMariaDb` de acuerdo a las especificaciones de Prisma v7, incorporando una lógica de autodetención de SSL. Si la variable `DATABASE_URL` contiene parámetros de SSL (como en Aiven Cloud en producción), inyecta `ssl: { rejectUnauthorized: false }` al driver subyacente de `mariadb`, evitando que las conexiones sean rechazadas y resolviendo el pool timeout.

#### 🧪 Pasos para Verificar (Cómo Probar)
1. Levantar el proyecto de backend localmente con `npm run dev` para validar que se inicie correctamente.
2. Hacer peticiones de login/registro (`POST /api/usuarios/login` y `POST /api/usuarios/registrar`) para verificar que el rate limiter no falle.
3. Ejecutar la suite de pruebas unitarias con `npm run test` y verificar que los 20 archivos de prueba pasen correctamente.
4. Compilar con `npm run build` para comprobar que la sintaxis de TypeScript esté correcta.

#### ⚠️ Notas Adicionales
Ninguna. No se requieren cambios en las variables de entorno ni migraciones adicionales de base de datos.
