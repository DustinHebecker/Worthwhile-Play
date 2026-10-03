import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/test/**/*.test.ts', 'apps/**/test/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['packages/testing/src/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/**/src/**/*.ts', 'apps/web/src/**/*.ts'],
      exclude: ['**/*.d.ts', 'packages/testing/**', '**/locales/**'],
      reporter: ['text-summary', 'html', 'lcov']
    }
  }
});
