# 🛒 Mercado Sinérgico - API

API del proyecto **Mercado Sinérgico**, una plataforma que conecta a usuarios interesados en comprar productos directamente a fabricantes, permitiendo realizar compras colectivas al por mayor para obtener mejores precios.  
El backend gestiona usuarios, productos, pedidos, pagos y coordinación de envíos.

---

## 🚀 Stack Tecnológico

![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.x-darkgreen?logo=prisma&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-13.x-red?logo=firebase&logoColor=white)

---

## ⚙️ Instalación y configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/ma3rtin/mercado-sinergico-api.git
cd mercado-sinergico-api
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` copiando las claves del `.env.example` con sus valores reales (DB, Firebase, etc).  
Ejemplo básico:

```env
PORT=3000
DATABASE_URL="mysql://user:password@host:port/db"
FIREBASE_PROJECT_ID="..."
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."
```

### 4. Ejecutar migraciones de Prisma
```bash
npx prisma migrate dev
```

### 5. Iniciar el servidor
```bash
npm run dev
```

La API estará disponible en `http://localhost:3000`.

---

## 🧠 Descripción general

- API REST construida en **Node.js** con **TypeScript**.  
- ORM gestionado con **Prisma**.  
- Autenticación mediante **Firebase**.  
- Arquitectura modular para fácil mantenimiento y escalabilidad.
