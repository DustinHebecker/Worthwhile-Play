import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  DIFFICULTIES,
  MAX_NOTES,
  SELF_CHECKS,
  assembledBriefing,
  cardDef,
  cardIdsFor,
  checkChoices,
  checkSort,
  chooseAction,
  chooseDecision,
  createInitialState,
  finish,
  isBriefingState,
  isFinished,
  modelBriefing,
  placeCard,
  scoreSort,
  setNotes,
  situationOf,
  summarize,
  toDifficulty,
  toggleCheck,
  unsortedCount,
  verdictFor,
  type BriefingState,
  type Difficulty
} from '../src/rules';
import { ACTIONS, DECISIONS, SECTIONS, SITUATIONS, SLOTS, situationById, type ActionId, type DecisionId, type Slot } from '../src/situations';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function seedFor(situation: string, difficulty: Difficulty = 'hard'): number {
  for (let seed = 1; seed < 5000; seed++) if (createInitialState(seed, difficulty).situation === situation) return seed;
  throw new Error(`no seed for ${situation}`);
}

/** Places every card according to `pick(cardId)`. */
function sortAll(state: BriefingState, pick: (cardId: string) => Slot): BriefingState {
  return state.cards.reduce((s, id) => placeCard(s, id, pick(id)), state);
}

const primaryOf = (state: BriefingState) => (id: string) => cardDef(situationOf(state), id)!.gold[0]!;

/** Plays a game through to the review step with the given slot picker and choices. */
function toReview(state: BriefingState, pick: (cardId: string) => Slot, decision: DecisionId = 'right', action: ActionId = 'concrete'): BriefingState {
  let s = checkSort(sortAll(state, pick));
  s = chooseDecision(s, decision);
  s = chooseAction(s, action);
  return checkChoices(s);
}

/**
 * Independent oracle: a hand-written gold table for one situation (supplierDelay), not derived from `situations.ts`.
 * Two-section cards are covered by the generic oracle below.
 */
const SUPPLIER_GOLD: Readonly<Record<string, Slot>> = {
  c1: 'context', c2: 'facts', c3: 'facts', c4: 'uncertainty', c5: 'uncertainty', c6: 'risks',
  c7: 'risks', c8: 'decision', c9: 'next', c10: 'leave', c11: 'leave', c12: 'leave'
};

/** Generic oracle: counts straight from the raw definition with plain loops. */
function oracle(state: BriefingState) {
  const def = SITUATIONS.find((d) => d.id === state.situation)!;
  let correct = 0;
  const wrongPairs = new Map<string, number>();
  for (let i = 0; i < state.cards.length; i++) {
    const card = def.cards.find((c) => c.id === state.cards[i])!;
    const placed = state.placement[i];
    let ok = false;
    for (const g of card.gold) if (g === placed) ok = true;
    if (ok) correct++;
    else wrongPairs.set(`${card.gold[0]}>${placed}`, (wrongPairs.get(`${card.gold[0]}>${placed}`) ?? 0) + 1);
  }
  return { correct, wrongPairs };
}

const arbSeed = fc.integer({ min: 0, max: 0xffffffff });
const arbDifficulty = fc.constantFrom(...DIFFICULTIES);
const arbSlot = fc.constantFrom<Slot>(...SLOTS);

