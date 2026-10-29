import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  CATEGORY_CHOICES,
  DIFFICULTIES,
  MODEL_MODES,
  RECENT_SIZE,
  ROUND_LENGTH,
  STATE_VERSION,
  bandOf,
  commitGuess,
  compare,
  createInitial,
  currentQuestion,
  finishModel,
  guidedRows,
  isFermiState,
  markFinished,
  migrateState,
  marksOf,
  modelResult,
  next,
  poolOf,
  readRecent,
  referenceProduct,
  rememberTask,
  resetState,
  score,
  selectTasks,
  sensitivity,
  setDraft,
  setRowNumber,
  settingsOf,
  summarize,
  taskOf,
  type FactorState,
  type FermiState
} from '../src/rules';
import { TASKS, taskById, type Task } from '../src/tasks';
import { convertTo, dimsText, isCountWord, leftover, multiply, parseUnit, unitText, type Dims } from '../src/units';
import { decade } from '../src/format';

const task = (id: string): Task => taskById(id)!;
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/**
 * Plays the current question. Free: commits `answer` as the estimate. Guided: fills every open row with its reference
 * value, the first open row of power 1 scaled so that the model's result is `answer`, and commits the model.
 */
function playQuestion(state: FermiState, answer: number): FermiState {
  if (state.model === 'free') return commitGuess(state, answer);
  let s = state;
  const q = currentQuestion(s)!;
  const t = taskOf(q);
  let scaled = false;
  q.factors.forEach((row, i) => {
    const ref = t.factors.find((x) => x.id === row.ref);
    if (!ref || ref.fixed) return;
    const k = !scaled && ref.power === 1 ? answer / referenceProduct(t)! : 1;
    scaled ||= ref.power === 1;
    s = setRowNumber(s, i, String(ref.value * k), 0, ref.value * k);
  });
  return finishModel(s);
}

describe('units', () => {
  it('parses every unit used by the tasks', () => {
    for (const t of TASKS) {
      expect(parseUnit(t.answer.unit), `${t.id} answer`).not.toBeNull();
      for (const f of t.factors) expect(parseUnit(f.unit), `${t.id}/${f.id}`).not.toBeNull();
    }
  });

  it('knows the conversions', () => {
    expect(parseUnit('kWh')!.scale).toBe(3.6e6);
    expect(parseUnit('year')!.scale / parseUnit('day')!.scale).toBe(365);
    expect(parseUnit('km³')!.scale).toBeCloseTo(1e9);
    expect(parseUnit('L/(person·day)')!.dims).toEqual([3, 0, -1, 0, 0]);
    expect(parseUnit('J/(kg·K)')!.dims).toEqual([2, 0, -2, -1, 0]);
    expect(parseUnit('kWh/(m²·year)')!.dims).toEqual([0, 1, -3, 0, 0]);
  });

  it('rejects malformed units without throwing', () => {
    for (const bad of ['', 'furlong', 'm/s/s', '(m)/s', 'm/((s))', 'm·', '/s', 'x'.repeat(50), 'm/(s']) expect(parseUnit(bad), bad).toBeNull();
    expect(parseUnit(42 as unknown as string)).toBeNull();
  });

  it('multiplies dimensions additively and scales multiplicatively (property)', () => {
    const units = ['m', 'km', 'g', 'kg', 'h', 's', 'L', 'Wh', 'W', 'K', 'mol', 'ha', 'cm²', 'min'];
    fc.assert(
      fc.property(fc.constantFrom(...units), fc.constantFrom(...units), fc.double({ min: 1e-3, max: 1e3, noNaN: true }), fc.double({ min: 1e-3, max: 1e3, noNaN: true }), (u, v, a, b) => {
        const p = multiply([
          { value: a, unit: u, power: 1 },
          { value: b, unit: v, power: 1 }
        ])!;
        const pu = parseUnit(u)!;
        const pv = parseUnit(v)!;
        expect(p.dims).toEqual(pu.dims.map((d, i) => d + pv.dims[i]!));
        expect(p.si / (a * pu.scale * b * pv.scale)).toBeCloseTo(1, 9);
      }),
      { numRuns: 150 }
    );
  });

  it('converts only between matching dimensions, and reports leftovers', () => {
    const p = multiply([{ value: 2, unit: 'kWh', power: 1 }])!;
    expect(convertTo(p, 'J')).toBeCloseTo(7.2e6);
    expect(convertTo(p, 'W')).toBeNull();
    expect(dimsText(leftover(p, 'W'))).toBe('s');
    expect(dimsText([0, 1, -1, 0, 0] as Dims)).toBe('kg·s⁻¹');
    expect(multiply([{ value: 0, unit: 'm', power: 1 }])).toBeNull();
    expect(multiply([{ value: 1, unit: 'nope', power: 1 }])).toBeNull();
  });

  it('labels count words and parenthesises compound denominators', () => {
    const label = (name: string, count: boolean) => (count && isCountWord(name) ? `${name}s` : name);
    expect(unitText('g/grain', label)).toBe('g/grain');
    expect(unitText('person/m²', label)).toBe('persons/m²');
    expect(unitText('L/(person·day)', label)).toBe('L/(person·day)');
    expect(unitText('1/year', label)).toBe('1/year');
  });
});

