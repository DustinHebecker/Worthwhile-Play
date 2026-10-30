/**
 * Module hooks for the Node scripts of this folder (Node runs them with type stripping, without a bundler):
 *
 * - extensionless relative imports resolve to `.ts`, so the game's own sources load unchanged;
 * - `import.meta.glob('./dir/*.ts', { eager: true, import: 'NAME' })` and the lazy form (without `eager`), the only
 *   forms the game uses (`src/catalogue.ts`, `src/motifs/index.ts`), become explicit imports of the files the
 *   directory holds, sorted by name, as Vite does.
 *
 * Import this file first: `import './hooks.ts';`.
 */
import { register } from 'node:module';

const HOOKS = `
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(s, c, n) {
  try { return await n(s, c); } catch (e) { if (s.startsWith('.') && !/\\.[a-z]+$/.test(s)) return n(s + '.ts', c); throw e; }
}
const GLOB = /import\\.meta\\.glob(?:<[^>(]*>)?\\(\\s*'([^']+)'\\s*(?:,\\s*\\{([^}]*)\\})?\\s*\\)/g;
export async function load(url, context, next) {
  const result = await next(url, context);
  if (!url.endsWith('.ts') || result.source == null) return result;
  const source = String(result.source);
  if (!source.includes('import.meta.glob')) return result;
  const replaced = source.replace(GLOB, (_, pattern, opts = '') => {
    const m = /^(.*)\\/\\*(\\.[a-z]+)$/.exec(pattern);
    if (!m) throw new Error('hooks.ts: unsupported glob ' + pattern + ' in ' + url);
    const files = readdirSync(fileURLToPath(new URL(m[1] + '/', url))).filter((f) => f.endsWith(m[2])).sort();
    const name = /import:\\s*'(\\w+)'/.exec(opts)?.[1];
    const eager = /eager:\\s*true/.test(opts);
    const entries = files.map((f) => {
      const spec = JSON.stringify(m[1] + '/' + f);
      if (eager) return '[' + spec + ', (await import(' + spec + '))' + (name ? '.' + name : '') + ']';
      return '[' + spec + ', () => import(' + spec + ')' + (name ? '.then((x) => x.' + name + ')' : '') + ']';
    });
    return 'Object.fromEntries([' + entries.join(', ') + '])';
  });
  return { ...result, source: replaced };
}
`;

register(`data:text/javascript,${encodeURIComponent(HOOKS)}`);
