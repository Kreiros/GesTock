# 🚀 GesTock — Guía Técnica de Despliegue y Puesta en Marcha

Esta guía detalla los pasos exactos para compilar, configurar y desplegar la plataforma **GesTock (Backend API + Frontend POS React + Persistencia Dual)** en entornos de desarrollo local, contenedores Docker y servidores de producción.

---

## 1. Requisitos Previos del Sistema

| Componente | Versión Mínima | Obligatorio | Notas |
|---|---|---|---|
| **Node.js** | v20.x LTS o superior (v22/v24 soportadas) | Sí | Motor de ejecución JavaScript/TypeScript |
| **npm** | v10.x o superior | Sí | Gestor de paquetes |
| **Docker & Docker Compose** | v24+ / Compose v2+ | Opcional | Recomendado para despliegue unificado de un solo comando |
| **PostgreSQL** | v16+ (Docker o local) | Opcional | Nodo central Cloud SaaS; en su ausencia el POS opera en SQLite |
| **SQLite 3** | Embebido en Node.js | Sí | Persistencia de borde local Offline-First (`better-sqlite3`) |
| **Puertos de Red** | `3000` (Backend API), `5173` (Frontend Vite) | Sí | Deben estar disponibles y libres de conflicto |

---

## 2. Variables de Entorno (`.env`)

Copie la plantilla de configuración en la raíz del proyecto:
```bash
cp .env.example .env
```

### Tabla de Parámetros de Configuración:
```env
# ==============================================================================
# Servidor Backend
# ==============================================================================
NODE_ENV=development          # 'development' o 'production'
PORT=3000                     # Puerto HTTP del servidor Express

# ==============================================================================
# Base de Datos PostgreSQL Cloud (SaaS Central)
# ==============================================================================
DATABASE_URL=postgresql://gestock_admin:gestock_secret_2026@localhost:5432/gestock_cloud_db
PGHOST=localhost
PGPORT=5432
PGUSER=gestock_admin
PGPASSWORD=gestock_secret_2026
PGDATABASE=gestock_cloud_db
PGSSL=false

# ==============================================================================
# Base de Datos SQLite Edge (POS Local Offline-First)
# ==============================================================================
SQLITE_DB_PATH=./data/gestock_local_pos.sqlite
SQLITE_IN_MEMORY=false

# ==============================================================================
# Seguridad, Criptografía y Control de Acceso
# ==============================================================================
JWT_SECRET=super_secret_jwt_key_gestock_2026_change_in_production   # Solo desarrollo: en producción es obligatorio un valor propio de 32+ caracteres o el servidor no arranca
JWT_EXPIRATION=86400          # 24 horas en segundos
INITIAL_ADMIN_EMAIL=          # Producción: administrador inicial si el comercio no tiene uno
INITIAL_ADMIN_PASSWORD=       # Producción: mínimo 8 caracteres; cámbiela luego con PUT /api/v1/auth/password
SEED_DEMO_USERS=false         # true solo para crear las cuentas demo en un entorno de producción de pruebas
API_KEY=secret-gestock-api-key-2026
ENFORCE_AUTH=true             # Exigir Bearer Token en cada petición protegida (activo por defecto en prod)
AUTH_DISABLED=false           # Interruptor de emergencia solo para pruebas (debe ser false en producción)

# ==============================================================================
# Inteligencia Artificial (Extracción Multimodal OCR de Facturas)
# ==============================================================================
GEMINI_API_KEY=               # Clave de Google AI Studio (aistudio.google.com)
GEMINI_MODEL=gemini-3.5-flash # Opcional: modelo por defecto (gemini-3.5-flash)
ENABLE_MOCK_OCR=false         # Si es false, no alucina compras ante fallos; arroja HTTP 422 honesto

# ==============================================================================
# Seguridad Perimetral y CORS
# ==============================================================================
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
```

---

## 3. Modo 1: Despliegue con Docker Compose (Recomendado)

Docker Compose orquesta de forma automática el contenedor de base de datos **PostgreSQL 16** con volumen persistente y el servicio backend **GesTock**, ejecutando la compilación TypeScript y la inicialización de migraciones:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Kreiros/GesTock.git
cd GesTock

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Construir y levantar contenedores en segundo plano
docker compose up --build -d

# 4. Verificar estado de los servicios
docker compose ps

