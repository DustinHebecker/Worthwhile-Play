import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import type { Compiled } from '../compile';
import { activeGoals, available, HINT_TIERS, initialState, step } from '../engine';
import { clueKey, goalKey, hintKey, hotspotKey, itemKey, lineKey, optionKey, sceneKey } from '../text';
import type { Action, AdventureState, GameEvent, Hotspot } from '../types';
import { shapeElement, svg, VIEW_BOX, type ArtProvider } from './art';

/** Content texts of one locale: text key → text. */
export type Catalogue = Readonly<Record<string, string>>;

export interface AdventureViewOptions {
  readonly compiled: Compiled;
  readonly art: ArtProvider;
  /** Content texts for a UI locale (already preloaded by the host, ADR 0011). */
  readonly texts: (locale: string) => Catalogue;
  /** Speech output for "read aloud"; `undefined` hides the option (no speech synthesis available). */
  readonly speech?: Speech | undefined;
}

export interface Speech {
  speak(text: string, lang: string): void;
  cancel(): void;
}

/** Browser speech synthesis, if present (best effort: voices vary by device). */
export function browserSpeech(): Speech | undefined {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return undefined;
  return {
    speak(text, lang) {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      synth.speak(u);
    },
    cancel: () => synth.cancel()
  };
}

const VERBS = ['examine', 'take', 'use', 'talk'] as const;
const same = (a: Action, b: Action): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * The adventure view kit (docs/design/adventures.md § 2, § 6): a picture with clickable places, and — the
 * complete, keyboard- and screen-reader-playable path — a text view of the same scene (things here with their
 * actions, inventory, conversation, journal, map, hints). Every action goes through `step`; the view keeps only
 * presentation state (open menu, marked clues, last outcome), which a reload may lose without losing progress.
 */
