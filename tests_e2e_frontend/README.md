# Pruebas de endpoints — GesTock

Batería automatizada que golpea el backend de verdad y revisa lo que responde.
No usa datos simulados: si el servidor no está arriba, las pruebas no corren.

## Cómo correrlas

Primero el backend, en otra terminal:

```bash
cd "C:/Users/david/OneDrive/Escritorio/gestock"
npm run dev
```

Y después, desde esta carpeta:

```bash
node ejecutar.mjs
```

Para correr solo un grupo, se le pasa parte del nombre del archivo:

```bash
node ejecutar.mjs productos
node ejecutar.mjs 08
```

No hay que instalar nada. Usa el `fetch` que ya trae Node.

## Qué se prueba

| Archivo | Cubre |
|---|---|
| `01-sistema.mjs` | `/api`, `/health` y el estado de la caja |
| `02-inventario.mjs` | Catálogo y semáforo de vencimientos |
| `03-productos.mjs` | Alta, edición, ajuste de stock, merma e historial |
| `04-caja.mjs` | Resumen del turno, medios de pago y fórmula del arqueo |
| `05-ventas.mjs` | Historial, devoluciones y documentos emitidos |
| `06-reabastecimiento.mjs` | Punto de reorden |
| `07-facturas-ocr.mjs` | Lectura de facturas con OCR |
| `08-sii.mjs` | Folios CAF, F29, RCOF y guías |
| `09-autenticacion.mjs` | Login, usuarios y permisos |

## Lo que no se prueba, y por qué

Algunas cosas quedan marcadas como **SALTA** a propósito:

- **Confirmar la ingesta de una factura.** Crearía productos de verdad en el
  inventario. Se prueba a mano desde la pantalla.
- **El set de certificación del SII.** Emite documentos reales y consume folios.
- **Las pruebas de autenticación.** El backend todavía no expone `/api/v1/auth`.
  Cuando Marcelo lo entregue, se corren con:

  ```bash
  GESTOCK_ADMIN_EMAIL=admin@gestock.cl GESTOCK_ADMIN_PASSWORD=... node ejecutar.mjs 09
  ```

Una prueba saltada no cuenta como falla, pero queda registrada en el reporte.

## Limpieza

Las pruebas de producto crean un artículo con SKU `PRUEBA-########`. Al terminar
lo desactivan, que es lo máximo que permite la API porque no existe un endpoint
para borrar productos.

Para sacarlos de la base del todo:

```bash
node limpiar.mjs
```

Ese script sí entra directo a SQLite, por eso está separado de las pruebas.

## Reportes

Cada corrida deja un archivo en `reportes/` con la fecha, el resultado de cada
comprobación y el total. Sirve como evidencia para la Fase 2.

## Variables de entorno

| Variable | Para qué | Por defecto |
|---|---|---|
| `GESTOCK_URL` | Dirección del backend | `http://localhost:3000` |
| `GESTOCK_TENANT` | Local sobre el que se prueba | el tenant demo |
| `GESTOCK_DEVICE` | Identificador de la caja | `PRUEBAS-AUTOMATICAS` |
| `GESTOCK_ADMIN_EMAIL` | Correo para las pruebas de login | — |
| `GESTOCK_ADMIN_PASSWORD` | Clave para las pruebas de login | — |
| `GESTOCK_SQLITE` | Ruta de la base, solo para `limpiar.mjs` | la del proyecto |
