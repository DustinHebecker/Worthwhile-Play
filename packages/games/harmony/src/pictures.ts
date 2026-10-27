/**
 * The by-eye pictures of every item (design § 8) and the review facts: staffs, rhythm notation, ratio and wave
 * pictures, chord symbols, third sizes, step patterns. Everything is drawn by code; text goes through the translator
 * and the content of the locale.
 */
import { h } from '@wp/ui';
import type { Env } from './env';
import { fill, formatPlural } from './format';
import { slots } from './rhythm';
import { CHANGED_POSITIONS, answerIndex, buildAnswerNotes, changedIndex, contourOf, intervalNotes, type Spec } from './spec';
import { renderRhythm, renderStaff, svg, type StaffEvent } from './staff-view';
import { midiOf, spellCadence, spellChord, spellChordVoicing, spellScale, type Spelled } from './spelling';
import { CADENCE_PROGRESSIONS, RATIOS, SEMITONES, classOf, midiToFreq, scaleStepSizes, thirdSizes, type ChordId, type IntervalId } from './theory';
import { ratioFacts, shortRepeat, waveSamples } from './wave';

export const listOf = (items: readonly string[]): string => items.join(', ');
const spokenList = (env: Env, notes: readonly Spelled[]) => listOf(notes.map(env.spoken));
const nameList = (env: Env, notes: readonly Spelled[]) => notes.map(env.note).join(' – ');

/** Chord symbol suffixes (design § 7.2): C, Cm, C°, C+, C7, Cmaj7, Cm7. */
const SYMBOL: Readonly<Record<ChordId, string>> = { maj: '', min: 'm', dim: '°', aug: '+', dom7: '7', maj7: 'maj7', min7: 'm7' };
export const chordSymbol = (env: Env, root: Spelled, q: ChordId): string => `${env.note(root)}${SYMBOL[q]}`;

/** A wave picture of the fundamentals with its caption as accessible name (design § 11.3). */
export function wavePicture(env: Env, freqs: readonly number[], semitonesAboveLowest: readonly number[], testid = 'hm-wave'): HTMLElement {
  const ys = waveSamples(freqs, 480);
  const w = 320;
  const pts = ys.map((y, i) => `${Math.round((i / (ys.length - 1)) * w * 10) / 10},${Math.round((32 - y * 26) * 10) / 10}`).join(' ');
  const k = shortRepeat(semitonesAboveLowest);
  const caption = k === null ? env.t('wave.none') : formatPlural(env.c.waveRepeat, k, env.locale);
  const pic = svg('svg', { viewBox: `0 0 ${w} 64`, class: 'hm-wave', 'aria-hidden': 'true', focusable: 'false' }, svg('line', { x1: 0, x2: w, y1: 32, y2: 32, class: 'hm-axis' }), svg('polyline', { points: pts, class: 'hm-wave-line' }));
  return h('figure', { class: 'hm-wave-fig', dir: 'ltr', role: 'img', 'aria-label': caption, 'data-testid': testid }, pic, h('figcaption', { 'aria-hidden': 'true', dir: env.t.direction, 'data-testid': `${testid}-caption` }, caption));
}

/** "Close to 5 : 4; equal temperament is 13.7 cents wider." */
export function ratioLine(env: Env, ivl: IntervalId): HTMLElement {
  const f = ratioFacts(ivl);
  const ratio = h('bdi', { dir: 'ltr' }, env.ratio(f.ratio[0], f.ratio[1]));
  const key = !f.simple ? 'review.ratioNone' : f.deviation === 0 ? 'review.ratioExact' : f.deviation > 0 ? 'review.ratio' : 'review.ratioNarrow';
  const text = env.t(key, { ratio: '\u0000', cents: env.cents(Math.abs(f.deviation)) });
  const [before, after] = text.split('\u0000');
  return h('p', { class: 'hm-ratio', 'data-testid': 'hm-ratio' }, before ?? '', ratio, after ?? '');
}

const dyadNotes = (root: Spelled, ivl: IntervalId) => intervalNotes(root, ivl, 'together')!;

