/// <reference types='vitest' />
import type {IncomingMessage, ServerResponse} from 'node:http';
import path from 'node:path';
import {reactRouter} from '@react-router/dev/vite';
import {defineConfig} from 'vite';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/client-web',
  server: {
    port: 3004,
    host: 'localhost',
    strictPort: true,
    watch: {
      ignored: ['**/node_modules/**'],
    },
    warmup: {
      // Pre-transform all route and component modules on startup so Vite discovers
      // their deps before first navigation, preventing mid-session optimizer reloads.
      clientFiles: ['./app/pages/**/*.tsx', './app/components/**/*.tsx'],
    },
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [
    !process.env.VITEST && reactRouter(),
    // Suppress Chrome DevTools well-known URL errors
    {
      name: 'suppress-devtools-errors',
      configureServer(server: {
        middlewares: {
          use: (
            arg0: (
              req: import('http').IncomingMessage,
              res: import('http').ServerResponse,
              next: () => void,
            ) => void,
          ) => void;
        };
      }) {
        server.middlewares.use(
          (req: IncomingMessage, res: ServerResponse<IncomingMessage>, next: () => void) => {
            if (req.url?.includes('.well-known/appspecific/com.chrome.devtools.json')) {
              res.statusCode = 204;
              res.end();
              return;
            }
            next();
          },
        );
      },
    },
  ].filter(Boolean),
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'app/components'),
      core: path.resolve(__dirname, 'app/core'),
      i18n: path.resolve(__dirname, 'app/i18n.ts'),
      middleware: path.resolve(__dirname, 'app/middleware'),
      pages: path.resolve(__dirname, 'app/pages'),
      types: path.resolve(__dirname, 'app/types'),
      // TODO: Remove stubs once @dms/data-models is split into sub-path exports:
      //   @dms/data-models        → pure types, interfaces, Money (frontend + backend)
      //   @dms/data-models/server → decorated DTOs with class-validator/swagger (backend only)
      // Also revisit when @react-router/dev supports Vite 8 (Rolldown handles CJS/ESM better).
      // See: https://vite.dev/blog/announcing-vite-8
      //
      // These packages are backend-only (NestJS). The shared @dms/data-models barrel
      // re-exports decorated DTOs that import them, causing CJS/ESM failures in the browser.
      // No-op stubs replace them entirely in client builds.
      'class-validator': path.resolve(__dirname, 'app/stubs/class-validator.stub.ts'),
      'class-transformer': path.resolve(__dirname, 'app/stubs/class-transformer.stub.ts'),
      '@nestjs/swagger': path.resolve(__dirname, 'app/stubs/nestjs-swagger.stub.ts'),
      'reflect-metadata': path.resolve(__dirname, 'app/stubs/reflect-metadata.stub.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@nestjs/mapped-types'],
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      '@mui/icons-material',
    ],
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: '@dms-sonix/client-web',
    watch: false,
    passWithNoTests: true,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
