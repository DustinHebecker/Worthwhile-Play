import type { ContentText } from './types';

export const content: ContentText = {
  migration: {
    title: 'Databasemigratie',
    situation: 'Je team verhuist de klantendatabase naar een nieuw systeem. De tests hebben een probleem gevonden en de overstap loopt vertraging op. Leg het uit.',
    facts: {
      newDate: 'De overstap schuift twee dagen op: donderdag in plaats van dinsdag.',
      cause: 'De tests vonden een tot nu toe onbekende fout met speciale tekens zoals ü of é.',
      noLoss: 'Er zijn geen gegevens verloren gegaan.',
      encoding: 'Het importscript leest tekst in de verkeerde tekencodering.',
      apology: 'Onze excuses voor het ongemak.',
      regression: 'Een nieuwe automatische test controleert nu speciale tekens.',
      buffer: 'De twee dagen passen in de tijdsbuffer van het project, zonder extra kosten.',
      library: 'De foute conversie komt uit een bibliotheek die jaren geleden is gekozen.'
    },
    reasons: {
      'developer.cause': 'Ontwikkelaars moeten weten wat de tests precies hebben gevonden.',
      'developer.encoding': 'Dit is de echte oorzaak waaraan ze gaan werken.',
      'developer.apology': 'Excuses aan klanten helpen een collega niet om de fout op te lossen.',
      'developer.regression': 'Ze moeten weten dat de fout nu door een test wordt afgedekt.',
      'developer.buffer': 'Tijdsbuffer en budget zijn een zaak van de projectleider.',
      'projectManager.newDate': 'De projectleider plant met de nieuwe datum.',
      'projectManager.noLoss': 'Gegevensverlies zou het risico volledig veranderen, dus moet hij horen dat het er niet is.',
      'projectManager.encoding': 'Het detail over de codering verandert geen enkele planningsbeslissing.',
      'projectManager.apology': 'Excuses zijn voor klanten; de projectleider heeft feiten nodig.',
      'projectManager.buffer': 'Of planning en budget nog kloppen, is precies zijn vraag.',
      'projectManager.library': 'Wie jaren geleden een bibliotheek koos, helpt de planning nu niet.',
      'customer.newDate': 'De klant heeft de nieuwe datum nodig, niet het soort fout.',
      'customer.noLoss': 'Zijn eerste zorg zijn zijn gegevens, en die zijn veilig.',
      'customer.cause': 'Details over fouten maken klanten ongerust zonder ze te helpen.',
      'customer.encoding': 'Technische details zeggen de klant niets.',
      'customer.regression': 'Interne tests zijn niet de zorg van de klant.',
      'customer.buffer': 'Interne buffers en kosten gaan de klant niet aan.',
      'customer.library': 'De schuld op een oude bibliotheek schuiven klinkt als een excuus.'
    },
    messages: {
      'developer.fit': 'Even ter info: het importscript leest tekst in de verkeerde codering, waardoor speciale tekens zoals ü en é stukgaan. Een regressietest dekt dat nu af; de overstap schuift naar donderdag.',
      'developer.missing': 'Kleine vertraging bij de migratie, niets ernstigs. Details volgen.',
      'developer.condescending': 'Speciale tekens zijn letters zoals ü die niet in het basisalfabet staan. Computers slaan letters op als getallen, en soms raken die getallen door elkaar.',
      'projectManager.fit': 'De migratie schuift van dinsdag naar donderdag. Er zijn geen gegevens verloren en de twee dagen passen zonder extra kosten in onze buffer. Oorzaak: een fout met speciale tekens, nu afgedekt door een test.',
      'projectManager.tooMuch': 'Het importscript decodeert de invoer als Latin-1 in plaats van UTF-8, waardoor multibyte-tekens beschadigd raken; we patchen de reader en voegen een regressietest toe.',
      'projectManager.missing': 'We hebben een fout gevonden en werken eraan. We laten het je weten.',
      'customer.fit': 'Uw gegevens zijn veilig. Om ervoor te zorgen dat elke naam en elk adres correct wordt overgenomen, verschuiven we de overstap van dinsdag naar donderdag. Tot dan werkt alles zoals altijd.',
      'customer.tooMuch': 'Ons importscript gebruikte de verkeerde tekencodering, waardoor speciale tekens in testruns beschadigd raakten; de migratie heeft daarom twee extra dagen uit onze buffer nodig.',
      'customer.condescending': 'Maakt u zich geen zorgen over de techniek, dat is ingewikkeld. Het wordt gewoon iets later.'
    }
  },
  skyBlue: {
    title: 'Waarom de lucht blauw is',
    situation: 'Iemand vraagt je waarom de lucht blauw is. Je kent de natuurkunde erachter. Leg het uit.',
    facts: {
      sunlight: 'Zonlicht bevat alle kleuren.',
      scatter: 'Lucht verstrooit blauw licht veel sterker dan rood licht.',
      rayleigh: 'Deze rayleighverstrooiing groeit met de vierde macht van de frequentie (1/λ⁴).',
      sunset: 'Bij zonsondergang gaat het licht door meer lucht, daardoor kleurt de lucht rood en oranje.',
      everywhere: 'Verstrooid blauw licht bereikt je ogen uit alle richtingen, daarom lijkt de hele lucht blauw.',
      violet: 'Violet wordt nog sterker verstrooid, maar zonlicht bevat minder violet en onze ogen zijn er minder gevoelig voor.',
      molecules: 'De verstrooiing komt van stikstof- en zuurstofmoleculen, die veel kleiner zijn dan de golflengte van licht.',
      ocean: 'De lucht is blauw omdat ze de zee weerspiegelt.'
    },
    reasons: {
      'child.sunlight': 'Kinderen hebben eerst de verrassing nodig: in wit zonlicht zitten alle kleuren.',
      'child.scatter': 'Dit is het kernidee, in eenvoudige woorden.',
      'child.rayleigh': 'Met een formule ben je een kind meteen kwijt.',
      'child.everywhere': 'Het verklaart wat ze zien: blauw, waar ze ook kijken.',
      'child.violet': 'Het detail over violet verwart op deze leeftijd meer dan het helpt.',
      'child.molecules': 'Moleculen en golflengtes zijn te abstract voor een kind.',
      'layperson.sunlight': 'Zonder dit is „blauw licht wordt verstrooid” onbegrijpelijk.',
      'layperson.scatter': 'Dit is het eigenlijke antwoord, in gewone taal.',
      'layperson.rayleigh': 'De formule voegt niets toe waar een leek iets mee kan.',
      'expert.rayleigh': 'Een expert verwacht het precieze mechanisme en de afhankelijkheid van de golflengte.',
      'expert.everywhere': 'Dit is vanzelfsprekend voor een expert en kost alleen tijd.',
      'expert.violet': 'Experts kennen de voor de hand liggende tegenwerping „waarom niet violet?” – beantwoord die.',
      'expert.molecules': 'De verstrooiers en de grootteverhouding noemen maakt de uitleg precies.',
      ocean: 'Dit is een bekende mythe; de kleur komt niet van de zee.'
    },
    messages: {
      'child.fit': 'Zonlicht ziet er wit uit, maar eigenlijk zijn alle kleuren erin gemengd. Als het door de lucht vliegt, wordt het blauwe deel het meest heen en weer gekaatst, dus komt er van overal in de lucht blauw naar je ogen.',
      'child.tooMuch': 'Blauw licht heeft een kortere golflengte, en rayleighverstrooiing groeit met één gedeeld door de golflengte tot de vierde macht.',
      'child.missing': 'Zo is de lucht nu eenmaal. Hij is altijd blauw geweest.',
      'layperson.fit': 'Zonlicht bevat alle kleuren. De lucht verstrooit blauw licht veel sterker dan rood, daardoor bereikt blauw licht ons uit elk deel van de hemel.',
      'layperson.tooMuch': 'Het is rayleighverstrooiing: de intensiteit schaalt met 1/λ⁴, dus korte golflengtes domineren de diffuse hemelstraling.',
      'layperson.condescending': 'Het is een beetje ingewikkeld voor niet-wetenschappers. Laten we zeggen dat de lucht hem blauw maakt.',
      'expert.fit': 'Rayleighverstrooiing aan N₂- en O₂-moleculen, evenredig met 1/λ⁴. Violet wordt nog sterker verstrooid, maar het zonnespectrum bevat minder violet en onze kegeltjes zijn er minder gevoelig voor.',
      'expert.condescending': 'Stel je zonlicht voor als een doos kleurpotloden! De lucht speelt het liefst met het blauwe potlood.',
      'expert.missing': 'De lucht verstrooit blauw licht sterker, daarom.'
    }
  },
  clubRoof: {
    title: 'Dak van het clubhuis',
    situation: 'Het dak van het clubhuis van je sportclub moet dringend worden gerepareerd, en het kost meer dan gepland. Leg het uit.',
    facts: {
      cost: 'De reparatie kost 8.000 euro, 3.000 meer dan begroot.',
      decision: 'Het bestuur moet vóór vrijdag beslissen of er 3.000 euro uit het budget van het zomerfeest wordt overgeheveld.',
      storage: 'De materiaalruimte blijft dicht tot de reparatie; de rest van het clubhuis is open.',
      fees: 'De contributie verandert niet.',
      schedule: 'De dakdekker begint op 12 mei en heeft vier dagen nodig; het parkeerterrein is nodig voor de steiger.',
      tiles: 'De nieuwe pannen zijn antracietkleurige betonpannen.',
      reserve: 'Als je in plaats daarvan de reserve gebruikt, zakt die onder het verplichte minimum.',
      volunteer: 'Een lid bood aan het dak gratis zelf te repareren, maar hij is geen dakdekker.'
    },
    reasons: {
      'executive.cost': 'Het bestuur heeft het bedrag en de overschrijding nodig om te oordelen.',
      'executive.decision': 'Dit is de beslissing die het moet nemen, met de deadline.',
      'executive.storage': 'Het dagelijkse gebruik van ruimtes is geen bestuurszaak.',
      'executive.schedule': 'De precieze werkdagen zijn de taak van de coördinator.',
      'executive.tiles': 'Soort en kleur van de pannen hebben geen invloed op de beslissing.',
      'executive.reserve': 'Het legt uit waarom het voor de hand liggende alternatief geen optie is.',
      'projectManager.fees': 'De contributie heeft niets te maken met het organiseren van de reparatie.',
      'projectManager.schedule': 'Precies deze data en het parkeerterrein regelt de coördinator.',
      'projectManager.reserve': 'De financiering is een beslissing van het bestuur, niet van de coördinator.',
      'layperson.storage': 'Leden willen weten wat ze wel en niet kunnen gebruiken.',
      'layperson.fees': 'Hun eigen geld is hun eerste vraag.',
      'layperson.tiles': 'Materiaaldetails doen er voor leden niet toe.',
      'layperson.reserve': 'Regels over de reserve zijn interne financiële details.',
      volunteer: 'Een aanbod zonder de juiste vakkennis leidt alleen tot een zinloze discussie; het is geen echte optie.'
    },
    messages: {
      'executive.fit': 'Beslissing nodig vóór vrijdag: de dakreparatie kost 8.000 euro, 3.000 meer dan begroot. We stellen voor 3.000 over te hevelen uit het budget van het zomerfeest, omdat de reserve anders onder het minimum zakt.',
      'executive.tooMuch': 'De dakdekker begint op 12 mei met antracietkleurige betonpannen; de steiger staat vier dagen op het parkeerterrein en de materiaalruimte blijft tot dan dicht.',
      'executive.missing': 'Het dak wordt duurder. We houden jullie op de hoogte.',
      'projectManager.fit': 'De dakdekker begint op 12 mei en heeft vier dagen nodig. Houd het parkeerterrein vanaf 11 mei vrij voor de steiger.',
      'projectManager.tooMuch': 'De reparatie kost 8.000 euro, 3.000 boven budget; het bestuur hevelt misschien geld over van het zomerfeest, omdat de reserve niet onder het minimum mag, en de contributie blijft gelijk.',
      'projectManager.missing': 'Ergens in mei komt er werk aan het dak.',
      'layperson.fit': 'Het dak van het clubhuis wordt in mei gerepareerd. Tot dan blijft de materiaalruimte dicht; al het andere is gewoon open. De contributie verandert niet.',
      'layperson.tooMuch': 'De reparatie kost 8.000 euro, 3.000 boven budget; het bestuur overweegt geld over te hevelen van het zomerfeest, omdat de reserve niet onder het minimum mag zakken.',
      'layperson.condescending': 'Maak je geen zorgen over het dak, het bestuur regelt de grotemensenzaken.'
    }
  },
  shopOutage: {
    title: 'Storing in de webwinkel',
    situation: 'De webwinkel van je bedrijf lag gisteren drie uur plat. Leg uit wat er is gebeurd.',
    facts: {
      duration: 'De winkel lag gisteravond drie uur plat.',
      revenue: 'Er is voor ongeveer 40.000 euro aan bestellingen verloren gegaan.',
      cause: 'Een verlopen beveiligingscertificaat blokkeerde de betalingen.',
      fixed: 'Het certificaat is vernieuwd; de winkel werkt weer normaal.',
      renewal: 'Het vernieuwen wordt geautomatiseerd, met een waarschuwing twee weken van tevoren; dat kost het team één dag.',
      voucher: 'Klanten van wie de bestelling mislukte, krijgen per e-mail een tegoedbon van 10%.',
      approval: 'De directie wordt gevraagd 5.000 euro goed te keuren voor betere monitoring.',
      competitor: 'De winkel van een concurrent had vorige maand een vergelijkbare storing.'
    },
    reasons: {
      'projectManager.cause': 'De projectleider heeft de oorzaak nodig om de oplossing te beoordelen.',
      'projectManager.renewal': 'Dit is het werk dat hij moet inplannen: één dag van het team.',
      'projectManager.voucher': 'Tegoedbonnen regelt de klantenservice, niet het project.',
      'executive.duration': 'De directie heeft de omvang van het incident nodig.',
      'executive.revenue': 'Voor de directie komt de zakelijke impact eerst.',
      'executive.cause': 'Het technische detail verandert hun beslissing niet; „een gemiste vernieuwing” is genoeg.',
      'executive.renewal': 'Ze moeten horen dat het niet opnieuw gebeurt.',
      'executive.approval': 'Dit is de beslissing die ze moeten nemen.',
      'customer.revenue': 'Jullie gemiste omzet is niet de zorg van de klant.',
      'customer.cause': 'Technische oorzaken helpen klanten niet.',
      'customer.fixed': 'Klanten willen eerst weten dat ze weer kunnen winkelen.',
      'customer.renewal': 'Interne procesveranderingen gaan klanten niet aan.',
      'customer.voucher': 'Dit krijgen ze, en ze moeten op de e-mail letten.',
      'customer.approval': 'Interne budgetbeslissingen zijn niet voor klanten.',
      competitor: 'Naar anderen wijzen klinkt als een excuus en verandert niets.'
    },
    messages: {
      'projectManager.fit': 'De storing van drie uur gisteren kwam door een verlopen beveiligingscertificaat dat de betalingen blokkeerde. Om herhaling te voorkomen, automatiseren we het vernieuwen met een vroege waarschuwing; dat kost het team deze sprint één dag.',
      'projectManager.tooMuch': 'We zijn ongeveer 40.000 euro aan bestellingen kwijt, klanten krijgen per e-mail een tegoedbon van 10% en een concurrent had vorige maand hetzelfde probleem.',
      'projectManager.missing': 'De winkel had gisteren een kort hikje, alles is weer in orde.',
      'executive.fit': 'Gisteren lag de winkel drie uur plat; we zijn ongeveer 40.000 euro aan bestellingen misgelopen. Een gemiste routinevernieuwing was de oorzaak en die is nu geautomatiseerd. Om zulke problemen vroeg te zien, vragen we u 5.000 euro voor monitoring goed te keuren.',
      'executive.tooMuch': 'Het TLS-certificaat van de betaalgateway verliep om 18:02; we vernieuwen het nu automatisch via het ACME-protocol, met een waarschuwing 14 dagen vooraf.',
      'executive.missing': 'Er was gisteren een klein technisch probleem. Het is opgelost.',
      'customer.fit': 'Excuses: gisteravond was onze winkel een paar uur niet bereikbaar. Alles werkt weer. Als uw bestelling mislukte, ontvangt u per e-mail een tegoedbon van 10%.',
      'customer.tooMuch': 'Een verlopen beveiligingscertificaat legde ons betaalsysteem stil; we zijn ongeveer 40.000 euro kwijt en vernieuwen certificaten nu automatisch.',
      'customer.condescending': 'Er ging iets technisch mis, dat begrijpt u toch niet. Probeer het gewoon nog eens.'
    }
  },
  signalFault: {
    title: 'Seinstoring bij het spoor',
    situation: 'Een seinstoring verstoort een spoorlijn. Je werkt bij het spoor. Leg de situatie uit.',
    facts: {
      delay: 'Treinen op deze lijn hebben ongeveer 40 minuten vertraging.',
      bus: 'Vervangende bussen vertrekken elke 20 minuten van het stationsplein.',
      tickets: 'Vervoerbewijzen zijn ook geldig in de bussen en in latere treinen.',
      signal: 'Sein 14 bij het splitsingspunt staat na een kabelstoring permanent op rood.',
      singleTrack: 'Treinen rijden het baanvak over één spoor met loopsnelheid, op schriftelijke opdracht.',
      repair: 'De technici verwachten dat de reparatie nog ongeveer vier uur duurt.',
      construction: 'Waarschijnlijk heeft bouwwerk van een ander bedrijf de kabel beschadigd.',
      staff: 'Twee technici zijn deze week ziek.'
    },
    reasons: {
      'layperson.delay': 'Reizigers willen eerst weten hoeveel later ze aankomen.',
      'layperson.bus': 'Het vertelt wat ze nu meteen kunnen doen.',
      'layperson.tickets': 'Het beantwoordt de zorg of ze een nieuw kaartje nodig hebben.',
      'layperson.signal': 'Seinnummers zeggen reizigers niets.',
      'layperson.singleTrack': 'Bedrijfsregels helpen reizigers niet.',
      'layperson.construction': 'Speculeren over schuld helpt reizigers niet en kan onjuist zijn.',
      'layperson.staff': 'Interne bezetting is niet de zorg van reizigers.',
      'expert.tickets': 'Regels voor vervoerbewijzen hebben geen invloed op het treinverkeer.',
      'expert.signal': 'De collega heeft de exacte plek en storing nodig.',
      'expert.singleTrack': 'Dit is de bedrijfsregel die hij moet toepassen.',
      'expert.repair': 'Hij plant de dienstregeling rond het verwachte einde.',
      'expert.staff': 'De bezetting verandert niets aan hoe het baanvak wordt bereden.',
      'executive.delay': 'De directie heeft de omvang van de verstoring nodig.',
      'executive.tickets': 'Geldigheid van kaartjes is een standaardregel, geen directiezaak.',
      'executive.repair': 'Ze moeten weten hoe lang de gevolgen duren.',
      'executive.construction': 'Mogelijke schade door derden is belangrijk voor aansprakelijkheid en kosten.'
    },
    messages: {
      'layperson.fit': 'Treinen op deze lijn hebben ongeveer 40 minuten vertraging. Vervangende bussen vertrekken elke 20 minuten van het stationsplein en uw kaartje is daarin geldig.',
      'layperson.tooMuch': 'Sein 14 bij het splitsingspunt staat na een kabelstoring permanent op rood; treinen rijden over één spoor met loopsnelheid op schriftelijke opdracht.',
      'layperson.missing': 'Even geduld alstublieft, er is een technische storing.',
      'expert.fit': 'Sein 14 bij het splitsingspunt staat na een kabelstoring vast op rood. Enkelsporig rijden met loopsnelheid op schriftelijke opdracht; reparatie duurt naar verwachting nog ongeveer vier uur.',
      'expert.condescending': 'Een sein is een soort verkeerslicht voor treinen. Er is er een kapot, dus moeten de treinen langzaam rijden.',
      'expert.missing': 'Er is een probleem op de lijn en treinen zijn te laat. Er rijden bussen.',
      'executive.fit': 'Een kabelstoring verstoort de lijn nog ongeveer vier uur; treinen rijden zo’n 40 minuten te laat. Waarschijnlijk heeft bouwwerk van een ander bedrijf de kabel beschadigd, dus we onderzoeken de aansprakelijkheid.',
      'executive.tooMuch': 'Sein 14 staat permanent op rood; enkelsporig rijden met loopsnelheid op schriftelijke opdracht; bussen elke 20 minuten van het plein; kaartjes geldig in de bussen.',
      'executive.missing': 'Klein seinprobleem, het team is ermee bezig.'
    }
  },
  kettleLid: {
    title: 'Deksel van de waterkoker',
    situation: 'Je bedrijf heeft ontdekt dat het deksel van één model waterkoker los kan gaan. Leg het uit.',
    facts: {
      batches: 'Alleen waterkokers met batchnummers 2301 tot en met 2315 zijn getroffen (gedrukt onder de voet).',
      risk: 'Het deksel kan opengaan tijdens het schenken, waardoor heet water kan spatten.',
      stop: 'Gebruik een getroffen waterkoker niet meer tot hij is vervangen.',
      hinge: 'Een plastic scharnierpen is 0,2 mm te dun gemaakt.',
      free: 'De vervanging is gratis, inclusief verzending.',
      cost: 'De omruiling kost het bedrijf ongeveer 120.000 euro.',
      supplier: 'De pennen kwamen van een nieuwe leverancier wiens monsters de keuring hadden doorstaan.',
      injuries: 'Er zijn tot nu toe geen verwondingen bekend.'
    },
    reasons: {
      'customer.batches': 'Klanten moeten kunnen nagaan of hun waterkoker getroffen is.',
      'customer.risk': 'Ze moeten begrijpen waarom het belangrijk is.',
      'customer.stop': 'Dit is de handeling die hen veilig houdt.',
      'customer.hinge': 'Millimeterdetails helpen klanten niet.',
      'customer.free': 'Weten dat het niets kost, neemt een reden om te wachten weg.',
      'customer.cost': 'De kosten van het bedrijf zijn niet de zorg van de klant.',
      'customer.supplier': 'Details over de leverancier klinken als de schuld afschuiven.',
      'executive.risk': 'De directie moet eerst het veiligheidsrisico begrijpen.',
      'executive.hinge': 'De exacte maat is iets voor ingenieurs.',
      'executive.cost': 'De financiële impact hoort bij hun beslissing.',
      'executive.injuries': 'Of er iemand gewond is, verandert de urgentie en de reactie.',
      'expert.stop': 'Instructies voor klanten helpen niet bij het analyseren van het defect.',
      'expert.hinge': 'De ingenieur heeft het exacte defect nodig.',
      'expert.free': 'Verzendvoorwaarden doen er voor de technische analyse niet toe.',
      'expert.cost': 'De kosten van de terugroepactie zijn niet nodig om het onderdeel te verbeteren.',
      'expert.supplier': 'Het laat zien waar de kwaliteitscontrole moet veranderen.'
    },
    messages: {
      'customer.fit': 'Controleer het batchnummer onder uw waterkoker. Ligt het tussen 2301 en 2315, gebruik hem dan niet meer: het deksel kan opengaan tijdens het schenken. We vervangen hem gratis, inclusief verzending.',
      'customer.tooMuch': 'Een scharnierpen van een nieuwe leverancier was 0,2 mm te dun; de omruiling kost ons ongeveer 120.000 euro.',
      'customer.condescending': 'Sommige waterkokers hebben misschien een klein probleempje. U hoeft de details niet te begrijpen; stuur hem terug als u wilt.',
      'executive.fit': 'Veiligheidsprobleem: bij batches 2301 tot en met 2315 kan het deksel opengaan tijdens het schenken van heet water. Tot nu toe geen verwondingen bekend. De omruiling kost ongeveer 120.000 euro.',
      'executive.tooMuch': 'De diameter van de scharnierpen ligt 0,2 mm onder de tolerantie; de monsters van de nieuwe leverancier waren binnen de specificatie, dus we vermoeden slijtage van het gereedschap.',
      'executive.missing': 'We vervangen uit voorzorg een aantal waterkokers.',
      'expert.fit': 'De scharnierpennen van de nieuwe leverancier zijn 0,2 mm te dun, waardoor het deksel tijdens het schenken kan opengaan. Getroffen batches: 2301 tot en met 2315. Hun monsters waren goedgekeurd, dus onze ingangscontrole moet veranderen.',
      'expert.missing': 'Sommige deksels zitten los; klanten krijgen gratis vervanging.',
      'expert.condescending': 'Een scharnier is het onderdeel waarmee het deksel draait. Als het te dun is, houdt het niet goed.'
    }
  }
};
