/**
 * Weight & Balance view (design §§ 13, 15, 16): the task panel, the scene with its LTR controls (tap a tray part, then
 * a place; step buttons; arrow keys), "Let go", hints, the "Why?" panel, the summary and the free bench. All game logic
 * lives in rules.ts; this file only routes input and draws.
 */
import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { trayLeft } from './check';
import { describe, explainLines, mobileHookLabel, outcomeLine } from './explain';
import { withContent } from './content';
import { benchOf, isPredict, OVERHANG_BLOCKS, SIDES, STACK_ANSWERS, type Scene } from './generate';
import { mobileHookXs, nearestHook, stackXAt } from './layout';
import {
  addBody,
  asksJoint,
  choose,
  chooseJoint,
  currentItem,
  editDraft,
  freeClear,
  freeEdit,
  freeHold,
  freeLetGo,
  freeUndo,
  hint,
  isSummary,
  letGo,
  markReported,
  mobileHooks,
  moveBeam,
  moveCube,
  needsJoint,
  newState,
  next,
  placeBeam,
  placeCube,
  plankMovable,
  readSettings,
  removeTop,
  resetTask,
  setAxle,
  setMobileHook,
  showSolution,
  stepBody,
  stepSpot,
  skip,
  summarize,
  toggleWhy,
  trayRemaining,
  tryAgain,
  undo,
  unplaceBeam,
  unplaceCube,
  type BalanceState,
  type FreeState,
  type Item,
  type RoundState
} from './rules';
import { drawGhost, drawScene, type Ghost, type SceneOptions } from './scene-view';
import { canDrag, dropScene, movePointer, press, release, snapTarget, sourceOf, dragKg, type DragSource, type DropContext, type Gesture } from './drag';
import { toScene } from './fit';
import { cubeSpots, freeCubeSpots, setString } from './generate';
import { isBar, mobileBars, type StackScene } from './statics';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** The picture x under a pointer x: the scene is framed by a fitted viewBox and letterboxed (xMidYMid meet). */
const sceneX = (svg: SVGElement, rect: DOMRect, clientX: number): number => toScene(svg.getAttribute('viewBox'), rect, clientX, 0).x;

/** The spot nearest to x (x itself when there is none). */
const nearestSpot = (spots: readonly number[], x: number): number => spots.reduce((best, s) => (Math.abs(s - x) < Math.abs(best - x) ? s : best), spots[0] ?? x);

/** Where the cube cursor rests on body 0: the middle of the plank to begin with, then the nearest spot where a new cube fits. */
function cubeCursor(scene: StackScene, cursor: number): number {
  const spots = cubeSpots(scene, 0);
  const free = freeCubeSpots(scene, 0);
  if (free.includes(cursor)) return cursor;
  return nearestSpot(free, spots.includes(cursor) ? cursor : (spots[Math.floor(spots.length / 2)] ?? cursor));
}

