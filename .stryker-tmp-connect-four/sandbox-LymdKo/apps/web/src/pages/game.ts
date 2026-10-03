// @ts-nocheck
import { randomSeed, type GameInstance, type GameModule, type GameResult } from '@wp/game-core';
import { createAutosave, createSave, interpretSave, type GameSave, type SaveStore } from '@wp/persistence';
import { clear, h } from '@wp/ui';
import type { AppContext, Page } from '../app';
import { SESSION_NOTE_MINUTES } from '../config';
import { findGame } from '../registry';
import type { Route } from '../router';
import { sessionNoteEnabled } from './settings';
import { gameBadges, gameTranslator } from './shared';

type GameRoute = Extract<Route, { name: 'game' }>;

/**
 * Game host: loads a game module lazily, offers "Continue"/"New game", wires the
 * GameContext (translator, autosave, finished screen) and guarantees that leaving
 * the page or hiding the tab persists the current logical state.
 */
export function renderGamePage(main: HTMLElement, app: AppContext, route: GameRoute): () => Promise<void> {
  const { t } = app;
  const entry = findGame(route.id);
  if (!entry) {
    main.append(h('section', { class: 'prose' }, h('h1', {}, t('game.notFound')), h('p', {}, h('a', { href: '/' }, t('game.back')))));
    return async () => undefined;
  }
  const { metadata } = entry;
  const gt = gameTranslator(metadata, app.locale);

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
  let store: (SaveStore & { persistent: boolean }) | undefined;
  let instance: GameInstance<unknown> | undefined;
  let autosave: ReturnType<typeof createAutosave> | undefined;
  let current: { seed: number; difficulty: string | undefined } | undefined;
  let disposed = false;
  let playMs = 0;
  let lastTick = Date.now();
  let noteShown = false;

  const difficultySelect = (selected: string | undefined) => {
    if (!metadata.difficulties?.length) return null;
    const select = h('select', { id: 'difficulty', 'data-testid': 'difficulty' },
      ...metadata.difficulties.map((d) => h('option', { value: d, selected: d === selected }, gt(`difficulty.${d}`)))
    );
    return h('span', { class: 'field inline' }, h('label', { for: 'difficulty' }, t('game.difficulty')), select);
  };
  const chosenDifficulty = () => (main.querySelector<HTMLSelectElement>('#difficulty')?.value || metadata.difficulties?.[0]) ?? undefined;

  const persist = async () => {
    if (!instance || !module || !store || !current) return;
    await store.write(createSave(module, current.seed, instance.serialize(), current.difficulty) as GameSave);
  };

  const showFinished = (result: GameResult) => {
    clear(finishedSlot);
    // A game may phrase its own outcome (`result.<outcome>`), e.g. "Player X wins"; otherwise use the shared wording.
    const own = `result.${result.outcome}`;
    const outcome = metadata.messages.en?.[own] ? own : { won: 'common.won', lost: 'common.lost', draw: 'common.draw', completed: 'common.solved' }[result.outcome];
    const another = h('button', { type: 'button', class: 'primary', 'data-testid': 'another-round' }, t('game.anotherRound'));
    another.addEventListener('click', () => void startNew());
    finishedSlot.append(
      h('section', { class: 'finished wp-card', role: 'status', 'data-testid': 'finished' },
        h('h2', {}, t('game.finished')),
        h('p', {}, gt(outcome)),
        // Deliberately no automatic next game: the user decides whether to continue.
        h('div', { class: 'wp-row' }, another, h('a', { class: 'wp-button', href: '/' }, t('game.back')))
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
      requestSave: () => autosave?.request(),
      finished: showFinished
    });
    return instance;
  };

  const toolbar = () => {
    clear(panel);
    const button = h('button', { type: 'button', 'data-testid': 'new-game' }, t('game.newGame'));
    button.addEventListener('click', () => void startNew());
    panel.append(h('div', { class: 'wp-row toolbar' }, difficultySelect(current?.difficulty), button,
      current ? h('span', { class: 'wp-muted seed', 'data-testid': 'seed' }, t('game.seed', { seed: current.seed })) : null));
  };

  const startNew = async (seed = randomSeed(), difficulty = chosenDifficulty()) => {
    current = { seed, difficulty };
    // Reuse a running instance so game-internal options (e.g. opponent type) carry over to the next round.
    const game = instance ?? mount();
    clear(finishedSlot);
    game.newGame(difficulty === undefined ? { seed } : { seed, difficulty });
    toolbar();
    await autosave?.flush(true);
    gameRoot.querySelector<HTMLElement>('button, [tabindex="0"], input, select')?.focus();
  };

  const resume = async (save: GameSave<unknown>) => {
    current = { seed: save.seed, difficulty: save.difficulty };
    const game = mount();
    game.restore(save.state);
    toolbar();
  };

  const showStart = (save: GameSave<unknown> | undefined) => {
    clear(panel);
    const newButton = h('button', { type: 'button', class: save ? '' : 'primary', 'data-testid': 'new-game' }, t('game.newGame'));
    newButton.addEventListener('click', () => void startNew());
    const items: (HTMLElement | null)[] = [];
    if (save) {
      const cont = h('button', { type: 'button', class: 'primary', 'data-testid': 'continue' }, t('game.continue'));
      cont.addEventListener('click', () => void resume(save));
      const date = new Intl.DateTimeFormat(app.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(save.updatedAt));
      items.push(h('div', { class: 'wp-row' }, cont, h('span', { class: 'wp-muted' }, t('game.savedAt', { date }))));
    }
    items.push(h('div', { class: 'wp-row' }, difficultySelect(route.difficulty ?? save?.difficulty), newButton));
    panel.append(h('div', { class: 'start wp-card wp-stack' }, ...items));
    (save ? panel.querySelector<HTMLElement>('[data-testid="continue"]') : newButton)?.focus();
  };

  // Pause when hidden; informational (never blocking) note after long continuous play.
  const onVisibility = () => {
    if (!instance) return;
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
    if (!instance || document.visibilityState !== 'visible') return;
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
      [module, store] = await Promise.all([entry.load(), app.store]);
    } catch (error) {
      console.error(error);
      clear(status);
      status.append(h('p', { role: 'alert' }, t('game.loadError')));
      return;
    }
    if (disposed) return;
    clear(status);
    if (!store.persistent) status.append(h('p', { class: 'notice' }, t('game.saveUnavailable')));
    const loaded = interpretSave(await store.read(metadata.id).catch(() => undefined), module);
    if (loaded.status === 'corrupt') {
      status.append(h('p', { class: 'notice', role: 'alert', 'data-testid': 'save-corrupt' }, t('game.saveCorrupt')));
      await store.remove(metadata.id).catch(() => undefined);
    }
    if (route.seed !== undefined) {
      await startNew(route.seed, route.difficulty && metadata.difficulties?.includes(route.difficulty) ? route.difficulty : chosenDifficulty());
    } else {
      showStart(loaded.status === 'ok' ? loaded.save : undefined);
    }
  })();

  return async () => {
    disposed = true;
    clearInterval(ticker);
    document.removeEventListener('visibilitychange', onVisibility);
    try {
      await autosave?.flush(true);
    } finally {
      autosave?.dispose();
      instance?.dispose();
    }
  };
}

export type { Page };
