# Historial de Misiones - GesTock

## Misión: revisa esto, no estaba todo listo como dijiste. Arregla toda lo que dice que falta este archiv
- **Fecha:** 2026-10-01 00:16:00
- **Líder:** Martín Bravo (Ingeniero de Backend y APIs) & Valentina Ríos (Líder de Equipo)
- **Departamento:** BACKEND
- **Modalidad:** Modalidad 1 (Despacho desde Oficina Virtual con Ejecución Antigravity Core)
- **Descripción:** Resolución completa de los puntos señalados por David en VERIFICACION-RESPUESTA-MARCELO.txt (HTTP 500 en POS, FEFO en facturas, persistencia en GET suggest)
- **Archivos Involucrados:** `backend/src/routes/pos.routes.ts`, `backend/src/routes/replenishment.routes.ts`, `backend/src/invoices/invoice-ingestion.service.ts`, `backend/src/ocr/types.ts`, `backend/src/ocr/gemini-ocr.provider.ts`, `backend/src/ocr/mock-ocr.provider.ts`, `backend/src/database/sqlite/migrations/001_initial_schema.sql`, `backend/src/database/postgres/migrations/001_initial_schema.sql`

### Insumos y Archivos de Contexto Proporcionados por el Usuario
- **Archivo:** `VERIFICACION-RESPUESTA-MARCELO.txt` | **Tamaño:** 6.7 KB | **Tipo:** text/plain

### Acciones Reales Ejecutadas y Validadas
1. **POST `/api/v1/pos/products`**: Corrección de CHECK constraint (`tipo_movimiento = 'ajuste'`), manejo de nulos y envoltorio en transacción atómica (`sqlite.withTransaction`).
2. **PUT `/api/v1/pos/products/:id`**: Blindaje contra valores `undefined` en bindings de SQLite y PostgreSQL pasando `?? null`.
3. **PATCH `/api/v1/pos/products/:id/stock`**: Cambio de `'ajuste_manual'` a `'ajuste'`, corrección de `datetime("now")` a `datetime('now')` y transacción atómica.
4. **POST `/api/v1/pos/mermas`**: Corrección de `datetime("now")` a `datetime('now')`, `tipo_movimiento = 'ajuste'` con detalle explicativo y creación de tabla `mermas` en migraciones.
5. **FEFO en Facturas (`/invoices/confirm`)**: Extensión de interfaces OCR y guardado de `lote` y `fecha_vencimiento` en `productos` tanto en SQLite como en PostgreSQL.
6. **GET `/replenishment/suggest`**: Inyección de `persist: false` para asegurar idempotencia total sin inserciones espurias en `purchase_orders`.
7. **Pruebas y Verificación**: Compilación TypeScript limpia (`tsc`) y ejecución de 87 pruebas unitarias aprobadas al 100% (`npm run test:unit`).
8. **Git Commit**: Commit `30f4975` registrado en rama `main`.

## Misión: auditoría integral del proyecto y corrección de hallazgos de backend
- **Fecha:** 2026-10-07
- **Departamento:** BACKEND
- **Descripción:** Escaneo completo (compilación, lint, build, Jest, E2E contra servidor real y contraste de contratos frontend/backend) y corrección de los hallazgos de backend. Los hallazgos de frontend se entregaron a David en un documento aparte.
- **Archivos Involucrados:** `backend/src/middleware/security.middleware.ts`, `backend/src/routes/auth.routes.ts`, `backend/src/database/init-db.ts`, `backend/src/config/auth.config.ts`, `backend/src/index.ts`, `docker-compose.yml`, `.env.example`, `.gitignore`, `package.json`, `package-lock.json`

### Acciones Reales Ejecutadas y Validadas
1. **RBAC del cajero**: el cajero recibía HTTP 403 en vistas permitidas (comprobante de venta, historial de ventas, reporte Z). Se habilitan solo las rutas DTE del comprobante (`GET /dte/config`, `GET /dte/list`, `GET /dte/:id/receipt`, `GET /dte/:id/xml`, `POST /dte/send-email`).
2. **Aislamiento multi-tenant**: `rbacAuthMiddleware` rechaza con 403 peticiones cuyo tenant declarado difiere del token; `/auth/register` y `/auth/users` usan siempre el tenant del token; el `usuario_id` del body se reemplaza por el del usuario autenticado.
3. **Siembra de usuarios**: el arranque ya no restablece contraseñas; cuentas demo solo fuera de producción; administrador inicial por `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`. Corregidos el hash inválido del cajero en el parche de arranque y el choque de `id` entre admin y cajero en PostgreSQL.
4. **Cambio de contraseña**: nuevo `PUT /api/v1/auth/password`.
5. **Secreto JWT**: centralizado en `auth.config.ts`; el servidor no arranca en producción sin un `JWT_SECRET` propio de 32+ caracteres.
6. **Dependencias**: `npm audit fix` (0 vulnerabilidades en producción) y Jest actualizado a v30.
7. **Repositorio limpio**: se dejan de versionar `AGENTS.md`, notas `*-MARCELO.*`, el `.docx` de la raíz y los reportes E2E generados.
8. **Pruebas y Verificación**: `tsc` limpio; 81 pruebas de integración y 126 unitarias aprobadas; batería E2E 81/81 contra servidor real.
9. **Git Commit**: Commit `8653b2f` registrado y publicado en la rama `main` de `Kreiros/GesTock`.
10. **Evidencias de Título**: sincronizadas las carpetas `Backend/` y `Frontend/` de `Evidencias de sistema` con el estado del repositorio (1 archivo nuevo, 24 actualizados, 0 eliminados).

