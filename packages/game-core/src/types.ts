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
  /** Must contain at least the keys `title`, `tagline` and `rules` for every supported locale. */
  readonly messages: GameMessages;
  /** Optional difficulty identifiers; translated via `difficulty.<id>` message keys. */
  readonly difficulties?: readonly string[];
  /** Optional: the game can play with the user's imported decks; the host then provides `GameContext.userDecks`. */
  readonly usesUserDecks?: boolean;
  /** Optional: the game reads and writes spaced-repetition learning records; the host then provides `GameContext.learning`. */
  readonly usesLearningRecords?: boolean;
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
   * player change it inside the game (so the host's select, its next "New game" and the save agree).
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
}

export type { Rng };
