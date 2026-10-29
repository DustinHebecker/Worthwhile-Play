// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { GameContext, GameInstance, GameModule, GameResult } from '@wp/game-core';
import type { SupportedLocale } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { atlasSync } from '../src/data';
import { matches } from '../src/view-mystery';
import type { AtlasState, CompareItem, FindItem, MysteryItem, RouteItem } from '../src/state';

const LOCALES = ['en', 'de', 'ar', 'ja'] as const satisfies readonly SupportedLocale[];
const instances: GameInstance<AtlasState>[] = [];

beforeAll(async () => {
  for (const l of LOCALES) await game.preload!(l);
});

afterEach(() => {
  vi.useRealTimers();
  for (const i of instances.splice(0)) i.dispose();
  document.body.innerHTML = '';
});

function setup(mode: string, options: { seed?: number; locale?: SupportedLocale; difficulty?: string; region?: string } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const finished: GameResult[] = [];
  const context: GameContext = { ...ctx.context, finished: (r) => finished.push(r) };
  const instance = game.create(context);
  instances.push(instance);
  instance.newGame({ seed: options.seed ?? 7, difficulty: options.difficulty ?? 'easy', settings: { mode, region: options.region ?? 'world' } });
  const root = context.root;
  const el = <T extends Element = HTMLElement>(id: string) => root.querySelector<T & Element>(`[data-testid="${id}"]`);
  const click = (id: string) => (el<HTMLElement>(id) as HTMLElement).click();
  const state = () => instance.serialize();
  const phase = () => el<HTMLElement>('ae-root')?.dataset.phase;
  const item = <T>() => state().items[state().index] as T;
  return { ctx, instance, root, el, click, state, phase, item, finished };
}

const key = (target: Element, k: string) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  target.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true, cancelable: true }));
};

