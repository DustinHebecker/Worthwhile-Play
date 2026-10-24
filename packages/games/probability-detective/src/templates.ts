/**
 * Language-neutral case templates of the modes "Clue by clue" (design § 6, content doc § 3) and "Choose the checks"
 * (design § 7, content doc § 4). Texts live in `content/<locale>.ts`, keyed by these ids. Template, clue, check and
 * option ids are never reused or removed: a template that should no longer appear gets `retired: true`, so old saves
 * stay valid (design § 14). The trap templates are in `traps.ts`.
 *
 * All numbers are invented for practice; the grids here and in `generate.ts` are their only source.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

/** Levels of a clue number for three hypotheses (content doc § 2.3). */
export type Tier = 'hi' | 'mid' | 'lo';
type Tiers = readonly [Tier, Tier, Tier];

export type ClueSpec =
  | {
      readonly id: string;
      readonly kind: 'normal';
      /** The hypothesis this clue favours when there are two (it always gets the larger number). */
      readonly fav: 0 | 1;
      readonly cls: 'strong' | 'weak';
      /** Levels per hypothesis when the case has three hypotheses (hard). */
      readonly tiers?: Tiers;
    }
  | {
      /** A rare sign (a crack, a burnt side): small numbers, the favoured one at least twice the other. */
      readonly id: string;
      readonly kind: 'rate';
      readonly fav: 0 | 1;
      /** For three hypotheses: the favoured one (`hi`); the others are `lo`. */
      readonly tiers?: Tiers;
      /** Easy override (den 10). */
      readonly easy?: { readonly fav: readonly number[]; readonly oth: readonly number[] };
    }
  | {
      /** A quick search where the thing may be: finds it with chance d when it is there, never otherwise. */
      readonly id: string;
      readonly kind: 'search';
      readonly fav: 0 | 1;
    }
  | {
      /** Numbers fixed by the story (a coin toss), per difficulty and hypothesis, over den 10 (easy) or 100. */
      readonly id: string;
      readonly kind: 'fixed';
      readonly nums: Readonly<Record<Difficulty, readonly number[]>>;
    }
  | { readonly id: string; readonly kind: 'neutral' }
  | { readonly id: string; readonly kind: 'echo'; readonly of: string };

export interface ClueTemplate {
  readonly id: string;
  /** Hypothesis ids in template order (marks ● ■ ▲); the third is used on hard only. */
  readonly hyps: readonly string[];
  readonly levels: readonly Difficulty[];
  readonly clues: readonly ClueSpec[];
  /** A clue that describes why the case exists: always first, always seen (content doc § 3.2). */
  readonly first?: string;
  /** Clues keep their template order (tosses) instead of being shuffled. */
  readonly ordered?: boolean;
  /** Clues of a three-hypothesis (hard) case when it differs from the default (3). */
  readonly hardClues?: number;
  /** Base-rate overrides: the share of ● per level (easy /10, medium /100, hard /1000), or hard triples. */
  readonly prior?: {
    readonly easy?: readonly number[];
    readonly medium?: readonly number[];
    readonly hard?: readonly number[];
    /** Hard, three hypotheses (/100): ● from `first`, ▲ from `third`, ■ the rest. */
    readonly triples?: { readonly first: readonly number[]; readonly third: readonly number[] };
  };
  readonly retired?: boolean;
}

const n = (id: string, fav: 0 | 1, cls: 'strong' | 'weak', tiers?: Tiers): ClueSpec =>
  tiers ? { id, kind: 'normal', fav, cls, tiers } : { id, kind: 'normal', fav, cls };
const neutral = (id: string): ClueSpec => ({ id, kind: 'neutral' });
const ALL: readonly Difficulty[] = DIFFICULTIES;
const MH: readonly Difficulty[] = ['medium', 'hard'];
const toss = (id: string): ClueSpec => ({ id, kind: 'fixed', nums: { easy: [5, 9], medium: [50, 75], hard: [50, 75, 100] } });

