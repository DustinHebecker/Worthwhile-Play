import type { ContentText } from './types';

export const content: ContentText = {
  weeks: { one: '{n} week', other: '{n} weken' },
  species: {
    algae: { name: 'Groenalgen', about: 'Piepkleine plantjes die in het water zweven. Ze groeien snel op voedingsstoffen en licht; watervlooien en slakken eten ze. Veel algen kleuren het water groen en beschaduwen de planten eronder.' },
    bluegreen: { name: 'Blauwalgen', about: 'Eigenlijk bacteriën (cyanobacteriën). Ze groeien langzaam, hebben voedselrijk water nodig en worden nauwelijks gegeten, dus ze bloeien op als voedingsstoffen zich ophopen.' },
    duckweed: { name: 'Eendenkroos', about: 'Kleine drijvende blaadjes. In voedselrijk water bedekken ze het oppervlak en beschaduwen ze alles eronder.' },
    pondweed: { name: 'Fonteinkruid', about: 'Onderwaterplanten die in de modder wortelen. Ze hebben helder water nodig voor licht, nemen de algen voedingsstoffen af en geven watervlooien een schuilplek voor vissen.' },
    fleas: { name: 'Watervlooien', about: 'Piepkleine kreeftjes (Daphnia) die de algen afgrazen. Kleine vissen eten ze, maar in het fonteinkruid en de modder blijven er veel buiten bereik.' },
    snails: { name: 'Poelslakken', about: 'Ze eten dode plantenresten en een paar algen. Kleine vissen eten er een deel van.' },
    minnows: { name: 'Kleine vissen', about: 'Ze jagen op watervlooien en wat slakken. Hun jongen hebben ongeveer zes weken nodig om op te groeien. Snoeken eten ze.' },
    pike: { name: 'Snoeken', about: 'Een grote jager die kleine vissen eet. Jonge snoeken hebben ongeveer twintig weken nodig om op te groeien.' },
    grass: { name: 'Grassen', about: 'Hoog en snelgroeiend op voedselrijke grond. Ze beschaduwen de lage planten en gebruiken veel water.' },
    flowers: { name: 'Wilde bloemen', about: 'Lage planten die het goed doen op schrale grond. Ze hebben licht nodig, dus hoog gras verdringt ze. Bladluizen en konijnen eten ze.' },
    clover: { name: 'Klaver', about: 'Een lage plant die zijn eigen stikstof uit de lucht haalt, minder op rijke grond. Zijn dode blaadjes bemesten de bodem voor de buren. Konijnen vinden hem het lekkerst.' },
    aphids: { name: 'Bladluizen', about: 'Piepkleine insecten die plantensap zuigen, vooral van wilde bloemen. Ze vermenigvuldigen zich heel snel. Lieveheersbeestjes eten ze.' },
    ladybirds: { name: 'Lieveheersbeestjes', about: 'Kevers die bladluizen eten. Hun larven hebben ongeveer drie weken nodig om op te groeien, dus ze reageren met vertraging op meer bladluizen.' },
    rabbits: { name: 'Konijnen', about: 'Ze eten eerst klaver, dan wilde bloemen en gras. Hun jongen hebben ongeveer vijf weken nodig om op te groeien. Vossen jagen op ze; een deel is altijd veilig in hun holen.' },
    foxes: { name: 'Vossen', about: 'Ze jagen op konijnen. Jonge vossen hebben ongeveer een half jaar nodig om op te groeien.' },
    worms: { name: 'Regenwormen', about: 'Ze eten dode bladeren en maken er weer voedingsstoffen van die planten kunnen gebruiken.' }
  },
  challenges: {
    'fleas-arrive': {
      title: 'Watervlooien komen aan',
      situation: 'Een jonge vijver heeft alleen groenalgen. Watervlooien komen erin terecht, meegebracht door een vogel.',
      think: 'Wie eet de algen? Wat gebeurt er met de watervlooien als de algen minder worden?',
      explain: 'De watervlooien vermenigvuldigen zich op de algen tot ze net zo snel eten als de algen groeien. Vanaf dan bepalen de watervlooien, niet de voedingsstoffen, hoeveel algen er zijn: een balancerende kringloop (B1). Het water wordt helder en blijft helder.',
      real: 'In echte vijvers zorgen vissen en de seizoenen er meestal voor dat het niet zo netjes gaat.'
    },
    'enrich-swings': {
      title: 'Meer voedsel voor iedereen',
      situation: 'Sterke afvloeiing van een akker begint een vijver met algen en watervlooien te voeden.',
      think: 'Meer voedingsstoffen voeden meer algen. Wat doen de watervlooien met meer algen, en wat doen de algen dan?',
      explain: 'Meer voedingsstoffen laten de algen vooruit schieten; de watervlooien volgen, eten de algen op en verhongeren dan; de algen herstellen, en het begint opnieuw. Rijker water liet het systeem schommelen in plaats van tot rust komen. Ecologen noemen dit de paradox van verrijking (B1).',
      real: 'In echte vijvers dempen of veranderen veel meer soorten en de seizoenen deze schommelingen.'
    },
    'fish-stocked': {
      title: 'Vissen in de vijver',
      situation: 'Iemand zet kleine vissen uit in een vijver waar er geen waren.',
      think: 'Vissen eten watervlooien. Wie eet de algen, en wat gebeurt er met ze?',
      explain: 'De vissen eten watervlooien, dus grazen minder watervlooien de algen af, en de algen groeien. Een verandering bovenaan bereikt de onderkant van de voedselketen: een trofische cascade. Het gaat langzaam, omdat jonge vissen weken nodig hebben om op te groeien.',
      real: 'In echte vijvers woelen vissen ook de modder op, wat het water nog troebeler maakt.'
    },
    'pike-return': {
      title: 'Snoeken komen terug',
      situation: 'Een paar jonge snoeken worden uitgezet in een vijver vol kleine vissen.',
      think: 'Volg de keten: snoeken, kleine vissen, watervlooien, algen.',
      explain: 'Snoeken eten kleine vissen; minder kleine vissen laten meer watervlooien over; meer watervlooien eten meer algen. Elke stap keert de richting om, dus de algen nemen af. Het duurt lang omdat jonge snoeken ongeveer twintig weken nodig hebben om op te groeien.',
      real: 'In echte meren worden kleine vissen weggevangen of snoeken uitgezet om het water helder te maken, met wisselend en vaak kortstondig succes.'
    },
    'algae-treatment': {
      title: 'Een snelle oplossing voor groen water',
      situation: 'De vijver wordt behandeld: negen op de tien algen sterven en zakken naar beneden, maar blijven in het water.',
      think: 'Waar gaan de voedingsstoffen in de dode algen heen? En wat gebeurde er met de watervlooien terwijl de algen weg waren?',
      explain: 'De dode algen rotten binnen enkele dagen en geven hun voedingsstoffen terug aan het water. De watervlooien hadden honger terwijl de algen weg waren, dus houdt een tijdje niemand de algen in toom, en ze schieten door. Een oplossing die het symptoom weghaalt maar niet de voedingsstoffen, houdt geen stand.',
      real: 'In echte vijvers verbruiken rottende algen ook zuurstof, wat vissen kan schaden.'
    },
    'slow-runoff': {
      title: 'Een akker stroomopwaarts',
      situation: 'Een nieuwe akker stroomopwaarts begint af te wateren in de heldere vijver.',
      think: 'Wat doen meer voedingsstoffen met de algen, en wat doen meer algen met het fonteinkruid eronder?',
      explain: 'Maandenlang lijkt er niets te gebeuren: het fonteinkruid ziet er na een half jaar zelfs goed uit. Ondertussen hopen voedingsstoffen zich op in het water en de modder, tot eendenkroos en blauwalgen, die voedselrijk water nodig hebben, ineens groeien en het fonteinkruid beschaduwen. Dan neemt een versterkende kringloop het over: minder fonteinkruid, meer algen, meer schaduw (R1). De omslag is snel; de oorzaak was traag.',
      real: 'In echte meren zijn zulke omslagen van helder naar groen water goed beschreven, vaak na jaren van langzame verandering.'
    },
    'no-way-back': {
      title: 'De afvloeiing stopt',
      situation: 'Twee jaar later wordt de afvloeiing helemaal gestopt. Komt het fonteinkruid terug?',
      think: 'Is er nog fonteinkruid over dat kan teruggroeien? Wat houdt het water nu groen?',
      explain: 'De afvloeiing stoppen haalt de oorzaak weg, maar de vijver blijft groen: de algen beschaduwen de bodem, en er is geen fonteinkruid meer dat kan teruggroeien. De versterkende kringloop (R1) houdt de vijver nu in zijn groene toestand. Terug vraagt meer dan de verandering ongedaan maken, bijvoorbeeld opnieuw fonteinkruid planten.',
      real: 'In echte meren duurt herstel na het afsluiten van de voedingsstoffen vaak vele jaren, en soms worden planten opnieuw geplant.'
    },
    shade: {
      title: 'Een boom boven de vijver',
      situation: 'Een boom groeit boven de vijver en beschaduwt hem.',
      think: 'Fonteinkruid heeft licht nodig op de bodem. Wat neemt het nog meer licht af?',
      explain: 'Minder licht remt het fonteinkruid, zodat het de algen minder tegenhoudt. De algen en de watervlooien gaan schommelen, en elke algengolf beschaduwt het fonteinkruid verder (R1): het daalt stap voor stap.',
      real: 'In echte vijvers zou vallend blad van de boom ook voedingsstoffen toevoegen.'
    },
    spray: {
      title: 'Spuiten tegen bladluizen',
      situation: 'De weide wordt bespoten tegen bladluizen: negen op de tien bladluizen en ook negen op de tien lieveheersbeestjes sterven.',
      think: 'Wie groeit sneller terug: de bladluizen of de lieveheersbeestjes die ze eten?',
      explain: 'Het spuiten doodde de bladluizen én de lieveheersbeestjes die ze eten. Bladluizen vermenigvuldigen zich veel sneller dan lieveheersbeestjes, dus ze kwamen eerst terug, zonder dat iemand ze tegenhield, en de wilde bloemen betaalden de prijs. Ecologen noemen dit plaagopleving (B2 met vertraging).',
      real: 'Op echte akkers schaadt spuiten ook bijen en andere insecten, en plagen kunnen resistent worden.'
    },
    'no-foxes': {
      title: 'De vossen vertrekken',
      situation: 'De vossen verlaten de weide.',
      think: 'Wie hield de konijnen in toom? Wat eten meer konijnen het eerst?',
      explain: 'Zonder vossen is de balancerende kringloop weg die de konijnen in toom hield (B2). De konijnen vermenigvuldigen zich en eten de klaver, hun lievelingsvoedsel, tot er weinig van over is.',
      real: 'In echte landschappen trekken konijnen ook weg, en ziektes kunnen hun aantal verlagen.'
    },
    fertilise: {
      title: 'Een beetje mest',
      situation: 'De boer strooit elke week wat mest.',
      think: 'Welke plant heeft het meeste voordeel van rijke grond, en wat doet die met de lage planten?',
      explain: 'Mest voedt vooral de grassen. Hoger gras beschaduwt de lage klaver, en klaver verliest zijn voordeel: op rijke grond helpt het niet meer om zelf stikstof te maken. Meer voedsel voor de weide betekent niet meer van elke plant.',
      real: 'In echte weiden is stikstof uit mest en uit de lucht een hoofdoorzaak van verdwenen wilde bloemen.'
    },
    drought: {
      title: 'Een droge zomer',
      situation: 'Twaalf droge weken, dan weer normale regen.',
      think: 'Wat hebben de grassen nodig naast voedingsstoffen? Wat gebeurt er als de regen terugkomt?',
      explain: 'Zonder regen droogt de bodem uit, en de grassen groeien langzamer en krimpen. Als de regen terugkomt, loopt de bodem vol en groeien de grassen terug, zelfs boven hun oude niveau, omdat voedingsstoffen zich in de bodem ophoopten terwijl ze die niet konden gebruiken.',
      real: 'In echte weiden kan een lange droogte ook planten doden en ruimte maken voor andere.'
    },
    'clover-poor': {
      title: 'Klaver voor een schrale weide',
      situation: 'Er wordt klaver gezaaid in een schrale weide met wilde bloemen.',
      think: 'Klaver haalt stikstof uit de lucht. Waar gaat die stikstof heen als zijn blaadjes afsterven?',
      explain: 'Klaver brengt nieuwe stikstof in de weide. Als zijn blaadjes afsterven, maken regenwormen er voedingsstoffen van die de wilde bloemen gebruiken. De buren profiteren, langzaam, via de bodem: een keten met vertraging.',
      real: 'In de echte landbouw wordt klaver precies om deze reden gezaaid.'
    },
    'worms-gone': {
      title: 'Waar zijn de regenwormen?',
      situation: 'De regenwormen verdwijnen uit de weide.',
      think: 'Wie maakt van dode bladeren weer voedsel voor planten? Welke plant is daar niet van afhankelijk?',
      explain: 'Zonder regenwormen hopen dode bladeren zich op en blijven hun voedingsstoffen erin vastzitten. De grassen krijgen honger. Klaver maakt zijn eigen stikstof, dus hij wint: een bijwerking die weinig mensen verwachten.',
      real: 'In echte bodems breken veel meer dieren, schimmels en bacteriën dode bladeren af.'
    },
    'foxes-return': {
      title: 'De vossen komen terug',
      situation: 'Vossen keren terug naar een weide die overspoeld is door konijnen.',
      think: 'Hoe lang hebben jonge vossen nodig om op te groeien? Wat betekenen minder konijnen voor de klaver?',
      explain: 'Eerst gebeurt er weinig: jonge vossen hebben ongeveer een half jaar nodig om op te groeien. Dan drukken de vossen de konijnen terug (B2), en de klaver, verlost van het grazen, komt langzaam terug. Het effect komt jaren na de oorzaak.',
      real: 'In echte landschappen jagen vossen ook op andere dieren, en konijnen vinden nieuwe plekken om te leven.'
    },
    'ladybirds-gone': {
      title: 'Lieveheersbeestjes verzameld',
      situation: 'De meeste lieveheersbeestjes worden verzameld voor een tuin elders.',
      think: 'Wie eet de bladluizen? En wat hebben de bladluizen nodig om zich te blijven vermenigvuldigen?',
      explain: 'Zonder lieveheersbeestjes vermenigvuldigen de bladluizen zich en eten ze de wilde bloemen kaal. Met minder voedsel dalen ze weer (B1): hier remt hun voedsel ze af, niet hun jagers. De paar overgebleven lieveheersbeestjes blijven maandenlang schaars.',
      real: 'In echte tuinen helpen ook andere bladluisjagers zoals zweefvliegen en vogels.'
    }
  },
  goals: {
    'save-pondweed': {
      story: 'Een nieuwe akker stroomopwaarts begint af te wateren in de heldere vijver. Houd het fonteinkruid twee jaar in leven terwijl de afvloeiing doorgaat.',
      target: 'Fonteinkruid elke week minstens {v} tot week {w}.',
      hint: 'Algen zijn een symptoom. Wat voedt ze, en hoe snel moet dat veranderen?',
      explain: 'Het fonteinkruid daalt pas als iets het beschaduwt: eendenkroos en algen, die groeien van de voedingsstoffen die de akker aanvoert. Pak de oorzaak aan, en doe het vroeg: tegen de tijd dat het fonteinkruid zwak oogt, heeft de versterkende kringloop het al overgenomen.',
      plans: {
        buffer: 'Een bufferstrook van planten langs de akker vangt het grootste deel van de afvloeiing op voordat die de vijver bereikt. Op tijd aangelegd, komen de algen nooit vooruit.',
        ditch: 'De sloot afsluiten stopt de afvloeiing helemaal, dus de algen komen nooit vooruit.'
      }
    },
    'clear-pond': {
      story: 'De vijver werd groen na twee jaar afvloeiing. Maak het water weer helder, met groeiend fonteinkruid, twaalf weken achter elkaar.',
      target: 'Algen (groen- en blauwalgen) hoogstens {v} en fonteinkruid minstens {p}, twaalf weken achter elkaar, tegen week {w}.',
      hint: 'Algen zijn een symptoom. Wat voedt ze? En wat houdt ze klein als het water eenmaal helder is?',
      explain: 'De groene toestand houdt zichzelf in stand: algen beschaduwen de planten die ze zouden tegenhouden. Helder water vraagt dat de oorzaak verdwijnt (de afvloeiing), dat de opgeslagen voedingsstoffen eruit gehaald of weggespoeld worden, en dat het fonteinkruid terugkomt, zodat de versterkende kringloop naar helder water draait.',
      plans: {
        restore: 'Stop de afvloeiing, bagger de voedselrijke modder, plant fonteinkruid en haal de meeste kleine vissen eruit (zodat meer watervlooien de algen afgrazen). Samen draaien ze de kringloop naar helder water.',
        flush: 'Stop de afvloeiing en laat een tijdje een beek de voedingsstoffen en algen wegspoelen, plant dan fonteinkruid in het heldere water.'
      }
    },
    'protect-flowers': {
      story: 'Een buurman heeft de weide net bespoten: de meeste bladluizen en de meeste lieveheersbeestjes zijn dood. Houd de wilde bloemen een jaar lang in stand.',
      target: 'Wilde bloemen elke week minstens {v} tot week {w}.',
      hint: 'De bladluizen komen sneller terug dan de lieveheersbeestjes. Wanneer zouden nieuwe lieveheersbeestjes iets te eten vinden?',
      explain: 'De bladluizen herstellen vóór hun jagers. Te vroeg uitgezette lieveheersbeestjes verhongeren, omdat er nog geen bladluizen zijn; te laat uitgezet, zijn de wilde bloemen al opgegeten. De timing beslist.',
      plans: {
        ladybirds: 'Uitgezet na ongeveer tien weken, als de bladluizen terug zijn maar nog niet op hun piek, vinden de lieveheersbeestjes meteen voedsel en stoppen ze de bladluizen op tijd.'
      }
    },
    'bring-back-clover': {
      story: 'Zonder vossen hebben konijnen de klaver bijna helemaal opgegeten. Breng de klaver binnen vier jaar terug, acht weken achter elkaar.',
      target: 'Klaver minstens {v}, acht weken achter elkaar, tegen week {w}.',
      hint: 'Konijnen weghalen helpt maar even. Wat hield ze vroeger in toom?',
      explain: 'Konijnen vermenigvuldigen zich snel, dus een deel weghalen levert alleen tijd op. Een blijvende verandering vraagt de balancerende kringloop terug: vossen. Jonge vossen hebben een half jaar nodig om op te groeien, dus de klaver komt pas jaren later terug.',
      plans: {
        foxes: 'Vossen alleen zijn genoeg, maar het vraagt geduld: ze drukken de konijnen langzaam terug.',
        foxesRabbits: 'Vossen plus de helft van de konijnen verplaatsen: de vossen hoeven minder konijnen in te halen.',
        foxesRabbitsClover: 'Vossen, de meeste konijnen verplaatsen en klaver zaaien: de snelste weg, omdat de klaver een voorsprong krijgt terwijl de vossen opgroeien.'
      }
    }
  },
  loops: {
    graze: 'Watervlooien grazen de algen af; minder algen, minder watervlooien.',
    fishFleas: 'Kleine vissen eten watervlooien; minder watervlooien, minder jonge vissen.',
    pikeFish: 'Snoeken eten kleine vissen; minder kleine vissen, minder jonge snoeken.',
    clearWater: 'Algen beschaduwen het fonteinkruid; fonteinkruid houdt de algen tegen. Wie voorligt, loopt verder uit.',
    shelter: 'Fonteinkruid verbergt watervlooien voor vissen, en watervlooien eten algen.',
    recycle: 'Dode algen rotten en voeden nieuwe algen.',
    aphidsFlowers: 'Bladluizen leven van de wilde bloemen; minder wilde bloemen, minder bladluizen.',
    ladybirdsAphids: 'Lieveheersbeestjes eten bladluizen; minder bladluizen, minder jonge lieveheersbeestjes.',
    rabbitsClover: 'Konijnen eten de klaver; minder klaver, minder jonge konijnen.',
    foxesRabbits: 'Vossen jagen op konijnen; minder konijnen, minder jonge vossen.',
    thirst: 'Grassen verbruiken het bodemwater; droge grond remt de grassen.',
    wormsDead: 'Regenwormen eten dode bladeren; minder dode bladeren, minder regenwormen.',
    flowerUptake: 'Wilde bloemen nemen de voedingsstoffen op waaruit ze groeien.'
  }
};
