module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts', '**/*.spec.ts'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,

  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/api-doc/**',
    '!src/database/**',
    '!src/utils/api-doc/**',
    '!src/models/**/*.dtos.ts',
  ],
  /** Ramas: createServer / plugins condicionales bajan mucho el % en proyectos recién generados */
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};