export const CLUE_TEMPLATES: readonly ClueTemplate[] = [
  {
    id: 'c-parcel',
    hyps: ['north', 'south', 'east'],
    levels: ALL,
    clues: [
      n('blue', 0, 'strong', ['hi', 'lo', 'mid']),
      n('brown-tape', 1, 'weak', ['lo', 'hi', 'mid']),
      n('smudge', 1, 'weak', ['lo', 'hi', 'mid']),
      n('string', 0, 'weak', ['lo', 'lo', 'hi']),
      neutral('tuesday'),
      { id: 'echo-blue', kind: 'echo', of: 'blue' }
    ]
  },
  {
    id: 'c-garden',
    hyps: ['birds', 'snails', 'hedgehog'],
    levels: ALL,
    clues: [
      n('slime', 1, 'strong', ['lo', 'hi', 'mid']),
      n('pecks', 0, 'strong', ['hi', 'lo', 'lo']),
      n('droppings', 1, 'weak', ['lo', 'lo', 'hi']),
      n('net-moved', 0, 'weak', ['hi', 'lo', 'mid']),
      neutral('rain'),
      { id: 'echo-slime', kind: 'echo', of: 'slime' }
    ]
  },
  {
    id: 'c-cups',
    hyps: ['a', 'b', 'c'],
    levels: MH,
    first: 'crack',
    clues: [
      { id: 'crack', kind: 'rate', fav: 1, tiers: ['lo', 'lo', 'hi'] },
      n('glaze', 1, 'weak', ['lo', 'hi', 'mid']),
      n('stamp', 0, 'strong', ['hi', 'mid', 'lo']),
      n('handle', 1, 'weak', ['lo', 'mid', 'hi']),
      neutral('box')
    ]
  },
  {
    id: 'c-key',
    hyps: ['coat', 'car', 'office'],
    levels: ALL,
    clues: [
      { id: 'search-coat', kind: 'search', fav: 0 },
      { id: 'search-car', kind: 'search', fav: 1 },
      n('jingle', 0, 'weak', ['hi', 'lo', 'mid']),
      n('drove', 1, 'weak', ['lo', 'hi', 'mid']),
      n('office-day', 0, 'weak', ['lo', 'lo', 'hi']),
      neutral('weekday')
    ]
  },
  {
    id: 'c-coin',
    hyps: ['ordinary', 'weighted', 'two-headed'],
    levels: ALL,
    ordered: true,
    hardClues: 4,
    prior: { easy: [6, 7, 8], medium: [70, 75, 80, 85, 90], triples: { first: [80, 85, 90], third: [1, 2, 3, 5] } },
    clues: [toss('toss1'), toss('toss2'), toss('toss3'), toss('toss4')]
  },
  {
    id: 'c-rain',
    hyps: ['rained', 'dry'],
    levels: ALL,
    clues: [n('wet-grass', 0, 'weak'), n('gauge', 0, 'strong'), n('puddle', 0, 'strong'), n('snails-out', 0, 'weak'), neutral('wind')]
  },
  {
    id: 'c-message',
    hyps: ['real', 'fake'],
    levels: ALL,
    clues: [n('link', 1, 'weak'), n('sender', 1, 'strong'), n('hurry', 1, 'weak'), n('your-name', 0, 'weak'), neutral('evening')]
  },
  {
    id: 'c-bird',
    hyps: ['finch', 'sparrow'],
    levels: ALL,
    clues: [n('red-patch', 0, 'strong'), n('ground', 1, 'weak'), n('song', 0, 'weak'), n('group', 1, 'weak'), neutral('morning')]
  },
  {
    id: 'c-oven',
    hyps: ['old', 'new'],
    levels: ALL,
    first: 'burnt-side',
    clues: [
      { id: 'burnt-side', kind: 'rate', fav: 0, easy: { fav: [2, 3], oth: [1] } },
      n('pale-top', 0, 'weak'),
      n('tray-mark', 1, 'strong'),
      n('early', 0, 'weak'),
      neutral('seeds')
    ]
  },
  {
    id: 'c-beep',
    hyps: ['satellite', 'interference'],
    levels: MH,
    prior: { medium: [5, 10, 15, 20], hard: [10, 20, 25, 40, 50] },
    clues: [n('pass-time', 0, 'strong'), n('drift', 0, 'strong'), n('fades', 0, 'weak'), neutral('rhythm'), n('other-receiver', 0, 'weak')]
  },
  {
    id: 'c-plant',
    hyps: ['water', 'light'],
    levels: ALL,
    clues: [n('wet-soil', 0, 'weak'), n('leaning', 1, 'weak'), n('soft-stem', 0, 'strong'), n('pale-new', 1, 'weak'), neutral('pot-colour')]
  },
  {
    id: 'c-bus',
    hyps: ['jam', 'breakdown'],
    levels: ALL,
    clues: [n('others-late', 0, 'strong'), n('replacement', 1, 'strong'), n('announcement', 1, 'weak'), n('rush-hour', 0, 'weak'), neutral('rain')]
  }
];

const BY_ID: ReadonlyMap<string, ClueTemplate> = new Map(CLUE_TEMPLATES.map((t) => [t.id, t]));
export const templateById = (id: string): ClueTemplate | undefined => (typeof id === 'string' ? BY_ID.get(id) : undefined);
export const clueSpec = (template: ClueTemplate, id: string): ClueSpec | undefined => template.clues.find((c) => c.id === id);

/** Hypotheses a case of this template has at this difficulty (three only on hard, design § 6.5). */
export const hypsFor = (template: ClueTemplate, difficulty: Difficulty): number => (difficulty === 'hard' ? Math.min(3, template.hyps.length) : 2);

/* ---------- "Choose the checks" (content doc § 4) ---------- */

export interface CheckSpec {
  readonly id: string;
  /** The hypothesis a positive result points to. */
  readonly fav: 0 | 1;
  readonly cls: 'weak' | 'strong' | 'folk';
  /** Possible costs; easy always takes the lowest. */
  readonly cost: readonly number[];
  /** Narrowing: the favoured number is at least this percent. */
  readonly favMin?: number;
  /** Narrowing: favoured minus other is at most this many percentage points. */
  readonly diffMax?: number;
}

