/// <reference types='vitest' />
import {defineConfig} from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/astra-apis-e2e',
  test: {
    name: '@dms-sonix/sonix-apis-e2e',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{js,ts}'],
    setupFiles: ['src/support/test-setup.ts'],
    exclude: ['node_modules', 'dist', 'out-tsc'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
