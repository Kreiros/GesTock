# GesTock — Sistema Inteligente de Gestión de Inventarios & POS Offline-First

## 1. Descripción del Proyecto
GesTock es una solución integral de gestión comercial, control predictivo de inventarios y punto de venta (POS) diseñada bajo una arquitectura híbrida **Dual-Core (Cloud SaaS Multi-Tenant y Offline-First)**.

Está dirigida al comercio minorista independiente chileno (minimarkets, botillerías, rotiserías y almacenes de barrio), resolviendo tres problemáticas críticas del sector:
1. **Interrupción operativa por conectividad**: Erradica la pérdida de ventas cuando se corta el internet o falla el suministro eléctrico, permitiendo cobros ininterrumpidos en caja mediante persistencia de borde local en SQLite 3 y sincronización asíncrona posterior hacia la nube.
2. **Carga administrativa y fijación de precios**: Elimina el ingreso manual de mercadería mediante escaneo inteligente de facturas de compra con Inteligencia Artificial (**Google Gemini OCR**), extrayendo ítems, costos, lotes y fechas de vencimiento al instante para recalcular márgenes comerciales.
3. **Complejidad tributaria y normativa chilena**: Automatiza el cumplimiento legal ante el SII (emisión de Boletas Electrónicas 39/41, Facturas 33/34, Guías 52 y Notas de Crédito 61 con Timbre Electrónico DTE `<TED>`), la aplicación estricta de la Ley de Redondeo en efectivo (**Ley N° 20.956**), el cobro normativo de bolsas reutilizables (**Ley N° 21.100**) y el semáforo preventivo de vencimientos sanitarios (**D.S. 977/96 MINSAL**).

---

## 2. Tecnologías Utilizadas
- **Lenguajes:** TypeScript (compilación bajo `strict: true`), JavaScript (Node.js v20+ LTS), SQL relacional estándar.
- **Backend & API:** Express.js 4 (enrutamiento modular, 69 endpoints RESTful), Helmet (política restrictiva CSP), CORS dinámico, Express Rate Limit granular por terminal (`X-Device-ID`).
- **Autenticación & Criptografía:** JWT (`jsonwebtoken`, tokens firmados `HS256` con expiración en 24h), Bcrypt (`bcryptjs`, work factor 10, hashes de 60 caracteres reales), Web Crypto / Node Crypto (firmas RSA-SHA1 para DTE y timbre TED).
- **Frontend Dual:**
  - **SPA POS Nativa (Mostrador Rápido):** Servida directamente en `backend/public/` (HTML5 / CSS3 / Vanilla JS reactivo), optimizada para pantallas táctiles y lectores ópticos.
  - **SPA Moderna (Panel de Administración & POS React):** Construida en `front-end/` con **React 19**, TypeScript, Vite, Material UI (MUI v6), React Router 8, TanStack Query y Zustand.
- **Bases de Datos & Persistencia Dual:**
  - **PostgreSQL 16+ (Nube Central SaaS):** Persistencia multi-tenant particionada por `tenant_id`, soporte ACID completo, consolidación fiscal y analítica.
  - **SQLite 3 (Borde Local Offline-First):** Persistencia embebida en terminal con `PRAGMA foreign_keys = ON`, banderas `is_dirty` y latencia en checkout < 15 ms.
  - **Control de Esquema:** 29 tablas relacionales gestionadas mediante 10 migraciones DDL secuenciales y tabla persistente `_migrations`.
- **Inteligencia Artificial & Servicios Externos:** Google Gemini AI API (`gemini-3.5-flash` con fallback determinista en `pdf-parse`), pasarelas de pago sandbox (Transbank Webpay, Mercado Pago, SumUp, RutPay).
- **Infraestructura & Contenedores:** Docker, Docker Compose multi-stage build.
- **Testing & Calidad:** Jest (15 suites de integración + 7 suites unitarias = **207 pruebas automatizadas** con 100% de aprobación).

---

## 3. Instrucciones de Despliegue y Ejecución Local

### Opción A: Despliegue Automatizado con Docker Compose (Recomendado)
Levanta de forma automática el contenedor de base de datos **PostgreSQL 16** y el servidor **GesTock API**, ejecutando migraciones y siembra de datos iniciales:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Kreiros/GesTock.git
cd GesTock

# 2. Configurar variables de entorno desde la plantilla
cp .env.example .env

# 3. Construir y levantar contenedores
docker compose up --build
```
*El sistema estará disponible en `http://localhost:3000/`.*

---

### Opción B: Ejecución Directa con Node.js (Desarrollo)

