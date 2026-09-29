// src/app/router/router.tsx
import { createBrowserRouter } from 'react-router'
import { MainLayout } from '@/shared/components/layout/MainLayout'
import { CajaPage } from '@/features/pos/pages/CajaPage'
import { IngresoFacturasPage } from '@/features/invoices/pages/IngresoFacturasPage'
import { CierreCajaPage } from '@/features/caja/pages/CierreCajaPage'
import { InventarioPage } from '@/features/inventario/pages/InventarioPage'
import { ProveedoresPage } from '@/features/proveedores/pages/ProveedoresPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { NotificacionesPage } from '@/features/notificaciones/pages/NotificacionesPage'
import { VentasPage } from '@/features/ventas/pages/VentasPage'
import { SiiPage } from '@/features/sii/pages/SiiPage'
import { ReabastecimientoPage } from '@/features/replenishment/pages/ReabastecimientoPage'
import { ConfiguracionPage } from '@/features/configuracion/pages/ConfiguracionPage'
import { NotFoundPage } from '@/shared/pages/NotFoundPage'

// rutas de la app
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <CajaPage /> }, // caja
      { path: 'facturas', element: <IngresoFacturasPage /> }, // ocr de facturas
      { path: 'caja/cierre', element: <CierreCajaPage /> }, // arqueo y cierre de turno
      { path: 'inventario', element: <InventarioPage /> }, // catalogo general
      { path: 'proveedores', element: <ProveedoresPage /> }, // directorio de proveedores
      { path: 'reabastecimiento', element: <ReabastecimientoPage /> }, // ordenes de compra sugeridas
      { path: 'dashboard', element: <DashboardPage /> }, // panel general
      { path: 'notificaciones', element: <NotificacionesPage /> }, // avisos del local
      { path: 'ventas', element: <VentasPage /> }, // historial de ventas y devoluciones
      { path: 'sii', element: <SiiPage /> }, // respaldo tributario y f29
      { path: 'configuracion', element: <ConfiguracionPage /> }, // preferencias y reglas
      { path: '*', element: <NotFoundPage /> }, // ruta no existe
    ],
  },
])
