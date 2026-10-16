import { coerceSetting, hostSettings, randomSeed, resolveSettings, settingId, type GameInstance, type GameModule, type GameResult, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import type { GameContentLanguages, GamePreferences, UserDeckSource } from '@wp/game-core';
import { readContentLanguages } from '@wp/localization';
import { createAutosave, createGameLibrary, createSave, interpretSave, type GameSave, type SaveStore } from '@wp/persistence';
import { clear, h } from '@wp/ui';
import type { AppContext, Page } from '../app';
import { SESSION_NOTE_MINUTES } from '../config';
import { findGame } from '../registry';
import type { Route } from '../router';
import { hostLearning, loadLearningRecords, type HostLearning } from '../lib/learning';
import { createPreferences } from '../lib/preferences';
import { safeStorage, sessionNoteEnabled } from './settings';
import { renderSetupForm, settingsSummary } from './setup-form';
import { gameBadges, gameTranslator } from './shared';

type GameRoute = Extract<Route, { name: 'game' }>;

/** Host-owned preference key (in the game's preference namespace) for the last start-screen settings (ADR 0017). */
export const REMEMBERED_SETTINGS = '@settings';

/** What a game was started with, besides the seed. */
interface Setup {
  difficulty: string | undefined;
  settings: Readonly<Record<string, SettingValue>>;
}

/** Learning languages from Settings, passed to games (undefined entries are left out). */
function contentLanguages(): GameContentLanguages {
  const storage = safeStorage();
  const { learning, translation } = storage ? readContentLanguages(storage) : { learning: undefined, translation: undefined };
  return { ...(learning ? { learning } : {}), ...(translation ? { translation } : {}) };
}

/**
 * Game host: loads a game module lazily, draws the start screen ("Continue" when there is a save; the game's
 * settings and "Start", ADR 0017), wires the GameContext (translator, autosave, finished screen) and guarantees
 * that leaving the page or hiding the tab persists the current logical state.
 */
export function renderGamePage(main: HTMLElement, app: AppContext, route: GameRoute): () => Promise<void> {
  const { t } = app;
  const entry = findGame(route.id);
  if (!entry) {
    main.append(h('section', { class: 'prose' }, h('h1', {}, t('game.notFound')), h('p', {}, h('a', { href: '/' }, t('game.back')))));
    return async () => undefined;
  }
  const { metadata } = entry;
  // Until the game's chunk is loaded, only its catalogue messages are available (title, tagline, rules,
  // difficulty labels); the game itself always gets a translator over its complete messages.
  let gt = gameTranslator(metadata, app.locale);

  const status = h('div', { class: 'host-status' });
  const panel = h('div', { class: 'host-panel' });
  const gameRoot = h('div', { class: 'game-root', 'data-testid': 'game-root', hidden: true });
  const finishedSlot = h('div', { class: 'finished-slot' });
  main.append(
    h('nav', { class: 'breadcrumb' }, h('a', { href: '/' }, `${t.direction === 'rtl' ? '→' : '←'} ${t('game.back')}`)),
    h('header', { class: 'game-header' },
      h('h1', {}, gt('title')),
      h('p', { class: 'lead' }, gt('tagline')),
      gameBadges(metadata, t),
      h('details', { class: 'rules' }, h('summary', {}, t('game.howToPlay')), h('p', {}, gt('rules')))
    ),
    status,
    panel,
    gameRoot,
    finishedSlot
  );

  let module: GameModule<unknown> | undefined;
  let userDecks: UserDeckSource | undefined;
  let learning: HostLearning | undefined;
  let store: (SaveStore & { persistent: boolean }) | undefined;
  let instance: GameInstance<unknown> | undefined;
  let autosave: ReturnType<typeof createAutosave> | undefined;
  /**
   * The running game's seed and setup. `known` is false for a save that does not tell its settings (written before
   * the envelope kept them, by a game without `settingsOf`): then no summary and no "Another round".
   */
  let current: ({ seed: number; known: boolean } & Setup) | undefined;
  /** The start screen is shown over a running (paused) game after "New game" / "Change settings". */
  let onStartScreen = false;
  const preferences: GamePreferences = createPreferences(safeStorage(), metadata.id);
  let disposed = false;
  // The game's own creations (ADR 0012), scoped to its id; asynchronous, so it needs no loading before `create`.
  const library = createGameLibrary(app.library, metadata.id);
  let playMs = 0;
  let lastTick = Date.now();
  let noteShown = false;

  let launched = false;
  // `?deck=<id>` applies to the first game started on this page only.
  const launch = () => (route.deck && !launched ? { launch: { deck: route.deck } } : {});
  const settingsEnv = (): SettingsEnv => ({
    t: gt,
    preferences,
    contentLanguages: contentLanguages(),
    ...(userDecks ? { userDecks } : {}),
    ...(learning ? { learning } : {}),
    ...launch()
  });
  /** The settings drawn on the start screen (re-read each time: device lists such as decks can change). */
  const specs = (): readonly SettingSpec[] => (module ? hostSettings(module, settingsEnv()) : []);
  /** Last start-screen choices on this device: untrusted, so always passed through `resolveSettings`. */
  const remembered = (): Record<string, unknown> => {
    const value = preferences.get(REMEMBERED_SETTINGS);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  };
  /** A setup as untrusted choices (difficulty under `difficulty`). */
  const choices = (setup: Partial<Setup> | undefined): Record<string, unknown> => ({ ...setup?.settings, ...(setup?.difficulty !== undefined ? { difficulty: setup.difficulty } : {}) });
  /**
   * Merged into what is remembered, so settings that are hidden now (e.g. the strength while two people play) keep
   * their last value for the next time they are shown.
   */
  const remember = (setup: Partial<Setup>) => preferences.set(REMEMBERED_SETTINGS, { ...remembered(), ...choices(setup) });
  /** Resolves untrusted choices against the start-screen settings. */
  const resolve = (chosen: Record<string, unknown>): Setup => {
    const { difficulty, settings } = resolveSettings(specs(), metadata, chosen);
    return { difficulty, settings };
  };
  const validDifficulty = (value: unknown): string | undefined => (typeof value === 'string' && metadata.difficulties?.includes(value) ? value : undefined);
  /**
   * What a save tells about the settings it was started with (difficulty under `difficulty`), and whether that
   * covers every setting the start screen would show for it. The game's `settingsOf(state)` is the source of truth
   * for the difficulty (e.g. renamed by a state migration) and stands in for the settings of saves written before
   * the envelope kept them. Without it, the envelope's difficulty counts when it is one of the game's difficulties.
   */
  const fromSave = (save: GameSave<unknown>): { chosen: Record<string, unknown>; known: boolean } => {
    let derived: Record<string, unknown> = {};
    try {
      const value: unknown = module?.settingsOf?.(save.state);
      if (value && typeof value === 'object' && !Array.isArray(value)) derived = { ...(value as Record<string, unknown>) };
    } catch (error) {
      console.error('settingsOf failed', error);
    }
    const { difficulty: derivedDifficulty, ...derivedSettings } = derived;
    // A game that implements settingsOf tells the difficulty itself (none: the state has no valid one).
    const difficulty = module?.settingsOf ? validDifficulty(derivedDifficulty) : validDifficulty(save.difficulty);
    const chosen: Record<string, unknown> = { ...(save.settings ?? derivedSettings), ...(difficulty !== undefined ? { difficulty } : {}) };
    const list = specs();
    const { visible } = resolveSettings(list, metadata, chosen);
    const known = list.every((spec) => {
      const id = settingId(spec);
      return !visible.has(id) || (Object.prototype.hasOwnProperty.call(chosen, id) && coerceSetting(spec, metadata, chosen[id]) !== undefined);
    });
    return { chosen, known };
  };

  const persist = async () => {
    if (!instance || !module || !store || !current) return;
    // Settings a save did not tell are not written as if they were known.
    await store.write(createSave(module, current.seed, instance.serialize(), { difficulty: current.difficulty, ...(current.known ? { settings: current.settings } : {}) }) as GameSave);
  };

  let interactedAfterFinish = false;
  const markInteraction = () => {
    if (finishedSlot.childElementCount > 0) interactedAfterFinish = true;
  };
  gameRoot.addEventListener('pointerdown', markInteraction);
  gameRoot.addEventListener('keydown', markInteraction);
  const clearFinished = () => {
    clear(finishedSlot);
    interactedAfterFinish = false;
  };

  const showFinished = (result: GameResult) => {
    clear(finishedSlot);
    interactedAfterFinish = false;
    // A game may phrase its own outcome (`result.<outcome>`), e.g. "Player X wins"; otherwise use the shared wording.
    const own = `result.${result.outcome}`;
    const outcome = (module?.metadata ?? metadata).messages.en?.[own] ? own : { won: 'common.won', lost: 'common.lost', draw: 'common.draw', completed: 'common.solved' }[result.outcome];
    // "Another round" repeats the current settings with one deliberate press; "Change settings" opens the start screen.
    // Without known settings (an older save) only "Change settings": repeating guessed settings would mislead.
    const another = current?.known ? h('button', { type: 'button', class: 'primary', 'data-testid': 'another-round' }, t('game.anotherRound')) : null;
    another?.addEventListener('click', () => void startNew({ ...resolve(choices(current)), begin: true }));
    const change = h('button', { type: 'button', class: another ? '' : 'primary', 'data-testid': 'change-settings' }, t('game.changeSettings'));
    change.addEventListener('click', () => void openStart());
    finishedSlot.append(
      h('section', { class: 'finished wp-card', role: 'status', 'data-testid': 'finished' },
        h('h2', {}, t('game.finished')),
        h('p', {}, gt(outcome)),
        // Deliberately no automatic next game: the user decides whether to continue.
        h('div', { class: 'wp-row' }, another, change, h('a', { class: 'wp-button', href: '/' }, t('game.back')))
      )
    );
    void autosave?.flush(true);
  };

  const mount = () => {
    instance?.dispose();
    autosave?.dispose();
    clear(finishedSlot);
    gameRoot.hidden = false;
    autosave = createAutosave({ save: persist, onError: (e) => console.error('autosave failed', e) });
    instance = module!.create({
      root: gameRoot,
      t: gt,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      requestSave: () => {
        // Continued play inside the game (e.g. choosing another level) after a natural end
        // hides the calm "finished" panel again; the save itself is unaffected.
        if (interactedAfterFinish) clearFinished();
        autosave?.request();
      },
      finished: showFinished,
      // The game changed its own difficulty (e.g. a strength chosen in an in-game menu): keep the host's
      // select, the next "New game" and the save envelope in line with it.
      setDifficulty: (difficulty: string) => {
        if (!current || !metadata.difficulties?.includes(difficulty) || current.difficulty === difficulty) return;
        current = { ...current, difficulty };
        remember({ difficulty });
        if (!onStartScreen) toolbar();
        autosave?.request();
      },
      preferences,
      contentLanguages: contentLanguages(),
      ...(userDecks ? { userDecks } : {}),
      ...(learning ? { learning } : {}),
      library,
      ...launch()
    });
    launched = true;
    return instance;
  };

  const toolbar = () => {
    clear(panel);
    // During play only "New game": it opens the start screen; the running game stays saved and "Continue" returns.
    const button = h('button', { type: 'button', 'data-testid': 'new-game' }, t('game.newGame'));
    button.addEventListener('click', () => void openStart());
    const summary = current?.known ? settingsSummary(specs(), current, gt, t) : '';
    panel.append(h('div', { class: 'wp-row toolbar' }, button,
      summary ? h('span', { class: 'settings-summary', 'data-testid': 'settings-summary' }, summary) : null,
      current ? h('span', { class: 'wp-muted seed', 'data-testid': 'seed' }, t('game.seed', { seed: current.seed })) : null));
  };

  /** Focus the game's main area (data-autofocus) or its first control. */
  const focusGame = () =>
    (gameRoot.querySelector<HTMLElement>('[data-autofocus]') ?? gameRoot.querySelector<HTMLElement>('button, [tabindex="0"], input, select'))?.focus();

  /** Leaves the start screen: the game (and a finished panel, if any) is visible again. */
  const showGame = () => {
    if (onStartScreen) {
      onStartScreen = false;
      lastTick = Date.now();
      instance?.resume();
    }
    gameRoot.hidden = false;
    finishedSlot.hidden = false;
  };

  const startNew = async ({ seed = randomSeed(), difficulty, settings = {}, begin = false, focus = true }: Partial<Setup> & { seed?: number; begin?: boolean; focus?: boolean }) => {
    current = { seed, difficulty, settings, known: true };
    // Reuse a running instance so game-internal options (e.g. opponent type) carry over to the next round.
    const game = instance ?? mount();
    showGame();
    clear(finishedSlot);
    game.newGame({
      seed,
      ...(difficulty !== undefined ? { difficulty } : {}),
      ...(Object.keys(settings).length ? { settings } : {}),
      ...(begin ? { begin } : {})
    });
    toolbar();
    await autosave?.flush(true);
    // A game can mark its main play area with data-autofocus (e.g. so arrow keys move pieces instead of
    // changing an options select that happens to come first); otherwise focus the first control.
    if (focus) focusGame();
  };

  const resume = (save: GameSave<unknown>) => {
    // The save's own settings (re-checked), so "Another round" repeats them. When the save cannot tell them all,
    // the remembered ones fill the gaps for the start screen only (no summary, no "Another round").
    const { chosen, known } = fromSave(save);
    const resolved = resolve(known ? chosen : { ...remembered(), ...chosen });
    current = { seed: save.seed, difficulty: known ? resolved.difficulty : validDifficulty(chosen.difficulty), settings: resolved.settings, known };
    const game = mount();
    game.restore(save.state);
    toolbar();
    focusGame();
  };

  /**
   * The start screen (ADR 0017): "Continue" first when there is a game to return to, then "New game" with every
   * setting that changes the game and "Start". `continueWith` is a stored save, or `running` for the game on this
   * page (after "New game" / "Change settings": it is paused, saved and only hidden).
   */
  const showStart = (continueWith: GameSave<unknown> | 'running' | undefined, initial: Record<string, unknown>) => {
    clear(panel);
    const items: HTMLElement[] = [];
    if (continueWith) {
      const cont = h('button', { type: 'button', class: 'primary', 'data-testid': 'continue' }, t('game.continue'));
      cont.addEventListener('click', () => {
        if (continueWith !== 'running') return resume(continueWith);
        showGame();
        toolbar();
        focusGame();
      });
      const date = continueWith === 'running' ? null : new Intl.DateTimeFormat(app.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(continueWith.updatedAt));
      items.push(h('div', { class: 'wp-row start-continue' }, cont, date ? h('span', { class: 'wp-muted' }, t('game.savedAt', { date })) : null));
    }
    const list = specs();
    const setup = renderSetupForm(list, metadata, initial, gt, t);
    const startButton = h('button', { type: 'submit', class: continueWith ? '' : 'primary', 'data-testid': 'start-game' }, t('game.start'));
    const headingId = `start-heading-${metadata.id}`;
    const form = h('form', { class: 'start-form wp-stack', 'aria-labelledby': headingId, 'data-testid': 'start-form', novalidate: true },
      h('h2', { id: headingId }, t('game.newGame')),
      list.length ? setup.fields : null,
      h('div', { class: 'wp-row' }, startButton)
    );
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const { difficulty, settings } = setup.read();
      const chosen: Setup = { difficulty, settings };
      if (list.length) remember(chosen);
      app.announce(t('game.started'));
      void startNew({ ...chosen, begin: true });
    });
    panel.append(h('section', { class: 'start wp-card wp-stack', 'data-testid': 'start-screen' }, ...items, form));
    // The game module loads asynchronously; do not pull focus away from a control the person is
    // using meanwhile (e.g. the header language menu after switching language).
    const active = document.activeElement;
    if (!active || active === document.body || main.contains(active)) {
      (continueWith ? panel.querySelector<HTMLElement>('[data-testid="continue"]') : startButton)?.focus();
    }
  };

  /** "New game" in the toolbar and "Change settings" after a finished game: back to the start screen. */
  const openStart = async () => {
    if (!instance) return showStart(undefined, remembered());
    if (!onStartScreen) {
      onStartScreen = true;
      instance.pause();
    }
    await autosave?.flush(true);
    gameRoot.hidden = true;
    finishedSlot.hidden = true;
    showStart('running', { ...remembered(), ...choices(current) });
  };

  // Pause when hidden; informational (never blocking) note after long continuous play.
  const onVisibility = () => {
    if (!instance || onStartScreen) return;
    if (document.visibilityState === 'hidden') {
      instance.pause();
      void autosave?.flush(true);
    } else {
      lastTick = Date.now();
      instance.resume();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  const ticker = setInterval(() => {
    if (!instance || onStartScreen || document.visibilityState !== 'visible') {
      lastTick = Date.now();
      return;
    }
    const now = Date.now();
    playMs += now - lastTick;
    lastTick = now;
    if (!noteShown && sessionNoteEnabled() && playMs >= SESSION_NOTE_MINUTES * 60_000) {
      noteShown = true;
      const dismiss = h('button', { type: 'button' }, t('game.dismiss'));
      const note = h('p', { class: 'session-note', role: 'status' }, t('game.sessionNote', { minutes: SESSION_NOTE_MINUTES }), ' ', dismiss);
      dismiss.addEventListener('click', () => note.remove());
      status.append(note);
    }
  }, 15_000);

  void (async () => {
    status.append(h('p', { class: 'wp-muted', 'data-testid': 'loading' }, t('game.loading')));
    try {
      let decks;
      let records;
      [module, store, decks, records] = await Promise.all([
        // Games with per-locale content (ADR 0011) load the UI locale's content and the English fallback before
        // they are created. A language switch re-renders this page, so it runs again for the new locale.
        entry.load().then(async (game) => {
          await game.preload?.(app.locale);
          return game;
        }),
        app.store,
        // The deck library code (validation shared with the importer) is a separate chunk: only some games use it.
        metadata.usesUserDecks ? import('../lib/decks').then(async (lib) => lib.userDeckSource(await lib.loadUserDecks(app.decks))) : undefined,
        metadata.usesLearningRecords ? loadLearningRecords(app.learning) : undefined
      ]);
      if (decks) userDecks = decks;
      if (records) learning = hostLearning(records, await app.learning);
    } catch (error) {
      console.error(error);
      clear(status);
      status.append(h('p', { role: 'alert' }, t('game.loadError')));
      return;
    }
    if (disposed) return;
    gt = gameTranslator(module.metadata, app.locale);
    clear(status);
    if (!store.persistent) status.append(h('p', { class: 'notice' }, t('game.saveUnavailable')));
    const loaded = interpretSave(await store.read(metadata.id).catch(() => undefined), module);
    if (loaded.status === 'corrupt') {
      status.append(h('p', { class: 'notice', role: 'alert', 'data-testid': 'save-corrupt' }, t('game.saveCorrupt')));
      await store.remove(metadata.id).catch(() => undefined);
    }
    const save = loaded.status === 'ok' ? loaded.save : undefined;
    // Remembered settings (else the save's), overridden by a `?difficulty=` link and a `?deck=` link (a game's
    // `deck` setting, e.g. "Review" on a deck page; dropped by resolveSettings where it is not a valid choice).
    const initial = { ...(save ? fromSave(save).chosen : {}), ...remembered(), ...(route.difficulty ? { difficulty: route.difficulty } : {}), ...(route.deck ? { deck: route.deck } : {}) };
    if (route.seed !== undefined) {
      // Deep links start at once (bug reports, sharing).
      await startNew({ seed: route.seed, ...resolve(initial) });
    } else if (route.fresh) {
      // "Play" from another page: start right away, then drop `?new=1` so that a reload resumes this game.
      history.replaceState(null, '', `/games/${metadata.id}`);
      await startNew(resolve(initial));
    } else if (metadata.setupInGame && !save && specs().length === 0) {
      // ADR 0015: the game's own setup screen is its start screen, so with no save and nothing for the host's start
      // screen (no settings, no difficulty) there is nothing to choose first. Only here, on opening the page; a finished game never
      // starts another one. As in showStart, do not pull focus from a control the person is using meanwhile.
      const active = document.activeElement;
      const focus = !active || active === document.body || main.contains(active);
      await startNew({ ...resolve(initial), focus });
    } else {
      showStart(save, initial);
    }
  })();

  return async () => {
    disposed = true;
    clearInterval(ticker);
    document.removeEventListener('visibilitychange', onVisibility);
    try {
      await autosave?.flush(true);
      await learning?.flush();
    } finally {
      autosave?.dispose();
      instance?.dispose();
    }
  };
}

export type { Page };
