// @ts-nocheck
import type { GameContext, GameInstance, NewGameOptions, Translator } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  canRestart,
  canUndo,
  choosePuzzle,
  createInitialState,
  cross,
  getPuzzle,
  progressOf,
  puzzleCount,
  puzzleOf,
  resetState,
  restart,
  toDifficulty,
  toggleBoat,
  tripsLeft,
  undo,
  weightOf,
  type CrossViolation,
  type EntityKind,
  type PuzzleDef,
  type RiverState,
  type RuleDef,
  type Side,
  type ToggleRefusal
} from './rules';
import './styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
}

export type IconName = 'person' | 'child' | 'robot' | 'paw' | 'bird' | 'box' | 'food' | 'tool';

/** Simple shapes drawn here (no third-party art). The text label always names the entity too. */
export const KIND_ICON: Readonly<Record<EntityKind, IconName>> = {
  courier: 'person', keeper: 'person', scout: 'child', coach: 'person', teacher: 'person', child: 'child',
  ranger: 'person', gardener: 'person', hiker: 'person', researcher: 'person', assistant: 'person',
  chef: 'person', apprentice: 'child', navigator: 'person', sailor: 'person',
  robot: 'robot',
  parrot: 'bird', goose: 'bird', rooster: 'bird', owl: 'bird',
  monkey: 'paw', dog: 'paw', cat: 'paw', mouse: 'paw', puppy: 'paw', fox: 'paw',
  parcel: 'box', crate: 'box', backpack: 'box',
  crackers: 'food', seeds: 'food', cheese: 'food', hay: 'food',
  magnet: 'tool', compass: 'tool', map: 'tool'
};

function icon(name: IconName): SVGSVGElement {
  const root = svg('svg', { viewBox: '0 0 24 24', class: `rc-icon rc-icon-${name}`, 'aria-hidden': 'true', focusable: 'false' });
  const add = (tag: 'circle' | 'path' | 'rect' | 'ellipse', attrs: Record<string, string | number>) => root.append(svg(tag, attrs));
  switch (name) {
    case 'person':
      add('circle', { cx: 12, cy: 6.5, r: 3.5 });
      add('path', { d: 'M5 21 C5 14 8 11.5 12 11.5 C16 11.5 19 14 19 21 Z' });
      break;
    case 'child':
      add('circle', { cx: 12, cy: 9, r: 3 });
      add('path', { d: 'M7 21 C7 16 9 13.5 12 13.5 C15 13.5 17 16 17 21 Z' });
      break;
    case 'robot':
      add('path', { d: 'M12 2 V5', class: 'rc-stroke' });
      add('rect', { x: 5, y: 5, width: 14, height: 10, rx: 2 });
      add('rect', { x: 7, y: 16, width: 10, height: 6, rx: 1.5 });
      add('circle', { cx: 9.5, cy: 10, r: 1.4, class: 'rc-hole' });
      add('circle', { cx: 14.5, cy: 10, r: 1.4, class: 'rc-hole' });
      break;
    case 'paw':
      add('ellipse', { cx: 12, cy: 16, rx: 5, ry: 4.2 });
      add('circle', { cx: 5.5, cy: 10.5, r: 2.1 });
      add('circle', { cx: 9.5, cy: 6.5, r: 2.1 });
      add('circle', { cx: 14.5, cy: 6.5, r: 2.1 });
      add('circle', { cx: 18.5, cy: 10.5, r: 2.1 });
      break;
    case 'bird':
      add('path', { d: 'M3 13 C6 7 13 6 16 9 L21 8 L18 11 C18 17 12 20 7 18 Z' });
      add('circle', { cx: 15, cy: 10.5, r: 1, class: 'rc-hole' });
      break;
    case 'box':
      add('rect', { x: 3.5, y: 5.5, width: 17, height: 14, rx: 1.5 });
      add('path', { d: 'M3.5 10 H20.5 M12 5.5 V19.5', class: 'rc-stroke rc-on-fill' });
      break;
    case 'food':
      add('path', { d: 'M12 21 C5 17 4 9 12 3 C20 9 19 17 12 21 Z' });
      add('path', { d: 'M12 20 V8', class: 'rc-stroke rc-on-fill' });
      break;
    case 'tool':
      add('path', { d: 'M12 2 L21 12 L12 22 L3 12 Z' });
      add('circle', { cx: 12, cy: 12, r: 3, class: 'rc-hole' });
      break;
  }
  return root;
}

