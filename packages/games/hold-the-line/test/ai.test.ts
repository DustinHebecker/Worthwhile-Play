import { describe, expect, it } from 'vitest';
import { archetypeOf } from '@wp/strategy-engine';
import { BASE_TOWERS, ENEMIES, TD_RULESET, TOWERS, type EnemyKind } from '@wp/td-core';
import { attackOrder, defenceShare, defenceSims, expectedWave, leakage, padsNear, planRound, probeOrder, PROBE_SIMS, PROFILES, WORK_BUDGET, type Meter } from '../src/ai';
import { DUEL, ownPad } from '../src/maps';
import { applyPlan, checkPlan, externalWave, EXTRACTOR_PRICE, newGame, SHOP, START_CREDITS, UNIT_PRICES, type HoldState, type PlanCommand } from '../src/rules';

/** Fast unit tests of the computer opponent; its strength is measured in ai.long.test.ts. */
const fresh = (difficulty: 'easy' | 'normal' | 'hard' = 'normal'): HoldState => newGame(1, difficulty);
const incoming = (side: number) => DUEL.lanes[1 - side]!;
const mirror = ([x, y]: readonly [number, number]): [number, number] => [DUEL.w - 1 - x, DUEL.h - 1 - y];
const mirrorCmd = (c: PlanCommand): PlanCommand => ('x' in c ? { ...c, ...Object.fromEntries([['x', DUEL.w - 1 - c.x], ['y', DUEL.h - 1 - c.y]]) } : c);
/** The state as if it were round `round` (plan phase, log long enough). */
const atRound = (s: HoldState, round: number): HoldState => ({ ...s, round, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })) });
const totalThreat = (wave: readonly EnemyKind[]) => wave.reduce((n, k) => n + ENEMIES[k].threat, 0);
const ownPads = (side: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = 0; y < DUEL.h; y++) for (let x = 0; x < DUEL.w; x++) if (ownPad(DUEL, side, x, y)) out.push([x, y]);
  return out;
};
/** Lane cells of `side`'s incoming route within `r` of a pad (squared distance, like the planner). */
const exposure = (side: number, [x, y]: readonly [number, number], r: number) => {
  const cells = new Set<string>();
  const pts = incoming(side).points;
  for (let i = 1; i < pts.length; i++) {
    let [cx, cy] = pts[i - 1]!;
    const [tx, ty] = pts[i]!;
    cells.add(`${cx},${cy}`);
    while (cx !== tx || cy !== ty) {
      cx += Math.sign(tx - cx);
      cy += Math.sign(ty - cy);
      cells.add(`${cx},${cy}`);
    }
  }
  return [...cells].map((c) => c.split(',').map(Number) as [number, number]).filter(([cx, cy]) => (cx - x) ** 2 + (cy - y) ** 2 <= r * r).length;
};

describe('padsNear', () => {
  it('lists every free own pad, most exposed first', () => {
    const s = fresh();
    for (const side of [0, 1]) {
      const pads = padsNear(s, side, incoming(side), 3);
      expect(pads).toHaveLength(ownPads(side).length);
      for (const p of pads) expect(ownPad(DUEL, side, p[0], p[1])).toBe(true);
      const counts = pads.map((p) => exposure(side, p, 3));
      expect(counts).toEqual([...counts].sort((a, b) => b - a));
      expect(counts[0]).toBeGreaterThan(counts.at(-1)!);
    }
  });

  it('leaves out taken pads', () => {
    let s = fresh();
    const [x, y] = padsNear(s, 0, incoming(0), 3)[0]!;
    s = applyPlan(s, 0, { t: 'place', kind: 'gun', x, y });
    const pads = padsNear(s, 0, incoming(0), 3);
    expect(pads).toHaveLength(ownPads(0).length - 1);
    expect(pads).not.toContainEqual([x, y]);
  });

  it('respects the minimum range (cells closer than it do not count)', () => {
    const s = fresh();
    const all = padsNear(s, 0, incoming(0), 99, 0);
    const none = padsNear(s, 0, incoming(0), 99, 99);
    expect(all).toHaveLength(none.length);
    // With every lane cell out of the band, the order falls back to the fixed cell order.
    const key = ([x, y]: [number, number]) => y * DUEL.w + x;
    expect(none.map(key)).toEqual([...none.map(key)].sort((a, b) => a - b));
    // A band [2, 3] ranks differently from the disc of radius 3 (the cells next to the lane drop out).
    expect(padsNear(s, 0, incoming(0), 3, 2)).not.toEqual(padsNear(s, 0, incoming(0), 3));
  });

  it('gives mirrored sides mirrored rankings', () => {
    const s = fresh();
    for (const r of [1, 3, 5]) expect(padsNear(s, 1, incoming(1), r)).toEqual(padsNear(s, 0, incoming(0), r).map(mirror));
  });
});

