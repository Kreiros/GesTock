// src/features/ventas/utils/filaVenta.ts
import type { DteEmitido, Transaccion } from '@/features/ventas/types'

// la venta con su documento tributario ya cruzado
export type FilaVenta = Transaccion & {
  esDevolucion: boolean
  dte: DteEmitido | null
}

// el backend no marca es_devolucion en la lista: se reconoce por el folio y el monto negativo
function esDevolucion(venta: Transaccion): boolean {
  return venta.folio.startsWith('DEV-') || venta.total < 0
}

export function armarFilasVenta(ventas: Transaccion[], dtes: DteEmitido[]): FilaVenta[] {
  const porVenta = new Map(dtes.filter((dte) => dte.venta_id).map((dte) => [dte.venta_id as string, dte]))

  return ventas.map((venta) => ({
    ...venta,
    esDevolucion: esDevolucion(venta),
    dte: porVenta.get(venta.id) ?? null,
  }))
}

// resume los productos de la venta para la columna de detalle
export function detalleProductos(venta: FilaVenta): string {
  if (venta.items.length === 0) return venta.esDevolucion ? 'Nota de credito' : `${venta.unidades} unidades`
  return venta.items.map((item) => `${item.producto_nombre} (${item.cantidad}u)`).join(', ')
}
