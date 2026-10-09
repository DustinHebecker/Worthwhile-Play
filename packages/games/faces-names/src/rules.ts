import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Faces & Names: the person meets a few synthetic people one at a time, at their own pace (face, first
 * name, age, job and one detail). They may note which facial feature stands out and write their own
 * association. Then mixed questions follow: face → name, name → face and face → job, each person asked
 * each kind exactly once, with calm feedback after every answer.
 *
 * Faces are procedural: a small set of feature ids (no images, no datasets). Everything (people,
 * faces, question order and options) is generated from the seed at the start and stored in the state.
 * First names are stored as the strings chosen at generation (see `newRound`). Pure and DOM-free.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export interface DifficultyConfig {
  /** People met in the session. */
  readonly people: number;
  /** Choices per question (including the answer). */
  readonly options: number;
  /** Minimum number of differing (non-colour) features between any two faces. */
  readonly minDistance: number;
  /** Pairs of look-alikes: the second face is the first with exactly `minDistance` features changed. */
  readonly lookalikePairs: number;
}

export const CONFIGS: Readonly<Record<Difficulty, DifficultyConfig>> = {
  easy: { people: 4, options: 4, minDistance: 6, lookalikePairs: 0 },
  medium: { people: 6, options: 5, minDistance: 4, lookalikePairs: 2 },
  hard: { people: 8, options: 6, minDistance: 3, lookalikePairs: 4 }
};

// --- faces ---

export const FACE_SHAPES = ['oval', 'round', 'long', 'square', 'heart'] as const;
export const HAIR_STYLES = ['bald', 'buzz', 'short', 'curly', 'wavy', 'long', 'bun', 'headscarf', 'cap'] as const;
export const HAIR_COLOURS = ['black', 'darkbrown', 'brown', 'auburn', 'blond', 'grey'] as const;
export const BROWS = ['straight', 'arched', 'thick'] as const;
export const EYES = ['small', 'large', 'smiling'] as const;
export const NOSES = ['small', 'straight', 'rounded'] as const;
export const MOUTHS = ['slight', 'smile', 'broad'] as const;
export const GLASSES = ['none', 'round', 'square'] as const;
export const FACIAL_HAIR = ['none', 'moustache', 'beard'] as const;
export const EARRINGS = ['none', 'studs', 'hoops'] as const;
export const MARKS = ['none', 'freckles', 'mole'] as const;
/** Skin tones (visual only, never described or used to tell faces apart). */
export const SKIN_TONES = 8;
/** Shirt colours (visual only). */
export const SHIRTS = 6;
/** Hair styles that hide the hair colour (and, for the headscarf, the ears). */
export const COVERED_STYLES: readonly HairStyle[] = ['bald', 'headscarf', 'cap'];
/** Grey hair is only generated from this age on. */
export const GREY_FROM_AGE = 45;
export const MIN_AGE = 22;
export const MAX_AGE = 79;

export type FaceShape = (typeof FACE_SHAPES)[number];
export type HairStyle = (typeof HAIR_STYLES)[number];
export type HairColour = (typeof HAIR_COLOURS)[number];

export interface Face {
  shape: FaceShape;
  skin: number;
  hair: HairStyle;
  hairColour: HairColour;
  brows: (typeof BROWS)[number];
  eyes: (typeof EYES)[number];
  nose: (typeof NOSES)[number];
  mouth: (typeof MOUTHS)[number];
  glasses: (typeof GLASSES)[number];
  facialHair: (typeof FACIAL_HAIR)[number];
  earrings: (typeof EARRINGS)[number];
  mark: (typeof MARKS)[number];
  shirt: number;
}

/** The features that tell faces apart (shape-based, never colour). Also the order of descriptions. */
export const FEATURES = ['shape', 'hair', 'brows', 'eyes', 'nose', 'mouth', 'glasses', 'facialHair', 'earrings', 'mark'] as const;
export type Feature = (typeof FEATURES)[number];
/** Every pair of faces differs in at least one of these (the most visible features). */
export const SALIENT: readonly Feature[] = ['hair', 'glasses', 'facialHair'];

export const FEATURE_VALUES: Readonly<Record<Feature, readonly string[]>> = {
  shape: FACE_SHAPES,
  hair: HAIR_STYLES,
  brows: BROWS,
  eyes: EYES,
  nose: NOSES,
  mouth: MOUTHS,
  glasses: GLASSES,
  facialHair: FACIAL_HAIR,
  earrings: EARRINGS,
  mark: MARKS
};

