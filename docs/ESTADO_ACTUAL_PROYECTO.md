# 📈 GesTock — Estado Actual del Proyecto & Cronograma

#estado #roadmap #gantt #gestock

---

## 1. Estado Actual (Fase 2 en Ejecución)
* **Backend Core:** Finalizado y validado con suites de pruebas (Jest 15 suites de integración con 81 tests + 6 suites unitarias de backend con 115 tests = **196 pruebas automatizadas exclusivas de backend**, 100% aprobación; totalizando **207 pruebas Jest consolidadas** con las 11 pruebas unitarias de reglas de contrato de frontend segregadas en `tests_unitarias/frontend/`). Evidencias documentadas en formato dual en `docs/INFORME_BATERIA_PRUEBAS_BACKEND.md` y `docs/informe_bateria_pruebas_backend.docx`.
* **Batería de Pruebas de Integración Frontend (E2E & Contratos API):** Evaluada y ejecutada exitosamente la suite de 9 módulos (`01-sistema` a `09-autenticacion`) con 99/99 comprobaciones aprobadas (100% de éxito). Se subsanaron el Módulo 11 del emisor fiscal y la ingesta honesta del OCR nativo DTE. Evidencias documentadas en formato dual en `docs/INFORME_BATERIA_PRUEBAS_FRONTEND.md` y `docs/informe_bateria_pruebas_frontend.docx`, con suite de reglas unitarias segregada en `tests_unitarias/frontend/frontend_contract_rules.unit.test.ts`.
* **Autenticación & RBAC (RF-01, RF-02, RF-03, RNF-SEG-01, RNF-SEG-02):** Implementación completa de `POST /api/v1/auth/login` (con mensaje unificado anti-enumeración), `POST /api/v1/auth/register` (privado, protegido para admin, emite usuario creado sin token), `GET /api/v1/auth/users` (gestión de personal sin exponer hashes), `GET /api/v1/auth/me` y `PUT /api/v1/auth/password` (cambio de contraseña propia con verificación de la actual). Aislamiento multi-tenant: con token, toda petición cuyo tenant declarado difiera del tenant del token recibe HTTP 403, y el registro y listado de usuarios usan siempre el tenant del token; el `usuario_id` del body se reemplaza por el del usuario autenticado. Middleware `rbacAuthMiddleware` que blinda rutas críticas (`/dashboard`, `/invoices`, `/suppliers`, `/replenishment`, `/dte`, `/config`) exclusivamente para rol administrador y habilita `/pos` y `/caja` para cajero. Excepción acotada (07-10-2026): el cajero accede a las rutas DTE del comprobante de venta (`GET /dte/config`, `GET /dte/list`, `GET /dte/:id/receipt`, `GET /dte/:id/xml`, `POST /dte/send-email`), necesarias en Caja, Cierre Z e Historial de Ventas; el frontend desactiva para el cajero las consultas a rutas solo-admin (`/suppliers`, `/replenishment/suggest`, `/config/email`) que antes respondían 403. Sembrado con hashes Bcrypt reales de 60 caracteres (Admin `admin@gestock.cl` / `admin123` y Cajero `cajero@gestock.cl` / `cajero123`) solo fuera de producción y solo si las cuentas no existen: el arranque ya no restablece contraseñas. En producción se crea un administrador inicial desde `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` y el servidor no arranca sin un `JWT_SECRET` propio de al menos 32 caracteres. Dependencias de producción sin vulnerabilidades conocidas (`npm audit --omit=dev`); Jest actualizado a v30.
* **Documento de Arquitectura de Software (DAS v2.2):** Actualizado y sincronizado en `docs/ARQUITECTURA_SISTEMA.md` y `docs/arquitectura_sistema.docx` incorporando las Vistas 4+1 completas, los 25 RNF bajo ISO/IEC 25010, inventario oficial de 29 tablas relacionales persistentes (incluyendo `_migrations` y excluyendo tablas efímeras DDL), modelos matemáticos (Circuit Breaker 0ms, Exponential Backoff + Jitter, ROP, Ley de Redondeo), catálogo de 66 endpoints y soporte de seguridad criptográfica JWT / Bcrypt.
* **Frontend POS & Autenticación:** Pantallas de Login y Registro con roles, rutas protegidas, diálogos de alta/edición de productos, ajuste manual de existencias, registro e historial de mermas con exportación CSV y trazabilidad FEFO integrados.
* **Base de Datos & Migraciones:** Migración 010 activa para ampliación del CHECK constraint en `historial_stock` (`alta_inicial`, `ajuste_manual`, `merma`) aplicada tanto en SQLite local como en PostgreSQL cloud con transaccionalidad atómica (`withTransaction`). Tabla persistente `_migrations` para trazabilidad DDL.
* **Ingesta de Facturas (OCR):** Gemini OCR actualizado a `gemini-3.5-flash` con reintentos automáticos y backoff exponencial (1s, 2s) ante 503/429/timeout de red, y política estricta anti-datos ficticios (error honesto HTTP 422 si existe `GEMINI_API_KEY` y no es posible digitalizar; y extractor nativo DTE `ChileanPdfDteExtractor` para facturas locales).
* **Auditoría & Trazabilidad de Stock:** Endpoints `GET /api/v1/pos/stock-history` y `GET /api/v1/pos/products/:id/history` habilitados para filtrado directo por `tipo_movimiento` y orden cronológico estable.
* **Cumplimiento Tributario Chileno:** Corrección del RUT del emisor a Módulo 11 oficial (`76.123.456-0`), dualidad simétrica snake_case / camelCase en reportes DTE y soporte de Ley de Redondeo N° 20.956.