/** One dyad of a stability pair: label, staff, ratio, wave; in the review also its class. */
function dyadCard(env: Env, which: string, root: Spelled, ivl: IntervalId, reveal: boolean, testid: string): HTMLElement {
  const notes = dyadNotes(root, ivl);
  const [p, q] = RATIOS[ivl];
  const card = h('div', { class: 'hm-dyad', 'data-testid': testid }, h('p', { class: 'hm-dyad-label' }, which));
  card.append(renderStaff([{ notes }], { name: env.t('staff.together', { notes: spokenList(env, notes) }) }));
  if (reveal) card.append(h('p', {}, env.t('review.class', { which, name: env.ivl(ivl), cls: env.c.classes[classOf(ivl)!], ratio: env.ratio(p, q) })));
  else card.append(h('p', { class: 'hm-ratio' }, h('bdi', { dir: 'ltr' }, env.ratio(p, q))));
  card.append(wavePicture(env, notes.map((n) => midiToFreq(midiOf(n))), [SEMITONES[ivl]], `${testid}-wave`));
  return card;
}

/** Cadence chord names in letters ("C F G C"), the vi chord as minor ("Am"). */
function cadenceLabels(env: Env, spec: Extract<Spec, { k: 'cadence' }>): string[] {
  const chords = spellCadence(spec.key, spec.c)!;
  return CADENCE_PROGRESSIONS[spec.c].map((ch, i) => {
    const bass = chords[i]![0]!;
    return ch === 'vi' ? `${env.note(bass)}m` : env.note(bass);
  });
}

/** The picture of an item: the by-eye question, or the review picture when `reveal`. */
export function itemPicture(env: Env, spec: Spec, reveal: boolean, chosen?: number): HTMLElement {
  const box = h('div', { class: 'hm-picture-body', 'data-testid': 'hm-picture' });
  const t = env.t;
  switch (spec.k) {
    case 'interval': {
      const notes = intervalNotes(spec.root, spec.ivl, spec.dir)!;
      const events: StaffEvent[] = spec.dir === 'together' ? [{ notes }] : notes.map((n, i) => ({ notes: [n], label: env.int(i + 1) }));
      const name = spec.dir === 'together' ? t('staff.together', { notes: spokenList(env, notes) }) : t('staff.two', { a: env.spoken(notes[0]!), b: env.spoken(notes[1]!) });
      box.append(renderStaff(events, { name, testid: 'hm-staff' }));
      break;
    }
    case 'chord': {
      const notes = spellChordVoicing(spec.root, spec.q, spec.inv)!;
      box.append(renderStaff([{ notes }], { name: t('staff.together', { notes: spokenList(env, notes) }), testid: 'hm-staff' }));
      break;
    }
    case 'scale': {
      const notes = spellScale(spec.tonic, spec.s)!;
      box.append(renderStaff(notes.map((n) => ({ notes: [n] })), { name: t('staff.notes', { notes: spokenList(env, notes) }), testid: 'hm-staff' }));
      break;
    }
    case 'pair':
      box.classList.add('hm-pair');
      box.append(dyadCard(env, t('option.first'), spec.first.root, spec.first.ivl, reveal, 'hm-dyad-0'), dyadCard(env, t('option.second'), spec.second.root, spec.second.ivl, reveal, 'hm-dyad-1'));
      break;
    case 'cadence': {
      const chords = spellCadence(spec.key, spec.c)!;
      const labels = cadenceLabels(env, spec);
      box.append(renderStaff(chords.map((notes, i) => ({ notes, label: labels[i]! })), { grand: true, name: t('staff.cadence', { list: listOf(labels) }), testid: 'hm-staff' }));
      box.append(h('p', {}, t('review.key', { key: env.note(spec.key) })));
      break;
    }
    case 'contour':
      box.append(renderStaff(spec.notes.map((n) => ({ notes: [n] })), { style: 'quarter', contour: reveal, name: t('staff.notes', { notes: spokenList(env, spec.notes) }), testid: 'hm-staff' }));
      break;
    case 'changed': {
      const i = changedIndex(spec.a, spec.b);
      box.append(h('p', { class: 'hm-melody-label' }, t('melody.a')));
      box.append(renderStaff(spec.a.map((n) => ({ notes: [n] })), { style: 'quarter', name: `${t('melody.a')}: ${spokenList(env, spec.a)}`, testid: 'hm-staff' }));
      if (reveal) {
        box.append(h('p', { class: 'hm-melody-label' }, t('melody.b')));
        box.append(renderStaff(spec.b.map((n, k) => ({ notes: [n], mark: k === i })), { style: 'quarter', name: `${t('melody.b')}: ${spokenList(env, spec.b)}`, testid: 'hm-staff-b' }));
      } else box.append(h('p', { class: 'hm-melody-b', 'data-testid': 'hm-melody-b' }, `${t('melody.b')}: `, h('bdi', {}, spec.b.map(env.note).join(' '))));
      void chosen;
      break;
    }
    case 'rhythm': {
      const pattern = spec.options[spec.answer]!;
      box.append(renderRhythm(pattern, t('staff.rhythm', { text: gridText(env, pattern) }), 'hm-notation'));
      if (reveal) box.append(rhythmGrid(env, pattern, 'hm-answer-grid'), h('p', {}, t('review.counting', { text: countingText(env, pattern) })));
      break;
    }
    case 'build': {
      const notes = buildAnswerNotes(spec)!;
      box.append(renderStaff(spec.task === 'scale' ? notes.map((n) => ({ notes: [n] })) : [{ notes }], { name: t('staff.notes', { notes: spokenList(env, notes) }), testid: 'hm-staff' }));
      break;
    }
  }
  return box;
}