/** Relative weights for random picks (`none` more common for accessories); uniform when absent. */
const WEIGHTS: Partial<Record<Feature, readonly number[]>> = {
  glasses: [2, 1, 1],
  facialHair: [3, 1, 1],
  earrings: [3, 1, 1],
  mark: [3, 1, 1]
};

function weightedPick<T>(rng: Rng, values: readonly T[], weights?: readonly number[]): T {
  if (!weights) return rng.pick(values);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng.int(1, total);
  for (let i = 0; i < values.length; i++) {
    roll -= weights[i] as number;
    if (roll <= 0) return values[i] as T;
  }
  return values[values.length - 1] as T;
}

/** Whether the hair colour can be seen (not bald, not covered). */
export const hairColourVisible = (face: Pick<Face, 'hair'>): boolean => !COVERED_STYLES.includes(face.hair);

/** Combinations that are not generated: headscarf with facial hair or earrings; grey hair before GREY_FROM_AGE. */
export function isConsistentFace(face: Face, age: number): boolean {
  if (face.hair === 'headscarf' && (face.facialHair !== 'none' || face.earrings !== 'none')) return false;
  return face.hairColour !== 'grey' || age >= GREY_FROM_AGE;
}

/** Number of differing features (FEATURES only; skin, hair colour and shirt never count). */
export function faceDistance(a: Face, b: Face): number {
  let d = 0;
  for (const feature of FEATURES) if (a[feature] !== b[feature]) d++;
  return d;
}

export const salientDistance = (a: Face, b: Face): number => SALIENT.filter((f) => a[f] !== b[f]).length;

/** A random, consistent face for a person of the given age. */
export function randomFace(rng: Rng, age: number): Face {
  const face = {} as Record<string, unknown>;
  for (const feature of FEATURES) face[feature] = weightedPick(rng, FEATURE_VALUES[feature], WEIGHTS[feature]);
  const f = face as unknown as Face;
  f.skin = rng.int(0, SKIN_TONES - 1);
  f.hairColour = rng.pick(age >= GREY_FROM_AGE ? HAIR_COLOURS : HAIR_COLOURS.filter((c) => c !== 'grey'));
  f.shirt = rng.int(0, SHIRTS - 1);
  if (f.hair === 'headscarf') {
    f.facialHair = 'none';
    f.earrings = 'none';
  }
  return f;
}

/**
 * A look-alike of `base`: exactly `changes` features get a different value (skin and hair colour kept),
 * or undefined when the drawn change would be inconsistent (the caller retries).
 */
export function variantFace(rng: Rng, base: Face, changes: number, age: number): Face | undefined {
  const features = rng.shuffle(FEATURES).slice(0, changes);
  // At least one visible difference, so look-alikes stay fair.
  if (!features.some((f) => SALIENT.includes(f))) features[0] = rng.pick(SALIENT);
  const face: Face = { ...base, shirt: rng.int(0, SHIRTS - 1) };
  for (const feature of new Set(features)) {
    const others = FEATURE_VALUES[feature].filter((v) => v !== base[feature]);
    (face as unknown as Record<string, string>)[feature] = rng.pick(others);
  }
  // A younger look-alike of a grey-haired person gets another colour (colour never counts as a difference).
  if (face.hairColour === 'grey' && age < GREY_FROM_AGE) face.hairColour = rng.pick(HAIR_COLOURS.filter((c) => c !== 'grey'));
  if (!isConsistentFace(face, age) || faceDistance(face, base) !== changes) return undefined;
  return face;
}

/** Whether `face` is far enough from every face in `others`. */
export const isDistinct = (face: Face, others: readonly Face[], minDistance: number): boolean =>
  others.every((o) => faceDistance(face, o) >= minDistance && salientDistance(face, o) >= 1);

const MAX_ATTEMPTS = 2000;

