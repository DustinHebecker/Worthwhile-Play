import { describe, expect, it } from 'vitest';
import { canonicalJson, NEUTRAL, observe, type Order, type World } from '@wp/strategy-engine';
import { planAi, type Difficulty } from '../src/ai';
import { isHotSeat, lockTurn, newGame, PLAYER, planOrder, RULESET, rulesOf, SIDES_RULESET, type RcState } from '../src/rules';
import { opponentCounts, SCENARIOS } from '../src/scenarios';

/**
 * The long AI tests of rules.test.ts (ADR 0021: `*.slow.test.ts` runs in CI but not under Stryker):
 * byte-identity fingerprints of whole AI games and the frame symmetry of every seat over many turns.
 */

/**
 * Fingerprint of AI-vs-AI plans on the two-side maps (see the test): '965772b3' before increment 4;
 * '31513435' since the opponent builds defence towers (owner decision 2026-10-16, a measured gain,
 * docs/design/strategy.md "Defence towers"); 'fd8529d3' since it no longer feeds units into a known
 * tower wall (rally point beyond the towers' reach, towers weigh double among a post's defenders;
 * owner review 2026-10-18); 'd68f3e39' since a Scout Car it gives no order launches its drone with a
 * spare slot (2026-10-27, a measured gain, docs/design/strategy.md § 4.1); 'b32f2301' since a drone
 * keeps contact through its carrier (datalink, owner review 2026-10-27; direction finding of orders,
 * radius 6, leaves these games' plans as they are).
 */
const TWO_SIDE_AI_FINGERPRINT = 'b32f2301';
const ai = (world: World, side: number, difficulty: Difficulty = 'normal') => planAi(observe(world, RULESET, side), RULESET, difficulty);

describe('several sides (docs/design/strategy.md § 9.4)', () => {
  const corners = SCENARIOS.find((s) => s.id === 'four-corners')!;

  it('every seat plans alike: on the map turned a quarter, the next seat\'s plan is the turned plan (AI uses its seat\'s frame)', () => {
    // Quarter turn of Four Corners carries seat k onto seat k+1; the map itself is the same.
    const n = 16;
    const at = (x: number, y: number): [number, number] => [n - 1 - y, x];
    const cell = (c: number) => {
      const [x, y] = at(c % n, Math.floor(c / n));
      return y * n + x;
    };
    const next = (side: number) => (side === NEUTRAL ? NEUTRAL : (side + 1) % 4);
    const order = (o: Order): Order => {
      if (o.type === 'move' || o.type === 'build') {
        const [x, y] = at(o.x, o.y);
        return { ...o, x, y };
      }
      if (o.type === 'patrol') {
        const [x, y] = at(o.x, o.y);
        const [rx, ry] = at(o.rx, o.ry);
        return { ...o, x, y, rx, ry };
      }
      return o;
    };
    const turned = (w: World): World => {
      const perm = <T,>(list: readonly T[]): T[] => {
        const out = [...list];
        list.forEach((v, s) => (out[next(s)] = v));
        return out;
      };
      return {
        ...structuredClone(w),
        map: { ...w.map, deposits: (w.map.deposits ?? []).map((d) => ({ ...d, x: at(d.x, d.y)[0], y: at(d.x, d.y)[1] })).sort((a, b) => a.y * n + a.x - (b.y * n + b.x)) },
        ...(w.supply && { supply: perm(w.supply) }),
        ...(w.out && { out: w.out.map(next).sort((a, b) => a - b) }),
        entities: w.entities.map((e) => ({
          ...structuredClone(e),
          side: next(e.side),
          x: at(e.x, e.y)[0],
          y: at(e.x, e.y)[1],
          order: order(e.order),
          ...(e.stall && { stall: { ...e.stall, goal: e.stall.goal < n * n ? cell(e.stall.goal) : e.stall.goal } }),
          ...(e.prev !== undefined && { prev: cell(e.prev) })
        })),
        projectiles: w.projectiles.map((p) => ({ ...p, side: next(p.side), x: at(p.x, p.y)[0], y: at(p.x, p.y)[1] })),
        ...(w.intel && { intel: perm(w.intel.map((list) => list.map((r) => ({ ...r, side: next(r.side), x: at(r.x, r.y)[0], y: at(r.x, r.y)[1] })))) })
      };
    };
    const rules = SIDES_RULESET;
    for (const level of ['normal', 'hard'] as const) {
      let s = newGame(1, corners, level, 30, false, null, 3);
      for (let t = 0; t < 12 && s.phase === 'plan'; t++) {
        const r = turned(s.world);
        for (let side = 0; side < 4; side++) {
          if (s.world.out?.includes(side)) continue;
          const plan = planAi(observe(s.world, rules, side), rules, level).map((c) => ({ ...c, side: next(c.side), order: order(c.order) }));
          expect(planAi(observe(r, rules, next(side)), rules, level), `${level} turn ${t} seat ${side}`).toEqual(plan);
        }
        s = lockTurn(s);
      }
    }
  });

  it('two-side maps keep their measured AI exactly: plans of AI-vs-AI games match the fingerprint from before increment 4 (PR #24 review)', () => {
    // Produced by the AI of main at 080fab6 (before increment 4): every change for several sides
    // must leave the one-opponent games on the two-side maps byte-identical.
    let h = 0x811c9dc5;
    const feed = (text: string) => {
      for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
    };
    // The maps of that time (the large asymmetric maps came later and have tests of their own).
    for (const spec of SCENARIOS.filter((x) => !x.seats && !x.asymmetric)) {
      for (const [mine, theirs] of [['hard', 'normal'], ['normal', 'hard']] as const) {
        let s = newGame(3, spec, theirs, 24);
        while (s.phase === 'plan') {
          for (const c of ai(s.world, PLAYER, mine)) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
          s = lockTurn(s);
        }
        feed(canonicalJson(s.log));
      }
    }
    expect(h.toString(16)).toBe(TWO_SIDE_AI_FINGERPRINT);
  }, 300_000);
});

