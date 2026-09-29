// src/features/inventario/components/TablaInventario.tsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { formatoClp } from '@/shared/utils/formatoClp'
import { BarraStock } from '@/features/inventario/components/visual/BarraStock'
import { calcularMargen } from '@/features/inventario/utils/calculosInventario'
import type { ProductoInventario } from '@/features/inventario/types'

type Props = {
  productos: ProductoInventario[]
  cargando: boolean
}

// columnas de la tabla: todas vienen de GET /pos/inventory, nada inventado
const columnas: GridColDef<ProductoInventario>[] = [
  {
    field: 'sku',
    headerName: 'SKU / Codigo',
    width: 150,
    renderCell: (parametros) => (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {parametros.row.sku}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {parametros.row.codigo_barra}
        </Typography>
      </Box>
    ),
  },
  {
    field: 'nombre',
    headerName: 'Producto y proveedor',
    flex: 1,
    minWidth: 220,
    renderCell: (parametros) => (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {parametros.row.nombre}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {parametros.row.proveedor_nombre ?? 'Sin proveedor asignado'}
        </Typography>
      </Box>
    ),
  },
  {
    field: 'categoria',
    headerName: 'Categoria',
    width: 130,
    renderCell: (parametros) => <Chip size="small" label={parametros.row.categoria ?? 'Sin categoria'} />,
  },
  {
    field: 'stock_actual',
    headerName: 'Stock actual',
    width: 130,
    renderCell: (parametros) => <BarraStock producto={parametros.row} />,
  },
  {
    field: 'precio_compra',
    headerName: 'P. Costo',
    width: 100,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (valor: number) => formatoClp(valor),
  },
  {
    field: 'precio_venta',
    headerName: 'P. Venta',
    width: 100,
    align: 'right',
    headerAlign: 'right',
    renderCell: (parametros) => <Typography sx={{ fontWeight: 700 }}>{formatoClp(parametros.row.precio_venta)}</Typography>,
  },
  {
    field: 'margen',
    headerName: 'Margen',
    width: 90,
    align: 'right',
    headerAlign: 'right',
    valueGetter: (_valor, fila) => calcularMargen(fila.precio_compra, fila.precio_venta),
    renderCell: (parametros) => {
      const margen = calcularMargen(parametros.row.precio_compra, parametros.row.precio_venta)
      return (
        <Typography variant="body2" color={margen >= 30 ? 'success.main' : 'text.secondary'} sx={{ fontWeight: 600 }}>
          {margen.toFixed(1)}%
        </Typography>
      )
    },
  },
]

// tabla del catalogo, con paginacion (mui x-data-grid)
export function TablaInventario({ productos, cargando }: Props) {
  return (
    <Box sx={{ height: 560 }}>
      <DataGrid
        rows={productos}
        columns={columnas}
        loading={cargando}
        getRowHeight={() => 64}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        density="comfortable"
      />
    </Box>
  )
}
