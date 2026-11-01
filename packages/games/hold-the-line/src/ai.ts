import { archetypeOf, type World } from '@wp/strategy-engine';
import { BASE_TOWERS, ENEMIES, TD_RULESET, tickLanes, TOWERS, type EnemyKind, type LaneRun, type PendingSpawn, type Route } from '@wp/td-core';
import { ownPad } from './maps';
import {
  applyPlan,
  capacityOf,
  checkPlan,
  EXTRACTOR_PRICE,
  extractorsOf,
  mapOf,
  MAX_WORKSHOPS,
  SHOP,
  UNIT_PRICES,
  WORKSHOP_PRICE,
  type Difficulty,
  type HoldState,
  type PlanCommand
} from './rules';

/**
 * The computer opponent of "Hold the Line" (docs/design/tower-defense.md § 16.3). It plans at the
 * start of a round from what any side could see then: both sides' structures and the wave each side
 * sent last round, never the player's plan of this round. It plays by the same rules and prices; the
 * levels differ in how far it thinks, not in what it gets:
 * - easy: one tower beside the incoming lane per round, a plain wave;
 * - normal: towers chosen by trying them against the wave it expects (one round ahead), an
 *   extractor early, a wave that avoids the player's strongest defence;
 * - hard: tries more placements and chooses its wave by trying candidate waves against the player's
 *   towers (it keeps to the base wave size: workshops did not pay off in measurement).
 * Planning time is bounded by a fixed number of wave simulations per round (`sims`).
 * Deterministic: no randomness, ties broken by fixed order.
 */

interface Profile {
  /** Share of credits for defence (the rest goes to the wave, a little is kept for interest). */
  defence: number;
  keep: number;
  lookahead: boolean;
  pads: number;
  steps: number;
  extractors: number;
  workshops: boolean;
  /** Choose the attack wave by trying candidate waves against the other side's towers. */
  probe: boolean;
  /** Most wave simulations per round (bounds the planning time, whatever the credits). */
  sims: number;
}

/** Wave simulations Hard keeps for choosing its attack wave (6 single kinds and 15 pairs). */
const PROBE_SIMS = 21;

const PROFILES: Record<Difficulty, Profile> = {
  easy: { defence: 0.5, keep: 0, lookahead: false, pads: 1, steps: 1, extractors: 0, workshops: false, probe: false, sims: 0 },
  normal: { defence: 0.55, keep: 0.1, lookahead: true, pads: 2, steps: 3, extractors: 1, workshops: false, probe: false, sims: 30 },
  hard: { defence: 0.55, keep: 0.1, lookahead: true, pads: 3, steps: 4, extractors: 1, workshops: false, probe: true, sims: 55 }
};

const cellsOf = (route: Route): [number, number][] => {
  const out: [number, number][] = [];
  const pts = route.points;
  for (let i = 1; i < pts.length; i++) {
    let [x, y] = pts[i - 1]!;
    const [tx, ty] = pts[i]!;
    while (x !== tx || y !== ty) {
      out.push([x, y]);
      x += Math.sign(tx - x);
      y += Math.sign(ty - y);
    }
    out.push([tx, ty]);
  }
  return out;
};

/** Own free pads ranked by how many cells of `route` lie within `range` (ties: fixed cell order in the side's frame). */
function padsNear(s: HoldState, side: number, route: Route, range: number, minRange = 0): [number, number][] {
  const map = mapOf(s);
  const cells = cellsOf(route);
  const out: [number, number, number][] = [];
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (!ownPad(map, side, x, y) || s.world.entities.some((e) => e.x === x && e.y === y)) continue;
      const n = cells.filter(([cx, cy]) => {
        const d = (cx - x) ** 2 + (cy - y) ** 2;
        return d <= range * range && d >= minRange * minRange;
      }).length;
      out.push([n, x, y]);
    }
  }
  // Side 1 orders cells from the opposite corner, so mirrored positions get mirrored choices.
  const key = (x: number, y: number) => (side === 1 ? (map.h - 1 - y) * map.w + (map.w - 1 - x) : y * map.w + x);
  return out.sort((a, b) => b[0] - a[0] || key(a[1], a[2]) - key(b[1], b[2])).map(([, x, y]) => [x, y]);
}