export function createAdventureView(context: GameContext, options: AdventureViewOptions): GameInstance<AdventureState> {
  const { root, t } = context;
  const { compiled: c, art, speech } = options;
  let state: AdventureState | undefined;
  let menuFor: string | null = null;
  let marked: string[] = [];
  let lastText: string[] = [];
  let chapterBreak: string | null = null;
  let reveal = false;
  let readAloud = false;
  let finishedSent = false;
  let paused = false;
  let focusKey: string | null = null;

  const live = h('p', { class: 'wp-adv__live', 'aria-live': 'polite', role: 'status' });
  const main = h('div', { class: 'wp-adv' });
  root.append(main);

  const text = (key: string): string => {
    const own = options.texts(t.locale)[key];
    return own !== undefined && own !== '' ? own : key;
  };
  const sceneName = (id: string): string => text(sceneKey(id, 'name'));
  const itemName = (id: string): string => text(itemKey(id, 'name'));
  const hotspotName = (id: string): string => text(hotspotKey(state?.scene ?? '', id, 'name'));

  const keepFocus = (key: string): void => {
    focusKey = key;
  };
  const button = (label: string, key: string, onclick: () => void, attrs: Record<string, string | boolean | undefined> = {}): HTMLButtonElement =>
    h('button', { type: 'button', class: 'wp-adv__btn', 'data-testid': key, 'data-focus': key, onclick: () => (keepFocus(key), onclick()), ...attrs }, label);

  const say = (texts: readonly string[]): void => {
    const message = texts.join(' ');
    if (message === '') return;
    announce(live, message);
    if (readAloud && speech && !paused) speech.speak(message, t.locale);
  };

  // ── Acting ────────────────────────────────────────────────────────────────────────────────────

  function act(action: Action): void {
    if (!state || paused) return;
    const r = step(c, state, action);
    if (!r.out.ok) {
      lastText = [t(`adv.refuse.${r.out.reason}`)];
      render();
      say(lastText);
      return;
    }
    state = r.state;
    lastText = r.out.text.map(text);
    onEvents(r.out.events);
    // After an action on a place, its menu closes and the keyboard focus returns to the place (if still there).
    if ('hs' in action) {
      menuFor = null;
      keepFocus(`hs-${action.hs}`);
    }
    marked = marked.filter((m) => state?.clues.includes(m));
    context.requestSave();
    render();
    say(lastText);
  }

  function onEvents(events: readonly GameEvent[]): void {
    for (const e of events) {
      if (e.type === 'chapter') chapterBreak = e.chapter;
      if (e.type === 'ended' && !finishedSent && state) {
        finishedSent = true;
        const hints = Object.values(state.hints).reduce((n, v) => n + v, 0);
        context.finished({ outcome: 'completed', stats: { actions: state.actions, hints } });
      }
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────────────────────────

  function picture(s: AdventureState, spots: readonly Hotspot[]): SVGSVGElement {
    const scene = c.scenes.get(s.scene);
    const pic = svg('svg', { viewBox: VIEW_BOX, class: reveal ? 'wp-adv__picture wp-adv__picture--reveal' : 'wp-adv__picture', role: 'img', 'aria-label': text(sceneKey(s.scene, 'desc')) });
    if (scene) pic.append(art.render(scene, s));
    for (const hs of spots) {
      const shape = shapeElement(hs.shape);
      shape.setAttribute('class', menuFor === hs.id ? 'wp-adv__spot wp-adv__spot--open' : 'wp-adv__spot');
      shape.setAttribute('data-testid', `spot-${hs.id}`);
      // Pointer and touch only: the first tap opens the actions (never acts directly). Keyboard and screen
      // readers use the "things here" list, which offers the same actions.
      shape.setAttribute('aria-hidden', 'true');
      shape.addEventListener('click', () => {
        menuFor = menuFor === hs.id ? null : hs.id;
        render();
        // The actions open in the list below the picture: bring them into view (phones; review L4).
        const opened = main.querySelector<HTMLElement>('.wp-adv__menu');
        if (opened && typeof opened.scrollIntoView === 'function') opened.scrollIntoView({ block: 'nearest' });
      });
      pic.append(shape);
    }
    return pic;
  }

  function menu(s: AdventureState, hs: Hotspot, acts: readonly Action[]): HTMLElement {
    const list = h('div', { class: 'wp-adv__menu', role: 'group', 'aria-label': hotspotName(hs.id) });
    const offered = (a: Action): boolean => acts.some((b) => same(a, b));
    if (s.selected) {
      const a: Action = { a: 'useItem', item: s.selected, hs: hs.id };
      if (offered(a)) list.append(button(t('adv.useItem', { item: itemName(s.selected) }), `act-useItem-${hs.id}`, () => act(a), { class: 'wp-adv__btn wp-adv__btn--primary' }));
    }
    for (const verb of VERBS) {
      const a: Action = { a: verb, hs: hs.id };
      if (offered(a)) list.append(button(t(`adv.verb.${verb}`), `act-${verb}-${hs.id}`, () => act(a)));
    }
    for (const clue of s.clues) {
      const a: Action = { a: 'present', clue, hs: hs.id };
      if (offered(a)) list.append(button(t('adv.present', { clue: text(clueKey(clue)) }), `act-present-${clue}-${hs.id}`, () => act(a)));
    }
    list.append(button(t('adv.close'), `act-close-${hs.id}`, () => ((menuFor = null), keepFocus(`hs-${hs.id}`), render())));
    return list;
  }

  function things(s: AdventureState, acts: readonly Action[], spots: readonly Hotspot[]): HTMLElement {
    const items = spots.map((hs) =>
      h(
        'li',
        {},
        button(hotspotName(hs.id), `hs-${hs.id}`, () => ((menuFor = menuFor === hs.id ? null : hs.id), render()), { 'aria-expanded': menuFor === hs.id ? 'true' : 'false' }),
        menuFor === hs.id ? menu(s, hs, acts) : null
      )
    );
    return h('section', { class: 'wp-adv__things', 'aria-labelledby': 'wp-adv-things' }, h('h3', { id: 'wp-adv-things' }, t('adv.things')), h('ul', { class: 'wp-adv__list' }, ...items));
  }

  function inventory(s: AdventureState): HTMLElement {
    const sec = h('section', { class: 'wp-adv__inventory', 'aria-labelledby': 'wp-adv-inv' }, h('h3', { id: 'wp-adv-inv' }, t('adv.inventory')));
    if (s.items.length === 0) {
      sec.append(h('p', { class: 'wp-adv__muted' }, t('adv.inventory.empty')));
      return sec;
    }
    sec.append(h('p', { class: 'wp-adv__muted' }, t('adv.inventory.help')));
    const list = h('ul', { class: 'wp-adv__list wp-adv__list--row' });
    for (const item of s.items) {
      const pressed = s.selected === item;
      const onclick = (): void => {
        if (!state) return;
        if (state.selected === null || pressed) act({ a: 'select', item: pressed ? null : item });
        else act({ a: 'combine', x: state.selected, y: item });
      };
      list.append(h('li', {}, button(itemName(item), `item-${item}`, onclick, { 'aria-pressed': pressed ? 'true' : 'false' })));
    }
    sec.append(list);
    if (s.selected) {
      sec.append(
        h('p', { class: 'wp-adv__selected' }, t('adv.selected', { item: itemName(s.selected) }), ' ', text(itemKey(s.selected, 'desc'))),
        button(t('adv.deselect'), 'deselect', () => act({ a: 'select', item: null }))
      );
    }
    return sec;
  }

  function dialogue(s: AdventureState, acts: readonly Action[]): HTMLElement | null {
    if (!s.dialogue) return null;
    const { id, node } = s.dialogue;
    const options = acts.flatMap((a) => (a.a === 'choose' ? [a] : []));
    return h(
      'section',
      { class: 'wp-adv__dialogue', 'aria-labelledby': 'wp-adv-dlg' },
      h('h3', { id: 'wp-adv-dlg' }, t('adv.dialogue')),
      h('p', { class: 'wp-adv__line' }, text(lineKey(id, node))),
      h('ul', { class: 'wp-adv__list' }, ...options.map((a) => h('li', {}, button(text(optionKey(id, node, a.option)), `opt-${a.option}`, () => act(a)))))
    );
  }

  function journal(s: AdventureState): HTMLElement {
    const goals = activeGoals(c, s);
    const clues = s.clues.map((clue) => {
      const on = marked.includes(clue);
      return h(
        'li',
        {},
        button(text(clueKey(clue)), `clue-${clue}`, () => {
          marked = on ? marked.filter((m) => m !== clue) : [...marked.slice(-1), clue];
          render();
        }, { 'aria-pressed': on ? 'true' : 'false' })
      );
    });
    const [x, y] = marked;
    return h(
      'details',
      { class: 'wp-adv__panel', 'data-testid': 'journal' },
      h('summary', {}, t('adv.journal')),
      h('h4', {}, t('adv.goals')),
      goals.length > 0 ? h('ul', { class: 'wp-adv__list' }, ...goals.map((g) => h('li', {}, text(goalKey(g))))) : h('p', { class: 'wp-adv__muted' }, t('adv.goals.none')),
      h('h4', {}, t('adv.clues')),
      clues.length > 0 ? h('ul', { class: 'wp-adv__list' }, ...clues) : h('p', { class: 'wp-adv__muted' }, t('adv.clues.none')),
      x !== undefined && y !== undefined ? button(t('adv.connect'), 'connect', () => act({ a: 'deduce', x, y })) : null
    );
  }

  function map(acts: readonly Action[]): HTMLElement {
    const trips = acts.flatMap((a) => (a.a === 'travel' ? [a] : []));
    return h(
      'details',
      { class: 'wp-adv__panel', 'data-testid': 'map' },
      h('summary', {}, t('adv.map')),
      trips.length > 0
        ? h('ul', { class: 'wp-adv__list' }, ...trips.map((a) => h('li', {}, button(t('adv.travel', { scene: sceneName(a.scene) }), `travel-${a.scene}`, () => act(a)))))
        : h('p', { class: 'wp-adv__muted' }, t('adv.map.none'))
    );
  }

  function hints(s: AdventureState): HTMLElement {
    const goals = activeGoals(c, s);
    return h(
      'details',
      { class: 'wp-adv__panel', 'data-testid': 'hints' },
      h('summary', {}, t('adv.hints')),
      goals.length === 0
        ? h('p', { class: 'wp-adv__muted' }, t('adv.hint.none'))
        : h(
            'ul',
            { class: 'wp-adv__list' },
            ...goals.map((g) => {
              const tier = s.hints[g] ?? 0;
              return h(
                'li',
                {},
                h('strong', {}, text(goalKey(g))),
                ...Array.from({ length: tier }, (_, i) => h('p', { class: 'wp-adv__hint' }, text(hintKey(g, i + 1)))),
                tier < HINT_TIERS ? button(t('adv.hint.show'), `hint-${g}`, () => act({ a: 'hint', goal: g })) : null
              );
            })
          )
    );
  }

  function render(): void {
    const open = new Set([...main.querySelectorAll('details[open]')].map((d) => d.getAttribute('data-testid')));
    clear(main);
    if (!state) return;
    const s = state;
    const acts = available(c, s);
    const spots = (c.scenes.get(s.scene)?.hotspots ?? []).filter((hs) => acts.some((a) => 'hs' in a && a.hs === hs.id));

    if (chapterBreak) {
      main.append(
        h(
          'section',
          { class: 'wp-adv__chapter', 'aria-labelledby': 'wp-adv-chapter' },
          h('h2', { id: 'wp-adv-chapter' }, t('adv.chapter')),
          h('p', {}, text(`chapter.${chapterBreak}`)),
          button(t('adv.continue'), 'chapter-continue', () => ((chapterBreak = null), render()))
        ),
        live
      );
      restoreFocus('chapter-continue');
      return;
    }

    const tools = h(
      'div',
      { class: 'wp-adv__tools' },
      h('label', { class: 'wp-adv__toggle' }, h('input', { type: 'checkbox', 'data-testid': 'reveal', checked: reveal, onchange: (e: Event) => ((reveal = (e.target as HTMLInputElement).checked), render()) }), t('adv.reveal')),
      speech
        ? h('label', { class: 'wp-adv__toggle' }, h('input', { type: 'checkbox', 'data-testid': 'read-aloud', checked: readAloud, onchange: (e: Event) => ((readAloud = (e.target as HTMLInputElement).checked), readAloud || speech.cancel()) }), t('adv.readAloud'))
        : null
    );
    main.append(
      h('h2', { class: 'wp-adv__scene', 'data-testid': 'scene-name' }, sceneName(s.scene)),
      h('figure', { class: 'wp-adv__figure' }, picture(s, spots)),
      tools,
      h('p', { class: 'wp-adv__desc' }, text(sceneKey(s.scene, 'desc'))),
      h('div', { class: 'wp-adv__outcome', 'data-testid': 'outcome' }, ...lastText.map((p) => h('p', {}, p))),
      live
    );
    const talk = dialogue(s, acts);
    if (talk) main.append(talk);
    else main.append(things(s, acts, spots), inventory(s));
    main.append(journal(s), map(acts), hints(s));
    for (const d of main.querySelectorAll('details')) if (open.has(d.getAttribute('data-testid'))) d.setAttribute('open', '');
    restoreFocus(null);
  }

  function restoreFocus(fallback: string | null): void {
    const key = focusKey ?? fallback;
    if (!key || !root.isConnected) return;
    const el = main.querySelector<HTMLElement>(`[data-focus="${CSS.escape(key)}"]`) ?? (fallback ? main.querySelector<HTMLElement>(`[data-focus="${CSS.escape(fallback)}"]`) : null);
    el?.focus();
  }

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && menuFor) {
      keepFocus(`hs-${menuFor}`);
      menuFor = null;
      render();
    }
  };
  root.addEventListener('keydown', onKey);

  const start = (s: AdventureState, texts: readonly string[]): void => {
    state = s;
    menuFor = null;
    marked = [];
    chapterBreak = null;
    finishedSent = s.ended !== null;
    focusKey = null;
    lastText = texts.map(text);
    render();
  };

  return {
    newGame(opts: NewGameOptions) {
      const s = initialState(c, opts.seed);
      start(s, s.log);
    },
    restore(s) {
      start(structuredClone(s), []);
    },
    serialize() {
      if (!state) throw new Error('adventure: no game started');
      return structuredClone(state);
    },
    pause() {
      paused = true;
      speech?.cancel();
    },
    resume() {
      paused = false;
    },
    reset() {
      if (!state) return;
      const s = initialState(c, state.seed);
      start(s, s.log);
    },
    dispose() {
      speech?.cancel();
      root.removeEventListener('keydown', onKey);
      clear(root);
      state = undefined;
    }
  };
}
