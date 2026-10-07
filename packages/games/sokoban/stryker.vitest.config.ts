// Temporary: scopes a local Stryker run to this package's rules tests. Deleted after use.
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = resolve(import.meta.dirname, '../../..');
export default defineConfig({
  root,
  test: {
    include: ['packages/games/sokoban/test/rules.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
    setupFiles: ['packages/testing/src/setup.ts']
  }
});
