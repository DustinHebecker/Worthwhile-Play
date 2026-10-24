/**
 * Shared DOM helpers of the Probability Detective views: number formatting bound to the UI locale, hypothesis marks,
 * split bars and the belief controls (design § 12). DOM only; no game state.
 */
import { bcp47Tag, type Translator } from '@wp/game-core';
import { h } from '@wp/ui';
import { formatInt, formatPercent, formatPoints, formatWholePercent, sharePhrase } from './format';
import { toNumber, type Band, type Frac } from './rules';
import type { Difficulty } from './templates';
import type { Token } from './traps';

export const MARKS = ['●', '■', '▲'] as const;
export const BAND_MARKS: Record<Band, string> = { spot: '●●●', close: '●●○', off: '●○○', far: '○○○' };

export interface Ui {
  readonly t: Translator;
  readonly locale: string;
  pct(v: Frac | number): string;
  whole(p: number): string;
  int(n: number | bigint): string;
  points(v: Frac | number): string;
  /** A clue or base-rate number num/den in the style of the difficulty. */
  stated(num: number, den: number, difficulty: Difficulty): string;
  token(tok: Token, inTable?: boolean): string;
  /** Fills `{name}` placeholders with formatted tokens. */
  fill(text: string, tokens: Readonly<Record<string, Token>>): string;
  bdi(s: string, cls?: string): HTMLElement;
  mark(i: number): HTMLElement;
  named(name: string, i: number): HTMLElement;
  splitBar(b: readonly number[], ghost?: number, glyph?: string): HTMLElement;
  heading(tag: 'h2' | 'h3', id: string, label: string): HTMLElement;
  bandText(band: Band): string;
}

export function createUi(t: Translator): Ui {
  const locale = t.locale;
  const freq = (k: string, n: string) => t('freq', { k, n });
  const ui: Ui = {
    t,
    locale,
    pct: (v) => formatPercent(v, locale, (p) => t('pct.below', { p })),
    whole: (p) => formatWholePercent(p, locale),
    int: (n) => formatInt(n, locale),
    points: (v) => formatPoints(typeof v === 'number' ? v : toNumber(v), locale),
    stated(num, den, difficulty) {
      if (difficulty === 'easy' || den === 10) return freq(formatInt(num, locale), formatInt(den, locale));
      if (den === 1000 && num > 0 && num < 100 && 1000 % num === 0) return freq(formatInt(1, locale), formatInt(1000 / num, locale));
      return new Intl.NumberFormat(bcp47Tag(locale), { style: 'percent', maximumFractionDigits: 1 }).format(num / den);
    },
    token(tok, inTable = false) {
      switch (tok.t) {
        case 'int':
          return formatInt(tok.v, locale);
        case 'pct':
          return ui.pct(tok.v);
        case 'seq':
          return tok.bits.map((b) => (b === 1 ? '●' : '○')).join('');
        case 'share':
          return inTable
            ? t('table.share', { k: formatInt(tok.num, locale), n: formatInt(tok.den, locale), p: ui.pct(tok.num / tok.den) })
            : sharePhrase(tok.num, tok.den, locale, freq);
      }
    },
    fill: (text, tokens) => text.replace(/\{(\w+)\}/g, (m, name: string) => (tokens[name] ? ui.token(tokens[name]!) : m)),
    bdi: (s, cls) => h('bdi', cls ? { class: cls } : {}, s),
    mark: (i) => h('span', { class: `pd-mark pd-m${i}`, 'aria-hidden': 'true' }, MARKS[i] ?? ''),
    named: (name, i) => h('span', { class: 'pd-hyp' }, ui.mark(i), ' ', name),
    splitBar: (b, ghost, glyph = '◇') =>
      h(
        'div',
        { class: 'pd-split', 'aria-hidden': 'true' },
        ...b.map((x, i) => h('span', { class: `pd-seg pd-seg${i}`, style: `inline-size: ${x}%` })),
        ghost === undefined ? '' : h('span', { class: 'pd-ghost', style: `inset-inline-start: ${ghost}%` }, glyph)
      ),
    heading: (tag, id, label) => h(tag, { id, tabindex: -1, class: 'pd-heading' }, label),
    bandText: (band) => `${BAND_MARKS[band]} ${t(`band.${band}`)}`
  };
  return ui;
}

export interface BeliefOptions {
  readonly names: readonly string[];
  readonly draft: readonly number[];
  /** The share of the first hypothesis before this step (ghost marker ◇), two hypotheses only. */
  readonly before?: number;
  readonly paused: () => boolean;
  /** Sets the whole belief; `focus` is the id to focus after the re-render. */
  readonly set: (b: number[], focus: string) => void;
  /** Sets one share (three hypotheses, rebalancing). */
  readonly share: (i: number, v: number, focus: string) => void;
}

