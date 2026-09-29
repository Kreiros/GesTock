# GesTock - Sistema Inteligente de Gestion de Inventarios & POS Offline-First

Plataforma integral de gestion comercial, control predictivo de inventarios y punto de venta con arquitectura **Dual-Core Hibrida (Cloud SaaS Multi-Tenant y Offline-First)**, disenada para el comercio minorista, minimarkets y retail en Chile.

Cumple estrictamente con las normativas del **Servicio de Impuestos Internos (SII)**, la **Ley de Redondeo (Ley N° 20.956)**, la **Ley de Bolsas Reutilizables (Ley N° 21.100)** y la **Resolucion Exenta N° 176**.

---

## Caracteristicas Principales

* **Arquitectura Dual-Core Hibrida**: Operacion sincronizada entre base de datos central PostgreSQL 16+ en la nube y persistencia de borde local en SQLite 3.
* **Tolerancia a Fallos y Circuit Breaker**: Continuidad operativa garantizada (<15 ms en mostrador) incluso ante cortes de internet o caidas de red, acumulando transacciones con banderas is_dirty y auto-sincronizacion.
* **Punto de Venta (POS) & SPA Nativa**: Frontend Single Page Application servido directamente por Express en ackend/public/, optimizado para pantallas tactiles, lectores de codigos de barra y balanzas.
* **Facturacion Electronica DTE (SII)**: Emision nativa y timbrado digital (TED) con firma criptografica RSA-SHA1 para Boletas Electronicas (39/41), Facturas (33), Guias de Despacho (52) y Notas de Credito (61), con generacion diaria de RCOF y propuesta F29.
* **Cumplimiento Legal Chileno**:
  * **Ley N° 20.956**: Redondeo automatico a la decena mas proxima en pagos en efectivo.
  * **Ley N° 21.100**: Venta de bolsas reutilizables estandarizadas en **.000**.
  * **Resolucion Exenta N° 176**: Prevencion de doble tributacion en pagos con tarjeta y vouchers validos.
* **Control de Caja y Balance Z**: Apertura de turno con fondo inicial, registro de egresos/ingresos de efectivo, arqueo ciego y reporte Z en formato termico de 80 mm.
* **Control de Vencimientos y Mermas**: Registro de lotes y semaforo preventivo de caducidad para rotacion FEFO (First-Expired, First-Out).
* **Abastecimiento Predictivo (ROP)**: Calculo de velocidad diaria de venta, punto de reorden con stock de seguridad y ajuste por empaques minimos de proveedores B2B.
* **Ingesta Inteligente de Facturas**: Escaneo de facturas PDF mediante OCR, actualizacion automatica de costos y fijacion de precios con margen de ganancia configurable.

---

## Estructura del Repositorio

`	ext
GesTock/
├── backend/                  # Codigo fuente del backend Node.js / Express / TypeScript
│   ├── public/               # Frontend SPA nativo (index.html, js/app.js, css/pos-theme.css)
│   ├── src/                  # Servicios, controladores, middleware y modelos
│   │   ├── caja/             # Turnos, arqueo ciego y Balance Z
│   │   ├── config/           # Configuracion multi-tenant y margenes
│   │   ├── database/         # Clientes PostgreSQL (Cloud) y SQLite (Local Mirror)
│   │   ├── dte/              # Motor DTE, firma TED, CAF y RCOF
│   │   ├── invoices/         # Ingesta de facturas y catalogacion
│   │   ├── middleware/       # Seguridad, CORS, Rate Limit, sanitizacion
│   │   ├── ocr/              # Extraccion OCR de facturas PDF
│   │   ├── payments/         # Pasarelas (Transbank, SumUp, MercadoPago, RutPay)
│   │   ├── replenishment/    # Algoritmos ROP y abastecimiento predictivo
│   │   ├── routes/           # 57 endpoints REST de la API
│   │   ├── sync/             # Sincronizador bidireccional offline-first
│   │   └── utils/            # Logger estructurado y helpers
│   └── tests/                # Pruebas de integracion
├── docs/                     # Documentacion tecnica formal en formato Word (.docx)
│   ├── arquitectura_sistema.docx
│   ├── base_de_datos.docx
│   ├── estado_actual_proyecto.docx
│   ├── evidencia_pruebas_unitarias.docx
│   ├── guia_de_despliegue.docx
│   └── manual_de_funcionalidades.docx
├── tests_unitarias/          # Suite independiente de pruebas unitarias (87 tests)
│   ├── all_endpoints.unit.test.ts
│   ├── circuit_breaker.unit.test.ts
│   ├── dte_crypto_rules.unit.test.ts
│   ├── pricing_and_rounding.unit.test.ts
│   ├── replenishment_math.unit.test.ts
│   ├── security_and_auth.unit.test.ts
│   └── jest.unit.config.js
├── Dockerfile                # Despliegue en contenedor
├── docker-compose.yml        # Orquestacion de servicios (App + PostgreSQL)
├── package.json              # Dependencias y scripts de ejecucion
└── tsconfig.json             # Configuracion TypeScript
`

---

## Requisitos Previos

