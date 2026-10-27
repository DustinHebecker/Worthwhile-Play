import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { itemEvents, withContour, type Variant } from '../src/audio/play';
import {
  ATTACK,
  FREQ_MAX,
  FREQ_MIN,
  MASTER_MAX,
  MAX_LENGTH,
  MAX_NOTES,
  RHYTHM_BPM,
  RHYTHM_SLOW_BPM,
  TAIL,
  eighth,
  envelope,
  gainAt,
  lengthOf,
  master,
  maxOverlap,
  readVolume,
  rhythmEvents,
  schedule,
  slower,
  type NoteEvent,
  type ScheduledNote
} from '../src/audio/schedule';
import { HARMONICS, waveTables } from '../src/audio/voices';
import { generateRound } from '../src/generate';
import { peakSum, variants } from './audio-helpers';
import { LEVELS, QUIZ_TOPICS } from '../src/levels';
import type { Spec } from '../src/spec';

const eventArb = fc.record({
  freq: fc.double({ min: 20, max: 3000, noNaN: true }),
  start: fc.double({ min: 0, max: 6, noNaN: true }),
  dur: fc.double({ min: 0.001, max: 3, noNaN: true }),
  level: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
  voice: fc.constantFrom('soft' as const, 'tick' as const)
});

describe('level cap (design § 9.4, binding)', () => {
  it('master(volume) is monotone, ≤ 0.5 (−6 dBFS) for every input, 0.125 at the default', () => {
    expect(master(50)).toBe(0.125);
    expect(master(100)).toBe(MASTER_MAX);
    expect(master(0)).toBe(0);
    expect(master(Number.NaN)).toBe(0.125);
    expect(master('loud')).toBe(0.125);
    expect(master(-5)).toBe(0);
    expect(master(1e9)).toBe(MASTER_MAX);
    expect(20 * Math.log10(master(100))).toBeCloseTo(-6.02, 1);
    expect(20 * Math.log10(master(50))).toBeCloseTo(-18.06, 1);
    fc.assert(fc.property(fc.anything(), (v) => master(v) >= 0 && master(v) <= MASTER_MAX));
    fc.assert(fc.property(fc.double({ min: -50, max: 150, noNaN: true }), fc.double({ min: -50, max: 150, noNaN: true }), (a, b) => (a <= b ? master(a) <= master(b) : master(a) >= master(b))));
  });

  it('volume preferences are validated (junk → 50)', () => {
    expect(readVolume(35)).toBe(35);
    for (const junk of [33, -5, 105, '50', null, Number.NaN, 2.5]) expect(readVolume(junk)).toBe(50);
  });

  it('no combination of notes sums above 1 before the master gain, so the output never exceeds the cap (property)', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 60 }), fc.integer({ min: 0, max: 100 }), (events, volume) => {
        const notes = schedule(events, 0);
        const sum = peakSum(notes);
        expect(sum).toBeLessThanOrEqual(1 + 1e-9);
        expect(sum * master(volume)).toBeLessThanOrEqual(MASTER_MAX + 1e-9);
      }),
      { numRuns: 300 }
    );
  });

  it('every generated item, every variant and pace stays within the bounds', () => {
    for (const topic of QUIZ_TOPICS)
      for (const level of LEVELS)
        for (const seed of [1, 2, 3])
          for (const spec of generateRound(seed, topic, level))
            for (const v of variants(spec))
              for (const slow of [false, true]) {
                const events = itemEvents(spec, v, { slow, countIn: true });
                expect(events.length, `${topic} ${level}`).toBeGreaterThan(0);
                expect(events.length).toBeLessThanOrEqual(MAX_NOTES);
                for (const e of events) {
                  expect(e.freq).toBeGreaterThanOrEqual(FREQ_MIN);
                  expect(e.freq).toBeLessThanOrEqual(FREQ_MAX);
                  expect(e.start).toBeGreaterThanOrEqual(0);
                  expect(e.dur).toBeGreaterThan(ATTACK);
                }
                expect(lengthOf(events)).toBeLessThanOrEqual(MAX_LENGTH);
                expect(schedule(events, 0)).toHaveLength(events.length);
                expect(peakSum(schedule(events, 0))).toBeLessThanOrEqual(1 + 1e-9);
              }
  });
});

