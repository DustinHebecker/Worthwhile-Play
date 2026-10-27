/**
 * Predict mode (design § 5, § 11): a change happens, the player predicts (direction, shape or sketch), runs the
 * challenge's horizon and compares; then the loop that explains it. Before the run no element carries the model's
 * answer: the future is computed only when the item has been run.
 */
import { h } from '@wp/ui';
import { rowsOf, type Line } from './chart-view';
import { challengeOf, preValue, runChallenge, type Challenge, type Question } from './challenges';
import { cldOf } from './cld';
import { cldView } from './cld-view';
import { svg } from './glyphs';
import { habitatDef, speciesIndex } from './habitats';
import { applyAction, cloneSim, sample } from './model';
import { PRESETS } from './presets';
import {
  commit,
  currentItem,
  flatSketch,
  isSummary,
  modelAnswer,
  next,
  questionOf,
  setDraft,
  skip,
  summarize,
  type Answer,
  type PredictItem,
  type PredictState
} from './rules';
import { MARK_SYMBOLS, sketchWeeks } from './score';
import { classify, type Shape } from './shape';
import type { Host, Screen } from './view-host';

/** A tiny picture of a shape class for the options (decorative). */
const SHAPE_PATHS: Readonly<Record<Shape, string>> = {
  steady: 'M2 10H38',
  rises: 'M2 16C14 15 22 6 38 4',
  falls: 'M2 4C14 5 22 14 38 16',
  'rise-fall': 'M2 14C10 2 20 2 26 8S34 15 38 15',
  'fall-rise': 'M2 6C10 18 20 18 26 12S34 5 38 5',
  'swings-fade': 'M2 10C6 0 10 0 14 10S20 18 24 10S30 7 32 10S36 12 38 10',
  'swings-last': 'M2 10C6 2 10 2 14 10S20 18 24 10S30 2 32 10S36 18 38 10',
  vanishes: 'M2 4C10 5 18 12 26 18H38'
};

const sparkOf = (s: Shape) => svg('svg', { viewBox: '0 0 40 20', class: 'eco-opt-spark', 'aria-hidden': 'true', focusable: 'false' }, svg('path', { d: SHAPE_PATHS[s], class: 'eco-line eco-line-model' }));

const HISTORY = 8;

/** The asked series before the change: 8 history samples and week 0. */
function historyOf(c: Challenge, species: string): number[] {
  const i = speciesIndex(habitatDef(c.habitat), species);
  return [...PRESETS[c.preset].history.map((x) => x[i]!), preValue(c, species)];
}

/** The rows of the main column: history, and the run once it exists. */
function rowsFor(c: Challenge, samples: readonly (readonly number[])[] | null) {
  const hist = [...PRESETS[c.preset].history, sample(PRESETS[c.preset].sim)];
  return rowsOf(c.habitat, samples ? [...hist.slice(0, -1), ...samples] : hist);
}

/** The scene right after the scripted change of week 0 (no future involved). */
function sceneAfterChange(c: Challenge): number[] {
  const s = cloneSim(PRESETS[c.preset].sim);
  for (const a of c.actions) if (a.week === 0) applyAction(s, habitatDef(c.habitat), a);
  return sample(s);
}

function answerText(host: Host, q: Question, a: Answer, v0: number): string {
  const { ui } = host;
  const t = ui.t;
  if (a.kind === 'level') return t(`band.${a.band}`);
  if (a.kind === 'shape' && q.kind === 'shape') return ui.shapeName(q.options[a.option]!, v0 === 0);
  if (a.kind === 'sketch') return ui.shapeName(classify([v0, ...a.points]), v0 === 0);
  return '';
}

export function predictScreen(host: Host, s: PredictState): Screen {
  if (isSummary(s)) return summaryScreen(host, s);
  const item = currentItem(s)!;
  const c = challengeOf(item.challenge)!;
  const q = questionOf(s, item);
  return item.ran ? reviewScreen(host, s, item, c, q) : questionScreen(host, s, item, c, q);
}

function header(host: Host, s: PredictState, c: Challenge): HTMLElement[] {
  const { ui } = host;
  return [
    h('p', { class: 'eco-progress', 'data-testid': 'eco-progress' }, `${ui.t('predict.progress', { n: ui.int(s.index + 1), total: ui.int(s.items.length) })} · ${ui.t(`habitat.${c.habitat}`)}`),
    ui.heading('h2', 'eco-item-heading', ui.challenge(c.id).title),
    h('p', { class: 'eco-situation', 'data-testid': 'eco-situation' }, ui.challenge(c.id).situation)
  ];
}

