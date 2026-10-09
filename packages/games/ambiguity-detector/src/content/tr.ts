import type { LocaleContent } from './items';

export const content: LocaleContent = {
  'finish-tomorrow': {
    context: 'Ekip liderin sana ekip sohbetinden yazıyor. Şu anda üç farklı rapor üzerinde çalışıyorsun.',
    text: 'Lütfen bunu yarın bitir.',
    ask: { what: 'Üç rapordan hangisini kastediyorsun?', when: 'Yarın saat kaça kadar: sabah mı, gün sonuna kadar mı?' },
    given: { who: 'Mesaj doğrudan sana yazılmış.' },
    replies: {
      clear: 'Tabii. Üç rapordan hangisi: bütçe, satış yoksa personel raporu mu? Ve yarın saat kaça kadar?',
      vague: 'Tamam, hallederim!',
      assume: 'Sorun değil, satış raporunu yarın bitiririm.'
    }
  },
  'concert-entrance': {
    context: 'Bir arkadaşın, saat 20.00’de başlayan cumartesi konseri hakkında yazıyor. Salonun dört girişi var.',
    text: 'Konserden önce girişte buluşalım.',
    ask: { when: 'Saat kaçta buluşuyoruz, 20.00’den ne kadar önce?', where: 'Dört girişten hangisinde?' },
    given: { what: 'Ne planlandığı belli: konserden önce buluşmak.' },
    replies: {
      clear: 'İyi fikir! Hangi giriş ve saat kaçta? 19.30 olur mu?',
      vague: 'Olur, orada görüşürüz!',
      rude: 'Hep böyle konuşuyorsun. Bir kere de net ol!'
    }
  },
  'party-photos': {
    context: 'Teyzen, yaklaşık 200 fotoğraf çektiğin bir aile toplantısından sonra sana yazıyor.',
    text: 'Pazar gününün fotoğraflarını bana gönderebilir misin?',
    ask: { what: '200’ünün hepsini mi, yoksa sadece bazılarını, mesela senin olduğun fotoğrafları mı?', format: 'Nasıl göndereyim: indirme bağlantısıyla mı, e-postayla mı, yoksa baskı olarak mı?' },
    given: { who: 'Kimin göndereceği belli: sen.' },
    replies: {
      clear: 'Tabii! 200’ünün hepsini mi, yoksa bir seçki mi? İndirme bağlantısı senin için uygun mu?',
      vague: 'Tabii, bir ara gönderirim.',
      assume: '200 fotoğrafın hepsinin baskısını senin için sipariş ettim.'
    }
  },
  'water-plants': {
    context: 'Komşun yarın iki haftalığına seyahate çıkıyor. Yedek anahtarı sende.',
    text: 'Ben yokken çiçekleri sular mısın?',
    ask: { when: 'Ne sıklıkla su istiyorlar: her gün mü, haftada iki kez mi?', where: 'Hangi bitkiler: içeridekiler mi, balkondakiler mi, ikisi de mi?' },
    given: { what: 'Görev belli: bitkileri sulamak.', who: 'Doğrudan senden isteniyor.' },
    replies: {
      clear: 'Memnuniyetle! Hangi bitkileri, ne sıklıkla sulayayım?',
      vague: 'Tabii, sorun değil.',
      assume: 'Tabii, balkondaki çiçekleri her akşam sularım.'
    }
  },
  'train-tickets': {
    context: 'Sen ve bir arkadaşın deniz kenarında bir hafta sonu planlıyorsunuz. Arkadaşın yazıyor:',
    text: 'Oteli ben ayarlarım. Treni sen ayarlar mısın?',
    ask: { when: 'Hangi gün, aşağı yukarı saat kaçta gidip dönüyoruz?' },
    given: { what: 'Görev belli: gezi için tren biletleri.', who: 'Biletleri senin alman isteniyor.' },
    replies: {
      clear: 'Olur! Hangi gün ve saat kaçta çıkmak istiyorsun, ne zaman dönüyoruz?',
      vague: 'Tamam, hallederim.',
      assume: 'Tamamdır: cuma sabah 5.30, birinci sınıf.'
    }
  },
  'bins-tonight': {
    context: 'Beş ev arkadaşının grup sohbetinde bir mesaj.',
    text: 'Bu akşam birinin çöpü çıkarması lazım.',
    ask: { who: 'Bu akşam tam olarak kim çıkaracak? Sıra kimde?' },
    given: { what: 'Görev belli: çöpü çıkarmak.', when: 'Zaman belli: bu akşam.' },
    replies: {
      clear: 'Bu akşam kim çıkarıyor? Bakabileceğimiz bir nöbet listesi var mı?',
      vague: 'Evet, birinin çıkarması lazım.',
      rude: 'Ben değilim, orası kesin. Aranızda halledin.'
    }
  },
  'school-form': {
    context: 'Çocuğunun öğretmeninden okul uygulamasında bir mesaj. Bu hafta çocuğun eve iki form getirdi: biri gezi, biri sınıf fotoğrafı için.',
    text: 'Lütfen imzalı formu perşembeye kadar geri gönderin.',
    ask: { what: 'Hangi formu kastediyorsunuz: gezi formunu mu, fotoğraf formunu mu?', format: 'Kâğıt olarak mı teslim edeyim, uygulamaya fotoğraf olarak mı yükleyeyim?' },
    given: { when: 'Son tarih belli: perşembe.' },
    replies: {
      clear: 'Teşekkürler! Hangi form, gezi mi fotoğraf mı? Kâğıt olarak mı, uygulamadan mı göndereyim?',
      vague: 'Tamam, not aldım.',
      assume: 'Tamamdır: iki formu da imzalayıp fotoğraflarını yükledim.'
    }
  },
  'holiday-keys': {
    context: 'Tatil için bir daire kiraladın. Ev sahibi, varışından bir gün önce sana yazıyor.',
    text: 'Anahtarları sizin için bırakacağım.',
    ask: { where: 'Anahtarları tam olarak nereye bırakacaksınız?' },
    given: { what: 'Neyle ilgili olduğu belli: anahtarlar.', who: 'Anahtarları ev sahibi kendisi bırakacak.' },
    replies: {
      clear: 'Teşekkürler! Tam olarak nerede olacaklar: anahtar kutusunda mı, bir komşuda mı?',
      vague: 'Harika, teşekkürler!',
      assume: 'Süper, o zaman paspasın altından alırım.'
    }
  },
  'project-slides': {
    context: 'Yöneticin salı sabahı sana yazıyor.',
    text: 'Proje hakkında birkaç slayt hazırlayabilir misin?',
    ask: {
      when: 'Slaytlar ne zamana lazım?',
      audience: 'Kim görecek: ekip mi, yönetim mi, müşteri mi?',
      scope: 'Ne kapsamda: birkaç slayt mı, tam bir sunum mu?',
      purpose: 'Amacı ne: durum bilgisi vermek mi, bir karar almak mı?'
    },
    given: { what: 'Çıktı belli: proje hakkında slaytlar.', who: 'Doğrudan senden isteniyor.' },
    replies: {
      clear: 'Memnuniyetle. Kim için, ne zamana, aşağı yukarı ne uzunlukta, ve bir karara mı götürmeli yoksa sadece bilgi mi vermeli?',
      vague: 'Tabii, birkaç slayt yaparım.',
      assume: 'Cuma günkü yönetim kurulu toplantısı için 40 slayt hazırlayacağım.'
    }
  },
  'cafe-website': {
    context: 'Küçük bir kafenin sahibi, web sitesini yapan tasarımcı olarak sana yazıyor.',
    text: 'Site garip görünüyor, düzeltebilir misin?',
    ask: {
      what: 'Tam olarak ne yanlış görünüyor: yazılar mı, resimler mi, düzen mi?',
      where: 'Hangi sayfada ve hangi cihazda görüyorsun?',
      priority: 'Acil mi? Müşteriler bu yüzden sipariş veremiyor mu?'
    },
    given: { who: 'Sitenin tasarımcısı olarak senden isteniyor.' },
    replies: {
      clear: 'Üzüldüm! Tam olarak ne yanlış görünüyor, hangi sayfada ve cihazda? Müşteriler bu yüzden sipariş veremiyor mu?',
      vague: 'Bir bakarım.',
      assume: 'Bu hafta bütün siteyi baştan tasarlayacağım.'
    }
  },
  'walk-report': {
    context: 'Yürüyüş kulübünün başkanı bahar yürüyüşünden sonra sana yazıyor.',
    text: 'Yürüyüş hakkında kısa bir yazı yazabilir misin?',
    ask: {
      when: 'Yazı ne zamana lazım?',
      format: 'Sadece metin mi, fotoğraflı mı? Baskı için mi, web sitesi için mi?',
      audience: 'Kim okuyacak: kulüp üyeleri mi, yerel gazete mi?'
    },
    given: { what: 'Çıktı belli: yürüyüş hakkında bir yazı.', scope: '“Kısa” yaklaşık bir uzunluk veriyor; yine de kelime sayısını sorabilirsin.' },
    replies: {
      clear: 'Memnuniyetle! Kimin için, ne zamana lazım, fotoğraf ekleyeyim mi?',
      vague: 'Tamam, bir şeyler yazarım.',
      assume: 'Yarın gazeteye 50 fotoğraflı, üç sayfalık bir yazı gönderiyorum.'
    }
  },
  'office-paper': {
    context: 'Ofis yöneticisi ekip kanalına yazıyor.',
    text: 'Yazıcı kâğıdı azaldı, biri lütfen yenisini sipariş etsin.',
    ask: {
      when: 'Ne zamana lazım?',
      who: 'Siparişi kim verecek?',
      scope: 'Ne kadar sipariş edelim?'
    },
    given: { what: 'Neyin gerektiği belli: yazıcı kâğıdı.' },
    replies: {
      clear: 'Ben sipariş edebilirim. Kaç paket, ve ne zamana lazım?',
      vague: 'Evet, birinin etmesi lazım.',
      assume: '100 koli sipariş ettim, gelecek ay gelir.'
    }
  },
  'anniversary': {
    context: 'Eşin seni arıyor. İki ay sonra annesiyle babasının 40. evlilik yıl dönümü.',
    text: 'Annemle babam için bir şey organize etmeliyiz.',
    ask: {
      what: 'Aklında ne var: bir yemek mi, bir parti mi, bir hediye mi?',
      when: 'Ne zaman: tam o gün mü, yakın bir hafta sonu mu?',
      who: 'Kim neyle ilgilenecek: sen mi, ben mi, kardeşlerin mi?',
      scope: 'Ne büyüklükte: sadece aile mi, çok sayıda misafir mi?'
    },
    given: { audience: 'Kimin için olduğu belli: anne ve baba.', purpose: 'Vesile belli: 40. evlilik yıl dönümü.' },
    replies: {
      clear: 'Ne güzel fikir! Aklında ne var, ne zaman, kaç kişilik, ve kim ne yapacak?',
      vague: 'Evet, etmeliyiz.',
      assume: 'Gelecek cumartesi için 60 kişilik bir restoran ayırttım.'
    }
  },
  'customer-reply': {
    context: 'Yöneticin, teslimatı iki hafta gecikmiş bir müşterinin şikâyetini sana iletiyor.',
    text: 'Lütfen müşteriye dönüş yap.',
    ask: {
      what: 'Ne teklif edebilirim: özür, indirim, yeni bir teslim tarihi?',
      when: 'Ne kadar hızlı: bugün mü?',
      format: 'Arayayım mı, yazayım mı?'
    },
    given: { audience: 'Kime dönüleceği belli: müşteriye.', purpose: 'Sebep belli: geciken teslimat.' },
    replies: {
      clear: 'Tamam. Arayayım mı, e-posta mı atayım, ne zamana kadar, ve ne teklif edebilirim?',
      vague: 'Tamam.',
      assume: 'Müşteriye tam iade ve bir yıl ücretsiz kargo sözü verdim.'
    }
  },
  'shop-translation': {
    context: 'Küçük bir internet mağazası olan bir arkadaşın, İspanyolca bildiğin için sana yazıyor.',
    text: 'Mağazanın metinlerini benim için çevirebilir misin?',
    ask: {
      when: 'Çeviri ne zamana lazım?',
      audience: 'Müşterilerin İspanya’da mı, Latin Amerika’da mı?',
      scope: 'Hangi metinler ve ne kadar: ürün açıklamaları mı, bütün site mi?'
    },
    given: { what: 'Görev belli: İspanyolcaya çeviri.', who: 'Doğrudan senden isteniyor.' },
    replies: {
      clear: 'Seve seve yardım ederim! Hangi metinler, ne zamana, ve müşterilerin İspanya’da mı Latin Amerika’da mı?',
      vague: 'Tabii, bir ara gönder.',
      assume: 'Tabii, yarına kadar bütün siteyi İspanyolca, Portekizce ve Fransızcaya çeviririm.'
    }
  },
  'basement': {
    context: 'Apartmanının yöneticisi bütün sakinlere yazıyor.',
    text: 'Lütfen eşyalarınızı bodrumdan boşaltın.',
    ask: {
      when: 'Bodrum ne zamana kadar boş olmalı?',
      where: 'Bu arada eşyalarımızı nerede tutabiliriz?',
      purpose: 'Sebebi ne, ve sadece geçici mi?'
    },
    given: { what: 'Ne kastedildiği belli: bodrumdaki kendi eşyaların.', who: 'Bütün sakinlerden isteniyor.' },
    replies: {
      clear: 'Haber verdiğiniz için teşekkürler. Ne zamana kadar, hangi sebeple, ve bu arada eşyalarımızı koyabileceğimiz bir yer var mı?',
      vague: 'Tamam.',
      rude: 'Hiçbir şey taşımıyorum. Başka bir çözüm bulun.'
    }
  },
  'board-report': {
    context: 'Yöneticin çarşamba günü yazıyor. Geçen hafta sana çeyrek raporunun yönetim kuruluna gideceğini ve en fazla iki sayfa olması gerektiğini söylemişti.',
    text: 'Lütfen raporu cumaya kadar bana gönder.',
    ask: {
      format: 'Düzenlenebilir bir dosya mı istiyorsun, PDF mi?',
      criterion: 'Tamam sayılması için hangi rakamları veya bölümleri içermeli?'
    },
    given: {
      what: 'Hangi rapor olduğu belli: çeyrek raporu.',
      when: 'Son tarih belli: cuma.',
      audience: 'Daha önce söylendi: rapor yönetim kuruluna gidiyor.',
      scope: 'Daha önce söylendi: en fazla iki sayfa.'
    },
    replies: {
      clear: 'Tamam. Hangi bölümler mutlaka olmalı, ve düzenlenebilir dosya mı istersin, PDF mi?',
      vague: 'Tabii, cumaya kadar.',
      redundant: 'Kimin için, ne uzunlukta, ve hangi rapordan bahsediyorsun?'
    }
  },
  'school-pickup': {
    context: 'Kız kardeşin sana yazıyor. İki çocuğunun okulu her gün 15.00’te bitiyor; salıları büyük olanın 17.00’ye kadar futbol antrenmanı var.',
    text: 'Salı günü çocukları okuldan alabilir misin?',
    ask: {
      where: 'Sonra onları nereye götüreyim: senin eve mi, benim eve mi?',
      scope: 'İkisini de mi, yoksa büyüğün futbolu olduğu için sadece küçüğü mü?'
    },
    given: { when: 'Durumdan belli: okul 15.00’te bitiyor.', who: 'Doğrudan senden isteniyor.' },
    replies: {
      clear: 'Evet, alabilirim. İkisini de mi, sadece küçüğü mü? Ve sizin eve mi götüreyim, bizim eve mi?',
      vague: 'Evet, tabii.',
      redundant: 'Okul saat kaçta bitiyor, ve hangi gün?'
    }
  },
  'checkout-bug': {
    context: 'Bir ürün yöneticisi, ekibin hata takip sisteminde “2.3 güncellemesinden beri telefonlarda ödeme düğmesi çalışmıyor” başlıklı bir kayda yorum yazıyor.',
    text: 'Acil, lütfen en kısa sürede düzeltin.',
    ask: {
      who: 'Ekipte bunu kim üstlenecek?',
      criterion: 'Kaydı kapatmadan önce hangi telefonlarda ve tarayıcılarda çalışması gerekiyor?'
    },
    given: {
      what: 'Kaydın başlığı sorunu söylüyor.',
      where: 'Başlık nerede olduğunu söylüyor: telefonlarda.',
      priority: '“Acil” önceliği açıkça belirtiyor.'
    },
    replies: {
      clear: 'Hemen bakıyoruz. Kim üstleniyor? Ve kaydı kapatmadan önce hangi telefon ve tarayıcıları test etmeliyiz?',
      vague: 'Bakacağız.',
      redundant: 'Tam olarak ne bozuk, ve acil mi?'
    }
  },
  'client-room': {
    context: 'İş arkadaşın Ana sana yazıyor. Gelecek hafta onu iki müşteri ziyaret edecek; sadece üçü olacaklar.',
    text: 'Gelecek hafta için bana bir toplantı odası ayırabilir misin?',
    ask: {
      when: 'Hangi gün, saat kaçta ve ne kadar süreyle?',
      format: 'Ekran ya da video konferans donanımı gerekiyor mu?'
    },
    given: {
      what: 'Görev belli: bir toplantı odası ayırtmak.',
      who: 'Odayı senin ayırtman isteniyor.',
      scope: 'Durumdan belli: üç kişi.'
    },
    replies: {
      clear: 'Tabii. Hangi gün ve saat, ne kadar süre, ve ekran lazım mı?',
      vague: 'Tamam, bir yer ayarlarım.',
      redundant: 'Kaç kişi gelecek, ve odayı ne için kullanacaksın?'
    }
  },
  'newsletter': {
    context: 'Spor kulübünün bülten editörü sana yazıyor. Bülten her ayın ilk pazartesi günü bütün üyelere gidiyor; her yazı yaklaşık 200 kelime.',
    text: 'Yeni antrenman saatleri hakkında bir şey yazabilir misin?',
    ask: {
      what: 'Yeni programın tamamını mı yazayım, yoksa sadece değişenleri mi?',
      when: 'Metnim ne zamana lazım? Bültenin çıkış tarihi benim teslim tarihim değil.'
    },
    given: { audience: 'Durumdan belli: bütün kulüp üyeleri.', scope: 'Durumdan belli: yaklaşık 200 kelime.' },
    replies: {
      clear: 'Memnuniyetle. Ne zamana lazım, ve programın tamamını mı yazayım, sadece değişiklikleri mi?',
      vague: 'Tabii, bir şeyler yazarım.',
      redundant: 'Bülteni kim okuyor, ve metin ne uzunlukta olmalı?'
    }
  },
  'airport': {
    context: 'Kuzenin uçuş bilgilerini gönderiyor: cumartesi saat 14.20’de iniş, 2 numaralı terminal. Bir hafta sende kalacak.',
    text: 'Beni karşılayabilir misin?',
    ask: { scope: 'Yalnız mı geliyorsun, ne kadar bagajın var? Küçük bir arabaya sığar mı?' },
    given: {
      when: 'Uçuş bilgilerinden belli: cumartesi 14.20.',
      where: 'Uçuş bilgilerinden belli: 2 numaralı terminal.',
      purpose: 'Durumdan belli: sende kalacak, yani nereye gidileceği açık.'
    },
    replies: {
      clear: 'Tabii ki! Yalnız mı geliyorsun, ne kadar bagajın var?',
      vague: 'Evet, görüşürüz.',
      redundant: 'Ne zaman iniyorsun, hangi terminale?'
    }
  },
  'contract-check': {
    context: 'Satın alma biriminden bir iş arkadaşın 30 sayfalık bir tedarikçi sözleşmesini e-postayla gönderiyor. Konu: “Lütfen 7. maddeyi (sorumluluk) perşembe öğlene kadar kontrol et”.',
    text: 'Bir göz atar mısın?',
    ask: {
      format: 'Geri bildirimimi nasıl istersin: belgede yorum olarak mı, kısa bir e-postayla mı?',
      criterion: 'Neye dikkat edeyim: risklere mi, belirsiz ifadelere mi, tutarlara mı?'
    },
    given: { what: 'Konu satırı bölümü söylüyor: 7. madde.', when: 'Konu satırı süreyi söylüyor: perşembe öğlen.' },
    replies: {
      clear: 'Perşembe öğlene kadar bakarım. 7. maddede neye odaklanayım, ve dosyada yorum mu istersin, kısa bir özet mi?',
      vague: 'Bakarım.',
      redundant: 'Hangi bölümü okuyayım, ve ne zamana kadar?'
    }
  },
  'shared-dinner': {
    context: 'Lina, dört arkadaşın grup sohbetine yazıyor. Bugün erken saatte herkes cumartesi saat 19.00’da onun evinde yemek için anlaştı.',
    text: 'Herkes bir şey getirebilir mi?',
    ask: {
      what: 'Her birimiz ne getirsin: başlangıç mı, tatlı mı, içecek mi?',
      criterion: 'Birinin yiyemediği ya da yemediği bir şey var mı?'
    },
    given: { when: 'Önceden anlaşıldı: cumartesi 19.00.', where: 'Önceden anlaşıldı: Lina’nın evinde.' },
    replies: {
      clear: 'Seve seve! Başlangıç, tatlı ve içecek diye paylaşalım mı? Ve birinin yiyemediği bir şey var mı?',
      vague: 'Tabii, bir şey getiririm.',
      redundant: 'Nerede buluşuyoruz, saat kaçta?'
    }
  }
};
