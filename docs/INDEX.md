# 📦 GesTock — Sistema de Inventario Predictivo & POS Offline-First

#proyecto #gestock #inventory #pos #offline-first #dte #sii #saas

---

## 📌 Visión General
**GesTock** es una plataforma integral de gestión de inventario predictivo, punto de venta (POS) de alta velocidad y facturación electrónica fiscal (DTE Chile), diseñada para operar bajo una **arquitectura híbrida Dual-Database**:
1. **Cloud SaaS Central (PostgreSQL):** Gestión multi-empresa, reportería ejecutiva, conciliación de pagos y auditoría central.
2. **Edge POS Local (SQLite Offline-First):** Terminales de punto de venta en terreno capaces de cobrar, emitir boletas y registrar movimientos sin conexión a internet, sincronizando automáticamente con el servidor central mediante colas transaccionales y resolución de conflictos.

---

## 📚 Documentación Técnica del Proyecto
* [[01 - PROYECTOS/GesTock/ESTADO_ACTUAL_PROYECTO|Estado Actual del Proyecto & Cronograma Gantt]]
* [[01 - PROYECTOS/GesTock/ARQUITECTURA_SISTEMA|Arquitectura del Sistema Dual & Motor de Sincronización]]
* [[01 - PROYECTOS/GesTock/BASE_DE_DATOS|Modelo Relacional (MER), Entidades y Migraciones]]
* [[01 - PROYECTOS/GesTock/MANUAL_FUNCIONALIDADES|Manual de Módulos (POS, DTE, Pagos, OCR & Stock)]]
* [[01 - PROYECTOS/GesTock/GUIA_DESPLIEGUE|Guía de Despliegue, Variables de Entorno y Docker]]

---

## 🔗 Ecosistema Interconectado HubLab
GesTock forma parte del ecosistema de productos de ingeniería de HubLab:
* 🛡️ **[[01 - PROYECTOS/SAG-RANK/INDEX|SAG RANK]]:** Supervisa la infraestructura y audita los portales web y APIs de GesTock para garantizar rendimiento óptimo y máxima citabilidad en motores IA.
* 🌐 **[[01 - PROYECTOS/Landing-Page-Hublab/INDEX|Landing Page HubLab Tech]]:** Vitrina comercial que canaliza clientes B2B hacia la plataforma SaaS de GesTock mediante funnels de conversión.

---

## 🧬 Conceptos & Patrones Vinculados
* **Sincronización & Resiliencia:**
  * [[Arquitectura Offline-First & Sync Engine]] · [[Circuit Breaker Pattern]] · [[Exponential Backoff & Reintentos]] · [[Resolución de Conflictos en Sincronización]]
* **Bases de Datos & Persistencia:**
  * [[PostgreSQL Transaccional vs SQLite Edge]] · [[Motor de Inventario y Stock]] · [[Modelado Relacional y Foreign Keys]] · [[Migraciones y Esquemas SQL]]
* **Facturación Fiscal & Criptografía:**
  * [[Facturación Electrónica DTE (SII Chile)]] · [[Firma Digital XML & Certificados X.509]]
* **Pasarelas de Pago:**
  * [[Payment Gateway Dispatcher Pattern]] (Transbank, MercadoPago, SumUp, RutPay)
* **Inteligencia Artificial & Automatización:**
  * [[OCR Multimodal con Gemini API]] · [[Reabastecimiento Predictivo & Algoritmos de Stock]]
* **Arquitectura & Backend:**
  * [[Multi-Tenancy & Aislamiento de Datos]] · [[RESTful API Architecture]] · [[Control de Acceso Basado en Roles (RBAC)]] · [[Pruebas Unitarias con Jest]]
