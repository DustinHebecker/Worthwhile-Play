/**
 * View helpers of Pond & Meadow: names and texts in the UI language, amounts and weeks bound to the locale, sentences
 * generated from the model ("what happened"), and small DOM pieces. No game state.
 */
import type { Translator } from '@wp/game-core';
import { h } from '@wp/ui';
import { contentFor, type ChallengeText, type ContentText, type GoalText } from './content';
import { formatAmount, formatInt, formatPlural } from './format';
import { habitatDef, type Habitat } from './habitats';
import type { Action } from './model';
import type { Marks } from './score';
import { MARK_SYMBOLS } from './score';
import { classify, legs, type Shape } from './shape';

export interface Ui {
  readonly t: Translator;
  readonly locale: string;
  content(): ContentText;
  name(id: string): string;
  about(id: string): string;
  challenge(id: string): ChallengeText;
  goal(id: string): GoalText;
  amount(u: number): string;
  int(n: number): string;
  weeks(n: number): string;
  shapeName(s: Shape, fromZero: boolean): string;
  marks(m: Marks): string;
  /**
   * A translated text holding mark symbols (●●○): each symbol stays visible but is hidden from screen readers, which
   * read the verdict word instead ("Close").
   */
  marked(text: string): HTMLElement;
  /** A logged change in words ("Runoff: high"). */
  action(habitat: Habitat, a: Action): string;
  /** "Algae: down from 250 to 68 by week 6; week 26: 68." from the zigzag legs of a series. */
  happened(name: string, v: readonly number[]): string;
  heading(tag: 'h2' | 'h3', id: string, text: string): HTMLElement;
  /** A translated sentence whose parameters are each isolated in `<bdi>` (numbers and names stay intact in RTL). */
  rich(key: string, params: Record<string, string>): HTMLElement;
}

const MARK_OF: Readonly<Record<string, Marks>> = Object.fromEntries(Object.entries(MARK_SYMBOLS).map(([m, sym]) => [sym, Number(m) as Marks]));
/** Splits a text at the mark symbols, keeping them (odd indexes). */
const MARK_PATTERN = new RegExp(`(${Object.values(MARK_SYMBOLS).join('|')})`, 'u');

export function createUi(t: Translator): Ui {
  const locale = t.locale;
  const content = () => contentFor(locale);
  const ui: Ui = {
    t,
    locale,
    content,
    name: (id) => content().species[id]?.name ?? t(`pool.${id}`),
    about: (id) => content().species[id]?.about ?? '',
    challenge: (id) => content().challenges[id]!,
    goal: (id) => content().goals[id]!,
    amount: (u) => formatAmount(u, locale),
    int: (n) => formatInt(n, locale),
    weeks: (n) => formatPlural(content().weeks, n, locale),
    shapeName: (s, fromZero) => (fromZero && (s === 'steady' || s === 'rises' || s === 'rise-fall') ? t(`shape0.${s}`) : t(`shape.${s}`)),
    marks: (m) => `${MARK_SYMBOLS[m]} ${t(`verdict.${m}`)}`,
    marked(text) {
      const parts = text.split(MARK_PATTERN);
      return h(
        'span',
        {},
        ...parts.map((part, i) => {
          const m = i % 2 === 1 ? MARK_OF[part] : undefined;
          return m === undefined ? part : h('span', { class: 'eco-marks' }, h('span', { 'aria-hidden': 'true' }, part), h('span', { class: 'sr-only' }, t(`verdict.${m}`)));
        })
      );
    },
    action(habitat, a) {
      switch (a.kind) {
        case 'add':
          return t('act.add', { name: ui.name(a.species ?? '') });
        case 'remove':
          return t('act.remove', { name: ui.name(a.species ?? ''), share: t(`share.${a.share ?? 100}`) });
        case 'mow':
          return t(`act.mow-${a.cuttings === 'leave' ? 'leave' : 'remove'}`);
        case 'set': {
          const c = habitatDef(habitat).conditions[a.cond ?? 0]!;
          return t('act.set', { cond: t(`cond.${c.id}`), level: t(`level.${c.id}.${c.levels[a.level ?? 0]}`) });
        }
        default:
          return t(`act.${a.kind}`);
      }
    },
    happened(name, v) {
      const last = v.length - 1;
      if (v.length === 0 || Math.max(...v) === 0) return t('happened.gone', { name });
      const cls = classify(v);
      if (cls === 'vanishes') {
        const gone = v.findIndex((_, i) => i > 0 && v.slice(i).every((y) => y === 0));
        return t('happened.vanished', { name, w: ui.int(gone) });
      }
      const L = legs(v);
      if (L.length === 0) return t('happened.flat', { name, v: ui.amount(v[last]!) });
      const parts = L.map((l) => t(l.dir > 0 ? 'happened.up' : 'happened.down', { a: ui.amount(l.from), b: ui.amount(l.to), w: ui.int(l.toWeek) }));
      return t('happened.legs', { name, legs: parts.join(t('happened.then')), w: ui.int(last), v: ui.amount(v[last]!) });
    },
    heading: (tag, id, text) => h(tag, { id, tabindex: -1, class: 'eco-heading' }, text),
    rich(key, params) {
      const marked: Record<string, string> = {};
      for (const k of Object.keys(params)) marked[k] = `\u0001${k}\u0001`;
      const parts = t(key, marked).split('\u0001');
      return h('span', {}, ...parts.map((part, i) => (i % 2 === 0 ? part : h('bdi', {}, params[part] ?? ''))));
    }
  };
  return ui;
}
