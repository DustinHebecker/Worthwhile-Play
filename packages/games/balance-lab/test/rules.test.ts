import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isPredict } from '../src/generate';
import { CUBE_WIDTH } from '../src/statics';
import {
  choose,
  currentItem,
  editDraft,
  freeEdit,
  freeHold,
  freeLetGo,
  freeUndo,
  hint,
  HISTORY_LIMIT,
  isBalanceState,
  letGo,
  markReported,
  mobileHooks,
  moveBeam,
  moveBody,
  moveCube,
  newState,
  next,
  placeBeam,
  placeCube,
  readSettings,
  resetTask,
  setAxle,
  setMobileHook,
  settingsOf,
  showSolution,
  skip,
  summarize,
  trayRemaining,
  tryAgain,
  undo,
  type BalanceState,
  type FreeState,
  type RoundState
} from '../src/rules';

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const round = (seed: number, settings: Record<string, unknown> = {}, difficulty = 'easy') => newState(seed, readSettings(settings, difficulty)) as RoundState;

/** Some edit of the current draft, chosen by n (any bench). */
function someEdit(s: RoundState, n: number): RoundState | null {
  const it = currentItem(s);
  if (!it) return null;
  const d = it.draft;
  if (d.bench === 'beam') {
    if (it.id === 'beam-axle') return editDraft(s, { bench: 'beam', s: setAxle(d.s, (n % 13) - 6) ?? d.s });
    const left = trayRemaining(it);
    if (left.length) return editDraft(s, placeBeam(d.s, left[0]!, (n % (2 * d.s.half + 1)) - d.s.half) && { bench: 'beam', s: placeBeam(d.s, left[0]!, (n % (2 * d.s.half + 1)) - d.s.half)! });
    const i = d.s.weights.findIndex((w) => w.free);
    const moved = moveBeam(d.s, i, (n % (2 * d.s.half + 1)) - d.s.half);
    return moved ? editDraft(s, { bench: 'beam', s: moved }) : null;
  }
  if (d.bench === 'mobile') {
    const hooks = mobileHooks(d.s);
    const left = trayRemaining(it);
    const m = setMobileHook(d.s, n % hooks.length, left.length ? left[0]! : null);
    return m ? editDraft(s, { bench: 'mobile', s: m }) : null;
  }
  if (it.id === 'stack-overhang') {
    const m = moveBody(d.s, n % d.s.bodies.length, n % 2 ? 4 : -1);
    return m ? editDraft(s, { bench: 'stack', s: m }) : null;
  }
  const left = trayRemaining(it);
  if (!left.length) return null;
  const m = placeCube(d.s, left[0]!, 0, d.s.bodies[0]!.left + 3 + (n % 40));
  return m ? editDraft(s, { bench: 'stack', s: m }) : null;
}