describe('expectedWave and leakage', () => {
  it('expects eight walkers before anything was sent, then the last wave of the other side', () => {
    const s = fresh();
    expect(expectedWave(s, 1)).toEqual(Array(8).fill('walker'));
    const seen: HoldState = { ...s, sides: [{ ...s.sides[0], lastWave: ['brute', 'glider'] }, s.sides[1]] };
    expect(expectedWave(seen, 1)).toEqual(['brute', 'glider']);
    expect(expectedWave(seen, 0)).toEqual(Array(8).fill('walker'));
  });

  it('without towers the whole wave gets through at full health', () => {
    const s = fresh();
    for (const wave of [['walker'], ['brute', 'glider', 'swarm', 'swarm']] as EnemyKind[][]) {
      expect(leakage(s.world, s, 1, wave)).toBeCloseTo(totalThreat(wave), 6);
      expect(leakage(s.world, s, 0, wave)).toBeCloseTo(totalThreat(wave), 6);
    }
    expect(leakage(s.world, s, 1, [])).toBe(0);
  });

  it('only the defender’s towers count; a tower beside the lane lets less through', () => {
    const s = fresh();
    const wave: EnemyKind[] = Array(4).fill('walker');
    const [x, y] = padsNear(s, 1, incoming(1), 3)[0]!;
    const defended = applyPlan(s, 1, { t: 'place', kind: 'gun', x, y });
    const loss = leakage(defended.world, defended, 1, wave);
    expect(loss).toBeLessThan(totalThreat(wave));
    expect(loss).toBeGreaterThanOrEqual(0);
    // The same tower is the attacker's when side 0 defends: it does not help side 0.
    expect(leakage(defended.world, defended, 0, wave)).toBeCloseTo(totalThreat(wave), 6);
    // Extractors never shoot.
    const [ex, ey] = padsNear(s, 1, incoming(1), 3)[0]!;
    const eco = applyPlan(s, 1, { t: 'extractor', x: ex, y: ey });
    expect(leakage(eco.world, eco, 1, wave)).toBeCloseTo(totalThreat(wave), 6);
  });

  it('a partly damaged unit counts by the share of health it kept', () => {
    const s = fresh();
    const [x, y] = padsNear(s, 1, incoming(1), 3).at(-1)!;
    const weak = applyPlan(s, 1, { t: 'place', kind: 'gun', x, y });
    const loss = leakage(weak.world, weak, 1, ['brute']);
    expect(loss).toBeLessThanOrEqual(ENEMIES.brute.threat);
    expect(loss).toBeGreaterThan(0);
  });
});

describe('attackOrder', () => {
  it('easy sends walkers and a runner', () => {
    expect(attackOrder(fresh(), 1, PROFILES.easy)).toEqual(['walker', 'walker', 'runner']);
  });

  it('without defenders it ranks by threat per credit, the best kind twice', () => {
    const rate = (k: EnemyKind) => ENEMIES[k].threat / UNIT_PRICES[k]!;
    const ranked = [...SHOP].sort((a, b) => rate(b) - rate(a) || SHOP.indexOf(a) - SHOP.indexOf(b));
    expect(attackOrder(fresh(), 1, PROFILES.normal)).toEqual([ranked[0], ranked[0], ranked[1]]);
  });

  it('turns away from what the defence hits hardest', () => {
    let s = fresh();
    const plain = attackOrder(s, 1, PROFILES.normal);
    // Many anti-ground towers on side 0: kinds the guns hit well score lower.
    for (const [x, y] of padsNear(s, 0, incoming(0), 3).slice(0, 2)) s = applyPlan(s, 0, { t: 'place', kind: 'gun', x, y });
    s = { ...s, sides: [{ ...s.sides[0], credits: 5000 }, s.sides[1]] };
    for (const [x, y] of padsNear(s, 0, incoming(0), 3).slice(0, 8)) s = applyPlan(s, 0, { t: 'place', kind: 'artillery', x, y });
    const order = attackOrder(s, 1, PROFILES.normal);
    expect(order).not.toEqual(plain);
    const vsGround = archetypeOf(TD_RULESET, 'artillery')!.weapon!.vs;
    const armor = (k: EnemyKind) => archetypeOf(TD_RULESET, k)!.armor;
    // The first choice is not hit harder by artillery than the plain first choice.
    expect(vsGround[armor(order[0]!)]).toBeLessThanOrEqual(vsGround[armor(plain[0]!)]);
    // Towers of the attacker itself do not count.
    expect(attackOrder(s, 0, PROFILES.normal)).toEqual(attackOrder(fresh(), 0, PROFILES.normal));
  });
});

