/**
 * Explore mode (design § 5): a free notebook of one habitat. Add and remove species, change the conditions, act;
 * run as long as you like; compare with "without my last change"; see the food web. No natural end.
 */
import { h } from '@wp/ui';
import { cursorText, rowsOf, type Line } from './chart-view';
import { foodWebView } from './foodweb-view';
import { habitatDef, speciesIndex } from './habitats';
import { HABITAT_ACTIONS, MAX_WEEK, sample, type Action } from './model';
import { backTo, continueFromHere, exploreApply, exploreRun, ghostRun, notebookRun, undoLast, type ExploreState } from './rules';
import { ghostToggle, legend } from './view-goal';
import { changeLog, runBar } from './view-notebook';
import type { Host, Screen } from './view-host';

const WINDOW = 156;
const TABS = ['changes', 'web', 'log'] as const;

export function exploreScreen(host: Host, s: ExploreState): Screen {
  const { ui } = host;
  const nb = s.notebook;
  const hab = habitatDef(s.habitat);
  const run = notebookRun(s);
  const now = sample(run.sim);
  const x0 = nb.week <= WINDOW ? 0 : nb.week - WINDOW;
  const x1 = nb.week <= WINDOW ? Math.max(26, nb.week) : nb.week;
  const window = run.samples.slice(x0, nb.week + 1);
  const defaultFocus = s.habitat === 'pond' ? 'algae' : 'flowers';
  const focusId = typeof host.scratch.focus === 'string' && speciesIndex(hab, host.scratch.focus) >= 0 ? host.scratch.focus : defaultFocus;
  const fi = speciesIndex(hab, focusId);
  const pad = (v: (number | null)[]) => [...v, ...new Array<number | null>(Math.max(0, x1 - x0 + 1 - v.length)).fill(null)];
  const lines: Line[] = [];
  const last = nb.log[nb.log.length - 1];
  const ghost = last ? ghostRun(s, nb.log.slice(0, -1), nb.week) : null;
  if (ghost && host.scratch.ghost === true) lines.push({ values: pad(ghost.samples.slice(x0).map((x) => x[fi]!)), cls: 'eco-line-ghost' });
  lines.push({ values: pad(window.map((x) => x[fi]!)), cls: 'eco-line-model' });
  const rows = rowsOf(s.habitat, window);

  const apply = (a: Omit<Action, 'week'>) => {
    if (host.paused()) return;
    const st = host.state() as ExploreState;
    const full = { week: st.notebook.week, ...a } as Action;
    const next = exploreApply(st, full);
    if (next !== st) host.commit(next, 'eco-run-4', ui.t('explore.applied', { n: ui.int(full.week), what: ui.action(s.habitat, full) }));
  };
  const commitRun = (weeks: number | 'settle', id: string) => {
    const st = host.state() as ExploreState;
    const from = st.notebook.week;
    const r = exploreRun(st, weeks);
    const ran = r.state.notebook.week - from;
    let msg = ui.t('status.ran', { weeks: ui.weeks(ran), n: ui.int(r.state.notebook.week) });
    if (weeks === 'settle') msg = r.settled >= 0 ? ui.t('status.settled', { weeks: ui.weeks(r.settled - from) }) : ui.t('status.swinging', { weeks: ui.weeks(ran) });
    host.commit(r.state, id, msg, true);
  };

  /* ---------- Panel: tabs ---------- */
  const tab = TABS.includes(host.scratch.tab as (typeof TABS)[number]) ? (host.scratch.tab as (typeof TABS)[number]) : 'changes';
  const tablist = h('div', { class: 'eco-tabs', role: 'tablist', 'aria-label': ui.t(`habitat.${s.habitat}`) });
  for (const id of TABS) {
    const b = h('button', { type: 'button', role: 'tab', id: `eco-tab-${id}`, 'aria-selected': id === tab ? 'true' : 'false', 'aria-controls': 'eco-tabpanel', tabindex: id === tab ? 0 : -1, 'data-testid': `eco-tab-${id}` }, ui.t(`tab.${id}`));
    b.addEventListener('click', () => {
      host.scratch.tab = id;
      host.refresh(`eco-tab-${id}`);
    });
    b.addEventListener('keydown', (e) => {
      const k = TABS.indexOf(id);
      const rtl = ui.t.direction === 'rtl';
      const d = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
      if (!d) return;
      e.preventDefault();
      const to = TABS[(k + d + TABS.length) % TABS.length]!;
      host.scratch.tab = to;
      host.refresh(`eco-tab-${to}`);
    });
    tablist.append(b);
  }
  const body = h('div', { role: 'tabpanel', id: 'eco-tabpanel', 'aria-labelledby': `eco-tab-${tab}`, class: 'eco-tabpanel', 'data-testid': 'eco-tabpanel' });
  const full = nb.week >= MAX_WEEK;
  if (tab === 'changes') {
    const select = h('select', { 'data-testid': 'eco-species', id: 'eco-species', 'aria-label': ui.t('explore.species') }, ...hab.species.map((sp) => h('option', { value: sp.id, selected: host.scratch.species === sp.id }, `${ui.name(sp.id)} (${ui.amount(now[speciesIndex(hab, sp.id)]!)})`)));
    select.addEventListener('change', () => {
      host.scratch.species = select.value;
    });
    const chosen = () => select.value || hab.species[0]!.id;
    const btn = (key: string, testid: string, f: () => void) => {
      const b = h('button', { type: 'button', class: 'eco-tool', 'data-testid': testid, 'aria-disabled': full ? 'true' : 'false' }, ui.t(key));
      b.addEventListener('click', () => !full && f());
      return b;
    };
    body.append(
      h('h3', {}, ui.t('explore.species')),
      h('div', { class: 'eco-species-row' }, select),
      h(
        'div',
        { class: 'eco-tools' },
        btn('explore.add', 'eco-add', () => apply({ kind: 'add', species: chosen() })),
        ...([50, 90, 100] as const).map((share) => btn(`explore.remove${share}`, `eco-remove-${share}`, () => apply({ kind: 'remove', species: chosen(), share })))
      ),
      h('h3', {}, ui.t('explore.conditions'))
    );
    hab.conditions.forEach((c, k) => {
      const sel = h('select', { id: `eco-cond-${c.id}`, 'data-testid': `eco-cond-${c.id}`, disabled: full }, ...c.levels.map((lv, i) => h('option', { value: String(i), selected: run.sim.cond[k] === i }, ui.t(`level.${c.id}.${lv}`))));
      sel.addEventListener('change', () => apply({ kind: 'set', cond: k, level: Number(sel.value) }));
      body.append(h('label', { class: 'eco-cond', for: `eco-cond-${c.id}` }, h('span', {}, ui.t(`cond.${c.id}`)), sel));
    });
    body.append(h('h3', {}, ui.t('explore.actions')));
    const acts = h('div', { class: 'eco-tools' });
    for (const kind of HABITAT_ACTIONS[s.habitat]) {
      if (kind === 'add' || kind === 'remove' || kind === 'set') continue;
      if (kind === 'mow') {
        acts.append(btn('action.mow-remove', 'eco-act-mow-remove', () => apply({ kind: 'mow', cuttings: 'remove' })), btn('action.mow-leave', 'eco-act-mow-leave', () => apply({ kind: 'mow', cuttings: 'leave' })));
      } else acts.append(btn(`action.${kind}`, `eco-act-${kind}`, () => apply({ kind })));
    }
    body.append(acts);
  } else if (tab === 'web') {
    body.append(foodWebView(ui, s.habitat, hab.species.map((_, i) => now[i]! > 0)));
  } else {
    body.append(changeLog(host, s.habitat, nb.log, (k) => host.commit(backTo(host.state() as ExploreState, k), 'eco-run-4')));
    const undo = h('button', { type: 'button', class: 'eco-secondary', 'data-testid': 'eco-undo', 'aria-disabled': nb.log.length ? 'false' : 'true' }, ui.t('goalui.undo'));
    undo.addEventListener('click', () => !host.paused() && host.commit(undoLast(host.state() as ExploreState), 'eco-run-4'));
    body.append(h('div', { class: 'eco-row-buttons' }, undo, continueButton(host)));
  }
  const panel: HTMLElement[] = [h('p', { class: 'eco-progress' }, ui.t('mode.explore')), ui.heading('h2', 'eco-item-heading', ui.t(`habitat.${s.habitat}`)), tablist, body];
  if (full) panel.splice(2, 0, h('p', { class: 'eco-outcome', 'data-testid': 'eco-full' }, ui.t('status.full', { n: ui.int(nb.week) })), continueButton(host));

  /* ---------- Under the chart ---------- */
  const picker = h('select', { 'data-testid': 'eco-focus-pick', id: 'eco-focus-pick', 'aria-label': ui.t('chart.focus') }, ...hab.species.map((sp) => h('option', { value: sp.id, selected: sp.id === focusId }, ui.name(sp.id))));
  picker.addEventListener('change', () => {
    host.scratch.focus = picker.value;
    host.refresh('eco-focus-pick');
  });
  const compare =
    ghost && last
      ? ui.t('explore.compare', { name: ui.name(focusId), v: ui.amount(ghost.samples[nb.week]?.[fi] ?? 0), now: ui.amount(run.samples[nb.week]?.[fi] ?? 0) })
      : ui.t('explore.noLast');
  const under = [
    runBar(host, full, commitRun),
    h('div', { class: 'eco-under-row' }, ghostToggle(host, Boolean(last)), h('label', { class: 'eco-pick' }, h('span', {}, '◎ '), picker)),
    legend(host, lines.map((l) => l.cls)),
    h('p', { class: 'eco-compare', 'data-testid': 'eco-compare' }, compare)
  ];
  const series = window.map((x) => x[fi]!);
  return {
    main: {
      habitat: s.habitat,
      scene: now,
      week: nb.week,
      rows,
      x0,
      x1: nb.week,
      focus: {
        x0,
        x1,
        lines,
        markers: nb.log.map((a, k) => ({ week: a.week, n: k + 1 })).filter((m) => m.week >= x0),
        label: ui.t('chart.label', { name: ui.name(focusId), summary: ui.happened(ui.name(focusId), series) }),
        describe: (w: number) => (w <= nb.week ? cursorText(ui, rows, w, w - x0) : ui.t('chart.cursor', { n: ui.int(w), list: '—' })),
        testid: 'eco-focus-chart'
      },
      underChart: under
    },
    panel
  };
}

function continueButton(host: Host): HTMLElement {
  const b = h('button', { type: 'button', class: 'eco-secondary', 'data-testid': 'eco-continue' }, host.ui.t('explore.continue'));
  b.addEventListener('click', () => !host.paused() && host.commit(continueFromHere(host.state() as ExploreState), 'eco-run-4'));
  return b;
}
