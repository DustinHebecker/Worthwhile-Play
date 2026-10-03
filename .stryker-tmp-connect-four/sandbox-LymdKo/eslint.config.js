// @ts-nocheck
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'coverage/**', 'reports/**', '.stryker-tmp/**', 'playwright-report/**', 'test-results/**', '.wrangler/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always'],
      // Determinism rule: game logic must use the seeded PRNG from @wp/game-core.
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Use the seeded PRNG from @wp/game-core (createRng) instead of Math.random().' }]
    }
  },
  {
    // Architecture rule: games may only depend on shared packages, never on other games or the app.
    files: ['packages/games/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['@wp/game-*', '!@wp/game-core'], message: 'Games must not import other games. Move shared logic into a shared package via the orchestrator.' },
        { group: ['@wp/web', '**/apps/**'], message: 'Games must not import the app shell.' },
        { group: ['../../*/src/**', '../../../*/src/**'], message: 'Import shared packages by their package name.' }
      ] }]
    }
  }
);