#### 1. Backend API & POS Embebido:
```bash
# Instalar dependencias del backend
npm install

# Configurar archivo de variables de entorno
cp .env.example .env

# Ejecutar migraciones secuenciales (001 a 010)
npm run migrate:sqlite   # Inicializa persistencia de borde SQLite local y tabla _migrations
npm run migrate:pg       # Inicializa base de datos PostgreSQL Cloud (si está activa)

# Iniciar servidor backend en modo desarrollo (Hot-Reload)
npm run dev
```

#### 2. Frontend Moderno (React 19 + Vite):
En una segunda terminal, ejecute el cliente web React:
```bash
# Entrar al directorio del cliente frontend
cd front-end

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo Vite
npm run dev
```
*La interfaz moderna React estará disponible en `http://localhost:5173/`.*

---

### Batería de Pruebas Automatizadas (207 Pruebas, 100% OK)
```bash
# Ejecutar suite de pruebas de integración (15 suites, 68 tests)
npm test

# Ejecutar suite de pruebas unitarias aisladas (7 suites, 126 tests)
npm run test:unit

# Generar reporte de cobertura de código
npm run test:coverage
```

---

### Parámetros de Acceso y Contexto de Prueba Preconfigurado

| Parámetro | Valor Preconfigurado | Detalle / Uso |
|---|---|---|
| **URL Backend & POS Local** | `http://localhost:3000/` | Interfaz POS de mostrador servida directamente por Node.js |
| **URL Frontend React SPA** | `http://localhost:5173/` | Panel administrativo y POS reactivo moderno |
| **Healthcheck Sonda** | `http://localhost:3000/health` | Estado del Circuit Breaker (`cloud_postgres` y `local_sqlite`) |
| **Catálogo de Servicios API** | `http://localhost:3000/api` | Resumen de módulos y estado de la API |
| **Tenant ID de Prueba** | `00000000-0000-0000-0000-000000000001` | *Almacén Don Tito (Microempresa Demo sembrada en BD)* |
| **Usuario Administrador** | `admin@gestock.cl` | Rol `admin` (11 vistas habilitadas) |
| **Contraseña Administrador** | `admin123` | Cifrada con Bcrypt work factor 10 (hash de 60 caracteres) |
| **Cuentas demo en producción** | No se crean | Definir `JWT_SECRET` (32+ caracteres) e `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`; cambio de clave con `PUT /api/v1/auth/password` |
| **Usuario Cajero de Prueba** | `cajero@gestock.cl` | Rol `cajero` (6 vistas operativas de mostrador) |
| **API Key para Clientes Ext.**| `secret-gestock-api-key-2026` | Cabecera `X-API-Key` para integraciones B2B |

---

## 4. Integrantes del Equipo y Roles

| Integrante | Rol en el Proyecto | Responsabilidades Principales |
|---|---|---|
| **Marcelo Alejandro Pino Valverde** | Líder de Proyecto / Arquitectura de Software & Backend Developer | Diseño arquitectónico 4+1, persistencia dual transaccional (PostgreSQL + SQLite), motor DTE/SII, resiliencia Circuit Breaker, algoritmos ROP, IA OCR Gemini, seguridad JWT/Bcrypt y testing. |
| **David Miranda Tobar** | Desarrollador Frontend / Diseñador UX-UI | Diseño de interfaces en Google Stitch, desarrollo de la SPA en React 19 / Vite / Material UI, componentes de venta, gestión de turnos de caja, accesibilidad WCAG y consumo de API REST. |

---

## 5. Metodología de Trabajo
El proyecto se desarrolla bajo la metodología **RUP (Rational Unified Process)**, de naturaleza iterativa y evolutiva, enfocada en la mitigación continua de riesgos técnicos, la solidez arquitectónica y el modelado sistemático de casos de uso. El ciclo de vida se estructura en tres fases alineadas con las pautas académicas del Proyecto Aplicado de Título (APT — PTY4614, Duoc UC):

1. **Incepción y Elaboración (Fase 1 - 20%):**
   - Definición del alcance operativo y justificación técnica del negocio (*Business Case*).
   - Análisis y especificación de los 55 Requisitos Funcionales y 25 Requisitos No Funcionales bajo la norma **ISO/IEC 25010**.
   - Diseño de la arquitectura base y modelado UML (Casos de Uso, Clases, Secuencia, Comunicación, Componentes y Despliegue).
   - Modelado conceptual de datos relacionales inicial (15 tablas maestras en PostgreSQL y SQLite).

