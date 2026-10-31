import type { ContentText } from './types';

export const content: ContentText = {
  supplierDelay: {
    title: 'Lansman öncesi tedarikçi gecikmesi',
    situation: 'Şirketin 14 Mayıs’ta yeni bir masa lambası piyasaya sürüyor. Lamba başlıklarının tedarikçisi bir gecikme bildirdi. Bir brifing hazırla.',
    recipient: 'ürün sorumlusu',
    cards: {
      c1: 'Yeni masa lambası 14 Mayıs’ta satışa çıkıyor; 350 müşteri ön sipariş verdi.',
      c2: 'Tedarikçi, sipariş ettiğimiz 500 lamba başlığının yalnızca 200’ünü gönderdi.',
      c3: 'Parçalar gelince atölyemiz günde 100 lamba monte edebilir.',
      c4: 'Tedarikçi kalan lamba başlıklarının gönderim tarihini henüz vermedi.',
      c5: 'Tedarikçi kalanını gelecek hafta, muhtemelen salı günü göndermeyi bekliyor.',
      c6: 'Parçalar 10 Mayıs’tan sonra gelirse lambalar lansmana yetişecek şekilde monte edilemez.',
      c7: 'Lansman reklamı 14 Mayıs için ayrıldı; tarihi değiştirmek 800 euro ücrete mal olur.',
      c8: 'Pazarlama ekibinin, lansman tarihinin geçerli kalıp kalmadığını cumaya kadar bilmesi gerekiyor.',
      c9: 'Satın almadan Jonas yarın sabah tedarikçiyi arayıp kesin bir tarih isteyebilir.',
      c10: 'Tedarikçi geçen yıl yeni bir ofis binasına taşındı.',
      c11: 'Şimdiye kadar sipariş edilen 500 lamba başlığından sadece 200’ü gönderildi.',
      c12: 'Açıkçası bu tedarikçi hep biraz dağınıktı.'
    },
    decisions: {
      right: 'Lansman 14 Mayıs’ta mı kalsın, yoksa bir hafta mı ertelensin?',
      notTheirs: 'Tedarikçi hangi kargo firmasını kullanmalı?',
      premature: 'Gelecekteki tüm ürünler için bu tedarikçiyi değiştirmeli miyiz?'
    },
    actions: {
      concrete: 'Jonas yarın 9:00’da tedarikçiyi arar ve kesinleşen tarihi 12:00’ye kadar ürün sorumlusuna bildirir.',
      vague: 'Birinin tedarikçiyi gözden kaçırmaması lazım.',
      outOfScope: 'Gelecek yılın lamba koleksiyonunu tasarlamaya başlamak.'
    }
  },
  basement: {
    title: 'Ortak evde su basan bodrum',
    situation: 'Şiddetli yağmurdan sonra, başkalarıyla paylaştığın evin bodrumunda su birikti. Bir brifing hazırla.',
    recipient: 'ev sahibi',
    cards: {
      c1: 'Evi beş kişi paylaşıyor; bodrumda kombi kazanı ve herkesin eşya kutuları var.',
      c2: 'Bu sabah bodrumda yaklaşık 10 cm su vardı.',
      c3: 'Bu sabah önlem olarak bodrumun elektriğini kestik.',
      c4: 'Kazanın zarar görüp görmediğini henüz kimse bilmiyor.',
      c5: 'Su muhtemelen artık yükselmiyor; öğlen de sabahki gibi görünüyordu.',
      c6: 'Perşembe için yine yağmur bekleniyor ve su tekrar yükselebilir.',
      c7: 'Kazan yerden 15 cm yüksekte, yani birkaç santim daha su ona ulaşır.',
      c8: 'Tesisatçı ancak ev sahibi servis ücretini yarına kadar onaylarsa bu hafta gelebilir.',
      c9: 'Evden çalışan bir ev arkadaşı çarşamba günü tesisatçıyı içeri alabilir.',
      c10: 'Bodrum duvarları en son 2015’te boyandı.',
      c11: 'Bu sabah baktığımızda bodrum 10 cm su altındaydı.',
      c12: 'Bu ev hep rutubetliydi ve kimse hiçbir şey yapmıyor.'
    },
    decisions: {
      right: 'Tesisatçının bu haftaki servis ücreti onaylansın mı?',
      notTheirs: 'Hangi ev arkadaşı kutularını önce taşımalı?',
      premature: 'Bodrumun tamamı yalıtılıp yenilenmeli mi?'
    },
    actions: {
      concrete: 'Evden çalışan ev arkadaşı tesisatçıyı çarşambaya ayarlar ve teklifi bugün ev sahibine gönderir.',
      vague: 'Bir ara ilgileniriz.',
      outOfScope: 'Herkesin moralini düzeltmek için bir ev partisi planlamak.'
    }
  },
  schoolTrip: {
    title: 'Okul gezisi ve hava uyarısı',
    situation: '24 öğrencilik bir sınıf cuma günü tepelerde yürüyüşe çıkacak. Bir hava uyarısı yayımlandı. Bir brifing hazırla.',
    recipient: 'okul müdürü',
    cards: {
      c1: '11 yaşındaki 24 öğrenciden oluşan sınıf cuma günkü yürüyüşe kayıtlı; yanlarında üç yetişkin refakatçi var.',
      c2: 'Meteoroloji cuma öğleden sonrası için fırtına uyarısı yayımladı.',
      c3: 'Şehirdeki bilim müzesinde cuma günü bir sınıf ziyareti için hâlâ yer var.',
      c4: 'Tahmin, fırtınanın öğleden önce mi sonra mı geleceğini henüz söylemiyor.',
      c5: 'Park bekçisi ana patikanın büyük olasılıkla açık kalacağını düşünüyor.',
      c6: 'Kuvvetli rüzgâr orman patikasında dalları koparabilir.',
      c7: 'Güzergâhtaki tek sığınak patikanın sonundan 40 dakikalık yürüme mesafesinde; fırtınada hızla ulaşmak için çok uzak.',
      c8: 'Otobüs firmasına gezinin yapılıp yapılmayacağı çarşamba akşamına kadar bildirilmeli; o zamana kadar iptal ücretsiz.',
      c9: 'Sınıf öğretmeni çarşamba öğlen güncel tahmini kontrol edebilir.',
      c10: 'Sınıf daha eylülde yürüyüş için oy vermişti.',
      c11: 'Meteorolojiye göre cuma öğleden sonra fırtına bekleniyor.',
      c12: 'İptal edersek çocuklar çok hayal kırıklığına uğrar.'
    },
    decisions: {
      right: 'Yürüyüş yapılsın mı, müzeye mi geçilsin, yoksa gezi iptal mi edilsin?',
      notTheirs: 'Öğrenciler öğle yemeği için ne getirmeli?',
      premature: 'Okul bundan sonra tüm açık hava gezilerini kaldırmalı mı?'
    },
    actions: {
      concrete: 'Sınıf öğretmeni çarşamba 12:00’de tahmini kontrol eder ve 14:00’e kadar müdüre bir öneri gönderir.',
      vague: 'Bakalım hava nasıl olacak.',
      outOfScope: 'Gelecek yılki okul şenliğini planlamaya başlamak.'
    }
  },
  volunteers: {
    title: 'Gönüllüsü az bir temizlik günü',
    situation: 'Mahalle derneğin cumartesi günü parkta temizlik yapıyor. Çok az gönüllü kaydoldu. Bir brifing hazırla.',
    recipient: 'dernek başkanı',
    cards: {
      c1: 'Her yılki park temizliği cumartesi 10:00 ile 13:00 arasında; belediye torba ve eldiven veriyor.',
      c2: 'Şu ana kadar 9 gönüllü kaydoldu; 20 kişi planlamıştık.',
      c3: 'Belediye dolu torbaları yalnızca cumartesi 13:00’te topluyor.',
      c4: 'Gençler futbol takımı yardımcı gönderebilir ama antrenör henüz cevap vermedi.',
      c5: 'Birkaç komşu, hava güzel olursa muhtemelen uğrayacaklarını söyledi.',
      c6: '9 kişiyle parkın ancak yarısı kadarını temizleyebiliriz.',
      c7: 'Cumartesi 9:30’da kapanan toplum merkezinden eldivenleri alacak kişi henüz belirlenmedi.',
      c8: 'Temizliği oyun alanı bölgesiyle sınırlayabilir ya da bir sonraki cumartesiye erteleyebiliriz.',
      c9: 'İki gönüllü yarın mahalleye afiş asmayı önerdi.',
      c10: 'Geçen yılki temizlik mangalla bitmişti.',
      c11: 'Planladığımız 20 gönüllüden sadece 9’u kayıt yaptırdı.',
      c12: 'İnsanlar artık mahallelerini hiç umursamıyor.'
    },
    decisions: {
      right: 'Bu cumartesi daha küçük bir temizlik mi yapılsın, yoksa bir hafta mı ertelensin?',
      notTheirs: 'Belediye torba toplama saatlerini değiştirmeli mi?',
      premature: 'Dernek önümüzdeki yıllarda bir temizlik şirketiyle mi çalışmalı?'
    },
    actions: {
      concrete: 'İki gönüllü yarın afişleri asar, sekreter bugün futbol antrenörüne e-posta yazar ve perşembeye kadar sonucu bildirir.',
      vague: 'Bir şekilde daha fazla insan bulmalıyız.',
      outOfScope: 'Derneğin yaz şenliğini planlamaya başlamak.'
    }
  },
  release: {
    title: 'Başarısız bir testle yazılım sürümü',
    situation: 'Ekibin salı günü bir rezervasyon uygulamasının yeni sürümünü yayımlamak istiyor. Otomatik testlerden biri başarısız oluyor. Bir brifing hazırla.',
    recipient: 'ürün yöneticisi',
    cards: {
      c1: 'Yeni sürüm çevrim içi ödeme ekliyor ve müşterilere salı günü için duyuruldu.',
      c2: '640 otomatik testten biri başarısız: iptal edilen bir rezervasyonun iadesi.',
      c3: 'Hata yalnızca yabancı para birimiyle yapılan ödemelerde görülüyor.',
      c4: 'Hatanın bizim kodumuzda mı yoksa ödeme sağlayıcısının test sisteminde mi olduğunu henüz bilmiyoruz.',
      c5: 'Geliştirici düzeltmenin yaklaşık bir gün süreceğini tahmin ediyor ama koda henüz bakmadı.',
      c6: 'Hata gerçekse bazı müşterilere yanlış tutarda iade yapılabilir.',
      c7: 'Rezervasyonların yaklaşık %15’i yabancı para birimiyle ödeniyor; yani hata birçok müşteriyi etkiler.',
      c8: 'Salı günü yabancı para birimiyle ödemeyi kapatarak yayımlayabilir ya da sürümün tamamını erteleyebiliriz.',
      c9: 'Geliştirici bu öğleden sonra ödeme sağlayıcısının test kayıtlarını inceleyebilir.',
      c10: 'Yeni ödeme ekranında şirketin yeni mavi tonu kullanılıyor.',
      c11: 'Kırmızı olan tek bir test var: iptal edilen rezervasyonların iadeleri.',
      c12: 'Bu test hep güvenilmezdi; ben olsam görmezden gelirdim.'
    },
    decisions: {
      right: 'Salı günü yabancı para birimiyle ödeme olmadan mı yayımlansın, yoksa sürüm ertelensin mi?',
      notTheirs: 'Geliştirici düzeltme için hangi programlama tekniğini kullanmalı?',
      premature: 'Başka bir ödeme sağlayıcısına mı geçmeliyiz?'
    },
    actions: {
      concrete: 'Geliştirici bu öğleden sonra sağlayıcının test kayıtlarını inceler ve hatanın bizden olup olmadığını 17:00’ye kadar ürün yöneticisine bildirir.',
      vague: 'Biri teste bir bakar.',
      outOfScope: 'Bir sonrakinden sonraki sürümün sürüm notlarını yazmaya başlamak.'
    }
  },
  careAppointment: {
    title: 'Büyükanne için bakım danışmanlığı randevusu',
    situation: 'Büyükannenin pazartesi günü bir bakım danışmanlık servisinde randevusu var. Aile, ona kimin eşlik edeceğine karar vermeli. Bir brifing hazırla. (Konu tıbbi sorular değil, organizasyon.)',
    recipient: 'kararı seninle paylaşan kardeşin',
    cards: {
      c1: 'Büyükannenin pazartesi 10:00’da evde yardım konusunu konuşmak için bakım danışmanlık servisinde randevusu var.',
      c2: 'Aileden bir kişinin kendisiyle gelmesini istedi.',
      c3: 'Mektupta ilaç listesini ve sigorta kartını getirmesi gerektiği yazıyor.',
      c4: 'Annemin pazartesi izin alıp alamayacağı henüz belli değil.',
      c5: 'Danışmanlık merkezinde asansör olduğu söyleniyor ama kimse kontrol etmedi.',
      c6: 'Kimse gidemezse bir sonraki boş randevu altı hafta sonra.',
      c7: 'Büyükanne çabuk yoruluyor ve merkeze otobüs yolculuğu tek yön 50 dakika sürüyor.',
      c8: 'Danışmanlık servisi randevunun yüz yüze mi yoksa görüntülü görüşmeyle mi olacağını cumaya kadar bilmeli.',
      c9: 'Bu akşam annemi arayıp pazartesiyi sorabilirsin.',
      c10: 'Büyükannenin komşusu yakın zamanda yeni bir köpek aldı.',
      c11: 'Aileden birinin kendisiyle gelmesini istiyor.',
      c12: 'Bence bu danışmanlıklar zaten hiçbir zaman gerçekten işe yaramıyor.'
    },
    decisions: {
      right: 'Pazartesi büyükanneye kim eşlik edecek; yüz yüze mi, görüntülü mü?',
      notTheirs: 'Büyükanne evde ne tür bir yardım almalı?',
      premature: 'Büyükanne bir bakımevine mi taşınmalı?'
    },
    actions: {
      concrete: 'Bu akşam annemi ararsın ve kimin gidebileceğini çarşamba akşamına kadar kardeşine söylersin.',
      vague: 'Bir şekilde hallederiz.',
      outOfScope: 'Büyükannenin doğum günü partisini planlamaya başlamak.'
    }
  },
  cafeFreezer: {
    title: 'Küçük bir kafede bozulan dondurucu',
    situation: 'Küçük bir kafede çalışıyorsun. Bu sabah dondurucu yeterince soğutmuyordu. Kafe sahibi yarına kadar yok. Bir brifing hazırla.',
    recipient: 'kafe sahibi',
    cards: {
      c1: 'Kafe ev yapımı dondurma satıyor; dondurucuda yaklaşık bir haftalık stok var.',
      c2: 'Saat 7:00’de dondurucu her zamanki −18 °C yerine −2 °C gösteriyordu.',
      c3: 'Dondurmayı 7:30’da yandaki fırının dondurucusuna taşıdık.',
      c4: 'Dondurmanın gece boyunca erimiş olup olmadığını bilmiyoruz.',
      c5: 'Servis muhtemelen perşembe günü gelebilecek.',
      c6: 'Erimiş dondurma satılamaz; stoğu atmak zorunda kalabiliriz.',
      c7: 'Fırın, dondurucudaki yerini cumartesi geri istiyor; yani dondurmamız ancak o zamana kadar orada kalabilir.',
      c8: 'Servis, kafe sahibi 90 euroluk servis ücretini onaylamadan randevu vermiyor.',
      c9: 'Barista bu öğleden sonra dondurucunun sıcaklık kaydını okuyabilir.',
      c10: 'Kafenin yeni menü panoları gelecek hafta geliyor.',
      c11: 'Bu sabah dondurucu −18 °C yerine −2 °C gösterdi.',
      c12: 'O dondurucu ilk günden beri yanlış bir alışverişti.'
    },
    decisions: {
      right: 'Onarım için 90 euroluk servis ücreti onaylansın mı?',
      notTheirs: 'Fırın bu hafta hangi pastaları satmalı?',
      premature: 'Kafe dondurma satmayı tamamen bırakmalı mı?'
    },
    actions: {
      concrete: 'Barista bu öğleden sonra sıcaklık kaydını okur ve sonucu 16:00’ya kadar kafe sahibine mesajla bildirir.',
      vague: 'Göz kulak oluruz.',
      outOfScope: 'Kafenin web sitesini yeniden tasarlamak.'
    }
  },
  tournament: {
    title: 'Satranç turnuvası için yeni yer',
    situation: 'Satranç kulübün pazar günü bir gençler turnuvası düzenliyor. Ayırttığınız okul salonu artık kullanılamıyor. Bir brifing hazırla.',
    recipient: 'kulüp yönetimi',
    cards: {
      c1: 'Pazar günkü gençler turnuvasına altı kulüpten 48 oyuncu kayıtlı.',
      c2: 'Okul, çatıdaki bir sızıntı yüzünden salon rezervasyonumuzu iptal etti.',
      c3: 'Belediye kütüphanesi etkinlik salonunu ücretsiz öneriyor ama salon yalnızca 32 oyuncu alıyor.',
      c4: 'Spor merkezinde boş bir salon olabilir ama e-postamıza henüz cevap vermedi.',
      c5: 'Okulun hizmetlisi salonun zamanında onarılabileceğine inanıyor ama bunu kimse doğrulamadı.',
      c6: 'Aileler değişikliği çok geç öğrenirse bazı oyuncular eski yere gidebilir.',
      c7: 'Birkaç aile 100 km’den fazla yol geliyor ve trenlerini çoktan ayırttı; tarih değişikliği en çok onları etkiler.',
      c8: 'Kesin yerin yazılı olduğu davetiyeler çarşambaya kadar gönderilmeli.',
      c9: 'Kulüp sekreteri yarın sabah spor merkezini arayabilir.',
      c10: 'Kulübün kupa vitrini geçen ay temizlendi.',
      c11: 'Okul salon rezervasyonumuzu geri çekti.',
      c12: 'O okula hiç güvenmemeliydik.'
    },
    decisions: {
      right: 'Başka bir yere mi geçilsin, turnuva 32 oyuncuyla mı sınırlansın, yoksa ertelensin mi?',
      notTheirs: 'Okul çatısını ne zaman onarmalı?',
      premature: 'Kulüp kendi lokalini mi inşa etmeli?'
    },
    actions: {
      concrete: 'Sekreter yarın 9:00’da spor merkezini arar ve 12:00’ye kadar yönetime bilgi verir.',
      vague: 'Bekleyip ne çıkacağını görelim.',
      outOfScope: 'Kulüp için yeni satranç takımları sipariş etmek.'
    }
  }
};
