/**
 * Goal mode (design § 10.2): reach a target with a few changes before a deadline; unlimited rewind; "Show me a way";
 * the review with "If you had done nothing" and "Does it hold?".
 */
import { h } from '@wp/ui';
import { cursorText, rowsOf, type Line } from './chart-view';
import { cldOf } from './cld';
import { cldView } from './cld-view';
import { BUDGET, holdsAfter, type Goal } from './goals';
import { habitatDef, speciesIndex } from './habitats';
import { sample } from './model';
import { applyTool, backTo, backToStart, budgetLeft, ghostRun, goalSpec, notebookRun, runGoalWeeks, showWay, undoLast, type GoalState } from './rules';
import { changeLog, runBar } from './view-notebook';
import type { Host, Screen } from './view-host';

/** The target sentence with its numbers. */
export function targetText(host: Host, g: Goal): string {
  const { ui } = host;
  const t = g.target.terms;
  const ge = t.find((x) => x.op === 'ge');
  const le = t.find((x) => x.op === 'le');
  const raw = ui.goal(g.id).target;
  return raw
    .replace('{v}', ui.amount((le ?? ge)!.value))
    .replace('{p}', ui.amount(ge?.value ?? 0))
    .replace('{w}', ui.int(g.deadline));
}

const sumOf = (sample: readonly number[], g: Goal, ids: readonly string[]): number => ids.reduce((a, id) => a + (sample[speciesIndex(habitatDef(g.habitat), id)] ?? 0), 0);

