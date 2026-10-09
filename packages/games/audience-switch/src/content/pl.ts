import type { ContentText } from './types';

export const content: ContentText = {
  migration: {
    title: 'Migracja bazy danych',
    situation: 'Twój zespół przenosi bazę danych klientów do nowego systemu. Testy wykryły problem i przełączenie się opóźni. Wyjaśnij to.',
    facts: {
      newDate: 'Przełączenie przesuwa się o dwa dni: czwartek zamiast wtorku.',
      cause: 'Testy wykryły nieznany dotąd błąd ze znakami specjalnymi, takimi jak ü lub é.',
      noLoss: 'Żadne dane nie zostały utracone.',
      encoding: 'Skrypt importu odczytuje tekst w niewłaściwym kodowaniu znaków.',
      apology: 'Przepraszamy za utrudnienia.',
      regression: 'Nowy test automatyczny sprawdza teraz znaki specjalne.',
      buffer: 'Dwa dni mieszczą się w zapasie czasu projektu, bez dodatkowych kosztów.',
      library: 'Błędna konwersja pochodzi z biblioteki wybranej wiele lat temu.'
    },
    reasons: {
      'developer.cause': 'Programiści muszą wiedzieć, co faktycznie wykryły testy.',
      'developer.encoding': 'To jest pierwotna przyczyna, nad którą będą pracować.',
      'developer.apology': 'Przeprosiny dla klientów nie pomogą koleżance naprawić błędu.',
      'developer.regression': 'Muszą wiedzieć, że błąd jest teraz objęty testem.',
      'developer.buffer': 'Zapas czasu i budżet to sprawa kierowniczki projektu.',
      'projectManager.newDate': 'Kierowniczka projektu planuje według nowej daty.',
      'projectManager.noLoss': 'Utrata danych całkowicie zmieniłaby ryzyko, więc musi usłyszeć, że jej nie ma.',
      'projectManager.encoding': 'Szczegół o kodowaniu nie zmienia żadnej decyzji planistycznej.',
      'projectManager.apology': 'Przeprosiny są dla klientów; kierowniczka projektu potrzebuje faktów.',
      'projectManager.buffer': 'Czy harmonogram i budżet się utrzymają, to właśnie jej pytanie.',
      'projectManager.library': 'To, kto lata temu wybrał bibliotekę, nie pomaga teraz w planowaniu.',
      'customer.newDate': 'Klient potrzebuje nowej daty, a nie rodzaju błędu.',
      'customer.noLoss': 'Jego pierwsze zmartwienie to jego dane, a te są bezpieczne.',
      'customer.cause': 'Szczegóły błędu niepokoją klientów, nic im nie dając.',
      'customer.encoding': 'Techniczne szczegóły wewnętrzne nic klientowi nie mówią.',
      'customer.regression': 'Wewnętrzne testy nie są sprawą klienta.',
      'customer.buffer': 'Wewnętrzne zapasy i koszty nie dotyczą klienta.',
      'customer.library': 'Zrzucanie winy na starą bibliotekę brzmi jak wymówka.'
    },
    messages: {
      'developer.fit': 'Dla informacji: skrypt importu czyta tekst w złym kodowaniu, więc znaki specjalne, takie jak ü i é, się psują. Test regresyjny już to obejmuje; przełączenie przesuwa się na czwartek.',
      'developer.missing': 'Małe opóźnienie migracji, nic poważnego. Szczegóły później.',
      'developer.condescending': 'Znaki specjalne to litery takie jak ü, których nie ma w podstawowym alfabecie. Komputery zapisują litery jako liczby, a czasem te liczby się mieszają.',
      'projectManager.fit': 'Migracja przesuwa się z wtorku na czwartek. Żadne dane nie zostały utracone, a dwa dni mieszczą się w naszym zapasie bez dodatkowych kosztów. Przyczyna: błąd ze znakami specjalnymi, teraz objęty testem.',
      'projectManager.tooMuch': 'Skrypt importu dekoduje dane wejściowe jako Latin-1 zamiast UTF-8, więc znaki wielobajtowe się psują; łatamy czytnik i dodajemy test regresyjny.',
      'projectManager.missing': 'Znaleźliśmy błąd i nad nim pracujemy. Damy znać.',
      'customer.fit': 'Państwa dane są bezpieczne. Aby każde nazwisko i każdy adres zostały przeniesione poprawnie, przesuwamy przełączenie z wtorku na czwartek. Do tego czasu wszystko działa jak zwykle.',
      'customer.tooMuch': 'Nasz skrypt importu używał złego kodowania znaków, co uszkodziło znaki specjalne w przebiegach testowych, więc migracja potrzebuje dwóch dodatkowych dni z naszego zapasu.',
      'customer.condescending': 'Proszę się nie przejmować stroną techniczną, to skomplikowane. Wystarczy wiedzieć, że będzie trochę później.'
    }
  },
  skyBlue: {
    title: 'Dlaczego niebo jest niebieskie',
    situation: 'Ktoś pyta cię, dlaczego niebo jest niebieskie. Znasz fizykę, która za tym stoi. Wyjaśnij to.',
    facts: {
      sunlight: 'Światło słoneczne zawiera wszystkie kolory.',
      scatter: 'Powietrze rozprasza światło niebieskie znacznie silniej niż czerwone.',
      rayleigh: 'To rozpraszanie Rayleigha rośnie z czwartą potęgą częstotliwości (1/λ⁴).',
      sunset: 'O zachodzie słońca światło przechodzi przez więcej powietrza, więc niebo robi się czerwone i pomarańczowe.',
      everywhere: 'Rozproszone niebieskie światło dociera do oczu ze wszystkich kierunków, dlatego całe niebo wygląda na niebieskie.',
      violet: 'Fiolet rozprasza się jeszcze silniej, ale w świetle słonecznym jest go mniej, a nasze oczy są na niego mniej wrażliwe.',
      molecules: 'Rozpraszanie zachodzi na cząsteczkach azotu i tlenu, znacznie mniejszych niż długość fali światła.',
      ocean: 'Niebo jest niebieskie, bo odbija morze.'
    },
    reasons: {
      'child.sunlight': 'Dziecko potrzebuje najpierw zaskoczenia: białe światło słońca ukrywa wszystkie kolory.',
      'child.scatter': 'To główna myśl, powiedziana prostymi słowami.',
      'child.rayleigh': 'Przy wzorze dziecko od razu się wyłącza.',
      'child.everywhere': 'Wyjaśnia to, co widzi: niebieski, gdziekolwiek spojrzy.',
      'child.violet': 'Szczegół o fiolecie w tym wieku bardziej miesza, niż pomaga.',
      'child.molecules': 'Cząsteczki i długości fal są dla dziecka zbyt abstrakcyjne.',
      'layperson.sunlight': 'Bez tego „rozpraszanie niebieskiego światła” nie ma sensu.',
      'layperson.scatter': 'To właściwa odpowiedź, w codziennym języku.',
      'layperson.rayleigh': 'Wzór nie daje laikowi niczego, z czego mógłby skorzystać.',
      'expert.rayleigh': 'Ekspert oczekuje dokładnego mechanizmu i jego zależności od długości fali.',
      'expert.everywhere': 'Dla eksperta to oczywiste i tylko zabiera czas.',
      'expert.violet': 'Eksperci znają oczywisty zarzut „dlaczego nie fioletowe?” — odpowiedz na niego.',
      'expert.molecules': 'Nazwanie rozpraszaczy i stosunku rozmiarów czyni wyjaśnienie precyzyjnym.',
      ocean: 'To popularny mit; kolor nie pochodzi od morza.'
    },
    messages: {
      'child.fit': 'Światło słońca wygląda na białe, ale tak naprawdę są w nim zmieszane wszystkie kolory. Kiedy leci przez powietrze, niebieska część odbija się najwięcej na wszystkie strony, więc niebieski dociera do twoich oczu z całego nieba.',
      'child.tooMuch': 'Światło niebieskie ma krótszą długość fali, a rozpraszanie Rayleigha rośnie jak jeden przez długość fali do czwartej potęgi.',
      'child.missing': 'Niebo po prostu takie jest. Zawsze było niebieskie.',
      'layperson.fit': 'Światło słoneczne zawiera wszystkie kolory. Powietrze rozprasza niebieskie światło znacznie silniej niż czerwone, więc niebieskie światło dociera do nas z każdej części nieba.',
      'layperson.tooMuch': 'To rozpraszanie Rayleigha: natężenie skaluje się jak 1/λ⁴, więc w rozproszonym promieniowaniu nieba dominują krótkie fale.',
      'layperson.condescending': 'To trochę skomplikowane dla nienaukowców. Powiedzmy po prostu, że powietrze robi je niebieskim.',
      'expert.fit': 'Rozpraszanie Rayleigha na cząsteczkach N₂ i O₂, proporcjonalne do 1/λ⁴. Fiolet rozprasza się jeszcze silniej, ale w widmie słonecznym jest go mniej, a nasze czopki są na niego mniej czułe.',
      'expert.condescending': 'Wyobraź sobie światło słońca jako pudełko kredek! Powietrze najbardziej lubi bawić się niebieską kredką.',
      'expert.missing': 'Powietrze bardziej rozprasza niebieskie światło, i tyle.'
    }
  },
  clubRoof: {
    title: 'Dach klubu',
    situation: 'Dach siedziby waszego klubu sportowego wymaga pilnej naprawy, a koszt jest wyższy niż planowano. Wyjaśnij to.',
    facts: {
      cost: 'Naprawa kosztuje 8 000 euro, o 3 000 więcej niż w budżecie.',
      decision: 'Zarząd musi do piątku zdecydować, czy przesunąć 3 000 euro z budżetu letniego festynu.',
      storage: 'Magazyn sprzętu pozostaje zamknięty do czasu naprawy; reszta siedziby jest otwarta.',
      fees: 'Składki członkowskie się nie zmieniają.',
      schedule: 'Dekarz zaczyna 12 maja i potrzebuje czterech dni; parking będzie potrzebny na rusztowanie.',
      tiles: 'Nowe dachówki są betonowe w kolorze antracytu.',
      reserve: 'Gdyby zamiast tego użyć funduszu rezerwowego, spadłby poniżej wymaganego minimum.',
      volunteer: 'Jeden z członków zaproponował, że sam naprawi dach za darmo, ale nie jest dekarzem.'
    },
    reasons: {
      'executive.cost': 'Zarząd potrzebuje kwoty i wielkości przekroczenia, żeby to ocenić.',
      'executive.decision': 'To decyzja, którą musi podjąć, razem z terminem.',
      'executive.storage': 'Codzienne korzystanie z pomieszczeń to nie sprawa zarządu.',
      'executive.schedule': 'Dokładne dni prac to zadanie koordynatora.',
      'executive.tiles': 'Rodzaj i kolor dachówek nie wpływają na decyzję.',
      'executive.reserve': 'Wyjaśnia, dlaczego oczywista alternatywa nie wchodzi w grę.',
      'projectManager.fees': 'Składki nie mają nic wspólnego z organizacją naprawy.',
      'projectManager.schedule': 'Właśnie te terminy i parking organizuje koordynator.',
      'projectManager.reserve': 'O finansowaniu decyduje zarząd, nie koordynator.',
      'layperson.storage': 'Członkowie chcą wiedzieć, z czego mogą korzystać, a z czego nie.',
      'layperson.fees': 'Ich własne pieniądze to ich pierwsze pytanie.',
      'layperson.tiles': 'Szczegóły materiałów nie mają dla członków znaczenia.',
      'layperson.reserve': 'Zasady funduszu rezerwowego to wewnętrzne szczegóły finansowe.',
      volunteer: 'Oferta bez odpowiednich kwalifikacji wywołuje tylko jałową dyskusję; to nie jest prawdziwa opcja.'
    },
    messages: {
      'executive.fit': 'Potrzebna decyzja do piątku: naprawa dachu kosztuje 8 000 euro, o 3 000 więcej niż w budżecie. Proponujemy przesunąć 3 000 z budżetu letniego festynu, bo fundusz rezerwowy spadłby poniżej minimum.',
      'executive.tooMuch': 'Dekarz zaczyna 12 maja z betonowymi dachówkami w kolorze antracytu; rusztowanie stoi cztery dni na parkingu, a magazyn sprzętu do tego czasu jest zamknięty.',
      'executive.missing': 'Dach będzie droższy. Będziemy informować.',
      'projectManager.fit': 'Dekarz zaczyna 12 maja i potrzebuje czterech dni. Proszę zwolnić parking pod rusztowanie od 11 maja.',
      'projectManager.tooMuch': 'Naprawa kosztuje 8 000 euro, o 3 000 ponad budżet; zarząd może przesunąć pieniądze z festynu, bo rezerwa nie może spaść poniżej minimum, a składki pozostają bez zmian.',
      'projectManager.missing': 'Kiedyś w maju będą prace na dachu.',
      'layperson.fit': 'Dach siedziby zostanie naprawiony w maju. Do tego czasu magazyn sprzętu jest zamknięty; wszystko inne działa jak zwykle. Składki członkowskie się nie zmieniają.',
      'layperson.tooMuch': 'Naprawa kosztuje 8 000 euro, o 3 000 ponad budżet; zarząd rozważa przesunięcie z budżetu festynu, bo rezerwa nie może spaść poniżej minimum.',
      'layperson.condescending': 'Nie martwcie się dachem, sprawami dorosłych zajmie się zarząd.'
    }
  },
  shopOutage: {
    title: 'Awaria sklepu internetowego',
    situation: 'Sklep internetowy twojej firmy nie działał wczoraj przez trzy godziny. Wyjaśnij, co się stało.',
    facts: {
      duration: 'Sklep nie działał wczoraj wieczorem przez trzy godziny.',
      revenue: 'Przepadły zamówienia o wartości około 40 000 euro.',
      cause: 'Wygasły certyfikat bezpieczeństwa zablokował płatności.',
      fixed: 'Certyfikat został odnowiony; sklep znów działa normalnie.',
      renewal: 'Odnawianie zostanie zautomatyzowane z ostrzeżeniem dwa tygodnie wcześniej; zajmie to zespołowi jeden dzień.',
      voucher: 'Klienci, których zamówienie się nie powiodło, dostaną e-mailem bon rabatowy 10%.',
      approval: 'Zarząd firmy proszony jest o zatwierdzenie 5 000 euro na lepszy monitoring.',
      competitor: 'Sklep konkurencji miał w zeszłym miesiącu podobną awarię.'
    },
    reasons: {
      'projectManager.cause': 'Kierowniczka projektu potrzebuje przyczyny, żeby ocenić poprawkę.',
      'projectManager.renewal': 'To praca, którą musi zaplanować: jeden dzień zespołu.',
      'projectManager.voucher': 'Bonami zajmuje się obsługa klienta, a nie projekt.',
      'executive.duration': 'Zarząd potrzebuje skali incydentu.',
      'executive.revenue': 'Dla zarządu wpływ na biznes jest na pierwszym miejscu.',
      'executive.cause': 'Szczegół techniczny nie zmienia jego decyzji; wystarczy „przeoczone odnowienie”.',
      'executive.renewal': 'Musi usłyszeć, że to się nie powtórzy.',
      'executive.approval': 'To decyzja, którą musi podjąć.',
      'customer.revenue': 'Wasz utracony przychód nie jest sprawą klienta.',
      'customer.cause': 'Techniczne przyczyny nie pomagają klientom.',
      'customer.fixed': 'Klienci najpierw chcą wiedzieć, że znów mogą robić zakupy.',
      'customer.renewal': 'Zmiany procesów wewnętrznych nie dotyczą klientów.',
      'customer.voucher': 'To dostaną i powinni zajrzeć do skrzynki e-mail.',
      'customer.approval': 'Wewnętrzne decyzje budżetowe nie są dla klientów.',
      competitor: 'Wskazywanie na innych brzmi jak wymówka i nic nie zmienia.'
    },
    messages: {
      'projectManager.fit': 'Wczorajsza trzygodzinna awaria wynikła z wygasłego certyfikatu bezpieczeństwa, który zablokował płatności. Żeby się nie powtórzyła, automatyzujemy odnawianie z wczesnym ostrzeżeniem; w tym sprincie zajmie to zespołowi jeden dzień.',
      'projectManager.tooMuch': 'Straciliśmy zamówienia za około 40 000 euro, klienci dostają e-mailem bon 10%, a konkurencja miała ten sam problem w zeszłym miesiącu.',
      'projectManager.missing': 'Sklep miał wczoraj krótką czkawkę, już wszystko gra.',
      'executive.fit': 'Wczoraj sklep nie działał przez trzy godziny; straciliśmy zamówienia za około 40 000 euro. Przyczyną było przeoczone rutynowe odnowienie, teraz zautomatyzowane. Aby wcześnie wykrywać takie problemy, prosimy o zatwierdzenie 5 000 euro na monitoring.',
      'executive.tooMuch': 'Certyfikat TLS bramki płatniczej wygasł o 18:02; teraz odnawiamy go automatycznie przez protokół ACME, z alertami 14 dni wcześniej.',
      'executive.missing': 'Wczoraj był mały problem techniczny. Został rozwiązany.',
      'customer.fit': 'Przepraszamy: wczoraj wieczorem nasz sklep był przez kilka godzin niedostępny. Teraz wszystko znów działa. Jeśli Państwa zamówienie się nie powiodło, otrzymają Państwo e-mailem bon rabatowy 10%.',
      'customer.tooMuch': 'Wygasły certyfikat bezpieczeństwa zatrzymał nasz system płatności; straciliśmy około 40 000 euro i teraz odnawiamy certyfikaty automatycznie.',
      'customer.condescending': 'Zepsuła się jakaś techniczna rzecz, nic, co by Pan zrozumiał. Proszę po prostu spróbować jeszcze raz.'
    }
  },
  signalFault: {
    title: 'Awaria sygnalizacji kolejowej',
    situation: 'Awaria semafora zakłóca ruch na linii kolejowej. Pracujesz na kolei. Wyjaśnij sytuację.',
    facts: {
      delay: 'Pociągi na tej linii mają około 40 minut opóźnienia.',
      bus: 'Autobusy zastępcze odjeżdżają sprzed dworca co 20 minut.',
      tickets: 'Bilety są ważne także w autobusach i w późniejszych pociągach.',
      signal: 'Semafor 14 przy rozjeździe po uszkodzeniu kabla stale pokazuje czerwone.',
      singleTrack: 'Pociągi przejeżdżają odcinek jednym torem z prędkością pieszego, na rozkaz pisemny.',
      repair: 'Technicy szacują, że naprawa potrwa jeszcze około czterech godzin.',
      construction: 'Kabel prawdopodobnie uszkodziły prace budowlane innej firmy.',
      staff: 'Dwóch techników jest w tym tygodniu na zwolnieniu.'
    },
    reasons: {
      'layperson.delay': 'Podróżni najpierw chcą wiedzieć, jak bardzo się spóźnią.',
      'layperson.bus': 'Mówi im, co mogą zrobić od razu.',
      'layperson.tickets': 'Odpowiada na obawę, czy potrzebują nowego biletu.',
      'layperson.signal': 'Numery semaforów nic podróżnym nie mówią.',
      'layperson.singleTrack': 'Zasady prowadzenia ruchu nie pomagają podróżnym.',
      'layperson.construction': 'Spekulacje o winie nie pomagają podróżnym i mogą być błędne.',
      'layperson.staff': 'Wewnętrzne sprawy kadrowe nie dotyczą podróżnych.',
      'expert.tickets': 'Zasady biletowe nie wpływają na ruch pociągów.',
      'expert.signal': 'Kolega potrzebuje dokładnego miejsca i rodzaju usterki.',
      'expert.singleTrack': 'To zasada prowadzenia ruchu, którą musi zastosować.',
      'expert.repair': 'Planuje rozkład wokół przewidywanego końca.',
      'expert.staff': 'Sytuacja kadrowa nie zmienia sposobu prowadzenia ruchu na odcinku.',
      'executive.delay': 'Zarząd potrzebuje skali zakłóceń.',
      'executive.tickets': 'Honorowanie biletów to standardowa zasada, nie temat dla zarządu.',
      'executive.repair': 'Musi wiedzieć, jak długo potrwają skutki.',
      'executive.construction': 'Możliwa szkoda wyrządzona przez osobę trzecią ma znaczenie dla odpowiedzialności i kosztów.'
    },
    messages: {
      'layperson.fit': 'Pociągi na tej linii mają około 40 minut opóźnienia. Autobusy zastępcze odjeżdżają sprzed dworca co 20 minut, a Państwa bilet jest w nich ważny.',
      'layperson.tooMuch': 'Semafor 14 przy rozjeździe po uszkodzeniu kabla stale pokazuje czerwone; pociągi jadą jednym torem z prędkością pieszego na rozkaz pisemny.',
      'layperson.missing': 'Prosimy o cierpliwość, wystąpiła awaria techniczna.',
      'expert.fit': 'Semafor 14 przy rozjeździe zablokowany na czerwonym po uszkodzeniu kabla. Ruch jednotorowy z prędkością pieszego na rozkaz pisemny; naprawa potrwa przewidywalnie jeszcze około czterech godzin.',
      'expert.condescending': 'Semafor to coś jak sygnalizacja świetlna dla pociągów. Jeden się zepsuł, więc pociągi muszą jechać powoli.',
      'expert.missing': 'Na linii jest problem i pociągi się spóźniają. Jeżdżą autobusy.',
      'executive.fit': 'Uszkodzenie kabla będzie zakłócać linię jeszcze około czterech godzin; pociągi mają około 40 minut opóźnienia. Kabel prawdopodobnie uszkodziły prace budowlane innej firmy, więc sprawdzamy kwestię odpowiedzialności.',
      'executive.tooMuch': 'Semafor 14 stale na czerwonym; ruch jednotorowy z prędkością pieszego na rozkaz pisemny; autobusy co 20 minut sprzed dworca; bilety ważne w autobusach.',
      'executive.missing': 'Mały problem z sygnalizacją, zespół się tym zajmuje.'
    }
  },
  kettleLid: {
    title: 'Pokrywka czajnika',
    situation: 'Twoja firma odkryła, że pokrywka jednego modelu czajnika może się odczepić. Wyjaśnij to.',
    facts: {
      batches: 'Dotyczy to tylko czajników z numerami partii od 2301 do 2315 (nadrukowanymi pod podstawą).',
      risk: 'Pokrywka może się otworzyć podczas nalewania, a gorąca woda może pryskać.',
      stop: 'Prosimy nie używać czajnika z tej partii, dopóki nie zostanie wymieniony.',
      hinge: 'Plastikowy sworzeń zawiasu wykonano o 0,2 mm za cienki.',
      free: 'Wymiana jest bezpłatna, łącznie z wysyłką.',
      cost: 'Wymiana będzie kosztować firmę około 120 000 euro.',
      supplier: 'Sworznie pochodziły od nowego dostawcy, którego próbki przeszły kontrolę.',
      injuries: 'Jak dotąd nie są znane żadne obrażenia.'
    },
    reasons: {
      'customer.batches': 'Klienci muszą móc sprawdzić, czy ich czajnik jest objęty problemem.',
      'customer.risk': 'Muszą zrozumieć, dlaczego to ważne.',
      'customer.stop': 'To działanie, które zapewnia im bezpieczeństwo.',
      'customer.hinge': 'Szczegóły w milimetrach nie pomagają klientom.',
      'customer.free': 'Wiedza, że to nic nie kosztuje, usuwa powód do zwlekania.',
      'customer.cost': 'Koszty firmy nie są sprawą klienta.',
      'customer.supplier': 'Szczegóły o dostawcy brzmią jak przerzucanie winy.',
      'executive.risk': 'Zarząd musi najpierw zrozumieć zagrożenie dla bezpieczeństwa.',
      'executive.hinge': 'Dokładny wymiar to sprawa inżynierów.',
      'executive.cost': 'Skutki finansowe są częścią jego decyzji.',
      'executive.injuries': 'To, czy ktoś został ranny, zmienia pilność i reakcję.',
      'expert.stop': 'Instrukcje dla klientów nie pomagają w analizie wady.',
      'expert.hinge': 'Inżynierka potrzebuje dokładnej wady.',
      'expert.free': 'Warunki wysyłki nie mają znaczenia dla analizy technicznej.',
      'expert.cost': 'Koszty akcji wymiany nie są potrzebne, by poprawić część.',
      'expert.supplier': 'Pokazuje, gdzie musi się zmienić kontrola jakości.'
    },
    messages: {
      'customer.fit': 'Prosimy sprawdzić numer partii pod czajnikiem. Jeśli mieści się między 2301 a 2315, prosimy przestać go używać: pokrywka może się otworzyć podczas nalewania. Wymienimy go bezpłatnie, łącznie z wysyłką.',
      'customer.tooMuch': 'Sworzeń zawiasu od nowego dostawcy był o 0,2 mm za cienki; wymiana będzie nas kosztować około 120 000 euro.',
      'customer.condescending': 'Niektóre czajniki mogą mieć malutki problem. Nie trzeba rozumieć szczegółów; można go odesłać, jeśli ktoś chce.',
      'executive.fit': 'Problem bezpieczeństwa: w partiach od 2301 do 2315 pokrywka czajnika może się otworzyć podczas nalewania gorącej wody. Jak dotąd brak znanych obrażeń. Wymiana będzie kosztować około 120 000 euro.',
      'executive.tooMuch': 'Średnica sworznia zawiasu jest o 0,2 mm poniżej tolerancji; próbki nowego dostawcy były zgodne ze specyfikacją, więc podejrzewamy zużycie narzędzia.',
      'executive.missing': 'Profilaktycznie wymieniamy niektóre czajniki.',
      'expert.fit': 'Sworznie zawiasu od nowego dostawcy są o 0,2 mm za cienkie, więc pokrywka może się otworzyć podczas nalewania. Partie objęte problemem: od 2301 do 2315. Ich próbki przeszły kontrolę, więc nasza kontrola przyjęcia musi się zmienić.',
      'expert.missing': 'Niektóre pokrywki są luźne; klienci dostają bezpłatną wymianę.',
      'expert.condescending': 'Zawias to część, dzięki której pokrywka się obraca. Jeśli jest za cienki, źle trzyma.'
    }
  }
};
