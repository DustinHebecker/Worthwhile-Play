/**
 * Independent physics oracle (review): re-derives every verdict from first principles, without the statics core, and
 * checks generated tasks, witnesses, predict answers, uniqueness and the best-overhang table against it.
 */
import { createRng } from '@wp/game-core';
import { describe, expect, it } from 'vitest';
import type { Translator } from '@wp/game-core';
import { goalMet } from '../src/check';
import { describe as describeScene } from '../src/explain';
import { freeEdit, freeScene, isBalanceState, newState, setMobileHook, type FreeState } from '../src/rules';
import { DIFFICULTIES, generateRound, generateTask, isPredict, SIDES, STACK_ANSWERS, type Scene, type TaskId } from '../src/generate';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Beam: torque about the axle; weights at their hooks, the bar's mass at its middle (position 0).
function beamSide(s: Any): number {
  let t = s.barKg * (0 - s.axle);
  for (const w of s.weights) t += w.kg * (w.hook - s.axle);
  return Math.sign(t);
}

// Mobile: a sub-mobile acts as its total mass at its hook; bars and strings are massless.
const mass = (n: Any): number => (n === null ? 0 : 'kg' in n ? n.kg : n.bar.hooks.reduce((a: number, h: Any) => a + mass(h.child), 0));
function bars(n: Any): Any[] {
  if (n === null || 'kg' in n) return [];
  return [n.bar, ...n.bar.hooks.flatMap((h: Any) => bars(h.child))];
}
const barSide = (b: Any): number => Math.sign(b.hooks.reduce((a: number, h: Any) => a + mass(h.child) * (h.pos - b.string), 0));

// Stack: for each body k, the centre of mass of body k, everything above it and everything resting on/hanging from
// those must lie within the closed contact segment between body k and its support (the table ends at x = 0).
const LEN: Record<string, number> = { block: 24, plank: 48, stone: 24 };
const KG: Record<string, number> = { block: 1, plank: 2, stone: 2 };
function stackFail(s: Any): { k: number; dir: 'left' | 'right' }[] {
  const out: { k: number; dir: 'left' | 'right' }[] = [];
  for (let k = 0; k < s.bodies.length; k++) {
    let m = 0;
    let mx = 0;
    for (let j = k; j < s.bodies.length; j++) {
      const b = s.bodies[j];
      m += KG[b.kind]!;
      mx += KG[b.kind]! * (b.left + LEN[b.kind]! / 2);
    }
    for (const c of s.cubes)
      if (c.on >= k) {
        m += c.kg;
        mx += c.kg * c.x;
      }
    if (s.bucket && s.bucket.on >= k) {
      m += s.bucket.kg;
      mx += s.bucket.kg * s.bucket.x;
    }
    const com = mx / m;
    const b = s.bodies[k];
    const lo = k === 0 ? b.left : Math.max(b.left, s.bodies[k - 1].left);
    const hi = k === 0 ? Math.min(b.left + LEN[b.kind]!, 0) : Math.min(b.left + LEN[b.kind]!, s.bodies[k - 1].left + LEN[s.bodies[k - 1].kind]!);
    expect(hi - lo).toBeGreaterThanOrEqual(1);
    if (com > hi + 1e-9) out.push({ k, dir: 'right' });
    else if (com < lo - 1e-9) out.push({ k, dir: 'left' });
  }
  return out;
}

function levelOrStands(sc: Scene): boolean {
  if (sc.bench === 'beam') return beamSide(sc.s) === 0;
  if (sc.bench === 'mobile') return bars(sc.s).every((b) => barSide(b) === 0);
  return stackFail(sc.s).length === 0;
}

const N = 40;
const ids = (p: string): TaskId[] => (['beam-predict', 'beam-hook', 'beam-weights', 'beam-choose', 'beam-axle', 'mobile-predict', 'mobile-hang', 'mobile-string', 'stack-predict', 'stack-overhang', 'stack-counter'] as TaskId[]).filter((i) => i.startsWith(p));