export function goalScreen(host: Host, s: GoalState): Screen {
  const { ui } = host;
  const g = goalSpec(s);
  const hab = habitatDef(g.habitat);
  const nb = s.notebook;
  const run = notebookRun(s);
  const samples = run.samples.slice(0, nb.week + 1);
  const now = samples[nb.week]!;
  const fi = speciesIndex(hab, g.focus);
  const focusLine = g.target.terms.find((x) => x.species.includes(g.focus))!;
  const done = s.outcome !== null && s.outcome.kind !== 'failed';
  const failed = s.outcome?.kind === 'failed';
  const left = budgetLeft(s);
  const panel: HTMLElement[] = [
    h('p', { class: 'eco-progress' }, ui.t('mode.goal')),
    ui.heading('h2', 'eco-item-heading', ui.t(`goal.${g.id}`)),
    h('p', { class: 'eco-situation' }, ui.goal(g.id).story),
    h('p', { class: 'eco-target', 'data-testid': 'eco-target' }, targetText(host, g))
  ];
  const nowList = [...new Set(g.target.terms.map((x) => x.species.join('+')))].map((key) => {
    const ids = key.split('+');
    return ui.t('scene.item', { name: ids.map((id) => ui.name(id)).join(' + '), v: ui.amount(sumOf(now, g, ids)) });
  });
  const status = h(
    'div',
    { class: 'eco-status-box', 'data-testid': 'eco-goal-status' },
    h('p', {}, ui.t('goalui.now', { v: nowList.join(' · ') })),
    h('p', {}, Number.isFinite(BUDGET[s.difficulty]) ? ui.t('goalui.changes', { n: ui.int(nb.log.length), max: ui.int(BUDGET[s.difficulty]) }) : ui.t('goalui.changesFree', { n: ui.int(nb.log.length) })),
    h('p', {}, `${ui.t('week', { n: ui.int(nb.week) })} · ${ui.t('goalui.deadline', { w: ui.int(g.deadline) })}`)
  );
  panel.push(status);
  const commitRun = (weeks: number | 'settle', id: string) => {
    const st = host.state() as GoalState;
    const from = st.notebook.week;
    const r = runGoalWeeks(st, weeks);
    const o = r.state.outcome;
    const ran = r.state.notebook.week - from;
    let msg = ui.t('status.ran', { weeks: ui.weeks(ran), n: ui.int(r.state.notebook.week) });
    if (weeks === 'settle' && !o) msg = r.settled >= 0 ? ui.t('status.settled', { weeks: ui.weeks(r.settled - from) }) : ui.t('status.swinging', { weeks: ui.weeks(ran) });
    if (o?.kind === 'failed') msg = g.target.kind === 'every' ? ui.t('goalui.failedEvery', { name: ui.name(g.focus), w: ui.int(o.week) }) : ui.t('goalui.failedStreak', { w: ui.int(o.week) });
    if (o?.kind === 'reached') msg = ui.t('goalui.reached', { w: ui.int(o.week) });
    host.commit(r.state, o?.kind === 'reached' ? 'eco-review-heading' : o?.kind === 'failed' ? 'eco-undo' : id, msg, true);
  };
  if (failed) {
    const o = s.outcome!;
    panel.push(h('p', { class: 'eco-outcome eco-failed', 'data-testid': 'eco-outcome', role: 'status' }, g.target.kind === 'every' ? ui.t('goalui.failedEvery', { name: ui.name(g.focus), w: ui.int(o.week) }) : ui.t('goalui.failedStreak', { w: ui.int(o.week) })));
  }
  if (!done) {
    // Hint: on easy shown from the start; otherwise behind "Show a hint" (not recorded).
    const hint = h('details', { class: 'eco-hint', 'data-testid': 'eco-hint', open: s.difficulty === 'easy' }, h('summary', {}, ui.t('goalui.hint')), h('p', {}, ui.goal(g.id).hint), cldView(ui, cldOf(g.id)!));
    panel.push(hint);
    const tools = h('div', { class: 'eco-tools', 'data-testid': 'eco-tools', role: 'group', 'aria-label': ui.t('goalui.tools') });
    const blocked = failed || left <= 0 || nb.week >= g.deadline;
    for (const tool of g.tools) {
      const b = h('button', { type: 'button', class: 'eco-tool', 'data-testid': `eco-tool-${tool.id}`, 'aria-disabled': blocked ? 'true' : 'false' }, ui.t(`tool.${tool.id}`));
      b.addEventListener('click', () => {
        if (host.paused()) return;
        const st = host.state() as GoalState;
        const next = applyTool(st, tool.id);
        if (next === st) {
          if (budgetLeft(st) <= 0) host.announce(ui.t('goalui.noBudget'));
          return;
        }
        const a = next.notebook.log[next.notebook.log.length - 1]!;
        host.commit(next, 'eco-run-4', ui.t('explore.applied', { n: ui.int(a.week), what: ui.action(g.habitat, a) }));
      });
      tools.append(b);
    }
    panel.push(h('h3', {}, ui.t('goalui.tools')), tools);
    if (left <= 0 && !failed) panel.push(h('p', { class: 'eco-muted', 'data-testid': 'eco-nobudget' }, ui.t('goalui.noBudget')));
  }
  // The log with its return points, "Undo my last change", "Back to week 0", "Show me a way".
  const back = (k: number) => host.commit(backTo(host.state() as GoalState, k), 'eco-run-4');
  panel.push(h('h3', {}, ui.t('goalui.log')), changeLog(host, g.habitat, nb.log, done ? null : back, g.script));
  if (!done) {
    const row = h('div', { class: 'eco-row-buttons' });
    const undo = h('button', { type: 'button', class: 'eco-secondary', id: 'eco-undo', 'data-testid': 'eco-undo', 'aria-disabled': nb.log.length ? 'false' : 'true' }, ui.t('goalui.undo'));
    undo.addEventListener('click', () => !host.paused() && host.commit(undoLast(host.state() as GoalState), 'eco-run-4'));
    const start = h('button', { type: 'button', class: 'eco-secondary', 'data-testid': 'eco-back-start' }, ui.t('goalui.back', { w: ui.int(0) }));
    start.addEventListener('click', () => !host.paused() && host.commit(backToStart(host.state() as GoalState), 'eco-run-4'));
    row.append(undo, start);
    if (failed) {
      const way = h('button', { type: 'button', class: 'eco-secondary', 'data-testid': 'eco-show-way' }, ui.t('goalui.showWay'));
      way.addEventListener('click', () => !host.paused() && host.commit(showWay(host.state() as GoalState), 'eco-review-heading'));
      row.append(way);
    }
    panel.push(row);
  } else panel.push(goalReview(host, s, g));
  // Main column: the focus chart over the whole deadline, ghosts, goal line, change markers.
  const focusSeries = samples.map((x) => x[fi]!);
  const pad = (v: number[]) => [...v, ...new Array<number | null>(g.deadline - v.length + 1).fill(null)];
  const lines: Line[] = [];
  if (done) lines.push({ values: ghostRun(s, [], g.deadline).samples.map((x) => x[fi]!), cls: 'eco-line-nothing' });
  if (s.outcome?.kind === 'shown') lines.push({ values: ghostRun(s, g.plans[0]!.actions, g.deadline).samples.map((x) => x[fi]!), cls: 'eco-line-way' });
  if (!done && host.scratch.ghost === true && nb.log.length) lines.push({ values: pad(ghostRun(s, nb.log.slice(0, -1), nb.week).samples.map((x) => x[fi]!)), cls: 'eco-line-ghost' });
  lines.push({ values: pad(focusSeries), cls: 'eco-line-model' });
  const rows = rowsOf(g.habitat, samples);
  const under: HTMLElement[] = [];
  if (!done) {
    under.push(runBar(host, failed || nb.week >= g.deadline, commitRun));
    under.push(ghostToggle(host, nb.log.length > 0));
  }
  under.push(legend(host, lines.map((l) => l.cls)));
  return {
    main: {
      habitat: g.habitat,
      scene: sample(run.sim),
      week: nb.week,
      rows,
      x0: 0,
      x1: nb.week,
      focus: {
        x0: 0,
        x1: g.deadline,
        lines,
        goal: { value: focusLine.value, label: ui.t('chart.goal', { v: ui.amount(focusLine.value) }) },
        markers: nb.log.map((a, k) => ({ week: a.week, n: k + 1 })),
        label: ui.t('chart.label', { name: ui.name(g.focus), summary: ui.happened(ui.name(g.focus), focusSeries) }),
        describe: (w: number) => (w <= nb.week ? cursorText(ui, rows, w, w) : ui.t('chart.cursor', { n: ui.int(w), list: '—' })),
        testid: 'eco-focus-chart'
      },
      underChart: under
    },
    panel
  };
}

