// src/features/pos/components/compartidos/TicketImpreso.test.tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { TicketImpreso } from '@/features/pos/components/compartidos/TicketImpreso'
import type { ComprobanteDte } from '@/features/dte/types'

// boleta de 1.234: el documento declara el monto real de la venta
function boleta(totales: Partial<ComprobanteDte['totales']> = {}): ComprobanteDte {
  return {
    dteId: 'd-1',
    tipoDte: 39,
    nombreDocumento: 'BOLETA ELECTRÓNICA',
    folio: 10,
    fechaEmision: '2026-11-20',
    emisor: { rut: '76.123.456-0', razonSocial: 'Almacen' },
    receptor: { rut: null, razonSocial: null },
    totales: { neto: 1037, iva: 197, exento: 0, total: 1234, ...totales },
    items: [{ cantidad: 1, nombre: 'Producto', sku: 'P-1', precio_unitario: 1234, subtotal: 1234 }],
    qrCodeUrl: 'https://www.sii.cl',
    tedXml: '<TED/>',
    leyendaFiscal: 'Timbre',
  } as unknown as ComprobanteDte
}

function textoDel(comprobante: ComprobanteDte, totalCobrado: number, metodoPago = 'Efectivo') {
  const { container } = render(
    <TicketImpreso comprobante={comprobante} emisor={undefined} metodoPago={metodoPago} totalCobrado={totalCobrado} />,
  )
  return container.textContent ?? ''
}

describe('TicketImpreso', () => {
  afterEach(cleanup)

  // en efectivo se pagan 1.230: el ticket explica la diferencia con la boleta
  it('en efectivo muestra el total del documento, el redondeo y lo que se paga', () => {
    const texto = textoDel(boleta(), 1230)

    expect(texto).toMatch(/TOTAL:\s*\$1\.234/)
    expect(texto).toContain('LEY REDONDEO (20.956):-4')
    expect(texto).toMatch(/TOTAL A PAGAR:\s*\$1\.230/)
    // el redondeo no se confunde con un impuesto adicional
    expect(texto).not.toContain('ILA')
  })

  it('con tarjeta, o sin redondeo, una sola linea de total', () => {
    const texto = textoDel(boleta(), 1234, 'Tarjeta')

    expect(texto).not.toContain('LEY REDONDEO')
    expect(texto).not.toMatch(/(^|[^R ])TOTAL:/)
    expect(texto).toMatch(/TOTAL A PAGAR:\s*\$1\.234/)
  })

  // reimpresion desde el historial de una devolucion: lo cobrado viene en negativo
  it('una devolucion, o un documento anterior ya redondeado, no inventa un ajuste', () => {
    expect(textoDel(boleta(), -1234)).not.toContain('LEY REDONDEO')
    expect(textoDel(boleta({ neto: 1034, iva: 196, total: 1230 }), 1230)).not.toContain('LEY REDONDEO')
  })

  it('el impuesto adicional de una factura se deduce sin descuadrarse', () => {
    const texto = textoDel(boleta({ neto: 4105, iva: 780, total: 5970 }), 5970, 'Tarjeta')

    expect(texto).toMatch(/IMPUESTO ADICIONAL ILA:\s*\$1\.085/)
  })
})
