/**
 * Weight & Balance view (design §§ 13, 15, 16): the task panel, the scene with its LTR controls (tap a tray part, then
 * a place; step buttons; arrow keys), "Let go", hints, the "Why?" panel, the summary and the free bench. All game logic
 * lives in rules.ts; this file only routes input and draws.
 */
import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { trayLeft } from './check';
import { describe, explainLines, mobileHookLabel, outcomeLine } from './explain';
import { benchOf, isPredict, OVERHANG_BLOCKS, SIDES, STACK_ANSWERS, type Scene } from './generate';
import { mobileHookXs, nearestHook, stackXAt } from './layout';
import {
  addBody,
  choose,
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
  moveBody,
  moveCube,
  newState,
  next,
  placeBeam,
  placeCube,
  readSettings,
  removeTop,
  resetTask,
  setAxle,
  setMobileHook,
  showSolution,
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
import { drawScene, type SceneOptions } from './scene-view';
import { cubeSpots, setString } from './generate';
import { isBar, mobileBars } from './statics';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createBalance(context: GameContext): GameInstance<BalanceState> {
  const { t, root } = context;
  let state: BalanceState = newState(0, readSettings(undefined, undefined));
  let paused = false;
  /** View-only selection: a tray part (index into the remaining tray) or a placed part (index in the scene). */
  let selTray: number | null = null;
  let selPlaced: number | null = null;
  let cursor = 0;
  let notice = '';
  let animate = false;
  let freeKg = 2;
  let focusAfter: string | null = null;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'bl-announcer' });
  const main = h('div', { class: 'bl-main' });
  const container = h('div', { class: 'wp-balance', dir: t.direction, lang: bcp47Tag(t.locale), 'data-testid': 'bl-root' }, main, live);
  root.append(container);

  const num = (x: number) => new Intl.NumberFormat(t.locale).format(x);

  function resetView() {
    selTray = null;
    selPlaced = null;
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

  /* ---------------- Actions ---------------- */

  /** Acts on a place: a beam hook, a mobile hook index or a stack x (cm). */
  function actAt(target: number) {
    const sc = sceneNow();
    if (!sc || !editable()) return;
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
      const spots = cubeSpots(sc.s, 0);
      const x = spots.reduce((best, s) => (Math.abs(s - target) < Math.abs(best - target) ? s : best), spots[0] ?? target);
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
    if (taskId() === 'stack-counter') {
      if (selPlaced !== null) {
        const c = sc.s.cubes[selPlaced];
        return void (c && edit({ bench: 'stack', s: moveCube(sc.s, selPlaced, c.x + dx) ?? sc.s }));
      }
      const spots = cubeSpots(sc.s, 0);
      cursor = Math.max(spots[0] ?? 0, Math.min(spots[spots.length - 1] ?? 0, cursor + dx));
      return render();
    }
    edit({ bench: 'stack', s: moveBody(sc.s, cursor, dx) ?? sc.s });
  }

  function place() {
    if (selTray === null && trayNow().length) selTray = 0;
    const sc = sceneNow();
    if (!sc) return;
    if (sc.bench === 'stack' && taskId() === 'stack-counter' && selPlaced === null) {
      const spots = cubeSpots(sc.s, 0);
      if (!spots.includes(cursor)) cursor = spots[Math.floor(spots.length / 2)] ?? cursor;
    }
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

  function onKey(e: KeyboardEvent) {
    if (paused) return;
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
      render();
    } else return;
    e.preventDefault();
    focusAfter = 'bl-scene-wrap';
    restoreFocus();
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

  const button = (label: string, testid: string, onclick: () => void, extra: Record<string, string | boolean | undefined> = {}) =>
    h('button', { type: 'button', 'data-testid': testid, onclick: () => !paused && onclick(), ...extra }, label);

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
      else if (scene.bench === 'stack') cur = taskId() === 'stack-counter' ? (selPlaced === null ? { kind: 'cube', at: cursor } : null) : { kind: 'body', at: cursor };
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
      desc: describe(t, scene)
    });
    svg.addEventListener('click', (e) => {
      if (paused || !editable()) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0) return;
      const px = ((e.clientX - rect.left) / rect.width) * 320;
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
              render();
            }, { 'aria-pressed': selTray === i ? 'true' : 'false', class: 'bl-chip' })
          )
        );
        if (!tray.length) chips.append(h('span', { class: 'bl-muted' }, t('tray.empty')));
        box.append(h('div', { class: 'bl-tray' }, h('span', { class: 'bl-label-text' }, t('tray.label')), chips));
      }
    }
    // Placed parts (selectable).
    const placed = h('div', { class: 'bl-chips', role: 'group', 'aria-label': t('placed.label') });
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
    if (scene.bench === 'stack' && id === 'stack-counter')
      scene.s.cubes.forEach((c, i) => {
        if (!c.free) return;
        placed.append(
          button(t('placed.cube', { kg: num(c.kg), x: num(c.x) }), `bl-placed-${i}`, () => {
            selPlaced = selPlaced === i ? null : i;
            selTray = null;
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
    if (scene.bench === 'stack' && id === 'stack-counter' && selPlaced === null) where = t('cursor.cube', { x: num(cursor) });
    const stepRow = h('div', { class: 'bl-steps', dir: 'ltr', hidden: id === 'beam-choose' });
    const fine = scene.bench === 'stack';
    if (fine) stepRow.append(button('◀◀', 'bl-step-left4', () => step(-4), { 'aria-label': t('step.left4') }));
    stepRow.append(button('◀', 'bl-step-left', () => step(-1), { 'aria-label': t('step.left') }), button('▶', 'bl-step-right', () => step(1), { 'aria-label': t('step.right') }));
    if (fine) stepRow.append(button('▶▶', 'bl-step-right4', () => step(4), { 'aria-label': t('step.right4') }));
    box.append(h('p', { class: 'bl-where', 'data-testid': 'bl-where' }, where), stepRow);
    const act = h('div', { class: 'bl-actions' });
    const placing = (scene.bench !== 'stack' || id === 'stack-counter') && id !== 'beam-axle' && id !== 'mobile-string';
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
    return t(`task.${it.id}`, { kg: num(kg), cm: num(it.goal?.kind === 'overhang' ? it.goal.cm : 0) });
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
    }
    if (it.status === 'open' && it.outcome === null) {
      const row = h('div', { class: 'bl-actions bl-sticky' });
      row.append(button(t('btn.letGo'), 'bl-letgo', doLetGo, { class: 'bl-primary', disabled: predict && it.choice === null }));
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
      container.remove();
    }
  };
}
