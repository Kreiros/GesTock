# 🏗️ GesTock — Arquitectura del Sistema

#arquitectura #backend #express #sync #offline-first #gestock

---

## 1. Visión Arquitectónica Dual (Cloud SaaS + POS Edge)
GesTock implementa una arquitectura híbrida que desacopla la nube central de las terminales de caja locales:

\`\`\`mermaid
flowchart TD
    subgraph Cloud["Nube Central (GesTock Cloud SaaS)"]
        API[API Express + TypeScript]
        PG[(PostgreSQL Multitenant)]
        DTE_SVC[Emisor DTE & Certificación SII]
        OCR_SVC[Gemini OCR Provider]
        REPL_SVC[Motor Predictivo Reabastecimiento]
    end

    subgraph POS["Terminal POS Local (Edge Offline-First)"]
        POS_UI[Cliente POS / UI]
        POS_SQLITE[(SQLite Embebido Local)]
        SYNC_ENGINE[POS Sync Engine]
    end

    POS_UI -->|Transacciones Locales| POS_SQLITE
    POS_SQLITE -->|Detección de Lotes| SYNC_ENGINE
    SYNC_ENGINE -->|Sincronización HTTPS + Backoff| API
    API -->|Persistencia Central| PG
    API --> DTE_SVC
    API --> OCR_SVC
    API --> REPL_SVC
\`\`\`

---

## 2. Motor de Sincronización y Resiliencia
* **POS Sync Engine (\`pos-sync-engine.service.ts\`):** Detecta transacciones locales no sincronizadas, serializa lotes y los encola en memoria/disco.
* **Cloud Sync Receiver (\`cloud-sync-receiver.service.ts\`):** Procesa los lotes entrantes, valida firmas y aplica cambios atómicos.
* **Circuit Breaker (\`circuit_breaker.unit.test.ts\`):** Evita la saturación del servidor aislando pasarelas externas o terminales defectuosas.
* **Exponential Backoff (\`exponential-backoff.ts\`):** Maneja reintentos con retraso progresivo y jitter pseudoaleatorio.
* **Resolución de Conflictos (\`conflict-resolver.ts\`):** Implementa aditividad de stock y políticas Last-Write-Wins (LWW) para operaciones concurrentes.

---

## 3. Facturación Electrónica (DTE) y Criptografía
* **Firma Digital XML (\`xml-signer.service.ts\`):** Aplica la firma criptográfica RSA sobre el XML canónico con certificados digitales X.509 (.p12 / .pfx).
* **Administrador de Folios CAF (\`caf-manager.service.ts\`):** Controla el consumo secuencial de folios autorizados por el SII.
* **Reporte RCOF (\`rcof.service.ts\`):** Consolida y transmite el resumen de boletas emitidas offline.
* **Reporte F29 (\`f29-report.service.ts\`):** Genera el pre-cálculo tributario de IVA débito y crédito.

---

## 4. Conceptos y Enlaces Relacionados
* [[01 - PROYECTOS/GesTock/INDEX|GesTock Hub Principal]]
* [[Arquitectura Offline-First & Sync Engine]]
* [[Circuit Breaker Pattern]]
* [[Exponential Backoff & Reintentos]]
* [[PostgreSQL Transaccional vs SQLite Edge]]
* [[Facturación Electrónica DTE (SII Chile)]]
* [[Firma Digital XML & Certificados X.509]]
* [[Payment Gateway Dispatcher Pattern]]
