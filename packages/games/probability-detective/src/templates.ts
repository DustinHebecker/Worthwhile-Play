/**
 * Language-neutral case templates of mode "Clue by clue" (design § 6, content doc § 3). Texts live in
 * `content/<locale>.ts`, keyed by these ids. Template and clue ids are never reused or removed: a template that should
 * no longer appear gets `retired: true`, so old saves stay valid (design § 14).
 *
 * All numbers are invented for practice; the grids below are the only source of them.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

/** Levels of a clue number for three hypotheses (content doc § 2.3). */
export type Tier = 'hi' | 'mid' | 'lo';

export type ClueSpec =
  | {
      readonly id: string;
      readonly kind: 'normal';
      /** The hypothesis this clue favours when there are two (it always gets the larger number). */
      readonly fav: 0 | 1;
      readonly cls: 'strong' | 'weak';
      /** Levels per hypothesis when the case has three hypotheses (hard). */
      readonly tiers?: readonly [Tier, Tier, Tier];
    }
  | { readonly id: string; readonly kind: 'neutral' }
  | { readonly id: string; readonly kind: 'echo'; readonly of: string };

export interface ClueTemplate {
  readonly id: string;
  /** Hypothesis ids in template order (marks ● ■ ▲); the third is used on hard only. */
  readonly hyps: readonly string[];
  readonly levels: readonly Difficulty[];
  readonly clues: readonly ClueSpec[];
  readonly retired?: boolean;
}

const n = (id: string, fav: 0 | 1, cls: 'strong' | 'weak', tiers?: readonly [Tier, Tier, Tier]): ClueSpec =>
  tiers ? { id, kind: 'normal', fav, cls, tiers } : { id, kind: 'normal', fav, cls };
const neutral = (id: string): ClueSpec => ({ id, kind: 'neutral' });
const ALL: readonly Difficulty[] = DIFFICULTIES;

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
    id: 'c-rain',
    hyps: ['rained', 'dry'],
    levels: ALL,
    clues: [n('wet-grass', 0, 'weak'), n('gauge', 0, 'strong'), n('puddle', 0, 'strong'), n('snails-out', 0, 'weak'), neutral('wind')]
  },
  {
    id: 'c-bird',
    hyps: ['finch', 'sparrow'],
    levels: ALL,
    clues: [n('red-patch', 0, 'strong'), n('ground', 1, 'weak'), n('song', 0, 'weak'), n('group', 1, 'weak'), neutral('morning')]
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
