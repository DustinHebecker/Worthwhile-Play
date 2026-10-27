/**
 * Tones & Chords view: the game instance contract, the sound bar (Web Audio only after a gesture and never while
 * muted; design § 9.5), the display preferences box (per device, never state; § 12), keyboard shortcuts, and routing
 * to the quiz, summary and free-keyboard screens.
 */
import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { audioConstructor, createEngine, type Engine, type EngineState } from './audio/engine';
import { previewEvents, type NoteEvent } from './audio/schedule';
import { createEnv, readPrefs, writePref, type Env, type Prefs } from './env';
import { NAME_PREFS, noteLabel, resolveSystem, type NamePref } from './notes';
import {
  currentItem,
  isCommitted,
  isQuiz,
  isSummary,
  markReported,
  newRound,
  peek,
  readSettings,
  restart,
  setDraft,
  summarize,
  type HarmonyState
} from './rules';
import { optionCount, type ChoiceSpec } from './spec';
import type { Host } from './view-host';
import { freeScreen } from './view-free';
import { quizScreen, summaryScreen } from './view-quiz';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createHarmony(context: GameContext): GameInstance<HarmonyState> {
  const { t, root } = context;
  let prefs: Prefs = readPrefs(context.preferences);
  let env: Env = createEnv(t, prefs.names);
  let state: HarmonyState = newRound(0, readSettings(undefined, undefined));
  let paused = false;
  let focusNext: string | number | null = null;
  let keysStart: number | null = null;
  let keyFocus: number | undefined;
  let soundState: EngineState = 'idle';
  let activeButton: HTMLButtonElement | null = null;
  const win = typeof window === 'undefined' ? undefined : window;
  const ctor = audioConstructor(win);

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'hm-announcer' });
  const main = h('div', { class: 'hm-main' });
  const container = h('div', { class: 'wp-harmony', dir: t.direction, lang: bcp47Tag(t.locale), 'data-testid': 'hm-root' }, main, live);

  /* ---------- Sound ---------- */

  let engine: Engine | null = null;
  const getEngine = (): Engine =>
    (engine ??= createEngine({
      ctor,
      volume: prefs.volume,
      muted: prefs.muted,
      onState: (s) => {
        const before = soundState;
        soundState = s;
        if (s !== 'playing') setActive(null);
        if (s === 'unavailable' || (s === 'blocked') !== (before === 'blocked')) render();
      }
    }));

  const soundAvailable = () => ctor !== undefined && soundState !== 'unavailable';

  function setActive(button: HTMLButtonElement | null) {
    if (activeButton && activeButton !== button) {
      activeButton.classList.remove('hm-playing');
      const label = activeButton.dataset.label;
      if (label) activeButton.querySelector('.hm-btn-text')!.textContent = label;
    }
    activeButton = button;
    if (button) {
      button.classList.add('hm-playing');
      button.querySelector('.hm-btn-text')!.textContent = t('sound.stop');
    }
  }

  const play = (events: readonly NoteEvent[]): boolean => {
    if (prefs.muted || !soundAvailable() || paused) return false;
    return getEngine().play(events);
  };

  const playButton = (label: string, testid: string, events: () => readonly NoteEvent[], primary = false): HTMLElement => {
    const button = h('button', { type: 'button', class: primary ? 'hm-play hm-play--main' : 'hm-play', 'data-testid': testid, 'data-label': label }, h('span', { class: 'hm-btn-text' }, label));
    button.addEventListener('click', () => {
      if (activeButton === button && engine?.isPlaying()) {
        engine.stopAll();
        return;
      }
      // Construct and resume inside this gesture (iOS); muted: nothing is created.
      if (play(events())) setActive(button);
    });
    return button;
  };

  function soundBar(buttons: readonly HTMLElement[]): HTMLElement {
    const bar = h('div', { class: 'hm-soundbar', role: 'group', 'aria-label': t('sound.bar'), 'data-testid': 'hm-soundbar' });
    const row = h('div', { class: 'hm-sound-row' });
    if (soundAvailable() && !prefs.muted) row.append(...buttons);
    if (soundAvailable()) {
      const volume = h('input', { type: 'range', min: '0', max: '100', step: '5', value: String(prefs.volume), 'data-testid': 'hm-volume', 'aria-describedby': 'hm-volume-hint' });
      volume.addEventListener('input', () => {
        prefs = { ...prefs, volume: Number(volume.value) };
        engine?.setVolume(prefs.volume);
      });
      volume.addEventListener('change', () => {
        writePref(context.preferences, 'volume', prefs.volume);
        // A soft preview tone at the new level (the release is a gesture).
        play(previewEvents());
      });
      const mute = h('button', { type: 'button', class: 'hm-mute', 'aria-pressed': prefs.muted ? 'false' : 'true', 'data-testid': 'hm-mute' }, t(prefs.muted ? 'sound.off' : 'sound.on'));
      mute.addEventListener('click', () => {
        prefs = { ...prefs, muted: !prefs.muted };
        writePref(context.preferences, 'muted', prefs.muted);
        engine?.setMuted(prefs.muted);
        focusNext = 'hm-mute';
        render();
      });
      row.append(h('label', { class: 'hm-volume' }, h('span', {}, t('sound.volume')), volume), mute);
    }
    bar.append(row);
    if (!soundAvailable()) bar.append(h('p', { class: 'hm-sound-status', 'data-testid': 'hm-sound-status' }, t('sound.unavailable')));
    else if (soundState === 'blocked') bar.append(h('p', { class: 'hm-sound-status', 'data-testid': 'hm-sound-status' }, t('sound.tapAgain')));
    bar.append(h('p', { class: 'hm-help-line', id: 'hm-volume-hint' }, `${t('sound.volumeHint')} ${t('sound.help')}`));
    return bar;
  }

  /* ---------- Preferences box ---------- */

  function prefsBox(): HTMLElement {
    const box = h('details', { class: 'hm-prefs', 'data-testid': 'hm-prefs' }, h('summary', {}, t('prefs.heading')));
    const example = (p: NamePref) => {
      const system = resolveSystem(p, t.locale);
      return [{ l: 0, a: 0 }, { l: 1, a: 0 }, { l: 6, a: -1 }, { l: 6, a: 0 }].map((s) => noteLabel(s as { l: number; a: 0 | -1 }, system, t.locale)).join(' ');
    };
    const names = h('select', { 'data-testid': 'hm-pref-names' }, ...NAME_PREFS.map((p) => h('option', { value: p, ...(p === prefs.names ? { selected: true } : {}) }, t(`prefs.${p}`, { example: example(p) }))));
    names.addEventListener('change', () => {
      prefs = { ...prefs, names: names.value as NamePref };
      writePref(context.preferences, 'names', prefs.names);
      env = createEnv(t, prefs.names);
      focusNext = 'hm-pref-names';
      render();
    });
    const check = (key: 'autoplay' | 'countIn', label: string) => {
      const input = h('input', { type: 'checkbox', 'data-testid': `hm-pref-${key}`, ...(prefs[key] ? { checked: true } : {}) });
      input.addEventListener('change', () => {
        prefs = { ...prefs, [key]: input.checked };
        writePref(context.preferences, key, input.checked);
      });
      return h('label', { class: 'hm-check' }, input, ' ', label);
    };
    const keys = h('select', { 'data-testid': 'hm-pref-keys' }, h('option', { value: 'piano', ...(prefs.keys === 'piano' ? { selected: true } : {}) }, t('prefs.piano')), h('option', { value: 'buttons', ...(prefs.keys === 'buttons' ? { selected: true } : {}) }, t('prefs.buttons')));
    keys.addEventListener('change', () => {
      prefs = { ...prefs, keys: keys.value === 'buttons' ? 'buttons' : 'piano' };
      writePref(context.preferences, 'keys', prefs.keys);
      focusNext = 'hm-pref-keys';
      render();
    });
    box.open = openPrefs;
    box.addEventListener('toggle', () => (openPrefs = box.open));
    box.append(
      h('label', { class: 'hm-field' }, t('prefs.names'), ' ', names),
      check('autoplay', t('prefs.autoplay')),
      check('countIn', t('prefs.countIn')),
      h('label', { class: 'hm-field' }, t('prefs.keys'), ' ', keys)
    );
    return box;
  }
  let openPrefs = false;

  const helpBox = () => h('details', { class: 'hm-help' }, h('summary', {}, t('help.heading')), h('p', {}, t('help.text')));

  /* ---------- Host for the screens ---------- */

  const narrow = () => {
    try {
      return win?.matchMedia?.('(max-width: 44rem)').matches === true;
    } catch {
      return false;
    }
  };

  const host: Host = {
    get env() {
      return env;
    },
    prefs: () => prefs,
    state: () => state,
    paused: () => paused,
    commit(next, focus = null, message) {
      if (next === state) return;
      state = next;
      context.requestSave();
      focusNext = focus;
      render();
      if (message) announce(live, message);
    },
    announce: (m) => announce(live, m),
    play: (events) => void play(events),
    soundAvailable,
    soundBar,
    playButton,
    narrow,
    keysStart: (fallback) => keysStart ?? fallback,
    setKeysStart(start, focus) {
      keysStart = start;
      focusNext = focus ?? null;
      render();
    },
    focusKey: () => keyFocus,
    rerender: () => render()
  };

  /* ---------- Render ---------- */

  function render() {
    if (isQuiz(state) && !isSummary(state)) {
      const item = currentItem(state)!;
      // By ear without Web Audio, the question is shown as a picture (design § 5.1).
      if (state.senses === 'ear' && !isCommitted(item) && item.peeked === false && item.spec.k !== 'build' && !soundAvailable()) {
        state = peek(state, 'no-sound');
        context.requestSave();
      }
    }
    keyFocus = typeof focusNext === 'number' ? focusNext : undefined;
    clear(main);
    setActive(null);
    if (!isQuiz(state)) {
      container.dataset.phase = 'keyboard';
      main.append(...freeScreen(host, state));
    } else if (isSummary(state)) {
      container.dataset.phase = 'summary';
      main.append(...summaryScreen(host, state));
      if (!state.reported) {
        state = markReported(state);
        context.requestSave();
        const sum = summarize(state);
        context.finished({ outcome: 'completed', stats: { matched: sum.matched, asked: sum.asked } });
      }
    } else {
      container.dataset.phase = 'question';
      main.append(...quizScreen(host, state));
    }
    main.append(h('div', { class: 'hm-boxes' }, prefsBox(), helpBox()));
    if (typeof focusNext === 'string') main.querySelector<HTMLElement>(`#${focusNext}, [data-testid="${focusNext}"]`)?.focus();
    else if (typeof focusNext === 'number') main.querySelector<HTMLElement>(`.hm-key[data-midi="${focusNext}"]`)?.focus();
    focusNext = null;
    keyFocus = undefined;
  }

  /* ---------- Shortcuts (only while focus is inside the game; never inside the piano) ---------- */

  container.addEventListener('keydown', (e) => {
    if (paused || e.ctrlKey || e.metaKey || e.altKey || !isQuiz(state) || isSummary(state)) return;
    const target = e.target as HTMLElement;
    if (target.closest('.hm-piano') || target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && target.type === 'range')) return;
    const item = currentItem(state)!;
    if (/^[1-9]$/.test(e.key) && item.spec.k !== 'build' && !isCommitted(item)) {
      const i = Number(e.key) - 1;
      if (i < optionCount(item.spec as ChoiceSpec)) {
        e.preventDefault();
        host.commit(setDraft(state, { choice: i }), `hm-opt-${i}`);
      }
    } else if (e.key === 'Enter' && target instanceof HTMLInputElement && target.type === 'radio') {
      e.preventDefault();
      main.querySelector<HTMLButtonElement>('[data-testid="hm-check"]:not([disabled])')?.click();
    } else if (e.key === 'p' || e.key === 'P') {
      const btn = main.querySelector<HTMLButtonElement>('[data-testid="hm-play"]');
      if (btn) {
        e.preventDefault();
        btn.click();
      }
    } else if (e.key === 'n' || e.key === 'N') {
      const btn = main.querySelector<HTMLButtonElement>('[data-testid="hm-next"], [data-testid="hm-summary-btn"]');
      if (btn) {
        e.preventDefault();
        btn.click();
      }
    }
  });

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') engine?.suspendForHidden();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const show = (next: HarmonyState) => {
    state = next;
    focusNext = null;
    keysStart = null;
    if (!container.isConnected) root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      // Settings are untrusted (design § 6): unknown values fall back to the defaults.
      show(newRound(options.seed, readSettings(options.settings, options.difficulty)));
    },
    restore(saved: HarmonyState) {
      show(clone(saved));
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
      engine?.stopAll();
    },
    resume() {
      // The sound is not restarted (design § 9.5).
      paused = false;
    },
    reset() {
      show(restart(state));
      context.requestSave();
    },
    dispose() {
      document.removeEventListener('visibilitychange', onVisibility);
      engine?.dispose();
      clear(root);
    }
  };
}
