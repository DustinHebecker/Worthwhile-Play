/*
 * Translator note (design § 18.1): use the standard music terms of each language (design Appendix B), never song
 * references ("the first two notes of …"), and "often heard as" for anything subjective. Keep the placeholders.
 */
import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: 'minor second',
    M2: 'major second',
    m3: 'minor third',
    M3: 'major third',
    P4: 'perfect fourth',
    TT: 'tritone',
    P5: 'perfect fifth',
    m6: 'minor sixth',
    M6: 'major sixth',
    m7: 'minor seventh',
    M7: 'major seventh',
    P8: 'octave'
  },
  chords: {
    maj: 'major chord',
    min: 'minor chord',
    dim: 'diminished chord',
    aug: 'augmented chord',
    dom7: 'dominant seventh chord',
    maj7: 'major seventh chord',
    min7: 'minor seventh chord'
  },
  scales: { major: 'major scale', 'natural-minor': 'natural minor scale', 'harmonic-minor': 'harmonic minor scale', 'major-pentatonic': 'major pentatonic scale' },
  cadences: {
    finished: { name: 'Finished', explain: 'The dominant (V) goes home to the tonic (I): the phrase sounds complete (an authentic cadence).' },
    open: { name: 'Open', explain: 'The phrase stops on the dominant (V): it sounds like a question that waits to go on (a half cadence).' },
    surprise: { name: 'Surprise', explain: 'The dominant (V) leads to vi instead of home: you expect rest, and the music turns aside (a deceptive cadence).' }
  },
  classes: { perfect: 'perfect consonance', imperfect: 'imperfect consonance', mild: 'mild dissonance', sharp: 'sharp dissonance' },
  semitones: { one: '{n} semitone', other: '{n} semitones' },
  cents: { one: '{n} cent', other: '{n} cents' },
  steps: { whole: 'W', half: 'H', three: 'W+H' },
  up: 'up',
  down: 'down',
  tips: {
    interval: '{a} has {na}, {b} has {nb}. Count the keys from one note to the other, or the steps on the staff.',
    chord: 'Count the stacked thirds in semitones: {a} is {ta}, {b} is {tb}.',
    scale: 'Compare the steps: {a} goes {pa}, {b} goes {pb} (W = whole tone, H = semitone).',
    pair: 'The more stable sound has the simpler ratio: {ra} for {a}, {rb} for {b}.',
    cadence: 'Listen to the last chord: does it return home ({a}), or does it stop elsewhere ({b})?',
    contour: 'Follow only up and down, step by step: it went {a}, not {b}.',
    changed: 'Compare A and B note by note: note {a} changed, not note {b}.',
    rhythm: 'Count along “1 & 2 & 3 & 4 &” and listen for where each note starts.'
  },
  learned: 'Most listeners who grew up with Western music hear the {name} as more at rest. This preference is partly learned (McDermott et al. 2016).',
  ratioWhy: 'The simpler the ratio, the sooner the combined wave repeats; Western harmony usually hears such sounds as stable.',
  closing: {
    intervals: 'Intervals are the building blocks of melodies and chords. Another round with other starting notes is always possible.',
    chords: 'Chords are built from stacked thirds; their sizes give each chord its colour.',
    stability: '“Stable” and “tense” describe how Western harmony usually hears these sounds; other traditions hear them differently.',
    melody: 'Following the shape of a melody is a good first step towards singing or playing it.',
    rhythm: 'Counting the beat and its halves makes any rhythm readable.',
    build: 'Building intervals, chords and scales by hand shows how they are made.'
  }
};
