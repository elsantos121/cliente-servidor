import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup/env.ts'],
    globalSetup: ['tests/setup/global.ts'],
    // Todas las pruebas de integración comparten la misma base de pruebas:
    // se ejecutan los archivos uno por uno para que sean independientes y repetibles.
    fileParallelism: false,
  },
});