/* ---------- Names of answers and options ---------- */

/** The name of option i of a choice item ("major third", "First", "Note 3" …). */
export function optionName(env: Env, spec: Spec, i: number): string {
  switch (spec.k) {
    case 'interval':
      return env.ivl(spec.options[i]!);
    case 'chord':
      return env.chord(spec.options[i]!);
    case 'scale':
      return env.scale(spec.options[i]!);
    case 'cadence':
      return env.cadence(spec.options[i]!);
    case 'pair':
      return env.t(i === 0 ? 'option.first' : 'option.second');
    case 'changed':
      return env.t('option.position', { n: env.int(CHANGED_POSITIONS[i]! + 1) });
    case 'contour':
      return shapeWords(env, spec.options[i]!);
    case 'rhythm':
      return env.t('option.grid', { n: env.int(i + 1) });
    case 'build':
      return '';
  }
}

/** "up, down, up" */
export const shapeWords = (env: Env, contour: string): string => listOf([...contour].map((c) => (c === 'u' ? env.c.up : env.c.down)));

/** The right answer of an item, in words (for verdicts). */
export function answerName(env: Env, spec: Spec): string {
  switch (spec.k) {
    case 'interval':
      return env.ivl(spec.ivl);
    case 'chord':
      return env.chord(spec.q);
    case 'scale':
      return env.scale(spec.s);
    case 'cadence':
      return env.cadence(spec.c);
    case 'pair': {
      const i = answerIndex(spec);
      return `${env.t(i === 0 ? 'option.first' : 'option.second')} (${env.ivl((i === 0 ? spec.first : spec.second).ivl)})`;
    }
    case 'contour':
      return shapeWords(env, contourOf(spec.notes));
    case 'changed':
      return env.t('option.position', { n: env.int(changedIndex(spec.a, spec.b) + 1) });
    case 'rhythm':
      return env.t('option.grid', { n: env.int(spec.answer + 1) });
    case 'build':
      return nameList(env, buildAnswerNotes(spec)!);
  }
}

/* ---------- Facts shown in the review ---------- */

