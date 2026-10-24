import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'Mavi paket',
      story: 'Köşedeki dükkâna gönderici bilgisi olmayan bir paket geldi. Bu sokağa teslimat yapan depolardan birinden gelmiş olmalı.',
      lead: 'Bu sokaktaki paketlerin geldiği yer:',
      hyps: { north: 'Kuzey Deposu', south: 'Güney Deposu', east: 'Doğu Deposu' },
      clues: {
        blue: { label: 'Mavi kâğıda sarılı', seen: 'Paket mavi kâğıda sarılı.', notSeen: 'Paket mavi kâğıda sarılı değil.' },
        'brown-tape': { label: 'Kahverengi bantla kapalı', seen: 'Kahverengi bantla kapatılmış.', notSeen: 'Kahverengi bantla kapatılmamış.' },
        smudge: { label: 'Bulaşmış etiket', seen: 'Adres etiketi bulaşmış.', notSeen: 'Adres etiketi temiz.' },
        string: { label: 'İple bağlı', seen: 'İple bağlanmış.', notSeen: 'İple bağlanmamış.' },
        tuesday: { label: 'Salı günü geldi', seen: 'Salı günü geldi. Tüm depolar her iş günü teslimat yapıyor.', notSeen: 'Salı günü geldi. Tüm depolar her iş günü teslimat yapıyor.' },
        'echo-blue': { label: 'Komşu da gördü', seen: 'Komşu da paketin mavi olduğunu söylüyor – aynı paketi görmüş.', notSeen: 'Komşu da paketin mavi olduğunu söylüyor – aynı paketi görmüş.' }
      }
    },
    'c-garden': {
      title: 'Kemirilmiş çilekler',
      story: 'Gece biri çileklere dadanmış. Bu bahçede çilekleri atıştıran birkaç tür ziyaretçi olduğu biliniyor.',
      lead: 'Çileklerin kemirildiği gecelerde ziyaretçi:',
      hyps: { birds: 'Kuşlar', snails: 'Salyangozlar', hedgehog: 'Bir kirpi' },
      clues: {
        slime: { label: 'Parlak iz', seen: 'Yolda parlak bir iz var.', notSeen: 'Parlak bir iz yok.' },
        pecks: { label: 'Küçük gaga izleri', seen: 'Meyvelerde küçük gaga izleri var.', notSeen: 'Gaga izi yok.' },
        droppings: { label: 'Çitin altında dışkı', seen: 'Çitin altında dışkı var.', notSeen: 'Çitin altında hiçbir şey yok.' },
        'net-moved': { label: 'Kenara itilmiş file', seen: 'Tarhın üstündeki file kenara itilmiş.', notSeen: 'File hâlâ yerinde.' },
        rain: { label: 'Dün gece yağmur yağdı', seen: 'Dün gece yağmur yağdı – yağmurda hepsi dışarı çıkar.', notSeen: 'Dün gece yağmur yağdı – yağmurda hepsi dışarı çıkar.' },
        'echo-slime': { label: 'Sabah yine görüldü', seen: 'Komşun sana aynı parlak izi gösteriyor.', notSeen: 'Komşun sana aynı parlak izi gösteriyor.' }
      }
    },
    'c-rain': {
      title: 'Gece yağmur yağdı mı?',
      story: 'Gece evde değildin ve fidelerin yağmur alıp almadığını ya da şimdi sulanmaları gerekip gerekmediğini bilmek istiyorsun.',
      lead: 'Yılın bu zamanında geceler:',
      hyps: { rained: 'Yağmur yağdı', dry: 'Kuru kaldı' },
      clues: {
        'wet-grass': { label: 'Islak çimen', seen: 'Çimen ıslak (çiy de ıslatır).', notSeen: 'Çimen kuru.' },
        gauge: { label: 'Yağmur ölçerde su', seen: 'Yağmur ölçerde su var.', notSeen: 'Yağmur ölçer boş.' },
        puddle: { label: 'Kapının yanında su birikintisi', seen: 'Kapının yanında bir su birikintisi var.', notSeen: 'Kapının yanında su birikintisi yok.' },
        'snails-out': { label: 'Yolda salyangozlar', seen: 'Yola salyangozlar çıkmış.', notSeen: 'Yolda salyangoz yok.' },
        wind: { label: 'Masada yapraklar', seen: 'Rüzgâr masaya yaprak getirmiş – her durumda rüzgâr vardı.', notSeen: 'Rüzgâr masaya yaprak getirmiş – her durumda rüzgâr vardı.' }
      }
    },
    'c-bird': {
      title: 'Yemlikte hangi kuş vardı?',
      story: 'Yemlikteki küçük kahverengi kuşu uçup gitmeden önce yalnızca bir an gördün. Buradaki paylar bu yemlik için uydurulmuştur; gerçekleri yere göre değişir.',
      lead: 'Bu yemliğin küçük kahverengi ziyaretçileri:',
      hyps: { finch: 'Bir ispinoz', sparrow: 'Bir serçe' },
      clues: {
        'red-patch': { label: 'Bir kırmızı parıltı', seen: 'Başında bir kırmızı parıltı gördün.', notSeen: 'Hiç kırmızı görmedin.' },
        ground: { label: 'Yerde yem yedi', seen: 'Yemliğin altında yerde yem yedi.', notSeen: 'Yemliğin kendisinde yem yedi.' },
        song: { label: 'Cıvıl cıvıl bir ötüş', seen: 'Cıvıl cıvıl öttü.', notSeen: 'Yalnızca cikledi.' },
        group: { label: 'Bir grupla geldi', seen: 'Küçük bir grupla geldi.', notSeen: 'Yalnız geldi.' },
        morning: { label: 'Sabah', seen: 'Sabahın erken saatiydi – ikisi de o saatte gelir.', notSeen: 'Sabahın erken saatiydi – ikisi de o saatte gelir.' }
      }
    },
    'c-plant': {
      title: 'Boynu bükük saksı bitkisi',
      story: 'Ofisteki bitki boynunu bükmüş ve yaprakları sararmış. Bu ofiste genellikle iki şeyden biridir.',
      lead: 'Buradaki bitkiler boyun büktüğünde neden:',
      hyps: { water: 'Fazla su', light: 'Az ışık' },
      clues: {
        'wet-soil': { label: 'Islak toprak', seen: 'Toprak, sulamadan iki gün sonra hâlâ ıslak.', notSeen: 'Toprak kuru.' },
        leaning: { label: 'Pencereye eğilmiş', seen: 'Pencereye doğru eğiliyor.', notSeen: 'Dimdik duruyor.' },
        'soft-stem': { label: 'Yumuşak gövde dibi', seen: 'Gövdenin dibi yumuşak.', notSeen: 'Gövde sağlam.' },
        'pale-new': { label: 'Soluk yeni yapraklar', seen: 'Yeni yapraklar soluk ve küçük.', notSeen: 'Yeni yapraklar sağlıklı görünüyor.' },
        'pot-colour': { label: 'Mavi bir saksı', seen: 'Mavi bir saksıda – bu hiçbir şeyi değiştirmez.', notSeen: 'Mavi bir saksıda – bu hiçbir şeyi değiştirmez.' }
      }
    },
    'c-bus': {
      title: 'Otobüs neden geç kaldı?',
      story: 'Otobüsün bu sabah kırk dakika geç geldi.',
      lead: 'Bu otobüs çok geç kaldığında neden:',
      hyps: { jam: 'Bir trafik sıkışıklığı', breakdown: 'Bir arıza' },
      clues: {
        'others-late': { label: 'Başka otobüsler de geç', seen: 'Aynı yoldaki başka otobüsler de geç kalmıştı.', notSeen: 'Yoldaki diğer otobüsler zamanındaydı.' },
        replacement: { label: 'Başka bir otobüs geldi', seen: 'Her zamankinden farklı bir otobüs geldi.', notSeen: 'Her zamanki otobüs geldi.' },
        announcement: { label: 'Bir duyuru', seen: 'Ekranda şu yazıyordu: teknik arıza nedeniyle gecikme.', notSeen: 'Ekran bir neden göstermedi.' },
        'rush-hour': { label: 'Yoğun saatte', seen: 'Trafiğin yoğun olduğu saatti.', notSeen: 'Günün sakin bir saatiydi.' },
        rain: { label: 'Yağmur yağıyordu', seen: 'Yağmur yağıyordu – bu durakta bu fark yaratmaz.', notSeen: 'Yağmur yağıyordu – bu durakta bu fark yaratmaz.' }
      }
    }
  }
};