const askText = (host: Host, c: Challenge, q: Question): string => {
  const { ui } = host;
  const name = ui.name(q.species);
  if (q.kind === 'level') return ui.t('predict.ask.level', { name, w: ui.int(q.week) });
  return ui.t(q.kind === 'shape' ? 'predict.ask.shape' : 'predict.ask.sketch', { name, weeks: ui.weeks(c.horizon) });
};

function questionScreen(host: Host, s: PredictState, item: PredictItem, c: Challenge, q: Question): Screen {
  const { ui } = host;
  const v0 = preValue(c, q.species);
  const hist = historyOf(c, q.species);
  const draft = item.draft;
  const panel: HTMLElement[] = [...header(host, s, c)];
  if (s.difficulty === 'easy') {
    const d = h('details', { class: 'eco-loops-first', open: true }, h('summary', {}, ui.t('predict.loopsFirst')), cldView(ui, cldOf(c.id)!));
    panel.push(d);
  }
  const choose = (a: Answer) => {
    if (host.paused()) return;
    host.commit(setDraft(host.state() as PredictState, a), null);
  };
  const fieldset = h('fieldset', { class: 'eco-question', 'data-testid': 'eco-question' }, h('legend', {}, askText(host, c, q)));
  if (q.kind === 'level' || q.kind === 'shape') {
    const opts = q.kind === 'level' ? [0, 1, 2].map((b) => ({ id: `band-${b}`, label: ui.t(`band.${b}`), answer: { kind: 'level', band: b } as Answer, shape: null })) : q.options.map((o, k) => ({ id: `opt-${o}`, label: ui.shapeName(o, v0 === 0), answer: { kind: 'shape', option: k } as Answer, shape: o }));
    const group = h('div', { class: 'eco-options', role: 'radiogroup' });
    for (const o of opts) {
      const checked = JSON.stringify(draft) === JSON.stringify(o.answer);
      const input = h('input', { type: 'radio', name: 'eco-answer', value: o.id, 'data-testid': `eco-${o.id}`, checked });
      input.addEventListener('change', () => choose(o.answer));
      group.append(h('label', { class: `eco-option${checked ? ' eco-checked' : ''}` }, input, o.shape ? sparkOf(o.shape) : '', h('span', {}, o.label)));
    }
    fieldset.append(group);
  }
  const shapeLine = h('p', { class: 'eco-sketch-shape', 'data-testid': 'eco-sketch-shape', 'aria-live': 'polite' });
  const showSketchShape = (pts: readonly number[]) => {
    shapeLine.textContent = ui.t('predict.yourSketch', { shape: ui.shapeName(classify([v0, ...pts]), v0 === 0) });
  };
  if (q.kind === 'sketch') {
    showSketchShape(draft?.kind === 'sketch' ? draft.points : flatSketch(c, q));
    fieldset.append(shapeLine);
  }
  panel.push(fieldset);
  panel.push(h('details', { class: 'eco-think', 'data-testid': 'eco-think' }, h('summary', {}, ui.t('predict.think')), h('p', {}, ui.challenge(c.id).think)));
  const run = h('button', { type: 'button', class: 'eco-primary', 'data-testid': 'eco-run', 'aria-disabled': draft === null && q.kind !== 'sketch' ? 'true' : 'false' }, ui.t('run.horizon', { weeks: ui.weeks(c.horizon) }));
  run.addEventListener('click', () => {
    if (host.paused()) return;
    const st = host.state() as PredictState;
    const cur = currentItem(st)!;
    if (cur.draft === null && q.kind !== 'sketch') {
      host.announce(ui.t('predict.needAnswer'));
      return;
    }
    host.commit(commit(st), 'eco-review-heading', ui.t('status.ran', { weeks: ui.weeks(c.horizon), n: ui.int(c.horizon) }), true);
  });
  const skipBtn = h('button', { type: 'button', class: 'eco-secondary', 'data-testid': 'eco-skip' }, ui.t('predict.skip'));
  skipBtn.addEventListener('click', () => {
    if (host.paused()) return;
    host.commit(skip(host.state() as PredictState), 'eco-review-heading', ui.t('status.ran', { weeks: ui.weeks(c.horizon), n: ui.int(c.horizon) }), true);
  });
  const bar = h('div', { class: 'eco-bar', 'data-testid': 'eco-bar' }, run, skipBtn);
  const line: Line = { values: [...hist, ...new Array<number | null>(c.horizon).fill(null)], cls: 'eco-line-model' };
  const sketchVals = q.kind === 'sketch' ? (draft?.kind === 'sketch' ? draft.points : flatSketch(c, q)) : null;
  const sketchLabel = (w: number, v: number) => ui.t('predict.handleValue', { w: ui.int(w), v: ui.amount(v) });
  const focus = {
    x0: -HISTORY,
    x1: c.horizon,
    lines: [line],
    ymax: q.kind === 'sketch' ? q.max : undefined,
    mark: q.kind === 'level' ? q.week : undefined,
    tall: q.kind === 'sketch',
    label: ui.t('chart.label', { name: ui.name(q.species), summary: ui.t('predict.before', { v: ui.amount(v0) }) }),
    describe: (w: number) => (w <= 0 ? ui.t('chart.cursor', { n: ui.int(w), list: ui.t('scene.item', { name: ui.name(q.species), v: ui.amount(hist[w + HISTORY] ?? 0) }) }) : ui.t('chart.cursor', { n: ui.int(w), list: '?' })),
    sketch:
      q.kind === 'sketch' && sketchVals
        ? {
            weeks: sketchWeeks(c.horizon),
            values: sketchVals,
            max: q.max,
            editable: true,
            label: (w: number) => ui.t('predict.handle', { w: ui.int(w) }),
            valueText: sketchLabel,
            onInput: showSketchShape,
            onCommit: (pts: number[]) => {
              if (host.paused()) return;
              host.update(setDraft(host.state() as PredictState, { kind: 'sketch', points: pts }));
              showSketchShape(pts);
            }
          }
        : undefined,
    testid: 'eco-focus-chart'
  };
  return {
    main: { habitat: c.habitat, scene: sceneAfterChange(c), week: 0, rows: rowsFor(c, null), x0: -HISTORY, x1: 0, focus },
    panel,
    bar
  };
}

