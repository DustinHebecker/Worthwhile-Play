import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { decodeAtlas } from '../src/atlas';
import { DIFFICULTIES } from '../src/compare';
import { ATLAS_DATA } from '../src/data/atlas.gen';
import { project } from '../src/geo';
import {
  back,
  checkCompare,
  checkFind,
  chooseOption,
  createRound,
  currentItem,
  guess,
  isAtlasState,
  isSummary,
  markReported,
  next,
  nextClue,
  restartRound,
  setGuessDraft,
  setMarker,
  settingsOf,
  showMystery,
  showRoute,
  skip,
  startChoice,
  step,
  summarize,
  targetDistanceKm,
  type AtlasState
} from '../src/rules';
import { shortestRoute, graphOf } from '../src/route';
import { AREAS, BANDS, ITEM_COUNT, MODES, bandOf, inReview, kindsOf, type CompareItem, type FindItem, type Item, type MysteryItem, type RouteItem } from '../src/state';

const atlas = decodeAtlas(ATLAS_DATA);
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const valid = (s: unknown) => isAtlasState(clone(s), atlas);

/** A round whose current item has the kind. */
function roundWith(kind: Item['kind'], seed = 1): AtlasState {
  return createRound(seed, 'medium', kind, 'world', atlas);
}
const item = <K extends Item['kind']>(s: AtlasState) => currentItem(s) as Extract<Item, { kind: K }>;

describe('rounds', () => {
  it('have the right number and order of items for every mode and region', () => {
    for (const mode of MODES)
      for (const area of AREAS) {
        const s = createRound(42, 'easy', mode, area, atlas);
        expect(s.items.map((i) => i.kind)).toEqual(kindsOf(mode, area));
        expect(s.items).toHaveLength(ITEM_COUNT[mode]);
        expect(valid(s)).toBe(true);
      }
    expect(kindsOf('mixed', 'world')).toEqual(['find', 'compare', 'mystery', 'find', 'compare', 'route']);
    expect(kindsOf('mixed', 'oceania')).toEqual(['find', 'compare', 'mystery', 'find', 'compare', 'find']);
  });

  it('are deterministic and never repeat a main target', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...MODES), fc.constantFrom(...AREAS), fc.constantFrom(...DIFFICULTIES), (seed, mode, area, d) => {
        const a = createRound(seed, d, mode, area, atlas);
        expect(createRound(seed, d, mode, area, atlas)).toEqual(a);
        const keys = a.items.flatMap((i) => (i.kind === 'find' ? [i.target.t === 'point' ? `p${i.target.at.join()}` : `${i.target.t}:${i.target.id}`] : i.kind === 'mystery' ? [`country:${i.target}`] : []));
        expect(new Set(keys).size).toBe(keys.length);
        expect(valid(a)).toBe(true);
      }),
      { numRuns: 60 }
    );
  });
});

