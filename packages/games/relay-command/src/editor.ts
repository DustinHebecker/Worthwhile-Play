import type { Translator } from '@wp/game-core';
import { clear, h } from '@wp/ui';
import { CELL, createTerrainLayer, drawDeposit, drawTerrainSwatch, TERRAIN_NAMES } from './draw';
import { drawIcon, type View } from '@wp/strategy-art';
import {
  applyTool,
  blankMap,
  decodeMap,
  DEPOSIT_SIZES,
  depositSize,
  encodeMap,
  fromScenario,
  isFair,
  isValidMap,
  MAP_HEIGHTS,
  MAP_KINDS,
  MAP_SLOTS,
  MAP_WIDTHS,
  mapIssues,
  MAX_NAME,
  resize,
  TERRAIN_CODES,
  type EditMap,
  type MapLibrary,
  seatsOf,
  SUPPLY_CHOICES,
  supplyOf,
  withBases,
  withSupply,
  withTeams,
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
  /** The player's map view (side or top), as in the game. */
  readonly view?: () => View;
  /** The device's maps (the host's library, else preferences); asynchronous. */
  readonly library: MapLibrary;
  /** The library changed (the game's setup lists the maps too). */
  readonly libraryChanged?: (maps: readonly (EditMap | undefined)[]) => void;
  readonly draft: () => MapDraft;
  /** Stores a changed draft in the game state (and asks for a save); `message` is announced. */
  readonly change: (draft: MapDraft, message?: string) => void;
  readonly close: () => void;
  readonly play: (map: EditMap) => void;
  /** Playing would end a game in progress: the Play button then asks twice. */
  readonly playEndsGame: () => boolean;
  readonly announce: (text: string) => void;
}

/** Maps larger than this (cells; 24×16) are large: the editor offers to show them at 100 % or 50 % in a frame. */
const LARGE_EDIT_CELLS = 24 * 16;

/** Milliseconds after arming a two-press button in which a second press does not count. */
const CONFIRM_GAP = 400;