function reviewScreen(host: Host, s: PredictState, item: PredictItem, c: Challenge, q: Question): Screen {
  const { ui } = host;
  const run = runChallenge(c);
  const i = speciesIndex(habitatDef(c.habitat), q.species);
  const series = run.samples.map((x) => x[i]!);
  const v0 = series[0]!;
  const hist = historyOf(c, q.species);
  const panel: HTMLElement[] = [...header(host, s, c)];
  const review = h('section', { class: 'eco-review', 'data-testid': 'eco-review' }, ui.heading('h3', 'eco-review-heading', ui.t('review.heading')));
  const answer = item.answer;
  const model = modelAnswer(q, series);
  const modelText = 'band' in model ? ui.t(`band.${model.band}`) : ui.shapeName(model.shape, v0 === 0);
  if (answer === 'skip' || answer === null || item.marks === null) {
    review.append(h('p', { class: 'eco-verdict', 'data-testid': 'eco-verdict' }, ui.t('verdict.skip')));
  } else {
    review.append(h('p', { class: `eco-verdict eco-m${item.marks}`, 'data-testid': 'eco-verdict' }, ui.marks(item.marks)));
    if (answer.kind === 'sketch') review.append(h('p', { 'data-testid': 'eco-sketch-result' }, ui.t('review.sketch', { a: answerText(host, q, answer, v0), b: ui.shapeName(classify(series), v0 === 0) })));
    else review.append(h('p', { 'data-testid': 'eco-you' }, ui.t('review.you', { a: answerText(host, q, answer, v0), b: modelText })));
    if (item.marks === 0) review.append(h('p', { class: 'eco-surprise' }, ui.t('review.surprise')));
  }
  review.append(h('p', { class: 'eco-happened', 'data-testid': 'eco-happened' }, ui.happened(ui.name(q.species), series)));
  review.append(cldView(ui, cldOf(c.id)!));
  const text = ui.challenge(c.id);
  review.append(h('h4', {}, ui.t('review.why')), h('p', { 'data-testid': 'eco-explain' }, text.explain), h('p', { class: 'eco-real' }, text.real));
  const last = s.index === s.items.length - 1;
  const nextBtn = h('button', { type: 'button', class: 'eco-primary', 'data-testid': last ? 'eco-summary-btn' : 'eco-next' }, ui.t(last ? 'review.summary' : 'review.next'));
  nextBtn.addEventListener('click', () => !host.paused() && host.commit(next(host.state() as PredictState), last ? 'eco-summary-heading' : 'eco-item-heading'));
  review.append(nextBtn);
  panel.push(review);
  const lines: Line[] = [{ values: [...hist.slice(0, -1), ...series], cls: 'eco-line-model' }];
  let band: { week: number; lo: number; hi: number } | undefined;
  let sketch;
  if (answer !== 'skip' && answer !== null) {
    if (answer.kind === 'level' && q.kind === 'level') {
      const lo = answer.band === 0 ? 0 : answer.band === 1 ? (v0 * 85) / 100 : (v0 * 115) / 100;
      const hi = answer.band === 0 ? (v0 * 85) / 100 : answer.band === 1 ? (v0 * 115) / 100 : Number.POSITIVE_INFINITY;
      band = { week: q.week, lo, hi: v0 === 0 && answer.band === 1 ? 1000 : hi };
    }
    if (answer.kind === 'sketch' && q.kind === 'sketch')
      sketch = {
        weeks: sketchWeeks(c.horizon),
        values: answer.points,
        max: q.max,
        editable: false,
        label: (w: number) => ui.t('predict.handle', { w: ui.int(w) }),
        valueText: (w: number, v: number) => ui.t('predict.handleValue', { w: ui.int(w), v: ui.amount(v) }),
        onInput: () => undefined,
        onCommit: () => undefined
      };
  }
  const rows = rowsFor(c, run.samples);
  const focus = {
    x0: -HISTORY,
    x1: c.horizon,
    lines,
    ymax: q.kind === 'sketch' ? q.max : undefined,
    band,
    mark: q.kind === 'level' ? q.week : undefined,
    sketch,
    tall: q.kind === 'sketch',
    label: ui.t('chart.label', { name: ui.name(q.species), summary: ui.happened(ui.name(q.species), series) }),
    describe: (w: number) => {
      const k = w + HISTORY;
      return ui.t('chart.cursor', { n: ui.int(w), list: rows.filter((r) => (r.values[k] ?? 0) > 0 && habitatDef(c.habitat).species.some((x) => x.id === r.id)).slice(0, 6).map((r) => ui.t('scene.item', { name: ui.name(r.id), v: ui.amount(r.values[k] ?? 0) })).join(', ') || ui.t('scene.empty') });
    },
    testid: 'eco-focus-chart'
  };
  return { main: { habitat: c.habitat, scene: run.samples[c.horizon]!, week: c.horizon, rows, x0: -HISTORY, x1: c.horizon, focus }, panel };
}

