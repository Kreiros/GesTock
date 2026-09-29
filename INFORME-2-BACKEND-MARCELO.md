# GesTock — Informe 2 para Marcelo
### Hallazgos del backend detectados construyendo el frontend

**Fecha:** 27 de septiembre de 2026
**De:** David (frontend)
**Continúa el informe anterior.** Acá va sólo lo nuevo, más un anexo al final con lo del primer informe que sigue abierto.

Todo lo que está acá lo verifiqué leyendo el código del backend y/o consultando la base SQLite, no es suposición. Donde hay evidencia, la dejo.

---

## Contexto: qué se construyó desde el informe anterior

Pantallas terminadas en este período, todas en modo visual y modo técnico:

| Pantalla | Ruta |
|---|---|
| Proveedores | `/proveedores` |
| Dashboard y analítica | `/dashboard` |
| Configuración | `/configuracion` |
| Notificaciones | `/notificaciones` |
| Historial / Registro de Ventas | `/ventas` |
| Respaldo Facturas y SII | `/sii` |
| Reabastecimiento ROP | `/reabastecimiento` |

Más arreglos grandes a Caja POS, Inventario y Cierre de Caja.

**Ya no queda ninguna pantalla pendiente en el menú.**

---

## PRIORIDAD 1 — Bugs que ensucian datos o bloquean el uso

### 1.1 `GET /replenishment/suggest` escribe en la base de datos

Es el hallazgo más importante del informe.

**Qué pasa:** `generateSuggestedOrders()` hace `INSERT INTO purchase_orders` por cada proveedor **en cada llamada**. Como la ruta es un `GET`, cualquier pantalla que consulte el ROP va dejando filas.

**Archivo:** `backend/src/replenishment/replenishment.service.ts`, líneas ~377 y ~394 (inserta en SQLite y en PostgreSQL).
**Ruta afectada:** `routes/replenishment.routes.ts` línea 119.

**Evidencia:** en la base local hay **268 órdenes de compra acumuladas**, todas generadas por abrir pantallas durante el desarrollo. Entre dos mediciones separadas por una hora de trabajo pasó de 238 a 268.

**Consecuencias:**
- `GET /replenishment/purchase-orders` no sirve para saber cuándo se le pidió de verdad a un proveedor. La "última orden" que muestra la ficha del proveedor es en realidad la última vez que alguien abrió una pantalla.
- La tabla crece sin control.

**Qué haría yo:** que el `GET` sólo calcule y devuelva, y que la persistencia quede en el `POST /replenishment/suggest`, que ya existe y hoy no se usa.

**Mitigación que ya hice en el frontend:** la consulta se cachea 5 minutos, así navegar entre pantallas deja de disparar inserciones. Es un parche, no la solución.

---

### 1.2 El redondeo de la Ley 20.956 se aplica a todos los medios de pago

**Sigue abierto desde el informe anterior y ahora molesta más**, porque el frontend ya quedó correcto: el ticket muestra un monto y el backend guarda otro.

**Archivo:** `backend/src/routes/pos.routes.ts` línea 128.

```ts
total = aplicarRedondeoChileno(total);   // ← antes de mirar el método de pago
```

La Ley 20.956 rige **sólo para efectivo**, porque el problema es que no existen monedas de $1 ni $5. Con tarjeta o transferencia se cobra el monto exacto.

**Reproducción:** venta de Papas Fritas a $1.899 con TRANSBANK → la pantalla muestra $1.899, el backend guarda $1.900. Verificado en base: `detalle_venta.subtotal = 1899` pero `transacciones_venta.total = 1900`.

**Arreglo:** una línea, aplicar el redondeo sólo si `metodo_pago === 'EFECTIVO'`.

Mientras tanto el POS muestra un aviso al cajero cuando el monto va a diferir.

---

### 1.3 El RUT del emisor sembrado es inválido

`76.123.456-7` no pasa la validación de módulo 11 (el dígito verificador debería ser **0**, no 7).

Ese RUT va dentro de **cada XML DTE que se emite**, así que el SII lo rechazaría en producción.

**Dónde:** `configuracion_sistema`, clave `sii_rut_emisor`.

La pantalla de Configuración ahora lo avisa y permite corregirlo, pero conviene arreglarlo también en la siembra.

---

### 1.4 El límite de peticiones es muy bajo y es por IP

**Archivo:** `backend/src/middleware/security.middleware.ts` línea 37.

```ts
windowMs: 15 * 60 * 1000,   // 15 minutos
max: 300                    // 20 peticiones por minuto
```

Un POS refresca estado todo el rato por definición. Con el frontend como estaba se topaba el límite y el sistema respondía 429 a todo, dejándolo inutilizable por minutos.

**Ya lo mitigué en el frontend** (bajé el tráfico sostenido de ~11 a 4 peticiones por minuto), así que hoy alcanza de sobra. Pero quedan dos cosas:

1. 300 cada 15 minutos queda justo si se agregan más pantallas.
2. **Más serio: el límite es por IP.** Si el local tiene dos o tres cajas detrás del mismo router, todas salen con la misma IP pública y **se bloquean entre ellas** — una caja vendiendo deja sin servicio a la otra.

