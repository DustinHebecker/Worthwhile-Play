/**
 * Slow generator checks (design § 20.4; ADR 0021: run by `pnpm test` and the CI `long` job, not by Stryker):
 * 2,000 seeds × every topic and level. Every round is valid, every fairness rule holds, no item needs the fixed
 * fallback, and every playback of every item respects the sound bounds of § 9.4. Prints the answer and root spread.
 */
import { describe, expect, it } from 'vitest';
import { itemEvents } from '../src/audio/play';
import { FREQ_MAX, FREQ_MIN, MAX_LENGTH, MAX_NOTES, lengthOf, schedule } from '../src/audio/schedule';
import { generateRound, generationStats } from '../src/generate';
import { LEVELS, QUIZ_TOPICS } from '../src/levels';
import { emptyItem, isHarmonyState } from '../src/rules';
import { answerKey, rootOf } from '../src/spec';
import { midiOf } from '../src/spelling';
import { pitchClass } from '../src/theory';
import { peakSum, variants } from './audio-helpers';
import { fairnessProblems } from './fairness';

const SEEDS = 2000;

describe('generator over 2,000 seeds (slow)', () => {
  it('every round is valid and fair, without the fixed fallback', () => {
    const before = { ...generationStats };
    const answers = new Map<string, number>();
    const roots = new Array<number>(12).fill(0);
    for (const topic of QUIZ_TOPICS)
      for (const level of LEVELS)
        for (let seed = 0; seed < SEEDS; seed++) {
          const specs = generateRound(seed * 7919 + 13, topic, level);
          const problems = fairnessProblems(specs, topic, level);
          if (problems.length) throw new Error(`${topic} ${level} seed ${seed}: ${problems.join('; ')}`);
          const state = { v: 1, topic, senses: 'ear', difficulty: level, seed: seed * 7919 + 13, items: specs.map(emptyItem), index: 0, reported: false };
          if (!isHarmonyState(JSON.parse(JSON.stringify(state)))) throw new Error(`${topic} ${level} seed ${seed}: invalid state`);
          for (const spec of specs) {
            const key = `${topic}/${level}/${answerKey(spec)}`;
            answers.set(key, (answers.get(key) ?? 0) + 1);
            const root = rootOf(spec);
            if (root) roots[pitchClass(midiOf(root))]!++;
          }
        }
    expect(generationStats.fixed - before.fixed).toBe(0);
    console.log(`relaxed draws: ${generationStats.relaxed - before.relaxed}; roots by pitch class: ${roots.join(' ')}`);
    console.log(
      [...answers.entries()]
        .filter(([k]) => /^(intervals|chords|stability)\//.test(k))
        .map(([k, n]) => `${k}=${n}`)
        .join(' ')
    );
    // Every root of the pool is used.
    expect(roots.every((n) => n > 0)).toBe(true);
  }, 240_000);

  it('every playback of every item stays within the sound bounds (§ 9.4)', () => {
    for (const topic of QUIZ_TOPICS)
      for (const level of LEVELS)
        for (let seed = 0; seed < 60; seed++)
          for (const spec of generateRound(seed * 104729 + 1, topic, level))
            for (const v of variants(spec))
              for (const slow of [false, true]) {
                const events = itemEvents(spec, v, { slow, countIn: true });
                if (events.length > MAX_NOTES || lengthOf(events) > MAX_LENGTH) throw new Error(`${topic} ${level} ${seed}: too long`);
                for (const e of events) if (e.freq < FREQ_MIN || e.freq > FREQ_MAX) throw new Error(`${topic} ${level} ${seed}: ${e.freq} Hz`);
                const sum = peakSum(schedule(events, 0), false);
                if (sum > 1 + 1e-9) throw new Error(`${topic} ${level} ${seed}: sum ${sum}`);
              }
  }, 240_000);
});