describe('scoring', () => {
  const t = task('rice-grains'); // central 40,000

  it('has inclusive band limits at ×2, ×3, ×10 and ×100 in both directions', () => {
    const c = t.answer.central;
    for (const [k, band] of [
      [2, 'x2'],
      [3, 'x3'],
      [10, 'x10'],
      [100, 'x100']
    ] as const) {
      expect(score(c * k, t).band).toBe(band);
      expect(score(c / k, t).band).toBe(band);
      expect(score(c * k * 1.001, t).band).not.toBe(band);
    }
    expect(score(c * 101, t).band).toBe('far');
    expect(bandOf(0)).toBe('x2');
    expect([marksOf('x2'), marksOf('x3'), marksOf('x10'), marksOf('x100'), marksOf('far')]).toEqual([3, 2, 1, 0, 0]);
  });

  it('gives directions and the plausible-range flag', () => {
    expect(score(80_000, t)).toMatchObject({ direction: 'high', inRange: false });
    expect(score(20_000, t)).toMatchObject({ direction: 'low', inRange: false });
    expect(score(41_000, t)).toMatchObject({ direction: 'none', inRange: true });
    expect(score(80_000, t).factor).toBeCloseTo(2);
  });

  it('is symmetric and equals |log10(answer ÷ central)| (property)', () => {
    fc.assert(
      fc.property(fc.double({ min: 1e-6, max: 1e6, noNaN: true }), (k) => {
        const up = score(t.answer.central * k, t);
        const down = score(t.answer.central / k, t);
        expect(up.d).toBeCloseTo(Math.abs(Math.log10(k)), 9);
        expect(down.d).toBeCloseTo(up.d, 9);
        expect(down.band).toBe(up.band);
      }),
      { numRuns: 200 }
    );
  });
});

