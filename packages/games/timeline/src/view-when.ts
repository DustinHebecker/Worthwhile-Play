/**
 * "When was it?" (design § 7): place the marker on the timeline or type a number with its unit — two views of one
 * value — then a review with the distance (marks plus words), the accepted range, the note, the Earth-day clock and
 * the sources.
 */
import { h } from '@wp/ui';
import { fitYears } from './axis';
import type { AxisMark } from './axis-view';
import { entryText, parseNumber } from './format';
import { checkWhen, setWhenDraft, type WhenItem } from './rules';
import { BAND_MARKS, scoreYear } from './score';
import { ENTRY_UNITS, entryToYear, yearToEntry, type EntryUnit } from './time';
import type { Host, Screen } from './view-host';

/** What the typed text means: a year, or the reason it cannot be read. */
export function readEntry(host: Host, text: string, unit: EntryUnit): { y: number | null; message: string | null } {
  const p = parseNumber(text, host.ui.locale);
  if (!p.ok) return { y: null, message: p.reason === 'empty' ? null : host.t(p.reason === 'zero' ? 'when.zero' : 'when.invalid') };
  const r = entryToYear(p.value, unit, host.nowYear);
  if (!r.ok) return { y: null, message: host.t(r.reason === 'zero' ? 'when.zero' : r.reason === 'tooRecent' ? 'when.tooRecent' : 'when.tooOld') };
  return { y: r.y, message: null };
}

/** The verdict sentence of a checked item: marks plus words, and the direction and distance. */
export function whenVerdict(host: Host, item: WhenItem): string {
  const { t, ui } = host;
  if (item.answer === 'skip' || item.answer === null || item.band === null) return t('when.skipped');
  const head = `${BAND_MARKS[item.band]} ${t(`band.${item.band}`)}`;
  if (item.band === 0) return head;
  const e = ui.ev(item.event);
  const s = scoreYear(item.answer, e.lo, e.hi);
  if (s.off === 0) return head;
  return `${head}. ${t(s.signed > 0 ? 'when.tooOldBy' : 'when.tooRecentBy', { duration: ui.duration(s.off) })}`;
}

function anchorMarks(host: Host, item: WhenItem): AxisMark[] {
  return item.anchors.map((id) => ({ y: host.ui.ev(id).y, symbol: '▲', label: `${host.ui.title(id)}, ${host.ui.when(id)}`, style: 'anchor' }));
}

