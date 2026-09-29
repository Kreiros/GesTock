// src/lib/api/httpClient.ts
import axios from 'axios'
import { env } from '@/config/env'

// cliente http
export const httpClient = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// agregar tenant a cada peticion
httpClient.interceptors.request.use((config) => {
  config.headers.set('X-Tenant-ID', env.tenantId)
  config.params = { tenant_id: env.tenantId, ...config.params }
  return config
})
