import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: 'sekunda mała',
    M2: 'sekunda wielka',
    m3: 'tercja mała',
    M3: 'tercja wielka',
    P4: 'kwarta czysta',
    TT: 'tryton',
    P5: 'kwinta czysta',
    m6: 'seksta mała',
    M6: 'seksta wielka',
    m7: 'septyma mała',
    M7: 'septyma wielka',
    P8: 'oktawa'
  },
  chords: {
    maj: 'trójdźwięk durowy',
    min: 'trójdźwięk molowy',
    dim: 'trójdźwięk zmniejszony',
    aug: 'trójdźwięk zwiększony',
    dom7: 'septymowy akord dominantowy',
    maj7: 'wielki septymowy akord durowy (maj7)',
    min7: 'mały septymowy akord molowy (m7)'
  },
  scales: { major: 'gama durowa', 'natural-minor': 'gama molowa naturalna', 'harmonic-minor': 'gama molowa harmoniczna', 'major-pentatonic': 'pentatonika durowa' },
  cadences: {
    finished: { name: 'Zamknięta', explain: 'Dominanta (V) wraca do toniki (I): fraza brzmi na zakończoną (kadencja doskonała).' },
    open: { name: 'Otwarta', explain: 'Fraza zatrzymuje się na dominancie (V): brzmi jak pytanie, które czeka na dalszy ciąg (półkadencja).' },
    surprise: { name: 'Niespodzianka', explain: 'Dominanta (V) prowadzi do vi zamiast do toniki: spodziewasz się spoczynku, a muzyka skręca (kadencja zwodnicza).' }
  },
  classes: { perfect: 'konsonans doskonały', imperfect: 'konsonans niedoskonały', mild: 'dysonans łagodny', sharp: 'dysonans ostry' },
  semitones: { one: '{n} półton', few: '{n} półtony', many: '{n} półtonów', other: '{n} półtonu' },
  cents: { one: '{n} cent', few: '{n} centy', many: '{n} centów', other: '{n} centa' },
  waveRepeat: { one: 'Suma tonów podstawowych: powtarza się z każdą falą niższego dźwięku.', few: 'Suma tonów podstawowych: powtarza się mniej więcej co {n} fale niższego dźwięku.', many: 'Suma tonów podstawowych: powtarza się mniej więcej co {n} fal niższego dźwięku.', other: 'Suma tonów podstawowych: powtarza się mniej więcej co {n} fali niższego dźwięku.' },
  steps: { whole: '1', half: '½', three: '1½' },
  up: 'w górę',
  down: 'w dół',
  noteValues: {
    eighth: { single: 'ósemka', count: { few: '{n} ósemki', many: '{n} ósemek', other: '{n} ósemki' } },
    quarter: { single: 'ćwierćnuta', count: { few: '{n} ćwierćnuty', many: '{n} ćwierćnut', other: '{n} ćwierćnuty' } },
    'dotted-quarter': { single: 'ćwierćnuta z kropką', count: { few: '{n} ćwierćnuty z kropką', many: '{n} ćwierćnut z kropką', other: '{n} ćwierćnuty z kropką' } },
    half: { single: 'półnuta', count: { few: '{n} półnuty', many: '{n} półnut', other: '{n} półnuty' } },
    'rest-eighth': { single: 'pauza ósemkowa', count: { few: '{n} pauzy ósemkowe', many: '{n} pauz ósemkowych', other: '{n} pauzy ósemkowe' } },
    'rest-quarter': { single: 'pauza ćwierćnutowa', count: { few: '{n} pauzy ćwierćnutowe', many: '{n} pauz ćwierćnutowych', other: '{n} pauzy ćwierćnutowe' } },
    'rest-half': { single: 'pauza półnutowa', count: { few: '{n} pauzy półnutowe', many: '{n} pauz półnutowych', other: '{n} pauzy półnutowe' } }
  },
  tips: {
    interval: '{a}: {na}; {b}: {nb}. Policz klawisze od jednej nuty do drugiej albo stopnie na pięciolinii.',
    chord: 'Policz nałożone tercje w półtonach: {a} to {ta}, {b} to {tb}.',
    scale: 'Porównaj kroki: {a} idzie {pa}, {b} idzie {pb} (1 = cały ton, ½ = półton).',
    pair: 'Bardziej stabilny dźwięk ma prostszy stosunek: {ra} dla {a}, {rb} dla {b}.',
    cadence: 'To była {a}, nie {b}. Posłuchaj ostatniego akordu: wraca do domu (I), zatrzymuje się na V czy skręca do vi?',
    contour: 'Śledź tylko górę i dół, krok po kroku: było {a}, nie {b}.',
    changed: 'Porównaj A i B nuta po nucie: zmieniła się nuta {a}, nie nuta {b}.',
    rhythm: 'Licz „1 i 2 i 3 i 4 i” i słuchaj, gdzie zaczyna się każda nuta.'
  },
  learned: 'Większość osób wychowanych na muzyce zachodniej słyszy interwał „{name}” jako spokojniejszy. Ta preferencja jest częściowo wyuczona (McDermott i in. 2016).',
  ratioWhy: 'Im prostszy stosunek, tym szybciej powtarza się połączona fala; harmonia zachodnia zwykle słyszy takie brzmienia jako stabilne.',
  closing: {
    intervals: 'Interwały to cegiełki melodii i akordów. Zawsze możesz zagrać kolejną rundę z innymi dźwiękami startowymi.',
    chords: 'Akordy składają się z nałożonych tercji; ich wielkości nadają każdemu akordowi jego barwę.',
    stability: '„Stabilny” i „napięty” opisują, jak harmonia zachodnia zwykle słyszy te brzmienia; inne tradycje słyszą je inaczej.',
    melody: 'Śledzenie kształtu melodii to dobry pierwszy krok, by ją zaśpiewać albo zagrać.',
    rhythm: 'Liczenie miary i jej połówek pozwala odczytać każdy rytm.',
    build: 'Budowanie interwałów, akordów i gam ręcznie pokazuje, jak są zrobione.'
  }
};
