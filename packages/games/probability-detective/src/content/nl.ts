import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'Het blauwe pakket',
      story: 'Bij de winkel op de hoek is een pakket zonder afzender aangekomen. Het moet komen uit een van de magazijnen die deze straat beleveren.',
      lead: 'Pakketten in deze straat komen uit:',
      hyps: { north: 'Magazijn Noord', south: 'Magazijn Zuid', east: 'Magazijn Oost' },
      clues: {
        blue: { label: 'In blauw papier verpakt', seen: 'Het pakket is in blauw papier verpakt.', notSeen: 'Het pakket is niet in blauw papier verpakt.' },
        'brown-tape': { label: 'Met bruine tape dichtgeplakt', seen: 'Het is met bruine tape dichtgeplakt.', notSeen: 'Het is niet met bruine tape dichtgeplakt.' },
        smudge: { label: 'Uitgelopen etiket', seen: 'Het adresetiket is uitgelopen.', notSeen: 'Het adresetiket is schoon.' },
        string: { label: 'Met touw dichtgebonden', seen: 'Het is met touw dichtgebonden.', notSeen: 'Het is niet met touw dichtgebonden.' },
        tuesday: { label: 'Op een dinsdag aangekomen', seen: 'Het kwam op een dinsdag. Alle magazijnen leveren op elke werkdag.', notSeen: 'Het kwam op een dinsdag. Alle magazijnen leveren op elke werkdag.' },
        'echo-blue': { label: 'De buurvrouw zag het ook', seen: 'De buurvrouw zegt ook dat het pakket blauw was – ze zag hetzelfde pakket.', notSeen: 'De buurvrouw zegt ook dat het pakket blauw was – ze zag hetzelfde pakket.' }
      }
    },
    'c-garden': {
      title: 'De aangevreten aardbeien',
      story: 'Vannacht is er iemand aan de aardbeien geweest. In deze tuin snoepen een paar soorten bezoekers ervan.',
      lead: 'In nachten waarin aardbeien worden aangevreten, is de bezoeker:',
      hyps: { birds: 'Vogels', snails: 'Slakken', hedgehog: 'Een egel' },
      clues: {
        slime: { label: 'Glanzend spoor', seen: 'Er ligt een glanzend spoor op het pad.', notSeen: 'Er is geen glanzend spoor.' },
        pecks: { label: 'Kleine pikgaatjes', seen: 'De vruchten hebben kleine pikgaatjes.', notSeen: 'Er zijn geen pikgaatjes.' },
        droppings: { label: 'Keutels onder de heg', seen: 'Er liggen keutels onder de heg.', notSeen: 'Onder de heg ligt niets.' },
        'net-moved': { label: 'Net opzij geschoven', seen: 'Het net over het bed is opzij geschoven.', notSeen: 'Het net ligt nog op zijn plaats.' },
        rain: { label: 'Het regende vannacht', seen: 'Het regende vannacht – bij regen komen ze allemaal naar buiten.', notSeen: 'Het regende vannacht – bij regen komen ze allemaal naar buiten.' },
        'echo-slime': { label: 'Ook ’s ochtends gezien', seen: 'Je buurman wijst je op hetzelfde glanzende spoor.', notSeen: 'Je buurman wijst je op hetzelfde glanzende spoor.' }
      }
    },
    'c-cups': {
      title: 'Het gebarsten kopje',
      story: 'Iemand brengt een kopje met een haarscheurtje terug. Alle machines in de werkplaats maken hetzelfde kopje, maar elke machine heeft haar eigenaardigheden.',
      lead: 'De kopjes van de werkplaats komen van:',
      hyps: { a: 'Machine A', b: 'Machine B', c: 'Machine C' },
      clues: {
        crack: { label: 'Haarscheurtje', seen: 'Het kopje heeft een haarscheurtje.', notSeen: 'Het kopje heeft een haarscheurtje.' },
        glaze: { label: 'Donkerder glazuur', seen: 'Het glazuur is iets donkerder dan normaal.', notSeen: 'Het glazuur ziet er normaal uit.' },
        stamp: { label: 'Scherpe stempel op de bodem', seen: 'De makersstempel op de bodem is scherp.', notSeen: 'De stempel op de bodem is vaag.' },
        handle: { label: 'Oor iets uit het midden', seen: 'Het oor zit iets uit het midden.', notSeen: 'Het oor zit recht.' },
        box: { label: 'In een grijze doos', seen: 'Het kwam in de gewone grijze doos – zoals de kopjes van alle machines.', notSeen: 'Het kwam in de gewone grijze doos – zoals de kopjes van alle machines.' }
      }
    },
    'c-key': {
      title: 'De zoekgeraakte sleutel',
      story: 'De reservesleutel is weer zoek. Hij ligt bijna altijd op een van dezelfde paar plekken.',
      lead: 'Als de sleutel zoek is, duikt hij op:',
      hyps: { coat: 'In de jas', car: 'In de auto', office: 'Op kantoor' },
      clues: {
        'search-coat': { label: 'Snel zoeken in de jas vindt hem', seen: 'Je vindt de sleutel in de jas.', notSeen: 'Je kijkt snel in de jaszakken: geen sleutel. Snel zoeken kan hem missen.' },
        'search-car': { label: 'Snel kijken in de auto vindt hem', seen: 'Je vindt de sleutel in de auto.', notSeen: 'Je kijkt snel in de auto: geen sleutel. Snel kijken kan hem missen.' },
        jingle: { label: 'Gerinkel in de gang', seen: 'Je herinnert je gerinkel toen de jas werd opgehangen.', notSeen: 'Je herinnert je geen gerinkel.' },
        drove: { label: 'Je reed gisteren', seen: 'Je hebt gisteren gereden.', notSeen: 'Je hebt gisteren niet gereden.' },
        'office-day': { label: 'Je was op kantoor', seen: 'Je was gisteren op kantoor.', notSeen: 'Je werkte gisteren thuis.' },
        weekday: { label: 'Het is een werkdag', seen: 'Het is vandaag een werkdag – dat verandert niets aan waar sleutels belanden.', notSeen: 'Het is vandaag een werkdag – dat verandert niets aan waar sleutels belanden.' }
      }
    },
    'c-coin': {
      title: 'De munt van de kermis',
      story: 'Je vond een oude munt bij een kermiskraam met goocheltrucs. Je ziet geen verschil met een gewone munt, dus je gooit hem op.',
      lead: 'Munten in de oude-muntenbak van de kraam zijn:',
      hyps: { ordinary: 'Een gewone munt', weighted: 'Een verzwaarde munt', 'two-headed': 'Een munt met twee kopkanten' },
      clues: {
        toss1: { label: 'Kop bij de eerste worp', seen: 'Eerste worp: kop.', notSeen: 'Eerste worp: munt.' },
        toss2: { label: 'Kop bij de tweede worp', seen: 'Tweede worp: kop.', notSeen: 'Tweede worp: munt.' },
        toss3: { label: 'Kop bij de derde worp', seen: 'Derde worp: kop.', notSeen: 'Derde worp: munt.' },
        toss4: { label: 'Kop bij de vierde worp', seen: 'Vierde worp: kop.', notSeen: 'Vierde worp: munt.' }
      }
    },
    'c-message': {
      title: 'Het bericht van „de club”',
      story: 'Een bericht zegt van je sportclub te komen en vraagt je je lidmaatschap te bevestigen.',
      lead: 'Berichten die zeggen van de club te komen, zijn:',
      hyps: { real: 'Echt van de club', fake: 'Nep' },
      clues: {
        link: { label: 'Bevat een link', seen: 'Het bevat een link.', notSeen: 'Het bevat geen link.' },
        sender: { label: 'Onbekend afzenderadres', seen: 'Het afzenderadres is niet het gewone adres van de club.', notSeen: 'Het afzenderadres is het gewone.' },
        hurry: { label: 'Vraagt je op te schieten', seen: 'Er staat dat je vandaag moet antwoorden.', notSeen: 'Er staat geen termijn in.' },
        'your-name': { label: 'Gebruikt je naam', seen: 'Het spreekt je aan met je naam.', notSeen: 'Er staat alleen „Beste lid”.' },
        evening: { label: 'Kwam ’s avonds', seen: 'Het kwam ’s avonds – beide soorten komen op elk moment.', notSeen: 'Het kwam ’s avonds – beide soorten komen op elk moment.' }
      }
    },
    'c-oven': {
      title: 'Het aangebrande brood',
      story: 'Eén brood van de ochtendbatch is aan één kant aangebrand. De bakkerij bakt in twee ovens.',
      lead: 'Broden worden hier gebakken in:',
      hyps: { old: 'De oude oven', new: 'De nieuwe oven' },
      clues: {
        'burnt-side': { label: 'Aan één kant aangebrand', seen: 'Het is aan één kant aangebrand.', notSeen: 'Het is aan één kant aangebrand.' },
        'pale-top': { label: 'Bleke bovenkant', seen: 'De bovenkant is bleek.', notSeen: 'De bovenkant is gelijkmatig bruin.' },
        'tray-mark': { label: 'Patroon van de nieuwe platen', seen: 'De onderkant toont het patroon van de nieuwe bakplaten.', notSeen: 'De onderkant is glad.' },
        early: { label: 'Uit de eerste batch', seen: 'Het kwam uit de eerste batch.', notSeen: 'Het kwam uit een latere batch.' },
        seeds: { label: 'Zaden erop', seen: 'Er zitten zaden op – beide ovens bakken zadenbrood.', notSeen: 'Er zitten zaden op – beide ovens bakken zadenbrood.' }
      }
    },
    'c-beep': {
      title: 'De zwakke piep op de radio',
      story: 'De ontvanger van de radioclub ving een zwakke, regelmatige piep op. Meestal is zoiets storing, maar er komt ook een kleine satelliet over.',
      lead: 'Zwakke regelmatige piepjes bij deze ontvanger zijn:',
      hyps: { satellite: 'Een signaal van een kleine satelliet', interference: 'Gewone storing' },
      clues: {
        'pass-time': { label: 'Tijdens een overvlucht', seen: 'Het kwam toen de satelliet boven ons hoorde te zijn.', notSeen: 'Het kwam toen er geen overvlucht was.' },
        drift: { label: 'De toon verschuift langzaam', seen: 'De toon verschuift langzaam, zoals bij een bewegende bron.', notSeen: 'De toon blijft gelijk.' },
        fades: { label: 'Dooft na een tijdje uit', seen: 'Het dooft na ongeveer tien minuten uit.', notSeen: 'Het blijft doorgaan.' },
        rhythm: { label: 'Een vast ritme', seen: 'Het piept in een vast ritme – dat doen beide.', notSeen: 'Het piept in een vast ritme – dat doen beide.' },
        'other-receiver': { label: 'Een tweede ontvanger hoort het', seen: 'Een clublid aan de andere kant van de stad hoort het ook.', notSeen: 'De ontvanger aan de andere kant van de stad hoort niets.' }
      }
    },
    'c-rain': {
      title: 'Heeft het vannacht geregend?',
      story: 'Je was een nacht weg en wilt weten of de zaailingen regen hebben gehad of nu water nodig hebben.',
      lead: 'Nachten in deze tijd van het jaar:',
      hyps: { rained: 'Het heeft geregend', dry: 'Het bleef droog' },
      clues: {
        'wet-grass': { label: 'Nat gras', seen: 'Het gras is nat (ook dauw maakt het nat).', notSeen: 'Het gras is droog.' },
        gauge: { label: 'Water in de regenmeter', seen: 'Er staat water in de regenmeter.', notSeen: 'De regenmeter is leeg.' },
        puddle: { label: 'Plas bij het hek', seen: 'Er ligt een plas bij het hek.', notSeen: 'Er ligt geen plas bij het hek.' },
        'snails-out': { label: 'Slakken op het pad', seen: 'Er zitten slakken op het pad.', notSeen: 'Er zitten geen slakken op het pad.' },
        wind: { label: 'Bladeren op de tafel', seen: 'Er zijn bladeren op de tafel gewaaid – het waaide hoe dan ook.', notSeen: 'Er zijn bladeren op de tafel gewaaid – het waaide hoe dan ook.' }
      }
    },
    'c-bird': {
      title: 'Welke vogel zat bij het voederhuisje?',
      story: 'Je zag maar heel even een kleine bruine vogel bij het voederhuisje voordat hij wegvloog. De aandelen hier zijn voor dit voederhuisje verzonnen; echte verschillen per plek.',
      lead: 'Kleine bruine bezoekers bij dit voederhuisje zijn:',
      hyps: { finch: 'Een vink', sparrow: 'Een mus' },
      clues: {
        'red-patch': { label: 'Een flits rood', seen: 'Je zag een flits rood op zijn kop.', notSeen: 'Je zag helemaal geen rood.' },
        ground: { label: 'Op de grond gegeten', seen: 'Hij at op de grond onder het voederhuisje.', notSeen: 'Hij at op het voederhuisje zelf.' },
        song: { label: 'Een kwetterend lied', seen: 'Hij liet een kwetterend lied horen.', notSeen: 'Hij tjilpte alleen.' },
        group: { label: 'Kwam met een groepje', seen: 'Hij kwam met een klein groepje.', notSeen: 'Hij kwam alleen.' },
        morning: { label: '’s Ochtends', seen: 'Het was vroeg in de ochtend – dan komen ze allebei.', notSeen: 'Het was vroeg in de ochtend – dan komen ze allebei.' }
      }
    },
    'c-plant': {
      title: 'De hangende kamerplant',
      story: 'De kantoorplant hangt slap en heeft gele bladeren. In dit kantoor is het meestal een van twee dingen.',
      lead: 'Als planten hier slap hangen, is de oorzaak:',
      hyps: { water: 'Te veel water', light: 'Te weinig licht' },
      clues: {
        'wet-soil': { label: 'Natte grond', seen: 'De grond is twee dagen na het water geven nog nat.', notSeen: 'De grond is droog.' },
        leaning: { label: 'Leunt naar het raam', seen: 'Hij leunt naar het raam.', notSeen: 'Hij staat recht.' },
        'soft-stem': { label: 'Zachte stengelvoet', seen: 'De onderkant van de stengel is zacht.', notSeen: 'De stengel is stevig.' },
        'pale-new': { label: 'Bleke nieuwe bladeren', seen: 'De nieuwe bladeren zijn bleek en klein.', notSeen: 'De nieuwe bladeren zien er gezond uit.' },
        'pot-colour': { label: 'Een blauwe pot', seen: 'Hij staat in een blauwe pot – dat verandert niets.', notSeen: 'Hij staat in een blauwe pot – dat verandert niets.' }
      }
    },
    'c-bus': {
      title: 'Waarom was de bus te laat?',
      story: 'Je bus kwam vanochtend veertig minuten te laat.',
      lead: 'Als deze bus erg laat is, is de reden:',
      hyps: { jam: 'Een file', breakdown: 'Pech' },
      clues: {
        'others-late': { label: 'Andere bussen ook te laat', seen: 'Andere bussen op dezelfde weg waren ook te laat.', notSeen: 'Andere bussen op de weg waren op tijd.' },
        replacement: { label: 'Er kwam een andere bus', seen: 'Er kwam een andere bus dan normaal.', notSeen: 'De gewone bus kwam.' },
        announcement: { label: 'Een melding', seen: 'Het scherm meldde: vertraging door een technische storing.', notSeen: 'Het scherm gaf geen reden.' },
        'rush-hour': { label: 'In de spits', seen: 'Het was spitsuur.', notSeen: 'Het was een rustig moment van de dag.' },
        rain: { label: 'Het regende', seen: 'Het regende – bij deze halte maakt dat geen verschil.', notSeen: 'Het regende – bij deze halte maakt dat geen verschil.' }
      }
    }
  },