/** The belief controls: a range with − / + for two hypotheses, spinbuttons with − / + for three (design § 12). */
export function beliefControls(ui: Ui, o: BeliefOptions): HTMLElement[] {
  const { t, whole } = ui;
  const draft = o.draft;
  const controls: HTMLElement[] = [];
  if (draft.length === 2) {
    const range = h('input', {
      type: 'range',
      min: 0,
      max: 100,
      step: 1,
      class: 'pd-range',
      id: 'pd-range',
      'aria-label': t('belief.slider', { name: o.names[0]! }),
      'aria-valuetext': t('belief.valuetext', { a: o.names[0]!, pa: whole(draft[0]!), b: o.names[1]!, pb: whole(draft[1]!) }),
      'data-testid': 'pd-range'
    });
    range.value = String(draft[0]);
    let bar = ui.splitBar(draft, o.before);
    const values = h('p', { class: 'pd-values', 'data-testid': 'pd-values' }, `${MARKS[0]} ${whole(draft[0]!)} · ${MARKS[1]} ${whole(draft[1]!)}`);
    const preview = (v: number) => {
      const next = ui.splitBar([v, 100 - v], o.before);
      bar.replaceWith(next);
      bar = next;
      values.textContent = `${MARKS[0]} ${whole(v)} · ${MARKS[1]} ${whole(100 - v)}`;
      range.setAttribute('aria-valuetext', t('belief.valuetext', { a: o.names[0]!, pa: whole(v), b: o.names[1]!, pb: whole(100 - v) }));
    };
    range.addEventListener('input', () => preview(Number(range.value)));
    range.addEventListener('change', () => !o.paused() && o.set([Number(range.value), 100 - Number(range.value)], 'pd-range'));
    const minus = h('button', { type: 'button', class: 'pd-step', id: 'pd-minus', 'data-act': 'minus', 'data-testid': 'pd-minus', 'aria-label': t('belief.minus', { name: o.names[0]! }) }, '−');
    const plus = h('button', { type: 'button', class: 'pd-step', id: 'pd-plus', 'data-act': 'plus', 'data-testid': 'pd-plus', 'aria-label': t('belief.plus', { name: o.names[0]! }) }, '+');
    minus.addEventListener('click', () => !o.paused() && o.set([Math.max(0, draft[0]! - 1), Math.min(100, draft[1]! + 1)], 'pd-minus'));
    plus.addEventListener('click', () => !o.paused() && o.set([Math.min(100, draft[0]! + 1), Math.max(0, draft[1]! - 1)], 'pd-plus'));
    controls.push(
      h('div', { class: 'pd-ends' }, ui.named(o.names[0]!, 0), ui.named(o.names[1]!, 1)),
      h('div', { class: 'pd-barwrap' }, bar),
      values,
      h('div', { class: 'pd-slider-row' }, minus, range, plus)
    );
    return controls;
  }
  controls.push(h('div', { class: 'pd-barwrap' }, ui.splitBar(draft)));
  draft.forEach((x, i) => {
    const spin = h(
      'span',
      {
        role: 'spinbutton',
        tabindex: 0,
        class: 'pd-spin',
        'aria-label': t('belief.stepper', { name: o.names[i]! }),
        'aria-valuenow': x,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuetext': whole(x),
        id: `pd-spin-${i}`,
        'data-testid': `pd-spin-${i}`
      },
      whole(x)
    );
    const to = (v: number, focus = `pd-spin-${i}`) => !o.paused() && o.share(i, v, focus);
    spin.addEventListener('keydown', (e) => {
      const step = ({ ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 } as Record<string, number>)[e.key];
      if (step !== undefined) to(x + step);
      else if (e.key === 'Home') to(0);
      else if (e.key === 'End') to(100);
      else return;
      e.preventDefault();
    });
    const minus = h('button', { type: 'button', class: 'pd-step', id: `pd-minus-${i}`, 'data-act': i === 0 ? 'minus' : undefined, 'aria-label': t('belief.minus', { name: o.names[i]! }) }, '−');
    const plus = h('button', { type: 'button', class: 'pd-step', id: `pd-plus-${i}`, 'data-act': i === 0 ? 'plus' : undefined, 'data-testid': `pd-plus-${i}`, 'aria-label': t('belief.plus', { name: o.names[i]! }) }, '+');
    minus.addEventListener('click', () => to(x - 1, `pd-minus-${i}`));
    plus.addEventListener('click', () => to(x + 1, `pd-plus-${i}`));
    controls.push(h('div', { class: 'pd-three' }, ui.named(o.names[i]!, i), h('span', { class: 'pd-stepper' }, minus, spin, plus)));
  });
  const even = h('button', { type: 'button', class: 'pd-secondary', id: 'pd-even', 'data-testid': 'pd-even' }, t('belief.even'));
  even.addEventListener('click', () => !o.paused() && o.set([34, 33, 33], 'pd-even'));
  controls.push(even);
  return controls;
}
