import { GROUPS, type MotifGroup } from '../art/types';

/**
 * The start-screen order of motifs from their batches (docs/design/pixel-peel-motifs.md § 2): batches by file name
 * (`00-core.ts` first), each in its own order, then grouped by `GROUPS` (seasons, landscapes, animals, scenes,
 * landmarks), keeping that order within a group. Pure, so the render script (Node) uses it too.
 */
export function orderMotifs<T extends { readonly group: MotifGroup }>(batches: Readonly<Record<string, readonly T[]>>): T[] {
  const base = (path: string) => path.slice(path.lastIndexOf('/') + 1);
  const names = Object.keys(batches).sort((a, b) => (base(a) < base(b) ? -1 : base(a) > base(b) ? 1 : 0));
  const all = names.flatMap((name) => batches[name] ?? []);
  const rank = (m: T) => (GROUPS as readonly string[]).indexOf(m.group);
  return all.map((m, i) => ({ m, i })).sort((a, b) => rank(a.m) - rank(b.m) || a.i - b.i).map(({ m }) => m);
}
