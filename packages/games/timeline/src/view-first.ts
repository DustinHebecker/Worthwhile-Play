/**
 * "Which came first?" (design § 9): two events, a radio choice and — on medium and hard, when it is fair — the gap
 * as one of four rungs; then both dates, the gap, the curated insight, the notes and sources.
 */
import { h } from '@wp/ui';
import { fitYears } from './axis';
import type { AxisMark } from './axis-view';
import { formatGap } from './format';
import { checkFirst, chooseFirst, chooseGap, earlierOf, firstRight, gapResult, type FirstItem } from './rules';
import type { Host, Screen } from './view-host';

/** The first answer's verdict sentence. */
export function firstVerdict(host: Host, item: FirstItem): string {
  const { t, ui } = host;
  const title = ui.title(item[earlierOf(item)]);
  const right = firstRight(item);
  if (right === null) return t('first.skipped', { title });
  return t(right ? 'first.right' : 'first.wrong', { title });
}

const radio = (name: string, id: string, checked: boolean, label: HTMLElement | string, onChange: () => void) => {
  const input = h('input', { type: 'radio', name, id, 'data-testid': id });
  input.checked = checked;
  input.addEventListener('change', () => input.checked && onChange());
  return h('label', { class: 'tl-choice', for: id }, input, h('span', { class: 'tl-choice-text' }, label));
};

export function firstScreen(host: Host, item: FirstItem): Screen {
  const { t, ui } = host;
  const card: HTMLElement[] = [host.header(item, t('first.prompt'))];
  const symbols = { a: '●', b: '■' } as const;

  if (item.answer === null) {
    const tt = (key: string, p?: Record<string, string | number>) => t(key, p);
    const q1 = h('fieldset', { class: 'tl-fieldset', 'data-testid': 'tl-first' }, h('legend', {}, t('first.prompt')));
    for (const side of ['a', 'b'] as const) {
      q1.append(
        radio('tl-first', `tl-first-${side}`, item.draft.first === side, h('span', {}, h('span', { 'aria-hidden': 'true', class: 'tl-sym' }, `${symbols[side]} `), ui.title(item[side])), () => {
          if (!host.paused()) host.commit(chooseFirst(host.state(), side), `tl-first-${side}`);
        })
      );
    }
    card.push(q1);
    if (item.gaps.length) {
      const q2 = h('fieldset', { class: 'tl-fieldset', 'data-testid': 'tl-gap' }, h('legend', {}, t('first.gapPrompt')));
      item.gaps.forEach((g, i) => {
        q2.append(
          radio('tl-gap', `tl-gap-${i}`, item.draft.gap === g, formatGap(g, tt, ui.locale), () => {
            if (!host.paused()) host.commit(chooseGap(host.state(), g), `tl-gap-${i}`);
          })
        );
      });
      card.push(q2);
    }
    const check = h('button', { type: 'button', class: 'tl-primary', 'data-testid': 'tl-check' }, t('action.check'));
    check.addEventListener('click', () => {
      if (host.paused()) return;
      const s = host.state();
      const cur = s.items[s.index] as FirstItem;
      if (cur.draft.first === null) return host.announce(t('first.needAnswer'));
      if (cur.gaps.length && cur.draft.gap === null) return host.announce(t('first.needGap'));
      const next = checkFirst(s);
      host.commit(next, 'tl-review-heading', firstVerdict(host, next.items[next.index] as FirstItem));
    });
    card.push(h('div', { class: 'tl-actions tl-sticky' }, check, host.skipButton()));
    return { card, scene: { mode: 'explore', ariaLabel: t('axis.label') }, fit: null };
  }

  // Review.
  const a = ui.ev(item.a);
  const b = ui.ev(item.b);
  card.push(ui.heading('h3', 'tl-review-heading', t('review.heading')), h('p', { class: 'tl-verdict', 'data-testid': 'tl-verdict' }, firstVerdict(host, item)));
  const [earlier, later] = earlierOf(item) === 'a' ? (['a', 'b'] as const) : (['b', 'a'] as const);
  for (const side of [earlier, later]) card.push(h('p', { 'data-testid': `tl-date-${side}` }, h('span', { 'aria-hidden': 'true' }, `${symbols[side]} `), ui.rich('first.date', { title: ui.title(item[side]), date: ui.when(item[side]) })));
  card.push(h('p', { 'data-testid': 'tl-between' }, ui.rich('first.between', { duration: ui.duration(Math.abs(b.y - a.y)) })));
  const gr = gapResult(item);
  if (gr) card.push(h('p', { 'data-testid': 'tl-gap-result' }, t(gr === 'right' ? 'first.gapRight' : gr === 'near' ? 'first.gapNear' : 'first.gapFar')));
  const insight = item.pair ? ui.insight(item.pair) : undefined;
  if (insight) card.push(h('p', { class: 'tl-insight', 'data-testid': 'tl-insight' }, h('strong', {}, `${t('first.insight')} `), insight));
  card.push(ui.about([item[earlier], item[later]], 'review.aboutAll'), h('div', { class: 'tl-actions tl-sticky' }, host.nextButton()));
  const marks: AxisMark[] = (['a', 'b'] as const).map((side) => ({ y: ui.ev(item[side]).y, symbol: symbols[side], label: ui.title(item[side]), style: 'option' }));
  return {
    card,
    scene: {
      mode: 'explore',
      marks,
      ranges: [a, b].filter((e) => e.lo !== e.hi).map((e) => ({ lo: e.lo, hi: e.hi, label: ui.when(e.id), style: 'true' as const })),
      ariaLabel: `${t('axis.label')}. ${firstVerdict(host, item)}`
    },
    fit: fitYears(Math.min(a.lo, b.lo), Math.max(a.hi, b.hi), 0.2)
  };
}
