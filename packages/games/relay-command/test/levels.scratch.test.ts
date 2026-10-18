import { it } from 'vitest';
import { createRng } from '@wp/game-core';
import { initialIntel, observe, passable, type World } from '@wp/strategy-engine';
import { planAi, type Difficulty } from '../src/ai';
import { lockTurn, newGame, OPPONENT, planOrder, PLAYER, RULESET, type RcState } from '../src/rules';
import { validateCommand } from '@wp/strategy-engine';
import { SCENARIOS } from '../src/scenarios';
import { FIELD_EXERCISE, RIDGE_VALLEY, type ScenarioSpec } from '../src/scenarios';
const ai = (world: World, side: number, d: Difficulty) => planAi(observe(world, RULESET, side), RULESET, d);
function opening(spec: ScenarioSpec, seed: number, limit: number | null, difficulty: Difficulty): RcState {
  const s = newGame(seed, spec, difficulty, limit, false);
  const rng = createRng(seed * 7919 + 13);
  const { w, h } = s.world.map;
  const movable = s.world.entities.filter((e) => e.side === PLAYER && e.kind !== 'command-post');
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && passable(s.world.map, RULESET, x, y, 'ground') && !s.world.entities.some((e) => e.x === x && e.y === y);
  for (let k = 0; k < 2; k++) {
    const u = movable[rng.int(0, movable.length - 1)]!;
    const m = s.world.entities.find((e) => e.side === OPPONENT && e.x === w - 1 - u.x && e.y === h - 1 - u.y)!;
    const nx = u.x + rng.int(-2, 2), ny = u.y + rng.int(-2, 2);
    if (!free(nx, ny) || !free(w - 1 - nx, h - 1 - ny)) continue;
    Object.assign(u, { x: nx, y: ny }); Object.assign(m, { x: w - 1 - nx, y: h - 1 - ny });
  }
  s.world.intel = initialIntel(s.world, RULESET);
  return s;
}
function play(s: RcState, a: Difficulty | 'passive', cap = 40): RcState {
  for (let i = 0; i < cap && s.phase === 'plan'; i++) {
    if (a !== 'passive') for (const c of ai(s.world, PLAYER, a)) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
    s = lockTurn(s);
  }
  return s;
}
function firstTurnMoves(spec: ScenarioSpec, seed: number, difficulty: Difficulty): RcState {
  let s = newGame(seed, spec, difficulty, null, false);
  const rng = createRng(seed * 31 + 7);
  const units = s.world.entities.filter((e) => e.side === PLAYER && (RULESET.archetypes[e.kind]?.speed ?? 0) > 0);
  for (let k = 0; k < 4; k++) {
    const u = units[rng.int(0, units.length - 1)]!;
    s = planOrder(s, u.id, { type: 'move', x: Math.max(0, Math.min(s.world.map.w - 1, u.x + rng.int(-4, 4))), y: Math.max(0, Math.min(s.world.map.h - 1, u.y + rng.int(-4, 4))) }) ?? s;
  }
  return lockTurn(s);
}
function turtle(s: RcState, cap = 40): RcState {
  for (let i = 0; i < cap && s.phase === 'plan'; i++) {
    const post = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'command-post');
    if (process.env.TURTLE === 'ai') for (const c of ai(s.world, PLAYER, 'normal')) if (!(c.order.type === 'build')) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
    if (post && !process.env.NOTOWER) {
      const cells: { x: number; y: number; d: number }[] = [];
      for (let y = 0; y < s.world.map.h; y++) for (let x = 0; x < s.world.map.w; x++) cells.push({ x, y, d: (x - post.x) ** 2 + (y - post.y) ** 2 });
      cells.sort((a, b) => a.d - b.d);
      for (const c of cells) {
        const cmd = { side: PLAYER, unit: post.id, order: { type: 'build' as const, kind: 'tower-gun', x: c.x, y: c.y } };
        if (validateCommand(s.world, RULESET, cmd).ok) { s = planOrder(s, post.id, cmd.order) ?? s; break; }
      }
    }
    s = lockTurn(s);
  }
  return s;
}
it('turtle', () => {
  if (!process.env.TURTLE) return;
  for (const spec of SCENARIOS.filter((x) => x.id !== 'four-corners')) {
    const o = { turtle: 0, ai: 0, d: 0, towers: 0 };
    for (let seed = 0; seed < 8; seed++) {
      const g = turtle(opening(spec, seed, Number(process.env.LEN ?? 24), (process.env.LVL as 'hard') ?? 'normal'), 60);
      if (g.result === 'won') o.turtle++; else if (g.result === 'lost') o.ai++; else o.d++;
      o.towers += g.world.entities.filter((e) => e.side === PLAYER && e.kind === 'tower-gun').length;
      if (process.env.ENDS) console.log('END', spec.id, seed, g.result, g.world.turn, 'posts', g.world.entities.filter((e) => e.kind === 'command-post').length, 'v', sv(g.world, 0), sv(g.world, 1));
      if (spec.id === 'crossroads') console.log('G', seed, g.result, g.world.turn, 'oppUnits', g.world.entities.filter((e) => e.side === OPPONENT).length, 'oppKinds', [...new Set(g.world.entities.filter((e) => e.side === OPPONENT).map((e) => e.kind))].join(','));
    }
    console.log('TURTLE', spec.id, JSON.stringify(o));
  }
}, 3_600_000);
it('hvn30', () => {
  if (!process.env.HVN30) return;
  for (const spec of [FIELD_EXERCISE, RIDGE_VALLEY]) {
    const o = { hard: 0, normal: 0, d: 0, hardTowers: 0, normalTowers: 0 };
    for (let seed = 0; seed < Number(process.env.HVN30); seed++) {
      const g = play(opening(spec, seed, 24, 'normal'), 'hard');
      if (g.result === 'won') o.hard++; else if (g.result === 'lost') o.normal++; else o.d++;
      o.hardTowers += g.world.entities.filter((e) => e.side === 0 && e.kind.startsWith('tower')).length;
      o.normalTowers += g.world.entities.filter((e) => e.side === 1 && e.kind.startsWith('tower')).length;
    }
    console.log('H30', spec.id, JSON.stringify(o));
  }
}, 3_600_000);
it('levels', () => {
  if (process.env.HVN30) return;
  if (process.env.TURTLE) return;
  for (const spec of [FIELD_EXERCISE, RIDGE_VALLEY]) {
    const o = { a: 0, b: 0, d: 0 };
    for (let seed = 0; seed < 6; seed++) {
      const g1 = play(opening(spec, seed, 24, 'normal'), 'hard'), g2 = play(opening(spec, seed, 24, 'hard'), 'normal');
      if (spec.id === 'ridge-valley') for (const [g, who] of [[g1, 'hard=P0'], [g2, 'hard=P1']] as const) console.log('RVG', seed, who, g.result, g.world.turn, 'towers P0', g.world.entities.filter((e) => e.side === 0 && e.kind.startsWith('tower')).map((e) => `${e.x},${e.y}`).join(' '), 'P1', g.world.entities.filter((e) => e.side === 1 && e.kind.startsWith('tower')).map((e) => `${e.x},${e.y}`).join(' '), 'units', g.world.entities.filter((e) => e.side === 0).length, g.world.entities.filter((e) => e.side === 1).length, 'lead', JSON.stringify(g.lead?.slice(-1)));
      for (const [r, win, loss] of [[g1.result, 'won', 'lost'], [g2.result, 'lost', 'won']] as const) {
        if (r === win) o.a++; else if (r === loss) o.b++; else o.d++;
        if (spec.id === 'ridge-valley') console.log('RV', seed, win === 'won' ? 'hard=player' : 'hard=opp', r === win ? 'HARD' : r === loss ? 'NORMAL' : 'draw');
      }
    }
    console.log('HVN', spec.id, JSON.stringify(o));
  }
  for (const level of ['normal', 'hard'] as const) {
    const moved = Array.from({ length: 4 }, (_, seed) => play(firstTurnMoves(FIELD_EXERCISE, seed + 100, level), 'passive', 60));
    console.log('PASSIVE', level, moved.map((g) => `${g.result}@${g.world.turn}`).join(','));
  }
}, 3_600_000);
import { sideValue as sv } from '../src/rules';
import { computeNetwork } from '@wp/strategy-engine';
it('tdiag', () => {
  if (!process.env.TDIAG) return;
  const spec = SCENARIOS.find((x) => x.id === 'crossroads')!;
  for (let seed = 0; seed < 8; seed++) {
    let s = opening(spec, seed, 24, (process.env.LVL as 'hard') ?? 'normal');
    const rows: string[] = [];
    for (let i = 0; i < 24 && s.phase === 'plan'; i++) {
      const before = s;
      s = turtle(s, 1);
      if (i % 4 === 3) {
        const known = (s.world.intel?.[1] ?? []).filter((r) => r.side === 0);
        const towersKnown = known.filter((r) => r.kind.startsWith('tower')).length;
        const opp = s.world.entities.filter((e) => e.side === 1);
        const cov = computeNetwork(s.world, RULESET, 1).coverage;
        const fighters = opp.filter((e) => (RULESET.archetypes[e.kind]?.speed ?? 0) > 0 && RULESET.archetypes[e.kind]?.weapon);
        const out = fighters.filter((e) => cov[e.y * s.world.map.w + e.x] !== 1).length;
        rows.push(`t${s.world.turn} out${out}/${fighters.length} tk${towersKnown}/${s.world.entities.filter((e) => e.side === 0 && e.kind.startsWith('tower')).length} how${opp.filter((e) => e.kind === 'howitzer').length} u${opp.length} v${sv(s.world, 0)}:${sv(s.world, 1)}`);
      }
      void before;
    }
    console.log('TD', seed, s.result, rows.join(' | '));
  }
}, 600_000);
it('one', () => {
  if (!process.env.ONE) return;
  const spec = SCENARIOS.find((x) => x.id === (process.env.MAP ?? 'field-exercise'))!;
  let s = opening(spec, Number(process.env.SEED ?? 0), 48, 'normal');
  for (let i = 0; i < 48 && s.phase === 'plan'; i++) {
    s = turtle(s, 1);
    const ev = s.events;
    const lostAi = ev.filter((e) => e.t === 'destroyed' && e.side === 1).length;
    const lostT = ev.filter((e) => e.t === 'destroyed' && e.side === 0).length;
    console.log('TURN', s.world.turn, 'aiUnits', s.world.entities.filter((e) => e.side === 1).length, 'tUnits', s.world.entities.filter((e) => e.side === 0 && !e.kind.startsWith('tower')).length, 'towers', s.world.entities.filter((e) => e.side === 0 && e.kind.startsWith('tower')).map((e) => `${e.x},${e.y}`).join(' '), 'seenLossesAi/T', lostAi, lostT, s.result ?? '');
  }
}, 600_000);
