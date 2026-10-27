/** Topics, levels, round lengths and registers (design § 5, § 7). */

export const LEVELS = ['easy', 'medium', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

export const QUIZ_TOPICS = ['intervals', 'chords', 'stability', 'melody', 'rhythm', 'build'] as const;
export type QuizTopic = (typeof QUIZ_TOPICS)[number];
export const TOPICS = [...QUIZ_TOPICS, 'keyboard'] as const;
export type Topic = (typeof TOPICS)[number];
/** Topics with a choice between hearing and reading the question. */
export const SENSE_TOPICS = ['intervals', 'chords', 'stability', 'melody', 'rhythm'] as const;

export const SENSES = ['ear', 'eye'] as const;
export type Senses = (typeof SENSES)[number];

export const ROUND_LENGTH: Readonly<Record<QuizTopic, number>> = { intervals: 10, chords: 10, stability: 10, melody: 10, rhythm: 8, build: 6 };

/** Treble items: every note in C4–A5 (design § 7). */
export const TREBLE_LOW = 60;
export const TREBLE_HIGH = 81;
/** Stability dyads: the lower note in C4–G4. */
export const DYAD_ROOT_HIGH = 67;
/** Cadence tonics in C4–G4, so the bass stays in C3–C4 and the upper voices ≤ G5. */
export const CADENCE_TONIC_HIGH = 67;
/** Build roots in C4–B4; answers on the two-octave keyboard C4–B5. */
export const BUILD_ROOT_HIGH = 71;
export const KEYS_LOW = 60;
export const KEYS_HIGH = 83;
/** Free keyboard: C2–B5 (fundamentals 65–988 Hz); the visible octave starts at C of `base` 2…5. */
export const FREE_LOW = 36;
export const FREE_HIGH = 83;
export const BASE_MIN = 2;
export const BASE_MAX = 5;
/** At most this many notes held or selected. */
export const MAX_KEYS = 12;
