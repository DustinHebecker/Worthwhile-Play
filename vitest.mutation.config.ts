import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import base from './vitest.config';

// Used only by Stryker (stryker.config.json → vitest.configFile; ADR 0021). Every mutant re-runs the
// tests that cover it, so AI-strength, statistical and oracle-search suites are left out here: they
// take seconds to minutes each, time out under instrumentation and kill few mutants that the fast
// unit and property tests do not. `pnpm test` and CI still run every one of them.
export default mergeConfig(
  base,
  defineConfig({
    test: {
      exclude: [
        ...configDefaults.exclude,
        '**/*.long.test.ts',
        '**/*.slow.test.ts'
      ]
    }
  })
);