export function createBalance(context: GameContext): GameInstance<BalanceState> {
  const { root } = context;
  const t = withContent(context.t);
  let state: BalanceState = newState(0, readSettings(undefined, undefined));
  let paused = false;
  /** View-only selection: a tray part (index into the remaining tray) or a placed part (index in the scene). */
  let selTray: number | null = null;
  let selPlaced: number | null = null;
  /** Hard stack-counter: the plank is selected (the step buttons and arrow keys slide it). */
  let selBody = false;
  let cursor = 0;
  let notice = '';
  let animate = false;
  let freeKg = 2;
  let focusAfter: string | null = null;
  /** The cursor line of the last render, announced after arrow keys (focus stays on the scene). */
  let whereText = '';
  /** Pointer drag (design § 13.1): the gesture, its snap target, the picture point of the press, the captured element. */
  let gesture: Gesture | null = null;
  let dragTarget: number | null = null;
  let dragFrom: { x: number; y: number } | null = null;
  let captured: Element | null = null;
  /** The click that follows a drag (or a cancelled one) is not a tap. */
  let swallowClick = false;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'bl-announcer' });
  const main = h('div', { class: 'bl-main' });
  const container = h('div', { class: 'wp-balance', dir: t.direction, lang: bcp47Tag(t.locale), 'data-testid': 'bl-root' }, main, live);
  root.append(container);

  const num = (x: number) => new Intl.NumberFormat(t.locale).format(x);

  function resetView() {
    selTray = null;
    selPlaced = null;
    selBody = false;
    cursor = 0;
    notice = '';
    animate = false;
  }

  function commit(next: BalanceState | null, opts: { keepNotice?: boolean } = {}): boolean {
    if (!next || paused) return false;
    state = next;
    if (!opts.keepNotice) notice = '';
    context.requestSave();
    render();
    return true;
  }

  /* ---------------- Scene access (round draft or free scene) ---------------- */

  const sceneNow = (): Scene | null => (state.mode === 'free' ? state.scene : (currentItem(state)?.draft ?? null));
  const editable = (): boolean => {
    if (state.mode === 'free') return state.outcome === null;
    const it = currentItem(state);
    return !!it && !isPredict(it.id) && it.status === 'open' && it.outcome === null;
  };
  const trayNow = (): number[] => {
    if (state.mode === 'free') return state.bench === 'stack' ? [] : [freeKg];
    const it = currentItem(state);
    return it ? trayRemaining(it) : [];
  };
  const edit = (scene: Scene | null) => {
    if (!scene || !editable()) return false;
    return state.mode === 'free' ? commit(freeEdit(state, scene)) : commit(editDraft(state, scene));
  };
  const taskId = () => (state.mode === 'round' ? currentItem(state)?.id : undefined);
  /** Hard stack-counter: the plank slides as well as the cubes go on it. */
  const plankFree = (): boolean => state.mode === 'round' && taskId() === 'stack-counter' && plankMovable('stack-counter', state.difficulty);

  /* ---------------- Actions ---------------- */

  /** Acts on a place: a beam hook, a mobile hook index or a stack x (cm). */
  function actAt(target: number) {
    const sc = sceneNow();
    if (!sc || !editable()) return;
    // On the free bench the weight menu always has a weight chosen: a tap on a hook hangs it, from the first tap on
    // (not only after "Place" happened to select it).
    if (state.mode === 'free' && selTray === null && selPlaced === null && trayNow().length) selTray = 0;
    if (sc.bench === 'beam') {
      if (taskId() === 'beam-axle') return void edit({ bench: 'beam', s: setAxle(sc.s, target) ?? sc.s });
      const goal = state.mode === 'round' ? currentItem(state)?.goal : undefined;
      if (goal?.kind === 'choose') {
        // Only the marked hook takes a weight, and only one: a new choice replaces the one hanging there.
        const kg = selTray === null ? undefined : trayNow()[selTray];
        if (kg !== undefined && edit({ bench: 'beam', s: placeBeam({ ...sc.s, weights: sc.s.weights.filter((w) => !w.free) }, kg, goal.hook) ?? sc.s })) selTray = null;
        return render();
      }
      cursor = target;
      if (selPlaced !== null) return void (edit({ bench: 'beam', s: moveBeam(sc.s, selPlaced, target) ?? sc.s }) || render());
      if (selTray !== null) {
        const kg = trayNow()[selTray];
        if (kg !== undefined && edit({ bench: 'beam', s: placeBeam(sc.s, kg, target) ?? sc.s })) {
          selTray = state.mode === 'free' ? selTray : trayNow().length ? 0 : null;
          return;
        }
      }
      return render();
    }
    if (sc.bench === 'mobile') {
      if (taskId() === 'mobile-string') return;
      cursor = target;
      if (selTray !== null) {
        const kg = trayNow()[selTray];
        if (kg !== undefined && edit({ bench: 'mobile', s: setMobileHook(sc.s, target, kg) ?? sc.s })) {
          selTray = state.mode === 'free' ? selTray : trayNow().length ? 0 : null;
          return;
        }
      }
      return render();
    }
    // Stack: cubes on body 0 (the counterweight task); bodies are selected by their chips or ↑/↓.
    if (taskId() === 'stack-counter') {
      // With the plank selected, a tap in the picture places nothing (the plank slides with the steps or a drag).
      if (selBody) return render();
      // The nearest spot where the cube keeps clear of the others (or stacks on one).
      const x = nearestSpot(freeCubeSpots(sc.s, 0, selPlaced ?? -1), target);
      cursor = x;
      if (selPlaced !== null) return void (edit({ bench: 'stack', s: moveCube(sc.s, selPlaced, x) ?? sc.s }) || render());
      if (selTray !== null) {
        const kg = trayNow()[selTray];
        if (kg !== undefined && edit({ bench: 'stack', s: placeCube(sc.s, kg, 0, x) ?? sc.s })) {
          selPlaced = sc.s.cubes.length;
          selTray = null;
          return;
        }
      }
      return render();
    }
  }

  function step(dx: number) {
    const sc = sceneNow();
    if (!sc || !editable()) return;
    if (sc.bench === 'beam') {
      if (taskId() === 'beam-choose') return;
      if (taskId() === 'beam-axle') return void edit({ bench: 'beam', s: setAxle(sc.s, sc.s.axle + Math.sign(dx)) ?? sc.s });
      if (selPlaced !== null) {
        const w = sc.s.weights[selPlaced];
        return void (w && edit({ bench: 'beam', s: moveBeam(sc.s, selPlaced, w.hook + Math.sign(dx)) ?? sc.s }));
      }
      cursor = Math.max(-sc.s.half, Math.min(sc.s.half, cursor + Math.sign(dx)));
      return render();
    }
    if (sc.bench === 'mobile' && taskId() === 'mobile-string') {
      const bar = mobileBars(sc.s)[cursor];
      if (!bar) return;
      // The next free hole in that direction (holes with a hook are skipped).
      for (let at = bar.string + Math.sign(dx); at >= 0 && at <= bar.width; at += Math.sign(dx)) {
        const moved = setString(sc.s, cursor, at);
        if (moved) return void edit({ bench: 'mobile', s: moved });
      }
      return;
    }
    if (sc.bench === 'mobile') {
      const n = mobileHooks(sc.s).length;
      cursor = (cursor + Math.sign(dx) + n) % n;
      return render();
    }
    if (taskId() === 'stack-counter' && selBody) return void edit({ bench: 'stack', s: stepBody(sc.s, 0, dx) ?? sc.s });
    if (taskId() === 'stack-counter') {
      // The farthest spot within the step where a cube keeps clear of the others (a 4 cm step stops at the plank end or
      // next to a neighbour); with none that close, it skips over the neighbour or stacks on it.
      if (selPlaced !== null) {
        const c = sc.s.cubes[selPlaced];
        const x = c && stepSpot(freeCubeSpots(sc.s, 0, selPlaced), c.x, dx);
        return void (x !== undefined && edit({ bench: 'stack', s: moveCube(sc.s, selPlaced, x) ?? sc.s }));
      }
      const x = stepSpot(freeCubeSpots(sc.s, 0), cursor, dx);
      if (x !== undefined) cursor = x;
      return render();
    }
    edit({ bench: 'stack', s: stepBody(sc.s, cursor, dx) ?? sc.s });
  }

  function place() {
    selBody = false;
    if (selTray === null && trayNow().length) selTray = 0;
    const sc = sceneNow();
    if (!sc) return;
    if (sc.bench === 'stack' && taskId() === 'stack-counter' && selPlaced === null) cursor = cubeCursor(sc.s, cursor);
    actAt(cursor);
  }

  function backToTray() {
    const sc = sceneNow();
    if (!sc || !editable()) return;
    if (sc.bench === 'beam' && selPlaced !== null) {
      if (edit({ bench: 'beam', s: unplaceBeam(sc.s, selPlaced) ?? sc.s })) selPlaced = null;
      render();
    } else if (sc.bench === 'mobile') {
      edit({ bench: 'mobile', s: setMobileHook(sc.s, cursor, null) ?? sc.s });
    } else if (sc.bench === 'stack' && selPlaced !== null) {
      if (edit({ bench: 'stack', s: unplaceCube(sc.s, selPlaced) ?? sc.s })) selPlaced = null;
      render();
    }
  }

  function doLetGo() {
    if (state.mode === 'free') {
      const n = freeLetGo(state);
      if (n) {
        animate = !context.reducedMotion;
        commit({ ...n, whyOpen: n.whyOpen });
        announce(live, t('announce.released', { text: outcomeLine(t, n.scene, n.outcome!) }));
      }
      return;
    }
    const it = currentItem(state);
    if (!it) return;
    if (!isPredict(it.id) && trayLeft(it, it.draft) > 0) {
      notice = t('msg.trayLeft');
      render();
      announce(live, notice);
      return;
    }
    const n = letGo(state);
    if (!n) return;
    animate = !context.reducedMotion;
    selTray = null;
    selPlaced = null;
    focusAfter = 'bl-outcome';
    commit(toggleWhy(n, true) ?? n);
    const done = currentItem(state)!;
    announce(live, t('announce.released', { text: outcomeLine(t, done.draft, done.outcome!) }));
  }

  /* ---------------- Dragging (pointer and touch; keyboard and tap paths are separate) ---------------- */

  /** Bodies slide when dragged on the overhang task and on the free stack bench. */
  const bodiesMovable = (): boolean => state.mode === 'free' || taskId() === 'stack-overhang' || plankFree();

  function dropContext(): DropContext | null {
    const sc = sceneNow();
    if (!sc || !editable()) return null;
    const it = state.mode === 'round' ? currentItem(state) : undefined;
    return { scene: sc, id: it?.id, goal: it?.goal ?? null, tray: state.mode === 'round' ? trayNow() : [], bodies: sc.bench === 'stack' && bodiesMovable() };
  }

  const sceneSvg = () => container.querySelector<SVGSVGElement>('[data-testid="bl-scene"]');
  const doc = root.ownerDocument;

  function startDrag(e: PointerEvent, source: DragSource, el: Element) {
    if (paused || gesture || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const ctx = dropContext();
    if (!ctx || !canDrag(ctx, source)) return;
    gesture = press(source, e.pointerId, e.clientX, e.clientY);
    const svg = sceneSvg();
    dragFrom = svg ? toScene(svg.getAttribute('viewBox'), svg.getBoundingClientRect(), e.clientX, e.clientY) : null;
    captured = el;
    try {
      el.setPointerCapture?.(e.pointerId);
    } catch {
      // Capture is a convenience: the moves still reach the document.
    }
    doc.addEventListener('pointermove', onDragMove);
    doc.addEventListener('pointerup', onDragUp);
    doc.addEventListener('pointercancel', onDragCancel);
    doc.addEventListener('keydown', onDragKey, true);
    doc.defaultView?.addEventListener('blur', cancelDrag);
  }

  function endDrag() {
    doc.removeEventListener('pointermove', onDragMove);
    doc.removeEventListener('pointerup', onDragUp);
    doc.removeEventListener('pointercancel', onDragCancel);
    doc.removeEventListener('keydown', onDragKey, true);
    doc.defaultView?.removeEventListener('blur', cancelDrag);
    try {
      if (gesture && captured?.hasPointerCapture?.(gesture.pointerId)) captured.releasePointerCapture(gesture.pointerId);
    } catch {
      // Already released.
    }
    // Undo what the drag drew over the last render (pause() ends a drag without a render): the snap outline, the
    // dimmed source part and the cursor line naming the snap target.
    container.querySelector('[data-testid="bl-drag-ghost"]')?.remove();
    container.classList.remove('bl-is-dragging');
    captured?.classList.remove('bl-drag-source');
    if (gesture?.dragging) {
      const where = container.querySelector('[data-testid="bl-where"]');
      if (where) where.textContent = whereText;
    }
    gesture = null;
    dragTarget = null;
    dragFrom = null;
    captured = null;
  }

  function ghostOf(ctx: DropContext, source: DragSource, target: number): Ghost | null {
    const kg = dragKg(ctx, source) ?? 0;
    const sc = ctx.scene;
    if (sc.bench === 'beam') return { kind: 'beam', hook: target, kg, except: source.kind === 'weight' ? source.index : -1 };
    if (sc.bench === 'mobile') return { kind: 'mobile', hook: target, kg };
    if (source.kind === 'body') return { kind: 'body', index: source.index, left: target };
    return { kind: 'cube', x: target, kg, except: source.kind === 'cube' ? source.index : -1 };
  }

  /** The cursor line for a snap target (the same words as the keyboard cursor). */
  function targetText(ctx: DropContext, source: DragSource, target: number): string {
    const sc = ctx.scene;
    if (sc.bench === 'beam') {
      const d = target - sc.s.axle;
      return t('cursor.beam', { d: num(Math.abs(d)), side: t(d < 0 ? 'dir.left' : d > 0 ? 'dir.right' : 'dir.axle') });
    }
    if (sc.bench === 'mobile') return mobileHookLabel(t, sc.s, target);
    if (source.kind === 'body') return t('cursor.body', { n: num(source.index + 1), from: num(target) });
    return t('cursor.cube', { x: num(target) });
  }

  function showSnap(clientX: number, clientY: number) {
    container.querySelector('[data-testid="bl-drag-ghost"]')?.remove();
    const svg = sceneSvg();
    const ctx = dropContext();
    if (!svg || !ctx || !gesture) return;
    const rect = svg.getBoundingClientRect();
    const inside = rect.width > 0 && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    const p = toScene(svg.getAttribute('viewBox'), rect, clientX, clientY);
    dragTarget = inside ? snapTarget(ctx, gesture.source, p, dragFrom ?? p) : null;
    const where = container.querySelector('[data-testid="bl-where"]');
    if (dragTarget === null) {
      if (where) where.textContent = '';
      return;
    }
    const ghost = ghostOf(ctx, gesture.source, dragTarget);
    if (ghost) svg.append(drawGhost(ctx.scene, ghost, { kgUnit }));
    if (where) where.textContent = targetText(ctx, gesture.source, dragTarget);
  }

  function onDragMove(e: PointerEvent) {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    // No button held any more: the pointerup was missed (released outside the window, or while it lost focus).
    if (e.buttons === 0) return cancelDrag();
    const was = gesture.dragging;
    gesture = movePointer(gesture, e.pointerId, e.clientX, e.clientY);
    if (!gesture.dragging) return;
    e.preventDefault();
    if (!was) {
      container.classList.add('bl-is-dragging');
      captured?.classList.add('bl-drag-source');
    }
    showSnap(e.clientX, e.clientY);
  }

  function onDragUp(e: PointerEvent) {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    const g = gesture;
    if (g.dragging) showSnap(e.clientX, e.clientY);
    const r = release(g, dragTarget);
    const ctx = dropContext();
    endDrag();
    // A tap: the click that follows does what a tap does (tap a part, then a place).
    if (r.kind === 'tap') return;
    swallowClick = true;
    const scene = r.kind === 'drop' && ctx ? dropScene(ctx, g.source, r.target) : null;
    if (!scene) return render();
    selTray = null;
    selPlaced = null;
    // A slid plank (hard stack-counter) stays selected, so the step buttons fine-tune it.
    selBody = g.source.kind === 'body' && plankFree();
    cursor = g.source.kind === 'body' ? (plankFree() ? cursor : g.source.index) : r.kind === 'drop' ? r.target : cursor;
    if (!edit(scene)) return render();
    if (whereText) announce(live, whereText);
  }

  function onDragCancel(e: PointerEvent) {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    cancelDrag();
  }

  /** Ends a press or drag without a drop (pointercancel, a missed pointerup, the window losing focus). */
  function cancelDrag() {
    if (!gesture) return;
    swallowClick = gesture.dragging;
    endDrag();
    render();
  }

  /** Escape cancels a drag (and nothing else happens: the scene's own Escape is not reached). */
  function onDragKey(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !gesture?.dragging) return;
    e.preventDefault();
    e.stopPropagation();
    swallowClick = true;
    endDrag();
    render();
  }

  // A drag's own click is swallowed; a click from the keyboard (detail 0) never is.
  container.addEventListener(
    'click',
    (e) => {
      // While a part is held, nothing else is clicked (a second finger, or Enter on a focused button).
      if (gesture?.dragging || (swallowClick && e.detail !== 0)) {
        e.stopPropagation();
        e.preventDefault();
      }
      swallowClick = false;
    },
    true
  );
  container.addEventListener('pointerdown', () => (swallowClick = false), true);
  // While a part is held, a finger moving over the page drags the part, never scrolls the page.
  container.addEventListener('touchmove', (e) => gesture && e.cancelable && e.preventDefault(), { passive: false });

  function onKey(e: KeyboardEvent) {
    // While a part is held, keys do not edit the scene under it (Escape cancels the drag first).
    if (paused || gesture?.dragging) return;
    const big = e.shiftKey ? 4 : 1;
    const sc = sceneNow();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      step((e.key === 'ArrowLeft' ? -1 : 1) * big);
    } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && sc?.bench === 'stack') {
      const n = sc.s.bodies.length;
      cursor = Math.max(0, Math.min(n - 1, cursor + (e.key === 'ArrowUp' ? 1 : -1)));
      render();
    } else if (e.key === 'Enter' || e.key === ' ') {
      place();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      backToTray();
    } else if (e.key === 'Escape') {
      selTray = null;
      selPlaced = null;
      selBody = false;
      render();
    } else return;
    e.preventDefault();
    focusAfter = 'bl-scene-wrap';
    restoreFocus();
    if (e.key.startsWith('Arrow') && whereText) announce(live, whereText);
  }

  container.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (state.mode === 'free') commit(freeUndo(state));
      else commit(undo(state));
    }
  });

  function restoreFocus() {
    if (!focusAfter) return;
    const el = container.querySelector<HTMLElement>(`[data-testid="${focusAfter}"]`);
    focusAfter = null;
    el?.focus();
  }

  /* ---------------- Rendering ---------------- */

  const button = (label: string, testid: string, onclick: () => void, extra: Record<string, string | boolean | EventListener | undefined> = {}) =>
    h('button', { type: 'button', 'data-testid': testid, onclick: () => !paused && onclick(), ...extra }, label);

  /** The unit around a weight's number in the picture, taken from the tray label (e.g. "3 kg" → "" and "kg"). */
  const kgUnit = (() => {
    const [pre = '', post = ''] = t('tray.weight', { kg: '\u0001' }).split('\u0001');
    return { pre: pre.trim(), post: post.trim() };
  })();

  function sceneBlock(scene: Scene, item: Item | null): HTMLElement {
    const outcome = state.mode === 'free' ? state.outcome : (item?.outcome ?? null);
    const predict = item ? isPredict(item.id) : false;
    const explain =
      outcome !== null ||
      (!!item && !predict && item.status === 'open' && ((state.mode === 'round' && state.difficulty === 'easy') || item.help >= 2));
    let cur: SceneOptions['cursor'] = null;
    if (editable()) {
      if (scene.bench === 'beam' && taskId() !== 'beam-axle') cur = selPlaced === null || taskId() === 'beam-choose' ? { kind: 'hook', at: cursor } : null;
      else if (scene.bench === 'mobile' && taskId() !== 'mobile-string') cur = { kind: 'hook', at: cursor };
      else if (scene.bench === 'stack') cur = taskId() === 'stack-counter' ? (selBody ? { kind: 'body', at: 0 } : selPlaced === null ? { kind: 'cube', at: cursor } : null) : { kind: 'body', at: cursor };
    }
    const title = item ? taskText(item) : t(`free.${state.bench}`);
    const svg = drawScene(scene, {
      outcome,
      explain,
      animate,
      cursor: cur,
      marked: item?.id === 'mobile-string' && editable() ? cursor : (item?.marked ?? null),
      flag: item?.goal?.kind === 'overhang' ? item.goal.cm : null,
      title,
      desc: describe(t, scene),
      kgUnit,
      drag: { parts: editable(), bodies: editable() && scene.bench === 'stack' && bodiesMovable() }
    });
    svg.addEventListener('pointerdown', (e) => {
      const el = (e.target as Element | null)?.closest?.('[data-drag]');
      const source = sourceOf(el?.getAttribute('data-drag') ?? null);
      if (el && source) startDrag(e, source, el);
    });
    svg.addEventListener('click', (e) => {
      if (paused || !editable()) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0) return;
      const px = sceneX(svg, rect, e.clientX);
      if (scene.bench === 'beam') actAt(nearestHook(scene.s.half, px));
      else if (scene.bench === 'mobile') {
        const xs = mobileHookXs(scene.s);
        let best = 0;
        xs.forEach((x, j) => {
          if (Math.abs(x - px) < Math.abs(xs[best]! - px)) best = j;
        });
        actAt(best);
      } else actAt(stackXAt(px));
    });
    const wrap = h('div', { class: 'bl-scene', dir: 'ltr', tabindex: '0', 'data-testid': 'bl-scene-wrap', 'aria-label': t('scene.keys'), onkeydown: onKey as EventListener }, svg);
    return wrap;
  }

  function controls(scene: Scene): HTMLElement {
    const box = h('div', { class: 'bl-controls' });
    if (!editable()) return box;
    const id = taskId();
    const tray = trayNow();
    // Tray.
    if ((scene.bench !== 'stack' || id === 'stack-counter') && id !== 'mobile-string') {
      if (state.mode === 'free') {
        const select = h('select', { 'data-testid': 'bl-free-kg', 'aria-label': t('free.kg'), onchange: (e: Event) => ((freeKg = Number((e.target as HTMLSelectElement).value)), (selTray = 0)) });
        for (let kg = 1; kg <= 9; kg++) select.append(h('option', { value: String(kg), selected: kg === freeKg }, t('tray.weight', { kg: num(kg) })));
        box.append(h('label', { class: 'bl-row' }, t('free.kg'), select));
      } else if (id !== 'beam-axle') {
        const chips = h('div', { class: 'bl-chips', role: 'group', 'aria-label': t('tray.label') });
        tray.forEach((kg, i) =>
          chips.append(
            button(t('tray.weight', { kg: num(kg) }), `bl-tray-${i}`, () => {
              selTray = selTray === i ? null : i;
              selPlaced = null;
              selBody = false;
              render();
            }, { 'aria-pressed': selTray === i ? 'true' : 'false', class: 'bl-chip bl-chip--drag', onpointerdown: ((e: PointerEvent) => startDrag(e, { kind: 'tray', index: i }, e.currentTarget as Element)) as EventListener })
          )
        );
        if (!tray.length) chips.append(h('span', { class: 'bl-muted' }, t('tray.empty')));
        box.append(h('div', { class: 'bl-tray' }, h('span', { class: 'bl-label-text' }, t('tray.label')), chips));
      }
    }
    // Placed parts (selectable).
    const placed = h('div', { class: `bl-chips${scene.bench === 'mobile' ? ' bl-chips--grid' : ''}`, role: 'group', 'aria-label': t('placed.label') });
    if (scene.bench === 'beam' && id !== 'beam-axle')
      scene.s.weights.forEach((w, i) => {
        if (!w.free) return;
        const d = w.hook - scene.s.axle;
        placed.append(
          button(t('placed.beam', { kg: num(w.kg), d: num(Math.abs(d)), side: t(d < 0 ? 'dir.left' : d > 0 ? 'dir.right' : 'dir.axle') }), `bl-placed-${i}`, () => {
            selPlaced = selPlaced === i ? null : i;
            selTray = null;
            render();
          }, { 'aria-pressed': selPlaced === i ? 'true' : 'false', class: 'bl-chip' })
        );
      });
    if (scene.bench === 'stack' && id === 'stack-counter' && plankFree()) {
      const plank = scene.s.bodies[0]!;
      placed.append(
        button(t('body.name', { n: num(1), kind: t(`kind.${plank.kind}`) }), 'bl-body-0', () => {
          selBody = !selBody;
          selTray = null;
          selPlaced = null;
          render();
        }, { 'aria-pressed': selBody ? 'true' : 'false', class: 'bl-chip' })
      );
    }
    if (scene.bench === 'stack' && id === 'stack-counter')
      scene.s.cubes.forEach((c, i) => {
        if (!c.free) return;
        placed.append(
          button(t('placed.cube', { kg: num(c.kg), x: num(c.x) }), `bl-placed-${i}`, () => {
            selPlaced = selPlaced === i ? null : i;
            selTray = null;
            selBody = false;
            render();
          }, { 'aria-pressed': selPlaced === i ? 'true' : 'false', class: 'bl-chip' })
        );
      });
    if (scene.bench === 'stack' && id !== 'stack-counter')
      scene.s.bodies.forEach((b, k) =>
        placed.append(
          button(t('body.name', { n: num(k + 1), kind: t(`kind.${b.kind}`) }), `bl-body-${k}`, () => {
            cursor = k;
            render();
          }, { 'aria-pressed': cursor === k ? 'true' : 'false', class: 'bl-chip' })
        )
      );
    if (scene.bench === 'mobile' && id === 'mobile-string')
      mobileBars(scene.s).forEach((b, k) =>
        placed.append(
          button(t('cursor.string', { bar: num(k + 1), at: num(b.string) }), `bl-bar-${k}`, () => {
            cursor = k;
            render();
          }, { 'aria-pressed': cursor === k ? 'true' : 'false', class: 'bl-chip' })
        )
      );
    if (scene.bench === 'mobile' && id !== 'mobile-string') {
      const hooks = mobileHooks(scene.s);
      hooks.forEach((hk, j) => {
        if (hk.child && (isBar(hk.child) || !hk.child.free)) return;
        const what = hk.child && !isBar(hk.child) ? t('tray.weight', { kg: num(hk.child.kg) }) : t('desc.empty');
        placed.append(
          button(`${mobileHookLabel(t, scene.s, j)}: ${what}`, `bl-hook-${j}`, () => actAt(j), { 'aria-pressed': cursor === j ? 'true' : 'false', class: 'bl-chip' })
        );
      });
    }
    if (placed.childElementCount) box.append(h('div', { class: 'bl-tray' }, h('span', { class: 'bl-label-text' }, t(scene.bench === 'mobile' ? (id === 'mobile-string' ? 'bars.label' : 'hooks.label') : 'placed.label')), placed));
    // Cursor line and steps (inside the LTR scene controls).
    let where = '';
    if (scene.bench === 'beam') where = id === 'beam-axle' ? t('cursor.axle', { d: num(Math.abs(scene.s.axle)), side: t(scene.s.axle < 0 ? 'dir.left' : scene.s.axle > 0 ? 'dir.right' : 'dir.middle') }) : selPlaced === null ? t('cursor.beam', { d: num(Math.abs(cursor - scene.s.axle)), side: t(cursor < scene.s.axle ? 'dir.left' : cursor > scene.s.axle ? 'dir.right' : 'dir.axle') }) : '';
    if (scene.bench === 'mobile') {
      const bar = mobileBars(scene.s)[cursor];
      where = id === 'mobile-string' ? (bar ? t('cursor.string', { bar: num(cursor + 1), at: num(bar.string) }) : '') : mobileHookLabel(t, scene.s, cursor);
    }
    if (scene.bench === 'stack' && id !== 'stack-counter') {
      const b = scene.s.bodies[cursor];
      if (b) where = t('cursor.body', { n: num(cursor + 1), from: num(b.left) });
    }
    if (scene.bench === 'stack' && id === 'stack-counter' && selPlaced === null) where = selBody ? t('cursor.body', { n: num(1), from: num(scene.s.bodies[0]!.left) }) : t('cursor.cube', { x: num(cursor) });
    const stepRow = h('div', { class: 'bl-steps', dir: 'ltr', hidden: id === 'beam-choose' });
    const fine = scene.bench === 'stack';
    if (fine) stepRow.append(button('◀◀', 'bl-step-left4', () => step(-4), { 'aria-label': t('step.left4') }));
    stepRow.append(button('◀', 'bl-step-left', () => step(-1), { 'aria-label': t('step.left') }), button('▶', 'bl-step-right', () => step(1), { 'aria-label': t('step.right') }));
    if (fine) stepRow.append(button('▶▶', 'bl-step-right4', () => step(4), { 'aria-label': t('step.right4') }));
    whereText = where;
    box.append(h('p', { class: 'bl-where', 'data-testid': 'bl-where' }, where), stepRow);
    const act = h('div', { class: 'bl-actions' });
    const placing = (scene.bench !== 'stack' || id === 'stack-counter') && id !== 'beam-axle' && id !== 'mobile-string' && !selBody;
    if (placing) act.append(button(t('btn.place'), 'bl-place', place), button(t('btn.back'), 'bl-back', backToTray));
    if (state.mode === 'free' && scene.bench === 'stack')
      act.append(
        button(t('free.addBlock'), 'bl-add-block', () => edit({ bench: 'stack', s: addBody(scene.s, 'block') ?? scene.s }) && ((cursor = state.mode === 'free' && state.scene.bench === 'stack' ? state.scene.s.bodies.length - 1 : 0), render())),
        button(t('free.addPlank'), 'bl-add-plank', () => edit({ bench: 'stack', s: addBody(scene.s, 'plank') ?? scene.s }) && ((cursor = state.mode === 'free' && state.scene.bench === 'stack' ? state.scene.s.bodies.length - 1 : 0), render())),
        button(t('free.removeTop'), 'bl-remove-top', () => edit({ bench: 'stack', s: removeTop(scene.s) ?? scene.s }) && ((cursor = 0), render()))
      );
    box.append(act);
    return box;
  }

  function taskText(it: Item): string {
    const kg = it.tray[0] ?? 0;
    const hard = state.mode === 'round' && plankMovable(it.id, state.difficulty);
    return t(hard ? 'task.stack-counter-hard' : `task.${it.id}`, { kg: num(kg), cm: num(it.goal?.kind === 'overhang' ? it.goal.cm : 0) });
  }

  function whyPanel(lines: string[], bench: string, open: boolean): HTMLElement {
    const details = h(
      'details',
      { class: 'bl-why', 'data-testid': 'bl-why', open },
      h('summary', {}, t('why')),
      h('ul', {}, ...lines.map((l) => h('li', {}, l))),
      h('details', { class: 'bl-formula' }, h('summary', {}, t('formula')), h('p', {}, t(bench === 'stack' ? 'formula.stack' : 'formula.lever')))
    );
    details.addEventListener('toggle', () => {
      if (paused) return;
      const o = (details as HTMLDetailsElement).open;
      const n = toggleWhy(state, o);
      if (n) {
        state = n;
        context.requestSave();
      }
    });
    return details;
  }

  function renderTask(s: RoundState, it: Item) {
    const predict = isPredict(it.id);
    if (it.goal?.kind === 'choose') cursor = it.goal.hook;
    if (it.id === 'stack-counter' && it.draft.bench === 'stack' && selPlaced === null) {
      // The cube cursor always rests on a place where a cube fits (the middle of the plank to begin with).
      cursor = cubeCursor(it.draft.s, cursor);
    }
    const head = h(
      'div',
      { class: 'bl-head' },
      h('p', { class: 'bl-progress', 'data-testid': 'bl-progress' }, t('progress', { n: num(s.index + 1), total: num(s.items.length), bench: t(`bench.${benchOf(it.id)}`) })),
      h('h2', { 'data-testid': 'bl-task', tabindex: '-1' }, taskText(it))
    );
    const sceneCol = h('div', { class: 'bl-scene-col' }, sceneBlock(it.draft, it), h('div', { dir: 'ltr', class: 'bl-ltr' }, controls(it.draft)));
    const panel = h('div', { class: 'bl-panel' });
    if (predict) {
      const fs = h('fieldset', { class: 'bl-options', 'data-testid': 'bl-options' }, h('legend', {}, t(it.id === 'stack-predict' ? 'options.stack' : it.id === 'mobile-predict' ? 'options.mobile' : 'options.beam')));
      const names = it.id === 'stack-predict' ? STACK_ANSWERS.map((a) => `opt.${a}`) : SIDES.map((a) => `opt.${a}`);
      names.forEach((key, i) => {
        const input = h('input', { type: 'radio', name: 'bl-opt', value: String(i), 'data-testid': `bl-opt-${i}`, checked: it.choice === i, disabled: it.status !== 'open' });
        input.addEventListener('change', () => commit(choose(s, i)));
        fs.append(h('label', { class: 'bl-option' }, input, h('span', {}, t(key))));
      });
      panel.append(fs);
      // Hard stacks: when a fall is chosen, which joint gives way? (Every joint is offered, so nothing is given away.)
      if (asksJoint(it.id, s.difficulty) && it.choice !== null && it.choice !== 0 && it.scene.bench === 'stack') {
        const js = h('fieldset', { class: 'bl-options', 'data-testid': 'bl-joints' }, h('legend', {}, t('joint.legend')));
        it.scene.s.bodies.forEach((_, k) => {
          const input = h('input', { type: 'radio', name: 'bl-joint', value: String(k), 'data-testid': `bl-joint-${k}`, checked: it.jointChoice === k, disabled: it.status !== 'open' });
          input.addEventListener('change', () => commit(chooseJoint(s, k)));
          const label = k === 0 ? t('joint.table', { k: num(1), n: num(1) }) : t('joint.on', { k: num(k + 1), n: num(k + 1), m: num(k) });
          js.append(h('label', { class: 'bl-option' }, input, h('span', {}, label)));
        });
        panel.append(js);
      }
    }
    if (it.status === 'open' && it.outcome === null) {
      const row = h('div', { class: 'bl-actions bl-sticky' });
      row.append(button(t('btn.letGo'), 'bl-letgo', doLetGo, { class: 'bl-primary', disabled: predict && (it.choice === null || needsJoint(it, s.difficulty)) }));
      if (predict) row.append(button(t('btn.skip'), 'bl-skip', () => ((animate = !context.reducedMotion), commit(toggleWhy(skip(s) ?? s, true) ?? skip(s)))));
      else row.append(button(t('btn.undo'), 'bl-undo', () => commit(undo(s)), { disabled: it.history.length === 0 }), button(t('btn.reset'), 'bl-reset', () => commit(resetTask(s))));
      panel.append(row);
      if (notice) panel.append(h('p', { class: 'bl-notice', 'data-testid': 'bl-notice' }, notice));
      const hints = h('div', { class: 'bl-actions bl-hints' });
      hints.append(button(t('hint.tip'), 'bl-hint-1', () => commit(hint(s, 1)), { disabled: it.help >= 1 }));
      if (!predict && s.difficulty !== 'easy') hints.append(button(t(it.draft.bench === 'stack' ? 'hint.showStack' : 'hint.showLever'), 'bl-hint-2', () => commit(hint(s, 2)), { disabled: it.help >= 2 }));
      if (!predict) hints.append(button(t('hint.solution'), 'bl-solution', () => ((animate = !context.reducedMotion), commit(toggleWhy(showSolution(s) ?? s, true) ?? showSolution(s)))));
      panel.append(hints);
      if (it.help >= 1) panel.append(h('p', { class: 'bl-tip', 'data-testid': 'bl-tip' }, t(`tip.${benchOf(it.id)}`)));
    }
    if (it.outcome) {
      const overhang = it.goal?.kind === 'overhang' ? { best: it.goal.best, n: OVERHANG_BLOCKS[s.difficulty] } : undefined;
      const mark = it.status === 'open' ? t('mark.notYet') : t(`mark.${it.status}`);
      panel.append(
        h(
          'div',
          { class: 'bl-outcome', 'data-testid': 'bl-outcome', tabindex: '-1', 'data-status': it.status, 'data-matched': String(it.status === 'matched') },
          h('p', { class: 'bl-mark' }, mark),
          (it.jointChoice ?? null) !== null && it.status !== 'skipped' ? h('p', { 'data-testid': 'bl-joint-yours' }, t('joint.yours', { k: num((it.jointChoice ?? 0) + 1) })) : null,
          h('p', {}, outcomeLine(t, it.draft, it.outcome))
        ),
        whyPanel(explainLines(t, it.draft, it.outcome, overhang), it.draft.bench, s.whyOpen)
      );
      const row = h('div', { class: 'bl-actions bl-sticky' });
      if (it.status === 'open') row.append(button(t('btn.tryAgain'), 'bl-try-again', () => commit(tryAgain(s)), { class: 'bl-primary' }));
      else {
        const last = s.index === s.items.length - 1;
        row.append(button(t(last ? 'btn.summary' : 'btn.next'), 'bl-next', () => {
          resetView();
          focusAfter = 'bl-task';
          commit(next(s));
        }, { class: 'bl-primary' }));
      }
      panel.append(row);
    }
    main.append(head, h('div', { class: 'bl-layout' }, sceneCol, panel));
  }

  function renderSummary(s: RoundState) {
    const sum = summarize(s);
    const box = h('div', { class: 'bl-summary', 'data-testid': 'bl-summary' }, h('h2', { tabindex: '-1', 'data-testid': 'bl-task' }, t('summary.title')));
    if (sum.predicted) box.append(h('p', { 'data-testid': 'bl-summary-predicted' }, t('summary.predicted', { matched: num(sum.matched), total: num(sum.predicted), skipped: num(sum.skipped) })));
    if (sum.built) box.append(h('p', { 'data-testid': 'bl-summary-built' }, t('summary.built', { solved: num(sum.solved), total: num(sum.built), help: num(sum.withHelp) })));
    if (sum.overhang) box.append(h('p', {}, t('summary.overhang', { cm: num(sum.overhang.cm), best: num(sum.overhang.best) })));
    for (const b of sum.benches) box.append(h('p', { class: 'bl-muted' }, t(`close.${b}`)));
    main.append(box);
    if (!s.reported) {
      const n = markReported(s);
      if (n) {
        state = n;
        context.requestSave();
        context.finished({ outcome: 'completed', stats: { predicted: sum.predicted, matched: sum.matched, built: sum.built, solved: sum.solved } });
      }
    }
  }

  function renderFree(s: FreeState) {
    main.append(
      h('div', { class: 'bl-head' }, h('p', { class: 'bl-progress', 'data-testid': 'bl-progress' }, t('mode.free')), h('h2', { 'data-testid': 'bl-task', tabindex: '-1' }, t(`free.${s.bench}`)))
    );
    const sceneCol = h('div', { class: 'bl-scene-col' }, sceneBlock(s.scene, null), h('div', { dir: 'ltr', class: 'bl-ltr' }, controls(s.scene)));
    const panel = h('div', { class: 'bl-panel' });
    const row = h('div', { class: 'bl-actions bl-sticky' });
    if (s.outcome === null) row.append(button(t('btn.letGo'), 'bl-letgo', doLetGo, { class: 'bl-primary' }));
    else row.append(button(t('free.hold'), 'bl-hold', () => ((animate = false), commit(freeHold(s))), { class: 'bl-primary' }));
    row.append(button(t('btn.undo'), 'bl-undo', () => commit(freeUndo(s)), { disabled: s.history.length === 0 }), button(t('free.clear'), 'bl-clear', () => ((cursor = 0), commit(freeClear(s)))));
    panel.append(row);
    if (s.outcome) panel.append(h('div', { class: 'bl-outcome', 'data-testid': 'bl-outcome' }, h('p', {}, outcomeLine(t, s.scene, s.outcome))), whyPanel(explainLines(t, s.scene, s.outcome), s.bench, s.whyOpen));
    main.append(h('div', { class: 'bl-layout' }, sceneCol, panel));
  }

  function render() {
    clear(main);
    whereText = '';
    if (state.mode === 'free') renderFree(state);
    else if (isSummary(state)) renderSummary(state);
    else renderTask(state, currentItem(state)!);
    animate = false;
    restoreFocus();
  }

  return {
    newGame(options: NewGameOptions) {
      resetView();
      state = newState(options.seed >>> 0, readSettings(options.settings, options.difficulty));
      context.requestSave();
      render();
    },
    restore(saved: BalanceState) {
      resetView();
      state = clone(saved);
      render();
    },
    serialize: () => clone(state),
    pause() {
      if (gesture) {
        swallowClick = gesture.dragging;
        endDrag();
      }
      paused = true;
      animate = false;
      container.classList.add('bl-paused');
    },
    resume() {
      paused = false;
      container.classList.remove('bl-paused');
    },
    reset() {
      resetView();
      state = newState(state.seed, state.mode === 'free' ? readSettings({ mode: 'free', freeBench: state.bench }, undefined) : readSettings({ bench: state.bench, tasks: state.tasks }, state.difficulty));
      context.requestSave();
      render();
    },
    dispose() {
      endDrag();
      container.remove();
    }
  };
}