describe('situation data', () => {
  it('has eight situations with unique ids and twelve unique cards each', () => {
    expect(SITUATIONS).toHaveLength(8);
    expect(new Set(SITUATIONS.map((s) => s.id)).size).toBe(8);
    for (const def of SITUATIONS) {
      expect(def.cards).toHaveLength(12);
      expect(new Set(def.cards.map((c) => c.id)).size).toBe(12);
      for (const card of def.cards) {
        expect(card.gold.length, `${def.id}/${card.id}`).toBeGreaterThan(0);
        expect(card.gold.length).toBeLessThanOrEqual(2);
        expect(new Set(card.gold).size).toBe(card.gold.length);
        for (const g of card.gold) expect(SLOTS).toContain(g);
      }
    }
  });

  it('gives every section at least one gold card on every difficulty, plus at least one card to leave out', () => {
    for (const def of SITUATIONS) {
      for (const d of DIFFICULTIES) {
        const shown = cardIdsFor(def, d).map((id) => cardDef(def, id)!);
        for (const slot of SLOTS) expect(shown.some((c) => c.gold[0] === slot), `${def.id}/${d}/${slot}`).toBe(true);
      }
    }
  });

  it('shows 7 cards on easy, 9 on medium and 12 on hard', () => {
    for (const def of SITUATIONS) {
      expect(cardIdsFor(def, 'easy')).toHaveLength(7);
      expect(cardIdsFor(def, 'medium')).toHaveLength(9);
      expect(cardIdsFor(def, 'hard')).toHaveLength(12);
      expect(cardIdsFor(def, 'easy').every((id) => cardIdsFor(def, 'medium').includes(id))).toBe(true);
    }
  });

  it('keeps hedged uncertainties, hidden risks and opinions for the hard level', () => {
    for (const def of SITUATIONS) {
      const subtle = def.cards.filter((c) => c.kind === 'hedged' || c.kind === 'hiddenRisk' || c.kind === 'opinion');
      expect(subtle.length).toBeGreaterThan(0);
      for (const c of subtle) expect(c.level, `${def.id}/${c.id}`).toBe(3);
    }
  });

  it('finds situations by id', () => {
    expect(situationById('basement')?.id).toBe('basement');
    expect(situationById('nope')).toBeUndefined();
  });
});

describe('createInitialState', () => {
  it('is deterministic per seed and difficulty', () => {
    fc.assert(
      fc.property(arbSeed, arbDifficulty, (seed, d) => {
        expect(createInitialState(seed, d)).toEqual(createInitialState(seed, d));
      }),
      { numRuns: 100 }
    );
  });

  it('builds a valid fresh game with nothing sorted or chosen', () => {
    fc.assert(
      fc.property(arbSeed, arbDifficulty, (seed, d) => {
        const s = createInitialState(seed, d);
        expect(isBriefingState(s)).toBe(true);
        expect(s.seed).toBe(seed);
        expect(s.difficulty).toBe(d);
        expect(s.step).toBe('sort');
        expect([...s.cards].sort()).toEqual(cardIdsFor(situationOf(s), d).sort());
        expect(s.placement).toEqual(s.cards.map(() => null));
        expect([...s.decisionOrder].sort()).toEqual([...DECISIONS].sort());
        expect([...s.actionOrder].sort()).toEqual([...ACTIONS].sort());
        expect(s).toMatchObject({ version: 1, decision: null, action: null, notes: '', checks: [false, false, false] });
      }),
      { numRuns: 100 }
    );
  });

  it('normalizes the seed to an unsigned 32-bit integer and defaults to easy', () => {
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(5).difficulty).toBe('easy');
    expect(createInitialState(5).cards).toHaveLength(7);
  });

  it('uses every situation and shuffles the cards for some seed', () => {
    const seen = new Set<string>();
    let shuffled = false;
    for (let seed = 0; seed < 300; seed++) {
      const s = createInitialState(seed, 'hard');
      seen.add(s.situation);
      if (s.cards.join() !== cardIdsFor(situationOf(s), 'hard').join()) shuffled = true;
    }
    expect(seen.size).toBe(SITUATIONS.length);
    expect(shuffled).toBe(true);
  });

  it('maps unknown difficulties to easy', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });
});

describe('sorting', () => {
  it('places, moves and unplaces cards and counts the open ones', () => {
    const s0 = createInitialState(seedFor('supplierDelay'), 'hard');
    expect(unsortedCount(s0)).toBe(12);
    const s1 = placeCard(s0, 'c1', 'context');
    expect(s1.placement[s1.cards.indexOf('c1')]).toBe('context');
    expect(unsortedCount(s1)).toBe(11);
    expect(s0.placement.every((p) => p === null)).toBe(true);
    const s2 = placeCard(s1, 'c1', 'facts');
    expect(s2.placement[s2.cards.indexOf('c1')]).toBe('facts');
    const s3 = placeCard(s2, 'c1', null);
    expect(unsortedCount(s3)).toBe(12);
  });

  it('returns the same state for no-ops, unknown cards and bad slots', () => {
    const s0 = createInitialState(seedFor('supplierDelay', 'easy'), 'easy');
    expect(placeCard(s0, 'c1', null)).toBe(s0);
    expect(placeCard(s0, 'c12', 'facts')).toBe(s0); // hard-only card
    expect(placeCard(s0, 'zz', 'facts')).toBe(s0);
    expect(placeCard(s0, 'c1', 'bogus' as Slot)).toBe(s0);
    const s1 = placeCard(s0, 'c1', 'risks');
    expect(placeCard(s1, 'c1', 'risks')).toBe(s1);
  });

  it('only checks a complete sorting and then locks it', () => {
    const s0 = createInitialState(seedFor('basement', 'medium'), 'medium');
    const partial = placeCard(s0, s0.cards[0]!, 'facts');
    expect(checkSort(partial)).toBe(partial);
    const full = sortAll(s0, () => 'leave');
    const checked = checkSort(full);
    expect(checked.step).toBe('decide');
    expect(placeCard(checked, checked.cards[0]!, 'facts')).toBe(checked);
    expect(checkSort(checked)).toBe(checked);
  });
});

