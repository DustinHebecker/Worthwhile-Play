import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { metadata } from '../src/metadata';
import {
  answer,
  CHOICES,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DISTRACTOR_COUNTS,
  DISTRACTOR_KINDS,
  generateSequence,
  isCaptured,
  isValidDistractorState,
  ITEM_COUNT,
  LEAD_IN,
  MAX_VALUE,
  MIN_VALUE,
  newSession,
  parity,
  score,
  SLOTS,
  startSession,
  tapDistractor,
  toDifficulty,
  visibleDistractor,
  type Choice,
  type DistractorState,
  type Item
} from '../src/rules';

const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);

const firstDistractorIndex = (sequence: readonly Item[]) => sequence.findIndex((item) => item.distractor !== null);
const firstPlainIndex = (sequence: readonly Item[], from = 0) => sequence.findIndex((item, i) => i >= from && item.distractor === null);

/** Plays `n` items, answering correctly. */
const playCorrect = (state: DistractorState, sequence: readonly Item[], n: number): DistractorState => {
  let s = state;
  for (let i = 0; i < n; i++) s = answer(s, sequence[s.index]?.correct as Choice);
  return s;
};

describe('metadata', () => {
  it('lists the difficulties in rules order, calm first', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DEFAULT_DIFFICULTY).toBe('calm');
    expect(metadata.id).toBe('distractor-control');
    expect(metadata.skills).toEqual(['attention']);
    expect(metadata.typicalMinutes).toEqual([2, 6]);
  });

  it('has the agreed titles', () => {
    expect(metadata.messages.en?.title).toBe('Stay on Task');
    expect(metadata.messages.de?.title).toBe('Bei der Sache bleiben');
  });
});

describe('basics', () => {
  it('parity', () => {
    expect(parity(10)).toBe('even');
    expect(parity(11)).toBe('odd');
    expect(parity(98)).toBe('even');
    expect(parity(99)).toBe('odd');
  });

  it('toDifficulty falls back to the default for unknown values', () => {
    expect(toDifficulty('busy')).toBe('busy');
    expect(toDifficulty('calm')).toBe('calm');
    expect(toDifficulty('hard')).toBe('calm');
    expect(toDifficulty(undefined)).toBe('calm');
  });

  it('distractor counts: calm a quarter, busy half of the items', () => {
    expect(DISTRACTOR_COUNTS).toEqual({ calm: 10, busy: 20 });
    expect(ITEM_COUNT).toBe(40);
  });
});

describe('generateSequence', () => {
  it('is deterministic for a seed and differs between seeds', () => {
    expect(generateSequence(5, 'calm')).toEqual(generateSequence(5, 'calm'));
    expect(generateSequence(5, 'busy')).toEqual(generateSequence(5, 'busy'));
    expect(generateSequence(5, 'calm').map((i) => i.value)).not.toEqual(generateSequence(6, 'calm').map((i) => i.value));
  });

  it('has fixed length, valid values, correct parity and exact distractor rates', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const sequence = generateSequence(seed, difficulty);
        expect(sequence).toHaveLength(ITEM_COUNT);
        let distractors = 0;
        sequence.forEach((item, i) => {
          expect(Number.isInteger(item.value)).toBe(true);
          expect(item.value).toBeGreaterThanOrEqual(MIN_VALUE);
          expect(item.value).toBeLessThanOrEqual(MAX_VALUE);
          expect(item.correct).toBe(item.value % 2 === 0 ? 'even' : 'odd');
          if (i > 0) expect(item.value).not.toBe(sequence[i - 1]?.value);
          if (item.distractor) {
            distractors++;
            expect(i).toBeGreaterThanOrEqual(LEAD_IN);
            expect(DISTRACTOR_KINDS).toContain(item.distractor.kind);
            expect(SLOTS).toContain(item.distractor.slot);
          }
        });
        expect(distractors).toBe(DISTRACTOR_COUNTS[difficulty]);
        // Consecutive extras never repeat the same kind.
        const kinds = sequence.flatMap((item) => (item.distractor ? [item.distractor.kind] : []));
        for (let k = 1; k < kinds.length; k++) expect(kinds[k]).not.toBe(kinds[k - 1]);
      }),
      { numRuns: 200 }
    );
  });

  it('the lead-in items never carry an extra', () => {
    for (let seed = 0; seed < 50; seed++) {
      const sequence = generateSequence(seed, 'busy');
      for (let i = 0; i < LEAD_IN; i++) expect(sequence[i]?.distractor).toBeNull();
    }
  });

  it('uses the whole value range and every kind and slot over many seeds', () => {
    const values = new Set<number>();
    const kinds = new Set<string>();
    const slots = new Set<string>();
    const evens: number[] = [];
    for (let seed = 0; seed < 200; seed++) {
      for (const item of generateSequence(seed, 'busy')) {
        values.add(item.value);
        evens.push(item.correct === 'even' ? 1 : 0);
        if (item.distractor) {
          kinds.add(item.distractor.kind);
          slots.add(item.distractor.slot);
        }
      }
    }
    expect(values.has(MIN_VALUE)).toBe(true);
    expect(values.has(MAX_VALUE)).toBe(true);
    expect(values.size).toBe(MAX_VALUE - MIN_VALUE + 1);
    expect(kinds.size).toBe(DISTRACTOR_KINDS.length);
    expect(slots.size).toBe(SLOTS.length);
    const evenShare = evens.reduce((a, b) => a + b, 0) / evens.length;
    expect(evenShare).toBeGreaterThan(0.45);
    expect(evenShare).toBeLessThan(0.55);
  });
});

