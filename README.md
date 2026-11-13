# GesTock — Sistema Inteligente de Gestión de Inventarios & POS Offline-First

Plataforma de gestión comercial, control de inventario y punto de venta para el comercio de barrio en Chile, con arquitectura **dual (nube PostgreSQL y caja local SQLite)**: cada caja vende sin internet y sincroniza con la nube cuando hay conexión. Se entrega como aplicación de escritorio para Windows.

Cumple con las normativas del **Servicio de Impuestos Internos (SII)**, la **Ley de Redondeo (Ley N° 20.956)**, la **Ley de Bolsas Reutilizables (Ley N° 21.100)** y la **Resolución Exenta N° 176**.

---

## 1. Características Principales

* **Arquitectura dual nube y caja**: PostgreSQL 16 en la nube como base central multi-comercio y SQLite en cada caja. La venta se registra primero en el equipo, sin esperar a la nube.
* **Funcionamiento sin internet y sincronización**: las operaciones quedan marcadas con `is_dirty` y suben al sincronizar, con reintentos escalonados (*Exponential Backoff* con *Jitter*) y un *Circuit Breaker* que evita esperar a una nube caída. Productos y proveedores se reconocen por su clave natural (SKU y RUT) entre la caja y la nube.
* **Aplicación de escritorio**: Electron con instalador NSIS. Los datos del local viven en una carpeta aparte, de modo que reinstalar o actualizar no los borra.
* **Interfaz React** en `front-end/` con **React 19 + TypeScript + Vite + Material UI**, en modo visual (tarjetas, para el mostrador) y modo técnico (tablas y atajos de teclado). `backend/public/` conserva un POS de respaldo que el servidor entrega solo si la interfaz React no está construida.
* **Facturación electrónica DTE (SII)**: emisión y timbrado (TED) con firma RSA-SHA1 de Boletas (39/41), Facturas (33/34), Guías de Despacho (52) y Notas de Crédito (61), con RCOF diario, pre-cálculo del F29 y armado del sobre de envío (ambiente de certificación).
* **Cumplimiento legal chileno**:
  * **Ley N° 20.956**: redondeo a la decena más próxima en pagos en efectivo; no aplica a pagos electrónicos.
  * **Ley N° 21.100**: venta de bolsas reutilizables estandarizadas a $1.000.
  * **Resolución Exenta N° 176**: con tarjeta se entrega el comprobante de la pasarela en vez de boleta, para no duplicar el IVA débito.
* **Control de caja y balance Z**: apertura con fondo inicial, egresos e ingresos de efectivo, arqueo ciego por denominación y reporte Z.
* **Vencimientos y mermas**: lotes con fecha de vencimiento, semáforo preventivo y consumo FEFO (*First-Expired, First-Out*, D.S. 977/96 MINSAL).
* **Reabastecimiento predictivo (ROP)**: velocidad diaria de venta, punto de reorden con stock de seguridad, órdenes de compra y envío por correo al proveedor.
* **Ingreso de facturas con IA**: lectura de facturas en PDF o imagen con **Google Gemini** (cadena de modelos con respaldo ante saturación) y un extractor local para PDF sin internet. Actualiza costos y propone precios con el margen configurado.
* **Alta de productos por código de barras**: consulta a **Open Food Facts** para completar nombre, marca, contenido y foto, y foto propia del producto tomada con la cámara.
* **Seguridad y roles**: sesiones JWT (`HS256`, 24 h) cuyo rol y estado se validan contra la base en cada petición, contraseñas con **Bcrypt** (costo 10), aislamiento por comercio en cada consulta, y vistas por rol: 6 para el cajero y 12 para el administrador.

---

## 2. Tecnologías Utilizadas

