// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { messages } from '../src/messages';
import { LOG_KINDS, type LogEntry, type LogKind, type PokerState } from '../src/rules';

/**
 * The person (seat 0) is shown as "You"/"Du"/…; a third-person template filled with that pronoun gives wrong
 * agreement ("You calls", "Du gewinnt"). Every template whose subject can be the person has a person variant.
 */
const PERSON_VARIANTS: Readonly<Record<string, string>> = {
  'log.entry': 'log.entryYou',
  'seat.folded': 'seat.foldedYou',
  'result.win': 'result.youWin',
  'result.winFold': 'result.youWinFold',
  ...Object.fromEntries([...LOG_KINDS, 'allIn'].map((kind) => [`action.${kind}`, `actionYou.${kind}`]))
};

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('person variants', () => {
  it('exist in all 16 locales with the same placeholders (minus the name)', () => {
    const locales = Object.keys(messages);
    expect(locales).toHaveLength(16);
    for (const locale of locales) {
      const catalogue = messages[locale]!;
      for (const [key, personKey] of Object.entries(PERSON_VARIANTS)) {
        const base = catalogue[key];
        const person = catalogue[personKey];
        expect(base, `${locale} ${key}`).toBeTruthy();
        expect(person, `${locale} ${personKey}`).toBeTruthy();
        const expected = placeholders(base!).filter((p) => !(key.startsWith('result.') && p === 'name'));
        expect(placeholders(person!), `${locale} ${personKey}`).toEqual(expected);
      }
    }
  });
});

const BAD: Record<'en' | 'de', RegExp> = {
  en: /\bYou:? (wins|calls|raises|folds|bets|checks|small blind|big blind|all-in:)/,
  de: /\bDu:? (gewinnt|geht|erhöht|schiebt|Small Blind|Big Blind|all-in:)/
};

/** A started table whose log holds one entry of the person; returns all rendered text. */
const renderPersonEntry = (locale: 'en' | 'de', kind: LogKind, allIn: boolean) => {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  instance.newGame({ seed: 3, difficulty: 'easy' });
  ctx.context.root.querySelector<HTMLElement>('[data-testid="pk-start"]')!.click();
  const state = JSON.parse(JSON.stringify(instance.serialize())) as PokerState;
  const entry: LogEntry = { seat: 0, kind, amount: kind === 'fold' || kind === 'check' ? 0 : 4, allIn, street: 'preflop' };
  state.log = [entry];
  const me = state.seats[0]!;
  me.folded = kind === 'fold';
  me.inHand = true;
  if (me.stack === 0) me.stack = 10;
  instance.restore(state);
  const root = ctx.context.root;
  root.querySelector('details')?.setAttribute('open', '');
  const text = root.textContent ?? '';
  const seat = root.querySelector('[data-testid="pk-seat-0"]')?.textContent ?? '';
  const log = [...root.querySelectorAll('[data-testid="pk-log"] li')].map((li) => li.textContent ?? '');
  expect(ctx.missingKeys).toEqual([]);
  instance.dispose();
  return { text, seat, log };
};

describe('the person’s own actions read with correct agreement', () => {
  for (const locale of ['en', 'de'] as const) {
    it(`${locale}: log lines and seat labels`, () => {
      for (const kind of LOG_KINDS) {
        for (const allIn of kind === 'call' || kind === 'bet' || kind === 'raise' ? [false, true] : [false]) {
          const { text, seat, log } = renderPersonEntry(locale, kind, allIn);
          expect(text, `${kind} ${allIn}`).not.toMatch(BAD[locale]);
          // Seat label directly after the name "You"/"Du" must also agree when read together.
          expect(seat.replace(/\s+/g, ' '), `${kind} ${allIn}`).not.toMatch(BAD[locale]);
          expect(log.some((line) => line.startsWith(locale === 'en' ? 'You ' : 'Du '))).toBe(true);
        }
      }
    });
  }

  it('renders the expected person sentences', () => {
    expect(renderPersonEntry('en', 'call', false).log).toContain('You call 4.');
    expect(renderPersonEntry('en', 'raise', true).log).toContain('You go all-in with 4.');
    expect(renderPersonEntry('en', 'fold', false).log).toContain('You fold.');
    expect(renderPersonEntry('de', 'check', false).log).toContain('Du schiebst.');
    expect(renderPersonEntry('de', 'raise', false).log).toContain('Du erhöhst auf 4.');
    expect(renderPersonEntry('de', 'bet', false).log).toContain('Du setzt 4.');
    expect(renderPersonEntry('de', 'sb', false).log).toContain('Du zahlst den Small Blind 4.');
  });

  it('result lines for the person use the person forms', () => {
    for (const locale of ['en', 'de'] as const) {
      const ctx = createTestContext(game as never, locale);
      const instance = game.create(ctx.context);
      instance.newGame({ seed: 3, difficulty: 'easy' });
      ctx.context.root.querySelector<HTMLElement>('[data-testid="pk-start"]')!.click();
      const state = JSON.parse(JSON.stringify(instance.serialize())) as PokerState;
      for (const showdown of [true, false]) {
        state.phase = 'handOver';
        state.result = { showdown, pots: [], payouts: state.seats.map((_, i) => (i === 0 ? 20 : 0)), scores: state.seats.map(() => 0), shown: [0] };
        instance.restore(state);
        const text = ctx.context.root.querySelector('[data-testid="pk-result"]')?.textContent ?? '';
        expect(text).toMatch(locale === 'en' ? /You win 20/ : /Du gewinnst 20/);
        expect(text).not.toMatch(BAD[locale]);
      }
      instance.dispose();
    }
  });
});
