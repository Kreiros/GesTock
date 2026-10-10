# GesTock — Sistema Inteligente de Gestión de Inventarios & POS Offline-First

Plataforma integral de gestión comercial, control predictivo de inventarios y punto de venta con arquitectura **Dual-Core Híbrida (Cloud SaaS Multi-Tenant y Offline-First)**, diseñada para el comercio minorista, minimarkets y retail en Chile.

Cumple estrictamente con las normativas del **Servicio de Impuestos Internos (SII)**, la **Ley de Redondeo (Ley N° 20.956)**, la **Ley de Bolsas Reutilizables (Ley N° 21.100)** y la **Resolución Exenta N° 176**.

---

## 1. Características Principales

* **Arquitectura Dual-Core Híbrida**: Operación sincronizada entre base de datos central PostgreSQL 16+ en la nube y persistencia de borde local en SQLite 3.
* **Tolerancia a Fallos y Circuit Breaker (0 ms)**: Continuidad operativa garantizada (<15 ms en mostrador) incluso ante cortes de internet o caídas de red, acumulando transacciones con banderas `is_dirty` y auto-sincronización asíncrona mediante Exponential Backoff con Jitter.
* **Punto de Venta (POS) & Frontend Dual**: 
  * POS Nativo embebido en `backend/public/` optimizado para pantallas táctiles de 80 mm y lectores ópticos.
  * Cliente moderno en `front-end/` desarrollado en **React 19 + TypeScript + Vite + Material UI**.
* **Facturación Electrónica DTE (SII)**: Emisión nativa y timbrado digital (TED) con firma criptográfica RSA-SHA1 para Boletas Electrónicas (39/41), Facturas (33/34), Guías de Despacho (52) y Notas de Crédito (61), con generación diaria de RCOF y propuesta F29.
* **Cumplimiento Legal Chileno**:
  * **Ley N° 20.956**: Redondeo automático a la decena más próxima en pagos en efectivo (no aplica a pagos electrónicos).
  * **Ley N° 21.100**: Venta de bolsas reutilizables estandarizadas a $1.000.
  * **Resolución Exenta N° 176**: Prevención de doble tributación en pagos con tarjeta (modelo voucher).
* **Control de Caja y Balance Z**: Apertura de turno con fondo inicial, registro de egresos/ingresos de efectivo, arqueo ciego y reporte Z en formato térmico.
* **Control de Vencimientos y Mermas**: Registro de lotes y semáforo preventivo de caducidad para rotación FEFO (*First-Expired, First-Out*, D.S. 977/96 MINSAL).
* **Abastecimiento Predictivo (ROP)**: Cálculo de velocidad diaria de venta, punto de reorden con stock de seguridad y ajuste por empaques mínimos de proveedores B2B.
* **Ingesta Inteligente de Facturas (OCR con IA)**: Escaneo de facturas PDF mediante **Google Gemini AI** (`gemini-3.5-flash`), actualización automática de costos y fijación de precios con margen de ganancia configurable y extractor local de respaldo.
* **Seguridad y Control de Acceso (RBAC)**: Autenticación mediante tokens JWT firmados (`HS256`, 24h), almacenamiento de contraseñas con **Bcrypt** (salt 10, hashes de 60 caracteres reales) y matriz de vistas para cajeros (6 vistas) y administradores (11 vistas).

---

## 2. Tecnologías Utilizadas

- **Lenguajes:** TypeScript (strict mode), JavaScript (Node.js v20+ LTS), SQL.
- **Backend Framework:** Express.js 4 (enrutamiento modular, 69 endpoints RESTful).
- **Frontend:** React 19, TypeScript, Vite, Material UI (MUI v6), React Router 8, Zustand, TanStack Query.
- **Bases de Datos:** PostgreSQL 16+ (Cloud SaaS) y SQLite 3 (Edge Local POS, `better-sqlite3`).
- **Seguridad & Red:** Helmet CSP, CORS dinámico, Rate Limit granular por `X-Device-ID` e IPv6, JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`).
- **Inteligencia Artificial:** Google Gemini AI API (`gemini-3.5-flash` con fallback en `pdf-parse`).
- **Infraestructura:** Docker, Docker Compose multi-stage.
- **Testing:** Jest (225 pruebas automatizadas, 100% aprobadas).

---

## 3. Instrucciones de Despliegue y Ejecución Local

### Opción A: Despliegue Automatizado con Docker Compose
```bash
# 1. Clonar el repositorio
git clone https://github.com/Kreiros/GesTock.git
cd GesTock

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar contenedores
docker compose up --build
```
*Disponible en `http://localhost:3000/`.*

---

### Opción B: Ejecución Directa con Node.js (Desarrollo)

#### 1. Backend API & POS Embebido:
```bash
# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env

# Ejecutar migraciones secuenciales (001 a 010)
npm run migrate:sqlite   # Persistencia local SQLite y tabla _migrations
npm run migrate:pg       # Persistencia PostgreSQL Cloud (si está activo)

# Iniciar servidor backend
npm run dev
```

#### 2. Frontend Moderno React (Vite):
```bash
cd front-end
npm install
npm run dev
```
*Cliente React disponible en `http://localhost:5173/`.*

---