export function createEditor(o: EditorOptions): { readonly el: HTMLElement; render(): void; forget(): void; refresh(): void; maps(): readonly (EditMap | undefined)[] } {
  const view = (): View => o.view?.() ?? 'profile';
  const terrainLayer = createTerrainLayer('coarse');
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
  /**
   * Large maps (more than 24×16 cells, owner request 2026-10-27): fitted into the width a cell of a
   * 48×32 map is a few pixels on a phone, so the map can be shown at 100 % or 50 % in a frame that
   * scrolls; "Move the map" then lets a swipe scroll instead of paint. This session only.
   */
  let size: 'fit' | 1 | 0.5 = 'fit';
  let moving = false;
  const isLarge = () => map().w * map().h > LARGE_EDIT_CELLS;
  /**
   * The whole draft before the last change (map, library slot, mirror mode): one step of undo,
   * covering resizing and loading too. Cleared whenever the editor opens or closes, a game starts
   * or the state is replaced, so it never reaches into another session's map.
   */
  let previous: MapDraft | null = null;

  const map = () => o.draft().map;
  /** Mirrored editing is on (a three-base map is never mirrored). */
  const mirrored = () => o.draft().mirror && map().seats !== 3;
  const mapName = (m: EditMap) => m.name.trim() || t('editor.untitled');
  const set = (next: EditMap, message?: string) => {
    if (next === map() && message === undefined) return;
    // A drag paints many cells: it is one change for undo (the map before it began).
    if (!painting || lastStroke !== strokeId) previous = o.draft();
    lastStroke = strokeId;
    o.change({ ...o.draft(), map: next }, message);
  };
  let strokeId = 0;
  let lastStroke = -1;
  /** Replaces the whole map (load, map code): undoable like any edit. */
  const replace = (draft: MapDraft, message: string) => {
    previous = o.draft();
    o.change(draft, message);
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
  /**
   * Bases (owner decision 2026-10-24): two sides, or four bases in the corners (seats A–D, A is you);
   * since 2026-10-29 also three (seats A–C, as Lake Country), which are never mirrored.
   */
  const basesSelect = h('select', { 'data-testid': 'ed-bases', onchange: () => onBases() }) as HTMLSelectElement;
  for (const n of [2, 3, 4]) basesSelect.append(h('option', { value: String(n) }, t(`editor.bases${n}`)));
  const mirrorLabel = h('label', { class: 'rc-ed-check' }, mirrorBox, h('span', {}, t('editor.mirror')));
  /**
   * Asymmetric maps (owner decision 2026-10-26): each base's Supply at the start and, with four
   * bases, a map made for teams (base A alone against three, as Bastion).
   */
  const supplyBox = h('fieldset', { class: 'rc-ed-supply', 'data-testid': 'ed-supply' });
  const teamsBox = h('input', { type: 'checkbox', 'data-testid': 'ed-teams', onchange: () => set(withTeams(map(), teamsBox.checked)) }) as HTMLInputElement;
  const teamsLabel = h('label', { class: 'rc-ed-check' }, teamsBox, h('span', {}, t('editor.teams')));
  const startSelect = h('select', { 'data-testid': 'ed-start' }) as HTMLSelectElement;
  startSelect.append(h('option', { value: 'blank' }, t('editor.blank')));
  // Built-in maps the editor can hold (all of them since three bases came, 2026-10-29).
  for (const spec of SCENARIOS) if (isValidMap(fromScenario(spec))) startSelect.append(h('option', { value: spec.id }, t(`scenario.${spec.id}`)));
  const loadBtn = h('button', { type: 'button', 'data-testid': 'ed-load', onclick: () => onLoad() });
  const settings = h(
    'div',
    { class: 'rc-ed-settings' },
    h('label', {}, h('span', {}, t('editor.name')), nameInput),
    h('label', {}, h('span', {}, t('editor.width')), widthSelect),
    h('label', {}, h('span', {}, t('editor.height')), heightSelect),
    h('label', {}, h('span', {}, t('editor.bases')), basesSelect),
    mirrorLabel,
    teamsLabel,
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
    if (g) drawTerrainSwatch(g, code, view(), o.css);
    return el;
  };
  const same = (a: Tool, b: Tool) => JSON.stringify(a) === JSON.stringify(b);
  const toolButton = (next: Tool, label: string, pic: HTMLElement, id: string) =>
    h('button', { type: 'button', class: 'rc-ed-tool', 'data-testid': `ed-tool-${id}`, 'aria-pressed': same(tool, next) ? 'true' : 'false', onclick: () => pick(next, label) }, pic, h('span', {}, label));
  /** Whose a piece is, in words: on a map with three or four bases its base (A is you), else you or the opponent. */
  const seatLabel = (s: number): string => (map().seats ? t(s === 0 ? 'editor.seatOwn' : 'editor.seat', { mark: 'ABCD'[s] ?? '?' }) : t(s === 0 ? 'editor.sideOwn' : 'editor.sideEnemy'));
  const sideButton = (s: number) =>
    h('button', { type: 'button', class: 'rc-ed-side', 'data-testid': `ed-side-${s}`, 'aria-pressed': side === s ? 'true' : 'false', onclick: () => pickSide(s) }, seatLabel(s));

  function renderPalette(): void {
    clear(palette);
    const terrain = h('div', { class: 'rc-ed-group', role: 'group', 'aria-label': t('editor.terrain') });
    for (const code of TERRAIN_CODES) terrain.append(toolButton({ type: 'terrain', code }, t(`terrain.${TERRAIN_NAMES[code] ?? 'plain'}`), swatch(code), `t${TERRAIN_CODES.indexOf(code)}`));
    const objects = h('div', { class: 'rc-ed-group', role: 'group', 'aria-label': t('editor.objects') });
    // One tool per deposit size (on a deposit, the tool sets its size).
    for (const size of DEPOSIT_SIZES) {
      const icon = h('canvas', { class: 'rc-icon', width: CELL, height: CELL, 'aria-hidden': 'true' }) as HTMLCanvasElement;
      try {
        const g = icon.getContext('2d');
        if (g) {
          g.strokeStyle = o.css('--wp-text', '#1d1d1b');
          g.fillStyle = o.css('--wp-text', '#1d1d1b');
          drawDeposit(g, -CELL / 2 + 9, CELL / 2 - 9, size);
        }
      } catch {
        /* no canvas: the label says it */
      }
      objects.append(toolButton(size === 'plain' ? { type: 'deposit' } : { type: 'deposit', size }, t(size === 'plain' ? 'editor.deposit' : size === 'rich' ? 'editor.depositRich' : 'editor.depositEndless'), icon, size === 'plain' ? 'deposit' : `deposit-${size}`));
    }
    objects.append(toolButton({ type: 'erase' }, t('editor.erase'), h('span', { class: 'rc-ed-erase', 'aria-hidden': 'true' }, '⌫'), 'erase'));
    const units = h('div', { class: 'rc-ed-group', role: 'group', 'aria-label': t('editor.units') });
    for (const kind of MAP_KINDS) units.append(toolButton({ type: 'unit', kind, side }, t(`unit.${kind}`), o.icon(kind, side === 0), kind));
    palette.append(
      h('h4', {}, t('editor.terrain')),
      terrain,
      h('h4', {}, t('editor.objects')),
      objects,
      h('h4', {}, t('editor.units')),
      h('div', { class: 'rc-ed-group', role: 'group', 'aria-label': t('editor.side') }, h('span', { class: 'rc-muted' }, t('editor.side')), ...Array.from({ length: seatsOf(map()) }, (_, s) => sideButton(s))),
      units
    );
  }

  function pick(next: Tool, label: string): void {
    tool = next;
    render();
    o.announce(t('editor.toolChosen', { tool: label }));
  }
  function onBases(): void {
    const bases = basesSelect.value === '4' ? 4 : basesSelect.value === '3' ? 3 : 2;
    if (bases === seatsOf(map())) return;
    if (side >= bases) pickSide(0);
    set(withBases(map(), bases));
  }
  /** One Supply choice per base (the selects are rebuilt when the number of bases changes). */
  function renderSupply(): void {
    const supply = supplyOf(map());
    const selects = supplyBox.querySelectorAll('select');
    if (selects.length !== supply.length) {
      clear(supplyBox);
      supplyBox.append(h('legend', {}, t('editor.supply')));
      supply.forEach((_, seat) => {
        const select = h('select', { 'data-testid': `ed-supply-${seat}`, onchange: () => set(withSupply(map(), seat, Number(select.value))) }) as HTMLSelectElement;
        for (const v of SUPPLY_CHOICES) select.append(h('option', { value: String(v) }, String(v)));
        supplyBox.append(h('label', {}, h('span', { 'data-seat': String(seat) }), select));
      });
    }
    supplyBox.querySelectorAll('select').forEach((select, seat) => {
      select.value = String(supply[seat]);
    });
    supplyBox.querySelectorAll('span[data-seat]').forEach((span) => {
      span.textContent = seatLabel(Number(span.getAttribute('data-seat')));
    });
  }
  function pickSide(s: number): void {
    side = s;
    if (tool.type === 'unit') tool = { ...tool, side };
    render();
  }

  // --- Map canvas ------------------------------------------------------------------------------
  const canvas = h('canvas', { class: 'rc-ed-map', 'data-testid': 'ed-map', tabindex: 0, role: 'application', 'aria-roledescription': t('editor.title'), 'aria-describedby': 'rc-ed-cursor' }) as HTMLCanvasElement;
  const cursorDesc = h('p', { id: 'rc-ed-cursor', class: 'rc-muted', 'data-testid': 'ed-cursor', 'aria-live': 'polite' });
  const mapWrap = h('div', { class: 'rc-ed-mapwrap', dir: 'ltr' }, canvas);
  const sizeButtons = new Map<'fit' | 1 | 0.5, HTMLElement>(
    (['fit', 1, 0.5] as const).map((v) => [
      v,
      h('button', { type: 'button', 'data-testid': `ed-size-${v === 'fit' ? 'fit' : Math.round(v * 100)}`, 'aria-pressed': 'false', onclick: () => setSize(v) }, v === 'fit' ? t('editor.fit') : t('zoom.percent', { n: Math.round(v * 100) }))
    ])
  );
  const moveBtn = h('button', { type: 'button', 'data-testid': 'ed-move', 'aria-pressed': 'false', hidden: true, onclick: () => setMoving(!moving) }, t('editor.move'));
  const sizeGroup = h('div', { class: 'rc-actions rc-view', role: 'group', 'aria-label': t('zoom.label'), 'data-testid': 'ed-size', hidden: true }, h('span', { class: 'rc-label' }, t('zoom.label')), ...sizeButtons.values(), moveBtn);
  function setSize(v: 'fit' | 1 | 0.5): void {
    size = v;
    if (v === 'fit') moving = false;
    render();
  }
  function setMoving(on: boolean): void {
    moving = on;
    render();
  }
  const cellAt = (event: MouseEvent): { x: number; y: number } | undefined => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return undefined;
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * map().w);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * map().h);
    return x >= 0 && y >= 0 && x < map().w && y < map().h ? { x, y } : undefined;
  };
  const applyAt = (x: number, y: number) => {
    cursor = { x, y };
    set(applyTool(map(), tool, x, y, mirrored()));
    render();
  };
  canvas.addEventListener('pointerdown', (event) => {
    if (moving) return; // the swipe scrolls the frame
    const cell = cellAt(event);
    if (!cell) return;
    painting = true;
    strokeId += 1;
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
    if (moving || ((event as PointerEvent).pointerId !== undefined && event.detail !== 0)) return;
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
    // Large maps: fitted (as all maps), or at 100 % / 50 % in a frame that scrolls.
    const large = isLarge();
    if (!large) moving = false;
    const framed = large && size !== 'fit';
    mapWrap.classList.toggle('rc-large', framed);
    canvas.style.inlineSize = framed ? `${m.w * CELL * (size as number)}px` : '';
    canvas.style.touchAction = moving ? 'pan-x pan-y' : '';
    sizeGroup.hidden = !large;
    for (const [v, b] of sizeButtons) b.setAttribute('aria-pressed', String(v === size));
    moveBtn.hidden = !framed;
    moveBtn.setAttribute('aria-pressed', String(moving));
    canvas.setAttribute('data-cols', String(m.w));
    let g: CanvasRenderingContext2D | null = null;
    try {
      g = canvas.getContext('2d');
    } catch {
      g = null;
    }
    if (!g) return;
    // Coarser than in the game: the editor redraws the terrain after every stroke.
    terrainLayer.draw(g, m, view(), o.css, 1);
    const surface = o.css('--wp-surface', '#ffffff');
    g.strokeStyle = o.css('--rc-mark', '#00000055');
    g.fillStyle = o.css('--rc-mark', '#00000055');
    for (const d of m.deposits) drawDeposit(g, d.x * CELL, d.y * CELL, depositSize(d), surface);
    g.strokeStyle = o.css('--rc-grid', '#00000022');
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 1; x < m.w; x++) {
      g.moveTo(x * CELL + 0.5, 0);
      g.lineTo(x * CELL + 0.5, m.h * CELL);
    }
    for (let y = 1; y < m.h; y++) {
      g.moveTo(0, y * CELL + 0.5);
      g.lineTo(m.w * CELL, y * CELL + 0.5);
    }
    g.stroke();
    for (const u of m.units) {
      const own = u.side === 0;
      drawIcon(g, u.kind, u.x * CELL, u.y * CELL, CELL / 44, { own, colour: o.css(own ? '--wp-p1' : '--wp-p2', own ? '#24508f' : '#9a3412'), surface, view: view() });
    }
    // Mirror line: the centre of the map, where the halves meet.
    if (mirrored()) {
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
    const deposit = m.deposits.find((d) => d.x === cursor.x && d.y === cursor.y);
    if (deposit) parts.push(t(deposit.size === 'rich' ? 'editor.cellDepositRich' : deposit.size === 'endless' ? 'editor.cellDepositEndless' : 'editor.cellDeposit'));
    if (unit) parts.push(t('editor.cellUnit', { side: seatLabel(unit.side), name: t(`unit.${unit.kind}`) }));
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
  const undoBtn = h('button', { type: 'button', 'data-testid': 'ed-undo', onclick: () => onUndo() }, t('editor.undo'));
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
    const sideName = (s?: number) => (map().seats && s !== undefined ? t('editor.forSeat', { mark: 'ABCD'[s] ?? '?' }) : t(s === 1 ? 'editor.forEnemy' : 'editor.forOwn'));
    if (issues.length === 0) issuesEl.append(h('p', { 'data-testid': 'ed-ok' }, t('editor.ok')));
    else issuesEl.append(h('p', {}, t('editor.issues')), h('ul', {}, ...issues.map((i) => h('li', {}, t(i.key, { side: sideName(i.side) })))));
    issuesEl.append(h('p', { class: 'rc-muted', 'data-testid': 'ed-fair' }, t(map().teams ? 'editor.teamsMap' : map().seats === 3 ? 'editor.threeBases' : isFair(map()) ? (map().seats === 4 ? 'editor.fairFour' : 'editor.fair') : 'editor.unfair')));
    playBtn.toggleAttribute('disabled', issues.length > 0);
  }

  function onUndo(): void {
    if (!previous) return;
    const back = previous;
    previous = null;
    o.change(back, t('editor.undone'));
    say(t('editor.undone'));
  }
  function onSave(): void {
    if (saving) return;
    const draft = o.draft();
    saving = true;
    render();
    void o.library.save(draft.map, draft.slot).then((result) => {
      saving = false;
      if (!result.ok) {
        // The reason in words; the map code always works as a way out.
        say(result.reason === 'full' ? t('editor.full', { n: MAP_SLOTS }) : t(`editor.fail.${result.reason}`));
        render();
        return;
      }
      // The draft may have become another map meanwhile (undo, a code, a load): it takes over the
      // place only while it is still the map that was saved.
      const now = o.draft();
      if (encodeMap(now.map) === encodeMap(draft.map)) o.change({ ...now, slot: result.slot }, t('editor.saved', { name: mapName(draft.map) }));
      say(t('editor.saved', { name: mapName(draft.map) }));
      refresh();
    });
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
    replace({ map: next, slot: null, mirror: o.draft().mirror }, t('editor.loaded', { name: mapName(next) }));
    say(t('editor.loaded', { name: mapName(next) }));
  }
  function onDelete(): void {
    const draft = o.draft();
    if (draft.slot === null || !confirmed('delete')) return;
    const slot = draft.slot;
    void o.library.remove(slot).then((removed) => {
      if (!removed) {
        say(t('editor.deleteFailed', { name: mapName(draft.map) }));
        refresh();
        return;
      }
      if (o.draft().slot === slot) o.change({ ...o.draft(), slot: null }, t('editor.deleted', { name: mapName(draft.map) }));
      say(t('editor.deleted', { name: mapName(draft.map) }));
      refresh();
    });
  }
  function onLoad(): void {
    if (!confirmed('load')) return;
    const value = startSelect.value;
    const spec = SCENARIOS.find((s) => s.id === value);
    const slot = value.startsWith('slot:') ? Number(value.slice(5)) : null;
    const saved = slot !== null ? maps[slot] : undefined;
    const next = saved ?? (spec ? fromScenario(spec, t(`scenario.${spec.id}`).replace(/\s*[(（].*$/, '').slice(0, MAX_NAME)) : blankMap(map().w, map().h));
    replace({ map: next, slot: saved ? slot : null, mirror: o.draft().mirror }, t('editor.loaded', { name: mapName(next) }));
    say(t('editor.loaded', { name: mapName(next) }));
  }

  /** The device's maps as last read (the library is asynchronous; `refresh` reads it again). */
  let maps: readonly (EditMap | undefined)[] = [];
  let saving = false;
  function refresh(): void {
    void o.library.list().then((list) => {
      maps = list;
      o.libraryChanged?.(list);
      render();
    });
  }
  refresh();

  function renderLibrary(): void {
    clear(libraryEl);
    const library = maps;
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
    supplyBox,
    sizeGroup,
    h('div', { class: 'rc-ed-main' }, mapWrap, palette),
    cursorDesc,
    issuesEl,
    noticeEl,
    h('div', { class: 'rc-actions rc-ed-actions' }, playBtn, undoBtn, saveBtn, copyBtn, deleteBtn, closeBtn),
    codeBox,
    libraryEl
  );

  function render(): void {
    const draft = o.draft();
    if (document.activeElement !== nameInput) nameInput.value = draft.map.name;
    widthSelect.value = String(draft.map.w);
    heightSelect.value = String(draft.map.h);
    basesSelect.value = String(seatsOf(draft.map));
    if (side >= seatsOf(draft.map)) side = 0;
    mirrorBox.checked = draft.mirror;
    // Three bases are never mirrored: the choice is hidden (and kept for the next map).
    mirrorLabel.hidden = draft.map.seats === 3;
    teamsLabel.hidden = draft.map.seats !== 4;
    teamsBox.checked = draft.map.teams === true;
    renderSupply();
    cursor = { x: Math.min(cursor.x, draft.map.w - 1), y: Math.min(cursor.y, draft.map.h - 1) };
    loadBtn.textContent = armed === 'load' ? t('editor.loadConfirm') : t('editor.load');
    playBtn.textContent = armed === 'play' ? t('editor.playConfirm') : t('editor.play');
    deleteBtn.hidden = draft.slot === null;
    undoBtn.disabled = previous === null;
    saveBtn.disabled = saving;
    deleteBtn.textContent = armed === 'delete' ? t('editor.deleteConfirm', { name: mapName(draft.map) }) : t('editor.delete');
    codeBox.hidden = !codeOpen;
    copyBtn.setAttribute('aria-expanded', codeOpen ? 'true' : 'false');
    renderPalette();
    drawMap();
    cursorDesc.textContent = describeCursor();
    renderIssues();
    renderLibrary();
  }

  // Ctrl/Cmd+Z undoes the last change (not while typing a name or a code).
  el.addEventListener('keydown', (event) => {
    const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
    if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      onUndo();
    }
  });

  // Any press elsewhere disarms a two-press button.
  el.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const key = target?.closest('[data-testid="ed-play"]') ? 'play' : target?.closest('[data-testid="ed-delete"]') ? 'delete' : target?.closest('[data-testid="ed-load"]') ? 'load' : null;
    if (armed !== null && key !== armed) {
      armed = null;
      render();
    }
  }, true);

  /** Forgets the undo step and any armed button (the editor opened, closed, or its draft was replaced). */
  function forget(): void {
    previous = null;
    armed = null;
    painting = false;
  }

  return { el, render, forget, refresh, maps: () => maps };
}
