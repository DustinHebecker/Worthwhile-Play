import { describe, expect, it } from 'vitest';
import { ENEMIES, type EnemyKind } from '@wp/td-core';
import { defenceShare, expectedWave, padsNear, planRound, PRODUCERS_PER_ROUND, produceOrder, PROFILES, WORK_BUDGET } from '../src/ai';
import { DUEL, ownPad } from '../src/maps';
import { applyPlan, checkPlan, levyOf, MAX_PRODUCERS, newGame, PRODUCERS, producersOf, productionOf, RESEARCH, type HoldState, type PlanCommand } from '../src/rules';

/** Fast tests of the computer in the Duel with production (its strength: ai.long.test.ts). */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const atRound = (s: HoldState, round: number): HoldState => ({ ...s, round, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })) });
const pads = (side: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = 0; y < DUEL.h; y++) for (let x = 0; x < DUEL.w; x++) if (ownPad(DUEL, side, x, y)) out.push([x, y]);
  return out;
};
/** `s` with side `side` holding `credits` and these buildings (on its pads in order). */
function withBuildings(s: HoldState, side: number, kinds: readonly (keyof typeof PRODUCERS)[], credits = 10_000): HoldState {
  let t = clone(s);
  t.sides[side]!.credits = credits;
  const free = pads(side);
  kinds.forEach((kind, i) => (t = applyPlan(t, side, { t: 'produce', kind, x: free[i]![0], y: free[i]![1] })));
  return t;
}
const legal = (s: HoldState, side: number, cmds: readonly PlanCommand[]): HoldState =>
  cmds.reduce((t, c) => {
    expect(checkPlan(t, side, c), JSON.stringify(c)).toBeNull();
    return applyPlan(t, side, c);
  }, s);
const threat = (w: readonly EnemyKind[]) => w.reduce((n, k) => n + ENEMIES[k].threat, 0);

describe('what the computer expects in the Duel with production', () => {
  it('the other side’s buildings plus the levy; its last wave if that was stronger; a plain wave at first', () => {
    const plain = newGame(1, 'normal');
    expect(expectedWave(plain, 1)).toEqual(Array(8).fill('walker'));
    const built = atRound(withBuildings(plain, 0, ['barracks', 'garage']), 14);
    expect(expectedWave(built, 1)).toEqual([...productionOf(built, 0), ...levyOf(built)]);
    const strong = clone(built);
    strong.sides[0].lastWave = Array(30).fill('brute');
    expect(threat(expectedWave(strong, 1))).toBe(90);
    // The shop Duel still expects the last wave.
    const shop = clone(newGame(1, 'normal', 'duel', { waves: 'shop' }));
    shop.sides[0].lastWave = ['runner'];
    expect(expectedWave(shop, 1)).toEqual(['runner']);
  });

  it('may spend all but its kept share on defence, as against the outside force', () => {
    for (const level of ['normal', 'hard'] as const) {
      expect(defenceShare(PROFILES[level], 'vs-small', true)).toBeCloseTo(1 - PROFILES[level].keep, 9);
      expect(defenceShare(PROFILES[level], 'vs-small', false)).toBe(PROFILES[level].defence);
    }
  });
});

