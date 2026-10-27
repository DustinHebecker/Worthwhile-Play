import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: 'segunda menor',
    M2: 'segunda mayor',
    m3: 'tercera menor',
    M3: 'tercera mayor',
    P4: 'cuarta justa',
    TT: 'tritono',
    P5: 'quinta justa',
    m6: 'sexta menor',
    M6: 'sexta mayor',
    m7: 'séptima menor',
    M7: 'séptima mayor',
    P8: 'octava'
  },
  chords: {
    maj: 'acorde mayor',
    min: 'acorde menor',
    dim: 'acorde disminuido',
    aug: 'acorde aumentado',
    dom7: 'acorde de séptima de dominante',
    maj7: 'acorde de séptima mayor',
    min7: 'acorde de séptima menor'
  },
  scales: { major: 'escala mayor', 'natural-minor': 'escala menor natural', 'harmonic-minor': 'escala menor armónica', 'major-pentatonic': 'escala pentatónica mayor' },
  cadences: {
    finished: { name: 'Concluida', explain: 'La dominante (V) vuelve a la tónica (I): la frase suena terminada (cadencia auténtica).' },
    open: { name: 'Abierta', explain: 'La frase se detiene en la dominante (V): suena como una pregunta que espera continuar (semicadencia).' },
    surprise: { name: 'Sorpresa', explain: 'La dominante (V) va al vi en lugar de volver a casa: esperas reposo y la música se desvía (cadencia rota).' }
  },
  classes: { perfect: 'consonancia perfecta', imperfect: 'consonancia imperfecta', mild: 'disonancia suave', sharp: 'disonancia fuerte' },
  semitones: { one: '{n} semitono', other: '{n} semitonos' },
  cents: { one: '{n} cent', other: '{n} cents' },
  waveRepeat: { one: 'Suma de las fundamentales: se repite con cada onda de la nota grave.', other: 'Suma de las fundamentales: se repite más o menos cada {n} ondas de la nota grave.' },
  steps: { whole: 'T', half: 'S', three: 'T+S' },
  up: 'sube',
  down: 'baja',
  tips: {
    interval: '{a}: {na}; {b}: {nb}. Cuenta las teclas de una nota a la otra, o los pasos en el pentagrama.',
    chord: 'Cuenta las terceras apiladas en semitonos: {a} es {ta}; {b} es {tb}.',
    scale: 'Compara los pasos: {a} va {pa}; {b} va {pb} (T = tono, S = semitono).',
    pair: 'El sonido más estable tiene la proporción más sencilla: {ra} para {a}, {rb} para {b}.',
    cadence: 'Era {a}, no {b}. Escucha el último acorde: ¿vuelve a casa (I), se detiene en V o se desvía al vi?',
    contour: 'Sigue solo si sube o baja, paso a paso: fue {a}, no {b}.',
    changed: 'Compara A y B nota por nota: cambió la nota {a}, no la nota {b}.',
    rhythm: 'Cuenta «1 y 2 y 3 y 4 y» y escucha dónde empieza cada nota.'
  },
  learned: 'La mayoría de quienes crecieron con música occidental oyen la {name} como más en reposo. Esta preferencia es en parte aprendida (McDermott et al. 2016).',
  ratioWhy: 'Cuanto más sencilla es la proporción, antes se repite la onda combinada; la armonía occidental suele oír esos sonidos como estables.',
  closing: {
    intervals: 'Los intervalos son las piezas de las melodías y los acordes. Siempre puedes hacer otra ronda con otras notas de partida.',
    chords: 'Los acordes se forman apilando terceras; sus tamaños dan a cada acorde su color.',
    stability: '«Estable» y «tenso» describen cómo suele oír la armonía occidental estos sonidos; otras tradiciones los oyen de otra manera.',
    melody: 'Seguir la forma de una melodía es un buen primer paso para cantarla o tocarla.',
    rhythm: 'Contar el pulso y sus mitades permite leer cualquier ritmo.',
    build: 'Construir intervalos, acordes y escalas a mano muestra cómo están hechos.'
  }
};
