/**
 * "Same time?" (design § 10): a focus event with its date and three options; which one lies within about τ of it?
 * The review draws the window as a bracket and explains every option in words.
 */
import { h } from '@wp/ui';
import { fitYears } from './axis';
import type { AxisMark } from './axis-view';
import { windowOf } from './generate';
import { checkTogether, chooseOption, togetherRight, type TogetherItem } from './rules';
import { Y_MAX } from './time';
import type { Host, Screen } from './view-host';

/** Symbols of the three options (never colour alone). */
export const OPTION_SYMBOLS = ['●', '■', '▲'] as const;

export function togetherVerdict(host: Host, item: TogetherItem): string {
  const { t, ui } = host;
  const title = ui.title(item.options[item.correct]!);
  const right = togetherRight(item);
  if (right === null) return t('together.skipped', { title });
  return right ? t('together.right', { title }) : t('together.wrong', { title });
}

export function togetherScreen(host: Host, item: TogetherItem): Screen {
  const { t, ui } = host;
  const focus = ui.ev(item.focus);
  const tau = ui.duration(item.tau);
  const card: HTMLElement[] = [host.header(item, t('together.focus', { date: ui.when(item.focus), title: ui.title(item.focus) }))];

  if (item.answer === null) {
    const fs = h('fieldset', { class: 'tl-fieldset', 'data-testid': 'tl-options' }, h('legend', {}, t('together.prompt', { tau })));
    item.options.forEach((id, i) => {
      const input = h('input', { type: 'radio', name: 'tl-option', id: `tl-opt-${i}`, 'data-testid': `tl-opt-${i}` });
      input.checked = item.draft === i;
      input.addEventListener('change', () => input.checked && !host.paused() && host.commit(chooseOption(host.state(), i), `tl-opt-${i}`));
      fs.append(h('label', { class: 'tl-choice', for: `tl-opt-${i}` }, input, h('span', { class: 'tl-choice-text' }, h('span', { class: 'tl-sym', 'aria-hidden': 'true' }, `${OPTION_SYMBOLS[i]} `), ui.title(id))));
    });
    card.push(fs);
    const check = h('button', { type: 'button', class: 'tl-primary', 'data-testid': 'tl-check' }, t('action.check'));
    check.addEventListener('click', () => {
      if (host.paused()) return;
      const s = host.state();
      if ((s.items[s.index] as TogetherItem).draft === null) return host.announce(t('first.needAnswer'));
      const next = checkTogether(s);
      host.commit(next, 'tl-review-heading', togetherVerdict(host, next.items[next.index] as TogetherItem));
    });
    card.push(h('div', { class: 'tl-actions tl-sticky' }, check, host.skipButton()));
    return {
      card,
      scene: { mode: 'explore', marks: [{ y: focus.y, symbol: '★', label: ui.title(item.focus), style: 'focus' }], ariaLabel: t('axis.label') },
      fit: null
    };
  }

  // Review.
  const raw = windowOf(focus, item.tau);
  // The timeline ends in 2020: a window reaching past it is shown up to there.
  const w = { lo: raw.lo, hi: Math.min(raw.hi, Y_MAX) };
  card.push(ui.heading('h3', 'tl-review-heading', t('review.heading')), h('p', { class: 'tl-verdict', 'data-testid': 'tl-verdict' }, togetherVerdict(host, item)));
  card.push(h('p', { 'data-testid': 'tl-window-line' }, ui.rich('together.window', { range: ui.range(w.lo, w.hi), date: ui.when(item.focus), tau })));
  const lines = h('ul', { class: 'tl-option-lines', 'data-testid': 'tl-option-lines' });
  item.options.forEach((id, i) => {
    const e = ui.ev(id);
    const inside = e.hi >= raw.lo && e.lo <= raw.hi;
    const relation = e.hi < focus.lo ? t('together.earlier', { duration: ui.duration(focus.y - e.y) }) : e.lo > focus.hi ? t('together.later', { duration: ui.duration(e.y - focus.y) }) : t('together.overlap');
    lines.append(h('li', { 'data-inside': inside ? 'yes' : 'no' }, ui.rich(inside ? 'together.inside' : 'together.outside', { symbol: OPTION_SYMBOLS[i]!, title: ui.title(id), date: ui.when(id), relation })));
  });
  card.push(lines, ui.about([item.focus, ...item.options], 'review.aboutAll'), h('div', { class: 'tl-actions tl-sticky' }, host.nextButton()));
  const marks: AxisMark[] = [
    { y: focus.y, symbol: '★', label: ui.title(item.focus), style: 'focus' },
    ...item.options.map((id, i): AxisMark => ({ y: ui.ev(id).y, symbol: OPTION_SYMBOLS[i]!, label: ui.title(id), style: 'option' }))
  ];
  const ys = [w.lo, w.hi, ...item.options.map((id) => ui.ev(id).y)];
  return {
    card,
    scene: { mode: 'explore', marks, ranges: [{ lo: w.lo, hi: w.hi, label: t('axis.window', { tau }), style: 'window' }], ariaLabel: `${t('axis.label')}. ${togetherVerdict(host, item)}` },
    fit: fitYears(Math.min(...ys), Math.max(...ys), 0.15)
  };
}
