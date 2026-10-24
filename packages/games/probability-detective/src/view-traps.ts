/** Mode "Thinking traps": the puzzle, its questions and the visual explanation (design § 8, § 11.5). */
import { h } from '@wp/ui';
import { contentFor, type TrapText } from './content';
import { checkTrap, isReview, reviewTrap, setTrapDraft, toNumber, trapQuestions, type TrapCase } from './rules';
import { diceCount, trapById, type ExplainSpec, type Token, type TrapQuestion } from './traps';
import type { Ui } from './ui';
import type { Host } from './view-host';

export const trapText = (locale: string, c: TrapCase): TrapText => contentFor(locale).traps[c.template]!;

const SVG_NS = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, ...children: (SVGElement | string)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  for (const child of children) el.append(child);
  return el;
}

/** The explanation visual of a trap (design § 11.5). Every visual has a text equivalent. */
export function trapVisual(ui: Ui, spec: ExplainSpec, text: TrapText, tokens: Readonly<Record<string, Token>>): HTMLElement {
  const { t } = ui;
  const label = (id: string) => text.labels[id] ?? id;
  switch (spec.kind) {
    case 'board':
      return h(
        'div',
        { class: 'pd-visual', 'data-visual': 'board' },
        h('p', {}, t('board.imagine', { n: ui.int(spec.total) })),
        h(
          'ul',
          { class: 'pd-groups' },
          ...spec.groups.map((g) =>
            h(
              'li',
              {},
              h('span', {}, t('board.row', { label: label(g.id), count: ui.int(g.count), fitLabel: label('fit'), fit: ui.int(g.fit) })),
              h(
                'span',
                { class: 'pd-axis pd-axis--fill', 'aria-hidden': 'true' },
                h('span', { class: 'pd-fill', style: `width: ${g.count === 0 ? 0 : Math.max(0.5, (100 * g.fit) / g.count)}%` })
              )
            )
          )
        )
      );
    case 'grid': {
      const [s1, s2] = spec.sums;
      const size = 26;
      const cells: SVGElement[] = [];
      for (let a = 1; a <= 6; a++)
        for (let b = 1; b <= 6; b++) {
          const s = a + b;
          const cls = s === s1 ? 'pd-cell pd-cell--a' : s === s2 ? 'pd-cell pd-cell--b' : 'pd-cell';
          cells.push(svg('rect', { x: (b - 1) * size + 1, y: (a - 1) * size + 1, width: size - 2, height: size - 2, class: cls, rx: 2 }));
          cells.push(svg('text', { x: (b - 1) * size + size / 2, y: (a - 1) * size + size / 2 + 4, 'text-anchor': 'middle', class: s === s1 || s === s2 ? 'pd-cell-text pd-cell-text--strong' : 'pd-cell-text' }, ui.int(s)));
        }
      const caption = t('grid.caption', { c1: ui.int(diceCount(s1)), s1: ui.int(s1), c2: ui.int(diceCount(s2)), s2: ui.int(s2) });
      return h(
        'figure',
        { class: 'pd-visual pd-ltr', 'data-visual': 'grid' },
        svg('svg', { viewBox: `0 0 ${6 * size} ${6 * size}`, class: 'pd-grid', role: 'img', 'aria-label': caption }, ...cells) as unknown as HTMLElement,
        h('figcaption', {}, caption)
      );
    }
    case 'table':
      return h(
        'div',
        { class: 'pd-visual pd-scroll', 'data-visual': 'table' },
        h(
          'table',
          { class: 'pd-table' },
          h('thead', {}, h('tr', {}, h('td', {}), ...spec.cols.map((col) => h('th', { scope: 'col' }, label(col))))),
          h(
            'tbody',
            {},
            ...spec.rows.map((row) =>
              h(
                'tr',
                {},
                h('th', { scope: 'row' }, label(row.id)),
                ...row.cells.map((cell, i) => h('td', {}, row.best === i ? h('strong', {}, ui.bdi(ui.token(cell, true)), ` ${t('table.better')}`) : ui.bdi(ui.token(cell, true))))
              )
            )
          )
        )
      );
    case 'bars':
      return h(
        'div',
        { class: 'pd-visual', 'data-visual': 'bars' },
        ...spec.series.map((series, si) => {
          const id = si === 0 ? 'small' : 'large';
          const w = 300;
          const ht = 80;
          const max = Math.max(...series.dist.map(toNumber));
          const bw = w / series.dist.length;
          const bars = series.dist.map((p, k) =>
            svg('rect', {
              x: k * bw + 0.5,
              y: ht - (toNumber(p) / max) * (ht - 4),
              width: Math.max(0.5, bw - 1),
              height: (toNumber(p) / max) * (ht - 4),
              class: k > series.cut ? 'pd-bar pd-bar--tail' : 'pd-bar'
            })
          );
          const cutX = (Math.floor(series.cut) + 1) * bw;
          const caption = t('bars.caption', { label: label(id), t: tokens.t ? ui.token(tokens.t) : '', p: ui.pct(series.tail) });
          return h(
            'figure',
            { class: 'pd-ltr' },
            svg('svg', { viewBox: `0 0 ${w} ${ht}`, class: 'pd-bars', role: 'img', 'aria-label': caption }, ...bars, svg('line', { x1: cutX, x2: cutX, y1: 0, y2: ht, class: 'pd-cut' })) as unknown as HTMLElement,
            h('figcaption', {}, caption)
          );
        })
      );
    case 'sequence':
      return h(
        'ul',
        { class: 'pd-visual pd-seq', 'data-visual': 'sequence' },
        ...spec.rows.map((row) =>
          h(
            'li',
            {},
            `${t('seq.row', { label: label(row.id), p: ui.pct(row.p) })} `,
            h('bdi', { class: 'pd-seq-symbols', dir: 'ltr' }, row.bits.map((b) => (b === 1 ? '●' : b === 0 ? '○' : '?')).join(' '))
          )
        )
      );
    case 'product':
      return h(
        'ol',
        { class: 'pd-visual pd-product', 'data-visual': 'product' },
        ...spec.steps.map((p, i) =>
          h(
            'li',
            {},
            h('span', {}, `${ui.fill(label('step'), { n: { t: 'int', v: i + 1 } })}: `, ui.bdi(ui.pct(p))),
            h('span', { class: 'pd-axis pd-axis--fill', 'aria-hidden': 'true' }, h('span', { class: 'pd-fill', style: `width: ${toNumber(p) * 100}%` }))
          )
        )
      );
  }
}

