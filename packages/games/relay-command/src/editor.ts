import type { Translator } from '@wp/game-core';
import { clear, h } from '@wp/ui';
import { CELL, drawDeposit, drawTerrainMark, TERRAIN_NAMES } from './draw';
import { drawIcon } from './icons';
import {
  applyTool,
  blankMap,
  decodeMap,
  encodeMap,
  fromScenario,
  isFair,
  loadLibrary,
  MAP_HEIGHTS,
  MAP_KINDS,
  MAP_SLOTS,
  MAP_WIDTHS,
  mapIssues,
  MAX_NAME,
  removeFromLibrary,
  resize,
  saveToLibrary,
  TERRAIN_CODES,
  type EditMap,
  type MapStore,
  type Tool
} from './maps';
import type { MapDraft } from './rules';
import { SCENARIOS } from './scenarios';

/**
 * The map editor (owner request after PR #14): paint terrain, place deposits, Command Posts,
 * structures and units for both sides, mirrored by default so both sides start equal; check,
 * save to the device's maps, share as a code, and play. Pointer (click or drag), touch and
 * keyboard (arrow keys move the cursor, Enter or Space applies the tool). The draft lives in the
 * game state, so the editor can be closed and resumed at any moment.
 */
export interface EditorOptions {
  readonly t: Translator;
  readonly css: (name: string, fallback: string) => string;
  readonly icon: (kind: string, own: boolean) => HTMLElement;
  readonly store: MapStore | undefined;
  readonly draft: () => MapDraft;
  /** Stores a changed draft in the game state (and asks for a save); `message` is announced. */
  readonly change: (draft: MapDraft, message?: string) => void;
  readonly close: () => void;
  readonly play: (map: EditMap) => void;
  /** Playing would end a game in progress: the Play button then asks twice. */
  readonly playEndsGame: () => boolean;
  readonly announce: (text: string) => void;
}

/** Milliseconds after arming a two-press button in which a second press does not count. */
const CONFIRM_GAP = 400;

