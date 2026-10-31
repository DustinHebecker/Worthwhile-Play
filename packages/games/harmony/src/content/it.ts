import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: 'seconda minore',
    M2: 'seconda maggiore',
    m3: 'terza minore',
    M3: 'terza maggiore',
    P4: 'quarta giusta',
    TT: 'tritono',
    P5: 'quinta giusta',
    m6: 'sesta minore',
    M6: 'sesta maggiore',
    m7: 'settima minore',
    M7: 'settima maggiore',
    P8: 'ottava'
  },
  chords: {
    maj: 'accordo maggiore',
    min: 'accordo minore',
    dim: 'accordo diminuito',
    aug: 'accordo aumentato',
    dom7: 'accordo di settima di dominante',
    maj7: 'accordo di settima maggiore',
    min7: 'accordo di settima minore'
  },
  scales: { major: 'scala maggiore', 'natural-minor': 'scala minore naturale', 'harmonic-minor': 'scala minore armonica', 'major-pentatonic': 'scala pentatonica maggiore' },
  cadences: {
    finished: { name: 'Conclusa', explain: 'La dominante (V) torna alla tonica (I): la frase suona finita (cadenza perfetta).' },
    open: { name: 'Aperta', explain: 'La frase si ferma sulla dominante (V): suona come una domanda che aspetta un seguito (cadenza sospesa).' },
    surprise: { name: 'Sorpresa', explain: 'La dominante (V) porta al vi invece che a casa: ti aspetti riposo e la musica devia (cadenza d’inganno).' }
  },
  classes: { perfect: 'consonanza perfetta', imperfect: 'consonanza imperfetta', mild: 'dissonanza lieve', sharp: 'dissonanza aspra' },
  semitones: { one: '{n} semitono', other: '{n} semitoni' },
  cents: { one: '{n} cent', other: '{n} cent' },
  waveRepeat: { one: 'Somma delle fondamentali: si ripete a ogni onda della nota grave.', other: 'Somma delle fondamentali: si ripete circa ogni {n} onde della nota grave.' },
  steps: { whole: 'T', half: 'S', three: 'T+S' },
  up: 'sale',
  down: 'scende',
  noteValues: {
    eighth: { single: 'croma', count: { other: '{n} crome' } },
    quarter: { single: 'semiminima', count: { other: '{n} semiminime' } },
    'dotted-quarter': { single: 'semiminima puntata', count: { other: '{n} semiminime puntate' } },
    half: { single: 'minima', count: { other: '{n} minime' } },
    'rest-eighth': { single: 'pausa di croma', count: { other: '{n} pause di croma' } },
    'rest-quarter': { single: 'pausa di semiminima', count: { other: '{n} pause di semiminima' } },
    'rest-half': { single: 'pausa di minima', count: { other: '{n} pause di minima' } }
  },
  tips: {
    interval: '{a}: {na}; {b}: {nb}. Conta i tasti da una nota all’altra, o i gradi sul pentagramma.',
    chord: 'Conta le terze sovrapposte in semitoni: {a} è {ta}, {b} è {tb}.',
    scale: 'Confronta i passi: {a} fa {pa}, {b} fa {pb} (T = tono, S = semitono).',
    pair: 'Il suono più stabile ha il rapporto più semplice: {ra} per {a}, {rb} per {b}.',
    cadence: 'Era {a}, non {b}. Ascolta l’ultimo accordo: torna a casa (I), si ferma sul V o devia verso il vi?',
    contour: 'Segui solo su e giù, passo dopo passo: era {a}, non {b}.',
    changed: 'Confronta A e B nota per nota: è cambiata la nota {a}, non la nota {b}.',
    rhythm: 'Conta «1 e 2 e 3 e 4 e» e ascolta dove inizia ogni nota.'
  },
  learned: 'La maggior parte di chi è cresciuto con la musica occidentale sente la {name} come più a riposo. Questa preferenza è in parte appresa (McDermott et al. 2016).',
  ratioWhy: 'Più semplice è il rapporto, prima si ripete l’onda combinata; l’armonia occidentale di solito sente questi suoni come stabili.',
  closing: {
    intervals: 'Gli intervalli sono i mattoni di melodie e accordi. Un altro giro con altre note di partenza è sempre possibile.',
    chords: 'Gli accordi sono fatti di terze sovrapposte; le loro dimensioni danno a ogni accordo il suo colore.',
    stability: '«Stabile» e «teso» descrivono come l’armonia occidentale di solito sente questi suoni; altre tradizioni li sentono in modo diverso.',
    melody: 'Seguire la forma di una melodia è un buon primo passo per cantarla o suonarla.',
    rhythm: 'Contare il battito e le sue metà rende leggibile qualsiasi ritmo.',
    build: 'Costruire a mano intervalli, accordi e scale mostra come sono fatti.'
  }
};
