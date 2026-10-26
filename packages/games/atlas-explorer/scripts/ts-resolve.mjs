// Dev-only loader hook for scripts/build-atlas.ts: lets Node's type stripping resolve the repository's
// extensionless relative imports (`../src/build/topology`) to `.ts` files. No dependencies.
import { register } from 'node:module';

const hook = `
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if ((specifier.startsWith('.') || specifier.startsWith('/')) && !/\\.[cm]?[jt]s$/.test(specifier)) return next(specifier + '.ts', context);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(hook), import.meta.url);