- **Lenguajes:** TypeScript (modo estricto), JavaScript (Node.js 22.13 o superior, 24 recomendado: el módulo `node:sqlite` funciona sin opciones desde esa versión), SQL.
- **Backend:** Express 4, con 76 endpoints REST.
- **Frontend:** React 19, TypeScript, Vite 8, Material UI 9, React Router 8, Zustand y TanStack Query.
- **Bases de datos:** PostgreSQL 16 (nube) y SQLite (caja local, mediante el módulo nativo `node:sqlite` de Node).
- **Escritorio:** Electron 44 y electron-builder con instalador NSIS.
- **Seguridad y red:** Helmet con CSP, CORS, límite de peticiones por dispositivo (`X-Device-ID`), JWT (`jsonwebtoken`) y Bcrypt (`bcryptjs`).
- **Servicios externos:** Google Gemini (lectura de facturas), Open Food Facts (fichas de productos) y un servidor SMTP para el correo.
- **Infraestructura:** Docker y Docker Compose.
- **Pruebas:** 335 pruebas unitarias en 26 suites y 101 pruebas de integración en 16 suites (medidas el 12-11-2026, sobre `pg-mem` y sobre PostgreSQL real), 172 pruebas de interfaz en 22 archivos, 118 comprobaciones de extremo a extremo y 7 escenarios de rendimiento con percentiles, todas aprobadas.

---

## 3. Instrucciones de Despliegue y Ejecución Local

### Opción A: Docker Compose
```bash
# 1. Clonar el repositorio
git clone https://github.com/Kreiros/GesTock.git
cd GesTock

# 2. Configurar variables de entorno (definir JWT_SECRET de 32 caracteres o más)
cp .env.example .env

# 3. Levantar los contenedores
docker compose up --build
```
*Disponible en `http://localhost:3000/`.*

---

### Opción B: Ejecución directa con Node.js (desarrollo)

#### 1. Backend
```bash
npm install
cp .env.example .env

# Migraciones secuenciales 001 a 021 (el servidor también las aplica al arrancar)
npm run migrate:sqlite   # caja local SQLite
npm run migrate:pg       # nube PostgreSQL, si está levantada

npm run dev
```

#### 2. Frontend React (Vite)
```bash
cd front-end
npm install
npm run dev
```
*Disponible en `http://localhost:5173/`.*

#### 3. Catálogo de demostración (opcional)
```bash
npm run datos:demo   # carga semillas/catalogo-demo.json; es aditivo y no pisa lo existente
```

---

### Opción C: Aplicación de escritorio para Windows
```bash
npm run build:desktop    # compila el backend y la interfaz
npm run dist:win         # construye el instalador en release/
npm run app:actualizar   # construye el instalador y lo aplica sobre la instalación existente
npm run app:reparar      # solo aplica el último instalador construido
```
Reinstalar sobre la instalación existente conserva la carpeta de datos del usuario.

---

### Baterías de pruebas
```bash
npm run test:unit            # 335 pruebas unitarias del servidor y de contrato (26 suites)
npm test                     # 101 pruebas de integración (16 suites) sobre pg-mem
npm --prefix front-end run test   # 172 pruebas de interfaz (Vitest)
npm run test:e2e:frontend    # 118 comprobaciones de extremo a extremo, con el servidor levantado
npm run test:rendimiento     # 7 escenarios con percentiles, con el servidor levantado
npm run test:coverage:total  # cobertura del servidor
```

Para correr la integración contra el PostgreSQL real, con el contenedor levantado:
```bash
USE_REAL_PG=true npm test
```
Las pruebas usan una base propia, `gestock_test_db` (configurable con `PGDATABASE_TEST`), que se crea sola si no existe: nunca escriben en la base de la nube.

---

### Parámetros de acceso del entorno de desarrollo

| Parámetro | Valor | Detalle |
|---|---|---|
| **Servidor y POS** | `http://localhost:3000/` | Sirve la interfaz React construida |
| **Interfaz en desarrollo** | `http://localhost:5173/` | Servidor de Vite |
| **Sonda de salud** | `http://localhost:3000/health` | Estado de `cloud_postgres` y `local_sqlite` |
| **Catálogo de la API** | `http://localhost:3000/api` | Módulos y estado de la API |
| **Comercio de demostración** | `00000000-0000-0000-0000-000000000001` | Almacén Don Tito SpA |
| **Administrador de prueba** | `admin@gestock.cl` / `admin123` | Solo fuera de producción |
| **Cajero de prueba** | `cajero@gestock.cl` / `cajero123` | Solo fuera de producción |
| **Producción** | Sin cuentas de prueba | Definir `JWT_SECRET` (32 caracteres o más), `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`; la aplicación de escritorio crea el administrador en el primer inicio |
| **Clave para integraciones** | Variable `API_KEY` (opcional) | Si se define, toda petición con cabecera `X-API-Key` debe traer ese valor |

---

## 4. Integrantes del Equipo y Roles

