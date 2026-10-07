// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from '@wp/testing';
import { COMMON_MESSAGES, SUPPORTED_LOCALES, createTranslator, type SupportedLocale } from '@wp/localization';
import type { GameInstance, GameModule } from '@wp/game-core';
import game from '../src/index';
import { metadata } from '../src/metadata';
import { DIFFICULTIES, ENTITY_KINDS, RESTART, getPuzzle, type CrossViolation, type Difficulty, type RiverState } from '../src/rules';
import { KIND_ICON, entityName, formatList, rulesTexts, violationText } from '../src/view';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
});

const stateOf = (difficulty: Difficulty, puzzle: number, history: RiverState['history'] = [], boat: number[] = []): RiverState => ({
  seed: puzzle,
  difficulty,
  puzzle,
  history,
  boat
});

/** Seed 6 → easy 7 "Garden ferry": gardener, dog, goose, seeds. */
function start(options: { seed?: number; difficulty?: string; locale?: SupportedLocale; state?: RiverState } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const instance = game.create(ctx.context) as GameInstance<RiverState>;
  if (options.state) instance.restore(options.state);
  else instance.newGame({ seed: options.seed ?? 6, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  cleanup.push(() => instance.dispose());
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const side = (id: string) => q(`entity-${id}`).dataset.side;
  const tap = (id: string) => q(`entity-${id}`).click();
  const press = (key: string, init: KeyboardEventInit = {}, target: HTMLElement = q('entity-gardener')) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  };
  const status = () => q('rc-status').textContent;
  return { ctx, instance, root, q, side, tap, press, status };
}

const translator = (locale: SupportedLocale, missing: string[] = []) =>
  createTranslator({ locale, sources: [metadata.messages, COMMON_MESSAGES], onMissing: (key) => missing.push(key) });

describe('view', () => {
  it('renders the puzzle, its generated rules, both banks and an empty boat', () => {
    const { q, side, status, root } = start();
    expect(q('rc-puzzle').textContent).toBe('Puzzle 7 of 8: Garden ferry');
    expect([...q('rc-rules').querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'The boat has 2 seats.',
      'Only these can row (oar symbol): Gardener. The boat never crosses without one of them.',
      'Goose may only be on the same bank as Dog or Seeds if Gardener is there too.'
    ]);
    for (const id of ['gardener', 'dog', 'goose', 'seeds']) expect(side(id)).toBe('left');
    expect(q('rc-bank-left').childElementCount).toBe(4);
    expect(q('rc-boat-slot').childElementCount).toBe(0);
    expect(q('entity-gardener').getAttribute('aria-label')).toBe('Gardener, can row, on the start bank');
    expect(q('entity-dog').getAttribute('aria-label')).toBe('Dog, on the start bank');
    expect(q('rc-crossings').textContent).toBe('Crossings: 0');
    expect(q('rc-boat-info').textContent).toBe('Seats: 0 of 2');
    expect(status()).toBe('The boat is at the start bank.');
    expect(q('rc-status').dataset.state).toBe('info');
    expect(q('rc-scene').dataset.boat).toBe('left');
    expect((q('rc-undo') as HTMLButtonElement).disabled).toBe(true);
    expect((q('rc-restart') as HTMLButtonElement).disabled).toBe(true);
    expect((q('rc-cross') as HTMLButtonElement).disabled).toBe(false);
    expect(root.querySelectorAll('[data-testid^="entity-"] svg.rc-icon')).toHaveLength(4);
    expect((q('rc-puzzle-select') as HTMLSelectElement).value).toBe('6');
    expect(q('rc-puzzle-select').querySelectorAll('option')[0]?.textContent).toBe('1. Parcel run');
  });

  it('tapping puts entities into the boat and takes them out again, saving each change', () => {
    const { q, side, tap, ctx } = start();
    tap('goose');
    expect(side('goose')).toBe('boat');
    expect(q('rc-boat-slot').contains(q('entity-goose'))).toBe(true);
    expect(q('entity-goose').getAttribute('aria-label')).toBe('Goose, in the boat');
    expect(q('rc-boat-info').textContent).toBe('Seats: 1 of 2');
    expect(ctx.saveRequests()).toBe(1);
    tap('goose');
    expect(side('goose')).toBe('left');
    expect(ctx.saveRequests()).toBe(2);
  });

  it('explains a full boat and a figure on the other bank without changing anything', () => {
    const { tap, side, status, ctx, instance, q } = start();
    tap('gardener');
    tap('goose');
    const before = instance.serialize();
    tap('dog');
    expect(side('dog')).toBe('left');
    expect(status()).toBe('The boat is full (2 seats). Take someone out first.');
    expect(q('rc-status').dataset.state).toBe('blocked');
    expect(ctx.saveRequests()).toBe(2);
    expect(instance.serialize()).toEqual(before);
    q('rc-cross').click();
    tap('dog');
    expect(status()).toBe('Dog is on the other bank. Only those on the boat’s bank can get in.');
  });

  it('a crossing that breaks a rule is explained in plain language and not carried out', () => {
    const { tap, q, status, ctx, instance, side } = start();
    tap('gardener');
    const before = instance.serialize();
    q('rc-cross').click();
    expect(status()).toBe('Start bank: Goose would be with Dog without Gardener. The crossing was not made – nothing has changed.');
    expect(instance.serialize()).toEqual(before);
    expect(ctx.saveRequests()).toBe(1);
    expect(side('gardener')).toBe('boat');
    expect(q('rc-crossings').textContent).toBe('Crossings: 0');
    // The explanation stays until the next change.
    tap('goose');
    expect(status()).toBe('The boat is at the start bank.');
  });

  it('a legal crossing moves the boat with its passengers, who stay aboard', () => {
    const { tap, q, side, status, ctx } = start();
    tap('gardener');
    tap('goose');
    q('rc-cross').click();
    expect(side('gardener')).toBe('boat');
    expect(side('goose')).toBe('boat');
    expect(q('rc-scene').dataset.boat).toBe('right');
    expect(q('rc-boat').dataset.side).toBe('right');
    expect(q('rc-crossings').dataset.value).toBe('1');
    expect(status()).toBe('The boat is at the goal bank.');
    expect(ctx.saveRequests()).toBe(3);
    tap('goose');
    expect(side('goose')).toBe('right');
    expect(q('entity-goose').getAttribute('aria-label')).toBe('Goose, on the goal bank');
    expect(q('rc-bank-right').contains(q('entity-goose'))).toBe(true);
    expect((q('rc-undo') as HTMLButtonElement).disabled).toBe(false);
  });

  it('keyboard: C crosses, U undoes (also by key code), ignoring modifiers and the puzzle list', () => {
    const { press, tap, q, side, ctx } = start();
    tap('gardener');
    tap('goose');
    expect(press('x').defaultPrevented).toBe(false);
    expect(press('c', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(press('c', {}, q('rc-puzzle-select')).defaultPrevented).toBe(false);
    expect(q('rc-crossings').dataset.value).toBe('0');
    const event = press('C');
    expect(event.defaultPrevented).toBe(true);
    expect(q('rc-crossings').dataset.value).toBe('1');
    press('u', { altKey: true });
    expect(q('rc-crossings').dataset.value).toBe('1');
    press('г', { code: 'KeyU' });
    expect(q('rc-crossings').dataset.value).toBe('0');
    expect(side('goose')).toBe('boat');
    press('с', { code: 'KeyC' });
    expect(q('rc-crossings').dataset.value).toBe('1');
    expect(ctx.saveRequests()).toBe(5);
  });

  it('keeps keyboard focus on a figure while it moves into and out of the boat', () => {
    const { q } = start();
    const token = q('entity-goose');
    token.focus();
    token.click();
    expect(document.activeElement).toBe(token);
    expect(token.dataset.side).toBe('boat');
  });

  it('solving finishes once with crossings and optimum, then locks the puzzle', () => {
    const { tap, q, ctx, status, instance, root } = start();
    const plan = [['gardener', 'goose'], ['gardener'], ['gardener', 'dog'], ['gardener', 'goose'], ['gardener', 'seeds'], ['gardener'], ['gardener', 'goose']];
    for (const group of plan) {
      for (const el of [...root.querySelectorAll<HTMLElement>('[data-side="boat"]')]) {
        const id = el.dataset.testid!.slice('entity-'.length);
        if (!group.includes(id)) el.click();
      }
      for (const id of group) if (q(`entity-${id}`).dataset.side !== 'boat') tap(id);
      q('rc-cross').click();
    }
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { crossings: 7, optimum: 7 } }]);
    expect(status()).toBe('Solved: everyone reached the goal bank in 7 crossings. Fewest possible: 7.');
    expect(q('rc-status').dataset.state).toBe('solved');
    expect((q('rc-cross') as HTMLButtonElement).disabled).toBe(true);
    expect((q('rc-undo') as HTMLButtonElement).disabled).toBe(true);
    expect((q('rc-restart') as HTMLButtonElement).disabled).toBe(true);
    expect(q('entity-dog').getAttribute('aria-disabled')).toBe('true');
    const saved = instance.serialize();
    tap('dog');
    q('rc-cross').click();
    expect(instance.serialize()).toEqual(saved);
    expect(ctx.results).toHaveLength(1);

    const again = start({ state: saved });
    expect(again.ctx.results).toEqual([]);
    expect(again.status()).toBe('Solved: everyone reached the goal bank in 7 crossings. Fewest possible: 7.');
  });

  it('restart and its undo through the buttons', () => {
    const { tap, q, side, status } = start();
    tap('gardener');
    tap('goose');
    q('rc-cross').click();
    q('rc-restart').click();
    expect(side('goose')).toBe('left');
    expect(q('rc-crossings').dataset.value).toBe('0');
    expect((q('rc-restart') as HTMLButtonElement).disabled).toBe(true);
    q('rc-undo').click();
    expect(side('goose')).toBe('boat');
    expect(q('rc-scene').dataset.boat).toBe('right');
    expect(status()).toBe('The boat is at the goal bank.');
  });

  it('chooses another puzzle from the list', () => {
    const { q, ctx, instance } = start();
    q('entity-goose').click();
    const select = q('rc-puzzle-select') as HTMLSelectElement;
    select.value = '0';
    q('rc-puzzle-play').click();
    expect(q('rc-puzzle').textContent).toBe('Puzzle 1 of 8: Parcel run');
    expect(instance.serialize()).toEqual({ seed: 6, difficulty: 'easy', puzzle: 0, history: [], boat: [] });
    expect(q('entity-parcel-2').dataset.side).toBe('left');
    expect(ctx.saveRequests()).toBe(2);
    q('rc-puzzle-play').click();
    expect(ctx.saveRequests()).toBe(2);
  });

  it('shows weights and the load, and explains an overloaded boat', () => {
    const { q, tap, status } = start({ seed: 2 });
    expect(q('rc-puzzle').textContent).toBe('Puzzle 3 of 8: Light raft');
    expect(q('rc-boat-info').textContent).toBe('Seats: 0 of 2 · Load: 0 of 80 kg');
    expect(q('entity-coach').textContent).toContain('80 kg');
    tap('coach');
    tap('scout-1');
    expect(q('rc-boat-info').textContent).toBe('Seats: 2 of 2 · Load: 120 of 80 kg');
    q('rc-cross').click();
    expect(status()).toBe('Too heavy: 120 kg in the boat, but it carries at most 80 kg. The crossing was not made – nothing has changed.');
  });

  it('shows the trips left for battery-limited robots', () => {
    const { q, tap } = start({ seed: 5 });
    expect(q('trips-robot-1').textContent).toBe('Trips left: 3');
    tap('robot-1');
    q('rc-cross').click();
    expect(q('trips-robot-1').textContent).toBe('Trips left: 2');
    expect(q('trips-robot-2').textContent).toBe('Trips left: 3');
  });

  it('shows a crossing limit in the counter', () => {
    const { q } = start({ seed: 2, difficulty: 'hard' });
    expect(q('rc-crossings').textContent).toBe('Crossings: 0 of at most 11');
  });

  it('ignores input while paused', () => {
    const { tap, side, instance, press, q } = start();
    instance.pause();
    tap('goose');
    press('c');
    q('rc-cross').click();
    expect(side('goose')).toBe('left');
    instance.resume();
    tap('goose');
    expect(side('goose')).toBe('boat');
  });

  it('restores an exact state (history, restart marker and boat load) and resets to the seeded start', () => {
    const saved = stateOf('easy', 6, [[0, 2], [0], RESTART, [0, 2]], [0, 2]);
    const { instance, side, q, ctx } = start({ state: saved });
    expect(instance.serialize()).toEqual(saved);
    expect(side('goose')).toBe('boat');
    expect(side('dog')).toBe('left');
    expect(q('rc-crossings').dataset.value).toBe('1');
    instance.reset();
    expect(instance.serialize()).toEqual({ seed: 6, difficulty: 'easy', puzzle: 6, history: [], boat: [] });
    expect(ctx.saveRequests()).toBe(1);
    instance.newGame({ seed: 1, difficulty: 'medium' });
    expect(q('rc-puzzle').textContent).toBe('Puzzle 2 of 8: Swimming course');
  });

  it('uses right-to-left layout for Arabic', () => {
    const { root } = start({ locale: 'ar' });
    expect(root.querySelector('.wp-river-crossing')?.getAttribute('dir')).toBe('rtl');
  });
});

