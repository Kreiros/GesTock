# GesTock — Cosas del backend que bloquean el frontend

**De:** David Miranda (Frontend)
**Para:** Marcelo Pino (Backend / BD / QA)
**Fecha:** 23-09-2026

Todo lo de abajo lo verifiqué leyendo el código de `back-end/backend/src` el 23-09-2026.
Ninguna pantalla se detuvo por esto: las construí igual, mostrando la limitación de forma
transparente en la interfaz (botones deshabilitados con tooltip, notas al pie, etc.).
Pero si quieres que el sistema haga estas cosas de verdad, el cambio va de tu lado.

---

## 1. BUGS — cosas que hoy funcionan mal

### 1.1 Ventas con RutPay se cuentan como efectivo (rompe el arqueo)

**Archivo:** `backend/src/caja/cierre-caja.service.ts`, función `obtenerResumenTurnoActual` (~línea 212)

El código solo distingue explícitamente TRANSBANK, MERCADOPAGO y SUMUP. Todo lo demás cae en el `else` final:

    } else {
      efectivo += monto; // Default Efectivo
    }

Como RutPay es una pasarela soportada por el sistema, cada venta con RutPay se suma al efectivo esperado. Resultado: el cajero cuenta la plata real, le falta esa diferencia, y el cierre marca un faltante que no existe.

**Fix sugerido:** agregar el caso RUTPAY (y dejar el `else` para EFECTIVO explícito, o loguear una advertencia si llega una pasarela desconocida).

En la pantalla de Cierre de Caja dejé un tooltip en "Efectivo" avisando esto.

---

### 1.2 El redondeo de la Ley 20.956 se aplica a TODOS los medios de pago

**Archivo:** `backend/src/routes/pos.routes.ts`, línea ~128

    total = aplicarRedondeoChileno(total);

Esa línea está antes de mirar el `metodo_pago`, así que se ejecuta siempre. La Ley 20.956 solo aplica a pagos en **efectivo** — en débito, crédito o transferencia hay que cobrar el monto exacto.

Es un tema legal, no solo cosmético: estamos redondeando montos en pagos electrónicos.

**Fix sugerido:** aplicar el redondeo solo cuando el medio de pago sea efectivo.

---

### 1.3 Catch que responde 200 aunque no haya guardado nada

**Archivo:** `backend/src/invoices/invoice-ingestion.service.ts`, líneas ~456 y ~504

    } catch (sqliteErr) {
      logger.warn('InvoiceIngestion', 'Failed to mirror invoice to SQLite local', { sqliteErr });
    }

Si falla la escritura en SQLite, el endpoint igual responde éxito. El frontend no tiene forma de saber que no se guardó nada y le muestra al usuario "factura confirmada".

Esto me pasó de verdad durante las pruebas (ver punto 1.4) y me costó encontrarlo justamente porque la API decía que todo había salido bien.

**Fix sugerido:** que falle de verdad, o que la respuesta traiga un flag tipo `persistido_local: false` para que el frontend pueda avisar.

---

### 1.4 Bug que ya corregí (necesito que lo revises y apruebes)

**Archivo:** `backend/src/invoices/invoice-ingestion.service.ts`, bloque SQLite de `executeIngestTransaction` (~línea 353)

**El problema:** al confirmar una factura de un proveedor que ya existía, el código generaba un `supplierId = uuidv4()` nuevo, pero el `ON CONFLICT (tenant_id, rut_proveedor) DO UPDATE` actualizaba la fila existente **conservando su id viejo**. Después se intentaba insertar en `factura_ingresos` con el id nuevo (que no existe) → `FOREIGN KEY constraint failed`, tragado por el catch del punto 1.3. Confirmar una factura respondía 200 y no guardaba nada.

**El fix:** un `SELECT` previo que reutiliza el id real del proveedor, exactamente igual a lo que el bloque de PostgreSQL ya hacía bien (línea 189). O sea, copié tu propia solución del otro bloque.

Toqué un archivo tuyo, así que revísalo y dime si estás de acuerdo con el enfoque.

---

## 2. FALTAN ENDPOINTS — funcionalidad que no pude construir

Revisé todas las rutas registradas del backend. Estas operaciones no existen en ninguna parte:

### 2.1 No hay forma de crear ni editar productos (el más importante)

No existe `POST /productos`, `PUT /productos/:id` ni nada equivalente. La tabla `productos` solo se escribe desde: la siembra inicial, la ingesta de facturas OCR, el checkout (descuenta stock) y la sincronización.

