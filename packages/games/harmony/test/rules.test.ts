import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LEVELS, QUIZ_TOPICS, SENSES, TOPICS } from '../src/levels';
import {
  clearHeld,
  commit,
  isHarmonyState,
  isMatch,
  markReported,
  newKeyboard,
  newRound,
  next,
  peek,
  readSettings,
  restart,
  setBase,
  setDraft,
  setMode,
  setOverlay,
  setTuning,
  settingsOf,
  skip,
  summarize,
  toggleBuildKey,
  toggleHeld,
  type HarmonyState,
  type KeyboardState,
  type QuizState
} from '../src/rules';
import { answerIndex, buildTargetPcs, type BuildSpec, type ChoiceSpec } from '../src/spec';
import { midiOf } from '../src/spelling';
import { SEMITONES } from '../src/theory';

const quiz = (seed: number, topic: (typeof QUIZ_TOPICS)[number], difficulty: (typeof LEVELS)[number] = 'easy', senses: 'ear' | 'eye' = 'ear') =>
  newRound(seed, readSettings({ topic, senses }, difficulty)) as QuizState;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

describe('settings (ADR 0017)', () => {
  it('reads untrusted settings with defaults', () => {
    expect(readSettings(undefined, undefined)).toEqual({ topic: 'intervals', senses: 'ear', difficulty: 'easy' });
    expect(readSettings({ topic: 'zzz', senses: 'nose' }, 'insane')).toEqual({ topic: 'intervals', senses: 'ear', difficulty: 'easy' });
    expect(readSettings({ topic: 'build', senses: 'eye' }, 'hard')).toEqual({ topic: 'build', senses: 'ear', difficulty: 'hard' });
    expect(readSettings({ topic: 'rhythm', senses: 'eye' }, 'medium')).toEqual({ topic: 'rhythm', senses: 'eye', difficulty: 'medium' });
  });

  it('settingsOf round-trips every combination', () => {
    for (const topic of TOPICS)
      for (const senses of SENSES)
        for (const difficulty of LEVELS) {
          const state = newRound(5, readSettings({ topic, senses }, difficulty));
          const back = settingsOf(state);
          expect(newRound(5, readSettings(back, back.difficulty))).toEqual(state);
          if (topic === 'keyboard') expect(back).toEqual({ topic: 'keyboard' });
          else if (topic === 'build') expect(back).toEqual({ topic, difficulty });
          else expect(back).toEqual({ topic, difficulty, senses });
        }
  });
});

describe('quiz transitions (design § 13)', () => {
  it('draft → check → next, then the summary; reported once', () => {
    let s = quiz(3, 'intervals');
    expect(isHarmonyState(s)).toBe(true);
    expect(commit(s)).toBe(s);
    expect(next(s)).toBe(s);
    const right = answerIndex(s.items[0]!.spec as ChoiceSpec);
    s = setDraft(s, { choice: right });
    expect(s.items[0]!.draft).toEqual({ choice: right });
    expect(setDraft(s, { choice: right })).toBe(s);
    expect(setDraft(s, { choice: 99 })).toBe(s);
    s = commit(s);
    expect(s.items[0]!.matched).toBe(true);
    expect(commit(s)).toBe(s);
    expect(setDraft(s, { choice: 0 })).toBe(s);
    expect(skip(s)).toBe(s);
    s = next(s);
    expect(s.index).toBe(1);
    const wrong = (answerIndex(s.items[1]!.spec as ChoiceSpec) + 1) % 4;
    s = commit(setDraft(s, { choice: wrong }));
    expect(s.items[1]!.matched).toBe(false);
    s = next(s);
    for (let i = 2; i < 10; i++) s = next(skip(s));
    expect(s.index).toBe(10);
    expect(isHarmonyState(s)).toBe(true);
    const done = markReported(s);
    expect(done.reported).toBe(true);
    expect(markReported(done)).toBe(done);
    const sum = summarize(done);
    expect(sum).toMatchObject({ asked: 2, matched: 1, skipped: 8, hints: 0, noSound: 0 });
    expect(sum.mixUps).toHaveLength(1);
    expect(sum.mixUps[0]!.k).toBe('interval');
    expect(restart(done)).toEqual(quiz(3, 'intervals'));
  });

  it('peek is recorded by ear only, once, before checking', () => {
    let s = quiz(4, 'chords', 'medium');
    s = peek(s, 'hint');
    expect(s.items[0]!.peeked).toBe('hint');
    expect(peek(s, 'no-sound')).toBe(s);
    const eye = quiz(4, 'chords', 'medium', 'eye');
    expect(peek(eye, 'hint')).toBe(eye);
    s = next(skip(s));
    s = peek(s, 'no-sound');
    expect(summarize({ ...s, index: 10 } as QuizState)).toMatchObject({ hints: 1, noSound: 1, skipped: 1 });
  });

  it('mix-ups are counted and sorted, at most 3', () => {
    let s = quiz(11, 'intervals', 'medium');
    for (let i = 0; i < 10; i++) {
      const right = answerIndex(s.items[i]!.spec as ChoiceSpec);
      s = next(commit(setDraft(s, { choice: (right + 1 + (i % 4)) % 8 })));
    }
    const sum = summarize(s);
    expect(sum.matched).toBe(0);
    expect(sum.mixUps.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < sum.mixUps.length; i++) expect(sum.mixUps[i - 1]!.count).toBeGreaterThanOrEqual(sum.mixUps[i]!.count);
  });
});

