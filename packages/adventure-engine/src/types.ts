/**
 * Content and state model of the adventure engine (docs/design/adventures.md § 3, § 5; ADR 0014).
 *
 * Content is declarative data: ids, conditions and effects, no functions and no user-visible strings.
 * Every text an adventure shows has a key derived from the structure (see `text.ts`), so the
 * complete key set of an adventure is known without running it.
 */

/** Lower-case letters, digits and hyphens; starts with a letter or digit (keeps derived text keys unambiguous). */
export type Id = string;

// ── Conditions and effects ──────────────────────────────────────────────────────────────────────

export type Cond =
  | { readonly all: readonly Cond[] }
  | { readonly any: readonly Cond[] }
  | { readonly not: Cond }
  /** Bounded integer flag; without `eq`/`gte`/`lte` it means "flag ≠ 0". */
  | { readonly flag: Id; readonly eq?: number; readonly gte?: number; readonly lte?: number }
  | { readonly has: Id }
  | { readonly used: Id }
  | { readonly knows: Id }
  | { readonly visited: Id }
  | { readonly in: Id }
  | { readonly goal: Id };

export type Effect =
  | { readonly set: Id; readonly to: number }
  | { readonly add: Id; readonly by: number }
  /** Puts an item into the inventory (no-op if it is already held or was used up). */
  | { readonly give: Id }
  /** Uses an item up: it leaves the inventory for good. */
  | { readonly take: Id }
  | { readonly learn: Id }
  | { readonly go: Id }
  | { readonly dialogue: Id };

/** Effects apply in order when `when` holds (or is absent). Its text key is derived from its position. */
export interface Rule {
  readonly when?: Cond;
  readonly then?: readonly Effect[];
}

// ── Structure ───────────────────────────────────────────────────────────────────────────────────

export type Verb = 'examine' | 'take' | 'use' | 'talk';
export const VERBS: readonly Verb[] = ['examine', 'take', 'use', 'talk'];

/** Scene coordinates: a 1600 × 900 view box. */
export type Shape = { readonly x: number; readonly y: number; readonly w: number; readonly h: number } | { readonly points: readonly (readonly [number, number])[] };

export interface Hotspot {
  readonly id: Id;
  readonly shape: Shape;
  readonly visible?: Cond;
  /** Verb interactions; `examine` without rules shows the hotspot's description. First matching rule wins. */
  readonly on?: Partial<Readonly<Record<Verb, readonly Rule[]>>>;
  /** Using an inventory item on this hotspot, by item id. */
  readonly items?: Readonly<Record<Id, readonly Rule[]>>;
  /** Showing a known clue to this hotspot (usually a person), by clue id. */
  readonly clues?: Readonly<Record<Id, readonly Rule[]>>;
}

export interface Scene {
  readonly id: Id;
  readonly region: Id;
  /** Hotspots in authored reading order (hotspot list, Tab order). */
  readonly hotspots: readonly Hotspot[];
  /** Rules tried when the scene is entered (first matching rule wins). */
  readonly onEnter?: readonly Rule[];
  /** Whether the map may travel to and from this scene once visited (default true). */
  readonly map?: boolean;
}

export interface Item {
  readonly id: Id;
}

export interface Clue {
  readonly id: Id;
}

/** Unordered pair of items. */
export interface Combination {
  readonly items: readonly [Id, Id];
  readonly rules: readonly Rule[];
}

/** Two clues that together yield a conclusion (a clue learned by the rules' effects). */
export interface Deduction {
  readonly clues: readonly [Id, Id];
  readonly rules: readonly Rule[];
}

export interface DialogueOption {
  readonly id: Id;
  readonly when?: Cond;
  readonly then?: readonly Effect[];
  /** Next node, or `null` to end the conversation. */
  readonly next: Id | null;
}

export interface DialogueNode {
  readonly id: Id;
  readonly options: readonly DialogueOption[];
}

export interface Dialogue {
  readonly id: Id;
  /** The first node is where the conversation starts. */
  readonly nodes: readonly DialogueNode[];
}

