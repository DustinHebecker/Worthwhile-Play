/**
 * Language-independent scenario data for Audience Switch (ADR 0010): ids, per-audience tags,
 * the gold opening fact and the kind of each answer message. All wording lives in
 * `content/<locale>.ts`, keyed by these ids, so a save stays valid when the UI language changes.
 */

/** Append only: ids are stored in saves. */
export const AUDIENCES = ['developer', 'projectManager', 'customer', 'executive', 'child', 'expert', 'layperson', 'parent', 'neighbour', 'patient', 'colleague'] as const;
export type AudienceId = (typeof AUDIENCES)[number];

/** `must` = the audience needs it, `optional` = neutral, `leave` = they do not need it. */
export type Tag = 'must' | 'optional' | 'leave';

/** The fitting message is always `fit`; the other two are written with one typical flaw each. */
export const FLAWS = ['tooMuch', 'missing', 'condescending'] as const;
export type Flaw = (typeof FLAWS)[number];
export type MessageId = 'fit' | Flaw;

export interface FactDef {
  readonly id: string;
  /** Subtle cards (tempting but unneeded, or easy to overlook) only appear on the hard level. */
  readonly subtle: boolean;
  readonly tags: Readonly<Partial<Record<AudienceId, Tag>>>;
}

export interface ScenarioDef {
  readonly id: string;
  /** Three audiences; two of them are deliberately close, the `far` pair is used on the easy level. */
  readonly audiences: readonly AudienceId[];
  readonly far: readonly [AudienceId, AudienceId];
  readonly facts: readonly FactDef[];
  /** Gold "what comes first" fact per audience (always a non-subtle `must` fact). */
  readonly lead: Readonly<Partial<Record<AudienceId, string>>>;
  /** The two flawed message kinds written for each audience. */
  readonly flaws: Readonly<Partial<Record<AudienceId, readonly [Flaw, Flaw]>>>;
}

const TAG_LETTERS: Readonly<Record<string, Tag>> = { M: 'must', O: 'optional', L: 'leave' };

/** `tags` holds one letter per scenario audience, in order: M = must, O = optional, L = leave out. */
function scenario(
  id: string,
  audiences: readonly [AudienceId, AudienceId, AudienceId],
  far: readonly [AudienceId, AudienceId],
  facts: readonly (readonly [id: string, tags: string, subtle?: 'subtle'])[],
  lead: readonly [string, string, string],
  flaws: readonly (readonly [Flaw, Flaw])[]
): ScenarioDef {
  const zip = <T>(values: readonly T[]) => Object.fromEntries(audiences.map((a, i) => [a, values[i] as T])) as Partial<Record<AudienceId, T>>;
  return {
    id,
    audiences,
    far,
    facts: facts.map(([factId, tags, subtle]) => ({
      id: factId,
      subtle: subtle === 'subtle',
      tags: zip([...tags.replace(/\s/g, '')].map((letter) => TAG_LETTERS[letter] as Tag))
    })),
    lead: zip(lead),
    flaws: zip(flaws)
  };
}