describe('build tasks (design § 7.6)', () => {
  it('easy: the exact key; toggling replaces it', () => {
    let s = quiz(2, 'build', 'easy');
    const spec = s.items[0]!.spec as BuildSpec & { task: 'interval' };
    const target = midiOf(spec.root) + SEMITONES[spec.target];
    s = toggleBuildKey(s, target + 12 > 83 ? target - 12 : target + 12);
    s = toggleBuildKey(s, target);
    expect(s.items[0]!.draft).toEqual({ keys: [target] });
    expect(toggleBuildKey(s, midiOf(spec.root))).toBe(s);
    s = commit(s);
    expect(s.items[0]!.matched).toBe(true);
  });

  it('medium/hard: pitch-class sets with octave freedom', () => {
    for (const level of ['medium', 'hard'] as const) {
      let s = quiz(9, 'build', level);
      const spec = s.items[0]!.spec as BuildSpec;
      const root = midiOf(spec.root);
      const pcs = buildTargetPcs(spec);
      // Every needed pitch class once, in the upper octave where possible; the root is given.
      for (const pc of pcs) {
        if (pc === root % 12) continue;
        let m = 72 + pc;
        if (m > 83) m -= 12;
        s = toggleBuildKey(s, m);
      }
      expect(isMatch(spec, s.items[0]!.draft!)).toBe(true);
      const extra = Array.from({ length: 24 }, (_, i) => 60 + i).find((m) => !pcs.includes(m % 12))!;
      expect(isMatch(spec, toggleBuildKey(s, extra).items[0]!.draft!)).toBe(false);
      expect(commit(s).items[0]!.matched).toBe(true);
    }
  });

  it('an empty selection cannot be checked', () => {
    const s = quiz(9, 'build', 'medium');
    expect(commit(setDraft(s, { keys: [] }))).toEqual(setDraft(s, { keys: [] }));
  });
});

describe('free keyboard (design § 7.7)', () => {
  it('toggles held notes within range, up to 12, and keeps settings in bounds', () => {
    let k: KeyboardState = newKeyboard(1);
    k = toggleHeld(toggleHeld(toggleHeld(k, 60), 64), 67);
    expect(k.held).toEqual([60, 64, 67]);
    expect(toggleHeld(k, 20)).toBe(k);
    k = toggleHeld(k, 64);
    expect(k.held).toEqual([60, 67]);
    let many = newKeyboard(1);
    for (let m = 48; m < 70; m++) many = toggleHeld(many, m);
    expect(many.held).toHaveLength(12);
    expect(clearHeld(k).held).toEqual([]);
    expect(setBase(k, 9)).toBe(k);
    expect(setBase(k, 2).base).toBe(2);
    expect(setMode(k, 'play').held).toEqual([]);
    expect(toggleHeld(setMode(k, 'play'), 60).held).toEqual([]);
    expect(setTuning(k, 'just').tuning).toBe('just');
    expect(setOverlay(k, { tonic: 2, s: 'major' }).overlay).toEqual({ tonic: 2, s: 'major' });
    expect(setOverlay(k, { tonic: 12, s: 'major' })).toBe(k);
    for (const x of [k, many, setMode(k, 'play'), setOverlay(k, { tonic: 2, s: 'major-pentatonic' })]) expect(isHarmonyState(clone(x))).toBe(true);
  });
});

