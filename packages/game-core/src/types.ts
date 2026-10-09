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
}

export type { Rng };
