/**
 * Utilidades para Facturación Electrónica y Reglas Tributarias del SII (Chile)
 */

/**
 * Valida un RUT chileno aplicando el algoritmo estándar de Módulo 11 (Ley N° 20.727 y SII)
 * @param rut RUT en formato '12.345.678-5', '12345678-5', '76.123.456-0', etc.
 * @returns true si el dígito verificador coincide exactamente, false en caso contrario
 */
export function rutValido(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;
  const limpio = rut.replace(/\./g, '').replace(/-/g, '').trim();
  if (limpio.length < 2) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1).toUpperCase();
  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === esperado;
}

/**
 * RUT como lo pide el XML del SII (RUTType): cuerpo y digito verificador separados por guion, sin
 * puntos ni espacios y con la K en mayuscula. Acepta lo que el usuario haya escrito (76.123.456-0,
 * 761234560, 76123456-k). No revisa el digito verificador: eso lo valida el SII al recibir.
 * Lanza un error si no queda un RUT con cuerpo y digito, para no gastar un folio en un documento
 * que el SII va a rechazar.
 */
export function rutSii(rut: string | null | undefined): string {
  const limpio = String(rut ?? '').replace(/[^0-9kK]/g, '').toUpperCase();
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d{1,8}$/.test(cuerpo) || !/^[0-9K]$/.test(dv)) {
    throw new Error(`El RUT "${rut ?? ''}" no tiene un formato valido para el SII`);
  }
  return `${cuerpo}-${dv}`;
}

/**
 * Texto para un nodo del XML del SII: sin los caracteres que rompen el XML y recortado al largo que
 * permite el esquema, que rechaza el documento si se pasa.
 */
export function textoSii(valor: unknown, largoMaximo: number): string {
  return String(valor ?? '').replace(/[<>&'"]/g, '').trim().substring(0, largoMaximo);
}
