/**
 * Seeded round generation (design § 7). `generateRound(seed, topic, level)` is pure and deterministic. Fairness
 * (property-tested): the answer is among distinct options; the answers of a round are planned first as a balanced
 * deck (no value more than ⌈N/k⌉ times, never three times in a row); no two identical items; the root changes from
 * one item to the next. Each item is drawn by bounded rejection (200 draws), then the root/duplicate constraints are
 * relaxed, and a fixed item on C is the last resort (never needed in the slow test over 2,000 seeds).
 */
import { createRng, type Rng } from '@wp/game-core';
import { CADENCE_TONIC_HIGH, DYAD_ROOT_HIGH, BUILD_ROOT_HIGH, ROUND_LENGTH, TREBLE_HIGH, TREBLE_LOW, type Level, type QuizTopic } from './levels';
import { allPatterns, distance, RHYTHM_OPTIONS } from './rhythm';
import {
  BUILD_CHORDS,
  BUILD_INTERVALS,
  BUILD_SCALES,
  BUILD_SEVENTHS,
  CHANGED_POSITIONS,
  CHORD_POOL,
  CONTOURS_3,
  INTERVAL_POOL,
  SCALE_POOL,
  answerKey,
  contourOf,
  rootOf,
  specKey,
  specProblem,
  type Dir,
  type Spec
} from './spec';
import { ROOT_POOL, isRare, midiOf, spellAt, spellChordVoicing, spellNear, type Spelled } from './spelling';
import { CADENCES, CLASS_MEMBERS, PAIR_COMBOS, SCALE_TONES, SEMITONES, pitchClass, type CadenceId, type ChordId, type IntervalId, type ScaleId } from './theory';

const ATTEMPTS = 200;

/** Answers for n items from a pool: a shuffled deck (each value ≤ ⌈n/k⌉ times) without three equal in a row. */
export function answerSequence<T>(rng: Rng, pool: readonly T[], n: number): T[] {
  const copies = Math.ceil(n / pool.length);
  const deck: T[] = [];
  for (let c = 0; c < copies; c++) deck.push(...pool);
  const ok = (seq: readonly T[]) => seq.every((x, i) => i < 2 || x !== seq[i - 1] || x !== seq[i - 2]);
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const seq = rng.shuffle(deck).slice(0, n);
    if (ok(seq)) return seq;
  }
  // Round robin never repeats a value twice in a row (pools have ≥ 2 values).
  const start = rng.int(0, pool.length - 1);
  return Array.from({ length: n }, (_, i) => pool[(start + i) % pool.length]!);
}

/** The positions (of n) that get the second kind, `count` of them, at random. */
const positions = (rng: Rng, n: number, count: number): Set<number> => new Set(rng.shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, count));

/** A pool root (by pitch class) placed at a random MIDI note of that class within [low, high], or undefined. */
function placeRoot(rng: Rng, pc: number, low: number, high: number): Spelled | undefined {
  const { l, a } = ROOT_POOL[pc]!;
  const options: Spelled[] = [];
  for (let o = 2; o <= 6; o++) {
    const s: Spelled = { l, a, o };
    const m = midiOf(s);
    if (m >= low && m <= high) options.push(s);
  }
  return options.length ? rng.pick(options) : undefined;
}

const randomRoot = (rng: Rng, low: number, high: number) => placeRoot(rng, rng.int(0, 11), low, high);

/* ---------- Per-topic draws (one candidate item for a planned answer) ---------- */

function drawInterval(rng: Rng, level: Level, ivl: IntervalId): Spec | undefined {
  const dir: Dir = level === 'easy' ? 'up' : level === 'medium' ? (rng.next() < 0.3 ? 'together' : 'up') : rng.pick(['up', 'down', 'together'] as const);
  const semis = SEMITONES[ivl];
  const root = dir === 'down' ? randomRoot(rng, TREBLE_LOW + semis, TREBLE_HIGH) : randomRoot(rng, TREBLE_LOW, TREBLE_HIGH - semis);
  return root && { k: 'interval', root, ivl, dir, options: INTERVAL_POOL[level] };
}

