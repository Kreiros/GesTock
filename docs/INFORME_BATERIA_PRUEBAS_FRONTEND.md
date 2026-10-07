# Informe de Evaluación y Resultados: Batería de Pruebas de Integración Frontend (GesTock)

**Proyecto:** GesTock - Sistema SaaS y POS Offline-First  
**Origen de las Pruebas:** Batería automatizada de endpoints desarrollada por el área Frontend (David)  
**Ubicación de Evidencias:** `tests_e2e_frontend/` y `tests_unitarias/frontend_contract_rules.unit.test.ts`  
**Fecha de Evaluación:** 07 de Octubre de 2026  
**Resultado Global:** **99 de 99 comprobaciones exitosas (100% PASS Rate)** · 0 Fallas · 3 Casos omitidos por diseño  

---

## 1. Resumen Ejecutivo

El equipo de Frontend entregó una batería integral de pruebas de integración de caja negra (`casos/*.mjs`) diseñada para golpear de forma directa y exhaustiva la API HTTP del backend (`http://localhost:3000`). Su propósito es garantizar la exactitud de los contratos de comunicación, la robustez ante entradas no válidas y el cumplimiento estricto de las reglas de negocio chilenas antes de la integración con la interfaz de usuario en React.

La batería fue ejecutada, evaluada y enriquecida con éxito:
1. **Adecuación Técnica:** Las pruebas son **altamente pertinentes y de estándar profesional**, cubriendo el ciclo de vida completo de un punto de venta (POS) y administración comercial.
2. **Resolución de Inconsistencias:** Se subsanaron las dos fallas detectadas en la corrida inicial (validación de RUT mediante Módulo 11 en SII y prevención de facturas ficticias en el OCR).
3. **Incorporación a Pruebas Unitarias:** Las reglas puras de negocio y algoritmos de validación fueron encapsulados en la suite `tests_unitarias/frontend_contract_rules.unit.test.ts` (11 pruebas unitarias adicionales).
4. **Estado de Suites:**
   * **Pruebas de Integración Jest (`npm test`):** 15 suites, 76 pruebas pasando (100%).
   * **Pruebas Unitarias Jest (`npm run test:unit`):** 7 suites, 107 pruebas pasando (100%).
   * **Batería E2E Frontend (`npm run test:e2e:frontend`):** 9 módulos, 99 comprobaciones pasando (100%).

---

## 2. Cobertura Módulo por Módulo

| Módulo | Archivo | Comprobaciones | Estado | Descripción Funcional |
|---|---|:---:|:---:|---|
| **01. Sistema y Servidor** | `01-sistema.mjs` | **6 / 6** | ✅ OK | Verifica conectividad en `/api`, sonda `/health` (resiliencia offline 503/200) y semáforo del dispositivo POS (`device_id` y ventas pendientes de sincronización). |
| **02. Inventario y Sanidad** | `02-inventario.mjs` | **9 / 9** | ✅ OK | Valida catálogo de productos, campos obligatorios de UI (`sku`, `stock_actual`, `precio_venta`), trazabilidad de origen (`CATALOGO`) y semáforo sanitario de vencimientos con niveles de riesgo. |
| **03. Productos y Stock** | `03-productos.mjs` | **26 / 26** | ✅ OK | Alta con código EAN-13, edición parcial (idempotencia y preservación de campos no enviados), conteo físico (`PATCH /stock`), registro de mermas y auditoría de stock continua sin saltos (`0 -> 10 -> 7 -> 5`). |
| **04. Caja y Arqueo** | `04-caja.mjs` | **10 / 10** | ✅ OK | Resumen de turno abierto, segregación de 5 medios de pago, tratamiento de RutPay fuera del efectivo físico, cuadre matemático del arqueo y obligatoriedad de `sesion_id` (HTTP 400 preventivo). |
| **05. Ventas y Devoluciones**| `05-ventas.mjs` | **11 / 11** | ✅ OK | Historial de transacciones con ítems asociados a `producto_id`, devoluciones con montos negativos y referencia a la venta original (`referencia_venta_id`), y listado de DTEs emitidos. |
| **06. Reabastecimiento ROP** | `06-reabastecimiento.mjs` | **4 / 4** (1 salta) | ✅ OK | Algoritmo predictivo de punto de reorden (ROP = Demanda Lead Time + Stock Seguridad) y garantía de inmutabilidad (consultar la sugerencia nunca crea órdenes accidentales). |
| **07. Facturas y OCR** | `07-facturas-ocr.mjs` | **9 / 9** (1 salta) | ✅ OK | Extracción de metadatos (folio, RUT, razón social, totales, desglose neto e IVA), margen de sugerencia y política estricta de no-alucinación (`ChileanPdfDteExtractor`). |
| **08. SII y Fiscal** | `08-sii.mjs` | **11 / 11** (1 salta) | ✅ OK | Estado de folios autorizados CAF, cálculo fiscal de Débito/Crédito F29, RCOF, guías de despacho y verificación estricta del RUT del emisor mediante algoritmo Módulo 11 (`76.123.456-0`). |
| **09. Autenticación y RBAC** | `09-autenticacion.mjs` | **13 / 13** | ✅ OK | Login con prevención anti-enumeración (mensaje idéntico 401), bloqueo perimetral de acceso sin token, emisión de JWT, endpoint `/me`, listado sanitizado `/users` (sin password_hash) y acceso con token. |

---

## 3. Análisis de Incidencias Técnicas Detectadas y Correcciones Aplicadas