describe('texts', () => {
  it('has an icon and a name for every entity kind and a title for every puzzle', () => {
    for (const kind of ENTITY_KINDS) {
      expect(KIND_ICON[kind]).toBeTruthy();
      expect(metadata.messages.en?.[`entity.${kind}`]).toBeTruthy();
    }
    for (const d of DIFFICULTIES) for (let i = 0; i < 8; i++) expect(metadata.messages.en?.[`puzzle.${getPuzzle(d, i).id}`]).toBeTruthy();
  });

  it('formats lists per locale', () => {
    expect(formatList('en', ['A', 'B', 'C'], 'conjunction')).toBe('A, B, and C');
    expect(formatList('en', ['A', 'B'], 'disjunction')).toBe('A or B');
    expect(formatList('de', ['A', 'B'], 'conjunction')).toBe('A und B');
  });

  it('describes every rule kind and boat feature', () => {
    const t = translator('en');
    expect(rulesTexts(t, getPuzzle('easy', 3))).toEqual([
      'The boat has 2 seats.',
      'Everybody can row. The boat never crosses empty.',
      'Child 1 and Child 2 may only be on a bank where Teacher 1 or Teacher 2 is too.'
    ]);
    expect(rulesTexts(t, getPuzzle('hard', 2))).toEqual([
      'The boat has 2 seats.',
      'Everybody can row. The boat never crosses empty.',
      'At most 11 crossings in total.',
      'Wherever there are rangers, they must never be outnumbered by monkeys.'
    ]);
    expect(rulesTexts(t, getPuzzle('easy', 1))).toContain('Parrot 1 and Parrot 2 never travel in the boat together.');
    expect(rulesTexts(t, getPuzzle('easy', 5))).toContain('Robot 1 can make at most 3 crossings.');
    expect(rulesTexts(t, getPuzzle('easy', 2))).toContain('The boat carries at most 80 kg.');
    expect(entityName(t, getPuzzle('easy', 1), 1)).toBe('Parrot 1');
    expect(entityName(t, getPuzzle('easy', 1), 99)).toBe('');
  });

  it('explains every kind of violation', () => {
    const t = translator('en');
    const parrots = getPuzzle('easy', 1);
    const monkeys = getPuzzle('hard', 2);
    const swim = getPuzzle('easy', 3);
    const robots = getPuzzle('easy', 5);
    const cases: [typeof parrots, CrossViolation, string][] = [
      [parrots, { kind: 'solved' }, 'The puzzle is already solved.'],
      [parrots, { kind: 'empty' }, 'The boat cannot cross empty. Put someone in it first.'],
      [parrots, { kind: 'full', capacity: 3 }, 'The boat has only 3 seats.'],
      [parrots, { kind: 'noRower' }, 'Nobody in the boat can row. Add someone with the oar symbol.'],
      [parrots, { kind: 'weight', weight: 90, max: 80 }, 'Too heavy: 90 kg in the boat, but it carries at most 80 kg.'],
      [parrots, { kind: 'boatApart', rule: 0, a: 1, b: 2 }, 'Parrot 1 and Parrot 2 must not travel in the boat together.'],
      [parrots, { kind: 'notHere', entity: 3 }, 'Crackers is not on the boat’s bank.'],
      [robots, { kind: 'trips', entity: 1, max: 3 }, 'Robot 2 has already made all 3 possible crossings.'],
      [monkeys, { kind: 'limit', max: 11 }, 'No crossings left: at most 11 are allowed. Undo or restart.'],
      [parrots, { kind: 'apart', bank: 'right', rule: 1, a: 1, b: 3 }, 'Goal bank: Parrot 1 would be with Crackers without Keeper.'],
      [swim, { kind: 'needs', bank: 'left', rule: 0, who: [2, 3] }, 'Start bank: Child 1 and Child 2 would be without Teacher 1 or Teacher 2.'],
      [monkeys, { kind: 'outnumber', bank: 'right', rule: 0, group: 1, by: 2 }, 'Goal bank: there would be more monkeys (2) than rangers (1).']
    ];
    for (const [puzzle, violation, text] of cases) expect(violationText(t, puzzle, violation)).toBe(text);
  });

  it('renders every puzzle and every explanation in all 16 locales without missing keys', () => {
    const violations: CrossViolation[] = [
      { kind: 'solved' }, { kind: 'empty' }, { kind: 'full', capacity: 2 }, { kind: 'noRower' }, { kind: 'weight', weight: 9, max: 8 },
      { kind: 'notHere', entity: 0 }, { kind: 'trips', entity: 0, max: 3 }, { kind: 'limit', max: 9 }
    ];
    for (const locale of SUPPORTED_LOCALES) {
      const missing: string[] = [];
      const t = translator(locale, missing);
      for (const d of DIFFICULTIES) {
        for (let i = 0; i < 8; i++) {
          const puzzle = getPuzzle(d, i);
          t(`puzzle.${puzzle.id}`);
          puzzle.entities.forEach((_, k) => entityName(t, puzzle, k));
          for (const text of rulesTexts(t, puzzle)) expect(text).not.toMatch(/[{}]/);
          puzzle.rules.forEach((rule, k) => {
            const v: CrossViolation | null =
              rule.kind === 'apart' ? { kind: 'apart', bank: 'left', rule: k, a: 0, b: 1 }
              : rule.kind === 'needs' ? { kind: 'needs', bank: 'right', rule: k, who: [0] }
              : rule.kind === 'outnumber' ? { kind: 'outnumber', bank: 'left', rule: k, group: 1, by: 2 }
              : { kind: 'boatApart', rule: k, a: 0, b: 1 };
            expect(violationText(t, puzzle, v)).not.toMatch(/[{}]/);
          });
          for (const v of violations) expect(violationText(t, puzzle, v)).not.toMatch(/[{}]/);
        }
      }
      expect(missing, locale).toEqual([]);
    }
  });

  it('renders the game in every locale for a puzzle of each difficulty', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const difficulty of DIFFICULTIES) {
        const { ctx, root } = start({ locale, seed: 4, difficulty });
        expect(ctx.missingKeys, `${locale}/${difficulty}`).toEqual([]);
        expect(root.textContent).not.toMatch(/\{[a-zA-Z]+\}/);
      }
    }
  });
});
