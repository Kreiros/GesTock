# 🛡️ GesTock — Informe Técnico de Evaluación y Evidencias: Batería de Pruebas del Backend

**Documento Oficial de Aseguramiento de Calidad (QA) y Verificación Arquitectónica**  
**Proyecto:** GesTock — Predictive Inventory Management System (Cloud SaaS & POS Offline-First)  
**Fecha de Emisión:** 07 de Octubre de 2026  
**Área Responsable:** Ingeniería de Software & Backend Core  
**Clasificación:** Evidencia Técnica Oficial — Fase 2 (Desarrollo Core & Validación de Arquitectura)  

---

## 📌 Metadatos de Auditoría y Estado Global

| Parámetro | Detalle Oficial de Auditoría |
|---|---|
| **Sistema Evaluado** | GesTock Backend Core (Node.js v22, TypeScript v5.8, Express v4.21) |
| **Arquitectura de Persistencia** | Dual-Database Híbrida: PostgreSQL Cloud (SaaS Multi-tenant) & SQLite Local Mirror (POS Offline-First) |
| **Suites de Integración Backend** | **15 suites** ejecutadas (`backend/tests/integration/*.test.ts`) |
| **Pruebas de Integración Aprobadas** | **76 de 76 pruebas** aprobadas (**100% PASS Rate**) · 0 Fallas |
| **Suites Unitarias Backend** | **6 suites** ejecutadas (`tests_unitarias/backend/*.unit.test.ts`) |
| **Pruebas Unitarias Aprobadas** | **96 de 96 pruebas** aprobadas (**100% PASS Rate**) · 0 Fallas |
| **Total Pruebas Exclusivas Backend** | **172 pruebas automatizadas** (**100% PASS Rate Global**) |
| **Suites Unitarias Frontend Segregadas** | **1 suite** (`tests_unitarias/frontend/frontend_contract_rules.unit.test.ts`, 11 pruebas, 100% PASS) |
| **Total General Jest** | **183 pruebas aprobadas** (107 unitarias + 76 integración, 100% PASS) |
| **Dictamen de Auditoría** | **APROBADO SIN OBSERVACIONES** |

---

## 1. Resumen Ejecutivo

El presente informe documenta la verificación exhaustiva de la batería de pruebas automatizadas del **Backend de GesTock**. Las pruebas han sido diseñadas para validar en profundidad los componentes centrales del sistema:

1. **Persistencia Dual & ACID:** Comprobación estricta de transaccionalidad atómica y espejo relacional entre SQLite en el borde (POS) y PostgreSQL en la nube, garantizando cero pérdida de datos ante caídas de red.
2. **Cumplimiento Tributario Chileno (SII & Ley N° 20.956):** Verificación algorítmica del Módulo 11 en RUTs de emisor (`76.123.456-0`) y clientes, prevención de doble tributación según Resolución Exenta N° 176 (Modelo A y Modelo B), cálculo legal de redondeo a la decena y desglose de IVA 19% (débito/crédito fiscal).
3. **Resiliencia & Sincronización Offline-First:** Validación del patrón Circuit Breaker con respuesta inmediata en caliente (<2ms), algoritmo de Backoff Exponencial con Jitter para reintentos y resolución determinista de conflictos mediante *Last-Write-Wins* (LWW) y merge transaccional.
4. **Inteligencia de Inventario & OCR:** Exactitud de las fórmulas de Reabastecimiento Predictivo (Punto de Reorden ROP y Stock de Seguridad) y extracción nativa de facturas PDF sin dependencia obligatoria de APIs externas ni generación de datos ficticios.
5. **Seguridad Criptográfica & RBAC:** Implementación real de contraseñas hasheadas con Bcrypt (costo 10, 60 caracteres), emisión y validación de tokens JWT perimetrales con anti-enumeración de credenciales (HTTP 401 unificado) y middleware de control de acceso por roles (administrador vs cajero).

La batería completa fue ejecutada localmente en entorno de pruebas aislado, alcanzando una tasa de éxito del **100% en todas las suites evaluadas**.

