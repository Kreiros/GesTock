const fs = require('node:fs');
const path = require('node:path');

/**
 * Copia los .sql de migracion junto al codigo compilado.
 *
 * tsc solo compila TypeScript, de modo que las migraciones se quedaban en backend/src y no
 * llegaban al paquete: una instalacion limpia arrancaba sin esquema y la aplicacion no abria.
 * Dejarlas bajo dist/ las hace viajar con el resto del backend compilado, sin mandar codigo
 * fuente al equipo del local.
 */
const RAIZ = path.resolve(__dirname, '..');
const MOTORES = ['sqlite', 'postgres'];

let copiados = 0;

for (const motor of MOTORES) {
  const origen = path.join(RAIZ, 'backend', 'src', 'database', motor, 'migrations');
  const destino = path.join(RAIZ, 'dist', 'backend', 'src', 'database', motor, 'migrations');

  if (!fs.existsSync(origen)) {
    console.error(`No existe la carpeta de migraciones de ${motor}: ${origen}`);
    process.exit(1);
  }

  fs.mkdirSync(destino, { recursive: true });

  for (const archivo of fs.readdirSync(origen).filter((f) => f.endsWith('.sql'))) {
    fs.copyFileSync(path.join(origen, archivo), path.join(destino, archivo));
    copiados += 1;
  }
}

if (copiados === 0) {
  console.error('No se copio ninguna migracion: el paquete quedaria sin esquema.');
  process.exit(1);
}

console.log(`Migraciones copiadas a dist: ${copiados}`);
