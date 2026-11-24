import { beforeAll, describe, expect, it } from 'vitest';
import { compile, initialState, step, stateHash, type Action, type Catalogue } from '@wp/adventure-engine';
import { checkAdventure } from '@wp/adventure-engine/check';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { CONTENT_LOADERS } from '../src/content';
import { PROLOGUE } from '../src/structure';

const texts: Record<string, Catalogue> = {};
beforeAll(async () => {
  for (const l of SUPPORTED_LOCALES) texts[l] = await CONTENT_LOADERS[l]();
});

/** The golden walkthrough (also the shortest solution the checker finds). */
export const WALKTHROUGH: readonly Action[] = [
  { a: 'take', hs: 'lamp' },
  { a: 'talk', hs: 'keeper' },
  { a: 'choose', option: 'crossing' },
  { a: 'choose', option: 'bye' },
  { a: 'use', hs: 'path' },
  { a: 'examine', hs: 'board' },
  { a: 'deduce', x: 'ferry-rule', y: 'heron-notches' },
  { a: 'use', hs: 'door' },
  { a: 'take', hs: 'flask' },
  { a: 'combine', x: 'lamp', y: 'oil' },
  { a: 'useItem', item: 'lamp-filled', hs: 'hearth' },
  { a: 'travel', scene: 'jetty' },
  { a: 'useItem', item: 'lamp-lit', hs: 'keeper' },
  { a: 'use', hs: 'lock' },
  { a: 'use', hs: 'boat' }
];

describe('Adventure A prologue: content', () => {
  it('passes the content checker in all 16 locales: completable, no dead ends, full coverage, complete texts', () => {
    const r = checkAdventure(PROLOGUE, { texts });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.metrics.shortestSolution).toBe(WALKTHROUGH.length);
  });

  it('the golden walkthrough reaches the ending (end state pinned)', () => {
    const c = compile(PROLOGUE);
    const end = WALKTHROUGH.reduce((s, a) => {
      const r = step(c, s, a);
      expect(r.out.ok, JSON.stringify(a)).toBe(true);
      return r.state;
    }, initialState(c, 1));
    expect(end.ended).toBe('prologue-end');
    expect(end.goalsDone.sort()).toEqual(['ask-keeper', 'cross', 'light-lamp', 'open-lock']);
    expect(stateHash(end)).toBe(stateHash(WALKTHROUGH.reduce((s, a) => step(c, s, a).state, initialState(c, 1))));
  });

  it('stays within the text budget (design § 4.2: hard cap 14 k English words for the whole adventure)', () => {
    const words = Object.values(texts.en ?? {}).reduce((n, t) => n + t.split(/\s+/).length, 0);
    expect(words).toBeLessThan(1500);
  });

  it('has no text that names a direction a mirrored layout would contradict', () => {
    for (const t of Object.values(texts.en ?? {})) expect(t).not.toMatch(/\b(left|right)\b/i);
  });
});
