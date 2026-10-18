import { describe, expect, it } from 'vitest';
import { BASE_KINDS, instanceIds, type CardEntry, type Cond, type Mod } from '../src/cards';
import { isValidState, newGame, step, DEFAULT_SETTINGS } from '../src/rules';
import { WORLD_IDS, WORLDS, instanceSet, worldDecks, type WorldId } from '../src/worlds';
import { selfPlay } from './harness';

/*
 * Worlds and mixing (design § 3.4, § 4.7, § 6.1): every world has the same composition and level budget, uses the
 * shared vocabulary in a way that is meaningful on its own, and any combination of worlds deals a valid game that
 * ends.
 */
const worlds = WORLD_IDS.map((id) => WORLDS[id]!);

/** Number of physical cards per type (copies counted). */
const composition = (cards: readonly CardEntry[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const c of cards) out[c.type] = (out[c.type] ?? 0) + (c.copies ?? 1);
  return out;
};

const budget = (cards: readonly CardEntry[]) => ({
  monsterLevels: cards.reduce((n, c) => n + (c.type === 'monster' ? c.level : 0), 0),
  itemBonus: cards.reduce((n, c) => n + (c.type === 'item' ? c.bonus : 0), 0),
  itemValue: cards.reduce((n, c) => n + (c.type === 'item' ? c.value : 0), 0),
  monsterLoot: cards.reduce((n, c) => n + (c.type === 'monster' ? c.loot : 0), 0),
  slots: cards.filter((c) => c.type === 'item').map((c) => (c.type === 'item' ? c.slot : '')).sort().join()
});

/** All conditions a card refers to (its own and its wearer's). */
const conds = (c: CardEntry): Cond[] => {
  const mods: readonly Mod[] = [...('mods' in c ? (c.mods ?? []) : []), ...(c.type === 'item' ? (c.self ?? []) : [])];
  return mods.flatMap((m) => (m.when ? [m.when] : []));
};

/** All combinations of worlds (non-empty subsets). */
const combinations: WorldId[][] = [];
for (let mask = 1; mask < 1 << WORLD_IDS.length; mask++) combinations.push(WORLD_IDS.filter((_, i) => mask & (1 << i)));

describe('every world', () => {
  it('has the same composition and level budget as Kampfzwerge (142 cards)', () => {
    const reference = WORLDS.kz!;
    for (const world of worlds) {
      expect(composition(world.cards), world.id).toEqual(composition(reference.cards));
      expect(budget(world.cards), world.id).toEqual(budget(reference.cards));
      expect(world.cards.reduce((n, c) => n + (c.copies ?? 1), 0), world.id).toBe(142);
      expect(world.sets.map((s) => s.bonus), world.id).toEqual(reference.sets.map((s) => s.bonus));
    }
  });

  it('prefixes its ids with the world id, and its sets name only its own items', () => {
    for (const world of worlds) {
      for (const c of world.cards) expect(c.id.startsWith(`${world.id}.`), c.id).toBe(true);
      for (const set of world.sets) {
        expect(set.items, set.id).toHaveLength(3);
        for (const item of set.items) expect(world.cards.find((c) => c.id === item)?.type, `${set.id} ${item}`).toBe('item');
        // A set's items fit together: three different slots.
        const slots = set.items.map((i) => world.cards.find((c) => c.id === i)).map((c) => (c?.type === 'item' ? c.slot : ''));
        expect(new Set(slots).size, set.id).toBe(3);
      }
    }
  });

  it('uses the shared vocabulary meaningfully on its own (design § 3.4)', () => {
    for (const world of worlds) {
      const monsters = world.cards.filter((c) => c.type === 'monster');
      const kinds = new Set([...monsters.map((m) => m.kind), ...world.cards.flatMap((c) => (c.type === 'origin' ? [c.kind] : []))]);
      const traits = new Set(world.cards.flatMap((c) => ('traits' in c ? (c.traits ?? []) : [])));
      const families = new Set(world.cards.flatMap((c) => (c.type === 'origin' && c.family ? [c.family] : [])));
      // All 9 base kinds among the monsters, at least 8 traits, exactly two feuding families of two origins each.
      expect(new Set(monsters.map((m) => m.kind)).size, world.id).toBe(BASE_KINDS.length);
      expect(traits.size, world.id).toBeGreaterThanOrEqual(8);
      expect(families.size, world.id).toBe(2);
      for (const f of families) expect(world.cards.filter((c) => c.type === 'origin' && c.family === f), `${world.id} ${f}`).toHaveLength(2);
      // References: families always hit the own world; ≥ 70 % of kind/trait references hit something in it.
      const refs = world.cards.flatMap(conds);
      for (const r of refs) if (r.family) expect(families.has(r.family), `${world.id} family ${r.family}`).toBe(true);
      const typed = refs.flatMap((r) => [...(r.kind ? [kinds.has(r.kind)] : []), ...(r.trait ? [traits.has(r.trait)] : []), ...(r.lacks ? [traits.has(r.lacks)] : [])]);
      expect(typed.filter(Boolean).length / typed.length, world.id).toBeGreaterThanOrEqual(0.7);
    }
  });
});

