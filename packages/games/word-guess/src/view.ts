import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  LAYOUTS,
  answerOf,
  configOf,
  createInitialState,
  deleteLetter,
  historyOf,
  letterStatus,
  optionsOf,
  restart,
  setLanguage,
  setLayout,
  setStrict,
  statusOf,
  submitGuess,
  toDifficulty,
  typeLetter,
  type KeyboardLayout,
  type Mark,
  type SubmitError,
  type WordGuessState
} from './rules';
import { LANGUAGE_INFO, WORD_LANGUAGES, defaultLanguage, isWordLanguage } from './words';
import './styles.css';

/** Shape symbols that carry the feedback independently of colour. */
export const MARK_SYMBOL: Readonly<Record<Mark, string>> = { hit: '●', near: '◐', miss: '✕' };
const MARKS: readonly Mark[] = ['hit', 'near', 'miss'];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
let instanceCounter = 0;

export function createWordGuess(context: GameContext): GameInstance<WordGuessState> {
  const { t } = context;
  const uid = `wg${++instanceCounter}`;
  let state = createInitialState(0, undefined, { language: defaultLanguage(t.locale), strict: false, layout: 'familiar' });
  let paused = false;
  let message = '';

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'wg-live' });
  const board = h('div', { class: 'wg-board' });
  const container = h('div', { class: 'wp-word-guess', dir: t.direction, lang: t.locale }, board, live);

  const upper = (text: string) => text.toLocaleUpperCase(state.language);
  const markText = (mark: Mark) => t(`mark.${mark}`);
  const describeGuess = (n: number, word: string, marks: readonly Mark[]) =>
    t('row.guess', {
      n,
      letters: marks.map((mark, i) => t('tile.letter', { n: i + 1, letter: upper(word.charAt(i)), mark: markText(mark) })).join('; ')
    });
  const describeInput = () => (state.input ? t('row.input', { letters: [...upper(state.input)].join(' ') }) : t('row.inputEmpty'));

  const errorText = (error: SubmitError): string => {
    switch (error.kind) {
      case 'short':
        return t('error.short', { n: error.needed });
      case 'strict-position':
        return t('error.strictPosition', { n: error.position + 1, letter: upper(error.letter) });
      case 'strict-contains':
        return t('error.strictContains', { letter: upper(error.letter) });
      default:
        return '';
    }
  };

  const statusText = (s: WordGuessState) => {
    const status = statusOf(s);
    const { tries } = configOf(s);
    if (status === 'won') return t('end.won', { n: s.guesses.length, max: tries });
    if (status === 'lost') return t('end.lost', { max: tries });
    return t('tries', { n: tries - s.guesses.length, max: tries });
  };

  // --- State changes -----------------------------------------------------------------------

  const commit = (next: WordGuessState, announcement?: string) => {
    if (next === state) return false;
    state = next;
    message = '';
    render();
    context.requestSave();
    if (announcement) announce(live, announcement);
    return true;
  };

  const type = (letter: string) => {
    const next = typeLetter(state, letter);
    if (next !== state) commit(next, upper(next.input.slice(-1)));
  };

  const backspace = () => {
    if (commit(deleteLetter(state))) announce(live, describeInput());
  };

  const submit = () => {
    const { state: next, error } = submitGuess(state);
    if (error) {
      if (error.kind === 'finished') return;
      message = errorText(error);
      render();
      announce(live, message);
      return;
    }
    const entry = historyOf(next)[next.guesses.length - 1];
    const status = statusOf(next);
    let text = entry ? describeGuess(next.guesses.length, entry.word, entry.marks) : '';
    text += ` ${statusText(next)}`;
    if (status !== 'playing') text += ` ${t('end.word', { word: upper(answerOf(next)) })}`;
    commit(next, text);
    if (status !== 'playing') context.finished({ outcome: status, stats: { tries: next.guesses.length } });
  };

  // --- Rendering ---------------------------------------------------------------------------

  const focusKeyOf = (el: Element | null) => (el instanceof HTMLElement && container.contains(el) ? el.dataset.focus ?? null : null);

  const render = () => {
    const previousFocus = focusKeyOf(document.activeElement);
    clear(board);
    const status = statusOf(state);
    board.append(
      h('p', { class: `wp-status wg-status wg-status-${status}`, 'data-testid': 'wg-status', 'data-status': status }, statusText(state)),
      renderGrid(),
      h('p', { class: 'wg-message', 'data-testid': 'wg-message', hidden: message === '' }, message)
    );
    if (status !== 'playing') {
      const word = upper(answerOf(state));
      board.appendChild(h('p', { class: 'wg-answer', 'data-testid': 'wg-answer', 'data-word': answerOf(state) }, t('end.word', { word })));
    } else {
      board.appendChild(renderKeyboard());
    }
    board.append(renderLegend(), renderOptions());
    if (previousFocus) {
      const target = board.querySelector<HTMLElement>(`[data-focus="${previousFocus}"]`) ?? board.querySelector<HTMLElement>('[data-focus="grid"]');
      target?.focus();
    }
  };

  const tile = (letter: string, mark: Mark | null, testId: string) =>
    h('span', { class: `wg-tile${mark ? ` wg-${mark}` : letter ? ' wg-typed' : ''}`, 'data-testid': testId, 'data-letter': letter, 'data-mark': mark ?? '' },
      h('span', { class: 'wg-letter' }, upper(letter)),
      mark ? h('span', { class: 'wg-symbol' }, MARK_SYMBOL[mark]) : null
    );

  const renderGrid = () => {
    const { length, tries } = configOf(state);
    const info = LANGUAGE_INFO[state.language];
    const history = historyOf(state);
    const playing = statusOf(state) === 'playing';
    const grid = h('div', {
      class: 'wg-grid',
      role: 'group',
      tabindex: 0,
      'data-focus': 'grid',
      'data-testid': 'wg-grid',
      'aria-label': t('grid.label'),
      dir: info.direction,
      lang: state.language,
      style: `--wg-len: ${length}`
    });
    for (let r = 0; r < tries; r++) {
      const entry = history[r];
      const isInput = playing && r === history.length;
      const row = h('div', { class: `wg-row${isInput ? ' is-current' : ''}`, 'data-testid': `wg-row-${r}`, 'aria-hidden': 'true' });
      for (let c = 0; c < length; c++) {
        const letter = entry ? entry.word.charAt(c) : isInput ? state.input.charAt(c) : '';
        row.appendChild(tile(letter, entry ? (entry.marks[c] as Mark) : null, `wg-tile-${r}-${c}`));
      }
      grid.appendChild(row);
      if (entry) grid.appendChild(h('p', { class: 'sr-only' }, describeGuess(r + 1, entry.word, entry.marks)));
      else if (isInput) grid.appendChild(h('p', { class: 'sr-only' }, describeInput()));
    }
    return grid;
  };

  const keyButton = (letter: string, known: Mark | undefined) =>
    h('button', {
      type: 'button',
      class: `wg-key${known ? ` wg-${known}` : ''}`,
      'data-testid': `wg-key-${letter}`,
      'data-focus': `key-${letter}`,
      'data-mark': known ?? '',
      'aria-label': known ? t('key.letter', { letter: upper(letter), mark: markText(known) }) : upper(letter),
      onmousedown: preventFocusSteal,
      onclick: () => {
        if (!paused) type(letter);
      }
    }, h('span', { class: 'wg-letter' }, upper(letter)), known ? h('span', { class: 'wg-symbol', 'aria-hidden': 'true' }, MARK_SYMBOL[known]) : null);

  const enterKey = () =>
    h('button', {
      type: 'button', class: 'wg-key wg-wide primary', 'data-testid': 'wg-enter', 'data-focus': 'enter', 'aria-label': t('action.submit'),
      onmousedown: preventFocusSteal,
      onclick: () => {
        if (!paused) submit();
      }
    }, h('span', { class: 'wg-enter-text', 'aria-hidden': 'true' }, t('key.enter')), h('span', { class: 'wg-enter-icon', 'aria-hidden': 'true' }, '↵'));

  const backKey = () =>
    h('button', {
      type: 'button', class: 'wg-key wg-wide', 'data-testid': 'wg-back', 'data-focus': 'back', 'aria-label': t('key.back'),
      onmousedown: preventFocusSteal,
      onclick: () => {
        if (!paused) backspace();
      }
    }, h('span', { 'aria-hidden': 'true', class: 'wg-back-icon' }, '⌫'));

  const renderKeyboard = () => {
    const info = LANGUAGE_INFO[state.language];
    const known = letterStatus(state);
    const keyboard = h('div', { class: `wg-keyboard wg-layout-${state.layout}`, role: 'group', 'aria-label': t('keyboard.label'), dir: info.direction, lang: state.language, 'data-testid': 'wg-keyboard' });
    if (state.layout === 'large') {
      for (const letter of info.alphabet) keyboard.appendChild(keyButton(letter, known.get(letter)));
      keyboard.append(backKey(), enterKey());
    } else {
      info.layout.forEach((letters, i) => {
        const row = h('div', { class: 'wg-krow' });
        if (i === info.layout.length - 1) row.appendChild(enterKey());
        for (const letter of letters) row.appendChild(keyButton(letter, known.get(letter)));
        if (i === info.layout.length - 1) row.appendChild(backKey());
        keyboard.appendChild(row);
      });
    }
    return keyboard;
  };

  const renderLegend = () =>
    h('ul', { class: 'wg-legend', 'aria-label': t('legend.label') },
      ...MARKS.map((mark) => h('li', {}, h('span', { class: `wg-swatch wg-${mark}`, 'aria-hidden': 'true' }, MARK_SYMBOL[mark]), markText(mark)))
    );

  const renderOptions = () => {
    const language = h('select', {
      id: `${uid}-language`, 'data-focus': 'language', 'data-testid': 'wg-language', 'aria-describedby': `${uid}-language-note`,
      onchange: (event: Event) => {
        const value = (event.target as HTMLSelectElement).value;
        if (isWordLanguage(value) && !paused) commit(setLanguage(state, value));
      }
    }, ...WORD_LANGUAGES.map((id) => h('option', { value: id, selected: id === state.language, lang: id }, LANGUAGE_INFO[id].nativeName)));
    const layout = h('select', {
      id: `${uid}-layout`, 'data-focus': 'layout', 'data-testid': 'wg-layout',
      onchange: (event: Event) => {
        const value = (event.target as HTMLSelectElement).value as KeyboardLayout;
        if ((LAYOUTS as readonly string[]).includes(value) && !paused) commit(setLayout(state, value));
      }
    }, ...LAYOUTS.map((id) => h('option', { value: id, selected: id === state.layout }, t(`layout.${id}`))));
    const strict = h('input', {
      type: 'checkbox', id: `${uid}-strict`, 'data-focus': 'strict', 'data-testid': 'wg-strict', checked: state.strict,
      onchange: (event: Event) => {
        if (!paused) commit(setStrict(state, (event.target as HTMLInputElement).checked));
      }
    });
    return h('section', { class: 'wg-options', 'aria-label': t('options.label') },
      h('div', { class: 'wg-field' }, h('label', { for: `${uid}-language` }, t('language.label')), language),
      h('p', { class: 'wg-hint wp-muted', id: `${uid}-language-note` }, t('language.note')),
      h('div', { class: 'wg-field wg-check' }, strict, h('label', { for: `${uid}-strict` }, t('strict.label'))),
      h('div', { class: 'wg-field' }, h('label', { for: `${uid}-layout` }, t('layout.label')), layout),
      h('p', { class: 'wg-hint wp-muted' }, t('help.keys'))
    );
  };

  // --- Keyboard ------------------------------------------------------------------------------

  /** On-screen keys must not keep focus after a click, or a physical Enter would re-press them. */
  function preventFocusSteal(event: Event) {
    event.preventDefault();
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (paused || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || !container.isConnected) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    // Only react to typing aimed at the game (or at nothing in particular), never at form fields.
    const inGame = target === null || target === document.body || target === document.documentElement || container.contains(target);
    if (!inGame || (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) || target?.isContentEditable) return;
    if (statusOf(state) !== 'playing') return;
    if (event.key === 'Enter') {
      // Enter on a focused on-screen button activates that button natively.
      if (target instanceof HTMLButtonElement) return;
      event.preventDefault();
      submit();
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      backspace();
    } else if (event.key.length === 1) {
      const letter = event.key.normalize('NFC').toLocaleLowerCase(state.language);
      if (LANGUAGE_INFO[state.language].alphabet.includes(letter)) {
        event.preventDefault();
        type(letter);
      }
    }
  };
  document.addEventListener('keydown', onKeyDown);

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    if (!container.isConnected) context.root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      // Word language, strict mode and keyboard layout are the player's choices and carry over.
      state = createInitialState(options.seed, toDifficulty(options.difficulty), optionsOf(state));
      message = '';
      mount();
    },
    restore(saved: WordGuessState) {
      state = clone(saved);
      message = '';
      mount();
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      state = restart(state);
      message = '';
      mount();
      context.requestSave();
    },
    dispose() {
      document.removeEventListener('keydown', onKeyDown);
      clear(context.root);
    }
  };
}