describe('find', () => {
  it('moves the marker freely, then scores once at Check', () => {
    let s = roundWith('find');
    expect(checkFind(s, atlas)).toBe(s); // nothing to check yet
    s = setMarker(s, [1000, 2000]);
    expect(item<'find'>(s).draft).toEqual([1000, 2000]);
    expect(setMarker(s, [1000, 2000])).toBe(s);
    s = setMarker(s, [3681, -128]);
    expect(item<'find'>(s).answer).toBeNull();
    const checked = checkFind(s, atlas);
    const f = item<'find'>(checked);
    expect(f.answer).toEqual([3681, -128]);
    expect(f.km).toBe(Math.round(targetDistanceKm(atlas, f.target, 36.81, -1.28)));
    expect(f.band).toBe(bandOf(f.target.t, f.km!));
    // Committed: further changes are no-ops.
    expect(setMarker(checked, [0, 0])).toBe(checked);
    expect(checkFind(checked, atlas)).toBe(checked);
    expect(skip(checked)).toBe(checked);
    expect(valid(checked)).toBe(true);
  });

  it('rejects markers off the grid of integers', () => {
    const s = roundWith('find');
    expect(setMarker(s, [1.5, 0] as unknown as [number, number])).toBe(s);
    expect(setMarker(s, [18001, 0])).toBe(s);
    expect(setMarker(s, [0, 9001])).toBe(s);
  });

  it('puts a marker on the target on target', () => {
    for (let seed = 0; seed < 30; seed++) {
      let s = createRound(seed, 'easy', 'find', 'world', atlas);
      const f = item<'find'>(s);
      const at: [number, number] =
        f.target.t === 'point'
          ? f.target.at
          : f.target.t === 'city'
            ? [Math.round(atlas.city(f.target.id)!.lon * 100), Math.round(atlas.city(f.target.id)!.lat * 100)]
            : f.target.t === 'country'
              ? [Math.round(atlas.country(f.target.id)!.label[0] * 100), Math.round(atlas.country(f.target.id)!.label[1] * 100)]
              : [Math.round(atlas.feature(f.target.id)!.label[0] * 100), Math.round(atlas.feature(f.target.id)!.label[1] * 100)];
      s = checkFind(setMarker(s, at), atlas);
      // Label points of archipelagos may lie at sea, but always close to the country.
      expect(item<'find'>(s).band, JSON.stringify(f.target)).toBeLessThanOrEqual(f.target.t === 'country' ? 1 : 0);
    }
  });

  it('has bands with inclusive upper bounds', () => {
    for (const t of ['country', 'feature', 'city', 'point'] as const) {
      const [a, b, c] = BANDS[t];
      expect(bandOf(t, a)).toBe(0);
      expect(bandOf(t, a + 1)).toBe(1);
      expect(bandOf(t, b)).toBe(1);
      expect(bandOf(t, b + 1)).toBe(2);
      expect(bandOf(t, c)).toBe(2);
      expect(bandOf(t, c + 1)).toBe(3);
    }
    expect(BANDS.city).toEqual([100, 400, 1200]);
    expect(BANDS.point).toEqual([150, 500, 1500]);
  });
});

describe('compare', () => {
  it('chooses, changes its mind and commits', () => {
    let s = roundWith('compare');
    expect(checkCompare(s)).toBe(s);
    expect(chooseOption(s, 9)).toBe(s);
    s = chooseOption(s, 1);
    s = chooseOption(s, 0);
    expect(item<'compare'>(s).draft).toBe(0);
    s = checkCompare(s);
    expect(item<'compare'>(s).answer).toBe(0);
    expect(chooseOption(s, 1)).toBe(s);
    expect(valid(s)).toBe(true);
  });
});

describe('mystery', () => {
  it('reveals clues, takes unlimited guesses and solves on the target', () => {
    let s = roundWith('mystery');
    const m = item<'mystery'>(s);
    for (let i = 1; i < m.clues.length + 2; i++) s = nextClue(s);
    expect(item<'mystery'>(s).shown).toBe(m.clues.length);
    const wrong = atlas.countries.find((c) => c.id !== m.target)!.id;
    s = setGuessDraft(s, wrong, atlas);
    s = guess(s);
    expect(item<'mystery'>(s).guesses).toEqual([wrong]);
    expect(item<'mystery'>(s).end).toBeNull();
    expect(setGuessDraft(s, wrong, atlas)).toBe(s); // already guessed
    expect(setGuessDraft(s, 'XX', atlas)).toBe(s);
    expect(guess(s)).toBe(s); // no draft
    s = guess(setGuessDraft(s, m.target, atlas));
    expect(item<'mystery'>(s).end).toBe('solved');
    expect(valid(s)).toBe(true);
    expect(nextClue(s)).toBe(s);
  });

  it('can be shown without solving', () => {
    const s = showMystery(roundWith('mystery'));
    expect(item<'mystery'>(s).end).toBe('shown');
    expect(valid(s)).toBe(true);
  });
});

describe('route', () => {
  it('steps only to neighbours, goes back one step and arrives', () => {
    let s = roundWith('route');
    const r = item<'route'>(s);
    const path = shortestRoute(graphOf(atlas), r.from, r.to)!;
    expect(step(s, r.to === 'JP' ? 'FR' : 'JP', atlas)).toBe(s);
    expect(back(s)).toBe(s);
    s = step(s, path[1]!, atlas);
    expect(item<'route'>(s).path).toEqual(path.slice(0, 2));
    expect(step(s, path[0]!, atlas)).toBe(s); // no repeats
    s = back(s);
    expect(item<'route'>(s).path).toEqual([r.from]);
    for (const id of path.slice(1)) s = step(s, id, atlas);
    expect(item<'route'>(s).end).toBe('arrived');
    expect(item<'route'>(s).path.length - 1).toBe(r.best);
    expect(summarize(next(s)).shortest).toBe(1);
    expect(valid(s)).toBe(true);
  });

  it('can show a shortest route instead', () => {
    const s = showRoute(roundWith('route'));
    expect(item<'route'>(s).end).toBe('shown');
    expect(valid(s)).toBe(true);
  });
});

