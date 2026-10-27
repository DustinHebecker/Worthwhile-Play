import type { ContentText } from './types';

export const content: ContentText = {
  weeks: { one: '{n} hafta', other: '{n} hafta' },
  species: {
    algae: { name: 'Yeşil algler', about: 'Suda süzülen minik bitkiler. Besin ve ışıkla hızla çoğalırlar; su pireleri ve salyangozlar onları yer. Çok alg suyu yeşile boyar ve alttaki bitkileri gölgede bırakır.' },
    bluegreen: { name: 'Mavi-yeşil algler', about: 'Aslında bakteridirler (siyanobakteriler). Yavaş büyür, zengin suya ihtiyaç duyar ve neredeyse hiç yenmezler; bu yüzden besin biriktiğinde patlama yaparlar.' },
    duckweed: { name: 'Su mercimeği', about: 'Küçük yüzen yapraklar. Zengin suda yüzeyi kaplar ve altındaki her şeyi gölgede bırakır.' },
    pondweed: { name: 'Su otu', about: 'Çamura kök salmış su altı bitkileri. Işık almak için berrak suya ihtiyaç duyar, alglerin besinini elinden alır ve su pirelerine balıklardan saklanacak yer sağlar.' },
    fleas: { name: 'Su pireleri', about: 'Algleri otlayan minik kabuklular (Daphnia). Küçük balıklar onları yer, ama su otunun arasında ve çamurda pek çoğu erişilmez kalır.' },
    snails: { name: 'Gölet salyangozları', about: 'Ölü bitki artıklarını ve biraz alg yerler. Küçük balıklar bir kısmını yer.' },
    minnows: { name: 'Küçük balıklar', about: 'Su pirelerini ve biraz salyangozu avlarlar. Yavruları yaklaşık altı haftada büyür. Turna balıkları onları yer.' },
    pike: { name: 'Turna balıkları', about: 'Küçük balıkları yiyen büyük bir avcı. Genç turnalar yaklaşık yirmi haftada büyür.' },
    grass: { name: 'Çimenler', about: 'Zengin toprakta uzun boylu ve hızlı büyürler. Alçak bitkileri gölgede bırakır ve çok su kullanırlar.' },
    flowers: { name: 'Kır çiçekleri', about: 'Fakir toprakta iyi yetişen alçak bitkiler. Işığa ihtiyaç duyarlar, bu yüzden uzun otlar onları dışarı iter. Yaprak bitleri ve tavşanlar onları yer.' },
    clover: { name: 'Yonca', about: 'Azotunu havadan kendisi alan alçak bir bitki; zengin toprakta daha az alır. Ölü yaprakları komşuları için toprağı zenginleştirir. Tavşanların en sevdiği besindir.' },
    aphids: { name: 'Yaprak bitleri', about: 'Çoğunlukla kır çiçeklerinin özsuyunu emen minik böcekler. Çok hızlı çoğalırlar. Uğur böcekleri onları yer.' },
    ladybirds: { name: 'Uğur böcekleri', about: 'Yaprak biti yiyen böcekler. Larvaları yaklaşık üç haftada büyür, bu yüzden yaprak bitlerinin artışına gecikmeyle tepki verirler.' },
    rabbits: { name: 'Tavşanlar', about: 'Önce yoncayı, sonra kır çiçeklerini ve otu yerler. Yavruları yaklaşık beş haftada büyür. Tilkiler onları avlar; bazıları yuvalarında hep güvendedir.' },
    foxes: { name: 'Tilkiler', about: 'Tavşan avlarlar. Genç tilkiler yaklaşık yarım yılda büyür.' },
    worms: { name: 'Solucanlar', about: 'Ölü yaprakları yer ve onları bitkilerin kullanabileceği besinlere geri dönüştürürler.' }
  },
  challenges: {
    'fleas-arrive': {
      title: 'Su pireleri geliyor',
      situation: 'Genç bir gölette yalnızca yeşil algler var. Bir kuşun taşıdığı su pireleri gölete ulaşıyor.',
      think: 'Algleri kim yer? Algler azaldığında su pirelerine ne olur?',
      explain: 'Su pireleri alglerle çoğalır, ta ki algler ne hızla büyüyorsa o hızla yiyene kadar. O andan sonra alg miktarını besinler değil su pireleri belirler: dengeleyici bir döngü (B1). Su berraklaşır ve berrak kalır.',
      real: 'Gerçek göletlerde balıklar ve mevsimler genellikle işlerin bu kadar düzenli gitmesine izin vermez.'
    },
    'enrich-swings': {
      title: 'Herkese daha çok besin',
      situation: 'Bir tarladan gelen güçlü akıntı, algler ve su pireleri olan bir göleti beslemeye başlıyor.',
      think: 'Daha çok besin daha çok alg demek. Su pireleri daha çok alg karşısında ne yapar, sonra algler ne yapar?',
      explain: 'Daha çok besin alglerin öne fırlamasını sağlar; su pireleri peşlerinden gelir, algleri yer bitirir, sonra aç kalır; algler toparlanır ve her şey yeniden başlar. Daha zengin su, sistemi dengelemek yerine salınıma soktu. Ekolojistler buna zenginleşme paradoksu der (B1).',
      real: 'Gerçek göletlerde çok daha fazla tür ve mevsimler bu salınımları yumuşatır ya da değiştirir.'
    },
    'fish-stocked': {
      title: 'Gölette balık',
      situation: 'Biri, hiç balık olmayan bir gölete küçük balıklar bırakıyor.',
      think: 'Balıklar su pirelerini yer. Algleri kim yer ve alglere ne olur?',
      explain: 'Balıklar su pirelerini yer, böylece algleri otlayan su pireleri azalır ve algler çoğalır. Tepedeki bir değişiklik besin zincirinin dibine kadar ulaşır: bir trofik çağlayan. Yavaş gelişir, çünkü genç balıkların büyümesi haftalar alır.',
      real: 'Gerçek göletlerde balıklar çamuru da karıştırır ve suyu daha da bulandırır.'
    },
    'pike-return': {
      title: 'Turnalar geri dönüyor',
      situation: 'Küçük balıklarla dolu bir gölete birkaç genç turna balığı bırakılıyor.',
      think: 'Zinciri izle: turnalar, küçük balıklar, su pireleri, algler.',
      explain: 'Turnalar küçük balıkları yer; daha az küçük balık daha çok su piresi bırakır; daha çok su piresi daha çok alg yer. Her adım yönü tersine çevirir, bu yüzden algler azalır. Uzun sürer, çünkü genç turnaların büyümesi yaklaşık yirmi hafta alır.',
      real: 'Gerçek göllerde suyu berraklaştırmak için küçük balıklar çıkarılır ya da turna eklenir; başarısı değişkendir ve çoğu zaman kısa sürer.'
    },
    'algae-treatment': {
      title: 'Yeşil suya hızlı çözüm',
      situation: 'Gölet ilaçlanıyor: her on algden dokuzu ölüp dibe çöküyor, ama suda kalıyor.',
      think: 'Ölü alglerdeki besinler nereye gider? Algler yokken su pirelerine ne oldu?',
      explain: 'Ölü algler birkaç günde çürür ve besinlerini suya geri verir. Algler yokken su pireleri aç kaldı, bu yüzden bir süre algleri kimse dizginlemez ve eski düzeylerini aşarlar. Belirtiyi ortadan kaldırıp besinleri bırakan bir çözüm uzun sürmez.',
      real: 'Gerçek göletlerde çürüyen algler oksijeni de tüketir ve bu balıklara zarar verebilir.'
    },
    'slow-runoff': {
      title: 'Yukarıdaki tarla',
      situation: 'Yukarıda yeni açılan bir tarlanın suyu berrak gölete akmaya başlıyor.',
      think: 'Daha çok besin alglere ne yapar, daha çok alg de altlarındaki su otuna ne yapar?',
      explain: 'Aylarca hiçbir şey olmuyor gibi görünür: su otu yarım yıl sonra bile iyi görünür. Bu arada besinler suda ve çamurda birikir; sonunda zengin suya ihtiyaç duyan su mercimeği ve mavi-yeşil algler hızla çoğalıp su otunu gölgeler. Ardından pekiştirici bir döngü devreye girer: daha az su otu, daha çok alg, daha çok gölge (R1). Dönüşüm hızlıdır; neden ise yavaştı.',
      real: 'Gerçek göllerde berrak sudan yeşil suya böyle geçişler iyi belgelenmiştir; çoğu zaman yıllarca süren yavaş değişimden sonra gelir.'
    },
    'no-way-back': {
      title: 'Akıntı duruyor',
      situation: 'İki yıl sonra akıntı tamamen kesiliyor. Su otu geri gelecek mi?',
      think: 'Yeniden büyüyebilecek su otu kaldı mı? Şimdi suyu yeşil tutan ne?',
      explain: 'Akıntıyı kesmek nedeni ortadan kaldırır, ama gölet yeşil kalır: algler dibi gölgeler ve yeniden büyüyecek su otu kalmamıştır. Pekiştirici döngü (R1) artık göleti yeşil durumda tutar. Geri dönmek, değişikliği geri almaktan fazlasını gerektirir; örneğin su otunu yeniden dikmek.',
      real: 'Gerçek göllerde besin girişi kesildikten sonra toparlanma çoğu zaman yıllar sürer ve bazen bitkiler yeniden dikilir.'
    },
    shade: {
      title: 'Göletin üstünde bir ağaç',
      situation: 'Göletin üstünde bir ağaç büyüyor ve göleti gölgeliyor.',
      think: 'Su otu dipte ışığa ihtiyaç duyar. Işığını başka ne elinden alır?',
      explain: 'Daha az ışık su otunu yavaşlatır, böylece algleri daha az dizginler. Algler ve su pireleri salınmaya başlar ve her alg patlaması su otunu daha çok gölgede bırakır (R1): basamak basamak azalır.',
      real: 'Gerçek göletlerde ağaçtan düşen yapraklar da besin eklerdi.'
    },
    spray: {
      title: 'Yaprak bitine karşı ilaçlama',
      situation: 'Çayır yaprak bitine karşı ilaçlanıyor: her on yaprak bitinden dokuzu ve her on uğur böceğinden de dokuzu ölüyor.',
      think: 'Kim daha hızlı toparlanır: yaprak bitleri mi, onları yiyen uğur böcekleri mi?',
      explain: 'İlaçlama hem yaprak bitlerini hem de onları yiyen uğur böceklerini öldürdü. Yaprak bitleri uğur böceklerinden çok daha hızlı çoğalır, bu yüzden önce onlar döndü, onları durduran olmadan; bedelini kır çiçekleri ödedi. Ekolojistler buna zararlıların yeniden artışı der (gecikmeli B2).',
      real: 'Gerçek tarlalarda ilaçlama arılara ve başka böceklere de zarar verir, zararlılar da dirençli hâle gelebilir.'
    },
    'no-foxes': {
      title: 'Tilkiler gidiyor',
      situation: 'Tilkiler çayırdan ayrılıyor.',
      think: 'Tavşanları kim dizginliyordu? Tavşanlar çoğalınca önce ne yerler?',
      explain: 'Tilkiler olmadan tavşanları dizginleyen dengeleyici döngü kaybolur (B2). Tavşanlar çoğalır ve en sevdikleri besin olan yoncayı, çok azı kalana kadar yerler.',
      real: 'Gerçek doğada tavşanlar başka yerlere de gider ve hastalıklar sayılarını azaltabilir.'
    },
    fertilise: {
      title: 'Biraz gübre',
      situation: 'Çiftçi her hafta biraz gübre serpiyor.',
      think: 'Zengin topraktan en çok hangi bitki yararlanır ve alçak bitkilere ne yapar?',
      explain: 'Gübre en çok çimenleri besler. Daha uzun otlar alçak yoncayı gölgede bırakır, yonca da üstünlüğünü kaybeder: zengin toprakta kendi azotunu üretmek artık işe yaramaz. Çayır için daha çok besin, her bitkinin çoğalması demek değildir.',
      real: 'Gerçek çayırlarda gübreden ve havadan gelen azot, kır çiçeklerinin kaybolmasının başlıca nedenlerindendir.'
    },
    drought: {
      title: 'Kurak bir yaz',
      situation: 'On iki kurak hafta, sonra yeniden normal yağmur.',
      think: 'Çimenlerin besin dışında neye ihtiyacı var? Yağmur geri gelince ne olur?',
      explain: 'Yağmur olmadan toprak kurur, çimenler yavaşlar ve küçülür. Yağmur geri gelince toprak dolar ve çimenler yeniden büyür, hatta eski düzeylerini aşar; çünkü onlar kullanamazken toprakta besin birikmiştir.',
      real: 'Gerçek çayırlarda uzun bir kuraklık bitkileri öldürüp başkalarına yer de açabilir.'
    },
    'clover-poor': {
      title: 'Fakir çayıra yonca',
      situation: 'Kır çiçekleriyle dolu fakir bir çayıra yonca ekiliyor.',
      think: 'Yonca azotu havadan alır. Yaprakları ölünce o azot nereye gider?',
      explain: 'Yonca çayıra yeni azot getirir. Yaprakları ölünce solucanlar onları kır çiçeklerinin kullandığı besinlere dönüştürür. Komşular toprak yoluyla, yavaş yavaş kazanır: gecikmeli bir zincir.',
      real: 'Gerçek tarımda yonca tam da bu nedenle ekilir.'
    },
    'worms-gone': {
      title: 'Solucanlar nerede?',
      situation: 'Solucanlar çayırdan kayboluyor.',
      think: 'Ölü yaprakları yeniden bitki besinine kim dönüştürür? Hangi bitki buna bağlı değildir?',
      explain: 'Solucanlar olmadan ölü yapraklar birikir ve içlerindeki besinler kilitli kalır. Çimenler aç kalır. Yonca kendi azotunu ürettiği için kazançlı çıkar: pek kimsenin beklemediği bir yan etki.',
      real: 'Gerçek topraklarda ölü yaprakları çok daha fazla hayvan, mantar ve bakteri ayrıştırır.'
    },
    'foxes-return': {
      title: 'Tilkiler geri dönüyor',
      situation: 'Tilkiler, tavşanların istila ettiği bir çayıra geri dönüyor.',
      think: 'Genç tilkilerin büyümesi ne kadar sürer? Daha az tavşan yonca için ne anlama gelir?',
      explain: 'Başta pek bir şey olmaz: genç tilkilerin büyümesi yaklaşık yarım yıl sürer. Sonra tilkiler tavşanları azaltır (B2) ve otlanmaktan kurtulan yonca yavaşça geri gelir. Sonuç, nedenden yıllar sonra gelir.',
      real: 'Gerçek doğada tilkiler başka hayvanları da avlar, tavşanlar da yaşayacak yeni yerler bulur.'
    },
    'ladybirds-gone': {
      title: 'Toplanan uğur böcekleri',
      situation: 'Uğur böceklerinin çoğu başka bir bahçe için toplanıyor.',
      think: 'Yaprak bitlerini kim yer? Peki yaprak bitlerinin çoğalmaya devam etmek için neye ihtiyacı var?',
      explain: 'Uğur böcekleri olmadan yaprak bitleri çoğalır ve kır çiçeklerini yiyip bitirir. Besin azalınca yeniden azalırlar (B1): burada onları avcıları değil, besinleri durdurur. Kalan birkaç uğur böceği aylarca az kalır.',
      real: 'Gerçek bahçelerde çiçek sinekleri ve kuşlar gibi başka yaprak biti avcıları da yardım eder.'
    }
  },
  goals: {
    'save-pondweed': {
      story: 'Yukarıda yeni açılan bir tarlanın suyu berrak gölete akmaya başlıyor. Akıntı sürerken su otunu iki yıl hayatta tut.',
      target: '{w}. haftaya kadar her hafta en az {v} su otu.',
      hint: 'Algler bir belirtidir. Onları ne besliyor ve bunun ne kadar erken değişmesi gerekiyor?',
      explain: 'Su otu ancak bir şey onu gölgelediğinde azalır: tarlanın getirdiği besinlerle büyüyen su mercimeği ve algler. Nedene müdahale et, hem de erken: su otu zayıf göründüğünde pekiştirici döngü çoktan devreye girmiştir.',
      plans: {
        buffer: 'Tarla kenarına dikilen bir bitki şeridi, akıntının çoğunu gölete ulaşmadan tutar. Zamanında yapılırsa algler asla öne geçmez.',
        ditch: 'Hendeği kapatmak akıntıyı tamamen durdurur, böylece algler asla öne geçmez.'
      }
    },
    'clear-pond': {
      story: 'İki yıllık akıntıdan sonra gölet yeşile döndü. Suyu, su otu büyürken, on iki hafta boyunca yeniden berrak yap.',
      target: '{w}. haftaya kadar, art arda on iki hafta algler (yeşil ve mavi-yeşil) en fazla {v} ve su otu en az {p}.',
      hint: 'Algler bir belirtidir. Onları ne besliyor? Su berraklaşınca onları ne düşük tutar?',
      explain: 'Yeşil durum kendini sürdürür: algler, kendilerini dizginleyecek bitkileri gölgede bırakır. Suyu berraklaştırmak için nedeni (akıntıyı) kaldırmak, biriken besinleri çıkarmak ya da yıkamak ve su otunu geri getirmek gerekir; böylece pekiştirici döngü berrak suya doğru döner.',
      plans: {
        restore: 'Akıntıyı durdur, besince zengin çamuru tara, su otu dik ve küçük balıkların çoğunu çıkar (daha çok su piresi algleri otlasın diye). Birlikte döngüyü berrak suya doğru çevirirler.',
        flush: 'Akıntıyı durdur ve bir süre bir derenin besinleri ve algleri yıkayıp götürmesine izin ver, sonra berrak suya su otu dik.'
      }
    },
    'protect-flowers': {
      story: 'Bir komşu çayırı az önce ilaçladı: yaprak bitlerinin çoğu ve uğur böceklerinin çoğu öldü. Kır çiçeklerini bir yıl boyunca koru.',
      target: '{w}. haftaya kadar her hafta en az {v} kır çiçeği.',
      hint: 'Yaprak bitleri uğur böceklerinden daha hızlı geri gelir. Yeni uğur böcekleri ne zaman yiyecek bulur?',
      explain: 'Yaprak bitleri avcılarından önce toparlanır. Çok erken bırakılan uğur böcekleri, henüz yaprak biti olmadığı için aç kalır; çok geç bırakılırsa kır çiçekleri çoktan yenmiştir. Belirleyici olan zamanlamadır.',
      plans: {
        ladybirds: 'Yaklaşık on hafta sonra, yaprak bitleri geri döndüğünde ama zirveye ulaşmadan bırakılan uğur böcekleri hemen besin bulur ve yaprak bitlerini zamanında durdurur.'
      }
    },
    'bring-back-clover': {
      story: 'Tilkiler olmadan tavşanlar yoncayı neredeyse bitirdi. Dört yıl içinde yoncayı art arda sekiz hafta geri getir.',
      target: '{w}. haftaya kadar, art arda sekiz hafta en az {v} yonca.',
      hint: 'Tavşanları uzaklaştırmak yalnızca bir süre işe yarar. Önceden onları ne dizginliyordu?',
      explain: 'Tavşanlar hızla çoğalır, bu yüzden bir kısmını uzaklaştırmak yalnızca zaman kazandırır. Kalıcı değişiklik için dengeleyici döngünün, yani tilkilerin geri dönmesi gerekir. Genç tilkilerin büyümesi yarım yıl sürer, bu yüzden yonca ancak yıllar sonra geri gelir.',
      plans: {
        foxes: 'Tek başına tilkiler yeter, ama sabır gerekir: tavşanları yavaşça azaltırlar.',
        foxesRabbits: 'Tilkiler artı tavşanların yarısını taşımak: tilkilerin yetişmesi gereken tavşan sayısı azalır.',
        foxesRabbitsClover: 'Tilkiler, tavşanların çoğunu taşımak ve yonca ekmek: en hızlı yol, çünkü tilkiler büyürken yonca öne geçer.'
      }
    }
  },
  loops: {
    graze: 'Su pireleri algleri otlar; daha az alg, daha az su piresi.',
    fishFleas: 'Küçük balıklar su pirelerini yer; daha az su piresi, daha az genç balık.',
    pikeFish: 'Turnalar küçük balıkları yer; daha az küçük balık, daha az genç turna.',
    clearWater: 'Algler su otunu gölgeler; su otu algleri dizginler. Önde olan daha da öne geçer.',
    shelter: 'Su otu su pirelerini balıklardan saklar, su pireleri de algleri yer.',
    recycle: 'Ölü algler çürür ve yeni algleri besler.',
    aphidsFlowers: 'Yaprak bitleri kır çiçekleriyle yaşar; daha az çiçek, daha az yaprak biti.',
    ladybirdsAphids: 'Uğur böcekleri yaprak bitlerini yer; daha az yaprak biti, daha az genç uğur böceği.',
    rabbitsClover: 'Tavşanlar yoncayı yer; daha az yonca, daha az yavru tavşan.',
    foxesRabbits: 'Tilkiler tavşan avlar; daha az tavşan, daha az genç tilki.',
    thirst: 'Çimenler topraktaki suyu kullanır; kuru toprak çimenleri yavaşlatır.',
    wormsDead: 'Solucanlar ölü yaprakları yer; daha az ölü yaprak, daha az solucan.',
    flowerUptake: 'Kır çiçekleri büyüdükleri besinleri alır.'
  }
};
