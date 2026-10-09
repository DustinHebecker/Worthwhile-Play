import type { ContentText } from './types';

export const content: ContentText = {
  launch: {
    title: 'Informacja o premierze aplikacji',
    context: 'E-mail kierowniczki projektu do całego zespołu.',
    sentences: {
      s1: 'Cześć wszystkim, mam nadzieję, że mieliście udany, słoneczny weekend.',
      s2: 'Premiera naszej aplikacji do rezerwacji przesuwa się z 2 kwietnia na 14 maja.',
      s3: 'Powodem jest to, że operator płatności nie zakończył jeszcze certyfikacji bezpieczeństwa, a bez niej nie możemy przyjmować płatności.',
      s4: 'Operator twierdzi, że ma zaległości w rozpatrywaniu wniosków.',
      s5: 'Zespół projektowy wykorzysta dodatkowe tygodnie, żeby dopracować ekrany powitalne.',
      s6: 'Nasi 300 beta-testerzy mogą korzystać z wersji testowej aż do premiery.',
      s7: 'Pewien konkurent wypuścił w zeszłym roku podobną aplikację i potrzebował do tego trzech podejść.',
      s8: 'Marketing musi przesunąć kampanię, więc proszę do piątku zdecydować o nowym starcie kampanii.',
      s9: 'Budżet się nie zmienia, bo agencja nie pobiera opłat za przesunięcie kampanii.',
      s10: 'Sama certyfikacja trwa około trzech tygodni od chwili rozpoczęcia.',
      s11: 'Jeszcze raz dziękuję za całą waszą pracę!',
      s12: 'W środę wyślę zaktualizowany plan projektu.'
    },
    bullets: {
      gold1: 'Premiera przesuwa się z 2 kwietnia na 14 maja.',
      gold2: 'Przyczyna: certyfikacja bezpieczeństwa u operatora płatności nie jest zakończona.',
      gold3: 'Marketing musi do piątku zdecydować o nowym starcie kampanii.',
      minor: 'Zespół projektowy dopracuje ekrany powitalne.',
      distort: 'Aplikacja oblała kontrolę bezpieczeństwa.',
      dup: 'Premiera się opóźnia.',
      subtle: 'Premiera przesuwa się z 2 kwietnia na 4 maja.'
    },
    bulletNotes: {
      distort: 'Tekst mówi, że certyfikacja nie jest jeszcze zakończona, a nie, że aplikacja oblała jakąś kontrolę.',
      dup: 'Powtarza punkt o nowym terminie, ale bez daty, i marnuje miejsce.',
      subtle: 'Prawie dobrze, ale nowy termin to 14 maja, a nie 4 maja.'
    },
    summaries: {
      faithful: 'Premiera przesuwa się na 14 maja, bo certyfikacja operatora płatności nie jest zakończona, a marketing musi do piątku zdecydować o nowym starcie kampanii.',
      vague: 'W harmonogramie premiery są pewne zmiany, o których zespół powinien wiedzieć.',
      drops: 'Ponieważ operator płatności nie jest jeszcze gotowy, premierę przełożono, ale budżet się nie zmienia.',
      adds: 'Premiera przesuwa się na 14 maja, bo certyfikacja operatora płatności nie jest zakończona, a opóźnienie podniesie koszty projektu.',
      subtle: 'Premiera przesuwa się na 14 maja, bo nasza aplikacja oblała certyfikację u operatora płatności, a marketing musi do piątku zdecydować o nowym starcie kampanii.'
    },
    summaryNotes: {
      drops: 'Brakuje nowego terminu i decyzji, którą musi podjąć marketing.',
      adds: 'Tekst mówi, że budżet się nie zmienia; wyższe koszty są wymyślone.',
      subtle: 'Aplikacja niczego nie oblała: certyfikacja po prostu jeszcze się nie skończyła.'
    },
    task: 'Zespół marketingu musi działać na podstawie tego jednego zdania.',
    oneLiner: 'Przesuńcie premierę na maj.',
    details: {
      d1: 'Dokładny nowy termin: 14 maja',
      d2: 'Kto ma działać: marketing przesuwa kampanię',
      d3: 'Termin decyzji: do piątku ustalić nowy start kampanii',
      d4: 'Dlaczego operator ma opóźnienie',
      d5: 'Plany zespołu projektowego dotyczące ekranów powitalnych',
      d6: 'Słoneczny weekend'
    },
    versions: {
      actionable: 'Premiera przesuwa się z 2 kwietnia na 14 maja. Marketing: proszę przesunąć kampanię i do piątku ustalić nowy termin startu. Budżet się nie zmienia.',
      vague: 'Przesuwamy premierę na maj. Dostosujcie odpowiednio swoje plany i dajcie znać, jeśli coś się pojawi.',
      invented: 'Premiera przesuwa się na 1 maja. Marketing: proszę odwołać kampanię i do końca miesiąca zaplanować nową.'
    },
    versionNote: 'Nowy termin to 14 maja, a nie 1 maja, a kampanię się przesuwa, a nie odwołuje.'
  },
  library: {
    title: 'Remont biblioteki',
    context: 'Ogłoszenie na drzwiach osiedlowej biblioteki.',
    sentences: {
      s1: 'Wielu z Państwa mówiło nam, jak bardzo lubi stare fotele w kąciku czytelniczym.',
      s2: 'Od 3 czerwca biblioteka będzie zamknięta z powodu remontu przez osiem tygodni.',
      s3: 'Zostanie naprawiony dach, a budynek dostanie windę i nowe oświetlenie.',
      s4: 'W czasie zamknięcia w każdy wtorek na rynku będzie stał bibliobus.',
      s5: 'Bibliobus wozi około 2000 książek i może zamówić każdy tytuł z biblioteki centralnej.',
      s6: 'Wszystkie wypożyczenia, których termin minąłby w czasie zamknięcia, zostaną automatycznie przedłużone, więc nikt nie zapłaci kary.',
      s7: 'Książki można też w każdej chwili oddać do skrzynki zwrotów obok ratusza.',
      s8: 'Sam ratusz przeszedł podobny remont dziesięć lat temu.',
      s9: 'Nasze e-booki i audiobooki są jak zwykle dostępne online.',
      s10: 'Już cieszymy się na przyszłoroczny letni festiwal czytania.',
      s11: 'Remont jest finansowany z regionalnego funduszu budowlanego.'
    },
    bullets: {
      gold1: 'Od 3 czerwca zamknięta z powodu remontu na osiem tygodni.',
      gold2: 'W każdy wtorek na rynku stoi bibliobus.',
      gold3: 'Wypożyczenia z terminem w czasie zamknięcia przedłużają się automatycznie.',
      minor: 'Budynek dostanie nowe oświetlenie.',
      distort: 'Wszystkie usługi biblioteki zostają wstrzymane na osiem tygodni.',
      dup: 'Biblioteka będzie przez jakiś czas zamknięta.',
      subtle: 'Od 3 czerwca zamknięta z powodu remontu na sześć tygodni.'
    },
    bulletNotes: {
      distort: 'Nieprawda: bibliobus i skrzynka zwrotów działają również w czasie zamknięcia.',
      dup: 'Powtarza informację o zamknięciu bez daty rozpoczęcia i czasu trwania.',
      subtle: 'Prawie dobrze, ale zamknięcie trwa osiem tygodni, a nie sześć.'
    },
    summaries: {
      faithful: 'Biblioteka zamyka się na osiem tygodni od 3 czerwca; w tym czasie w każdy wtorek na rynek przyjeżdża bibliobus, a wypożyczenia z mijającym terminem przedłużają się automatycznie.',
      vague: 'Latem w bibliotece zajdą pewne zmiany, więc warto mieć oczy otwarte.',
      drops: 'Biblioteka przejdzie remont i dostanie naprawiony dach, windę i nowe oświetlenie.',
      adds: 'Biblioteka zamyka się na osiem tygodni od 3 czerwca, a po ponownym otwarciu będzie pobierać niewielką opłatę za wypożyczenia.',
      subtle: 'Ponieważ dach jest niebezpieczny, biblioteka zamyka się na osiem tygodni od 3 czerwca; w tym czasie w każdy wtorek na rynek przyjeżdża bibliobus.'
    },
    summaryNotes: {
      drops: 'Opisuje prace remontowe, ale nie mówi, kiedy biblioteka się zamyka ani co czytelnicy mogą w tym czasie robić.',
      adds: 'Ogłoszenie nie wspomina o żadnych opłatach po ponownym otwarciu.',
      subtle: 'Ogłoszenie mówi, że dach zostanie naprawiony, a nie, że jest niebezpieczny; ta przyczyna jest dopisana.'
    },
    task: 'Sąsiad, który chce dalej wypożyczać książki, pyta cię o to.',
    oneLiner: 'Biblioteka jest latem zamknięta.',
    details: {
      d1: 'Kiedy dokładnie: osiem tygodni od 3 czerwca',
      d2: 'Gdzie wypożyczać w tym czasie: w bibliobusie na rynku we wtorki',
      d3: 'Gdzie oddawać książki: do skrzynki obok ratusza',
      d4: 'Co obejmuje remont',
      d5: 'Fotele w kąciku czytelniczym',
      d6: 'Przyszłoroczny festiwal czytania'
    },
    versions: {
      actionable: 'Od 3 czerwca biblioteka jest zamknięta na osiem tygodni. Książki możesz wypożyczać w każdy wtorek w bibliobusie na rynku, a oddawać w każdej chwili do skrzynki obok ratusza. To, czego termin minie w tym czasie, przedłuża się automatycznie.',
      vague: 'Latem biblioteka będzie przez jakiś czas zamknięta z powodu remontu. Będą inne możliwości, więc zajrzyj do ogłoszenia.',
      invented: 'Od 3 czerwca biblioteka jest zamknięta na osiem tygodni. Książki możesz wypożyczać w każdy piątek w bibliobusie przy dworcu. Oddaj wszystkie książki przed zamknięciem.'
    },
    versionNote: 'Bibliobus stoi na rynku we wtorki, a nikt nie musi oddawać książek przed zamknięciem.'
  },
  leaves: {
    title: 'Dlaczego liście zmieniają kolor',
    context: 'Krótki artykuł z magazynu przyrodniczego dla ciekawych świata czytelników.',
    sentences: {
      s1: 'Jesień to dla wielu ulubiona pora na długie spacery.',
      s2: 'Liście są zielone, bo zawierają dużo chlorofilu, barwnika, dzięki któremu rośliny wychwytują światło słoneczne.',
      s3: 'Gdy dni robią się krótsze, wiele drzew przestaje wytwarzać chlorofil i go rozkłada.',
      s4: 'Żółte i pomarańczowe barwniki, zwane karotenoidami, były w liściu przez cały czas; widać je dopiero, gdy zieleń blednie.',
      s5: 'Karotenoidy to ten sam rodzaj barwnika, który nadaje marchewce pomarańczowy kolor.',
      s6: 'Z czerwienią jest inaczej: niektóre drzewa, na przykład wiele klonów, wytwarzają jesienią nowe czerwone barwniki.',
      s7: 'Naukowcy sądzą, że te czerwone barwniki mogą chronić liść przed silnym światłem, gdy drzewo odzyskuje składniki odżywcze.',
      s8: 'Słoneczne dni i chłodne noce zwykle sprawiają, że czerwień jest żywsza.',
      s9: 'W niektórych regionach kolorowe lasy co roku przyciągają wielu turystów.',
      s10: 'Na koniec w miejscu, gdzie liść łączy się z gałązką, tworzy się cienka warstwa komórek i liść opada.',
      s11: 'Nie zapomnij ciepłej kurtki, jeśli wychodzisz oglądać drzewa.'
    },
    bullets: {
      gold1: 'Jesienią drzewa przestają wytwarzać zielony chlorofil i go rozkładają.',
      gold2: 'Żółte i pomarańczowe barwniki były tam od zawsze i stają się widoczne.',
      gold3: 'Niektóre drzewa, np. klony, wytwarzają nowe czerwone barwniki.',
      minor: 'Tworzy się cienka warstwa komórek i liść opada.',
      distort: 'Wszystkie jesienne kolory to nowe barwniki wytwarzane przez drzewo.',
      dup: 'Liście tracą zielony kolor.',
      subtle: 'Czerwone barwniki chronią liść przed silnym światłem.'
    },
    bulletNotes: {
      distort: 'Nowa jest tylko czerwień; żółty i pomarańczowy były w liściu przez cały czas.',
      dup: 'Mówi mniej niż punkt o chlorofilu i marnuje miejsce.',
      subtle: 'Tekst mówi tylko, że naukowcy sądzą, iż czerwone barwniki mogą chronić liść; ten punkt podaje to jako fakt.'
    },
    summaries: {
      faithful: 'Jesienią wiele drzew rozkłada zielony chlorofil, przez co widać żółte i pomarańczowe barwniki obecne od zawsze, a niektóre drzewa wytwarzają też nowe czerwone.',
      vague: 'Liście zmieniają jesienią kolor z powodu różnych naturalnych procesów w drzewie.',
      drops: 'Jesienią liście robią się żółte, pomarańczowe i czerwone, a potem spadają z drzew.',
      adds: 'Jesienią wiele drzew rozkłada zielony chlorofil, przez co widać żółte i pomarańczowe barwniki, a im bardziej czerwone liście, tym zimniejsza będzie zima.',
      subtle: 'Jesienią wiele drzew rozkłada zielony chlorofil, przez co widać żółte i pomarańczowe barwniki, a zimne noce sprawiają, że drzewa wytwarzają czerwone.'
    },
    summaryNotes: {
      drops: 'Opisuje, co widzimy, ale nie wyjaśnia, dlaczego tak się dzieje.',
      adds: 'Tekst nic nie mówi o przewidywaniu zimy.',
      subtle: 'Chłodne noce zwykle tylko ożywiają czerwień; tekst nie mówi, że to one powodują powstanie czerwonych barwników.'
    },
    task: 'Nauczycielka chce wyjaśnić to zdanie klasie na prawdziwych liściach.',
    oneLiner: 'Chlorofil się rozkłada, więc widać inne kolory.',
    details: {
      d1: 'Czym jest chlorofil: zielonym barwnikiem, który wychwytuje światło słoneczne',
      d2: 'Że żółty i pomarańczowy były w liściu przez cały czas',
      d3: 'Że niektóre drzewa, np. klony, wytwarzają nowe czerwone barwniki',
      d4: 'Że jesień to popularna pora na spacery',
      d5: 'Że na dworze potrzebna jest ciepła kurtka',
      d6: 'Jak liść w końcu opada'
    },
    versions: {
      actionable: 'Liście są zielone dzięki chlorofilowi, barwnikowi, który wychwytuje światło słoneczne. Jesienią wiele drzew przestaje go wytwarzać i go rozkłada. Wtedy widać żółte i pomarańczowe barwniki, które były tam od zawsze, a niektóre drzewa, na przykład klony, wytwarzają nowe czerwone.',
      vague: 'Jesienią liście się zmieniają, bo zieleń znika i wychodzą inne kolory. Przyroda jest fascynująca.',
      invented: 'Liście są zielone dzięki chlorofilowi. Jesienią przymrozek zamraża chlorofil, a potem drzewo maluje liście na żółto, pomarańczowo i czerwono nowymi barwnikami.'
    },
    versionNote: 'Tekst nie mówi, że przymrozek zamraża chlorofil, a nowa jest tylko czerwień.'
  },
  club: {
    title: 'Posiedzenie zarządu klubu sportowego',
    context: 'Protokół z posiedzenia zarządu klubu sportowego, wysłany do wszystkich członków.',
    sentences: {
      s1: 'Posiedzenie odbyło się w klubie i zaczęło się nieco później z powodu meczu piłki nożnej.',
      s2: 'Zarząd proponuje podnieść roczną składkę z 60 do 66 euro od przyszłego stycznia.',
      s3: 'Powodem jest wzrost czynszu za halę sportową o 15 procent.',
      s4: 'Składka nie zmieniała się od ośmiu lat.',
      s5: 'Członkowie poniżej 18 lat nadal będą płacić dotychczasową składkę.',
      s6: 'Członkowie zagłosują nad propozycją na walnym zebraniu 12 marca.',
      s7: 'Zarząd rozmawiał też o nowych siatkach na korty tenisowe, ale odłożył decyzję.',
      s8: 'Jeśli propozycja zostanie odrzucona, zarząd rozważy zamiast tego ograniczenie części treningów.',
      s9: 'Sąsiedni klub też niedawno podniósł składkę, do 75 euro.',
      s10: 'Hala należy do miasta, które ustala czynsz.',
      s11: 'Serdeczne podziękowania dla drużyny młodzieżowej za pyszne ciasta!'
    },
    bullets: {
      gold1: 'Propozycja: roczna składka rośnie od stycznia z 60 do 66 euro.',
      gold2: 'Członkowie poniżej 18 lat płacą dotychczasową składkę.',
      gold3: 'Głosowanie na walnym zebraniu 12 marca.',
      minor: 'Rozmawiano o nowych siatkach na korty tenisowe.',
      distort: 'Zarząd postanowił podnieść składkę.',
      dup: 'Składka członkowska może wzrosnąć.',
      subtle: 'Propozycja: roczna składka rośnie od stycznia z 60 do 76 euro.'
    },
    bulletNotes: {
      distort: 'Nic jeszcze nie postanowiono: to propozycja, nad którą głosują członkowie.',
      dup: 'Bardziej ogólne powtórzenie punktu o składce, bez kwot.',
      subtle: 'Prawie dobrze, ale proponowana składka to 66 euro, a nie 76.'
    },
    summaries: {
      faithful: 'Ponieważ wzrósł czynsz za halę, zarząd proponuje podnieść od stycznia roczną składkę z 60 do 66 euro, z wyjątkiem osób poniżej 18 lat, a członkowie zagłosują 12 marca.',
      vague: 'Zarząd rozmawiał o sprawach finansowych i kilku zmianach dla członków.',
      drops: 'Ponieważ wzrósł czynsz za halę sportową, finanse klubu były głównym tematem posiedzenia zarządu.',
      adds: 'Zarząd proponuje podnieść od stycznia roczną składkę z 60 do 66 euro, a kto nie zapłaci do marca, straci członkostwo.',
      subtle: 'Ponieważ wzrósł czynsz za halę, zarząd postanowił podnieść od stycznia roczną składkę z 60 do 66 euro, z wyjątkiem osób poniżej 18 lat.'
    },
    summaryNotes: {
      drops: 'Brakuje proponowanej nowej składki i głosowania 12 marca.',
      adds: 'Protokół nic nie mówi o utracie członkostwa.',
      subtle: 'To tylko propozycja, nad którą członkowie jeszcze zagłosują, więc „postanowił” jest błędne.'
    },
    task: 'Członek klubu pyta cię, co to dla niego oznacza.',
    oneLiner: 'Składki idą w górę.',
    details: {
      d1: 'Kwoty: z 60 do 66 euro rocznie',
      d2: 'Że to propozycja, nad którą głosuje się na zebraniu 12 marca',
      d3: 'Że członkowie poniżej 18 lat zachowują dotychczasową składkę',
      d4: 'Że posiedzenie zaczęło się później',
      d5: 'Ciasta od drużyny młodzieżowej',
      d6: 'Rozmowa o siatkach tenisowych'
    },
    versions: {
      actionable: 'Zarząd proponuje podnieść od stycznia roczną składkę z 60 do 66 euro, bo wzrósł czynsz za halę. Członkowie poniżej 18 lat płacą dotychczasową składkę. Nic jeszcze nie postanowiono: możesz zagłosować na walnym zebraniu 12 marca.',
      vague: 'Od przyszłego roku składki rosną, bo wszystko zdrożało. Więcej informacji kiedyś będzie.',
      invented: 'Od stycznia składka dla wszystkich rośnie z 60 do 66 euro. Zmień swój przelew przed walnym zebraniem 12 marca.'
    },
    versionNote: 'Traktuje propozycję jak decyzję i zapomina, że członkowie poniżej 18 lat zachowują dotychczasową składkę.'
  },
  trip: {
    title: 'Zmiana w wycieczce klasowej',
    context: 'Wiadomość nauczyciela do rodziców uczniów jednej klasy.',
    sentences: {
      s1: 'Mam nadzieję, że dzieci cieszą się na wycieczkę tak samo jak ja!',
      s2: 'Z powodu strajku na kolei pojedziemy nad morze autokarem zamiast pociągiem.',
      s3: 'To oznacza, że wyjeżdżamy godzinę wcześniej, niż planowaliśmy.',
      s4: 'Miejscem zbiórki nie jest już dworzec, tylko parking za szkołą.',
      s5: 'Firma autokarowa ma duże doświadczenie z grupami szkolnymi.',
      s6: 'Powrót w piątek odbędzie się zgodnie z planem.',
      s7: 'Rodziny nie ponoszą dodatkowych kosztów; różnicę pokrywa szkoła.',
      s8: 'Podróż autokarem trwa około 40 minut dłużej niż pociągiem.',
      s9: 'Zeszłoroczna klasa pojechała w góry i to też była świetna wycieczka.',
      s10: 'W połowie drogi będzie krótka przerwa na stacji przy autostradzie.',
      s11: 'Dziękuję wszystkim za pomoc przy listach rzeczy do spakowania.'
    },
    bullets: {
      gold1: 'Autokar zamiast pociągu z powodu strajku na kolei.',
      gold2: 'Wyjazd godzinę wcześniej, z parkingu za szkołą.',
      gold3: 'Brak dodatkowych kosztów dla rodzin.',
      minor: 'Firma autokarowa ma doświadczenie z grupami szkolnymi.',
      distort: 'Wycieczka zostaje skrócona z powodu strajku.',
      dup: 'Plany podróży się zmieniły.',
      subtle: 'Wyjazd dwie godziny wcześniej, z parkingu za szkołą.'
    },
    bulletNotes: {
      distort: 'Zmienia się tylko dojazd; wycieczka nie jest skracana.',
      dup: 'Mówi tylko, że coś się zmieniło, co widać już z innych punktów.',
      subtle: 'Prawie dobrze, ale wyjazd jest godzinę wcześniej, a nie dwie.'
    },
    summaries: {
      faithful: 'Z powodu strajku na kolei klasa jedzie autokarem i wyjeżdża godzinę wcześniej z parkingu za szkołą, bez dodatkowych kosztów dla rodzin.',
      vague: 'W organizacji wycieczki jest kilka zmian, o których rodzice powinni wiedzieć.',
      drops: 'Z powodu strajku na kolei klasa pojedzie nad morze autokarem, co nie kosztuje rodzin nic więcej.',
      adds: 'Z powodu strajku na kolei klasa jedzie autokarem i wyjeżdża godzinę wcześniej z parkingu za szkołą, a rodzice dopłacają niewielką kwotę.',
      subtle: 'Ponieważ autokar jest szybszy od pociągu, klasa jedzie autokarem i wyjeżdża godzinę wcześniej z parkingu za szkołą, bez dodatkowych kosztów dla rodzin.'
    },
    summaryNotes: {
      drops: 'Brakuje tego, co rodzice muszą zrobić: wcześniejszego wyjazdu i nowego miejsca zbiórki.',
      adds: 'Wiadomość mówi, że różnicę pokrywa szkoła, więc dopłaty nie ma.',
      subtle: 'Powodem jest strajk na kolei, a autokar jest nawet wolniejszy od pociągu.'
    },
    task: 'Rodzic, który przegapił wiadomość, pyta innego rodzica, co trzeba zrobić.',
    oneLiner: 'Klasa jedzie teraz autokarem.',
    details: {
      d1: 'Nowe miejsce zbiórki: parking za szkołą',
      d2: 'Nowa godzina: godzinę wcześniej niż w planie',
      d3: 'Że nie ma dodatkowych kosztów',
      d4: 'Że firma autokarowa jest doświadczona',
      d5: 'Dlaczego nie jadą pociągiem',
      d6: 'Że nauczyciel cieszy się na wycieczkę'
    },
    versions: {
      actionable: 'Klasa jedzie autokarem. Przyprowadź dziecko godzinę wcześniej, niż było w planie, na parking za szkołą, a nie na dworzec. Nic nie dopłacasz, a powrót w piątek się nie zmienia.',
      vague: 'Jest strajk, więc teraz jadą autokarem. Godziny i miejsca są trochę inne, zobacz, co napisał nauczyciel.',
      invented: 'Klasa jedzie autokarem. Przyprowadź dziecko na dworzec godzinę wcześniej i daj mu trochę pieniędzy na bilet na autokar.'
    },
    versionNote: 'Zbiórka jest na parkingu za szkołą, a nie na dworcu, a koszty pokrywa szkoła.'
  },
  bikes: {
    title: 'Rowery elektryczne w wypożyczalni miejskiej',
    context: 'Ogłoszenie miejskiej wypożyczalni rowerów dla użytkowników.',
    sentences: {
      s1: 'Jazda na rowerze to świetny sposób, żeby być aktywnym i poznawać miasto.',
      s2: 'Od 1 lipca nasza wypożyczalnia dodaje do floty 200 rowerów elektrycznych.',
      s3: 'Rower elektryczny kosztuje 20 centów za minutę; zwykłe rowery zachowują obecną cenę.',
      s4: 'Do odblokowania roweru elektrycznego potrzebna jest najnowsza wersja naszej aplikacji.',
      s5: 'Rowery elektryczne mają zasięg około 60 kilometrów na jednym ładowaniu.',
      s6: 'Rowery elektryczne trzeba zwracać do jednej z 12 stacji ładowania; nie można ich zostawiać nigdzie indziej.',
      s7: 'Mapa stacji ładowania jest w aplikacji.',
      s8: 'Za zostawienie roweru elektrycznego poza stacją pobierana jest opłata 10 euro.',
      s9: 'Kilka innych miast wprowadziło w ostatnich latach podobne usługi.',
      s10: 'Rowery testowało zimą 50 wolontariuszy.',
      s11: 'Dziękujemy, że jeździcie z nami!'
    },
    bullets: {
      gold1: 'Od 1 lipca: 200 rowerów elektrycznych za 20 centów za minutę.',
      gold2: 'Do odblokowania potrzebna jest najnowsza wersja aplikacji.',
      gold3: 'Rowery elektryczne zwraca się do jednej z 12 stacji ładowania.',
      minor: 'Mapa stacji ładowania jest w aplikacji.',
      distort: 'Rowery elektryczne zastępują zwykłe rowery.',
      dup: 'Są nowe rowery.',
      subtle: 'Od 1 lipca: 200 rowerów elektrycznych za 25 centów za minutę.'
    },
    bulletNotes: {
      distort: 'Rowery elektryczne dochodzą do floty; zwykłe zostają, w obecnej cenie.',
      dup: 'Bardziej ogólne powtórzenie pierwszego punktu, bez daty, liczby i ceny.',
      subtle: 'Prawie dobrze, ale cena to 20 centów za minutę, a nie 25.'
    },
    summaries: {
      faithful: 'Od 1 lipca jest 200 rowerów elektrycznych za 20 centów za minutę; odblokowuje się je najnowszą wersją aplikacji i trzeba je zwracać do jednej z 12 stacji ładowania.',
      vague: 'Wypożyczalnia rowerów wprowadza tego lata nowość, która może zainteresować użytkowników.',
      drops: 'Wypożyczalnia dodaje 200 rowerów elektrycznych o zasięgu około 60 kilometrów, więc dłuższe trasy będą łatwiejsze.',
      adds: 'Od 1 lipca jest 200 rowerów elektrycznych za 20 centów za minutę, a zwykłe rowery zostaną wycofane w przyszłym roku.',
      subtle: 'Od 1 lipca jest 200 rowerów elektrycznych za 20 centów za minutę; odblokowuje się je najnowszą wersją aplikacji i można je zwrócić do dowolnej stacji rowerowej.'
    },
    summaryNotes: {
      drops: 'Brakuje ceny i tego, co muszą zrobić użytkownicy: zaktualizować aplikację i zwrócić rower do stacji ładowania.',
      adds: 'Ogłoszenie nigdzie nie mówi, że zwykłe rowery zostaną wycofane.',
      subtle: 'Rowery elektryczne można zwracać tylko do 12 stacji ładowania, a nie do dowolnej stacji.'
    },
    task: 'Koleżanka chce w przyszłym tygodniu wypróbować rower elektryczny.',
    oneLiner: 'Są teraz rowery elektryczne.',
    details: {
      d1: 'Cena: 20 centów za minutę',
      d2: 'Że do odblokowania potrzebna jest najnowsza wersja aplikacji',
      d3: 'Że rower elektryczny trzeba zwrócić do stacji ładowania',
      d4: 'Że jazda na rowerze pomaga być aktywnym',
      d5: 'Ile jest w sumie rowerów elektrycznych',
      d6: 'Że zwykłe rowery zachowują cenę'
    },
    versions: {
      actionable: 'Od 1 lipca możesz wypożyczać rowery elektryczne za 20 centów za minutę. Najpierw zaktualizuj aplikację, bo do odblokowania potrzebna jest najnowsza wersja. Potem zwróć rower do jednej z 12 stacji ładowania zaznaczonych na mapie w aplikacji.',
      vague: 'Są teraz rowery elektryczne i są bardzo proste w obsłudze. Ściągnij aplikację i jedź.',
      invented: 'Od 1 lipca możesz wypożyczać rowery elektryczne za 20 centów za minutę bez aplikacji, a potem zostawić je gdziekolwiek w mieście.'
    },
    versionNote: 'Do odblokowania potrzebna jest najnowsza wersja aplikacji, a rower trzeba zwrócić do stacji ładowania.'
  }
};
