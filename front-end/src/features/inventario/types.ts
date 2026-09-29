// src/features/inventario/types.ts
// segun backend/src/routes/pos.routes.ts (GET /pos/inventory)

export type ProductoInventario = {
  id: string
  tenant_id: string
  sku: string
  codigo_barra: string | null
  nombre: string
  stock_actual: number
  stock_minimo: number
  precio_compra: number
  precio_venta: number
  categoria: string | null
  activo: number
  updated_at: string
  origen_creacion: string | null // 'FACTURA' si nacio de una factura OCR
  factura_origen_folio: string | null
  lote: string | null
  fecha_vencimiento: string | null
  impuesto_adicional_codigo: number | null
  impuesto_adicional_tasa: number | null
  proveedor_nombre: string | null
}

export type RespuestaInventario = {
  success: boolean
  count: number
  data: ProductoInventario[]
}

// niveles del semaforo sanitario (backend/src/routes/pos.routes.ts, GET /pos/vencimientos)
export type NivelRiesgo = 'ROJO_CRITICO' | 'NARANJA_URGENTE' | 'AMARILLO_ALERTA' | 'AMARILLO_PREVENTIVO' | 'VERDE'
export type EstadoVencimiento = 'VENCIDO' | 'VENCE_ESTA_SEMANA' | 'VENCE_EN_15_DIAS' | 'VENCE_EN_30_DIAS' | 'VIGENTE'

// solo aparecen aca los productos que tienen fecha_vencimiento cargada
export type ProductoVencimiento = {
  id: string
  sku: string
  nombre: string
  stock_actual: number
  precio_compra: number
  precio_venta: number
  lote: string | null
  fecha_vencimiento: string
  dias_restantes: number
  estado: EstadoVencimiento
  nivel_riesgo: NivelRiesgo
}

export type ResumenVencimientos = {
  vencidos: number
  riesgo_critico_7d: number
  riesgo_medio_15d: number
  vence_30_dias: number
  total_con_vencimiento: number
  total_en_riesgo: number
}

export type RespuestaVencimientos = {
  success: boolean
  total: number
  resumen: ResumenVencimientos
  data: ProductoVencimiento[]
}