describe('round transitions', () => {
  it('starts valid and deterministic for every setting', () => {
    for (const mode of ['round', 'free'])
      for (const bench of ['mixed', 'beam', 'mobile', 'stack'])
        for (const d of ['easy', 'medium', 'hard']) {
          const s = newState(7, readSettings({ mode, bench, freeBench: bench === 'mixed' ? 'beam' : bench }, d));
          expect(isBalanceState(clone(s))).toBe(true);
          expect(newState(7, readSettings({ mode, bench, freeBench: bench === 'mixed' ? 'beam' : bench }, d))).toEqual(s);
        }
  });

  it('settingsOf round-trips', () => {
    for (const s of [round(1, { bench: 'stack', tasks: 'build' }, 'hard'), newState(1, readSettings({ mode: 'free', freeBench: 'mobile' }, 'easy'))]) {
      const again = settingsOf(s);
      const { difficulty, ...rest } = again;
      expect(newState(1, readSettings(rest, difficulty))).toEqual(s);
    }
  });

  it('predict: choose, let go once, matched or different; skip', () => {
    const s = round(3);
    const it = currentItem(s)!;
    expect(isPredict(it.id)).toBe(true);
    expect(letGo(s)).toBeNull();
    const chosen = choose(s, it.answer!)!;
    const done = letGo(chosen)!;
    expect(currentItem(done)!.status).toBe('matched');
    expect(letGo(done)).toBeNull();
    expect(choose(done, 0)).toBeNull();
    const other = letGo(choose(s, (it.answer! + 1) % 3)!)!;
    expect(currentItem(other)!.status).toBe('different');
    expect(currentItem(skip(s)!)!.status).toBe('skipped');
    expect(isBalanceState(clone(done))).toBe(true);
  });

  it('build: the witness solves, try again keeps the draft, solution shown, undo and reset', () => {
    const s0 = round(3);
    const s = next(skip(s0)!)!;
    const it = currentItem(s)!;
    expect(isPredict(it.id)).toBe(false);
    // Letting go with parts in the tray (if any) is refused.
    if (trayRemaining(it).length) expect(letGo(s)).toBeNull();
    const solved = letGo(editDraft(s, clone(it.witness!))!)!;
    expect(currentItem(solved)!.status).toBe('solved');
    expect(isBalanceState(clone(solved))).toBe(true);
    const shown = showSolution(s)!;
    expect(currentItem(shown)!.status).toBe('shown');
    expect(isBalanceState(clone(shown))).toBe(true);
    const edited = editDraft(s, clone(it.witness!))!;
    expect(currentItem(undo(edited)!)!.draft).toEqual(it.draft);
    expect(currentItem(resetTask(edited)!)!.draft).toEqual(it.scene);
    // Help on medium/hard counts.
    const m = round(3, {}, 'medium');
    const mb = next(skip(m)!)!;
    const helped = letGo(editDraft(hint(mb, 2)!, clone(currentItem(mb)!.witness!))!)!;
    expect(currentItem(helped)!.status).toBe('solved-with-help');
  });

  it('a failed let go shows the outcome and try again restores the draft', () => {
    const s = round(11, { bench: 'stack', tasks: 'build' });
    const it = currentItem(s)!;
    if (it.id === 'stack-overhang') {
      const out = letGo(s)!;
      expect(currentItem(out)!.outcome).not.toBeNull();
      expect(currentItem(out)!.status).toBe('open');
      expect(isBalanceState(clone(out))).toBe(true);
      expect(currentItem(tryAgain(out)!)!.outcome).toBeNull();
    }
  });

  it('history is bounded', () => {
    let s = round(5, { bench: 'stack', tasks: 'build' });
    let edits = 0;
    for (let n = 0; n < 200 && edits < HISTORY_LIMIT + 5; n++) {
      const e = someEdit(s, n);
      if (e) {
        s = e;
        edits++;
      }
    }
    expect(currentItem(s)!.history.length).toBeLessThanOrEqual(HISTORY_LIMIT);
    expect(isBalanceState(clone(s))).toBe(true);
  });

  it('random action sequences never throw and stay valid; the summary is reported once', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e6 }), fc.constantFrom('easy', 'medium', 'hard'), fc.array(fc.integer({ min: 0, max: 99 }), { maxLength: 60 }), (seed, d, acts) => {
        let s: BalanceState = round(seed, {}, d);
        for (const a of acts) {
          const r = s as RoundState;
          const n =
            a < 40 ? someEdit(r, a) : a < 50 ? choose(r, a % 3) : a < 60 ? letGo(r) : a < 65 ? tryAgain(r) : a < 70 ? skip(r) : a < 74 ? undo(r) : a < 78 ? hint(r, ((a % 2) + 1) as 1 | 2) : a < 80 ? showSolution(r) : a < 92 ? next(r) : markReported(r);
          if (n) s = n;
          expect(isBalanceState(clone(s))).toBe(true);
        }
        const sum = summarize(s as RoundState);
        expect(sum.predicted + sum.built).toBe(6);
      }),
      { numRuns: 60 }
    );
  });
});

describe('free bench', () => {
  it('edits, lets go, holds again and undoes', () => {
    let s = newState(1, readSettings({ mode: 'free', freeBench: 'beam' }, undefined)) as FreeState;
    s = freeEdit(s, { bench: 'beam', s: placeBeam((s.scene as unknown as { s: never }).s, 3, -2)! })!;
    s = freeLetGo(s)!;
    expect(s.outcome).toEqual({ bench: 'beam', sides: ['left-down'] });
    expect(isBalanceState(clone(s))).toBe(true);
    s = freeHold(s)!;
    expect(s.outcome).toBeNull();
    expect(freeUndo(s)!.scene).toEqual({ bench: 'beam', s: { half: 6, axle: 0, barKg: 0, weights: [] } });
  });
});

