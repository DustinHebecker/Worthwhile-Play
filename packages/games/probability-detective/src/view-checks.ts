/** Mode "Choose the checks": case file, check cards, decision screen and review (design § 7, § 11.4, § 15.3). */
import { h } from '@wp/ui';
import { contentFor, type CheckTemplateText } from './content';
import {
  analyseChecks,
  checkParams,
  checkPosterior,
  cmp,
  decide,
  isReview,
  observed,
  resultProbability,
  reviewChecks,
  runCheck,
  setChoice,
  setDraft,
  shareDraft,
  toDeciding,
  toNumber,
  type Action,
  type CheckCase,
  type Frac,
  type Obs
} from './rules';
import { checkTemplateById } from './templates';
import { MARKS, beliefControls } from './ui';
import type { Host } from './view-host';

export const checksText = (locale: string, c: CheckCase): CheckTemplateText => contentFor(locale).checks[c.template]!;
export const checksHyp = (locale: string, c: CheckCase, i: number): string => checksText(locale, c).hyps[checkTemplateById(c.template)?.hyps[i] ?? ''] ?? '';

export function checksScreen(host: Host, c: CheckCase): HTMLElement[] {
  const { ui } = host;
  const { t } = ui;
  const locale = ui.locale;
  const text = checksText(locale, c);
  const hypName = (i: number) => checksHyp(locale, c, i);
  const named = (i: number) => ui.named(hypName(i), i);
  const optionName = (d: number) => text.options[c.options[d]!.id] ?? c.options[d]!.id;
  const checkText = (i: number) => text.checks[c.checks[i]!.id]!;
  const resultText = (i: number, r: 0 | 1) => (r === 1 ? checkText(i).yes : checkText(i).no);
  const spent = c.done.reduce((a, i) => a + c.checks[i]!.cost, 0);
  const reviewed = isReview(c);

  const freqRow = (nums: readonly number[], den: number) =>
    h('ul', { class: 'pd-freq' }, ...nums.map((num, i) => h('li', {}, named(i), ': ', ui.bdi(ui.stated(num, den, host.difficulty())))));

  const decisionTable = () =>
    h(
      'section',
      { class: 'pd-options', 'data-testid': 'pd-options' },
      h('h3', {}, t('checks.table')),
      h(
        'ul',
        { class: 'pd-option-list' },
        ...c.options.map((o, d) =>
          h(
            'li',
            { class: 'pd-option' },
            h('strong', {}, optionName(d)),
            ': ',
            ...o.pay.flatMap((v, i) => [i ? ' · ' : '', named(i), ' ', ui.bdi(ui.points(v))])
          )
        )
      ),
      h('p', { class: 'pd-small' }, t('checks.points'))
    );

  const checkCard = (i: number) => {
    const k = c.checks[i]!;
    const ran = c.done.includes(i);
    const card = h(
      'section',
      { class: `pd-clue pd-check${ran ? ' pd-check--done' : ''}`, 'data-testid': `pd-check-${i}`, 'aria-labelledby': `pd-check-h-${i}` },
      ui.heading('h3', `pd-check-h-${i}`, checkText(i).label),
      h('p', { class: 'pd-small' }, t('checks.shows', { yes: checkText(i).yes.replace(/[.。।]$/u, '') })),
      freqRow(k.num, k.den),
      h('p', { class: 'pd-cost' }, t('checks.cost', { n: ui.int(k.cost) }))
    );
    if (ran) {
      card.append(h('p', { class: 'pd-observation', 'data-testid': `pd-result-${i}` }, t('checks.result', { text: resultText(i, k.result) })));
    } else if (!reviewed && !c.deciding) {
      const run = h('button', { type: 'button', class: 'pd-secondary', 'data-testid': `pd-run-${i}` }, t('checks.run'));
      run.addEventListener('click', () => {
        if (host.paused()) return;
        host.commit(runCheck(host.state(), i), `pd-check-h-${i}`, `${checkText(i).label}: ${resultText(i, k.result)}`);
      });
      card.append(run);
    }
    return card;
  };

  const caseFile = () =>
    h(
      'div',
      { class: 'pd-file', 'data-testid': 'pd-file' },
      h('p', { class: 'pd-story' }, text.story),
      h('section', { class: 'pd-known' }, h('h3', {}, t('known')), h('p', {}, text.lead), freqRow(c.prior, c.priorDen)),
      decisionTable(),
      h('h3', {}, t('checks.heading')),
      ...c.checks.map((_, i) => checkCard(i)),
      h('p', { class: 'pd-small pd-invented' }, t('invented'))
    );

  const spentLine = () => h('p', { 'data-testid': 'pd-spent' }, t('checks.spent', { n: ui.int(c.done.length), p: ui.int(spent) }));

  const checksPanel = () => {
    const ready = h('button', { type: 'button', class: 'pd-primary', 'data-testid': 'pd-ready' }, t('checks.ready'));
    ready.addEventListener('click', () => !host.paused() && host.commit(toDeciding(host.state(), true), 'pd-decide-h'));
    return h(
      'section',
      { class: 'pd-panel', 'aria-labelledby': 'pd-panel-h', 'data-testid': 'pd-checks-panel' },
      h('h3', { id: 'pd-panel-h' }, t('checks.panel')),
      spentLine(),
      h('div', { class: 'pd-actions' }, ready),
      h('details', { class: 'pd-hint' }, h('summary', {}, t('hint.heading')), h('p', {}, t('checks.hint')))
    );
  };

  const decidePanel = () => {
    const controls = beliefControls(ui, {
      names: [hypName(0), hypName(1)],
      draft: c.draft,
      paused: host.paused,
      set: (b, focus) => host.commit(setDraft(host.state(), b), focus),
      share: (i, v, focus) => host.commit(shareDraft(host.state(), i, v), focus)
    });
    const radios = h(
      'fieldset',
      { class: 'pd-choices', 'data-testid': 'pd-choices' },
      h('legend', {}, t('checks.choose')),
      ...c.options.map((_, d) => {
        const input = h('input', { type: 'radio', name: 'pd-choice', value: d, id: `pd-choice-${d}`, 'data-testid': `pd-choice-${d}` });
        input.checked = c.choice === d;
        input.addEventListener('change', () => !host.paused() && host.commit(setChoice(host.state(), d), `pd-choice-${d}`));
        return h('label', { class: 'pd-radio', for: `pd-choice-${d}` }, input, ' ', optionName(d));
      })
    );
    const go = (skip: boolean) => {
      if (host.paused()) return;
      if (c.choice === null) {
        host.announce(t('checks.needChoice'));
        return;
      }
      const s = decide(host.state(), skip);
      const nc = s.cases[s.index] as CheckCase;
      host.note(nc);
      host.commit(s, 'pd-review-heading', `${t('review.heading')}: ${t('review.truth', { name: checksHyp(locale, nc, nc.truth) })}`);
    };
    const decideBtn = h('button', { type: 'button', class: 'pd-primary', 'data-testid': 'pd-decide' }, t('checks.decide'));
    decideBtn.addEventListener('click', () => go(false));
    const skip = h('button', { type: 'button', class: 'pd-secondary', 'data-testid': 'pd-decide-skip' }, t('checks.decideSkip'));
    skip.addEventListener('click', () => go(true));
    const back = h('button', { type: 'button', class: 'pd-secondary', 'data-testid': 'pd-back' }, t('checks.back'));
    back.addEventListener('click', () => !host.paused() && host.commit(toDeciding(host.state(), false), 'pd-panel-h'));
    return h(
      'section',
      { class: 'pd-panel', 'aria-labelledby': 'pd-decide-h', 'data-testid': 'pd-decide-panel' },
      ui.heading('h3', 'pd-decide-h', text.question),
      spentLine(),
      ...controls,
      h('p', { class: 'pd-small' }, c.draft.map((x, i) => t('belief.freq', { k: ui.int(x), name: hypName(i) })).join(' · ')),
      radios,
      h('div', { class: 'pd-actions' }, decideBtn, skip),
      back
    );
  };

  /* ---------- Review (design § 7.4) ---------- */

  const actionText = (a: Action) => (a.kind === 'run' ? t('plan.run', { check: checkText(a.check).label }) : optionName(a.option));

  const verdict = (best: boolean, good: boolean) => t(`verdict.${best ? 'good' : 'weak'}${good ? 'Good' : 'Bad'}`);

  const planTree = () => {
    const a = analyseChecks(checkParams(c));
    const p = checkParams(c);
    const step = (s: Obs, depth: number): HTMLElement => {
      const best = a.best(s)[0]!;
      const li = h('li', {}, h('span', {}, actionText(best), ' ', ui.bdi(`(${ui.points(a.value(s))})`)));
      if (best.kind === 'run' && depth < 2) {
        const sub = h('ul', { class: 'pd-plan' });
        for (const r of [1, 0] as const) {
          if (resultProbability(p, s, best.check, r).n === 0n) continue;
          const child = step([...s, [best.check, r]], depth + 1);
          child.prepend(h('span', { class: 'pd-small' }, `${t('plan.if', { result: resultText(best.check, r).replace(/[.。।]$/u, '') })} `));
          sub.append(child);
        }
        li.append(sub);
      }
      return li;
    };
    return h('ul', { class: 'pd-plan', 'data-testid': 'pd-plan' }, step([], 0));
  };

  const worthChart = (myopic: readonly Frac[]) => {
    const max = Math.max(0.01, ...myopic.map((v) => Math.abs(toNumber(v))));
    return h(
      'ul',
      { class: 'pd-worth', 'data-testid': 'pd-worth' },
      ...myopic.map((v, i) => {
        const x = toNumber(v);
        const neg = v.n < 0n;
        return h(
          'li',
          { class: 'pd-worth-row' },
          h('span', { class: 'pd-worth-label' }, checkText(i).label, ': ', t(neg ? 'worth.neg' : 'worth.pos', { v: ui.points(v) })),
          h(
            'span',
            { class: 'pd-axis', 'aria-hidden': 'true' },
            h('span', { class: `pd-worth-bar${neg ? ' pd-worth-bar--neg' : ''}`, style: `${neg ? 'right' : 'left'}: 50%; width: ${(Math.abs(x) / max) * 50}%` })
          )
        );
      })
    );
  };

  const review = () => {
    const r = reviewChecks(c);
    const d = c.decision!;
    // A good outcome: with hindsight, no other option would have brought more points.
    const good = c.options[d]!.pay[c.truth]! === Math.max(...c.options.map((o) => o.pay[c.truth]!));
    const post = checkPosterior(checkParams(c), observed(c));
    const rows = r.rows.map((row, k) =>
      h(
        'li',
        { 'data-testid': `pd-inv-${k}` },
        h('strong', {}, actionText(row.action)),
        ' — ',
        t('inv.value', { v: ui.points(row.value) }),
        ' · ',
        cmp(row.value, row.bestValue) === 0 ? t('inv.best') : t('inv.better', { best: actionText(row.best[0]!), v: ui.points(row.bestValue) })
      )
    );
    const forecast: HTMLElement[] = [];
    if (r.final && r.score !== null) {
      forecast.push(
        h('p', {}, t('checks.estimate', { b: `${MARKS[0]} ${ui.whole(r.final[0]!)}`, p: `${MARKS[0]} ${ui.pct(post[0]!)}` }), ' ', r.finalBand ? ui.bandText(r.finalBand) : ''),
        h('p', { 'data-testid': 'pd-forecast' }, t('forecast.line', { s: ui.int(r.score), e: ui.int(Math.round(toNumber(r.exactScore))), r: ui.int(75) }))
      );
    }
    return h(
      'section',
      { class: 'pd-review', 'data-testid': 'pd-review' },
      ui.heading('h3', 'pd-review-heading', t('review.heading')),
      h('p', { class: 'pd-truth', 'data-testid': 'pd-truth' }, ui.mark(c.truth), ' ', t('review.truth', { name: hypName(c.truth) })),
      h(
        'p',
        { 'data-testid': 'pd-points' },
        t('checks.outcome', { option: optionName(d), pay: ui.points(c.options[d]!.pay[c.truth]!), cost: ui.points(-r.spent), total: ui.points(r.points) })
      ),
      h('p', { class: 'pd-verdict', 'data-testid': 'pd-decision', 'data-best': String(r.bestDecision) }, verdict(r.bestDecision, good)),
      h('p', {}, t('checks.evs', { list: c.options.map((_, i) => `${optionName(i)} ${ui.points(r.evs[i]!)}`).join(' · ') })),
      h('p', { class: 'pd-small' }, t('checks.ev')),
      h('h3', {}, t('checks.investigation')),
      h('ol', { class: 'pd-rows', 'data-testid': 'pd-investigation' }, ...rows),
      h('h3', {}, t('checks.worth')),
      worthChart(r.myopic),
      h('h3', {}, t('checks.plan', { v: ui.points(r.startValue) })),
      planTree(),
      forecast.length ? h('section', { class: 'pd-forecast' }, h('h3', {}, t('forecast.heading')), ...forecast, h('p', { class: 'pd-small' }, t('forecast.explain'))) : '',
      h(
        'details',
        { class: 'pd-formulas', 'data-testid': 'pd-formulas' },
        h('summary', {}, t('formula.heading')),
        ...c.options.map((o, i) =>
          h(
            'p',
            { class: 'pd-formula', dir: 'ltr' },
            'EV(',
            ui.bdi(optionName(i)),
            ') = ',
            `${ui.pct(post[0]!)} × ${ui.points(o.pay[0]!)} + ${ui.pct(post[1]!)} × ${ui.points(o.pay[1]!)} = ${ui.points(r.evs[i]!)}`
          )
        )
      ),
      h('div', { class: 'pd-actions' }, host.nextButton())
    );
  };

  return [
    host.header(text.title, 'kind.checks'),
    h('div', { class: `pd-layout${reviewed ? ' pd-layout--review' : ''}`, 'data-template': c.template }, caseFile(), reviewed ? review() : c.deciding ? decidePanel() : checksPanel())
  ];
}