**Qué significa:** el botón "Añadir Producto" de la pantalla de Inventario está visible pero deshabilitado. No es que no lo haya programado — es que no hay a dónde mandar el dato. Hoy la única forma de que entre un producto nuevo al sistema es subiendo una factura.

Necesitaría como mínimo:

- `POST /pos/products` — crear producto
- `PUT /pos/products/:id` — editar (nombre, categoría, stock mínimo, precios)
- Idealmente `PATCH` para ajuste manual de stock (conteo físico / auditoría)

---

### 2.2 `lote` y `fecha_vencimiento` nunca se escriben

Las columnas existen en la tabla `productos` y toda la lógica del semáforo FEFO está programada y funcionando en `GET /pos/vencimientos` (vencidos, crítico ≤7d, alerta 8-15d, vence 30d). Pero hice grep en todo el backend: esos dos campos **solo aparecen en SELECTs**, nunca en un INSERT ni en un UPDATE.

O sea, el control de vencimientos está a medio construir: sabe leer, pero nadie escribe.

**Dónde debería escribirse:** en la ingesta de facturas (que la factura del proveedor traiga el lote/vencimiento) y/o en la creación/edición manual de productos (punto 2.1).

Para poder mostrarte la pantalla funcionando, cargué fechas de prueba a mano en la SQLite local. **Ojo:** esos datos no están en `init-db.ts`, así que si se borra el archivo `back-end/data/gestock_local_pos.sqlite` se pierden. Si quieres que queden fijos para las demos, habría que agregarlos al seed.

---

### 2.3 No existe registro de mermas

No hay ningún endpoint ni tabla de mermas en todo el sistema. El botón "Registrar Merma" del mockup técnico de inventario no se construyó.

---

### 2.4 Otros endpoints que faltan (menos urgentes)

- **Ajuste manual de stock** (modo conteo físico / auditoría express).
- **Modificación masiva de precios.**
- **Guardar borrador de factura** antes de confirmarla.
- **Re-procesar una factura** con un motor OCR distinto.
- **Ubicación en góndola** (pasillo/nivel) — no existe ese campo en el modelo.
- **Acta SEREMI en PDF** y **impresión térmica** de etiquetas de góndola.

---

## 3. OCR DE FACTURAS — está programado pero apagado

### 3.1 Falta la `GEMINI_API_KEY`

Confirmado: no está en el `.env` del backend. Por eso el OCR siempre cae al motor de respaldo (`mock-ocr.provider.ts`) con datos fijos de prueba, nunca usa la IA real de Google AI Studio.

El código de `gemini-ocr.provider.ts` está completo y el frontend ya está listo — **basta con poner la key en el `.env`, no hay que tocar código en ninguno de los dos lados.**

### 3.2 Riesgo de parseo en la respuesta de Gemini

**Archivo:** `backend/src/ocr/gemini-ocr.provider.ts`, línea 58

    const parsed = JSON.parse(rawText) as ExtractedInvoiceData;

`JSON.parse` directo sobre el texto de Gemini. En la práctica Gemini a veces envuelve el JSON en un bloque de código markdown y eso revienta el parseo.

**Fix sugerido:** usar `responseMimeType: "application/json"` en la config de la llamada a la API (Gemini garantiza JSON limpio), o limpiar el texto antes de parsear.

No lo pude verificar en la práctica justamente porque no hay key para probar.

### 3.3 Datos que el OCR no devuelve (bloquean partes del mockup técnico)

El mockup de "Ingesta DTE & Monitor de API" pedía cosas que el backend hoy no entrega:

1. **El archivo original** (imagen/PDF) — `POST /invoices/scan` no lo guarda ni lo retorna. Sin esto no hay vista previa del documento, y todo el panel de bounding boxes es imposible.
2. **Coordenadas por campo extraído** — habría que pedírselas a Gemini en el prompt.
3. **Porcentaje de confianza** por campo y global — tampoco se pide ni se simula.
4. **`precio_compra` anterior del producto** en `ScannedItemPreview` — hoy esa consulta trae `precio_venta`, `stock_actual` y `codigo_barra`, pero no el costo anterior. Con eso se podría mostrar "el costo subió 4,2% respecto a la última factura". Quedó con un guion.
5. **Duración real de la llamada a Gemini** — `ScannedInvoicePreview` no tiene campo de tiempo.
6. **Tokens consumidos** — vienen en el `usageMetadata` de Gemini, pero no se leen ni guardan.
7. **Condición de pago** (crédito 30 días, vencimiento) — no existe en `ExtractedInvoiceData` ni en `factura_ingresos`.
8. **Costo promedio ponderado (PMP)** — hoy solo se reemplaza el último precio de compra.

