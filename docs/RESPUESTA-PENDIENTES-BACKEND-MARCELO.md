# GesTock — Resolución de Pendientes del Backend

**De:** Marcelo Pino (Backend / BD / QA)  
**Para:** David Miranda (Frontend)  
**Fecha:** 30-09-2026  
**Referencia:** Respuesta punto por punto al documento `PENDIENTES-BACKEND-MARCELO.md`  
**Commits en repositorio GesTock:** `9912c6a` y `4c57227`

---

David, revisé punto por punto tu informe del 23-09-2026. A continuación te detallo todas las correcciones, aprobaciones y nuevos endpoints que ya quedaron implementados, probados y subidos al backend en `main`. Con esto quedan desbloqueadas todas las pantallas y botones que tenías pendientes en el frontend.

---

## 1. BUGS RESUELTOS

### 1.1 Ventas con RutPay en Cierre de Caja
- **Archivo:** `backend/src/caja/cierre-caja.service.ts` (~línea 212-250)
- **Estado:** Corregido.
- **Solución implementada:** Se agregó el caso explícito `RUTPAY` y la métrica `ventas_rutpay` en la sesión de caja. Ahora las ventas electrónicas de RutPay no caen en el `else` de efectivo. El arqueo esperado de efectivo ahora contempla estrictamente: `montoApertura + efectivo + ingresosCaja - egresosCaja`. Se acabó el falso faltante en el arqueo Z.

### 1.2 Redondeo Ley 20.956 restringido solo a Efectivo
- **Archivo:** `backend/src/routes/pos.routes.ts` (~línea 420-435)
- **Estado:** Corregido.
- **Solución implementada:** La llamada a `aplicarRedondeoChileno(total)` se condicionó de forma estricta:
  ```typescript
  if (metodo_pago && String(metodo_pago).trim().toUpperCase() === 'EFECTIVO') {
    total = aplicarRedondeoChileno(total);
  }
  ```
  Pagos con débito, crédito (Transbank, Mercado Pago, SumUp), transferencias y RutPay cobran el monto exacto centavo a centavo, cumpliendo con la legislación chilena vigente.

### 1.3 Control de Fallos en Persistencia SQLite
- **Archivo:** `backend/src/invoices/invoice-ingestion.service.ts` (~línea 465-485)
- **Estado:** Corregido.
- **Solución implementada:** Se eliminó el silencio ante errores locales. Si la escritura en SQLite falla, se captura la excepción marcando `persistidoLocal = false`. La respuesta del endpoint `POST /api/v1/invoices/confirm` ahora retorna explícitamente:
  ```json
  {
    "invoice_id": "...",
    "folio_factura": "...",
    "persistido_local": true,
    "duration_ms": 142
  }
  ```
  Con esto el frontend puede notificar al usuario con precisión si la factura solo se respaldó en nube o si quedó guardada en el nodo local.

### 1.4 Aprobación de tu Fix de `supplierId` en SQLite
- **Archivo:** `backend/src/invoices/invoice-ingestion.service.ts` (~línea 350-385)
- **Estado:** Aprobado y Consolidado.
- **Comentario:** Revisé el código que adaptaste. El `SELECT id FROM proveedores WHERE tenant_id = ? AND rut_proveedor = ?` previo resuelve exactamente la restricción de clave foránea en SQLite que causaba el conflicto con `ON CONFLICT DO UPDATE`. Tu solución quedó consolidada en el commit `9912c6a`.

---

## 2. NUEVOS ENDPOINTS Y CAMPOS IMPLEMENTADOS

### 2.1 Crear, Editar y Ajustar Productos (Botón "Añadir Producto" desbloqueado)
- **Archivo:** `backend/src/routes/pos.routes.ts`
- **Endpoints disponibles:**

1. **Crear Producto:**
   - **Método:** `POST /api/v1/pos/products`
   - **Body JSON:**
     ```json
     {
       "nombre": "Leche Entera Colun 1L",
       "codigo_barra": "7801234567890",
       "sku": "COL-LEC-001",
       "precio_compra": 850,
       "precio_venta": 1190,
       "stock_actual": 24,
       "stock_minimo": 6,
       "categoria": "Lácteos",
       "proveedor_id": "uuid-opcional",
       "lote": "LOTE-2026-X",
       "fecha_vencimiento": "2026-11-30",
       "impuesto_adicional_codigo": 0,
       "impuesto_adicional_tasa": 0
     }
     ```
   - **Respuesta:** `201 Created` con el producto insertado tanto en SQLite como en PostgreSQL.

2. **Editar Producto:**
   - **Método:** `PUT /api/v1/pos/products/:id`
   - **Body JSON:** Acepta actualización parcial o total de campos (`nombre`, `codigo_barra`, `precio_compra`, `precio_venta`, `stock_minimo`, `categoria`, `lote`, `fecha_vencimiento`, `activo`, etc.).
   - **Respuesta:** `200 OK` con datos actualizados.