describe('mixing worlds (§ 4.7)', () => {
  it('any combination puts every card of the chosen worlds into its pile exactly once', () => {
    for (const combo of combinations) {
      const { encounter, loot } = worldDecks(combo);
      expect(encounter.length + loot.length, combo.join('+')).toBe(142 * combo.length);
      expect(new Set([...encounter, ...loot]).size, combo.join('+')).toBe(142 * combo.length);
      expect(encounter.length, combo.join('+')).toBe(76 * combo.length);
      const expected = combo.flatMap((w) => WORLDS[w]!.cards.flatMap(instanceIds));
      expect([...instanceSet(combo)].sort()).toEqual(expected.sort());
    }
  });

  it('deals a valid game for every combination, with cards of each chosen world only', () => {
    for (const combo of combinations) {
      const s = step(newGame(7), 0, { a: 'start', settings: { ...DEFAULT_SETTINGS, worlds: combo, opponents: 5 } })!;
      expect(isValidState(s), combo.join('+')).toBe(true);
      const dealt = s.players.flatMap((p) => p.hand);
      for (const card of [...dealt, ...s.encounter, ...s.loot]) expect(combo.some((w) => card.startsWith(`${w}.`)), card).toBe(true);
      // A game of one world is no longer valid with another world's card in it.
      const other = WORLD_IDS.find((w) => !combo.includes(w));
      if (other) {
        const broken = { ...s, loot: [...s.loot.slice(1), WORLDS[other]!.cards[0]!.id] };
        expect(isValidState(broken), `${combo.join('+')} with a ${other} card`).toBe(false);
      }
    }
  });

  it('rejects unknown, duplicate or empty world lists', () => {
    for (const worlds of [[], ['kz', 'kz'], ['xx'], ['kz', 'xx']]) {
      const s = step(newGame(7), 0, { a: 'start', settings: { ...DEFAULT_SETTINGS, worlds: worlds as WorldId[] } });
      expect(s, JSON.stringify(worlds)).toBeNull();
    }
  });
});

describe('balance per world combination (self-play)', () => {
  // One test per combination keeps each well inside the timeout under load.
  // Each world alone and all worlds together get 8 games; the 25 partial mixes 2 each (keeps the suite fast).
  it.each(combinations.map((c) => [c.join('+'), c] as const))('%s: games end in a reasonable number of rounds', (_, combo) => {
    const rounds: number[] = [];
    const games = combo.length === 1 || combo.length === WORLD_IDS.length ? 8 : 2;
    for (let seed = 1; seed <= games; seed++) {
      const { state } = selfPlay(seed, { worlds: [...combo], opponents: 2 + (seed % 4) });
      expect(isValidState(state)).toBe(true);
      expect(state.phase).toBe('over');
      rounds.push(state.round);
    }
    rounds.sort((a, b) => a - b);
    const median = rounds[rounds.length >> 1]!;
    // Kampfzwerge alone: median ≈ 9–14 rounds (§ 10.4); every combination stays in the same band.
    expect(median, combo.join('+')).toBeGreaterThanOrEqual(5);
    expect(median, combo.join('+')).toBeLessThanOrEqual(20);
    expect(Math.max(...rounds), combo.join('+')).toBeLessThan(60);
  });
});
