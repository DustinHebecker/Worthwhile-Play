import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'Niebieska paczka',
      story: 'Do sklepu na rogu przyszła paczka bez nadawcy. Musi pochodzić z jednego z magazynów, które dowożą na tę ulicę.',
      lead: 'Paczki na tej ulicy przychodzą z:',
      hyps: { north: 'Magazyn Północ', south: 'Magazyn Południe', east: 'Magazyn Wschód' },
      clues: {
        blue: { label: 'W niebieskim papierze', seen: 'Paczka jest owinięta niebieskim papierem.', notSeen: 'Paczka nie jest owinięta niebieskim papierem.' },
        'brown-tape': { label: 'Zaklejona brązową taśmą', seen: 'Jest zaklejona brązową taśmą.', notSeen: 'Nie jest zaklejona brązową taśmą.' },
        smudge: { label: 'Rozmazana etykieta', seen: 'Etykieta z adresem jest rozmazana.', notSeen: 'Etykieta z adresem jest czysta.' },
        string: { label: 'Przewiązana sznurkiem', seen: 'Jest przewiązana sznurkiem.', notSeen: 'Nie jest przewiązana sznurkiem.' },
        tuesday: { label: 'Przyszła we wtorek', seen: 'Przyszła we wtorek. Wszystkie magazyny dowożą w każdy dzień roboczy.', notSeen: 'Przyszła we wtorek. Wszystkie magazyny dowożą w każdy dzień roboczy.' },
        'echo-blue': { label: 'Sąsiadka też ją widziała', seen: 'Sąsiadka też mówi, że paczka była niebieska – widziała tę samą paczkę.', notSeen: 'Sąsiadka też mówi, że paczka była niebieska – widziała tę samą paczkę.' }
      }
    },
    'c-garden': {
      title: 'Nadgryzione truskawki',
      story: 'W nocy ktoś dobrał się do truskawek. W tym ogrodzie podjada je kilka rodzajów gości.',
      lead: 'W noce, gdy truskawki są nadgryzione, gościem jest:',
      hyps: { birds: 'Ptaki', snails: 'Ślimaki', hedgehog: 'Jeż' },
      clues: {
        slime: { label: 'Błyszczący ślad', seen: 'Na ścieżce jest błyszczący ślad.', notSeen: 'Nie ma błyszczącego śladu.' },
        pecks: { label: 'Małe dziobnięcia', seen: 'Owoce mają małe ślady dziobania.', notSeen: 'Nie ma śladów dziobania.' },
        droppings: { label: 'Odchody pod żywopłotem', seen: 'Pod żywopłotem są odchody.', notSeen: 'Pod żywopłotem nic nie ma.' },
        'net-moved': { label: 'Odsunięta siatka', seen: 'Siatka nad grządką jest odsunięta.', notSeen: 'Siatka wciąż jest na miejscu.' },
        rain: { label: 'W nocy padało', seen: 'W nocy padało – w deszczu wychodzą wszyscy.', notSeen: 'W nocy padało – w deszczu wychodzą wszyscy.' },
        'echo-slime': { label: 'Widziany znów rano', seen: 'Sąsiad pokazuje ci ten sam błyszczący ślad.', notSeen: 'Sąsiad pokazuje ci ten sam błyszczący ślad.' }
      }
    },
    'c-cups': {
      title: 'Pęknięty kubek',
      story: 'Klient zwraca kubek z cienkim pęknięciem. Wszystkie maszyny warsztatu robią ten sam kubek, ale każda ma swoje dziwactwa.',
      lead: 'Kubki warsztatu robi:',
      hyps: { a: 'Maszyna A', b: 'Maszyna B', c: 'Maszyna C' },
      clues: {
        crack: { label: 'Cienkie pęknięcie', seen: 'Kubek ma cienkie pęknięcie.', notSeen: 'Kubek ma cienkie pęknięcie.' },
        glaze: { label: 'Ciemniejsza glazura', seen: 'Glazura jest trochę ciemniejsza niż zwykle.', notSeen: 'Glazura wygląda zwyczajnie.' },
        stamp: { label: 'Wyraźny stempel na spodzie', seen: 'Stempel wytwórcy na spodzie jest wyraźny.', notSeen: 'Stempel na spodzie jest rozmazany.' },
        handle: { label: 'Ucho lekko przesunięte', seen: 'Ucho jest lekko przesunięte.', notSeen: 'Ucho jest prosto.' },
        box: { label: 'W szarym pudełku', seen: 'Przyszedł w zwykłym szarym pudełku — jak kubki ze wszystkich maszyn.', notSeen: 'Przyszedł w zwykłym szarym pudełku — jak kubki ze wszystkich maszyn.' }
      }
    },
    'c-key': {
      title: 'Zaginiony klucz',
      story: 'Zapasowy klucz znowu zniknął. Prawie zawsze leży w jednym z kilku tych samych miejsc.',
      lead: 'Gdy klucz znika, znajduje się:',
      hyps: { coat: 'W kurtce', car: 'W samochodzie', office: 'W biurze' },
      clues: {
        'search-coat': { label: 'Szybkie przeszukanie kurtki go znajduje', seen: 'Znajdujesz klucz w kurtce.', notSeen: 'Szybko sprawdzasz kieszenie kurtki: klucza nie ma. Szybkie szukanie może go przeoczyć.' },
        'search-car': { label: 'Szybki rzut oka do samochodu go znajduje', seen: 'Znajdujesz klucz w samochodzie.', notSeen: 'Szybko zaglądasz do samochodu: klucza nie ma. Szybki rzut oka może go przeoczyć.' },
        jingle: { label: 'Brzęk w przedpokoju', seen: 'Pamiętasz brzęk, gdy wieszano kurtkę.', notSeen: 'Nie pamiętasz żadnego brzęku.' },
        drove: { label: 'Wczoraj jechałeś samochodem', seen: 'Wczoraj jechałeś samochodem.', notSeen: 'Wczoraj nie jechałeś samochodem.' },
        'office-day': { label: 'Byłeś w biurze', seen: 'Wczoraj byłeś w biurze.', notSeen: 'Wczoraj pracowałeś z domu.' },
        weekday: { label: 'Jest dzień roboczy', seen: 'Dziś jest dzień roboczy — to nie zmienia tego, gdzie lądują klucze.', notSeen: 'Dziś jest dzień roboczy — to nie zmienia tego, gdzie lądują klucze.' }
      }
    },
    'c-coin': {
      title: 'Moneta z jarmarku',
      story: 'Znalazłeś starą monetę na jarmarcznym straganie z rekwizytami do sztuczek. Na oko nie da się jej odróżnić od zwykłej, więc nią rzucasz.',
      lead: 'Monety w pudełku starych monet na straganie to:',
      hyps: { ordinary: 'Zwykła moneta', weighted: 'Obciążona moneta', 'two-headed': 'Moneta z dwoma orłami' },
      clues: {
        toss1: { label: 'Orzeł w pierwszym rzucie', seen: 'Pierwszy rzut: orzeł.', notSeen: 'Pierwszy rzut: reszka.' },
        toss2: { label: 'Orzeł w drugim rzucie', seen: 'Drugi rzut: orzeł.', notSeen: 'Drugi rzut: reszka.' },
        toss3: { label: 'Orzeł w trzecim rzucie', seen: 'Trzeci rzut: orzeł.', notSeen: 'Trzeci rzut: reszka.' },
        toss4: { label: 'Orzeł w czwartym rzucie', seen: 'Czwarty rzut: orzeł.', notSeen: 'Czwarty rzut: reszka.' }
      }
    },
    'c-message': {
      title: 'Wiadomość „od klubu”',
      story: 'Wiadomość twierdzi, że przychodzi od twojego klubu sportowego, i prosi o potwierdzenie członkostwa.',
      lead: 'Wiadomości, które rzekomo przychodzą od klubu, to:',
      hyps: { real: 'Naprawdę od klubu', fake: 'Podróbka' },
      clues: {
        link: { label: 'Zawiera link', seen: 'Zawiera link.', notSeen: 'Nie zawiera linku.' },
        sender: { label: 'Nieznany adres nadawcy', seen: 'Adres nadawcy nie jest zwykłym adresem klubu.', notSeen: 'Adres nadawcy jest zwykły.' },
        hurry: { label: 'Popędza', seen: 'Pisze, że musisz odpowiedzieć dziś.', notSeen: 'Nie podaje terminu.' },
        'your-name': { label: 'Używa twojego imienia', seen: 'Zwraca się do ciebie po imieniu.', notSeen: 'Pisze tylko „Drogi członku”.' },
        evening: { label: 'Przyszła wieczorem', seen: 'Przyszła wieczorem — oba rodzaje przychodzą o każdej porze.', notSeen: 'Przyszła wieczorem — oba rodzaje przychodzą o każdej porze.' }
      }
    },
    'c-oven': {
      title: 'Przypalony chleb',
      story: 'Jeden bochenek z porannego wypieku jest przypalony z jednej strony. Piekarnia piecze w dwóch piecach.',
      lead: 'Chleby piecze się tu w:',
      hyps: { old: 'Starym piecu', new: 'Nowym piecu' },
      clues: {
        'burnt-side': { label: 'Przypalony z jednej strony', seen: 'Jest przypalony z jednej strony.', notSeen: 'Jest przypalony z jednej strony.' },
        'pale-top': { label: 'Blady wierzch', seen: 'Wierzch jest blady.', notSeen: 'Wierzch jest równo przyrumieniony.' },
        'tray-mark': { label: 'Wzór nowych blach', seen: 'Spód ma wzór nowych blach.', notSeen: 'Spód jest gładki.' },
        early: { label: 'Z pierwszego wypieku', seen: 'Pochodzi z pierwszego wypieku.', notSeen: 'Pochodzi z późniejszego wypieku.' },
        seeds: { label: 'Ziarna na wierzchu', seen: 'Ma ziarna na wierzchu — oba piece pieką chleb z ziarnami.', notSeen: 'Ma ziarna na wierzchu — oba piece pieką chleb z ziarnami.' }
      }
    },
    'c-beep': {
      title: 'Słaby pisk w radiu',
      story: 'Odbiornik klubu krótkofalowców złapał słaby, regularny pisk. Większość takich pisków to zakłócenia, ale nad głową przelatuje też mały satelita.',
      lead: 'Słabe regularne piski w tym odbiorniku to:',
      hyps: { satellite: 'Sygnał małego satelity', interference: 'Zwykłe zakłócenia' },
      clues: {
        'pass-time': { label: 'Podczas przelotu satelity', seen: 'Pojawił się, gdy satelita miał przelatywać nad nami.', notSeen: 'Pojawił się, gdy nie było przelotu.' },
        drift: { label: 'Ton powoli płynie', seen: 'Ton powoli płynie, jak u poruszającego się źródła.', notSeen: 'Ton jest stały.' },
        fades: { label: 'Cichnie po chwili', seen: 'Cichnie po mniej więcej dziesięciu minutach.', notSeen: 'Trwa bez przerwy.' },
        rhythm: { label: 'Równy rytm', seen: 'Piszczy w równym rytmie — oba tak robią.', notSeen: 'Piszczy w równym rytmie — oba tak robią.' },
        'other-receiver': { label: 'Drugi odbiornik go słyszy', seen: 'Członek klubu na drugim końcu miasta też go słyszy.', notSeen: 'Odbiornik na drugim końcu miasta nic nie słyszy.' }
      }
    },
    'c-rain': {
      title: 'Czy w nocy padało?',
      story: 'Nie było cię w nocy w domu i chcesz wiedzieć, czy sadzonki dostały deszcz, czy trzeba je teraz podlać.',
      lead: 'Noce o tej porze roku:',
      hyps: { rained: 'Padało', dry: 'Było sucho' },
      clues: {
        'wet-grass': { label: 'Mokra trawa', seen: 'Trawa jest mokra (rosa też ją moczy).', notSeen: 'Trawa jest sucha.' },
        gauge: { label: 'Woda w deszczomierzu', seen: 'W deszczomierzu jest woda.', notSeen: 'Deszczomierz jest pusty.' },
        puddle: { label: 'Kałuża przy furtce', seen: 'Przy furtce jest kałuża.', notSeen: 'Przy furtce nie ma kałuży.' },
        'snails-out': { label: 'Ślimaki na ścieżce', seen: 'Na ścieżkę wyszły ślimaki.', notSeen: 'Na ścieżce nie ma ślimaków.' },
        wind: { label: 'Liście na stole', seen: 'Na stół nawiało liści – wiało tak czy inaczej.', notSeen: 'Na stół nawiało liści – wiało tak czy inaczej.' }
      }
    },
    'c-bird': {
      title: 'Jaki ptak był przy karmniku?',
      story: 'Tylko przez chwilę widziałeś małego brązowego ptaka przy karmniku, zanim odleciał. Udziały są tu wymyślone dla tego karmnika; prawdziwe zależą od miejsca.',
      lead: 'Mali brązowi goście tego karmnika to:',
      hyps: { finch: 'Zięba', sparrow: 'Wróbel' },
      clues: {
        'red-patch': { label: 'Błysk czerwieni', seen: 'Widziałeś błysk czerwieni na jego głowie.', notSeen: 'Nie widziałeś nic czerwonego.' },
        ground: { label: 'Jadł na ziemi', seen: 'Jadł na ziemi pod karmnikiem.', notSeen: 'Jadł w samym karmniku.' },
        song: { label: 'Świergotliwy śpiew', seen: 'Zaśpiewał świergotliwie.', notSeen: 'Tylko ćwierkał.' },
        group: { label: 'Przyleciał w grupie', seen: 'Przyleciał z małą grupką.', notSeen: 'Przyleciał sam.' },
        morning: { label: 'Rano', seen: 'Był wczesny ranek – o tej porze przylatują oba.', notSeen: 'Był wczesny ranek – o tej porze przylatują oba.' }
      }
    },
    'c-plant': {
      title: 'Oklapnięta roślina doniczkowa',
      story: 'Roślina w biurze oklapła i ma żółte liście. W tym biurze zwykle chodzi o jedną z dwóch rzeczy.',
      lead: 'Gdy rośliny tutaj oklapną, przyczyną jest:',
      hyps: { water: 'Za dużo wody', light: 'Za mało światła' },
      clues: {
        'wet-soil': { label: 'Mokra ziemia', seen: 'Ziemia jest wciąż mokra dwa dni po podlaniu.', notSeen: 'Ziemia jest sucha.' },
        leaning: { label: 'Pochyla się do okna', seen: 'Pochyla się w stronę okna.', notSeen: 'Stoi prosto.' },
        'soft-stem': { label: 'Miękka nasada łodygi', seen: 'Nasada łodygi jest miękka.', notSeen: 'Łodyga jest twarda.' },
        'pale-new': { label: 'Blade nowe liście', seen: 'Nowe liście są blade i małe.', notSeen: 'Nowe liście wyglądają zdrowo.' },
        'pot-colour': { label: 'Niebieska doniczka', seen: 'Stoi w niebieskiej doniczce – to niczego nie zmienia.', notSeen: 'Stoi w niebieskiej doniczce – to niczego nie zmienia.' }
      }
    },
    'c-bus': {
      title: 'Dlaczego autobus się spóźnił?',
      story: 'Twój autobus spóźnił się dziś rano czterdzieści minut.',
      lead: 'Gdy ten autobus bardzo się spóźnia, przyczyną jest:',
      hyps: { jam: 'Korek', breakdown: 'Awaria' },
      clues: {
        'others-late': { label: 'Inne autobusy też spóźnione', seen: 'Inne autobusy na tej samej drodze też się spóźniły.', notSeen: 'Inne autobusy na drodze były punktualne.' },
        replacement: { label: 'Przyjechał inny autobus', seen: 'Przyjechał inny autobus niż zwykle.', notSeen: 'Przyjechał zwykły autobus.' },
        announcement: { label: 'Komunikat', seen: 'Tablica podawała: opóźnienie z powodu usterki technicznej.', notSeen: 'Tablica nie podała powodu.' },
        'rush-hour': { label: 'W godzinach szczytu', seen: 'Były godziny szczytu.', notSeen: 'Była spokojna pora dnia.' },
        rain: { label: 'Padał deszcz', seen: 'Padał deszcz – na tym przystanku nie ma to znaczenia.', notSeen: 'Padał deszcz – na tym przystanku nie ma to znaczenia.' }
      }
    }
  },
