/** Mode "Clue by clue": the case file, the belief panel and the review (design § 6, § 10, § 11.1–11.3, § 12). */
import { h } from '@wp/ui';
import { contentFor, type TemplateText } from './content';
import { formatRatio } from './format';
import {
  cmp,
  commitStep,
  countingBoard,
  isReview,
  likelihood,
  posteriorAfter,
  reduced,
  resetDraft,
  revealed,
  reviewCase,
  setDraft,
  shareDraft,
  toNumber,
  weightsAfter,
  type Answer,
  type ClueCase,
  type Movement
} from './rules';
import { templateById } from './templates';
import { MARKS, beliefControls } from './ui';
import type { Host } from './view-host';

export const clueText = (locale: string, c: ClueCase): TemplateText => contentFor(locale).templates[c.template]!;
export const clueHyp = (locale: string, c: ClueCase, i: number): string => clueText(locale, c).hyps[templateById(c.template)?.hyps[i] ?? ''] ?? '';

export function clueScreen(host: Host, c: ClueCase): HTMLElement[] {
  const { ui } = host;
  const { t } = ui;
  const locale = ui.locale;
  const text = clueText(locale, c);
  const hypName = (i: number) => clueHyp(locale, c, i);
  const named = (i: number) => ui.named(hypName(i), i);

  const freqRow = (nums: readonly number[], den: number) =>
    h('ul', { class: 'pd-freq' }, ...nums.map((num, i) => h('li', {}, named(i), ': ', ui.bdi(ui.stated(num, den, host.difficulty())))));

  const answerText = (a: Answer) => (a === 'skip' ? t('skipped') : a.map((x, i) => `${MARKS[i]} ${ui.whole(x)}`).join(' · '));

  const caseFile = () => {
    const shown = isReview(c) ? c.clues.length : revealed(c);
    const cards = c.clues.slice(0, shown).map((clue, k) => {
      const ct = text.clues[clue.id]!;
      const a = c.answers[k];
      return h(
        'section',
        { class: 'pd-clue', 'data-testid': `pd-clue-${k}`, 'aria-labelledby': `pd-clue-h-${k}` },
        ui.heading('h3', `pd-clue-h-${k}`, t('clue', { n: k + 1 })),
        h('p', { class: 'pd-observation' }, clue.result === 1 ? ct.seen : ct.notSeen),
        h('p', { class: 'pd-small' }, h('strong', {}, ct.label), ' — ', t('freq.row')),
        freqRow(clue.num, clue.den),
        a !== undefined ? h('p', { class: 'pd-you', 'data-testid': `pd-you-${k}` }, t('you', { p: answerText(a) })) : ''
      );
    });
    return h(
      'div',
      { class: 'pd-file', 'data-testid': 'pd-file' },
      h('p', { class: 'pd-story' }, text.story),
      h('section', { class: 'pd-known' }, h('h3', {}, t('known')), h('p', {}, text.lead), freqRow(c.prior, c.priorDen)),
      ...cards,
      h('p', { class: 'pd-small pd-invented' }, t('invented'))
    );
  };

  const beliefPanel = () => {
    const k = c.answers.length;
    const prev = c.answers[k - 1];
    const before = prev && prev !== 'skip' ? prev[0]! : Math.round(toNumber(posteriorAfter(c, k)[0]!) * 100);
    const controls = beliefControls(ui, {
      names: c.draft.map((_, i) => hypName(i)),
      draft: c.draft,
      before,
      paused: host.paused,
      set: (b, focus) => host.commit(setDraft(host.state(), b), focus),
      share: (i, v, focus) => host.commit(shareDraft(host.state(), i, v), focus)
    });
    const last = k === c.clues.length - 1;
    const next = h('button', { type: 'button', class: 'pd-primary', 'data-testid': 'pd-commit' }, t(last ? 'action.close' : 'action.next'));
    const skip = h('button', { type: 'button', class: 'pd-secondary', 'data-testid': 'pd-skip' }, t('action.skip'));
    const back = h('button', { type: 'button', class: 'pd-secondary', id: 'pd-reset', 'data-testid': 'pd-reset' }, t('belief.reset'));
    const go = (asSkip: boolean) => {
      if (host.paused()) return;
      const s = commitStep(host.state(), asSkip);
      const nc = s.cases[s.index] as ClueCase;
      if (isReview(nc)) {
        host.note(nc);
        host.commit(s, 'pd-review-heading', `${t('review.heading')}: ${t('review.truth', { name: clueHyp(locale, nc, nc.truth) })}`);
      } else {
        const clue = nc.clues[nc.answers.length]!;
        const ct = text.clues[clue.id]!;
        host.commit(s, `pd-clue-h-${nc.answers.length}`, `${t('clue', { n: nc.answers.length + 1 })}: ${clue.result === 1 ? ct.seen : ct.notSeen}`);
      }
    };
    next.addEventListener('click', () => go(false));
    skip.addEventListener('click', () => go(true));
    back.addEventListener('click', () => !host.paused() && host.commit(resetDraft(host.state()), 'pd-reset'));
    return h(
      'section',
      { class: 'pd-panel', 'aria-labelledby': 'pd-belief-h', 'data-testid': 'pd-belief' },
      h('h3', { id: 'pd-belief-h' }, t('belief.heading')),
      ...controls,
      c.hyps === 2 ? h('p', { class: 'pd-small' }, t('belief.before', { p: ui.whole(before) })) : '',
      h('p', { class: 'pd-small' }, c.draft.map((x, i) => t('belief.freq', { k: ui.int(x), name: hypName(i) })).join(' · ')),
      h('div', { class: 'pd-actions' }, next, skip),
      back,
      h('details', { class: 'pd-hint' }, h('summary', {}, t('hint.heading')), h('p', {}, t('hint.text')))
    );
  };

  const moveText = (m: Movement): string => {
    switch (m.kind) {
      case 'neutral':
        return `${t('move.neutral')} ${m.stayed ? t('move.stayed') : t('move.moved', { n: ui.int(m.moved) })}`;
      case 'decisive':
        return `${t('move.decisive', { name: hypName(m.excluded) })}${m.ok ? ' ✓' : ''}`;
      case 'ratio':
        return t(`move.${m.cls}`);
      case 'three':
        return `${t('move.fromThree', { list: m.target.map((x, i) => `${MARKS[i]} ${ui.pct(x)}`).join(' · ') })} ${ui.bandText(m.band)}`;
    }
  };

  const ledger = () => {
    const r = reviewCase(c);
    const p0 = posteriorAfter(c, 0);
    const rows: HTMLElement[] = [
      h(
        'li',
        { class: 'pd-row' },
        h('strong', {}, t('ledger.base')),
        h('span', { class: 'pd-weights' }, ui.bdi(reduced(weightsAfter(c, 0)).map((x) => ui.int(x)).join(' : '))),
        ui.splitBar(p0.map((x) => toNumber(x) * 100)),
        h('span', {}, p0.map((x, i) => `${MARKS[i]} ${ui.pct(x)}`).join(' · '))
      )
    ];
    c.clues.forEach((clue, k) => {
      const l = likelihood(clue);
      const lr = reduced(l.map((x) => BigInt(x)));
      const w = reduced(weightsAfter(c, k + 1));
      const p = posteriorAfter(c, k + 1);
      const st = r.steps[k]!;
      const neutral = l.every((x) => x === l[0]);
      const feedback: (HTMLElement | string)[] = [];
      if (st.answer !== 'skip' && st.band) {
        feedback.push(h('span', { class: 'pd-band', 'data-band': st.band }, ui.bandText(st.band)));
        if (st.move) feedback.push(' ', moveText(st.move));
      }
      rows.push(
        h(
          'li',
          { class: 'pd-row', 'data-testid': `pd-step-${k}` },
          h('strong', {}, `${t('clue', { n: k + 1 })}: ${text.clues[clue.id]!.label}${clue.result === 1 ? '' : ` (${t('notSeen')})`}`),
          h('span', { class: 'pd-weights' }, ui.bdi(neutral ? t('ledger.nothing') : `${lr.map((x) => `× ${ui.int(x)}`).join(' : ')} → ${w.map((x) => ui.int(x)).join(' : ')}`)),
          ui.splitBar(p.map((x) => toNumber(x) * 100), st.answer === 'skip' ? undefined : st.answer[0], '◆'),
          h('span', {}, t('ledger.exact', { p: p.map((x, i) => `${MARKS[i]} ${ui.pct(x)}`).join(' · ') }), ' · ', t('you', { p: answerText(st.answer) })),
          feedback.length ? h('p', { class: 'pd-feedback' }, ...feedback) : ''
        )
      );
    });
    return h(
      'section',
      { class: 'pd-ledger', 'data-testid': 'pd-ledger' },
      h('h3', {}, t('ledger.heading')),
      h('p', { class: 'pd-small' }, t('ledger.multiply')),
      h('ol', { class: 'pd-rows' }, ...rows),
      r.baseRate ? h('p', { class: 'pd-flag', 'data-testid': 'pd-baserate' }, t('baseRate.flag', { name: hypName(0), p: ui.pct(posteriorAfter(c, 1)[0]!) })) : ''
    );
  };

  const board = () => {
    const b = countingBoard(c);
    if (!b) return '';
    const head = h('tr', {}, h('th', { scope: 'col' }, t('board.step')), ...b.levels[0]!.map((_, i) => h('th', { scope: 'col' }, named(i))), h('th', { scope: 'col' }, t('board.total')));
    const rows = b.levels.map((lv, k) =>
      h(
        'tr',
        {},
        h('th', { scope: 'row' }, k === 0 ? t('ledger.base') : t('board.fits', { n: k })),
        ...lv.map((x) => h('td', {}, ui.bdi(ui.int(x)))),
        h('td', {}, ui.bdi(ui.int(lv.reduce((s, x) => s + x, 0n))))
      )
    );
    const lastLv = b.levels[b.levels.length - 1]!;
    const fit = lastLv.reduce((s, x) => s + x, 0n);
    const lead = lastLv.reduce((bi, x, i) => (x > lastLv[bi]! ? i : bi), 0);
    return h(
      'section',
      { class: 'pd-board', 'data-testid': 'pd-board' },
      h('h3', {}, t('board.heading')),
      h('p', {}, t('board.intro', { n: ui.int(b.population) })),
      h('div', { class: 'pd-scroll' }, h('table', { class: 'pd-table' }, h('thead', {}, head), h('tbody', {}, ...rows))),
      // The closing sentence speaks of "every clue", so it appears only when the board covers all of them.
      fit > 0n && b.levels.length === c.clues.length + 1
        ? h('p', {}, t('board.end', { fit: ui.int(fit), k: ui.int(lastLv[lead]!), name: hypName(lead), p: ui.pct({ n: lastLv[lead]!, d: fit }) }))
        : ''
    );
  };

  const formulas = () => {
    const p0 = posteriorAfter(c, 0);
    const clue = c.clues[0]!;
    const l = likelihood(clue);
    const w = weightsAfter(c, 1);
    const total = w.reduce((s, x) => s + x, 0n);
    const terms = l.map((x, i) => `${formatRatio(x, clue.den, locale)} · ${ui.pct(p0[i]!)}`);
    const g = reduced([w[0]!, total]);
    return h(
      'details',
      { class: 'pd-formulas', 'data-testid': 'pd-formulas' },
      h('summary', {}, t('formula.heading')),
      h('p', {}, t('formula.bayes')),
      h(
        'p',
        { class: 'pd-formula', dir: 'ltr' },
        'P(',
        ui.bdi(hypName(0)),
        ' | ',
        t('clue', { n: 1 }),
        ') = ',
        terms[0]!,
        ' / (',
        terms.join(' + '),
        ') = ',
        total === 0n ? '0' : formatRatio(g[0]!, g[1]!, locale),
        ' = ',
        ui.pct(posteriorAfter(c, 1)[0]!)
      ),
      h('p', {}, t('formula.odds')),
      h(
        'p',
        { class: 'pd-formula', dir: 'ltr' },
        reduced(weightsAfter(c, 0)).map((x) => ui.int(x)).join(' : '),
        ' × ',
        reduced(l.map(BigInt)).map((x) => ui.int(x)).join(' : '),
        ' = ',
        reduced(w).map((x) => ui.int(x)).join(' : ')
      )
    );
  };

  const review = () => {
    const r = reviewCase(c);
    const pn = posteriorAfter(c, c.clues.length);
    const forecast: HTMLElement[] = [];
    if (r.score !== null) {
      const ref = c.hyps === 2 ? 75 : 67;
      forecast.push(h('p', { 'data-testid': 'pd-forecast' }, t('forecast.line', { s: ui.int(r.score), e: ui.int(Math.round(toNumber(r.exactScore))), r: ui.int(ref) })));
      // A good estimate on a case that went a less likely way: say how often that happens. With three explanations the
      // truth can be below one half and still the most likely one; that case did not go "another way".
      const pTruth = toNumber(pn[c.truth]!);
      const notLeading = pn.some((x, i) => i !== c.truth && cmp(x, pn[c.truth]!) > 0);
      if ((r.finalBand === 'spot' || r.finalBand === 'close') && pTruth < 0.5 && pTruth > 0 && notLeading)
        forecast.push(h('p', { 'data-testid': 'pd-luck' }, t('forecast.luck', { k: ui.int(Math.max(1, Math.round(pTruth * 100))) })));
    }
    return h(
      'section',
      { class: 'pd-review', 'data-testid': 'pd-review' },
      ui.heading('h3', 'pd-review-heading', t('review.heading')),
      h('p', { class: 'pd-truth', 'data-testid': 'pd-truth' }, ui.mark(c.truth), ' ', t('review.truth', { name: hypName(c.truth) })),
      r.finalBand ? h('p', { class: 'pd-verdict', 'data-testid': 'pd-verdict', 'data-band': r.finalBand }, ui.bandText(r.finalBand)) : '',
      h('p', {}, t('review.final', { p: pn.map((x, i) => `${MARKS[i]} ${ui.pct(x)}`).join(' · ') })),
      h('h3', {}, t('review.numbers')),
      board(),
      ledger(),
      h('section', { class: 'pd-forecast' }, h('h3', {}, t('forecast.heading')), ...forecast, h('p', { class: 'pd-small' }, t('forecast.explain'))),
      formulas(),
      h('div', { class: 'pd-actions' }, host.nextButton())
    );
  };

  return [
    host.header(text.title, 'kind.clues'),
    h('div', { class: `pd-layout${isReview(c) ? ' pd-layout--review' : ''}`, 'data-template': c.template }, caseFile(), isReview(c) ? review() : beliefPanel())
  ];
}
