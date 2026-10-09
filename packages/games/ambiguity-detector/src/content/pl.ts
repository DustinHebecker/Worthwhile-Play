import type { LocaleContent } from './items';

export const content: LocaleContent = {
  'finish-tomorrow': {
    context: 'Liderka twojego zespołu pisze do ciebie na czacie zespołu. Pracujesz teraz nad trzema różnymi raportami.',
    text: 'Proszę, skończ to jutro.',
    ask: { what: 'Który z trzech raportów masz na myśli?' },
    given: { when: 'Dzień jest podany: jutro.', who: 'Wiadomość jest skierowana bezpośrednio do ciebie.' },
    replies: {
      clear: 'Jasne. Który z trzech raportów: budżetowy, sprzedażowy czy kadrowy?',
      vague: 'Okej, zrobi się!',
      assume: 'Nie ma sprawy, jutro skończę raport sprzedażowy.'
    }
  },
  'concert-entrance': {
    context: 'Kolega pisze do ciebie o sobotnim koncercie, który zaczyna się o 20:00. Sala ma cztery wejścia.',
    text: 'Spotkajmy się przy wejściu przed koncertem.',
    ask: { when: 'O której się spotykamy, ile przed 20:00?', where: 'Przy którym z czterech wejść?' },
    given: { what: 'Plan jest jasny: spotkanie przed koncertem.' },
    replies: {
      clear: 'Dobry pomysł! Przy którym wejściu i o której? Pasuje 19:30?',
      vague: 'Super, do zobaczenia!',
      rude: 'Zawsze tak piszesz. Bądź choć raz konkretny!'
    }
  },
  'party-photos': {
    context: 'Ciocia pisze do ciebie po rodzinnej imprezie, na której zrobiono około 200 zdjęć twoim aparatem.',
    text: 'Możesz mi wysłać zdjęcia z niedzieli?',
    ask: { what: 'Wszystkie 200 czy tylko niektóre, na przykład te, na których jesteś?', format: 'Jak je wysłać: link do pobrania, e-mail czy odbitki?' },
    given: { who: 'Wiadomo, kto ma je wysłać: ty.' },
    replies: {
      clear: 'Jasne! Wszystkie 200 czy wybrane? I czy link do pobrania ci odpowiada?',
      vague: 'Jasne, kiedyś wyślę.',
      assume: 'Zamówiłem dla ciebie odbitki wszystkich 200 zdjęć.'
    }
  },
  'water-plants': {
    context: 'Sąsiadka wyjeżdża jutro na dwa tygodnie. Masz jej zapasowy klucz.',
    text: 'Czy mógłbyś podlewać rośliny, kiedy mnie nie będzie?',
    ask: { when: 'Jak często je podlewać: codziennie czy dwa razy w tygodniu?', where: 'Które rośliny: w mieszkaniu, na balkonie czy wszystkie?' },
    given: { what: 'Zadanie jest jasne: podlewanie roślin.', who: 'Prośba jest skierowana bezpośrednio do ciebie.' },
    replies: {
      clear: 'Chętnie! Które rośliny i jak często mam je podlewać?',
      vague: 'Jasne, nie ma problemu.',
      assume: 'Jasne, będę co wieczór podlewać rośliny na balkonie.'
    }
  },
  'train-tickets': {
    context: 'Planujecie z przyjaciółką weekend nad morzem. Ona pisze:',
    text: 'Ja zarezerwuję hotel. Możesz zarezerwować pociąg?',
    ask: { when: 'Którego dnia i mniej więcej o której jedziemy tam i z powrotem?' },
    given: { what: 'Zadanie jest jasne: bilety na pociąg na wyjazd.', who: 'To ty masz je zarezerwować.' },
    replies: {
      clear: 'Tak! Którego dnia i o której chcesz wyjechać, i kiedy wracamy?',
      vague: 'Okej, zrobię to.',
      assume: 'Gotowe: piątek, 5:30 rano, pierwsza klasa.'
    }
  },
  'bins-tonight': {
    context: 'Wiadomość na czacie grupowym pięciu współlokatorów.',
    text: 'Ktoś musi dziś wieczorem wynieść śmieci.',
    ask: { who: 'Kto dokładnie robi to dziś? Czyja jest kolej?' },
    given: { what: 'Zadanie jest jasne: wyniesienie śmieci.', when: 'Czas jest podany: dziś wieczorem.' },
    replies: {
      clear: 'Kto to robi dziś wieczorem? Mamy jakiś grafik, który możemy sprawdzić?',
      vague: 'Tak, ktoś powinien.',
      rude: 'Na pewno nie ja. Dogadajcie się sami.'
    }
  },
  'school-form': {
    context: 'Wiadomość od wychowawczyni twojego dziecka w aplikacji szkolnej. W tym tygodniu dziecko przyniosło dwa formularze: na wycieczkę i na zdjęcia klasowe.',
    text: 'Proszę oddać podpisany formularz do czwartku.',
    ask: { what: 'Który formularz ma pani na myśli: ten na wycieczkę czy ten na zdjęcia?', format: 'Mam go oddać na papierze czy jako zdjęcie w aplikacji?' },
    given: { when: 'Termin jest podany: czwartek.' },
    replies: {
      clear: 'Dziękuję! Który formularz: wycieczka czy zdjęcia? I na papierze czy przez aplikację?',
      vague: 'Dobrze, zanotowane.',
      assume: 'Gotowe: podpisałem oba formularze i wysłałem ich zdjęcia.'
    }
  },
  'holiday-keys': {
    context: 'Wynajmujesz mieszkanie na wakacje. Gospodyni pisze do ciebie dzień przed przyjazdem.',
    text: 'Zostawię panu klucze.',
    ask: { where: 'Gdzie dokładnie zostawi pani klucze?' },
    given: { what: 'Wiadomo, o co chodzi: o klucze.', who: 'Gospodyni zostawi je sama.' },
    replies: {
      clear: 'Dziękuję! Gdzie dokładnie będą: w skrytce na klucze czy u sąsiada?',
      vague: 'Super, dziękuję!',
      assume: 'Świetnie, wezmę je spod wycieraczki.'
    }
  },
  'project-slides': {
    context: 'Twoja przełożona pisze do ciebie we wtorek rano.',
    text: 'Możesz przygotować kilka slajdów o projekcie?',
    ask: {
      when: 'Na kiedy potrzebujesz slajdów?',
      audience: 'Kto je zobaczy: zespół, zarząd czy klient?',
      scope: 'Jak obszerne: kilka slajdów czy pełna prezentacja?',
      purpose: 'Jaki jest cel: przedstawienie postępów czy podjęcie decyzji?'
    },
    given: { what: 'Rezultat jest jasny: slajdy o projekcie.', who: 'Prośba jest skierowana bezpośrednio do ciebie.' },
    replies: {
      clear: 'Chętnie. Dla kogo, na kiedy, mniej więcej jak obszerne, i czy mają prowadzić do decyzji, czy tylko informować?',
      vague: 'Jasne, zrobię kilka slajdów.',
      assume: 'Przygotuję 40 slajdów na piątkowe posiedzenie zarządu.'
    }
  },
  'cafe-website': {
    context: 'Właścicielka małej kawiarni pisze do ciebie, projektanta, który zrobił jej stronę internetową.',
    text: 'Strona dziwnie wygląda, możesz to naprawić?',
    ask: {
      what: 'Co dokładnie wygląda źle: tekst, zdjęcia czy układ?',
      where: 'Na której podstronie i na jakim urządzeniu to widzisz?',
      priority: 'Czy to pilne? Czy przez to klienci nie mogą składać zamówień?'
    },
    given: { who: 'Prośba jest do ciebie jako projektanta strony.' },
    replies: {
      clear: 'Przykro mi! Co dokładnie wygląda źle, na której podstronie i jakim urządzeniu? I czy przez to klienci nie mogą zamawiać?',
      vague: 'Zerknę na to.',
      assume: 'W tym tygodniu zaprojektuję całą stronę od nowa.'
    }
  },
  'walk-report': {
    context: 'Prezeska twojego klubu turystycznego pisze do ciebie po wiosennej wycieczce.',
    text: 'Czy mógłbyś napisać krótką relację z wycieczki?',
    ask: {
      when: 'Na kiedy potrzebujesz relacji?',
      format: 'Sam tekst czy ze zdjęciami? Do druku czy na stronę?',
      audience: 'Kto będzie ją czytał: członkowie klubu czy lokalna gazeta?'
    },
    given: { what: 'Rezultat jest jasny: relacja z wycieczki.', scope: '„Krótka” daje przybliżoną długość; liczbę słów nadal można doprecyzować.' },
    replies: {
      clear: 'Chętnie! Dla kogo jest, na kiedy jej potrzebujesz i czy dodać zdjęcia?',
      vague: 'Okej, coś napiszę.',
      assume: 'Jutro wyślę do gazety trzystronicową relację z 50 zdjęciami.'
    }
  },
  'office-paper': {
    context: 'Kierowniczka biura pisze na kanale zespołu.',
    text: 'Kończy się papier do drukarki, niech ktoś zamówi więcej.',
    ask: {
      when: 'Na kiedy go potrzebujemy?',
      who: 'Kto ma złożyć zamówienie?',
      scope: 'Ile mamy zamówić?'
    },
    given: { what: 'Wiadomo, czego brakuje: papieru do drukarki.' },
    replies: {
      clear: 'Mogę zamówić. Ile ryz i na kiedy ich potrzebujemy?',
      vague: 'Tak, ktoś powinien.',
      assume: 'Zamówiłem 100 kartonów; dotrą w przyszłym miesiącu.'
    }
  },
  'anniversary': {
    context: 'Dzwoni do ciebie partner. Za dwa miesiące jego rodzice obchodzą 40. rocznicę ślubu.',
    text: 'Powinniśmy coś zorganizować dla moich rodziców.',
    ask: {
      what: 'O czym myślisz: o kolacji, przyjęciu czy prezencie?',
      when: 'Kiedy: w sam dzień rocznicy czy w pobliski weekend?',
      who: 'Kto zajmuje się czym: ty, ja, twoje rodzeństwo?',
      scope: 'W jakiej skali: tylko rodzina czy wielu gości?'
    },
    given: { audience: 'Wiadomo, dla kogo: dla rodziców.', purpose: 'Okazja jest jasna: 40. rocznica ślubu.' },
    replies: {
      clear: 'Świetny pomysł! O czym myślisz, kiedy, dla ilu osób i kto co robi?',
      vague: 'Tak, powinniśmy.',
      assume: 'Zarezerwowałem restaurację dla 60 osób na przyszłą sobotę.'
    }
  },
  'customer-reply': {
    context: 'Przełożona przekazuje ci reklamację klienta, którego dostawa spóźnia się o dwa tygodnie.',
    text: 'Proszę, odezwij się do klienta.',
    ask: {
      what: 'Co mogę zaproponować: przeprosiny, rabat, nowy termin dostawy?',
      when: 'Jak szybko: jeszcze dziś?',
      format: 'Mam zadzwonić czy napisać?'
    },
    given: { audience: 'Wiadomo, do kogo: do klienta.', purpose: 'Powód jest jasny: spóźniona dostawa.' },
    replies: {
      clear: 'Zrobię to. Zadzwonić czy napisać, do kiedy i co mogę mu zaproponować?',
      vague: 'Okej.',
      assume: 'Obiecałem klientowi pełny zwrot pieniędzy i darmową wysyłkę przez rok.'
    }
  },
  'shop-translation': {
    context: 'Przyjaciółka, która prowadzi mały sklep internetowy, pisze do ciebie, bo znasz hiszpański.',
    text: 'Czy mógłbyś przetłumaczyć teksty z mojego sklepu?',
    ask: {
      when: 'Na kiedy potrzebujesz tłumaczenia?',
      audience: 'Twoi klienci są w Hiszpanii czy w Ameryce Łacińskiej?',
      scope: 'Które teksty i ile: opisy produktów, cała strona?'
    },
    given: { what: 'Zadanie jest jasne: tłumaczenie na hiszpański.', who: 'Prośba jest skierowana bezpośrednio do ciebie.' },
    replies: {
      clear: 'Chętnie pomogę! Które teksty, na kiedy i czy twoi klienci są w Hiszpanii, czy w Ameryce Łacińskiej?',
      vague: 'Jasne, podeślij kiedyś.',
      assume: 'Jasne, do jutra przetłumaczę całą stronę na hiszpański, portugalski i francuski.'
    }
  },
  'basement': {
    context: 'Dozorca twojego bloku pisze do wszystkich mieszkańców.',
    text: 'Proszę zabrać swoje rzeczy z piwnicy.',
    ask: {
      when: 'Do kiedy piwnica ma być pusta?',
      where: 'Gdzie możemy w tym czasie przechować swoje rzeczy?',
      purpose: 'Jaki jest powód i czy to tylko na jakiś czas?'
    },
    given: { what: 'Wiadomo, o co chodzi: o własne rzeczy w piwnicy.', who: 'Prośba dotyczy wszystkich mieszkańców.' },
    replies: {
      clear: 'Dziękuję za informację. Do kiedy, z jakiego powodu i czy jest miejsce, gdzie możemy w tym czasie przechować rzeczy?',
      vague: 'Okej.',
      rude: 'Niczego nie będę wynosić. Proszę znaleźć inne rozwiązanie.'
    }
  },
  'board-report': {
    context: 'Przełożona pisze do ciebie w środę. W zeszłym tygodniu powiedziała, że raport kwartalny trafi do zarządu i może mieć najwyżej dwie strony.',
    text: 'Proszę, wyślij mi raport do piątku.',
    ask: {
      format: 'Chcesz plik edytowalny czy PDF?',
      criterion: 'Jakie liczby lub sekcje musi zawierać, żeby był kompletny?'
    },
    given: {
      what: 'Wiadomo, o który raport chodzi: kwartalny.',
      when: 'Termin jest podany: piątek.',
      audience: 'Powiedziane wcześniej: raport trafi do zarządu.',
      scope: 'Powiedziane wcześniej: najwyżej dwie strony.'
    },
    replies: {
      clear: 'Zrobię to. Jakie sekcje muszą się w nim znaleźć i chcesz plik edytowalny czy PDF?',
      vague: 'Jasne, do piątku.',
      redundant: 'Dla kogo jest, jak długi ma być i o który raport chodzi?'
    }
  },
  'school-pickup': {
    context: 'Pisze do ciebie siostra. Jej dwoje dzieci kończy lekcje codziennie o 15:00; we wtorki starsze ma trening piłki nożnej do 17:00.',
    text: 'Możesz odebrać dzieci we wtorek?',
    ask: {
      where: 'Dokąd mam je potem zawieźć: do ciebie czy do mnie?',
      scope: 'Oboje czy tylko młodsze, skoro starsze ma piłkę?'
    },
    given: { when: 'Wiadomo z sytuacji: lekcje kończą się o 15:00.', who: 'Prośba jest skierowana bezpośrednio do ciebie.' },
    replies: {
      clear: 'Tak, mogę. Oboje czy tylko młodsze? I mam je zawieźć do ciebie czy do mnie?',
      vague: 'Tak, jasne.',
      redundant: 'O której kończą lekcje i którego dnia?'
    }
  },
  'checkout-bug': {
    context: 'Menedżerka produktu komentuje w systemie zgłoszeń zespołu zgłoszenie zatytułowane „Przycisk płatności nie działa na telefonach od aktualizacji 2.3”.',
    text: 'Pilne, proszę naprawić jak najszybciej.',
    ask: {
      who: 'Kto z zespołu się tym zajmie?',
      criterion: 'Na jakich telefonach i przeglądarkach ma działać, zanim zamkniemy zgłoszenie?'
    },
    given: {
      what: 'Tytuł zgłoszenia nazywa problem.',
      where: 'Tytuł mówi, gdzie: na telefonach.',
      priority: '„Pilne” jasno określa priorytet.'
    },
    replies: {
      clear: 'Zajmujemy się tym. Kto to bierze? I które telefony i przeglądarki musimy przetestować przed zamknięciem zgłoszenia?',
      vague: 'Przyjrzymy się temu.',
      redundant: 'Co dokładnie nie działa i czy to pilne?'
    }
  },
  'client-room': {
    context: 'Pisze do ciebie koleżanka Ana. W przyszłym tygodniu odwiedzi ją dwóch klientów; będą tylko w trójkę.',
    text: 'Czy możesz zarezerwować mi salę konferencyjną na przyszły tydzień?',
    ask: {
      when: 'Na który dzień, na którą godzinę i na jak długo?',
      format: 'Potrzebujesz ekranu albo sprzętu do wideokonferencji?'
    },
    given: {
      what: 'Zadanie jest jasne: rezerwacja sali konferencyjnej.',
      who: 'To ty masz ją zarezerwować.',
      scope: 'Wiadomo z sytuacji: trzy osoby.'
    },
    replies: {
      clear: 'Jasne. Który dzień i która godzina, na jak długo i czy potrzebujesz ekranu?',
      vague: 'Okej, coś zarezerwuję.',
      redundant: 'Ile osób przyjdzie i do czego potrzebujesz sali?'
    }
  },
  'newsletter': {
    context: 'Pisze do ciebie redaktor biuletynu twojego klubu sportowego. Biuletyn trafia do wszystkich członków w pierwszy poniedziałek miesiąca; każdy artykuł ma około 200 słów.',
    text: 'Czy mógłbyś napisać coś o nowych godzinach treningów?',
    ask: {
      what: 'Podać cały nowy grafik czy tylko to, co się zmieniło?',
      when: 'Na kiedy potrzebujesz mojego tekstu? Data wydania biuletynu to nie mój termin oddania.'
    },
    given: { audience: 'Wiadomo z sytuacji: wszyscy członkowie klubu.', scope: 'Wiadomo z sytuacji: około 200 słów.' },
    replies: {
      clear: 'Chętnie. Na kiedy go potrzebujesz i czy podać cały grafik, czy tylko zmiany?',
      vague: 'Jasne, coś napiszę.',
      redundant: 'Kto czyta biuletyn i jak długi ma być tekst?'
    }
  },
  'airport': {
    context: 'Kuzynka przysyła ci dane lotu: lądowanie w sobotę o 14:20, terminal 2. Zatrzyma się u ciebie na tydzień.',
    text: 'Możesz mnie odebrać?',
    ask: { scope: 'Przylatujesz sama i ile masz bagażu? Zmieści się do małego auta?' },
    given: {
      when: 'Wiadomo z danych lotu: sobota, 14:20.',
      where: 'Wiadomo z danych lotu: terminal 2.',
      purpose: 'Wiadomo z sytuacji: zatrzyma się u ciebie, więc cel jest jasny.'
    },
    replies: {
      clear: 'Jasne! Przylatujesz sama i ile masz bagażu?',
      vague: 'Tak, do zobaczenia.',
      redundant: 'Kiedy lądujesz i na którym terminalu?'
    }
  },
  'contract-check': {
    context: 'Kolega z działu zakupów przysyła ci mailem 30-stronicową umowę z dostawcą. Temat: „Proszę sprawdzić punkt 7 (odpowiedzialność) do czwartku do 12:00”.',
    text: 'Zerknij na to, proszę.',
    ask: {
      format: 'W jakiej formie chcesz moją opinię: komentarze w dokumencie czy krótki e-mail?',
      criterion: 'Na co mam zwrócić uwagę: ryzyka, niejasne sformułowania czy kwoty?'
    },
    given: { what: 'Temat wskazuje część: punkt 7.', when: 'Temat wskazuje termin: czwartek do 12:00.' },
    replies: {
      clear: 'Zrobię to do czwartku do 12:00. Na czym mam się skupić w punkcie 7 i wolisz komentarze w pliku czy krótkie podsumowanie?',
      vague: 'Zerknę.',
      redundant: 'Którą część mam przeczytać i na kiedy?'
    }
  },
  'shared-dinner': {
    context: 'Lina pisze na czacie grupowym czworga przyjaciół. Dziś wszyscy umówili się na kolację u niej w sobotę o 19:00.',
    text: 'Czy każdy może coś przynieść?',
    ask: {
      what: 'Co przynosi każde z nas: przystawkę, deser czy napoje?',
      criterion: 'Czy jest coś, czego ktoś nie może albo nie je?'
    },
    given: { when: 'Już ustalone: sobota, 19:00.', where: 'Już ustalone: u Liny.' },
    replies: {
      clear: 'Chętnie! Podzielimy się na przystawkę, deser i napoje? I czy jest coś, czego ktoś nie może jeść?',
      vague: 'Jasne, coś przyniosę.',
      redundant: 'Gdzie się spotykamy i o której?'
    }
  }
};