checks: {
    'k-picnic': {
      title: 'Na zewnątrz czy w sali?',
      story: 'Sąsiedzki piknik jest dziś po południu. Możesz zrobić go na trawniku albo wynająć salę osiedlową.',
      lead: 'Popołudnia o tej porze roku są:',
      hyps: { dry: 'Suche', rain: 'Deszczowe' },
      question: 'Jak prawdopodobne jest suche popołudnie?',
      options: { outdoors: 'Piknik na trawniku', hall: 'Wynająć salę', tent: 'Rozstawić namiot na trawniku' },
      checks: {
        sky: { label: 'Spojrzeć w niebo w południe', yes: 'Ciemne chmury do południa.', no: 'Brak ciemnych chmur do południa.' },
        barometer: { label: 'Spojrzeć na barometr', yes: 'Barometr spada.', no: 'Barometr stoi.' },
        farmer: { label: 'Zapytać rolnika z sąsiedztwa', yes: 'Rolnik spodziewa się deszczu.', no: 'Rolnik spodziewa się suchego popołudnia.' },
        service: { label: 'Zadzwonić do służby pogodowej', yes: 'Służba pogodowa ostrzega przed deszczem.', no: 'Służba pogodowa nie wydaje ostrzeżenia.' },
        swallows: { label: 'Obserwować jaskółki', yes: 'Jaskółki latają nisko.', no: 'Jaskółki latają wysoko.' }
      }
    },
    'k-bike': {
      title: 'Kupić używany rower?',
      story: 'Używany rower jest na sprzedaż w dobrej cenie. Takie rowery są zwykle w porządku, ale niektóre mają ukryte uszkodzenia.',
      lead: 'Używane rowery takie jak ten są:',
      hyps: { sound: 'W porządku', damaged: 'Z ukrytym uszkodzeniem' },
      question: 'Jak prawdopodobne jest, że rower jest w porządku?',
      options: { buy: 'Kupić', skip: 'Zostawić', 'offer-less': 'Zaproponować mniej i zaryzykować' },
      checks: {
        ride: { label: 'Zrobić jazdę próbną', yes: 'Jazda próbna jest płynna.', no: 'Jazda próbna jest nierówna.' },
        chain: { label: 'Obejrzeć łańcuch', yes: 'Łańcuch jest zardzewiały.', no: 'Łańcuch jest czysty.' },
        receipts: { label: 'Zapytać o rachunki za naprawy', yes: 'Sprzedawca ma rachunki za naprawy.', no: 'Sprzedawca nie ma rachunków.' },
        mechanic: { label: 'Zapłacić mechanikowi za oględziny', yes: 'Mechanik znajduje problem.', no: 'Mechanik niczego nie znajduje.' },
        'seller-says': { label: 'Zapytać sprzedawcę', yes: 'Sprzedawca mówi, że jest w porządku.', no: 'Sprzedawca nie jest pewien.' }
      }
    },
    'k-seeds': {
      title: 'Wysiać stare nasiona?',
      story: 'W szopie znalazła się zapomniana torebka nasion. Wysiew zajmie weekend; świeże nasiona trochę kosztują.',
      lead: 'Zapomniane torebki takie jak ta są:',
      hyps: { good: 'Wciąż dobre', dead: 'Prawie martwe' },
      question: 'Jak prawdopodobne jest, że nasiona są wciąż dobre?',
      options: { sow: 'Wysiać stare nasiona', fresh: 'Kupić świeże nasiona' },
      checks: {
        float: { label: 'Wrzucić kilka do wody', yes: 'Większość nasion tonie.', no: 'Większość nasion pływa.' },
        sprout: { label: 'Wypróbować kilka na wilgotnej ściereczce', yes: 'Większość kiełkuje.', no: 'Kiełkuje niewiele.' },
        date: { label: 'Przeczytać datę na torebce', yes: 'Data jest niedawna.', no: 'Data jest stara.' },
        shrivelled: { label: 'Obejrzeć nasiona z bliska', yes: 'Nasiona wyglądają na pomarszczone.', no: 'Nasiona wyglądają na pełne.' },
        smell: { label: 'Powąchać je', yes: 'Pachną świeżo.', no: 'Pachną stęchlizną.' }
      }
    },
    'k-melon': {
      title: 'Kupić tego melona?',
      story: 'Na targu został jeden melon w dobrej cenie.',
      lead: 'Melony, które zostają o tej porze na tym straganie, są:',
      hyps: { ripe: 'Dojrzałe', unripe: 'Jeszcze niedojrzałe' },
      question: 'Jak prawdopodobne jest, że melon jest dojrzały?',
      options: { buy: 'Kupić', leave: 'Zostawić' },
      checks: {
        knock: { label: 'Zastukać w niego', yes: 'Brzmi głucho i pusto.', no: 'Brzmi tępo.' },
        smell: { label: 'Powąchać go', yes: 'Pachnie słodko.', no: 'Prawie niczym nie pachnie.' },
        'soft-end': { label: 'Nacisnąć koniec', yes: 'Koniec lekko się ugina.', no: 'Koniec jest twardy.' },
        taste: { label: 'Spróbować plasterka z tej samej skrzynki', yes: 'Plasterek jest słodki.', no: 'Plasterek jest mdły.' },
        sticker: { label: 'Przeczytać naklejkę', yes: 'Ma naklejkę „dojrzały”.', no: 'Nie ma naklejki.' }
      }
    },
    'k-bread': {
      title: 'Upiec więcej na targ?',
      story: 'Jutro jest dzień targowy. Dodatkowy chleb dobrze się sprzedaje w tłoczny dzień, ale czerstwieje w spokojny.',
      lead: 'Dni targowe tutaj są:',
      hyps: { busy: 'Tłoczne', quiet: 'Spokojne' },
      question: 'Jak prawdopodobny jest tłoczny dzień targowy?',
      options: { extra: 'Upiec dużo więcej', normal: 'Upiec zwykłą ilość', 'little-extra': 'Upiec trochę więcej' },
      checks: {
        calendar: { label: 'Sprawdzić kalendarz miasta', yes: 'Kalendarz podaje wydarzenie.', no: 'Kalendarz nic nie podaje.' },
        neighbour: { label: 'Zapytać stoisko z serami', yes: 'Stoisko z serami spodziewa się tłumu.', no: 'Stoisko z serami spodziewa się spokojnego dnia.' },
        sunny: { label: 'Przeczytać prognozę', yes: 'Zapowiadają słońce.', no: 'Zapowiadają chmury.' },
        office: { label: 'Zadzwonić do biura targowego', yes: 'Biuro targowe spodziewa się wielu gości.', no: 'Biuro targowe spodziewa się zwykłego dnia.' },
        'last-week': { label: 'Pomyśleć o zeszłym tygodniu', yes: 'W zeszłym tygodniu był tłok.', no: 'W zeszłym tygodniu było spokojnie.' }
      }
    },
    'k-laptop': {
      title: 'Naprawić samemu?',
      story: 'Laptop wyłącza się losowo. Naprawa w domu jest tania, jeśli usterka jest drobna, ale to stracony wysiłek, jeśli jest poważna.',
      lead: 'Usterki takie jak ta są:',
      hyps: { minor: 'Drobna usterka', major: 'Poważna usterka' },
      question: 'Jak prawdopodobna jest drobna usterka?',
      options: { repair: 'Naprawić w domu', shop: 'Oddać do serwisu', wait: 'Poczekać i obserwować' },
      checks: {
        'error-code': { label: 'Uruchomić ponownie i patrzeć', yes: 'Pojawia się kod błędu.', no: 'Nie pojawia się kod błędu.' },
        diagnostics: { label: 'Uruchomić program diagnostyczny', yes: 'Program zgłasza usterkę.', no: 'Program nic nie zgłasza.' },
        cable: { label: 'Wymienić kabel zasilający', yes: 'Z innym kablem działa.', no: 'Nadal się wyłącza.' },
        fan: { label: 'Posłuchać wentylatora', yes: 'Wentylator wydaje zgrzyt.', no: 'Wentylator brzmi normalnie.' },
        forum: { label: 'Poczytać forum', yes: 'Inni z tym modelem piszą, że to było coś drobnego.', no: 'Inni z tym modelem podają różne przyczyny.' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: 'Czujnik latarni',
      story: 'Miasto sprawdza stare latarnie czujnikiem. Spośród wszystkich latarni {f} jest naprawdę zepsutych. Czujnik wskazuje {s} zepsutych latarni, ale przez pomyłkę wskazuje też {q} sprawnych. Właśnie wskazano latarnię {lamp}.',
      questions: { q1: 'Czy latarnia {lamp} jest raczej zepsuta, czy raczej sprawna?', q2: 'Jak prawdopodobne jest, że latarnia {lamp} jest zepsuta?' },
      options: { faulty: 'Raczej zepsuta', working: 'Raczej sprawna' },
      explain: 'Policz wskazane latarnie: {k} z {n} wskazanych jest naprawdę zepsutych, więc prawdopodobieństwo wynosi {p}. To, czy można ufać wskazaniu, zależy od tego, jak rzadkie są zepsute latarnie, a nie tylko od jakości czujnika.',
      labels: { faulty: 'Zepsute latarnie', working: 'Sprawne latarnie', fit: 'wskazane' }
    },
    't-wheel': {
      title: 'Koło',
      story: 'Uczciwe koło ma {k} równych pól, a {r} z nich pokazuje gwiazdkę. Ostatnie {s} obroty ominęły gwiazdkę.',
      questions: { q1: 'Przy następnym obrocie gwiazdka jest…', q2: 'Jak prawdopodobna jest gwiazdka przy następnym obrocie?' },
      options: { more: 'bardziej prawdopodobna niż zwykle', less: 'mniej prawdopodobna niż zwykle', same: 'tak samo prawdopodobna jak zawsze' },
      explain: 'Koło nie ma pamięci: każdy obrót zaczyna się od nowa, więc gwiazdka nadal wypada w {p} przypadków.',
      labels: { spins: 'Nieudane obroty i następny' }
    },
    't-sequence': {
      title: 'Który wynik jest bardziej prawdopodobny?',
      story: 'Uczciwą monetą rzuca się {n} razy (● orzeł, ○ reszka). Dwa możliwe wyniki: A {a} i B {b}.',
      questions: { q1: 'Który dokładny wynik jest bardziej prawdopodobny?', q2: 'Jak prawdopodobny jest dokładnie wynik B?' },
      options: { a: 'A', b: 'B', same: 'Oba są równie prawdopodobne' },
      explain: 'Możliwych wyników jest {total}, a każdy dokładny ma takie samo prawdopodobieństwo, {p}. B wydaje się tylko bardziej typowy, bo wyniki mieszane jako grupa zdarzają się często.',
      labels: { a: 'A', b: 'B' }
    },
    't-conjunction': {
      title: 'Deszcz i wiatr',
      story: 'Prognoza na jutro daje deszczowi szansę {a}. Tutaj w deszczowe dni wieje w {b} przypadków, a w suche w {w} przypadków.',
      questions: { q1: 'Co jest jutro bardziej prawdopodobne?', q2: 'Jak prawdopodobny jest dzień deszczowy i wietrzny?' },
      options: { windy: 'Wietrzny dzień', both: 'Deszczowy i wietrzny dzień', same: 'Tak samo' },
      explain: 'Wyobraź sobie {days} dni takich jak jutro: {both} jest deszczowych i wietrznych, ale wietrznych jest razem {windy}. Każdy deszczowy i wietrzny dzień jest też wietrzny, więc „deszczowy i wietrzny” nigdy nie może być bardziej prawdopodobny niż „wietrzny”.',
      labels: { windy: 'Wietrznie', calm: 'Bezwietrznie', rainy: 'Dni deszczowe', dry: 'Dni suche' }
    },
    't-simpson': {
      title: 'Dwie firmy kurierskie',
      story: 'Dwie firmy kurierskie podają, jak często w zeszłym miesiącu były punktualne. Firma A: krótkie trasy {aSk} z {aSn}, długie trasy {aLk} z {aLn}. Firma B: krótkie trasy {bSk} z {bSn}, długie trasy {bLk} z {bLn}.',
      questions: { q1: 'Która firma była ogólnie częściej punktualna?', q2: 'Twoja paczka jedzie długą trasą. Która firma ma lepszy wynik na długich trasach?' },
      options: { a: 'Firma A', b: 'Firma B', same: 'Tak samo' },
      explain: 'A jest lepsza i na krótkich, i na długich trasach, a jednak B jest lepsza ogólnie ({b} wobec {a} punktualnych dostaw), bo B jeździ głównie łatwiejszymi krótkimi trasami. Porównuj porównywalne.',
      labels: { a: 'Firma A', b: 'Firma B', short: 'Krótkie trasy', long: 'Długie trasy', overall: 'Ogólnie' }
    },
    't-paw': {
      title: 'Ślad łapy w mące',
      story: 'W nocy ktoś przeszedł po mące na podłodze piekarni. Ślad łapy pasuje do kota sąsiadów. Tylko {r} kotów ma taki ślad. Około {n} kotów mieszka dość blisko, by wejść.',
      questions: { q1: 'Czy „tylko {r}” znaczy, że to prawie na pewno kot sąsiadów?', q2: 'Jak prawdopodobne jest, że to był kot sąsiadów? Przyjmij, że każdy pobliski kot mógł wejść z równym prawdopodobieństwem.' },
      options: { yes: 'Tak, na około {sure}', no: 'Nie, z dużo mniejszą pewnością' },
      explain: 'Wśród {n} pobliskich kotów około {others} innych też ma pasujący ślad. Kot sąsiadów to tylko jeden z kilku pasujących: {p}.',
      labels: { neighbour: 'Noce, gdy wszedł kot sąsiadów', others: 'Noce, gdy wszedł inny kot', fit: 'ślad pasuje' }
    },
    't-bakery': {
      title: 'Mała i duża piekarnia',
      story: 'Dwie piekarnie sprzedają chleb żytni i pszenny. Średnio połowa sprzedanych bochenków to żytnie, a każdy bochenek to osobny wybór. Mała piekarnia sprzedaje {n1} bochenków dziennie, duża {n2}.',
      questions: { q1: 'Która piekarnia ma więcej dni, w których ponad {t} sprzedanych bochenków to żytnie?', q2: 'W jakiej części dni mała piekarnia sprzedaje ponad {t} żytniego?' },
      options: { small: 'Mała piekarnia', large: 'Duża piekarnia', same: 'Mniej więcej tak samo' },
      explain: 'Małe próbki wahają się bardziej. Mała piekarnia ma takie dni w {small} przypadków, duża tylko w {large}.',
      labels: { small: 'Mała piekarnia', large: 'Duża piekarnia' }
    },
    't-drawers': {
      title: 'Woźny, który wie',
      story: 'W jednej z {n} zamkniętych szuflad leży klucz. Wskazujesz jedną szufladę. Woźny, który wie, gdzie jest klucz, otwiera wtedy {opened} pozostałych szuflad, wszystkie puste, i zostawia zamkniętą dokładnie jeszcze jedną. Zawsze tak robi i nigdy nie otwiera twojej.',
      questions: { q1: 'Zostać przy swojej szufladzie czy zamienić na drugą zamkniętą?', q2: 'Jak prawdopodobne jest, że klucz jest w drugiej zamkniętej szufladzie?' },
      options: { switch: 'Zamienić', keep: 'Zostać przy swojej', same: 'Bez różnicy' },
      explain: 'Wyobraź sobie {total} gier. Pierwszy wybór trafia tylko w części z nich. W pozostałych {wins} woźny musi zostawić zamkniętą szufladę z kluczem, więc zamiana wygrywa: {p}.',
      labels: { right: 'Gry, w których pierwszy wybór ma klucz', wrong: 'Gry, w których nie ma', fit: 'zamiana wygrywa' }
    },
    't-week': {
      title: 'Przynajmniej jeden deszczowy dzień',
      story: 'Planujesz wyjazd na {m} dni. Każdego dnia szansa na deszcz wynosi {q}, niezależnie od innych dni.',
      questions: { q1: 'Jak prawdopodobny jest przynajmniej jeden deszczowy dzień?' },
      options: {},
      explain: 'Dodanie szans dałoby {sum}, a to nie może być prawda. Pomnóż raczej szanse suchego dnia: zupełny brak deszczu ma szansę {none}, więc przynajmniej jeden deszczowy dzień ma {p}.',
      labels: { step: 'Nadal sucho po dniu {n}' }
    },
    't-numbers': {
      title: 'Ta sama liczba dwa razy',
      story: 'Każda z {g} osób potajemnie i losowo wybiera liczbę całkowitą od jednego do {r}.',
      questions: { q1: 'Jak prawdopodobne jest, że co najmniej dwie osoby wybiorą tę samą liczbę? Najpierw intuicja:', q2: 'Teraz ocena: jak prawdopodobna jest co najmniej jedna wspólna liczba?' },
      options: { low: 'Mniej niż jeden do czterech', even: 'Mniej więcej pół na pół', high: 'Więcej niż trzy do czterech' },
      explain: 'Przy {g} osobach jest {pairs} par, które mogą się zgadzać, więc zgodność pojawia się szybciej, niż się wydaje: {p}.',
      labels: { step: 'Wszystkie różne wśród pierwszych {n}' }
    },
    't-tyres': {
      title: 'O połowę mniej przebitych opon',
      story: 'Nowy rodzaj opon zmniejsza liczbę przebić z {b} do {a} na każde sto przejazdów. Producent nazywa to „o {rel} mniej przebić”.',
      questions: { q1: 'O ile mniej przebić na {rides} przejazdów?' },
      options: {},
      explain: 'Na {rides} przejazdów było {old} przebić przed i {new} po: o {fewer} mniej. „O {rel} mniej” brzmi imponująco; to, co odczuwasz, to zmiana bezwzględna.',
      labels: { old: 'Stare opony', new: 'Nowe opony', fit: 'przebicia' }
    },
    't-dice': {
      title: 'Dwie kostki',
      story: 'Rzucasz dwiema zwykłymi kostkami i dodajesz oczka.',
      questions: { q1: 'Która suma jest bardziej prawdopodobna: {s1} czy {s2}?', q2: 'Jak prawdopodobna jest suma {s1}?' },
      options: { first: '{s1}', second: '{s2}', same: 'Równie prawdopodobne' },
      explain: 'Z trzydziestu sześciu równie prawdopodobnych wyników {c1} daje sumę {s1}, a {c2} sumę {s2}.',
      labels: {}
    }
  }
};
