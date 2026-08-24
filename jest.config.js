/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // p-limit@7.x es Pure ESM y no puede ser cargado por Jest en Windows
    // (transformIgnorePatterns no aplica con separadores de ruta `\`).
    // Se usa un mock manual CJS con la misma firma pública.
    '^p-limit$': '<rootDir>/__mocks__/p-limit.js',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'bundler',
        },
      },
    ],
  },
};
