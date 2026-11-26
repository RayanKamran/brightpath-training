/// <reference types='vitest' />

import swc from 'unplugin-swc';
import {defineConfig} from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/sonix-apis',
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
        target: 'es2021',
        keepClassNames: true,
      },
    }),
  ],
  test: {
    name: '@dms-sonix/sonix-apis',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{js,ts}'],
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