---

## 2. Cobertura Detallada de Pruebas de Integración Backend (`backend/tests/integration/`)

Las pruebas de integración evalúan el funcionamiento coordinado de controladores, servicios de dominio, adaptadores de base de datos y middlewares ante escenarios reales de negocio:

| N° | Suite de Pruebas | Archivo | Casos | Estado | Dominio y Comportamiento Verificado |
|:---:|---|---|:---:|:---:|---|
| 01 | **Seguridad & Autenticación REST** | `auth_endpoints.test.ts` | 8 / 8 | **100% OK** | Login con credenciales válidas emite JWT; bloqueo perimetral 401 sin token; bloqueo 401 ante JWT adulterado; registro restringido exclusivamente a administradores; sanitización de usuarios (nunca expone `password_hash`); endpoints protegidos `/me` y `/users`; mensaje de error idéntico anti-enumeración. |
| 02 | **Cumplimiento Retail Chileno** | `chilean_retail_compliance.test.ts` | 4 / 4 | **100% OK** | Aplicación estricta de Ley N° 20.956 (redondeo hacia arriba/abajo en pagos en efectivo); cálculo exacto de vuelto; separación del IVA Débito Fiscal (19%); coherencia con terminales POS. |
| 03 | **Persistencia Dual & ACID** | `dual_persistence_acid.test.ts` | 5 / 5 | **100% OK** | Transaccionalidad atómica multiconsulta (`withTransaction`); aislamiento multi-tenant estricto; rollback garantizado ante excepciones; espejo continuo entre SQLite y PostgreSQL en memoria (`pg-mem`). |
| 04 | **Flujo E2E de Punto de Venta (POS)** | `frontend_pos_e2e.test.ts` | 4 / 4 | **100% OK** | Ciclo completo de venta desde escaneo de productos, cálculo de descuentos, emisión de comprobante fiscal, deducción atómica de existencias y registro en auditoría. |
| 05 | **Ingesta Digital & OCR de Facturas** | `invoice_ocr_ingestion.test.ts` | 4 / 4 | **100% OK** | Ingesta de documentos PDF de compra; extracción de cabeceras tributarias (RUT proveedor, folio, razón social, montos neto/IVA/total); extractor nativo `ChileanPdfDteExtractor`; conversión automática a stock entrante. |
| 06 | **Tendencias de Mercado & Elasticidad** | `market_trends.test.ts` | 4 / 4 | **100% OK** | Sincronización de índices de demanda externa; persistencia temporal de fluctuaciones de precios; cálculo de estacionalidad para predicción de stock. |
| 07 | **Despachador de Pasarelas de Pago** | `payment_gateways.test.ts` | 5 / 5 | **100% OK** | Patrón Strategy para pasarelas: Transbank Webpay, MercadoPago QR, SumUp y CuentaRUT (RutPay); segregación contable de pagos electrónicos frente al efectivo físico. |
| 08 | **Integridad de Esquema PostgreSQL** | `postgres_schema.test.ts` | 5 / 5 | **100% OK** | Verificación de 29 tablas relacionales persistentes; integridad referencial de llaves foráneas (`ON DELETE RESTRICT/CASCADE`); tipos UUID e índices multi-tenant. |
| 09 | **Reabastecimiento Predictivo (ROP)** | `predictive_replenishment.test.ts` | 5 / 5 | **100% OK** | Cálculo de velocidad diaria de venta ($V_d$), punto de reorden ($ROP = V_d \times L_t + SS$), generación de sugerencias de compra por debajo del umbral y exportación a proveedores. |
| 10 | **Precios, Redondeo y Cierre de Caja** | `pricing_and_caja.test.ts` | 7 / 7 | **100% OK** | Ciclo de turno de caja (apertura, ingresos, egresos, ventas en efectivo y tarjeta, arqueo ciego, cuadre matemático de Balance Z); configuración de márgenes de ganancia por tenant. |
| 11 | **Normativa Tributaria DTE & SII** | `sii_compliance_and_dte.test.ts` | 7 / 7 | **100% OK** | Algoritmo Módulo 11 en RUT de emisor (`76.123.456-0`); administración de folios CAF; firma digital XML de Timbre Electrónico (<TED>); generación de reportes diarios RCOF y F29; simulación de certificación SII. |
| 12 | **Espejo Local SQLite & Modo Offline** | `sqlite_schema.test.ts` | 4 / 4 | **100% OK** | Estructura espejo en SQLite local; activación obligatoria de `PRAGMA foreign_keys = ON`; marcado de registros sucios (`is_dirty = 1`, `sync_attempts`); simulación de desconexión total. |
| 13 | **Resiliencia & Backoff Exponencial** | `sync_backoff_resiliency.test.ts` | 4 / 4 | **100% OK** | Simulación de cortes de red y latencia; transiciones del Circuit Breaker (CLOSED -> OPEN -> HALF_OPEN); cálculo de backoff exponencial con jitter para evitar tormentas de reintentos (*thundering herd*). |
| 14 | **Resolución de Conflictos Sync** | `sync_conflict_resolution.test.ts` | 5 / 5 | **100% OK** | Resolución determinista de ediciones concurrentes nube-local; aplicación de regla *Last-Write-Wins* (LWW) cronológica; registro de auditoría en tabla de resolución de conflictos. |
| 15 | **Empuje de Sincronización (Push Engine)** | `sync_engine_push.test.ts` | 5 / 5 | **100% OK** | Procesamiento por lotes de la cola `sync_queue`; envío transaccional de ventas y movimientos de stock; actualización de estado local (`is_dirty = 0`) tras confirmación en la nube. |