export interface OptionSpec {
  readonly id: string;
  /** Points if ● is true, and if ■ is true (`same`: one value for both). */
  readonly a: readonly number[];
  readonly b: readonly number[] | 'same';
  /** Offered on hard only (the third option). */
  readonly hard?: boolean;
}

export interface CheckTemplate {
  readonly id: string;
  readonly hyps: readonly [string, string];
  readonly levels: readonly Difficulty[];
  readonly options: readonly OptionSpec[];
  readonly checks: readonly CheckSpec[];
  readonly retired?: boolean;
}

const ck = (id: string, fav: 0 | 1, cls: CheckSpec['cls'], cost: readonly number[], narrow: { favMin?: number; diffMax?: number } = {}): CheckSpec => ({ id, fav, cls, cost, ...narrow });

export const CHECK_TEMPLATES: readonly CheckTemplate[] = [
  {
    id: 'k-picnic',
    hyps: ['dry', 'rain'],
    levels: ALL,
    options: [
      { id: 'outdoors', a: [12, 14, 16, 18], b: [-8, -10, -12, -14] },
      { id: 'hall', a: [4, 5, 6, 7], b: 'same' },
      { id: 'tent', a: [8, 9, 10], b: [1, 2, 3], hard: true }
    ],
    checks: [ck('sky', 1, 'weak', [1]), ck('barometer', 1, 'weak', [1]), ck('farmer', 1, 'strong', [2]), ck('service', 1, 'strong', [3], { favMin: 85 }), ck('swallows', 1, 'folk', [1])]
  },
  {
    id: 'k-bike',
    hyps: ['sound', 'damaged'],
    levels: ALL,
    options: [
      { id: 'buy', a: [8, 10, 12], b: [-12, -16, -20] },
      { id: 'skip', a: [0], b: 'same' },
      { id: 'offer-less', a: [5, 6], b: [-6, -8], hard: true }
    ],
    checks: [ck('ride', 0, 'weak', [1]), ck('chain', 1, 'weak', [1]), ck('receipts', 0, 'weak', [1], { diffMax: 20 }), ck('mechanic', 1, 'strong', [3, 4], { favMin: 90 }), ck('seller-says', 0, 'folk', [1])]
  },
  {
    id: 'k-seeds',
    hyps: ['good', 'dead'],
    levels: ALL,
    options: [
      { id: 'sow', a: [10, 12, 14], b: [-6, -8, -10] },
      { id: 'fresh', a: [3, 4, 5], b: 'same' }
    ],
    checks: [ck('float', 0, 'weak', [1]), ck('sprout', 0, 'strong', [2]), ck('date', 0, 'weak', [1]), ck('shrivelled', 1, 'weak', [1]), ck('smell', 0, 'folk', [1])]
  },
  {
    id: 'k-melon',
    hyps: ['ripe', 'unripe'],
    levels: ALL,
    options: [
      { id: 'buy', a: [10, 12, 16], b: [-6, -8] },
      { id: 'leave', a: [0], b: 'same' }
    ],
    checks: [ck('knock', 0, 'weak', [1]), ck('smell', 0, 'weak', [1]), ck('soft-end', 0, 'weak', [1]), ck('taste', 0, 'strong', [3], { favMin: 90 }), ck('sticker', 0, 'folk', [1])]
  },
  {
    id: 'k-bread',
    hyps: ['busy', 'quiet'],
    levels: ALL,
    options: [
      { id: 'extra', a: [16, 18, 20], b: [-4, -6, -8] },
      { id: 'normal', a: [5, 6, 7], b: 'same' },
      { id: 'little-extra', a: [10, 12], b: [2, 3], hard: true }
    ],
    checks: [ck('calendar', 0, 'weak', [1]), ck('neighbour', 0, 'weak', [1]), ck('sunny', 0, 'weak', [1]), ck('office', 0, 'strong', [2], { favMin: 80 }), ck('last-week', 0, 'folk', [1])]
  },
  {
    id: 'k-laptop',
    hyps: ['minor', 'major'],
    levels: ALL,
    options: [
      { id: 'repair', a: [10, 12, 14], b: [-8, -10, -12] },
      { id: 'shop', a: [2, 3, 4], b: 'same' },
      { id: 'wait', a: [4, 5], b: [-2, -3], hard: true }
    ],
    checks: [ck('error-code', 1, 'weak', [1]), ck('diagnostics', 1, 'strong', [2]), ck('cable', 0, 'weak', [1]), ck('fan', 1, 'weak', [1]), ck('forum', 0, 'folk', [1])]
  }
];

const CHECKS_BY_ID: ReadonlyMap<string, CheckTemplate> = new Map(CHECK_TEMPLATES.map((t) => [t.id, t]));
export const checkTemplateById = (id: string): CheckTemplate | undefined => (typeof id === 'string' ? CHECKS_BY_ID.get(id) : undefined);
/** Options offered at a difficulty (the third only on hard). */
export const optionsFor = (t: CheckTemplate, difficulty: Difficulty): readonly OptionSpec[] => t.options.filter((o) => !o.hard || difficulty === 'hard');