checks: {
    'k-picnic': {
      title: 'Buiten of in de zaal?',
      story: 'De buurtpicknick is vanmiddag. Je kunt hem op het grasveld houden of het buurthuis afhuren.',
      lead: 'Middagen in deze tijd van het jaar zijn:',
      hyps: { dry: 'Droog', rain: 'Regenachtig' },
      question: 'Hoe waarschijnlijk is een droge middag?',
      options: { outdoors: 'Picknick op het grasveld', hall: 'De zaal afhuren', tent: 'Een tent op het grasveld zetten' },
      checks: {
        sky: { label: 'Om twaalf uur naar de lucht kijken', yes: 'Donkere wolken tegen de middag.', no: 'Geen donkere wolken tegen de middag.' },
        barometer: { label: 'Op de barometer kijken', yes: 'De barometer daalt.', no: 'De barometer blijft gelijk.' },
        farmer: { label: 'De boer verderop vragen', yes: 'De boer verwacht regen.', no: 'De boer verwacht een droge middag.' },
        service: { label: 'De weerdienst bellen', yes: 'De weerdienst waarschuwt voor regen.', no: 'De weerdienst geeft geen waarschuwing.' },
        swallows: { label: 'Naar de zwaluwen kijken', yes: 'De zwaluwen vliegen laag.', no: 'De zwaluwen vliegen hoog.' }
      }
    },
    'k-bike': {
      title: 'De tweedehands fiets kopen?',
      story: 'Een tweedehands fiets staat voor een goede prijs te koop. Zulke fietsen zijn meestal in orde, maar sommige hebben verborgen schade.',
      lead: 'Tweedehands fietsen zoals deze zijn:',
      hyps: { sound: 'In orde', damaged: 'Verborgen schade' },
      question: 'Hoe waarschijnlijk is het dat de fiets in orde is?',
      options: { buy: 'Kopen', skip: 'Laten staan', 'offer-less': 'Minder bieden en het risico nemen' },
      checks: {
        ride: { label: 'Een proefrit maken', yes: 'De proefrit gaat soepel.', no: 'De proefrit is hobbelig.' },
        chain: { label: 'Naar de ketting kijken', yes: 'De ketting is roestig.', no: 'De ketting is schoon.' },
        receipts: { label: 'Naar reparatiebonnen vragen', yes: 'De verkoper heeft reparatiebonnen.', no: 'De verkoper heeft geen bonnen.' },
        mechanic: { label: 'Een monteur laten kijken', yes: 'De monteur vindt een probleem.', no: 'De monteur vindt niets.' },
        'seller-says': { label: 'De verkoper vragen', yes: 'De verkoper zegt dat hij in orde is.', no: 'De verkoper weet het niet zeker.' }
      }
    },
    'k-seeds': {
      title: 'De oude zaden zaaien?',
      story: 'In de schuur dook een vergeten zakje zaden op. Zaaien kost een weekend; verse zaden kosten een beetje.',
      lead: 'Vergeten zakjes zoals dit zijn:',
      hyps: { good: 'Nog goed', dead: 'Grotendeels dood' },
      question: 'Hoe waarschijnlijk is het dat de zaden nog goed zijn?',
      options: { sow: 'De oude zaden zaaien', fresh: 'Verse zaden kopen' },
      checks: {
        float: { label: 'Een paar in water leggen', yes: 'De meeste zaden zinken.', no: 'De meeste zaden drijven.' },
        sprout: { label: 'Een paar op een vochtige doek proberen', yes: 'De meeste ontkiemen.', no: 'Er ontkiemen er maar weinig.' },
        date: { label: 'De datum op het zakje lezen', yes: 'De datum is recent.', no: 'De datum is oud.' },
        shrivelled: { label: 'De zaden goed bekijken', yes: 'De zaden zien er verschrompeld uit.', no: 'De zaden zien er bol uit.' },
        smell: { label: 'Eraan ruiken', yes: 'Ze ruiken fris.', no: 'Ze ruiken muf.' }
      }
    },
    'k-melon': {
      title: 'Deze meloen kopen?',
      story: 'Op de markt ligt nog één meloen voor een goede prijs.',
      lead: 'Meloenen die op dit uur bij dit kraam over zijn, zijn:',
      hyps: { ripe: 'Rijp', unripe: 'Nog niet rijp' },
      question: 'Hoe waarschijnlijk is het dat de meloen rijp is?',
      options: { buy: 'Kopen', leave: 'Laten liggen' },
      checks: {
        knock: { label: 'Erop kloppen', yes: 'Hij klinkt hol.', no: 'Hij klinkt dof.' },
        smell: { label: 'Eraan ruiken', yes: 'Hij ruikt zoet.', no: 'Hij ruikt naar bijna niets.' },
        'soft-end': { label: 'Op het uiteinde drukken', yes: 'Het uiteinde geeft een beetje mee.', no: 'Het uiteinde is hard.' },
        taste: { label: 'Een plakje uit dezelfde kist proeven', yes: 'Het plakje is zoet.', no: 'Het plakje is flauw.' },
        sticker: { label: 'De sticker lezen', yes: 'Er zit een sticker „rijp” op.', no: 'Er zit geen sticker op.' }
      }
    },
    'k-bread': {
      title: 'Extra bakken voor de markt?',
      story: 'Morgen is het marktdag. Extra brood verkoopt goed op een drukke dag, maar wordt oud op een rustige.',
      lead: 'Marktdagen hier zijn:',
      hyps: { busy: 'Druk', quiet: 'Rustig' },
      question: 'Hoe waarschijnlijk is een drukke marktdag?',
      options: { extra: 'Veel extra bakken', normal: 'De gewone hoeveelheid bakken', 'little-extra': 'Een beetje extra bakken' },
      checks: {
        calendar: { label: 'De stadsagenda bekijken', yes: 'De agenda noemt een evenement.', no: 'De agenda noemt niets.' },
        neighbour: { label: 'Het kaaskraam vragen', yes: 'Het kaaskraam verwacht veel mensen.', no: 'Het kaaskraam verwacht een rustige dag.' },
        sunny: { label: 'De weersverwachting lezen', yes: 'Er wordt zon verwacht.', no: 'Er worden wolken verwacht.' },
        office: { label: 'Het marktkantoor bellen', yes: 'Het marktkantoor verwacht veel bezoekers.', no: 'Het marktkantoor verwacht het gewone.' },
        'last-week': { label: 'Aan vorige week denken', yes: 'Vorige week was het druk.', no: 'Vorige week was het rustig.' }
      }
    },
    'k-laptop': {
      title: 'Zelf repareren?',
      story: 'De laptop valt willekeurig uit. Thuis repareren is goedkoop als het een kleine fout is, maar vergeefse moeite als het een grote is.',
      lead: 'Fouten zoals deze zijn:',
      hyps: { minor: 'Een kleine fout', major: 'Een grote fout' },
      question: 'Hoe waarschijnlijk is een kleine fout?',
      options: { repair: 'Thuis repareren', shop: 'Naar een winkel brengen', wait: 'Afwachten en kijken' },
      checks: {
        'error-code': { label: 'Herstarten en kijken', yes: 'Er verschijnt een foutcode.', no: 'Er verschijnt geen foutcode.' },
        diagnostics: { label: 'Het diagnoseprogramma draaien', yes: 'Het programma meldt een fout.', no: 'Het programma meldt niets.' },
        cable: { label: 'De stroomkabel wisselen', yes: 'Met een andere kabel werkt hij.', no: 'Hij valt nog steeds uit.' },
        fan: { label: 'Naar de ventilator luisteren', yes: 'De ventilator maakt een schurend geluid.', no: 'De ventilator klinkt normaal.' },
        forum: { label: 'Het forum lezen', yes: 'Anderen met dit model zeggen dat het iets kleins was.', no: 'Anderen met dit model melden verschillende oorzaken.' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: 'De lantaarnsensor',
      story: 'De gemeente controleert haar oude straatlantaarns met een sensor. Van alle lantaarns zijn er {f} echt kapot. De sensor meldt {s} van de kapotte lantaarns, maar meldt per vergissing ook {q} van de werkende. Lantaarn {lamp} is net gemeld.',
      questions: { q1: 'Is lantaarn {lamp} eerder kapot of eerder in orde?', q2: 'Hoe waarschijnlijk is het dat lantaarn {lamp} kapot is?' },
      options: { faulty: 'Eerder kapot', working: 'Eerder in orde' },
      explain: 'Tel de gemelde lantaarns: {k} van de {n} gemelde lantaarns zijn echt kapot, de kans is dus {p}. Of je een melding kunt vertrouwen, hangt ervan af hoe zeldzaam kapotte lantaarns zijn, niet alleen van hoe goed de sensor is.',
      labels: { faulty: 'Kapotte lantaarns', working: 'Werkende lantaarns', fit: 'gemeld' }
    },
    't-wheel': {
      title: 'De draaischijf',
      story: 'Een eerlijke draaischijf heeft {k} gelijke vakken, waarvan er {r} een ster tonen. De laatste {s} draaien misten de ster allemaal.',
      questions: { q1: 'Bij de volgende draai is een ster …', q2: 'Hoe waarschijnlijk is een ster bij de volgende draai?' },
      options: { more: 'waarschijnlijker dan normaal', less: 'minder waarschijnlijk dan normaal', same: 'even waarschijnlijk als altijd' },
      explain: 'De schijf heeft geen geheugen: elke draai begint opnieuw, dus een ster komt nog steeds in {p} van de gevallen.',
      labels: { spins: 'De gemiste draaien en de volgende' }
    },
    't-sequence': {
      title: 'Welke uitkomst is waarschijnlijker?',
      story: 'Een eerlijke munt wordt {n} keer opgegooid (● kop, ○ munt). Twee mogelijke uitkomsten: A {a} en B {b}.',
      questions: { q1: 'Welke precieze uitkomst is waarschijnlijker?', q2: 'Hoe waarschijnlijk is precies uitkomst B?' },
      options: { a: 'A', b: 'B', same: 'Ze zijn even waarschijnlijk' },
      explain: 'Er zijn {total} mogelijke uitkomsten, en elke precieze heeft dezelfde kans, {p}. B lijkt alleen typischer omdat gemengde uitkomsten als groep vaak voorkomen.',
      labels: { a: 'A', b: 'B' }
    },
    't-conjunction': {
      title: 'Regen en wind',
      story: 'De verwachting voor morgen geeft regen een kans van {a}. Op regendagen is het hier {b} van de tijd winderig; op droge dagen {w} van de tijd.',
      questions: { q1: 'Wat is morgen waarschijnlijker?', q2: 'Hoe waarschijnlijk is een dag die zowel regenachtig als winderig is?' },
      options: { windy: 'Een winderige dag', both: 'Een regenachtige en winderige dag', same: 'Allebei even waarschijnlijk' },
      explain: 'Stel je {days} dagen zoals morgen voor: {both} zijn regenachtig en winderig, maar in totaal zijn er {windy} winderig. Elke regenachtige en winderige dag is ook een winderige dag, dus „regenachtig en winderig” kan nooit waarschijnlijker zijn dan „winderig”.',
      labels: { windy: 'Winderig', calm: 'Windstil', rainy: 'Regendagen', dry: 'Droge dagen' }
    },
    't-simpson': {
      title: 'De twee bezorgdiensten',
      story: 'Twee bezorgdiensten melden hoe vaak ze vorige maand op tijd waren. Dienst A: korte routes {aSk} van {aSn}, lange routes {aLk} van {aLn}. Dienst B: korte routes {bSk} van {bSn}, lange routes {bLk} van {bLn}.',
      questions: { q1: 'Welke dienst was in totaal vaker op tijd?', q2: 'Je pakket gaat over een lange route. Welke dienst doet het beter op lange routes?' },
      options: { a: 'Dienst A', b: 'Dienst B', same: 'Allebei hetzelfde' },
      explain: 'A is beter op korte en op lange routes, en toch is B in totaal beter ({b} tegen {a} bezorgingen op tijd), omdat B vooral de makkelijkere korte routes rijdt. Vergelijk gelijk met gelijk.',
      labels: { a: 'Dienst A', b: 'Dienst B', short: 'Korte routes', long: 'Lange routes', overall: 'Totaal' }
    },
    't-paw': {
      title: 'De pootafdruk in de bloem',
      story: 'Vannacht is iemand door de bloem op de vloer van de bakkerij gelopen. De pootafdruk past bij de kat van de buren. Maar {r} katten heeft zo’n afdruk. Ongeveer {n} katten wonen dichtbij genoeg om binnen te zijn gekomen.',
      questions: { q1: 'Betekent „maar {r}” dat het vrijwel zeker de kat van de buren was?', q2: 'Hoe waarschijnlijk is het dat het de kat van de buren was? Neem aan dat elke kat in de buurt even waarschijnlijk binnenkwam.' },
      options: { yes: 'Ja, voor zo’n {sure} zeker', no: 'Nee, veel minder zeker dan dat' },
      explain: 'Van de {n} katten in de buurt hebben er ongeveer {others} andere ook een passende afdruk. De kat van de buren is maar een van de vele die passen: {p}.',
      labels: { neighbour: 'Nachten waarin de kat van de buren binnenkwam', others: 'Nachten waarin een andere kat binnenkwam', fit: 'afdruk past' }
    },
    't-bakery': {
      title: 'De kleine en de grote bakkerij',
      story: 'Twee bakkerijen verkopen roggebrood en tarwebrood. Gemiddeld is de helft van de verkochte broden roggebrood, en elk brood is een aparte keuze. De kleine bakkerij verkoopt {n1} broden per dag, de grote {n2}.',
      questions: { q1: 'Welke bakkerij heeft meer dagen waarop meer dan {t} van de verkochte broden roggebrood is?', q2: 'Op welk deel van de dagen verkoopt de kleine bakkerij meer dan {t} roggebrood?' },
      options: { small: 'De kleine bakkerij', large: 'De grote bakkerij', same: 'Ongeveer hetzelfde' },
      explain: 'Kleine steekproeven schommelen meer. De kleine bakkerij heeft zulke dagen {small} van de tijd, de grote maar {large}.',
      labels: { small: 'Kleine bakkerij', large: 'Grote bakkerij' }
    },
    't-drawers': {
      title: 'De conciërge die het weet',
      story: 'Eén van {n} gesloten laden bevat de sleutel. Je wijst een la aan. De conciërge, die weet waar de sleutel ligt, opent dan {opened} van de andere laden, allemaal leeg, en laat precies één andere la dicht. Dat doet hij altijd, en de jouwe opent hij nooit.',
      questions: { q1: 'Bij je eigen la blijven of wisselen naar de andere gesloten la?', q2: 'Hoe waarschijnlijk is het dat de sleutel in de andere gesloten la ligt?' },
      options: { switch: 'Wisselen', keep: 'Bij mijn la blijven', same: 'Het maakt niet uit' },
      explain: 'Stel je {total} spelletjes voor. Je eerste keuze is maar in een deel ervan goed. In de andere {wins} moet de conciërge de la met de sleutel dichtlaten, dus wisselen wint: {p}.',
      labels: { right: 'Spelletjes waarin je eerste keuze de sleutel heeft', wrong: 'Spelletjes waarin niet', fit: 'wisselen wint' }
    },
    't-week': {
      title: 'Minstens één regendag',
      story: 'Je plant een reis van {m} dagen. Elke dag heeft een regenkans van {q}, los van de andere dagen.',
      questions: { q1: 'Hoe waarschijnlijk is minstens één regendag?' },
      options: {},
      explain: 'De kansen optellen zou {sum} geven, en dat kan niet kloppen. Vermenigvuldig in plaats daarvan de kansen op een droge dag: helemaal geen regen heeft een kans van {none}, dus minstens één regendag {p}.',
      labels: { step: 'Nog droog na dag {n}' }
    },
    't-numbers': {
      title: 'Twee keer hetzelfde getal',
      story: 'Elk van {g} mensen kiest in het geheim een willekeurig geheel getal van één tot {r}.',
      questions: { q1: 'Hoe waarschijnlijk is het dat minstens twee van hen hetzelfde getal kiezen? Eerst je gevoel:', q2: 'Nu je schatting: hoe waarschijnlijk is minstens één gedeeld getal?' },
      options: { low: 'Minder dan één op vier', even: 'Ongeveer fifty-fifty', high: 'Meer dan drie op vier' },
      explain: 'Met {g} mensen zijn er {pairs} paren die kunnen overeenkomen, dus een overeenkomst komt eerder dan het voelt: {p}.',
      labels: { step: 'Allemaal verschillend onder de eerste {n}' }
    },
    't-tyres': {
      title: 'Minder lekke banden',
      story: 'Een nieuw soort band verlaagt het aantal lekke banden van {b} naar {a} per honderd ritten. De maker noemt dat {rel} minder lekke banden.',
      questions: { q1: 'Hoeveel lekke banden minder zijn er op {rides} ritten?' },
      options: {},
      explain: 'Op {rides} ritten zijn er eerst {old} lekke banden en daarna {new}: {fewer} minder. „{rel} minder” klinkt groot; wat je merkt, is de absolute verandering.',
      labels: { old: 'Oude banden', new: 'Nieuwe banden', fit: 'lekke banden' }
    },
    't-dice': {
      title: 'Twee dobbelstenen',
      story: 'Je gooit met twee gewone dobbelstenen en telt de ogen op.',
      questions: { q1: 'Welke som is waarschijnlijker: {s1} of {s2}?', q2: 'Hoe waarschijnlijk is de som {s1}?' },
      options: { first: '{s1}', second: '{s2}', same: 'Even waarschijnlijk' },
      explain: 'Van de zesendertig even waarschijnlijke uitkomsten geven er {c1} de som {s1} en {c2} de som {s2}.',
      labels: {}
    }
  }
};