### Baterías de Pruebas Automatizadas (225 Pruebas, 100% OK)
```bash
# Pruebas de integración (15 suites, 81 tests)
npm test

# Pruebas unitarias aisladas (8 suites, 144 tests)
npm run test:unit

# Reporte de cobertura de código
npm run test:coverage
```

---

### Parámetros de Acceso y Contexto de Prueba Preconfigurado

| Parámetro | Valor Preconfigurado | Detalle / Uso |
|---|---|---|
| **URL Backend & POS Local** | `http://localhost:3000/` | Interfaz POS de mostrador servida por Node.js |
| **URL Frontend React SPA** | `http://localhost:5173/` | Panel administrativo y POS reactivo moderno |
| **Healthcheck Sonda** | `http://localhost:3000/health` | Estado del Circuit Breaker (`cloud_postgres` y `local_sqlite`) |
| **Catálogo de Servicios API** | `http://localhost:3000/api` | Resumen de módulos y estado de la API |
| **Tenant ID de Prueba** | `00000000-0000-0000-0000-000000000001` | *Almacén Don Tito SpA (Demo sembrada en BD)* |
| **Usuario Administrador** | `admin@gestock.cl` | Rol `admin` (11 vistas habilitadas) |
| **Contraseña Administrador** | `admin123` | Cifrada con Bcrypt work factor 10 (hash de 60 caracteres) |
| **Usuario Cajero de Prueba** | `cajero@gestock.cl` | Rol `cajero` (6 vistas operativas de mostrador) |
| **Contraseña Cajero** | `cajero123` | Cifrada con Bcrypt work factor 10 (hash de 60 caracteres) |
| **Cuentas demo en producción** | No se crean | Definir `JWT_SECRET` (32+ caracteres) e `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`; cambio de clave con `PUT /api/v1/auth/password` |
| **API Key para Clientes Ext.**| `secret-gestock-api-key-2026` | Cabecera `X-API-Key` para integraciones B2B |

---

## 4. Integrantes del Equipo y Roles

| Integrante | Rol en el Proyecto | Responsabilidades Principales |
|---|---|---|
| **Marcelo Alejandro Pino Valverde** | Líder de Proyecto / Arquitectura de Software & Backend Developer | Diseño arquitectónico 4+1, persistencia dual transaccional (PostgreSQL + SQLite), motor DTE/SII, resiliencia Circuit Breaker, algoritmos ROP, IA OCR Gemini, seguridad JWT/Bcrypt y testing. |
| **David Miranda Tobar** | Desarrollador Frontend / Diseñador UX-UI | Diseño de interfaces en Google Stitch, desarrollo de la SPA en React 19 / Vite / Material UI, componentes de venta, gestión de turnos de caja, accesibilidad WCAG y consumo de API REST. |

---

## 5. Metodología de Trabajo
El proyecto se desarrolla bajo la metodología **RUP (Rational Unified Process)**, de naturaleza iterativa y evolutiva, estructurada en tres fases:
1. **Incepción y Elaboración (Fase 1 - 20%):** Definición del alcance, justificación técnica del negocio (*Business Case*), análisis de los 55 RF y 25 RNF (ISO/IEC 25010), artefactos UML y modelado relacional inicial (15 tablas maestras).
2. **Construcción (Fase 2 - 50%):** Backend Node.js/TypeScript con persistencia dual transaccional, evolución del esquema a **29 tablas definitivas** (migraciones 001-011 y tabla permanente `_migrations`), Frontend React 19 con RBAC, IA OCR multimodal (Gemini `gemini-3.5-flash`), normativas chilenas (redondeo Ley N° 20.956, DTEs con timbre TED) y certificación con **214 pruebas automatizadas** (Jest).
3. **Transición (Fase 3 - 30%):** Pruebas de estrés y conmutación offline en terreno, auditoría de seguridad (PCI-DSS SAQ-A, Helmet CSP), empaquetado para producción y preparación de la defensa de título.

---

## 6. Documentación Oficial

Los manuales formales se publican en formato Word en la carpeta [`docs/`](./docs):
1. **[docs/arquitectura_sistema.docx](./docs/arquitectura_sistema.docx)**: Diseño arquitectónico 4+1 de Kruchten, modelos matemáticos, resiliencia y catálogo de 69 endpoints.
2. **[docs/base_de_datos.docx](./docs/base_de_datos.docx)**: Modelo relacional dual (PostgreSQL + SQLite), las 29 tablas y banderas de sincronización.
3. **[docs/guia_de_despliegue.docx](./docs/guia_de_despliegue.docx)**: Instalacion, variables de entorno, Docker Compose y PM2.
4. **[docs/manual_de_funcionalidades.docx](./docs/manual_de_funcionalidades.docx)**: Operación del POS, normativas chilenas, DTE, arqueo Z y reabastecimiento ROP.
5. **[docs/estado_actual_proyecto.docx](./docs/estado_actual_proyecto.docx)**: Informe de avance, Carta Gantt y métricas de estabilidad.
6. **[docs/evidencia_pruebas_unitarias.docx](./docs/evidencia_pruebas_unitarias.docx)**: Certificado formal de auditoría y matriz de las 214 pruebas automatizadas.

---

## Licencia
Propiedad de GesTock Team. Proyecto Aplicado de Título (APT — PTY4614), Duoc UC. Todos los derechos reservados.