describe('Atlas Explorer view', () => {
  it('finds a place by keyboard: cursor, Enter sets the marker, Check reviews (target shown only after Check)', () => {
    vi.useFakeTimers();
    const g = setup('find');
    expect(g.phase()).toBe('find-question');
    const map = g.el<HTMLElement>('ae-map')!;
    expect(map.getAttribute('role')).toBe('application');
    expect(map.getAttribute('aria-roledescription')).toBe('map');
    expect(map.getAttribute('tabindex')).toBe('0');
    expect(map.getAttribute('dir')).toBe('ltr');
    // Before checking, nothing marks the target.
    expect(g.root.querySelector('.ae-target, .ae-m-target')).toBeNull();
    // Check without a marker only explains.
    const saves = g.ctx.saveRequests();
    g.click('ae-check');
    vi.advanceTimersByTime(50);
    expect(g.el('ae-announcer')?.textContent).toBe('Set your marker on the map first.');
    expect(g.phase()).toBe('find-question');
    // The keyboard cursor announces where it is after the key is released.
    map.focus();
    key(map, 'ArrowRight');
    vi.advanceTimersByTime(50);
    expect(g.el('ae-map-live')?.textContent).toMatch(/°/);
    key(map, 'Enter');
    expect(g.item<FindItem>().draft).not.toBeNull();
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    expect(g.el('ae-marker-status')?.textContent).toMatch(/^Your marker: /);
    g.click('ae-check');
    expect(g.phase()).toBe('find-review');
    const f = g.item<FindItem>();
    expect(f.band).not.toBeNull();
    expect(g.el('ae-verdict')?.textContent).toContain(['On target', 'Close', 'On the right track', 'Further away'][f.band!]);
    expect(g.root.querySelector('.ae-target, .ae-m-target')).not.toBeNull();
    expect(document.activeElement?.id).toBe('ae-review-heading');
    expect(g.ctx.missingKeys).toEqual([]);
    vi.useRealTimers();
  });

  it('compares: choose, check, explain; the options are real radio inputs', () => {
    const g = setup('compare', { seed: 3 });
    expect(g.phase()).toBe('compare-question');
    const opt = g.el<HTMLInputElement>('ae-opt-0')!;
    expect(opt.type).toBe('radio');
    opt.checked = true;
    opt.dispatchEvent(new Event('change'));
    expect(g.item<CompareItem>().draft).toBe(0);
    g.click('ae-check');
    expect(g.phase()).toBe('compare-review');
    expect(g.item<CompareItem>().answer).toBe(0);
    expect(g.el('ae-verdict')?.textContent).toMatch(/matches the map|The map says/);
    expect(g.el('ae-explain')?.textContent?.length).toBeGreaterThan(10);
    expect(g.ctx.missingKeys).toEqual([]);
  });

  it('mystery: more clues on request, a type-ahead list, a wrong guess stays, Show me ends it', () => {
    const g = setup('mystery', { seed: 5 });
    expect(g.phase()).toBe('mystery-question');
    const m0 = g.item<MysteryItem>();
    expect(g.root.querySelectorAll('[data-testid^="ae-clue-"]').length).toBeGreaterThanOrEqual(1);
    g.click('ae-next-clue');
    expect(g.item<MysteryItem>().shown).toBe(m0.shown + 1);
    // Type a country that is not the answer and choose it from the list.
    const wrong = atlasSync().countries.find((c) => c.id !== m0.target && c.id === 'FR') ?? atlasSync().countries.find((c) => c.id !== m0.target)!;
    const search = g.el<HTMLInputElement>('ae-search')!;
    search.value = 'fran';
    search.dispatchEvent(new Event('input'));
    const option = g.el<HTMLElement>(`ae-listopt-${wrong.id}`);
    expect(option).not.toBeNull();
    option!.click();
    g.click('ae-guess');
    const m1 = g.item<MysteryItem>();
    if (m0.target !== wrong.id) {
      expect(m1.guesses).toEqual([wrong.id]);
      expect(g.phase()).toBe('mystery-question');
      expect(g.el('ae-guesses')?.textContent).toContain('Not France.');
    }
    g.click('ae-skip');
    expect(g.phase()).toBe('mystery-review');
    expect(g.item<MysteryItem>().end).toBe(m0.target === wrong.id ? 'solved' : 'shown');
    expect(g.ctx.missingKeys).toEqual([]);
  });

  it('matches typed names ignoring case and accents', () => {
    const c = new Intl.Collator('fr', { sensitivity: 'base', usage: 'search' });
    expect(matches(c, 'Égypte', 'egy')).toBe(true);
    expect(matches(c, 'Côte d’Ivoire', 'cote')).toBe(true);
    expect(matches(c, 'France', 'zz')).toBe(false);
  });

  it('route: neighbour buttons move, Back undoes, Show a shortest route reviews', () => {
    const g = setup('route', { seed: 11 });
    expect(g.phase()).toBe('route-question');
    const r0 = g.item<RouteItem>();
    const first = g.root.querySelector<HTMLButtonElement>('[data-testid^="ae-nb-"]')!;
    const id = first.dataset.testid!.slice('ae-nb-'.length);
    first.click();
    expect(g.item<RouteItem>().path).toEqual([r0.from, id]);
    if (id !== r0.to) {
      g.click('ae-back');
      expect(g.item<RouteItem>().path).toEqual([r0.from]);
      g.click('ae-skip');
    }
    expect(g.phase()).toBe('route-review');
    expect(g.el('ae-best-route')).not.toBeNull();
    expect(g.ctx.missingKeys).toEqual([]);
  });

  it('a round ends in a summary, reports finished() once, also after a restore', () => {
    const g = setup('mixed', { seed: 2 });
    for (let i = 0; i < 6; i++) {
      g.click('ae-skip');
      g.click(i === 5 ? 'ae-summary-btn' : 'ae-next');
    }
    expect(g.phase()).toBe('summary');
    expect(g.el('ae-summary-list')?.children.length).toBe(6);
    expect(g.finished).toHaveLength(1);
    expect(g.finished[0]!.outcome).toBe('completed');
    const saved = g.instance.serialize();
    expect(saved.reported).toBe(true);
    g.instance.restore(saved);
    expect(g.finished).toHaveLength(1);
  });

  it('save and restore mid-item keeps the marker and the clues', () => {
    const g = setup('mystery', { seed: 9 });
    g.click('ae-next-clue');
    const saved = JSON.parse(JSON.stringify(g.instance.serialize())) as AtlasState;
    expect(game.isValidState(saved)).toBe(true);
    const h2 = setup('find');
    h2.instance.restore(saved);
    expect(h2.phase()).toBe('mystery-question');
    expect(h2.state()).toEqual(saved);
  });

  it('in Arabic the page is right-to-left but the map is not mirrored; German and Japanese render without missing keys', () => {
    for (const locale of LOCALES) {
      const g = setup('mixed', { locale, seed: 4 });
      const rootEl = g.el<HTMLElement>('ae-root')!;
      expect(rootEl.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      expect(g.el<HTMLElement>('ae-map')!.getAttribute('dir')).toBe('ltr');
      for (let i = 0; i < 6; i++) {
        g.click('ae-skip');
        g.click(i === 5 ? 'ae-summary-btn' : 'ae-next');
      }
      expect(g.ctx.missingKeys).toEqual([]);
    }
    const de = setup('find', { locale: 'de' });
    expect(de.el('ae-check')?.textContent).toBe('Prüfen');
    expect(de.el('ae-note')?.textContent).toContain('gemeinfrei');
  });

  it('gives each map its own pattern ids (several maps on one page)', () => {
    const a = setup('find');
    const b = setup('find');
    const ids = (r: HTMLElement) => [...r.querySelectorAll('pattern')].map((p) => p.id);
    expect(ids(a.root).length).toBeGreaterThan(0);
    expect(ids(a.root).some((id) => ids(b.root).includes(id))).toBe(false);
  });

  it('remembers the distance unit as a device preference, never in the state', () => {
    const g = setup('find');
    const before = g.state();
    const mi = g.el<HTMLInputElement>('ae-pref-unit-mi')!;
    mi.checked = true;
    mi.dispatchEvent(new Event('change'));
    expect(g.ctx.preferences.get('unit')).toBe('mi');
    expect(g.state()).toEqual(before);
  });

  it('ignores input while paused', () => {
    const g = setup('compare', { seed: 3 });
    g.instance.pause();
    const before = g.state();
    g.click('ae-skip');
    expect(g.state()).toEqual(before);
    g.instance.resume();
    g.click('ae-skip');
    expect(g.phase()).toBe('compare-review');
  });

  it('reads directions off the map across the date line and says when the shortest way crosses it', () => {
    const g = setup('find');
    const s = g.state();
    // Target 150° W (Alaska), marker 170° E (Kamchatka): east on the map, the shortest way crosses the date line.
    const across: FindItem = { kind: 'find', target: { t: 'point', at: [-15000, 6000] }, draft: [17000, 6000], answer: null, km: null, band: null };
    g.instance.restore({ ...s, items: [across, ...s.items.slice(1)] });
    g.click('ae-check');
    const lines = [...g.root.querySelectorAll('[data-testid="ae-review-line"]')].map((e) => e.textContent ?? '');
    expect(lines[0]).toMatch(/^Your marker is about [\d,]+ km east of it\.$/);
    expect(lines[1]).toBe('The shortest way crosses the date line: on this map it leaves at one edge and comes back at the other.');
    // Without the date line in between, no such sentence.
    const plain: FindItem = { ...across, draft: [-12000, 6000] };
    g.instance.restore({ ...s, items: [plain, ...s.items.slice(1)] });
    g.click('ae-check');
    const lines2 = [...g.root.querySelectorAll('[data-testid="ae-review-line"]')].map((e) => e.textContent ?? '');
    expect(lines2[0]).toMatch(/^Your marker is about [\d,]+ km east of it\.$/);
    expect(lines2.join(' ')).not.toContain('date line');
  });

  it('keeps a mystery item saved before a data update consistent with its stored clues', () => {
    // Before Ceuta and Melilla were drawn (§ 26), Morocco had one neighbour; an open item keeps that clue.
    const g = setup('mystery');
    const s = g.state();
    const old: MysteryItem = { kind: 'mystery', target: 'MA', clues: [{ id: 'region', arg: 'africa' }, { id: 'nbCount', arg: '1' }, { id: 'nb', arg: 'DZ' }], shown: 3, guesses: ['ES', 'DZ'], draft: null, end: null };
    expect(game.isValidState({ ...s, items: [old, ...s.items.slice(1)] })).toBe(true);
    g.instance.restore({ ...s, items: [old, ...s.items.slice(1)] });
    expect(g.el('ae-guess-ES')?.querySelector('.ae-borders')).toBeNull();
    expect(g.el('ae-guess-DZ')?.querySelector('.ae-borders')).not.toBeNull();
    // Drawn today, the clue says two, and Spain's card says it borders Morocco.
    g.instance.restore({ ...s, items: [{ ...old, clues: [{ id: 'region', arg: 'africa' }, { id: 'nbCount', arg: '2' }, { id: 'nb', arg: 'DZ' }] }, ...s.items.slice(1)] });
    expect(g.el('ae-guess-ES')?.querySelector('.ae-borders')).not.toBeNull();
  });

  it('says "mostly" in the region clue of a transcontinental country', () => {
    const g = setup('mystery');
    const s = g.state();
    const turkey: MysteryItem = { kind: 'mystery', target: 'TR', clues: [{ id: 'region', arg: 'asia' }, { id: 'nb', arg: 'GR' }, { id: 'nb', arg: 'GE' }], shown: 1, guesses: [], draft: null, end: null };
    g.instance.restore({ ...s, items: [turkey, ...s.items.slice(1)] });
    expect(g.el('ae-clue-0')?.textContent).toBe('It lies mostly in Asia.');
    const peru: MysteryItem = { ...turkey, target: 'PE', clues: [{ id: 'region', arg: 'americas' }, { id: 'nb', arg: 'BO' }, { id: 'nb', arg: 'EC' }] };
    g.instance.restore({ ...s, items: [peru, ...s.items.slice(1)] });
    expect(g.el('ae-clue-0')?.textContent).toBe('It lies in the Americas.');
  });
});