describe('probeOrder', () => {
  it('picks an order at least as good as every single kind, and fits the budget', () => {
    let s = fresh();
    const [x, y] = padsNear(s, 0, incoming(0), 3)[0]!;
    s = applyPlan(s, 0, { t: 'place', kind: 'gun', x, y });
    const order = probeOrder(s, 1, 0);
    expect(order.length).toBeGreaterThanOrEqual(1);
    expect(order.length).toBeLessThanOrEqual(2);
    for (const k of order) expect(SHOP).toContain(k);
    const fill = (o: readonly EnemyKind[]) => {
      const wave: EnemyKind[] = [];
      let left = START_CREDITS;
      for (let i = 0; wave.length < 8; i++) {
        const k = o[i % o.length]!;
        if (UNIT_PRICES[k]! > left) break;
        wave.push(k);
        left -= UNIT_PRICES[k]!;
      }
      return wave;
    };
    const best = leakage(s.world, s, 0, fill(order));
    for (const k of SHOP) expect(best + 0.01).toBeGreaterThanOrEqual(leakage(s.world, s, 0, fill([k])));
  });

  it('falls back to walkers when nothing is affordable', () => {
    const s = fresh();
    const broke: HoldState = { ...s, sides: [s.sides[0], { ...s.sides[1], credits: 0 }] };
    expect(probeOrder(broke, 1, 0)).toEqual(['walker']);
    expect(probeOrder(s, 1, START_CREDITS)).toEqual(['walker']);
  });
});