export function reviewFacts(env: Env, spec: Spec): HTMLElement[] {
  const t = env.t;
  const out: HTMLElement[] = [];
  const p = (text: string, testid?: string) => h('p', testid ? { 'data-testid': testid } : {}, text);
  switch (spec.k) {
    case 'interval': {
      const notes = intervalNotes(spec.root, spec.ivl, spec.dir)!;
      out.push(p(t('review.notes', { notes: nameList(env, notes) })), p(t('review.size', { size: env.semitones(SEMITONES[spec.ivl]) })), ratioLine(env, spec.ivl));
      out.push(wavePicture(env, notes.map((n) => midiToFreq(midiOf(n))), [SEMITONES[spec.ivl]]));
      break;
    }
    case 'chord': {
      const tones = spellChord(spec.root, spec.q)!;
      const sizes = thirdSizes(spec.q);
      const thirds = sizes.map((s, i) => `${env.note(tones[i]!)} – ${env.note(tones[i + 1]!)}: ${env.int(s)}`);
      const voiced = spellChordVoicing(spec.root, spec.q, spec.inv)!;
      out.push(p(t('review.notes', { notes: nameList(env, tones) })), p(t('review.symbol', { symbol: chordSymbol(env, spec.root, spec.q) })), p(t('review.thirds', { list: listOf(thirds) })));
      if (spec.inv) out.push(p(t('review.inversion', { note: env.note(voiced[0]!) })));
      break;
    }
    case 'scale':
      out.push(p(t('review.notes', { notes: nameList(env, spellScale(spec.tonic, spec.s)!) })), p(t('review.steps', { list: stepPattern(env, spec.s) })));
      break;
    case 'pair': {
      const more = answerIndex(spec) === 0 ? spec.first : spec.second;
      out.push(p(fill(env.c.learned, { name: env.ivl(more.ivl) })), p(env.c.ratioWhy));
      break;
    }
    case 'cadence':
      out.push(p(t('review.chords', { list: CADENCE_PROGRESSIONS[spec.c].join(' – ') })), p(env.c.cadences[spec.c].explain));
      break;
    case 'contour':
      out.push(p(t('review.shape', { shape: shapeWords(env, contourOf(spec.notes)) })));
      break;
    case 'changed': {
      const i = changedIndex(spec.a, spec.b);
      out.push(p(t('review.changed', { n: env.int(i + 1), from: env.note(spec.a[i]!), to: env.note(spec.b[i]!) })));
      break;
    }
    case 'rhythm':
    case 'build':
      break;
  }
  return out;
}

/** "W W H W W W H" in the locale's step words. */
export const stepPattern = (env: Env, s: Parameters<typeof scaleStepSizes>[0]): string =>
  scaleStepSizes(s).map((d) => (d === 1 ? env.c.steps.half : d === 2 ? env.c.steps.whole : env.c.steps.three)).join(' ');

/* ---------- Rhythm grids (design § 7.5) ---------- */

/** Counting syllables of the 8 slots: 1 & 2 & 3 & 4 &. */
export const countSyllables = (env: Env): string[] => [1, 2, 3, 4].flatMap((b) => [env.int(b), env.t('grid.and')]);

/** Text form of a pattern for screen readers: "1: note, &: held, 2: rest …". */
export function gridText(env: Env, pattern: readonly number[]): string {
  const syl = countSyllables(env);
  return listOf(slots(pattern).map((s, i) => `${syl[i]}: ${env.t(s === 'onset' ? 'grid.note' : s === 'held' ? 'grid.held' : 'grid.rest')}`));
}

/** The counting line under the notation: the syllables of the slots where a note starts. */
export function countingText(env: Env, pattern: readonly number[]): string {
  const syl = countSyllables(env);
  return slots(pattern)
    .map((s, i) => (s === 'onset' ? syl[i]! : `(${syl[i]})`))
    .join(' ');
}

/** 8 boxes labelled 1 & 2 & …: ● onset, ━ held, · rest (never colour alone). */
export function rhythmGrid(env: Env, pattern: readonly number[], testid?: string): HTMLElement {
  const syl = countSyllables(env);
  return h(
    'div',
    { class: 'hm-grid', dir: 'ltr', role: 'img', 'aria-label': env.t('grid.name', { text: gridText(env, pattern) }), ...(testid ? { 'data-testid': testid } : {}) },
    ...slots(pattern).map((s, i) =>
      h('span', { class: `hm-slot hm-slot--${s}`, 'aria-hidden': 'true' }, h('span', { class: 'hm-slot-sym' }, s === 'onset' ? '●' : s === 'held' ? '━' : '·'), h('span', { class: 'hm-slot-count' }, syl[i]!))
    )
  );
}
