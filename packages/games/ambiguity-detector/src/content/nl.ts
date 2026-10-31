import type { LocaleContent } from './items';

export const content: LocaleContent = {
  'finish-tomorrow': {
    context: 'Je teamleider stuurt je een bericht in de teamchat. Je werkt op dit moment aan drie verschillende rapporten.',
    text: 'Maak dit morgen alsjeblieft af.',
    ask: { what: 'Welk van de drie rapporten bedoel je?', when: 'Hoe laat morgen precies: ’s ochtends of aan het eind van de dag?' },
    given: { who: 'Het bericht is direct aan jou gericht.' },
    replies: {
      clear: 'Prima. Welk van de drie rapporten bedoel je: budget, verkoop of personeel? En hoe laat morgen?',
      vague: 'Oké, komt goed!',
      assume: 'Geen probleem, ik maak het verkooprapport morgen af.'
    }
  },
  'concert-entrance': {
    context: 'Een vriend appt je over het concert op zaterdag, dat om 20.00 uur begint. De zaal heeft vier ingangen.',
    text: 'Laten we voor het concert bij de ingang afspreken.',
    ask: { when: 'Hoe laat spreken we af, hoe lang voor 20.00 uur?', where: 'Bij welke van de vier ingangen?' },
    given: { what: 'Wat er gepland is, is duidelijk: afspreken voor het concert.' },
    replies: {
      clear: 'Goed idee! Welke ingang en hoe laat? Is 19.30 uur goed?',
      vague: 'Klinkt goed, tot dan!',
      rude: 'Altijd zeg je zulke dingen. Wees nou eens precies!'
    }
  },
  'party-photos': {
    context: 'Je tante stuurt je een bericht na een familiefeest waar jij ongeveer 200 foto’s hebt gemaakt.',
    text: 'Kun je me de foto’s van zondag sturen?',
    ask: { what: 'Alle 200, of maar een paar, bijvoorbeeld die waar jij op staat?', format: 'Hoe zal ik ze sturen: als downloadlink, per e-mail of als afdrukken?' },
    given: { who: 'Het is duidelijk wie ze moet sturen: jij.' },
    replies: {
      clear: 'Natuurlijk! Alle 200 of een selectie? En is een downloadlink goed voor je?',
      vague: 'Tuurlijk, ik stuur ze ooit wel.',
      assume: 'Ik heb alle 200 foto’s voor je laten afdrukken.'
    }
  },
  'water-plants': {
    context: 'Je buurvrouw gaat morgen twee weken op reis. Jij hebt haar reservesleutel.',
    text: 'Zou je de planten water willen geven terwijl ik weg ben?',
    ask: { when: 'Hoe vaak hebben ze water nodig: elke dag of twee keer per week?', where: 'Welke planten: binnen, op het balkon of allebei?' },
    given: { what: 'De taak is duidelijk: planten water geven.', who: 'Het wordt jou direct gevraagd.' },
    replies: {
      clear: 'Graag! Welke planten, en hoe vaak moet ik water geven?',
      vague: 'Tuurlijk, geen probleem.',
      assume: 'Tuurlijk, ik geef de balkonplanten elke avond water.'
    }
  },
  'train-tickets': {
    context: 'Jij en een vriendin plannen een weekend aan zee. Zij schrijft:',
    text: 'Ik boek het hotel. Kun jij de trein boeken?',
    ask: { when: 'Op welke dag en rond hoe laat reizen we heen en terug?' },
    given: { what: 'De taak is duidelijk: treinkaartjes voor de reis.', who: 'Jij moet ze boeken.' },
    replies: {
      clear: 'Ja! Op welke dag en hoe laat wil je vertrekken, en wanneer gaan we terug?',
      vague: 'Oké, doe ik.',
      assume: 'Geregeld: vrijdag om 5.30 uur ’s ochtends, eerste klas.'
    }
  },
  'bins-tonight': {
    context: 'Een bericht in de groepschat van vijf huisgenoten.',
    text: 'Iemand moet vanavond het afval buiten zetten.',
    ask: { who: 'Wie moet het vanavond precies doen? Wie is er aan de beurt?' },
    given: { what: 'De taak is duidelijk: het afval buiten zetten.', when: 'Het tijdstip staat erin: vanavond.' },
    replies: {
      clear: 'Wie doet het vanavond? Is er een schema waar we op kunnen kijken?',
      vague: 'Ja, iemand zou dat moeten doen.',
      rude: 'Ik in elk geval niet. Zoek het zelf maar uit.'
    }
  },
  'school-form': {
    context: 'Een bericht van de leerkracht van je kind in de school-app. Deze week nam je kind twee formulieren mee naar huis: één voor een uitstapje en één voor klassenfoto’s.',
    text: 'Wilt u het ondertekende formulier uiterlijk donderdag inleveren?',
    ask: { what: 'Welk formulier bedoelt u: dat voor het uitstapje of dat voor de foto’s?', format: 'Moet ik het op papier inleveren of als foto in de app?' },
    given: { when: 'De deadline staat erin: donderdag.' },
    replies: {
      clear: 'Dank u! Welk formulier bedoelt u, uitstapje of foto’s? En op papier of via de app?',
      vague: 'Oké, genoteerd.',
      assume: 'Geregeld: ik heb beide formulieren ondertekend en er foto’s van geüpload.'
    }
  },
  'holiday-keys': {
    context: 'Je hebt een vakantiehuis gehuurd. De verhuurster schrijft je de dag voor je aankomst.',
    text: 'Ik leg de sleutels voor u klaar.',
    ask: { where: 'Waar precies legt u de sleutels neer?' },
    given: { what: 'Waar het over gaat is duidelijk: de sleutels.', who: 'De verhuurster legt ze zelf klaar.' },
    replies: {
      clear: 'Dank u! Waar precies liggen ze: in een sleutelkastje of bij de buren?',
      vague: 'Top, bedankt!',
      assume: 'Perfect, dan pak ik ze onder de deurmat.'
    }
  },
  'project-slides': {
    context: 'Je leidinggevende stuurt je dinsdagochtend een bericht.',
    text: 'Kun je een paar slides over het project maken?',
    ask: {
      when: 'Wanneer heb je de slides nodig?',
      audience: 'Wie krijgt ze te zien: het team, het management of de klant?',
      scope: 'Hoe uitgebreid: een paar slides of een hele presentatie?',
      purpose: 'Wat moet het opleveren: een stand van zaken of een besluit?'
    },
    given: { what: 'Het resultaat is duidelijk: slides over het project.', who: 'Het wordt jou direct gevraagd.' },
    replies: {
      clear: 'Doe ik graag. Voor wie, wanneer, ongeveer hoe lang, en moet het tot een besluit leiden of alleen informeren?',
      vague: 'Tuurlijk, ik maak wat slides.',
      assume: 'Ik maak 40 slides voor de directievergadering van vrijdag.'
    }
  },
  'cafe-website': {
    context: 'De eigenaar van een klein café schrijft jou, de webdesigner die haar website heeft gebouwd.',
    text: 'De website ziet er raar uit, kun je dat oplossen?',
    ask: {
      what: 'Wat ziet er precies verkeerd uit: tekst, afbeeldingen of de opmaak?',
      where: 'Op welke pagina en op welk apparaat zie je het?',
      priority: 'Is het dringend? Kunnen klanten daardoor niet bestellen?'
    },
    given: { who: 'Het wordt jou gevraagd, als ontwerper van de site.' },
    replies: {
      clear: 'Vervelend! Wat ziet er precies verkeerd uit, op welke pagina en welk apparaat? En kunnen klanten daardoor niet bestellen?',
      vague: 'Ik kijk er even naar.',
      assume: 'Ik ontwerp deze week de hele website opnieuw.'
    }
  },
  'walk-report': {
    context: 'De voorzitter van je wandelclub schrijft je na de voorjaarswandeling.',
    text: 'Zou je een kort verslag van de wandeling willen schrijven?',
    ask: {
      when: 'Wanneer heb je het verslag nodig?',
      format: 'Alleen tekst of met foto’s? Voor de drukker of voor de website?',
      audience: 'Wie leest het: de leden of de lokale krant?'
    },
    given: { what: 'Het resultaat is duidelijk: een verslag van de wandeling.', scope: '‘Kort’ geeft een ruwe lengte; je kunt nog naar een aantal woorden vragen.' },
    replies: {
      clear: 'Graag! Voor wie is het, wanneer heb je het nodig, en zal ik foto’s toevoegen?',
      vague: 'Oké, ik schrijf wel iets.',
      assume: 'Ik stuur morgen een verslag van drie pagina’s met 50 foto’s naar de krant.'
    }
  },
  'office-paper': {
    context: 'De officemanager schrijft in het teamkanaal.',
    text: 'Het printerpapier raakt op, kan iemand nieuw bestellen?',
    ask: {
      when: 'Wanneer hebben we het nodig?',
      who: 'Wie moet de bestelling plaatsen?',
      scope: 'Hoeveel moeten we bestellen?'
    },
    given: { what: 'Het is duidelijk wat er nodig is: printerpapier.' },
    replies: {
      clear: 'Ik kan het bestellen. Hoeveel pakken, en wanneer hebben we ze nodig?',
      vague: 'Ja, iemand zou dat moeten doen.',
      assume: 'Ik heb 100 dozen besteld; ze komen volgende maand.'
    }
  },
  'anniversary': {
    context: 'Je partner belt je. Over twee maanden zijn zijn ouders 40 jaar getrouwd.',
    text: 'We moeten iets organiseren voor mijn ouders.',
    ask: {
      what: 'Waar denk je aan: een etentje, een feest of een cadeau?',
      when: 'Wanneer: op de dag zelf of in een weekend rond die datum?',
      who: 'Wie regelt welk deel: jij, ik, je broers en zussen?',
      scope: 'Hoe groot: alleen familie of veel gasten?'
    },
    given: { audience: 'Het is duidelijk voor wie: de ouders.', purpose: 'De aanleiding is duidelijk: het 40-jarig huwelijk.' },
    replies: {
      clear: 'Mooi idee! Waar denk je aan, wanneer, voor hoeveel mensen, en wie doet wat?',
      vague: 'Ja, dat moeten we doen.',
      assume: 'Ik heb voor volgende zaterdag een restaurant voor 60 personen gereserveerd.'
    }
  },
  'customer-reply': {
    context: 'Je leidinggevende stuurt je de klacht van een klant door over een levering die twee weken te laat is.',
    text: 'Neem alsjeblieft contact op met de klant.',
    ask: {
      what: 'Wat mag ik aanbieden: excuses, korting, een nieuwe leverdatum?',
      when: 'Hoe snel: vandaag nog?',
      format: 'Zal ik bellen of schrijven?'
    },
    given: { audience: 'Het is duidelijk wie: de klant.', purpose: 'De reden is duidelijk: de late levering.' },
    replies: {
      clear: 'Doe ik. Bellen of mailen, wanneer, en wat kan ik aanbieden?',
      vague: 'Oké.',
      assume: 'Ik heb de klant volledige terugbetaling en een jaar gratis verzending beloofd.'
    }
  },
  'shop-translation': {
    context: 'Een vriendin met een kleine webwinkel schrijft je omdat jij Spaans spreekt.',
    text: 'Zou je de teksten van mijn webwinkel kunnen vertalen?',
    ask: {
      when: 'Wanneer heb je de vertaling nodig?',
      audience: 'Zitten je klanten in Spanje of in Latijns-Amerika?',
      scope: 'Welke teksten en hoeveel: productbeschrijvingen, de hele site?'
    },
    given: { what: 'De taak is duidelijk: een vertaling naar het Spaans.', who: 'Het wordt jou direct gevraagd.' },
    replies: {
      clear: 'Help ik graag mee! Welke teksten, wanneer, en zitten je klanten in Spanje of in Latijns-Amerika?',
      vague: 'Tuurlijk, stuur maar eens op.',
      assume: 'Tuurlijk, ik vertaal morgen de hele site naar het Spaans, Portugees en Frans.'
    }
  },
  'basement': {
    context: 'De huismeester van je appartementengebouw schrijft alle bewoners.',
    text: 'Haal alstublieft uw spullen uit de kelder.',
    ask: {
      when: 'Wanneer moet de kelder leeg zijn?',
      where: 'Waar kunnen we onze spullen zolang neerzetten?',
      purpose: 'Wat is de reden, en is het maar tijdelijk?'
    },
    given: { what: 'Het is duidelijk wat bedoeld is: je eigen spullen in de kelder.', who: 'Alle bewoners wordt het gevraagd.' },
    replies: {
      clear: 'Bedankt voor het bericht. Wanneer, om welke reden, en is er een plek waar we onze spullen zolang kwijt kunnen?',
      vague: 'Oké.',
      rude: 'Ik haal helemaal niets weg. Zoek maar een andere oplossing.'
    }
  },
  'board-report': {
    context: 'Je leidinggevende schrijft op woensdag. Vorige week vertelde ze dat het kwartaalrapport naar de raad van bestuur gaat en hoogstens twee pagina’s mag zijn.',
    text: 'Stuur me het rapport alsjeblieft uiterlijk vrijdag.',
    ask: {
      format: 'Wil je een bewerkbaar bestand of een pdf?',
      criterion: 'Welke cijfers of onderdelen moeten erin staan om het compleet te maken?'
    },
    given: {
      what: 'Het is duidelijk welk rapport: het kwartaalrapport.',
      when: 'De deadline staat erin: vrijdag.',
      audience: 'Eerder gezegd: het rapport gaat naar de raad van bestuur.',
      scope: 'Eerder gezegd: hoogstens twee pagina’s.'
    },
    replies: {
      clear: 'Doe ik. Welke onderdelen moeten erin, en wil je een bewerkbaar bestand of een pdf?',
      vague: 'Tuurlijk, uiterlijk vrijdag.',
      redundant: 'Voor wie is het, hoe lang moet het zijn, en welk rapport bedoel je?'
    }
  },
  'school-pickup': {
    context: 'Je zus stuurt je een bericht. Haar twee kinderen zijn elke dag om 15.00 uur uit school; op dinsdag heeft de oudste voetbaltraining tot 17.00 uur.',
    text: 'Kun jij dinsdag de kinderen ophalen?',
    ask: {
      where: 'Waar moet ik ze daarna heen brengen: naar jouw huis of naar het mijne?',
      scope: 'Allebei, of alleen de jongste, omdat de oudste voetbal heeft?'
    },
    given: { when: 'Bekend uit de situatie: school is om 15.00 uur uit.', who: 'Het wordt jou direct gevraagd.' },
    replies: {
      clear: 'Ja, dat kan. Allebei of alleen de jongste? En breng ik ze naar jou of naar mij?',
      vague: 'Ja, tuurlijk.',
      redundant: 'Hoe laat zijn ze uit school, en op welke dag?'
    }
  },
  'checkout-bug': {
    context: 'Een productmanager reageert in de bugtracker van het team op een ticket met de titel ‘Afrekenknop doet niets op telefoons sinds update 2.3’.',
    text: 'Dringend, graag zo snel mogelijk oplossen.',
    ask: {
      who: 'Wie in het team pakt het op?',
      criterion: 'Op welke telefoons en browsers moet het werken voordat we het ticket sluiten?'
    },
    given: {
      what: 'De titel van het ticket noemt het probleem.',
      where: 'De titel zegt waar: op telefoons.',
      priority: '‘Dringend’ maakt de prioriteit duidelijk.'
    },
    replies: {
      clear: 'Ik ben ermee bezig. Wie pakt het op? En welke telefoons en browsers moeten we testen voordat we het ticket sluiten?',
      vague: 'We kijken ernaar.',
      redundant: 'Wat is er precies kapot, en is het dringend?'
    }
  },
  'client-room': {
    context: 'Je collega Ana schrijft je. Ze krijgt volgende week bezoek van twee klanten; het worden alleen zij drieën.',
    text: 'Zou je voor volgende week een vergaderruimte voor me kunnen boeken?',
    ask: {
      when: 'Welke dag en hoe laat, en voor hoe lang?',
      format: 'Heb je een scherm of videoapparatuur nodig?'
    },
    given: {
      what: 'De taak is duidelijk: een vergaderruimte boeken.',
      who: 'Jij moet hem boeken.',
      scope: 'Bekend uit de situatie: drie personen.'
    },
    replies: {
      clear: 'Prima. Welke dag en hoe laat, hoe lang, en heb je een scherm nodig?',
      vague: 'Oké, ik boek wel iets.',
      redundant: 'Hoeveel mensen komen er, en waarvoor heb je de ruimte nodig?'
    }
  },
  'newsletter': {
    context: 'De redacteur van de nieuwsbrief van je sportclub schrijft je. De nieuwsbrief gaat elke eerste maandag van de maand naar alle leden; elk stuk is ongeveer 200 woorden.',
    text: 'Zou je iets kunnen schrijven over de nieuwe trainingstijden?',
    ask: {
      what: 'Moet het hele nieuwe schema erin of alleen wat er veranderd is?',
      when: 'Wanneer heb je mijn tekst nodig? De verschijningsdatum is niet mijn deadline.'
    },
    given: { audience: 'Bekend uit de situatie: alle clubleden.', scope: 'Bekend uit de situatie: ongeveer 200 woorden.' },
    replies: {
      clear: 'Graag. Wanneer heb je het nodig, en zal ik het hele schema of alleen de wijzigingen noemen?',
      vague: 'Tuurlijk, ik schrijf wel iets.',
      redundant: 'Wie leest de nieuwsbrief, en hoe lang moet de tekst zijn?'
    }
  },
  'airport': {
    context: 'Je nicht stuurt je haar vluchtgegevens: landing zaterdag om 14.20 uur, terminal 2. Ze logeert een week bij jou.',
    text: 'Kun je me ophalen?',
    ask: { scope: 'Kom je alleen, en hoeveel bagage heb je? Past het in een kleine auto?' },
    given: {
      when: 'Bekend uit de vluchtgegevens: zaterdag om 14.20 uur.',
      where: 'Bekend uit de vluchtgegevens: terminal 2.',
      purpose: 'Bekend uit de situatie: ze logeert bij jou, dus de bestemming is duidelijk.'
    },
    replies: {
      clear: 'Natuurlijk! Kom je alleen, en hoeveel bagage heb je?',
      vague: 'Ja, tot dan.',
      redundant: 'Wanneer land je, en bij welke terminal?'
    }
  },
  'contract-check': {
    context: 'Een collega van inkoop mailt je een leverancierscontract van 30 pagina’s. Onderwerp: ‘Graag artikel 7 (aansprakelijkheid) controleren vóór donderdag 12.00 uur’.',
    text: 'Kijk er even naar, alsjeblieft.',
    ask: {
      format: 'Hoe wil je mijn feedback: opmerkingen in het document of een korte e-mail?',
      criterion: 'Waar moet ik op letten: risico’s, onduidelijke formuleringen of de bedragen?'
    },
    given: { what: 'Het onderwerp noemt het deel: artikel 7.', when: 'Het onderwerp noemt de deadline: donderdag 12.00 uur.' },
    replies: {
      clear: 'Doe ik vóór donderdag 12.00 uur. Waar moet ik op letten in artikel 7, en wil je opmerkingen in het bestand of een korte samenvatting?',
      vague: 'Ik kijk ernaar.',
      redundant: 'Welk deel moet ik lezen, en wanneer?'
    }
  },
  'shared-dinner': {
    context: 'Lina schrijft in de groepschat van vier vrienden. Eerder vandaag spraken ze af om zaterdag om 19.00 uur bij haar te eten.',
    text: 'Kan iedereen iets meenemen?',
    ask: {
      what: 'Wat neemt ieder van ons mee: een voorgerecht, een toetje of drinken?',
      criterion: 'Is er iets wat iemand niet kan of niet wil eten?'
    },
    given: { when: 'Eerder afgesproken: zaterdag om 19.00 uur.', where: 'Eerder afgesproken: bij Lina thuis.' },
    replies: {
      clear: 'Graag! Zullen we het verdelen: voorgerecht, toetje en drinken? En is er iets wat iemand niet kan eten?',
      vague: 'Tuurlijk, ik neem wel iets mee.',
      redundant: 'Waar spreken we af, en hoe laat?'
    }
  }
};
