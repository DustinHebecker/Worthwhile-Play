import type { ContentText } from './types';

export const content: ContentText = {
  supplierDelay: {
    title: 'Opóźnienie dostawcy przed premierą',
    situation: 'Twoja firma wprowadza 14 maja nową lampę biurkową. Dostawca kloszy zgłasza opóźnienie. Przygotuj briefing.',
    recipient: 'szefowa produktu',
    cards: {
      c1: 'Nowa lampa biurkowa wchodzi do sprzedaży 14 maja; 350 klientów zamówiło ją w przedsprzedaży.',
      c2: 'Dostawca wysłał dopiero 200 z 500 zamówionych kloszy.',
      c3: 'Gdy części dotrą, nasz warsztat może składać 100 lamp dziennie.',
      c4: 'Dostawca nie podał jeszcze terminu wysyłki pozostałych kloszy.',
      c5: 'Dostawca spodziewa się wysłać resztę w przyszłym tygodniu, prawdopodobnie we wtorek.',
      c6: 'Jeśli części dotrą po 10 maja, lamp nie da się złożyć na czas premiery.',
      c7: 'Reklama premiery jest zarezerwowana na 14 maja; przesunięcie kosztowałoby 800 euro opłaty.',
      c8: 'Dział marketingu musi do piątku wiedzieć, czy termin premiery się utrzyma.',
      c9: 'Jonas z działu zakupów może jutro rano zadzwonić do dostawcy i poprosić o wiążący termin.',
      c10: 'Dostawca w zeszłym roku przeniósł się do nowego biurowca.',
      c11: 'Na razie wysłano tylko 200 z 500 zamówionych kloszy.',
      c12: 'Szczerze mówiąc, ten dostawca zawsze był trochę chaotyczny.'
    },
    decisions: {
      right: 'Utrzymać premierę 14 maja czy przesunąć ją o tydzień?',
      notTheirs: 'Z jakiej firmy przewozowej ma korzystać dostawca?',
      premature: 'Czy zastąpić tego dostawcę przy wszystkich przyszłych produktach?'
    },
    actions: {
      concrete: 'Jonas dzwoni jutro o 9:00 do dostawcy i do 12:00 przekazuje szefowej produktu potwierdzony termin.',
      vague: 'Ktoś powinien mieć oko na dostawcę.',
      outOfScope: 'Zacząć projektować kolekcję lamp na przyszły rok.'
    }
  },
  basement: {
    title: 'Zalana piwnica we wspólnym domu',
    situation: 'Po ulewie w piwnicy domu, w którym mieszkasz z innymi lokatorami, stoi woda. Przygotuj briefing.',
    recipient: 'właściciel domu',
    cards: {
      c1: 'W domu mieszka pięć osób; w piwnicy stoją piec grzewczy i pudła wszystkich lokatorów.',
      c2: 'Dziś rano w piwnicy stało około 10 cm wody.',
      c3: 'Dziś rano na wszelki wypadek wyłączyliśmy prąd w piwnicy.',
      c4: 'Nikt jeszcze nie wie, czy piec został uszkodzony.',
      c5: 'Woda prawdopodobnie już nie przybiera; w południe wyglądało tak samo jak rano.',
      c6: 'Na czwartek zapowiadają kolejne opady i woda może znowu się podnieść.',
      c7: 'Piec stoi 15 cm nad podłogą, więc kilka centymetrów wody więcej by go sięgnęło.',
      c8: 'Hydraulik może przyjść w tym tygodniu tylko wtedy, gdy właściciel do jutra zatwierdzi koszt dojazdu.',
      c9: 'Współlokatorka, która pracuje z domu, mogłaby w środę wpuścić hydraulika.',
      c10: 'Ściany piwnicy były ostatnio malowane w 2015 roku.',
      c11: 'Kiedy sprawdzaliśmy dziś rano, piwnica była pod 10 cm wody.',
      c12: 'W tym domu zawsze było wilgotno i nikt nigdy nic z tym nie robi.'
    },
    decisions: {
      right: 'Zatwierdzić koszt dojazdu hydraulika w tym tygodniu?',
      notTheirs: 'Który lokator ma pierwszy wynieść swoje pudła?',
      premature: 'Czy całą piwnicę trzeba zaizolować i wyremontować?'
    },
    actions: {
      concrete: 'Współlokatorka pracująca z domu umawia hydraulika na środę i jeszcze dziś wysyła właścicielowi wycenę.',
      vague: 'Kiedyś się tym zajmiemy.',
      outOfScope: 'Zaplanować imprezę w domu, żeby wszystkim poprawić humor.'
    }
  },
  schoolTrip: {
    title: 'Wycieczka szkolna i ostrzeżenie pogodowe',
    situation: 'Klasa licząca 24 uczniów ma w piątek iść na pieszą wycieczkę w góry. Wydano ostrzeżenie pogodowe. Przygotuj briefing.',
    recipient: 'dyrektorka szkoły',
    cards: {
      c1: 'Klasa 24 uczniów w wieku 11 lat jest zapisana na piątkową wycieczkę pieszą, z trzema dorosłymi opiekunami.',
      c2: 'Służba meteorologiczna wydała ostrzeżenie przed burzą na piątkowe popołudnie.',
      c3: 'Muzeum nauki w mieście ma jeszcze w piątek miejsce na wizytę klasy.',
      c4: 'Prognoza nie mówi jeszcze, czy burza przyjdzie przed południem, czy po nim.',
      c5: 'Strażnik parku uważa, że główny szlak najprawdopodobniej pozostanie otwarty.',
      c6: 'Silny wiatr może łamać gałęzie na leśnym szlaku.',
      c7: 'Jedyne schronienie na trasie jest 40 minut pieszo od końca szlaku – za daleko, by szybko tam dotrzeć w czasie burzy.',
      c8: 'Firmie autokarowej trzeba do środy wieczorem przekazać, czy wycieczka się odbędzie; do tego czasu rezygnacja jest bezpłatna.',
      c9: 'Wychowawczyni może w środę w południe sprawdzić aktualną prognozę.',
      c10: 'Klasa głosowała za wycieczką już we wrześniu.',
      c11: 'Według służby meteorologicznej w piątek po południu spodziewana jest burza.',
      c12: 'Dzieci będą strasznie rozczarowane, jeśli odwołamy.'
    },
    decisions: {
      right: 'Iść na wycieczkę, zamienić ją na muzeum czy ją odwołać?',
      notTheirs: 'Co uczniowie mają zabrać na obiad?',
      premature: 'Czy szkoła ma od teraz odwołać wszystkie wyjścia na świeże powietrze?'
    },
    actions: {
      concrete: 'Wychowawczyni sprawdza prognozę w środę o 12:00 i do 14:00 wysyła dyrektorce rekomendację.',
      vague: 'Zobaczymy, jaka będzie pogoda.',
      outOfScope: 'Zacząć przygotowywać przyszłoroczny festyn szkolny.'
    }
  },
  volunteers: {
    title: 'Dzień sprzątania bez wystarczającej liczby pomocników',
    situation: 'Twoje stowarzyszenie sąsiedzkie organizuje w sobotę sprzątanie parku. Zgłosiło się za mało wolontariuszy. Przygotuj briefing.',
    recipient: 'przewodnicząca stowarzyszenia',
    cards: {
      c1: 'Coroczne sprzątanie parku jest w sobotę od 10:00 do 13:00; miasto zapewnia worki i rękawice.',
      c2: 'Na razie zgłosiło się 9 wolontariuszy; planowaliśmy 20.',
      c3: 'Miasto odbiera pełne worki tylko w sobotę o 13:00.',
      c4: 'Młodzieżowa drużyna piłkarska może przysłać pomocników, ale trener jeszcze nie odpowiedział.',
      c5: 'Kilku sąsiadów powiedziało, że prawdopodobnie wpadną, jeśli będzie ładna pogoda.',
      c6: 'W 9 osób posprzątamy tylko mniej więcej połowę parku.',
      c7: 'Nikt jeszcze nie został wyznaczony do odebrania rękawic z domu kultury, który w sobotę zamyka się o 9:30.',
      c8: 'Możemy ograniczyć sprzątanie do okolic placu zabaw albo przenieść je na następną sobotę.',
      c9: 'Dwoje wolontariuszy zaproponowało, że jutro rozwiesi plakaty w okolicy.',
      c10: 'Zeszłoroczne sprzątanie skończyło się grillem.',
      c11: 'Zapisało się tylko 9 z 20 zaplanowanych wolontariuszy.',
      c12: 'Ludziom już po prostu nie zależy na swojej okolicy.'
    },
    decisions: {
      right: 'Zrobić w tę sobotę mniejsze sprzątanie czy przesunąć je o tydzień?',
      notTheirs: 'Czy miasto powinno zmienić godziny odbioru worków?',
      premature: 'Czy stowarzyszenie powinno w kolejnych latach wynająć firmę sprzątającą?'
    },
    actions: {
      concrete: 'Dwoje wolontariuszy jutro rozwiesza plakaty, a sekretarz dziś pisze do trenera piłkarskiego i do czwartku przekazuje odpowiedź.',
      vague: 'Musimy jakoś ściągnąć więcej ludzi.',
      outOfScope: 'Zacząć planować letni festyn stowarzyszenia.'
    }
  },
  release: {
    title: 'Wydanie oprogramowania z niezaliczonym testem',
    situation: 'Twój zespół chce we wtorek wydać nową wersję aplikacji do rezerwacji. Jeden test automatyczny nie przechodzi. Przygotuj briefing.',
    recipient: 'menedżer produktu',
    cards: {
      c1: 'Nowa wersja dodaje płatności online i została zapowiedziana klientom na wtorek.',
      c2: 'Jeden z 640 testów automatycznych nie przechodzi: zwrot pieniędzy za anulowaną rezerwację.',
      c3: 'Błąd pojawia się tylko przy płatnościach w obcej walucie.',
      c4: 'Nie wiemy jeszcze, czy błąd jest w naszym kodzie, czy w systemie testowym operatora płatności.',
      c5: 'Programista spodziewa się, że poprawka zajmie około dnia, ale jeszcze nie zajrzał do kodu.',
      c6: 'Jeśli błąd jest prawdziwy, niektórzy klienci mogą dostać zwrot w złej kwocie.',
      c7: 'Około 15% rezerwacji jest opłacanych w obcej walucie, więc błąd dotknąłby wielu klientów.',
      c8: 'Możemy wydać wersję we wtorek z wyłączonymi płatnościami w obcej walucie albo przełożyć całe wydanie.',
      c9: 'Programista może dziś po południu sprawdzić logi testowe operatora płatności.',
      c10: 'Nowy ekran płatności używa nowego firmowego odcienia niebieskiego.',
      c11: 'Tylko jeden test jest czerwony: zwroty za anulowane rezerwacje.',
      c12: 'Ten test zawsze był niestabilny; ja bym go po prostu zignorował.'
    },
    decisions: {
      right: 'Wydać we wtorek bez płatności w obcej walucie czy przełożyć wydanie?',
      notTheirs: 'Jakiej techniki programowania ma użyć programista do poprawki?',
      premature: 'Czy przejść do innego operatora płatności?'
    },
    actions: {
      concrete: 'Programista dziś po południu sprawdza logi operatora i do 17:00 mówi menedżerowi produktu, czy błąd jest po naszej stronie.',
      vague: 'Ktoś rzuci okiem na ten test.',
      outOfScope: 'Zacząć pisać informacje o wydaniu wersji po następnej.'
    }
  },
  careAppointment: {
    title: 'Wizyta w poradni opiekuńczej z babcią',
    situation: 'Twoja babcia ma w poniedziałek wizytę w poradni opiekuńczej. Rodzina musi ustalić, kto z nią pójdzie. Przygotuj briefing. (Chodzi o organizację, nie o sprawy medyczne.)',
    recipient: 'twój brat, z którym razem decydujesz',
    cards: {
      c1: 'Babcia ma w poniedziałek o 10:00 wizytę w poradni opiekuńczej, by porozmawiać o pomocy w domu.',
      c2: 'Poprosiła, żeby poszedł z nią jeden członek rodziny.',
      c3: 'W liście jest napisane, żeby zabrała listę leków i kartę ubezpieczenia.',
      c4: 'Nie wiadomo jeszcze, czy mama może wziąć wolne w poniedziałek.',
      c5: 'Podobno w poradni jest winda, ale nikt tego nie sprawdził.',
      c6: 'Jeśli nikt nie może pójść, następny wolny termin jest dopiero za sześć tygodni.',
      c7: 'Babcia szybko się męczy, a jazda autobusem do poradni trwa 50 minut w jedną stronę.',
      c8: 'Poradnia musi do piątku wiedzieć, czy wizyta odbędzie się na miejscu, czy przez wideorozmowę.',
      c9: 'Możesz dziś wieczorem zadzwonić do mamy i zapytać o poniedziałek.',
      c10: 'Sąsiadka babci niedawno sprawiła sobie nowego psa.',
      c11: 'Chciałaby, żeby ktoś z rodziny poszedł z nią.',
      c12: 'Moim zdaniem takie poradnie i tak nigdy naprawdę nie pomagają.'
    },
    decisions: {
      right: 'Kto idzie z babcią w poniedziałek – i na miejscu czy przez wideo?',
      notTheirs: 'Jaki rodzaj pomocy w domu powinna dostać babcia?',
      premature: 'Czy babcia powinna przeprowadzić się do domu opieki?'
    },
    actions: {
      concrete: 'Dzwonisz dziś wieczorem do mamy i do środy wieczorem mówisz bratu, kto może pójść.',
      vague: 'Jakoś to załatwimy.',
      outOfScope: 'Zacząć planować przyjęcie urodzinowe babci.'
    }
  },
  cafeFreezer: {
    title: 'Zepsuta zamrażarka w małej kawiarni',
    situation: 'Pracujesz w małej kawiarni. Dziś rano zamrażarka nie mroziła wystarczająco. Właścicielka wraca dopiero jutro. Przygotuj briefing.',
    recipient: 'właścicielka kawiarni',
    cards: {
      c1: 'Kawiarnia sprzedaje domowe lody; w zamrażarce jest zapas na mniej więcej tydzień.',
      c2: 'O 7:00 zamrażarka pokazywała −2 °C zamiast zwykłych −18 °C.',
      c3: 'O 7:30 przenieśliśmy lody do zamrażarki sąsiedniej piekarni.',
      c4: 'Nie wiemy, czy lody rozmroziły się w nocy.',
      c5: 'Serwis prawdopodobnie będzie mógł przyjechać w czwartek.',
      c6: 'Rozmrożonych lodów nie wolno sprzedawać, więc być może będziemy musieli wyrzucić zapas.',
      c7: 'Piekarnia potrzebuje swojego miejsca z powrotem w sobotę, więc nasze lody mogą tam zostać tylko do tego dnia.',
      c8: 'Serwis umówi wizytę dopiero wtedy, gdy właścicielka zatwierdzi opłatę za dojazd w wysokości 90 euro.',
      c9: 'Barista może dziś po południu odczytać rejestr temperatury zamrażarki.',
      c10: 'Nowe tablice z menu przyjdą w przyszłym tygodniu.',
      c11: 'Dziś rano zamrażarka pokazywała −2 °C zamiast −18 °C.',
      c12: 'Ta zamrażarka od pierwszego dnia była złym zakupem.'
    },
    decisions: {
      right: 'Zatwierdzić opłatę za dojazd serwisu w wysokości 90 euro?',
      notTheirs: 'Jakie ciasta ma sprzedawać piekarnia w tym tygodniu?',
      premature: 'Czy kawiarnia powinna całkiem przestać sprzedawać lody?'
    },
    actions: {
      concrete: 'Barista dziś po południu odczytuje rejestr temperatury i do 16:00 wysyła właścicielce wynik SMS-em.',
      vague: 'Będziemy mieć to na oku.',
      outOfScope: 'Zaprojektować na nowo stronę internetową kawiarni.'
    }
  },
  tournament: {
    title: 'Nowe miejsce turnieju szachowego',
    situation: 'Twój klub szachowy organizuje w niedzielę turniej młodzieżowy. Zarezerwowana aula szkolna nie jest już dostępna. Przygotuj briefing.',
    recipient: 'zarząd klubu',
    cards: {
      c1: 'Na niedzielny turniej młodzieżowy zapisało się 48 zawodników z sześciu klubów.',
      c2: 'Szkoła odwołała naszą rezerwację auli z powodu przeciekającego dachu.',
      c3: 'Biblioteka miejska oferuje bezpłatnie swoją salę, ale zmieści tylko 32 zawodników.',
      c4: 'Centrum sportowe może mieć wolną salę, ale jeszcze nie odpowiedziało na nasz e-mail.',
      c5: 'Woźny uważa, że aulę uda się naprawić na czas, ale nikt tego nie potwierdził.',
      c6: 'Jeśli rodziny dowiedzą się o zmianie za późno, część zawodników może przyjechać na stare miejsce.',
      c7: 'Kilka rodzin jedzie ponad 100 km i ma już kupione bilety na pociąg, więc zmiana terminu uderzyłaby w nie najmocniej.',
      c8: 'Zaproszenia z ostatecznym miejscem muszą wyjść do środy.',
      c9: 'Sekretarz klubu może jutro rano zadzwonić do centrum sportowego.',
      c10: 'Gablotę z pucharami klubu umyto w zeszłym miesiącu.',
      c11: 'Szkoła cofnęła naszą rezerwację auli.',
      c12: 'Nigdy nie powinniśmy byli polegać na tej szkole.'
    },
    decisions: {
      right: 'Przenieść turniej w inne miejsce, ograniczyć go do 32 zawodników czy go przełożyć?',
      notTheirs: 'Kiedy szkoła powinna naprawić dach?',
      premature: 'Czy klub powinien zbudować własną siedzibę?'
    },
    actions: {
      concrete: 'Sekretarz dzwoni jutro o 9:00 do centrum sportowego i do 12:00 składa zarządowi relację.',
      vague: 'Poczekajmy, co się trafi.',
      outOfScope: 'Zamówić dla klubu nowe komplety szachów.'
    }
  }
};
