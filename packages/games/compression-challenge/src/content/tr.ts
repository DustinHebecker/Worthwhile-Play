import type { ContentText } from './types';

export const content: ContentText = {
  launch: {
    title: 'Uygulama lansmanı hakkında güncelleme',
    context: 'Proje yöneticisinin tüm ekibe gönderdiği bir e-posta.',
    sentences: {
      s1: 'Herkese merhaba, umarım güneşli bir hafta sonu geçirmişsinizdir.',
      s2: 'Rezervasyon uygulamamızın lansmanı 2 Nisan’dan 14 Mayıs’a kayıyor.',
      s3: 'Bunun nedeni, ödeme sağlayıcısının güvenlik sertifikasyonunu henüz tamamlamamış olması; bu sertifika olmadan ödeme alamayız.',
      s4: 'Sağlayıcı, başvurularda bir birikme olduğunu söylüyor.',
      s5: 'Tasarım ekibi fazladan haftaları karşılama ekranlarını cilalamak için kullanacak.',
      s6: '300 beta test kullanıcımız lansmana kadar test sürümünü kullanmaya devam edebilir.',
      s7: 'Bir rakip geçen yıl benzer bir uygulama çıkardı ve bunu üç denemede başardı.',
      s8: 'Pazarlama kampanyayı kaydırmalı; lütfen kampanyanın yeni başlangıcına cumaya kadar karar verin.',
      s9: 'Ajans kampanyayı kaydırmak için ücret almadığından bütçe aynı kalıyor.',
      s10: 'Sertifikasyonun kendisi başladıktan sonra yaklaşık üç hafta sürüyor.',
      s11: 'Tüm emekleriniz için tekrar teşekkürler!',
      s12: 'Çarşamba günü güncellenmiş proje planını göndereceğim.'
    },
    bullets: {
      gold1: 'Lansman 2 Nisan’dan 14 Mayıs’a kayıyor.',
      gold2: 'Neden: ödeme sağlayıcısının güvenlik sertifikasyonu tamamlanmadı.',
      gold3: 'Pazarlama, kampanyanın yeni başlangıcına cumaya kadar karar vermeli.',
      minor: 'Tasarım ekibi karşılama ekranlarını cilalayacak.',
      distort: 'Uygulama güvenlik kontrolünden geçemedi.',
      dup: 'Lansman gecikiyor.',
      subtle: 'Lansman 2 Nisan’dan 4 Mayıs’a kayıyor.'
    },
    bulletNotes: {
      distort: 'Metin sertifikasyonun henüz bitmediğini söylüyor, uygulamanın bir kontrolden kaldığını değil.',
      dup: 'Yeni tarih maddesini tarihsiz tekrarlıyor ve bir yeri boşa harcıyor.',
      subtle: 'Neredeyse doğru, ama yeni tarih 4 Mayıs değil 14 Mayıs.'
    },
    summaries: {
      faithful: 'Ödeme sağlayıcısının sertifikasyonu bitmediği için lansman 14 Mayıs’a kayıyor ve pazarlama kampanyanın yeni başlangıcına cumaya kadar karar vermeli.',
      vague: 'Lansman takviminde ekibin bilmesi gereken bazı değişiklikler var.',
      drops: 'Ödeme sağlayıcısı henüz hazır olmadığı için lansman ertelendi, ama bütçe aynı kalıyor.',
      adds: 'Ödeme sağlayıcısının sertifikasyonu bitmediği için lansman 14 Mayıs’a kayıyor ve bu gecikme projeyi daha pahalı hâle getirecek.',
      subtle: 'Uygulamamız ödeme sağlayıcısının sertifikasyonundan geçemediği için lansman 14 Mayıs’a kayıyor ve pazarlama kampanyanın yeni başlangıcına cumaya kadar karar vermeli.'
    },
    summaryNotes: {
      drops: 'Yeni tarih ve pazarlamanın vermesi gereken karar eksik.',
      adds: 'Metin bütçenin aynı kaldığını söylüyor; maliyet artışı uydurma.',
      subtle: 'Uygulama hiçbir şeyden kalmadı: sertifikasyon sadece henüz bitmedi.'
    },
    task: 'Pazarlama ekibi bu tek cümleye göre harekete geçmeli.',
    oneLiner: 'Lansmanı mayısa kaydırın.',
    details: {
      d1: 'Kesin yeni tarih: 14 Mayıs',
      d2: 'Kim harekete geçecek: pazarlama kampanyayı kaydırıyor',
      d3: 'Son tarih: kampanyanın yeni başlangıcına cumaya kadar karar vermek',
      d4: 'Sağlayıcının neden geciktiği',
      d5: 'Tasarım ekibinin karşılama ekranları için planları',
      d6: 'Güneşli hafta sonu'
    },
    versions: {
      actionable: 'Lansman 2 Nisan’dan 14 Mayıs’a kayıyor. Pazarlama: lütfen kampanyayı kaydırın ve yeni başlangıç tarihine cumaya kadar karar verin. Bütçe aynı kalıyor.',
      vague: 'Lansmanı mayısa kaydırıyoruz. Lütfen planlarınızı buna göre ayarlayın ve bir şey çıkarsa haber verin.',
      invented: 'Lansman 1 Mayıs’a kayıyor. Pazarlama: lütfen kampanyayı iptal edin ve ay sonuna kadar yenisini planlayın.'
    },
    versionNote: 'Yeni tarih 1 Mayıs değil 14 Mayıs, ve kampanya iptal edilmiyor, kaydırılıyor.'
  },
  library: {
    title: 'Kütüphane tadilatı',
    context: 'Mahalle kütüphanesinin kapısına asılmış bir duyuru.',
    sentences: {
      s1: 'Birçoğunuz okuma köşesindeki eski koltukları ne kadar sevdiğinizi bize söylediniz.',
      s2: '3 Haziran’dan itibaren kütüphane tadilat nedeniyle sekiz hafta kapalı olacak.',
      s3: 'Çatı onarılacak, binaya asansör ve yeni aydınlatma eklenecek.',
      s4: 'Kapalı olduğu süre boyunca her salı pazar meydanında bir kütüphane otobüsü duracak.',
      s5: 'Otobüste yaklaşık 2.000 kitap var ve merkez kütüphaneden istenen her kitap sipariş edilebiliyor.',
      s6: 'Kapalı olunan sürede iadesi gelen tüm ödünç kitaplar otomatik olarak uzatılıyor, yani kimse gecikme cezası ödemiyor.',
      s7: 'Kitaplar ayrıca her zaman belediye binasının yanındaki iade kutusuna bırakılabilir.',
      s8: 'Belediye binası da on yıl önce benzer şekilde tadil edilmişti.',
      s9: 'E-kitaplarımız ve sesli kitaplarımız her zamanki gibi çevrim içi erişilebilir.',
      s10: 'Gelecek yılın yaz okuma festivalini şimdiden dört gözle bekliyoruz.',
      s11: 'Tadilat, bölgesel bir yapı fonundan karşılanıyor.'
    },
    bullets: {
      gold1: '3 Haziran’dan itibaren tadilat için sekiz hafta kapalı.',
      gold2: 'Her salı pazar meydanında bir kütüphane otobüsü duruyor.',
      gold3: 'Kapalıyken iadesi gelen ödünç kitaplar otomatik uzatılıyor.',
      minor: 'Binaya yeni aydınlatma geliyor.',
      distort: 'Kütüphanenin tüm hizmetleri sekiz hafta duruyor.',
      dup: 'Kütüphane bir süre kapalı olacak.',
      subtle: '3 Haziran’dan itibaren tadilat için altı hafta kapalı.'
    },
    bulletNotes: {
      distort: 'Doğru değil: kapalıyken de otobüs ve iade kutusu çalışıyor.',
      dup: 'Kapanışı başlangıç tarihi ve süresi olmadan tekrarlıyor.',
      subtle: 'Neredeyse doğru, ama kapanış altı değil sekiz hafta sürüyor.'
    },
    summaries: {
      faithful: 'Kütüphane 3 Haziran’dan itibaren sekiz hafta kapanıyor; bu sürede her salı pazar meydanına bir otobüs geliyor ve iadesi gelen kitaplar otomatik uzatılıyor.',
      vague: 'Bu yaz kütüphanede bazı değişiklikler olacak, gözünüz üzerinde olsun.',
      drops: 'Kütüphane tadil ediliyor; çatısı onarılacak, asansör ve yeni aydınlatma eklenecek.',
      adds: 'Kütüphane 3 Haziran’dan itibaren sekiz hafta kapanıyor ve yeniden açıldıktan sonra ödünç kitaplar için küçük bir ücret alacak.',
      subtle: 'Çatı güvenli olmadığı için kütüphane 3 Haziran’dan itibaren sekiz hafta kapanıyor; bu sürede her salı pazar meydanına bir otobüs geliyor.'
    },
    summaryNotes: {
      drops: 'İnşaat işlerini anlatıyor ama kütüphanenin ne zaman kapandığını ve okurların bu sürede ne yapabileceğini söylemiyor.',
      adds: 'Duyuruda yeniden açılıştan sonra ücret alınacağına dair hiçbir şey yok.',
      subtle: 'Duyuru çatının onarılacağını söylüyor, güvenli olmadığını değil; bu neden sonradan eklenmiş.'
    },
    task: 'Kitap ödünç almaya devam etmek isteyen bir komşu size bunu soruyor.',
    oneLiner: 'Kütüphane yazın kapalı.',
    details: {
      d1: 'Tam olarak ne zaman: 3 Haziran’dan itibaren sekiz hafta',
      d2: 'Bu sürede nereden ödünç alınır: salı günleri pazar meydanındaki otobüs',
      d3: 'Kitaplar nereye iade edilir: belediye binasının yanındaki kutu',
      d4: 'Tadilatın neleri kapsadığı',
      d5: 'Okuma köşesindeki koltuklar',
      d6: 'Gelecek yılın okuma festivali'
    },
    versions: {
      actionable: '3 Haziran’dan itibaren kütüphane sekiz hafta kapalı. Her salı pazar meydanındaki kütüphane otobüsünden kitap alabilir, istediğin zaman belediye binasının yanındaki kutuya iade edebilirsin. Bu sürede iadesi gelen kitaplar otomatik uzatılıyor.',
      vague: 'Kütüphane yazın inşaat yüzünden bir süre kapalı olacak. Başka seçenekler de olacakmış, duyuruya bir bak.',
      invented: '3 Haziran’dan itibaren kütüphane sekiz hafta kapalı. Her cuma garın önündeki kütüphane otobüsünden kitap alabilirsin. Lütfen kapanıştan önce tüm kitapları iade et.'
    },
    versionNote: 'Otobüs salı günleri pazar meydanında duruyor ve kimsenin kapanıştan önce kitap iade etmesi gerekmiyor.'
  },
  leaves: {
    title: 'Yapraklar neden renk değiştirir',
    context: 'Meraklı okurlar için bir doğa dergisinden kısa bir yazı.',
    sentences: {
      s1: 'Sonbahar, pek çok kişinin uzun yürüyüşler için en sevdiği mevsimdir.',
      s2: 'Yapraklar yeşildir, çünkü bitkilerin güneş ışığını yakalamak için kullandığı pigment olan klorofilden bolca içerirler.',
      s3: 'Günler kısaldıkça birçok ağaç klorofil üretmeyi bırakır ve onu parçalar.',
      s4: 'Karotenoit denen sarı ve turuncu pigmentler baştan beri yaprakta vardı; ancak yeşil solunca görünür hâle gelirler.',
      s5: 'Karotenoitler, havucu turuncu yapan pigmentle aynı türdendir.',
      s6: 'Kırmızı ise farklıdır: birçok akçaağaç gibi bazı ağaçlar sonbaharda yeni kırmızı pigmentler üretir.',
      s7: 'Araştırmacılar, bu kırmızı pigmentlerin ağaç besinleri geri alırken yaprağı güçlü ışıktan koruyabileceğini düşünüyor.',
      s8: 'Güneşli günler ve serin geceler kırmızıları genellikle daha canlı yapar.',
      s9: 'Bazı bölgelerde rengârenk ormanlar her yıl birçok turist çeker.',
      s10: 'Son olarak yaprağın dala bağlandığı yerde ince bir hücre tabakası oluşur ve yaprak düşer.',
      s11: 'Ağaçlara bakmaya çıkarsanız sıcak bir ceket almayı unutmayın.'
    },
    bullets: {
      gold1: 'Sonbaharda ağaçlar yeşil klorofil üretmeyi bırakıp onu parçalar.',
      gold2: 'Sarı ve turuncu pigmentler baştan beri vardı ve görünür hâle gelir.',
      gold3: 'Akçaağaç gibi bazı ağaçlar yeni kırmızı pigmentler üretir.',
      minor: 'İnce bir hücre tabakası oluşur ve yaprak düşer.',
      distort: 'Sonbaharın tüm renkleri ağacın ürettiği yeni pigmentlerdir.',
      dup: 'Yapraklar yeşil rengini kaybeder.',
      subtle: 'Kırmızı pigmentler yaprağı güçlü ışıktan korur.'
    },
    bulletNotes: {
      distort: 'Yalnızca kırmızılar yenidir; sarı ve turuncu baştan beri yapraktaydı.',
      dup: 'Klorofil maddesinden daha azını söylüyor ve bir yeri boşa harcıyor.',
      subtle: 'Metin yalnızca araştırmacıların kırmızı pigmentlerin yaprağı koruyabileceğini düşündüğünü söylüyor; bu madde bunu kesin bir gerçek gibi sunuyor.'
    },
    summaries: {
      faithful: 'Sonbaharda birçok ağaç yeşil klorofili parçalar, böylece baştan beri var olan sarı ve turuncu pigmentler görünür olur; bazı ağaçlar ayrıca yeni kırmızı pigmentler üretir.',
      vague: 'Yapraklar sonbaharda ağaçtaki çeşitli doğal süreçler yüzünden renk değiştirir.',
      drops: 'Sonbaharda yapraklar sarı, turuncu ve kırmızı olur, sonra ağaçlardan düşer.',
      adds: 'Sonbaharda birçok ağaç yeşil klorofili parçalar, böylece sarı ve turuncu pigmentler görünür olur; yapraklar ne kadar kırmızıysa gelecek kış o kadar soğuk olur.',
      subtle: 'Sonbaharda birçok ağaç yeşil klorofili parçalar, böylece sarı ve turuncu pigmentler görünür olur; soğuk geceler de ağaçları kırmızı pigment üretmeye iter.'
    },
    summaryNotes: {
      drops: 'Gördüğümüzü anlatıyor ama neden olduğunu söylemiyor.',
      adds: 'Metin kışı tahmin etmekle ilgili hiçbir şey söylemiyor.',
      subtle: 'Serin geceler kırmızıları genellikle yalnızca daha canlı yapar; metin bunların kırmızı pigmentlere yol açtığını söylemiyor.'
    },
    task: 'Bir öğretmen bu tek cümleyi gerçek yapraklarla sınıfa anlatmak istiyor.',
    oneLiner: 'Klorofil parçalanır, böylece başka renkler ortaya çıkar.',
    details: {
      d1: 'Klorofilin ne olduğu: güneş ışığını yakalayan yeşil pigment',
      d2: 'Sarı ve turuncunun baştan beri yaprakta olduğu',
      d3: 'Akçaağaç gibi bazı ağaçların yeni kırmızı pigmentler ürettiği',
      d4: 'Sonbaharın yürüyüş için sevilen bir mevsim olduğu',
      d5: 'Dışarıda sıcak bir cekete ihtiyaç olduğu',
      d6: 'Yaprağın sonunda nasıl düştüğü'
    },
    versions: {
      actionable: 'Yapraklar, güneş ışığını yakalayan bir pigment olan klorofil sayesinde yeşildir. Sonbaharda birçok ağaç klorofil üretmeyi bırakır ve onu parçalar. O zaman baştan beri var olan sarı ve turuncu pigmentler görünür olur, akçaağaç gibi bazı ağaçlar da yeni kırmızı pigmentler üretir.',
      vague: 'Sonbaharda yapraklar değişir, çünkü yeşil gider ve başka renkler çıkar. Doğa gerçekten büyüleyici.',
      invented: 'Yapraklar klorofil sayesinde yeşildir. Sonbaharda don klorofili dondurur, sonra ağaç yapraklarını yeni pigmentlerle sarıya, turuncuya ve kırmızıya boyar.'
    },
    versionNote: 'Metin donun klorofili dondurduğunu söylemiyor ve yalnızca kırmızılar yeni pigmenttir.'
  },
  club: {
    title: 'Spor kulübü yönetim kurulu toplantısı',
    context: 'Bir spor kulübünün yönetim kurulu toplantı tutanağı; tüm üyelere gönderildi.',
    sentences: {
      s1: 'Toplantı kulüp lokalinde yapıldı ve bir futbol maçı yüzünden biraz geç başladı.',
      s2: 'Yönetim kurulu, yıllık aidatın gelecek ocaktan itibaren 60 eurodan 66 euroya çıkarılmasını öneriyor.',
      s3: 'Bunun nedeni spor salonunun kirasının yüzde 15 artması.',
      s4: 'Aidat sekiz yıldır değişmedi.',
      s5: '18 yaşından küçük üyeler eski aidatı ödemeye devam edecek.',
      s6: 'Üyeler öneriyi 12 Mart’taki genel kurulda oylayacak.',
      s7: 'Yönetim kurulu tenis kortları için yeni fileleri de konuştu ama kararı erteledi.',
      s8: 'Öneri reddedilirse yönetim kurulu bunun yerine bazı antrenman saatlerini kısmayı değerlendirecek.',
      s9: 'Komşu bir kulüp de kısa süre önce aidatını 75 euroya çıkardı.',
      s10: 'Salon belediyeye ait ve kirayı da belediye belirliyor.',
      s11: 'Leziz kekler için genç takıma çok teşekkürler!'
    },
    bullets: {
      gold1: 'Öneri: yıllık aidat ocaktan itibaren 60 eurodan 66 euroya çıkıyor.',
      gold2: '18 yaşından küçük üyeler eski aidatı ödemeye devam ediyor.',
      gold3: 'Üyeler 12 Mart’taki genel kurulda oy veriyor.',
      minor: 'Tenis kortları için yeni fileler konuşuldu.',
      distort: 'Yönetim kurulu aidatı artırmaya karar verdi.',
      dup: 'Üyelik aidatı artabilir.',
      subtle: 'Öneri: yıllık aidat ocaktan itibaren 60 eurodan 76 euroya çıkıyor.'
    },
    bulletNotes: {
      distort: 'Henüz hiçbir şeye karar verilmedi: bu bir öneri ve üyeler oylayacak.',
      dup: 'Aidat maddesinin tutarlar olmadan daha belirsiz bir tekrarı.',
      subtle: 'Neredeyse doğru, ama önerilen aidat 76 değil 66 euro.'
    },
    summaries: {
      faithful: 'Salon kirası arttığı için yönetim kurulu, yıllık aidatın ocaktan itibaren 60 eurodan 66 euroya çıkmasını öneriyor; 18 yaşından küçükler hariç tutuluyor ve üyeler 12 Mart’ta oylayacak.',
      vague: 'Yönetim kurulu para konularını ve üyeler için bazı değişiklikleri konuştu.',
      drops: 'Spor salonunun kirası arttığı için kulübün mali durumu yönetim kurulu toplantısının ana konusuydu.',
      adds: 'Yönetim kurulu, yıllık aidatın ocaktan itibaren 60 eurodan 66 euroya çıkmasını öneriyor ve marta kadar ödemeyenler üyeliğini kaybedecek.',
      subtle: 'Salon kirası arttığı için yönetim kurulu, yıllık aidatı ocaktan itibaren 60 eurodan 66 euroya çıkarmaya karar verdi; 18 yaşından küçükler hariç tutuluyor.'
    },
    summaryNotes: {
      drops: 'Önerilen yeni aidat ve 12 Mart’taki oylama eksik.',
      adds: 'Tutanakta üyeliğin kaybedilmesiyle ilgili hiçbir şey yok.',
      subtle: 'Bu, üyelerin henüz oylayacağı bir öneri; bu yüzden “karar verdi” yanlış.'
    },
    task: 'Bir üye bunun kendisi için ne anlama geldiğini soruyor.',
    oneLiner: 'Aidatlar artıyor.',
    details: {
      d1: 'Tutarlar: yılda 60 eurodan 66 euroya',
      d2: 'Bunun bir öneri olduğu ve 12 Mart’taki genel kurulda oylanacağı',
      d3: '18 yaşından küçük üyelerin eski aidatı koruduğu',
      d4: 'Toplantının geç başladığı',
      d5: 'Genç takımın kekleri',
      d6: 'Tenis fileleriyle ilgili konuşma'
    },
    versions: {
      actionable: 'Salon kirası arttığı için yönetim kurulu, yıllık aidatın ocaktan itibaren 60 eurodan 66 euroya çıkmasını öneriyor. 18 yaşından küçük üyeler eski aidatı ödüyor. Henüz bir şey kesinleşmedi: 12 Mart’taki genel kurulda oy verebilirsin.',
      vague: 'Her şey pahalandığı için aidatlar gelecek yıl artıyor. Daha fazla bilgi bir ara gelecekmiş.',
      invented: 'Ocaktan itibaren aidat herkes için 60 eurodan 66 euroya çıkıyor. Lütfen 12 Mart’taki genel kuruldan önce havale tutarını değiştir.'
    },
    versionNote: 'Bir öneriyi kesinleşmiş gibi sunuyor ve 18 yaşından küçük üyelerin eski aidatı koruduğunu unutuyor.'
  },
  trip: {
    title: 'Sınıf gezisinde değişiklik',
    context: 'Bir öğretmenin sınıftaki öğrencilerin velilerine gönderdiği mesaj.',
    sentences: {
      s1: 'Umarım çocuklar da gezi için benim kadar heyecanlıdır!',
      s2: 'Demiryolu grevi nedeniyle sahile trenle değil, otobüsle gideceğiz.',
      s3: 'Bu da planladığımızdan bir saat erken yola çıkacağımız anlamına geliyor.',
      s4: 'Buluşma noktası artık istasyon değil, okulun arkasındaki otopark.',
      s5: 'Otobüs firmasının okul gruplarıyla çok deneyimi var.',
      s6: 'Cuma günkü dönüş planlandığı gibi kalıyor.',
      s7: 'Ailelere ek bir masraf yok; farkı okul karşılıyor.',
      s8: 'Otobüs yolculuğu trenden yaklaşık 40 dakika daha uzun sürüyor.',
      s9: 'Geçen yılki sınıf dağlara gitmişti, o da harika bir geziydi.',
      s10: 'Yolun yarısında bir dinlenme tesisinde kısa bir mola var.',
      s11: 'Eşya listelerine yardım ettiğiniz için hepinize teşekkürler.'
    },
    bullets: {
      gold1: 'Demiryolu grevi nedeniyle tren yerine otobüs.',
      gold2: 'Okulun arkasındaki otoparktan bir saat erken hareket.',
      gold3: 'Ailelere ek masraf yok.',
      minor: 'Otobüs firması okul gruplarında deneyimli.',
      distort: 'Grev yüzünden gezi kısaltılıyor.',
      dup: 'Seyahat planları değişti.',
      subtle: 'Okulun arkasındaki otoparktan iki saat erken hareket.'
    },
    bulletNotes: {
      distort: 'Yalnızca gidiş yolu değişiyor; gezi kısaltılmıyor.',
      dup: 'Sadece bir şeyin değiştiğini söylüyor; bu zaten diğer maddelerden anlaşılıyor.',
      subtle: 'Neredeyse doğru, ama hareket iki değil bir saat erken.'
    },
    summaries: {
      faithful: 'Demiryolu grevi nedeniyle sınıf otobüsle gidiyor ve okulun arkasındaki otoparktan bir saat erken hareket ediyor; ailelere ek masraf yok.',
      vague: 'Gezi düzenlemelerinde velilerin bilmesi gereken birkaç değişiklik var.',
      drops: 'Demiryolu grevi nedeniyle sınıf sahile otobüsle gidecek; bu da ailelere ek bir masraf çıkarmıyor.',
      adds: 'Demiryolu grevi nedeniyle sınıf otobüsle gidiyor ve okulun arkasındaki otoparktan bir saat erken hareket ediyor; veliler de küçük bir ek ücret ödüyor.',
      subtle: 'Otobüs trenden hızlı olduğu için sınıf otobüsle gidiyor ve okulun arkasındaki otoparktan bir saat erken hareket ediyor; ailelere ek masraf yok.'
    },
    summaryNotes: {
      drops: 'Velilerin harekete geçmesi gereken bilgiler eksik: erken hareket ve yeni buluşma noktası.',
      adds: 'Mesajda farkı okulun karşıladığı yazıyor, yani ek ücret yok.',
      subtle: 'Neden demiryolu grevi; üstelik otobüs trenden bile yavaş.'
    },
    task: 'Mesajı kaçıran bir veli, başka bir veliye ne yapması gerektiğini soruyor.',
    oneLiner: 'Sınıf artık otobüsle gidiyor.',
    details: {
      d1: 'Yeni buluşma noktası: okulun arkasındaki otopark',
      d2: 'Yeni saat: plandan bir saat erken',
      d3: 'Ek masraf olmadığı',
      d4: 'Otobüs firmasının deneyimli olduğu',
      d5: 'Neden trenle gitmedikleri',
      d6: 'Öğretmenin gezi için heyecanlı olduğu'
    },
    versions: {
      actionable: 'Sınıf otobüsle gidiyor. Çocuğunu plandan bir saat erken, istasyona değil okulun arkasındaki otoparka getir. Ek bir masraf yok ve cuma günkü dönüş değişmiyor.',
      vague: 'Grev var, o yüzden artık otobüsle gidiyorlar. Saat ve yer biraz farklı, öğretmenin yazdığına bir bak.',
      invented: 'Sınıf otobüsle gidiyor. Çocuğunu bir saat erken istasyona getir ve otobüs bileti için yanına biraz para ver.'
    },
    versionNote: 'Buluşma noktası istasyon değil okulun arkasındaki otopark, ve masrafı okul karşılıyor.'
  },
  bikes: {
    title: 'Paylaşımlı bisikletlere elektrikli bisiklet',
    context: 'Bir şehrin paylaşımlı bisiklet hizmetinin kullanıcılarına duyurusu.',
    sentences: {
      s1: 'Bisiklet sürmek, aktif kalmanın ve şehri keşfetmenin harika bir yolu.',
      s2: '1 Temmuz’dan itibaren paylaşımlı bisiklet hizmetimiz filosuna 200 elektrikli bisiklet ekliyor.',
      s3: 'Elektrikli bisikletin dakikası 20 sent; normal bisikletler şimdiki fiyatlarını koruyor.',
      s4: 'Elektrikli bisikletin kilidini açmak için uygulamamızın en son sürümü gerekiyor.',
      s5: 'Elektrikli bisikletlerin bir şarjla menzili yaklaşık 60 kilometre.',
      s6: 'Elektrikli bisikletler 12 şarj istasyonundan birine iade edilmeli; başka bir yere bırakılamaz.',
      s7: 'Şarj istasyonlarının haritası uygulamada.',
      s8: 'Bir elektrikli bisiklet istasyon dışında bırakılırsa 10 euro ücret alınır.',
      s9: 'Son yıllarda başka birkaç şehir de benzer hizmetler başlattı.',
      s10: 'Bisikletler kış boyunca 50 gönüllü tarafından test edildi.',
      s11: 'Bizimle pedal çevirdiğiniz için teşekkürler!'
    },
    bullets: {
      gold1: '1 Temmuz’dan itibaren: dakikası 20 sentten 200 elektrikli bisiklet.',
      gold2: 'Kilidi açmak için uygulamanın en son sürümü gerekiyor.',
      gold3: 'Elektrikli bisikletler 12 şarj istasyonundan birine iade edilmeli.',
      minor: 'Şarj istasyonlarının haritası uygulamada.',
      distort: 'Elektrikli bisikletler normal bisikletlerin yerini alıyor.',
      dup: 'Yeni bisikletler var.',
      subtle: '1 Temmuz’dan itibaren: dakikası 25 sentten 200 elektrikli bisiklet.'
    },
    bulletNotes: {
      distort: 'Elektrikli bisikletler ekleniyor; normal bisikletler şimdiki fiyatlarıyla kalıyor.',
      dup: 'İlk maddenin tarih, sayı ve fiyat olmadan daha belirsiz bir tekrarı.',
      subtle: 'Neredeyse doğru, ama fiyat dakikası 25 değil 20 sent.'
    },
    summaries: {
      faithful: '1 Temmuz’dan itibaren dakikası 20 sentten 200 elektrikli bisiklet var; kilitleri uygulamanın en son sürümüyle açılıyor ve 12 şarj istasyonundan birine iade edilmeleri gerekiyor.',
      vague: 'Paylaşımlı bisiklet hizmeti bu yaz kullanıcıların ilgisini çekebilecek yeni bir şey sunuyor.',
      drops: 'Paylaşımlı bisiklet hizmeti, menzili yaklaşık 60 kilometre olan 200 elektrikli bisiklet ekliyor; böylece uzun yolculuklar kolaylaşıyor.',
      adds: '1 Temmuz’dan itibaren dakikası 20 sentten 200 elektrikli bisiklet var ve normal bisikletler gelecek yıl kaldırılacak.',
      subtle: '1 Temmuz’dan itibaren dakikası 20 sentten 200 elektrikli bisiklet var; kilitleri uygulamanın en son sürümüyle açılıyor ve herhangi bir bisiklet istasyonuna iade edilebiliyorlar.'
    },
    summaryNotes: {
      drops: 'Fiyat ve kullanıcıların yapması gerekenler eksik: uygulamayı güncellemek ve bisikleti şarj istasyonuna iade etmek.',
      adds: 'Duyuruda normal bisikletlerin kaldırılacağı hiçbir yerde yazmıyor.',
      subtle: 'Elektrikli bisikletler herhangi bir istasyona değil, yalnızca 12 şarj istasyonuna iade edilebilir.'
    },
    task: 'Bir arkadaşınız gelecek hafta elektrikli bisikleti denemek istiyor.',
    oneLiner: 'Artık elektrikli bisiklet var.',
    details: {
      d1: 'Fiyat: dakikası 20 sent',
      d2: 'Kilidi açmak için uygulamanın en son sürümünün gerektiği',
      d3: 'Elektrikli bisikletlerin şarj istasyonuna geri götürülmesi gerektiği',
      d4: 'Bisikletin insanı aktif tuttuğu',
      d5: 'Toplam kaç elektrikli bisiklet olduğu',
      d6: 'Normal bisikletlerin fiyatını koruduğu'
    },
    versions: {
      actionable: '1 Temmuz’dan itibaren dakikası 20 sentten elektrikli bisiklet kiralayabilirsin. Önce uygulamayı güncelle, çünkü kilidi açmak için en son sürüm gerekiyor. İşin bitince bisikleti uygulamadaki haritada görünen 12 şarj istasyonundan birine bırak.',
      vague: 'Artık elektrikli bisiklet var ve kullanması çok kolay. Uygulamayı indir ve sür.',
      invented: '1 Temmuz’dan itibaren uygulama olmadan dakikası 20 sentten elektrikli bisiklet kiralayabilir, işin bitince şehirde istediğin yere bırakabilirsin.'
    },
    versionNote: 'Kilidi açmak için uygulamanın en son sürümü gerekiyor ve bisiklet bir şarj istasyonuna geri götürülmeli.'
  }
};
