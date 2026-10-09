import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  DIFFICULTIES,
  MAX_DRAFT,
  SELF_CHECKS,
  audiencesFor,
  backToSelect,
  checkMessage,
  checkSelection,
  chooseLead,
  chooseMessage,
  createInitialState,
  currentRound,
  factIdsFor,
  goToLead,
  isAudienceSwitchState,
  isFinished,
  messageIdsFor,
  nextRound,
  scenarioOf,
  scoreRound,
  setDraft,
  summarize,
  tagOf,
  toDifficulty,
  toggleCheck,
  toggleFact,
  verdictOf,
  type AudienceSwitchState,
  type Difficulty
} from '../src/rules';
import { SCENARIOS, scenarioById, type AudienceId, type MessageId } from '../src/scenarios';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const round0 = (s: AudienceSwitchState) => s.rounds[0]!;

function seedFor(scenario: string, difficulty: Difficulty = 'medium'): number {
  for (let seed = 1; seed < 2000; seed++) if (createInitialState(seed, difficulty).scenario === scenario) return seed;
  throw new Error(`no seed for ${scenario}`);
}

/** Plays the current round: ticks `facts`, opens with `lead`, picks `message`. */
function playRound(state: AudienceSwitchState, facts: readonly string[], lead: string, message: MessageId): AudienceSwitchState {
  let s = state;
  for (const f of facts) s = toggleFact(s, f);
  s = goToLead(s);
  s = chooseLead(s, lead);
  s = checkSelection(s);
  s = chooseMessage(s, message);
  return checkMessage(s);
}

/** Independent oracle: counts straight from the scenario definition. */
function oracle(scenario: string, audience: AudienceId, shown: readonly string[], selected: readonly string[]) {
  const def = SCENARIOS.find((d) => d.id === scenario)!;
  const facts = def.facts.filter((f) => shown.includes(f.id));
  const must = facts.filter((f) => f.tags[audience] === 'must').map((f) => f.id);
  const leave = facts.filter((f) => f.tags[audience] === 'leave').map((f) => f.id);
  const hits = must.filter((id) => selected.includes(id)).length;
  return { needed: must.length, hits, misses: must.length - hits, extras: leave.filter((id) => selected.includes(id)).length };
}

describe('createInitialState', () => {
  it('is deterministic per seed and difficulty', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, d) => {
        expect(createInitialState(seed, d)).toEqual(createInitialState(seed, d));
      }),
      { numRuns: 100 }
    );
  });

  it('builds a valid fresh game: first round selecting, nothing chosen', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, d) => {
        const s = createInitialState(seed, d);
        const def = scenarioOf(s);
        expect(isAudienceSwitchState(s)).toBe(true);
        expect(s.seed).toBe(seed);
        expect(s.difficulty).toBe(d);
        expect(s.round).toBe(0);
        expect(s.audiences).toEqual(audiencesFor(def, d));
        expect([...s.facts].sort()).toEqual(factIdsFor(def, d).sort());
        expect(s.rounds).toHaveLength(s.audiences.length);
        s.rounds.forEach((r, i) => {
          expect(r).toMatchObject({ step: 'select', selected: [], lead: null, chosen: null, draft: '' });
          expect(r.checks).toEqual([false, false, false]);
          expect([...r.order].sort()).toEqual(messageIdsFor(def, s.audiences[i]!).sort());
        });
      }),
      { numRuns: 150 }
    );
  });

  it('normalizes seeds to uint32 and defaults to easy', () => {
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(5).difficulty).toBe('easy');
  });

  it('uses every scenario for some seed and shuffles facts', () => {
    const seen = new Set<string>();
    const orders = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const s = createInitialState(seed, 'hard');
      seen.add(s.scenario);
      if (s.scenario === 'migration') orders.add(s.facts.join());
    }
    expect(seen.size).toBe(SCENARIOS.length);
    expect(orders.size).toBeGreaterThan(1);
  });

  it('scales with difficulty: easy = far pair and fewer cards, hard = all cards', () => {
    for (const def of SCENARIOS) {
      expect(audiencesFor(def, 'easy')).toEqual(def.audiences.filter((a) => def.far.includes(a)));
      expect(audiencesFor(def, 'easy')).toHaveLength(2);
      expect(audiencesFor(def, 'medium')).toEqual([...def.audiences]);
      expect(audiencesFor(def, 'hard')).toEqual([...def.audiences]);
      expect(factIdsFor(def, 'easy')).toEqual(def.facts.filter((f) => !f.subtle).map((f) => f.id));
      expect(factIdsFor(def, 'medium')).toEqual(factIdsFor(def, 'easy'));
      expect(factIdsFor(def, 'hard')).toEqual(def.facts.map((f) => f.id));
      expect(factIdsFor(def, 'hard').length).toBeGreaterThan(factIdsFor(def, 'easy').length);
    }
  });

  it('toDifficulty accepts known ids only', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('nope')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });
});