function oarIcon(): SVGSVGElement {
  const root = svg('svg', { viewBox: '0 0 24 24', class: 'rc-oar', 'aria-hidden': 'true', focusable: 'false' });
  root.append(svg('path', { d: 'M4 20 L14 10', class: 'rc-stroke' }), svg('ellipse', { cx: 17, cy: 7, rx: 2.6, ry: 5, transform: 'rotate(45 17 7)' }));
  return root;
}

/** Locale-aware list ("A, B and C" / "A or B"). Falls back to a comma list without Intl.ListFormat. */
export function formatList(locale: string, items: readonly string[], type: 'conjunction' | 'disjunction' | 'unit'): string {
  try {
    return new Intl.ListFormat(locale, { type, style: type === 'unit' ? 'short' : 'long' }).format(items);
  } catch {
    return items.join(', ');
  }
}

export function entityName(t: Translator, puzzle: PuzzleDef, index: number): string {
  const entity = puzzle.entities[index];
  if (!entity) return '';
  const name = t(`entity.${entity.kind}`);
  return entity.n === undefined ? name : t('entity.numbered', { name, n: entity.n });
}

const namesOf = (t: Translator, puzzle: PuzzleDef, ids: readonly string[]) =>
  ids.map((id) => entityName(t, puzzle, puzzle.entities.findIndex((e) => e.id === id)));

const groupName = (t: Translator, puzzle: PuzzleDef, ids: readonly string[]) =>
  t(`group.${puzzle.entities.find((e) => e.id === ids[0])?.kind ?? ''}`);

/** One plain-language sentence per company/boat rule. */
export function ruleText(t: Translator, puzzle: PuzzleDef, rule: RuleDef): string {
  const and = (ids: readonly string[]) => formatList(t.locale, namesOf(t, puzzle, ids), 'conjunction');
  const or = (ids: readonly string[]) => formatList(t.locale, namesOf(t, puzzle, ids), 'disjunction');
  switch (rule.kind) {
    case 'apart':
      return t('rule.apart', { a: and([rule.a]), b: or(rule.b), unless: or(rule.unless) });
    case 'needs':
      return t('rule.needs', { who: and(rule.who), any: or(rule.any) });
    case 'outnumber':
      return t('rule.outnumber', { group: groupName(t, puzzle, rule.group), by: groupName(t, puzzle, rule.by) });
    case 'boatApart':
      return t('rule.boatApart', { a: and([rule.a]), b: and([rule.b]) });
  }
}

/** Every rule of the puzzle, boat rules first. */
export function rulesTexts(t: Translator, puzzle: PuzzleDef): string[] {
  const texts = [t('rule.seats', { n: puzzle.capacity })];
  if (puzzle.maxWeight !== undefined) texts.push(t('rule.weight', { max: puzzle.maxWeight }));
  const rowers = puzzle.entities.map((e, i) => (e.rower === true ? i : -1)).filter((i) => i >= 0);
  if (rowers.length === puzzle.entities.length) texts.push(t('rule.allRow'));
  else texts.push(t('rule.rowers', { list: formatList(t.locale, rowers.map((i) => entityName(t, puzzle, i)), 'conjunction') }));
  puzzle.entities.forEach((e, i) => {
    if (e.trips !== undefined) texts.push(t('rule.trips', { name: entityName(t, puzzle, i), n: e.trips }));
  });
  if (puzzle.maxCrossings !== undefined) texts.push(t('rule.limit', { n: puzzle.maxCrossings }));
  for (const rule of puzzle.rules) texts.push(ruleText(t, puzzle, rule));
  return texts;
}

const BANK_MARK: Readonly<Record<Side, string>> = { left: '◆', right: '★' };

const bankName = (t: Translator, side: Side) => t(side === 'left' ? 'bank.left' : 'bank.right');