describe('round flow', () => {
  it('needs a review before Next, ends with the summary and reports once', () => {
    let s = createRound(7, 'easy', 'mixed', 'world', atlas);
    expect(next(s)).toBe(s);
    for (let i = 0; i < s.items.length; i++) {
      s = skip(s);
      expect(inReview(currentItem(s)!)).toBe(true);
      s = next(s);
    }
    expect(isSummary(s)).toBe(true);
    expect(next(s)).toBe(s);
    expect(skip(s)).toBe(s);
    const r = markReported(s);
    expect(r.reported).toBe(true);
    expect(markReported(r)).toBe(r);
    expect(markReported(createRound(7, 'easy', 'mixed', 'world', atlas)).reported).toBe(false);
    expect(valid(r)).toBe(true);
    const sum = summarize(r);
    expect(sum.skipped).toBe(6);
    expect(sum.finds + sum.compared + sum.solved + sum.arrived).toBe(0);
    expect(restartRound(r, atlas)).toEqual(createRound(7, 'easy', 'mixed', 'world', atlas));
  });

  it('survives random action sequences, always valid', () => {
    const action = fc.oneof(
      fc.tuple(fc.constant('marker'), fc.integer({ min: -18000, max: 18000 }), fc.integer({ min: -9000, max: 9000 })),
      fc.tuple(fc.constant('check'), fc.constant(0), fc.constant(0)),
      fc.tuple(fc.constant('option'), fc.integer({ min: -1, max: 4 }), fc.constant(0)),
      fc.tuple(fc.constant('clue'), fc.constant(0), fc.constant(0)),
      fc.tuple(fc.constant('guess'), fc.integer({ min: 0, max: 192 }), fc.constant(0)),
      fc.tuple(fc.constant('step'), fc.integer({ min: 0, max: 192 }), fc.constant(0)),
      fc.tuple(fc.constant('back'), fc.constant(0), fc.constant(0)),
      fc.tuple(fc.constant('skip'), fc.constant(0), fc.constant(0)),
      fc.tuple(fc.constant('next'), fc.constant(0), fc.constant(0))
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.constantFrom(...MODES), fc.array(action, { maxLength: 60 }), (seed, mode, actions) => {
        let s = createRound(seed, 'medium', mode, 'world', atlas);
        for (const [a, x, y] of actions) {
          const cur = currentItem(s);
          if (a === 'marker') s = setMarker(s, [x, y]);
          else if (a === 'check') s = checkCompare(checkFind(s, atlas));
          else if (a === 'option') s = chooseOption(s, x);
          else if (a === 'clue') s = nextClue(s);
          else if (a === 'guess') s = guess(setGuessDraft(s, atlas.countries[x]!.id, atlas));
          else if (a === 'step') {
            const route = cur?.kind === 'route' ? cur : null;
            const nb = route ? (graphOf(atlas).get(route.path[route.path.length - 1]!) ?? []) : [];
            s = step(s, nb.length ? nb[x % nb.length]! : atlas.countries[x]!.id, atlas);
          } else if (a === 'back') s = back(s);
          else if (a === 'skip') s = skip(s);
          else s = next(s);
          expect(valid(s)).toBe(true);
        }
      }),
      { numRuns: 120 }
    );
  });
});

