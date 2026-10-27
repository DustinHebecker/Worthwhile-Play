/**
 * View helpers of Sense of Time: titles and notes in the UI language, dates and durations bound to the locale, and
 * small DOM pieces (headings, `<bdi>` dates, source lists). No game state.
 */
import type { Translator } from '@wp/game-core';
import { h } from '@wp/ui';
import type { ContentText } from './content';
import { evOf, type Ev } from './data';
import { earthClock, formatDuration, formatRange, formatWhen, formatYear, int } from './format';

export interface Ui {
  readonly t: Translator;
  readonly locale: string;
  title(id: string): string;
  note(id: string): string;
  insight(pairId: string): string | undefined;
  /** How an event's date reads ("about 2560 BCE", "1405–1433", "1969"). */
  when(id: string): string;
  year(y: number): string;
  range(lo: number, hi: number): string;
  duration(years: number): string;
  clock(y: number): string;
  int(n: number): string;
  ev(id: string): Ev;
  heading(tag: 'h2' | 'h3', id: string, text: string): HTMLElement;
  /** A text with dates isolated for bidi (the whole text in one `<bdi>` keeps LTR numbers intact). */
  bdi(text: string, cls?: string): HTMLElement;
  /** A translated sentence whose parameters (dates, numbers, titles) are each isolated in `<bdi>`. */
  rich(key: string, params: Record<string, string>): HTMLElement;
  /** Note and sources of events, under a heading. */
  about(ids: readonly string[], headingKey: 'review.about' | 'review.aboutAll'): HTMLElement;
}

export function createUi(t: Translator, content: () => ContentText): Ui {
  const locale = t.locale;
  const tt = (key: string, params?: Record<string, string | number>) => t(key, params);
  const ui: Ui = {
    t,
    locale,
    title: (id) => content().events[id]?.[0] ?? id,
    note: (id) => content().events[id]?.[1] ?? '',
    insight: (id) => content().pairs[id],
    when: (id) => formatWhen({ ...evOf(id), kind: evOf(id).data.kind }, tt, locale),
    year: (y) => formatYear(y, tt, locale),
    range: (lo, hi) => formatRange(lo, hi, tt, locale),
    duration: (years) => formatDuration(years, tt, locale),
    clock: (y) => earthClock(y, tt, locale),
    int: (n) => int(n, locale),
    ev: evOf,
    heading: (tag, id, text) => h(tag, { id, tabindex: -1, class: 'tl-heading' }, text),
    bdi: (text, cls) => h('bdi', cls ? { class: cls } : {}, text),
    rich(key, params) {
      const marked: Record<string, string> = {};
      for (const k of Object.keys(params)) marked[k] = `\u0001${k}\u0001`;
      const parts = t(key, marked).split('\u0001');
      // Even parts are text, odd parts are parameter names.
      return h('span', {}, ...parts.map((part, i) => (i % 2 === 0 ? part : h('bdi', {}, params[part] ?? ''))));
    },
    about(ids, headingKey) {
      const box = h('details', { class: 'tl-about', 'data-testid': 'tl-about' }, h('summary', {}, h('h3', { class: 'tl-about-h' }, t(headingKey))));
      if (ids.length === 1) box.open = true;
      for (const id of ids) {
        const e = evOf(id);
        const sources = h('ul', { class: 'tl-sources', lang: 'en', dir: 'ltr' }, ...e.data.sources.map((s) => h('li', {}, s)));
        box.append(
          h(
            'div',
            { class: 'tl-about-item', 'data-testid': `tl-about-${id}` },
            ids.length > 1 ? h('p', { class: 'tl-about-title' }, h('strong', {}, ui.title(id)), ' · ', ui.bdi(ui.when(id))) : '',
            h('p', { class: 'tl-note', 'data-testid': 'tl-note' }, ui.note(id)),
            h('p', { class: 'tl-clock', 'data-testid': 'tl-clock' }, ui.clock(e.y)),
            h('p', { class: 'tl-sources-h' }, t('review.sources')),
            sources
          )
        );
      }
      return box;
    }
  };
  return ui;
}
