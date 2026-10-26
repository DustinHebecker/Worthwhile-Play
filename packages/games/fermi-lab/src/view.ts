import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { contentFor, type ContentText } from './content';
import { fieldParts, fieldText, formatQuantity, parseLocaleNumber, roundSig, type ParseResult } from './format';
import {
  EXP_MAX,
  EXP_MIN,
  ROUND_LENGTH,
  TEXT_MAX,
  commitGuess,
  compare,
  createInitial,
  currentQuestion,
  factorOf,
  finishModel,
  isGivenRow,
  isSummary,
  marksOf,
  markFinished,
  modelResult,
  next,
  resetState,
  score,
  sensitivity,
  setDraft,
  setRowNumber,
  summarize,
  taskOf,
  type Band,
  type FactorState,
  type FermiState,
  type QuestionState,
  type Score
} from './rules';
import type { Power, Task } from './tasks';
import { WORD_UNITS, dimsText, isCountWord, unitText } from './units';
import './styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
type SvgAttrs = Record<string, string | number>;
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: SvgAttrs, ...children: (SVGElement | string)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  for (const child of children) el.append(child);
  return el;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const WORDS: ReadonlySet<string> = new Set(WORD_UNITS);
/** Word units with a count form after a number ("160 days", "25 years"). */
const COUNTED: ReadonlySet<string> = new Set(['day', 'year']);

/** Chart geometry (SVG units; the charts scale to the width). */
const CHART_W = 600;
const PAD = 24;

