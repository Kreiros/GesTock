// casos/05-ventas.mjs
import { CONFIG, enviar, obtener } from '../lib/cliente.mjs'

// usuario de la siembra de desarrollo; con sesion iniciada el servidor usa el de la sesion
const USUARIO = process.env.GESTOCK_USUARIO || '00000000-0000-0000-0000-000000000002'

export const nombre = 'Ventas: historial, devoluciones y documentos'

export async function ejecutar(b) {
  // la bateria hace su propia venta: una instalacion limpia no trae historial
  const catalogo = await obtener('/api/v1/pos/products')
  const producto = (catalogo.datos?.data ?? []).find((p) => Number(p.stock_actual) >= 3)

  if (!producto) {
    b.omitir('vender y devolver', 'no hay un producto con stock para vender')
  } else {
    const venta = (cantidad) =>
      enviar('/api/v1/pos/checkout', {
        tenant_id: CONFIG.tenant,
        usuario_id: USUARIO,
        metodo_pago: 'EFECTIVO',
        items: [{ producto_id: producto.id, cantidad }],
      })

    // si el turno ya estaba abierto esta llamada responde 400 y no cambia nada
    const abrir = await enviar('/api/v1/caja/abrir', { tenant_id: CONFIG.tenant, usuario_id: USUARIO, monto_apertura: 20000 })
    b.comprobar('la caja queda abierta para vender', [200, 201, 400].includes(abrir.estado), `estado ${abrir.estado}`)

    const sobreStock = await venta(Number(producto.stock_actual) + 1)
    b.comprobar(
      'no se vende mas que el stock',
      sobreStock.estado === 409 && sobreStock.datos?.error === 'STOCK_INSUFICIENTE',
      `estado ${sobreStock.estado}`,
    )

    const hecha = await venta(1)
    b.estado('POST /pos/checkout vende una unidad', hecha, 201)
    const dte = hecha.datos?.data?.dte
    b.comprobar('la venta sale con su boleta y folio', Boolean(dte?.folio), `folio ${dte?.folio}`)
    b.comprobar('la boleta dice si su folio es provisional', typeof dte?.folio_provisional === 'boolean')

    const devuelta = await enviar('/api/v1/pos/devolucion', {
      tenant_id: CONFIG.tenant,
      usuario_id: USUARIO,
      venta_id: hecha.datos?.data?.saleId,
    })
    b.estado('POST /pos/devolucion devuelve la venta', devuelta, 200)
    b.comprobar('la devolucion emite su nota de credito', Boolean(devuelta.datos?.data?.folio_nc))
  }

  const ventas = await obtener('/api/v1/pos/transactions?limit=100')
  b.estado('GET /pos/transactions responde', ventas, 200)

  const filas = ventas.datos?.data ?? []
  b.comprobar('trae ventas registradas', filas.length > 0, `${filas.length} ventas`)
  if (filas.length === 0) return

  const v = filas[0]

  // estos campos los necesita el historial de ventas del frontend
  const campos = [
    'id', 'folio', 'fecha', 'total', 'unidades', 'estado', 'sync_status',
    'cajero_nombre', 'medio_pago_nombre', 'es_devolucion', 'referencia_venta_id',
    'rut_cliente', 'tipo_documento_tributario', 'monto_ila', 'items',
  ]
  const faltantes = campos.filter((c) => v[c] === undefined)
  b.comprobar('cada venta trae los campos que usa la pantalla', faltantes.length === 0, faltantes.join(', '))

  if (v.items?.length > 0) {
    const item = v.items[0]
    b.comprobar(
      'los items traen producto_id, no solo el sku',
      Boolean(item.producto_id),
      'sin esto la devolucion parcial no se puede armar',
    )
    b.comprobar('los items traen el codigo de barra', 'codigo_barra' in item)
  }

  // las devoluciones se reconocen por el campo, no por el nombre del folio
  const devoluciones = filas.filter((f) => f.es_devolucion === 1)
  if (devoluciones.length > 0) {
    const d = devoluciones[0]
    b.comprobar('la devolucion viene marcada con es_devolucion', d.es_devolucion === 1)
    b.comprobar('la devolucion apunta a la venta que anula', Boolean(d.referencia_venta_id))
    b.comprobar('la devolucion tiene total negativo', Number(d.total) < 0, `total ${d.total}`)

    const original = filas.find((f) => f.id === d.referencia_venta_id)
    b.comprobar(
      'la venta anulada esta en la misma lista',
      Boolean(original),
      original ? `anula ${original.folio}` : 'fuera del rango consultado',
    )
  } else {
    b.omitir('revisar una devolucion', 'no hay devoluciones registradas')
  }

  const dtes = await obtener(`/api/v1/dte/list?tenantId=${''}`)
  b.comprobar(
    'GET /dte/list responde',
    dtes.estado === 200,
    `estado ${dtes.estado}, ${dtes.ms} ms`,
  )

  const emitidos = dtes.datos?.data ?? []
  if (emitidos.length > 0) {
    const doc = emitidos[0]
    b.comprobar('cada documento trae su folio y su tipo', Boolean(doc.folio) && doc.tipo_dte !== undefined)
  } else {
    b.omitir('revisar un documento emitido', 'no hay documentos emitidos')
  }
}
