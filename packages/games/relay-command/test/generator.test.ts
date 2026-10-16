import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { observe } from '@wp/strategy-engine';
import { planAi } from '../src/ai';
import { depositsPerSide, generatedMapProblems, generateMap, POST_DISTANCE_SHARE, RICH_BALANCE, RICH_MIDDLE_FROM } from '../src/generator';
import { applyTool, blankMap, isFair, MAP_HEIGHTS, MAP_WIDTHS, type EditMap } from '../src/maps';
import { isValidState, lockTurn, newGame, planOrder, PLAYER, OPPONENT, rulesOf } from '../src/rules';
import { FIELD_EXERCISE } from '../src/scenarios';

const SIZES = MAP_WIDTHS.flatMap((w) => MAP_HEIGHTS.map((h) => [w, h] as const));

describe('map generator (I6c, P9)', () => {
  it('every size and seed gives a map the independent validator accepts; the same seed gives the same map', () => {
    for (const [w, h] of SIZES) {
      for (let seed = 0; seed < 6; seed++) {
        const map = generateMap(w, h, seed, 'Random');
        expect(generatedMapProblems(map), `${w}×${h} seed ${seed}`).toEqual([]);
        expect(map).toMatchObject({ w, h, name: 'Random' });
        expect(generateMap(w, h, seed, 'Random')).toEqual(map);
      }
      // Different seeds give different maps.
      expect(new Set([0, 1, 2, 3].map((seed) => generateMap(w, h, seed).terrain)).size).toBeGreaterThan(1);
    }
  });

  it('property: any seed on any size passes the validator (P9)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...SIZES), fc.integer({ min: 0, max: 0xffffffff }), ([w, h], seed) => {
        expect(generatedMapProblems(generateMap(w, h, seed))).toEqual([]);
      }),
      { numRuns: 150 }
    );
  });

  it('the map rule: deposits per side grow with the area; from 200 cells a rich pair sits near the middle', () => {
    expect(depositsPerSide(12, 10)).toBe(2);
    expect(depositsPerSide(24, 16)).toBe(5);
    for (const [w, h] of SIZES) {
      const map = generateMap(w, h, 3);
      const rich = map.deposits.filter((d) => d.size === 'rich');
      expect(map.deposits.length - rich.length, `${w}×${h}`).toBe(2 * depositsPerSide(w, h));
      expect(rich.length, `${w}×${h}`).toBe(w * h >= RICH_MIDDLE_FROM ? 2 : 0);
      for (const d of rich) expect(Math.abs(d.y - (h - 1) / 2), `${w}×${h} rich at ${d.x},${d.y}`).toBeLessThanOrEqual(3.5);
      // Point-symmetric, sides swapped; the posts far apart.
      expect(isFair(map)).toBe(true);
      const [a, b] = [0, 1].map((side) => map.units.find((u) => u.side === side && u.kind === 'command-post')!);
      expect(Math.hypot(a!.x - b!.x, a!.y - b!.y)).toBeGreaterThanOrEqual(POST_DISTANCE_SHARE * Math.max(w, h));
    }
  });

  it('the validator finds what is wrong: asymmetry, a walled-in deposit, a unit out of cover, too few deposits, close posts', () => {
    const good = generateMap(16, 12, 5);
    expect(generatedMapProblems(good)).toEqual([]);
    // One side's cell changed: no longer symmetric.
    const tree = good.terrain[0] === 'f' ? '.' : 'f';
    expect(generatedMapProblems({ ...good, terrain: tree + good.terrain.slice(1) })).toContain('not symmetric');
    // A deposit walled in by ridges (mirrored, so still symmetric).
    const d = good.deposits.find((x) => x.size === undefined && good.units.every((u) => Math.max(Math.abs(u.x - x.x), Math.abs(u.y - x.y)) > 1))!;
    let walled: EditMap = good;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && d.x + dx >= 0 && d.y + dy >= 0 && d.x + dx < good.w && d.y + dy < good.h) walled = applyTool(walled, { type: 'terrain', code: '^' }, d.x + dx, d.y + dy, true);
    expect(generatedMapProblems(walled).some((p) => p.startsWith(`deposit ${d.x},${d.y}`))).toBe(true);
    // A squad far from its post (mirrored): out of cover.
    const squad = good.units.find((u) => u.side === 1 && u.kind === 'rifles')!;
    const far = { x: squad.x < good.w / 2 ? good.w - 1 : 0, y: good.h / 2 - 1 };
    const moved: EditMap = { ...good, units: good.units.map((u) => (u === squad ? { ...u, ...far } : u.side === 0 && u.kind === 'rifles' && u.x === good.w - 1 - squad.x && u.y === good.h - 1 - squad.y ? { ...u, x: good.w - 1 - far.x, y: good.h - 1 - far.y } : u)) };
    expect(generatedMapProblems(moved)).toEqual(expect.arrayContaining(['side 1 unit out of cover', 'side 0 unit out of cover']));
    // Two deposits fewer (one per side).
    const plainDeposits = good.deposits.filter((x) => x.size === undefined);
    const drop = plainDeposits[plainDeposits.length - 1]!;
    const fewer = { ...good, deposits: good.deposits.filter((x) => !(x.x === drop.x && x.y === drop.y) && !(x.x === good.w - 1 - drop.x && x.y === good.h - 1 - drop.y)) };
    expect(generatedMapProblems(fewer)).toContain('too few deposits');
    // Posts next to each other (a small mirrored map built in the editor).
    let close = applyTool(blankMap(12, 8), { type: 'unit', kind: 'command-post', side: 1 }, 6, 3, true);
    close = applyTool(close, { type: 'unit', kind: 'rifles', side: 1 }, 7, 3, true);
    expect(generatedMapProblems(close)).toContain('posts too close');
  });

  it('the validator, check by check (review of PR #45): each planted defect is named, a clean map has none', () => {
    const big = generateMap(24, 16, 5);
    expect(generatedMapProblems(big)).toEqual([]);
    // Not a map at all; no posts; posts with nothing else (not playable).
    expect(generatedMapProblems({ ...big, terrain: big.terrain.slice(1) })).toEqual(['invalid map']);
    expect(generatedMapProblems({ ...big, units: big.units.filter((u) => u.kind !== 'command-post') })).toContain('no posts');
    expect(generatedMapProblems({ ...big, units: big.units.filter((u) => u.kind === 'command-post') })).toContain('not playable');
    // Post distance against half the LONGER side (16×8: 8 cells, not 4): exactly 8 is far enough, 7 is not.
    const pair = (bx: number) => {
      let m = applyTool(blankMap(16, 8), { type: 'unit', kind: 'command-post', side: 0 }, 0, 0, false);
      m = applyTool(m, { type: 'unit', kind: 'command-post', side: 1 }, bx, 0, false);
      m = applyTool(m, { type: 'unit', kind: 'rifles', side: 0 }, 0, 1, false);
      return applyTool(m, { type: 'unit', kind: 'rifles', side: 1 }, bx, 1, false);
    };
    expect(generatedMapProblems(pair(8))).not.toContain('posts too close');
    expect(generatedMapProblems(pair(7))).toContain('posts too close');
    // A deposit one post reaches and the other does not (a river splits the map).
    let split = pair(12);
    for (let y = 0; y < 8; y++) split = applyTool(split, { type: 'terrain', code: '~' }, 6, y, false);
    split = applyTool(split, { type: 'deposit' }, 2, 4, false);
    expect(generatedMapProblems(split)).toContain('deposit 2,4 unreachable');
    // The deposit rule on a map with a rich pair: one plain pair fewer is too few; the rich pair gone is named.
    const plain = big.deposits.filter((d) => d.size === undefined && d.y < 8);
    const last = plain[plain.length - 1]!;
    const withoutPair = (x: number, y: number) => ({ ...big, deposits: big.deposits.filter((d) => !(d.x === x && d.y === y) && !(d.x === 23 - x && d.y === 15 - y)) });
    expect(generatedMapProblems(withoutPair(last.x, last.y))).toEqual(['too few deposits']);
    const rich = big.deposits.find((d) => d.size === 'rich' && d.y < 8)!;
    expect(generatedMapProblems(withoutPair(rich.x, rich.y))).toEqual(['no rich middle']);
    // The rich pair moved into the corners: symmetric, but no longer contested.
    const corners = { ...withoutPair(rich.x, rich.y) };
    const cornered = { ...corners, deposits: [...corners.deposits, { x: 0, y: 0, size: 'rich' as const }, { x: 23, y: 15, size: 'rich' as const }] };
    expect(cornered.units.some((u) => (u.x === 0 && u.y === 0) || (u.x === 23 && u.y === 15)) || '~^'.includes(cornered.terrain[0]!)).toBe(false);
    expect(generatedMapProblems(cornered)).toEqual(expect.arrayContaining(['rich deposit 0,0 not contested', 'rich deposit 23,15 not contested']));
    // A squad walled in by ridges on every side (a small mirrored map): it could never move off its cell.
    let walled = applyTool(blankMap(16, 8), { type: 'unit', kind: 'command-post', side: 1 }, 14, 1, true);
    walled = applyTool(walled, { type: 'unit', kind: 'rifles', side: 1 }, 10, 3, true);
    expect(generatedMapProblems(walled).some((p) => p.includes('walled in'))).toBe(false);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) walled = applyTool(walled, { type: 'terrain', code: '^' }, 10 + dx, 3 + dy, true);
    expect(generatedMapProblems(walled)).toEqual(expect.arrayContaining(['unit 10,3 walled in', 'unit 5,4 walled in']));
  });

  it('every rich deposit is contested: about as far from both posts by ground path cost (owner decision)', () => {
    for (const [w, h] of SIZES.filter(([w, h]) => w * h >= RICH_MIDDLE_FROM)) {
      for (let seed = 0; seed < 4; seed++) {
        const map = generateMap(w, h, seed);
        expect(map.deposits.filter((d) => d.size === 'rich'), `${w}×${h} seed ${seed}`).toHaveLength(2);
        expect(generatedMapProblems(map).filter((p) => p.startsWith('rich')), `${w}×${h} seed ${seed}`).toEqual([]);
      }
    }
    expect(RICH_BALANCE).toBeLessThanOrEqual(1.25);
  });

  it('refuses inputs it cannot honour: a size the editor does not offer, an odd height, a name too long', () => {
    expect(() => generateMap(13, 10, 1)).toThrow(RangeError);
    expect(() => generateMap(12, 9, 1)).toThrow(RangeError);
    expect(() => generateMap(12, 10, 1, 'x'.repeat(41))).toThrow(RangeError);
    // The seed is taken as an unsigned 32-bit integer.
    expect(generateMap(12, 10, 2 ** 32 + 5)).toEqual(generateMap(12, 10, 5));
    expect(generateMap(12, 10, 5.7)).toEqual(generateMap(12, 10, 5));
  });

  it('the opponent plays generated maps of every size class: every turn a valid save', () => {
    for (const [w, h, seed] of [[10, 8, 1], [16, 12, 2], [24, 16, 3]] as const) {
      let s = newGame(seed, FIELD_EXERCISE, 'normal', 12, false, generateMap(w, h, seed, `Random ${w}×${h}`));
      expect(s.scenario).toBe('custom');
      while (s.phase === 'plan') {
        for (const c of planAi(observe(s.world, rulesOf(s), PLAYER), rulesOf(s), 'normal')) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
        s = lockTurn(s);
        expect(isValidState(JSON.parse(JSON.stringify(s))), `${w}×${h} turn ${s.world.turn}`).toBe(true);
      }
      expect(s.world.turn).toBe(12);
      expect(s.world.entities.some((e) => e.side === OPPONENT)).toBe(true);
    }
  }, 120_000);
});