/** Plain-language reason why a crossing was not carried out. */
export function violationText(t: Translator, puzzle: PuzzleDef, violation: CrossViolation): string {
  const name = (i: number) => entityName(t, puzzle, i);
  const or = (ids: readonly string[]) => formatList(t.locale, namesOf(t, puzzle, ids), 'disjunction');
  switch (violation.kind) {
    case 'solved':
      return t('why.solved');
    case 'empty':
      return t('why.empty');
    case 'full':
      return t('why.full', { n: violation.capacity });
    case 'noRower':
      return t('why.noRower');
    case 'weight':
      return t('why.weight', { weight: violation.weight, max: violation.max });
    case 'boatApart':
      return t('why.boatApart', { a: name(violation.a), b: name(violation.b) });
    case 'notHere':
      return t('why.notHere', { name: name(violation.entity) });
    case 'trips':
      return t('why.trips', { name: name(violation.entity), n: violation.max });
    case 'limit':
      return t('why.limit', { n: violation.max });
    case 'apart': {
      const rule = puzzle.rules[violation.rule] as Extract<RuleDef, { kind: 'apart' }>;
      return t('why.apart', { bank: bankName(t, violation.bank), a: name(violation.a), b: name(violation.b), unless: or(rule.unless) });
    }
    case 'needs': {
      const rule = puzzle.rules[violation.rule] as Extract<RuleDef, { kind: 'needs' }>;
      const who = formatList(t.locale, violation.who.map(name), 'conjunction');
      return t('why.needs', { bank: bankName(t, violation.bank), who, any: or(rule.any) });
    }
    case 'outnumber': {
      const rule = puzzle.rules[violation.rule] as Extract<RuleDef, { kind: 'outnumber' }>;
      return t('why.outnumber', {
        bank: bankName(t, violation.bank),
        by: groupName(t, puzzle, rule.by),
        group: groupName(t, puzzle, rule.group),
        nBy: violation.by,
        nGroup: violation.group
      });
    }
  }
}

const REFUSAL_KEY: Readonly<Record<ToggleRefusal, string>> = { solved: 'why.solved', notHere: 'refuse.notHere', full: 'refuse.full' };

const cloneState = (state: RiverState): RiverState => ({
  ...state,
  history: state.history.map((entry) => (Array.isArray(entry) ? [...entry] : entry)),
  boat: [...state.boat]
});

type StatusKind = 'info' | 'blocked' | 'solved';