describe('model, comparison and sensitivity', () => {
  it('the guided model filled with reference values reproduces the reference product', () => {
    for (const t of TASKS) {
      const rows = guidedRows(t).map((r) => {
        const f = t.factors.find((x) => x.id === r.ref)!;
        return f.fixed ? r : { ...r, text: String(f.value), value: f.value };
      });
      const result = modelResult(t, rows);
      expect(result.status, t.id).toBe('ok');
      if (result.status === 'ok') expect(result.value / referenceProduct(t)!).toBeCloseTo(1, 9);
    }
  });

  it('equals Π (value · scale)^power ÷ answer scale for random values (property)', () => {
    const t = task('lifetime-walking');
    fc.assert(
      fc.property(fc.array(fc.double({ min: 1e-3, max: 1e6, noNaN: true }), { minLength: 4, maxLength: 4 }), (values) => {
        const rows = guidedRows(t).map((r, i) => (t.factors[i]!.fixed ? r : { ...r, text: 'x', value: values[i]! }));
        const result = modelResult(t, rows);
        const expected = t.factors.reduce((acc, f, i) => acc * ((f.fixed ? f.value : values[i]!) * parseUnit(f.unit)!.scale) ** f.power, 1) / parseUnit('km')!.scale;
        expect(result.status).toBe('ok');
        if (result.status === 'ok') expect(result.value / expected).toBeCloseTo(1, 9);
      }),
      { numRuns: 100 }
    );
  });

  it('reports empty, incomplete and mismatched models', () => {
    const t = task('room-air');
    expect(modelResult(t, []).status).toBe('empty');
    expect(modelResult(t, guidedRows(t)).status).toBe('incomplete');
    const area: FactorState = { ref: null, unit: 'm²', power: 1, text: '25', exp: 0, value: 25, label: '' };
    const r = modelResult(t, [area]);
    expect(r.status).toBe('units');
    if (r.status === 'units') expect(dimsText(r.leftover)).toBe('m²·kg⁻¹');
  });

  it('applies the × 10ⁿ stepper', () => {
    const t = task('rice-grains');
    const rows = guidedRows(t).map((r) => (r.ref === 'grainMass' ? { ...r, text: '2.5', exp: -2, value: 2.5 } : r));
    const result = modelResult(t, rows);
    expect(result.status === 'ok' && result.value).toBeCloseTo(40_000);
  });

  it('compares row effects and names the biggest difference', () => {
    const t = task('rain-roof');
    const rows = guidedRows(t).map((r) => (r.ref === 'roofArea' ? { ...r, value: 150 } : r.ref === 'rainfall' ? { ...r, value: 0.315 } : r));
    const cmp = compare(t, rows);
    const byId = Object.fromEntries(cmp.rows.map((r) => [r.factor.id, r]));
    expect(byId.roofArea!.effect).toBeCloseTo(1.5);
    expect(byId.rainfall!.effect).toBeCloseTo(0.5);
    expect(byId.rainfall!.biggest).toBe(true);
    expect(byId.litresPerM3!.effect).toBeNull();
    expect(cmp.othersEffect).toBeNull();
  });

  it('matches free rows only on a unique unit and power', () => {
    const t = task('pitch-crowd'); // two factors in m, one in person/m²
    const free = (unit: string, value: number): FactorState => ({ ref: null, unit, power: 1, text: String(value), exp: 0, value, label: '' });
    const cmp = compare(t, [free('m', 100), free('m', 70), free('person/m²', 2)]);
    expect(cmp.rows.find((r) => r.factor.id === 'crowdDensity')!.effect).toBeCloseTo(0.5);
    expect(cmp.rows.find((r) => r.factor.id === 'pitchLength')!.yours).toBeNull();
    expect(cmp.others).toHaveLength(2);
    // The unmatched rows explain the rest of the result.
    expect(cmp.othersEffect! * 0.5).toBeCloseTo((100 * 70 * 2) / t.answer.central);
  });

  it('builds tornado bars with hi/lo = (high/low)^|power|, widest first, given factors excluded', () => {
    for (const t of TASKS) {
      const bars = sensitivity(t);
      expect(bars.map((b) => b.factorId).sort()).toEqual(t.factors.filter((x) => !x.fixed).map((x) => x.id).sort());
      for (const b of bars) {
        const f = t.factors.find((x) => x.id === b.factorId)!;
        expect(b.hi / b.lo).toBeCloseTo((f.high / f.low) ** Math.abs(f.power), 6);
        expect(b.lo).toBeLessThanOrEqual(t.answer.central * 1.0000001);
        expect(b.hi).toBeGreaterThanOrEqual(t.answer.central * 0.9999999);
      }
      for (let i = 1; i < bars.length; i++) expect(bars[i - 1]!.spanDecades).toBeGreaterThanOrEqual(bars[i]!.spanDecades);
    }
    expect(sensitivity(task('sand-jar'))[0]!.factorId).toBe('grainDiameter');
  });
});

