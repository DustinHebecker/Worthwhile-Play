/** Shared fairness checks of a generated round (design § 7), used by the fast and the slow generator tests. */
import { ROUND_LENGTH, type Level, type QuizTopic } from '../src/levels';
import { CELLS, RHYTHM_OPTIONS, distance, slots } from '../src/rhythm';
import { answerIndex, answerKey, optionCount, rootOf, specKey, specProblem, type ChoiceSpec, type Spec } from '../src/spec';
import { midiOf } from '../src/spelling';
import { classOf, pitchClass } from '../src/theory';

/** Kinds a topic may contain at a level. */
export const KINDS: Readonly<Record<QuizTopic, Readonly<Record<Level, readonly string[]>>>> = {
  intervals: { easy: ['interval'], medium: ['interval'], hard: ['interval'] },
  chords: { easy: ['chord'], medium: ['chord', 'scale'], hard: ['chord', 'scale'] },
  stability: { easy: ['pair'], medium: ['pair'], hard: ['pair', 'cadence'] },
  melody: { easy: ['contour'], medium: ['contour'], hard: ['changed'] },
  rhythm: { easy: ['rhythm'], medium: ['rhythm'], hard: ['rhythm'] },
  build: { easy: ['build'], medium: ['build'], hard: ['build'] }
};

/** The number of possible answer values of a topic and level (k in the balance rule). */
export const ANSWER_VALUES: Readonly<Record<QuizTopic, Readonly<Record<Level, number>>>> = {
  intervals: { easy: 4, medium: 8, hard: 12 },
  chords: { easy: 2, medium: 6, hard: 11 },
  stability: { easy: 2, medium: 2, hard: 5 },
  melody: { easy: 4, medium: 16, hard: 4 },
  rhythm: { easy: 25, medium: 49, hard: 300 },
  build: { easy: 8, medium: 4, hard: 6 }
};

/** All fairness problems of a round (empty when fair). */
export function fairnessProblems(specs: readonly Spec[], topic: QuizTopic, level: Level): string[] {
  const problems: string[] = [];
  const n = ROUND_LENGTH[topic];
  if (specs.length !== n) problems.push(`length ${specs.length}`);
  const keys = specs.map(answerKey);
  const cap = Math.ceil(n / ANSWER_VALUES[topic][level]) + 1;
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  for (const [k, c] of counts) if (c > cap) problems.push(`answer ${k} ${c}× > ${cap}`);
  for (let i = 2; i < keys.length; i++) if (keys[i] === keys[i - 1] && keys[i] === keys[i - 2]) problems.push(`three ${keys[i]} in a row at ${i}`);
  if (new Set(specs.map(specKey)).size !== specs.length) problems.push('duplicate item');
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i]!;
    if (!KINDS[topic][level].includes(spec.k)) problems.push(`kind ${spec.k} at ${i}`);
    const p = specProblem(spec, level);
    if (p) problems.push(`item ${i}: ${p}`);
    if (spec.k !== 'build') {
      const answer = answerIndex(spec as ChoiceSpec);
      if (answer < 0 || answer >= optionCount(spec as ChoiceSpec)) problems.push(`answer missing at ${i}`);
    }
    if (spec.k === 'pair' && (spec.first.ivl === 'P4' || spec.second.ivl === 'P4' || !classOf(spec.first.ivl) || !classOf(spec.second.ivl))) problems.push(`pair class at ${i}`);
    if (spec.k === 'rhythm') {
      const { count, distance: min } = RHYTHM_OPTIONS[level];
      if (spec.options.length !== count) problems.push(`rhythm count at ${i}`);
      for (let x = 0; x < spec.options.length; x++)
        for (let y = x + 1; y < spec.options.length; y++) if (distance(spec.options[x]!, spec.options[y]!) < min) problems.push(`rhythm distance at ${i}`);
      for (const o of spec.options) if (slots(o).length !== 8) problems.push(`rhythm sum at ${i}`);
      void CELLS;
    }
    if (i > 0) {
      const a = rootOf(specs[i - 1]!);
      const b = rootOf(spec);
      if (a && b && pitchClass(midiOf(a)) === pitchClass(midiOf(b))) problems.push(`same root at ${i}`);
    }
  }
  return problems;
}
