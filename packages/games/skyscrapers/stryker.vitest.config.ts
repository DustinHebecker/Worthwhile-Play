// Temporary: scopes a local Stryker run to this package's tests. Deleted after use.
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = resolve(import.meta.dirname, '../../..');
export default defineConfig({
  root,
  test: {
    include: ['packages/games/skyscrapers/test/rules.test.ts'],
    environment: 'node',
    setupFiles: ['packages/testing/src/setup.ts']
  }
});
