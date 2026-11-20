import http from 'http';
import app from '../../src/index';
import { initializeDatabase } from '../../src/database/init-db';
import { defaultSqliteClient } from '../../src/database/sqlite/client';
import { defaultDteEmitter } from '../../src/dte/dte-emitter.service';
import { ItemDTE, TipoDTE } from '../../src/dte/types';

const TENANT = '00000000-0000-0000-0000-000000000001';
const USUARIO = '00000000-0000-0000-0000-000000000002';

/** Lee un numero de un nodo del XML; 0 si el nodo no esta. */
function nodo(xml: string, nombre: string): number {
  const m = new RegExp(`<${nombre}>([^<]*)</${nombre}>`).exec(xml);
  return m ? Number(m[1]) : 0;
}
function todos(xml: string, nombre: string): number[] {
  return [...xml.matchAll(new RegExp(`<${nombre}>([^<]*)</${nombre}>`, 'g'))].map((m) => Number(m[1]));
}

/** Lo que valida el SII sobre el XML firmado, no sobre el calculo interno. */
function cuadraElXml(xml: string) {
  const totales = /<Totales>(.*?)<\/Totales>/.exec(xml)![1];
  const suma = nodo(totales, 'MntNeto') + nodo(totales, 'IVA') + nodo(totales, 'MntExe') + todos(totales, 'MontoImp').reduce((a, b) => a + b, 0);
  return { suma, total: nodo(totales, 'MntTotal'), detalle: todos(xml, 'MontoItem').reduce((a, b) => a + b, 0) };
}

function item(nombre: string, precioUnitario: number, cantidad = 1, extra: Partial<ItemDTE> = {}): ItemDTE {
  return { nroLinea: 1, nombre, cantidad, precioUnitario, subtotal: precioUnitario * cantidad, ...extra };
}

