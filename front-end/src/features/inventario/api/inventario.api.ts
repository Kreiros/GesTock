// src/features/inventario/api/inventario.api.ts
import { httpClient } from '@/lib/api/httpClient'
import { endpoints } from '@/lib/api/endpoints'
import type { RespuestaInventario, RespuestaVencimientos } from '@/features/inventario/types'

// catalogo completo con costos, precios y proveedor
export async function obtenerInventario() {
  const { data } = await httpClient.get<RespuestaInventario>(endpoints.pos.inventario)
  return data.data
}

// semaforo sanitario: solo trae productos con fecha_vencimiento cargada
export async function obtenerVencimientos() {
  const { data } = await httpClient.get<RespuestaVencimientos>(endpoints.pos.vencimientos)
  return data
}
