// src/features/invoices/utils/vencimientoFactura.test.ts
import { describe, expect, it } from 'vitest'
import {
  clasificarVencimientos,
  diasParaVencer,
  faltaVencimiento,
} from '@/features/invoices/utils/vencimientoFactura'

const HOY = new Date(2026, 10, 19, 15, 30) // 19 de noviembre de 2026, a media tarde

function item(descripcion: string, fecha: string | null, noVence = false) {
  return { descripcion, cantidad: 6, fecha_vencimiento: fecha, no_vence: noVence }
}

describe('vencimiento de los productos de una factura', () => {
  it('falta cuando no hay fecha ni marca de que no vence', () => {
    expect(faltaVencimiento({ fecha_vencimiento: null })).toBe(true)
    expect(faltaVencimiento({ fecha_vencimiento: '' })).toBe(true)
    expect(faltaVencimiento({ fecha_vencimiento: '2026-12-01' })).toBe(false)
    expect(faltaVencimiento({ fecha_vencimiento: null, no_vence: true })).toBe(false)
  })

  it('cuenta los dias de calendario sin importar la hora', () => {
    expect(diasParaVencer('2026-11-19', HOY)).toBe(0)
    expect(diasParaVencer('2026-11-18', HOY)).toBe(-1)
    expect(diasParaVencer('2026-12-04', HOY)).toBe(15)
  })

  it('separa los vencidos de los que estan por vencer y deja fuera el resto', () => {
    const { vencidos, porVencer } = clasificarVencimientos(
      [
        item('Yogur vencido ayer', '2026-11-18'),
        item('Leche que vence hoy', '2026-11-19'),
        item('Queso a quince dias', '2026-12-04'),
        item('Arroz a dieciseis dias', '2026-12-05'),
        item('Bolsa reutilizable', null, true),
      ],
      HOY,
    )

    expect(vencidos.map((v) => v.descripcion)).toEqual(['Yogur vencido ayer'])
    expect(vencidos[0].dias_restantes).toBe(-1)
    expect(porVencer.map((v) => v.descripcion)).toEqual(['Leche que vence hoy', 'Queso a quince dias'])
  })
})