describe('isHarmonyState (design § 13)', () => {
  it('never throws and accepts generated states', () => {
    fc.assert(fc.property(fc.anything(), (v) => { expect(() => isHarmonyState(v)).not.toThrow(); }), { numRuns: 500 });
    for (const topic of TOPICS) for (const d of LEVELS) for (const senses of SENSES) expect(isHarmonyState(clone(newRound(77, readSettings({ topic, senses }, d))))).toBe(true);
  });

  it('rejects tampered states', () => {
    const s = quiz(5, 'intervals', 'medium');
    const t = (f: (x: Record<string, any>) => void) => {
      const x = clone(s) as unknown as Record<string, any>;
      f(x);
      return isHarmonyState(x);
    };
    expect(t(() => undefined)).toBe(true);
    expect(t((x) => (x.items[0].spec.root = { l: 0, a: 0, o: 6 }))).toBe(false);
    expect(t((x) => (x.items[0].spec.ivl = 'TT'))).toBe(false);
    expect(t((x) => (x.items[0].spec.options = [...x.items[0].spec.options.slice(1), x.items[0].spec.options[1]]))).toBe(false);
    expect(t((x) => (x.items[0].matched = true))).toBe(false);
    expect(t((x) => (x.items[0].answer = { choice: 0 }))).toBe(false);
    expect(t((x) => (x.reported = true))).toBe(false);
    expect(t((x) => (x.index = 3))).toBe(false);
    expect(t((x) => x.items.pop())).toBe(false);
    expect(t((x) => (x.items[0].draft = { choice: 8 }))).toBe(false);
    expect(t((x) => (x.items[1].draft = { choice: 1 }))).toBe(false);
    expect(t((x) => (x.extra = 1))).toBe(false);
    expect(t((x) => (x.senses = 'nose'))).toBe(false);
    const r = clone(quiz(5, 'rhythm', 'easy')) as unknown as Record<string, any>;
    r.items[0].spec.options[0] = [2, 2, 2];
    expect(isHarmonyState(r)).toBe(false);
    const b = clone(quiz(5, 'build', 'easy')) as unknown as Record<string, any>;
    b.senses = 'eye';
    expect(isHarmonyState(b)).toBe(false);
    const k = clone(newKeyboard(1)) as unknown as Record<string, any>;
    k.held = Array.from({ length: 13 }, (_, i) => 48 + i);
    expect(isHarmonyState(k)).toBe(false);
    k.held = [64, 60];
    expect(isHarmonyState(k)).toBe(false);
    k.held = [];
    k.base = 7;
    expect(isHarmonyState(k)).toBe(false);
  });

  it('random action sequences never throw and keep the state valid', () => {
    const action = fc.oneof(
      fc.record({ a: fc.constant('draft'), n: fc.integer({ min: -1, max: 12 }) }),
      fc.record({ a: fc.constant('key'), n: fc.integer({ min: 55, max: 90 }) }),
      fc.record({ a: fc.constantFrom('commit', 'skip', 'next', 'peek', 'nosound', 'report'), n: fc.constant(0) })
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e6 }), fc.constantFrom(...QUIZ_TOPICS), fc.constantFrom(...LEVELS), fc.constantFrom(...SENSES), fc.array(action, { maxLength: 60 }), (seed, topic, d, senses, actions) => {
        let s = quiz(seed, topic, d, senses);
        for (const { a, n } of actions) {
          if (a === 'draft') s = setDraft(s, { choice: n });
          else if (a === 'key') s = toggleBuildKey(s, n);
          else if (a === 'commit') s = commit(s);
          else if (a === 'skip') s = skip(s);
          else if (a === 'next') s = next(s);
          else if (a === 'peek') s = peek(s, 'hint');
          else if (a === 'nosound') s = peek(s, 'no-sound');
          else s = markReported(s);
          expect(isHarmonyState(clone(s as HarmonyState))).toBe(true);
        }
      }),
      { numRuns: 120 }
    );
  });
});
