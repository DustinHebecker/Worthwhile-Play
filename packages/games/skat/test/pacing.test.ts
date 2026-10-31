import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { advance } from '../src/ai';
import { PERSON_KEYS, messages } from '../src/messages';
import { DEFAULT_SPEED, SPEEDS, buildReveal, timing, waitAfter } from '../src/pacing';
import { HUMAN, applyAction, newGame, startSeries, toAct, type SkatState } from '../src/rules';

/** Plays the person by always passing / playing the first legal card, until a computer turn has played cards. */
function stateWithComputerPlays(seed: number): { before: SkatState; result: ReturnType<typeof advance> } {
  let state = advance(startSeries(newGame(seed))).state;
  for (let i = 0; i < 40; i++) {
    const d = state.deal;
    if (!d || d.result || toAct(d) !== HUMAN) break;
    const before = state;
    const mine = advance(before, { 0: 'easy', 1: before.difficulty, 2: before.difficulty });
    // `mine` lets an AI play the person's moves; take only the person's first move from it.
    const first = mine.moves[0];
    if (!first) break;
    const after = applyAction(before, first.seat, first.action) as SkatState;
    const result = advance(after);
    if (result.moves.some((m) => m.action.type === 'play')) return { before: after, result };
    state = result.state;
  }
  throw new Error('no computer plays found');
}

describe('reveal pacing', () => {
  it('reveals the decided moves step by step and ends exactly on the real state', () => {
    for (const seed of [1, 2, 3, 11, 42]) {
      const { before, result } = stateWithComputerPlays(seed);
      const steps = buildReveal(before, result.moves, false);
      const moveSteps = steps.filter((s) => s.kind === 'move');
      expect(moveSteps.map((s) => s.move)).toEqual(result.moves);
      expect(steps[steps.length - 1]?.state).toEqual(result.state);
      // Every completed trick is held (winner known) and then collected toward that winner.
      steps.forEach((step, i) => {
        if (step.kind === 'collect') {
          expect(steps[i - 1]?.hold).toBe(true);
          expect(step.winner).toBe(steps[i - 1]?.winner);
        }
        if (step.hold && step.kind === 'move') {
          expect(steps[i + 1]?.kind).toBe('collect');
          expect(step.winner).not.toBeNull();
          expect(step.state.deal?.trick).toEqual([]);
        }
        if (!step.hold) expect(step.winner).toBeNull();
      });
    }
    // Five seeds of real computer play (search): about 5 s alone, beyond the 20 s default on a busy machine.
  }, 60_000);

  it('can start with the unchanged table (a new deal before the computers bid)', () => {
    const start = startSeries(newGame(5));
    const { moves } = advance(start);
    const steps = buildReveal(start, moves, true);
    expect(steps[0]).toEqual({ kind: 'move', state: start, move: null, hold: false, winner: null });
    expect(steps).toHaveLength(moves.length + 1);
    expect(buildReveal(start, [], false)).toEqual([]);
  });

  it('stops at an impossible move instead of inventing a state', () => {
    const start = startSeries(newGame(5));
    const steps = buildReveal(start, [{ seat: 0, action: { type: 'play', card: 'AS' } }], false);
    expect(steps).toEqual([]);
  });

  it('timings: calm by default, faster on request, none for instant, no motion when reduced', () => {
    expect(DEFAULT_SPEED).toBe('normal');
    expect(SPEEDS).toEqual(['normal', 'fast', 'instant']);
    expect(timing('normal', false)).toEqual({ step: 700, hold: 1000, collect: 450, flight: 380 });
    expect(timing('fast', false)).toEqual({ step: 300, hold: 500, collect: 250, flight: 200 });
    expect(timing('instant', false)).toBeNull();
    expect(timing('instant', true)).toBeNull();
    expect(timing('normal', true)).toEqual({ step: 700, hold: 1000, collect: 0, flight: 0 });
    const time = { step: 1, hold: 2, collect: 3, flight: 4 };
    const state = newGame(1);
    expect(waitAfter({ kind: 'move', state, move: null, hold: false, winner: null }, time)).toBe(1);
    expect(waitAfter({ kind: 'move', state, move: null, hold: true, winner: 1 }, time)).toBe(2);
    expect(waitAfter({ kind: 'collect', state, move: null, hold: true, winner: 1 }, time)).toBe(3);
  });
});

/** Third-person verbs after "Du"/"You" (and "an Du"): what inserting the person as {player} used to produce. */
const BAD_PERSON_FORMS = /\bDu (gewinnt|verliert|spielt|sagt|nimmt|bekommt|hat|gibt|drückt)\b|\ban Du\b|\bYou (wins|loses|plays|says|passes|takes|picks|puts|deals)\b/;

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('sentences about the person (verb agreement)', () => {
  it('every sentence that can have the person as subject has a `.you` variant in all 16 locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const catalogue = messages[locale] as Record<string, string>;
      for (const key of PERSON_KEYS) {
        const base = catalogue[key];
        const you = catalogue[`${key}.you`];
        expect(base, `${locale} ${key}`).toBeTruthy();
        expect(you, `${locale} ${key}.you`).toBeTruthy();
        expect(placeholders(you as string), `${locale} ${key}.you placeholders`).toEqual(placeholders(base as string).filter((p) => p !== 'player'));
      }
    }
  });

  it('every other {player} sentence that the person can be the subject of is of the form "{player}: …"', () => {
    // Keys whose {player} is never the person (only computers) are listed explicitly.
    const neverPerson = new Set(['hand.of', 'status.answer']);
    const en = messages.en as Record<string, string>;
    for (const [key, text] of Object.entries(en)) {
      if (!text.includes('{player}') || neverPerson.has(key) || (PERSON_KEYS as readonly string[]).includes(key)) continue;
      expect(text, key).toMatch(/^\{player\}:? /);
      for (const locale of ['en', 'de'] as const) expect((messages[locale] as Record<string, string>)[key], `${locale} ${key}`).toMatch(/^\{player\}[:：]? /);
    }
  });

  it('the person variants avoid the known bad forms in German and English', () => {
    for (const locale of ['en', 'de'] as const) {
      const catalogue = messages[locale] as Record<string, string>;
      for (const key of PERSON_KEYS) expect(catalogue[`${key}.you`], `${locale} ${key}.you`).not.toMatch(BAD_PERSON_FORMS);
    }
    expect('Du gewinnt mit 70 Augen.').toMatch(BAD_PERSON_FORMS);
    expect('You plays Grand.').toMatch(BAD_PERSON_FORMS);
    expect((messages.de as Record<string, string>)['outcome.won.you']).toMatch(/^Du gewinnst /);
    expect((messages.de as Record<string, string>)['log.bid.you']).toBe('Du sagst {value}.');
    expect((messages.de as Record<string, string>)['log.pass.you']).toBe('Du passt.');
    expect((messages.en as Record<string, string>)['log.bid.you']).toBe('You say {value}.');
    expect((messages.en as Record<string, string>)['outcome.won.you']).toMatch(/^You won /);
  });
});
