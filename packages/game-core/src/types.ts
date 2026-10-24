import type { SupportedLocale } from './lang';
import type { Rng } from './rng';

/** Primary abilities a game exercises. Used for catalogue grouping, never for scoring users. */
export const SKILLS = [
  'deduction',
  'planning',
  'spatial',
  'systems',
  'hypothesis',
  'algorithms',
  'debugging',
  'memory',
  'learning',
  'attention',
  'communication',
  'strategy'
] as const;
export type Skill = (typeof SKILLS)[number];

export type InputMethod = 'pointer' | 'touch' | 'keyboard';
export type Requirement = 'none' | 'optional' | 'required';

export interface GameCapabilities {
  /** Fully playable without network access once the app is cached. */
  offline: boolean;
  audio: Requirement;
  /** A local or remote AI module can enhance but is never required. */
  aiOptional: boolean;
  webgpu: Requirement;
  network: Requirement;
  /** Can be paused at any moment (all games must be closable and resumable regardless). */
  pauseable: boolean;
}

/**
 * Message catalogue for a game's own namespace. Keys are game-local
 * (e.g. `title`, `rules.goal`). Every supported UI locale must be present;
 * this is checked by the localization test helpers.
 */
export type GameMessages = Readonly<Record<string, Readonly<Record<string, string>>>>;

export interface GameMetadata {
  /** Stable, URL-safe id. Used in `/games/<id>` and as persistence key. */
  readonly id: string;
  /** Version of the serialized state format. Bump on incompatible changes and provide `migrateState`. */
  readonly stateVersion: number;
  readonly skills: readonly Skill[];
  /** Typical session length in minutes [min, max]. */
  readonly typicalMinutes: readonly [number, number];
  readonly inputMethods: readonly InputMethod[];
  readonly capabilities: GameCapabilities;
  /** Must contain at least the keys `title`, `tagline` and `rules` for every locale the game ships (`locales`). */
  readonly messages: GameMessages;
  /**
   * Optional (ADR 0003 amendment 2026-10-24): the UI locales the game ships, `'en'` included; absent = all 16.
   * Only for games released early as `status: 'preview'` by owner decision. Messages are required (and checked)
   * only for these locales; in any other UI locale the host shows the game's texts in English — its catalogue
   * card texts, its page header, its settings and the game itself (`context.t.locale` is then `'en'`), marked
   * `lang="en"` — without reporting missing keys.
   */
  readonly locales?: readonly SupportedLocale[];
  /**
   * Optional: `'preview'` marks a game released early as work in progress (owner decision): the catalogue card and
   * the game page show a "Work in progress" badge. Absent for finished games.
   */
  readonly status?: 'preview';
  /** Optional difficulty identifiers; translated via `difficulty.<id>` message keys. */
  readonly difficulties?: readonly string[];
  /** Optional: the game can play with the user's imported decks; the host then provides `GameContext.userDecks`. */
  readonly usesUserDecks?: boolean;
  /** Optional: the game reads and writes spaced-repetition learning records; the host then provides `GameContext.learning`. */
  readonly usesLearningRecords?: boolean;
  /**
   * Optional (ADR 0015, narrowed by ADR 0017): the game's own setup (map, seats…) follows the host's start screen,
   * which offers any declared settings and — only when the module declares no `settings` at all — the difficulty.
   * A game that declares `settings` (even `[]`) chooses the difficulty in its own setup and reports it with
   * `context.setDifficulty` (and `settingsOf(state).difficulty` for saves); see `GameModule.settings`.
   * When there is nothing for the start screen and no save, the host starts a fresh game directly on the game's
   * setup. Only on opening the game page: never after a game finishes (no autoplay into the next game). With a save,
   * the host offers "Continue" and "New game" (which starts the game's own setup with `begin`).
   */
  readonly setupInGame?: boolean;
}

export interface Translator {
  (key: string, params?: Readonly<Record<string, string | number>>): string;
  readonly locale: string;
  readonly direction: 'ltr' | 'rtl';
}

export interface GameResult {
  /** `won`, `lost`, `draw` or `completed` (for games without a winner). */
  outcome: 'won' | 'lost' | 'draw' | 'completed';
  /** Optional factual summary values (moves, time, accuracy). Never used to pressure users. */
  stats?: Readonly<Record<string, number>>;
}