export function trapScreen(host: Host, c: TrapCase): HTMLElement[] {
  const { ui } = host;
  const { t } = ui;
  const text = trapText(ui.locale, c);
  const template = trapById(c.template)!;
  const tokens = template.tokens(c.params);
  const questions = trapQuestions(c);
  const reviewed = isReview(c);

  const optionText = (q: TrapQuestion, i: number): string =>
    q.kind === 'choice' ? ui.fill(text.options[q.options[i]!] ?? q.options[i]!, tokens) : q.kind === 'count' ? ui.int(q.values[i]!) : '';

  const answerText = (q: TrapQuestion, a: number | 'skip'): string => (a === 'skip' ? t('skipped') : q.kind === 'prob' ? ui.whole(a) : optionText(q, a));

  const probControl = (qi: number, value: number | null) => {
    const shown = value ?? 50;
    const range = h('input', {
      type: 'range',
      min: 0,
      max: 100,
      step: 1,
      class: 'pd-range',
      id: `pd-q${qi}-range`,
      'aria-label': t('trap.estimate'),
      'aria-valuetext': value === null ? t('trap.notSet') : ui.whole(value),
      'data-testid': `pd-q${qi}-range`
    });
    range.value = String(shown);
    const out = h('p', { class: 'pd-values', 'data-testid': `pd-q${qi}-value` }, value === null ? t('trap.notSet') : ui.whole(value));
    range.addEventListener('input', () => (out.textContent = ui.whole(Number(range.value))));
    const set = (v: number, focus: string) => !host.paused() && host.commit(setTrapDraft(host.state(), qi, Math.min(100, Math.max(0, v))), focus);
    range.addEventListener('change', () => set(Number(range.value), `pd-q${qi}-range`));
    const minus = h('button', { type: 'button', class: 'pd-step', id: `pd-q${qi}-minus`, 'aria-label': t('trap.less') }, '−');
    const plus = h('button', { type: 'button', class: 'pd-step', id: `pd-q${qi}-plus`, 'data-act': qi === questions.findIndex((q) => q.kind === 'prob') ? 'plus' : undefined, 'data-testid': `pd-q${qi}-plus`, 'aria-label': t('trap.more') }, '+');
    minus.addEventListener('click', () => set(shown - 1, `pd-q${qi}-minus`));
    plus.addEventListener('click', () => set(shown + 1, `pd-q${qi}-plus`));
    return [out, h('div', { class: 'pd-slider-row' }, minus, range, plus)];
  };

  const questionBlock = (q: TrapQuestion, qi: number) => {
    const legend = ui.fill(text.questions[q.id] ?? '', tokens);
    if (reviewed) {
      const r = reviewTrap(c)[qi]!;
      const exact = q.kind === 'prob' ? ui.pct(q.exact) : optionText(q, q.correct);
      return h(
        'section',
        { class: 'pd-question', 'data-testid': `pd-q${qi}` },
        h('h3', {}, legend),
        h('p', {}, t('trap.your', { a: answerText(q, r.answer) })),
        h('p', { 'data-testid': `pd-q${qi}-exact`, 'data-match': String(r.matches) }, r.matches ? t('trap.match') : t('trap.exact', { a: exact })),
        r.band ? h('p', { class: 'pd-band', 'data-band': r.band }, `${t('trap.exact', { a: exact })} · ${ui.bandText(r.band)}`) : ''
      );
    }
    const draft = c.drafts[qi] ?? null;
    if (q.kind === 'prob') return h('fieldset', { class: 'pd-question', 'data-testid': `pd-q${qi}` }, h('legend', {}, legend), ...probControl(qi, draft));
    const count = q.kind === 'choice' ? q.options.length : q.values.length;
    return h(
      'fieldset',
      { class: 'pd-question pd-choices', 'data-testid': `pd-q${qi}` },
      h('legend', {}, legend),
      ...Array.from({ length: count }, (_, i) => {
        const id = `pd-q${qi}-o${i}`;
        const input = h('input', { type: 'radio', name: `pd-q${qi}`, value: i, id, 'data-testid': id });
        input.checked = draft === i;
        input.addEventListener('change', () => !host.paused() && host.commit(setTrapDraft(host.state(), qi, i), id));
        return h('label', { class: 'pd-radio', for: id }, input, ' ', ui.bdi(optionText(q, i)));
      })
    );
  };

  const go = (skip: boolean) => {
    if (host.paused()) return;
    host.commit(checkTrap(host.state(), skip), 'pd-review-heading', t('trap.explain'));
  };

  const body: (HTMLElement | string)[] = [h('p', { class: 'pd-story', 'data-testid': 'pd-trap-story' }, ui.fill(text.story, tokens)), ...questions.map(questionBlock)];
  if (reviewed) {
    body.push(
      h(
        'section',
        { class: 'pd-review', 'data-testid': 'pd-review' },
        ui.heading('h3', 'pd-review-heading', t('trap.explain')),
        h('p', { 'data-testid': 'pd-explain' }, ui.fill(text.explain, template.explainTokens(c.params))),
        trapVisual(ui, template.explain(c.params), text, tokens),
        h('div', { class: 'pd-actions' }, host.nextButton())
      )
    );
  } else {
    const check = h('button', { type: 'button', class: 'pd-primary', 'data-testid': 'pd-trap-check' }, t('trap.check'));
    check.addEventListener('click', () => go(false));
    const skip = h('button', { type: 'button', class: 'pd-secondary', 'data-testid': 'pd-skip' }, t('action.skip'));
    skip.addEventListener('click', () => go(true));
    body.push(h('div', { class: 'pd-actions' }, check, skip));
  }
  body.push(h('p', { class: 'pd-small pd-invented' }, t('invented')));
  return [host.header(text.title, 'kind.trap'), h('div', { class: 'pd-trap', 'data-template': c.template }, ...body)];
}