# 5. Visualizar logs en tiempo real
docker compose logs -f app
```

*Para detener los contenedores:*
```bash
docker compose down
```

---

## 4. Modo 2: Despliegue en Desarrollo Local (Sin Docker)

### Paso 1: Inicialización del Backend API & POS Embebido
```bash
# 1. Instalar dependencias en la raíz del proyecto
npm install

# 2. Aplicar migraciones secuenciales de base de datos (001 a 010)
npm run migrate:sqlite   # Crea las 29 tablas y _migrations en ./data/gestock_local_pos.sqlite
npm run migrate:pg       # Crea las 29 tablas en PostgreSQL (si el servidor está activo)

# 3. Iniciar el servidor backend en modo desarrollo
npm run dev
```

### Paso 2: Inicialización del Frontend React 19 (Cliente Moderno)
En una terminal separada:
```bash
# Entrar al subdirectorio del cliente
cd front-end

# Instalar dependencias del frontend
npm install

# Iniciar servidor de desarrollo Vite
npm run dev
```
*Disponible en `http://localhost:5173/`.*

---

## 5. Modo 3: Compilación y Despliegue para Producción

```bash
# 1. Compilar el código TypeScript del backend
npm run build

# 2. Compilar los assets del frontend React (SPA estática)
cd front-end && npm run build && cd ..

# 3. Iniciar el servidor compilado en producción
NODE_ENV=production npm start
```

*Para gestión de procesos en servidores Linux con PM2:*
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la aplicación GesTock gestionada por PM2
pm2 start dist/backend/src/index.js --name "gestock-api" -i max
pm2 save
pm2 startup
```

---

## 6. Verificación de Salud y Pruebas Automatizadas

### Verificación mediante Endpoints de Diagnóstico:
```bash
# 1. Sonda de salud y Circuit Breaker
curl http://localhost:3000/health

# Respuesta esperada:
# {"status":"UP","services":{"cloud_postgres":"HEALTHY","local_sqlite":"HEALTHY"}}

# 2. Catálogo modular de la API
curl http://localhost:3000/api
```

### Ejecución de Baterías de Pruebas (158 Tests, 100% Passing):
```bash
# Batería de Pruebas de Integración (15 suites, 68 tests)
npm test

# Batería de Pruebas Unitarias Aisladas (6 suites, 90 tests)
npm run test:unit

# Reporte de cobertura de código
npm run test:coverage
```

---

## 7. Contexto de Prueba y Credenciales Sembradas

El sistema inicializa automáticamente un entorno de prueba (*seed*) para validar inmediatamente los flujos de punto de venta, arqueo de caja y login. Las cuentas demo se crean solo fuera de producción (o con `SEED_DEMO_USERS=true`) y solo si no existen; el arranque nunca restablece contraseñas. En producción (incluido `docker-compose.yml`) se debe definir `JWT_SECRET` y, en la primera instalación, `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`:

- **Tenant ID Sembrado:** `00000000-0000-0000-0000-000000000001` (*Almacén Don Tito SpA*)
- **Usuario Administrador:** `admin@gestock.cl`
- **Contraseña Administrador:** `admin123` (Cifrada con Bcrypt work factor 10, hash de 60 caracteres)
- **Rol:** `admin` (acceso a las 11 vistas completas)
- **Catálogo de Prueba Sembrado:** 6 productos de alta rotación (Coca-Cola 350ml, Monster Energy, Harina Selecta, Aceite Belmont, Leche Colun, Papas Lays).
- **Medios de Pago Activos:** Efectivo, Transbank Webpay/POS, Mercado Pago QR, SumUp Air y RutPay.

---

## 8. Solución de Problemas Frecuentes (Troubleshooting)

1. **Error: `EADDRINUSE: address already in use :::3000`:**
   - *Causa:* Otro proceso tiene tomado el puerto 3000.
   - *Solución Windows PowerShell:* `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force`
   - *Solución Linux/macOS:* `lsof -ti:3000 | xargs kill -9`

2. **Advertencia: `[InitDB]: PostgreSQL cloud is unreachable. Operating in standalone Offline-First POS mode`:**
   - *Causa normal:* El servidor PostgreSQL local no está iniciado o está apagado.
   - *Comportamiento:* GesTock activa su patrón de resiliencia **Circuit Breaker** y opera al 100% sobre SQLite local en modo Offline-First. No impide el funcionamiento del POS.

3. **CORS bloqueado en llamadas desde Vite (`http://localhost:5173`):**
   - *Solución:* Asegurarse de que `http://localhost:5173` esté incluido en la variable `CORS_ALLOWED_ORIGINS` del archivo `.env`.