describe('scenario data', () => {
  it('is consistent: 3 audiences, a far pair, unique ids, tags for every audience', () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(6);
    for (const def of SCENARIOS) {
      expect(def.audiences).toHaveLength(3);
      expect(new Set(def.audiences).size).toBe(3);
      expect(def.far.every((a) => def.audiences.includes(a))).toBe(true);
      expect(def.far[0]).not.toBe(def.far[1]);
      expect(new Set(def.facts.map((f) => f.id)).size).toBe(def.facts.length);
      expect(def.facts.length).toBeGreaterThanOrEqual(8);
      for (const f of def.facts) for (const a of def.audiences) expect(['must', 'optional', 'leave']).toContain(f.tags[a]);
    }
  });

  it('gives every audience at least one must and one leave-out among the non-subtle cards', () => {
    for (const def of SCENARIOS) {
      const core = def.facts.filter((f) => !f.subtle);
      for (const a of def.audiences) {
        expect(core.some((f) => f.tags[a] === 'must'), `${def.id}/${a} must`).toBe(true);
        expect(core.some((f) => f.tags[a] === 'leave'), `${def.id}/${a} leave`).toBe(true);
      }
    }
  });

  it('has a non-subtle must fact as gold opening and exactly one fitting message per audience', () => {
    for (const def of SCENARIOS) {
      for (const a of def.audiences) {
        const lead = def.facts.find((f) => f.id === def.lead[a]);
        expect(lead, `${def.id}/${a}`).toBeDefined();
        expect(lead!.subtle).toBe(false);
        expect(lead!.tags[a]).toBe('must');
        const ids = messageIdsFor(def, a);
        expect(ids).toHaveLength(3);
        expect(new Set(ids).size).toBe(3);
        expect(ids.filter((id) => id === 'fit')).toHaveLength(1);
      }
    }
  });

  it('scenarioById and tagOf', () => {
    expect(scenarioById('migration')?.id).toBe('migration');
    expect(scenarioById('nope')).toBeUndefined();
    const def = scenarioById('migration')!;
    expect(tagOf(def, 'encoding', 'developer')).toBe('must');
    expect(tagOf(def, 'encoding', 'customer')).toBe('leave');
    expect(tagOf(def, 'newDate', 'developer')).toBe('optional');
    expect(tagOf(def, 'unknown', 'developer')).toBe('optional');
    expect(messageIdsFor(def, 'executive')).toEqual(['fit']);
  });
});

