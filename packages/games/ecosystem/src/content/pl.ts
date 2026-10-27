import type { ContentText } from './types';

export const content: ContentText = {
  weeks: { one: '{n} tydzień', few: '{n} tygodnie', many: '{n} tygodni', other: '{n} tygodnia' },
  species: {
    algae: { name: 'Zielenice', about: 'Drobne rośliny unoszące się w wodzie. Szybko rosną dzięki składnikom odżywczym i światłu; jedzą je rozwielitki i ślimaki. Dużo glonów barwi wodę na zielono i zacienia rośliny pod spodem.' },
    bluegreen: { name: 'Sinice', about: 'Właściwie bakterie (cyjanobakterie). Rosną powoli, potrzebują żyznej wody i prawie nikt ich nie je, więc zakwitają, gdy gromadzą się składniki odżywcze.' },
    duckweed: { name: 'Rzęsa wodna', about: 'Małe pływające listki. W żyznej wodzie pokrywają powierzchnię i zacieniają wszystko pod spodem.' },
    pondweed: { name: 'Rdestnica', about: 'Rośliny podwodne zakorzenione w mule. Potrzebują czystej wody, by dostać światło, zabierają glonom składniki odżywcze i dają rozwielitkom kryjówkę przed rybami.' },
    fleas: { name: 'Rozwielitki', about: 'Drobne skorupiaki (dafnie), które wyjadają glony. Jedzą je małe ryby, ale w rdestnicy i w mule wiele z nich jest poza zasięgiem.' },
    snails: { name: 'Błotniarki', about: 'Te ślimaki jedzą szczątki martwych roślin i trochę glonów. Małe ryby zjadają część z nich.' },
    minnows: { name: 'Małe ryby', about: 'Polują na rozwielitki i trochę ślimaków. Ich młode rosną około sześciu tygodni. Zjadają je szczupaki.' },
    pike: { name: 'Szczupaki', about: 'Duży drapieżnik, który zjada małe ryby. Młode szczupaki rosną około dwudziestu tygodni.' },
    grass: { name: 'Trawy', about: 'Wysokie i szybko rosnące na żyznej glebie. Zacieniają niskie rośliny i zużywają dużo wody.' },
    flowers: { name: 'Dzikie kwiaty', about: 'Niskie rośliny, którym dobrze na ubogiej glebie. Potrzebują światła, więc wysoka trawa je wypiera. Jedzą je mszyce i króliki.' },
    clover: { name: 'Koniczyna', about: 'Niska roślina, która sama pobiera azot z powietrza, mniej na żyznej glebie. Jej obumarłe liście użyźniają glebę dla sąsiadów. Króliki lubią ją najbardziej.' },
    aphids: { name: 'Mszyce', about: 'Drobne owady wysysające sok roślin, głównie dzikich kwiatów. Mnożą się bardzo szybko. Jedzą je biedronki.' },
    ladybirds: { name: 'Biedronki', about: 'Chrząszcze, które jedzą mszyce. Ich larwy rosną około trzech tygodni, więc reagują na przybytek mszyc z opóźnieniem.' },
    rabbits: { name: 'Króliki', about: 'Najpierw jedzą koniczynę, potem dzikie kwiaty i trawę. Młode rosną około pięciu tygodni. Polują na nie lisy; niektóre zawsze są bezpieczne w norach.' },
    foxes: { name: 'Lisy', about: 'Polują na króliki. Młode lisy rosną około pół roku.' },
    worms: { name: 'Dżdżownice', about: 'Jedzą opadłe liście i zamieniają je z powrotem w składniki odżywcze dla roślin.' }
  },
  challenges: {
    'fleas-arrive': {
      title: 'Przybywają rozwielitki',
      situation: 'Młody staw ma tylko zielenice. Ptak przynosi do niego rozwielitki.',
      think: 'Kto je glony? Co się dzieje z rozwielitkami, gdy glonów ubywa?',
      explain: 'Rozwielitki mnożą się na glonach, aż jedzą tak szybko, jak glony rosną. Od tej chwili o ilości glonów decydują rozwielitki, a nie składniki odżywcze: pętla równoważąca (B1). Woda staje się czysta i taka zostaje.',
      real: 'W prawdziwych stawach ryby i pory roku zwykle nie pozwalają, by było tak równo.'
    },
    'enrich-swings': {
      title: 'Więcej jedzenia dla wszystkich',
      situation: 'Silny spływ z pola zaczyna nawozić staw z glonami i rozwielitkami.',
      think: 'Więcej składników odżywczych to więcej glonów. Co robią rozwielitki z większą ilością glonów, a co potem robią glony?',
      explain: 'Więcej składników odżywczych pozwala glonom wyrwać się do przodu; rozwielitki idą za nimi, zjadają glony, a potem głodują; glony się odbudowują i wszystko zaczyna się od nowa. Żyźniejsza woda sprawiła, że układ zaczął się wahać, zamiast się ustabilizować. Ekolodzy nazywają to paradoksem wzbogacenia (B1).',
      real: 'W prawdziwych stawach dużo więcej gatunków i pory roku tłumią lub zmieniają te wahania.'
    },
    'fish-stocked': {
      title: 'Ryby w stawie',
      situation: 'Ktoś wpuszcza małe ryby do stawu, w którym ich nie było.',
      think: 'Ryby jedzą rozwielitki. Kto je glony i co się z nimi stanie?',
      explain: 'Ryby zjadają rozwielitki, więc mniej rozwielitek wyjada glony, a glony rosną. Zmiana na górze sięga dna łańcucha pokarmowego: kaskada troficzna. Narasta powoli, bo młode ryby rosną tygodniami.',
      real: 'W prawdziwych stawach ryby wzburzają też muł, przez co woda mętnieje jeszcze bardziej.'
    },
    'pike-return': {
      title: 'Szczupaki wracają',
      situation: 'Kilka młodych szczupaków zostaje wpuszczonych do stawu pełnego małych ryb.',
      think: 'Podążaj za łańcuchem: szczupaki, małe ryby, rozwielitki, glony.',
      explain: 'Szczupaki zjadają małe ryby; mniej małych ryb zostawia więcej rozwielitek; więcej rozwielitek zjada więcej glonów. Każdy krok odwraca kierunek, więc glonów ubywa. Trwa to długo, bo młode szczupaki rosną około dwudziestu tygodni.',
      real: 'W prawdziwych jeziorach odławia się małe ryby lub wpuszcza szczupaki, by oczyścić wodę, ze zmiennym i często krótkotrwałym skutkiem.'
    },
    'algae-treatment': {
      title: 'Szybki sposób na zieloną wodę',
      situation: 'Staw zostaje potraktowany środkiem: dziewięć na dziesięć glonów ginie i opada, ale zostaje w wodzie.',
      think: 'Dokąd trafiają składniki odżywcze z martwych glonów? I co się stało z rozwielitkami, gdy glonów brakowało?',
      explain: 'Martwe glony gniją w kilka dni i oddają składniki odżywcze wodzie. Rozwielitki głodowały, gdy glonów brakowało, więc przez jakiś czas nikt nie trzyma glonów w ryzach i przerastają dawny poziom. Sposób, który usuwa objaw, ale nie składniki odżywcze, nie działa długo.',
      real: 'W prawdziwych stawach gnijące glony zużywają też tlen, co może szkodzić rybom.'
    },
    'slow-runoff': {
      title: 'Pole w górze rzeki',
      situation: 'Nowe pole w górze rzeki zaczyna odprowadzać wodę do czystego stawu.',
      think: 'Co więcej składników odżywczych robi z glonami, a co więcej glonów robi z rdestnicą pod nimi?',
      explain: 'Przez miesiące wydaje się, że nic się nie dzieje: rdestnica nawet po pół roku wygląda dobrze. Tymczasem składniki odżywcze gromadzą się w wodzie i w mule, aż rzęsa wodna i sinice, którym potrzebna jest żyzna woda, gwałtownie rosną i zacieniają rdestnicę. Wtedy władzę przejmuje pętla wzmacniająca: mniej rdestnicy, więcej glonów, więcej cienia (R1). Przełom jest szybki; przyczyna była powolna.',
      real: 'W prawdziwych jeziorach takie przejścia od czystej do zielonej wody są dobrze opisane, często po latach powolnych zmian.'
    },
    'no-way-back': {
      title: 'Spływ ustaje',
      situation: 'Dwa lata później spływ zostaje całkiem zatrzymany. Czy rdestnica wróci?',
      think: 'Czy została jakaś rdestnica, która mogłaby odrosnąć? Co teraz utrzymuje wodę zieloną?',
      explain: 'Zatrzymanie spływu usuwa przyczynę, ale staw pozostaje zielony: glony zacieniają dno, a nie została żadna rdestnica, która mogłaby odrosnąć. Pętla wzmacniająca (R1) trzyma teraz staw w zielonym stanie. Powrót wymaga więcej niż cofnięcia zmiany, na przykład ponownego posadzenia rdestnicy.',
      real: 'W prawdziwych jeziorach odbudowa po odcięciu składników odżywczych często trwa wiele lat, a rośliny czasem sadzi się na nowo.'
    },
    shade: {
      title: 'Drzewo nad stawem',
      situation: 'Nad stawem wyrasta drzewo i go zacienia.',
      think: 'Rdestnica potrzebuje światła przy dnie. Co jeszcze odbiera jej światło?',
      explain: 'Mniej światła spowalnia rdestnicę, więc słabiej powstrzymuje glony. Glony i rozwielitki zaczynają się wahać, a każdy wybuch glonów jeszcze bardziej zacienia rdestnicę (R1): spada krok po kroku.',
      real: 'W prawdziwych stawach opadające liście drzewa także dostarczałyby składników odżywczych.'
    },
    spray: {
      title: 'Oprysk przeciw mszycom',
      situation: 'Łąka zostaje opryskana przeciw mszycom: ginie dziewięć na dziesięć mszyc i także dziewięć na dziesięć biedronek.',
      think: 'Kto szybciej się odbuduje: mszyce czy biedronki, które je jedzą?',
      explain: 'Oprysk zabił mszyce i biedronki, które je jedzą. Mszyce mnożą się dużo szybciej niż biedronki, więc wróciły pierwsze i nikt ich nie zatrzymał, a zapłaciły za to dzikie kwiaty. Ekolodzy nazywają to nawrotem szkodników (B2 z opóźnieniem).',
      real: 'Na prawdziwych polach opryski szkodzą też pszczołom i innym owadom, a szkodniki mogą się uodpornić.'
    },
    'no-foxes': {
      title: 'Lisy odchodzą',
      situation: 'Lisy opuszczają łąkę.',
      think: 'Kto trzymał króliki w ryzach? Co najpierw zjadają króliki, gdy jest ich więcej?',
      explain: 'Bez lisów znika pętla równoważąca, która trzymała króliki w ryzach (B2). Króliki się mnożą i zjadają koniczynę, swój ulubiony pokarm, aż niewiele z niej zostaje.',
      real: 'W prawdziwym krajobrazie króliki też się przenoszą, a choroby mogą zmniejszyć ich liczbę.'
    },
    fertilise: {
      title: 'Trochę nawozu',
      situation: 'Rolnik co tydzień rozsypuje trochę nawozu.',
      think: 'Która roślina najwięcej zyskuje na żyznej glebie i co robi z niskimi roślinami?',
      explain: 'Nawóz karmi przede wszystkim trawy. Wyższa trawa zacienia niską koniczynę, a koniczyna traci swoją przewagę: na żyznej glebie samodzielne wytwarzanie azotu już nie pomaga. Więcej jedzenia dla łąki nie oznacza więcej każdej rośliny.',
      real: 'Na prawdziwych łąkach azot z nawozów i z powietrza jest jedną z głównych przyczyn znikania dzikich kwiatów.'
    },
    drought: {
      title: 'Suche lato',
      situation: 'Dwanaście suchych tygodni, potem znów zwykły deszcz.',
      think: 'Czego trawy potrzebują oprócz składników odżywczych? Co się dzieje, gdy wraca deszcz?',
      explain: 'Bez deszczu gleba wysycha, a trawy rosną wolniej i się kurczą. Gdy deszcz wraca, gleba się napełnia i trawy odrastają, nawet ponad dawny poziom, bo w glebie nagromadziły się składniki odżywcze, których nie mogły wykorzystać.',
      real: 'Na prawdziwych łąkach długa susza może też zabić rośliny i zrobić miejsce innym.'
    },
    'clover-poor': {
      title: 'Koniczyna dla ubogiej łąki',
      situation: 'Na ubogiej łące z dzikimi kwiatami wysiewa się koniczynę.',
      think: 'Koniczyna pobiera azot z powietrza. Dokąd trafia ten azot, gdy jej liście obumierają?',
      explain: 'Koniczyna wnosi na łąkę nowy azot. Gdy jej liście obumierają, dżdżownice zamieniają je w składniki odżywcze, z których korzystają dzikie kwiaty. Sąsiedzi zyskują, powoli, przez glebę: łańcuch z opóźnieniem.',
      real: 'W prawdziwym rolnictwie koniczynę wysiewa się właśnie z tego powodu.'
    },
    'worms-gone': {
      title: 'Gdzie są dżdżownice?',
      situation: 'Dżdżownice znikają z łąki.',
      think: 'Kto zamienia opadłe liście z powrotem w pokarm dla roślin? Która roślina od tego nie zależy?',
      explain: 'Bez dżdżownic opadłe liście się gromadzą, a ich składniki odżywcze zostają w nich zamknięte. Trawy głodują. Koniczyna sama wytwarza azot, więc zyskuje: skutek uboczny, którego mało kto się spodziewa.',
      real: 'W prawdziwej glebie opadłe liście rozkłada o wiele więcej zwierząt, grzybów i bakterii.'
    },
    'foxes-return': {
      title: 'Lisy wracają',
      situation: 'Lisy wracają na łąkę opanowaną przez króliki.',
      think: 'Jak długo młode lisy rosną? Co mniej królików oznacza dla koniczyny?',
      explain: 'Na początku niewiele się dzieje: młode lisy rosną około pół roku. Potem lisy zmniejszają liczbę królików (B2), a koniczyna, uwolniona od zgryzania, powoli wraca. Skutek przychodzi lata po przyczynie.',
      real: 'W prawdziwym krajobrazie lisy polują też na inne zwierzęta, a króliki znajdują nowe miejsca do życia.'
    },
    'ladybirds-gone': {
      title: 'Zebrane biedronki',
      situation: 'Większość biedronek zostaje zebrana do ogrodu gdzie indziej.',
      think: 'Kto je mszyce? I czego potrzebują mszyce, żeby dalej się mnożyć?',
      explain: 'Bez biedronek mszyce się mnożą i objadają dzikie kwiaty. Gdy pokarmu jest mniej, mszyc znów ubywa (B1): tu hamuje je pokarm, a nie drapieżniki. Pozostałych biedronek jeszcze przez miesiące jest niewiele.',
      real: 'W prawdziwych ogrodach pomagają też inni łowcy mszyc, na przykład bzygi i ptaki.'
    }
  },
  goals: {
    'save-pondweed': {
      story: 'Nowe pole w górze rzeki zaczyna odprowadzać wodę do czystego stawu. Utrzymaj rdestnicę przy życiu przez dwa lata, gdy spływ trwa.',
      target: 'Rdestnica co najmniej {v} w każdym tygodniu do tygodnia {w}.',
      hint: 'Glony to objaw. Co je karmi i jak szybko trzeba to zmienić?',
      explain: 'Rdestnicy ubywa dopiero wtedy, gdy coś ją zacienia: rzęsa wodna i glony, które rosną dzięki składnikom odżywczym z pola. Działaj na przyczynę, i to wcześnie: gdy rdestnica wygląda słabo, pętla wzmacniająca już przejęła władzę.',
      plans: {
        buffer: 'Pas roślin wzdłuż pola zatrzymuje większość spływu, zanim dotrze do stawu. Posadzony w porę sprawia, że glony nigdy nie wychodzą na prowadzenie.',
        ditch: 'Zamknięcie rowu całkiem zatrzymuje spływ, więc glony nigdy nie wychodzą na prowadzenie.'
      }
    },
    'clear-pond': {
      story: 'Po dwóch latach spływu staw zrobił się zielony. Przywróć czystą wodę z rosnącą rdestnicą na dwanaście tygodni z rzędu.',
      target: 'Glony (zielenice i sinice) najwyżej {v} i rdestnica co najmniej {p}, dwanaście tygodni z rzędu, do tygodnia {w}.',
      hint: 'Glony to objaw. Co je karmi? I co utrzyma je nisko, gdy woda już będzie czysta?',
      explain: 'Zielony stan sam się podtrzymuje: glony zacieniają rośliny, które by je powstrzymały. Aby oczyścić wodę, trzeba usunąć przyczynę (spływ), wyjąć lub wypłukać zgromadzone składniki odżywcze i przywrócić rdestnicę, by pętla wzmacniająca obróciła się w stronę czystej wody.',
      plans: {
        restore: 'Zatrzymaj spływ, wybierz żyzny muł, posadź rdestnicę i wyłów większość małych ryb (by więcej rozwielitek wyjadało glony). Razem obracają pętlę w stronę czystej wody.',
        flush: 'Zatrzymaj spływ i na jakiś czas puść strumień, by wypłukał składniki odżywcze i glony, a potem posadź rdestnicę w czystej wodzie.'
      }
    },
    'protect-flowers': {
      story: 'Sąsiad właśnie opryskał łąkę: zginęła większość mszyc i większość biedronek. Zachowaj dzikie kwiaty przez rok.',
      target: 'Dzikie kwiaty co najmniej {v} w każdym tygodniu do tygodnia {w}.',
      hint: 'Mszyce wracają szybciej niż biedronki. Kiedy nowe biedronki znalazłyby coś do jedzenia?',
      explain: 'Mszyce odbudowują się przed swoimi łowcami. Biedronki wypuszczone za wcześnie głodują, bo mszyc jeszcze nie ma; wypuszczone za późno trafiają na zjedzone już kwiaty. Rozstrzyga moment.',
      plans: {
        ladybirds: 'Wypuszczone po około dziesięciu tygodniach, gdy mszyce już wróciły, ale przed szczytem, biedronki od razu znajdują pokarm i w porę zatrzymują mszyce.'
      }
    },
    'bring-back-clover': {
      story: 'Bez lisów króliki prawie wyjadły koniczynę. Przywróć koniczynę na osiem tygodni z rzędu w ciągu czterech lat.',
      target: 'Koniczyna co najmniej {v}, osiem tygodni z rzędu, do tygodnia {w}.',
      hint: 'Usuwanie królików pomaga tylko na chwilę. Co trzymało je w ryzach wcześniej?',
      explain: 'Króliki mnożą się szybko, więc usunięcie części daje tylko czas. Trwała zmiana wymaga powrotu pętli równoważącej: lisów. Młode lisy rosną pół roku, więc koniczyna wraca dopiero po latach.',
      plans: {
        foxes: 'Same lisy wystarczą, ale trzeba cierpliwości: zmniejszają liczbę królików powoli.',
        foxesRabbits: 'Lisy plus przesiedlenie połowy królików: lisy mają mniej królików do dogonienia.',
        foxesRabbitsClover: 'Lisy, przesiedlenie większości królików i wysiew koniczyny: najszybsza droga, bo koniczyna zyskuje przewagę, gdy lisy dorastają.'
      }
    }
  },
  loops: {
    graze: 'Rozwielitki wyjadają glony; mniej glonów, mniej rozwielitek.',
    fishFleas: 'Małe ryby jedzą rozwielitki; mniej rozwielitek, mniej młodych ryb.',
    pikeFish: 'Szczupaki jedzą małe ryby; mniej małych ryb, mniej młodych szczupaków.',
    clearWater: 'Glony zacieniają rdestnicę; rdestnica powstrzymuje glony. Kto prowadzi, ten odskakuje jeszcze bardziej.',
    shelter: 'Rdestnica ukrywa rozwielitki przed rybami, a rozwielitki jedzą glony.',
    recycle: 'Martwe glony gniją i karmią nowe glony.',
    aphidsFlowers: 'Mszyce żyją z dzikich kwiatów; mniej kwiatów, mniej mszyc.',
    ladybirdsAphids: 'Biedronki jedzą mszyce; mniej mszyc, mniej młodych biedronek.',
    rabbitsClover: 'Króliki zjadają koniczynę; mniej koniczyny, mniej młodych królików.',
    foxesRabbits: 'Lisy polują na króliki; mniej królików, mniej młodych lisów.',
    thirst: 'Trawy zużywają wodę z gleby; sucha gleba spowalnia trawy.',
    wormsDead: 'Dżdżownice jedzą opadłe liście; mniej liści, mniej dżdżownic.',
    flowerUptake: 'Dzikie kwiaty pobierają składniki odżywcze, z których rosną.'
  }
};
