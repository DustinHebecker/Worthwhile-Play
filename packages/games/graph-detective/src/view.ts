// @ts-nocheck
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  MAX_CHOICE,
  TASKS_PER_SESSION,
  canAdvance,
  canSubmit,
  chooseValue,
  clearSelection,
  createInitialState,
  currentProgress,
  currentTask,
  hasEdge,
  isFinished,
  isOpen,
  nextTask,
  nodeLabel,
  pointSegmentDistance,
  resetState,
  routeLength,
  showSolution,
  submit,
  toDifficulty,
  toggleEdge,
  toggleNode,
  totals,
  usesEndpoints,
  type Feedback,
  type GdState,
  type Point,
  type Progress,
  type Task
} from './rules';
import './styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
type SvgAttrs = Record<string, string | number>;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: SvgAttrs, ...children: (SVGElement | string)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  for (const child of children) el.append(child);
  return el;
}

/** Drawn radius of a point, and the pointer radii (SVG units) for picking points and connections. */
const NODE_R = 19;
const PICK_NODE = 34;
const PICK_EDGE = 32;

/**
 * Drawing of a proposed new connection: a gentle curve that bends around other points, so it
 * never hides an existing connection or runs through a point it does not join.
 */
export function previewPath(task: Task, u: number, v: number): string {
  const [x1, y1] = task.pos[u]!;
  const [x2, y2] = task.pos[v]!;
  const length = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / length;
  const ny = (x2 - x1) / length;
  const curve = (bend: number) => {
    const cx = (x1 + x2) / 2 + nx * bend;
    const cy = (y1 + y2) / 2 + ny * bend;
    let clearance = Infinity;
    for (let k = 1; k < 20; k++) {
      const s = k / 20;
      const px = (1 - s) * (1 - s) * x1 + 2 * (1 - s) * s * cx + s * s * x2;
      const py = (1 - s) * (1 - s) * y1 + 2 * (1 - s) * s * cy + s * s * y2;
      task.pos.forEach(([qx, qy], w) => {
        if (w !== u && w !== v) clearance = Math.min(clearance, Math.hypot(qx - px, qy - py));
      });
    }
    return { d: `M${x1} ${y1} Q${Math.round(cx)} ${Math.round(cy)} ${x2} ${y2}`, clearance };
  };
  const options = [30, -30, 60, -60, 90, -90, 120, -120].map(curve);
  return (options.find((option) => option.clearance >= NODE_R + 14) ?? options.reduce((a, b) => (b.clearance > a.clearance ? b : a))).d;
}

const cloneState = (state: GdState): GdState => JSON.parse(JSON.stringify(state)) as GdState;
const edgeTasks = new Set(['bridge', 'path']);
const nodeTasks = new Set(['augment', 'cutvertex']);

interface Built {
  task: Task;
  edges: SVGGElement[];
  nodes: SVGGElement[];
  preview: SVGPathElement;
  items: SVGGElement[];
}

