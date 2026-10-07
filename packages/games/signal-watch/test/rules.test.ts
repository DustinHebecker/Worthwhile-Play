import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { metadata } from '../src/metadata';
import {
  advance,
  closedCount,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  generateSequence,
  GLYPHS,
  INTERVAL_STEP_MS,
  isValidSignalState,
  LEAD_IN,
  LOOKALIKE_RATE,
  LOOKALIKES,
  MAX_INTERVAL_MS,
  MIN_INTERVAL_MS,
  MIN_TARGET_GAP,
  NEUTRAL,
  newSession,
  PHASES,
  respond,
  responseFor,
  score,
  SESSIONS,
  startSession,
  stimulusCount,
  SYMBOLS,
  TARGET,
  TARGET_RATE,
  targetCount,
  toDifficulty,
  type Difficulty,
  type SignalState,
  type Stimulus
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);

/** Plays a whole session; `rts[i]` is the reaction time for stimulus i or undefined for no response. */
function play(seed: number, difficulty: Difficulty, rts: (sequence: Stimulus[], i: number) => number | undefined) {
  const sequence = generateSequence(seed, difficulty);
  let state = startSession(newSession(seed, difficulty));
  const states: SignalState[] = [state];
  while (state.phase === 'running') {
    const rt = rts(sequence, state.index);
    if (rt !== undefined) state = respond(state, sequence, rt);
    state = advance(state, sequence);
    states.push(state);
  }
  return { sequence, state, states };
}

/** Independent oracle for the scoring. */
function oracle(sequence: readonly Stimulus[], responses: ReadonlyMap<number, number>, closed: number) {
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let targets = 0;
  const hitRts: number[] = [];
  for (let i = 0; i < sequence.length; i++) {
    const target = sequence[i]?.symbol === 'up';
    const responded = responses.has(i);
    if (target && i < closed) targets += 1;
    if (target && responded) {
      hits += 1;
      hitRts.push(responses.get(i) as number);
    }
    if (target && !responded && i < closed) misses += 1;
    if (!target && responded) falseAlarms += 1;
  }
  const meanRtMs = hitRts.length ? Math.round(hitRts.reduce((a, b) => a + b, 0) / hitRts.length) : null;
  return { targets, hits, misses, falseAlarms, meanRtMs };
}

describe('constants and metadata', () => {
  it('declares three explicit session lengths, shortest first, matching the metadata', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DIFFICULTIES).toEqual(['short', 'medium', 'long']);
    expect(DEFAULT_DIFFICULTY).toBe('short');
    expect(SESSIONS).toEqual({ short: { minutes: 2, count: 80 }, medium: { minutes: 4, count: 160 }, long: { minutes: 6, count: 240 } });
    expect(metadata.skills).toEqual(['attention']);
    expect(metadata.typicalMinutes).toEqual([2, 8]);
  });

  it('session length in minutes matches the mean interval times the stimulus count', () => {
    const mean = (MIN_INTERVAL_MS + MAX_INTERVAL_MS) / 2;
    for (const d of DIFFICULTIES) expect((SESSIONS[d].count * mean) / 60_000).toBe(SESSIONS[d].minutes);
    expect(stimulusCount('short')).toBe(80);
    expect(stimulusCount('medium')).toBe(160);
    expect(stimulusCount('long')).toBe(240);
  });

  it('uses distinct shapes; lookalikes only from medium on', () => {
    expect(new Set(Object.values(GLYPHS)).size).toBe(SYMBOLS.length);
    expect(GLYPHS[TARGET]).toBe('▲');
    expect(LOOKALIKES.short).toEqual([]);
    expect(LOOKALIKES.medium).toEqual(['down']);
    expect(LOOKALIKES.long).toEqual(['down', 'hollowUp']);
    expect(NEUTRAL).not.toContain(TARGET);
    expect(PHASES).toEqual(['ready', 'running', 'finished']);
  });

  it('target count is 12.5 % of the stimuli, rounded', () => {
    expect(TARGET_RATE).toBe(0.125);
    expect(targetCount(80)).toBe(10);
    expect(targetCount(160)).toBe(20);
    expect(targetCount(240)).toBe(30);
    expect(targetCount(84)).toBe(11);
    expect(targetCount(83)).toBe(10);
  });

  it('toDifficulty falls back to the default for unknown values', () => {
    expect(toDifficulty('long')).toBe('long');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('hard')).toBe('short');
    expect(toDifficulty(undefined)).toBe('short');
  });
});

