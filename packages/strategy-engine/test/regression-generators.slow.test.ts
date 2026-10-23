import { describe, expect, it } from 'vitest';
import { createWorld, runTicks, STRATEGY_RULESET as rs, type Order, type World } from '../src';

/*
 * Independent generators and detectors from the review of PR #8 (round 2), kept as regression
 * properties: no unit paces back and forth under one move order, and no attack order sits still
 * without moving, firing or ending. Their own seeded LCG keeps them independent of fast-check.
 */
function lcg(seed: number) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32); }
const pick = <T,>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)]!;
const KINDS = ['rifles', 'lancer', 'outrider', 'warden', 'howitzer', 'mast-truck'];
function genMoves(seed: number, mode: 'fuzz' | 'corridor' | 'crowd'): World | undefined {
  const r = lcg(seed);
  const w = mode === 'crowd' ? 6 + Math.floor(r() * 5) : 6 + Math.floor(r() * 5);
  const h = mode === 'corridor' ? 3 + Math.floor(r() * 3) : 6 + Math.floor(r() * 5);
  const T = mode === 'fuzz' ? ['.', '.', '.', '=', 'f', '^', '^', 's'] : mode === 'corridor' ? ['.', '.', '.', '.', '^', '=', 'f'] : ['.', '.', '=', 'f'];
  const terrain = Array.from({ length: w * h }, () => pick(r, T)).join('');
  const n = mode === 'crowd' ? 8 + Math.floor(r() * 10) : 3 + Math.floor(r() * 6);
  const used = new Set<number>();
  const ents: { side: number; kind: string; x: number; y: number }[] = [];
  for (let i = 0; i < n * 3 && ents.length < n; i++) {
    const c = Math.floor(r() * w * h);
    if (used.has(c) || terrain[c] === '^') continue;
    used.add(c);
    ents.push({ side: 0, kind: pick(r, KINDS), x: c % w, y: Math.floor(c / w) });
  }
  if (ents.length < 2) return undefined;
  let world: World;
  try { world = createWorld({ map: { w, h, terrain }, sides: 2, entities: ents, seed }, rs); } catch { return undefined; }
  const ids = world.entities.map((e) => e.id);
  for (const e of world.entities) {
    const k = r();
    let o: Order;
    if (k < 0.35) o = { type: 'escort', target: pick(r, ids.filter((i) => i !== e.id)) };
    else if (k < 0.75) o = { type: 'move', x: Math.floor(r() * w), y: Math.floor(r() * h) };
    else if (k < 0.85) o = { type: 'patrol', x: Math.floor(r() * w), y: Math.floor(r() * h), rx: e.x, ry: e.y };
    else o = { type: 'hold' };
    if (o.type === 'move' && terrain[o.y * w + o.x] === '^') o = { type: 'hold' };
    if (o.type === 'patrol' && terrain[o.y * w + o.x] === '^') o = { type: 'hold' };
    e.order = o;
  }
  return world;
}
/** Same unit, same unchanged move order, enters the same cell >= K times within WINDOW ticks. */
function detect(world: World, ticks: number, K: number, WINDOW: number): string | undefined {
  let w = world;
  const hist = new Map<number, { key: string; entries: { t: number; c: number }[] }>();
  for (let t = 0; t < ticks; t++) {
    const r = runTicks(w, rs, [], 1);
    for (const ev of r.events) {
      if (ev.t !== 'move') continue;
      const e = r.world.entities.find((x) => x.id === ev.id);
      if (!e || e.order.type !== 'move') continue;
      const key = JSON.stringify(e.order);
      let h = hist.get(ev.id);
      if (!h || h.key !== key) hist.set(ev.id, (h = { key, entries: [] }));
      const c = ev.y * w.map.w + ev.x;
      h.entries.push({ t: ev.tick, c });
      const n = h.entries.filter((x) => x.c === c && ev.tick - x.t < WINDOW).length;
      if (n >= K) return `unit ${ev.id} ${key} cell ${ev.x},${ev.y} x${n} by tick ${ev.tick}`;
    }
    for (const e of r.world.entities) { const h = hist.get(e.id); if (h && h.key !== JSON.stringify(e.order)) hist.delete(e.id); }
    w = r.world;
  }
  return undefined;
}

