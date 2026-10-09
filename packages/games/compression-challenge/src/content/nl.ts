import type { ContentText } from './types';

export const content: ContentText = {
  launch: {
    title: 'Update over de lancering van de app',
    context: 'Een e-mail van de projectleider aan het hele team.',
    sentences: {
      s1: 'Hallo allemaal, ik hoop dat jullie een fijn weekend in de zon hebben gehad.',
      s2: 'De lancering van onze boekingsapp verschuift van 2 april naar 14 mei.',
      s3: 'De reden is dat de betaalprovider zijn beveiligingscertificering nog niet heeft afgerond, en zonder die certificering kunnen we geen betalingen ontvangen.',
      s4: 'De provider zegt dat hij een achterstand in aanvragen heeft.',
      s5: 'Het designteam gebruikt de extra weken om de introductieschermen bij te schaven.',
      s6: 'Onze 300 bètatesters kunnen de testversie tot de lancering blijven gebruiken.',
      s7: 'Een concurrent bracht vorig jaar een vergelijkbare app uit en had daar drie pogingen voor nodig.',
      s8: 'Marketing moet de campagne verschuiven, dus beslis uiterlijk vrijdag over de nieuwe start van de campagne.',
      s9: 'Het budget blijft gelijk, omdat het bureau niets rekent voor het verschuiven van de campagne.',
      s10: 'De certificering zelf duurt ongeveer drie weken zodra die begint.',
      s11: 'Nogmaals bedankt voor al jullie harde werk!',
      s12: 'Woensdag stuur ik een bijgewerkte projectplanning.'
    },
    bullets: {
      gold1: 'De lancering verschuift van 2 april naar 14 mei.',
      gold2: 'Oorzaak: de beveiligingscertificering van de betaalprovider is niet afgerond.',
      gold3: 'Marketing moet uiterlijk vrijdag beslissen over de nieuwe campagnestart.',
      minor: 'Het designteam schaaft de introductieschermen bij.',
      distort: 'De app is gezakt voor de beveiligingscontrole.',
      dup: 'De lancering loopt vertraging op.',
      subtle: 'De lancering verschuift van 2 april naar 4 mei.'
    },
    bulletNotes: {
      distort: 'De tekst zegt dat de certificering nog niet is afgerond, niet dat de app ergens voor gezakt is.',
      dup: 'Herhaalt het punt over de nieuwe datum, maar zonder de datum, en verspilt zo een plek.',
      subtle: 'Bijna goed, maar de nieuwe datum is 14 mei, niet 4 mei.'
    },
    summaries: {
      faithful: 'De lancering verschuift naar 14 mei omdat de certificering van de betaalprovider niet is afgerond, en marketing moet uiterlijk vrijdag beslissen over de nieuwe campagnestart.',
      vague: 'Er zijn enkele wijzigingen in de planning van de lancering waarvan het team op de hoogte moet zijn.',
      drops: 'Omdat de betaalprovider nog niet klaar is, is de lancering uitgesteld, maar het budget blijft gelijk.',
      adds: 'De lancering verschuift naar 14 mei omdat de certificering van de betaalprovider niet is afgerond, en door de vertraging wordt het project duurder.',
      subtle: 'De lancering verschuift naar 14 mei omdat onze app is gezakt voor de certificering van de betaalprovider, en marketing moet uiterlijk vrijdag beslissen over de nieuwe campagnestart.'
    },
    summaryNotes: {
      drops: 'De nieuwe datum en de beslissing die marketing moet nemen ontbreken.',
      adds: 'Volgens de tekst blijft het budget gelijk; hogere kosten zijn verzonnen.',
      subtle: 'De app is nergens voor gezakt: de certificering is gewoon nog niet afgerond.'
    },
    task: 'Het marketingteam moet met deze one-liner aan de slag.',
    oneLiner: 'Verschuif de lancering naar mei.',
    details: {
      d1: 'De precieze nieuwe datum: 14 mei',
      d2: 'Wie actie moet ondernemen: marketing verschuift de campagne',
      d3: 'De deadline: uiterlijk vrijdag beslissen over de nieuwe campagnestart',
      d4: 'Waarom de provider achterloopt',
      d5: 'De plannen van het designteam voor de introductieschermen',
      d6: 'Het zonnige weekend'
    },
    versions: {
      actionable: 'De lancering verschuift van 2 april naar 14 mei. Marketing: verschuif de campagne en beslis uiterlijk vrijdag over de nieuwe startdatum. Het budget blijft gelijk.',
      vague: 'We verschuiven de lancering naar mei. Pas jullie planning daarop aan en laat het weten als er iets is.',
      invented: 'De lancering verschuift naar 1 mei. Marketing: annuleer de campagne en plan voor het eind van de maand een nieuwe.'
    },
    versionNote: 'De nieuwe datum is 14 mei, niet 1 mei, en de campagne wordt verschoven, niet geannuleerd.'
  },
  library: {
    title: 'Verbouwing van de bibliotheek',
    context: 'Een mededeling op de deur van de bibliotheek in de wijk.',
    sentences: {
      s1: 'Velen van u hebben ons verteld hoe graag u in de oude fauteuils in de leeshoek zit.',
      s2: 'Vanaf 3 juni is de bibliotheek acht weken gesloten voor een verbouwing.',
      s3: 'Het dak wordt gerepareerd en het gebouw krijgt een lift en nieuwe verlichting.',
      s4: 'Tijdens de sluiting stopt er elke dinsdag een bibliotheekbus op het marktplein.',
      s5: 'De bus heeft ongeveer 2.000 boeken aan boord en kan elke titel bij de centrale bibliotheek bestellen.',
      s6: 'Alle uitleningen die tijdens de sluiting zouden verlopen, worden automatisch verlengd, zodat niemand boete betaalt.',
      s7: 'Boeken kunnen ook op elk moment in de inleverbus naast het gemeentehuis worden ingeleverd.',
      s8: 'Het gemeentehuis zelf werd tien jaar geleden op een vergelijkbare manier verbouwd.',
      s9: 'Onze e-books en luisterboeken blijven gewoon online beschikbaar.',
      s10: 'We kijken nu al uit naar het zomerleesfestival van volgend jaar.',
      s11: 'De verbouwing wordt betaald uit een regionaal bouwfonds.'
    },
    bullets: {
      gold1: 'Vanaf 3 juni acht weken gesloten voor verbouwing.',
      gold2: 'Elke dinsdag stopt een bibliotheekbus op het marktplein.',
      gold3: 'Uitleningen die tijdens de sluiting verlopen, worden automatisch verlengd.',
      minor: 'Het gebouw krijgt nieuwe verlichting.',
      distort: 'Alle diensten van de bibliotheek liggen acht weken stil.',
      dup: 'De bibliotheek is een tijdje dicht.',
      subtle: 'Vanaf 3 juni zes weken gesloten voor verbouwing.'
    },
    bulletNotes: {
      distort: 'Klopt niet: de bus en de inleverbus blijven tijdens de sluiting werken.',
      dup: 'Herhaalt de sluiting zonder begindatum en zonder duur.',
      subtle: 'Bijna goed, maar de sluiting duurt acht weken, niet zes.'
    },
    summaries: {
      faithful: 'De bibliotheek sluit vanaf 3 juni acht weken; in die tijd komt er elke dinsdag een bus naar het marktplein en worden verlopen uitleningen automatisch verlengd.',
      vague: 'Er verandert deze zomer het een en ander bij de bibliotheek, dus houd het in de gaten.',
      drops: 'De bibliotheek wordt verbouwd en krijgt een gerepareerd dak, een lift en nieuwe verlichting.',
      adds: 'De bibliotheek sluit vanaf 3 juni acht weken en vraagt na de heropening een klein bedrag voor uitleningen.',
      subtle: 'Omdat het dak onveilig is, sluit de bibliotheek vanaf 3 juni acht weken; in die tijd komt er elke dinsdag een bus naar het marktplein.'
    },
    summaryNotes: {
      drops: 'Het beschrijft de verbouwing, maar niet wanneer de bibliotheek sluit of wat lezers in de tussentijd kunnen doen.',
      adds: 'Nergens in de mededeling staat iets over kosten na de heropening.',
      subtle: 'Volgens de mededeling wordt het dak gerepareerd, niet dat het onveilig is; die oorzaak is erbij verzonnen.'
    },
    task: 'Een buurman die boeken wil blijven lenen, vraagt u ernaar.',
    oneLiner: 'De bibliotheek is in de zomer dicht.',
    details: {
      d1: 'Wanneer precies: acht weken vanaf 3 juni',
      d2: 'Waar je intussen leent: de bus op het marktplein op dinsdag',
      d3: 'Waar je boeken inlevert: de inleverbus naast het gemeentehuis',
      d4: 'Wat er bij de verbouwing gebeurt',
      d5: 'De fauteuils in de leeshoek',
      d6: 'Het leesfestival van volgend jaar'
    },
    versions: {
      actionable: 'Vanaf 3 juni is de bibliotheek acht weken dicht. Je kunt elke dinsdag boeken lenen bij de bibliotheekbus op het marktplein en ze op elk moment inleveren in de inleverbus naast het gemeentehuis. Wat in die tijd verloopt, wordt automatisch verlengd.',
      vague: 'De bibliotheek is in de zomer een tijdje dicht vanwege een verbouwing. Er zijn andere mogelijkheden, dus kijk even op de mededeling.',
      invented: 'Vanaf 3 juni is de bibliotheek acht weken dicht. Je kunt elke vrijdag boeken lenen bij de bibliotheekbus bij het station. Lever alle boeken in vóór de sluiting.'
    },
    versionNote: 'De bus stopt op dinsdag op het marktplein, en niemand hoeft boeken vóór de sluiting in te leveren.'
  },
  leaves: {
    title: 'Waarom bladeren verkleuren',
    context: 'Een kort artikel uit een natuurtijdschrift voor nieuwsgierige lezers.',
    sentences: {
      s1: 'De herfst is voor veel mensen het favoriete seizoen voor lange wandelingen.',
      s2: 'Bladeren zijn groen omdat ze veel bladgroen bevatten, het pigment waarmee planten zonlicht opvangen.',
      s3: 'Als de dagen korter worden, stoppen veel bomen met het aanmaken van bladgroen en breken ze het af.',
      s4: 'Gele en oranje pigmenten, carotenoïden genoemd, zaten al die tijd in het blad; ze worden pas zichtbaar als het groen verdwijnt.',
      s5: 'Carotenoïden zijn hetzelfde soort pigment dat wortels oranje maakt.',
      s6: 'Rood is anders: sommige bomen, zoals veel esdoorns, maken in de herfst nieuwe rode pigmenten aan.',
      s7: 'Onderzoekers denken dat deze rode pigmenten het blad mogelijk beschermen tegen fel licht terwijl de boom voedingsstoffen terughaalt.',
      s8: 'Zonnige dagen en koele nachten maken het rood meestal feller.',
      s9: 'In sommige streken trekken kleurrijke bossen elk jaar veel toeristen.',
      s10: 'Ten slotte vormt zich een dun laagje cellen waar het blad aan het twijgje vastzit, en het blad valt.',
      s11: 'Vergeet geen warme jas als u naar buiten gaat om naar de bomen te kijken.'
    },
    bullets: {
      gold1: 'In de herfst stoppen bomen met het aanmaken van groen bladgroen en breken het af.',
      gold2: 'Gele en oranje pigmenten waren er al die tijd en worden zichtbaar.',
      gold3: 'Sommige bomen, zoals esdoorns, maken nieuwe rode pigmenten aan.',
      minor: 'Er vormt zich een dun laagje cellen en het blad valt.',
      distort: 'Alle herfstkleuren zijn nieuwe pigmenten die de boom aanmaakt.',
      dup: 'Bladeren verliezen hun groene kleur.',
      subtle: 'Rode pigmenten beschermen het blad tegen fel licht.'
    },
    bulletNotes: {
      distort: 'Alleen het rood is nieuw; geel en oranje zaten al die tijd in het blad.',
      dup: 'Zegt minder dan het punt over bladgroen en verspilt een plek.',
      subtle: 'De tekst zegt alleen dat onderzoekers denken dat de rode pigmenten het blad mogelijk beschermen; dit punt brengt het als een feit.'
    },
    summaries: {
      faithful: 'In de herfst breken veel bomen hun groene bladgroen af, waardoor gele en oranje pigmenten zichtbaar worden die er al die tijd waren, terwijl sommige bomen ook nieuwe rode aanmaken.',
      vague: 'Bladeren verkleuren in de herfst door allerlei natuurlijke processen in de boom.',
      drops: 'In de herfst worden bladeren geel, oranje en rood, en daarna vallen ze van de bomen.',
      adds: 'In de herfst breken veel bomen hun groene bladgroen af, waardoor gele en oranje pigmenten zichtbaar worden, en hoe roder de bladeren, hoe kouder de komende winter.',
      subtle: 'In de herfst breken veel bomen hun groene bladgroen af, waardoor gele en oranje pigmenten zichtbaar worden, en koude nachten zorgen ervoor dat de bomen rode aanmaken.'
    },
    summaryNotes: {
      drops: 'Het beschrijft wat we zien, maar niet waarom het gebeurt.',
      adds: 'De tekst zegt niets over het voorspellen van de winter.',
      subtle: 'Koele nachten maken het rood alleen meestal feller; de tekst zegt niet dat ze de rode pigmenten veroorzaken.'
    },
    task: 'Een leraar wil deze one-liner aan een klas uitleggen met echte bladeren.',
    oneLiner: 'Het bladgroen wordt afgebroken, dus komen andere kleuren tevoorschijn.',
    details: {
      d1: 'Wat bladgroen is: het groene pigment dat zonlicht opvangt',
      d2: 'Dat geel en oranje al die tijd in het blad zaten',
      d3: 'Dat sommige bomen, zoals esdoorns, nieuwe rode pigmenten aanmaken',
      d4: 'Dat de herfst een populair seizoen is om te wandelen',
      d5: 'Dat je buiten een warme jas nodig hebt',
      d6: 'Hoe het blad uiteindelijk afvalt'
    },
    versions: {
      actionable: 'Bladeren zijn groen door bladgroen, een pigment dat zonlicht opvangt. In de herfst stoppen veel bomen met het aanmaken ervan en breken ze het af. Dan worden gele en oranje pigmenten zichtbaar die er al die tijd waren, en sommige bomen, zoals esdoorns, maken nieuwe rode aan.',
      vague: 'In de herfst veranderen de bladeren omdat het groen verdwijnt en er andere kleuren tevoorschijn komen. Zo fascinerend is de natuur.',
      invented: 'Bladeren zijn groen door bladgroen. In de herfst bevriest de vorst het bladgroen, en dan kleurt de boom zijn bladeren geel, oranje en rood met nieuwe pigmenten.'
    },
    versionNote: 'De tekst zegt niet dat vorst het bladgroen laat bevriezen, en alleen het rood is een nieuw pigment.'
  },
  club: {
    title: 'Bestuursvergadering van de sportclub',
    context: 'De notulen van een bestuursvergadering van een sportclub, gestuurd aan alle leden.',
    sentences: {
      s1: 'De vergadering vond plaats in het clubhuis en begon iets later vanwege een voetbalwedstrijd.',
      s2: 'Het bestuur stelt voor de jaarlijkse contributie vanaf januari te verhogen van 60 naar 66 euro.',
      s3: 'De reden is dat de huur van de sporthal met 15 procent is gestegen.',
      s4: 'De contributie is al acht jaar niet veranderd.',
      s5: 'Leden onder de 18 blijven de oude contributie betalen.',
      s6: 'De leden stemmen over het voorstel op de algemene ledenvergadering van 12 maart.',
      s7: 'Het bestuur besprak ook nieuwe netten voor de tennisbanen, maar stelde een besluit uit.',
      s8: 'Als het voorstel wordt verworpen, kijkt het bestuur in plaats daarvan naar het schrappen van enkele trainingstijden.',
      s9: 'Een club in de buurt heeft zijn contributie onlangs ook verhoogd, naar 75 euro.',
      s10: 'De hal is van de gemeente, die de huur vaststelt.',
      s11: 'Heel veel dank aan de jeugd voor de heerlijke taarten!'
    },
    bullets: {
      gold1: 'Voorstel: de jaarcontributie stijgt vanaf januari van 60 naar 66 euro.',
      gold2: 'Leden onder de 18 blijven de oude contributie betalen.',
      gold3: 'De leden stemmen erover op de algemene ledenvergadering van 12 maart.',
      minor: 'Er is gesproken over nieuwe netten voor de tennisbanen.',
      distort: 'Het bestuur heeft besloten de contributie te verhogen.',
      dup: 'De contributie gaat misschien omhoog.',
      subtle: 'Voorstel: de jaarcontributie stijgt vanaf januari van 60 naar 76 euro.'
    },
    bulletNotes: {
      distort: 'Er is nog niets besloten: het is een voorstel, en de leden stemmen erover.',
      dup: 'Een vagere herhaling van het contributiepunt, zonder bedragen.',
      subtle: 'Bijna goed, maar de voorgestelde contributie is 66 euro, niet 76.'
    },
    summaries: {
      faithful: 'Omdat de huur van de hal is gestegen, stelt het bestuur voor de jaarcontributie vanaf januari te verhogen van 60 naar 66 euro, behalve voor leden onder de 18, en de leden stemmen er op 12 maart over.',
      vague: 'Het bestuur heeft gesproken over geldzaken en enkele veranderingen voor leden.',
      drops: 'Omdat de huur van de sporthal is gestegen, waren de financiën van de club het hoofdonderwerp van de bestuursvergadering.',
      adds: 'Het bestuur stelt voor de jaarcontributie vanaf januari te verhogen van 60 naar 66 euro, en wie niet vóór maart betaalt, verliest zijn lidmaatschap.',
      subtle: 'Omdat de huur van de hal is gestegen, heeft het bestuur besloten de jaarcontributie vanaf januari te verhogen van 60 naar 66 euro, behalve voor leden onder de 18.'
    },
    summaryNotes: {
      drops: 'De voorgestelde nieuwe contributie en de stemming op 12 maart ontbreken.',
      adds: 'In de notulen staat niets over het verliezen van het lidmaatschap.',
      subtle: 'Het is alleen een voorstel waarover de leden nog stemmen, dus ‘heeft besloten’ klopt niet.'
    },
    task: 'Een lid vraagt u wat dit voor hem betekent.',
    oneLiner: 'De contributie gaat omhoog.',
    details: {
      d1: 'De bedragen: van 60 naar 66 euro per jaar',
      d2: 'Dat het een voorstel is, waarover op 12 maart wordt gestemd',
      d3: 'Dat leden onder de 18 de oude contributie houden',
      d4: 'Dat de vergadering later begon',
      d5: 'De taarten van de jeugd',
      d6: 'Het gesprek over tennisnetten'
    },
    versions: {
      actionable: 'Het bestuur stelt voor de jaarcontributie vanaf januari te verhogen van 60 naar 66 euro, omdat de huur van de hal is gestegen. Leden onder de 18 houden de oude contributie. Er is nog niets besloten: je kunt erover stemmen op de algemene ledenvergadering van 12 maart.',
      vague: 'De contributie gaat volgend jaar omhoog, omdat alles duurder is geworden. Meer informatie volgt nog.',
      invented: 'Vanaf januari stijgt de contributie voor iedereen van 60 naar 66 euro. Pas je overboeking aan vóór de algemene ledenvergadering van 12 maart.'
    },
    versionNote: 'Het behandelt een voorstel als besluit en vergeet dat leden onder de 18 de oude contributie houden.'
  },
  trip: {
    title: 'Wijziging in het schoolreisje',
    context: 'Een bericht van een leraar aan de ouders van een klas.',
    sentences: {
      s1: 'Ik hoop dat de kinderen net zo uitkijken naar het reisje als ik!',
      s2: 'Door een spoorstaking reizen we met de touringcar naar de kust in plaats van met de trein.',
      s3: 'Daardoor vertrekken we een uur eerder dan gepland.',
      s4: 'Het verzamelpunt is niet meer het station, maar de parkeerplaats achter de school.',
      s5: 'Het busbedrijf heeft veel ervaring met schoolgroepen.',
      s6: 'De terugreis op vrijdag blijft zoals gepland.',
      s7: 'Er zijn geen extra kosten voor gezinnen; de school betaalt het verschil.',
      s8: 'De busreis duurt ongeveer 40 minuten langer dan de trein.',
      s9: 'De klas van vorig jaar ging naar de bergen, en dat was ook een geweldige reis.',
      s10: 'Halverwege is er een korte pauze bij een wegrestaurant.',
      s11: 'Iedereen bedankt voor de hulp bij de paklijsten.'
    },
    bullets: {
      gold1: 'Touringcar in plaats van trein vanwege een spoorstaking.',
      gold2: 'Vertrek een uur eerder, vanaf de parkeerplaats achter de school.',
      gold3: 'Geen extra kosten voor gezinnen.',
      minor: 'Het busbedrijf heeft ervaring met schoolgroepen.',
      distort: 'Het reisje wordt ingekort vanwege de staking.',
      dup: 'De reisplannen zijn veranderd.',
      subtle: 'Vertrek twee uur eerder, vanaf de parkeerplaats achter de school.'
    },
    bulletNotes: {
      distort: 'Alleen de heenreis verandert; het reisje wordt niet ingekort.',
      dup: 'Zegt alleen dat er iets is veranderd, wat de andere punten al laten zien.',
      subtle: 'Bijna goed, maar het vertrek is een uur eerder, niet twee.'
    },
    summaries: {
      faithful: 'Door een spoorstaking reist de klas met de touringcar en vertrekt een uur eerder vanaf de parkeerplaats achter de school, zonder extra kosten voor gezinnen.',
      vague: 'Er zijn een paar wijzigingen in de regeling van het reisje die ouders moeten weten.',
      drops: 'Door een spoorstaking reist de klas met de touringcar naar de kust, wat gezinnen niets extra kost.',
      adds: 'Door een spoorstaking reist de klas met de touringcar en vertrekt een uur eerder vanaf de parkeerplaats achter de school, en ouders betalen een kleine toeslag.',
      subtle: 'Omdat de touringcar sneller is dan de trein, reist de klas met de bus en vertrekt een uur eerder vanaf de parkeerplaats achter de school, zonder extra kosten voor gezinnen.'
    },
    summaryNotes: {
      drops: 'Wat ouders moeten doen ontbreekt: het eerdere vertrek en het nieuwe verzamelpunt.',
      adds: 'Volgens het bericht betaalt de school het verschil, dus er is geen toeslag.',
      subtle: 'De reden is de spoorstaking, en de bus is zelfs langzamer dan de trein.'
    },
    task: 'Een ouder die het bericht heeft gemist, vraagt een andere ouder wat er moet gebeuren.',
    oneLiner: 'De klas gaat nu met de bus.',
    details: {
      d1: 'Het nieuwe verzamelpunt: de parkeerplaats achter de school',
      d2: 'De nieuwe tijd: een uur eerder dan gepland',
      d3: 'Dat er geen extra kosten zijn',
      d4: 'Dat het busbedrijf ervaren is',
      d5: 'Waarom ze niet met de trein gaan',
      d6: 'Dat de leraar zich op het reisje verheugt'
    },
    versions: {
      actionable: 'De klas gaat met de touringcar. Breng je kind een uur eerder dan gepland naar de parkeerplaats achter de school, niet naar het station. Het kost niets extra, en de terugreis op vrijdag blijft hetzelfde.',
      vague: 'Er is een staking, dus ze gaan nu met de bus. Tijden en plekken zijn een beetje anders, dus kijk even wat de leraar heeft geschreven.',
      invented: 'De klas gaat met de touringcar. Breng je kind een uur eerder naar het station en geef het wat geld mee voor het buskaartje.'
    },
    versionNote: 'Het verzamelpunt is de parkeerplaats achter de school, niet het station, en de school betaalt de kosten.'
  },
  bikes: {
    title: 'E-bikes bij de deelfietsen',
    context: 'Een aankondiging van de deelfietsdienst van een stad aan zijn gebruikers.',
    sentences: {
      s1: 'Fietsen is een prima manier om actief te blijven en de stad te ontdekken.',
      s2: 'Vanaf 1 juli voegt onze deelfietsdienst 200 elektrische fietsen aan de vloot toe.',
      s3: 'Een e-bike kost 20 cent per minuut; de gewone fietsen houden hun huidige prijs.',
      s4: 'Om een e-bike te ontgrendelen heb je de nieuwste versie van onze app nodig.',
      s5: 'De e-bikes hebben een bereik van ongeveer 60 kilometer per acculading.',
      s6: 'E-bikes moeten worden teruggebracht naar een van de 12 laadstations; ze mogen nergens anders worden achtergelaten.',
      s7: 'Een kaart met de laadstations staat in de app.',
      s8: 'Wie een e-bike buiten een station achterlaat, betaalt 10 euro.',
      s9: 'Verschillende andere steden hebben de afgelopen jaren vergelijkbare diensten ingevoerd.',
      s10: 'De fietsen zijn deze winter getest door 50 vrijwilligers.',
      s11: 'Bedankt dat je met ons fietst!'
    },
    bullets: {
      gold1: 'Vanaf 1 juli: 200 e-bikes voor 20 cent per minuut.',
      gold2: 'Ontgrendelen vraagt de nieuwste versie van de app.',
      gold3: 'E-bikes moeten terug naar een van de 12 laadstations.',
      minor: 'Een kaart met de laadstations staat in de app.',
      distort: 'De e-bikes vervangen de gewone fietsen.',
      dup: 'Er zijn nieuwe fietsen.',
      subtle: 'Vanaf 1 juli: 200 e-bikes voor 25 cent per minuut.'
    },
    bulletNotes: {
      distort: 'De e-bikes komen erbij; de gewone fietsen blijven, voor hun huidige prijs.',
      dup: 'Een vagere herhaling van het eerste punt, zonder datum, aantal of prijs.',
      subtle: 'Bijna goed, maar de prijs is 20 cent per minuut, niet 25.'
    },
    summaries: {
      faithful: 'Vanaf 1 juli zijn er 200 e-bikes voor 20 cent per minuut; je ontgrendelt ze met de nieuwste app en brengt ze terug naar een van de 12 laadstations.',
      vague: 'De deelfietsdienst introduceert deze zomer iets nieuws dat gebruikers interessant kunnen vinden.',
      drops: 'De deelfietsdienst voegt 200 e-bikes toe met een bereik van ongeveer 60 kilometer, zodat langere ritten makkelijker worden.',
      adds: 'Vanaf 1 juli zijn er 200 e-bikes voor 20 cent per minuut, en de gewone fietsen verdwijnen volgend jaar.',
      subtle: 'Vanaf 1 juli zijn er 200 e-bikes voor 20 cent per minuut; je ontgrendelt ze met de nieuwste app en kunt ze bij elk fietsstation terugbrengen.'
    },
    summaryNotes: {
      drops: 'De prijs ontbreekt, en ook wat gebruikers moeten doen: de app bijwerken en e-bikes naar een laadstation terugbrengen.',
      adds: 'Nergens in de aankondiging staat dat de gewone fietsen verdwijnen.',
      subtle: 'E-bikes kunnen alleen bij de 12 laadstations worden teruggebracht, niet bij elk station.'
    },
    task: 'Een vriendin wil volgende week een e-bike uitproberen.',
    oneLiner: 'Er zijn nu e-bikes.',
    details: {
      d1: 'De prijs: 20 cent per minuut',
      d2: 'Dat je voor het ontgrendelen de nieuwste app nodig hebt',
      d3: 'Dat e-bikes terug moeten naar een laadstation',
      d4: 'Dat fietsen je actief houdt',
      d5: 'Hoeveel e-bikes er in totaal zijn',
      d6: 'Dat de gewone fietsen hun prijs houden'
    },
    versions: {
      actionable: 'Vanaf 1 juli kun je e-bikes huren voor 20 cent per minuut. Werk eerst de app bij, want voor het ontgrendelen heb je de nieuwste versie nodig. Breng de fiets daarna terug naar een van de 12 laadstations op de kaart in de app.',
      vague: 'Er zijn nu e-bikes, en die zijn heel makkelijk. Download gewoon de app en fiets weg.',
      invented: 'Vanaf 1 juli kun je zonder app e-bikes huren voor 20 cent per minuut, en je kunt ze daarna overal in de stad laten staan.'
    },
    versionNote: 'Voor het ontgrendelen heb je de nieuwste app nodig, en de fietsen moeten terug naar een laadstation.'
  }
};