function drawChord(rng: Rng, level: Level, q: ChordId): Spec | undefined {
  const inv = (level === 'hard' && ['maj', 'min', 'dim', 'aug'].includes(q) ? rng.int(0, 2) : 0) as 0 | 1 | 2;
  const pc = rng.int(0, 11);
  const fits: Spelled[] = [];
  for (let o = 3; o <= 5; o++) {
    const root = { ...ROOT_POOL[pc]!, o };
    const notes = spellChordVoicing(root, q, inv);
    if (notes && notes.every((n) => midiOf(n) >= TREBLE_LOW && midiOf(n) <= TREBLE_HIGH)) fits.push(root);
  }
  return fits.length ? { k: 'chord', root: rng.pick(fits), q, inv, options: CHORD_POOL[level] } : undefined;
}

function drawScale(rng: Rng, level: Level, s: ScaleId): Spec | undefined {
  const tonic = randomRoot(rng, TREBLE_LOW, TREBLE_HIGH - 12);
  return tonic && { k: 'scale', tonic, s, options: SCALE_POOL[level] };
}

function drawPair(rng: Rng, level: Level, answer: number): Spec | undefined {
  const [stableClass, tenseClass] = rng.pick(PAIR_COMBOS[level]);
  const stable = rng.pick(CLASS_MEMBERS[stableClass]);
  const tense = rng.pick(CLASS_MEMBERS[tenseClass]);
  const root = randomRoot(rng, TREBLE_LOW, DYAD_ROOT_HIGH);
  if (!root) return undefined;
  const s = { root, ivl: stable };
  const t = { root, ivl: tense };
  return answer === 0 ? { k: 'pair', first: s, second: t } : { k: 'pair', first: t, second: s };
}

function drawCadence(rng: Rng, c: CadenceId): Spec | undefined {
  const key = randomRoot(rng, TREBLE_LOW, CADENCE_TONIC_HIGH);
  return key && { k: 'cadence', key, c, options: CADENCES };
}

/** Major-scale notes of a pool key within the treble register, low to high (spelled per degree). */
function scaleNotes(pc: number, level: Level): Spelled[] | undefined {
  const tonic: Spelled = { ...ROOT_POOL[pc]!, o: 3 };
  const out: Spelled[] = [];
  for (let i = 0; i < 28; i++) {
    const s = spellAt(tonic, i, 12 * Math.floor(i / 7) + SCALE_TONES.major[i % 7]!);
    if (!s) return undefined;
    if (level !== 'hard' && isRare(s)) return undefined;
    const m = midiOf(s);
    if (m >= TREBLE_LOW && m <= TREBLE_HIGH) out.push(s);
  }
  return out;
}

/** A melody following `contour` on scale notes: degree steps in [minStep, maxStep], or semitone steps for easy. */
function melody(rng: Rng, level: Level, contour: string): Spelled[] | undefined {
  const notes = scaleNotes(rng.int(0, 11), level);
  if (!notes) return undefined;
  let i = rng.int(0, notes.length - 1);
  const path = [i];
  const leapAt = rng.int(0, contour.length - 1);
  for (let k = 0; k < contour.length; k++) {
    const up = contour[k] === 'u';
    const candidates: number[] = [];
    for (let j = 0; j < notes.length; j++) {
      if (up ? j <= i : j >= i) continue;
      if (level === 'easy') {
        const semis = Math.abs(midiOf(notes[j]!) - midiOf(notes[i]!));
        if (semis >= 2 && semis <= 5) candidates.push(j);
      } else {
        const deg = Math.abs(j - i);
        if (k === leapAt ? deg >= 3 && deg <= 4 : deg >= 1 && deg <= 4) candidates.push(j);
      }
    }
    if (!candidates.length) return undefined;
    i = rng.pick(candidates);
    path.push(i);
  }
  return path.map((j) => notes[j]!);
}

const ALL_CONTOURS_4 = Array.from({ length: 16 }, (_, n) => Array.from({ length: 4 }, (_, b) => ((n >> (3 - b)) & 1 ? 'd' : 'u')).join(''));
const hamming = (a: string, b: string) => [...a].filter((c, i) => c !== b[i]).length;

function drawContour(rng: Rng, level: Level, contour: string): Spec | undefined {
  const notes = melody(rng, level, contour);
  if (!notes) return undefined;
  if (level === 'easy') return { k: 'contour', notes, options: CONTOURS_3 };
  const near = rng.shuffle(ALL_CONTOURS_4.filter((c) => c !== contour && hamming(c, contour) <= 2));
  const options = rng.shuffle([contour, ...near.slice(0, 3)]);
  return { k: 'contour', notes, options };
}