export interface NewGameOptions {
  seed: number;
  difficulty?: string;
  /**
   * Values of the settings the module declares (`GameModule.settings`, ADR 0017), chosen on the host's start
   * screen, keyed by setting id; difficulty is passed as `difficulty`, never here. The host passes only known,
   * in-range values of settings whose `when` condition holds; games must still treat the record as untrusted
   * (older saves, tests, deep links) and fall back to their defaults.
   */
  settings?: Readonly<Record<string, SettingValue>>;
  /**
   * The player has just pressed Start (or "Another round") on the host's start screen, so a game with its own
   * "ready?" intro may skip it and begin play right away. Absent for direct starts (deep links, ADR 0015).
   */
  begin?: boolean;
}

/** A value of a host-drawn setting (ADR 0017). */
export type SettingValue = string | number | boolean;

/**
 * Shows a setting only while every listed setting currently has one of the listed values, e.g.
 * `{ opponent: ['computer'] }`. The difficulty is referred to as `difficulty`. A hidden setting is not passed
 * to `newGame` (the game uses its own default).
 */
export type SettingCondition = Readonly<Record<string, readonly SettingValue[]>>;

/**
 * One setting the host draws on the start screen (ADR 0017). Labels are message keys of the game's own
 * namespace, present in all 16 locales (checked by `validateSettings`).
 */
export type SettingSpec =
  | {
      /** The game's difficulty (values = `metadata.difficulties`, labels `difficulty.<id>`). */
      readonly kind: 'difficulty';
      /** Default: the host's "Difficulty". */
      readonly labelKey?: string;
      readonly hintKey?: string;
      /** The preselected difficulty (one of `metadata.difficulties`); without it the first one. */
      readonly default?: string;
      readonly when?: SettingCondition;
    }
  | {
      /** One of a fixed list: ≤4 values as radio buttons, more as a select (`display` overrides). */
      readonly kind: 'choice';
      readonly id: string;
      readonly labelKey: string;
      readonly values: readonly (string | number)[];
      /** Value labels are message keys `${valueKey}.${value}`. Either this or `valueLabels`. */
      readonly valueKey?: string;
      /**
       * Ready-made labels per value, only for lists built from the device (`settings(env)`, e.g. imported deck
       * titles) that have no message keys. Either this or `valueKey`.
       */
      readonly valueLabels?: Readonly<Record<string, string>>;
      readonly hintKey?: string;
      readonly default: string | number;
      readonly display?: 'auto' | 'radio' | 'select';
      readonly when?: SettingCondition;
    }
  | {
      readonly kind: 'toggle';
      readonly id: string;
      readonly labelKey: string;
      readonly default: boolean;
      readonly hintKey?: string;
      readonly when?: SettingCondition;
    }
  | {
      /** A whole number (or a multiple of `step` from `min`) in [min, max]. */
      readonly kind: 'number';
      readonly id: string;
      readonly labelKey: string;
      readonly min: number;
      readonly max: number;
      readonly step?: number;
      readonly default: number;
      readonly hintKey?: string;
      readonly when?: SettingCondition;
    };

/** What a module may read to declare its settings (device-dependent lists such as imported decks). */
export interface SettingsEnv {
  /** Translator of the game's own namespace in the UI locale. */
  readonly t: Translator;
  readonly userDecks?: UserDeckSource;
  readonly learning?: GameLearningRecords;
  readonly contentLanguages?: GameContentLanguages;
  readonly preferences?: GamePreferences;
  readonly launch?: GameLaunchOptions;
}

/** Services the host (app shell or a standalone page) provides to a running game. */
export interface GameContext {
  /** Element the game renders into. The game owns its children until `dispose()`. */
  readonly root: HTMLElement;
  /** Translator for the game's own namespace; falls back to shared common keys (`common.*`). */
  readonly t: Translator;
  readonly reducedMotion: boolean;
  /** Ask the host to persist `serialize()` soon. Call after every logically complete state change. */
  requestSave(): void;
  /** Signal natural completion. The host shows a calm "finished" screen and never auto-starts another game. */
  finished(result: GameResult): void;
  /**
   * Optional: tell the host which of `metadata.difficulties` the game now runs at, when the game lets the
   * player change it inside the game (so the host's start screen, its next "New game"/"Another round" and the save
   * agree). The way a `setupInGame` game that declares `settings` reports the difficulty chosen in its own setup.
   */
  setDifficulty?(difficulty: string): void;
  /**
   * Optional per-device preferences of this game (e.g. opponent count, word language) that should survive
   * a reload even when the player starts a fresh game. Small JSON values only; never game state.
   */
  readonly preferences?: GamePreferences;
  /**
   * Optional learning languages chosen in Settings (any BCP-47 tags, independent of the UI language `t.locale`).
   * Either may be missing; games must fall back explicitly (e.g. to the UI language).
   */
  readonly contentLanguages?: GameContentLanguages;
  /**
   * Optional read-only snapshot of the decks the user imported on this device (only for games with
   * `metadata.usesUserDecks`). Synchronous, so `newGame`/`restore` stay synchronous. Decks can be deleted
   * between sessions: a saved game must handle a missing deck gracefully.
   */
  readonly userDecks?: UserDeckSource;
  /**
   * Optional learning records on this device (only for games with `metadata.usesLearningRecords`): a synchronous
   * snapshot plus an idempotent write. Games without it must still work (e.g. as practice without a schedule).
   */
  readonly learning?: GameLearningRecords;
  /**
   * Optional parameters of the link that opened the game (e.g. `/games/review?deck=flags`). They apply to the next
   * `newGame` only; a game that supports them should remember them in its preferences.
   */
  readonly launch?: GameLaunchOptions;
  /**
   * Optional per-game store for things the player creates (e.g. maps), on this device (ADR 0012). Asynchronous,
   * separate from saves and preferences: "Delete all saved games" keeps it; Settings has its own confirmed delete.
   * Items read back are untrusted (validate `data`). Games must keep working without it (e.g. older hosts, tests).
   */
  readonly library?: GameLibrary;
}

