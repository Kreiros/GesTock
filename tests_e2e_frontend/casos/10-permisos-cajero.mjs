// casos/10-permisos-cajero.mjs
import { autenticarSiEsNecesario, enviar, guardarToken, obtener, pedir } from '../lib/cliente.mjs'

export const nombre = 'Permisos: lo que puede y no puede el cajero'

// La bateria crea su propio cajero: en produccion la clave de demostracion no abre ninguna cuenta
const CORREO = process.env.GESTOCK_CAJERO_EMAIL || `cajero.permisos.${Date.now()}@gestock.cl`
const CLAVE = process.env.GESTOCK_CAJERO_PASSWORD || 'ClaveDePermisos2026'

// las que necesita para atender
const DEL_CAJERO = [
  '/api/v1/pos/inventory',
  '/api/v1/pos/vencimientos',
  '/api/v1/caja/resumen',
  '/api/v1/pos/status',
]

// margenes, compras y tributario: no son su trabajo
const DEL_ADMIN = [
  '/api/v1/dashboard/overview',
  '/api/v1/suppliers',
  '/api/v1/replenishment/suggest',
  '/api/v1/auth/users',
]

export async function ejecutar(b) {
  // el bloque anterior cierra su sesion: se vuelve a entrar como admin para crear al cajero, y pase
  // lo que pase el resto de la bateria sigue como admin
  guardarToken(null)
  await autenticarSiEsNecesario()
  if (!process.env.GESTOCK_CAJERO_EMAIL) {
    await enviar('/api/v1/auth/register', { nombre: 'Cajero de la bateria', email: CORREO, password: CLAVE, rol: 'cajero' })
  }

  const login = await enviar('/api/v1/auth/login', { email: CORREO, password: CLAVE })

  if (login.estado === 404) {
    b.omitir('las pruebas de permisos', 'el backend no expone /api/v1/auth')
    return
  }

  if (login.estado !== 200 || !login.datos?.data?.token) {
    b.omitir('las pruebas de permisos', `no se pudo entrar como ${CORREO}`)
    return
  }

  b.comprobar('el cajero puede entrar', true, CORREO)
  b.igual('entra con rol de cajero', login.datos.data.usuario?.rol, 'cajero')

  guardarToken(login.datos.data.token)
  // el resto de las pruebas corre como admin
  b.alTerminar('la sesion del cajero', async () => {
    guardarToken(null)
    await autenticarSiEsNecesario()
  })

  for (const ruta of DEL_CAJERO) {
    const respuesta = await obtener(ruta)
    b.comprobar(
      `entra a ${ruta.replace('/api/v1', '')}`,
      respuesta.estado === 200,
      `llego ${respuesta.estado}`,
    )
  }

  for (const ruta of DEL_ADMIN) {
    const respuesta = await obtener(ruta)
    b.comprobar(
      `no entra a ${ruta.replace('/api/v1', '')}`,
      respuesta.estado === 403,
      `llego ${respuesta.estado}`,
    )
  }

  // dar de alta, editar precios y ajustar stock es del admin (rf-04); un id inexistente basta: el rol
  // se revisa antes de buscar el producto, asi que nada se modifica
  const ID = '00000000-0000-0000-0000-0000000000ff'
  const escrituras = [
    ['POST', '/api/v1/pos/products', { nombre: 'Intento del cajero', sku: `PERMISOS-${Date.now()}`, precio_venta: 1 }],
    ['PUT', `/api/v1/pos/products/${ID}`, { precio_venta: 1 }],
    ['PATCH', `/api/v1/pos/products/${ID}/stock`, { nuevo_stock: 1, motivo: 'intento' }],
  ]
  for (const [metodo, ruta, cuerpo] of escrituras) {
    const respuesta = await pedir(metodo, ruta, cuerpo)
    b.comprobar(
      `no puede ${metodo} ${ruta.replace('/api/v1', '').replace(ID, ':id')}`,
      respuesta.estado === 403,
      `llego ${respuesta.estado}`,
    )
  }

  // crear usuarios es del admin
  const nuevo = await enviar('/api/v1/auth/register', {
    nombre: 'Prueba Permisos',
    email: `prueba-permisos-${Date.now()}@gestock.cl`,
    password: 'clave12345',
    rol: 'cajero',
  })
  b.comprobar(
    'no puede crear cuentas',
    nuevo.estado === 403,
    nuevo.estado === 201 ? 'creo un usuario de verdad' : `llego ${nuevo.estado}`,
  )
}