**Subtotal Pruebas de Integración:** **15 suites, 76 pruebas aprobadas (100% PASS).**

---

## 3. Cobertura Detallada de Pruebas Unitarias Backend (`tests_unitarias/backend/`)

Las pruebas unitarias del backend están aisladas de toda dependencia externa. Operan con mocks puros y ejecución ultra-rápida (<4 segundos), garantizando la inmutabilidad de la lógica de dominio y los contratos de la API REST:

| N° | Suite de Pruebas | Archivo | Casos | Estado | Dominio y Contratos Validados |
|:---:|---|---|:---:|:---:|---|
| 01 | **Catálogo Completo de Endpoints REST** | `all_endpoints.unit.test.ts` | 57 / 57 | **100% OK** | Verificación integral de los 57 endpoints REST del backend (Core, POS, Caja, DTE, Invoices, Suppliers, Replenishment, Payments, Trends, Config, Sync, Dashboard). Valida códigos HTTP 200, 201, 400 y 404, payloads estructurados y control de errores. |
| 02 | **Seguridad, Criptografía, JWT & RBAC** | `security_and_auth.unit.test.ts` | 16 / 16 | **100% OK** | Criptografía Bcrypt (hashes de 60 caracteres reales, costo 10); emisión, firma y validación de tokens JWT; control de acceso RBAC (bloqueo 403 a cajeros en rutas admin, paso a administradores); sanitización de Tenant ID contra SQL Injection; capturador global de errores sanitizado. |
| 03 | **Normativa Tributaria de Precios & Redondeo** | `pricing_and_rounding.unit.test.ts` | 7 / 7 | **100% OK** | Regla legal de redondeo en efectivo (Ley N° 20.956): 1-4 abajo, 5-9 arriba, 0 neutro; cálculo de precio comercial con margen porcentual; desglose preciso de IVA 19% (fórmulas Neto = Total / 1.19, IVA = Total - Neto). |
| 04 | **Algoritmos Predictivos de Reabastecimiento** | `replenishment_math.unit.test.ts` | 6 / 6 | **100% OK** | Velocidad de venta diaria ($V_d = \text{unidades} / \text{días}$); fórmula formal de Punto de Reorden ($ROP = V_d \times L_t + SS$); activación de compra según umbral; ajuste automático hacia múltiplos de empaque de proveedor (bultos mínimos). |
| 05 | **Circuit Breaker & Resiliencia Offline** | `circuit_breaker.unit.test.ts` | 5 / 5 | **100% OK** | Estados CLOSED, OPEN y HALF_OPEN; disparo inmediato ante error de conexión; rechazo en caliente (<2ms) sin consumir timeout de red; restauración automática (`resetCircuit`); bypass hacia SQLite local. |
| 06 | **Facturación DTE, Timbre TED & Res. 176** | `dte_crypto_rules.unit.test.ts` | 5 / 5 | **100% OK** | Códigos tributarios oficiales SII (33 Factura, 39 Boleta, 41 Boleta Exenta, 52 Guía, 61 Nota de Crédito); Resolución Exenta N° 176 (Modelo A: todo emite boleta; Modelo B: tarjetas no emiten boleta 39 para evitar doble débito fiscal); estructura XML del Timbre Electrónico (<TED>). |