export function whenScreen(host: Host, item: WhenItem): Screen {
  const { t, ui } = host;
  const e = ui.ev(item.event);
  const title = ui.title(item.event);
  const card: HTMLElement[] = [host.header(item, title)];
  const anchors = anchorMarks(host, item);

  if (item.answer === null) {
    card.push(h('p', { class: 'tl-prompt' }, t(e.data.kind === 'span' ? 'when.promptSpan' : 'when.prompt')));
    card.push(h('p', { class: 'tl-hint' }, t('when.instructions')));
    const input = h('input', { id: 'tl-year', type: 'text', inputmode: 'decimal', autocomplete: 'off', class: 'tl-year', 'data-testid': 'tl-year', maxlength: 24, dir: 'ltr' });
    input.value = item.draft.text;
    const select = h('select', { id: 'tl-unit', class: 'tl-unit', 'data-testid': 'tl-unit' });
    for (const u of ENTRY_UNITS) {
      const opt = h('option', { value: u }, t(`unit.${u}`));
      opt.selected = u === item.draft.unit;
      select.append(opt);
    }
    const means = h('p', { class: 'tl-means', 'data-testid': 'tl-means', 'aria-live': 'polite' });
    const showMeans = (text: string, unit: EntryUnit, y: number | null) => {
      const r = readEntry(host, text, unit);
      if (r.message) {
        means.textContent = r.message;
        means.dataset.state = 'invalid';
      } else {
        means.textContent = y !== null ? t('when.means', { date: ui.year(y) }) : t('when.noAnswer');
        means.dataset.state = y !== null ? 'ok' : 'empty';
      }
    };
    showMeans(item.draft.text, item.draft.unit, item.draft.y);
    input.addEventListener('input', () => {
      if (host.paused()) return;
      const unit = select.value as EntryUnit;
      const r = readEntry(host, input.value, unit);
      // Invalid input keeps the last valid answer (§ 7.2).
      const y = r.y ?? (r.message ? item.draft.y : input.value.trim() === '' ? null : item.draft.y);
      host.update(setWhenDraft(host.state(), { y, unit, text: input.value }));
      host.axis.show({ mode: 'place', value: y, marks: anchors, ariaLabel: t('axis.label') });
      showMeans(input.value, unit, y);
    });
    select.addEventListener('change', () => {
      if (host.paused()) return;
      const unit = select.value as EntryUnit;
      // Switching the unit re-reads the typed number (it does not convert it).
      const r = readEntry(host, input.value, unit);
      host.commit(setWhenDraft(host.state(), { y: r.y ?? item.draft.y, unit, text: input.value }), 'tl-unit');
    });
    card.push(
      h(
        'div',
        { class: 'tl-entry' },
        h('label', { class: 'tl-field', for: 'tl-year' }, t('when.field')),
        h('div', { class: 'tl-entry-row' }, input, h('label', { class: 'sr-only', for: 'tl-unit' }, t('when.unit')), select),
        means
      )
    );
    const check = h('button', { type: 'button', class: 'tl-primary', 'data-testid': 'tl-check', 'aria-disabled': item.draft.y === null ? 'true' : 'false' }, t('action.check'));
    check.addEventListener('click', () => {
      if (host.paused()) return;
      const s = host.state();
      const cur = s.items[s.index] as WhenItem;
      if (cur.draft.y === null) {
        host.announce(t('when.needAnswer'));
        return;
      }
      const next = checkWhen(s);
      host.commit(next, 'tl-review-heading', whenVerdict(host, next.items[next.index] as WhenItem));
    });
    card.push(h('div', { class: 'tl-actions tl-sticky' }, check, host.skipButton()));
    return {
      card,
      scene: { mode: 'place', value: item.draft.y, marks: anchors, ariaLabel: t('axis.label') },
      fit: null,
      onPlace(y, via) {
        if (host.paused()) return;
        const entry = yearToEntry(y, host.nowYear);
        const next = setWhenDraft(host.state(), { y, unit: entry.unit, text: entryText(entry.value, entry.unit, ui.locale) });
        host.commit(next, null, via === 'pointer' ? t('when.placed', { date: ui.year(y) }) : undefined);
      }
    };
  }

  // Review.
  const verdict = h('p', { class: 'tl-verdict', 'data-testid': 'tl-verdict', 'data-band': item.band ?? 'skip' }, whenVerdict(host, item));
  card.push(ui.heading('h3', 'tl-review-heading', t('review.heading')), verdict);
  if (typeof item.answer === 'number') card.push(h('p', { 'data-testid': 'tl-your-answer' }, ui.rich('when.answerIs', { date: ui.year(item.answer) })));
  card.push(h('p', { 'data-testid': 'tl-date' }, ui.rich('when.exact', { date: ui.when(item.event) })));
  if (e.lo !== e.hi) card.push(h('p', { 'data-testid': 'tl-range-line' }, ui.rich(e.data.kind === 'span' ? 'when.span' : 'when.range', { range: ui.range(e.lo, e.hi) })));
  card.push(ui.about([item.event], 'review.about'), h('div', { class: 'tl-actions tl-sticky' }, host.nextButton()));
  const marks: AxisMark[] = [...anchors, { y: e.y, symbol: '●', label: `${title}, ${ui.when(item.event)}`, style: 'target' }];
  if (typeof item.answer === 'number') marks.push({ y: item.answer, symbol: '◆', label: t('when.yourAnswer'), style: 'guess' });
  const a = typeof item.answer === 'number' ? Math.min(item.answer, e.lo) : e.lo;
  const b = typeof item.answer === 'number' ? Math.max(item.answer, e.hi) : e.hi;
  return {
    card,
    scene: { mode: 'explore', marks, ranges: [{ lo: e.lo, hi: e.hi, label: ui.when(item.event), style: 'true' }], ariaLabel: `${t('axis.label')}. ${verdict.textContent}` },
    fit: fitYears(a, b, 0.25)
  };
}