describe('independent oracle', () => {
  it('predict answers match first-principles verdicts', () => {
    for (const d of DIFFICULTIES)
      for (const id of ['beam-predict', 'mobile-predict', 'stack-predict'] as TaskId[])
        for (const trap of [false, true])
          for (const exact of [false, true])
            for (let i = 0; i < N; i++) {
              const t = generateTask(createRng(i * 7919 + 13), id, d, { trap, exact });
              const s: Any = t.scene.s;
              if (t.scene.bench === 'beam') expect(SIDES[t.answer!]).toBe(['left-down', 'level', 'right-down'][beamSide(s) + 1]);
              else if (t.scene.bench === 'mobile') expect(SIDES[t.answer!]).toBe(['left-down', 'level', 'right-down'][barSide(bars(s)[t.marked!]) + 1]);
              else {
                const f = stackFail(s);
                expect(STACK_ANSWERS[t.answer!]).toBe(f.length === 0 ? 'stands' : f[0]!.dir);
              }
            }
  });

  it('build witnesses solve their task, and start scenes do not', () => {
    for (const d of DIFFICULTIES)
      for (const id of ['beam-hook', 'beam-weights', 'beam-choose', 'beam-axle', 'mobile-hang', 'mobile-string', 'stack-overhang', 'stack-counter'] as TaskId[])
        for (let i = 0; i < N; i++) {
          const t = generateTask(createRng(i * 104729 + 5), id, d);
          expect(levelOrStands(t.witness!)).toBe(true);
          expect(goalMet(t, t.witness!)).toBe(true);
          if (!['stack-overhang', 'beam-choose', 'mobile-hang'].includes(id)) expect([id, levelOrStands(t.scene)]).toEqual([id, false]);
          if (t.goal?.kind === 'overhang') {
            const s: Any = t.witness!.s;
            expect(s.bodies.at(-1).left + 24).toBeGreaterThanOrEqual(t.goal.cm);
          }
        }
  });

  it('beam-hook and beam-choose have exactly one answer; beam-axle exactly one hole', () => {
    for (const d of DIFFICULTIES)
      for (let i = 0; i < N; i++) {
        const h = generateTask(createRng(i + 1), 'beam-hook', d);
        const s: Any = h.scene.s;
        const hooks = [];
        for (let x = -s.half; x <= s.half; x++) if (beamSide({ ...s, weights: [...s.weights, { kg: h.tray[0], hook: x }] }) === 0) hooks.push(x);
        expect(hooks.length).toBe(1);
        const c = generateTask(createRng(i + 1), 'beam-choose', d);
        const g: Any = c.goal;
        const cs: Any = c.scene.s;
        expect(c.tray.filter((kg) => beamSide({ ...cs, weights: [...cs.weights, { kg, hook: g.hook }] }) === 0).length).toBe(1);
        if (d === 'hard') {
          const a = generateTask(createRng(i + 1), 'beam-axle', d);
          const as: Any = a.scene.s;
          const holes = [];
          for (let x = -as.half; x <= as.half; x++) if (beamSide({ ...as, axle: x }) === 0) holes.push(x);
          expect(holes.length).toBe(1);
        }
      }
  });

  it('best overhang on a 1 cm grid (brute force over all single-column stacks of 24 cm blocks)', () => {
    const best = [0];
    for (let n = 1; n <= 4; n++) {
      let max = -1;
      // offsets of each block's left end relative to the block below (contact ≥ 1 cm), then the best table position
      const rec = (offs: number[]): void => {
        if (offs.length === n - 1) {
          const lefts = [0];
          for (const o of offs) lefts.push(lefts.at(-1)! + o);
          // every joint above the table must hold
          for (let k = 1; k < n; k++) {
            let mx = 0;
            for (let j = k; j < n; j++) mx += lefts[j]! + 12;
            const com = mx / (n - k);
            if (com < Math.max(lefts[k]!, lefts[k - 1]!) || com > Math.min(lefts[k]!, lefts[k - 1]!) + 24) return;
          }
          const com = lefts.reduce((a, l) => a + l + 12, 0) / n;
          // table edge e (integer, the table is x ≤ e): need com ≤ e and contact with block 0 ≥ 1 cm; overhang = top right − e
          const e = Math.ceil(com - 1e-9);
          if (e - lefts[0]! < 1) return;
          max = Math.max(max, lefts[n - 1]! + 24 - e);
          return;
        }
        for (let o = -23; o <= 23; o++) rec([...offs, o]);
      };
      rec([]);
      best.push(max);
    }
    expect(best).toEqual([0, 12, 18, 22, 25]);
    for (const [k, d] of DIFFICULTIES.entries()) {
      const t = generateTask(createRng(1), 'stack-overhang', d);
      expect(t.goal).toMatchObject({ best: best[k + 2] });
    }
  });

  it('every listed id exists', () => {
    expect(ids('beam').length + ids('mobile').length + ids('stack').length).toBe(11);
  });

  it('predict rounds balance their answers (no option right for more than half, never three in a row)', () => {
    for (const bench of ['beam', 'mobile', 'stack', 'mixed'] as const)
      for (const d of DIFFICULTIES)
        for (let seed = 0; seed < 60; seed++) {
          const a = generateRound(createRng(seed), bench, 'predict', d)
            .filter((t) => isPredict(t.id))
            .map((t) => `${t.id}:${t.answer}`.replace('mobile-predict', 'beam-predict'));
          for (const x of a) expect(a.filter((y) => y === x).length).toBeLessThanOrEqual(a.length / 2);
          for (let i = 2; i < a.length; i++) expect(a[i] === a[i - 1] && a[i] === a[i - 2]).toBe(false);
        }
  });

  it('the free mobile takes a weight on every one of its eight hooks', () => {
    let s = newState(1, { mode: 'free', freeBench: 'mobile', bench: 'mixed', tasks: 'mixed', difficulty: 'easy' }) as FreeState;
    let placed = 0;
    for (let j = 0; j < 9; j++) {
      const sc = s.scene;
      if (sc.bench !== 'mobile') throw new Error('bench');
      const n = setMobileHook(sc.s, j, 1);
      if (!n) continue;
      s = freeEdit(s, { bench: 'mobile', s: n })!;
      expect(s).not.toBeNull();
      expect(isBalanceState(s)).toBe(true);
      placed++;
    }
    expect(placed).toBe(8);
  });

  it('screen-reader descriptions number sub-bars depth-first', () => {
    const t = ((key: string, p?: Record<string, string>) => `${key}(${p ? Object.values(p).join(',') : ''})`) as unknown as Translator;
    Object.assign(t, { locale: 'en' });
    const w = { kg: 1 };
    const sub = () => ({ bar: { width: 2, string: 1, hooks: [{ pos: 0, child: w }, { pos: 2, child: w }] } });
    const text = describeScene(t, { bench: 'mobile', s: { bar: { width: 2, string: 1, hooks: [{ pos: 0, child: sub() }, { pos: 2, child: sub() }] } } });
    expect(text).toContain('desc.sub(2,2)');
    expect(text).toContain('desc.sub(3,2)');
    expect(freeScene('mobile').bench).toBe('mobile');
  });
});