describe('session flow', () => {
  it('starts ready and only answers while running', () => {
    const s0 = newSession(-1, 'busy');
    expect(s0).toEqual({ seed: 0xffff_ffff, difficulty: 'busy', phase: 'ready', index: 0, answers: [], captured: [] });
    expect(answer(s0, 'even')).toBe(s0);
    const s1 = startSession(s0);
    expect(s1).toMatchObject({ phase: 'running', index: 0 });
    expect(startSession(s1)).toBe(s1);
    const s2 = answer(s1, 'odd');
    expect(s2).toMatchObject({ phase: 'running', index: 1, answers: ['odd'] });
    expect(answer(s2, 'maybe' as Choice)).toBe(s2);
  });

  it('finishes after exactly ITEM_COUNT answers and ignores further input', () => {
    const sequence = generateSequence(3, 'calm');
    let s = startSession(newSession(3, 'calm'));
    s = playCorrect(s, sequence, ITEM_COUNT - 1);
    expect(s.phase).toBe('running');
    s = answer(s, 'even');
    expect(s).toMatchObject({ phase: 'finished', index: ITEM_COUNT });
    expect(answer(s, 'even')).toBe(s);
    expect(tapDistractor(s, sequence)).toBe(s);
    expect(visibleDistractor(s, sequence)).toBeNull();
    expect(isValidDistractorState(s)).toBe(true);
  });

  it('taps on an extra are counted once per item and hide it', () => {
    const sequence = generateSequence(9, 'busy');
    const at = firstDistractorIndex(sequence);
    let s = playCorrect(startSession(newSession(9, 'busy')), sequence, at);
    expect(visibleDistractor(s, sequence)).toEqual(sequence[at]?.distractor);
    s = tapDistractor(s, sequence);
    expect(s.captured).toEqual([at]);
    expect(isCaptured(s, at)).toBe(true);
    expect(isCaptured(s, at + 1)).toBe(false);
    expect(visibleDistractor(s, sequence)).toBeNull();
    expect(tapDistractor(s, sequence)).toBe(s);
    expect(isValidDistractorState(s)).toBe(true);
  });

  it('a tap without an extra on screen changes nothing', () => {
    const sequence = generateSequence(9, 'calm');
    const s = startSession(newSession(9, 'calm'));
    expect(sequence[0]?.distractor).toBeNull();
    expect(visibleDistractor(s, sequence)).toBeNull();
    expect(tapDistractor(s, sequence)).toBe(s);
    expect(tapDistractor(newSession(9, 'calm'), sequence)).toEqual(newSession(9, 'calm'));
  });
});

describe('score', () => {
  it('counts correct answers, shown and captured extras', () => {
    const sequence = generateSequence(21, 'busy');
    let s = startSession(newSession(21, 'busy'));
    expect(score(newSession(21, 'busy'), sequence)).toEqual({ answered: 0, correct: 0, shown: 0, captured: 0 });
    expect(score(s, sequence)).toEqual({ answered: 0, correct: 0, shown: 0, captured: 0 });
    // Answer the first item wrongly, the second correctly.
    s = answer(s, sequence[0]?.correct === 'even' ? 'odd' : 'even');
    s = answer(s, sequence[1]?.correct as Choice);
    expect(score(s, sequence)).toMatchObject({ answered: 2, correct: 1 });
    const at = firstDistractorIndex(sequence);
    s = playCorrect(s, sequence, at - s.index);
    // The current item's extra counts as shown while it is on screen.
    expect(score(s, sequence).shown).toBe(1);
    s = tapDistractor(s, sequence);
    expect(score(s, sequence)).toEqual({ answered: at, correct: at - 1, shown: 1, captured: 1 });
    s = playCorrect(s, sequence, ITEM_COUNT - s.index);
    expect(score(s, sequence)).toEqual({ answered: ITEM_COUNT, correct: ITEM_COUNT - 1, shown: DISTRACTOR_COUNTS.busy, captured: 1 });
  });

  it('shown counts only extras up to the current item', () => {
    const sequence = generateSequence(4, 'calm');
    const plain = firstPlainIndex(sequence, firstDistractorIndex(sequence) + 1);
    const s = playCorrect(startSession(newSession(4, 'calm')), sequence, plain);
    const expected = sequence.slice(0, plain + 1).filter((item) => item.distractor).length;
    expect(score(s, sequence).shown).toBe(expected);
  });

  it('property: correct + wrong = answered, captured <= shown', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(fc.record({ choice: fc.constantFrom(...CHOICES), tap: fc.boolean() }), { maxLength: ITEM_COUNT + 5 }), (seed, difficulty, moves) => {
        const sequence = generateSequence(seed, difficulty);
        let s = startSession(newSession(seed, difficulty));
        let expectedCorrect = 0;
        for (const move of moves) {
          if (move.tap) s = tapDistractor(s, sequence);
          if (s.phase === 'running' && sequence[s.index]?.correct === move.choice) expectedCorrect++;
          s = answer(s, move.choice);
          expect(isValidDistractorState(s)).toBe(true);
        }
        const result = score(s, sequence);
        expect(result.answered).toBe(Math.min(moves.length, ITEM_COUNT));
        expect(result.correct).toBe(expectedCorrect);
        expect(result.captured).toBeLessThanOrEqual(result.shown);
      }),
      { numRuns: 150 }
    );
  });
});

