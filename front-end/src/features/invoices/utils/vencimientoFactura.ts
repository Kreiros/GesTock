// src/features/invoices/utils/vencimientoFactura.ts
import type { AvisoVencimiento, ItemFactura } from '@/features/invoices/types'

// misma regla que backend/src/inventory/vencimiento.ts: el servidor la vuelve a aplicar al ingresar
export const DIAS_AVISO_VENCIMIENTO = 15

type ConVencimiento = Pick<ItemFactura, 'descripcion' | 'cantidad' | 'fecha_vencimiento' | 'no_vence'>

// cada producto necesita su fecha o la marca de que no vence
export function faltaVencimiento(item: Pick<ItemFactura, 'fecha_vencimiento' | 'no_vence'>): boolean {
  return !item.no_vence && !item.fecha_vencimiento
}

// negativo si ya vencio, cero si vence hoy; en dias de calendario del equipo
export function diasParaVencer(fecha: string, hoy: Date): number {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const inicioDeHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.round((new Date(anio, mes - 1, dia).getTime() - inicioDeHoy.getTime()) / 86_400_000)
}

// vencido es anterior a hoy: lo que vence hoy todavia se puede vender y cuenta como por vencer
export function clasificarVencimientos(items: ConVencimiento[], hoy: Date) {
  const vencidos: AvisoVencimiento[] = []
  const porVencer: AvisoVencimiento[] = []

  for (const item of items) {
    if (item.no_vence || !item.fecha_vencimiento) continue
    const dias = diasParaVencer(item.fecha_vencimiento, hoy)
    if (dias > DIAS_AVISO_VENCIMIENTO) continue
    const aviso = {
      descripcion: item.descripcion,
      fecha_vencimiento: item.fecha_vencimiento,
      cantidad: item.cantidad,
      dias_restantes: dias,
    }
    if (dias < 0) vencidos.push(aviso)
    else porVencer.push(aviso)
  }

  return { vencidos, porVencer }
}