function drawChanged(rng: Rng, position: number): Spec | undefined {
  const contour = rng.pick(ALL_CONTOURS_4);
  const a = melody(rng, 'hard', contour);
  if (!a) return undefined;
  const from = midiOf(a[position]!);
  const moves = rng.shuffle([-3, -2, -1, 1, 2, 3]);
  for (const move of moves) {
    const m = from + move;
    if (m < TREBLE_LOW || m > TREBLE_HIGH) continue;
    if (midiOf(a[position - 1]!) === m || (position + 1 < a.length && midiOf(a[position + 1]!) === m)) continue;
    const b = a.map((n, i) => (i === position ? spellNear(n, m) : n));
    return { k: 'changed', a, b };
  }
  return undefined;
}

function drawRhythm(rng: Rng, level: Level, used: ReadonlySet<string>): Spec | undefined {
  const { count, distance: min } = RHYTHM_OPTIONS[level];
  const all = allPatterns(level);
  const answer = rng.pick(all);
  if (used.has(answer.join(','))) return undefined;
  const chosen = [answer];
  for (const p of rng.shuffle(all)) {
    if (chosen.length === count) break;
    if (chosen.every((c) => distance(c, p) >= min)) chosen.push(p);
  }
  if (chosen.length < count) return undefined;
  const options = rng.shuffle(chosen);
  return { k: 'rhythm', options, answer: options.indexOf(answer) };
}

function drawBuild(rng: Rng, task: 'interval' | 'chord' | 'scale', target: string): Spec | undefined {
  const root = randomRoot(rng, TREBLE_LOW, BUILD_ROOT_HIGH);
  if (!root) return undefined;
  return { k: 'build', task, root, target } as Spec;
}

/** A planned item: how to draw it and the fixed fallback on C. */
interface Plan {
  draw(rng: Rng): Spec | undefined;
  fallback(): Spec;
}

const C4: Spelled = { l: 0, a: 0, o: 4 };