export function createGraphDetective(context: GameContext): GameInstance<GdState> {
  const { t, root } = context;
  let state = createInitialState(0);
  let paused = false;
  let built: Built | null = null;

  const progressEl = h('p', { class: 'gd-progress', 'data-testid': 'gd-progress' });
  const taskEl = h('p', { class: 'gd-task', 'data-testid': 'gd-task', id: 'gd-task' });
  const helpEl = h('p', { class: 'gd-help wp-muted' });
  const diagram = svg('svg', { class: 'gd-diagram', role: 'group', 'data-testid': 'gd-diagram', 'aria-describedby': 'gd-task' });
  diagram.addEventListener('click', (event) => onDiagramClick(event));
  diagram.addEventListener('keydown', (event) => onDiagramKey(event));

  const choiceButtons: HTMLButtonElement[] = [];
  for (let n = 1; n <= MAX_CHOICE; n++) {
    choiceButtons.push(h('button', { type: 'button', class: 'gd-choice', 'data-testid': `gd-choice-${n}`, 'aria-pressed': 'false', onclick: () => onChoose(n) }, String(n)));
  }
  const choices = h('div', { class: 'gd-choices', role: 'group', 'aria-label': t('choices'), 'data-testid': 'gd-choices' }, ...choiceButtons);

  const status = h('p', { class: 'wp-status gd-status', 'data-testid': 'gd-status' });
  const submitButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'gd-submit', onclick: () => onSubmit() }, t('common.check'));
  const clearButton = h('button', { type: 'button', 'data-testid': 'gd-clear', onclick: () => onClear() }, t('action.clear'));
  const solutionButton = h('button', { type: 'button', 'data-testid': 'gd-solution', onclick: () => onSolution() }, t('action.solution'));
  const nextButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'gd-next', onclick: () => onNext() }, t('action.next'));
  const actions = h('div', { class: 'gd-actions' }, submitButton, clearButton, solutionButton, nextButton);
  const summary = h('p', { class: 'gd-summary', 'data-testid': 'gd-summary', hidden: true });

  const edgeList = h('ul', { class: 'gd-list', 'data-testid': 'gd-list' });
  const details = h('details', { class: 'gd-details' }, h('summary', {}, t('list.title')), edgeList);
  const help = h('div', { class: 'gd-help-block wp-muted' }, h('p', {}, t('legend')), h('p', {}, t('help.keys')));
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'gd-announcer' });

  const container = h(
    'div',
    { class: `wp-graph-detective${context.reducedMotion ? ' gd-reduced' : ''}`, dir: t.direction, lang: t.locale },
    progressEl,
    taskEl,
    helpEl,
    diagram,
    choices,
    status,
    actions,
    summary,
    details,
    help,
    live
  );

  /* ---------- Texts ---------- */

  const label = (v: number) => nodeLabel(v);
  const edgeText = (task: Task, e: number, selected: boolean) => {
    const [a, b, w] = task.edges[e]!;
    const params = { a: label(a), b: label(b), w };
    if (task.weighted) return t(selected ? 'edge.weightedSelected' : 'edge.weighted', params);
    return t(selected ? 'edge.selected' : 'edge.plain', params);
  };
  const nodeText = (v: number, selected: boolean) => t(selected ? 'node.selected' : 'node.plain', { name: label(v) });
  const ends = (task: Task) => ({ from: label(task.from), to: label(task.to) });

  const taskText = (task: Task) => {
    if (task.type === 'path') return t(task.weighted ? 'task.pathWeighted' : 'task.path', ends(task));
    return usesEndpoints(task.type) ? t(`task.${task.type}`, ends(task)) : t(`task.${task.type}`);
  };

  const explain = (task: Task, p: Progress): string => {
    switch (task.type) {
      case 'bridge': {
        const [a, b] = task.edges[p.edges[0]!]!;
        return t('explain.bridge', { a: label(a), b: label(b), ...ends(task) });
      }
      case 'augment': {
        const [a, b] = [...p.nodes].sort((x, y) => x - y);
        return t('explain.augment', { a: label(a!), b: label(b!) });
      }
      case 'path':
        return task.weighted
          ? t('explain.path', { n: routeLength(task.n, task.edges, p.edges, task.from, task.to) })
          : t('explain.pathHops', { n: p.edges.length });
      case 'cutvertex':
        return t('explain.cutvertex', { name: label(p.nodes[0]!) });
      case 'mincut':
        return t('explain.mincut', { n: p.value });
    }
  };

  const feedbackText = (task: Task, feedback: Feedback): string => {
    switch (feedback.code) {
      case 'bridge.connected':
      case 'path.invalid':
        return t(`fb.${feedback.code}`, ends(task));
      case 'path.long':
        return t(task.weighted ? 'fb.path.long' : 'fb.path.longHops', { n: feedback.value });
      case 'cutvertex.connected':
        return t('fb.cutvertex.connected', { name: label(feedback.nodes[0]!) });
      case 'mincut.low':
        return t('fb.mincut.low', { n: feedback.value, ...ends(task) });
      case 'augment.weak':
      case 'mincut.high':
        return t(`fb.${feedback.code}`);
    }
  };

  /** Status line text and its kind (open, note, wrong, correct, shown). */
  const statusOf = (task: Task, p: Progress): [string, string] => {
    if (p.status === 'solved') return [t('status.correct', { explain: explain(task, p) }), 'correct'];
    if (p.status === 'shown') return [t('status.shown', { explain: explain(task, p) }), 'shown'];
    if (p.feedback) return [feedbackText(task, p.feedback), 'wrong'];
    if (task.type === 'augment' && p.nodes.length === 2 && hasEdge(task.edges, p.nodes[0]!, p.nodes[1]!)) return [t('augment.exists'), 'note'];
    return ['', 'open'];
  };

  /* ---------- Building the diagram for one task ---------- */

  const build = (task: Task) => {
    clear(diagram);
    diagram.setAttribute('viewBox', `0 0 ${task.width} ${task.height}`);
    diagram.setAttribute('aria-label', t('diagram', { count: task.n }));
    diagram.dataset.type = task.type;
    const pos = task.pos;
    const interactiveEdges = edgeTasks.has(task.type);
    const interactiveNodes = nodeTasks.has(task.type);

    const edges = task.edges.map(([a, b, w], i) => {
      const [x1, y1] = pos[a]!;
      const [x2, y2] = pos[b]!;
      const line = (cls: string) => svg('line', { class: cls, x1, y1, x2, y2 });
      const g = svg('g', { class: 'gd-edge', 'data-edge': i, 'data-testid': `edge-${label(a)}-${label(b)}`, 'data-selected': 'false' },
        line('gd-ring'), line('gd-line'), line('gd-mark'), line('gd-hint'));
      if (task.weighted) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const text = String(w);
        g.append(
          svg('rect', { class: 'gd-weight-box', x: mx - 13, y: my - 13, width: 26, height: 26, rx: 7 }),
          svg('text', { class: 'gd-weight', x: mx, y: my + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, text)
        );
      }
      if (interactiveEdges) g.setAttribute('role', 'button');
      else g.setAttribute('aria-hidden', 'true');
      return g;
    });

    const preview = svg('path', { class: 'gd-preview', d: 'M0 0', visibility: 'hidden' });

    const nodes = pos.map(([x, y], v) => {
      const endpoint = v === task.from || v === task.to;
      const shape = endpoint
        ? svg('rect', { class: 'gd-shape', x: x - NODE_R, y: y - NODE_R, width: NODE_R * 2, height: NODE_R * 2, rx: 4 })
        : svg('circle', { class: 'gd-shape', cx: x, cy: y, r: NODE_R });
      const g = svg('g', { class: `gd-node${endpoint ? ' is-endpoint' : ''}`, 'data-node': v, 'data-testid': `node-${label(v)}`, 'data-selected': 'false' },
        svg('circle', { class: 'gd-ring', cx: x, cy: y, r: NODE_R + 11 }),
        svg('circle', { class: 'gd-sel', cx: x, cy: y, r: NODE_R + 6 }),
        shape,
        svg('text', { class: 'gd-label', x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, label(v))
      );
      if (interactiveNodes) g.setAttribute('role', 'button');
      else g.setAttribute('aria-hidden', 'true');
      return g;
    });

    diagram.append(
      svg('rect', { class: 'gd-bg', x: 0, y: 0, width: task.width, height: task.height, rx: 12 }),
      svg('g', { class: 'gd-edges' }, ...edges),
      preview,
      svg('g', { class: 'gd-nodes' }, ...nodes)
    );

    const items = interactiveEdges ? edges : interactiveNodes ? nodes : [];
    items.forEach((item, i) => item.setAttribute('tabindex', i === 0 ? '0' : '-1'));

    clear(edgeList);
    task.edges.forEach(([a, b, w]) => {
      edgeList.append(h('li', {}, t(task.weighted ? 'list.edgeWeighted' : 'list.edge', { a: label(a), b: label(b), w })));
    });

    built = { task, edges, nodes, preview, items };
  };

  /* ---------- Rendering ---------- */

  const render = () => {
    const task = currentTask(state);
    if (built?.task !== task) build(task);
    const view = built!;
    const p = currentProgress(state);
    const open = p.status === 'open';
    const hintEdges = new Set(p.feedback?.edges ?? []);
    const removed = p.feedback?.code === 'cutvertex.connected' ? (p.feedback.nodes[0] ?? -1) : -1;

    progressEl.textContent = t('progress', { n: state.index + 1, total: TASKS_PER_SESSION });
    taskEl.textContent = taskText(task);
    taskEl.dataset.type = task.type;
    helpEl.textContent = t(`help.${task.type}`);
    helpEl.hidden = !open;
    container.dataset.status = p.status;

    view.edges.forEach((g, i) => {
      const selected = p.edges.includes(i);
      const [a, b] = task.edges[i]!;
      g.dataset.selected = String(selected);
      g.classList.toggle('is-selected', selected);
      g.classList.toggle('is-hint', hintEdges.has(i));
      g.classList.toggle('is-faded', a === removed || b === removed);
      if (g.getAttribute('role') === 'button') {
        g.setAttribute('aria-pressed', String(selected));
        g.setAttribute('aria-disabled', String(!open));
        g.setAttribute('aria-label', edgeText(task, i, selected));
      }
    });
    view.nodes.forEach((g, v) => {
      const selected = p.nodes.includes(v);
      g.dataset.selected = String(selected);
      g.classList.toggle('is-selected', selected);
      g.classList.toggle('is-removed', v === removed);
      if (g.getAttribute('role') === 'button') {
        g.setAttribute('aria-pressed', String(selected));
        g.setAttribute('aria-disabled', String(!open));
        g.setAttribute('aria-label', nodeText(v, selected));
      }
    });

    const pair = task.type === 'augment' && p.nodes.length === 2 ? (p.nodes as [number, number]) : null;
    if (pair) {
      view.preview.setAttribute('d', previewPath(task, pair[0], pair[1]));
      view.preview.setAttribute('visibility', 'visible');
    } else view.preview.setAttribute('visibility', 'hidden');

    choices.hidden = task.type !== 'mincut';
    choiceButtons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(p.value === i + 1));
      button.disabled = !open;
    });

    const [text, kind] = statusOf(task, p);
    status.textContent = text;
    status.dataset.state = kind;

    submitButton.disabled = !canSubmit(state);
    submitButton.hidden = !open;
    clearButton.disabled = p.edges.length === 0 && p.nodes.length === 0 && p.value === -1 && p.feedback === null;
    clearButton.hidden = !open;
    solutionButton.hidden = !open;
    nextButton.hidden = !canAdvance(state);

    const finished = isFinished(state);
    summary.hidden = !finished;
    if (finished) {
      const sum = totals(state);
      summary.textContent = t('summary', { total: TASKS_PER_SESSION, attempts: sum.attempts, shown: sum.solutionsShown });
    }
  };

  /* ---------- Actions ---------- */

  /** Applies a new state; returns false when nothing changed. */
  const commit = (next: GdState, message?: string): boolean => {
    if (next === state) return false;
    const wasFinished = isFinished(state);
    state = next;
    render();
    context.requestSave();
    if (message) announce(live, message);
    if (!wasFinished && isFinished(state)) {
      const sum = totals(state);
      context.finished({ outcome: 'completed', stats: { tasks: TASKS_PER_SESSION, attempts: sum.attempts, solutionsShown: sum.solutionsShown } });
    }
    return true;
  };

  const activateEdge = (e: number) => {
    const before = currentProgress(state).edges.includes(e);
    const next = toggleEdge(state, e);
    if (next === state) return;
    const item = edgeText(currentTask(state), e, false);
    commit(next, t(before ? 'announce.deselected' : 'announce.selected', { item }));
  };

  const activateNode = (v: number) => {
    const before = currentProgress(state).nodes.includes(v);
    const next = toggleNode(state, v);
    if (next === state) return;
    const note = statusOf(currentTask(next), currentProgress(next))[0];
    commit(next, `${t(before ? 'announce.deselected' : 'announce.selected', { item: nodeText(v, false) })} ${note}`.trim());
  };

  const activateItem = (item: Element) => {
    if (paused || !isOpen(state)) return;
    const el = item as SVGGElement;
    if (el.dataset.edge !== undefined && edgeTasks.has(currentTask(state).type)) activateEdge(Number(el.dataset.edge));
    else if (el.dataset.node !== undefined && nodeTasks.has(currentTask(state).type)) activateNode(Number(el.dataset.node));
  };

  const focusItem = (item: SVGGElement) => {
    for (const other of built?.items ?? []) other.setAttribute('tabindex', '-1');
    item.setAttribute('tabindex', '0');
    item.focus({ preventScroll: true });
  };

  /** The point or connection nearest to a pointer position, if it is close enough. */
  const pick = (event: MouseEvent): SVGGElement | null => {
    const view = built;
    const matrix = diagram.getScreenCTM?.();
    if (!view || !matrix || event.detail === 0) return null;
    const inverse = matrix.inverse();
    const p: Point = [
      inverse.a * event.clientX + inverse.c * event.clientY + inverse.e,
      inverse.b * event.clientX + inverse.d * event.clientY + inverse.f
    ];
    const task = view.task;
    let best: SVGGElement | null = null;
    let bestDistance = Infinity;
    if (nodeTasks.has(task.type)) {
      task.pos.forEach((q, v) => {
        const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (d <= PICK_NODE && d < bestDistance) [best, bestDistance] = [view.nodes[v]!, d];
      });
    } else if (edgeTasks.has(task.type)) {
      // A tap right on a point is not a tap on one of its connections.
      if (task.pos.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) <= NODE_R)) return null;
      task.edges.forEach(([a, b], i) => {
        const d = pointSegmentDistance(p, task.pos[a]!, task.pos[b]!);
        if (d <= PICK_EDGE && d < bestDistance) [best, bestDistance] = [view.edges[i]!, d];
      });
    }
    return best;
  };

  const onDiagramClick = (event: MouseEvent) => {
    if (paused || !isOpen(state) || !built) return;
    const item = pick(event) ?? (event.target as Element | null)?.closest<SVGGElement>('[role="button"]') ?? null;
    if (!item || !built.items.includes(item)) return;
    focusItem(item);
    activateItem(item);
  };

  const onDiagramKey = (event: KeyboardEvent) => {
    if (paused || event.altKey || event.ctrlKey || event.metaKey || !built) return;
    const items = built.items;
    const index = items.indexOf(event.target as SVGGElement);
    if (index < 0) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateItem(items[index]!);
      return;
    }
    const rtl = t.direction === 'rtl';
    const steps: Record<string, number> = {
      ArrowDown: 1,
      ArrowUp: -1,
      ArrowRight: rtl ? -1 : 1,
      ArrowLeft: rtl ? 1 : -1,
      Home: -index,
      End: items.length - 1 - index
    };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    focusItem(items[(index + step + items.length) % items.length]!);
  };

  const onChoose = (n: number) => {
    if (paused) return;
    commit(chooseValue(state, n), t('announce.value', { n }));
  };

  const onSubmit = () => {
    if (paused || !canSubmit(state)) return;
    commit(submit(state));
    announce(live, status.textContent ?? '');
    if (canAdvance(state)) nextButton.focus();
  };

  const onClear = () => {
    if (paused) return;
    commit(clearSelection(state), t('announce.cleared'));
  };

  const onSolution = () => {
    if (paused) return;
    if (commit(showSolution(state))) {
      announce(live, status.textContent ?? '');
      if (canAdvance(state)) nextButton.focus();
    }
  };

  const onNext = () => {
    if (paused) return;
    if (!commit(nextTask(state))) return;
    announce(live, `${progressEl.textContent ?? ''} ${taskEl.textContent ?? ''}`);
    const first = built?.items[0] ?? (choices.hidden ? null : choiceButtons[0]);
    first?.focus({ preventScroll: true });
  };

  const show = (next: GdState) => {
    state = next;
    built = null;
    if (!container.isConnected) root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitialState(options.seed, toDifficulty(options.difficulty)));
    },
    restore(saved: GdState) {
      show(cloneState(saved));
    },
    serialize: () => cloneState(state),
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
      built = null;
      clear(root);
    }
  };
}