describe('round flow', () => {
  const start = () => createInitialState(seedFor('migration'), 'medium');

  it('toggles facts only in the select step and only for shown facts', () => {
    let s = start();
    s = toggleFact(s, 'encoding');
    s = toggleFact(s, 'cause');
    expect(round0(s).selected).toEqual(['encoding', 'cause']);
    s = toggleFact(s, 'encoding');
    expect(round0(s).selected).toEqual(['cause']);
    expect(toggleFact(s, 'buffer')).toBe(s); // subtle card, not shown on medium
    expect(toggleFact(s, 'nope')).toBe(s);
  });

  it('needs a ticked fact to continue and a lead to check', () => {
    const s = start();
    expect(goToLead(s)).toBe(s);
    const ticked = toggleFact(toggleFact(s, 'encoding'), 'cause');
    const lead = goToLead(ticked);
    expect(round0(lead).step).toBe('lead');
    expect(toggleFact(lead, 'noLoss')).toBe(lead);
    expect(checkSelection(lead)).toBe(lead);
    expect(chooseLead(lead, 'noLoss')).toBe(lead); // not ticked
    const chosen = chooseLead(lead, 'cause');
    expect(round0(chosen).lead).toBe('cause');
    expect(chooseLead(chosen, 'cause')).toBe(chosen);
    expect(round0(backToSelect(chosen)).step).toBe('select');
    expect(round0(backToSelect(chosen)).lead).toBe('cause');
    expect(backToSelect(s)).toBe(s);
    expect(round0(checkSelection(chosen)).step).toBe('message');
    expect(chooseLead(s, 'cause')).toBe(s); // wrong step
  });

  it('clears the lead when its fact is unticked after going back', () => {
    let s = start();
    s = chooseLead(goToLead(toggleFact(toggleFact(s, 'encoding'), 'cause')), 'cause');
    s = backToSelect(s);
    expect(round0(toggleFact(s, 'encoding')).lead).toBe('cause');
    expect(round0(toggleFact(s, 'cause')).lead).toBeNull();
  });

  it('picks and checks a message, then accepts draft and self-checks, then moves on', () => {
    let s = start();
    s = checkSelection(chooseLead(goToLead(toggleFact(s, 'encoding')), 'encoding'));
    expect(checkMessage(s)).toBe(s);
    expect(setDraft(s, 'x')).toBe(s);
    expect(toggleCheck(s, 0)).toBe(s);
    expect(nextRound(s)).toBe(s);
    s = chooseMessage(s, 'fit');
    expect(round0(s).chosen).toBe('fit');
    expect(chooseMessage(s, 'fit')).toBe(s);
    expect(chooseMessage(s, 'tooMuch')).toBe(s); // not a developer message
    s = chooseMessage(s, 'missing');
    s = checkMessage(s);
    expect(round0(s).step).toBe('reflect');
    expect(chooseMessage(s, 'fit')).toBe(s);
    s = setDraft(s, 'Encoding bug, fixed Thursday.');
    expect(round0(s).draft).toBe('Encoding bug, fixed Thursday.');
    expect(setDraft(s, 'Encoding bug, fixed Thursday.')).toBe(s);
    expect(round0(setDraft(s, 'y'.repeat(MAX_DRAFT + 50))).draft).toHaveLength(MAX_DRAFT);
    s = toggleCheck(s, 2);
    expect(round0(s).checks).toEqual([false, false, true]);
    expect(round0(toggleCheck(s, 2)).checks).toEqual([false, false, false]);
    expect(toggleCheck(s, SELF_CHECKS)).toBe(s);
    expect(toggleCheck(s, -1)).toBe(s);
    expect(toggleCheck(s, 0.5)).toBe(s);
    s = nextRound(s);
    expect(s.round).toBe(1);
    expect(round0(s).step).toBe('done');
    expect(currentRound(s)?.step).toBe('select');
    expect(isFinished(s)).toBe(false);
  });

  it('finishes after the last audience and then ignores every move', () => {
    let s = createInitialState(seedFor('migration', 'easy'), 'easy');
    s = nextRound(playRound(s, ['encoding'], 'encoding', 'fit'));
    s = nextRound(playRound(s, ['noLoss'], 'noLoss', 'fit'));
    expect(isFinished(s)).toBe(true);
    expect(currentRound(s)).toBeUndefined();
    expect(isAudienceSwitchState(s)).toBe(true);
    for (const move of [
      (x: AudienceSwitchState) => toggleFact(x, 'encoding'),
      goToLead,
      backToSelect,
      (x: AudienceSwitchState) => chooseLead(x, 'encoding'),
      checkSelection,
      (x: AudienceSwitchState) => chooseMessage(x, 'fit'),
      checkMessage,
      (x: AudienceSwitchState) => setDraft(x, 'z'),
      (x: AudienceSwitchState) => toggleCheck(x, 0),
      nextRound
    ]) {
      expect(move(s)).toBe(s);
    }
  });
});