describe('Documento tributario que cuadra y escrituras del catalogo solo para el administrador', () => {
  let servidor: http.Server;
  let base: string;
  let tokenAdmin = '';
  let tokenCajero = '';
  const productoId = 'cccccccc-0000-4000-8000-000000000c01';

  const pedir = async (metodo: string, ruta: string, cuerpo?: unknown, token?: string) => {
    const res = await fetch(`${base}/api/v1${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    });
    const texto = await res.text();
    let json: any = texto;
    try {
      json = JSON.parse(texto);
    } catch {
      // respuesta sin json
    }
    return { status: res.status, json };
  };
  const producto = () =>
    defaultSqliteClient.queryOne<{ precio_venta: number; stock_actual: number }>(
      'SELECT precio_venta, stock_actual FROM productos WHERE id = ?',
      [productoId]
    )!;

  beforeAll(async () => {
    await initializeDatabase();
    defaultSqliteClient.execute(
      `INSERT OR REPLACE INTO productos (id, tenant_id, sku, nombre, stock_actual, stock_minimo, precio_compra, precio_venta, activo)
       VALUES (?, ?, 'CUADRA-1234', 'Producto de 1.234', 50, 1, 600, 1234, 1)`,
      [productoId, TENANT]
    );
    await new Promise<void>((listo) => {
      servidor = app.listen(0, () => {
        base = `http://127.0.0.1:${(servidor.address() as any).port}`;
        listo();
      });
    });
    await pedir('POST', '/caja/abrir', { tenant_id: TENANT, usuario_id: USUARIO, monto_apertura: 20000 });
    tokenAdmin = (await pedir('POST', '/auth/login', { tenant_id: TENANT, email: 'admin@gestock.cl', password: 'admin123' })).json.token;
    tokenCajero = (await pedir('POST', '/auth/login', { tenant_id: TENANT, email: 'cajero@gestock.cl', password: 'cajero123' })).json.token;
  });

  afterAll(async () => {
    await new Promise((listo) => servidor.close(listo));
  });

  describe('el XML firmado cuadra', () => {
    test.each([
      ['boleta con montos que no terminan en cero', TipoDTE.BOLETA_ELECTRONICA, [item('A', 1234), item('B', 799, 3), item('C', 1005)]],
      ['boleta con una linea exenta', TipoDTE.BOLETA_ELECTRONICA, [item('A', 1234), item('Exento', 5000, 1, { exento: true })]],
      ['boleta exenta', TipoDTE.BOLETA_EXENTA, [item('Exento', 5000, 1, { exento: true })]],
      ['factura con impuesto adicional', TipoDTE.FACTURA_ELECTRONICA, [item('Cerveza', 1990, 3, { codigoIla: 26, tasaIla: 20.5 }), item('Pan', 1234)]]
    ])('%s: neto + IVA + exento + adicional = total = suma del detalle', (_caso, tipoDte, items) => {
      const r = defaultDteEmitter.emitDocument({
        tenantId: TENANT,
        tipoDte,
        items,
        metodoPago: 'EFECTIVO',
        receptor: tipoDte === TipoDTE.FACTURA_ELECTRONICA
          ? { rut: '76.555.001-9', razonSocial: 'Comercio Receptor', giro: 'COMERCIO', comuna: 'Santiago', ciudad: 'Santiago' }
          : undefined
      });
      const xml = String(r.xmlDte);
      const { suma, total, detalle } = cuadraElXml(xml);

      expect(suma).toBe(total);
      expect(detalle).toBe(total);
      expect(total).toBe(items.reduce((a, it) => a + Math.round(it.cantidad * it.precioUnitario), 0));
      // la boleta es bruta por definicion; la factura lo declara
      expect(xml.includes('<MntBruto>1</MntBruto>')).toBe(tipoDte === TipoDTE.FACTURA_ELECTRONICA);
      expect(xml.includes('<IndExe>1</IndExe>')).toBe(items.some((it) => it.exento));
    });

    test('con tarjeta el documento declara lo mismo que con efectivo: el monto real', () => {
      const conTarjeta = defaultDteEmitter.emitDocument({ tenantId: TENANT, tipoDte: TipoDTE.BOLETA_ELECTRONICA, items: [item('A', 1234)], metodoPago: 'TARJETA', modeloEmision: 'MODELO_A' });
      expect(conTarjeta.totales.montoTotal).toBe(1234);
    });
  });

  describe('el cobro en efectivo y el documento', () => {
    test('la venta guarda lo cobrado con redondeo y la boleta declara el monto real', async () => {
      const res = await pedir('POST', '/pos/checkout', {
        tenant_id: TENANT,
        usuario_id: USUARIO,
        metodo_pago: 'EFECTIVO',
        items: [{ producto_id: productoId, cantidad: 1 }]
      });

      expect(res.status).toBe(201);
      // Ley 20.956: 1.234 en efectivo se paga 1.230
      expect(res.json.data.total).toBe(1230);
      const venta = defaultSqliteClient.queryOne<{ total: number }>('SELECT total FROM transacciones_venta WHERE id = ?', [res.json.data.saleId]);
      expect(Number(venta?.total)).toBe(1230);
      const dte = defaultSqliteClient.queryOne<{ monto_total: number; monto_neto: number; monto_iva: number }>(
        'SELECT monto_total, monto_neto, monto_iva FROM sii_dte_emitidos WHERE venta_id = ?',
        [res.json.data.saleId]
      );
      expect(Number(dte?.monto_total)).toBe(1234);
      expect(Number(dte?.monto_neto) + Number(dte?.monto_iva)).toBe(1234);
    });
  });

  describe('solo el administrador escribe en el catalogo', () => {
    test('el cajero no da de alta, no edita precios y no ajusta stock, ni con una barra al final', async () => {
      const antes = producto();
      const intentos = [
        await pedir('POST', '/pos/products', { tenant_id: TENANT, nombre: 'Intento', sku: `CAJ-${Date.now()}`, precio_venta: 1 }, tokenCajero),
        await pedir('POST', '/pos/products/', { tenant_id: TENANT, nombre: 'Intento', sku: `CAJ2-${Date.now()}`, precio_venta: 1 }, tokenCajero),
        await pedir('PUT', `/pos/products/${productoId}`, { tenant_id: TENANT, precio_venta: 1 }, tokenCajero),
        await pedir('PUT', `/pos/products/${productoId}/`, { tenant_id: TENANT, precio_venta: 1 }, tokenCajero),
        await pedir('PATCH', `/pos/products/${productoId}/stock`, { tenant_id: TENANT, nuevo_stock: 999, motivo: 'x' }, tokenCajero),
        await pedir('PATCH', `/pos/products/${productoId}/stock/`, { tenant_id: TENANT, nuevo_stock: 999, motivo: 'x' }, tokenCajero)
      ];

      expect(intentos.map((r) => r.status)).toEqual([403, 403, 403, 403, 403, 403]);
      expect(producto()).toEqual(antes);
    });

    test('el cajero sigue consultando el catalogo y registrando mermas', async () => {
      expect((await pedir('GET', `/pos/products?tenant_id=${TENANT}`, undefined, tokenCajero)).status).toBe(200);
      expect((await pedir('GET', `/pos/products/${productoId}/history?tenant_id=${TENANT}`, undefined, tokenCajero)).status).not.toBe(403);

      const stock = producto().stock_actual;
      const merma = await pedir('POST', '/pos/mermas', { tenant_id: TENANT, producto_id: productoId, cantidad: 1, motivo: 'vencimiento' }, tokenCajero);
      expect(merma.status).not.toBe(403);
      expect(producto().stock_actual).toBe(stock - 1);
    });

    test('el administrador si edita precios', async () => {
      const res = await pedir('PUT', `/pos/products/${productoId}`, { tenant_id: TENANT, precio_venta: 1234 }, tokenAdmin);
      expect(res.status).toBe(200);
    });
  });
});