describe('decision and next action', () => {
  const decideState = () => checkSort(sortAll(createInitialState(seedFor('release'), 'hard'), () => 'facts'));

  it('cannot be chosen before the sorting is checked', () => {
    const s = createInitialState(7, 'easy');
    expect(chooseDecision(s, 'right')).toBe(s);
    expect(chooseAction(s, 'concrete')).toBe(s);
    expect(checkChoices(s)).toBe(s);
  });

  it('needs both choices to be checked', () => {
    const s = decideState();
    const d = chooseDecision(s, 'premature');
    expect(d.decision).toBe('premature');
    expect(chooseDecision(d, 'premature')).toBe(d);
    expect(chooseDecision(d, 'bogus' as never)).toBe(d);
    expect(checkChoices(d)).toBe(d);
    const a = chooseAction(d, 'vague');
    expect(a.action).toBe('vague');
    expect(chooseAction(a, 'vague')).toBe(a);
    expect(chooseAction(a, 'bogus' as never)).toBe(a);
    const onlyAction = chooseAction(s, 'concrete');
    expect(checkChoices(onlyAction)).toBe(onlyAction);
    const r = checkChoices(a);
    expect(r.step).toBe('review');
    expect(chooseDecision(r, 'right')).toBe(r);
    expect(chooseAction(r, 'concrete')).toBe(r);
    expect(checkChoices(r)).toBe(r);
  });
});

describe('review and finish', () => {
  const review = () => toReview(createInitialState(seedFor('tournament'), 'hard'), () => 'leave');

  it('keeps notes (trimmed to the maximum) and toggles self-checks only during review', () => {
    const r = review();
    const n = setNotes(r, 'My wording');
    expect(n.notes).toBe('My wording');
    expect(setNotes(n, 'My wording')).toBe(n);
    expect(setNotes(r, 'x'.repeat(MAX_NOTES + 10)).notes).toHaveLength(MAX_NOTES);
    const c = toggleCheck(n, 1);
    expect(c.checks).toEqual([false, true, false]);
    expect(toggleCheck(c, 1).checks).toEqual([false, false, false]);
    expect(toggleCheck(c, SELF_CHECKS)).toBe(c);
    expect(toggleCheck(c, -1)).toBe(c);
    expect(toggleCheck(c, 0.5)).toBe(c);
    const sortState = createInitialState(1);
    expect(setNotes(sortState, 'x')).toBe(sortState);
    expect(toggleCheck(sortState, 0)).toBe(sortState);
  });

  it('finishes only from review, and a finished game ignores further input', () => {
    const s = createInitialState(3);
    expect(finish(s)).toBe(s);
    expect(isFinished(s)).toBe(false);
    const done = finish(review());
    expect(done.step).toBe('done');
    expect(isFinished(done)).toBe(true);
    expect(finish(done)).toBe(done);
    expect(setNotes(done, 'later')).toBe(done);
    expect(toggleCheck(done, 0)).toBe(done);
    expect(isBriefingState(done)).toBe(true);
  });
});