describe('generateSequence', () => {
  it('is deterministic for a seed and differs between seeds', () => {
    expect(generateSequence(42, 'medium')).toEqual(generateSequence(42, 'medium'));
    expect(generateSequence(42, 'short')).not.toEqual(generateSequence(43, 'short'));
  });

  it('has the right length, target rate, lead-in and gaps for any seed', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const sequence = generateSequence(seed, difficulty);
        const count = SESSIONS[difficulty].count;
        expect(sequence).toHaveLength(count);
        const targets = sequence.flatMap((s, i) => (s.target ? [i] : []));
        expect(targets).toHaveLength(targetCount(count));
        const rate = targets.length / count;
        expect(rate).toBeGreaterThanOrEqual(0.1);
        expect(rate).toBeLessThanOrEqual(0.15);
        expect(targets[0]).toBeGreaterThanOrEqual(LEAD_IN);
        for (let k = 1; k < targets.length; k++) expect((targets[k] as number) - (targets[k - 1] as number)).toBeGreaterThanOrEqual(MIN_TARGET_GAP);
      }),
      { numRuns: 120 }
    );
  });

  it('never shows a target in the first two stimuli', () => {
    for (let seed = 0; seed < 200; seed++) {
      const [a, b] = generateSequence(seed, 'short');
      expect(a?.target).toBe(false);
      expect(b?.target).toBe(false);
    }
  });

  it('marks exactly the target symbol as target and never repeats a symbol back to back', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const sequence = generateSequence(seed, difficulty);
        const allowed = new Set([TARGET, ...NEUTRAL, ...LOOKALIKES[difficulty]]);
        sequence.forEach((s, i) => {
          expect(s.target).toBe(s.symbol === TARGET);
          expect(allowed.has(s.symbol)).toBe(true);
          if (i > 0) expect(s.symbol).not.toBe(sequence[i - 1]?.symbol);
        });
      }),
      { numRuns: 120 }
    );
  });

  it('draws jittered intervals within 1.2–1.8 s in 50 ms steps, covering both ends', () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 20; seed++) {
      for (const s of generateSequence(seed, 'long')) {
        expect(s.intervalMs).toBeGreaterThanOrEqual(MIN_INTERVAL_MS);
        expect(s.intervalMs).toBeLessThanOrEqual(MAX_INTERVAL_MS);
        expect((s.intervalMs - MIN_INTERVAL_MS) % INTERVAL_STEP_MS).toBe(0);
        seen.add(s.intervalMs);
      }
    }
    expect(seen.has(MIN_INTERVAL_MS)).toBe(true);
    expect(seen.has(MAX_INTERVAL_MS)).toBe(true);
    expect(seen.size).toBe((MAX_INTERVAL_MS - MIN_INTERVAL_MS) / INTERVAL_STEP_MS + 1);
  });

  it('total duration is close to the announced session length', () => {
    for (const d of DIFFICULTIES) {
      for (let seed = 1; seed <= 5; seed++) {
        const total = generateSequence(seed, d).reduce((sum, s) => sum + s.intervalMs, 0);
        expect(Math.abs(total - SESSIONS[d].minutes * 60_000)).toBeLessThan(SESSIONS[d].minutes * 6_000);
      }
    }
  });

  it('short sessions use only neutral distractors; medium and long mix in lookalikes at roughly the configured share', () => {
    const short = generateSequence(9, 'short');
    expect(short.filter((s) => !s.target).every((s) => NEUTRAL.includes(s.symbol))).toBe(true);
    for (const d of ['medium', 'long'] as const) {
      let lookalike = 0;
      let nonTargets = 0;
      for (let seed = 0; seed < 30; seed++) {
        for (const s of generateSequence(seed, d)) {
          if (s.target) continue;
          nonTargets += 1;
          if (LOOKALIKES[d].includes(s.symbol)) lookalike += 1;
        }
      }
      const share = lookalike / nonTargets;
      expect(share).toBeGreaterThan(LOOKALIKE_RATE * 0.6);
      expect(share).toBeLessThan(LOOKALIKE_RATE * 1.2);
    }
    const long = new Set(generateSequence(3, 'long').map((s) => s.symbol));
    expect(long.has('down')).toBe(true);
    expect(long.has('hollowUp')).toBe(true);
    for (const n of NEUTRAL) expect(long.has(n)).toBe(true);
  });
});