export function ghostToggle(host: Host, enabled: boolean): HTMLElement {
  const input = h('input', { type: 'checkbox', 'data-testid': 'eco-ghost', checked: host.scratch.ghost === true, disabled: !enabled });
  input.addEventListener('change', () => {
    host.scratch.ghost = input.checked;
    host.refresh('eco-ghost-label');
  });
  return h('label', { class: 'eco-check', id: 'eco-ghost-label', tabindex: -1 }, input, ` ${host.ui.t('explore.ghost')}`);
}

/** Which line is which: dash pattern samples with words. */
export function legend(host: Host, classes: readonly string[]): HTMLElement {
  const name: Record<string, string> = { 'eco-line-model': 'legend.model', 'eco-line-ghost': 'legend.ghost', 'eco-line-nothing': 'legend.nothing', 'eco-line-way': 'legend.way' };
  const ul = h('ul', { class: 'eco-legend', 'data-testid': 'eco-legend' });
  for (const c of [...new Set(classes)]) {
    const sample = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sample.setAttribute('viewBox', '0 0 30 6');
    sample.setAttribute('class', 'eco-legend-line');
    sample.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M0 3H30');
    p.setAttribute('class', `eco-line ${c}`);
    sample.append(p);
    ul.append(h('li', {}, sample, ` ${host.ui.t(name[c] ?? 'legend.model')}`));
  }
  return ul;
}

function goalReview(host: Host, s: GoalState, g: Goal): HTMLElement {
  const { ui } = host;
  const o = s.outcome!;
  const box = h('section', { class: 'eco-review', 'data-testid': 'eco-review' });
  const shown = o.kind === 'shown';
  box.append(ui.heading('h3', 'eco-review-heading', ui.t(shown ? 'goalui.shown' : 'goalui.review')));
  if (!shown) {
    box.append(h('p', { class: 'eco-outcome eco-reached', 'data-testid': 'eco-outcome' }, ui.t('goalui.reached', { w: ui.int(o.week) })));
    if (g.holdCheck) {
      const slip = holdsAfter(g, s.notebook.log, o.week);
      box.append(h('h4', {}, ui.t('goalui.holds')), h('p', { 'data-testid': 'eco-holds' }, slip < 0 ? ui.t('goalui.held') : ui.t('goalui.slipped', { weeks: ui.weeks(slip - o.week) })));
    }
    if (!s.reported) host.finish('won', { week: o.week, changes: s.notebook.log.length });
  } else {
    const plan = g.plans[0]!;
    box.append(h('p', { 'data-testid': 'eco-plan' }, ui.goal(g.id).plans[plan.key] ?? ''));
    box.append(changeLog(host, g.habitat, plan.actions, null));
    if (!s.reported) host.finish('completed', { week: o.week, changes: s.notebook.log.length });
  }
  const loop = shown ? g.plans[0]!.loop : (cldOf(g.id)!.highlight ?? null);
  box.append(cldView(ui, cldOf(g.id)!, { highlight: loop }));
  box.append(h('h4', {}, ui.t('review.why')), h('p', { 'data-testid': 'eco-explain' }, ui.goal(g.id).explain));
  return box;
}
