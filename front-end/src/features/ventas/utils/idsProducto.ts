// src/features/ventas/utils/idsProducto.ts
import type { ProductoInventario } from '@/features/inventario/types'

// el detalle de la venta no trae producto_id, solo el sku: se cruza con el catalogo
export function idsPorSku(inventario: ProductoInventario[]): Record<string, string> {
  const mapa: Record<string, string> = {}

  for (const producto of inventario) {
    mapa[producto.sku] = producto.id
  }

  return mapa
}
