// src/features/pos/components/compartidos/AvisoRedondeoBackend.tsx
import Alert from '@mui/material/Alert'
import { formatoClp } from '@/shared/utils/formatoClp'
import { aplicarRedondeoChileno } from '@/shared/utils/redondeoChileno'
import { useTotalesCarrito } from '@/features/pos/hooks/useTotalesCarrito'

// avisa cuando el backend va a redondear un pago que no es efectivo
export function AvisoRedondeoBackend() {
  const { total, aplicaRedondeo } = useTotalesCarrito()

  if (aplicaRedondeo || total === 0) return null

  const totalQueGuardara = aplicarRedondeoChileno(total)
  if (totalQueGuardara === total) return null

  return (
    <Alert severity="warning">
      El sistema va a registrar {formatoClp(totalQueGuardara)} en vez de {formatoClp(total)}: el servidor todavia
      redondea tambien los pagos con tarjeta. Pendiente de corregir.
    </Alert>
  )
}
