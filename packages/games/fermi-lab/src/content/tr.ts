import type { ContentText } from './types';

export const content: ContentText = {
  counts: {
    day: { one: 'gün', other: 'gün' },
    year: { one: 'yıl', other: 'yıl' },
    ant: { one: 'karınca', other: 'karınca' },
    battery: { one: 'pil', other: 'pil' },
    beat: { one: 'atım', other: 'atım' },
    bee: { one: 'arı', other: 'arı' },
    birth: { one: 'doğum', other: 'doğum' },
    breath: { one: 'nefes', other: 'nefes' },
    cell: { one: 'hücre', other: 'hücre' },
    charge: { one: 'şarj', other: 'şarj' },
    earth: { one: 'Dünya', other: 'Dünya' },
    egg: { one: 'yumurta', other: 'yumurta' },
    grain: { one: 'tane', other: 'tane' },
    hair: { one: 'tel saç', other: 'tel saç' },
    household: { one: 'hane', other: 'hane' },
    molecule: { one: 'molekül', other: 'molekül' },
    orbit: { one: 'tur', other: 'tur' },
    passenger: { one: 'yolcu', other: 'yolcu' },
    person: { one: 'kişi', other: 'kişi' },
    phone: { one: 'telefon', other: 'telefon' },
    piano: { one: 'piyano', other: 'piyano' },
    pupil: { one: 'öğrenci', other: 'öğrenci' },
    sheet: { one: 'yaprak', other: 'yaprak' },
    step: { one: 'adım', other: 'adım' },
    teacher: { one: 'öğretmen', other: 'öğretmen' },
    tree: { one: 'ağaç', other: 'ağaç' },
    trip: { one: 'yolculuk', other: 'yolculuk' },
    tuner: { one: 'akortçu', other: 'akortçu' },
    tuning: { one: 'akort', other: 'akort' },
    vehicle: { one: 'araç', other: 'araç' },
    word: { one: 'kelime', other: 'kelime' }
  },
  ratios: {
    high: { one: '{n} kat fazla.', other: '{n} kat fazla.' },
    low: { one: '{n} kat az.', other: '{n} kat az.' },
    rowHigh: { one: '{n} kat fazla', other: '{n} kat fazla' },
    rowLow: { one: '{n} kat az', other: '{n} kat az' },
    biasHigh: { one: 'Cevapların ortalamada {n} kat fazlaydı.', other: 'Cevapların ortalamada {n} kat fazlaydı.' },
    biasLow: { one: 'Cevapların ortalamada {n} kat azdı.', other: 'Cevapların ortalamada {n} kat azdı.' }
  },
  factors: {
    aaEnergy: 'Bir AA pilin verdiği enerji',
    airDensity: 'Havanın yoğunluğu',
    airTime: 'Yolculuk başına ortalama havada kalma süresi',
    antDensity: 'Karada metrekare başına ortalama karınca',
    avogadro: 'Avogadro sabiti',
    batteryEnergy: 'Bir telefonun batarya enerjisi',
    birthRate: 'Kişi başına yıllık doğum (kaba doğum hızı)',
    bloodVolume: 'Kan hacmi',
    breathRate: 'Dinlenirken dakikadaki nefes sayısı',
    capacityFactor: 'Anma gücünün payı olarak ortalama güç (kapasite faktörü)',
    carSpeed: 'Hız',
    ceilingHeight: 'Tavan yüksekliği',
    chargeEfficiency: 'Şarj verimi',
    cloudVolume: 'Bulutun hacmi',
    cloudWater: 'Bulutun metreküpü başına sıvı su',
    crowdDensity: 'Metrekare başına kişi (ayakta sık kalabalık)',
    cupWater: 'Bir fincanlık su',
    daysPerYear: 'Bir yıldaki gün sayısı',
    daysPerYearPlain: 'Bir yıldaki gün sayısı',
    drinksPerDay: 'Günlük içecek',
    driveEfficiency: 'Motor ve aktarma verimi',
    dropMass: 'Bir damlanın kütlesi',
    earthRadius: 'Dünya’nın yarıçapı',
    earthSurface: 'Dünya’nın yüzey alanı',
    eggsPerDay: 'Kraliçenin günde bıraktığı yumurta',
    energyAvailable: 'Mevcut enerji',
    equatorLength: 'Ekvatorun uzunluğu',
    evConsumption: 'Elektrikli otomobilin tüketimi',
    flightDistance: 'Uçuş mesafesi',
    floorArea: 'Taban alanı',
    flowSpeed: 'Ortalama akış hızı',
    foodEnergy: 'Günlük besin enerjisi',
    forestArea: 'Dünyadaki orman alanı',
    fuelConsumption: 'Yakıt tüketimi',
    fuelPerPassengerKm: 'Yolcu ve kilometre başına yakıt',
    grainDiameter: 'Bir tanenin çapı',
    grainMass: 'Bir tanenin kütlesi',
    gravity: 'Yerçekimi ivmesi',
    hairDensity: 'Santimetrekare başına saç teli',
    heartRate: 'Dinlenme nabzı',
    hoursPerDay: 'Bir gündeki saat',
    hoursPerDayRate: 'Bir gündeki saat',
    hoursPerYear: 'Bir yıldaki saat',
    householdSize: 'Hane başına kişi',
    iceFreeLand: 'Dünya’nın buzsuz kara alanı',
    inhabitants: 'Nüfus',
    jarVolume: 'Kavanozun hacmi',
    joulesPerKcal: 'Bir kilokalorideki joule',
    joulesPerWh: 'Bir watt-saatteki joule',
    lifetime: 'Ömür',
    lifetimeDistance: 'Tüm ömrü boyunca gidilen yol',
    lifetimeGiven: 'Ömür',
    liftHeight: 'On katın yüksekliği',
    liftedMass: 'Kaldırılan kütle (dört kişi)',
    lightSpeed: 'Işık hızı',
    lightSpeedKm: 'Işık hızı',
    litresPerM3: 'Bir metreküpteki litre',
    minutesPerDay: 'Bir gündeki dakika',
    minutesPerHour: 'Bir saatteki dakika',
    minutesPerYear: 'Bir yıldaki dakika',
    molarMass: 'Bir mol suyun kütlesi',
    moonDistance: 'Dünya–Ay uzaklığı',
    nailPerDay: 'Günlük uzama',
    oceanArea: 'Okyanusların alanı',
    oceanDepth: 'Okyanusların ortalama derinliği',
    orbitLength: 'Bir turun uzunluğu',
    orbitsPerDay: 'Günlük tur sayısı',
    packing: 'Kavanozda tanelerin kapladığı pay (gerisi hava)',
    panelArea: 'Panel alanı',
    panelEfficiency: 'Panel verimi',
    passengers: 'Yolcular',
    peoplePerVehicle: 'Araç başına kişi (dünya ortalaması)',
    petrolEnergy: 'Bir litre benzindeki enerji',
    petrolEnergyWh: 'Bir litre benzindeki enerji',
    pianoShare: 'Hane başına piyano',
    pitchLength: 'Sahanın uzunluğu',
    pitchWidth: 'Sahanın genişliği',
    pupilsPerTeacher: 'Öğretmen başına öğrenci',
    rainfall: 'Yıllık yağış (su yüksekliği)',
    ratedSunlight: 'Panel gücünün dayandığı güneş ışığı',
    redCellCount: 'Mikrolitre kanda alyuvar',
    redCellShare: 'Tüm hücreler içinde alyuvarların payı',
    replacementYears: 'Telefon değiştirilene kadar geçen yıl',
    riceMass: 'Paketteki pirinç',
    riverDepth: 'Nehrin ortalama derinliği',
    riverWidth: 'Nehrin genişliği',
    roofArea: 'Yukarıdan bakınca çatı alanı',
    rotationTime: 'Bir dönüşün süresi',
    scalpArea: 'Saçlı derinin alanı',
    schoolAgeShare: '6–17 yaş arası nüfusun payı',
    seaLevelPressure: 'Deniz seviyesinde hava basıncı',
    seawaterDensity: 'Deniz suyunun yoğunluğu',
    secondsPerDay: 'Bir gündeki saniye',
    sheetThickness: 'Bir yaprağın kalınlığı',
    sleepPerDay: 'Günlük uyku',
    smartphoneShare: 'Akıllı telefon kullananların payı',
    speakingRate: 'Konuşma hızı',
    specificHeat: 'Suyun özgül ısısı',
    sphereFactor: 'Küre çarpanı (6/π: bir top, küpünün yaklaşık yarısını doldurur)',
    stackHeight: 'Yığının yüksekliği',
    stepLength: 'Bir adımın uzunluğu',
    stepsPerDay: 'Günlük adım',
    strokeVolume: 'Kalp atımı başına kan (atım hacmi)',
    sunDistance: 'Güneş–Dünya uzaklığı',
    sunPower: 'Güneş’in yaydığı güç',
    sunRadius: 'Güneş’in yarıçapı',
    talkTime: 'Günde konuşarak geçen süre',
    temperatureRise: 'Sıcaklık artışı',
    treeDensity: 'Orman hektarı başına ağaç',
    tripsPerYear: 'Yıllık yolcu seyahati',
    tuningsPerPiano: 'Piyano başına yıllık akort',
    tuningsPerTuner: 'Akortçu başına yıllık akort (günde 4, 200 iş günü)',
    workerLife: 'Yaz işçi arısının yetişkin ömrü',
    worldPopulation: 'Dünya nüfusu'
  },
  tasks: {
    'rain-roof': {
      title: 'Londra’da bir çatıya yağan yağmur',
      question: 'Londra’daki müstakil bir evin çatısına bir yılda kaç litre yağmur düşer?',
      explain:
        'Yağış bir yükseklik olarak ölçülür: Londra’nın yılda yaklaşık 630 mm’lik uzun dönem ortalaması, hiçbir şey akıp gitmeseydi 0,63 m derinliğinde bir su tabakası demektir. Önemli olan, çatının yukarıdan görünen alanıdır (izdüşümü), daha büyük olan eğimli yüzey değil; çünkü yağmur dikey düşer. Ününe rağmen Londra, New York’un yaklaşık yarısı kadar yağış alır: orada sık ama az yağar. Belirsiz çarpan çatı alanıdır.'
    },
    'pitch-crowd': {
      title: 'Bir futbol sahasındaki insanlar',
      question: 'Bir futbol sahasına ayakta kaç kişi sığar?',
      explain:
        'Standart bir saha 105 m × 68 m, yaklaşık 7.100 m²’dir. En önemlisi insanların ne kadar sık durduğudur: metrekarede 2 kişi rahat bir seyirci kitlesidir, 4 omuz omuza demektir ve metrekarede 5, kalabalık güvenliği planlamacılarının ayakta alanlar için kullandığı üst sınırdır; ötesi tehlikelidir. Yani “sığar” 2 ila 3 katlık bir aralığı kapsar.'
    },
    'rice-grains': {
      title: 'Bir paket pirinçteki taneler',
      question: '1 kg’lık bir pirinç paketinde kaç tane pirinç vardır?',
      explain:
        'Tarım uzmanları pirinci “bin tane ağırlığı” ile tartar: çoğu çeşitte 1.000 tane 15 ila 35 g gelir, yani bir tane yaklaşık 25 mg’dır. 1.000 g’ı 0,025 g’a bölmek 40.000 verir. Minik şeyler için bir hile: küçük bir miktarı tart ya da say, sonra ölçeklendir.'
    },
    'lifetime-drinking': {
      title: 'Bir ömürde içilenler',
      question: 'Bir insan ömrü boyunca kaç litre içer (tüm içecekler birlikte)?',
      explain:
        'Avrupa Gıda Güvenliği Otoritesi, toplam su için yeterli alımı kadınlarda günde 2,0 L, erkeklerde 2,5 L olarak verir; bunun yaklaşık %70–80’i içeceklerden, geri kalanı yiyeceklerden gelir. Bu, günde kabaca 1,4–2,0 L içecek demektir. 75 yılda bu yaklaşık 44.000 litreye ulaşır: küçük bir havuz.'
    },
    'paper-stack': {
      title: 'Bir metre kâğıt',
      question: 'Sıradan yazıcı kâğıdından kaç yaprak 1 metre yüksekliğinde bir yığın oluşturur?',
      explain:
        'Standart 80 g/m² kâğıt, milimetrenin onda biri kadar kalındır (üreticiler 100–110 µm belirtir). 500 yapraklık bir paket yaklaşık 5 cm yüksekliğindedir, yani 1 m 20 pakettir: yaklaşık 10.000 yaprak. İnce şeyleri toplu ölçmek daha kolaydır: paketi ölç, sonra böl.'
    },
    'room-air': {
      title: 'Bir oturma odasındaki hava',
      question: 'Tipik bir oturma odasındaki havanın tamamı kaç kilogram gelir?',
      explain:
        'Hava ağırlıksız gibi gelir ama oda sıcaklığında ve deniz seviyesinde bir metreküpü yaklaşık 1,2 kg’dır. 25 m² ve 2,5 m tavanlı bir oda yaklaşık 62 m³ hava içerir: yaklaşık 75 kg, bir yetişkin kadar. Belirsiz olan odanın büyüklüğüdür; havanın yoğunluğu fiziksel bir gerçektir.'
    },
    'words-per-day': {
      title: 'Bir günde söylenen kelimeler',
      question: 'Ortalama bir yetişkin bir günde kaç kelime konuşur?',
      explain:
        'Yaklaşık 400 öğrenciden birkaç gün boyunca kısa ses parçaları kaydeden bir çalışma, kadınların da erkeklerin de günde yaklaşık 16.000 kelime konuştuğunu buldu; kadınlarda 20.000, erkeklerde 7.000 diye yaygın olan iddia yanlıştı. İnsanlar çok farklıdır (birkaç yüzden 40.000’in üzerine kadar), bu yüzden aralık geniştir. Sohbette dakikada yaklaşık 110–170 kelime söylenir; yani 16.000 kelime yaklaşık iki saatlik gerçek konuşmadır.'
    },
    'sand-jar': {
      title: 'Bir kavanozdaki kum taneleri',
      question: 'Bir litrelik kuru kum dolu kavanozda kaç kum tanesi vardır?',
      explain:
        'Her taneyi d çaplı küçük bir top gibi düşün: bir litre (bir milyon milimetreküp) yaklaşık 0,6 × 1.000.000 × 6/π ÷ d³ tane alır. Çap küp olarak geçtiği için her şeyi belirler: kum, 0,06 ile 2 mm arasındaki tanelerdir ve d’yi yarıya indirmek sayıyı sekiz katına çıkarır. Orta kum (0,25–0,5 mm) 10 ila 70 milyon tane, iri kum yaklaşık bir ila on milyon tane verir.'
    },
    heartbeats: {
      title: 'Bir ömürdeki kalp atışları',
      question: 'İnsan kalbi bir ömür boyunca kaç kez atar?',
      explain:
        'Dakikada yaklaşık 70 atım günde yaklaşık 100.000, yılda 37 milyon eder. 75 yılda bu, üç milyara yakın atımdır. Kalp çocuklukta ve egzersizde daha hızlı, uykuda daha yavaş atar; bu yüzden 70 bir ömür için makul bir ortalamadır.'
    },
    'scalp-hairs': {
      title: 'Bir kafadaki saç telleri',
      question: 'Bir yetişkinin kafasında (gür saçla) kaç tel saç vardır?',
      explain:
        'Yaygın rakam yaklaşık 100.000 teldir, tipik aralık 80.000 ile 150.000; sarışınların genellikle daha çok ve daha ince, kızılların daha az ve daha kalın teli olur. Avuç içi büyüklüğünde bir saçlı deri parçası yaklaşık 100 cm²’dir ve kafanın saçlı kısmı bunun altı yedi katıdır.'
    },
    'breaths-day': {
      title: 'Bir günde alınan nefesler',
      question: 'Bir yetişkin bir günde kaç nefes alır?',
      explain:
        'Dinlenen bir yetişkin dakikada 12 ila 20 kez nefes alır. Bir günde 1.440 dakika vardır; bu da yaklaşık 17.000 ila 29.000 nefes eder. Bir dakika boyunca kendi nefeslerini saymak, bir çarpanı kendin kontrol etmenin iyi bir yoludur.'
    },
    'blood-pumped': {
      title: 'Bir günde pompalanan kan',
      question: 'Dinlenen bir kalp bir günde kaç litre kan pompalar?',
      explain:
        'Her atım yaklaşık 70 mL iter; dakikada 70 atımla bu, dakikada yaklaşık 5 litre, yani vücudun tüm kanı dakikada bir kez demektir. Bir günde bu yaklaşık 7.000 litreye ulaşır, büyük bir su deposunu dolduracak kadar. Hekimler buna kalp debisi der: dinlenirken dakikada 4 ila 8 litre.'
    },
    'ants-earth': {
      title: 'Dünya’daki karıncalar',
      question: 'Dünya’da kaç karınca yaşar?',
      explain:
        '2022’deki bir çalışma tüm kıtalardan yüzlerce saha sayımını birleştirdi ve yaklaşık 20 katrilyon (2 × 10¹⁶) karınca tahmin etti: kişi başına yaklaşık 2,5 milyon; toplam kütleleri tüm yabani kuşlarla memelilerin toplamından fazla. Buzsuz karalara dağıtıldığında bu, metrekare başına ortalama yaklaşık 150 karınca eder; çoğu tropikal ormanlarda ve savanlarda. Yazarlar rakamı ihtiyatlı buluyor.'
    },
    'trees-earth': {
      title: 'Dünya’daki ağaçlar',
      question: 'Dünya’da kaç ağaç vardır?',
      explain:
        '2015’teki bir çalışma 400.000’den fazla orman alanını uydu haritalarıyla birleştirdi ve yaklaşık 3 trilyon ağaç saydı (göğüs hizasında 10 cm’den kalın gövdeler): kişi başına 400’ün üzerinde ve önceki tahminlerin yedi katı. Dünyanın ormanları yaklaşık 4 milyar hektar kaplar; bu da ortalama hektar başına yaklaşık 700–800 ağaç demektir (her 13 m²’ye bir ağaç).'
    },
    'cloud-mass': {
      title: 'Bir buluttaki su',
      question: 'Küçük, pamuk gibi bir güzel hava bulutundaki su kaç ton gelir?',
      explain:
        'Tipik bir güzel hava kümülüsü yaklaşık 1 km boyundadır, yani kabaca bir kilometreküp: bir milyar metreküp. Her biri yalnızca yaklaşık yarım gram minik damlacık içerir ama hepsi birlikte yaklaşık 500 ton su eder, yaklaşık yüz fil kadar. Bulut süzülür, çünkü damlacıklar minicik ve etraflarındaki hava yükselir.'
    },
    'amazon-day': {
      title: 'Bir günde Amazon',
      question: 'Amazon Nehri ortalama bir günde Atlas Okyanusu’na kaç metreküp su döker?',
      explain:
        'Debi = genişlik × derinlik × hız. Óbidos kasabası yakınında Amazon, yalnızca yaklaşık 2 km genişliğinde ama onlarca metre derinliğinde tek bir yatağa sıkışır ve saniyede 2 metreye varan hızla akar. Ağzında saniyede ortalama yaklaşık 206.000 m³ taşır: günde yaklaşık 18 milyar m³, okyanuslara ulaşan tüm nehir suyunun kabaca beşte biri. Modeldeki genişlik, derinlik ve hız kaba, açıklayıcı değerlerdir; referans ölçülen ortalamadır.'
    },
    'bee-colony': {
      title: 'Bir kovandaki arılar',
      question: 'Güçlü bir bal arısı kolonisinde yaz başında kaç işçi arı yaşar?',
      explain:
        'Dengede yaşayan arı sayısı, yenilerinin gelme hızı çarpı her birinin yaşama süresine eşittir (aynı kural mağaza kuyruklarını ya da yoldaki arabaları tahmin etmeye yarar). Sezonun zirvesinde bir kraliçe günde yaklaşık 1.500 yumurtaya kadar bırakır ve bir yaz işçi arısı yetişkin olarak yalnızca beş hafta kadar yaşar. Bu yaklaşık 50.000 eder; arıcılar güçlü kolonilerde 50.000 ila 80.000 bildirir.'
    },
    'body-cells': {
      title: 'İnsan vücudundaki hücreler',
      question: 'Bir yetişkinin (yaklaşık 70 kg) vücudu kaç insan hücresinden oluşur?',
      explain:
        'Sürpriz: vücut kütlesini “tipik” bir hücrenin kütlesine bölmek yanlış cevap verir, çünkü sayıca hücrelerimizin çoğu minik alyuvarlardır. Bir kan testi mikrolitrede yaklaşık 5 milyon alyuvar sayar; 5 litre kanla bu 25 trilyondur ve 2016’daki bir sayıma göre tüm hücrelerimizin %84’üdür. Toplam yaklaşık 30 trilyon insan hücresidir (artı benzer sayıda bakteri).'
    },
    'nail-growth': {
      title: 'Tırnağın uzaması',
      question: 'Bir el tırnağı bir yılda kaç milimetre uzar?',
      explain:
        'Bir el tırnağı günde yaklaşık milimetrenin onda biri kadar uzar: sağlıklı genç yetişkinlerle yapılan bir çalışmada ayda 3,5 mm, ayak tırnaklarından iki kat daha hızlı. Bu, yılda yaklaşık 4 cm eder. Küçük hızlar uzun bir süreyle çarpılınca görünür hâle gelir.'
    },
    'lift-ride': {
      title: 'Bir asansör yolculuğunun enerjisi',
      question: 'Bir asansör dört kişiyi on kat yukarı taşımak için kaç watt-saat elektrik enerjisi harcar?',
      explain:
        'Bir m kütlesini h yüksekliğe kaldırmak en az m·g·h gerektirir: 300 kg × 9,81 m/s² × 30 m ≈ 88 kJ, yaklaşık 25 Wh. Motor ve dişliler bunun bir kısmını kaybeder; yani yaklaşık 50 Wh: 10 W’lık bir LED lambanın beş saatte harcadığı enerji. Gerçek asansörler daha karmaşıktır: bir karşı ağırlık boş kabini ve yükün yaklaşık yarısını dengeler; bekleme modundaki ışıklar ve elektronik bir yılda çoğu zaman yolculuklardan daha fazla enerji harcar.'
    },
    'phone-charges': {
      title: '1 kWh ile telefon şarjı',
      question: '1 kWh elektrikle kaç tam akıllı telefon şarjı yapılabilir?',
      explain:
        '3,85 V’ta 4.000–5.000 mAh’lik bir telefon bataryası 15–19 Wh depolar (mAh × V = mWh). Şarj aletindeki biraz kayıpla bir şarj prizden yaklaşık 20 Wh çeker; yani tipik bir hanenin günde harcadığından az olan bir kilowatt-saat, bir telefonu yaklaşık 50 kez şarj eder.'
    },
    'ev-litre': {
      title: 'Bir litreyle elektrikli otomobil',
      question: 'Bir elektrikli otomobil, bir litre benzindeki enerjiyle kaç kilometre gidebilir?',
      explain:
        'Bir litre benzin yaklaşık 32 MJ kimyasal enerji içerir; bu 8,9 kWh eder. Küçük ve orta boy bir elektrikli otomobil gerçek kullanım testlerinde, şarj kayıpları dâhil, 100 km’de 13–25 kWh harcar. Bir litrenin enerjisi onu yaklaşık 50 km götürür; benzinli bir araç ise bundan yalnızca 15–20 km çıkarır, çünkü motor yakıt enerjisinin çoğunu ısıya çevirir.'
    },
    'tea-energy': {
      title: 'Bir fincan çayın enerjisi',
      question: 'Bir fincan çaylık suyu musluk sıcaklığından kaynama noktasına getirmek kaç watt-saat enerji ister?',
      explain:
        '1 kg suyu 1 °C ısıtmak 4,19 kJ gerektirir. Yaklaşık 80 °C ısıtılan 0,25 kg’lık bir fincan 84 kJ = 23 Wh ister: 2 kW’lık bir su ısıtıcısı bunu yaklaşık 40 saniyede yapar. Pratikte insanlar çoğu zaman döktüklerinin iki katı suyu kaynatır ve ısıtıcının kendisi de ısınır: rakamı iki katına çıkarmanın en yaygın yolları.'
    },
    'airliner-fuel': {
      title: 'Londra’dan New York’a yakıt',
      question: 'Dolu bir geniş gövdeli yolcu uçağı (yaklaşık 300 yolcu) Londra’dan New York’a uçarken kaç litre jet yakıtı yakar?',
      explain:
        'Modern uzun menzilli jetler yolcu başına 100 km’de yaklaşık 3 litre yakar (bir havayolu en yeni tipi için 2,9 bildiriyor; eski uçaklar daha çok yakar). Londra–New York büyük daire boyunca yaklaşık 5.500 km’dir. 300 × 0,03 × 5.540 ≈ 50.000 litre: bir tankerden epey fazla, yaklaşık 40 ton yakıt.'
    },
    'aa-petrol': {
      title: 'Pillere karşı benzin',
      question: 'Kaç tane AA alkalin pil, bir litre benzin kadar enerji depolar?',
      explain:
        'Bir AA alkalin pil yaklaşık 2,5–2,8 Ah kapasitelidir ve boşalırken ortalama yaklaşık 1,2 V verir; yani yaklaşık 3 Wh (yüksek yükte daha az). Bir litre benzin yaklaşık 8.900 Wh içerir: yaklaşık 70 kg gelecek 3.000 kadar pil kadar. Yakıtların yerini doldurmak bu yüzden çok zordur.'
    },
    'solar-panel': {
      title: 'Bir metrekare güneş paneli',
      question: 'Bir metrekare güneş paneli, dünyadaki yeni güneş santrallerinin ortalamasında, bir yılda kaç kilowatt-saat elektrik üretir?',
      explain:
        'Paneller metrekare başına 1.000 W’lık tam güneş ışığında derecelendirilir; modern bir panel bunun yaklaşık beşte birini elektriğe çevirir, yani metrekare başına yaklaşık 210 W anma gücü. Ama gece, bulutlar ve alçak kış güneşi var: dünya genelinde yeni güneş santralleri ortalamada anma güçlerinin yalnızca yaklaşık %16’sını verir. Bir yılın 8.760 saati boyunca bu, metrekare başına yaklaşık 290 kWh eder; kabaca bir buzdolabının yıllık tüketimi. Güneşli çöllerde daha fazla, bulutlu bölgelerde daha az.'
    },
    'body-power': {
      title: 'Bir bedenin ısısı',
      question: 'Bir insan vücudu ortalama kaç watt ısı yayar?',
      explain:
        'Kullandığımız besin enerjisinin neredeyse tamamı sonunda ısıya dönüşür. Günde 2.000 kcal 8,4 MJ eder; bir günün 86.400 saniyesine yayıldığında bu yaklaşık 100 W’tır. Bir insan eski tip bir akkor ampul kadar ısı yayar; dolu bir salonun ısınmasının nedeni budur.'
    },
    'car-lifetime-fuel': {
      title: 'Bir otomobilin ömür boyu yakıtı',
      question: 'Benzinli bir otomobil tüm ömrü boyunca kaç litre benzin yakar?',
      explain:
        'Bir otomobil hurdaya çıkmadan önce genellikle 150.000–300.000 km yol yapar ve benzinli bir araç 100 km’de yaklaşık 5–10 litre harcar. Bu, yaklaşık 14.000 litre eder: 50 litrelik yaklaşık 280 dolu depo.'
    },
    'piano-tuners': {
      title: 'Bir şehirdeki piyano akortçuları',
      question: 'Bir milyon nüfuslu bir şehir kaç tam zamanlı piyano akortçusuna iş verebilir?',
      explain:
        'Enrico Fermi’nin klasik sorusu. Hane başına 2,5 kişiyle bir milyon insan 400.000 hanede yaşar; yirmide birinde piyano varsa bu 20.000 piyano eder. Yılda bir akortla 20.000 akort. Bir akortçu günde yaklaşık dört, yılda 800 kadar akort yapar; yani şehrin yaklaşık 25 akortçuya ihtiyacı vardır. Karşılaştırılacak resmî bir rakam yok: önemli olan her çarpanın tahmin edilebilmesi ve farklı yönlerdeki hataların kısmen birbirini götürmesidir. Hane büyüklüğü dünyada çok değişir, yaklaşık 2 ile 5’ten fazla kişi arasında.'
    },
    'births-day': {
      title: 'Bir günde doğan bebekler',
      question: 'Dünyada her gün kaç bebek doğar?',
      explain:
        'BM yılda yaklaşık 132 milyon doğum sayıyor, her 1.000 kişide yaklaşık 16. 365 güne bölünce günde yaklaşık 360.000, saniyede dört eder. Her gün yaklaşık 170.000 kişi ölüyor; bu yüzden dünya nüfusu, eskisinden yavaş da olsa hâlâ artıyor.'
    },
    'birthdays-today': {
      title: 'Bugünkü doğum günleri',
      question: 'Dünyada bugün kaç kişinin doğum günü var?',
      explain:
        'Doğum günleri yıla neredeyse eşit dağılır (bazı aylarda doğumlar yüzde birkaç fazladır); bu yüzden herhangi bir günde aşağı yukarı 365 kişiden birinin doğum günüdür: yaklaşık 22 milyon, çoğu ülkenin nüfusundan fazla.'
    },
    'lifetime-sleep': {
      title: 'Uykuda geçen yıllar',
      question: '75 yıllık bir ömrün kaç yılı uykuda geçer?',
      explain:
        'Günün uykuda geçen payı, ömrün uykuda geçen payıdır. Yetişkinler yaklaşık 7–8 saat, bebekler ve çocuklar çok daha fazla uyur; yani ömrün yaklaşık üçte biri: 25 yıl kadar.'
    },
    'people-airborne': {
      title: 'Havadaki insanlar',
      question: 'Herhangi bir anda havadaki yolcu uçaklarında ortalama kaç kişi bulunur?',
      explain:
        'Havayolları 2024’te yaklaşık 4,9 milyar yolcu taşıdı. Ortalama bir yolculuk yaklaşık 1.900 km’dir, saatte yaklaşık 800 km’yle 2,4 saat kadar. Bir yılın yolcu-saatlerini yıldaki saat sayısına bölmek aynı anda havada olanların sayısını verir: yaklaşık 1,3 milyon, büyük bir şehrin nüfusu, uçarken (gündüz daha çok, gece daha az).'
    },
    'lifetime-walking': {
      title: 'Bir ömürde yürünen yol',
      question: 'Bir insan ömrü boyunca kaç kilometre yürür?',
      explain:
        '111 ülkedeki 700.000 kişinin akıllı telefon verileri günde ortalama yaklaşık 5.000 adım gösterdi (telefonlar bazı adımları kaçırır, gerçek rakam biraz daha yüksektir). Adım başına 0,7 m ile bu günde 3,5 km, 75 yılda neredeyse 100.000 km eder: Dünya’nın etrafında yaklaşık iki buçuk tur.'
    },
    'smartphones-year': {
      title: 'Bir yılda satılan akıllı telefonlar',
      question: 'Dünyada bir yılda kaç yeni akıllı telefon satılır?',
      explain:
        'Pazar araştırmacıları 2025’te yaklaşık 1,25 milyar akıllı telefon sevkiyatı saydı; bu sayı on yıldır 1,2 ile 1,5 milyar arasında. Bir yenileme modeli bunu açıklar: insanların yaklaşık yarısı akıllı telefon kullanıyor ve onu üç dört yılda bir değiştiriyorsa her yıl yaklaşık 1,2–1,3 milyar yeni telefon gerekir.'
    },
    'teachers-city': {
      title: 'Bir şehirdeki öğretmenler',
      question: 'Bir milyon nüfuslu bir şehrin 6–17 yaş arası öğrencileri için kaç öğretmene ihtiyacı vardır?',
      explain:
        '15 yaş altındaki çocuklar OECD ülkelerinde nüfusun yaklaşık %17’sini, dünyada yaklaşık %25’ini oluşturur; yani 6’dan 17’ye on iki okul yaşı nüfusun kabaca %12–20’sini kapsar. OECD ülkelerinde ilkokulda öğretmen başına ortalama yaklaşık 14, ortaokulda 13 öğrenci düşer; bazı ülkelerde 7 civarı, bazılarında 20’nin üzeri. Bir milyon insanın bu yüzden yaklaşık 10.000 öğretmene ihtiyacı vardır. Belirsiz çarpanlar çocukların payı ve öğretmen başına öğrenci sayısıdır; ikisi de ülkeden ülkeye çok değişir.'
    },
    'world-cars': {
      title: 'Dünyadaki motorlu taşıtlar',
      question: 'Dünyada kaç motorlu taşıt (otomobil, kamyonet, kamyon, otobüs) kullanımdadır?',
      explain:
        'Otomobil üreticileri birliği 2011’de yaklaşık 1,1 milyar, 2023’te yaklaşık 1,5 milyar araç saydı: her beş altı kişiye bir. Ortalama büyük farkları gizler: birçok zengin ülkede iki kişiye birden fazla araç düşerken birçok yoksul ülkede yirmi kişiye birden az araç düşer.'
    },
    'sunlight-time': {
      title: 'Güneş ışığının yolculuğu',
      question: 'Güneş ışığı Dünya’ya kaç saniyede ulaşır?',
      explain:
        'Dünya, Güneş’ten yaklaşık 150 milyon km uzaktadır (1 astronomik birim) ve ışık saniyede neredeyse 300.000 km yol alır; yani güneş ışığı vardığında yaklaşık 8 dakika 20 saniyeliktir. Yıl boyunca uzaklık yaklaşık %3 değişir, bu yüzden süre yaklaşık 490 ile 508 saniye arasında değişir.'
    },
    'earths-in-sun': {
      title: 'Güneş’in içindeki Dünyalar',
      question: 'Hacim olarak Güneş’in içine kaç Dünya sığar?',
      explain:
        'Güneş’in yarıçapı Dünya’nınkinin yaklaşık 109 katıdır. Hacim yarıçapın küpüyle büyür, yani Güneş’in hacmi 109 × 109 × 109 ≈ 1,3 milyon Dünya’dır. Yarıçap oranındaki küçük bir hata üç kez sayılır: 100’lük bir oran 1 milyon, 150’lik bir oran 3,4 milyon verirdi.'
    },
    'drive-to-moon': {
      title: 'Arabayla Ay’a',
      question: 'Sabit 100 km/sa hızla, hiç durmadan arabayla Ay’a gitmek kaç gün sürerdi?',
      explain:
        'Ay ortalama 384.400 km uzaktadır, Dünya’nın etrafında yaklaşık on tur. Saatte 100 km’yle bu 3.844 saat, yani yaklaşık 160 gün kesintisiz sürüş eder: beş aydan fazla.'
    },
    'drop-molecules': {
      title: 'Bir damladaki moleküller',
      question: 'Tek bir su damlasında kaç su molekülü vardır?',
      explain:
        'Bir damla yaklaşık 0,05 mL’dir (20 damla bir mililitre eder) ve 0,05 g gelir. 18 g su bir mol, yani 6 × 10²³ moleküldür. Bu yüzden bir damla yaklaşık 1,7 × 10²¹ molekül içerir: büyük bir göldeki su damlalarından daha çok molekül.'
    },
    'equator-speed': {
      title: 'Ekvatordaki hız',
      question: 'Dünya döndüğü için ekvatordaki bir nokta saatte kaç kilometre hızla hareket eder?',
      explain:
        'Ekvator yaklaşık 40.000 km uzunluğundadır: metre bir zamanlar bir meridyenin dörtte biri 10.000 km olacak şekilde tanımlanmıştı. Bir tur yaklaşık bir gün sürer; yani ekvatordaki bir nokta saatte yaklaşık 1.670 km hızla, sesten hızlı ilerler. Bunu hissetmeyiz, çünkü hareket düzgündür.'
    },
    'iss-day': {
      title: 'Bir günde uzay istasyonu',
      question: 'Uluslararası Uzay İstasyonu bir günde kaç kilometre yol alır?',
      explain:
        'İstasyon yerden yaklaşık 420 km yükseklikte döner, bu yüzden yörüngesi ekvatordan yalnızca biraz uzundur: yaklaşık 42.700 km. Bir turu yaklaşık 92 dakikada, günde 15,5 kez, saniyede yaklaşık 7,7 km hızla tamamlar. Bir günde yaklaşık 660.000 km yol alır: Ay’a kadar olan mesafe ve dönüş yolunun büyük kısmı.'
    },
    'atmosphere-mass': {
      title: 'Atmosferin kütlesi',
      question: 'Dünya atmosferinin toplam kütlesi kaç kilogramdır?',
      explain:
        'Hava basıncı, her metrekarenin üzerindeki tüm havanın ağırlığıdır: metrekare başına yaklaşık 10 ton. Dünya’nın yüzeyiyle (510 milyon km²) çarpıp g’ye bölünce yaklaşık 5,3 × 10¹⁸ kg çıkar. Ölçülen değer 5,1 × 10¹⁸ kg’dır; biraz daha azdır, çünkü dağlar ve yaylalar havanın içine doğru yükselir.'
    },
    'sun-mass-loss': {
      title: 'Güneş kütleyi ışığa çeviriyor',
      question: 'Güneş her saniye kaç kilogram kütleyi ışığa çevirir?',
      explain:
        'Einstein’ın E = mc² formülü iki yönlü işler: enerji yaymak kütle kaybetmek demektir. Güneş 3,8 × 10²⁶ watt yayar; bunu c²’ye (9 × 10¹⁶ m²/s²) bölmek saniyede yaklaşık 4,3 milyar kg verir. Yine de Güneş’in bugüne kadarki tüm ömrü boyunca bu, kütlesinin binde birinden azdır.'
    },
    'ocean-mass': {
      title: 'Okyanuslardaki su',
      question: 'Dünya’daki tüm okyanuslarda kaç kilogram su vardır?',
      explain:
        'Okyanuslar Dünya’nın %71’ini, yaklaşık 361 milyon km²’yi kaplar ve ortalama derinlikleri yaklaşık 3,7 km’dir. Bu 1,33 milyar km³ su eder; metreküp başına bir tondan biraz fazlasıyla yaklaşık 1,4 × 10²¹ kg gelir, ama bu bile Dünya’nın kütlesinin yalnızca yaklaşık %0,02’sidir.'
    }
  }
};
