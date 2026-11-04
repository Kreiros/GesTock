/**
 * Las baterias ejercen la API sin token, de modo que el perimetro estricto las haria fallar
 * enteras. La bandera se fija aqui y no se hereda del .env de cada equipo: desde que el proyecto
 * activo ENFORCE_AUTH=true para la prueba con usuarios, el resultado de las pruebas pasaba a
 * depender de la configuracion local de quien las corriera.
 *
 * El perimetro se verifica aparte: la logica del middleware en `security_and_auth.unit.test.ts`,
 * y el comportamiento real contra el servidor en marcha, documentado en el estado del proyecto.
 */
process.env.ENFORCE_AUTH = 'false';