export function createEditor(o: EditorOptions): { readonly el: HTMLElement; render(): void } {
  const { t } = o;
  let tool: Tool = { type: 'terrain', code: '=' };
  let side = 0;
  let cursor = { x: 0, y: 0 };
  /** Two-press buttons: which one is armed, and when. */
  let armed: string | null = null;
  let armedAt = 0;
  let codeOpen = false;
  let painting = false;
  let lastCell = -1;

  const map = () => o.draft().map;
  const mapName = (m: EditMap) => m.name.trim() || t('editor.untitled');
  const set = (next: EditMap, message?: string) => {
    if (next === map() && message === undefined) return;
    o.change({ ...o.draft(), map: next }, message);
  };
  /** First press arms, a deliberate second press (not within CONFIRM_GAP) confirms. */
  const confirmed = (key: string): boolean => {
    if (armed !== key) {
      armed = key;
      armedAt = performance.now();
      render();
      return false;
    }
    if (performance.now() - armedAt < CONFIRM_GAP) return false;
    armed = null;
    return true;
  };

  // --- Settings row --------------------------------------------------------------------------
  const nameInput = h('input', { type: 'text', 'data-testid': 'ed-name', maxlength: MAX_NAME, autocomplete: 'off' }) as HTMLInputElement;
  nameInput.addEventListener('change', () => set({ ...map(), name: nameInput.value.slice(0, MAX_NAME) }));
  const widthSelect = h('select', { 'data-testid': 'ed-width', onchange: () => set(resize(map(), Number(widthSelect.value), map().h)) }) as HTMLSelectElement;
  for (const w of MAP_WIDTHS) widthSelect.append(h('option', { value: String(w) }, String(w)));
  const heightSelect = h('select', { 'data-testid': 'ed-height', onchange: () => set(resize(map(), map().w, Number(heightSelect.value))) }) as HTMLSelectElement;
  for (const v of MAP_HEIGHTS) heightSelect.append(h('option', { value: String(v) }, String(v)));
  const mirrorBox = h('input', { type: 'checkbox', 'data-testid': 'ed-mirror', onchange: () => o.change({ ...o.draft(), mirror: mirrorBox.checked }) }) as HTMLInputElement;
  const startSelect = h('select', { 'data-testid': 'ed-start' }) as HTMLSelectElement;
  startSelect.append(h('option', { value: 'blank' }, t('editor.blank')));
  for (const spec of SCENARIOS) startSelect.append(h('option', { value: spec.id }, t(`scenario.${spec.id}`)));
  const loadBtn = h('button', { type: 'button', 'data-testid': 'ed-load', onclick: () => onLoad() });
  const settings = h(
    'div',
    { class: 'rc-ed-settings' },
    h('label', {}, h('span', {}, t('editor.name')), nameInput),
    h('label', {}, h('span', {}, t('editor.width')), widthSelect),
    h('label', {}, h('span', {}, t('editor.height')), heightSelect),
    h('label', { class: 'rc-ed-check' }, mirrorBox, h('span', {}, t('editor.mirror'))),
    h('div', { class: 'rc-ed-start' }, h('label', {}, h('span', {}, t('editor.start')), startSelect), loadBtn)
  );

  // --- Palette -------------------------------------------------------------------------------
  const palette = h('div', { class: 'rc-ed-palette', 'data-testid': 'ed-palette' });
  const swatch = (code: string): HTMLElement => {
    const el = h('canvas', { class: 'rc-icon', width: CELL, height: CELL, 'aria-hidden': 'true' }) as HTMLCanvasElement;
    let g: CanvasRenderingContext2D | null = null;
    try {
      g = el.getContext('2d');
    } catch {
      g = null;
    }
    if (g) {
      const name = TERRAIN_NAMES[code] ?? 'plain';
      g.fillStyle = o.css(`--rc-${name}`, '#ddd');
      g.fillRect(0, 0, CELL, CELL);
      g.strokeStyle = o.css('--rc-mark', '#00000055');
      g.fillStyle = o.css('--rc-mark', '#00000055');
      g.lineWidth = 1.5;
      drawTerrainMark(g, name, 0, 0);
    }
    return el;
  };
  const same = (a: Tool, b: Tool) => JSON.stringify(a) === JSON.stringify(b);
  const toolButton = (next: Tool, label: string, pic: HTMLElement, id: string) =>
    h('button', { type: 'button', class: 'rc-ed-tool', 'data-testid': `ed-tool-${id}`, 'aria-pressed': same(tool, next) ? 'true' : 'false', onclick: () => pick(next, label) }, pic, h('span', {}, label));
  const sideButton = (s: number) =>
    h('button', { type: 'button', class: 'rc-ed-side', 'data-testid': `ed-side-${s}`, 'aria-pressed': side === s ? 'true' : 'false', onclick: () => pickSide(s) }, t(s === 0 ? 'editor.sideOwn' : 'editor.sideEnemy'));

  function renderPalette(): void {
    clear(palette);
    const terrain = h('div', { class: 'rc-ed-group', role: 'group', 'aria-label': t('editor.terrain') });
    for (const code of TERRAIN_CODES) terrain.append(toolButton({ type: 'terrain', code }, t(`terrain.${TERRAIN_NAMES[code] ?? 'plain'}`), swatch(code), `t${TERRAIN_CODES.indexOf(code)}`));
    const objects = h('div', { class: 'rc-ed-group', role: 'group', 'aria-label': t('editor.objects') });
    const deposit = h('canvas', { class: 'rc-icon', width: CELL, height: CELL, 'aria-hidden': 'true' }) as HTMLCanvasElement;
    try {
      const g = deposit.getContext('2d');
      if (g) {
        g.strokeStyle = o.css('--wp-text', '#1d1d1b');
        g.fillStyle = o.css('--wp-text', '#1d1d1b');
        drawDeposit(g, -CELL / 2 + 9, CELL / 2 - 9);
      }
    } catch {
      /* no canvas: the label says it */
    }
    objects.append(toolButton({ type: 'deposit' }, t('editor.deposit'), deposit, 'deposit'), toolButton({ type: 'erase' }, t('editor.erase'), h('span', { class: 'rc-ed-erase', 'aria-hidden': 'true' }, '⌫'), 'erase'));
    const units = h('div', { class: 'rc-ed-group', role: 'group', 'aria-label': t('editor.units') });
    for (const kind of MAP_KINDS) units.append(toolButton({ type: 'unit', kind, side }, t(`unit.${kind}`), o.icon(kind, side === 0), kind));
    palette.append(
      h('h4', {}, t('editor.terrain')),
      terrain,
      h('h4', {}, t('editor.objects')),
      objects,
      h('h4', {}, t('editor.units')),
      h('div', { class: 'rc-ed-group', role: 'group', 'aria-label': t('editor.side') }, h('span', { class: 'rc-muted' }, t('editor.side')), sideButton(0), sideButton(1)),
      units
    );
  }

  function pick(next: Tool, label: string): void {
    tool = next;
    render();
    o.announce(t('editor.toolChosen', { tool: label }));
  }
  function pickSide(s: number): void {
    side = s;
    if (tool.type === 'unit') tool = { ...tool, side };
    render();
  }

  // --- Map canvas ------------------------------------------------------------------------------
  const canvas = h('canvas', { class: 'rc-ed-map', 'data-testid': 'ed-map', tabindex: 0, role: 'application', 'aria-roledescription': t('editor.title'), 'aria-describedby': 'rc-ed-cursor' }) as HTMLCanvasElement;
  const cursorDesc = h('p', { id: 'rc-ed-cursor', class: 'rc-muted', 'data-testid': 'ed-cursor', 'aria-live': 'polite' });
  const cellAt = (event: MouseEvent): { x: number; y: number } | undefined => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return undefined;
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * map().w);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * map().h);
    return x >= 0 && y >= 0 && x < map().w && y < map().h ? { x, y } : undefined;
  };
  const applyAt = (x: number, y: number) => {
    cursor = { x, y };
    set(applyTool(map(), tool, x, y, o.draft().mirror));
    render();
  };
  canvas.addEventListener('pointerdown', (event) => {
    const cell = cellAt(event);
    if (!cell) return;
    painting = true;
    lastCell = cell.y * map().w + cell.x;
    canvas.setPointerCapture?.(event.pointerId);
    applyAt(cell.x, cell.y);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!painting || tool.type === 'unit') return; // units are placed one by one
    const cell = cellAt(event);
    if (!cell || cell.y * map().w + cell.x === lastCell) return;
    lastCell = cell.y * map().w + cell.x;
    applyAt(cell.x, cell.y);
  });
  const stop = () => {
    painting = false;
    lastCell = -1;
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  // Clicks without pointer events (keyboard-free assistive tech, tests).
  canvas.addEventListener('click', (event) => {
    if ((event as PointerEvent).pointerId !== undefined && event.detail !== 0) return;
    const cell = cellAt(event);
    if (cell) applyAt(cell.x, cell.y);
  });
  canvas.addEventListener('keydown', (event) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const delta = moves[event.key];
    if (delta) {
      event.preventDefault();
      cursor = { x: Math.max(0, Math.min(map().w - 1, cursor.x + delta[0])), y: Math.max(0, Math.min(map().h - 1, cursor.y + delta[1])) };
      render();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      applyAt(cursor.x, cursor.y);
    }
  });

  function drawMap(): void {
    const m = map();
    canvas.width = m.w * CELL;
    canvas.height = m.h * CELL;
    canvas.setAttribute('data-cols', String(m.w));
    let g: CanvasRenderingContext2D | null = null;
    try {
      g = canvas.getContext('2d');
    } catch {
      g = null;
    }
    if (!g) return;
    const grid = o.css('--rc-grid', '#00000022');
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        const name = TERRAIN_NAMES[m.terrain[y * m.w + x] ?? '.'] ?? 'plain';
        g.fillStyle = o.css(`--rc-${name}`, '#ddd');
        g.fillRect(x * CELL, y * CELL, CELL, CELL);
        g.strokeStyle = o.css('--rc-mark', '#00000055');
        g.fillStyle = o.css('--rc-mark', '#00000055');
        g.lineWidth = 1.5;
        drawTerrainMark(g, name, x * CELL, y * CELL);
        if (m.deposits.some((d) => d.x === x && d.y === y)) drawDeposit(g, x * CELL, y * CELL);
        g.strokeStyle = grid;
        g.lineWidth = 1;
        g.strokeRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
      }
    }
    const surface = o.css('--wp-surface', '#ffffff');
    for (const u of m.units) {
      const own = u.side === 0;
      drawIcon(g, u.kind, u.x * CELL, u.y * CELL, CELL / 44, { own, colour: o.css(own ? '--wp-p1' : '--wp-p2', own ? '#24508f' : '#9a3412'), surface });
    }
    // Mirror line: the centre of the map, where the halves meet.
    if (o.draft().mirror) {
      g.save();
      g.setLineDash([6, 6]);
      g.strokeStyle = o.css('--wp-muted', '#5c5b55');
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc((m.w * CELL) / 2, (m.h * CELL) / 2, 6, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    g.strokeStyle = o.css('--wp-focus', '#1d4ed8');
    g.lineWidth = 3;
    g.strokeRect(cursor.x * CELL + 2, cursor.y * CELL + 2, CELL - 4, CELL - 4);
  }

  function describeCursor(): string {
    const m = map();
    const terrain = t(`terrain.${TERRAIN_NAMES[m.terrain[cursor.y * m.w + cursor.x] ?? '.'] ?? 'plain'}`);
    const unit = m.units.find((u) => u.x === cursor.x && u.y === cursor.y);
    const parts = [t('editor.cell', { x: cursor.x + 1, y: cursor.y + 1, terrain })];
    if (m.deposits.some((d) => d.x === cursor.x && d.y === cursor.y)) parts.push(t('editor.cellDeposit'));
    if (unit) parts.push(t('editor.cellUnit', { side: t(unit.side === 0 ? 'editor.sideOwn' : 'editor.sideEnemy'), name: t(`unit.${unit.kind}`) }));
    return parts.join(' · ');
  }

  // --- Check, save, share, play ------------------------------------------------------------------
  const issuesEl = h('div', { class: 'rc-ed-issues', 'data-testid': 'ed-issues', role: 'status' });
  const noticeEl = h('p', { class: 'rc-notice', 'data-testid': 'ed-notice', role: 'status', hidden: true });
  const say = (text: string) => {
    noticeEl.textContent = text;
    noticeEl.hidden = false;
    o.announce(text);
  };
  const saveBtn = h('button', { type: 'button', 'data-testid': 'ed-save', onclick: () => onSave() }, t('editor.save'));
  const playBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'ed-play', onclick: () => onPlay() });
  const copyBtn = h('button', { type: 'button', 'data-testid': 'ed-copy', 'aria-expanded': 'false', onclick: () => onCopy() }, t('editor.copy'));
  const deleteBtn = h('button', { type: 'button', 'data-testid': 'ed-delete', onclick: () => onDelete() });
  const closeBtn = h('button', { type: 'button', 'data-testid': 'ed-close', onclick: () => o.close() }, t('editor.close'));
  const codeArea = h('textarea', { 'data-testid': 'ed-code', rows: 3, spellcheck: 'false', autocomplete: 'off' }) as HTMLTextAreaElement;
  const useCodeBtn = h('button', { type: 'button', 'data-testid': 'ed-use-code', onclick: () => onUseCode() }, t('editor.useCode'));
  const codeBox = h('div', { class: 'rc-ed-code', hidden: true }, h('label', {}, h('span', {}, t('editor.codeLabel')), codeArea), useCodeBtn);
  const libraryEl = h('div', { class: 'rc-ed-library', 'data-testid': 'ed-library' });

  function renderIssues(): void {
    clear(issuesEl);
    const issues = mapIssues(map());
    const sideName = (s?: number) => t(s === 1 ? 'editor.forEnemy' : 'editor.forOwn');
    if (issues.length === 0) issuesEl.append(h('p', { 'data-testid': 'ed-ok' }, t('editor.ok')));
    else issuesEl.append(h('p', {}, t('editor.issues')), h('ul', {}, ...issues.map((i) => h('li', {}, t(i.key, { side: sideName(i.side) })))));
    issuesEl.append(h('p', { class: 'rc-muted', 'data-testid': 'ed-fair' }, t(isFair(map()) ? 'editor.fair' : 'editor.unfair')));
    playBtn.toggleAttribute('disabled', issues.length > 0);
  }

  function onSave(): void {
    const draft = o.draft();
    const slot = saveToLibrary(o.store, draft.map, draft.slot);
    if (slot === null) {
      say(t('editor.full', { n: MAP_SLOTS }));
      return;
    }
    o.change({ ...draft, slot }, t('editor.saved', { name: mapName(draft.map) }));
    say(t('editor.saved', { name: mapName(draft.map) }));
  }
  function onPlay(): void {
    if (mapIssues(map()).length > 0) return;
    if (o.playEndsGame() && !confirmed('play')) return;
    o.play(map());
  }
  function onCopy(): void {
    codeOpen = !codeOpen;
    codeArea.value = encodeMap(map());
    render();
    if (!codeOpen) return;
    codeArea.focus();
    codeArea.select();
    try {
      void navigator.clipboard?.writeText(codeArea.value).then(
        () => say(t('editor.copied')),
        () => undefined
      );
    } catch {
      /* the code stays selected in the box */
    }
  }
  function onUseCode(): void {
    const next = decodeMap(codeArea.value.trim());
    if (!next) {
      say(t('editor.badCode'));
      return;
    }
    o.change({ map: next, slot: null, mirror: o.draft().mirror }, t('editor.loaded', { name: mapName(next) }));
    say(t('editor.loaded', { name: mapName(next) }));
  }
  function onDelete(): void {
    const draft = o.draft();
    if (draft.slot === null || !confirmed('delete')) return;
    removeFromLibrary(o.store, draft.slot);
    o.change({ ...draft, slot: null }, t('editor.deleted', { name: mapName(draft.map) }));
    say(t('editor.deleted', { name: mapName(draft.map) }));
  }
  function onLoad(): void {
    if (!confirmed('load')) return;
    const value = startSelect.value;
    const spec = SCENARIOS.find((s) => s.id === value);
    const library = loadLibrary(o.store);
    const slot = value.startsWith('slot:') ? Number(value.slice(5)) : null;
    const saved = slot !== null ? library[slot] : undefined;
    const next = saved ?? (spec ? fromScenario(spec, t(`scenario.${spec.id}`).replace(/\s*[(（].*$/, '').slice(0, MAX_NAME)) : blankMap(map().w, map().h));
    o.change({ map: next, slot: saved ? slot : null, mirror: o.draft().mirror }, t('editor.loaded', { name: mapName(next) }));
    say(t('editor.loaded', { name: mapName(next) }));
  }

  function renderLibrary(): void {
    clear(libraryEl);
    const library = loadLibrary(o.store);
    // The start select lists the device's maps too.
    const keep = startSelect.value;
    for (const opt of [...startSelect.querySelectorAll('option')]) if (opt.value.startsWith('slot:')) opt.remove();
    library.forEach((m, slot) => {
      if (m) startSelect.append(h('option', { value: `slot:${slot}` }, `${t('setup.myMaps')}: ${mapName(m)}`));
    });
    startSelect.value = [...startSelect.options].some((opt) => opt.value === keep) ? keep : 'blank';
    const saved = library.map((m, slot) => ({ m, slot })).filter((e): e is { m: EditMap; slot: number } => e.m !== undefined);
    libraryEl.append(h('h4', {}, t('editor.library')));
    if (saved.length === 0) libraryEl.append(h('p', { class: 'rc-muted' }, t('editor.libraryEmpty')));
    else libraryEl.append(h('ul', {}, ...saved.map(({ m, slot }) => h('li', { 'data-current': o.draft().slot === slot ? 'true' : 'false' }, h('span', {}, `${mapName(m)} (${m.w}×${m.h})`)))));
  }

  const el = h(
    'section',
    { class: 'rc-editor', 'data-testid': 'rc-editor', 'aria-labelledby': 'rc-ed-title' },
    h('h3', { id: 'rc-ed-title' }, t('editor.title')),
    h('p', { class: 'rc-muted' }, t('editor.hint')),
    settings,
    h('div', { class: 'rc-ed-main' }, h('div', { class: 'rc-ed-mapwrap', dir: 'ltr' }, canvas), palette),
    cursorDesc,
    issuesEl,
    noticeEl,
    h('div', { class: 'rc-actions rc-ed-actions' }, playBtn, saveBtn, copyBtn, deleteBtn, closeBtn),
    codeBox,
    libraryEl
  );

  function render(): void {
    const draft = o.draft();
    if (document.activeElement !== nameInput) nameInput.value = draft.map.name;
    widthSelect.value = String(draft.map.w);
    heightSelect.value = String(draft.map.h);
    mirrorBox.checked = draft.mirror;
    cursor = { x: Math.min(cursor.x, draft.map.w - 1), y: Math.min(cursor.y, draft.map.h - 1) };
    loadBtn.textContent = armed === 'load' ? t('editor.loadConfirm') : t('editor.load');
    playBtn.textContent = armed === 'play' ? t('editor.playConfirm') : t('editor.play');
    deleteBtn.hidden = draft.slot === null;
    deleteBtn.textContent = armed === 'delete' ? t('editor.deleteConfirm', { name: mapName(draft.map) }) : t('editor.delete');
    codeBox.hidden = !codeOpen;
    copyBtn.setAttribute('aria-expanded', codeOpen ? 'true' : 'false');
    renderPalette();
    drawMap();
    cursorDesc.textContent = describeCursor();
    renderIssues();
    renderLibrary();
  }

  // Any press elsewhere disarms a two-press button.
  el.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const key = target?.closest('[data-testid="ed-play"]') ? 'play' : target?.closest('[data-testid="ed-delete"]') ? 'delete' : target?.closest('[data-testid="ed-load"]') ? 'load' : null;
    if (armed !== null && key !== armed) {
      armed = null;
      render();
    }
  }, true);

  return { el, render };
}