describe('session flow', () => {
  it('starts in "ready" at index 0 with no responses', () => {
    expect(newSession(7, 'medium')).toEqual({ seed: 7, difficulty: 'medium', phase: 'ready', index: 0, responses: [] });
    expect(newSession(-1, 'short').seed).toBe(0xffff_ffff);
  });

  it('startSession only starts a ready session', () => {
    const ready = newSession(1, 'short');
    const running = startSession(ready);
    expect(running).toEqual({ ...ready, phase: 'running' });
    expect(startSession(running)).toBe(running);
    const finished: SignalState = { ...ready, phase: 'finished', index: 80 };
    expect(startSession(finished)).toBe(finished);
  });

  it('advance moves to the next stimulus and finishes after the last one', () => {
    const sequence = generateSequence(1, 'short');
    let state = startSession(newSession(1, 'short'));
    state = advance(state, sequence);
    expect(state).toMatchObject({ phase: 'running', index: 1 });
    state = { ...state, index: 78 };
    state = advance(state, sequence);
    expect(state).toMatchObject({ phase: 'running', index: 79 });
    state = advance(state, sequence);
    expect(state).toMatchObject({ phase: 'finished', index: 80 });
    expect(advance(state, sequence)).toBe(state);
    const ready = newSession(1, 'short');
    expect(advance(ready, sequence)).toBe(ready);
  });

  it('respond records one response per stimulus, rounded and clamped to the window', () => {
    const sequence = generateSequence(5, 'short');
    const window = sequence[0]?.intervalMs as number;
    const running = startSession(newSession(5, 'short'));
    const answered = respond(running, sequence, 412.6);
    expect(answered.responses).toEqual([{ index: 0, rtMs: 413 }]);
    expect(responseFor(answered, 0)).toEqual({ index: 0, rtMs: 413 });
    expect(responseFor(answered, 1)).toBeUndefined();
    expect(respond(answered, sequence, 100)).toBe(answered);
    expect(respond(running, sequence, -50).responses).toEqual([{ index: 0, rtMs: 0 }]);
    expect(respond(running, sequence, window + 999).responses).toEqual([{ index: 0, rtMs: window }]);
    expect(respond(running, sequence, window).responses).toEqual([{ index: 0, rtMs: window }]);
    expect(respond(running, sequence, Number.NaN).responses).toEqual([{ index: 0, rtMs: 0 }]);
    const next = respond(advance(answered, sequence), sequence, 300);
    expect(next.responses).toEqual([
      { index: 0, rtMs: 413 },
      { index: 1, rtMs: 300 }
    ]);
    expect(running.responses).toEqual([]);
  });

  it('respond is ignored unless the session is running', () => {
    const sequence = generateSequence(5, 'short');
    const ready = newSession(5, 'short');
    expect(respond(ready, sequence, 300)).toBe(ready);
    const finished: SignalState = { ...ready, phase: 'finished', index: 80 };
    expect(respond(finished, sequence, 300)).toBe(finished);
  });

  it('every intermediate state of a played session is valid', () => {
    fc.assert(
      fc.property(seedArb, fc.array(fc.option(fc.integer({ min: 0, max: 3000 }), { nil: undefined }), { minLength: 80, maxLength: 80 }), (seed, rts) => {
        const { states, state } = play(seed, 'short', (_, i) => rts[i]);
        for (const s of states) expect(isValidSignalState(clone(s))).toBe(true);
        expect(state.phase).toBe('finished');
        expect(closedCount(state)).toBe(80);
      }),
      { numRuns: 60 }
    );
  });
});

describe('score', () => {
  it('counts hits, misses, false alarms and the mean RT for a perfect run', () => {
    const { sequence, state } = play(11, 'short', (seq, i) => (seq[i]?.target ? 400 + i : undefined));
    const targets = sequence.flatMap((s, i) => (s.target ? [i] : []));
    const mean = Math.round(targets.reduce((sum, i) => sum + 400 + i, 0) / targets.length);
    expect(score(state, sequence)).toEqual({ targets: 10, hits: 10, misses: 0, falseAlarms: 0, meanRtMs: mean });
  });

  it('counts every unanswered target as a miss and every non-target response as a false alarm', () => {
    const silent = play(11, 'short', () => undefined);
    expect(score(silent.state, silent.sequence)).toEqual({ targets: 10, hits: 0, misses: 10, falseAlarms: 0, meanRtMs: null });
    const always = play(11, 'short', () => 500);
    expect(score(always.state, always.sequence)).toEqual({ targets: 10, hits: 10, misses: 0, falseAlarms: 70, meanRtMs: 500 });
  });

  it('only counts misses for stimuli whose window has closed', () => {
    const sequence = generateSequence(4, 'short');
    const first = sequence.findIndex((s) => s.target);
    let state = startSession(newSession(4, 'short'));
    while (state.index < first) state = advance(state, sequence);
    expect(score(state, sequence)).toMatchObject({ targets: 0, misses: 0, hits: 0 });
    const answered = respond(state, sequence, 350);
    expect(score(answered, sequence)).toEqual({ targets: 0, hits: 1, misses: 0, falseAlarms: 0, meanRtMs: 350 });
    expect(score(advance(state, sequence), sequence)).toMatchObject({ targets: 1, misses: 1, hits: 0 });
    expect(score(advance(answered, sequence), sequence)).toMatchObject({ targets: 1, misses: 0, hits: 1 });
  });

  it('rounds the mean reaction time', () => {
    const sequence = generateSequence(4, 'short');
    const [a, b] = sequence.flatMap((s, i) => (s.target ? [i] : []));
    const state: SignalState = {
      seed: 4,
      difficulty: 'short',
      phase: 'finished',
      index: 80,
      responses: [
        { index: a as number, rtMs: 300 },
        { index: b as number, rtMs: 301 }
      ]
    };
    expect(score(state, sequence).meanRtMs).toBe(301);
    expect(score({ ...state, responses: [{ index: a as number, rtMs: 300 }, { index: b as number, rtMs: 302 }] }, sequence).meanRtMs).toBe(301);
  });

  it('agrees with an independent oracle for random response patterns', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), (seed, difficulty, pTarget, pOther) => {
        const sequence = generateSequence(seed, difficulty);
        let k = 0;
        const { state } = play(seed, difficulty, (seq, i) => {
          k = (k * 1103515245 + 12345 + i) % 1000;
          const p = seq[i]?.target ? pTarget : pOther;
          return k / 1000 < p ? 150 + k : undefined;
        });
        const responses = new Map(state.responses.map((r) => [r.index, r.rtMs]));
        expect(score(state, sequence)).toEqual(oracle(sequence, responses, state.index));
      }),
      { numRuns: 60 }
    );
  });
});