describe('validation', () => {
  const base = createRound(3, 'medium', 'mixed', 'world', atlas);
  const tamper = (f: (s: AtlasState & { items: Item[] }) => void) => {
    const s = clone(base) as AtlasState & { items: Item[] };
    f(s);
    return isAtlasState(s, atlas);
  };

  it('never throws on junk and accepts generated states', () => {
    fc.assert(
      fc.property(fc.anything(), (x) => {
        expect(() => isAtlasState(x, atlas)).not.toThrow();
      }),
      { numRuns: 300 }
    );
    expect(isAtlasState(clone(base), atlas)).toBe(true);
    for (const junk of [null, 0, '', [], {}, { v: 1 }]) expect(isAtlasState(junk, atlas)).toBe(false);
  });

  it('rejects tampered fields', () => {
    const find = (s: { items: Item[] }) => s.items[0] as FindItem & { target: { id?: string; t: string; at?: number[] } };
    const compare = (s: { items: Item[] }) => s.items[1] as CompareItem;
    const mystery = (s: { items: Item[] }) => s.items[2] as MysteryItem & { clues: { id: string; arg: string }[] };
    const route = (s: { items: Item[] }) => s.items[5] as RouteItem;
    const w = (o: object) => o as Record<string, unknown>;
    expect(tamper((s) => w(s).data = 'ne-0/0')).toBe(false);
    expect(tamper((s) => w(s).seed = -1)).toBe(false);
    expect(tamper((s) => w(s).mode = 'chaos')).toBe(false);
    expect(tamper((s) => w(s).index = 7)).toBe(false);
    expect(tamper((s) => w(s).reported = true)).toBe(false);
    expect(tamper((s) => s.items.pop())).toBe(false);
    expect(tamper((s) => (w(s.items[0]!).target = { t: 'country', id: 'XK' }))).toBe(false); // not a UN member
    expect(tamper((s) => (w(s.items[0]!).target = { t: 'city', id: 'atlantis' }))).toBe(false);
    expect(tamper((s) => (w(s.items[0]!).target = { t: 'point', at: [500, 0] }))).toBe(false); // off its 10° grid
    expect(tamper((s) => (w(s.items[0]!).target = { t: 'point', at: [1000, 8000] }))).toBe(false); // beyond 70°
    expect(tamper((s) => Object.assign(find(s), { answer: [0, 0], km: 5000, band: 0 }))).toBe(false); // band ≠ km
    expect(tamper((s) => Object.assign(find(s), { answer: 'skip', km: 10, band: 0 }))).toBe(false);
    expect(tamper((s) => Object.assign(compare(s), { correct: 5 }))).toBe(false);
    expect(tamper((s) => Object.assign(compare(s), { options: ['a'] }))).toBe(false);
    expect(tamper((s) => Object.assign(mystery(s), { guesses: ['FR', 'FR'] }))).toBe(false);
    expect(tamper((s) => Object.assign(mystery(s), { end: 'solved' }))).toBe(false); // solved without the target
    expect(tamper((s) => Object.assign(mystery(s), { shown: 0 }))).toBe(false);
    expect(tamper((s) => mystery(s).clues.push({ id: 'nb', arg: 'XX' }))).toBe(false);
    expect(tamper((s) => Object.assign(route(s), { path: [route(s).from, 'JP'] }))).toBe(false); // not a neighbour
    expect(tamper((s) => Object.assign(route(s), { end: 'arrived' }))).toBe(false);
    expect(tamper((s) => Object.assign(route(s), { path: Array.from({ length: 61 }, () => route(s).from) }))).toBe(false);
    expect(tamper((s) => Object.assign(route(s), { extra: 1 }))).toBe(false);
    // Later items must be untouched; earlier ones committed.
    expect(tamper((s) => Object.assign(compare(s), { draft: 0 }))).toBe(false);
    expect(tamper((s) => Object.assign(s, { index: 1 }))).toBe(false);
  });
});

describe('settings', () => {
  it('round-trip through settingsOf for every combination', () => {
    for (const mode of MODES)
      for (const region of AREAS)
        for (const difficulty of DIFFICULTIES) {
          const s = createRound(1, difficulty, mode, region, atlas);
          const back = settingsOf(s);
          expect(back).toEqual({ mode, region, difficulty });
          const c = startChoice(back.difficulty, back);
          expect(createRound(1, c.difficulty, c.mode, c.region, atlas)).toEqual(s);
        }
  });

  it('treats untrusted choices with defaults', () => {
    expect(startChoice('zzz', { mode: 'chaos', region: 'moon' })).toEqual({ mode: 'mixed', region: 'world', difficulty: 'easy' });
    expect(startChoice(undefined, undefined)).toEqual({ mode: 'mixed', region: 'world', difficulty: 'easy' });
    expect(startChoice('hard', { mode: 'route', region: 'asia' })).toEqual({ mode: 'route', region: 'asia', difficulty: 'hard' });
  });
});

describe('geometry used by the view', () => {
  it('projects a target inside the map', () => {
    const [x, y] = project(36.81, -1.28);
    expect(Math.abs(x)).toBeLessThan(3);
    expect(Math.abs(y)).toBeLessThan(1.4);
  });
});