describe('scoring', () => {
  it('gives full marks for the model sorting on every situation and difficulty', () => {
    for (const def of SITUATIONS) {
      for (const d of DIFFICULTIES) {
        const s0 = createInitialState(seedFor(def.id, d), d);
        const score = scoreSort(sortAll(s0, primaryOf(s0)));
        expect(score.correct, `${def.id}/${d}`).toBe(score.total);
        expect(score.total).toBe(s0.cards.length);
        expect(score.confusions).toEqual([]);
      }
    }
  });

  it('matches the hand-written gold table for supplierDelay', () => {
    const s0 = createInitialState(seedFor('supplierDelay'), 'hard');
    for (const id of s0.cards) {
      for (const slot of SLOTS) {
        const v = verdictFor(situationOf(s0), id, slot);
        expect(v.correct, `${id}->${slot}`).toBe(SUPPLIER_GOLD[id] === slot);
        expect(v.primary).toBe(SUPPLIER_GOLD[id]);
        expect(v.placed).toBe(slot);
      }
      expect(verdictFor(situationOf(s0), id, null).correct).toBe(false);
    }
  });

  it('accepts both slots of a two-section card, with the first as primary', () => {
    const basement = situationById('basement')!;
    expect(verdictFor(basement, 'c6', 'risks').correct).toBe(true);
    expect(verdictFor(basement, 'c6', 'uncertainty').correct).toBe(true);
    expect(verdictFor(basement, 'c6', 'facts').correct).toBe(false);
    expect(verdictFor(basement, 'c6', 'facts').primary).toBe('risks');
    expect(verdictFor(basement, 'c6', 'facts').gold).toEqual(['risks', 'uncertainty']);
    const trip = situationById('schoolTrip')!;
    expect(verdictFor(trip, 'c3', 'facts').correct).toBe(true);
    expect(verdictFor(trip, 'c3', 'decision').primary).toBe('decision');
  });

  it('agrees with the independent oracle for random sortings', () => {
    fc.assert(
      fc.property(arbSeed, arbDifficulty, fc.array(arbSlot, { minLength: 12, maxLength: 12 }), (seed, d, slots) => {
        const s0 = createInitialState(seed, d);
        const s = s0.cards.reduce((acc, id, i) => placeCard(acc, id, slots[i]!), s0);
        const score = scoreSort(s);
        const expected = oracle(s);
        expect(score.correct).toBe(expected.correct);
        expect(score.total).toBe(s.cards.length);
        const got = new Map(score.confusions.map((c) => [`${c.from}>${c.to}`, c.count]));
        expect(got).toEqual(expected.wrongPairs);
        expect(score.confusions.reduce((n, c) => n + c.count, 0)).toBe(score.total - score.correct);
        const sumTotals = SLOTS.reduce((n, slot) => n + score.bySlot[slot].total, 0);
        const sumCorrect = SLOTS.reduce((n, slot) => n + score.bySlot[slot].correct, 0);
        expect(sumTotals).toBe(score.total);
        expect(sumCorrect).toBe(score.correct);
        for (let i = 1; i < score.confusions.length; i++) expect(score.confusions[i - 1]!.count).toBeGreaterThanOrEqual(score.confusions[i]!.count);
      }),
      { numRuns: 200 }
    );
  });

  it('counts per section and orders mis-sorting patterns by frequency, then slot order', () => {
    const s0 = createInitialState(seedFor('supplierDelay'), 'hard');
    // Uncertainties filed as facts (2), one risk as facts (1), the opinion as context (1); everything else right.
    const wrong: Record<string, Slot> = { c4: 'facts', c5: 'facts', c7: 'facts', c12: 'context' };
    const s = sortAll(s0, (id) => wrong[id] ?? SUPPLIER_GOLD[id]!);
    const score = scoreSort(s);
    expect(score.correct).toBe(8);
    expect(score.bySlot.uncertainty).toEqual({ total: 2, correct: 0 });
    expect(score.bySlot.risks).toEqual({ total: 2, correct: 1 });
    expect(score.bySlot.facts).toEqual({ total: 2, correct: 2 });
    expect(score.bySlot.leave).toEqual({ total: 3, correct: 2 });
    expect(score.bySlot.context).toEqual({ total: 1, correct: 1 });
    expect(score.confusions).toEqual([
      { from: 'uncertainty', to: 'facts', count: 2 },
      { from: 'risks', to: 'facts', count: 1 },
      { from: 'leave', to: 'context', count: 1 }
    ]);
  });

  it('orders equal-count patterns by target slot and lists unsorted cards last', () => {
    const s0 = createInitialState(seedFor('supplierDelay'), 'hard');
    let s = sortAll(s0, (id) => SUPPLIER_GOLD[id]!);
    s = placeCard(s, 'c2', 'risks');
    s = placeCard(s, 'c3', 'context');
    s = placeCard(s, 'c1', null);
    expect(scoreSort(s).confusions).toEqual([
      { from: 'context', to: null, count: 1 },
      { from: 'facts', to: 'context', count: 1 },
      { from: 'facts', to: 'risks', count: 1 }
    ]);
  });

  it('orders patterns with the same source by target slot, with unsorted last, whatever the card order', () => {
    const s0 = createInitialState(seedFor('supplierDelay'), 'hard');
    const wrong: Record<string, Slot | null> = { c10: null, c11: 'next', c12: 'context' };
    for (const order of [['c10', 'c11', 'c12'], ['c12', 'c11', 'c10'], ['c11', 'c10', 'c12']]) {
      const s: BriefingState = { ...s0, cards: [...order, ...s0.cards.filter((id) => !order.includes(id))] };
      const placed = s.cards.reduce<BriefingState>((acc, id) => placeCard(acc, id, id in wrong ? (wrong[id] ?? null) : SUPPLIER_GOLD[id]!), s);
      expect(scoreSort(placed).confusions, order.join()).toEqual([
        { from: 'leave', to: 'context', count: 1 },
        { from: 'leave', to: 'next', count: 1 },
        { from: 'leave', to: null, count: 1 }
      ]);
    }
  });

  it('summarizes choices and self-checks', () => {
    const s0 = createInitialState(seedFor('cafeFreezer'), 'medium');
    const good = toReview(s0, primaryOf(s0), 'right', 'concrete');
    expect(summarize(good)).toMatchObject({ correct: 9, total: 9, decisionCorrect: true, actionCorrect: true, checked: 0 });
    const bad = toggleCheck(toggleCheck(toReview(s0, () => 'leave', 'notTheirs', 'vague'), 0), 2);
    const sum = summarize(bad);
    expect(sum).toMatchObject({ decisionCorrect: false, actionCorrect: false, checked: 2 });
    expect(sum.correct).toBe(sum.bySlot.leave.total);
    expect(summarize(toReview(s0, () => 'leave', 'premature', 'outOfScope'))).toMatchObject({ decisionCorrect: false, actionCorrect: false });
  });
});

