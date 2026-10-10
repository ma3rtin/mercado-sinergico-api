/**
 * Mock manual de p-limit para el entorno de Jest (CJS).
 *
 * p-limit@7.x es Pure ESM y no puede ser cargado por Jest en modo CommonJS/ts-jest
 * en Windows (transformIgnorePatterns no funciona con separadores \).
 * Este mock expone la misma interfaz pública: pLimit(concurrency) devuelve una
 * función limit(fn) que ejecuta fn() directamente sin throttle, lo que es
 * correcto para tests unitarios donde el throttling no es el SUT del test.
 * El comportamiento real de concurrencia está cubierto por el test de regresión
 * en imagen.service.test.ts, que espía uploadToCloudinary con spyOn.
 */
const pLimit = (concurrency) => {
  const limit = (fn) => fn();
  limit.activeCount = 0;
  limit.pendingCount = 0;
  limit.clearQueue = () => {};
  return limit;
};

module.exports = pLimit;
module.exports.default = pLimit;