export function createRiverCrossing(context: GameContext): GameInstance<RiverState> {
  const { t, root } = context;
  let state = createInitialState(0);
  let paused = false;
  let builtKey = '';
  let tokens: HTMLButtonElement[] = [];
  let note: { text: string; kind: StatusKind } | null = null;

  const puzzleStatus = h('p', { class: 'rc-puzzle', 'data-testid': 'rc-puzzle' });
  const crossings = h('p', { class: 'rc-stats', 'data-testid': 'rc-crossings' });
  const rulesList = h('ul', { class: 'rc-rule-list', 'data-testid': 'rc-rules' });
  const rulesBox = h('section', { class: 'rc-rules', 'aria-labelledby': 'rc-rules-heading' }, h('h3', { id: 'rc-rules-heading' }, t('rules.heading')), rulesList);

  const bankSlot = (side: Side) => h('div', { class: 'rc-slot', 'data-testid': `rc-bank-${side}` });
  const leftSlot = bankSlot('left');
  const rightSlot = bankSlot('right');
  const boatSlot = h('div', { class: 'rc-slot rc-boat-slot', 'data-testid': 'rc-boat-slot' });
  const boatInfo = h('p', { class: 'rc-boat-info', 'data-testid': 'rc-boat-info' });
  const boatEmpty = h('p', { class: 'rc-boat-empty wp-muted' }, t('boat.empty'));
  /** The docked bank's mark (◆ start, ★ goal) — a shape cue in addition to the boat's position. */
  const boatMark = h('span', { class: 'rc-bank-mark', 'aria-hidden': 'true' });
  const boat = h('div', { class: 'rc-boat', 'data-testid': 'rc-boat', role: 'group', 'aria-label': t('boat.label') },
    h('p', { class: 'rc-boat-title' }, t('boat.label'), boatMark), boatInfo, boatSlot, boatEmpty);
  const bank = (side: Side, slot: HTMLElement) =>
    h('div', { class: 'rc-bank', 'data-bank': side, role: 'group', 'aria-labelledby': `rc-bank-${side}-title` },
      h('h3', { class: 'rc-bank-title', id: `rc-bank-${side}-title` }, h('span', { class: 'rc-bank-mark', 'aria-hidden': 'true' }, BANK_MARK[side]), bankName(t, side)),
      slot);
  const river = h('div', { class: 'rc-river' }, boat);
  const scene = h('div', { class: 'rc-scene', 'data-testid': 'rc-scene', role: 'group', 'aria-label': t('scene') }, bank('left', leftSlot), river, bank('right', rightSlot));

  const status = h('p', { class: 'wp-status rc-status', 'data-testid': 'rc-status' });
  const crossButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'rc-cross', 'aria-keyshortcuts': 'C', onclick: () => onCross() }, t('action.cross'));
  const undoButton = h('button', { type: 'button', 'data-testid': 'rc-undo', 'aria-keyshortcuts': 'U', onclick: () => onUndo() }, t('common.undo'));
  const restartButton = h('button', { type: 'button', 'data-testid': 'rc-restart', onclick: () => onRestart() }, t('action.restart'));
  const actions = h('div', { class: 'rc-actions' }, crossButton, undoButton, restartButton);

  const puzzleSelect = h('select', { id: 'rc-puzzle-select', 'data-testid': 'rc-puzzle-select' });
  const playButton = h('button', { type: 'button', 'data-testid': 'rc-puzzle-play', onclick: () => onChoosePuzzle() }, t('puzzle.play'));
  const chooser = h('div', { class: 'wp-row rc-chooser' }, h('label', { for: 'rc-puzzle-select' }, t('puzzle.choose')), puzzleSelect, playButton);

  const help = h('div', { class: 'rc-help wp-muted' },
    h('p', { id: 'rc-help-keys' }, t('help.keys')),
    h('p', {}, t('help.touch')),
    h('p', {}, t('help.rules')));
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'rc-announcer' });

  const container = h(
    'div',
    { class: `wp-river-crossing${context.reducedMotion ? ' rc-reduced' : ''}`, dir: t.direction, lang: t.locale, onkeydown: (event: Event) => onKey(event as KeyboardEvent) },
    puzzleStatus,
    rulesBox,
    crossings,
    scene,
    status,
    actions,
    chooser,
    help,
    live
  );

  const name = (i: number) => entityName(t, puzzleOf(state), i);

  /** (Re)creates the entity tokens, rules and puzzle list when the puzzle changes. */
  const build = () => {
    const key = `${state.difficulty}/${state.puzzle}`;
    if (key === builtKey) return;
    builtKey = key;
    const puzzle = puzzleOf(state);
    tokens = puzzle.entities.map((entity, i) =>
      h('button', {
        type: 'button',
        class: 'rc-token',
        'data-testid': `entity-${entity.id}`,
        'data-kind': entity.kind,
        'aria-describedby': 'rc-help-keys',
        onclick: () => onToggle(i)
      })
    );
    clear(rulesList);
    rulesList.append(...rulesTexts(t, puzzle).map((text) => h('li', {}, text)));
    clear(puzzleSelect);
    const total = puzzleCount(state.difficulty);
    for (let i = 0; i < total; i++) {
      const title = t(`puzzle.${getPuzzle(state.difficulty, i).id}`);
      puzzleSelect.append(h('option', { value: i }, t('puzzle.option', { n: i + 1, title })));
    }
    puzzleSelect.value = String(state.puzzle);
  };

  const fillToken = (i: number, where: Side | 'boat', left: number) => {
    const puzzle = puzzleOf(state);
    const entity = puzzle.entities[i];
    const token = tokens[i];
    if (!entity || !token) return;
    const details: string[] = [];
    const badges: (HTMLElement | SVGSVGElement)[] = [];
    if (entity.rower === true) {
      details.push(t('token.rower'));
      badges.push(h('span', { class: 'rc-badge rc-badge-oar', title: t('token.rower') }, oarIcon()));
    }
    if (puzzle.maxWeight !== undefined) {
      const text = t('token.weight', { n: entity.weight ?? 0 });
      details.push(text);
      badges.push(h('span', { class: 'rc-badge' }, text));
    }
    if (entity.trips !== undefined) {
      const text = t('token.trips', { n: left });
      details.push(text);
      badges.push(h('span', { class: 'rc-badge', 'data-testid': `trips-${entity.id}` }, text));
    }
    const label = name(i);
    token.replaceChildren(icon(KIND_ICON[entity.kind]), h('span', { class: 'rc-name' }, label), ...badges);
    token.setAttribute('aria-label', formatList(t.locale, [label, ...details, t(`token.where.${where}`)], 'unit'));
    token.dataset.side = where;
  };

  const render = () => {
    build();
    const puzzle = puzzleOf(state);
    const progress = progressOf(state);
    const { position, solved } = progress;
    const total = puzzleCount(state.difficulty);
    puzzleStatus.textContent = t('puzzle.status', { n: state.puzzle + 1, total, title: t(`puzzle.${puzzle.id}`) });
    crossings.textContent = puzzle.maxCrossings === undefined
      ? t('stats.crossings', { n: position.crossings })
      : t('stats.crossingsOf', { n: position.crossings, max: puzzle.maxCrossings });
    crossings.dataset.value = String(position.crossings);

    const focused = tokens.indexOf(document.activeElement as HTMLButtonElement);
    const slots: Record<Side | 'boat', HTMLButtonElement[]> = { left: [], right: [], boat: [] };
    puzzle.entities.forEach((_, i) => {
      const where = state.boat.includes(i) ? 'boat' : (position.sides[i] as Side);
      fillToken(i, where, tripsLeft(puzzle, position, i));
      slots[where].push(tokens[i] as HTMLButtonElement);
      (tokens[i] as HTMLButtonElement).setAttribute('aria-disabled', String(solved));
    });
    leftSlot.replaceChildren(...slots.left);
    rightSlot.replaceChildren(...slots.right);
    boatSlot.replaceChildren(...slots.boat);
    if (focused >= 0) tokens[focused]?.focus({ preventScroll: true });
    boatEmpty.hidden = slots.boat.length > 0;

    const info = [t('boat.seats', { used: state.boat.length, n: puzzle.capacity })];
    if (puzzle.maxWeight !== undefined) info.push(t('boat.load', { used: weightOf(puzzle, state.boat), max: puzzle.maxWeight }));
    boatInfo.textContent = info.join(' · ');
    boat.dataset.side = position.boat;
    boatMark.textContent = BANK_MARK[position.boat];
    scene.dataset.boat = position.boat;
    container.dataset.solved = String(solved);

    const shown = solved
      ? { text: solvedText(), kind: 'solved' as const }
      : note ?? { text: t(position.boat === 'left' ? 'status.boatLeft' : 'status.boatRight'), kind: 'info' as const };
    status.textContent = shown.text;
    status.dataset.state = shown.kind;

    crossButton.disabled = solved;
    undoButton.disabled = !canUndo(state);
    restartButton.disabled = !canRestart(state);
  };

  const solvedText = () =>
    t('status.solved', { n: progressOf(state).position.crossings, min: puzzleOf(state).minCrossings });

  /** Applies a new state (saving it); `message` is announced. */
  const commit = (next: RiverState, message: () => string) => {
    const wasSolved = progressOf(state).solved;
    state = next;
    note = null;
    render();
    context.requestSave();
    const progress = progressOf(state);
    if (progress.solved && !wasSolved) {
      announce(live, `${message()} ${solvedText()}`);
      context.finished({ outcome: 'completed', stats: { crossings: progress.position.crossings, optimum: puzzleOf(state).minCrossings } });
    } else {
      announce(live, message());
    }
  };

  /** Shows (and announces) why something was not done; the state is unchanged. */
  const explain = (text: string) => {
    note = { text, kind: 'blocked' };
    render();
    announce(live, text);
  };

  const onToggle = (i: number) => {
    if (paused) return;
    const result = toggleBoat(state, i);
    if (result.refused) {
      if (result.refused !== 'solved') explain(t(REFUSAL_KEY[result.refused], { name: name(i), n: puzzleOf(state).capacity }));
      return;
    }
    const boarded = result.state.boat.includes(i);
    commit(result.state, () => t(boarded ? 'announce.in' : 'announce.out', { name: name(i) }));
  };

  const onCross = () => {
    if (paused) return;
    const result = cross(state);
    if (result.violation) {
      if (result.violation.kind !== 'solved') explain(`${violationText(t, puzzleOf(state), result.violation)} ${t('why.nothingChanged')}`);
      return;
    }
    commit(result.state, () => {
      const { position } = progressOf(state);
      return t(position.boat === 'left' ? 'announce.crossedLeft' : 'announce.crossedRight', { n: position.crossings });
    });
  };

  const onUndo = () => {
    if (paused || !canUndo(state)) return;
    commit(undo(state), () => t('announce.undone', { n: progressOf(state).position.crossings }));
  };

  const onRestart = () => {
    if (paused || !canRestart(state)) return;
    commit(restart(state), () => t('announce.restarted'));
  };

  const onChoosePuzzle = () => {
    if (paused) return;
    const index = Number(puzzleSelect.value);
    const next = choosePuzzle(state, index);
    if (next === state) return;
    commit(next, () => t('announce.puzzle', { n: index + 1, total: puzzleCount(state.difficulty) }));
  };

  const onKey = (event: KeyboardEvent) => {
    if (paused || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as Element | null;
    if (target instanceof HTMLSelectElement || target instanceof HTMLInputElement) return;
    const key = event.key.toLowerCase();
    if (key === 'c' || event.code === 'KeyC') {
      event.preventDefault();
      onCross();
    } else if (key === 'u' || event.code === 'KeyU') {
      event.preventDefault();
      onUndo();
    }
  };

  const show = (next: RiverState) => {
    state = next;
    note = null;
    if (!container.isConnected) root.appendChild(container);
    builtKey = '';
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitialState(options.seed, toDifficulty(options.difficulty)));
    },
    restore(saved: RiverState) {
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
      clear(root);
    }
  };
}