describe('scoring', () => {
  it('verdictOf covers every tag', () => {
    expect(verdictOf('must', true)).toBe('hit');
    expect(verdictOf('must', false)).toBe('miss');
    expect(verdictOf('leave', true)).toBe('extra');
    expect(verdictOf('leave', false)).toBe('skipped');
    expect(verdictOf('optional', true)).toBe('optional');
    expect(verdictOf('optional', false)).toBe('optional');
  });

  it('scores a known migration round exactly', () => {
    const base = createInitialState(seedFor('migration', 'hard'), 'hard');
    // developer: must cause, encoding, regression; leave apology, buffer
    const s = playRound(base, ['encoding', 'apology', 'newDate', 'buffer'], 'encoding', 'fit');
    expect(scoreRound(s, 0)).toEqual({ needed: 3, hits: 1, misses: 2, extras: 2, leadCorrect: true, messageCorrect: true });
    const t = playRound(base, ['cause', 'regression'], 'cause', 'condescending');
    expect(scoreRound(t, 0)).toEqual({ needed: 3, hits: 2, misses: 1, extras: 0, leadCorrect: false, messageCorrect: false });
  });

  it('matches an independent oracle for any selection (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.constantFrom(...DIFFICULTIES),
        fc.array(fc.nat(20), { maxLength: 12 }),
        fc.nat(5),
        fc.nat(2),
        (seed, d, picks, leadPick, msgPick) => {
          const s0 = createInitialState(seed, d);
          const chosen = [...new Set(picks.map((p) => s0.facts[p % s0.facts.length]!))];
          if (chosen.length === 0) chosen.push(s0.facts[0]!);
          const message = round0(s0).order[msgPick]!;
          const lead = chosen[leadPick % chosen.length]!;
          const s = playRound(s0, chosen, lead, message);
          const audience = s.audiences[0]!;
          const score = scoreRound(s, 0);
          expect({ needed: score.needed, hits: score.hits, misses: score.misses, extras: score.extras }).toEqual(oracle(s.scenario, audience, s.facts, chosen));
          expect(score.leadCorrect).toBe(lead === scenarioOf(s).lead[audience]);
          expect(score.messageCorrect).toBe(message === 'fit');
          expect(score.hits + score.misses).toBe(score.needed);
        }
      ),
      { numRuns: 300 }
    );
  });

  it('summarize adds up checked rounds only', () => {
    const base = createInitialState(seedFor('migration', 'medium'), 'medium');
    expect(summarize(base)).toEqual({ needed: 0, hits: 0, extras: 0, leads: 0, messages: 0 });
    let s = playRound(base, ['encoding', 'cause', 'apology'], 'encoding', 'fit');
    expect(summarize(s)).toEqual({ needed: 3, hits: 2, extras: 1, leads: 1, messages: 1 });
    s = nextRound(s);
    s = playRound(s, ['newDate', 'noLoss'], 'noLoss', 'tooMuch');
    // project lead (medium): must newDate, noLoss; lead newDate
    expect(summarize(s)).toEqual({ needed: 5, hits: 4, extras: 1, leads: 1, messages: 1 });
    // a round still in the message step is not counted
    const pending = checkSelection(chooseLead(goToLead(toggleFact(nextRound(s), 'cause')), 'cause'));
    expect(summarize(pending)).toEqual(summarize(s));
  });
});