---

## 2. Cronograma Estratégico (Gantt)

\`\`\`mermaid
gantt
    title Planificación GesTock 2026
    dateFormat YYYY-MM-DD
    axisFormat %d/%m

    section Fase 1: Planificación (Completada)
    Requerimientos y Validación              :done, 2026-08-10, 2026-08-24
    Stack Tecnológico y Arquitectura Dual   :done, 2026-08-24, 2026-08-31
    Carta Gantt e Informe                   :done, 2026-08-31, 2026-09-07

    section Fase 2: Desarrollo Core (En Progreso)
    Backend Dual, Sync, Pasarelas y DTE     :done, 2026-09-07, 2026-09-21
    Diseño UI/UX en Google Stitch            :done, 2026-09-14, 2026-09-21
    Desarrollo Cliente Frontend POS          :active, 2026-09-21, 2026-10-05
    Integración RESTful Frontend-Backend     :2026-10-05, 2026-10-19
    Módulos Predictivos Avanzados (Gemini)   :2026-10-19, 2026-10-26
    Pruebas Piloto en Terreno                :crit, 2026-10-26, 2026-11-09
    Auditoría QA y Hardening Final           :2026-11-09, 2026-11-23

    section Fase 3: Cierre y Titulación
    Material Audiovisual y Examen            :2026-11-23, 2026-12-14
\`\`\`

---

## 3. Enlaces Relacionados & Nexo de Conocimiento
* 🧭 **Hub del Proyecto:** [[01 - PROYECTOS/GesTock/INDEX.md|GesTock Hub Principal]]
* 🌌 **Núcleo Central:** [[00 - HUB & DASHBOARD/🧭 MOC_CENTRAL_NEXO_DE_DATOS.md|MOC Central]]
* 📚 **Arquitectura:** [[01 - PROYECTOS/GesTock/ARQUITECTURA_SISTEMA.md|Arquitectura del Sistema]]
* 💾 **Base de Datos:** [[01 - PROYECTOS/GesTock/BASE_DE_DATOS.md|Modelo de Base de Datos]]
* 🧬 **Conceptos Clave:** [[Arquitectura Offline-First & Sync Engine]] · [[Reabastecimiento Predictivo & Algoritmos de Stock]]