* **Node.js**: Version 20.x LTS o superior.
* **npm**: Version 10.x o superior.
* **PostgreSQL** (opcional para modo local, requerido para cloud): Version 16+.
* **SQLite 3**: Integrado nativamente en el proyecto.

---

## Instalacion y Puesta en Marcha

1. **Clonar el repositorio**:
   `ash
   git clone https://github.com/Kreiros/GesTock.git
   cd GesTock
   `

2. **Instalar dependencias**:
   `ash
   npm install
   `

3. **Configurar variables de entorno**:
   `ash
   cp .env.example .env
   # Editar .env con las credenciales correspondientes
   `

4. **Ejecutar migraciones de base de datos**:
   `ash
   npm run migrate:pg      # Aplica migraciones en PostgreSQL Cloud
   npm run migrate:sqlite  # Inicializa el espejo local en SQLite
   `

5. **Iniciar en entorno de desarrollo**:
   `ash
   npm run dev
   `
   El sistema estara disponible en http://localhost:3000/.

6. **Compilar e iniciar en produccion**:
   `ash
   npm run build
   npm start
   `

---

## Baterias de Pruebas Automatizadas

El sistema cuenta con **147 pruebas automatizadas** que cubren el 100% de la funcionalidad y de los endpoints de la API:

`ash
# 1. Bateria Unitaria Aislada (87 pruebas unitarias, 57 endpoints, ~3s)
npm run test:unit

# 2. Bateria de Integracion (60 pruebas de integracion, ~5s)
npm test

# 3. Reporte de Cobertura
npm run test:coverage
`

### Matriz de Cobertura de Endpoints (57 de 57 Verificados)

| Modulo / Dominio | N° Endpoints | Endpoints Evaluados | Estado |
|---|:---:|---|:---:|
| **Core & Sistema** | 2 | GET /health, GET /api | **PASSED** |
| **Caja & Balance Z** | 6 | POST /caja/abrir, GET /caja/resumen, POST /caja/movimiento, GET /caja/movimientos, POST /caja/cerrar, GET /caja/historial | **PASSED** |
| **Configuracion & Margen** | 4 | GET /config/margin, POST /config/margin, GET /config/email, POST /config/email | **PASSED** |
| **Dashboard Ejecutivo** | 1 | GET /dashboard/overview | **PASSED** |
| **Facturacion DTE / SII** | 16 | GET /dte/config, POST /dte/config, GET /dte/caf/status, POST /dte/caf/upload, POST /dte/emit, GET /dte/list, GET /dte/:id/xml, GET /dte/:id/receipt, POST /dte/rcof/generate, GET /dte/rcof/list, POST /dte/certification/run-set, POST /dte/send-email, GET /dte/f29, POST /dte/guias/emitir, GET /dte/guias, GET /dte/backup/export | **PASSED** |
| **Ingesta de Facturas OCR** | 4 | POST /invoices/scan, POST /invoices/confirm, POST /invoices/ingest, GET /invoices/ | **PASSED** |
| **Tendencias de Demanda** | 3 | POST /trends/sync, GET /trends/, GET /trends/:tenantId | **PASSED** |
| **Pasarelas de Pago** | 3 | POST /payments/initiate, POST /payments/confirm, GET /payments/sale/:saleId | **PASSED** |
| **Punto de Venta (POS)** | 8 | GET /pos/products, GET /pos/status, POST /pos/checkout, POST /pos/sync, GET /pos/inventory, GET /pos/vencimientos, GET /pos/transactions, POST /pos/devolucion | **PASSED** |
| **Reabastecimiento ROP** | 5 | GET /replenishment/velocity, GET /replenishment/suggest, POST /replenishment/suggest, POST /replenishment/send-email, GET /replenishment/purchase-orders | **PASSED** |
| **Proveedores B2B** | 3 | GET /suppliers/, POST /suppliers/, PUT /suppliers/:id | **PASSED** |
| **Sincronizacion Nube** | 2 | POST /sync/push, GET /sync/pull | **PASSED** |
| **TOTAL CONSOLIDADO** | **57** | **100% de los endpoints testeados** | **100% OK** |

---

## Documentacion Oficial

Consulte los manuales formales detallados en la carpeta [docs/](./docs):

1. **docs/arquitectura_sistema.docx**: Diseno arquitectonico, seguridad, circuit breaker y catalogo de 57 endpoints.
2. **docs/base_de_datos.docx**: Modelo relacional dual (PostgreSQL + SQLite), integridad referencial y banderas de sincronizacion.
3. **docs/guia_de_despliegue.docx**: Instalacion, variables de entorno, balanceo y configuracion de produccion con PM2.
4. **docs/manual_de_funcionalidades.docx**: Operacion del POS, normativas chilenas, DTE, arqueo Z y reabastecimiento ROP.
5. **docs/estado_actual_proyecto.docx**: Informe de auditoria, resolucion de incidentes y metricas de estabilidad.
6. **docs/evidencia_pruebas_unitarias.docx**: Certificado formal de auditoria y matriz de las 87 pruebas unitarias y 60 de integracion.

---

## Licencia

Propiedad de GesTock Team. Todos los derechos reservados.
