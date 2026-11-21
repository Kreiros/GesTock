/**
 * Cobertura de las DOS baterias sobre el codigo del servidor.
 *
 * `npm run test:coverage` emplea la configuracion principal, que solo ejecuta las pruebas de
 * integracion: medida asi, la cobertura aparenta ser mucho menor de la real porque deja fuera
 * las pruebas unitarias. Esta configuracion ejecuta ambas y mide contra backend/src, de modo
 * que la cifra que declara el documento de arquitectura sea reproducible por un tercero.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/backend/tests/integration/**/*.test.ts',
    '<rootDir>/tests_unitarias/**/*.unit.test.ts'
  ],
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/backend/src/**/*.ts'],
  coverageReporters: ['text-summary', 'json-summary'],
  forceExit: true,
  detectOpenHandles: false
};
