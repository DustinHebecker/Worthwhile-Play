import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, append, clear, h } from '@wp/ui';
import { contentFor } from './content';
import type { ItemText } from './content/items';
import {
  check,
  chooseReply,
  createInitialState,
  currentItem,
  dimensionsFor,
  next,
  phaseOf,
  replyOrder,
  ROUND_SIZE,
  scoreAt,
  setNote,
  summarize,
  toDifficulty,
  toggleDimension,
  NOTE_MAX,
  type AmbiguityState,
  type DimId,
  type ReplyKind
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const NOTE_PREF = 'ownQuestion';
const SYMBOL = { hit: '✓', miss: '✗', extra: '!' } as const;
type Verdict = keyof typeof SYMBOL;

export function createAmbiguityDetector(context: GameContext): GameInstance<AmbiguityState> {
  const { t } = context;
  const texts = contentFor(t.locale);
  const fallback = contentFor('en');
  let state = createInitialState(0);
  let paused = false;

  const readNotePref = (): boolean => {
    const value = context.preferences?.get(NOTE_PREF);
    return typeof value === 'boolean' ? value : true;
  };
  let showNote = readNotePref();

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'ad-live' });
  const board = h('div', { class: 'ad-board' });
  const container = h('div', { class: 'wp-ambiguity-detector', dir: t.direction, lang: t.locale }, board, live);

  const textOf = (id: string): ItemText => (texts[id] ?? fallback[id]) as ItemText;
  const dimLabel = (dim: DimId) => t(`dim.${dim}`);

  // --- State changes -----------------------------------------------------------------------

  const commit = (nextState: AmbiguityState, options: { render?: boolean; focus?: string; message?: string } = {}) => {
    if (nextState === state) return false;
    state = nextState;
    if (options.render !== false) render(options.focus);
    context.requestSave();
    if (options.message) announce(live, options.message);
    return true;
  };

  const onCheck = () => {
    const nextState = check(state);
    const result = scoreAt(nextState, nextState.index);
    if (!result) return;
    commit(nextState, {
      focus: 'feedback',
      message: t('announce.checked', { hits: result.hits.length, misses: result.misses.length, extra: result.extra.length })
    });
  };

  const onReply = (kind: ReplyKind) => {
    commit(chooseReply(state, kind), { focus: 'next', message: t(kind === 'clear' ? 'announce.best' : 'announce.other') });
  };

  const onNext = () => {
    const nextState = next(state);
    const done = phaseOf(nextState) === 'summary';
    const changed = commit(nextState, {
      focus: done ? 'summary' : 'first-dim',
      message: done ? t('summary.heading') : t('progress', { n: nextState.index + 1, total: ROUND_SIZE })
    });
    if (changed && done) {
      const summary = summarize(nextState);
      context.finished({
        outcome: 'completed',
        stats: { found: summary.hits, gaps: summary.gaps, overlooked: summary.misses, notMissing: summary.extra, bestReplies: summary.bestReplies }
      });
    }
  };

  // --- Rendering ---------------------------------------------------------------------------

  const focusKeyOf = (el: Element | null) => (el instanceof HTMLElement && container.contains(el) ? (el.dataset.focus ?? null) : null);

  const render = (focus?: string) => {
    const previousFocus = focus ?? focusKeyOf(document.activeElement);
    clear(board);
    if (phaseOf(state) === 'summary') board.appendChild(renderSummary());
    else renderItem();
    if (previousFocus) board.querySelector<HTMLElement>(`[data-focus="${previousFocus}"]`)?.focus();
  };

  const marker = (verdict: Verdict) =>
    h('span', { class: `ad-mark ad-mark-${verdict}` },
      h('span', { 'aria-hidden': 'true' }, SYMBOL[verdict]),
      ' ',
      h('span', { class: 'ad-mark-word' }, t(`verdict.${verdict}`))
    );

  const renderItem = () => {
    const item = currentItem(state);
    const answer = state.answers[state.index];
    if (!item || !answer) return;
    const text = textOf(item.id);
    const phase = phaseOf(state);
    const result = scoreAt(state, state.index);
    const verdictOf = (dim: DimId): Verdict | null =>
      result ? (result.hits.includes(dim) ? 'hit' : result.misses.includes(dim) ? 'miss' : result.extra.includes(dim) ? 'extra' : null) : null;

    append(board,
      h('p', { class: 'ad-progress wp-muted', 'data-testid': 'ad-progress', 'data-index': state.index },
        t('progress', { n: state.index + 1, total: ROUND_SIZE }), ' · ', t(`difficulty.${state.difficulty}`)),
      h('article', { class: 'ad-card', 'data-testid': 'ad-message', 'data-item': item.id },
        h('p', { class: 'ad-label' }, t('label.context')),
        h('p', { class: 'ad-context', 'data-testid': 'ad-context' }, text.context),
        h('p', { class: 'ad-label' }, t('label.message')),
        h('blockquote', { class: 'ad-text', 'data-testid': 'ad-text' }, text.text)
      )
    );

    // Step 1: tick the missing information.
    const fieldset = h('fieldset', { class: 'ad-dims', 'data-testid': 'ad-dims' }, h('legend', {}, t('tick.legend')));
    const list = h('div', { class: 'ad-dim-list' });
    dimensionsFor(state.difficulty).forEach((dim, i) => {
      const ticked = answer.ticked.includes(dim);
      const verdict = verdictOf(dim);
      const input = h('input', {
        type: 'checkbox',
        checked: ticked,
        disabled: phase !== 'tick',
        'aria-describedby': `ad-help-${dim}`,
        'data-testid': `ad-dim-${dim}`,
        'data-focus': i === 0 ? 'first-dim' : `dim-${dim}`,
        'data-autofocus': i === 0 && phase === 'tick' ? true : undefined,
        onchange: () => {
          if (!paused) commit(toggleDimension(state, dim), { focus: i === 0 ? 'first-dim' : `dim-${dim}` });
          else input.checked = ticked;
        }
      });
      list.appendChild(
        h('label', { class: `ad-dim${ticked ? ' is-ticked' : ''}${verdict ? ` is-${verdict}` : ''}`, 'data-dim': dim, 'data-verdict': verdict ?? 'none' },
          input,
          h('span', { class: 'ad-dim-text' },
            h('span', { class: 'ad-dim-name' }, dimLabel(dim)),
            h('span', { class: 'ad-dim-help', id: `ad-help-${dim}` }, t(`dim.${dim}.help`))
          ),
          verdict ? marker(verdict) : null
        )
      );
    });
    fieldset.appendChild(list);
    board.appendChild(fieldset);

    if (phase === 'tick') {
      if (showNote) {
        const area = h('textarea', {
          id: 'ad-note',
          rows: 2,
          maxlength: NOTE_MAX,
          'aria-describedby': 'ad-note-help',
          'data-testid': 'ad-note',
          'data-focus': 'note'
        });
        area.value = answer.note;
        area.addEventListener('input', () => {
          if (paused) return;
          commit(setNote(state, area.value), { render: false });
        });
        board.appendChild(
          h('div', { class: 'ad-note' },
            h('label', { for: 'ad-note' }, t('note.label')),
            area,
            h('p', { class: 'wp-muted ad-small', id: 'ad-note-help' }, t('note.help'))
          )
        );
      }
      board.appendChild(
        h('div', { class: 'wp-row ad-actions' },
          h('button', { type: 'button', class: 'primary', 'data-testid': 'ad-check', 'data-focus': 'check', onclick: () => {
            if (!paused) onCheck();
          } }, t('common.check'))
        )
      );
      board.appendChild(renderNoteOption());
      return;
    }

    if (result) board.appendChild(renderFeedback(item.id, text, answer.note, answer.ticked, result));
    board.appendChild(renderReplies(item.id, text, answer.reply));
    if (phase === 'replied') {
      const last = state.index === ROUND_SIZE - 1;
      board.appendChild(
        h('div', { class: 'wp-row ad-actions' },
          h('button', { type: 'button', class: 'primary', 'data-testid': 'ad-next', 'data-focus': 'next', onclick: () => {
            if (!paused) onNext();
          } }, t(last ? 'action.summary' : 'action.next'))
        )
      );
    }
  };

  const renderNoteOption = () => {
    const input = h('input', {
      type: 'checkbox',
      checked: showNote,
      'data-testid': 'ad-note-option',
      'data-focus': 'note-option',
      onchange: () => {
        showNote = input.checked;
        context.preferences?.set(NOTE_PREF, showNote);
        render('note-option');
      }
    });
    return h('label', { class: 'ad-option wp-muted' }, input, h('span', {}, t('option.note')));
  };

  const renderFeedback = (itemId: string, text: ItemText, note: string, ticked: readonly DimId[], result: NonNullable<ReturnType<typeof scoreAt>>) => {
    const item = currentItem(state);
    const rows = h('ul', { class: 'ad-rows' });
    const offered = dimensionsFor(state.difficulty);
    for (const dim of offered) {
      const verdict: Verdict | null = result.hits.includes(dim) ? 'hit' : result.misses.includes(dim) ? 'miss' : result.extra.includes(dim) ? 'extra' : null;
      if (!verdict) continue;
      const explanation = verdict === 'extra'
        ? (text.given[dim] ?? t('feedback.notNeeded'))
        : t('feedback.ask', { question: text.ask[dim] ?? '' });
      rows.appendChild(
        h('li', { class: `ad-row is-${verdict}`, 'data-testid': `ad-row-${dim}`, 'data-verdict': verdict },
          marker(verdict),
          h('span', { class: 'ad-row-body' },
            h('strong', {}, dimLabel(dim)),
            h('span', { class: 'ad-row-text' }, explanation)
          )
        )
      );
    }
    const givenRest = (item?.given ?? []).filter((dim) => offered.includes(dim) && !ticked.includes(dim));
    return h('section', { class: 'ad-feedback', 'data-testid': 'ad-feedback', 'aria-labelledby': 'ad-feedback-heading', 'data-item': itemId },
      h('h3', { id: 'ad-feedback-heading', tabindex: -1, 'data-focus': 'feedback' }, t('feedback.heading')),
      h('p', { class: 'ad-counts', 'data-testid': 'ad-counts', 'data-hits': result.hits.length, 'data-misses': result.misses.length, 'data-extra': result.extra.length },
        t('feedback.counts', { hits: result.hits.length, misses: result.misses.length, extra: result.extra.length })),
      rows,
      givenRest.length > 0
        ? h('div', { class: 'ad-given', 'data-testid': 'ad-given' },
          h('p', { class: 'ad-label' }, t('feedback.given')),
          h('ul', {}, ...givenRest.map((dim) => h('li', { 'data-dim': dim }, h('strong', {}, dimLabel(dim)), ' ', text.given[dim] ?? '')))
        )
        : null,
      note.trim() !== '' ? h('p', { class: 'ad-yours', 'data-testid': 'ad-yours' }, t('feedback.yours', { question: note.trim() })) : null
    );
  };

  const renderReplies = (itemId: string, text: ItemText, chosen: ReplyKind | null) => {
    const section = h('fieldset', { class: 'ad-replies', 'data-testid': 'ad-replies' }, h('legend', {}, t('reply.legend')));
    const list = h('ul', { class: 'ad-reply-list' });
    replyOrder(state.seed, itemId).forEach((kind, i) => {
      const reply = text.replies[kind] ?? '';
      if (chosen === null) {
        list.appendChild(
          h('li', {},
            h('button', { type: 'button', class: 'ad-reply', 'data-testid': `ad-reply-${kind}`, 'data-focus': i === 0 ? 'first-reply' : `reply-${kind}`, onclick: () => {
              if (!paused) onReply(kind);
            } }, reply)
          )
        );
        return;
      }
      const best = kind === 'clear';
      list.appendChild(
        h('li', { class: `ad-reply-result ${best ? 'is-best' : 'is-weaker'}${kind === chosen ? ' is-chosen' : ''}`, 'data-testid': `ad-reply-${kind}`, 'data-chosen': kind === chosen ? 'true' : 'false' },
          h('p', { class: 'ad-reply-head' },
            h('span', { class: 'ad-mark' }, h('span', { 'aria-hidden': 'true' }, best ? SYMBOL.hit : SYMBOL.miss), ' ', t(best ? 'reply.best' : 'reply.weaker')),
            kind === chosen ? h('span', { class: 'ad-tag' }, t('reply.chosen')) : null
          ),
          h('p', { class: 'ad-reply-text' }, reply),
          h('p', { class: 'ad-small' }, t(`reply.why.${kind}`))
        )
      );
    });
    section.appendChild(list);
    return section;
  };

  const renderSummary = () => {
    const summary = summarize(state);
    const separator = t('list.separator');
    const table = h('table', { class: 'ad-table' },
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col' }, t('summary.col.dim')),
        h('th', { scope: 'col' }, t('summary.col.found')),
        h('th', { scope: 'col' }, t('summary.col.overlooked')),
        h('th', { scope: 'col' }, t('summary.col.extra'))
      ))
    );
    const body = h('tbody', {});
    for (const row of summary.dimensions) {
      body.appendChild(
        h('tr', { 'data-testid': `ad-sum-${row.dim}`, 'data-found': row.found, 'data-missing': row.missing, 'data-overlooked': row.overlooked, 'data-extra': row.extra },
          h('th', { scope: 'row' }, dimLabel(row.dim)),
          h('td', {}, `${row.found} / ${row.missing}`),
          h('td', {}, String(row.overlooked)),
          h('td', {}, String(row.extra))
        )
      );
    }
    table.appendChild(body);
    return h('section', { class: 'ad-summary', 'data-testid': 'ad-summary', 'aria-labelledby': 'ad-summary-heading' },
      h('h3', { id: 'ad-summary-heading', tabindex: -1, 'data-focus': 'summary' }, t('summary.heading')),
      h('p', { 'data-testid': 'ad-sum-found' }, t('summary.found', { hits: summary.hits, total: summary.gaps })),
      h('p', {}, t('summary.extra', { n: summary.extra })),
      h('p', {}, t('summary.replies', { n: summary.bestReplies, total: summary.answered })),
      h('p', { class: 'ad-overlooked', 'data-testid': 'ad-overlooked' },
        summary.mostOverlooked.length > 0
          ? t('summary.overlooked', { dims: summary.mostOverlooked.map(dimLabel).join(separator) })
          : t('summary.allFound')),
      h('div', { class: 'ad-scroll' }, table),
      h('p', { class: 'wp-muted ad-small' }, t('summary.note'))
    );
  };

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    if (!container.isConnected) context.root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      showNote = readNotePref();
      mount();
    },
    restore(saved: AmbiguityState) {
      state = clone(saved);
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
      state = createInitialState(state.seed, state.difficulty);
      mount();
      context.requestSave();
    },
    dispose() {
      clear(context.root);
    }
  };
}