**Subtotal Pruebas Unitarias de Backend:** **6 suites, 96 pruebas aprobadas (100% PASS).**

---

## 4. Segregación Estructural de Pruebas Unitarias

Para evitar el acoplamiento entre pruebas del backend y pruebas originadas en requerimientos del frontend, la carpeta `tests_unitarias/` fue reorganizada formalmente en dos subdirectorios independientes:

```
tests_unitarias/
├── backend/                                   # Suites Exclusivas de Backend (96 tests)
│   ├── all_endpoints.unit.test.ts             # 57 tests
│   ├── circuit_breaker.unit.test.ts           # 5 tests
│   ├── dte_crypto_rules.unit.test.ts          # 5 tests
│   ├── pricing_and_rounding.unit.test.ts      # 7 tests
│   ├── replenishment_math.unit.test.ts        # 6 tests
│   └── security_and_auth.unit.test.ts         # 16 tests
│
├── frontend/                                  # Suites de Reglas de Contrato Frontend (11 tests)
│   └── frontend_contract_rules.unit.test.ts   # 11 tests
│
├── jest.unit.config.js                        # Configuración Jest con testMatch: ['<rootDir>/**/*.unit.test.ts']
└── README.md                                  # Documentación técnica de la suite
```

### Comandos de Ejecución Específicos añadidos a `package.json`:
* `npm run test:unit`: Ejecuta todas las pruebas unitarias (107 tests).
* `npm run test:unit:backend`: Ejecuta exclusivamente las 6 suites de backend (96 tests).
* `npm run test:unit:frontend`: Ejecuta exclusivamente la suite de reglas de frontend (11 tests).

---

## 5. Modelos Matemáticos y Algoritmos Auditados

### 5.1 Algoritmo de Reabastecimiento Predictivo (Punto de Reorden ROP)
El sistema calcula el momento exacto y la cantidad a comprar para evitar quiebres de stock sin incurrir en sobreinventario:
$$\text{Velocidad Diaria } (V_d) = \frac{\sum_{i=1}^{N} \text{Unidades Vendidas}_i}{N \text{ días}}$$
$$\text{Punto de Reorden } (ROP) = (V_d \times L_t) + SS$$
$$\text{Cantidad a Pedir Sugerida} = \left\lceil \frac{ROP - \text{Stock Actual}}{\text{Múltiplo Empaque}} \right\rceil \times \text{Múltiplo Empaque}$$
Donde $L_t$ es el tiempo de entrega del proveedor (*Lead Time*) y $SS$ es el stock de seguridad calculado para absorber desviaciones de la demanda.

### 5.2 Ley de Redondeo en Efectivo (Ley Chilena N° 20.956)
En toda transacción comercial con medio de pago en efectivo, la cuenta final se ajusta a la decena más cercana:
$$\text{Último Dígito} = \text{Monto Total} \pmod{10}$$
$$\text{Monto Redondeado} = \begin{cases} \text{Monto Total} - \text{Último Dígito} & \text{si Último Dígito} \in \{1, 2, 3, 4\} \\ \text{Monto Total} + (10 - \text{Último Dígito}) & \text{si Último Dígito} \in \{5, 6, 7, 8, 9\} \\ \text{Monto Total} & \text{si Último Dígito} = 0 \end{cases}$$
Los medios de pago electrónicos (tarjetas de crédito, débito, transferencias y RutPay) conservan el monto exacto sin redondeo.