describe('briefings', () => {
  it('assembles the person’s briefing in display order and leaves out left-out cards', () => {
    const s0 = createInitialState(seedFor('volunteers'), 'hard');
    const s = sortAll(s0, (id) => (id === 'c1' || id === 'c2' ? 'facts' : id === 'c3' ? 'risks' : 'leave'));
    const b = assembledBriefing(s);
    expect(b.facts).toEqual(s.cards.filter((id) => id === 'c1' || id === 'c2'));
    expect(b.risks).toEqual(['c3']);
    expect(b.leave).toHaveLength(9);
    expect(b.context).toEqual([]);
    expect(assembledBriefing(s0).facts).toEqual([]);
  });

  it('builds the model briefing from primary gold slots in definition order, only for shown cards', () => {
    const easy = createInitialState(seedFor('schoolTrip', 'easy'), 'easy');
    const m = modelBriefing(easy);
    expect(m.context).toEqual(['c1']);
    expect(m.facts).toEqual(['c2']);
    expect(m.decision).toEqual(['c8']);
    expect(m.leave).toEqual(['c10']);
    const hard = modelBriefing(createInitialState(seedFor('schoolTrip'), 'hard'));
    expect(hard.decision).toEqual(['c3', 'c8']);
    expect(hard.uncertainty).toEqual(['c4', 'c5']);
    expect(hard.leave).toEqual(['c10', 'c11', 'c12']);
    for (const section of SECTIONS) expect(hard[section].length).toBeGreaterThan(0);
  });
});

