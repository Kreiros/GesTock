const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/**
 * Reinstala GesTock encima de la instalacion existente, para que los cambios del instalador
 * lleguen al equipo sin desinstalar.
 *
 * El instalador de Windows reemplaza los archivos del programa y no toca la carpeta de datos del
 * usuario, de modo que la base, las cuentas y los documentos sobreviven. Es lo que corresponde
 * hacer despues de cambiar algo del empaquetado: desinstalar primero borraria el acceso directo y
 * obligaria a volver a elegir carpeta, sin ninguna ventaja.
 *
 *   node scripts/reparar-instalacion.js [ruta-del-instalador.exe]
 */

const CARPETAS = [
  path.resolve(__dirname, '..', 'release'),
  path.join(os.homedir(), 'Documents', 'GesTock-instalador')
];

function buscarInstalador() {
  const indicado = process.argv[2];
  if (indicado) {
    if (!fs.existsSync(indicado)) {
      throw new Error(`No existe el instalador indicado: ${indicado}`);
    }
    return indicado;
  }

  const candidatos = CARPETAS.filter((c) => fs.existsSync(c))
    .flatMap((carpeta) =>
      fs
        .readdirSync(carpeta)
        .filter((f) => /^GesTock-.*instalador\.exe$/i.test(f))
        .map((f) => path.join(carpeta, f))
    )
    .map((ruta) => ({ ruta, fecha: fs.statSync(ruta).mtimeMs }))
    .sort((a, b) => b.fecha - a.fecha);

  if (candidatos.length === 0) {
    throw new Error(
      'No se encontro ningun instalador. Construyalo antes con "npm run dist:win", o indique su ruta.'
    );
  }

  return candidatos[0].ruta;
}

function cerrarAplicacion() {
  // Con la aplicacion abierta, el instalador no puede reemplazar su propio ejecutable.
  spawnSync('taskkill', ['/F', '/IM', 'GesTock.exe'], { stdio: 'ignore' });
}

function main() {
  if (process.platform !== 'win32') {
    throw new Error('La reparacion aplica al instalador de Windows.');
  }

  const instalador = buscarInstalador();
  const construido = fs.statSync(instalador).mtime.toLocaleString('es-CL');
  console.log(`Instalador: ${instalador}`);
  console.log(`Construido: ${construido}`);

  cerrarAplicacion();

  // /S instala en silencio sobre la instalacion existente, conservando la carpeta elegida
  const resultado = spawnSync(instalador, ['/S'], { stdio: 'inherit' });
  if (resultado.status !== 0) {
    throw new Error(`El instalador termino con codigo ${resultado.status}`);
  }

  const instalada = path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'Programs',
    'GesTock',
    'GesTock.exe'
  );

  if (!fs.existsSync(instalada)) {
    throw new Error(`El instalador no dejo el programa en ${instalada}`);
  }

  console.log(`Instalada: ${instalada}`);
  console.log(`Fecha del programa: ${fs.statSync(instalada).mtime.toLocaleString('es-CL')}`);
  console.log('Los datos del local no se tocaron: la carpeta de datos del usuario queda como estaba.');
}

try {
  main();
} catch (error) {
  console.error(`No se pudo reparar la instalacion: ${error.message}`);
  process.exit(1);
}