describe('isAudienceSwitchState', () => {
  const sample = () => createInitialState(seedFor('migration', 'medium'), 'medium');

  /** States in every phase, used for restore and validation checks. */
  function phases(): AudienceSwitchState[] {
    const s0 = sample();
    const s1 = toggleFact(s0, 'encoding');
    const s2 = goToLead(s1);
    const s3 = chooseLead(s2, 'encoding');
    const s4 = checkSelection(s3);
    const s5 = chooseMessage(s4, 'fit');
    const s6 = setDraft(toggleCheck(checkMessage(s5), 1), 'Mine');
    const s7 = nextRound(s6);
    const s8 = nextRound(playRound(s7, ['newDate'], 'newDate', 'fit'));
    const s9 = nextRound(playRound(s8, ['noLoss'], 'noLoss', 'fit'));
    return [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9];
  }

  it('accepts states in every phase, also after a JSON round trip', () => {
    for (const s of phases()) expect(isAudienceSwitchState(clone(s))).toBe(true);
  });

  it('rejects junk and never throws', () => {
    for (const junk of [null, undefined, 0, 'x', [], {}, { version: 1 }, [[1]]]) expect(isAudienceSwitchState(junk)).toBe(false);
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(() => isAudienceSwitchState(v)).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });

  it('rejects each broken field', () => {
    const [, , lead, , message, , reflect, second] = phases() as AudienceSwitchState[];
    const bad: [string, (s: AudienceSwitchState) => unknown][] = [
      ['version', (s) => ({ ...s, version: 2 })],
      ['seed', (s) => ({ ...s, seed: -1 })],
      ['seed float', (s) => ({ ...s, seed: 1.5 })],
      ['difficulty', (s) => ({ ...s, difficulty: 'expert' })],
      ['difficulty mismatch', (s) => ({ ...s, difficulty: 'easy' })],
      ['scenario', (s) => ({ ...s, scenario: 'nope' })],
      ['scenario type', (s) => ({ ...s, scenario: 3 })],
      ['audiences order', (s) => ({ ...s, audiences: [...s.audiences].reverse() })],
      ['audiences type', (s) => ({ ...s, audiences: 'developer' })],
      ['facts missing', (s) => ({ ...s, facts: s.facts.slice(1) })],
      ['facts dup', (s) => ({ ...s, facts: [...s.facts.slice(1), s.facts[1]] })],
      ['facts subtle', (s) => ({ ...s, facts: [...s.facts.slice(1), 'buffer'] })],
      ['round range', (s) => ({ ...s, round: 4 })],
      ['round neg', (s) => ({ ...s, round: -1 })],
      ['rounds length', (s) => ({ ...s, rounds: s.rounds.slice(1) })],
      ['rounds type', (s) => ({ ...s, rounds: {} })],
      ['round record', (s) => ({ ...s, rounds: [null, ...s.rounds.slice(1)] })],
      ['step', (s) => ({ ...s, rounds: [{ ...s.rounds[0], step: 'jump' }, ...s.rounds.slice(1)] })],
      ['current done', (s) => ({ ...s, rounds: [{ ...s.rounds[0], step: 'done' }, ...s.rounds.slice(1)] })],
      ['selected unknown', (s) => ({ ...s, rounds: [{ ...s.rounds[0], selected: ['nope'] }, ...s.rounds.slice(1)] })],
      ['selected dup', (s) => ({ ...s, rounds: [{ ...s.rounds[0], selected: ['cause', 'cause'] }, ...s.rounds.slice(1)] })],
      ['selected type', (s) => ({ ...s, rounds: [{ ...s.rounds[0], selected: [1] }, ...s.rounds.slice(1)] })],
      ['lead not selected', (s) => ({ ...s, rounds: [{ ...s.rounds[0], lead: 'cause' }, ...s.rounds.slice(1)] })],
      ['order', (s) => ({ ...s, rounds: [{ ...s.rounds[0], order: ['fit', 'fit', 'missing'] }, ...s.rounds.slice(1)] })],
      ['order foreign', (s) => ({ ...s, rounds: [{ ...s.rounds[0], order: ['fit', 'tooMuch', 'missing'] }, ...s.rounds.slice(1)] })],
      ['chosen early', (s) => ({ ...s, rounds: [{ ...s.rounds[0], chosen: 'fit' }, ...s.rounds.slice(1)] })],
      ['draft early', (s) => ({ ...s, rounds: [{ ...s.rounds[0], draft: 'x' }, ...s.rounds.slice(1)] })],
      ['checks early', (s) => ({ ...s, rounds: [{ ...s.rounds[0], checks: [true, false, false] }, ...s.rounds.slice(1)] })],
      ['checks length', (s) => ({ ...s, rounds: [{ ...s.rounds[0], checks: [false, false] }, ...s.rounds.slice(1)] })],
      ['checks type', (s) => ({ ...s, rounds: [{ ...s.rounds[0], checks: [0, 0, 0] }, ...s.rounds.slice(1)] })],
      ['draft type', (s) => ({ ...s, rounds: [{ ...s.rounds[0], draft: 5 }, ...s.rounds.slice(1)] })],
      ['future touched', (s) => ({ ...s, rounds: [s.rounds[0], { ...s.rounds[1], selected: ['cause'] }, ...s.rounds.slice(2)] })],
      ['future lead', (s) => ({ ...s, rounds: [s.rounds[0], { ...s.rounds[1], step: 'lead' }, ...s.rounds.slice(2)] })]
    ];
    const base = sample();
    expect(isAudienceSwitchState(base)).toBe(true);
    for (const [name, mutate] of bad) expect(isAudienceSwitchState(mutate(clone(base))), name).toBe(false);

    const r = (s: AudienceSwitchState, patch: object) => ({ ...s, rounds: [{ ...s.rounds[0], ...patch }, ...s.rounds.slice(1)] });
    expect(isAudienceSwitchState(r(lead, { selected: [] })), 'lead with nothing ticked').toBe(false);
    expect(isAudienceSwitchState(r(message, { lead: null })), 'message without lead').toBe(false);
    expect(isAudienceSwitchState(r(reflect, { chosen: null })), 'reflect without choice').toBe(false);
    expect(isAudienceSwitchState(r(reflect, { draft: 'x'.repeat(MAX_DRAFT + 1) })), 'draft too long').toBe(false);
    expect(isAudienceSwitchState(r(reflect, { chosen: 'nope' })), 'unknown message').toBe(false);
    expect(isAudienceSwitchState(r(second, { step: 'reflect' })), 'past round not done').toBe(false);
    expect(isAudienceSwitchState(r(reflect, { lead: 5 })), 'lead type').toBe(false);
    expect(isAudienceSwitchState(r(reflect, { chosen: 5 })), 'chosen type').toBe(false);
  });

  it('accepts a lead kept in the select step after going back', () => {
    const s = backToSelect(chooseLead(goToLead(toggleFact(sample(), 'cause')), 'cause'));
    expect(isAudienceSwitchState(s)).toBe(true);
  });
});