describe('the computer’s production', () => {
  it('Easy builds one Drill yard per round on its least exposed pad, keeping its share', () => {
    const s = newGame(1, 'easy');
    const plan = produceOrder(s, 1, PROFILES.easy, 0);
    expect(plan).toHaveLength(PRODUCERS_PER_ROUND);
    const far = padsNear(s, 1, DUEL.lanes[0]!, 3).reverse()[0]!;
    expect(plan[0]).toEqual({ t: 'produce', kind: 'barracks', x: far[0], y: far[1] });
    // Not when it would go below what it keeps.
    expect(produceOrder(s, 1, PROFILES.easy, s.sides[1].credits - PRODUCERS.barracks + 1)).toEqual([]);
    expect(produceOrder(s, 1, PROFILES.easy, s.sides[1].credits - PRODUCERS.barracks)).toHaveLength(1);
  });

  it('stops at MAX_PRODUCERS and when no pad is free', () => {
    const full = withBuildings(newGame(1, 'normal'), 1, Array(MAX_PRODUCERS).fill('barracks'));
    expect(produceOrder(full, 1, PROFILES.normal, 0).some((c) => c.t === 'produce' && c.kind !== 'lab')).toBe(false);
    let packed = clone(newGame(1, 'easy'));
    packed.sides[1].credits = 100_000;
    for (const [x, y] of pads(1)) packed = applyPlan(packed, 1, { t: 'extractor', x, y });
    expect(produceOrder(packed, 1, PROFILES.easy, 0)).toEqual([]);
  });

  it('Normal: with three buildings a Lab first; then one research item, the best gain per credit', () => {
    const three = withBuildings(newGame(1, 'normal'), 1, ['barracks', 'barracks', 'barracks']);
    const plan = produceOrder(three, 1, PROFILES.normal, 0);
    expect(plan[0]).toMatchObject({ t: 'produce', kind: 'lab' });
    const research = plan.filter((c) => c.t === 'research');
    expect(research).toHaveLength(1);
    // Drill yards only: Armour plates (+1 threat per Walker) beats Field repair (+1 per Drill yard) per credit.
    expect(research[0]).toEqual({ t: 'research', id: 'shields' });
    legal(three, 1, plan);
    // Two buildings: no Lab yet.
    expect(produceOrder(withBuildings(newGame(1, 'normal'), 1, ['barracks', 'barracks']), 1, PROFILES.normal, 0).some((c) => c.t === 'produce' && c.kind === 'lab')).toBe(false);
  });

  it('researches only what adds threat to the buildings it has, and nothing twice', () => {
    const hangars = withBuildings(newGame(1, 'normal'), 1, ['hangar', 'hangar', 'hangar', 'lab']);
    const first = produceOrder(hangars, 1, PROFILES.normal, 0).find((c) => c.t === 'research');
    // Only Twin hangars or Siege works can add anything for Hangars.
    expect(['hangars', 'siege']).toContain(first && first.t === 'research' ? first.id : 'none');
    const done = clone(hangars);
    done.sides[1].research = ['hangars', 'siege'];
    expect(produceOrder(done, 1, PROFILES.normal, 0).some((c) => c.t === 'research')).toBe(false);
    // Not below what it keeps.
    const poor = clone(hangars);
    poor.sides[1].credits = RESEARCH.hangars - 1;
    expect(produceOrder(poor, 1, PROFILES.normal, 0).some((c) => c.t === 'research')).toBe(false);
  });

  it('Normal builds the kind worth most per credit against the other side’s towers', () => {
    const open = newGame(1, 'normal');
    expect(produceOrder(open, 1, PROFILES.normal, 0)[0]).toMatchObject({ t: 'produce', kind: 'barracks' });
    // Against artillery, which cannot hit flying units, Hangars are worth most; Hard finds the same by simulation.
    let guarded = clone(open);
    guarded.sides[0].credits = 100_000;
    for (const [x, y] of padsNear(guarded, 0, DUEL.lanes[1]!, 2).slice(0, 10)) guarded = applyPlan(guarded, 0, { t: 'place', kind: 'artillery', x, y });
    expect(produceOrder(guarded, 1, PROFILES.normal, 0)[0]).toMatchObject({ t: 'produce', kind: 'hangar' });
    expect(produceOrder(guarded, 1, PROFILES.hard, 0)[0]).toMatchObject({ t: 'produce', kind: 'hangar' });
    // Its own towers do not count, nor does the other side's Extractor.
    expect(produceOrder(withBuildings(open, 1, []), 1, PROFILES.normal, 0)[0]).toMatchObject({ kind: 'barracks' });
  });

  it('Hard simulates the wave each kind would send; out of budget it builds Drill yards', () => {
    const s = newGame(1, 'hard');
    const plan = produceOrder(s, 1, PROFILES.hard, 0);
    expect(plan).toHaveLength(1);
    expect(plan[0]!.t).toBe('produce');
    expect(produceOrder(s, 1, PROFILES.hard, 0, { used: WORK_BUDGET })[0]).toMatchObject({ kind: 'barracks' });
  });
});

describe('planRound in the Duel with production', () => {
  it.each(['easy', 'normal', 'hard'] as const)('%s: never buys, every command legal, deterministic', (level) => {
    const s = atRound(withBuildings(newGame(1, level), 1, ['barracks', 'garage', 'hangar'], 1500), 4);
    const plan = planRound(s, 1, level);
    expect(plan.some((c) => c.t === 'buy' || c.t === 'unbuy' || c.t === 'workshop')).toBe(false);
    expect(plan.some((c) => c.t === 'produce')).toBe(true);
    legal(s, 1, plan);
    expect(planRound(s, 1, level)).toEqual(plan);
    expect(producersOf(legal(s, 1, plan), 1)).toBeGreaterThan(3);
  });
});