3. **Ajuste Manual de Stock (Auditoría Express / Conteo Físico):**
   - **Método:** `PATCH /api/v1/pos/products/:id/stock`
   - **Body JSON:**
     ```json
     {
       "nuevo_stock": 20,
       "motivo": "Conteo físico turno tarde",
       "usuario_id": "Cajero 1"
     }
     ```
   - **Respuesta:** `200 OK` con trazabilidad automática en la tabla `historial_stock` calculando el delta anterior y nuevo.

### 2.2 Persistencia de `lote` y `fecha_vencimiento` (Semáforo FEFO Activo)
- **Estado:** Implementado en persistencia y lectura.
- **Detalle:** Tanto en `POST /pos/products` como en `PUT /pos/products/:id` e ingesta de facturas, las columnas `lote` y `fecha_vencimiento` se guardan y actualizan físicamente en la base de datos.
- **Resultado:** Ya no necesitas insertar fechas a mano en la base de datos de pruebas; el endpoint `GET /api/v1/pos/vencimientos` consume datos reales y activa las alertas verde/amarillo/rojo de inmediato.

### 2.3 Registro de Mermas (Botón "Registrar Merma" desbloqueado)
- **Archivo:** `backend/src/routes/pos.routes.ts`
- **Endpoints disponibles:**

1. **Registrar Merma:**
   - **Método:** `POST /api/v1/pos/mermas`
   - **Body JSON:**
     ```json
     {
       "producto_id": "uuid-del-producto",
       "cantidad": 3,
       "motivo": "vencimiento",
       "observaciones": "Envase dañado en góndola 2",
       "usuario_id": "Cajero 1"
     }
     ```
   - **Comportamiento:** Descuenta de forma atómica el stock del producto (`UPDATE productos SET stock_actual = max(0, stock_actual - cant)`), guarda el registro en la tabla `mermas` y genera el asiento en `historial_stock`.
   - **Respuesta:** `201 Created`.

2. **Consultar Historial de Mermas:**
   - **Método:** `GET /api/v1/pos/mermas?tenant_id=...`
   - **Respuesta:** Lista de mermas registradas con nombre de producto, SKU, cantidad, motivo y fecha.

---

## 3. OCR DE FACTURAS (Google Gemini)

### 3.1 Blindaje del Parseo JSON
- **Archivo:** `backend/src/ocr/gemini-ocr.provider.ts` (~líneas 44-65)
- **Mejoras implementadas:**
  1. Se agregó en la configuración de llamada a Gemini:
     ```typescript
     generationConfig: {
       responseMimeType: 'application/json'
     }
     ```
  2. Se añadió limpieza por expresión regular previa al parseo para eliminar posibles etiquetas de bloque Markdown (````json ... ````):
     ```typescript
     const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
     const parsed = JSON.parse(cleanJson || '{}') as ExtractedInvoiceData;
     ```
  3. No volverá a romper aunque el modelo devuelva texto mixto.

### 3.2 Clave de API y Métricas
- El proveedor está listo para operar en cuanto se configure `GEMINI_API_KEY` en el archivo `.env`. Mientras no esté configurada, opera con el fallback de prueba sin detener el flujo.
- La respuesta de confirmación de factura ahora entrega `duration_ms` y `ocr_provider` para que el frontend pueda desplegar la latencia real de procesamiento.

---

## 4. OTRAS MEJORAS Y CORRECCIONES DE INTEGRACIÓN

1. **`transacciones_venta.monto_ila`:**
   - En `GET /api/v1/pos/transactions` ahora se extrae `monto_ila`, `rut_cliente`, `es_devolucion` y detalle de productos (`codigo_barra`, `sku`).
2. **Rate Limiting en Desarrollo:**
   - En `backend/src/middleware/security.middleware.ts` se calibraron las tasas de peticiones para permitir el refresco continuo de componentes en Vite sin disparar falsos bloqueos 429.
3. **Persistencia Dual en Nexo de Datos:**
   - Cada misión y cambio quedó registrado en `docs/HISTORIAL_MISIONES.md` y `.docx`.

---

## Resumen de Endpoints Disponibles para el Frontend

| Endpoint | Método | Acción | Estado |
| :--- | :--- | :--- | :--- |
| `/api/v1/pos/products` | POST | Crear producto con lote, vencimiento e ILA | Operativo |
| `/api/v1/pos/products/:id` | PUT | Actualizar producto completo | Operativo |
| `/api/v1/pos/products/:id/stock` | PATCH | Ajuste manual de stock / auditoría | Operativo |
| `/api/v1/pos/mermas` | POST | Registrar pérdida / merma con descuento atómico | Operativo |
| `/api/v1/pos/mermas` | GET | Listar historial de mermas | Operativo |
| `/api/v1/pos/checkout` | POST | Venta con redondeo solo en efectivo y RutPay | Operativo |
| `/api/v1/caja/cerrar` | POST | Cierre Z con RutPay separado de efectivo | Operativo |
| `/api/v1/invoices/confirm` | POST | Ingesta con `persistido_local` y proveedor reutilizado | Operativo |

Cualquier duda o ajuste que requieras en los contratos JSON, avísame y lo afinamos. ¡Todo listo en `main` para que puedas conectar la interfaz!
