# 📖 GesTock — Manual de Funcionalidades

#manual #funcionalidades #gestock #modulos

---

## 1. Módulos del Sistema

### 1.1 Punto de Venta (POS) & Caja
* **Apertura y Cierre de Caja (\`cierre-caja.service.ts\`):** Control estricto de arqueo de caja, conteo inicial de efectivo, retiros y conciliación de ventas.
* **Cobro Multi-Método:** Pago dividido en efectivo, tarjeta de débito/crédito, transferencias y pagos QR.
* **Operación Offline-First:** Cobros y generación de boletas sin internet con sincronización diferida.

### 1.2 Facturación Electrónica (DTE)
* Emisión inmediata de Boletas Electrónicas (39/41) y Facturas (33/34).
* Timbre Electrónico DTE (TED) en código de barras PDF417 para impresión en impresoras térmicas ESC/POS.
* Generación automática del Reporte RCOF diario para el SII.

### 1.3 Ingestión Inteligente de Facturas (OCR)
* Extracción automática de facturas de proveedores en PDF o fotos con **Google Gemini OCR** (`gemini-ocr.provider.ts`).
* Actualización de costos de compra, stock disponible y sugerencias de margen comercial.

### 1.4 Reabastecimiento Predictivo
* Cálculo automático de Punto de Reorden (ROP), Stock de Seguridad y alertas tempranas de quiebre.

---

## 2. Enlaces Relacionados
* [[01 - PROYECTOS/GesTock/INDEX|GesTock Hub Principal]]
* [[Facturación Electrónica DTE (SII Chile)]]
* [[Payment Gateway Dispatcher Pattern]]
* [[OCR Multimodal con Gemini API]]
* [[Reabastecimiento Predictivo & Algoritmos de Stock]]
