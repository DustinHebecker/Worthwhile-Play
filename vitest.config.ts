import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/test/**/*.test.ts', 'apps/**/test/**/*.test.ts'],
    environment: 'node',
    // jsdom view tests that render all 16 locales can exceed the 5 s default on busy CI runners.
    testTimeout: 20_000,
    setupFiles: ['packages/testing/src/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/**/src/**/*.ts', 'apps/web/src/**/*.ts'],
      exclude: ['**/*.d.ts', 'packages/testing/**', '**/locales/**'],
      reporter: ['text-summary', 'html', 'lcov']
    }
  }
});