| Integrante | Rol en el Proyecto | Responsabilidades Principales |
|---|---|---|
| **Marcelo Alejandro Pino Valverde** | Líder de Proyecto / Arquitectura de Software & Backend Developer | Arquitectura 4+1, persistencia dual (PostgreSQL + SQLite) y sincronización, motor DTE/SII, Circuit Breaker, algoritmos ROP, ingreso de facturas con Gemini, seguridad JWT/Bcrypt, empaquetado de escritorio y pruebas del servidor. |
| **David Miranda Tobar** | Desarrollador Frontend / Diseñador UX-UI | Diseño de interfaces, SPA en React 19 / Vite / Material UI, modos visual y técnico, caja y turnos, fotos y Open Food Facts en el alta, accesibilidad, pruebas de interfaz y de extremo a extremo. |

---

## 5. Metodología de Trabajo
El proyecto se desarrolla bajo la metodología **RUP (Rational Unified Process)**, iterativa e incremental, organizada en tres fases académicas:
1. **Incepción y Elaboración (Fase 1 - 20%):** alcance, caso de negocio, análisis de los 62 RF y 31 RNF (ISO/IEC 25010), artefactos UML y modelo relacional inicial (15 tablas).
2. **Construcción (Fase 2 - 50%):** backend Node.js/TypeScript con persistencia dual, esquema de **29 tablas** (migraciones 001-021 más la tabla de control `_migrations`), frontend React 19 con roles, ingreso de facturas con IA, normativas chilenas (redondeo, DTE con timbre TED) y **436 pruebas automatizadas** del servidor (Jest) más 172 de interfaz (Vitest).
3. **Transición (Fase 3 - 30%):** ejecución del plan de pruebas, pruebas de rendimiento, operación sin conexión en terreno, auditoría de seguridad (PCI-DSS SAQ-A, Helmet CSP), empaquetado para producción y preparación de la defensa.

---

## 6. Documentación Oficial

Los documentos formales se publican en Word en la carpeta [`docs/`](./docs):
1. **[docs/arquitectura_sistema.docx](./docs/arquitectura_sistema.docx)**: arquitectura 4+1 de Kruchten, requisitos, resiliencia y catálogo de los 76 endpoints.
2. **[docs/base_de_datos.docx](./docs/base_de_datos.docx)**: modelo relacional dual (PostgreSQL + SQLite), las 29 tablas y las banderas de sincronización.
3. **[docs/guia_de_despliegue.docx](./docs/guia_de_despliegue.docx)**: instalación, variables de entorno, Docker Compose y aplicación de escritorio.
4. **[docs/manual_de_funcionalidades.docx](./docs/manual_de_funcionalidades.docx)**: manual de uso por pantalla y por rol, lo que el sistema hace solo y los límites declarados.
5. **[docs/estado_actual_proyecto.docx](./docs/estado_actual_proyecto.docx)**: informe de avance, carta Gantt y métricas.
6. **[docs/evidencia_pruebas_unitarias.docx](./docs/evidencia_pruebas_unitarias.docx)**: evidencia de las pruebas automatizadas del servidor.
7. **[docs/metodologia.docx](./docs/metodologia.docx)**: metodología RUP declarada y justificada, fases, iteraciones y correspondencia de artefactos.
8. **[docs/product_vision.docx](./docs/product_vision.docx)**: visión del producto: problema, usuarios, beneficio, diferenciación y alcance.
9. **[docs/requisitos_no_funcionales.docx](./docs/requisitos_no_funcionales.docx)**: los 31 requisitos no funcionales bajo ISO/IEC 25010, con método de verificación y estado medido.
10. **[docs/plan_de_pruebas.docx](./docs/plan_de_pruebas.docx)**: tipos de prueba, casos por épica, criterios, resultados de rendimiento y ensayo de aceptación con usuarios.
11. **[docs/definition_of_done.docx](./docs/definition_of_done.docx)**: criterios de aceptación del incremento.
12. **[docs/innovacion.docx](./docs/innovacion.docx)**: aportes de innovación implementados y verificados.

Los informes de trabajo entre los integrantes están en [`docs/informes/`](./docs/informes).

---

## Licencia
Propiedad de GesTock Team. Proyecto Aplicado de Título (APT — PTY4614), Duoc UC. Todos los derechos reservados.
