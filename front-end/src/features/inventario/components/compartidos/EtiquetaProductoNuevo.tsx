// src/features/inventario/components/compartidos/EtiquetaProductoNuevo.tsx
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { esProductoNuevo } from '@/features/inventario/utils/productoNuevo'
import type { ProductoInventario } from '@/features/inventario/types'

type Props = {
  producto: ProductoInventario
  ultimoZ: Date | null
}

// sale en los productos que creo una factura, hasta el cierre de caja siguiente
export function EtiquetaProductoNuevo({ producto, ultimoZ }: Props) {
  if (!esProductoNuevo(producto, ultimoZ)) return null

  const folio = producto.factura_origen_folio

  return (
    <Tooltip
      title={
        folio
          ? `Producto nuevo: lo creo la lectura de la factura ${folio}`
          : 'Producto nuevo: lo creo la lectura de una factura'
      }
    >
      <Chip
        label="Nuevo"
        size="small"
        color="success"
        variant="outlined"
        sx={{ height: 19, fontSize: 11, fontWeight: 700, flexShrink: 0 }}
      />
    </Tooltip>
  )
}
