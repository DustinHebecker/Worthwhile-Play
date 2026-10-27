import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: 'segunda menor',
    M2: 'segunda maior',
    m3: 'terça menor',
    M3: 'terça maior',
    P4: 'quarta justa',
    TT: 'trítono',
    P5: 'quinta justa',
    m6: 'sexta menor',
    M6: 'sexta maior',
    m7: 'sétima menor',
    M7: 'sétima maior',
    P8: 'oitava'
  },
  chords: {
    maj: 'acorde maior',
    min: 'acorde menor',
    dim: 'acorde diminuto',
    aug: 'acorde aumentado',
    dom7: 'acorde de sétima da dominante',
    maj7: 'acorde de sétima maior',
    min7: 'acorde de sétima menor'
  },
  scales: { major: 'escala maior', 'natural-minor': 'escala menor natural', 'harmonic-minor': 'escala menor harmônica', 'major-pentatonic': 'escala pentatônica maior' },
  cadences: {
    finished: { name: 'Concluída', explain: 'A dominante (V) volta para a tônica (I): a frase soa terminada (cadência perfeita).' },
    open: { name: 'Aberta', explain: 'A frase para na dominante (V): soa como uma pergunta esperando continuação (meia cadência).' },
    surprise: { name: 'Surpresa', explain: 'A dominante (V) vai para o vi em vez de voltar para casa: você espera repouso e a música desvia (cadência de engano).' }
  },
  classes: { perfect: 'consonância perfeita', imperfect: 'consonância imperfeita', mild: 'dissonância suave', sharp: 'dissonância forte' },
  semitones: { one: '{n} semitom', other: '{n} semitons' },
  cents: { one: '{n} cent', other: '{n} cents' },
  steps: { whole: 'T', half: 'S', three: 'T+S' },
  up: 'sobe',
  down: 'desce',
  tips: {
    interval: '{a}: {na}; {b}: {nb}. Conte as teclas de uma nota à outra, ou os graus na pauta.',
    chord: 'Conte as terças empilhadas em semitons: {a} é {ta}; {b} é {tb}.',
    scale: 'Compare os passos: {a} vai {pa}; {b} vai {pb} (T = tom, S = semitom).',
    pair: 'O som mais estável tem a razão mais simples: {ra} para {a}, {rb} para {b}.',
    cadence: 'Era {a}, não {b}. Ouça o último acorde: ele volta para casa (I), para no V ou desvia para o vi?',
    contour: 'Siga só se sobe ou desce, passo a passo: foi {a}, não {b}.',
    changed: 'Compare A e B nota por nota: mudou a nota {a}, não a nota {b}.',
    rhythm: 'Conte “1 e 2 e 3 e 4 e” e ouça onde cada nota começa.'
  },
  learned: 'A maioria das pessoas que cresceram com música ocidental ouve a {name} como mais em repouso. Essa preferência é em parte aprendida (McDermott et al. 2016).',
  ratioWhy: 'Quanto mais simples a razão, mais cedo a onda combinada se repete; a harmonia ocidental costuma ouvir esses sons como estáveis.',
  closing: {
    intervals: 'Os intervalos são as peças das melodias e dos acordes. Outra rodada com outras notas de partida é sempre possível.',
    chords: 'Acordes são feitos de terças empilhadas; os tamanhos delas dão a cada acorde a sua cor.',
    stability: '“Estável” e “tenso” descrevem como a harmonia ocidental costuma ouvir esses sons; outras tradições os ouvem de outro jeito.',
    melody: 'Seguir a forma de uma melodia é um bom primeiro passo para cantá-la ou tocá-la.',
    rhythm: 'Contar o tempo e as suas metades torna qualquer ritmo legível.',
    build: 'Montar intervalos, acordes e escalas à mão mostra como eles são feitos.'
  }
};