describe('isValidDistractorState', () => {
  const base = (): DistractorState => startSession(newSession(9, 'busy'));

  it('accepts reachable states and rejects junk', () => {
    expect(isValidDistractorState(newSession(1, 'calm'))).toBe(true);
    expect(isValidDistractorState(base())).toBe(true);
    for (const junk of [null, 1, 'x', [], {}, { ...base(), seed: -1 }, { ...base(), seed: 1.5 }, { ...base(), difficulty: 'hard' }, { ...base(), phase: 'done' }]) {
      expect(isValidDistractorState(junk)).toBe(false);
    }
  });

  it('checks answers against the index and phase', () => {
    const s = answer(base(), 'even');
    expect(isValidDistractorState(s)).toBe(true);
    expect(isValidDistractorState({ ...s, answers: [] })).toBe(false);
    expect(isValidDistractorState({ ...s, answers: ['even', 'odd'] })).toBe(false);
    expect(isValidDistractorState({ ...s, answers: ['three'] })).toBe(false);
    expect(isValidDistractorState({ ...s, index: -1 })).toBe(false);
    expect(isValidDistractorState({ ...s, phase: 'ready' })).toBe(false);
    expect(isValidDistractorState({ ...s, phase: 'finished' })).toBe(false);
    const full = Array.from({ length: ITEM_COUNT }, () => 'even' as Choice);
    expect(isValidDistractorState({ ...s, index: ITEM_COUNT, answers: full, phase: 'finished' })).toBe(true);
    expect(isValidDistractorState({ ...s, index: ITEM_COUNT, answers: full, phase: 'running' })).toBe(false);
    expect(isValidDistractorState({ ...s, index: ITEM_COUNT + 1, answers: [...full, 'odd'], phase: 'finished' })).toBe(false);
  });

  it('checks captured indices: sorted, not ahead of the index, only items with an extra', () => {
    const sequence = generateSequence(9, 'busy');
    const at = firstDistractorIndex(sequence);
    const s = tapDistractor(playCorrect(base(), sequence, at), sequence);
    expect(isValidDistractorState(s)).toBe(true);
    expect(isValidDistractorState({ ...s, captured: [at, at] })).toBe(false);
    expect(isValidDistractorState({ ...s, captured: [0] })).toBe(false);
    expect(isValidDistractorState({ ...s, captured: [at + 1] })).toBe(false);
    expect(isValidDistractorState({ ...s, captured: [-1] })).toBe(false);
    expect(isValidDistractorState({ ...s, captured: ['x'] })).toBe(false);
    expect(isValidDistractorState({ ...newSession(9, 'busy'), captured: [at] })).toBe(false);
    const later = sequence.findIndex((item, i) => i > at && item.distractor);
    const s2 = tapDistractor(playCorrect(s, sequence, later - at), sequence);
    expect(s2.captured).toEqual([at, later]);
    expect(isValidDistractorState(s2)).toBe(true);
    expect(isValidDistractorState({ ...s2, captured: [later, at] })).toBe(false);
  });

  it('never throws on arbitrary data', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidDistractorState(value)).not.toThrow();
      })
    );
    fc.assert(
      fc.property(fc.record({ seed: seedArb, difficulty: difficultyArb, phase: fc.constantFrom('ready', 'running', 'finished'), index: fc.integer({ min: -2, max: 45 }), answers: fc.array(fc.constantFrom('even', 'odd'), { maxLength: 42 }), captured: fc.array(fc.integer({ min: -1, max: 41 }), { maxLength: 5 }) }), (value) => {
        expect(() => isValidDistractorState(value)).not.toThrow();
      })
    );
  });
});