describe('hot-seat (docs/design/strategy.md § 9.4, D10)', () => {
  /** The person planning gives the orders the AI would (a stand-in for a person's plan). */
  const plan = (s: RcState, level: Difficulty = 'normal'): RcState => {
    let next = s;
    for (const c of planAi(observe(s.world, rulesOf(s), s.planning), rulesOf(s), level)) next = planOrder(next, c.unit, c.order, c.doctrine) ?? next;
    return next;
  };

  // Taken before hot-seat (main at f2ee871: 'cdaa78b6'); updated when a side stopped being told
  // where its own shells land in cells it does not observe (PR #28): first `observe()` (the AI on
  // Four Corners plans differently in a few turns: '4af64ac7'), then the reports (the player's turn
  // summaries lose such `launch` events; no plan changes: 'fe0a5277'); then when a side stopped
  // being told of a shot by its own unit out of contact at an enemy it never had reported (gate
  // find, 2026-10-14: the summaries lose such `fire` events; world, log and result unchanged:
  // '83a1b8af'); then when the opponent started to build defence towers (owner decision 2026-10-16,
  // a deliberate AI change with a measured gain, like the two-side fingerprint: 'da7608a7'); then
  // muzzle flash adds `flash` events to the player's summaries (owner decision 2026-10-17; world, log,
  // plans and result unchanged: without the flash events it is 'da7608a7' again): '901bcbec'; then the
  // opponent stopped feeding units into known tower walls (owner review 2026-10-18): 'a636ca8'; then every
  // step in the summaries names the cell it left (`fx`, `fy` on `move`, for the turn replay, owner request
  // 2026-10-27; world, log, plans and result unchanged: without those two fields it is 'a636ca8' again): '3a126a32';
  // then the opponent launched the drones of Scout Cars it gives no order (2026-10-27, a measured gain): 'dd7d0cec';
  // then drones kept contact through their carriers and Direction Finders intercepted orders within 6 cells
  // (owner review 2026-10-27; `intercept` events in the summaries): 'd6b6862b'; then the seed picked a style per
  // opponent, spreading its attacks or keeping a guard at home against two or more enemies (owner decision
  // 2026-10-29, measured: no loss of strength; with every side 'direct' it is 'd6b6862b' again): '1829b1b0'; then
  // both styles together became the third the seed may pick (owner decision 2026-10-29): 'd3fe3879'.
  it('one person is the single-player game, byte for byte: every map and opponent count matches the fingerprint taken before hot-seat (main at f2ee871)', () => {
    let h = 0x811c9dc5;
    const feed = (text: string) => {
      for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
    };
    // The maps of that time (a map made for teams, Bastion, came later and has tests of its own).
    for (const spec of SCENARIOS.filter((x) => !x.seats?.teams && !x.asymmetric)) {
      for (const n of opponentCounts(spec)) {
        let s = newGame(5, spec, 'normal', 12, false, null, n);
        expect(isHotSeat(s)).toBe(false);
        while (s.phase === 'plan') {
          s = plan(s, 'hard');
          s = lockTurn(s);
          expect(s.handover).toBe(false);
          feed(canonicalJson({ world: s.world, events: s.events, entry: s.log.at(-1), lead: s.lead, result: s.result }));
        }
      }
    }
    expect(h.toString(16)).toBe('d3fe3879');
  }, 300_000);
});
