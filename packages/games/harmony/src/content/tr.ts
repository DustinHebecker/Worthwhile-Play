import type { ContentText } from './types';

export const content: ContentText = {
  intervals: {
    m2: 'küçük ikili',
    M2: 'büyük ikili',
    m3: 'küçük üçlü',
    M3: 'büyük üçlü',
    P4: 'tam dörtlü',
    TT: 'artık dörtlü (triton)',
    P5: 'tam beşli',
    m6: 'küçük altılı',
    M6: 'büyük altılı',
    m7: 'küçük yedili',
    M7: 'büyük yedili',
    P8: 'oktav'
  },
  chords: {
    maj: 'majör akor',
    min: 'minör akor',
    dim: 'eksik akor',
    aug: 'artık akor',
    dom7: 'dominant yedili akoru',
    maj7: 'majör yedili akoru',
    min7: 'minör yedili akoru'
  },
  scales: { major: 'majör dizi', 'natural-minor': 'doğal minör dizi', 'harmonic-minor': 'armonik minör dizi', 'major-pentatonic': 'majör pentatonik dizi' },
  cadences: {
    finished: { name: 'Tamamlanmış', explain: 'Dominant (V) toniğe (I) döner: cümle bitmiş gibi duyulur (tam kadans).' },
    open: { name: 'Açık', explain: 'Cümle dominantta (V) durur: devamını bekleyen bir soru gibi duyulur (yarım kadans).' },
    surprise: { name: 'Sürpriz', explain: 'Dominant (V) eve dönmek yerine vi’ye gider: dinlenme beklersiniz, müzik başka yöne döner (aldatıcı kadans).' }
  },
  classes: { perfect: 'tam konsonans', imperfect: 'eksik konsonans', mild: 'hafif disonans', sharp: 'sert disonans' },
  semitones: { one: '{n} yarım ses', other: '{n} yarım ses' },
  cents: { one: '{n} sent', other: '{n} sent' },
  waveRepeat: { one: 'Temel seslerin toplamı: pes notanın her dalgasında yinelenir.', other: 'Temel seslerin toplamı: pes notanın yaklaşık her {n} dalgasında bir yinelenir.' },
  steps: { whole: 'T', half: 'Y', three: 'T+Y' },
  up: 'yukarı',
  down: 'aşağı',
  tips: {
    interval: '{a}: {na}; {b}: {nb}. Bir notadan diğerine tuşları ya da porte üzerindeki basamakları say.',
    chord: 'Üst üste binen üçlüleri yarım ses olarak say: {a} {ta}, {b} {tb}.',
    scale: 'Adımları karşılaştır: {a} {pa}, {b} {pb} (T = tam ses, Y = yarım ses).',
    pair: 'Daha dengeli ses daha basit orana sahiptir: {a} için {ra}, {b} için {rb}.',
    cadence: 'Doğrusu {a}, {b} değil. Son akoru dinle: eve mi döner (I), V’de mi durur, yoksa vi’ye mi sapar?',
    contour: 'Yalnızca inişi ve çıkışı adım adım izle: {a} idi, {b} değil.',
    changed: 'A ve B’yi nota nota karşılaştır: değişen nota {a}, {b} değil.',
    rhythm: '“1 ve 2 ve 3 ve 4 ve” diye say ve her notanın nerede başladığını dinle.'
  },
  learned: 'Batı müziğiyle büyüyen dinleyicilerin çoğu {name} aralığını daha dingin duyar. Bu tercih kısmen öğrenilmiştir (McDermott ve ark. 2016).',
  ratioWhy: 'Oran ne kadar basitse birleşik dalga o kadar çabuk tekrar eder; Batı armonisi bu tür sesleri genellikle dengeli duyar.',
  closing: {
    intervals: 'Aralıklar melodilerin ve akorların yapı taşlarıdır. Başka başlangıç notalarıyla yeni bir tur her zaman mümkün.',
    chords: 'Akorlar üst üste binen üçlülerden oluşur; büyüklükleri her akora rengini verir.',
    stability: '“Dengeli” ve “gergin”, Batı armonisinin bu sesleri genellikle nasıl duyduğunu anlatır; başka gelenekler onları farklı duyar.',
    melody: 'Bir melodinin biçimini izlemek, onu söylemek ya da çalmak için iyi bir ilk adımdır.',
    rhythm: 'Vuruşu ve yarılarını saymak her ritmi okunur kılar.',
    build: 'Aralıkları, akorları ve dizileri elle kurmak nasıl yapıldıklarını gösterir.'
  }
};