/** Faces for the given ages (same order) satisfying the difficulty's distance rules. */
export function generateFaces(rng: Rng, ages: readonly number[], config: DifficultyConfig): Face[] {
  const faces: Face[] = [];
  for (let i = 0; i < ages.length; i++) {
    const age = ages[i] as number;
    const lookalikeOf = i % 2 === 1 && (i - 1) / 2 < config.lookalikePairs ? faces[i - 1] : undefined;
    let face: Face | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !face; attempt++) {
      const candidate = lookalikeOf ? variantFace(rng, lookalikeOf, config.minDistance, age) : randomFace(rng, age);
      if (candidate && isDistinct(candidate, faces, config.minDistance)) face = candidate;
    }
    if (!face) throw new RangeError('Could not generate distinct faces.');
    faces.push(face);
  }
  return faces;
}

// --- people ---

export const JOBS = [
  'architect',
  'nurse',
  'baker',
  'pilot',
  'teacher',
  'gardener',
  'carpenter',
  'doctor',
  'librarian',
  'cook',
  'photographer',
  'electrician',
  'musician',
  'farmer'
] as const;
export type Job = (typeof JOBS)[number];

export const CONTEXTS = [
  'climbing',
  'choir',
  'neighbour',
  'cooking',
  'chess',
  'running',
  'books',
  'pottery',
  'garden',
  'dogs',
  'train',
  'language'
] as const;
export type Context = (typeof CONTEXTS)[number];

export interface Person {
  name: string;
  age: number;
  job: Job;
  context: Context;
  face: Face;
}

export const NAME_MAX = 40;
export const NOTE_MAX = 120;

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
// eslint-disable-next-line no-control-regex
const CONTROL_ALL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;

/** A displayable first name: trimmed, 1..NAME_MAX characters, no control characters. */
export const isName = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() === value && value.length > 0 && Array.from(value).length <= NAME_MAX && !CONTROL.test(value);

/**
 * Plain-text note: control characters (including line breaks) become spaces, cut to NOTE_MAX code points
 * (never splitting a character). Idempotent; never throws.
 */
export function sanitizeNote(value: unknown): string {
  if (typeof value !== 'string') return '';
  const chars = Array.from(value.replace(CONTROL_ALL, ' '));
  return chars.length > NOTE_MAX ? chars.slice(0, NOTE_MAX).join('') : chars.join('');
}

/** Picks `count` names from the pool, preferring names that start with different characters. */
export function pickNames(rng: Rng, pool: readonly string[], count: number): string[] {
  const unique = [...new Set(pool.filter(isName))];
  if (unique.length < count) throw new RangeError('Not enough names.');
  const shuffled = rng.shuffle(unique);
  const chosen: string[] = [];
  const initials = new Set<string>();
  for (const name of shuffled) {
    const initial = Array.from(name)[0] as string;
    if (chosen.length < count && !initials.has(initial)) {
      chosen.push(name);
      initials.add(initial);
    }
  }
  for (const name of shuffled) if (chosen.length < count && !chosen.includes(name)) chosen.push(name);
  return chosen;
}

// --- questions ---

