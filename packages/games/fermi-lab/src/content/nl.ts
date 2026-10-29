import type { ContentText } from './types';

export const content: ContentText = {
  counts: {
    day: { one: 'dag', other: 'dagen' },
    year: { one: 'jaar', other: 'jaar' },
    ant: { one: 'mier', other: 'mieren' },
    battery: { one: 'batterij', other: 'batterijen' },
    beat: { one: 'slag', other: 'slagen' },
    bee: { one: 'bij', other: 'bijen' },
    birth: { one: 'geboorte', other: 'geboorten' },
    breath: { one: 'ademhaling', other: 'ademhalingen' },
    cell: { one: 'cel', other: 'cellen' },
    charge: { one: 'lading', other: 'ladingen' },
    earth: { one: 'aarde', other: 'aardes' },
    egg: { one: 'ei', other: 'eieren' },
    grain: { one: 'korrel', other: 'korrels' },
    hair: { one: 'haar', other: 'haren' },
    household: { one: 'huishouden', other: 'huishoudens' },
    molecule: { one: 'molecuul', other: 'moleculen' },
    orbit: { one: 'omloop', other: 'omlopen' },
    passenger: { one: 'passagier', other: 'passagiers' },
    person: { one: 'persoon', other: 'personen' },
    phone: { one: 'telefoon', other: 'telefoons' },
    piano: { one: 'piano', other: 'piano’s' },
    pupil: { one: 'leerling', other: 'leerlingen' },
    sheet: { one: 'vel', other: 'vellen' },
    step: { one: 'stap', other: 'stappen' },
    teacher: { one: 'leraar', other: 'leraren' },
    tree: { one: 'boom', other: 'bomen' },
    trip: { one: 'reis', other: 'reizen' },
    tuner: { one: 'stemmer', other: 'stemmers' },
    tuning: { one: 'stembeurt', other: 'stembeurten' },
    vehicle: { one: 'voertuig', other: 'voertuigen' },
    word: { one: 'woord', other: 'woorden' }
  },
  ratios: {
    high: { one: '{n} keer te hoog.', other: '{n} keer te hoog.' },
    low: { one: '{n} keer te laag.', other: '{n} keer te laag.' },
    rowHigh: { one: '{n} keer te hoog', other: '{n} keer te hoog' },
    rowLow: { one: '{n} keer te laag', other: '{n} keer te laag' },
    biasHigh: { one: 'Gemiddeld waren je antwoorden {n} keer te hoog.', other: 'Gemiddeld waren je antwoorden {n} keer te hoog.' },
    biasLow: { one: 'Gemiddeld waren je antwoorden {n} keer te laag.', other: 'Gemiddeld waren je antwoorden {n} keer te laag.' }
  },
  factors: {
    aaEnergy: 'Energie die een AA-batterij levert',
    airDensity: 'Dichtheid van lucht',
    airTime: 'Gemiddelde tijd in de lucht per reis',
    antDensity: 'Mieren per vierkante meter land, gemiddeld',
    avogadro: 'Constante van Avogadro',
    batteryEnergy: 'Accu-energie van één telefoon',
    birthRate: 'Geboorten per persoon per jaar (geboortecijfer)',
    bloodVolume: 'Hoeveelheid bloed',
    breathRate: 'Ademhalingen per minuut in rust',
    capacityFactor: 'Gemiddeld vermogen als deel van het nominale vermogen (capaciteitsfactor)',
    carSpeed: 'Snelheid',
    ceilingHeight: 'Plafondhoogte',
    chargeEfficiency: 'Laadrendement',
    cloudVolume: 'Volume van de wolk',
    cloudWater: 'Vloeibaar water per kubieke meter wolk',
    crowdDensity: 'Personen per vierkante meter (dichte staande menigte)',
    cupWater: 'Water voor één kopje',
    daysPerYear: 'Dagen in een jaar',
    daysPerYearPlain: 'Dagen in een jaar',
    drinksPerDay: 'Drinken per dag',
    driveEfficiency: 'Rendement van motor en aandrijving',
    dropMass: 'Massa van een druppel',
    earthRadius: 'Straal van de aarde',
    earthSurface: 'Oppervlakte van de aarde',
    eggsPerDay: 'Eitjes die de koningin per dag legt',
    energyAvailable: 'Beschikbare energie',
    equatorLength: 'Lengte van de evenaar',
    evConsumption: 'Verbruik van een elektrische auto',
    flightDistance: 'Vliegafstand',
    floorArea: 'Vloeroppervlak',
    flowSpeed: 'Gemiddelde stroomsnelheid',
    foodEnergy: 'Voedingsenergie per dag',
    forestArea: 'Bosoppervlak van de wereld',
    fuelConsumption: 'Brandstofverbruik',
    fuelPerPassengerKm: 'Brandstof per passagier per kilometer',
    grainDiameter: 'Diameter van één korrel',
    grainMass: 'Massa van één korrel',
    gravity: 'Valversnelling',
    hairDensity: 'Haren per vierkante centimeter',
    heartRate: 'Hartslag in rust',
    hoursPerDay: 'Uren in een dag',
    hoursPerDayRate: 'Uren in een dag',
    hoursPerYear: 'Uren in een jaar',
    householdSize: 'Personen per huishouden',
    iceFreeLand: 'IJsvrij landoppervlak van de aarde',
    inhabitants: 'Inwoners',
    jarVolume: 'Volume van de pot',
    joulesPerKcal: 'Joule in een kilocalorie',
    joulesPerWh: 'Joule in een wattuur',
    lifetime: 'Levensduur',
    lifetimeDistance: 'Afgelegde afstand over het hele autoleven',
    lifetimeGiven: 'Levensduur',
    liftHeight: 'Hoogte van tien verdiepingen',
    liftedMass: 'Opgetilde massa (vier personen)',
    lightSpeed: 'Lichtsnelheid',
    lightSpeedKm: 'Lichtsnelheid',
    litresPerM3: 'Liters in een kubieke meter',
    minutesPerDay: 'Minuten in een dag',
    minutesPerHour: 'Minuten in een uur',
    minutesPerYear: 'Minuten in een jaar',
    molarMass: 'Massa van één mol water',
    moonDistance: 'Afstand aarde–maan',
    nailPerDay: 'Groei per dag',
    oceanArea: 'Oppervlakte van de oceanen',
    oceanDepth: 'Gemiddelde diepte van de oceanen',
    orbitLength: 'Lengte van één omloop',
    orbitsPerDay: 'Omlopen per dag',
    packing: 'Deel van de pot dat korrels vullen (de rest is lucht)',
    panelArea: 'Paneeloppervlak',
    panelEfficiency: 'Rendement van het paneel',
    passengers: 'Passagiers',
    peoplePerVehicle: 'Personen per voertuig (wereldgemiddelde)',
    petrolEnergy: 'Energie in een liter benzine',
    petrolEnergyWh: 'Energie in een liter benzine',
    pianoShare: 'Piano’s per huishouden',
    pitchLength: 'Lengte van het veld',
    pitchWidth: 'Breedte van het veld',
    pupilsPerTeacher: 'Leerlingen per leraar',
    rainfall: 'Jaarlijkse neerslag (waterhoogte)',
    ratedSunlight: 'Zonlicht waarop het paneelvermogen is gebaseerd',
    redCellCount: 'Rode bloedcellen per microliter bloed',
    redCellShare: 'Aandeel rode bloedcellen in alle cellen',
    replacementYears: 'Jaren tot een telefoon vervangen wordt',
    riceMass: 'Rijst in de zak',
    riverDepth: 'Gemiddelde diepte van de rivier',
    riverWidth: 'Breedte van de rivier',
    roofArea: 'Dakoppervlak van bovenaf gezien',
    rotationTime: 'Duur van één omwenteling',
    scalpArea: 'Oppervlak van de behaarde hoofdhuid',
    schoolAgeShare: 'Aandeel inwoners van 6 tot 17 jaar',
    seaLevelPressure: 'Luchtdruk op zeeniveau',
    seawaterDensity: 'Dichtheid van zeewater',
    secondsPerDay: 'Seconden in een dag',
    sheetThickness: 'Dikte van één vel',
    sleepPerDay: 'Slaap per dag',
    smartphoneShare: 'Aandeel mensen met een smartphone',
    speakingRate: 'Spreektempo',
    specificHeat: 'Soortelijke warmte van water',
    sphereFactor: 'Bolfactor (6/π: een bol vult ongeveer de helft van zijn kubus)',
    stackHeight: 'Hoogte van de stapel',
    stepLength: 'Lengte van één stap',
    stepsPerDay: 'Stappen per dag',
    strokeVolume: 'Bloed per hartslag (slagvolume)',
    sunDistance: 'Afstand zon–aarde',
    sunPower: 'Uitgestraald vermogen van de zon',
    sunRadius: 'Straal van de zon',
    talkTime: 'Tijd per dag die je praat',
    temperatureRise: 'Temperatuurstijging',
    treeDensity: 'Bomen per hectare bos',
    tripsPerYear: 'Passagiersreizen per jaar',
    tuningsPerPiano: 'Stembeurten per piano per jaar',
    tuningsPerTuner: 'Stembeurten per stemmer per jaar (4 per dag, 200 werkdagen)',
    workerLife: 'Volwassen leven van een zomerwerkbij',
    worldPopulation: 'Wereldbevolking'
  },
  tasks: {
    'rain-roof': {
      title: 'Regen op een dak in Londen',
      question: 'Hoeveel liter regen valt er in een jaar op het dak van een vrijstaand huis in Londen?',
      explain:
        'Neerslag meet je als hoogte: het langjarige gemiddelde van Londen, ongeveer 630 mm per jaar, is een laag water van 0,63 m als er niets wegstroomde. Wat telt is het dakoppervlak van bovenaf gezien (de plattegrond), niet het grotere schuine oppervlak, want regen valt loodrecht. Ondanks zijn reputatie krijgt Londen maar ongeveer half zoveel regen als New York: het regent er vaak, maar weinig. De onzekere factor is het dakoppervlak.'
    },
    'pitch-crowd': {
      title: 'Mensen op een voetbalveld',
      question: 'Hoeveel staande mensen passen er op een voetbalveld?',
      explain:
        'Een standaardveld is 105 m × 68 m, ongeveer 7100 m². Het belangrijkst is hoe dicht mensen staan: 2 per m² is een comfortabel publiek, 4 is schouder aan schouder en 5 per m² is de bovengrens die crowd-safety-planners voor staanplaatsen hanteren; daarboven wordt het gevaarlijk. ‘Passen’ omvat dus een factor 2 tot 3.'
    },
    'rice-grains': {
      title: 'Korrels in een zak rijst',
      question: 'Hoeveel rijstkorrels zitten er in een zak van 1 kg?',
      explain:
        'Landbouwkundigen wegen rijst als ‘duizendkorrelgewicht’: de meeste rassen hebben 15 tot 35 g per 1000 korrels, dus één korrel weegt ongeveer 25 mg. 1000 g gedeeld door 0,025 g geeft 40.000. Een truc voor kleine dingen: weeg of tel een klein groepje en reken op.'
    },
    'lifetime-drinking': {
      title: 'Drinken in een leven',
      question: 'Hoeveel liter drinkt een mens in zijn hele leven (alle dranken samen)?',
      explain:
        'De Europese Autoriteit voor voedselveiligheid noemt als adequate inname van totaal water 2,0 L per dag voor vrouwen en 2,5 L voor mannen; ongeveer 70–80 % daarvan komt uit dranken, de rest uit voedsel. Dat is ongeveer 1,4–2,0 L drinken per dag. Over 75 jaar komt dat neer op zo’n 44.000 liter: een klein zwembad.'
    },
    'paper-stack': {
      title: 'Een meter papier',
      question: 'Hoeveel vellen gewoon printerpapier vormen een stapel van 1 meter hoog?',
      explain:
        'Standaardpapier van 80 g/m² is ongeveer een tiende millimeter dik (fabrikanten noemen 100–110 µm). Een pak van 500 vel is ongeveer 5 cm hoog, dus 1 m is 20 pakken: ongeveer 10.000 vel. Dunne dingen meet je het best in bulk: meet het pak en deel.'
    },
    'room-air': {
      title: 'De lucht in een woonkamer',
      question: 'Hoeveel kilogram weegt alle lucht in een gewone woonkamer?',
      explain:
        'Lucht voelt gewichtloos, maar een kubieke meter weegt bij kamertemperatuur op zeeniveau ongeveer 1,2 kg. Een kamer van 25 m² met een plafond van 2,5 m bevat ongeveer 62 m³ lucht: zo’n 75 kg, evenveel als een volwassene. Onzeker is de grootte van de kamer; de dichtheid van lucht is een natuurkundig feit.'
    },
    'words-per-day': {
      title: 'Gesproken woorden per dag',
      question: 'Hoeveel woorden spreekt een gemiddelde volwassene op een dag?',
      explain:
        'Een onderzoek dat korte geluidsfragmenten van bijna 400 studenten opnam gedurende enkele dagen, vond dat vrouwen en mannen allebei ongeveer 16.000 woorden per dag spraken; de bekende bewering van 20.000 voor vrouwen tegen 7000 voor mannen klopte niet. Mensen verschillen enorm (van een paar honderd tot meer dan 40.000 woorden), dus het bereik is breed. In een gesprek zeg je ongeveer 110–170 woorden per minuut, dus 16.000 woorden zijn zo’n twee uur echt praten.'
    },
    'sand-jar': {
      title: 'Zandkorrels in een pot',
      question: 'Hoeveel zandkorrels zitten er in een pot van een liter met droog zand?',
      explain:
        'Zie elke korrel als een balletje met diameter d: een liter (een miljoen kubieke millimeter) bevat ongeveer 0,6 × 1.000.000 × 6/π ÷ d³ korrels. De diameter staat in de derde macht en bepaalt dus alles: zand bestaat uit korrels van 0,06 tot 2 mm, en d halveren maakt het aantal acht keer zo groot. Middelgrof zand (0,25–0,5 mm) geeft 10 tot 70 miljoen korrels, grof zand ongeveer één tot tien miljoen.'
    },
    heartbeats: {
      title: 'Hartslagen in een leven',
      question: 'Hoe vaak klopt een menselijk hart in een leven?',
      explain:
        'Ongeveer 70 slagen per minuut zijn zo’n 100.000 per dag en 37 miljoen per jaar. Over 75 jaar is dat bijna drie miljard slagen. Het hart klopt sneller in de kindertijd en bij inspanning en langzamer in de slaap, dus 70 is een redelijk gemiddelde over het hele leven.'
    },
    'scalp-hairs': {
      title: 'Haren op een hoofd',
      question: 'Hoeveel haren heeft een volwassene op het hoofd (met een volle bos haar)?',
      explain:
        'Het gangbare getal is ongeveer 100.000 haren, meestal tussen 80.000 en 150.000; blonde mensen hebben vaak meer en dunnere haren, roodharigen minder en dikkere. Een stuk hoofdhuid zo groot als een handpalm is ongeveer 100 cm², en het behaarde deel van het hoofd is zes à zeven keer zo groot.'
    },
    'breaths-day': {
      title: 'Ademhalingen per dag',
      question: 'Hoeveel keer ademt een volwassene op een dag?',
      explain:
        'Een volwassene ademt in rust 12 tot 20 keer per minuut. Een dag heeft 1440 minuten, dus dat zijn ongeveer 17.000 tot 29.000 ademhalingen. Een minuut lang je eigen ademhalingen tellen is een goede manier om zelf een factor te controleren.'
    },
    'blood-pumped': {
      title: 'Gepompt bloed per dag',
      question: 'Hoeveel liter bloed pompt een hart in rust op een dag rond?',
      explain:
        'Elke slag pompt ongeveer 70 mL; bij 70 slagen per minuut is dat ongeveer 5 liter per minuut, eenmaal al het bloed van het lichaam per minuut. Over een dag is dat zo’n 7000 liter, genoeg om een grote watertank te vullen. Artsen noemen dit het hartminuutvolume: in rust 4 tot 8 liter per minuut.'
    },
    'ants-earth': {
      title: 'Mieren op aarde',
      question: 'Hoeveel mieren leven er op aarde?',
      explain:
        'Een onderzoek uit 2022 bundelde honderden veldtellingen van alle continenten en schatte ongeveer 20 biljard (2 × 10¹⁶) mieren: zo’n 2,5 miljoen per persoon, met meer totale massa dan alle wilde vogels en zoogdieren samen. Verdeeld over het ijsvrije land is dat gemiddeld ongeveer 150 mieren per vierkante meter, de meeste in tropische bossen en savannes. De onderzoekers noemen het getal voorzichtig.'
    },
    'trees-earth': {
      title: 'Bomen op aarde',
      question: 'Hoeveel bomen zijn er op aarde?',
      explain:
        'Een onderzoek uit 2015 combineerde meer dan 400.000 bosproefvlakken met satellietkaarten en telde ongeveer 3 biljoen bomen (stammen dikker dan 10 cm op borsthoogte): meer dan 400 per persoon en zeven keer zoveel als eerdere schattingen. De bossen van de wereld beslaan ongeveer 4 miljard hectare, dus gemiddeld ongeveer 700–800 bomen per hectare (één boom per 13 m²).'
    },
    'cloud-mass': {
      title: 'Water in een wolk',
      question: 'Hoeveel ton weegt het water in een kleine, donzige stapelwolk bij mooi weer?',
      explain:
        'Een gewone mooiweer-stapelwolk is ongeveer 1 km groot, dus ongeveer een kubieke kilometer: een miljard kubieke meter. Elke kubieke meter bevat maar ongeveer een halve gram piepkleine druppeltjes, maar samen is dat zo’n 500 ton water, zo zwaar als ongeveer honderd olifanten. De wolk zweeft omdat de druppeltjes piepklein zijn en de lucht eromheen opstijgt.'
    },
    'amazon-day': {
      title: 'De Amazone op één dag',
      question: 'Hoeveel kubieke meter water stort de Amazone op een gemiddelde dag in de Atlantische Oceaan?',
      explain:
        'Afvoer = breedte × diepte × snelheid. Bij de stad Óbidos perst de Amazone zich in één bedding van maar zo’n 2 km breed, maar tientallen meters diep, en stroomt daar tot 2 m/s. Bij de monding voert hij gemiddeld ongeveer 206.000 m³ per seconde af: zo’n 18 miljard m³ per dag, ongeveer een vijfde van al het rivierwater dat de oceanen bereikt. Breedte, diepte en snelheid in het model zijn ruwe, illustratieve waarden; de referentie is het gemeten gemiddelde.'
    },
    'bee-colony': {
      title: 'Bijen in een volk',
      question: 'Hoeveel werkbijen leven er aan het begin van de zomer in een sterk honingbijenvolk?',
      explain:
        'In evenwicht is het aantal levende bijen gelijk aan het tempo waarmee nieuwe erbij komen maal hoe lang elke bij leeft (met dezelfde regel schat je rijen in een winkel of auto’s op een weg). Op het hoogtepunt legt een koningin tot ongeveer 1500 eitjes per dag, en een zomerwerkbij leeft als volwassen bij maar ongeveer vijf weken. Dat geeft zo’n 50.000, en imkers tellen 50.000 tot 80.000 in sterke volken.'
    },
    'body-cells': {
      title: 'Cellen in het menselijk lichaam',
      question: 'Uit hoeveel menselijke cellen bestaat het lichaam van een volwassene (ongeveer 70 kg)?',
      explain:
        'Verrassing: de lichaamsmassa delen door de massa van een ‘gewone’ cel geeft het verkeerde antwoord, want in aantal zijn de meeste van onze cellen piepkleine rode bloedcellen. Een bloedtest telt er ongeveer 5 miljoen per microliter; met 5 liter bloed zijn dat er 25 biljoen, volgens een telling uit 2016 84 % van al onze cellen. Het totaal is ongeveer 30 biljoen menselijke cellen (plus ongeveer evenveel bacteriën).'
    },
    'nail-growth': {
      title: 'Groei van een vingernagel',
      question: 'Hoeveel millimeter groeit een vingernagel in een jaar?',
      explain:
        'Een vingernagel groeit ongeveer een tiende millimeter per dag: 3,5 mm per maand in een onderzoek onder gezonde jonge volwassenen, meer dan twee keer zo snel als teennagels. Dat is ongeveer 4 cm per jaar. Kleine snelheden worden zichtbaar als je ze met een lange tijd vermenigvuldigt.'
    },
    'lift-ride': {
      title: 'Energie voor een liftrit',
      question: 'Hoeveel wattuur elektrische energie gebruikt een lift om vier mensen tien verdiepingen omhoog te brengen?',
      explain:
        'Een massa m een hoogte h optillen kost minstens m·g·h: 300 kg × 9,81 m/s² × 30 m ≈ 88 kJ, ongeveer 25 Wh. Motor en tandwielen verliezen een deel, dus ongeveer 50 Wh: de energie die een led-lamp van 10 W in vijf uur gebruikt. Echte liften zijn ingewikkelder: een contragewicht compenseert de lege kooi plus ongeveer de helft van de last, en verlichting en elektronica in stand-by gebruiken over een jaar vaak meer energie dan de ritten zelf.'
    },
    'phone-charges': {
      title: 'Telefoon opladen met 1 kWh',
      question: 'Hoe vaak kun je een smartphone helemaal opladen met 1 kWh elektriciteit?',
      explain:
        'Een telefoonaccu van 4000–5000 mAh bij 3,85 V slaat 15–19 Wh op (mAh × V = mWh). Met wat verlies in de lader neemt één laadbeurt ongeveer 20 Wh uit het stopcontact, dus één kilowattuur, minder dan een gewoon huishouden per dag gebruikt, laadt een telefoon ongeveer 50 keer op.'
    },
    'ev-litre': {
      title: 'Een elektrische auto op één liter',
      question: 'Hoeveel kilometer zou een elektrische auto kunnen rijden op de energie in één liter benzine?',
      explain:
        'Een liter benzine bevat ongeveer 32 MJ chemische energie, dat is 8,9 kWh. Een kleine tot middelgrote elektrische auto gebruikt in praktijktests 13–25 kWh per 100 km, laadverliezen inbegrepen. De energie van één liter brengt hem dus ongeveer 50 km ver, terwijl een benzineauto er maar 15–20 km mee komt, omdat een motor het grootste deel van de energie in warmte omzet.'
    },
    'tea-energy': {
      title: 'Energie voor een kop thee',
      question: 'Hoeveel wattuur energie kost het om het water voor één kop thee van kraantemperatuur tot de kook te brengen?',
      explain:
        '1 kg water 1 °C opwarmen kost 4,19 kJ. Een kopje van 0,25 kg dat ongeveer 80 °C opwarmt, vraagt 84 kJ = 23 Wh: een waterkoker van 2 kW doet dat in ongeveer 40 seconden. In de praktijk koken mensen vaak twee keer zoveel water als ze inschenken, en de waterkoker zelf warmt mee op: de gewoonste manieren om het getal te verdubbelen.'
    },
    'airliner-fuel': {
      title: 'Kerosine van Londen naar New York',
      question: 'Hoeveel liter kerosine verbrandt een vol widebody-vliegtuig (ongeveer 300 passagiers) op een vlucht van Londen naar New York?',
      explain:
        'Moderne langeafstandstoestellen verbruiken ongeveer 3 liter per passagier per 100 km (een luchtvaartmaatschappij noemt 2,9 voor haar nieuwste type; oudere toestellen verbruiken meer). Londen–New York is langs de grootcirkel ongeveer 5500 km. 300 × 0,03 × 5540 ≈ 50.000 liter: ruim meer dan één tankwagen, zo’n 40 ton brandstof.'
    },
    'aa-petrol': {
      title: 'Batterijen tegen benzine',
      question: 'Hoeveel AA-alkalinebatterijen bevatten evenveel energie als één liter benzine?',
      explain:
        'Een AA-alkalinecel heeft ongeveer 2,5–2,8 Ah en levert tijdens het ontladen gemiddeld zo’n 1,2 V, dus ongeveer 3 Wh (minder bij zware belasting). Een liter benzine bevat ongeveer 8900 Wh: evenveel als zo’n 3000 batterijen, die samen ongeveer 70 kg zouden wegen. Daarom zijn brandstoffen zo moeilijk te vervangen.'
    },
    'solar-panel': {
      title: 'Een vierkante meter zonnepaneel',
      question: 'Hoeveel kilowattuur stroom levert één vierkante meter zonnepaneel in een jaar, gemiddeld voor nieuwe zonneparken wereldwijd?',
      explain:
        'Panelen worden beoordeeld bij vol zonlicht van 1000 W per vierkante meter; een modern paneel zet daarvan ongeveer een vijfde om in stroom, dus ongeveer 210 W nominaal per m². Maar er is nacht, bewolking en een lage winterzon: wereldwijd leveren nieuwe zonneparken gemiddeld maar ongeveer 16 % van hun nominale vermogen. Over de 8760 uur van een jaar geeft dat ongeveer 290 kWh per vierkante meter, ongeveer wat een koelkast in een jaar gebruikt. In zonnige woestijnen is het meer, in bewolkte streken minder.'
    },
    'body-power': {
      title: 'De warmte van een lichaam',
      question: 'Hoeveel watt warmte geeft een menselijk lichaam gemiddeld af?',
      explain:
        'Bijna alle voedingsenergie die we gebruiken, wordt uiteindelijk warmte. 2000 kcal per dag is 8,4 MJ; verdeeld over de 86.400 seconden van een dag is dat ongeveer 100 W. Een mens geeft dus ongeveer evenveel warmte af als een ouderwetse gloeilamp; daarom wordt een volle zaal warm.'
    },
    'car-lifetime-fuel': {
      title: 'Brandstof voor een autoleven',
      question: 'Hoeveel liter benzine verbruikt een benzineauto in zijn hele leven?',
      explain:
        'Een auto rijdt meestal 150.000–300.000 km voordat hij gesloopt wordt, en een benzineauto gebruikt ongeveer 5–10 liter per 100 km. Dat geeft ongeveer 14.000 liter: zo’n 280 volle tanks van 50 liter.'
    },
    'piano-tuners': {
      title: 'Pianostemmers in een stad',
      question: 'Hoeveel fulltime pianostemmers kan een stad van een miljoen inwoners aan het werk houden?',
      explain:
        'De klassieke vraag van Enrico Fermi. Met 2,5 personen per huishouden wonen een miljoen mensen in 400.000 huishoudens; als één op de twintig een piano heeft, zijn dat 20.000 piano’s. Eén keer per jaar gestemd geeft 20.000 stembeurten. Een stemmer doet er ongeveer vier per dag, zo’n 800 per jaar, dus de stad heeft er ongeveer 25 nodig. Er is geen officieel getal om mee te vergelijken: het gaat erom dat elke factor te schatten is en dat fouten in verschillende richtingen elkaar deels opheffen. De grootte van huishoudens verschilt wereldwijd sterk, van ongeveer 2 tot meer dan 5 personen.'
    },
    'births-day': {
      title: 'Geboorten per dag',
      question: 'Hoeveel baby’s worden er wereldwijd per dag geboren?',
      explain:
        'De VN tellen ongeveer 132 miljoen geboorten per jaar, ongeveer 16 per 1000 mensen. Gedeeld door 365 dagen is dat ongeveer 360.000 per dag, vier per seconde. Elke dag sterven er ongeveer 170.000 mensen; daarom groeit de wereldbevolking nog, al langzamer dan vroeger.'
    },
    'birthdays-today': {
      title: 'Verjaardagen vandaag',
      question: 'Hoeveel mensen op de wereld zijn vandaag jarig?',
      explain:
        'Verjaardagen zijn bijna gelijkmatig over het jaar verdeeld (sommige maanden hebben een paar procent meer geboorten), dus op elke dag is ongeveer één op de 365 mensen jarig: ongeveer 22 miljoen, meer dan de bevolking van de meeste landen.'
    },
    'lifetime-sleep': {
      title: 'Jaren slapen',
      question: 'Hoeveel jaar van een leven van 75 jaar brengt een mens slapend door?',
      explain:
        'Het deel van de dag dat je slaapt, is het deel van je leven dat je slaapt. Volwassenen slapen ongeveer 7–8 uur, baby’s en kinderen veel meer, dus ongeveer een derde van het leven: zo’n 25 jaar.'
    },
    'people-airborne': {
      title: 'Mensen in de lucht',
      question: 'Hoeveel mensen zitten er gemiddeld op elk moment in een passagiersvliegtuig in de lucht?',
      explain:
        'Luchtvaartmaatschappijen vervoerden in 2024 ongeveer 4,9 miljard passagiers. Een gemiddelde reis is ongeveer 1900 km, bij zo’n 800 km/h ongeveer 2,4 uur. De passagiersuren van een jaar gedeeld door de uren in een jaar geven het aantal dat tegelijk in de lucht is: ongeveer 1,3 miljoen, de bevolking van een grote stad, vliegend (overdag meer, ’s nachts minder).'
    },
    'lifetime-walking': {
      title: 'Lopen in een leven',
      question: 'Hoeveel kilometer loopt een mens in zijn leven?',
      explain:
        'Smartphonegegevens van 700.000 mensen in 111 landen lieten gemiddeld ongeveer 5000 stappen per dag zien (telefoons missen sommige stappen, dus het echte getal ligt iets hoger). Met 0,7 m per stap is dat 3,5 km per dag en bijna 100.000 km in 75 jaar: ongeveer tweeënhalf keer rond de aarde.'
    },
    'smartphones-year': {
      title: 'Verkochte smartphones per jaar',
      question: 'Hoeveel nieuwe smartphones worden er wereldwijd in een jaar verkocht?',
      explain:
        'Marktonderzoekers telden in 2025 ongeveer 1,25 miljard geleverde smartphones, een aantal dat al tien jaar tussen 1,2 en 1,5 miljard ligt. Een vervangingsmodel verklaart dat: als ongeveer de helft van alle mensen een smartphone gebruikt en die elke drie à vier jaar vervangt, zijn er elk jaar ongeveer 1,2–1,3 miljard nieuwe nodig.'
    },
    'teachers-city': {
      title: 'Leraren in een stad',
      question: 'Hoeveel leraren heeft een stad van een miljoen inwoners nodig voor haar leerlingen van 6 tot 17 jaar?',
      explain:
        'Kinderen onder de 15 vormen in OESO-landen ongeveer 17 % van de bevolking en wereldwijd ongeveer 25 %, dus de twaalf schooljaargangen van 6 tot 17 beslaan ruwweg 12–20 % van de inwoners. In de OESO-landen zijn er gemiddeld ongeveer 14 leerlingen per leraar in het basisonderwijs en 13 in de onderbouw van het voortgezet onderwijs, van zo’n 7 in sommige landen tot meer dan 20 in andere. Een miljoen mensen heeft dus ongeveer 10.000 leraren nodig. De onzekere factoren zijn het aandeel kinderen en het aantal leerlingen per leraar, en die verschillen sterk tussen landen.'
    },
    'world-cars': {
      title: 'Motorvoertuigen in de wereld',
      question: 'Hoeveel motorvoertuigen (auto’s, bestelwagens, vrachtwagens, bussen) zijn er wereldwijd in gebruik?',
      explain:
        'De vereniging van autofabrikanten telde in 2011 ongeveer 1,1 miljard voertuigen en in 2023 ongeveer 1,5 miljard: één op elke vijf à zes mensen. Het gemiddelde verbergt enorme verschillen: in veel rijke landen is er meer dan één voertuig per twee mensen, in veel arme landen minder dan één per twintig.'
    },
    'sunlight-time': {
      title: 'De reis van het zonlicht',
      question: 'Hoeveel seconden doet zonlicht erover om de aarde te bereiken?',
      explain:
        'De aarde staat ongeveer 150 miljoen km van de zon (1 astronomische eenheid) en licht legt bijna 300.000 km per seconde af, dus zonlicht is bij aankomst ongeveer 8 minuten en 20 seconden oud. In de loop van het jaar verandert de afstand ongeveer 3 %, dus de tijd schommelt tussen ongeveer 490 en 508 seconden.'
    },
    'earths-in-sun': {
      title: 'Aardes in de zon',
      question: 'Hoeveel aardes passen er, naar volume, in de zon?',
      explain:
        'De straal van de zon is ongeveer 109 keer die van de aarde. Volume groeit met de derde macht van de straal, dus het volume van de zon is 109 × 109 × 109 ≈ 1,3 miljoen aardes. Een kleine fout in de verhouding van de stralen telt drie keer: een verhouding van 100 zou 1 miljoen geven, een van 150 zou 3,4 miljoen geven.'
    },
    'drive-to-moon': {
      title: 'Met de auto naar de maan',
      question: 'Hoeveel dagen zou je erover doen om met een constante 100 km/u zonder stoppen naar de maan te rijden?',
      explain:
        'De maan staat gemiddeld 384.400 km weg, ongeveer tien keer rond de aarde. Met 100 km/u is dat 3844 uur, oftewel ongeveer 160 dagen non-stop rijden: meer dan vijf maanden.'
    },
    'drop-molecules': {
      title: 'Moleculen in een druppel',
      question: 'Hoeveel watermoleculen zitten er in één enkele waterdruppel?',
      explain:
        'Een druppel is ongeveer 0,05 mL (20 druppels maken een milliliter) en weegt 0,05 g. 18 g water is één mol, 6 × 10²³ moleculen. Een druppel bevat dus ongeveer 1,7 × 10²¹ moleculen: meer moleculen dan er druppels water in een groot meer zitten.'
    },
    'equator-speed': {
      title: 'Snelheid op de evenaar',
      question: 'Hoeveel kilometer per uur beweegt een punt op de evenaar doordat de aarde draait?',
      explain:
        'De evenaar is ongeveer 40.000 km lang: de meter werd ooit zo vastgelegd dat een kwart meridiaan 10.000 km meet. Eén omwenteling duurt ongeveer een dag, dus een punt op de evenaar beweegt met ongeveer 1670 km/u, sneller dan het geluid. We voelen het niet omdat de beweging gelijkmatig is.'
    },
    'iss-day': {
      title: 'Het ruimtestation op één dag',
      question: 'Hoeveel kilometer legt het Internationaal Ruimtestation op één dag af?',
      explain:
        'Het station draait op ongeveer 420 km boven de grond, dus zijn baan is maar iets langer dan de evenaar: ongeveer 42.700 km. Het maakt een omloop in ongeveer 92 minuten, 15,5 per dag, met ongeveer 7,7 km per seconde. Op één dag legt het ongeveer 660.000 km af: de afstand naar de maan en het grootste deel van de terugweg.'
    },
    'atmosphere-mass': {
      title: 'De massa van de atmosfeer',
      question: 'Hoeveel kilogram weegt de hele atmosfeer van de aarde?',
      explain:
        'Luchtdruk is het gewicht van alle lucht boven elke vierkante meter: ongeveer 10 ton per m². Vermenigvuldig met het aardoppervlak (510 miljoen km²) en deel door g: ongeveer 5,3 × 10¹⁸ kg. De gemeten waarde is 5,1 × 10¹⁸ kg, iets minder, omdat bergen en hooglanden de lucht in steken.'
    },
    'sun-mass-loss': {
      title: 'De zon zet massa om in licht',
      question: 'Hoeveel kilogram massa zet de zon elke seconde om in licht?',
      explain:
        'Einsteins E = mc² werkt in beide richtingen: energie uitstralen betekent massa verliezen. De zon straalt 3,8 × 10²⁶ watt uit; gedeeld door c² (9 × 10¹⁶ m²/s²) is dat ongeveer 4,3 miljard kg per seconde. Toch is dat over het hele leven van de zon tot nu toe minder dan een tiende procent van haar massa.'
    },
    'ocean-mass': {
      title: 'Water in de oceanen',
      question: 'Hoeveel kilogram water bevatten alle oceanen van de aarde?',
      explain:
        'De oceanen bedekken 71 % van de aarde, ongeveer 361 miljoen km², met een gemiddelde diepte van ongeveer 3,7 km. Dat is 1,33 miljard km³ water; bij iets meer dan een ton per kubieke meter weegt het ongeveer 1,4 × 10²¹ kg, en toch is dat maar ongeveer 0,02 % van de massa van de aarde.'
    }
  }
};