export const SCENARIOS: readonly ScenarioDef[] = [
  scenario(
    'migration',
    ['developer', 'projectManager', 'customer'],
    ['developer', 'customer'],
    [
      ['newDate', 'O M M'],
      ['cause', 'M O L'],
      ['noLoss', 'O M M'],
      ['encoding', 'M L L'],
      ['apology', 'L L O'],
      ['regression', 'M O L'],
      ['buffer', 'L M L', 'subtle'],
      ['library', 'O L L', 'subtle']
    ],
    ['encoding', 'newDate', 'noLoss'],
    [['missing', 'condescending'], ['tooMuch', 'missing'], ['tooMuch', 'condescending']]
  ),
  scenario(
    'skyBlue',
    ['child', 'layperson', 'expert'],
    ['child', 'expert'],
    [
      ['sunlight', 'M M O'],
      ['scatter', 'M M O'],
      ['rayleigh', 'L L M'],
      ['sunset', 'O O O'],
      ['everywhere', 'M O L'],
      ['violet', 'L O M'],
      ['molecules', 'L O M', 'subtle'],
      ['ocean', 'L L L', 'subtle']
    ],
    ['sunlight', 'scatter', 'rayleigh'],
    [['tooMuch', 'missing'], ['tooMuch', 'condescending'], ['condescending', 'missing']]
  ),
  scenario(
    'clubRoof',
    ['executive', 'projectManager', 'layperson'],
    ['projectManager', 'layperson'],
    [
      ['cost', 'M O O'],
      ['decision', 'M O O'],
      ['storage', 'L O M'],
      ['fees', 'O L M'],
      ['schedule', 'L M O'],
      ['tiles', 'L O L'],
      ['reserve', 'M L L', 'subtle'],
      ['volunteer', 'L L L', 'subtle']
    ],
    ['decision', 'schedule', 'storage'],
    [['tooMuch', 'missing'], ['tooMuch', 'missing'], ['tooMuch', 'condescending']]
  ),
  scenario(
    'shopOutage',
    ['projectManager', 'executive', 'customer'],
    ['projectManager', 'customer'],
    [
      ['duration', 'O M O'],
      ['revenue', 'O M L'],
      ['cause', 'M L L'],
      ['fixed', 'O O M'],
      ['renewal', 'M M L'],
      ['voucher', 'L O M'],
      ['approval', 'O M L', 'subtle'],
      ['competitor', 'L L L', 'subtle']
    ],
    ['renewal', 'revenue', 'fixed'],
    [['tooMuch', 'missing'], ['tooMuch', 'missing'], ['tooMuch', 'condescending']]
  ),
  scenario(
    'signalFault',
    ['layperson', 'expert', 'executive'],
    ['layperson', 'expert'],
    [
      ['delay', 'M O M'],
      ['bus', 'M O O'],
      ['tickets', 'M L L'],
      ['signal', 'L M O'],
      ['singleTrack', 'L M O'],
      ['repair', 'O M M'],
      ['construction', 'L O M', 'subtle'],
      ['staff', 'L L O', 'subtle']
    ],
    ['delay', 'signal', 'delay'],
    [['tooMuch', 'missing'], ['condescending', 'missing'], ['tooMuch', 'missing']]
  ),
  scenario(
    'kettleLid',
    ['customer', 'executive', 'expert'],
    ['customer', 'expert'],
    [
      ['batches', 'M O O'],
      ['risk', 'M M O'],
      ['stop', 'M O L'],
      ['hinge', 'L L M'],
      ['free', 'M O L'],
      ['cost', 'L M L'],
      ['supplier', 'L O M', 'subtle'],
      ['injuries', 'O M O', 'subtle']
    ],
    ['batches', 'risk', 'hinge'],
    [['tooMuch', 'condescending'], ['tooMuch', 'missing'], ['missing', 'condescending']]
  ),
  // --- Appended later (append only: existing ids are stored in saves) ---
  scenario(
    'renovation',
    ['customer', 'projectManager', 'neighbour'],
    ['projectManager', 'neighbour'],
    [
      ['delay', 'M M O'],
      ['tiles', 'L M L'],
      ['order', 'O M L'],
      ['water', 'M M M'],
      ['noise', 'O O M'],
      ['cost', 'M L L'],
      ['supplierHistory', 'L L L', 'subtle'],
      ['skip', 'O M M', 'subtle']
    ],
    ['delay', 'order', 'water'],
    [['tooMuch', 'condescending'], ['missing', 'condescending'], ['tooMuch', 'missing']]
  ),
  scenario(
    'schoolTrip',
    ['child', 'parent', 'colleague'],
    ['child', 'colleague'],
    [
      ['newDate', 'M M M'],
      ['bus', 'L O O'],
      ['lunch', 'M M L'],
      ['form', 'L M O'],
      ['price', 'L M L'],
      ['cover', 'L L M'],
      ['rain', 'M M L', 'subtle'],
      ['complaint', 'L L L', 'subtle']
    ],
    ['newDate', 'newDate', 'cover'],
    [['tooMuch', 'missing'], ['tooMuch', 'condescending'], ['tooMuch', 'missing']]
  ),
  scenario(
    'practiceMonday',
    ['patient', 'executive', 'colleague'],
    ['patient', 'executive'],
    [
      ['moved', 'M M M'],
      ['away', 'O O O'],
      ['urgent', 'M O M'],
      ['calls', 'L M M'],
      ['reply', 'M L O'],
      ['hours', 'L M L'],
      ['vip', 'L L L', 'subtle'],
      ['texts', 'L O M', 'subtle']
    ],
    ['moved', 'hours', 'calls'],
    [['tooMuch', 'condescending'], ['tooMuch', 'missing'], ['missing', 'condescending']]
  ),
  scenario(
    'libraryHours',
    ['customer', 'colleague', 'executive'],
    ['customer', 'executive'],
    [
      ['hours', 'M M M'],
      ['cards', 'M L O'],
      ['budget', 'O O L'],
      ['returns', 'M O L'],
      ['shifts', 'L M O'],
      ['savings', 'L M M'],
      ['petition', 'L O M', 'subtle'],
      ['heating', 'L L O', 'subtle']
    ],
    ['hours', 'shifts', 'savings'],
    [['tooMuch', 'condescending'], ['missing', 'tooMuch'], ['tooMuch', 'missing']]
  )
];

export function scenarioById(id: string): ScenarioDef | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