describe('isBalanceState', () => {
  it('never throws on junk and rejects tampering', () => {
    fc.assert(
      fc.property(fc.anything(), (x) => {
        expect(isBalanceState(x)).toBe(false);
      })
    );
    const s = round(2, { bench: 'beam' }, 'medium');
    const t = (f: (x: RoundState) => void) => {
      const c = clone(s);
      f(c);
      return isBalanceState(c);
    };
    expect(t(() => undefined)).toBe(true);
    expect(t((x) => (x.items[0]!.answer = ((x.items[0]!.answer ?? 0) + 1) % 3))).toBe(false);
    expect(t((x) => (x.reported = true))).toBe(false);
    expect(t((x) => x.items.pop())).toBe(false);
    expect(t((x) => ((x.items[0] as { id: string }).id = 'beam-nope'))).toBe(false);
    expect(t((x) => x.items[0]!.draft.bench === 'beam' && (x.items[0]!.draft.s.weights[0]!.kg = 10))).toBe(false);
    expect(t((x) => x.items[0]!.draft.bench === 'beam' && (x.items[0]!.draft.s.weights[0]!.hook = 9))).toBe(false);
    expect(t((x) => (x.items[0]!.history = Array.from({ length: 31 }, () => x.items[0]!.draft)))).toBe(false);
    expect(t((x) => (x.index = 3))).toBe(false);
    expect(t((x) => (x.items[1]!.witness = x.items[1]!.scene))).toBe(false);
    expect(t((x) => (x.items[0]!.outcome = { bench: 'beam', sides: ['level'] }))).toBe(false);
  });
});

describe('cubes on the counterweight plank', () => {
  const plank = { bodies: [{ kind: 'plank' as const, left: -30 }], cubes: [], bucket: { kg: 2, on: 0, x: 16 } };

  it('a cube goes on the spot of another (they stack) or at least a cube width away, never in between', () => {
    const one = placeCube(plank, 2, 0, -20)!;
    expect(one.cubes).toHaveLength(1);
    expect(placeCube(one, 3, 0, -17)).toBeNull();
    expect(placeCube(one, 3, 0, -15)).toBeNull();
    expect(placeCube(one, 3, 0, -20)!.cubes.map((c) => c.x)).toEqual([-20, -20]);
    expect(placeCube(one, 3, 0, -14)!.cubes.map((c) => c.x)).toEqual([-20, -14]);
    expect(placeCube(one, 3, 0, -26)!.cubes.map((c) => c.x)).toEqual([-20, -26]);
    const two = placeCube(one, 3, 0, -14)!;
    expect(moveCube(two, 1, -16)).toBeNull();
    expect(moveCube(two, 1, -20)!.cubes.map((c) => c.x)).toEqual([-20, -20]);
    expect(moveCube(two, 1, -8)!.cubes.map((c) => c.x)).toEqual([-20, -8]);
    // Moving a cube never collides with itself.
    expect(moveCube(two, 1, -13)!.cubes.map((c) => c.x)).toEqual([-20, -13]);
  });

  it('a save from before the rule, with cubes closer than their width, stays valid and playable', () => {
    for (let seed = 0; seed < 40; seed++) {
      const s = round(seed, { bench: 'stack', tasks: 'build' }, 'medium');
      const i = s.items.findIndex((x) => x.id === 'stack-counter');
      if (i < 0) continue;
      const old = clone(s);
      const it = old.items[i]!;
      if (it.draft.bench !== 'stack' || it.tray.length < 2) continue;
      it.draft.s.cubes = [
        { kg: it.tray[0]!, on: 0, x: it.draft.s.bodies[0]!.left + 10, free: true },
        { kg: it.tray[1]!, on: 0, x: it.draft.s.bodies[0]!.left + 13, free: true }
      ];
      expect(isBalanceState(clone(old))).toBe(true);
      // The overlapping cube can still be moved apart (or onto the other).
      const scene = it.draft.s;
      expect(moveCube(scene, 1, scene.cubes[0]!.x + CUBE_WIDTH)).not.toBeNull();
      expect(moveCube(scene, 1, scene.cubes[0]!.x)).not.toBeNull();
      return;
    }
    throw new Error('no medium stack-counter task found');
  });
});