describe('isValidSignalState', () => {
  const valid = (): SignalState => ({ seed: 3, difficulty: 'short', phase: 'running', index: 5, responses: [{ index: 1, rtMs: 300 }, { index: 5, rtMs: 0 }] });

  it('accepts well-formed states in every phase', () => {
    expect(isValidSignalState(valid())).toBe(true);
    expect(isValidSignalState(newSession(1, 'long'))).toBe(true);
    expect(isValidSignalState({ ...valid(), phase: 'finished', index: 80 })).toBe(true);
    expect(isValidSignalState({ ...valid(), index: 79 })).toBe(true);
    expect(isValidSignalState({ ...valid(), responses: [{ index: 1, rtMs: MAX_INTERVAL_MS }] })).toBe(true);
    expect(isValidSignalState({ ...valid(), seed: 0xffff_ffff })).toBe(true);
    expect(isValidSignalState({ ...valid(), difficulty: 'long', index: 239 })).toBe(true);
  });

  it('rejects malformed fields', () => {
    const bad: unknown[] = [
      null,
      [],
      { ...valid(), seed: -1 },
      { ...valid(), seed: 1.5 },
      { ...valid(), seed: 2 ** 32 },
      { ...valid(), difficulty: 'hard' },
      { ...valid(), phase: 'paused' },
      { ...valid(), index: -1 },
      { ...valid(), index: 1.5 },
      { ...valid(), index: 81 },
      { ...valid(), index: 80 },
      { ...valid(), phase: 'finished', index: 79 },
      { ...valid(), phase: 'ready' },
      { ...valid(), phase: 'ready', index: 0 },
      { ...valid(), responses: 'x' },
      { ...valid(), responses: [{ index: 1 }] },
      { ...valid(), responses: [{ index: 1, rtMs: -1 }] },
      { ...valid(), responses: [{ index: 1, rtMs: MAX_INTERVAL_MS + 1 }] },
      { ...valid(), responses: [{ index: -1, rtMs: 10 }] },
      { ...valid(), responses: [{ index: 6, rtMs: 10 }] },
      { ...valid(), responses: [{ index: 2, rtMs: 10 }, { index: 1, rtMs: 10 }] },
      { ...valid(), responses: [{ index: 2, rtMs: 10 }, { index: 2, rtMs: 10 }] },
      { ...valid(), phase: 'finished', index: 80, responses: [{ index: 80, rtMs: 10 }] },
      { ...valid(), responses: [null] }
    ];
    for (const value of bad) expect(isValidSignalState(value), JSON.stringify(value)).toBe(false);
    const { seed: _seed, ...noSeed } = valid();
    expect(isValidSignalState(noSeed)).toBe(false);
    const { responses: _r, ...noResponses } = valid();
    expect(isValidSignalState(noResponses)).toBe(false);
  });

  it('accepts a response on the last stimulus of a finished session', () => {
    expect(isValidSignalState({ ...valid(), phase: 'finished', index: 80, responses: [{ index: 79, rtMs: 10 }] })).toBe(true);
    expect(isValidSignalState({ ...valid(), phase: 'running', index: 0, responses: [{ index: 0, rtMs: 10 }] })).toBe(true);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(fc.property(fc.anything(), (value) => void isValidSignalState(value)), { numRuns: 300 });
  });
});