const MIRROR_KINDS = ['rifles', 'lancer', 'outrider', 'warden', 'howitzer', 'mast-truck', 'relay-mast'];
function genAttacks(seed: number): World | undefined {
  const r = lcg(seed);
  const W = 6 + Math.floor(r() * 9), H = 6 + Math.floor(r() * 9);
  const terrain = Array.from({ length: W * H }, () => (r() < 0.1 ? 'f' : r() < 0.06 ? '^' : r() < 0.05 ? 'h' : '.')).join('').split('');
  terrain[0] = '.'; terrain[W * H - 1] = '.';
  const ents = [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: W - 1, y: H - 1 }];
  const used = new Set([0, W * H - 1]);
  const n = 4 + Math.floor(r() * 14);
  for (let i = 0; i < 200 && ents.length < n; i++) {
    const c = Math.floor(r() * W * H);
    if (used.has(c) || terrain[c] === '^') continue;
    used.add(c);
    ents.push({ side: r() < 0.5 ? 0 : 1, kind: MIRROR_KINDS[Math.floor(r() * MIRROR_KINDS.length)]!, x: c % W, y: Math.floor(c / W) });
  }
  let w: World;
  try { w = createWorld({ map: { w: W, h: H, terrain: terrain.join('') }, sides: 2, entities: ents, seed }, rs); } catch { return undefined; }
  for (const e of w.entities) {
    if (e.kind === 'command-post' || e.kind === 'relay-mast') continue;
    const foes = w.entities.filter((o) => o.side !== e.side);
    const k = r();
    let o: Order = { type: 'hold' };
    if (k < 0.6) o = { type: 'attack', target: foes[Math.floor(r() * foes.length)]!.id };
    else if (k < 0.8) o = { type: 'patrol', x: Math.floor(r() * W), y: Math.floor(r() * H), rx: e.x, ry: e.y };
    if (o.type === 'patrol' && w.map.terrain[o.y * W + o.x] === '^') o = { type: 'hold' };
    e.order = o;
  }
  return w;
}

/** Attack orders that neither move, fire nor end for `limit` ticks in a row. */
function stalls(world: World, ticks: number, limit: number): string[] {
  let w = world;
  const out: string[] = [];
  const idle = new Map<number, number>();
  for (let t = 0; t < ticks; t++) {
    const r = runTicks(w, rs, [], 1);
    const active = new Set(r.events.flatMap((e) => (e.t === 'move' || e.t === 'fire' || e.t === 'launch' || e.t === 'order-ended' || e.t === 'order' ? [e.id] : [])));
    for (const e of r.world.entities) {
      if (e.order.type !== 'attack') {
        idle.delete(e.id);
        continue;
      }
      const k = active.has(e.id) ? 0 : (idle.get(e.id) ?? 0) + 1;
      idle.set(e.id, k);
      if (k === limit) out.push(`unit ${e.id} ${e.kind} at ${e.x},${e.y}`);
    }
    w = r.world;
  }
  return out;
}

const RUNS = 300;

describe('regression generators (review of PR #8, round 2)', () => {
  for (const mode of ['fuzz', 'corridor', 'crowd'] as const) {
    it(`no pacing under one move order (${mode}, ${RUNS} worlds)`, () => {
      const found: string[] = [];
      for (let seed = 1, n = 0; n < RUNS; seed++) {
        const w = genMoves(seed, mode);
        if (!w) continue;
        n++;
        const hit = detect(w, 48, 3, 24) ?? detect(w, 48, 4, 1e9);
        if (hit) found.push(`seed ${seed}: ${hit}`);
      }
      expect(found).toEqual([]);
    }, 120_000);
  }

  it('the corridor where a Warden paced between two routes (seed 1519) now arrives', () => {
    expect(detect(genMoves(1519, 'corridor')!, 48, 3, 24)).toBeUndefined();
  });

  it(`no attack order stands idle for 36 ticks (${RUNS} worlds, and the Field Gun of seed 264)`, () => {
    const found: string[] = [];
    for (let seed = 1, n = 0; n < RUNS; seed++) {
      const w = genAttacks(seed);
      if (!w) continue;
      n++;
      for (const s of stalls(w, 72, 36)) found.push(`seed ${seed}: ${s}`);
    }
    for (const s of stalls(genAttacks(264)!, 72, 36)) found.push(`seed 264: ${s}`);
    expect(found).toEqual([]);
  }, 120_000);
});
