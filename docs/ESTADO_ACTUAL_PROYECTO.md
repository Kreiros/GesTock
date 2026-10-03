# 📈 GesTock — Estado Actual del Proyecto & Cronograma

#estado #roadmap #gantt #gestock

---

## 1. Estado Actual (Fase 2 en Ejecución)
* **Backend Core:** Finalizado y validado con suites de pruebas unitarias (`tests_unitarias/`, 87 tests pasando al 100%).
* **Base de Datos & Migraciones:** Migración 010 implementada para ampliación del CHECK constraint en `historial_stock` (`alta_inicial`, `ajuste_manual`, `merma`) aplicada tanto en SQLite local como en PostgreSQL cloud.
* **Ingesta de Facturas (OCR):** Corrección y blindaje atómico de `POST /invoices/confirm` con reconciliación de `total_factura` / `total`, inserción transaccional en SQLite y mock OCR genérico con lotes y vencimiento para semáforo FEFO.
* **Auditoría & Trazabilidad de Stock:** Endpoints `GET /api/v1/pos/stock-history` y `GET /api/v1/pos/products/:id/history` habilitados para filtrado directo por `tipo_movimiento` desde el Frontend.
* **Seguridad & Rate Limiting:** Integración de `ipKeyGenerator` en `express-rate-limit` eliminando advertencias y normalizando subredes IPv6.
* **Módulos Fiscales DTE:** Integración de XML Signer, gestión CAF y reportes RCOF completada.

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
