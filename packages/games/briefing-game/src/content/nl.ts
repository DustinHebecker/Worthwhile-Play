import type { ContentText } from './types';

export const content: ContentText = {
  supplierDelay: {
    title: 'Leveringsvertraging vlak voor een lancering',
    situation: 'Je bedrijf lanceert op 14 mei een nieuwe bureaulamp. De leverancier van de lampenkappen meldt een vertraging. Bereid een briefing voor.',
    recipient: 'het hoofd productontwikkeling',
    cards: {
      c1: 'De nieuwe bureaulamp komt op 14 mei uit; 350 klanten hebben hem vooraf besteld.',
      c2: 'De leverancier heeft pas 200 van de 500 bestelde lampenkappen verzonden.',
      c3: 'Zodra de onderdelen er zijn, kan onze werkplaats 100 lampen per dag monteren.',
      c4: 'De leverancier heeft nog geen datum genoemd voor de rest van de lampenkappen.',
      c5: 'De leverancier verwacht de rest volgende week te verzenden, waarschijnlijk op dinsdag.',
      c6: 'Als de onderdelen na 10 mei binnenkomen, kunnen de lampen niet op tijd voor de lancering worden gemonteerd.',
      c7: 'De lanceringsadvertentie is geboekt voor 14 mei; verplaatsen zou 800 euro aan kosten met zich meebrengen.',
      c8: 'Marketing moet vóór vrijdag weten of de lanceringsdatum blijft staan.',
      c9: 'Jonas van inkoop kan morgenochtend de leverancier bellen en om een vaste datum vragen.',
      c10: 'De leverancier is vorig jaar naar een nieuw kantoorgebouw verhuisd.',
      c11: 'Tot nu toe zijn pas 200 van de 500 bestelde lampenkappen verzonden.',
      c12: 'Eerlijk gezegd is deze leverancier altijd al een beetje chaotisch geweest.'
    },
    decisions: {
      right: 'De lancering op 14 mei houden, of een week opschuiven?',
      notTheirs: 'Welk transportbedrijf moet de leverancier gebruiken?',
      premature: 'Moeten we deze leverancier voor alle toekomstige producten vervangen?'
    },
    actions: {
      concrete: 'Jonas belt morgen om 9:00 de leverancier en geeft de bevestigde datum vóór 12:00 door aan het hoofd productontwikkeling.',
      vague: 'Iemand moet de leverancier in de gaten houden.',
      outOfScope: 'Beginnen met het ontwerp van de lampencollectie van volgend jaar.'
    }
  },
  basement: {
    title: 'Ondergelopen kelder in een studentenhuis',
    situation: 'Na zware regen staat er water in de kelder van het huis dat je met anderen deelt. Bereid een briefing voor.',
    recipient: 'de verhuurder',
    cards: {
      c1: 'Vijf mensen delen het huis; in de kelder staan de cv-ketel en ieders opslagdozen.',
      c2: 'Vanochtend stond er ongeveer 10 cm water in de kelder.',
      c3: 'We hebben vanochtend uit voorzorg de stroom in de kelder uitgeschakeld.',
      c4: 'Niemand weet nog of de cv-ketel beschadigd is.',
      c5: 'Het water stijgt waarschijnlijk niet meer; tussen de middag zag het er hetzelfde uit als ’s ochtends.',
      c6: 'Voor donderdag is meer regen voorspeld, en het water kan weer stijgen.',
      c7: 'De ketel staat 15 cm boven de vloer, dus een paar centimeter meer water zou hem bereiken.',
      c8: 'De loodgieter kan alleen deze week komen als de verhuurder de voorrijkosten vóór morgen goedkeurt.',
      c9: 'Een huisgenoot die thuiswerkt, kan de loodgieter op woensdag binnenlaten.',
      c10: 'De kelderwanden zijn voor het laatst in 2015 geschilderd.',
      c11: 'Toen we vanochtend gingen kijken, stond de kelder onder 10 cm water.',
      c12: 'Dit huis is altijd vochtig geweest, en niemand doet er ooit iets aan.'
    },
    decisions: {
      right: 'De voorrijkosten van de loodgieter voor deze week goedkeuren?',
      notTheirs: 'Welke huisgenoot moet als eerste zijn dozen verplaatsen?',
      premature: 'Moet de hele kelder waterdicht gemaakt en gerenoveerd worden?'
    },
    actions: {
      concrete: 'De thuiswerkende huisgenoot boekt de loodgieter voor woensdag en stuurt de verhuurder vandaag de offerte.',
      vague: 'We pakken het ooit wel aan.',
      outOfScope: 'Een huisfeest plannen om iedereen op te vrolijken.'
    }
  },
  schoolTrip: {
    title: 'Schoolreisje en een weerwaarschuwing',
    situation: 'Een klas van 24 leerlingen gaat vrijdag wandelen in de heuvels. Er is een weerwaarschuwing afgegeven. Bereid een briefing voor.',
    recipient: 'de directeur van de school',
    cards: {
      c1: 'De klas van 24 leerlingen van 11 jaar staat vrijdag ingeschreven voor een wandeltocht, met drie begeleiders.',
      c2: 'De weerdienst heeft een stormwaarschuwing afgegeven voor vrijdagmiddag.',
      c3: 'Het wetenschapsmuseum in de stad heeft vrijdag nog plek voor een klassenbezoek.',
      c4: 'De verwachting zegt nog niet of de storm vóór of na het middaguur komt.',
      c5: 'De boswachter denkt dat het hoofdpad zeer waarschijnlijk open blijft.',
      c6: 'Harde wind kan op het bospad takken laten afbreken.',
      c7: 'De enige schuilhut op de route ligt 40 minuten lopen van het einde van het pad, te ver om bij storm snel te bereiken.',
      c8: 'Het busbedrijf moet vóór woensdagavond horen of het reisje doorgaat; tot dan is annuleren gratis.',
      c9: 'De klassenleerkracht kan woensdagmiddag de nieuwste weersverwachting bekijken.',
      c10: 'De klas heeft al in september voor de wandeltocht gestemd.',
      c11: 'Volgens de weerdienst wordt er vrijdagmiddag een storm verwacht.',
      c12: 'De kinderen zullen vreselijk teleurgesteld zijn als we afzeggen.'
    },
    decisions: {
      right: 'De wandeling laten doorgaan, uitwijken naar het museum of het reisje afzeggen?',
      notTheirs: 'Wat moeten de leerlingen meenemen als lunch?',
      premature: 'Moet de school vanaf nu alle uitstapjes in de buitenlucht schrappen?'
    },
    actions: {
      concrete: 'De klassenleerkracht bekijkt woensdag om 12:00 de verwachting en stuurt de directeur vóór 14:00 een advies.',
      vague: 'Laten we kijken hoe het weer wordt.',
      outOfScope: 'Beginnen met het plannen van het schoolfeest van volgend jaar.'
    }
  },
  volunteers: {
    title: 'Opruimdag met te weinig helpers',
    situation: 'Je buurtvereniging houdt zaterdag een opruimactie in het park. Er hebben zich te weinig vrijwilligers aangemeld. Bereid een briefing voor.',
    recipient: 'de voorzitter van de vereniging',
    cards: {
      c1: 'De jaarlijkse opruimactie in het park is zaterdag van 10:00 tot 13:00; de gemeente levert zakken en handschoenen.',
      c2: 'Tot nu toe hebben 9 vrijwilligers zich aangemeld; we hadden op 20 gerekend.',
      c3: 'De gemeente haalt de volle zakken alleen zaterdag om 13:00 op.',
      c4: 'Het jeugdvoetbalteam stuurt misschien helpers, maar de trainer heeft nog niet gereageerd.',
      c5: 'Een paar buren zeiden dat ze waarschijnlijk langskomen als het mooi weer is.',
      c6: 'Met 9 mensen kunnen we maar ongeveer de helft van het park schoonmaken.',
      c7: 'Er is nog niemand aangewezen om de handschoenen op te halen bij het buurthuis, dat zaterdag om 9:30 sluit.',
      c8: 'We kunnen de actie beperken tot het speeltuingedeelte of verplaatsen naar de zaterdag erna.',
      c9: 'Twee vrijwilligers hebben aangeboden morgen posters in de buurt op te hangen.',
      c10: 'De opruimactie van vorig jaar eindigde met een barbecue.',
      c11: 'Maar 9 van de 20 geplande vrijwilligers hebben zich ingeschreven.',
      c12: 'Mensen geven gewoon niets meer om hun buurt.'
    },
    decisions: {
      right: 'Deze zaterdag een kleinere opruimactie houden, of een week opschuiven?',
      notTheirs: 'Moet de gemeente haar ophaaltijden voor de zakken veranderen?',
      premature: 'Moet de vereniging de komende jaren een schoonmaakbedrijf inhuren?'
    },
    actions: {
      concrete: 'De twee vrijwilligers hangen morgen posters op, en de secretaris mailt vandaag de voetbaltrainer en laat vóór donderdag iets weten.',
      vague: 'We moeten op de een of andere manier meer mensen zien te krijgen.',
      outOfScope: 'Beginnen met het plannen van het zomerfeest van de vereniging.'
    }
  },
  release: {
    title: 'Software-release met een falende test',
    situation: 'Je team wil dinsdag een nieuwe versie van een boekingsapp uitbrengen. Eén geautomatiseerde test faalt. Bereid een briefing voor.',
    recipient: 'de productmanager',
    cards: {
      c1: 'De nieuwe versie voegt online betalen toe en is voor dinsdag aan klanten aangekondigd.',
      c2: 'Eén van de 640 geautomatiseerde tests faalt: de terugbetaling van een geannuleerde boeking.',
      c3: 'De fout treedt alleen op bij betalingen in een vreemde valuta.',
      c4: 'We weten nog niet of de fout in onze code zit of in het testsysteem van de betaalprovider.',
      c5: 'De ontwikkelaar verwacht dat de oplossing ongeveer een dag kost, maar heeft de code nog niet bekeken.',
      c6: 'Als de fout echt is, kunnen sommige klanten een verkeerd bedrag terugkrijgen.',
      c7: 'Ongeveer 15% van de boekingen wordt in vreemde valuta betaald, dus de fout zou veel klanten raken.',
      c8: 'We kunnen dinsdag uitbrengen met betalingen in vreemde valuta uitgeschakeld, of de hele release uitstellen.',
      c9: 'De ontwikkelaar kan vanmiddag de testlogs van de betaalprovider bekijken.',
      c10: 'Het nieuwe betaalscherm gebruikt de nieuwe blauwtint van het bedrijf.',
      c11: 'Eén enkele test staat op rood: terugbetalingen voor geannuleerde boekingen.',
      c12: 'Die test is altijd al onbetrouwbaar geweest; ik zou hem gewoon negeren.'
    },
    decisions: {
      right: 'Dinsdag uitbrengen zonder betalingen in vreemde valuta, of de release uitstellen?',
      notTheirs: 'Welke programmeertechniek moet de ontwikkelaar voor de oplossing gebruiken?',
      premature: 'Moeten we overstappen op een andere betaalprovider?'
    },
    actions: {
      concrete: 'De ontwikkelaar bekijkt vanmiddag de testlogs van de provider en laat de productmanager vóór 17:00 weten of de fout bij ons ligt.',
      vague: 'Iemand kijkt wel even naar de test.',
      outOfScope: 'Beginnen met de release notes voor de versie daarna.'
    }
  },
  careAppointment: {
    title: 'Een zorgadviesgesprek voor oma',
    situation: 'Je oma heeft maandag een afspraak bij een zorgadviesdienst. De familie moet regelen wie met haar meegaat. Bereid een briefing voor. (Het gaat om organiseren, niet om medische vragen.)',
    recipient: 'je broer, die de beslissing met jou deelt',
    cards: {
      c1: 'Oma heeft maandag om 10:00 een afspraak bij de zorgadviesdienst om te praten over hulp thuis.',
      c2: 'Ze heeft gevraagd of één familielid meegaat.',
      c3: 'In de brief staat dat ze haar medicijnlijst en zorgpas moet meenemen.',
      c4: 'Het is nog niet duidelijk of mama maandag vrij kan nemen.',
      c5: 'Het adviescentrum zou een lift hebben, maar niemand heeft het nagekeken.',
      c6: 'Als niemand mee kan, is de volgende vrije afspraak pas over zes weken.',
      c7: 'Oma is snel moe, en de busrit naar het centrum duurt 50 minuten per keer.',
      c8: 'De adviesdienst moet vóór vrijdag weten of het gesprek ter plekke of via videobellen plaatsvindt.',
      c9: 'Je zou mama vanavond kunnen bellen om naar maandag te vragen.',
      c10: 'De buurvrouw van oma heeft onlangs een nieuwe hond genomen.',
      c11: 'Ze zou graag willen dat iemand van de familie meegaat.',
      c12: 'Volgens mij helpen zulke adviesdiensten toch nooit echt.'
    },
    decisions: {
      right: 'Wie gaat maandag met oma mee, en ter plekke of via video?',
      notTheirs: 'Welke soort hulp thuis moet oma krijgen?',
      premature: 'Moet oma naar een verpleeghuis verhuizen?'
    },
    actions: {
      concrete: 'Jij belt mama vanavond en laat je broer vóór woensdagavond weten wie mee kan.',
      vague: 'We regelen het wel op de een of andere manier.',
      outOfScope: 'Beginnen met het plannen van oma’s verjaardagsfeest.'
    }
  },
  cafeFreezer: {
    title: 'Kapotte vriezer in een klein café',
    situation: 'Je werkt in een klein café. Vanochtend was de vriezer niet koud genoeg. De eigenaar is tot morgen weg. Bereid een briefing voor.',
    recipient: 'de eigenaar van het café',
    cards: {
      c1: 'Het café verkoopt zelfgemaakt ijs; de vriezer bevat ongeveer een week voorraad.',
      c2: 'Om 7:00 gaf de vriezer −2 °C aan in plaats van de gebruikelijke −18 °C.',
      c3: 'We hebben het ijs om 7:30 naar de vriezer van de bakker naast ons gebracht.',
      c4: 'We weten niet of het ijs ’s nachts ontdooid is.',
      c5: 'De reparatiedienst kan waarschijnlijk donderdag komen.',
      c6: 'Ontdooid ijs mag niet verkocht worden, dus misschien moeten we de voorraad weggooien.',
      c7: 'De bakker heeft zaterdag zijn vriesruimte weer nodig, dus ons ijs kan daar alleen tot dan blijven.',
      c8: 'De reparatiedienst plant pas een bezoek als de eigenaar de voorrijkosten van 90 euro goedkeurt.',
      c9: 'De barista kan vanmiddag het temperatuurlogboek van de vriezer uitlezen.',
      c10: 'De nieuwe menuborden van het café komen volgende week.',
      c11: 'Vanochtend gaf de vriezer −2 °C aan in plaats van −18 °C.',
      c12: 'Die vriezer was vanaf dag één een slechte aankoop.'
    },
    decisions: {
      right: 'De voorrijkosten van 90 euro voor de reparatie goedkeuren?',
      notTheirs: 'Welke taarten moet de bakker deze week verkopen?',
      premature: 'Moet het café helemaal stoppen met ijs verkopen?'
    },
    actions: {
      concrete: 'De barista leest vanmiddag het temperatuurlogboek uit en appt de eigenaar het resultaat vóór 16:00.',
      vague: 'We houden het in de gaten.',
      outOfScope: 'De website van het café opnieuw ontwerpen.'
    }
  },
  tournament: {
    title: 'Nieuwe locatie voor een schaaktoernooi',
    situation: 'Je schaakclub organiseert zondag een jeugdtoernooi. De geboekte schoolzaal is niet meer beschikbaar. Bereid een briefing voor.',
    recipient: 'het clubbestuur',
    cards: {
      c1: 'Voor het jeugdtoernooi van zondag zijn 48 spelers van zes clubs ingeschreven.',
      c2: 'De school heeft onze zaalboeking geannuleerd vanwege een lekkend dak.',
      c3: 'De stadsbibliotheek biedt haar zaal gratis aan, maar daar passen maar 32 spelers in.',
      c4: 'Het sportcentrum heeft misschien een vrije zaal, maar heeft nog niet op onze e-mail gereageerd.',
      c5: 'De conciërge denkt dat de schoolzaal op tijd gerepareerd kan worden, maar niemand heeft dat bevestigd.',
      c6: 'Als gezinnen te laat over de wijziging horen, staan sommige spelers misschien bij de oude locatie.',
      c7: 'Een aantal gezinnen reist meer dan 100 km en heeft de trein al geboekt, dus een andere datum zou hen het hardst raken.',
      c8: 'De uitnodigingen met de definitieve locatie moeten vóór woensdag de deur uit.',
      c9: 'De secretaris van de club kan morgenochtend het sportcentrum bellen.',
      c10: 'De prijzenkast van de club is vorige maand schoongemaakt.',
      c11: 'De school heeft onze boeking voor de zaal ingetrokken.',
      c12: 'We hadden nooit op die school moeten vertrouwen.'
    },
    decisions: {
      right: 'Uitwijken naar een andere locatie, het toernooi beperken tot 32 spelers of het uitstellen?',
      notTheirs: 'Wanneer moet de school haar dak repareren?',
      premature: 'Moet de club een eigen clubhuis bouwen?'
    },
    actions: {
      concrete: 'De secretaris belt morgen om 9:00 het sportcentrum en brengt vóór 12:00 verslag uit aan het bestuur.',
      vague: 'Even afwachten wat er op ons pad komt.',
      outOfScope: 'Nieuwe schaakspellen voor de club bestellen.'
    }
  }
};
