import { rutSii, textoSii } from '../../backend/src/utils/sii.utils';

describe('Pruebas Unitarias: RUT y textos para el XML del SII', () => {
  test('deja el RUT como lo pide el esquema: sin puntos, con guion y K mayuscula', () => {
    expect(rutSii('76.123.456-0')).toBe('76123456-0');
    expect(rutSii('76123456-0')).toBe('76123456-0');
    expect(rutSii('12.345.678-k')).toBe('12345678-K');
    expect(rutSii(' 12 345 678 - 5 ')).toBe('12345678-5');
    // sin guion tambien se entiende: el ultimo caracter es el digito verificador
    expect(rutSii('761234560')).toBe('76123456-0');
    expect(rutSii('66666666-6')).toBe('66666666-6');
  });

  test('un RUT que no se puede leer se rechaza en vez de llegar al documento', () => {
    expect(() => rutSii('')).toThrow(/RUT/);
    expect(() => rutSii(null)).toThrow(/RUT/);
    expect(() => rutSii('5')).toThrow(/RUT/);
    expect(() => rutSii('sin rut')).toThrow(/RUT/);
    expect(() => rutSii('123456789-0')).toThrow(/RUT/);
  });

  test('los textos se limpian y se recortan al largo del esquema', () => {
    expect(textoSii('Almacen <Don> "Tito" & Cia', 100)).toBe('Almacen Don Tito  Cia');
    expect(textoSii('X'.repeat(50), 40)).toHaveLength(40);
    expect(textoSii(null, 10)).toBe('');
  });
});
