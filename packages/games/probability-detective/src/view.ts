import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { contentFor, type TemplateText } from './content';
import { formatInt, formatPercent, formatRatio, formatWholePercent } from './format';
import { createRound } from './generate';
import {
  NOTEBOOK_MIN,
  ROUND_LENGTH,
  caseNotes,
  commitStep,
  countingBoard,
  currentCase,
  evenly,
  isReview,
  isSummary,
  likelihood,
  markReported,
  nextCase,
  notebookAdd,
  notebookBins,
  posteriorAfter,
  readNotebook,
  reduced,
  resetDraft,
  restartRound,
  revealed,
  reviewCase,
  setDraft,
  shareDraft,
  summarize,
  toNumber,
  weightsAfter,
  type Band,
  type ClueCase,
  type Frac,
  type Movement,
  type NoteEntry,
  type PdState
} from './rules';
import { DIFFICULTIES, templateById, type Difficulty } from './templates';
import './styles.css';

const MARKS = ['●', '■', '▲'] as const;
const BAND_MARKS: Record<Band, string> = { spot: '●●●', close: '●●○', off: '●○○', far: '○○○' };
const NOTEBOOK_KEY = 'calibration';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createProbabilityDetective(context: GameContext): GameInstance<PdState> {
  const { t, root } = context;
  const locale = t.locale;
  let state: PdState = createRound(0, 'easy');
  let paused = false;
  let focusNext: string | null = null;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'pd-announcer' });
  const main = h('div', { class: 'pd-main' });
  const container = h('div', { class: 'wp-probability-detective', dir: t.direction, lang: bcp47Tag(locale), 'data-testid': 'pd-root' }, main, live);

  const text = (c: ClueCase): TemplateText => contentFor(locale).templates[c.template]!;
  const hypName = (c: ClueCase, i: number): string => text(c).hyps[templateById(c.template)?.hyps[i] ?? ''] ?? '';
  const pct = (v: Frac | number) => formatPercent(v, locale, (p) => t('pct.below', { p }));
  const whole = (p: number) => formatWholePercent(p, locale);
  const bdi = (s: string, cls?: string) => h('bdi', cls ? { class: cls } : {}, s);
  const mark = (hIndex: number) => h('span', { class: `pd-mark pd-m${hIndex}`, 'aria-hidden': 'true' }, MARKS[hIndex]!);
  const named = (c: ClueCase, hIndex: number) => h('span', { class: 'pd-hyp' }, mark(hIndex), ' ', hypName(c, hIndex));

  /** A stated number num/den: "3 in 10" (easy), "1 in 50" for rare thousandths, else a percent. */
  const stated = (num: number, den: number, difficulty: Difficulty): string => {
    if (difficulty === 'easy' || den === 10) return t('freq', { k: formatInt(num, locale), n: formatInt(den, locale) });
    if (den === 1000 && num > 0 && num < 100 && 1000 % num === 0) return t('freq', { k: formatInt(1, locale), n: formatInt(1000 / num, locale) });
    return new Intl.NumberFormat(bcp47Tag(locale), { style: 'percent', maximumFractionDigits: 1 }).format(num / den);
  };

  const commit = (next: PdState, focus: string | null = null, message?: string) => {
    if (next === state) return;
    state = next;
    context.requestSave();
    focusNext = focus;
    render();
    if (message) announce(live, message);
  };

  const heading = (tag: 'h2' | 'h3', id: string, label: string) => h(tag, { id, tabindex: -1, class: 'pd-heading' }, label);

  /* ---------- Case file ---------- */

  const freqRow = (c: ClueCase, nums: number[], den: number) =>
    h(
      'ul',
      { class: 'pd-freq' },
      ...nums.map((num, i) => h('li', {}, named(c, i), ': ', bdi(stated(num, den, state.difficulty))))
    );

  const answerText = (c: ClueCase, a: ClueCase['answers'][number]) =>
    a === 'skip' ? t('skipped') : c.hyps === 2 ? `${MARKS[0]} ${whole(a[0]!)} · ${MARKS[1]} ${whole(a[1]!)}` : a.map((x, i) => `${MARKS[i]} ${whole(x)}`).join(' · ');

  const caseFile = (c: ClueCase) => {
    const tx = text(c);
    const shown = isReview(c) ? c.clues.length : revealed(c);
    const cards = c.clues.slice(0, shown).map((clue, k) => {
      const ct = tx.clues[clue.id]!;
      const a = c.answers[k];
      return h(
        'section',
        { class: 'pd-clue', 'data-testid': `pd-clue-${k}`, 'aria-labelledby': `pd-clue-h-${k}` },
        heading('h3', `pd-clue-h-${k}`, t('clue', { n: k + 1 })),
        h('p', { class: 'pd-observation' }, clue.result === 1 ? ct.seen : ct.notSeen),
        h('p', { class: 'pd-small' }, h('strong', {}, ct.label), ' — ', t('freq.row')),
        freqRow(c, clue.num, clue.den),
        a !== undefined ? h('p', { class: 'pd-you', 'data-testid': `pd-you-${k}` }, t('you', { p: answerText(c, a) })) : ''
      );
    });
    return h(
      'div',
      { class: 'pd-file', 'data-testid': 'pd-file' },
      h('p', { class: 'pd-story' }, tx.story),
      h('section', { class: 'pd-known' }, h('h3', {}, t('known')), h('p', {}, tx.lead), freqRow(c, c.prior, c.priorDen)),
      ...cards,
      h('p', { class: 'pd-small pd-invented' }, t('invented'))
    );
  };

  /* ---------- Belief panel (design § 12) ---------- */

  /** A split bar; `ghost` marks a share of the first hypothesis (◇ the belief before this clue, ◆ your estimate). */
  const splitBar = (b: number[], ghost?: number, glyph = '◇') =>
    h(
      'div',
      { class: 'pd-split', 'aria-hidden': 'true' },
      ...b.map((x, i) => h('span', { class: `pd-seg pd-seg${i}`, style: `inline-size: ${x}%` })),
      ghost === undefined ? '' : h('span', { class: 'pd-ghost', style: `inset-inline-start: ${ghost}%` }, glyph)
    );

  const beliefPanel = (c: ClueCase) => {
    const k = c.answers.length;
    const prevExact = k === 0 ? posteriorAfter(c, 0) : null;
    const prev = c.answers[k - 1];
    const before = prev && prev !== 'skip' ? prev[0]! : Math.round(toNumber((prevExact ?? posteriorAfter(c, k))[0]!) * 100);
    const draft = c.draft;
    /** Re-rendering replaces the controls, so focus returns to the control that changed the draft. */
    const set = (b: number[], focus: string | null = null) => {
      if (!paused) commit(setDraft(state, b), focus);
    };
    const controls: HTMLElement[] = [];
    if (c.hyps === 2) {
      const range = h('input', {
        type: 'range',
        min: 0,
        max: 100,
        step: 1,
        class: 'pd-range',
        id: 'pd-range',
        'aria-label': t('belief.slider', { name: hypName(c, 0) }),
        'aria-valuetext': t('belief.valuetext', { a: hypName(c, 0), pa: whole(draft[0]!), b: hypName(c, 1), pb: whole(draft[1]!) }),
        'data-testid': 'pd-range'
      });
      range.value = String(draft[0]);
      const preview = (v: number) => {
        bar.replaceWith((bar = splitBar([v, 100 - v], before)));
        values.textContent = `${MARKS[0]} ${whole(v)} · ${MARKS[1]} ${whole(100 - v)}`;
        range.setAttribute('aria-valuetext', t('belief.valuetext', { a: hypName(c, 0), pa: whole(v), b: hypName(c, 1), pb: whole(100 - v) }));
      };
      range.addEventListener('input', () => preview(Number(range.value)));
      range.addEventListener('change', () => set([Number(range.value), 100 - Number(range.value)], 'pd-range'));
      const minus = h('button', { type: 'button', class: 'pd-step', id: 'pd-minus', 'data-act': 'minus', 'data-testid': 'pd-minus', 'aria-label': t('belief.minus', { name: hypName(c, 0) }) }, '−');
      const plus = h('button', { type: 'button', class: 'pd-step', id: 'pd-plus', 'data-act': 'plus', 'data-testid': 'pd-plus', 'aria-label': t('belief.plus', { name: hypName(c, 0) }) }, '+');
      minus.addEventListener('click', () => set([Math.max(0, draft[0]! - 1), Math.min(100, draft[1]! + 1)], 'pd-minus'));
      plus.addEventListener('click', () => set([Math.min(100, draft[0]! + 1), Math.max(0, draft[1]! - 1)], 'pd-plus'));
      let bar = splitBar(draft, before);
      const values = h('p', { class: 'pd-values', 'data-testid': 'pd-values' }, `${MARKS[0]} ${whole(draft[0]!)} · ${MARKS[1]} ${whole(draft[1]!)}`);
      controls.push(
        h('div', { class: 'pd-ends' }, named(c, 0), named(c, 1)),
        h('div', { class: 'pd-barwrap' }, bar),
        values,
        h('div', { class: 'pd-slider-row' }, minus, range, plus)
      );
    } else {
      controls.push(h('div', { class: 'pd-barwrap' }, splitBar(draft)));
      draft.forEach((x, i) => {
        const spin = h(
          'span',
          {
            role: 'spinbutton',
            tabindex: 0,
            class: 'pd-spin',
            'aria-label': t('belief.stepper', { name: hypName(c, i) }),
            'aria-valuenow': x,
            'aria-valuemin': 0,
            'aria-valuemax': 100,
            'aria-valuetext': whole(x),
            id: `pd-spin-${i}`,
            'data-testid': `pd-spin-${i}`
          },
          whole(x)
        );
        const to = (v: number, focus = `pd-spin-${i}`) => {
          if (!paused) commit(shareDraft(state, i, v), focus);
        };
        spin.addEventListener('keydown', (e) => {
          const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key];
          if (step !== undefined) to(x + step);
          else if (e.key === 'Home') to(0);
          else if (e.key === 'End') to(100);
          else return;
          e.preventDefault();
        });
        const minus = h('button', { type: 'button', class: 'pd-step', id: `pd-minus-${i}`, 'data-act': i === 0 ? 'minus' : undefined, 'aria-label': t('belief.minus', { name: hypName(c, i) }) }, '−');
        const plus = h('button', { type: 'button', class: 'pd-step', id: `pd-plus-${i}`, 'data-act': i === 0 ? 'plus' : undefined, 'data-testid': `pd-plus-${i}`, 'aria-label': t('belief.plus', { name: hypName(c, i) }) }, '+');
        minus.addEventListener('click', () => to(x - 1, `pd-minus-${i}`));
        plus.addEventListener('click', () => to(x + 1, `pd-plus-${i}`));
        controls.push(h('div', { class: 'pd-three' }, named(c, i), h('span', { class: 'pd-stepper' }, minus, spin, plus)));
      });
      const even = h('button', { type: 'button', class: 'pd-secondary', id: 'pd-even', 'data-testid': 'pd-even' }, t('belief.even'));
      even.addEventListener('click', () => set(evenly(3), 'pd-even'));
      controls.push(even);
    }
    const last = k === c.clues.length - 1;
    const next = h('button', { type: 'button', class: 'pd-primary', 'data-testid': 'pd-commit' }, t(last ? 'action.close' : 'action.next'));
    const skip = h('button', { type: 'button', class: 'pd-secondary', 'data-testid': 'pd-skip' }, t('action.skip'));
    const back = h('button', { type: 'button', class: 'pd-secondary', id: 'pd-reset', 'data-testid': 'pd-reset' }, t('belief.reset'));
    const go = (asSkip: boolean) => {
      if (paused) return;
      const s = commitStep(state, asSkip);
      const nc = s.cases[s.index]!;
      if (isReview(nc)) {
        const notes = caseNotes(nc);
        if (notes.length) saveNotebook(notebookAdd(notebook(), notes));
        commit(s, 'pd-review-heading', `${t('review.heading')}: ${t('review.truth', { name: hypName(nc, nc.truth) })}`);
      } else {
        const clue = nc.clues[nc.answers.length]!;
        const ct = text(nc).clues[clue.id]!;
        commit(s, `pd-clue-h-${nc.answers.length}`, `${t('clue', { n: nc.answers.length + 1 })}: ${clue.result === 1 ? ct.seen : ct.notSeen}`);
      }
    };
    next.addEventListener('click', () => go(false));
    skip.addEventListener('click', () => go(true));
    back.addEventListener('click', () => !paused && commit(resetDraft(state), 'pd-reset'));
    return h(
      'section',
      { class: 'pd-panel', 'aria-labelledby': 'pd-belief-h', 'data-testid': 'pd-belief' },
      h('h3', { id: 'pd-belief-h' }, t('belief.heading')),
      ...controls,
      c.hyps === 2 ? h('p', { class: 'pd-small' }, t('belief.before', { p: whole(before) })) : '',
      h('p', { class: 'pd-small' }, draft.map((x, i) => t('belief.freq', { k: formatInt(x, locale), name: hypName(c, i) })).join(' · ')),
      h('div', { class: 'pd-actions' }, next, skip),
      back,
      h('details', { class: 'pd-hint' }, h('summary', {}, t('hint.heading')), h('p', {}, t('hint.text')))
    );
  };

  /* ---------- Review (design § 10, § 11) ---------- */

  const moveText = (c: ClueCase, m: Movement): string => {
    switch (m.kind) {
      case 'neutral':
        return `${t('move.neutral')} ${m.stayed ? t('move.stayed') : t('move.moved', { n: formatInt(m.moved, locale) })}`;
      case 'decisive':
        return `${t('move.decisive', { name: hypName(c, m.excluded) })}${m.ok ? ' ✓' : ''}`;
      case 'ratio':
        return t(`move.${m.cls}`);
      case 'three':
        return `${t('move.fromThree', { list: m.target.map((x, i) => `${MARKS[i]} ${pct(x)}`).join(' · ') })} ${t(`band.${m.band}`)} ${BAND_MARKS[m.band]}`;
    }
  };

  const ledger = (c: ClueCase) => {
    const r = reviewCase(c);
    const rows: HTMLElement[] = [];
    const base = reduced(weightsAfter(c, 0));
    const p0 = posteriorAfter(c, 0);
    rows.push(
      h(
        'li',
        { class: 'pd-row' },
        h('strong', {}, t('ledger.base')),
        h('span', { class: 'pd-weights' }, bdi(base.map((x) => formatInt(x, locale)).join(' : '))),
        splitBar(p0.map((x) => toNumber(x) * 100)),
        h('span', {}, p0.map((x, i) => `${MARKS[i]} ${pct(x)}`).join(' · '))
      )
    );
    c.clues.forEach((clue, k) => {
      const l = likelihood(clue);
      const lr = reduced(l.map((x) => BigInt(x)));
      const w = reduced(weightsAfter(c, k + 1));
      const p = posteriorAfter(c, k + 1);
      const st = r.steps[k]!;
      const neutral = l.every((x) => x === l[0]);
      const feedback: (HTMLElement | string)[] = [];
      if (st.answer !== 'skip' && st.band) {
        feedback.push(h('span', { class: 'pd-band', 'data-band': st.band }, `${BAND_MARKS[st.band]} ${t(`band.${st.band}`)}`));
        if (st.move) feedback.push(' ', moveText(c, st.move));
      }
      rows.push(
        h(
          'li',
          { class: 'pd-row', 'data-testid': `pd-step-${k}` },
          h('strong', {}, `${t('clue', { n: k + 1 })}: ${text(c).clues[clue.id]!.label}${clue.result === 1 ? '' : ` (${t('notSeen')})`}`),
          h('span', { class: 'pd-weights' }, bdi(neutral ? t('ledger.nothing') : `${lr.map((x) => `× ${formatInt(x, locale)}`).join(' : ')} → ${w.map((x) => formatInt(x, locale)).join(' : ')}`)),
          splitBar(p.map((x) => toNumber(x) * 100), st.answer === 'skip' ? undefined : st.answer[0], '◆'),
          h('span', {}, t('ledger.exact', { p: p.map((x, i) => `${MARKS[i]} ${pct(x)}`).join(' · ') }), ' · ', t('you', { p: answerText(c, st.answer) })),
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
      r.baseRate ? h('p', { class: 'pd-flag', 'data-testid': 'pd-baserate' }, t('baseRate.flag', { name: hypName(c, 0), p: pct(posteriorAfter(c, 1)[0]!) })) : ''
    );
  };

  const board = (c: ClueCase) => {
    const b = countingBoard(c);
    if (!b) return '';
    const head = h('tr', {}, h('th', { scope: 'col' }, t('board.step')), ...b.levels[0]!.map((_, i) => h('th', { scope: 'col' }, named(c, i))), h('th', { scope: 'col' }, t('board.total')));
    const rows = b.levels.map((lv, k) =>
      h(
        'tr',
        {},
        h('th', { scope: 'row' }, k === 0 ? t('ledger.base') : t('board.fits', { n: k })),
        ...lv.map((x) => h('td', {}, bdi(formatInt(x, locale)))),
        h('td', {}, bdi(formatInt(lv.reduce((s, x) => s + x, 0n), locale)))
      )
    );
    const lastLv = b.levels[b.levels.length - 1]!;
    const fit = lastLv.reduce((s, x) => s + x, 0n);
    const lead = lastLv.reduce((bi, x, i) => (x > lastLv[bi]! ? i : bi), 0);
    return h(
      'section',
      { class: 'pd-board', 'data-testid': 'pd-board' },
      h('h3', {}, t('board.heading')),
      h('p', {}, t('board.intro', { n: formatInt(b.population, locale) })),
      h('div', { class: 'pd-scroll' }, h('table', { class: 'pd-table' }, h('thead', {}, head), h('tbody', {}, ...rows))),
      // The closing sentence speaks of "every clue", so it appears only when the board covers all of them.
      fit > 0n && b.levels.length === c.clues.length + 1
        ? h('p', {}, t('board.end', { fit: formatInt(fit, locale), k: formatInt(lastLv[lead]!, locale), name: hypName(c, lead), p: pct({ n: lastLv[lead]!, d: fit }) }))
        : ''
    );
  };

  const formulas = (c: ClueCase) => {
    const p0 = posteriorAfter(c, 0);
    const clue = c.clues[0]!;
    const l = likelihood(clue);
    const w = weightsAfter(c, 1);
    const total = w.reduce((s, x) => s + x, 0n);
    const terms = l.map((x, i) => `${formatRatio(x, clue.den, locale)} · ${pct(p0[i]!)}`);
    const name = hypName(c, 0);
    const p1 = posteriorAfter(c, 1)[0]!;
    const g = reduced([w[0]!, total]);
    return h(
      'details',
      { class: 'pd-formulas', 'data-testid': 'pd-formulas' },
      h('summary', {}, t('formula.heading')),
      h('p', {}, t('formula.bayes')),
      h('p', { class: 'pd-formula', dir: 'ltr' }, 'P(', bdi(name), ' | ', t('clue', { n: 1 }), ') = ', terms[0]!, ' / (', terms.join(' + '), ') = ', formatRatio(g[0]!, g[1]!, locale), ' = ', pct(p1)),
      h('p', {}, t('formula.odds')),
      h(
        'p',
        { class: 'pd-formula', dir: 'ltr' },
        reduced(weightsAfter(c, 0)).map((x) => formatInt(x, locale)).join(' : '),
        ' × ',
        reduced(l.map(BigInt)).map((x) => formatInt(x, locale)).join(' : '),
        ' = ',
        reduced(w).map((x) => formatInt(x, locale)).join(' : ')
      )
    );
  };

  const review = (c: ClueCase) => {
    const r = reviewCase(c);
    const last = state.index === state.cases.length - 1;
    const next = h('button', { type: 'button', class: 'pd-primary', 'data-testid': last ? 'pd-summary-btn' : 'pd-next' }, t(last ? 'action.summary' : 'action.nextCase'));
    next.addEventListener('click', () => !paused && commit(nextCase(state), last ? 'pd-summary-heading' : 'pd-case-heading'));
    const pn = posteriorAfter(c, c.clues.length);
    const forecast: HTMLElement[] = [];
    if (r.score !== null) {
      const ref = c.hyps === 2 ? 75 : 67;
      forecast.push(h('p', { 'data-testid': 'pd-forecast' }, t('forecast.line', { s: formatInt(r.score, locale), e: formatInt(Math.round(toNumber(r.exactScore)), locale), r: formatInt(ref, locale) })));
      // A good estimate on a case that went the less likely way: say how often that happens.
      const pTruth = toNumber(pn[c.truth]!);
      if ((r.finalBand === 'spot' || r.finalBand === 'close') && pTruth < 0.5 && pTruth > 0)
        forecast.push(h('p', { 'data-testid': 'pd-luck' }, t('forecast.luck', { k: formatInt(Math.max(1, Math.round(pTruth * 100)), locale) })));
    }
    return h(
      'section',
      { class: 'pd-review', 'data-testid': 'pd-review' },
      heading('h3', 'pd-review-heading', t('review.heading')),
      h('p', { class: 'pd-truth', 'data-testid': 'pd-truth' }, mark(c.truth), ' ', t('review.truth', { name: hypName(c, c.truth) })),
      r.finalBand
        ? h('p', { class: 'pd-verdict', 'data-testid': 'pd-verdict', 'data-band': r.finalBand }, `${BAND_MARKS[r.finalBand]} ${t(`band.${r.finalBand}`)}`)
        : '',
      h('p', {}, t('review.final', { p: pn.map((x, i) => `${MARKS[i]} ${pct(x)}`).join(' · ') })),
      h('h3', {}, t('review.numbers')),
      board(c),
      ledger(c),
      h('section', { class: 'pd-forecast' }, h('h3', {}, t('forecast.heading')), ...forecast, h('p', { class: 'pd-small' }, t('forecast.explain'))),
      formulas(c),
      h('div', { class: 'pd-actions' }, next)
    );
  };

  /* ---------- Summary and notebook ---------- */

  const notebook = (): NoteEntry[] => {
    try {
      return readNotebook(context.preferences?.get(NOTEBOOK_KEY));
    } catch {
      return [];
    }
  };
  const saveNotebook = (book: NoteEntry[]) => {
    try {
      context.preferences?.set(NOTEBOOK_KEY, book);
    } catch {
      /* preferences are optional */
    }
  };

  const calibration = () => {
    if (!context.preferences) return '';
    const book = notebook();
    const box = h('section', { class: 'pd-calibration', 'data-testid': 'pd-calibration' }, h('h3', {}, t('calib.heading')));
    if (book.length < NOTEBOOK_MIN) {
      box.append(h('p', {}, t('calib.few', { n: formatInt(NOTEBOOK_MIN, locale), k: formatInt(book.length, locale) })));
    } else {
      box.append(
        h('p', {}, t('calib.intro', { n: formatInt(book.length, locale) })),
        h(
          'ul',
          { class: 'pd-calib-list' },
          ...notebookBins(book).map((b) =>
            h('li', {}, t('calib.row', { p: whole(b.centre), k: formatInt(b.hits, locale), n: formatInt(b.count, locale), q: whole(Math.round((100 * b.hits) / b.count)) }))
          )
        )
      );
    }
    if (book.length > 0) {
      const clearBtn = h('button', { type: 'button', class: 'pd-secondary', 'data-testid': 'pd-calib-clear' }, t('calib.clear'));
      clearBtn.addEventListener('click', () => {
        saveNotebook([]);
        focusNext = 'pd-summary-heading';
        render();
        announce(live, t('calib.cleared'));
      });
      box.append(clearBtn);
    }
    return box;
  };

  const renderSummary = () => {
    const sum = summarize(state);
    const rows = h(
      'ul',
      { class: 'pd-summary-list', 'data-testid': 'pd-summary-list' },
      ...state.cases.map((c, i) => {
        const row = sum.rows[i]!;
        return h(
          'li',
          { 'data-band': row.band ?? 'skip' },
          h('strong', {}, text(c).title),
          ': ',
          row.band ? `${BAND_MARKS[row.band]} ${t(`band.${row.band}`)}` : t('skipped'),
          ' · ',
          t('review.truth', { name: hypName(c, c.truth) })
        );
      })
    );
    const lines: HTMLElement[] = [h('p', {}, t('summary.close', { a: formatInt(sum.veryClose, locale), n: formatInt(sum.scored, locale), b: formatInt(sum.close, locale) }))];
    if (sum.habit) lines.push(h('p', { 'data-testid': 'pd-habit' }, t(`habit.${sum.habit}`)));
    if (sum.baseRateCases > 0) lines.push(h('p', {}, t('summary.baseRate', { n: formatInt(sum.baseRateCases, locale) })));
    if (sum.forecastAvg !== null && sum.exactAvg !== null) lines.push(h('p', {}, t('summary.forecast', { a: formatInt(sum.forecastAvg, locale), b: formatInt(sum.exactAvg, locale) })));
    return [
      heading('h2', 'pd-summary-heading', t('summary.heading')),
      rows,
      ...lines,
      h('p', { class: 'pd-tip', 'data-testid': 'pd-tip', 'data-tip': sum.tip }, h('strong', {}, `${t('tip.heading')}: `), t(`tip.${sum.tip}`)),
      calibration()
    ];
  };

  /* ---------- Render ---------- */

  function render() {
    clear(main);
    if (isSummary(state)) {
      container.dataset.phase = 'summary';
      main.append(...renderSummary());
      if (!state.reported) {
        state = markReported(state);
        context.requestSave();
        const sum = summarize(state);
        context.finished({
          outcome: 'completed',
          stats: { cases: ROUND_LENGTH, scored: sum.scored, veryClose: sum.veryClose, close: sum.close, ...(sum.forecastAvg === null ? {} : { forecastAvg: sum.forecastAvg }) }
        });
      }
    } else {
      const c = currentCase(state)!;
      const inReview = isReview(c);
      container.dataset.phase = inReview ? 'review' : 'clue';
      main.append(
        h(
          'header',
          { class: 'pd-head' },
          h('p', { class: 'pd-progress', 'data-testid': 'pd-progress' }, `${t('progress', { n: state.index + 1, total: state.cases.length })} · ${t('kind.clues')}`),
          heading('h2', 'pd-case-heading', text(c).title)
        ),
        h('div', { class: `pd-layout${inReview ? ' pd-layout--review' : ''}`, 'data-template': c.template }, caseFile(c), inReview ? review(c) : beliefPanel(c))
      );
    }
    if (focusNext) {
      main.querySelector<HTMLElement>(`#${focusNext}`)?.focus();
      focusNext = null;
    }
  }

  const show = (next: PdState) => {
    state = next;
    focusNext = null;
    if (!container.isConnected) root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      const difficulty = (DIFFICULTIES as readonly string[]).includes(options.difficulty ?? '') ? (options.difficulty as Difficulty) : 'easy';
      show(createRound(options.seed, difficulty));
    },
    restore(saved: PdState) {
      show(clone(saved));
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      show(restartRound(state));
      context.requestSave();
    },
    dispose() {
      clear(root);
    }
  };
}