/** One item of a game's library without its data (for lists). */
export interface LibraryEntry {
  /** Host-made (random) or game-chosen id, `[A-Za-z0-9_-]{1,64}`. Game logic must not depend on its value. */
  readonly id: string;
  readonly name: string;
  /** ISO-8601 timestamp of the last `put`. */
  readonly updatedAt: string;
  /** UTF-8 bytes of the serialized data. */
  readonly size: number;
}

/** One item with its data. `data` is untrusted JSON: validate it like a save before using it. */
export interface LibraryItem {
  readonly id: string;
  readonly name: string;
  readonly data: unknown;
  readonly updatedAt: string;
}

/** What a game passes to `GameLibrary.put`. Without `id` a new item is created; with an id it is created or replaced. */
export interface LibraryItemInput {
  readonly id?: string;
  readonly name: string;
  /** Plain JSON only: null, booleans, finite numbers, strings, arrays and plain objects (no cycles, no undefined). */
  readonly data: unknown;
}

/** Options of `GameLibrary.put`. */
export interface LibraryPutOptions {
  /**
   * Create only: with an explicit `id`, reject with reason `exists` (and change nothing) if this game already has an
   * item with that id. The check and the write are atomic (one storage transaction), so of several concurrent
   * create-if-absent puts of the same id (e.g. from two tabs) exactly one succeeds. `exists` takes precedence over
   * `full` (an existing id is reported as `exists` even when the library is full). Without an `id` the option is
   * ignored: the host generates a fresh id, so the item is always new. Default `false` (create or replace).
   */
  readonly ifAbsent?: boolean;
}

/**
 * A game's own library (scoped to its id by the host). All methods are asynchronous and reject with a
 * `GameLibraryError` only; reading never throws on stored junk (unreadable items are skipped).
 */
export interface GameLibrary {
  /** Items of this game, most recently changed first. */
  list(): Promise<LibraryEntry[]>;
  get(id: string): Promise<LibraryItem | undefined>;
  /**
   * Creates or replaces an item (the data is copied). Resolves to the stored entry. With `{ ifAbsent: true }` and an
   * explicit id it only creates, rejecting with reason `exists` if the id is taken (see `LibraryPutOptions`).
   */
  put(item: LibraryItemInput, options?: LibraryPutOptions): Promise<LibraryEntry>;
  /** Removes an item; a missing id is not an error. */
  delete(id: string): Promise<void>;
}

export interface GameLaunchOptions {
  /** A deck id (built-in or imported) the game should use. */
  readonly deck?: string;
}

/** Which way a card is asked: front → back (`forward`) or back → front (`backward`). */
export type LearningDirection = 'forward' | 'backward';
/** Self-rating after revealing a card: "not yet", "almost", "knew it". */
export type LearningRating = 'again' | 'hard' | 'good';

/** One self-rated card, sent to `GameLearningRecords.record`. */
export interface LearningReview {
  /** Learning deck key (see `learningDeckId` in `@wp/learning-content`), e.g. `flags`, `first-words:ja`, `user-…`. */
  readonly deckId: string;
  readonly itemId: string;
  readonly direction: LearningDirection;
  readonly rating: LearningRating;
  /**
   * Id of the session the rating belongs to. A record is updated at most once per session, so sending the same
   * review again (e.g. after a reload or resume) never counts twice.
   */
  readonly session: string;
  /** Local calendar day of the rating, `YYYY-MM-DD`. */
  readonly day: string;
}