2. **Construcción (Fase 2 - 50%):**
   - Implementación del backend API modular en Node.js/TypeScript con persistencia dual transaccional (`withTransaction`).
   - Evolución y ampliación del esquema relacional a **29 tablas definitivas** mediante migraciones DDL numeradas (`001_initial_schema.sql` a `010_expand_historial_stock_check.sql`) y tabla permanente de control `_migrations`.
   - Desarrollo del cliente Frontend POS en React 19 SPA con soporte de roles RBAC (Cajero vs Admin).
   - Integración del motor de Inteligencia Artificial Multimodal (Google Gemini OCR `gemini-3.5-flash`) con reintentos controlados y extractor PDF nativo de respaldo.
   - Implementación de las normativas legales chilenas: Ley de Redondeo (Ley N° 20.956), Ley de Bolsas Reutilizables (Ley N° 21.100) y facturación DTE autorizada por el SII con timbre TED.
   - Aseguramiento de calidad mediante **207 pruebas automatizadas** (Jest) que validan el 100% de los 69 endpoints RESTful.

3. **Transición (Fase 3 - 30%):**
   - Pruebas de estrés y conmutación offline bajo condiciones de corte de red en terreno.
   - Auditoría de seguridad perimetral (PCI-DSS SAQ-A, Helmet CSP, prevención de inyecciones SQL).
   - Empaquetado definitivo para producción (*Release Notes* y Docker Compose).
   - Preparación de la defensa técnica, demostración interactiva y material audiovisual ante la comisión evaluadora.

El seguimiento de actividades, control de versiones y trazabilidad de los artefactos de ingeniería se gestiona de manera centralizada a través del repositorio **GitHub** (`Kreiros/GesTock`).

---

## 6. Arquitectura de la Solución
La plataforma adopta el patrón arquitectónico **Dual-Core Híbrido Desacoplado**:

1. **Capa Cloud SaaS (PostgreSQL 16):** Gestión centralizada multi-tenant, conciliación de catálogos maestros, analítica de compras, reportes ejecutivos y respaldo fiscal formal ante el SII.
2. **Capa Borde / POS Local (SQLite 3):** Persistencia espejo en terminales de mostrador con banderas transaccionales (`is_dirty`), garantizando latencias menores a 15 ms en checkout y funcionamiento 100% autónomo sin internet.
3. **Mecanismo de Resiliencia (Circuit Breaker 0 ms):** Supervisa la conexión hacia PostgreSQL Cloud operando en tres estados (*CLOSED*, *OPEN*, *HALF-OPEN*). Ante caída de enlace o latencia > 3000 ms, conmuta en **0 milisegundos** a SQLite local, asegurando que la interfaz del cajero jamás se congele.
4. **Motor de Sincronización Asíncrona (Exponential Backoff + Full Jitter):** Al restablecerse la conectividad, el servicio `pos-sync-engine` transmite lotes de transacciones sucias aplicando la fórmula:
   $$T_{\text{espera}} = \min(60000, 1000 \times 2^{\text{intentos}}) + \text{random}(0, 500)$$
   evitando tormentas de peticiones (*Thundering Herd*) sobre el servidor central.
5. **Seguridad y Control de Acceso:** Autenticación JWT (`HS256`, 24h), contraseñas Bcrypt salt 10, sanitización estricta de parámetros SQL (`$1` en PG, `?` en SQLite) y Rate Limiting granular por `X-Device-ID` e IPv6.

> Los diagramas completos (MER, Casos de Uso, Secuencia, Clases, Despliegue), especificaciones formales y manuales se encuentran disponibles en la carpeta [`docs/`](../):
> - [Documento de Arquitectura de Software (DAS v2.2)](../ARQUITECTURA_SISTEMA.md)
> - [Diagrama Entidad-Relación SVG](../diagrama_base_de_datos.svg)
> - [Modelo de Base de Datos](../BASE_DE_DATOS.md)
> - [Estado Actual y Carta Gantt](../ESTADO_ACTUAL_PROYECTO.md)
> - [Artefacto Formal Word (.docx)](../arquitectura_sistema.docx)

---

### Sección de Innovación y Diferenciación Competitiva
- **¿Qué problema resuelve?** Erradica las pérdidas económicas y detenciones de atención en los comercios de barrio provocadas por inestabilidades de red o cortes de internet, eliminando al mismo tiempo la digitación manual de facturas de proveedores y los descuadres en el arqueo de caja.
- **¿Qué hace diferente a la solución?** A diferencia de los POS web tradicionales que dependen de un servidor remoto y se bloquean al perder la conexión, GesTock conmuta automáticamente a su motor local SQLite en 0 ms. Además, incorpora inteligencia artificial multimodal (Gemini OCR) para digitalizar facturas de compra y un modelo nativo adaptado a la legislación chilena (redondeo Ley N° 20.956, bolsas reutilizables y DTEs con timbre TED).
- **¿Qué valor agrega?** Asegura un 100% de disponibilidad de venta en caja, ahorra hasta un 80% del tiempo administrativo en ingreso de mercadería, reduce el riesgo de multas del SII por omisión de boletas y minimiza las pérdidas por mermas gracias a su semáforo preventivo de vencimientos sanitarios (FEFO).