### 5.3 Resiliencia Offline: Circuit Breaker y Backoff Exponencial con Jitter
Para garantizar que el punto de venta (POS) continúe cobrando a velocidad de retail (<1 segundo por cliente) cuando la nube falla:
1. **Circuit Breaker:** Ante 3 fallos consecutivos de red, el circuito cambia a `OPEN`. Durante el periodo de enfriamiento (cooldown de 30 segundos), cualquier consulta dirigida a PostgreSQL es rechazada en caliente en **menos de 2 milisegundos**, operando automáticamente contra SQLite local.
2. **Backoff Exponencial con Jitter:**
   $$T_{\text{reintento}} = \min\left(T_{\text{máximo}}, T_{\text{base}} \times 2^{\text{intento}}\right) \pm \text{Jitter}$$
   El componente aleatorio *Jitter* desincroniza las reconexiones de múltiples terminales POS, impidiendo saturaciones en el servidor central.

### 5.4 Algoritmo de Validación Tributaria Módulo 11 (SII)
$$\text{Suma} = \sum_{i=0}^{n-1} d_i \times m_i, \quad m \in [2, 3, 4, 5, 6, 7, 2, \dots]$$
$$\text{Resto} = 11 - (\text{Suma} \pmod{11})$$
$$\text{DV} = \begin{cases} \mathbf{0} & \text{si Resto} = 11 \\ \mathbf{K} & \text{si Resto} = 10 \\ \mathbf{Resto} & \text{en otro caso} \end{cases}$$
Validado formalmente con el RUT del emisor corporativo de GesTock: `76.123.456-0`.

---

## 6. Resumen Cuantitativo y Comandos de Ejecución

| Tipo de Batería | Suites | Pruebas | Tasa de Aprobación | Tiempo de Ejecución |
|---|:---:|:---:|:---:|:---:|
| **Integración Backend (`npm test`)** | 15 | 76 | **100% PASS** | ~6.1 s |
| **Unitarias Backend (`npm run test:unit:backend`)** | 6 | 96 | **100% PASS** | ~3.5 s |
| **Unitarias Frontend (`npm run test:unit:frontend`)** | 1 | 11 | **100% PASS** | ~1.1 s |
| **Total Pruebas Automatizadas Backend** | **21** | **172** | **100% PASS** | — |
| **Total Pruebas Automatizadas Jest** | **22** | **183** | **100% PASS** | ~9.6 s |

### Comandos de Ejecución Oficiales:
```bash
# Ejecutar la batería completa de integración del backend
npm test

# Ejecutar las pruebas unitarias exclusivas del backend
npm run test:unit:backend

# Ejecutar todas las pruebas unitarias (backend + frontend)
npm run test:unit

# Ejecutar las pruebas unitarias de contratos frontend
npm run test:unit:frontend

# Validar compilación limpia de TypeScript sin errores
npm run build
```

---

## 7. Dictamen Final de Aprobación

La batería de pruebas automatizadas del Backend de GesTock satisface con creces los requerimientos funcionales y no funcionales comprometidos para la **Fase 2**:
* Demuestra una arquitectura dual sólida y resiliente frente a desconexiones de red.
* Cumple estrictamente con la normativa legal y tributaria chilena (SII y Ley de Redondeo).
* Protege el perímetro y los datos de los usuarios mediante criptografía robusta (Bcrypt y JWT).
* Mantiene una cobertura de pruebas impecable con 172 comprobaciones de backend pasando al 100%.

**Dictamen Técnico:** **APROBADO Y CERTIFICADO PARA PRODUCCIÓN LOCAL Y DEFENSA DE FASE 2.**