describe('planRound', () => {
  const legal = (s: HoldState, side: number, plan: PlanCommand[]) => {
    let t = s;
    for (const cmd of plan) {
      expect(checkPlan(t, side, cmd)).toBeNull();
      t = applyPlan(t, side, cmd);
    }
    return t;
  };

  it('easy: one gun on the most exposed pad, then walkers and a runner', () => {
    const s = fresh('easy');
    const plan = planRound(s, 1, 'easy');
    const [x, y] = padsNear(s, 1, incoming(1), 3)[0]!;
    expect(plan[0]).toEqual({ t: 'place', kind: 'gun', x, y });
    const kinds = plan.slice(1).map((c) => (c.t === 'buy' ? c.kind : c.t));
    expect(kinds.slice(0, 3)).toEqual(['walker', 'walker', 'runner']);
    const after = legal(s, 1, plan);
    expect(after.sides[1].wave.length).toBe(8);
  });

  it('normal: an extractor first, on the least exposed own pad', () => {
    const s = fresh();
    const plan = planRound(s, 1, 'normal');
    const first = plan[0]!;
    expect(first.t).toBe('extractor');
    if (first.t !== 'extractor') return;
    const least = Math.min(...ownPads(1).map((p) => exposure(1, p, 3)));
    expect(exposure(1, [first.x, first.y], 3)).toBe(least);
    expect(padsNear(s, 1, incoming(1), 3).at(-1)).toEqual([first.x, first.y]);
    expect(plan.filter((c) => c.t === 'extractor')).toHaveLength(1);
  });

  it('builds no extractor when it cannot afford one with room to defend, or after round 2', () => {
    const s = fresh();
    const poor: HoldState = { ...s, sides: [s.sides[0], { ...s.sides[1], credits: EXTRACTOR_PRICE + 149 }] };
    expect(planRound(poor, 1, 'normal').some((c) => c.t === 'extractor')).toBe(false);
    const rich: HoldState = { ...s, sides: [s.sides[0], { ...s.sides[1], credits: EXTRACTOR_PRICE + 150 }] };
    expect(planRound(rich, 1, 'normal').some((c) => c.t === 'extractor')).toBe(true);
    expect(planRound(atRound(s, 3), 1, 'normal').some((c) => c.t === 'extractor')).toBe(false);
    expect(planRound(atRound(s, 2), 1, 'normal').some((c) => c.t === 'extractor')).toBe(true);
    expect(planRound(s, 1, 'easy').some((c) => c.t === 'extractor')).toBe(false);
  });

  it.each(['easy', 'normal', 'hard'] as const)('%s: every command is legal, the share kept, the wave filled', (level) => {
    const s = fresh(level);
    const plan = planRound(s, 1, level);
    const after = legal(s, 1, plan);
    expect(after.sides[1].credits).toBeGreaterThanOrEqual(Math.floor(START_CREDITS * PROFILES[level].keep));
    expect(after.sides[1].wave.length).toBeGreaterThan(0);
    // It defends: at least one tower.
    expect(after.world.entities.some((e) => e.side === 1 && Object.hasOwn(TOWERS, e.kind))).toBe(true);
  });

  it('normal and hard defend with towers that cut the expected leakage', () => {
    for (const level of ['normal', 'hard'] as const) {
      const s = fresh(level);
      const after = legal(s, 1, planRound(s, 1, level));
      const wave = expectedWave(s, 1);
      expect(leakage(after.world, after, 1, wave)).toBeLessThan(leakage(s.world, s, 1, wave));
    }
  });

  it('is pure and deterministic, and mirrors between the seats', () => {
    for (const level of ['easy', 'normal', 'hard'] as const) {
      const s = fresh(level);
      const before = JSON.stringify(s);
      const plan = planRound(s, 1, level);
      expect(JSON.stringify(s)).toBe(before);
      expect(planRound(s, 1, level)).toEqual(plan);
      expect(planRound(s, 0, level).map(mirrorCmd)).toEqual(plan);
    }
  });

  it('defaults to side 1 at the game’s difficulty', () => {
    const s = fresh('hard');
    expect(planRound(s)).toEqual(planRound(s, 1, 'hard'));
  });

  it('stops buying at the credits it keeps', () => {
    const s = fresh();
    const tight: HoldState = { ...atRound(s, 5), sides: [s.sides[0], { ...s.sides[1], credits: 60 }] };
    const after = legal(tight, 1, planRound(tight, 1, 'normal'));
    expect(after.sides[1].credits).toBeGreaterThanOrEqual(Math.floor(60 * PROFILES.normal.keep));
  });
});

describe('planner details', () => {
  it('defence share and simulation budget per mode', () => {
    expect(defenceShare(PROFILES.normal, 'vs-small')).toBe(PROFILES.normal.defence);
    expect(defenceShare(PROFILES.normal, 'external-small')).toBe(1 - PROFILES.normal.keep);
    expect(defenceShare(PROFILES.easy, 'external-small')).toBe(1);
    expect(defenceSims(PROFILES.normal, 'vs-small')).toBe(PROFILES.normal.sims);
    expect(defenceSims(PROFILES.normal, 'external-small')).toBe(PROFILES.normal.sims);
    expect(defenceSims(PROFILES.hard, 'vs-small')).toBe(PROFILES.hard.sims - PROBE_SIMS);
    expect(defenceSims(PROFILES.hard, 'external-small')).toBe(Math.floor((PROFILES.hard.sims * 3) / 2));
  });

  it('External Small: from round 2 on, it expects that round’s force (not last round’s waves)', () => {
    const s = atRound(newGame(1, 'normal', 'crossing'), 3);
    const t: HoldState = { ...s, pressure: 2 };
    expect(expectedWave(t, 1)).toEqual(externalWave(t));
    expect(expectedWave(t, 1)).not.toEqual(Array(8).fill('walker'));
  });

  it('External Small: the defence may use all but the kept share', () => {
    const s = atRound(newGame(1, 'normal', 'crossing'), 9);
    let t = s;
    for (const cmd of planRound(s, 1, 'normal')) t = applyPlan(t, 1, cmd);
    // VS Small's share (55 % of 300) would allow 165 at most.
    expect(START_CREDITS - t.sides[1].credits).toBeGreaterThan(Math.floor(START_CREDITS * PROFILES.normal.defence));
    expect(t.sides[1].credits).toBeGreaterThanOrEqual(START_CREDITS - Math.floor(START_CREDITS * defenceShare(PROFILES.normal, 'external-small')));
  });

  it('chooses first the tower that saves the most threat per credit (oracle)', () => {
    const s0 = atRound(newGame(1, 'normal'), 3);
    const s: HoldState = { ...s0, sides: [s0.sides[0], { ...s0.sides[1], credits: 400 }] };
    const wave = expectedWave(s, 1);
    const loss = leakage(s.world, s, 1, wave);
    const floor = 400 - Math.floor(400 * PROFILES.normal.defence);
    let best: { cmd: PlanCommand; value: number } | null = null;
    for (const kind of BASE_TOWERS) {
      const weapon = archetypeOf(TD_RULESET, kind)?.weapon;
      if (!weapon) continue;
      for (const [x, y] of padsNear(s, 1, incoming(1), weapon.range, weapon.minRange).slice(0, PROFILES.normal.pads)) {
        const cmd: PlanCommand = { t: 'place', kind, x, y };
        if (checkPlan(s, 1, cmd) !== null) continue;
        const next = applyPlan(s, 1, cmd);
        if (next.sides[1].credits < floor) continue;
        const l = leakage(next.world, next, 1, wave);
        const value = (loss - l) / (400 - next.sides[1].credits);
        if (loss - l > 0.01 && (!best || value > best.value)) best = { cmd, value };
      }
    }
    expect(best).not.toBeNull();
    expect(planRound(s, 1, 'normal')[0]).toEqual(best!.cmd);
  });
});