function summaryScreen(host: Host, s: PredictState): Screen {
  const { ui } = host;
  const sum = summarize(s);
  if (!s.reported) host.finish('completed', { matched: sum.matched, close: sum.close, answered: sum.answered });
  const list = h(
    'ul',
    { class: 'eco-summary-list', 'data-testid': 'eco-summary-list' },
    ...s.items.map((it) => {
      const title = ui.challenge(it.challenge).title;
      return h('li', {}, it.marks === null ? ui.t('summary.skipped', { title }) : ui.t('summary.line', { mark: MARK_SYMBOLS[it.marks], title }));
    })
  );
  const panel = [
    ui.heading('h2', 'eco-summary-heading', ui.t('summary.heading')),
    h('p', { 'data-testid': 'eco-summary-counts' }, ui.t('summary.counts', { a: ui.int(sum.matched), b: ui.int(sum.close), c: ui.int(sum.partly), d: ui.int(sum.other), s: ui.int(sum.skipped) })),
    h('p', { class: 'eco-tip', 'data-testid': 'eco-remark' }, ui.t(`summary.remark.${sum.remark}`)),
    list
  ];
  // The last challenge's end state stays in view.
  const last = challengeOf(s.items[s.items.length - 1]!.challenge)!;
  const run = runChallenge(last);
  const rows = rowsOf(last.habitat, run.samples);
  return { main: { habitat: last.habitat, scene: run.samples[last.horizon]!, week: last.horizon, rows, x0: 0, x1: last.horizon, focus: null }, panel };
}