/** The wave a side expects: what the other side sent last round, or a plain first wave. */
const expectedWave = (s: HoldState, side: number): EnemyKind[] => {
  const last = s.sides[1 - side]!.lastWave;
  return last.length > 0 ? last : Array.from({ length: 8 }, () => 'walker' as const);
};

/** Threat of `wave` that would get through `side`'s current defence, weighted by health kept. */
function leakage(world: World, s: HoldState, side: number, wave: readonly EnemyKind[]): number {
  const route = mapOf(s).lanes[1 - side]!;
  // Only the attacking side's units run; its route index here is 0 of a one-route list.
  // Only what can matter: the defender's towers and extractors (the attacker's own structures never
  // fire at its own units, and a raider's shots at an extractor do not change what gets through).
  let w: World = { ...world, entities: world.entities.filter((e) => e.side === side && Object.hasOwn(TOWERS, e.kind)), projectiles: [] };
  let at = 0;
  const pending: PendingSpawn[] = wave.map((kind) => {
    const p = { at, kind, route: 0, side: 1 - side };
    at += kind === 'swarm' ? 3 : 8;
    return p;
  });
  let run: LaneRun = { tick: 0, pending, walkers: [] };
  let loss = 0;
  for (let i = 0; i < 1500 && (run.pending.length > 0 || run.walkers.length > 0); i++) {
    const step = tickLanes(w, run, [route]);
    w = step.world;
    run = step.run;
    for (const l of step.leaks) loss += (ENEMIES[l.kind].threat * l.hp) / (archetypeOf(TD_RULESET, l.kind)?.hp ?? 1);
  }
  return loss;
}

/** Plans a side's round (the computer is side 1; tests also let it play side 0). Pure and deterministic. */
export function planRound(state: HoldState, side = 1, difficulty: Difficulty = state.difficulty): PlanCommand[] {
  const profile = PROFILES[difficulty];
  const map = mapOf(state);
  const incoming = map.lanes[1 - side]!;
  const plan: PlanCommand[] = [];
  let s = state;
  const apply = (cmd: PlanCommand): boolean => {
    if (checkPlan(s, side, cmd) !== null) return false;
    s = applyPlan(s, side, cmd);
    plan.push(cmd);
    return true;
  };
  const own = () => s.sides[side]!;
  const start = own().credits;

  // 1. Economy: extractors early, on the own pad farthest from the incoming lane.
  if (s.round <= 2 && extractorsOf(s, side) < profile.extractors && start >= EXTRACTOR_PRICE + 150) {
    const far = padsNear(s, side, incoming, 99).reverse()[0];
    if (far) apply({ t: 'extractor', x: far[0], y: far[1] });
  }

  // 2. Defence against the wave it expects.
  // The defence budget is a share of what the round started with (an early extractor must not starve it).
  const floor = Math.max(0, own().credits - Math.floor(start * profile.defence));
  const wave = expectedWave(s, side);
  let sims = 0;
  const threat = (st: HoldState): number => {
    sims++;
    return leakage(st.world, st, side, wave);
  };
  if (!profile.lookahead) {
    const [x, y] = padsNear(s, side, incoming, 3)[0] ?? [-1, -1];
    apply({ t: 'place', kind: 'gun', x, y });
  } else {
    let loss = threat(s);
    for (let step = 0; step < profile.steps && loss > 0; step++) {
      const candidates: PlanCommand[] = [];
      for (const kind of BASE_TOWERS) {
        const weapon = archetypeOf(TD_RULESET, kind)?.weapon;
        if (!weapon) continue;
        for (const [x, y] of padsNear(s, side, incoming, weapon.range, weapon.minRange).slice(0, profile.pads)) candidates.push({ t: 'place', kind, x, y });
      }
      for (const e of s.world.entities) {
        if (e.side !== side || !Object.hasOwn(TOWERS, e.kind)) continue;
        for (const kind of TOWERS[e.kind]!.next) candidates.push({ t: 'upgrade', id: e.id, kind });
      }
      let best: { cmd: PlanCommand; loss: number; value: number } | null = null;
      for (const cmd of candidates) {
        if (sims >= profile.sims - (profile.probe ? PROBE_SIMS : 0)) break;
        if (checkPlan(s, side, cmd) !== null) continue;
        const next = applyPlan(s, side, cmd);
        if (next.sides[side]!.credits < floor) continue;
        const l = threat(next);
        const price = Math.max(1, own().credits - next.sides[side]!.credits);
        const value = (loss - l) / price;
        if (loss - l > 0.01 && (!best || value > best.value)) best = { cmd, loss: l, value };
      }
      if (!best) break;
      apply(best.cmd);
      loss = best.loss;
    }
  }

  // 3. The attack wave: the units that get furthest per credit against the player's visible towers.
  const keep = Math.floor(start * profile.keep);
  const order = profile.probe ? probeOrder(s, side, keep) : attackOrder(s, side, profile);
  if (profile.workshops && own().workshops < MAX_WORKSHOPS && own().credits - keep > WORKSHOP_PRICE + 200) apply({ t: 'workshop' });
  for (let i = 0; i < capacityOf(own()) * 2; i++) {
    const kind = order[i % order.length]!;
    if (own().credits - (UNIT_PRICES[kind] ?? 0) < keep) break;
    if (!apply({ t: 'buy', kind })) break;
  }
  return plan;
}