---

## 4. COMPROMISOS DEL WORD QUE EL BACKEND AÚN NO CUMPLE

- **JWT / autenticación** — objetivo específico N°3 del Word, no implementado. Acordamos avanzar sin login por ahora, pero para la entrega final hace falta.
- **Alertas por WhatsApp** — el Word promete E-mail *y* WhatsApp; el backend solo tiene correo.
- **Sucursales / múltiples cajas** — no existen en el modelo de datos, todo es un tenant único. Varios mockups asumen "Sucursal Centro #102" / "Caja #04".

---

## 5. COSAS MENORES

- **`transacciones_venta.monto_ila`** existe en el esquema pero `obtenerResumenTurnoActual` no lo suma (el SELECT de la línea 195 no lo incluye). Si queremos mostrar el ILA recaudado del turno, es agregar la columna al SELECT y sumarla. Cambio de 2 líneas.
- **`GET /replenishment/suggest`** devuelve 0 productos críticos aunque hay productos bajo su stock mínimo. **No es un bug** — el algoritmo ROP calcula velocidad de venta desde el historial de `transacciones_venta`, y el tenant demo casi no tiene ventas. Solo lo anoto para que no te asustes si lo ves en una demo: hay que generar ventas de prueba antes.
- **El backend no tiene auto-reload.** `"dev": "ts-node backend/src/index.ts"` no tiene watch ni nodemon, así que hay que matar y levantar el proceso a mano cada vez que se edita un `.ts`. Me hizo perder un rato pensando que mi fix no funcionaba. Si le agregas `tsx watch` o `nodemon` nos ahorramos eso.
- **Aclaración conceptual (no requiere código):** "Firma Electrónica TED / Válida SII" no aplica a una factura que *recibimos* de un proveedor — el TED es del documento que nuestro propio negocio *emite*. El mockup mezcló el módulo de ingesta OCR con el de emisión DTE.

---

## 6. LO QUE SÍ FUNCIONA BIEN (para que conste)

Probado de punta a punta contra el backend real, verificando en la base de datos y no solo confiando en la respuesta de la API:

- `POST /pos/checkout` — ventas completas con ILA, redondeo, RUT cliente.
- `GET /pos/inventory` — trae precio_compra + precio_venta + proveedor, permite calcular margen real por producto.
- `GET /pos/vencimientos` — el semáforo FEFO calcula perfecto (cuando hay fechas cargadas).
- `POST /caja/abrir`, `/caja/movimiento`, `/caja/cerrar` — cierre de caja completo, probado con turno real: apertura $50.000, venta $2.000, egreso $1.000, arqueo $51.000, cuadratura exacta, verificado en `cierres_caja` (estado CERRADA, diferencia 0).
- `POST /invoices/scan` y `/invoices/confirm` — funcionan bien después del fix del punto 1.4.
- `GET /replenishment/suggest` — el algoritmo ROP está correcto.
- **`POST /suppliers` y `PUT /suppliers/:id` existen** — así que la pantalla de Proveedores sí la voy a poder construir completa cuando lleguemos a ella.

---

## Resumen: qué necesito de ti, por prioridad

| # | Qué | Por qué urge |
|---|-----|--------------|
| 1 | Endpoint para crear/editar productos | Es el hueco más grande. Sin esto el local no puede dar de alta un producto salvo por factura. |
| 2 | Escribir `lote` y `fecha_vencimiento` | Toda la lógica FEFO ya está hecha y no se puede usar. |
| 3 | Arreglar RutPay en el cierre de caja | Genera descuadres falsos en el arqueo. |
| 4 | Redondeo solo en efectivo | Tema legal (Ley 20.956). |
| 5 | Poner la `GEMINI_API_KEY` | Desbloquea el OCR real sin tocar una línea de código. |
| 6 | Revisar mi fix del `supplierId` | Toqué un archivo tuyo, necesito tu visto bueno. |

---

## 🧭 Nexo de Conocimiento
* **Volver al Hub:** [[01 - PROYECTOS/GesTock/INDEX.md|Index GesTock]]
* **MOC Central:** [[00 - HUB & DASHBOARD/🧭 MOC_CENTRAL_NEXO_DE_DATOS.md|🧭 MOC Central Nexo de Datos]]