export function createFermiLab(context: GameContext): GameInstance<FermiState> {
  const { t, root } = context;
  const locale = t.locale;
  let state = createInitial(0);
  let paused = false;
  /** Focus the heading of the current phase after the next render (after a commit, not on restore). */
  let focusNext: string | null = null;
  let estimateField: HTMLInputElement | null = null;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'fl-announcer' });
  const main = h('div', { class: 'fl-main' });
  const container = h('div', { class: 'wp-fermi-lab', dir: t.direction, lang: bcp47Tag(locale), 'data-testid': 'fl-root' }, main, live);

  const text = (): ContentText => contentFor(locale);
  const factorName = (id: string): string => text().factors[id] ?? id;

  /* ---------- Numbers and units ---------- */

  const unitLabel = (unit: string): string =>
    unit === '1' ? '' : unitText(unit, (name, countForm) => (isCountWord(name) || (countForm && COUNTED.has(name)) ? t(`${countForm ? 'n' : 'u'}.${name}`) : WORDS.has(name) ? t(`u.${name}`) : name));

  const sciLabel = (v: number): string => {
    const q = formatQuantity(v, locale);
    return q.exponent === null ? q.text : t('number.scientific', { mantissa: q.mantissa, exponent: q.exponentText });
  };

  /** A quantity as text for announcements and `aria-label`s. */
  const spoken = (v: number, unit = ''): string => {
    const q = formatQuantity(v, locale);
    const words = q.words ? ` (${q.words})` : '';
    const u = unitLabel(unit);
    return `${sciLabel(v)}${words}${u ? ` ${u}` : ''}`;
  };

  /** A quantity for display: mantissa × 10<sup>n</sup>, the locale's large-number words and the unit. */
  const quantity = (v: number, unit = '', options: { words?: boolean; testid?: string } = {}): HTMLElement => {
    const q = formatQuantity(v, locale);
    const u = unitLabel(unit);
    const el = h('span', { class: 'fl-qty', 'data-value': String(v), 'data-testid': options.testid, 'aria-label': spoken(v, unit) });
    const num = h('bdi', { class: 'fl-num', dir: 'ltr', 'aria-hidden': 'true' }, q.mantissa);
    if (q.exponent !== null) num.append(' × 10', h('sup', {}, q.exponentText));
    el.append(num);
    if (u) el.append(h('span', { class: 'fl-unit', 'aria-hidden': 'true' }, ` ${u}`));
    if (q.words && options.words !== false) el.append(h('span', { class: 'fl-words', 'aria-hidden': 'true' }, ` (${q.words})`));
    return el;
  };

  const listText = (items: string[]): string => {
    try {
      return new Intl.ListFormat(bcp47Tag(locale), { type: 'unit', style: 'short' }).format(items);
    } catch {
      return items.join(', ');
    }
  };
  const ratio = (f: number): string => formatQuantity(roundSig(f, 2), locale, 2).text;
  const powerSymbol = (p: Power): string => t(`op.${p}`);

  /* ---------- Number input (field, × 10ⁿ stepper, interpretation, optional slider and step buttons) ---------- */

  interface NumberOptions {
    readonly testid: string;
    readonly label: string;
    readonly text: string;
    readonly exp: number;
    /** The value saved with the text (rows): when the text reads differently in this language, the saved value wins. */
    readonly saved?: number | null;
    readonly unit: string;
    readonly slider?: { readonly lo: number };
    readonly steps?: boolean;
    readonly live?: boolean;
    /** Called with the new text, stepper and the parsed field value (without the stepper), only when something changed. */
    readonly onChange: (text: string, exp: number, value: number | null) => void;
    readonly onEnter?: () => void;
  }

  interface NumberWidget {
    readonly el: HTMLElement;
    readonly field: HTMLInputElement;
    /** The parsed value × 10ⁿ (null when empty or unreadable). */
    value(): number | null;
  }

  /** Slider resolution in decades (one arrow key ≈ × 1.12). */
  const SLIDER_STEP = 0.05;
  /** Significant digits kept by ÷2 / ×2: exact for anything a person types, no rounding drift. */
  const EXACT = 12;

  /** A field text for `m` that keeps every digit: plain from 0.01 to below 10⁶, else mantissa and a power of ten. */
  const exactParts = (m: number): { text: string; exp: number } => {
    const r = roundSig(m, EXACT);
    if (r >= 0.01 && r < 1e6) return { text: fieldText(r, locale, EXACT), exp: 0 };
    return fieldParts(r, locale, EXACT);
  };

  let uid = 0;
  /**
   * One value per input (design § 5, change 2026-10-25b): `field × 10^stepper`. Every control writes through `write`,
   * and `show` derives every view (field, stepper, interpretation, slider position and text) from that value alone,
   * so after any sequence of actions, and after a reload, all of them agree.
   */
  const numberWidget = (o: NumberOptions): NumberWidget => {
    const id = `fl-n${++uid}`;
    let current = [...o.text].slice(0, TEXT_MAX).join('');
    let exp = Math.max(EXP_MIN, Math.min(EXP_MAX, o.exp));
    const parse = (): ParseResult => parseLocaleNumber(current, locale);
    const value = (): number | null => {
      const r = parse();
      if (!r.ok) return null;
      const v = r.value * 10 ** exp;
      return Number.isFinite(v) && v > 0 ? v : null;
    };
    // A text saved in another language can read differently here ("1,500"): show the saved value instead.
    let corrected = false;
    if (typeof o.saved === 'number' && Number.isFinite(o.saved) && o.saved > 0) {
      const r = parse();
      if (!r.ok || Math.abs(r.value / o.saved - 1) > 1e-9) {
        current = exactParts(o.saved).text;
        exp = Math.max(EXP_MIN, Math.min(EXP_MAX, exp + exactParts(o.saved).exp));
        corrected = true;
      }
    }
    const field = h('input', {
      id,
      type: 'text',
      inputmode: 'decimal',
      enterkeyhint: o.onEnter ? 'done' : 'next',
      autocomplete: 'off',
      spellcheck: 'false',
      dir: 'ltr',
      class: 'fl-field',
      maxlength: TEXT_MAX,
      'aria-describedby': `${id}-interp`,
      'data-testid': `${o.testid}-input`
    });
    const expOut = h('output', { class: 'fl-exp-value', 'data-testid': `${o.testid}-exp`, 'aria-live': 'off' });
    const expMinus = h('button', { type: 'button', class: 'fl-exp-btn', 'aria-label': t('exp.minus'), 'data-testid': `${o.testid}-exp-minus` }, '−');
    const expPlus = h('button', { type: 'button', class: 'fl-exp-btn', 'aria-label': t('exp.plus'), 'data-testid': `${o.testid}-exp-plus` }, '+');
    const stepper = h(
      'span',
      { class: 'fl-stepper', role: 'group', 'aria-label': t('input.exp'), dir: 'ltr' },
      h('span', { class: 'fl-times', 'aria-hidden': 'true' }, '× 10'),
      expMinus,
      expOut,
      expPlus
    );
    const unitEl = h('span', { class: 'fl-field-unit' }, unitLabel(o.unit));
    const interp = h('p', { class: 'fl-interp', id: `${id}-interp`, 'data-testid': `${o.testid}-interp`, ...(o.live ? { 'aria-live': 'polite' } : {}) });
    const el = h(
      'div',
      { class: 'fl-number' },
      h('label', { class: 'fl-label', for: id }, o.label),
      h('div', { class: 'fl-entry' }, field, h('span', { class: 'fl-entry-rest' }, stepper, unitEl)),
      interp
    );
    const intText = (n: number) => new Intl.NumberFormat(bcp47Tag(locale), { useGrouping: false }).format(n);

    let slider: HTMLInputElement | null = null;
    const stepButtons: { readonly el: HTMLButtonElement; readonly can: () => boolean }[] = [];

    /** Derives every view from (current, exp). `fromField`: the player is typing, the field keeps their text. */
    const show = (fromField: boolean) => {
      if (!fromField) field.value = current;
      expOut.textContent = intText(exp);
      expMinus.disabled = exp <= EXP_MIN;
      expPlus.disabled = exp >= EXP_MAX;
      clear(interp);
      const r = parse();
      const v = value();
      if (!r.ok && r.reason === 'empty') interp.append(o.slider ? t('interp.empty') : '');
      else if (!r.ok || v === null) {
        interp.append(h('span', { class: 'fl-warn' }, `⚠ ${t(!r.ok && r.reason === 'notPositive' ? 'interp.notPositive' : 'interp.invalid')}`));
      } else {
        interp.append(h('span', { class: 'fl-interp-label' }, `${t('interp.understood')}: `), quantity(v, o.unit, { testid: `${o.testid}-value` }));
      }
      // Only an impossible step is disabled (an empty field keeps the buttons, which then say what is missing).
      for (const b of stepButtons) b.el.disabled = v !== null && !b.can();
      if (slider && o.slider) {
        const lo = o.slider.lo;
        const hi = lo + 10;
        if (v === null) {
          slider.value = String(lo + 5);
          slider.dataset.empty = 'true';
          delete slider.dataset.out;
          slider.setAttribute('aria-valuetext', t('interp.empty'));
        } else {
          const x = Math.log10(v);
          const pos = lo + Math.round((Math.min(hi, Math.max(lo, x)) - lo) / SLIDER_STEP) * SLIDER_STEP;
          slider.value = String(Math.round(pos * 100) / 100);
          delete slider.dataset.empty;
          if (x < lo) slider.dataset.out = 'low';
          else if (x > hi) slider.dataset.out = 'high';
          else delete slider.dataset.out;
          slider.setAttribute('aria-valuetext', spoken(v, o.unit));
        }
      }
    };

    /** The one write path: every control ends here. */
    const write = (text: string, e: number, fromField = false) => {
      const nextText = [...text].slice(0, TEXT_MAX).join('');
      const nextExp = Math.max(EXP_MIN, Math.min(EXP_MAX, e));
      const changedNow = nextText !== current || nextExp !== exp;
      current = nextText;
      exp = nextExp;
      show(fromField);
      if (changedNow) {
        const r = parse();
        o.onChange(current, exp, r.ok ? r.value : null);
      }
    };

    /**
     * ÷2 / ×2 on the exact value, written in the same canonical form as the slider (plain from 0.01 to below 10⁶,
     * otherwise mantissa and stepper), so the power of ten lives in one place.
     */
    const scaled = (k: number): { text: string; exp: number } | null => {
      const v = value();
      if (v === null) return null;
      const parts = exactParts(v * k);
      const e = parts.exp;
      if (e < EXP_MIN || e > EXP_MAX || [...parts.text].length > TEXT_MAX) return null;
      const back = parseLocaleNumber(parts.text, locale);
      return back.ok && Number.isFinite(back.value * 10 ** e) ? { text: parts.text, exp: e } : null;
    };

    if (o.slider) {
      const lo = o.slider.lo;
      const s = h('input', {
        type: 'range',
        class: 'fl-slider',
        min: lo,
        max: lo + 10,
        step: SLIDER_STEP,
        'aria-label': t('input.slider'),
        'aria-describedby': `${id}-interp`,
        'data-testid': `${o.testid}-slider`
      });
      slider = s;
      s.addEventListener('input', () => {
        if (paused) return show(false);
        const parts = fieldParts(10 ** Number(s.value), locale);
        write(parts.text, parts.exp);
      });
      const end = (n: number) => {
        const label = h('span', { class: 'fl-slider-end', 'aria-hidden': 'true' }, '10');
        label.append(h('sup', {}, intText(n)));
        return label;
      };
      el.append(h('div', { class: 'fl-slider-row', dir: 'ltr' }, end(lo), s, end(lo + 10)));
    }
    if (o.steps) {
      const stepButton = (label: string, aria: string, testid: string, can: () => boolean, apply: () => void) => {
        const b = h('button', { type: 'button', class: 'fl-step', 'aria-label': aria, 'data-testid': `${o.testid}-${testid}`, onclick: () => !paused && apply() }, label);
        stepButtons.push({ el: b, can });
        return b;
      };
      const scaleBy = (k: number) => {
        const next = scaled(k);
        if (!next) return announce(live, t('need.guess'));
        write(next.text, next.exp);
      };
      const shift = (d: number) => {
        if (!parse().ok) return announce(live, t('need.guess'));
        write(current, exp + d);
      };
      el.append(
        h(
          'div',
          { class: 'fl-steps', dir: 'ltr' },
          stepButton('÷10', t('step.div10'), 'div10', () => exp > EXP_MIN, () => shift(-1)),
          stepButton('÷2', t('step.div2'), 'div2', () => scaled(0.5) !== null, () => scaleBy(0.5)),
          stepButton('×2', t('step.mul2'), 'mul2', () => scaled(2) !== null, () => scaleBy(2)),
          stepButton('×10', t('step.mul10'), 'mul10', () => exp < EXP_MAX, () => shift(1))
        )
      );
    }
    field.addEventListener('input', () => {
      if (paused) return show(false);
      write(field.value, exp, true);
    });
    field.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && o.onEnter) {
        event.preventDefault();
        o.onEnter();
      }
    });
    expMinus.addEventListener('click', () => !paused && write(current, exp - 1));
    expPlus.addEventListener('click', () => !paused && write(current, exp + 1));
    show(false);
    if (corrected) {
      const r = parse();
      o.onChange(current, exp, r.ok ? r.value : null);
    }
    return { el, field, value };
  };

  /* ---------- Committing ---------- */

  const commit = (nextState: FermiState, focus: string | null = null) => {
    if (nextState === state) return;
    state = nextState;
    focusNext = focus;
    render();
    context.requestSave();
  };

  /** Quiet edits (typing): the state changes and is saved, the screen is not rebuilt. */
  const edit = (nextState: FermiState) => {
    if (nextState === state) return;
    state = nextState;
    context.requestSave();
  };

  /* ---------- Screens ---------- */

  const header = (q: QuestionState, task: Task) =>
    h(
      'div',
      { class: 'fl-head' },
      h('p', { class: 'fl-progress', 'data-testid': 'fl-progress' }, t('progress', { n: state.index + 1, total: ROUND_LENGTH }), ' · ', t(`category.${task.category}`)),
      h('h2', { class: 'fl-question', 'data-testid': 'fl-question', 'data-task': q.taskId }, text().tasks[q.taskId]?.question ?? q.taskId)
    );

  const heading = (level: 'h2' | 'h3', id: string, label: string) => h(level, { id, tabindex: -1, class: 'fl-heading' }, label);

  const renderEstimate = (q: QuestionState, task: Task): HTMLElement[] => {
    const widget = numberWidget({
      testid: 'fl-est',
      label: t('input.label'),
      text: q.draft,
      exp: q.draftExp,
      unit: task.answer.unit,
      slider: { lo: q.windowLo },
      steps: true,
      live: true,
      onChange: (draft, exp) => edit(setDraft(state, draft, exp)),
      onEnter: () => onGuess()
    });
    const onGuess = () => {
      if (paused) return;
      const v = widget.value();
      if (v === null) {
        announce(live, t('need.guess'));
        widget.field.focus();
        return;
      }
      commit(commitGuess(state, v), 'fl-review-heading');
      announce(live, `${t('announce.guess', { value: spoken(v, task.answer.unit) })} ${t(`verdict.${score(v, task).band}`)}`);
    };
    estimateField = widget.field;
    return [
      h('p', { class: 'fl-hint' }, t('estimate.hint')),
      h('div', { class: 'fl-panel' }, widget.el),
      h('div', { class: 'fl-actions' }, h('button', { type: 'button', class: 'primary', 'data-testid': 'fl-guess', onclick: onGuess }, t('action.guess')))
    ];
  };
  const renderModel = (q: QuestionState, task: Task): HTMLElement[] => {
    const productBox = h('div', { class: 'fl-product', 'aria-live': 'polite', 'data-testid': 'fl-product' });
    const useButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'fl-use-model' }, t('action.useModel'));
    const refreshProduct = () => {
      clear(productBox);
      const cur = currentQuestion(state)!;
      const result = modelResult(task, cur.factors);
      productBox.dataset.status = result.status;
      productBox.append(h('span', { class: 'fl-product-label' }, `${t('product.label')}: `));
      if (result.status === 'ok') productBox.append(quantity(result.value, task.answer.unit, { testid: 'fl-product-value' }), h('span', { class: 'fl-ok' }, ` ${t('product.ok')}`));
      else if (result.status === 'units') {
        const left = dimsText(result.leftover);
        productBox.append(h('span', { class: 'fl-warn' }, left ? t('product.units', { units: left }) : t('product.unitsNone')));
      } else productBox.append(h('span', { class: 'fl-muted' }, t('product.incomplete')));
      useButton.setAttribute('aria-disabled', String(result.status !== 'ok'));
    };
    useButton.addEventListener('click', () => {
      if (paused) return;
      const result = modelResult(task, currentQuestion(state)!.factors);
      if (result.status !== 'ok') return announce(live, t('need.model'));
      commit(finishModel(state), 'fl-review-heading');
      announce(live, t(`verdict.${score(result.value, task).band}`));
    });

    const rowsList = h('ol', { class: 'fl-rows', 'data-testid': 'fl-rows' });
    q.factors.forEach((row, i) => rowsList.append(renderRow(row, i, task, refreshProduct)));
    refreshProduct();
    return [
      heading('h3', 'fl-model-heading', t('model.heading')),
      h('p', { class: 'fl-hint' }, t('model.intro.guided')),
      rowsList,
      productBox,
      h('div', { class: 'fl-actions' }, useButton)
    ];
  };

  const renderRow = (row: FactorState, i: number, task: Task, refresh: () => void): HTMLElement => {
    const ref = factorOf(task, row.ref);
    const given = isGivenRow(task, row);
    const name = ref ? factorName(ref.id) : row.label || row.ref || '';
    const li = h('li', { class: `fl-row${given ? ' is-given' : ''}`, 'data-testid': `fl-row-${i}`, 'data-ref': row.ref ?? '' });
    li.append(h('div', { class: 'fl-row-head' }, h('span', { class: 'fl-op', 'aria-label': t('row.op') }, powerSymbol(row.power)), h('span', { class: 'fl-row-name' }, name)));
    if (given && ref) {
      li.append(h('p', { class: 'fl-given' }, '= ', quantity(ref.value, ref.unit, { words: false }), h('span', { class: 'fl-badge' }, t('row.given'))));
    } else {
      const widget = numberWidget({
        testid: `fl-row-${i}`,
        label: t('row.value', { name }),
        text: row.text,
        exp: row.exp,
        saved: row.value,
        unit: row.unit,
        onChange: (txt, exp, value) => {
          edit(setRowNumber(state, i, txt, exp, value));
          refresh();
        }
      });
      widget.el.querySelector('label')?.classList.add('sr-only');
      li.append(widget.el);
    }
    return li;
  };

  const marks = (band: Band): HTMLElement => {
    const n = marksOf(band);
    return h('span', { class: 'fl-marks', role: 'img', 'aria-label': t('marks.label', { n }) }, '●'.repeat(n) + '○'.repeat(3 - n));
  };

  const directionText = (s: Score): string => (s.direction === 'none' ? t('direction.none') : t(`direction.${s.direction}`, { factor: ratio(s.factor) }));

  /** Log axis from lo to hi decades mapped onto [PAD, CHART_W − PAD]. */
  const axis = (lo: number, hi: number) => (v: number) => PAD + ((Math.log10(v) - lo) / (hi - lo)) * (CHART_W - 2 * PAD);

  const decadeLabel = (n: number): SVGTextElement => {
    const label = svg('text', { class: 'fl-tick-label', 'text-anchor': 'middle' }, '10');
    label.append(svg('tspan', { dy: -6, 'font-size': '0.75em' }, new Intl.NumberFormat(bcp47Tag(locale), { useGrouping: false }).format(n)));
    return label;
  };

  /**
   * The review's scale: a log axis zoomed to the values shown (at least four decades), the hatched plausible range,
   * the reference line and the answer markers. Marker names are an HTML legend below (readable at 360 px).
   */
  const scaleBar = (q: QuestionState, task: Task): HTMLElement => {
    const shown = [task.answer.central, task.answer.low, task.answer.high, q.answer!];
    const logs = shown.map((v) => Math.log10(v));
    let lo = Math.floor(Math.min(...logs) - 0.3);
    let hi = Math.ceil(Math.max(...logs) + 0.3);
    while (hi - lo < 4) [lo, hi] = [lo - 1, hi + 1];
    const x = axis(lo, hi);
    const y = 30;
    const every = Math.ceil((hi - lo) / 8);
    const chart = svg('svg', { class: 'fl-scale', viewBox: `0 0 ${CHART_W} 80`, 'aria-hidden': 'true', direction: 'ltr' });
    const pattern = svg('pattern', { id: `fl-hatch-${q.taskId}`, width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, svg('line', { x1: 0, y1: 0, x2: 0, y2: 8, class: 'fl-hatch-line' }));
    chart.append(svg('defs', {}, pattern));
    chart.append(svg('rect', { class: 'fl-range', x: x(task.answer.low), y: y - 14, width: Math.max(3, x(task.answer.high) - x(task.answer.low)), height: 28, fill: `url(#fl-hatch-${q.taskId})` }));
    chart.append(svg('line', { class: 'fl-axis', x1: PAD, y1: y, x2: CHART_W - PAD, y2: y }));
    for (let d = lo; d <= hi; d++) {
      const xd = x(10 ** d);
      chart.append(svg('line', { class: 'fl-tick', x1: xd, y1: y - 6, x2: xd, y2: y + 6 }));
      if ((d - lo) % every === 0) {
        const label = decadeLabel(d);
        label.setAttribute('x', String(xd));
        label.setAttribute('y', String(y + 40));
        chart.append(label);
      }
    }
    const xr = x(task.answer.central);
    chart.append(svg('line', { class: 'fl-ref', x1: xr, y1: y - 22, x2: xr, y2: y + 22 }));
    const diamond = (xv: number, cls: string) => svg('path', { class: cls, d: `M${xv} ${y - 11}L${xv + 11} ${y}L${xv} ${y + 11}L${xv - 11} ${y}Z` });
    chart.append(diamond(x(q.answer!), 'fl-answer'));
    const item = (symbol: string, label: string, value: HTMLElement | string) =>
      h('li', {}, h('span', { class: 'fl-legend-sym', 'aria-hidden': 'true' }, symbol), ` ${label}: `, value);
    const legend = h(
      'ul',
      { class: 'fl-legend' },
      item('◆', t('scale.answer'), quantity(q.answer!, task.answer.unit, { words: false })),
      item('┃', t('scale.reference'), quantity(task.answer.central, task.answer.unit, { words: false })),
      item('▨', t('review.range'), t('review.rangeValue', { low: formatQuantity(task.answer.low, locale).text, high: `${formatQuantity(task.answer.high, locale).text} ${unitLabel(task.answer.unit)}`.trim() }))
    );
    return h(
      'figure',
      {
        class: 'fl-chart',
        role: 'img',
        'data-testid': 'fl-scale',
        'aria-label': t('scale.label', { reference: spoken(task.answer.central, task.answer.unit), low: spoken(task.answer.low), high: spoken(task.answer.high), answer: spoken(q.answer!) })
      },
      chart,
      legend
    );
  };

  const effectText = (effect: number | null, given: boolean): string => {
    if (given) return t('effect.given');
    if (effect === null) return t('effect.missing');
    const log = Math.log10(effect);
    if (Math.abs(log) <= Math.log10(1.1)) return t('effect.right');
    return log > 0 ? t('effect.high', { f: ratio(effect) }) : t('effect.low', { f: ratio(1 / effect) });
  };

  const renderComparison = (q: QuestionState, task: Task): HTMLElement => {
    // A model counts once the player filled in at least one open factor (guided rows start empty).
    const hasModel = q.modelUsed;
    const cmp = compare(task, q.factors);
    const section = h('section', { class: 'fl-section', 'aria-labelledby': 'fl-compare-heading', 'data-testid': 'fl-compare' }, heading('h3', 'fl-compare-heading', t(hasModel ? 'compare.heading' : 'compare.headingRef')));
    if (!hasModel) section.append(h('p', {}, t('compare.noModel')));
    const list = h('ul', { class: 'fl-cards' });
    for (const row of cmp.rows) {
      const x = row.factor;
      const range = x.fixed || x.low === x.high ? '' : ` (${t('review.rangeValue', { low: formatQuantity(x.low, locale).text, high: formatQuantity(x.high, locale).text })})`;
      const card = h(
        'li',
        { class: `fl-card${row.biggest ? ' is-biggest' : ''}${x.fixed ? ' is-given' : ''}`, 'data-testid': `fl-cmp-${x.id}` },
        h('p', { class: 'fl-card-name' }, h('span', { class: 'fl-op' }, powerSymbol(x.power)), ' ', factorName(x.id), row.biggest ? h('span', { class: 'fl-badge fl-badge-strong' }, `▲ ${t('compare.biggest')}`) : null)
      );
      const dl = h('dl', { class: 'fl-dl' });
      // Given factors are the same in both models: only their value, marked as given.
      const open = hasModel && !x.fixed;
      if (open) dl.append(h('dt', {}, t('compare.yours')), h('dd', {}, row.yours === null ? '—' : quantity(row.yours, x.unit, { words: false })));
      dl.append(h('dt', {}, t(x.fixed ? 'row.given' : 'compare.reference')), h('dd', {}, quantity(x.value, x.unit, { words: false }), range));
      if (open) dl.append(h('dt', {}, t('compare.effect')), h('dd', { 'data-testid': `fl-effect-${x.id}` }, effectText(row.effect, x.fixed === true)));
      card.append(dl);
      list.append(card);
    }
    section.append(list);
    return section;
  };

  const renderSensitivity = (task: Task): HTMLElement => {
    const bars = sensitivity(task);
    const section = h('section', { class: 'fl-section', 'aria-labelledby': 'fl-sens-heading', 'data-testid': 'fl-sensitivity' }, heading('h3', 'fl-sens-heading', t('sens.heading')), h('p', { class: 'fl-small' }, t('sens.intro')));
    // A relative axis (no tick labels): zoomed to the bars so that their widths compare well, at least half a decade.
    const logs = [...bars.flatMap((b) => [Math.log10(b.lo), Math.log10(b.hi)]), Math.log10(task.answer.central)];
    let lo = Math.min(...logs);
    let hi = Math.max(...logs);
    const extra = Math.max(0, 0.5 - (hi - lo)) / 2 + Math.max(hi - lo, 0.5) * 0.08;
    lo -= extra;
    hi += extra;
    const x = axis(lo, hi);
    const list = h('ul', { class: 'fl-tornado' });
    const flat = bars.every((b) => b.spanDecades < 0.01);
    bars.forEach((b, i) => {
      const f = b.hi / b.lo;
      const label = t('sens.bar', { name: factorName(b.factorId), lo: spoken(b.lo), hi: spoken(b.hi, task.answer.unit), f: ratio(f) });
      const chart = svg('svg', { class: 'fl-bar', viewBox: `0 0 ${CHART_W} 26`, 'aria-hidden': 'true', direction: 'ltr' });
      chart.append(svg('line', { class: 'fl-axis-faint', x1: PAD, y1: 13, x2: CHART_W - PAD, y2: 13 }));
      chart.append(svg('rect', { class: i === 0 && !flat ? 'fl-bar-top' : 'fl-bar-rect', x: x(b.lo), y: 4, width: Math.max(3, x(b.hi) - x(b.lo)), height: 18, rx: 3 }));
      const xc = x(task.answer.central);
      chart.append(svg('line', { class: 'fl-ref', x1: xc, y1: 0, x2: xc, y2: 26 }));
      const item = h(
        'li',
        { class: 'fl-tornado-row', 'data-testid': `fl-sens-${b.factorId}`, 'data-span': b.spanDecades.toFixed(3) },
        h('p', {}, h('span', { class: 'fl-tornado-name' }, factorName(b.factorId)), ': ', quantity(b.lo, '', { words: false }), ' – ', quantity(b.hi, task.answer.unit, { words: false }), f >= 1.05 ? ` (×${ratio(f)})` : ''),
        chart
      );
      item.setAttribute('aria-label', label);
      if (i === 0 && !flat && bars.length > 1) item.append(h('p', { class: 'fl-top-note' }, `▲ ${t('sens.top')}`));
      list.append(item);
    });
    section.append(list);
    if (flat) section.append(h('p', { class: 'fl-small' }, t('sens.flat')));
    const given = task.factors.filter((x) => x.fixed);
    if (given.length) section.append(h('p', { class: 'fl-small' }, t('sens.given', { list: listText(given.map((x) => factorName(x.id))) })));
    return section;
  };

  const renderSources = (task: Task): HTMLElement =>
    h(
      'section',
      { class: 'fl-section', 'aria-labelledby': 'fl-sources-heading', 'data-testid': 'fl-sources' },
      heading('h3', 'fl-sources-heading', t('sources.heading')),
      h('p', { class: 'fl-small' }, t(`kind.${task.kind}`)),
      h(
        'ul',
        { class: 'fl-sources' },
        ...task.sources.map((s) => {
          const about = s.about === 'answer' ? t('source.answer') : factorName(s.about);
          const li = h('li', {}, h('strong', {}, `${about}: `), `${t(`source.${s.type}`)}`);
          if (s.cite) li.append(' — ', h('span', { lang: 'en', dir: 'ltr' }, s.cite));
          if (s.url) {
            let host = s.url;
            try {
              host = new URL(s.url).hostname.replace(/^www\./, '');
            } catch {
              // keep the URL as its own label
            }
            li.append(' ', h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, host));
          }
          return li;
        })
      )
    );

  const renderReview = (q: QuestionState, task: Task): HTMLElement[] => {
    const s = score(q.answer!, task);
    const verdict = h(
      'div',
      { class: `fl-verdict fl-band-${s.band}`, 'data-testid': 'fl-verdict', 'data-band': s.band, 'data-direction': s.direction },
      marks(s.band),
      h(
        'div',
        { class: 'fl-verdict-text' },
        h('p', { class: 'fl-verdict-title' }, t(`verdict.${s.band}`)),
        h('p', {}, `${t('review.answer')}: `, quantity(q.answer!, task.answer.unit, { testid: 'fl-answer' })),
        h('p', { class: 'fl-direction', 'data-testid': 'fl-direction' }, directionText(s), ' ', t(s.inRange ? 'review.inRange' : 'review.outRange')),
        h('p', {}, `${t('review.reference')}: `, quantity(task.answer.central, task.answer.unit, { testid: 'fl-reference' })),
        h('p', { class: 'fl-small' }, t(q.modelUsed ? 'review.fromModel' : 'review.fromEstimate'))
      )
    );
    const last = state.index === ROUND_LENGTH - 1;
    const nextButton = h(
      'button',
      {
        type: 'button',
        class: 'primary',
        'data-testid': last ? 'fl-summary' : 'fl-next',
        onclick: () => !paused && commit(next(state), last ? 'fl-summary-heading' : 'fl-question-anchor')
      },
      t(last ? 'action.summary' : 'action.next')
    );
    return [
      heading('h3', 'fl-review-heading', t('review.heading')),
      verdict,
      scaleBar(q, task),
      renderComparison(q, task),
      renderSensitivity(task),
      h('section', { class: 'fl-section', 'aria-labelledby': 'fl-explain-heading' }, heading('h3', 'fl-explain-heading', t('explain.heading')), h('p', { 'data-testid': 'fl-explain' }, text().tasks[q.taskId]?.explain ?? '')),
      renderSources(task),
      h('div', { class: 'fl-actions' }, nextButton)
    ];
  };

  const renderSummary = (): HTMLElement[] => {
    const sum = summarize(state);
    const rows = h(
      'ol',
      { class: 'fl-summary-list', 'data-testid': 'fl-summary-list' },
      ...sum.rows.map((r) =>
        h(
          'li',
          { 'data-band': r.score.band },
          marks(r.score.band),
          h(
            'span',
            {},
            h('strong', {}, text().tasks[r.taskId]?.title ?? r.taskId),
            ': ',
            t('summary.row', {
              band: t(`band.${r.score.band}`),
              direction: r.score.direction === 'none' ? t('summary.dirNone') : t(r.score.direction === 'high' ? 'summary.dirHigh' : 'summary.dirLow', { f: ratio(r.score.factor) })
            })
          )
        )
      )
    );
    const logBias = Math.log10(sum.bias);
    const biasText = Math.abs(logBias) <= Math.log10(1.25) ? t('summary.biasSame') : logBias < 0 ? t('summary.biasLow', { f: ratio(1 / sum.bias) }) : t('summary.biasHigh', { f: ratio(sum.bias) });
    const lines: HTMLElement[] = [h('p', { 'data-testid': 'fl-bias' }, biasText)];
    lines.push(h('p', { class: 'fl-small' }, t('summary.counts', { a: sum.withinFactor3, b: sum.withinFactor10, n: sum.rows.length })));
    return [
      heading('h2', 'fl-summary-heading', t('summary.heading')),
      rows,
      ...lines,
      h('div', { class: 'fl-tip', 'data-testid': 'fl-tip', 'data-tip': sum.tip }, h('strong', {}, `${t('tip.heading')}: `), t(`tip.${sum.tip}`))
    ];
  };

  function render() {
    clear(main);
    estimateField = null;
    if (isSummary(state)) {
      main.append(...renderSummary());
      container.dataset.phase = 'summary';
      if (!state.finishedReported) {
        state = markFinished(state);
        context.requestSave();
        const sum = summarize(state);
        context.finished({ outcome: 'completed', stats: { questions: ROUND_LENGTH, withinFactor3: sum.withinFactor3, withinFactor10: sum.withinFactor10, modelsUsed: sum.modelsUsed } });
      }
    } else {
      const q = currentQuestion(state)!;
      const task = taskOf(q);
      container.dataset.phase = q.phase;
      main.append(h('span', { id: 'fl-question-anchor', tabindex: -1, class: 'fl-anchor' }), header(q, task));
      if (q.phase === 'estimate') main.append(...renderEstimate(q, task));
      else if (q.phase === 'model') main.append(...renderModel(q, task));
      else main.append(...renderReview(q, task));
    }
    if (focusNext) {
      // A new question focuses its first field: the estimate, or the first open factor of the guided model.
      const target = focusNext === 'fl-question-anchor' ? (estimateField ?? main.querySelector<HTMLElement>('.fl-rows .fl-field')) : main.querySelector<HTMLElement>(`#${focusNext}`);
      target?.focus({ preventScroll: false });
      if (focusNext === 'fl-question-anchor') main.querySelector('.fl-question')?.scrollIntoView?.({ block: 'start' });
      focusNext = null;
    }
  }

  const show = (nextState: FermiState) => {
    state = nextState;
    focusNext = null;
    if (!container.isConnected) root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitial(options.seed, { difficulty: options.difficulty, category: options.settings?.category, model: options.settings?.model }));
    },
    restore(saved: FermiState) {
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
      show(resetState(state));
      context.requestSave();
    },
    dispose() {
      clear(root);
    }
  };
}

