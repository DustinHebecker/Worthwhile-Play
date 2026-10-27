// @vitest-environment jsdom
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatNumber, formatPlural, fill, pluralCategory, ratioText } from '../src/format';
import { chordHeads, ledgerLines, naturalSigns, staffPosition, stemUp } from '../src/staff';
import { renderContour, renderRhythm, renderStaff } from '../src/staff-view';
import { midiToFreq } from '../src/theory';
import { MAX_SAMPLES, ratioFacts, shortRepeat, waveSamples } from '../src/wave';

const s = (l: number, a: -1 | 0 | 1, o: number) => ({ l, a, o });

describe('staff layout (design § 11.1)', () => {
  it('positions on the treble and bass clefs', () => {
    expect(staffPosition(s(2, 0, 4), 'treble')).toBe(0);
    expect(staffPosition(s(3, 0, 5), 'treble')).toBe(8);
    expect(staffPosition(s(0, 0, 4), 'treble')).toBe(-2);
    expect(staffPosition(s(5, 0, 5), 'treble')).toBe(10);
    expect(staffPosition(s(4, 0, 2), 'bass')).toBe(0);
    expect(staffPosition(s(5, 0, 3), 'bass')).toBe(8);
    expect(staffPosition(s(0, 0, 4), 'bass')).toBe(10);
    expect(staffPosition(s(0, 1, 4), 'treble')).toBe(staffPosition(s(0, -1, 4), 'treble'));
  });

  it('ledger lines: C4 one below the treble staff, A5 one above', () => {
    expect(ledgerLines(-2)).toEqual([-2]);
    expect(ledgerLines(10)).toEqual([10]);
    expect(ledgerLines(-1)).toEqual([]);
    expect(ledgerLines(4)).toEqual([]);
    expect(ledgerLines(-5)).toEqual([-2, -4]);
    expect(ledgerLines(13)).toEqual([10, 12]);
  });

  it('stem direction: up below the middle line, down from it', () => {
    expect(stemUp([0])).toBe(true);
    expect(stemUp([3])).toBe(true);
    expect(stemUp([4])).toBe(false);
    expect(stemUp([7])).toBe(false);
    expect(stemUp([0, 7])).toBe(true);
    expect(stemUp([1, 8])).toBe(false);
  });

  it('displaces one note of a second and stacks accidentals in columns', () => {
    const up = chordHeads([{ p: 0, a: 0 }, { p: 1, a: 0 }], true);
    expect(up.map((x) => x.side)).toEqual([0, 1]);
    const down = chordHeads([{ p: 6, a: 0 }, { p: 7, a: 0 }], false);
    expect(down.map((x) => x.side)).toEqual([-1, 0]);
    const triad = chordHeads([{ p: 0, a: 0 }, { p: 2, a: 0 }, { p: 4, a: 0 }], true);
    expect(triad.every((x) => x.side === 0)).toBe(true);
    const accs = chordHeads([{ p: 0, a: -1 }, { p: 2, a: -1 }, { p: 4, a: -1 }], true);
    expect(accs.map((x) => x.accCol)).toEqual([2, 1, 0]);
    const far = chordHeads([{ p: 0, a: 1 }, { p: 7, a: 1 }], true);
    expect(far.map((x) => x.accCol)).toEqual([0, 0]);
    expect(chordHeads([{ p: 2, a: 0 }], true)[0]!.accCol).toBe(-1);
    // Two notes on one position (F and F♯): side by side, the natural one with its sign.
    const unison = chordHeads([{ p: 1, a: 1 }, { p: 1, a: 0, natural: true }], true);
    expect(unison.map((x) => [x.a, x.side, x.natural, x.accCol >= 0])).toEqual([[0, 0, true, true], [1, 1, false, true]]);
  });

  it('draws a natural sign where an earlier note of the bar altered the same letter and octave (no key signature)', () => {
    // Melody B of "which note changed?": B4 C♯5 B♭4 F♯5 B4 — the last B needs ♮, the first does not.
    const melody = [s(6, 0, 4), s(0, 1, 5), s(6, -1, 4), s(3, 1, 5), s(6, 0, 4)].map((n) => [n]);
    expect(naturalSigns(melody).map((f) => f[0])).toEqual([false, false, false, false, true]);
    // Another octave is another note; a chord with F and F♯ marks the F.
    expect(naturalSigns([[s(6, -1, 4)], [s(6, 0, 5)]])).toEqual([[false], [false]]);
    expect(naturalSigns([[s(3, 0, 4), s(3, 1, 4)]])).toEqual([[true, false]]);
    const staff = renderStaff(melody.map((notes) => ({ notes })), { name: 'Melody B', style: 'quarter' });
    expect(staff.querySelectorAll('[data-acc="natural"]')).toHaveLength(1);
    expect(staff.querySelectorAll('[data-acc="flat"]')).toHaveLength(1);
  });

  it('draws staffs, rhythm notation and contours as left-to-right images with names, using own paths (no font glyphs)', () => {
    const staff = renderStaff([{ notes: [s(0, 1, 4), s(2, 0, 4)] }, { notes: [s(6, -1, 4)], label: '2' }], { name: 'Two notes', grand: true });
    expect(staff.getAttribute('dir')).toBe('ltr');
    expect(staff.getAttribute('role')).toBe('img');
    expect(staff.getAttribute('aria-label')).toBe('Two notes');
    expect(staff.querySelectorAll('[data-acc="sharp"]')).toHaveLength(1);
    expect(staff.querySelectorAll('[data-acc="flat"]')).toHaveLength(1);
    expect(staff.querySelectorAll('.hm-clef')).toHaveLength(2);
    expect(staff.textContent).toBe('2');
    expect(staff.innerHTML).not.toMatch(/[𝄞𝄢♯♭#]/u);
    const rhythm = renderRhythm([1, 1, 2, -2, 2], 'Rhythm');
    expect(rhythm.querySelectorAll('.hm-beam')).toHaveLength(1);
    expect(rhythm.querySelectorAll('.hm-rest')).toHaveLength(1);
    expect(rhythm.textContent).toBe('44');
    const flagged = renderRhythm([3, 1, 4], 'Rhythm');
    expect(flagged.querySelectorAll('.hm-flag')).toHaveLength(1);
    expect(renderContour('ud').querySelectorAll('circle')).toHaveLength(3);
  });
});

describe('wave and ratio (design § 11.3)', () => {
  it('samples at most 800 points in [−1, 1], over 16 periods of the lowest note', () => {
    expect(waveSamples([440], 2000)).toHaveLength(MAX_SAMPLES);
    expect(waveSamples([], 10)).toEqual(new Array(10).fill(0));
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 48, max: 84 }), { minLength: 1, maxLength: 6 }), (midis) => {
        for (const y of waveSamples(midis.map(midiToFreq), 300)) expect(Math.abs(y)).toBeLessThanOrEqual(1 + 1e-12);
      })
    );
    const pure = waveSamples([200], 800);
    expect(pure[0]).toBe(0);
    expect(Math.abs(pure[799]!)).toBeLessThan(1e-9);
  });

  it('a short repeat for simple ratios only', () => {
    expect(shortRepeat([7])).toBe(2);
    expect(shortRepeat([12])).toBe(1);
    expect(shortRepeat([4])).toBe(4);
    expect(shortRepeat([3])).toBe(5);
    expect(shortRepeat([4, 7])).toBe(4);
    expect(shortRepeat([1])).toBeNull();
    expect(shortRepeat([6])).toBeNull();
    expect(shortRepeat([2])).toBeNull();
    expect(ratioFacts('M3')).toMatchObject({ ratio: [5, 4], deviation: 13.7, simple: true });
    expect(ratioFacts('TT').simple).toBe(false);
    expect(ratioFacts('P8').deviation).toBe(0);
    expect(ratioFacts('P5').etCents).toBeCloseTo(700, 9);
  });
});

describe('format (design § 18.4)', () => {
  it('numbers, plurals and placeholders per locale', () => {
    expect(formatNumber(13.7, 'de', 1)).toBe('13,7');
    expect(formatNumber(4, 'en')).toBe('4');
    expect(pluralCategory(1, 'en')).toBe('one');
    expect(pluralCategory(3, 'ru')).toBe('few');
    expect(pluralCategory(13.7, 'ru', 1)).toBe('other');
    expect(formatPlural({ one: '{n} semitone', other: '{n} semitones' }, 1, 'en')).toBe('1 semitone');
    expect(formatPlural({ one: '{n} semitone', other: '{n} semitones' }, 4, 'en')).toBe('4 semitones');
    expect(formatPlural({ other: '{n}' }, 2, 'ja')).toBe('2');
    expect(fill('{a} and {b} and {c}', { a: 'x', b: 'y' })).toBe('x and y and {c}');
    expect(ratioText(3, 2, 'en')).toBe('3 : 2');
  });
});
