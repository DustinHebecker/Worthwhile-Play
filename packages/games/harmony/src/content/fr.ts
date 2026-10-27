import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: 'seconde mineure',
    M2: 'seconde majeure',
    m3: 'tierce mineure',
    M3: 'tierce majeure',
    P4: 'quarte juste',
    TT: 'triton',
    P5: 'quinte juste',
    m6: 'sixte mineure',
    M6: 'sixte majeure',
    m7: 'septième mineure',
    M7: 'septième majeure',
    P8: 'octave'
  },
  chords: {
    maj: 'accord majeur',
    min: 'accord mineur',
    dim: 'accord diminué',
    aug: 'accord augmenté',
    dom7: 'accord de septième de dominante',
    maj7: 'accord de septième majeure',
    min7: 'accord de septième mineure'
  },
  scales: { major: 'gamme majeure', 'natural-minor': 'gamme mineure naturelle', 'harmonic-minor': 'gamme mineure harmonique', 'major-pentatonic': 'gamme pentatonique majeure' },
  cadences: {
    finished: { name: 'Conclusive', explain: 'La dominante (V) revient à la tonique (I) : la phrase sonne terminée (cadence parfaite).' },
    open: { name: 'Ouverte', explain: 'La phrase s’arrête sur la dominante (V) : elle sonne comme une question qui attend la suite (demi-cadence).' },
    surprise: { name: 'Surprise', explain: 'La dominante (V) mène au vi au lieu de revenir à la tonique : on attend le repos et la musique bifurque (cadence rompue).' }
  },
  classes: { perfect: 'consonance parfaite', imperfect: 'consonance imparfaite', mild: 'dissonance douce', sharp: 'dissonance forte' },
  semitones: { one: '{n} demi-ton', other: '{n} demi-tons' },
  cents: { one: '{n} cent', other: '{n} cents' },
  waveRepeat: { one: 'Somme des fondamentales : se répète à chaque onde de la note grave.', other: 'Somme des fondamentales : se répète environ toutes les {n} ondes de la note grave.' },
  steps: { whole: 'T', half: '½', three: 'T½' },
  up: 'monte',
  down: 'descend',
  tips: {
    interval: '{a} : {na} ; {b} : {nb}. Compte les touches d’une note à l’autre, ou les degrés sur la portée.',
    chord: 'Compte les tierces superposées en demi-tons : {a} = {ta}, {b} = {tb}.',
    scale: 'Compare les pas : {a} fait {pa}, {b} fait {pb} (T = ton, ½ = demi-ton).',
    pair: 'Le son le plus stable a le rapport le plus simple : {ra} pour {a}, {rb} pour {b}.',
    cadence: 'C’était {a}, pas {b}. Écoute le dernier accord : revient-il à la maison (I), s’arrête-t-il sur V ou bifurque-t-il vers vi ?',
    contour: 'Suis seulement la montée et la descente, pas à pas : c’était {a}, pas {b}.',
    changed: 'Compare A et B note par note : c’est la note {a} qui a changé, pas la note {b}.',
    rhythm: 'Compte « 1 et 2 et 3 et 4 et » et écoute où commence chaque note.'
  },
  learned: 'La plupart des personnes qui ont grandi avec la musique occidentale perçoivent l’intervalle « {name} » comme plus au repos. Cette préférence est en partie apprise (McDermott et al. 2016).',
  ratioWhy: 'Plus le rapport est simple, plus vite l’onde combinée se répète ; l’harmonie occidentale entend le plus souvent ces sons comme stables.',
  closing: {
    intervals: 'Les intervalles sont les briques des mélodies et des accords. Une autre manche avec d’autres notes de départ est toujours possible.',
    chords: 'Les accords sont faits de tierces superposées ; leurs tailles donnent à chaque accord sa couleur.',
    stability: '« Stable » et « tendu » décrivent la façon dont l’harmonie occidentale entend le plus souvent ces sons ; d’autres traditions les entendent autrement.',
    melody: 'Suivre la forme d’une mélodie est un bon premier pas pour la chanter ou la jouer.',
    rhythm: 'Compter le temps et ses moitiés rend tout rythme lisible.',
    build: 'Construire des intervalles, des accords et des gammes à la main montre comment ils sont faits.'
  }
};
