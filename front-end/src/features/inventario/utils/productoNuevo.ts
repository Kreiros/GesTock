// src/features/inventario/utils/productoNuevo.ts
import { parsearFechaBackend } from '@/shared/utils/fechaBackend'
import type { ProductoInventario } from '@/features/inventario/types'
import type { CierreHistorial } from '@/features/caja/types'

// la fecha del ultimo cierre de caja, que es hasta donde dura la etiqueta
export function ultimoCierreZ(historial: CierreHistorial[] | undefined): Date | null {
  const cerrados = (historial ?? [])
    .map((cierre) => cierre.fecha_cierre)
    .filter((fecha): fecha is string => Boolean(fecha))
    .map(parsearFechaBackend)
    .filter((fecha): fecha is Date => fecha !== null)

  if (cerrados.length === 0) return null
  return cerrados.reduce((ultima, fecha) => (fecha > ultima ? fecha : ultima))
}

// un producto es nuevo si lo creo una factura y todavia no pasa por un cierre Z
export function esProductoNuevo(producto: ProductoInventario, ultimoZ: Date | null): boolean {
  if (producto.origen_creacion !== 'FACTURA') return false

  // sin fecha de creacion no hay como saber si ya paso un cierre
  const creado = producto.created_at ? parsearFechaBackend(producto.created_at) : null
  if (!creado) return true

  return ultimoZ === null || creado > ultimoZ
}