describe('leakage bounds', () => {
  const defended = (): HoldState => {
    let s: HoldState = { ...newGame(1, 'normal'), sides: [newGame(1, 'normal').sides[0], { ...newGame(1, 'normal').sides[1], credits: 2000 }] };
    for (const [x, y] of padsNear(s, 1, incoming(1), 3).slice(0, 1)) s = applyPlan(s, 1, { t: 'place', kind: 'gun', x, y });
    return s;
  };

  it('with a bound it stops early: the result is at least the bound, never more than the whole threat', () => {
    const s = defended();
    const wave: EnemyKind[] = Array(12).fill('walker');
    const full = leakage(s.world, s, 1, wave);
    expect(full).toBeGreaterThan(0.5);
    expect(full).toBeLessThan(totalThreat(wave));
    const bounded = leakage(s.world, s, 1, wave, 0.5);
    expect(bounded).toBeGreaterThanOrEqual(0.5);
    expect(bounded).toBeLessThanOrEqual(totalThreat(wave));
    // Stopping early counts what is still on its way as through, so it differs from the full run.
    expect(bounded).not.toBeCloseTo(full, 6);
    // A bound above the result changes nothing.
    expect(leakage(s.world, s, 1, wave, full + 1)).toBeCloseTo(full, 9);
  });

  it('a wave longer than the simulation cap counts what is left as through', () => {
    const s = newGame(1, 'normal');
    // 300 Walkers 8 ticks apart: the last ones are still waiting when the cap (1500 ticks) is reached.
    const wave: EnemyKind[] = Array(300).fill('walker');
    expect(leakage(s.world, s, 1, wave)).toBeCloseTo(totalThreat(wave), 6);
    // With guns, the units on their way at the cap count by the health they kept.
    const g = defended();
    const through = leakage(g.world, g, 1, wave);
    expect(through).toBeGreaterThan(totalThreat(wave) / 2);
    expect(through).toBeLessThan(totalThreat(wave));
  });
});