**Qué haría yo:** limitar por `X-Tenant-ID` o por `device_id`, no por IP. Y subir bastante el `max`.

---

## PRIORIDAD 2 — Respuestas a las que les faltan campos

Son endpoints que funcionan, pero no devuelven datos que sí están en la base y que el frontend necesita.

### 2.1 `GET /pos/transactions`

**Archivo:** `routes/pos.routes.ts` línea 495.

| Falta | Por qué importa |
|---|---|
| `LIMIT 100` fijo, sin paginación ni filtros | El historial real se pasa de 100 ventas en pocos días. Hoy los filtros de la pantalla trabajan sólo sobre esas 100 y lo aviso en pantalla. |
| `es_devolucion` y `referencia_venta_id` | Las columnas **existen en la tabla** pero no salen en el SELECT. Hoy reconozco una devolución por el prefijo `DEV-` del folio y el monto negativo, y **no puedo mostrar a qué venta anula** cada nota de crédito. |
| `producto_id` en los ítems | `POST /pos/devolucion` lo exige, pero el listado sólo entrega el SKU. Tengo que cruzarlo contra `/pos/inventory` para poder hacer una devolución parcial. |
| `rut_cliente` y `tipo_documento_tributario` | Ambos están en la tabla. |

Lo más barato de todo: agregar esas columnas al SELECT.

### 2.2 `GET /pos/inventory`

Sigue sin devolver `proveedor_id` (sólo `proveedor_nombre`), así que el cruce proveedor↔producto se hace por nombre.

---

## PRIORIDAD 3 — Endpoints que faltan

Cosas que quedaron sin construir en el frontend **porque no hay a qué apuntar**.

| Falta | Qué bloquea |
|---|---|
| **Crear / editar productos** | No existe ningún POST/PUT/DELETE de productos. El botón "Añadir producto" del Inventario está deshabilitado. El catálogo sólo se escribe por siembra, ingesta OCR, checkout y sync. Tuve que insertar productos a mano en SQLite para poder probar ILA, bolsa reutilizable y redondeo. |
| **Escribir `lote` y `fecha_vencimiento`** | Verificado con grep en todo el backend: esos campos **sólo aparecen en SELECT**. El backend sabe leerlos y tiene toda la lógica del semáforo FEFO lista, pero nada los escribe. Las alertas sanitarias sólo cubren lo que cargué a mano. |
| **Crear / editar una orden de compra** | Sólo las genera el algoritmo. El pedido por WhatsApp no queda registrado en ninguna parte. |
| **Recepción de mercadería contra una orden** | La mercadería entra por la ingesta OCR sin vincularse a la orden que la originó. |
| **Anular una venta** | Sólo existe devolución con nota de crédito. |
| **Listar devoluciones** | `POST /pos/devolucion` existe, pero no hay ningún `GET`. |
| **Mermas** | No existe nada de mermas en todo el sistema. |
| **Tabla de notificaciones** | No hay dónde registrar que una alerta fue leída. El "visto" de la pantalla de Notificaciones se guarda sólo en el equipo. |
| **Estado borrador/pendiente en facturas** | `factura_ingresos` nace siempre `PROCESSED`, así que no se puede avisar "factura por revisar". |
| **Filtro por período en `GET /invoices/`** | Se muestran todas. |
| **Ajuste manual de stock** | Bloquea "Modo Conteo Físico" y "Auditoría express". |

---

## PRIORIDAD 4 — Endpoints que responden éxito sin hacer nada

Estos son delicados porque **el usuario cree que la acción se ejecutó**.

### 4.1 `POST /dte/send-email`
Sólo hace `logger.info` y responde éxito. No despacha ningún correo.

### 4.2 `sendPurchaseOrdersBatchEmail` (usado por `POST /replenishment/send-email`)
**Archivo:** `replenishment/replenishment.service.ts` línea ~442.

```ts
logger.info('ReplenishmentService', `Simulating automated dispatch of purchase orders email to: ${recipientEmail}`, ...)
```

Marca las órdenes como `estado = 'enviada'` en la base y responde *"Órdenes de compra enviadas automáticamente a…"*, pero no manda nada.

**Probado:** el botón respondió *"Órdenes de compra enviadas automáticamente a pedidos@almacendontito.cl (2 órdenes, 3 productos, Total: $70.950)"* y en la base se crearon 2 filas en estado `enviada`. Ningún correo salió.

En ambos casos el frontend ahora lo advierte explícitamente. Si se va a implementar el envío real, avísame y saco los avisos.

---

## Lo que está a medias en el módulo SII

Esta parte está **mucho más completa de lo que esperaba** — los 7 bloques de la pantalla de Respaldo SII tienen endpoint real y funcionan. Lo que falta para que sirva en producción:

| Tema | Estado |
|---|---|
| **Envío al SII** | No existe. Todos los documentos quedan en `EMITIDO_LOCAL` y los RCOF en `PENDIENTE`. La emisión, firma XMLDSig y timbrado TED sí funcionan. |
| **CAF reales** | `getOrCreateActiveCaf()` llama a `provisionTestCaf()` cuando no encuentra folios, así que los rangos 1–5000 son autogenerados, no vienen de un archivo del SII. `POST /dte/caf/upload` sí sabe importar un CAF real desde su XML — no le hice pantalla porque sin un archivo real no hay cómo probarla. |
| **Tasa PPM** | Viene fija en 1% (parámetro `tasaPpm` de `GET /dte/f29`). No hay dónde configurarla por tenant. |
| **Libro de compras/ventas y envío del RCV** | No existe, sólo la pre-liquidación F29. |
| **Marcar qué factura entró en qué F29** | `factura_ingresos` guarda `PROCESSED` y nada más. |

---

## Inconsistencias de convención

**Las rutas de `/dte/*` leen `tenantId` (camelCase), el resto del backend lee `tenant_id` (snake_case).**

El frontend lo maneja con excepciones explícitas por endpoint, pero es una fuente segura de bugs para quien venga después. Conviene unificar.

---

## Cosas del backend que descubrí que YA funcionaban y nadie usaba

Esto es en positivo: había harto trabajo hecho que no estaba conectado.

- **`POST /dte/config` acepta `modeloEmision` y los 9 campos del emisor.** El frontend decía "no hay endpoint para editar esto" — era falso. Ya está conectado.
- **`GET /dte/config` devuelve un bloque `pciDssCompliance`** que nadie leía. Ahora alimenta una sección de Configuración.
- **`GET /dte/f29`** arma una pre-liquidación muy completa: separa débito y crédito fiscal, contabiliza los vouchers de tarjeta por Res. 176 y resta las notas de crédito. Estaba sin usar.
- **`POST /pos/devolucion`** está muy bien hecho: repone stock, escribe `movimientos_inventario`, inserta la transacción `DEV-` y emite la NC tipo 61 con nodo `<Referencia>`. Soporta devolución parcial. Nunca se había usado.
- **`POST /dte/certification/run-set`** corre el set de prueba de la Res. 74 completo y los 4 casos pasan. Sirve directo para la defensa.

---

## ANEXO — Del primer informe, qué sigue abierto

Verificado hoy contra el código:

| Hallazgo | Estado |
|---|---|
| No hay endpoint para crear/editar productos | **Sigue abierto** |
| `lote` y `fecha_vencimiento` nunca se escriben | **Sigue abierto** |
| Redondeo aplicado a todos los medios de pago | **Sigue abierto** (ver 1.2) |
| RutPay se cuenta como EFECTIVO en el cierre de caja | **Sigue abierto** — `caja/cierre-caja.service.ts` línea 219: el `else` final mete RutPay en efectivo |
| `/pos/status` no cuenta los cierres de caja pendientes | **Sigue abierto** — hoy la base tiene 14 ventas + 3 cierres sucios, y el endpoint reporta 14 |
| `GEMINI_API_KEY` no configurada | **Sigue abierto** — el OCR real no se puede probar, corre siempre el fallback |
| `/dte/:id/receipt` rotula mal todo lo que no sea boleta | **Sigue abierto** — línea 231, el ternario sólo cubre 39 y 41 y manda el resto como "NOTA DE CRÉDITO". Hay workaround en el frontend |
| `/dte/:id/receipt` no devuelve el ILA | **Sigue abierto** — el ILA se deduce en el frontend restando |
| `POST /dte/send-email` es simulación | **Sigue abierto** (ver 4.1) |
| Dashboard sin período semanal | **Sigue abierto** — sólo `diario \| mensual \| historico` |
| El día corta a medianoche UTC (21:00 en Chile) | **Sigue abierto** — el frontend lo avisa con un chip |
| `/pos/inventory` sin `proveedor_id` | **Sigue abierto** (ver 2.2) |
| Bug de parámetros undefined en el ROP | **Resuelto con workaround en el frontend** (se mandan siempre los 3 parámetros explícitos) |
| No hay webhooks, EDI ni WhatsApp Cloud API | **Sigue abierto** — el único canal es el correo, y está simulado |

---

## Sugerencia de orden para atacarlo

Si tuviera que priorizar:

1. **`GET /replenishment/suggest` que no escriba** (1.1) — es el que ensucia datos.
2. **Redondeo sólo para efectivo** (1.2) — una línea, y hoy el ticket y la base no coinciden.
3. **Columnas faltantes en `/pos/transactions`** (2.1) — barato y desbloquea harto.
4. **Rate limiter por tenant en vez de por IP** (1.4) — si no, con dos cajas no funciona.
5. **RutPay en el cierre de caja** — desordena el arqueo de cualquier local que lo use.
6. **CRUD de productos** (Prioridad 3) — es lo que más limita hoy el uso real del sistema.

Cualquier cosa que arregles, avísame y lo conecto de inmediato: varias pantallas ya tienen el espacio hecho, sólo esperando el endpoint.