describe('schedule and envelopes', () => {
  it('peak = 1/M with M counted including release tails', () => {
    expect(maxOverlap([])).toBe(0);
    expect(maxOverlap([{ start: 0, dur: 1 }, { start: 1, dur: 1 }])).toBe(2);
    expect(maxOverlap([{ start: 0, dur: 1 }, { start: 1 + TAIL + 0.01, dur: 1 }])).toBe(1);
    const notes = schedule([{ freq: 440, start: 0, dur: 1 }, { freq: 550, start: 0, dur: 1 }, { freq: 660, start: 0, dur: 1 }], 2);
    expect(notes.map((n) => n.peak)).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(notes[0]).toMatchObject({ start: 2, end: 3, stop: 3 + TAIL });
  });

  it('drops fundamentals outside 65–1,400 Hz and junk times', () => {
    const notes = schedule([{ freq: 50, start: 0, dur: 1 }, { freq: 1500, start: 0, dur: 1 }, { freq: 440, start: Number.NaN, dur: 1 }, { freq: 440, start: 0, dur: 1 }], 0);
    expect(notes).toHaveLength(1);
  });

  it('every envelope starts at 0, rises over ≥ 15 ms and ends at 0', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { minLength: 1, maxLength: 20 }), (events) => {
        for (const n of schedule(events, 0.5)) {
          const calls = envelope(n);
          expect(calls[0]).toEqual({ fn: 'setValueAtTime', v: 0, t: n.start });
          expect(calls[1]!.t - n.start).toBeGreaterThanOrEqual(0.015);
          expect(calls.at(-1)).toMatchObject({ fn: 'setTargetAtTime', v: 0, t: n.end });
          expect(n.stop).toBeGreaterThan(n.end);
          expect(gainAt(n, n.start)).toBe(0);
          expect(gainAt(n, n.stop)).toBe(0);
          expect(gainAt(n, n.stop - 1e-6)).toBeLessThan(0.002);
        }
      })
    );
  });

  it('rhythm onsets lie exactly on the eighth grid after the count-in; slower uses 60 BPM within 8 s', () => {
    const pattern = [1, 1, 2, 3, 1];
    for (const slow of [false, true]) {
      const e = eighth(slow ? RHYTHM_SLOW_BPM : RHYTHM_BPM);
      const ev = rhythmEvents(pattern, true, slow);
      const ticks = ev.filter((x) => x.voice === 'tick');
      expect(ticks.map((x) => x.start)).toEqual([0, 2, 4, 6].map((k) => k * e));
      for (const t of ticks) expect(t.level).toBe(0.5);
      expect(ev.filter((x) => x.voice !== 'tick').map((x) => x.start)).toEqual([0, 1, 2, 4, 7].map((k) => 8 * e + k * e));
      expect(lengthOf(ev)).toBeLessThanOrEqual(MAX_LENGTH);
    }
    expect(rhythmEvents([2, -2, 4], false, false).map((x) => x.start)).toEqual([0, 4 * eighth(RHYTHM_BPM)]);
  });

  it('"Slower" stretches up to 2× and never past 8 s', () => {
    const ev: NoteEvent[] = [{ freq: 440, start: 0, dur: 1 }, { freq: 440, start: 1, dur: 1 }];
    expect(lengthOf(slower(ev))).toBe(4);
    const long: NoteEvent[] = [{ freq: 440, start: 0, dur: 6 }];
    expect(lengthOf(slower(long))).toBeLessThanOrEqual(MAX_LENGTH);
  });

  it('timbre: harmonics 1–8, decreasing, never a pure sine; tick 1–3', () => {
    expect(HARMONICS.soft).toHaveLength(9);
    expect(HARMONICS.soft[0]).toBe(0);
    for (let i = 2; i < 9; i++) expect(HARMONICS.soft[i]!).toBeLessThan(HARMONICS.soft[i - 1]!);
    expect(HARMONICS.tick).toHaveLength(4);
    const { real, imag } = waveTables('soft');
    expect([...real].every((x) => x === 0)).toBe(true);
    expect(imag[1]).toBe(1);
  });

  it('"yours" in a contour review keeps the step sizes with the chosen directions', () => {
    expect(withContour([60, 64, 62], 'ud')).toEqual([60, 64, 62]);
    expect(withContour([60, 64, 62], 'du')).toEqual([60, 56, 58]);
  });
});