describe('round selection', () => {
  it('picks five distinct tasks of the category for every setting, deterministically', () => {
    for (const difficulty of DIFFICULTIES)
      for (const category of CATEGORY_CHOICES)
        for (let seed = 0; seed < 200; seed++) {
          const s = createInitial(seed, { difficulty, category });
          const ids = s.questions.map((q) => q.taskId);
          expect(new Set(ids).size).toBe(ROUND_LENGTH);
          if (category !== 'all') for (const id of ids) expect(task(id).category).toBe(category);
          if (seed < 3) expect(createInitial(seed, { difficulty, category })).toEqual(s);
        }
  });

  it('takes the round’s level first and fills up from the neighbouring levels', () => {
    for (let seed = 0; seed < 50; seed++) {
      const levels = selectTasks(createRng(seed), 'easy', 'space').map((t) => t.level);
      const l1 = poolOf('space').filter((t) => t.level === 1).length;
      const l2 = poolOf('space').filter((t) => t.level === 2).length;
      expect(levels.filter((l) => l === 1)).toHaveLength(l1);
      expect(levels.filter((l) => l === 2)).toHaveLength(Math.min(l2, 5 - l1));
      expect(selectTasks(createRng(seed), 'hard', 'all').every((t) => t.level === 3)).toBe(true);
    }
  });

  it('places the slider window so the central value is 2 to 7 decades above its start, covering all offsets', () => {
    const offsets = new Set<number>();
    for (let seed = 0; seed < 200; seed++) {
      for (const q of createInitial(seed).questions) {
        const off = decade(task(q.taskId).answer.central) - q.windowLo;
        expect(off).toBeGreaterThanOrEqual(2);
        expect(off).toBeLessThanOrEqual(7);
        offsets.add(off);
      }
    }
    expect([...offsets].sort()).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it('falls back to defaults for untrusted choices and tells its settings', () => {
    const s = createInitial(Number.NaN, { difficulty: 'nope', category: 42, model: '__proto__' });
    expect(settingsOf(s)).toEqual({ difficulty: 'easy', category: 'all', model: 'guided' });
    expect(isFermiState(s)).toBe(true);
    const t = createInitial(5, { difficulty: 'hard', category: 'space', model: 'free' });
    expect(settingsOf(t)).toEqual({ difficulty: 'hard', category: 'space', model: 'free' });
    expect(resetState(playQuestion(t, 10))).toEqual(t);
  });
});

describe('recently shown tasks (per-device memory)', () => {
  const LEVELS = { easy: [1, 2, 3], medium: [2, 1, 3], hard: [3, 2, 1] } as const;
  /** The selection before the memory existed (design § 4), to check that an empty memory changes nothing. */
  const legacy = (seed: number, difficulty: (typeof DIFFICULTIES)[number], category: (typeof CATEGORY_CHOICES)[number]) => {
    const rng = createRng(seed);
    const chosen: Task[] = [];
    for (const level of LEVELS[difficulty]) for (const t of rng.shuffle(poolOf(category).filter((x) => x.level === level))) if (chosen.length < ROUND_LENGTH) chosen.push(t);
    return rng.shuffle(chosen).map((t) => t.id);
  };
  const setting = fc.record({ seed: fc.integer({ min: 0, max: 0xffffffff }), difficulty: fc.constantFrom(...DIFFICULTIES), category: fc.constantFrom(...CATEGORY_CHOICES) });
  const ids = (s: FermiState) => s.questions.map((q) => q.taskId);

  it('the window is about half of the smallest level pool of "All topics" and covers at least one round', () => {
    const smallest = Math.min(...[1, 2, 3].map((l) => poolOf('all').filter((t) => t.level === l).length));
    expect(RECENT_SIZE).toBeGreaterThanOrEqual(ROUND_LENGTH);
    expect(RECENT_SIZE).toBeLessThanOrEqual(Math.floor(smallest / 2));
  });

  it('without a memory the round is the same as before the memory existed', () => {
    fc.assert(
      fc.property(setting, ({ seed, difficulty, category }) => {
        expect(ids(createInitial(seed, { difficulty, category }))).toEqual(legacy(seed, difficulty, category));
        expect(ids(createInitial(seed, { difficulty, category }, []))).toEqual(legacy(seed, difficulty, category));
      }),
      { numRuns: 300 }
    );
  });

  it('prefers unseen tasks, repeats the ones seen longest ago only when the pool runs out, and is deterministic', () => {
    const withMemory = setting.chain((x) => fc.shuffledSubarray(poolOf(x.category).map((t) => t.id), { maxLength: RECENT_SIZE }).map((recent) => ({ ...x, recent })));
    fc.assert(
      fc.property(withMemory, ({ seed, difficulty, category, recent }) => {
        const s = createInitial(seed, { difficulty, category }, recent);
        const round = ids(s);
        expect(isFermiState(s)).toBe(true);
        expect(new Set(round).size).toBe(ROUND_LENGTH);
        for (const id of round) expect(poolOf(category).map((t) => t.id)).toContain(id);
        const unseen = poolOf(category).filter((t) => !recent.includes(t.id));
        if (unseen.length >= ROUND_LENGTH) expect(round.filter((id) => recent.includes(id))).toEqual([]);
        else {
          for (const t of unseen) expect(round).toContain(t.id);
          // Among the seen tasks of one level, the round takes the ones seen longest ago.
          for (const id of round.filter((x) => recent.includes(x)))
            for (const other of recent.filter((x) => !round.includes(x) && task(x).level === task(id).level)) expect(recent.indexOf(id)).toBeLessThan(recent.indexOf(other));
        }
        expect(createInitial(seed, { difficulty, category }, recent)).toEqual(s);
      }),
      { numRuns: 400 }
    );
  });

  it('round after round: no task of the window comes back while the pool allows it, and "All topics" keeps its level', () => {
    fc.assert(
      fc.property(setting, fc.integer({ min: 2, max: 8 }), ({ seed, difficulty, category }, rounds) => {
        let recent: string[] = [];
        for (let r = 0; r < rounds; r++) {
          const round = ids(createInitial(seed + r, { difficulty, category }, recent));
          const unseen = poolOf(category).filter((t) => !recent.includes(t.id)).length;
          if (unseen >= ROUND_LENGTH) for (const id of round) expect(recent, `round ${r}`).not.toContain(id);
          if (category === 'all') for (const id of round) expect(task(id).level).toBe(LEVELS[difficulty][0]);
          for (const id of round) recent = rememberTask(recent, id);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('a restart repeats the round it started with, whatever the memory says now', () => {
    fc.assert(
      fc.property(setting, fc.shuffledSubarray(TASKS.map((t) => t.id), { maxLength: RECENT_SIZE }), ({ seed, difficulty, category }, recent) => {
        const s = createInitial(seed, { difficulty, category, model: 'free' }, recent);
        expect(resetState(playQuestion(s, 10))).toEqual(s);
      }),
      { numRuns: 100 }
    );
  });

  it('reads any stored value without throwing: known ids only, no duplicates, at most the window', () => {
    expect(readRecent(undefined)).toEqual([]);
    expect(readRecent('rain-roof')).toEqual([]);
    expect(readRecent({ 0: 'rain-roof' })).toEqual([]);
    expect(readRecent(['nope', 'rain-roof', 3, null, 'rain-roof'])).toEqual(['rain-roof']);
    fc.assert(
      fc.property(fc.anything(), fc.array(fc.oneof(fc.constantFrom(...TASKS.map((t) => t.id)), fc.string(), fc.anything())), (junk, list) => {
        for (const value of [junk, list]) {
          const r = readRecent(value);
          expect(r.length).toBeLessThanOrEqual(RECENT_SIZE);
          expect(new Set(r).size).toBe(r.length);
          for (const id of r) expect(taskById(id)).toBeDefined();
          expect(readRecent(r)).toEqual(r);
        }
      }),
      { numRuns: 300 }
    );
  });

  it('remembers the newest last and forgets the oldest beyond the window', () => {
    let r: string[] = [];
    for (const t of TASKS.slice(0, RECENT_SIZE + 3)) r = rememberTask(r, t.id);
    expect(r).toEqual(TASKS.slice(3, RECENT_SIZE + 3).map((t) => t.id));
    expect(rememberTask(r, r[0]!)).toEqual([...r.slice(1), r[0]]);
  });
});

describe('transitions', () => {
  it('runs a whole guided round and summarises it', () => {
    let s = createInitial(3, { difficulty: 'medium' });
    expect(s.model).toBe('guided');
    for (let i = 0; i < ROUND_LENGTH; i++) {
      const q = currentQuestion(s)!;
      // A guided question opens in the model with the reference rows, given values included.
      expect(q.phase).toBe('model');
      expect(q.factors.map((r) => r.ref)).toEqual(taskOf(q).factors.map((x) => x.id));
      const c = taskOf(q).answer.central;
      s = playQuestion(s, i < 3 ? c : c / 30);
      expect(currentQuestion(s)!.phase).toBe('review');
      expect(currentQuestion(s)!.modelUsed).toBe(true);
      expect(currentQuestion(s)!.firstGuess).toBeNull();
      expect(isFermiState(s)).toBe(true);
      s = next(s);
    }
    expect(s.index).toBe(ROUND_LENGTH);
    const sum = summarize(s);
    expect(sum.rows).toHaveLength(5);
    expect(sum.modelsUsed).toBe(5);
    expect(sum.withinFactor3).toBe(3);
    expect(sum.bias).toBeCloseTo((1 / 30) ** (2 / 5));
    expect(sum.tip).toBe('low');
    expect(markFinished(markFinished(s)).finishedReported).toBe(true);
    expect(isFermiState(markFinished(s))).toBe(true);
    expect(next(s)).toBe(s);
  });

  it('runs a free round: estimate → review, no model step', () => {
    let s = createInitial(3, { difficulty: 'medium', model: 'free' });
    for (let i = 0; i < ROUND_LENGTH; i++) {
      const q = currentQuestion(s)!;
      expect(q.phase).toBe('estimate');
      expect(q.factors).toEqual([]);
      s = commitGuess(setDraft(s, '12', 3), taskOf(q).answer.central * 2);
      const r = currentQuestion(s)!;
      expect(r.phase).toBe('review');
      expect(r.answer).toBe(r.firstGuess);
      expect(r.modelUsed).toBe(false);
      expect(isFermiState(s)).toBe(true);
      s = next(s);
    }
    const sum = summarize(s);
    expect(sum.modelsUsed).toBe(0);
    expect(sum.withinFactor3).toBe(5);
  });

  it('chooses the tip by pattern; a calm free round suggests the guided path', () => {
    const calm = (model: 'guided' | 'free') => {
      let s = createInitial(8, { difficulty: 'easy', category: 'society', model });
      for (let i = 0; i < ROUND_LENGTH; i++) s = next(playQuestion(s, taskOf(currentQuestion(s)!).answer.central * 1.1));
      return summarize(s).tip;
    };
    expect(calm('free')).toBe('guided');
    expect(calm('guided')).toBe('general');
    // A cube factor far off gives the cube tip.
    let c = createInitial(1, { difficulty: 'hard', category: 'space', model: 'free' });
    for (let i = 0; i < ROUND_LENGTH; i++) {
      const t = taskOf(currentQuestion(c)!);
      c = next(playQuestion(c, t.id === 'earths-in-sun' ? t.answer.central / 1000 : t.answer.central));
    }
    if (c.questions.some((q) => q.taskId === 'earths-in-sun')) expect(summarize(c).tip).toBe('cube');
  });

  it('ignores actions in the wrong phase or with invalid input', () => {
    const g = createInitial(4);
    expect(commitGuess(g, 5)).toBe(g); // guided: no estimate step
    expect(setDraft(g, '1', 0)).toBe(g);
    expect(finishModel(g)).toBe(g); // the guided model is incomplete
    expect(next(g)).toBe(g);
    const given = currentQuestion(g)!.factors.findIndex((r) => taskOf(currentQuestion(g)!).factors.find((x) => x.id === r.ref)!.fixed);
    if (given >= 0) expect(setRowNumber(g, given, '3', 0, 3)).toBe(g);
    const f = createInitial(4, { model: 'free' });
    expect(commitGuess(f, 0)).toBe(f);
    expect(commitGuess(f, Number.NaN)).toBe(f);
    expect(commitGuess(f, -3)).toBe(f);
    expect(finishModel(f)).toBe(f);
    expect(setRowNumber(f, 0, '1', 0, 1)).toBe(f);
    const r = commitGuess(f, 5);
    expect(setDraft(r, 'x', 1)).toBe(r);
    expect(commitGuess(r, 6)).toBe(r);
    expect(setDraft(f, 'a'.repeat(50), 99).questions[0]!.draft).toHaveLength(32);
    expect(setDraft(f, '1', 99).questions[0]!.draftExp).toBe(30);
  });
});

describe('isFermiState', () => {
  const base = createInitial(11, { model: 'guided' });
  const free = createInitial(11, { model: 'free' });

  it('accepts every state reachable by random actions (property)', () => {
    const action = fc.oneof(
      fc.record({ k: fc.constant('draft'), text: fc.string({ maxLength: 40 }), exp: fc.integer({ min: -10, max: 40 }) }),
      fc.record({ k: fc.constant('guess'), v: fc.double({ min: -1, max: 1e12, noNaN: true }) }),
      fc.record({ k: fc.constant('row'), i: fc.nat(6), v: fc.option(fc.double({ min: -1, max: 1e9, noNaN: true }), { nil: null }), exp: fc.integer({ min: -8, max: 32 }) }),
      fc.record({ k: fc.constantFrom('next', 'use') })
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.constantFrom(...MODEL_MODES), fc.array(action, { maxLength: 40 }), (seed, mode, actions) => {
        let s = createInitial(seed, { model: mode });
        for (const a of actions) {
          switch (a.k) {
            case 'draft':
              s = setDraft(s, (a as { text: string }).text, (a as { exp: number }).exp);
              break;
            case 'guess':
              s = commitGuess(s, (a as { v: number }).v);
              break;
            case 'row':
              s = setRowNumber(s, (a as { i: number }).i, 'x', (a as { exp: number }).exp, (a as { v: number | null }).v);
              break;
            case 'use':
              s = finishModel(s);
              break;
            default:
              s = next(s);
          }
          expect(isFermiState(clone(s))).toBe(true);
        }
      }),
      { numRuns: 120 }
    );
  });

  it('never throws on junk (property)', () => {
    fc.assert(
      fc.property(fc.anything(), (x) => {
        expect(() => isFermiState(x)).not.toThrow();
        expect(isFermiState(x)).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  /** A save as untrusted JSON, typed loosely enough to tamper with. */
  interface Raw {
    v: number;
    index: number;
    model: string;
    finishedReported: boolean;
    questions: { taskId: string; firstGuess: number; draft: string; phase: string; windowLo: number; factors: { unit: string; ref: string; exp: number }[] }[];
  }
  const tamper = (s: FermiState, edit: (x: Raw) => void): unknown => {
    const x = clone(s) as unknown as Raw;
    edit(x);
    return x;
  };

  it.each([
    ['unknown task id', (x: Raw) => (x.questions[0]!.taskId = 'future-task')],
    ['duplicate task', (x: Raw) => (x.questions[1]!.taskId = x.questions[0]!.taskId)],
    ['four questions', (x: Raw) => x.questions.pop()],
    ['NaN guess', (x: Raw) => (x.questions[0]!.firstGuess = Number.NaN)],
    ['negative guess', (x: Raw) => (x.questions[0]!.firstGuess = -1)],
    ['long draft', (x: Raw) => (x.questions[0]!.draft = 'x'.repeat(33))],
    ['review without answer', (x: Raw) => (x.questions[0]!.phase = 'review')],
    ['wrong window', (x: Raw) => (x.questions[0]!.windowLo += 9)],
    ['bad index', (x: Raw) => (x.index = 6)],
    ['old version', (x: Raw) => (x.v = 1)],
    ['bad model', (x: Raw) => (x.model = 'auto')],
    ['finished early', (x: Raw) => (x.finishedReported = true)],
    ['row with bad unit', (x: Raw) => (x.questions[0]!.factors[0]!.unit = 'furlong')],
    ['row with wrong ref', (x: Raw) => (x.questions[0]!.factors[0]!.ref = 'nope')],
    ['row exponent out of range', (x: Raw) => (x.questions[0]!.factors[0]!.exp = 31)],
    ['guided rows reordered', (x: Raw) => x.questions[0]!.factors.reverse()],
    ['guided question in the estimate', (x: Raw) => (x.questions[0]!.phase = 'estimate')],
    ['guided model with a first guess', (x: Raw) => (x.questions[0]!.firstGuess = 5)],
    ['later guided question touched', (x: Raw) => (x.questions[3]!.factors[0]!.exp = 2)]
  ])('rejects a tampered state: %s', (_, edit) => {
    expect(isFermiState(tamper(base, edit))).toBe(false);
  });

  it.each([
    ['free question in the model', (x: Raw) => (x.questions[0]!.phase = 'model')],
    ['free estimate with rows', (x: Raw) => (x.questions[0]!.factors = [{ unit: 'm', ref: 'nope', exp: 0 }])]
  ])('rejects a tampered free state: %s', (_, edit) => {
    expect(isFermiState(tamper(free, edit))).toBe(false);
  });

  it('migrateState refuses anything but a v1 state, without throwing (property)', () => {
    expect(STATE_VERSION).toBe(2);
    expect(migrateState(base, 2)).toBeUndefined();
    expect(migrateState({ ...clone(base), v: 1 }, 3)).toBeUndefined();
    fc.assert(
      fc.property(fc.anything(), fc.integer({ min: 0, max: 3 }), (x, v) => {
        expect(() => migrateState(x, v)).not.toThrow();
        expect(migrateState(x, v)).toBeUndefined();
      }),
      { numRuns: 200 }
    );
  });
});
