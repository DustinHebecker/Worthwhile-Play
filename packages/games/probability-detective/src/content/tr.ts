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
    'c-cups': {
      title: 'Çatlak fincan',
      story: 'Bir müşteri ince bir çatlağı olan fincanı geri getiriyor. Atölyedeki tüm makineler aynı fincanı yapar, ama her birinin kendine özgü huyları vardır.',
      lead: 'Atölyenin fincanlarını yapan:',
      hyps: { a: 'A makinesi', b: 'B makinesi', c: 'C makinesi' },
      clues: {
        crack: { label: 'İnce çatlak', seen: 'Fincanda ince bir çatlak var.', notSeen: 'Fincanda ince bir çatlak var.' },
        glaze: { label: 'Daha koyu sır', seen: 'Sır her zamankinden biraz daha koyu.', notSeen: 'Sır normal görünüyor.' },
        stamp: { label: 'Tabanda net damga', seen: 'Tabandaki üretici damgası net.', notSeen: 'Tabandaki damga bulanık.' },
        handle: { label: 'Kulp biraz kaymış', seen: 'Kulp biraz ortadan kaymış.', notSeen: 'Kulp düz.' },
        box: { label: 'Gri bir kutuda', seen: 'Her zamanki gri kutuda geldi — tüm makinelerin fincanları gibi.', notSeen: 'Her zamanki gri kutuda geldi — tüm makinelerin fincanları gibi.' }
      }
    },
    'c-key': {
      title: 'Kayıp anahtar',
      story: 'Yedek anahtar yine kayıp. Neredeyse her zaman aynı birkaç yerden birindedir.',
      lead: 'Anahtar kaybolunca şurada çıkar:',
      hyps: { coat: 'Montta', car: 'Arabada', office: 'Ofiste' },
      clues: {
        'search-coat': { label: 'Montta hızlı arama onu bulur', seen: 'Anahtarı montta buluyorsun.', notSeen: 'Montun ceplerine hızlıca bakıyorsun: anahtar yok. Hızlı bir arama onu kaçırabilir.' },
        'search-car': { label: 'Arabaya hızlı bakış onu bulur', seen: 'Anahtarı arabada buluyorsun.', notSeen: 'Arabaya hızlıca bakıyorsun: anahtar yok. Hızlı bir bakış onu kaçırabilir.' },
        jingle: { label: 'Koridorda bir şıngırtı', seen: 'Mont asılırken bir şıngırtı duyduğunu hatırlıyorsun.', notSeen: 'Hiç şıngırtı hatırlamıyorsun.' },
        drove: { label: 'Dün araba kullandın', seen: 'Dün araba kullandın.', notSeen: 'Dün araba kullanmadın.' },
        'office-day': { label: 'Ofisteydin', seen: 'Dün ofisteydin.', notSeen: 'Dün evden çalıştın.' },
        weekday: { label: 'Hafta içi', seen: 'Bugün hafta içi — bu, anahtarların nereye düştüğünü değiştirmez.', notSeen: 'Bugün hafta içi — bu, anahtarların nereye düştüğünü değiştirmez.' }
      }
    },
    'c-coin': {
      title: 'Panayırdan gelen madeni para',
      story: 'Sihirbazlık malzemesi satan bir panayır tezgâhında eski bir madeni para buldun. Bakarak sıradan bir paradan ayırt edemiyorsun, o yüzden onu atıyorsun.',
      lead: 'Tezgâhın eski para kutusundaki paralar:',
      hyps: { ordinary: 'Sıradan bir para', weighted: 'Ağırlıklı bir para', 'two-headed': 'İki yüzü de tura olan bir para' },
      clues: {
        toss1: { label: 'İlk atışta tura', seen: 'İlk atış: tura.', notSeen: 'İlk atış: yazı.' },
        toss2: { label: 'İkinci atışta tura', seen: 'İkinci atış: tura.', notSeen: 'İkinci atış: yazı.' },
        toss3: { label: 'Üçüncü atışta tura', seen: 'Üçüncü atış: tura.', notSeen: 'Üçüncü atış: yazı.' },
        toss4: { label: 'Dördüncü atışta tura', seen: 'Dördüncü atış: tura.', notSeen: 'Dördüncü atış: yazı.' }
      }
    },
    'c-message': {
      title: '“Kulüpten” gelen mesaj',
      story: 'Bir mesaj spor kulübünden geldiğini söylüyor ve üyeliğini onaylamanı istiyor.',
      lead: 'Kulüpten geldiğini söyleyen mesajlar:',
      hyps: { real: 'Gerçekten kulüpten', fake: 'Sahte' },
      clues: {
        link: { label: 'Bağlantı içeriyor', seen: 'Bir bağlantı içeriyor.', notSeen: 'Bağlantı içermiyor.' },
        sender: { label: 'Tanımadık gönderen adresi', seen: 'Gönderen adresi kulübün her zamanki adresi değil.', notSeen: 'Gönderen adresi her zamanki.' },
        hurry: { label: 'Acele ettiriyor', seen: 'Bugün cevap vermen gerektiğini söylüyor.', notSeen: 'Süre vermiyor.' },
        'your-name': { label: 'Adını kullanıyor', seen: 'Seni adınla selamlıyor.', notSeen: 'Yalnızca “Sayın üye” diyor.' },
        evening: { label: 'Akşam geldi', seen: 'Akşam geldi — iki tür de her saatte gelir.', notSeen: 'Akşam geldi — iki tür de her saatte gelir.' }
      }
    },
    'c-oven': {
      title: 'Yanık ekmek',
      story: 'Bu sabahki partiden bir ekmeğin bir yanı yanmış. Fırın iki ayrı fırında pişiriyor.',
      lead: 'Buradaki ekmekler şurada pişer:',
      hyps: { old: 'Eski fırın', new: 'Yeni fırın' },
      clues: {
        'burnt-side': { label: 'Bir yanı yanık', seen: 'Bir yanı yanık.', notSeen: 'Bir yanı yanık.' },
        'pale-top': { label: 'Soluk üst', seen: 'Üstü soluk.', notSeen: 'Üstü eşit kızarmış.' },
        'tray-mark': { label: 'Yeni tepsilerin deseni', seen: 'Altında yeni tepsilerin deseni var.', notSeen: 'Altı düz.' },
        early: { label: 'İlk partiden', seen: 'İlk partiden çıktı.', notSeen: 'Sonraki bir partiden çıktı.' },
        seeds: { label: 'Üstünde tohum', seen: 'Üstünde tohum var — iki fırın da tohumlu ekmek pişirir.', notSeen: 'Üstünde tohum var — iki fırın da tohumlu ekmek pişirir.' }
      }
    },
    'c-beep': {
      title: 'Telsizdeki zayıf bip',
      story: 'Radyo kulübünün alıcısı zayıf, düzenli bir bip sesi yakaladı. Bu tür bip seslerinin çoğu parazittir, ama tepeden küçük bir uydu da geçer.',
      lead: 'Bu alıcıdaki zayıf düzenli bip sesleri:',
      hyps: { satellite: 'Küçük bir uydunun sinyali', interference: 'Sıradan parazit' },
      clues: {
        'pass-time': { label: 'Uydu geçişi sırasında', seen: 'Uydunun tepeden geçmesi gereken anda geldi.', notSeen: 'Geçiş beklenmediği bir anda geldi.' },
        drift: { label: 'Ton yavaşça kayıyor', seen: 'Ton, hareket eden bir kaynağınki gibi yavaşça kayıyor.', notSeen: 'Ton sabit kalıyor.' },
        fades: { label: 'Bir süre sonra kayboluyor', seen: 'Yaklaşık on dakika sonra kayboluyor.', notSeen: 'Durmadan sürüyor.' },
        rhythm: { label: 'Düzenli bir ritim', seen: 'Düzenli bir ritimle bip ediyor — ikisi de öyle yapar.', notSeen: 'Düzenli bir ritimle bip ediyor — ikisi de öyle yapar.' },
        'other-receiver': { label: 'İkinci bir alıcı da duyuyor', seen: 'Şehrin öbür ucundaki bir kulüp üyesi de duyuyor.', notSeen: 'Şehrin öbür ucundaki alıcı hiçbir şey duymuyor.' }
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
  },
checks: {
    'k-picnic': {
      title: 'Dışarıda mı, salonda mı?',
      story: 'Mahalle pikniği bu öğleden sonra. Çimenlikte yapabilir ya da mahalle salonunu kiralayabilirsin.',
      lead: 'Yılın bu zamanında öğleden sonralar:',
      hyps: { dry: 'Kuru', rain: 'Yağmurlu' },
      question: 'Kuru bir öğleden sonra ne kadar olası?',
      options: { outdoors: 'Çimenlikte piknik', hall: 'Salonu kirala', tent: 'Çimenliğe çadır kur' },
      checks: {
        sky: { label: 'Öğlen gökyüzüne bak', yes: 'Öğlene kadar kara bulutlar.', no: 'Öğlene kadar kara bulut yok.' },
        barometer: { label: 'Barometreye bak', yes: 'Barometre düşüyor.', no: 'Barometre sabit.' },
        farmer: { label: 'Yandaki çiftçiye sor', yes: 'Çiftçi yağmur bekliyor.', no: 'Çiftçi kuru bir öğleden sonra bekliyor.' },
        service: { label: 'Meteoroloji servisini ara', yes: 'Meteoroloji yağmur uyarısı veriyor.', no: 'Meteoroloji uyarı vermiyor.' },
        swallows: { label: 'Kırlangıçları izle', yes: 'Kırlangıçlar alçaktan uçuyor.', no: 'Kırlangıçlar yüksekten uçuyor.' }
      }
    },
    'k-bike': {
      title: 'İkinci el bisikleti alalım mı?',
      story: 'İkinci el bir bisiklet iyi bir fiyata satılıyor. Böyle bisikletler genelde sağlamdır, ama bazılarında gizli hasar vardır.',
      lead: 'Bunun gibi ikinci el bisikletler:',
      hyps: { sound: 'Sağlam', damaged: 'Gizli hasarlı' },
      question: 'Bisikletin sağlam olması ne kadar olası?',
      options: { buy: 'Satın al', skip: 'Alma', 'offer-less': 'Daha az teklif et ve riski göze al' },
      checks: {
        ride: { label: 'Deneme sürüşü yap', yes: 'Deneme sürüşü pürüzsüz.', no: 'Deneme sürüşü sarsıntılı.' },
        chain: { label: 'Zincire bak', yes: 'Zincir paslı.', no: 'Zincir temiz.' },
        receipts: { label: 'Tamir fişlerini sor', yes: 'Satıcının tamir fişleri var.', no: 'Satıcının fişi yok.' },
        mechanic: { label: 'Bir tamirciye para verip baktır', yes: 'Tamirci bir sorun buluyor.', no: 'Tamirci bir şey bulmuyor.' },
        'seller-says': { label: 'Satıcıya sor', yes: 'Satıcı sağlam olduğunu söylüyor.', no: 'Satıcı emin değil.' }
      }
    },
    'k-seeds': {
      title: 'Eski tohumları ekelim mi?',
      story: 'Kulübede unutulmuş bir tohum paketi çıktı. Ekmek bir hafta sonu sürer; taze tohumların biraz maliyeti var.',
      lead: 'Bunun gibi unutulmuş paketler:',
      hyps: { good: 'Hâlâ iyi', dead: 'Çoğu ölü' },
      question: 'Tohumların hâlâ iyi olması ne kadar olası?',
      options: { sow: 'Eski tohumları ek', fresh: 'Taze tohum al' },
      checks: {
        float: { label: 'Birkaçını suya koy', yes: 'Tohumların çoğu batıyor.', no: 'Tohumların çoğu yüzüyor.' },
        sprout: { label: 'Birkaçını nemli bezde dene', yes: 'Çoğu filizleniyor.', no: 'Azı filizleniyor.' },
        date: { label: 'Paketin tarihini oku', yes: 'Tarih yeni.', no: 'Tarih eski.' },
        shrivelled: { label: 'Tohumlara yakından bak', yes: 'Tohumlar buruşuk görünüyor.', no: 'Tohumlar dolgun görünüyor.' },
        smell: { label: 'Kokla', yes: 'Taze kokuyorlar.', no: 'Küf kokuyorlar.' }
      }
    },
    'k-melon': {
      title: 'Bu kavunu alalım mı?',
      story: 'Pazarda iyi fiyata bir kavun kalmış.',
      lead: 'Bu saatte bu tezgâhta kalan kavunlar:',
      hyps: { ripe: 'Olgun', unripe: 'Henüz olmamış' },
      question: 'Kavunun olgun olması ne kadar olası?',
      options: { buy: 'Satın al', leave: 'Bırak' },
      checks: {
        knock: { label: 'Üstüne vur', yes: 'Boş bir ses çıkarıyor.', no: 'Tok bir ses çıkarıyor.' },
        smell: { label: 'Kokla', yes: 'Tatlı kokuyor.', no: 'Neredeyse hiç kokmuyor.' },
        'soft-end': { label: 'Ucuna bastır', yes: 'Ucu biraz esniyor.', no: 'Ucu sert.' },
        taste: { label: 'Aynı kasadan bir dilim tat', yes: 'Dilim tatlı.', no: 'Dilim tatsız.' },
        sticker: { label: 'Etiketi oku', yes: 'Üstünde “olgun” etiketi var.', no: 'Etiketi yok.' }
      }
    },
    'k-bread': {
      title: 'Pazar için fazladan pişirelim mi?',
      story: 'Yarın pazar günü. Fazla ekmek kalabalık bir günde iyi satılır, ama sakin bir günde bayatlar.',
      lead: 'Buradaki pazar günleri:',
      hyps: { busy: 'Kalabalık', quiet: 'Sakin' },
      question: 'Kalabalık bir pazar günü ne kadar olası?',
      options: { extra: 'Çok fazla pişir', normal: 'Her zamanki kadar pişir', 'little-extra': 'Biraz fazla pişir' },
      checks: {
        calendar: { label: 'Şehir takvimine bak', yes: 'Takvimde bir etkinlik var.', no: 'Takvimde bir şey yok.' },
        neighbour: { label: 'Peynir tezgâhına sor', yes: 'Peynir tezgâhı kalabalık bekliyor.', no: 'Peynir tezgâhı sakin bir gün bekliyor.' },
        sunny: { label: 'Hava tahminini oku', yes: 'Güneş bekleniyor.', no: 'Bulut bekleniyor.' },
        office: { label: 'Pazar ofisini ara', yes: 'Pazar ofisi çok ziyaretçi bekliyor.', no: 'Pazar ofisi olağan bir gün bekliyor.' },
        'last-week': { label: 'Geçen haftayı düşün', yes: 'Geçen hafta kalabalıktı.', no: 'Geçen hafta sakindi.' }
      }
    },
    'k-laptop': {
      title: 'Kendin mi tamir edersin?',
      story: 'Dizüstü bilgisayar rastgele kapanıyor. Arıza küçükse evde tamir ucuzdur, ama büyükse boşa emek olur.',
      lead: 'Bunun gibi arızalar:',
      hyps: { minor: 'Küçük bir arıza', major: 'Büyük bir arıza' },
      question: 'Küçük bir arıza ne kadar olası?',
      options: { repair: 'Evde tamir et', shop: 'Servise götür', wait: 'Bekle ve izle' },
      checks: {
        'error-code': { label: 'Yeniden başlat ve izle', yes: 'Bir hata kodu çıkıyor.', no: 'Hata kodu çıkmıyor.' },
        diagnostics: { label: 'Tanı aracını çalıştır', yes: 'Araç bir arıza bildiriyor.', no: 'Araç hiçbir şey bildirmiyor.' },
        cable: { label: 'Güç kablosunu değiştir', yes: 'Başka bir kabloyla çalışıyor.', no: 'Hâlâ kapanıyor.' },
        fan: { label: 'Fanı dinle', yes: 'Fan sürtünme sesi çıkarıyor.', no: 'Fan normal ses çıkarıyor.' },
        forum: { label: 'Forumu oku', yes: 'Bu modeli kullanan başkaları küçük bir şey olduğunu söylüyor.', no: 'Bu modeli kullanan başkaları farklı nedenler anlatıyor.' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: 'Lamba sensörü',
      story: 'Belediye eski sokak lambalarını bir sensörle kontrol ediyor. Tüm lambaların {f} kadarı gerçekten arızalı. Sensör arızalı lambaların {s} kadarını işaretliyor, ama yanlışlıkla çalışan lambaların {q} kadarını da işaretliyor. Az önce {lamp} numaralı lamba işaretlendi.',
      questions: { q1: '{lamp} numaralı lamba daha çok arızalı mı, yoksa çalışıyor mu?', q2: '{lamp} numaralı lambanın arızalı olması ne kadar olası?' },
      options: { faulty: 'Daha çok arızalı', working: 'Daha çok çalışıyor' },
      explain: 'İşaretlenen lambaları say: işaretlenen {n} lambanın {k} tanesi gerçekten arızalı, yani olasılık {p}. Bir işarete güvenilip güvenilemeyeceği yalnızca sensörün kalitesine değil, arızalı lambaların ne kadar nadir olduğuna da bağlıdır.',
      labels: { faulty: 'Arızalı lambalar', working: 'Çalışan lambalar', fit: 'işaretlenen' }
    },
    't-wheel': {
      title: 'Çark',
      story: 'Adil bir çarkta {k} eşit dilim var ve bunların {r} tanesinde yıldız var. Son {s} çevirmede hep yıldız kaçtı.',
      questions: { q1: 'Bir sonraki çevirmede yıldız…', q2: 'Bir sonraki çevirmede yıldız ne kadar olası?' },
      options: { more: 'her zamankinden daha olası', less: 'her zamankinden daha az olası', same: 'her zamanki kadar olası' },
      explain: 'Çarkın hafızası yoktur: her çevirme sıfırdan başlar, bu yüzden yıldız hâlâ zamanın {p} kadarında gelir.',
      labels: { spins: 'Kaçan çevirmeler ve bir sonraki' }
    },
    't-sequence': {
      title: 'Hangi sonuç daha olası?',
      story: 'Adil bir para {n} kez atılıyor (● tura, ○ yazı). İki olası sonuç: A {a} ve B {b}.',
      questions: { q1: 'Hangi tam sonuç daha olası?', q2: 'Tam olarak B sonucu ne kadar olası?' },
      options: { a: 'A', b: 'B', same: 'İkisi de eşit olası' },
      explain: '{total} olası sonuç var ve her tam sonucun olasılığı aynı: {p}. B yalnızca daha tipik görünür, çünkü karışık sonuçlar bir grup olarak sık görülür.',
      labels: { a: 'A', b: 'B' }
    },
    't-conjunction': {
      title: 'Yağmur ve rüzgâr',
      story: 'Yarının hava tahmini yağmura {a} şans veriyor. Burada yağmurlu günlerin {b} kadarında, kuru günlerin {w} kadarında rüzgâr çıkar.',
      questions: { q1: 'Yarın hangisi daha olası?', q2: 'Hem yağmurlu hem rüzgârlı bir gün ne kadar olası?' },
      options: { windy: 'Rüzgârlı bir gün', both: 'Yağmurlu ve rüzgârlı bir gün', same: 'İkisi aynı' },
      explain: 'Yarın gibi {days} gün düşün: {both} tanesi yağmurlu ve rüzgârlı, ama toplam {windy} tanesi rüzgârlı. Her yağmurlu ve rüzgârlı gün aynı zamanda rüzgârlı bir gündür, bu yüzden “yağmurlu ve rüzgârlı” asla “rüzgârlı”dan daha olası olamaz.',
      labels: { windy: 'Rüzgârlı', calm: 'Rüzgârsız', rainy: 'Yağmurlu günler', dry: 'Kuru günler' }
    },
    't-simpson': {
      title: 'İki kargo şirketi',
      story: 'İki kargo şirketi geçen ay ne sıklıkla zamanında teslim ettiklerini bildiriyor. A şirketi: kısa rotalar {aSn} içinde {aSk}, uzun rotalar {aLn} içinde {aLk}. B şirketi: kısa rotalar {bSn} içinde {bSk}, uzun rotalar {bLn} içinde {bLk}.',
      questions: { q1: 'Toplamda hangi şirket daha sık zamanında teslim etti?', q2: 'Paketin uzun bir rotadan gidecek. Uzun rotalarda hangi şirketin sicili daha iyi?' },
      options: { a: 'A şirketi', b: 'B şirketi', same: 'İkisi aynı' },
      explain: 'A hem kısa hem uzun rotalarda daha iyi, ama yine de B toplamda daha iyi ({a} teslimata karşı {b} zamanında teslimat), çünkü B çoğunlukla daha kolay kısa rotalarda çalışıyor. Benzeri benzerle karşılaştır.',
      labels: { a: 'A şirketi', b: 'B şirketi', short: 'Kısa rotalar', long: 'Uzun rotalar', overall: 'Toplam' }
    },
    't-paw': {
      title: 'Undaki pati izi',
      story: 'Gece biri fırının zeminindeki unun üstünden yürümüş. Pati izi komşuların kedisininkiyle uyuşuyor. Kedilerin yalnızca {r} tanesinde böyle bir iz var. Yaklaşık {n} kedi içeri girebilecek kadar yakında yaşıyor.',
      questions: { q1: '“Yalnızca {r}” demek, neredeyse kesin komşuların kedisi olduğu anlamına mı gelir?', q2: 'Komşuların kedisi olması ne kadar olası? Yakındaki her kedinin içeri girme olasılığının eşit olduğunu varsay.' },
      options: { yes: 'Evet, yaklaşık {sure} eminim', no: 'Hayır, çok daha az emin olunur' },
      explain: 'Yakındaki {n} kedi arasında yaklaşık {others} kedide daha uyan bir iz var. Komşuların kedisi, uyan birkaç kediden yalnızca biri: {p}.',
      labels: { neighbour: 'Komşuların kedisinin girdiği geceler', others: 'Başka bir kedinin girdiği geceler', fit: 'iz uyuşuyor' }
    },
    't-bakery': {
      title: 'Küçük ve büyük fırın',
      story: 'İki fırın çavdar ve buğday ekmeği satıyor. Ortalamada satılan ekmeklerin yarısı çavdar ve her ekmek ayrı bir seçim. Küçük fırın günde {n1} ekmek, büyük fırın {n2} ekmek satıyor.',
      questions: { q1: 'Hangi fırında satılan ekmeklerin {t} kadarından fazlasının çavdar olduğu gün sayısı daha fazla?', q2: 'Küçük fırın günlerin ne kadarında {t} üzerinde çavdar satıyor?' },
      options: { small: 'Küçük fırın', large: 'Büyük fırın', same: 'Aşağı yukarı aynı' },
      explain: 'Küçük örneklemler daha çok dalgalanır. Küçük fırında böyle günler zamanın {small} kadarında olur, büyük fırında yalnızca {large} kadarında.',
      labels: { small: 'Küçük fırın', large: 'Büyük fırın' }
    },
    't-drawers': {
      title: 'Bilen hademe',
      story: '{n} kapalı çekmeceden birinde anahtar var. Bir çekmeceyi gösteriyorsun. Anahtarın nerede olduğunu bilen hademe, diğer çekmecelerden {opened} tanesini açıyor, hepsi boş, ve tam olarak bir başka çekmeceyi kapalı bırakıyor. Hep böyle yapar ve seninkini asla açmaz.',
      questions: { q1: 'Çekmecende mi kalırsın, yoksa öbür kapalı çekmeceye mi geçersin?', q2: 'Anahtarın öbür kapalı çekmecede olması ne kadar olası?' },
      options: { switch: 'Değiştir', keep: 'Çekmecemde kalırım', same: 'Fark etmez' },
      explain: '{total} oyun düşün. İlk seçimin bunların yalnızca bir kısmında doğru. Geri kalan {wins} oyunda hademe anahtarın olduğu çekmeceyi kapalı bırakmak zorunda, yani değiştirmek kazanır: {p}.',
      labels: { right: 'İlk seçiminde anahtarın olduğu oyunlar', wrong: 'Olmadığı oyunlar', fit: 'değiştirmek kazanır' }
    },
    't-week': {
      title: 'En az bir yağmurlu gün',
      story: '{m} günlük bir yolculuk planlıyorsun. Her günün yağmur şansı, diğer günlerden bağımsız olarak {q}.',
      questions: { q1: 'En az bir yağmurlu gün ne kadar olası?' },
      options: {},
      explain: 'Şansları toplamak {sum} verirdi, bu doğru olamaz. Bunun yerine kuru gün şanslarını çarp: hiç yağmur olmamasının şansı {none}, yani en az bir yağmurlu günün şansı {p}.',
      labels: { step: '{n}. günden sonra hâlâ kuru' }
    },
    't-numbers': {
      title: 'Aynı sayı iki kez',
      story: '{g} kişinin her biri gizlice ve rastgele birden {r} sayısına kadar bir tam sayı seçiyor.',
      questions: { q1: 'En az iki kişinin aynı sayıyı seçmesi ne kadar olası? Önce sezgin:', q2: 'Şimdi tahminin: en az bir ortak sayı ne kadar olası?' },
      options: { low: 'Dörtte birden az', even: 'Aşağı yukarı yarı yarıya', high: 'Dörtte üçten fazla' },
      explain: '{g} kişiyle eşleşebilecek {pairs} çift var, bu yüzden eşleşme sanıldığından erken gelir: {p}.',
      labels: { step: 'İlk {n} kişi arasında hepsi farklı' }
    },
    't-tyres': {
      title: 'Daha az patlak',
      story: 'Yeni bir lastik türü her yüz yolculuktaki patlakları {b} sayısından {a} sayısına indiriyor. Üretici buna “{rel} daha az patlak” diyor.',
      questions: { q1: '{rides} yolculukta kaç patlak daha az olur?' },
      options: {},
      explain: '{rides} yolculukta önce {old}, sonra {new} patlak var: {fewer} daha az. “{rel} daha az” kulağa büyük geliyor; fark ettiğin şey mutlak değişimdir.',
      labels: { old: 'Eski lastikler', new: 'Yeni lastikler', fit: 'patlak' }
    },
    't-dice': {
      title: 'İki zar',
      story: 'İki sıradan zar atıp sayıları topluyorsun.',
      questions: { q1: 'Hangi toplam daha olası: {s1} mi, {s2} mi?', q2: '{s1} toplamı ne kadar olası?' },
      options: { first: '{s1}', second: '{s2}', same: 'Eşit olası' },
      explain: 'Otuz altı eşit olası sonuçtan {c1} tanesi {s1}, {c2} tanesi {s2} toplamını verir.',
      labels: {}
    }
  }
};
