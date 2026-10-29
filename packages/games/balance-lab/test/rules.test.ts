import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isPredict } from '../src/generate';
import { BUCKET_MIN_X } from '../src/generate';
import { CUBE_WIDTH, stackVerdict, type StackScene } from '../src/statics';
import {
  asksJoint,
  choose,
  chooseJoint,
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

describe('hard stack-predict: which joint gives way? (owner decision 2026-10-29)', () => {
  /** A hard stack-predict round and the index of an item whose stack falls (or stands). */
  function find(falls: boolean): { s: RoundState; i: number } {
    for (let seed = 0; seed < 200; seed++) {
      const s = round(seed, { bench: 'stack', tasks: 'predict' }, 'hard');
      const i = s.items.findIndex((it) => (it.answer !== 0) === falls);
      if (i >= 0) return { s: { ...s, index: i, items: s.items.map((it, j) => (j < i ? { ...it, outcome: { bench: 'stack', ...stackVerdict(it.scene.s as StackScene) }, status: 'skipped' as const } : it)) }, i };
    }
    throw new Error('no such item');
  }

  it('a fall needs a joint before "Let go"; the right joint matches, another one does not', () => {
    const { s, i } = find(true);
    const it = s.items[i]!;
    const bodies = (it.scene.s as StackScene).bodies.length;
    const joint = stackVerdict(it.scene.s as StackScene).failing[0]!.joint;
    expect(asksJoint(it.id, 'hard')).toBe(true);
    expect(chooseJoint(s, joint)).toBeNull();
    const fall = choose(s, it.answer!)!;
    expect(letGo(fall)).toBeNull();
    expect(chooseJoint(fall, bodies)).toBeNull();
    expect(chooseJoint(fall, -1)).toBeNull();
    const right = letGo(chooseJoint(fall, joint)!)!;
    expect(currentItem(right)!.status).toBe('matched');
    expect(isBalanceState(clone(right))).toBe(true);
    const wrong = letGo(chooseJoint(fall, (joint + 1) % bodies)!)!;
    expect(currentItem(wrong)!.status).toBe('different');
    expect(isBalanceState(clone(wrong))).toBe(true);
    // The other fall direction is "another way" whatever the joint.
    const other = letGo(chooseJoint(choose(s, it.answer === 1 ? 2 : 1)!, joint)!)!;
    expect(currentItem(other)!.status).toBe('different');
    // Choosing "Stands" drops the joint; "Let go" then needs none.
    const back = choose(chooseJoint(fall, joint)!, 0)!;
    expect(currentItem(back)!.jointChoice).toBeNull();
    expect(currentItem(letGo(back)!)!.status).toBe('different');
    // Tampering: a joint that does not match the status, or out of range, is rejected.
    const bad = clone(right);
    bad.items[i]!.jointChoice = (joint + 1) % bodies;
    expect(isBalanceState(bad)).toBe(false);
    bad.items[i]!.jointChoice = 9;
    expect(isBalanceState(bad)).toBe(false);
  });

  it('an open or skipped item with a joint past the top body is rejected, so "Let go" never leaves a valid save invalid (review)', () => {
    const { s, i } = find(true);
    const bodies = (s.items[i]!.scene.s as StackScene).bodies.length;
    const open = clone(chooseJoint(choose(s, s.items[i]!.answer!)!, 0)!);
    expect(isBalanceState(open)).toBe(true);
    open.items[i]!.jointChoice = bodies;
    expect(isBalanceState(open)).toBe(false);
    const skipped = clone(skip(chooseJoint(choose(s, s.items[i]!.answer!)!, bodies - 1)!)!);
    expect(isBalanceState(skipped)).toBe(true);
    skipped.items[i]!.jointChoice = bodies;
    expect(isBalanceState(skipped)).toBe(false);
    // Whatever a valid open item holds, committing it gives a valid save.
    for (let j = 0; j < bodies; j++) expect(isBalanceState(clone(letGo(chooseJoint(choose(s, 1)!, j)!)!))).toBe(true);
    // Never throws on odd values.
    for (const v of [Number.NaN, '1', {}, [], -1, 1.5, Infinity, true, 1e9]) {
      const odd = clone(open) as unknown as { items: Record<string, unknown>[] };
      odd.items[i]!.jointChoice = v;
      expect(() => isBalanceState(odd)).not.toThrow();
      expect(isBalanceState(odd)).toBe(false);
    }
  });

  it('a stack that stands needs no joint; medium asks none', () => {
    const { s, i } = find(false);
    const done = letGo(choose(s, 0)!)!;
    expect(currentItem(done)!.status).toBe('matched');
    expect(chooseJoint(choose(s, 1)!, 0)).not.toBeNull();
    const m = round(3, { bench: 'stack', tasks: 'predict' }, 'medium');
    expect(chooseJoint(choose(m, 1)!, 0)).toBeNull();
    const it = currentItem(m)!;
    const committed = letGo(choose(m, it.answer!)!)!;
    expect(currentItem(committed)!.status).toBe('matched');
    const tampered = clone(committed);
    tampered.items[0]!.jointChoice = 0;
    expect(isBalanceState(tampered)).toBe(false);
    expect(i).toBeGreaterThanOrEqual(0);
  });

  it('a save from before the question (a fall committed without a joint) stays valid and is judged by the option', () => {
    const { s, i } = find(true);
    const it = s.items[i]!;
    const old = clone(s);
    const o = old.items[i]! as { jointChoice?: number | null };
    delete o.jointChoice;
    Object.assign(old.items[i]!, { choice: it.answer, outcome: { bench: 'stack', ...stackVerdict(it.scene.s as StackScene) }, status: 'matched' });
    expect(isBalanceState(clone(old))).toBe(true);
    Object.assign(old.items[i]!, { status: 'different' });
    expect(isBalanceState(clone(old))).toBe(false);
  });
});

describe('hard stack-counter: the plank slides (owner decision 2026-10-29)', () => {
  function counter(d: 'medium' | 'hard'): RoundState {
    for (let seed = 0; seed < 100; seed++) {
      const s = round(seed, { bench: 'stack', tasks: 'build' }, d);
      const i = s.items.findIndex((it) => it.id === 'stack-counter');
      if (i >= 0) return { ...s, index: i, items: s.items.map((it, j) => (j < i ? { ...it, draft: clone(it.witness!), outcome: null, status: 'shown' as const, help: 3 } : it)) };
    }
    throw new Error('no stack-counter task');
  }

  it('the plank moves with its bucket and cubes, never so far back that the bucket hangs over the table', () => {
    const s = counter('hard');
    expect(isBalanceState(clone(s))).toBe(true);
    const it = currentItem(s)!;
    const start = it.draft.s as StackScene;
    const withCube = placeCube(start, it.tray[0]!, 0, start.bodies[0]!.left + 10)!;
    const moved = moveBody(withCube, 0, -3)!;
    expect(moved.bodies[0]!.left).toBe(start.bodies[0]!.left - 3);
    expect(moved.bucket!.x).toBe(start.bucket!.x - 3);
    expect(moved.cubes[0]!.x).toBe(withCube.cubes[0]!.x - 3);
    const limit = BUCKET_MIN_X - start.bucket!.x;
    expect(moveBody(start, 0, limit)!.bucket!.x).toBe(BUCKET_MIN_X);
    expect(moveBody(start, 0, limit - 1)).toBeNull();
    // A draft with the plank slid is a valid save on hard; the witness solves after sliding.
    const slid = editDraft(s, { bench: 'stack', s: moved })!;
    expect(isBalanceState(clone(slid))).toBe(true);
    const solved = letGo(editDraft(s, clone(it.witness!))!)!;
    expect(currentItem(solved)!.status).toBe('solved');
    expect(isBalanceState(clone(solved))).toBe(true);
  });

  it('on medium the plank stays: a slid plank is not a valid draft; a hard save with the plank at the witness place stays valid', () => {
    const m = counter('medium');
    const it = currentItem(m)!;
    const slid = editDraft(m, { bench: 'stack', s: moveBody(it.draft.s as StackScene, 0, -2)! })!;
    expect(isBalanceState(clone(slid))).toBe(false);
    // A hard save from before the sliding plank: the start had the plank at the witness's place.
    const h = counter('hard');
    const legacy = clone(h);
    const li = legacy.items[legacy.index]!;
    li.scene = { bench: 'stack', s: { ...(li.witness!.s as StackScene), cubes: [] } };
    li.draft = clone(li.scene);
    expect(isBalanceState(legacy)).toBe(true);
  });
});