/** The scheduling facts a game may read about one card (host-validated). */
export interface LearningRecordSummary {
  readonly deckId: string;
  readonly itemId: string;
  readonly direction: LearningDirection;
  /** Leitner box, 1 … 7. */
  readonly box: number;
  /** Local calendar day from which the card is suggested again, `YYYY-MM-DD`. */
  readonly due: string;
  readonly reviews: number;
}

export interface GameLearningRecords {
  /** The device's local calendar day, `YYYY-MM-DD` (only used to decide what is due). */
  today(): string;
  /** Records of one learning deck (synchronous snapshot; reflects `record` calls immediately). */
  list(deckId: string): readonly LearningRecordSummary[];
  /** Applies self-ratings (stored asynchronously). Idempotent per record and session; never throws. */
  record(reviews: readonly LearningReview[]): void;
}

export interface GameContentLanguages {
  /** Language being learned, e.g. `ja`. */
  readonly learning?: string;
  /** Language translations are shown in, e.g. `en`. */
  readonly translation?: string;
}

export interface UserDeckSummary {
  readonly id: string;
  /** Title keyed by BCP-47 tag. */
  readonly title: Readonly<Record<string, string>>;
  readonly itemCount: number;
}

export interface UserDeckSource {
  list(): readonly UserDeckSummary[];
  /** The deck in the `@wp/learning-content` format (already validated by the host), or undefined. */
  get(id: string): unknown;
}

export interface GamePreferences {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

/** A running game bound to a DOM root. */
export interface GameInstance<S = unknown> {
  newGame(options: NewGameOptions): void;
  /** Restore a previously serialized logical state (already validated/migrated by the host). */
  restore(state: S): void;
  /** JSON-serializable logical state. Must fully reconstruct the game, including PRNG state. */
  serialize(): S;
  pause(): void;
  resume(): void;
  /** Restart the current game with the same seed/difficulty. */
  reset(): void;
  /** Remove listeners, timers and DOM. The instance must not be used afterwards. */
  dispose(): void;
}

/** The contract every game package implements and exports as `default`. */
export interface GameModule<S = unknown> {
  readonly metadata: GameMetadata;
  create(context: GameContext): GameInstance<S>;
  /** Structural validation of untrusted persisted data. Must not throw. */
  isValidState(value: unknown): value is S;
  /** Upgrade state saved by an older `stateVersion`. Return `undefined` if impossible. */
  migrateState?(state: unknown, fromVersion: number): S | undefined;
  /**
   * Optional (ADR 0011): loads what the game needs to render in the UI locale `locale` (e.g. per-locale texts,
   * see `createLocaleContent`) and the English fallback. The host awaits it after loading the module and before
   * `create`, and again for every locale the game is shown in (a language switch re-renders the game page).
   * Must be idempotent and cache its result. Resolves when the game can render — in `locale`, or in English when
   * only `locale` failed to load (the game reports that itself); rejects only when nothing can be loaded.
   * Never needed for the catalogue: `metadata` stays synchronous and complete.
   */
  preload?(locale: string): Promise<void>;
  /**
   * Optional (ADR 0017): the settings that change the game, drawn by the host on the start screen and passed to
   * `newGame` as `NewGameOptions.settings`. A function when the list depends on the device (e.g. imported decks).
   * Without it the host shows the difficulty (if `metadata.difficulties`) and nothing else. When `metadata.difficulties`
   * exists and no `{ kind: 'difficulty' }` entry is listed, the host puts the difficulty first — except for a
   * `metadata.setupInGame` game that declares this field (an array, `[]` included, or a function): the host then
   * shows exactly the declared settings and the game picks the difficulty in its own setup, reporting it with
   * `context.setDifficulty` (validated against `metadata.difficulties`, kept in the save and passed to `newGame`
   * for "Another round" and "New game"). `?difficulty=` links still reach `newGame`.
   * Pure display preferences (zoom, card faces, speed…) stay inside the game.
   */
  readonly settings?: readonly SettingSpec[] | ((env: SettingsEnv) => readonly SettingSpec[]);
  /**
   * Optional (ADR 0017): the start-screen settings a (validated) state was started with, as far as the state holds
   * them, keyed like the start screen (the difficulty under `difficulty`). The host uses it for saves written before
   * the save envelope kept the settings, and takes the difficulty only from it, never from the envelope (the state
   * is the source of truth, e.g. after a migration renamed difficulties). Leave out what the state cannot tell; the
   * host then shows no settings summary and offers "Change settings" instead of "Another round" for that save.
   * Must not throw (the host treats a throw as `{}`); values are re-validated by the host.
   */
  settingsOf?(state: S): Readonly<Record<string, SettingValue>>;
}

export type { Rng };
