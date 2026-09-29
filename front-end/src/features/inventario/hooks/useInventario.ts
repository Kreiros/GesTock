// src/features/inventario/hooks/useInventario.ts
import { useQuery } from '@tanstack/react-query'
import { obtenerInventario, obtenerVencimientos } from '@/features/inventario/api/inventario.api'
import { VIGENCIA_LARGA_MS } from '@/lib/query/queryClient'

// catalogo completo de inventario
export function useInventario() {
  return useQuery({
    queryKey: ['inventario'],
    queryFn: obtenerInventario,
  })
}

// semaforo sanitario de vencimientos
export function useVencimientos() {
  return useQuery({
    queryKey: ['inventario', 'vencimientos'],
    queryFn: obtenerVencimientos,
    staleTime: VIGENCIA_LARGA_MS,
  })
}