/** A milestone that drives the journal's open questions and the hints (three tiers each). */
export interface Goal {
  readonly id: Id;
  readonly active: Cond;
  readonly done: Cond;
}

/** Chapters end in order when their `done` condition holds; each end is a natural stopping point. */
export interface Chapter {
  readonly id: Id;
  readonly done: Cond;
}

export interface Ending {
  readonly id: Id;
  readonly when: Cond;
}

export interface Adventure {
  readonly id: Id;
  readonly contentVersion: number;
  readonly start: { readonly scene: Id; readonly items?: readonly Id[]; readonly flags?: Readonly<Record<Id, number>> };
  /** Flags are integers 0…max (0 = initial). */
  readonly flags: Readonly<Record<Id, { readonly max: number }>>;
  readonly scenes: readonly Scene[];
  readonly items: readonly Item[];
  readonly clues: readonly Clue[];
  readonly combinations: readonly Combination[];
  readonly deductions: readonly Deduction[];
  readonly dialogues: readonly Dialogue[];
  readonly goals: readonly Goal[];
  readonly chapters: readonly Chapter[];
  readonly endings: readonly Ending[];
}

// ── Actions ─────────────────────────────────────────────────────────────────────────────────────

export type Action =
  | { readonly a: Verb; readonly hs: Id }
  | { readonly a: 'useItem'; readonly item: Id; readonly hs: Id }
  | { readonly a: 'present'; readonly clue: Id; readonly hs: Id }
  | { readonly a: 'combine'; readonly x: Id; readonly y: Id }
  | { readonly a: 'deduce'; readonly x: Id; readonly y: Id }
  | { readonly a: 'choose'; readonly option: Id }
  | { readonly a: 'travel'; readonly scene: Id }
  | { readonly a: 'select'; readonly item: Id | null }
  | { readonly a: 'hint'; readonly goal: Id };

// ── State ───────────────────────────────────────────────────────────────────────────────────────

export interface AdventureState {
  /** Engine state format version. */
  v: 1;
  /** `contentVersion` of the adventure the state was written with. */
  content: number;
  seed: number;
  scene: Id;
  selected: Id | null;
  /** Non-zero flags only. */
  flags: Record<Id, number>;
  /** Inventory in pickup order. */
  items: Id[];
  /** Items used up (they never come back). */
  used: Id[];
  clues: Id[];
  visited: Id[];
  goalsDone: Id[];
  dialogue: { id: Id; node: Id } | null;
  /** Hint tiers revealed per goal (1–3); shown only in the end summary. */
  hints: Record<Id, number>;
  /** Index of the current chapter (= number of finished chapters). */
  chapter: number;
  /** Text keys of the last outcomes, newest last (display only). */
  log: string[];
  actions: number;
  ended: Id | null;
}

// ── Outcomes ────────────────────────────────────────────────────────────────────────────────────

export type RefusalReason =
  | 'invalid'
  | 'ended'
  | 'in-dialogue'
  | 'not-here'
  | 'not-held'
  | 'not-known'
  | 'nothing-happens'
  | 'no-combination'
  | 'no-connection'
  | 'not-reachable'
  | 'no-hint';

export type GameEvent =
  | { readonly type: 'gained'; readonly item: Id }
  | { readonly type: 'used'; readonly item: Id }
  | { readonly type: 'learned'; readonly clue: Id }
  | { readonly type: 'moved'; readonly scene: Id }
  | { readonly type: 'dialogue'; readonly id: Id; readonly node: Id | null }
  | { readonly type: 'goal'; readonly goal: Id }
  | { readonly type: 'chapter'; readonly chapter: Id }
  | { readonly type: 'ended'; readonly ending: Id };

export type Outcome =
  | { readonly ok: true; readonly text: readonly string[]; readonly events: readonly GameEvent[] }
  | { readonly ok: false; readonly reason: RefusalReason };

export interface StepResult {
  readonly state: AdventureState;
  readonly out: Outcome;
}