export const QUESTION_TYPES = ['name', 'face', 'job'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** `name`: the face is shown, a name is chosen; `face`: the name is shown, a face is chosen (options are person indices). */
export interface PersonQuestion {
  type: 'name' | 'face';
  person: number;
  options: number[];
}
/** `job`: the face is shown, a job is chosen. */
export interface JobQuestion {
  type: 'job';
  person: number;
  options: Job[];
}
export type Question = PersonQuestion | JobQuestion;

/** Other people of the session, closest-looking faces first (ties in random order). */
export function nearestPeople(rng: Rng, people: readonly Person[], person: number): number[] {
  const face = (people[person] as Person).face;
  const others = rng.shuffle(people.map((_, i) => i).filter((i) => i !== person));
  return others
    .map((i, order) => ({ i, order, d: faceDistance(face, (people[i] as Person).face) }))
    .sort((a, b) => a.d - b.d || a.order - b.order)
    .map((x) => x.i);
}

export function makeQuestion(rng: Rng, people: readonly Person[], person: number, type: QuestionType, options: number): Question {
  if (type === 'job') {
    const answer = (people[person] as Person).job;
    const used = rng.shuffle(people.map((p) => p.job).filter((j) => j !== answer));
    const unused = rng.shuffle(JOBS.filter((j) => !people.some((p) => p.job === j)));
    return { type, person, options: rng.shuffle([answer, ...[...used, ...unused].slice(0, options - 1)]) };
  }
  const distractors = nearestPeople(rng, people, person).slice(0, options - 1);
  return { type, person, options: rng.shuffle([person, ...distractors]) };
}

/**
 * Three rounds; every person appears once per round and gets each question type exactly once over the
 * rounds. The order within a round is random, and the same person is never asked twice in a row.
 */
export function generateQuestions(rng: Rng, people: readonly Person[], options: number): Question[] {
  const offsets = people.map(() => rng.int(0, QUESTION_TYPES.length - 1));
  const questions: Question[] = [];
  let last = -1;
  for (let round = 0; round < QUESTION_TYPES.length; round++) {
    const order = rng.shuffle(people.map((_, i) => i));
    if (order[0] === last) [order[0], order[1]] = [order[1] as number, order[0]];
    for (const p of order) {
      const type = QUESTION_TYPES[((offsets[p] as number) + round) % QUESTION_TYPES.length] as QuestionType;
      questions.push(makeQuestion(rng, people, p, type, options));
    }
    last = order[order.length - 1] as number;
  }
  return questions;
}

/** The value that answers a question: the person index (name/face) or their job. */
export const answerValue = (people: readonly Person[], q: Question): number | Job => (q.type === 'job' ? (people[q.person] as Person).job : q.person);

/** Position of the correct option. */
export const correctOption = (people: readonly Person[], q: Question): number => (q.options as (number | string)[]).indexOf(answerValue(people, q));

// --- state ---

export const PHASES = ['study', 'test', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

export interface FacesNamesState {
  seed: number;
  difficulty: Difficulty;
  phase: Phase;
  /** study: person shown; test: question shown; finished: number of questions. */
  index: number;
  people: Person[];
  /** The feature the person said stands out, per person (or null). */
  standout: (Feature | null)[];
  /** The person's own association per person (plain text, may be empty; never graded). */
  notes: string[];
  questions: Question[];
  /** Chosen option position per answered question. answers.length is index (unanswered) or index + 1 (answered). */
  answers: number[];
  /** Whether the person's note was shown as a hint before answering, per question. */
  hints: boolean[];
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

/**
 * Deterministically generates a complete session. The first names come from `namePool` (the UI
 * language's list) and are stored as strings, so a session keeps its names even if the UI language
 * changes before it ends (the learned name must not change under the learner).
 */
export function newRound(seed: number, difficulty: Difficulty, namePool: readonly string[]): FacesNamesState {
  const config = CONFIGS[difficulty];
  const rng = createRng(seed);
  const names = pickNames(rng, namePool, config.people);
  const ages = names.map(() => rng.int(MIN_AGE, MAX_AGE));
  const faces = generateFaces(rng, ages, config);
  const jobs = rng.shuffle(JOBS).slice(0, config.people);
  const people: Person[] = names.map((name, i) => ({
    name,
    age: ages[i] as number,
    job: jobs[i] as Job,
    context: rng.pick(CONTEXTS),
    face: faces[i] as Face
  }));
  // Look-alikes were generated next to each other; meet people in random order.
  const shuffled = rng.shuffle(people);
  const questions = generateQuestions(rng, shuffled, config.options);
  return {
    seed: seed >>> 0,
    difficulty,
    phase: 'study',
    index: 0,
    people: shuffled,
    standout: shuffled.map(() => null),
    notes: shuffled.map(() => ''),
    questions,
    answers: [],
    hints: questions.map(() => false)
  };
}

/** Identity of a feature value within a session (hair includes its colour when visible). */
const featureValue = (face: Face, feature: Feature): string =>
  feature === 'hair' && hairColourVisible(face) ? `${face.hair}:${face.hairColour}` : face[feature];

export const STANDOUT_OPTIONS = 4;

/**
 * Up to STANDOUT_OPTIONS features of this face offered for "What stands out?": present features only
 * (no `none`), rarest within the session first (attending to what is distinctive), then FEATURES order.
 */
export function standoutOptions(people: readonly Person[], person: number): Feature[] {
  const face = (people[person] as Person).face;
  return FEATURES.filter((f) => face[f] !== 'none')
    .map((f, order) => ({ f, order, shared: people.filter((p) => featureValue(p.face, f) === featureValue(face, f)).length }))
    .sort((a, b) => a.shared - b.shared || a.order - b.order)
    .slice(0, STANDOUT_OPTIONS)
    .map((x) => x.f);
}

/** Study: show the next person, or start the questions after the last one. */
export function nextPerson(state: FacesNamesState): FacesNamesState {
  if (state.phase !== 'study') return state;
  if (state.index < state.people.length - 1) return { ...state, index: state.index + 1 };
  return { ...state, phase: 'test', index: 0 };
}

/** Study: show the previous person again. */
export function previousPerson(state: FacesNamesState): FacesNamesState {
  if (state.phase !== 'study' || state.index === 0) return state;
  return { ...state, index: state.index - 1 };
}

/** Study: stores the (sanitized) note for the person shown. */
export function setNote(state: FacesNamesState, text: unknown): FacesNamesState {
  if (state.phase !== 'study') return state;
  const note = sanitizeNote(text);
  if (state.notes[state.index] === note) return state;
  const notes = [...state.notes];
  notes[state.index] = note;
  return { ...state, notes };
}

/** Study: chooses the feature that stands out for the person shown; choosing it again clears it. */
export function toggleStandout(state: FacesNamesState, feature: Feature): FacesNamesState {
  if (state.phase !== 'study' || !standoutOptions(state.people, state.index).includes(feature)) return state;
  const standout = [...state.standout];
  standout[state.index] = standout[state.index] === feature ? null : feature;
  return { ...state, standout };
}

/** Whether the current question's person has a note or a chosen feature that could be shown. */
export function hasHint(state: FacesNamesState, question = state.index): boolean {
  const q = state.questions[question];
  if (!q) return false;
  return (state.notes[q.person] ?? '').trim() !== '' || (state.standout[q.person] ?? null) !== null;
}

export const isAnswered = (state: FacesNamesState): boolean => state.phase === 'test' && state.answers.length > state.index;

/** Test: shows the person's own note (and noticed feature) for the current, unanswered question. */
export function showHint(state: FacesNamesState): FacesNamesState {
  if (state.phase !== 'test' || isAnswered(state) || state.hints[state.index] || !hasHint(state)) return state;
  const hints = [...state.hints];
  hints[state.index] = true;
  return { ...state, hints };
}

/** Test: chooses option `position` for the current question (once). */
export function answer(state: FacesNamesState, position: number): FacesNamesState {
  if (state.phase !== 'test' || isAnswered(state)) return state;
  const q = state.questions[state.index] as Question;
  if (!isInt(position, 0, q.options.length - 1)) return state;
  return { ...state, answers: [...state.answers, position] };
}

/** Test: after an answer, moves to the next question, or finishes after the last one. */
export function nextQuestion(state: FacesNamesState): FacesNamesState {
  if (!isAnswered(state)) return state;
  const index = state.index + 1;
  return { ...state, index, phase: index >= state.questions.length ? 'finished' : 'test' };
}

export const isCorrect = (state: FacesNamesState, question: number): boolean => {
  const q = state.questions[question];
  return q !== undefined && state.answers[question] === correctOption(state.people, q);
};

export interface Score {
  answered: number;
  correct: number;
  total: number;
  hints: number;
}

export function score(state: FacesNamesState): Score {
  let correct = 0;
  state.answers.forEach((_, i) => {
    if (isCorrect(state, i)) correct++;
  });
  return { answered: state.answers.length, correct, total: state.questions.length, hints: state.hints.filter(Boolean).length };
}

export interface PersonResult {
  /** Per question type: true/false once answered, undefined before. */
  results: Partial<Record<QuestionType, boolean>>;
  hints: number;
}

/** Per person (in study order): the outcome of each of their questions and how often their hint was used. */
export function resultsByPerson(state: FacesNamesState): PersonResult[] {
  const out: PersonResult[] = state.people.map(() => ({ results: {}, hints: 0 }));
  state.questions.forEach((q, i) => {
    const r = out[q.person] as PersonResult;
    if (i < state.answers.length) r.results[q.type] = isCorrect(state, i);
    if (state.hints[i]) r.hints++;
  });
  return out;
}

// --- description (message keys only; the view translates) ---

export interface DescriptionPart {
  /** Message key of the feature phrase, e.g. `f.hair.curly`. */
  key: string;
  /** Message key of the hair colour, when the part is hair with a visible colour. */
  colour?: string;
}

/** The phrase for one feature of a face (undefined for `none`). */
export function featurePart(face: Face, feature: Feature): DescriptionPart | undefined {
  const value = face[feature];
  if (value === 'none') return undefined;
  const part: DescriptionPart = { key: `f.${feature}.${value}` };
  if (feature === 'hair' && hairColourVisible(face)) part.colour = `f.colour.${face.hairColour}`;
  return part;
}

/** Words describing a face (every distinguishing feature, hair colour when visible; never skin). */
export const describeFace = (face: Face): DescriptionPart[] =>
  FEATURES.map((f) => featurePart(face, f)).filter((p): p is DescriptionPart => p !== undefined);

// --- validation of untrusted saves ---

const isFace = (value: unknown): value is Face => {
  if (!isRecord(value)) return false;
  for (const f of FEATURES) if (!isOneOf(value[f] as string, FEATURE_VALUES[f])) return false;
  return isOneOf(value.hairColour, HAIR_COLOURS) && isInt(value.skin, 0, SKIN_TONES - 1) && isInt(value.shirt, 0, SHIRTS - 1);
};

const isPerson = (value: unknown): value is Person =>
  isRecord(value) &&
  isName(value.name) &&
  isInt(value.age, MIN_AGE, MAX_AGE) &&
  isOneOf(value.job, JOBS) &&
  isOneOf(value.context, CONTEXTS) &&
  isFace(value.face) &&
  isConsistentFace(value.face, value.age);

const isNote = (value: unknown): value is string => typeof value === 'string' && sanitizeNote(value) === value;

function isValidQuestion(value: unknown, people: readonly Person[], options: number): value is Question {
  if (!isRecord(value) || !isOneOf(value.type, QUESTION_TYPES) || !isInt(value.person, 0, people.length - 1)) return false;
  const opts = value.options;
  if (!Array.isArray(opts) || opts.length !== options || new Set(opts).size !== options) return false;
  const valid =
    value.type === 'job'
      ? opts.every((o) => isOneOf(o, JOBS))
      : opts.every((o) => isInt(o, 0, people.length - 1));
  return valid && correctOption(people, value as unknown as Question) >= 0;
}

/** Structural validation of untrusted persisted data. Never throws. */
export function isValidFacesNamesState(value: unknown): value is FacesNamesState {
  try {
    if (!isRecord(value)) return false;
    if (!isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES) || !isOneOf(value.phase, PHASES)) return false;
    const config = CONFIGS[value.difficulty];
    const { people, standout, notes, questions, answers, hints, phase, index } = value;
    if (!isArrayOf(people, isPerson, config.people)) return false;
    if (new Set(people.map((p) => p.name)).size !== people.length || new Set(people.map((p) => p.job)).size !== people.length) return false;
    for (let i = 0; i < people.length; i++)
      for (let j = i + 1; j < people.length; j++)
        if (!isDistinct((people[i] as Person).face, [(people[j] as Person).face], config.minDistance)) return false;
    if (!Array.isArray(standout) || standout.length !== people.length) return false;
    if (!standout.every((f, i) => f === null || (isOneOf(f, FEATURES) && standoutOptions(people, i).includes(f)))) return false;
    if (!isArrayOf(notes, isNote, people.length)) return false;
    const total = people.length * QUESTION_TYPES.length;
    if (!Array.isArray(questions) || questions.length !== total) return false;
    const asked = new Set<string>();
    for (const q of questions as unknown[]) {
      if (!isValidQuestion(q, people, config.options)) return false;
      asked.add(`${q.person}:${q.type}`);
    }
    if (asked.size !== total) return false;
    const qs = questions as Question[];
    if (!Array.isArray(answers) || answers.length > total) return false;
    if (!answers.every((a, i) => isInt(a, 0, (qs[i] as Question).options.length - 1))) return false;
    if (!isArrayOf(hints, (h: unknown): h is boolean => typeof h === 'boolean', total)) return false;
    if (!isInt(index, 0, total)) return false;
    const s = { people, standout, notes, questions: qs } as FacesNamesState;
    if (!hints.every((h, i) => !h || (i <= index && hasHint(s, i)))) return false;
    switch (phase) {
      case 'study':
        return index < people.length && answers.length === 0 && hints.every((h) => !h);
      case 'test':
        return index < total && (answers.length === index || answers.length === index + 1);
      default:
        return index === total && answers.length === total;
    }
  } catch {
    return false;
  }
}
