/**
 * Estados de una factura que todavia no entro al stock. Viven en la misma tabla que las facturas
 * ingresadas, asi que toda consulta de facturas reales tiene que excluirlos.
 */
export const ESTADO_PENDIENTE = 'PENDIENTE_OCR';
export const ESTADO_FALLIDA = 'FALLIDA_OCR';
/** Ya se leyo, y espera que una persona declare los vencimientos y la confirme. */
export const ESTADO_POR_REVISAR = 'POR_REVISAR';

export const ESTADOS_DE_COLA = [ESTADO_PENDIENTE, ESTADO_FALLIDA, ESTADO_POR_REVISAR];

/** Lista lista para un NOT IN: son constantes del sistema, no datos del usuario. */
export const ESTADOS_DE_COLA_SQL = ESTADOS_DE_COLA.map((e) => `'${e}'`).join(', ');