function plans(rng: Rng, topic: QuizTopic, level: Level, n: number): Plan[] {
  const used = new Set<string>();
  switch (topic) {
    case 'intervals':
      return answerSequence(rng, INTERVAL_POOL[level], n).map((ivl) => ({
        draw: (r) => drawInterval(r, level, ivl),
        fallback: () => ({ k: 'interval', root: C4, ivl, dir: 'up', options: INTERVAL_POOL[level] })
      }));
    case 'chords': {
      const scales = level === 'easy' ? new Set<number>() : positions(rng, n, Math.round(0.3 * n));
      const chordSeq = answerSequence(rng, CHORD_POOL[level], n - scales.size);
      const scaleSeq = scales.size ? answerSequence(rng, SCALE_POOL[level], scales.size) : [];
      return Array.from({ length: n }, (_, i) => {
        if (scales.has(i)) {
          const s = scaleSeq.shift()!;
          return { draw: (r: Rng) => drawScale(r, level, s), fallback: (): Spec => ({ k: 'scale', tonic: C4, s, options: SCALE_POOL[level] }) };
        }
        const q = chordSeq.shift()!;
        return { draw: (r: Rng) => drawChord(r, level, q), fallback: (): Spec => ({ k: 'chord', root: C4, q, inv: 0, options: CHORD_POOL[level] }) };
      });
    }
    case 'stability': {
      const cadences = level === 'hard' ? positions(rng, n, Math.round(0.4 * n)) : new Set<number>();
      const pairSeq = answerSequence(rng, [0, 1], n - cadences.size);
      const cadSeq = cadences.size ? answerSequence(rng, CADENCES, cadences.size) : [];
      return Array.from({ length: n }, (_, i) => {
        if (cadences.has(i)) {
          const c = cadSeq.shift()!;
          return { draw: (r: Rng) => drawCadence(r, c), fallback: (): Spec => ({ k: 'cadence', key: C4, c, options: CADENCES }) };
        }
        const answer = pairSeq.shift()!;
        const s = { root: C4, ivl: 'P5' as IntervalId };
        const t = { root: C4, ivl: 'TT' as IntervalId };
        return { draw: (r: Rng) => drawPair(r, level, answer), fallback: (): Spec => (answer === 0 ? { k: 'pair', first: s, second: t } : { k: 'pair', first: t, second: s }) };
      });
    }
    case 'melody': {
      if (level === 'hard')
        return answerSequence(rng, CHANGED_POSITIONS, n).map((p) => ({
          draw: (r) => drawChanged(r, p),
          fallback: () => {
            const a: Spelled[] = [C4, { l: 2, a: 0, o: 4 }, { l: 4, a: 0, o: 4 }, { l: 2, a: 0, o: 4 }, { l: 0, a: 0, o: 5 }];
            return { k: 'changed', a, b: a.map((x, i) => (i === p ? spellNear(x, midiOf(x) + 1) : x)) };
          }
        }));
      const contours = level === 'easy' ? answerSequence(rng, CONTOURS_3, n) : answerSequence(rng, ALL_CONTOURS_4, n);
      return contours.map((c) => ({
        draw: (r) => drawContour(r, level, c),
        fallback: () => {
          const steps = level === 'easy' ? [0, 2, 4] : [0, 1, 4, 2, 5];
          const notes = steps.map((s, i) => spellAt(C4, i === 0 ? 0 : s, SCALE_TONES.major[s]!)!);
          return { k: 'contour', notes, options: level === 'easy' ? CONTOURS_3 : [contourOf(notes), 'dddd', 'uudd', 'dduu'] };
        }
      }));
    }
    case 'rhythm':
      return Array.from({ length: n }, () => ({
        draw: (r: Rng) => {
          const spec = drawRhythm(r, level, used);
          if (spec?.k === 'rhythm') used.add(spec.options[spec.answer]!.join(','));
          return spec;
        },
        fallback: (): Spec => {
          const all = allPatterns(level);
          return { k: 'rhythm', options: [all[0]!, all[all.length - 1]!, ...all.slice(1, RHYTHM_OPTIONS[level].count - 1)], answer: 0 };
        }
      }));
    case 'build': {
      if (level === 'easy') return answerSequence(rng, BUILD_INTERVALS, n).map((t) => buildPlan('interval', t));
      if (level === 'medium') return answerSequence(rng, BUILD_CHORDS, n).map((t) => buildPlan('chord', t));
      const scales = positions(rng, n, Math.round(n / 2));
      const chordSeq = answerSequence(rng, BUILD_SEVENTHS, n - scales.size);
      const scaleSeq = answerSequence(rng, BUILD_SCALES, scales.size);
      return Array.from({ length: n }, (_, i) => (scales.has(i) ? buildPlan('scale', scaleSeq.shift()!) : buildPlan('chord', chordSeq.shift()!)));
    }
  }
}

const buildPlan = (task: 'interval' | 'chord' | 'scale', target: string): Plan => ({
  draw: (r) => drawBuild(r, task, target),
  fallback: () => ({ k: 'build', task, root: C4, target }) as Spec
});

/** Counts of fallbacks used (for the slow test's report); never part of the state. */
export const generationStats = { relaxed: 0, fixed: 0 };

/** The specs of a round (design § 7), deterministic for (seed, topic, level). */
export function generateRound(seed: number, topic: QuizTopic, level: Level): Spec[] {
  const rng = createRng(seed);
  const n = ROUND_LENGTH[topic];
  const out: Spec[] = [];
  const keys = new Set<string>();
  for (const plan of plans(rng, topic, level, n)) {
    const prevRoot = out.length ? rootOf(out[out.length - 1]!) : undefined;
    const fresh = (spec: Spec) => {
      const root = rootOf(spec);
      return !keys.has(specKey(spec)) && (!prevRoot || !root || pitchClass(midiOf(root)) !== pitchClass(midiOf(prevRoot)));
    };
    let chosen: Spec | undefined;
    for (let attempt = 0; attempt < ATTEMPTS && !chosen; attempt++) {
      const spec = plan.draw(rng);
      if (spec && specProblem(spec, level) === undefined && fresh(spec)) chosen = spec;
    }
    for (let attempt = 0; attempt < ATTEMPTS && !chosen; attempt++) {
      const spec = plan.draw(rng);
      if (spec && specProblem(spec, level) === undefined) {
        chosen = spec;
        generationStats.relaxed++;
      }
    }
    if (!chosen) {
      chosen = plan.fallback();
      generationStats.fixed++;
    }
    keys.add(specKey(chosen));
    out.push(chosen);
  }
  return out;
}

/** The answer keys of a round (for fairness checks). */
export const roundAnswers = (specs: readonly Spec[]): string[] => specs.map(answerKey);