describe('bounded planning work', () => {
  it('leakage counts its work in entity-ticks; a bound equal to the result changes nothing', () => {
    let s = newGame(1, 'normal');
    const [x, y] = padsNear(s, 1, incoming(1), 3)[0]!;
    s = applyPlan(s, 1, { t: 'place', kind: 'gun', x, y });
    const wave: EnemyKind[] = Array(10).fill('walker');
    const m: Meter = { used: 0 };
    const full = leakage(s.world, s, 1, wave, Infinity, m);
    expect(m.used).toBeGreaterThan(wave.length);
    // Without towers there is less to simulate per tick.
    const bare = newGame(1, 'normal');
    const m2: Meter = { used: 0 };
    leakage(bare.world, bare, 1, wave, Infinity, m2);
    expect(m2.used).toBeLessThan(m.used);
    // A run stops only once its loss is clearly above the bound.
    expect(leakage(s.world, s, 1, wave, full)).toBe(full);
  });

  it('with the budget used up, no more defence candidates are tried', () => {
    const s = atRound(newGame(1, 'normal'), 3);
    const free = planRound(s, 1, 'normal');
    const spent = planRound(s, 1, 'normal', { used: WORK_BUDGET });
    expect(free.some((c) => c.t === 'place' || c.t === 'upgrade')).toBe(true);
    expect(spent.some((c) => c.t === 'place' || c.t === 'upgrade')).toBe(false);
    // With a little budget left it still plans (the work of one wave simulation is far below it).
    expect(planRound(s, 1, 'normal', { used: WORK_BUDGET / 2 }).some((c) => c.t === 'place')).toBe(true);
  });

  it('a plan records its work in the meter it is given', () => {
    const m: Meter = { used: 0 };
    planRound(atRound(newGame(1, 'normal'), 3), 1, 'normal', m);
    expect(m.used).toBeGreaterThan(0);
    expect(m.used).toBeLessThan(WORK_BUDGET);
  });

  it('the budget is a hard bound: a simulation that would pass it stops there and is never chosen (review of PR #107)', () => {
    const s = atRound(newGame(1, 'normal'), 3);
    const wave = Array.from({ length: 20 }, () => 'brute' as const);
    const full: Meter = { used: 0 };
    const through = leakage(s.world, s, 1, wave, Infinity, full);
    expect(Number.isFinite(through)).toBe(true);
    // The same simulation with less budget left than it needs: unknown, and the meter stops at the bound.
    const near: Meter = { used: WORK_BUDGET - Math.floor(full.used / 2) };
    expect(leakage(s.world, s, 1, wave, Infinity, near)).toBe(Infinity);
    expect(near.used).toBeGreaterThanOrEqual(WORK_BUDGET);
    expect(near.used - WORK_BUDGET).toBeLessThan(200);
    // Past the first simulation, a plan started just below the bound adds nothing beyond that one.
    const first: Meter = { used: 0 };
    leakage(s.world, s, 1, Array.from({ length: 8 }, () => 'walker' as const), Infinity, first, Infinity);
    const m: Meter = { used: WORK_BUDGET - 500 };
    planRound(s, 1, 'normal', m);
    expect(m.used - WORK_BUDGET).toBeLessThanOrEqual(first.used);
  });

  it('the first simulation of a round always runs, so the computer still defends with the budget nearly spent', () => {
    const s = atRound(newGame(1, 'normal'), 3);
    const m: Meter = { used: WORK_BUDGET - 1 };
    planRound(s, 1, 'normal', m);
    // It measured where it stands (well past the bound), and tried no candidate after that.
    expect(m.used).toBeGreaterThan(WORK_BUDGET + 200);
  });

  it('Hard keeps Walkers once the budget is used up', () => {
    const s = newGame(1, 'hard');
    expect(probeOrder(s, 1, 0, { used: WORK_BUDGET })).toEqual([SHOP[0]]);
    expect(probeOrder(s, 1, 0, { used: 0 })).toEqual(probeOrder(s, 1, 0));
  });
});

describe('planner budgets', () => {
  it('the simulation budget of a level limits the candidates it tries', () => {
    const s = atRound(newGame(1, 'normal'), 3);
    const saved = PROFILES.normal.sims;
    try {
      // One simulation: only the current loss is measured, no candidate is tried.
      (PROFILES.normal as { sims: number }).sims = 1;
      expect(planRound(s, 1, 'normal').some((c) => c.t === 'place')).toBe(false);
      (PROFILES.normal as { sims: number }).sims = 2;
      expect(planRound(s, 1, 'normal').filter((c) => c.t === 'place').length).toBeLessThanOrEqual(1);
    } finally {
      (PROFILES.normal as { sims: number }).sims = saved;
    }
    expect(planRound(s, 1, 'normal').filter((c) => c.t === 'place').length).toBeGreaterThanOrEqual(1);
  });

  it('Hard’s probe tries further orders while it has budget (against guns another order wins)', () => {
    let s: HoldState = { ...newGame(1, 'hard'), sides: [{ ...newGame(1, 'hard').sides[0], credits: 2000 }, newGame(1, 'hard').sides[1]] };
    for (const [x, y] of padsNear(s, 0, incoming(0), 3).slice(0, 4)) s = applyPlan(s, 0, { t: 'place', kind: 'gun', x, y });
    const free = probeOrder(s, 1, 0, { used: 0 });
    expect(free).not.toEqual([SHOP[0]]);
    expect(probeOrder(s, 1, 0, { used: WORK_BUDGET })).toEqual([SHOP[0]]);
  });
});