/** Shop kinds in buying order: best expected threat per credit against the defending towers first. */
function attackOrder(s: HoldState, side: number, profile: Profile): EnemyKind[] {
  if (!profile.lookahead) return ['walker', 'walker', 'runner'];
  const defenders = s.world.entities.filter((e) => e.side === 1 - side && Object.hasOwn(TOWERS, e.kind));
  const score = (kind: EnemyKind): number => {
    const arch = archetypeOf(TD_RULESET, kind)!;
    let dps = 0;
    for (const t of defenders) {
      const weapon = archetypeOf(TD_RULESET, t.kind)?.weapon;
      if (!weapon) continue;
      dps += (weapon.damage * weapon.vs[arch.armor]) / 100 / Math.max(1, weapon.cooldown);
    }
    // Health per point of defence damage, as a rough chance to get through, times threat per credit.
    const toughness = arch.hp / (1 + dps * 40);
    return (ENEMIES[kind].threat * Math.min(1, toughness)) / UNIT_PRICES[kind]!;
  };
  const ranked = [...SHOP].sort((a, b) => score(b) - score(a) || SHOP.indexOf(a) - SHOP.indexOf(b));
  // Mix the two best kinds so one counter tower cannot stop the whole wave.
  return [ranked[0]!, ranked[0]!, ranked[1]!];
}

/**
 * Hard: tries waves made of each shop kind alone and of each pair of kinds (alternating), as many as
 * the budget and capacity allow, against the other side's towers as they stand now, and keeps the
 * order whose wave would get the most threat through.
 */
function probeOrder(s: HoldState, side: number, keep: number): EnemyKind[] {
  const own = s.sides[side]!;
  const money = own.credits - keep;
  const cap = capacityOf(own);
  const fill = (order: readonly EnemyKind[]): EnemyKind[] => {
    const wave: EnemyKind[] = [];
    let left = money;
    for (let i = 0; wave.length < cap; i++) {
      const kind = order[i % order.length]!;
      const price = UNIT_PRICES[kind]!;
      if (price > left) break;
      wave.push(kind);
      left -= price;
    }
    return wave;
  };
  const orders: EnemyKind[][] = SHOP.map((k) => [k]);
  for (let i = 0; i < SHOP.length; i++) for (let j = i + 1; j < SHOP.length; j++) orders.push([SHOP[i]!, SHOP[j]!]);
  let best: { order: EnemyKind[]; through: number } | null = null;
  for (const order of orders) {
    const wave = fill(order);
    if (wave.length === 0) continue;
    const through = leakage(s.world, s, 1 - side, wave);
    if (!best || through > best.through + 0.01) best = { order, through };
  }
  return best?.order ?? ['walker'];
}