describe('isBriefingState', () => {
  const states = () => {
    const s0 = createInitialState(seedFor('careAppointment', 'medium'), 'medium');
    const sorted = sortAll(s0, primaryOf(s0));
    const decide = chooseDecision(checkSort(sorted), 'right');
    const review = toggleCheck(setNotes(checkChoices(chooseAction(decide, 'vague')), 'notes'), 2);
    return { s0, sorted, decide, review, done: finish(review) };
  };

  it('accepts states reached by play and random walks', () => {
    for (const s of Object.values(states())) expect(isBriefingState(clone(s))).toBe(true);
    fc.assert(
      fc.property(arbSeed, arbDifficulty, fc.array(fc.tuple(fc.nat(20), arbSlot, fc.nat(6)), { maxLength: 40 }), (seed, d, moves) => {
        let s = createInitialState(seed, d);
        for (const [cardIndex, slot, op] of moves) {
          if (op === 0) s = checkSort(s);
          else if (op === 1) s = chooseDecision(s, DECISIONS[cardIndex % 3]!);
          else if (op === 2) s = chooseAction(s, ACTIONS[cardIndex % 3]!);
          else if (op === 3) s = checkChoices(s);
          else if (op === 4) s = toggleCheck(setNotes(s, `n${cardIndex}`), cardIndex % 3);
          else if (op === 5) s = finish(s);
          else s = placeCard(s, s.cards[cardIndex % s.cards.length]!, slot);
          expect(isBriefingState(clone(s))).toBe(true);
        }
      }),
      { numRuns: 150 }
    );
  });

  it('rejects malformed values without throwing', () => {
    const { s0, decide, review, done } = states();
    const bad: unknown[] = [
      null,
      undefined,
      42,
      'x',
      [],
      {},
      { ...s0, version: 2 },
      { ...s0, seed: -1 },
      { ...s0, seed: 1.5 },
      { ...s0, difficulty: 'extreme' },
      { ...s0, difficulty: 3 },
      { ...s0, situation: 'nope' },
      { ...s0, situation: 7 },
      { ...s0, step: 'later' },
      { ...s0, step: 1 },
      { ...s0, cards: s0.cards.slice(1) },
      { ...s0, cards: [...s0.cards.slice(1), s0.cards[1]] },
      { ...s0, cards: [...s0.cards.slice(1), 'c12'] },
      { ...s0, cards: 'c1' },
      { ...s0, cards: [...s0.cards.slice(1), 5] },
      { ...s0, placement: s0.placement.slice(1) },
      { ...s0, placement: 'x' },
      { ...s0, placement: [...s0.placement.slice(1), 'bogus'] },
      { ...s0, placement: [...s0.placement.slice(1), 3] },
      { ...s0, step: 'decide' },
      { ...s0, decisionOrder: ['right', 'right', 'premature'] },
      { ...s0, decisionOrder: ['right', 'notTheirs'] },
      { ...s0, decisionOrder: 'right' },
      { ...s0, actionOrder: ['concrete', 'vague', 'vague'] },
      { ...s0, actionOrder: null },
      { ...s0, decision: 'right' },
      { ...s0, action: 'concrete' },
      { ...decide, decision: 'bogus' },
      { ...decide, decision: 1 },
      { ...decide, action: 'bogus' },
      { ...decide, action: 1 },
      { ...decide, placement: [...decide.placement.slice(1), null] },
      { ...decide, notes: 'early' },
      { ...decide, checks: [true, false, false] },
      { ...review, decision: null },
      { ...review, action: null },
      { ...review, notes: 5 },
      { ...review, notes: 'x'.repeat(MAX_NOTES + 1) },
      { ...review, checks: [true, false] },
      { ...review, checks: [true, false, 'no'] },
      { ...review, checks: 'no' },
      { ...done, action: null }
    ];
    for (const value of bad) expect(isBriefingState(value), JSON.stringify(value)?.slice(0, 120)).toBe(false);
    const throwing = new Proxy({}, { get: () => { throw new Error('boom'); }, ownKeys: () => { throw new Error('boom'); } });
    expect(isBriefingState(throwing)).toBe(false);
  });

  it('accepts the exact edge values', () => {
    const { s0, review } = states();
    expect(isBriefingState({ ...s0, seed: 0 })).toBe(true);
    expect(isBriefingState({ ...s0, seed: 0xffffffff })).toBe(true);
    expect(isBriefingState({ ...review, notes: 'x'.repeat(MAX_NOTES) })).toBe(true);
    expect(isBriefingState({ ...s0, placement: [...s0.placement.slice(1), 'leave'] })).toBe(true);
  });
});
