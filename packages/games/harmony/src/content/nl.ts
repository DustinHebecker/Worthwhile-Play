import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: 'kleine secunde',
    M2: 'grote secunde',
    m3: 'kleine terts',
    M3: 'grote terts',
    P4: 'reine kwart',
    TT: 'tritonus',
    P5: 'reine kwint',
    m6: 'kleine sext',
    M6: 'grote sext',
    m7: 'kleine septiem',
    M7: 'grote septiem',
    P8: 'octaaf'
  },
  chords: {
    maj: 'grote drieklank (majeur)',
    min: 'kleine drieklank (mineur)',
    dim: 'verminderde drieklank',
    aug: 'overmatige drieklank',
    dom7: 'dominantseptiemakkoord',
    maj7: 'groot septiemakkoord (maj7)',
    min7: 'klein septiemakkoord (m7)'
  },
  scales: { major: 'majeurtoonladder', 'natural-minor': 'natuurlijke mineur', 'harmonic-minor': 'harmonische mineur', 'major-pentatonic': 'majeur-pentatoniek' },
  cadences: {
    finished: { name: 'Afgesloten', explain: 'De dominant (V) gaat terug naar de tonica (I): de frase klinkt af (volkomen cadens).' },
    open: { name: 'Open', explain: 'De frase stopt op de dominant (V): het klinkt als een vraag die op een vervolg wacht (halve cadens).' },
    surprise: { name: 'Verrassing', explain: 'De dominant (V) gaat naar vi in plaats van naar huis: je verwacht rust en de muziek buigt af (bedrieglijke cadens).' }
  },
  classes: { perfect: 'volkomen consonant', imperfect: 'onvolkomen consonant', mild: 'milde dissonant', sharp: 'scherpe dissonant' },
  semitones: { one: '{n} halve toon', other: '{n} halve tonen' },
  cents: { one: '{n} cent', other: '{n} cent' },
  waveRepeat: { one: 'Som van de grondtonen: herhaalt zich bij elke golf van de lagere toon.', other: 'Som van de grondtonen: herhaalt zich ongeveer elke {n} golven van de lagere toon.' },
  steps: { whole: 'H', half: '½', three: 'H+½' },
  up: 'omhoog',
  down: 'omlaag',
  tips: {
    interval: '{a} heeft {na}, {b} heeft {nb}. Tel de toetsen van de ene noot naar de andere, of de stappen op de notenbalk.',
    chord: 'Tel de gestapelde tertsen in halve tonen: {a} is {ta}, {b} is {tb}.',
    scale: 'Vergelijk de stappen: {a} gaat {pa}, {b} gaat {pb} (H = hele toon, ½ = halve toon).',
    pair: 'De stabielere klank heeft de eenvoudigere verhouding: {ra} bij {a}, {rb} bij {b}.',
    cadence: 'Het was {a}, niet {b}. Luister naar het laatste akkoord: komt het thuis (I), stopt het op V of buigt het af naar vi?',
    contour: 'Volg alleen omhoog en omlaag, stap voor stap: het ging {a}, niet {b}.',
    changed: 'Vergelijk A en B noot voor noot: noot {a} veranderde, niet noot {b}.',
    rhythm: 'Tel mee: „1 en 2 en 3 en 4 en”, en luister waar elke noot begint.'
  },
  learned: 'De meeste luisteraars die met westerse muziek zijn opgegroeid, horen het interval {name} als rustiger. Die voorkeur is deels aangeleerd (McDermott e.a. 2016).',
  ratioWhy: 'Hoe eenvoudiger de verhouding, hoe sneller de samengestelde golf zich herhaalt; de westerse harmonie hoort zulke klanken meestal als stabiel.',
  closing: {
    intervals: 'Intervallen zijn de bouwstenen van melodieën en akkoorden. Nog een ronde met andere begintonen kan altijd.',
    chords: 'Akkoorden zijn gestapelde tertsen; hun grootte geeft elk akkoord zijn kleur.',
    stability: '„Stabiel” en „gespannen” beschrijven hoe de westerse harmonie deze klanken meestal hoort; andere tradities horen ze anders.',
    melody: 'De vorm van een melodie volgen is een goede eerste stap om haar te zingen of te spelen.',
    rhythm: 'Wie de tel en zijn helften telt, kan elk ritme lezen.',
    build: 'Intervallen, akkoorden en toonladders met de hand bouwen laat zien hoe ze in elkaar zitten.'
  }
};