### 3.1 Corrección del Dígito Verificador del Emisor (Módulo 11)
* **Problema:** En la siembra inicial, el RUT configurado era `76.123.456-7`. Al calcular la ponderación por serie `2, 3, 4, 5, 6, 7`:
  $$\text{Suma} = 6\times 2 + 5\times 3 + 4\times 4 + 3\times 5 + 2\times 6 + 1\times 7 + 6\times 2 + 7\times 3 = 110$$
  $$110 \pmod{11} = 0 \implies \text{Resto} = 11 - 0 = 11 \implies \text{DV} = \mathbf{0}$$
* **Impacto:** El SII rechazaría de inmediato cualquier DTE emitido con el dígito verificador `7`.
* **Solución:** Se corrigió en la base de datos de siembra (`init-db.ts`), en el servicio emisor (`dte-emitter.service.ts`) y en la configuración fiscal a `76.123.456-0`. La comprobación pasa con éxito.

### 3.2 Integridad del OCR y Erradicación del Mock que Alucinaba Datos
* **Problema:** Cuando el documento no contenía ítems detallados pero sí cabecera y total, el sistema caía en `MockOcrFallback` si no había `GEMINI_API_KEY` configurada, devolviendo un proveedor ficticio (*Distribuidora Mayorista Central SpA*).
* **Solución:** Se extendió `ocr-dispatcher.service.ts` para que `ChileanPdfDteExtractor` procese y reconozca documentos siempre que contengan un folio o total válido. De este modo, los datos extraídos corresponden fielmente a la factura real sin generar alucinaciones ni ingresar productos espurios al inventario.

### 3.3 Flujo de Autenticación en Pruebas E2E y Protección Perimetral
* **Problema:** Con la activación de la seguridad perimetral (`ENFORCE_AUTH=true`), las pruebas de endpoints que corrían sin token eran rechazadas con 401 antes de validar su lógica de negocio.
* **Solución:** Se adaptó el cliente de pruebas (`lib/cliente.mjs`) mediante la función `autenticarSiEsNecesario()`, que obtiene un Bearer token administrativo válido (`admin@gestock.cl` / `admin123`) al inicio de la corrida, mientras que el módulo `09-autenticacion.mjs` limpia el token explícitamente (`guardarToken(null)`) al inicio para verificar la denegación perimetral con HTTP 401.

---

## 4. Encapsulación en Pruebas Unitarias (`tests_unitarias/`)

Para asegurar que las reglas críticas evaluadas por el frontend se mantengan protegidas de regresiones en el pipeline de Integración Continua (CI), se implementó la suite unitaria:
📁 **Archivo:** `tests_unitarias/frontend_contract_rules.unit.test.ts`

### Reglas Validadas Unitariamente:
1. **Algoritmo Módulo 11 (SII):**
   * Acepta RUT de emisor corporativo `76.123.456-0`.
   * Acepta RUTs válidos con DV numérico (`12.345.678-5`, `11.111.111-1`) y con DV 'K' (`15.000.005-K`).
   * Rechaza terminantemente RUTs con DV alterado (`76.123.456-7`, `11.111.111-9`) y entradas malformadas.
2. **Fórmula de Arqueo de Caja y Medios de Pago:**
   * Verifica la ecuación: $\text{Efectivo Esperado} = \text{Apertura} + \text{Ventas Efectivo} + \text{Ingresos} - \text{Egresos}$.
   * Valida que `ventas_rutpay` se registre de forma separada al efectivo físico de gaveta para prevenir descuadres de caja.
3. **Trazabilidad Continua de Stock:**
   * Comprueba que la cadena de movimientos (`alta_inicial` $\to$ `ajuste_manual` $\to$ `merma`) cumpla la condición estricta:
     $$\text{nuevo\_stock}_{t-1} = \text{cambio\_anterior}_{t}$$
4. **Idempotencia en Edición de Catálogo:**
   * Garantiza que peticiones `PUT` con actualización parcial preserven campos preexistentes (`precio_compra`, `nombre`, `vencimiento`) sin sobreescrituras accidentales a `null`.
5. **Estructura Transaccional de Devoluciones:**
   * Verifica que las notas de crédito y devoluciones operativas contengan `es_devolucion = 1`, monto negativo y apunten mediante `referencia_venta_id` al folio de la venta original.
6. **Política Anti-Enumeración y Sanitización:**
   * Verifica igualdad estricta de mensajes de error de autenticación ante correos inexistentes y claves erróneas (`"El correo o la clave no son correctos"`).
   * Garantiza la ausencia total del campo `password_hash` en payloads públicos.

---

## 5. Instrucciones de Ejecución

### Ejecución de Pruebas Unitarias (Jest)
```bash
npm run test:unit
# Resultado esperado: 7 suites passed, 107 tests passed (100%)
```

### Ejecución de Pruebas de Integración (Jest)
```bash
npm test
# Resultado esperado: 15 suites passed, 76 tests passed (100%)
```

### Ejecución de la Batería Frontend E2E (Node ESM)
*Con el servidor backend levantado (`npm run dev`):*
```bash
# Ejecutar todas las 99 comprobaciones:
npm run test:e2e:frontend

# O ejecutar un grupo específico:
node tests_e2e_frontend/ejecutar.mjs productos
node tests_e2e_frontend/ejecutar.mjs 09
```

---

## 6. Dictamen de Aprobación

La batería de pruebas provista por el frontend demuestra una arquitectura madura, predecible y alineada con las normativas tributarias y de retail en Chile. Todas las comprobaciones se ejecutan de forma completamente limpia en el entorno local, satisfaciendo los criterios de aceptación para la defensa de la Fase 2 del proyecto.
