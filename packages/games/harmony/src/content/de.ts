import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: 'kleine Sekunde',
    M2: 'große Sekunde',
    m3: 'kleine Terz',
    M3: 'große Terz',
    P4: 'reine Quarte',
    TT: 'Tritonus',
    P5: 'reine Quinte',
    m6: 'kleine Sexte',
    M6: 'große Sexte',
    m7: 'kleine Septime',
    M7: 'große Septime',
    P8: 'Oktave'
  },
  chords: {
    maj: 'Durdreiklang',
    min: 'Molldreiklang',
    dim: 'verminderter Dreiklang',
    aug: 'übermäßiger Dreiklang',
    dom7: 'Dominantseptakkord',
    maj7: 'großer Durseptakkord (Maj7)',
    min7: 'Mollseptakkord (m7)'
  },
  scales: { major: 'Dur-Tonleiter', 'natural-minor': 'natürliches Moll', 'harmonic-minor': 'harmonisches Moll', 'major-pentatonic': 'Dur-Pentatonik' },
  cadences: {
    finished: { name: 'Abgeschlossen', explain: 'Die Dominante (V) führt zurück zur Tonika (I): Die Phrase klingt fertig (authentischer Ganzschluss).' },
    open: { name: 'Offen', explain: 'Die Phrase endet auf der Dominante (V): Sie klingt wie eine Frage, die auf eine Fortsetzung wartet (Halbschluss).' },
    surprise: { name: 'Überraschung', explain: 'Die Dominante (V) führt zur VI. Stufe statt nach Hause: Man erwartet Ruhe, und die Musik biegt ab (Trugschluss).' }
  },
  classes: { perfect: 'vollkommene Konsonanz', imperfect: 'unvollkommene Konsonanz', mild: 'milde Dissonanz', sharp: 'scharfe Dissonanz' },
  semitones: { one: '{n} Halbton', other: '{n} Halbtöne' },
  cents: { one: '{n} Cent', other: '{n} Cent' },
  waveRepeat: { one: 'Summe der Grundtöne: wiederholt sich mit jeder Welle des tieferen Tons.', other: 'Summe der Grundtöne: wiederholt sich etwa alle {n} Wellen des tieferen Tons.' },
  steps: { whole: 'GT', half: 'HT', three: 'GT+HT' },
  up: 'aufwärts',
  down: 'abwärts',
  noteValues: {
    eighth: { single: 'Achtelnote', count: { other: '{n} Achtelnoten' } },
    quarter: { single: 'Viertelnote', count: { other: '{n} Viertelnoten' } },
    'dotted-quarter': { single: 'punktierte Viertelnote', count: { other: '{n} punktierte Viertelnoten' } },
    half: { single: 'halbe Note', count: { other: '{n} halbe Noten' } },
    'rest-eighth': { single: 'Achtelpause', count: { other: '{n} Achtelpausen' } },
    'rest-quarter': { single: 'Viertelpause', count: { other: '{n} Viertelpausen' } },
    'rest-half': { single: 'halbe Pause', count: { other: '{n} halbe Pausen' } }
  },
  tips: {
    interval: '{a} hat {na}, {b} hat {nb}. Zähle die Tasten von einem Ton zum anderen oder die Stufen im Notensystem.',
    chord: 'Zähle die geschichteten Terzen in Halbtönen: {a} ist {ta}, {b} ist {tb}.',
    scale: 'Vergleiche die Schritte: {a} geht {pa}, {b} geht {pb} (GT = Ganzton, HT = Halbton).',
    pair: 'Der stabilere Klang hat das einfachere Verhältnis: {ra} bei {a}, {rb} bei {b}.',
    cadence: 'Es war {a}, nicht {b}. Achte auf den letzten Akkord: Kehrt er nach Hause zurück (I), bleibt er auf V stehen oder biegt er zur VI ab?',
    contour: 'Folge nur auf und ab, Schritt für Schritt: Es ging {a}, nicht {b}.',
    changed: 'Vergleiche A und B Ton für Ton: Ton {a} hat sich verändert, nicht Ton {b}.',
    rhythm: 'Zähle mit „1 und 2 und 3 und 4 und“ und achte darauf, wo jeder Ton beginnt.'
  },
  learned: 'Die meisten Menschen, die mit westlicher Musik aufgewachsen sind, hören die {name} als ruhiger. Diese Vorliebe ist zum Teil gelernt (McDermott u. a. 2016).',
  ratioWhy: 'Je einfacher das Verhältnis, desto früher wiederholt sich die gemeinsame Welle; die westliche Harmonik hört solche Klänge meist als stabil.',
  closing: {
    intervals: 'Intervalle sind die Bausteine von Melodien und Akkorden. Eine weitere Runde mit anderen Starttönen ist jederzeit möglich.',
    chords: 'Akkorde sind aus Terzen geschichtet; ihre Größen geben jedem Akkord seine Farbe.',
    stability: '„Stabil“ und „gespannt“ beschreiben, wie die westliche Harmonik diese Klänge meist hört; andere Traditionen hören sie anders.',
    melody: 'Der Form einer Melodie zu folgen ist ein guter erster Schritt, um sie zu singen oder zu spielen.',
    rhythm: 'Wer den Schlag und seine Hälften zählt, kann jeden Rhythmus lesen.',
    build: 'Intervalle, Akkorde und Tonleitern von Hand zu bauen zeigt, wie sie gemacht sind.'
  }
};
