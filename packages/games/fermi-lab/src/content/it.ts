import type { ContentText } from './types';

export const content: ContentText = {
  counts: {
    day: { one: 'giorno', many: 'giorni', other: 'giorni' },
    year: { one: 'anno', many: 'anni', other: 'anni' },
    ant: { one: 'formica', many: 'formiche', other: 'formiche' },
    battery: { one: 'pila', many: 'pile', other: 'pile' },
    beat: { one: 'battito', many: 'battiti', other: 'battiti' },
    bee: { one: 'ape', many: 'api', other: 'api' },
    birth: { one: 'nascita', many: 'nascite', other: 'nascite' },
    breath: { one: 'respiro', many: 'respiri', other: 'respiri' },
    cell: { one: 'cellula', many: 'cellule', other: 'cellule' },
    charge: { one: 'ricarica', many: 'ricariche', other: 'ricariche' },
    earth: { one: 'Terra', many: 'Terre', other: 'Terre' },
    egg: { one: 'uovo', many: 'uova', other: 'uova' },
    grain: { one: 'chicco', many: 'chicchi', other: 'chicchi' },
    hair: { one: 'capello', many: 'capelli', other: 'capelli' },
    household: { one: 'famiglia', many: 'famiglie', other: 'famiglie' },
    molecule: { one: 'molecola', many: 'molecole', other: 'molecole' },
    orbit: { one: 'orbita', many: 'orbite', other: 'orbite' },
    passenger: { one: 'passeggero', many: 'passeggeri', other: 'passeggeri' },
    person: { one: 'persona', many: 'persone', other: 'persone' },
    phone: { one: 'telefono', many: 'telefoni', other: 'telefoni' },
    piano: { one: 'pianoforte', many: 'pianoforti', other: 'pianoforti' },
    pupil: { one: 'alunno', many: 'alunni', other: 'alunni' },
    sheet: { one: 'foglio', many: 'fogli', other: 'fogli' },
    step: { one: 'passo', many: 'passi', other: 'passi' },
    teacher: { one: 'insegnante', many: 'insegnanti', other: 'insegnanti' },
    tree: { one: 'albero', many: 'alberi', other: 'alberi' },
    trip: { one: 'viaggio', many: 'viaggi', other: 'viaggi' },
    tuner: { one: 'accordatore', many: 'accordatori', other: 'accordatori' },
    tuning: { one: 'accordatura', many: 'accordature', other: 'accordature' },
    vehicle: { one: 'veicolo', many: 'veicoli', other: 'veicoli' },
    word: { one: 'parola', many: 'parole', other: 'parole' }
  },
  ratios: {
    high: { one: '{n} volta troppo alta.', many: '{n} volte troppo alta.', other: '{n} volte troppo alta.' },
    low: { one: '{n} volta troppo bassa.', many: '{n} volte troppo bassa.', other: '{n} volte troppo bassa.' },
    rowHigh: { one: '{n} volta troppo alta', many: '{n} volte troppo alta', other: '{n} volte troppo alta' },
    rowLow: { one: '{n} volta troppo bassa', many: '{n} volte troppo bassa', other: '{n} volte troppo bassa' },
    biasHigh: { one: 'In media le tue risposte erano {n} volta troppo alte.', many: 'In media le tue risposte erano {n} volte troppo alte.', other: 'In media le tue risposte erano {n} volte troppo alte.' },
    biasLow: { one: 'In media le tue risposte erano {n} volta troppo basse.', many: 'In media le tue risposte erano {n} volte troppo basse.', other: 'In media le tue risposte erano {n} volte troppo basse.' }
  },
  factors: {
    aaEnergy: 'Energia fornita da una pila AA',
    airDensity: 'Densità dell’aria',
    airTime: 'Tempo medio in volo per viaggio',
    antDensity: 'Formiche per metro quadrato di terra, in media',
    avogadro: 'Costante di Avogadro',
    batteryEnergy: 'Energia della batteria di un telefono',
    birthRate: 'Nascite per persona all’anno (tasso di natalità)',
    bloodVolume: 'Volume del sangue',
    breathRate: 'Respiri al minuto a riposo',
    capacityFactor: 'Potenza media come quota della potenza nominale (fattore di capacità)',
    carSpeed: 'Velocità',
    ceilingHeight: 'Altezza del soffitto',
    chargeEfficiency: 'Efficienza di ricarica',
    cloudVolume: 'Volume della nuvola',
    cloudWater: 'Acqua liquida per metro cubo di nuvola',
    crowdDensity: 'Persone per metro quadrato (folla fitta in piedi)',
    cupWater: 'Acqua per una tazza',
    daysPerYear: 'Giorni in un anno',
    daysPerYearPlain: 'Giorni in un anno',
    drinksPerDay: 'Bevande al giorno',
    driveEfficiency: 'Efficienza di motore e trasmissione',
    dropMass: 'Massa di una goccia',
    earthRadius: 'Raggio della Terra',
    earthSurface: 'Superficie della Terra',
    eggsPerDay: 'Uova deposte dalla regina al giorno',
    energyAvailable: 'Energia disponibile',
    equatorLength: 'Lunghezza dell’equatore',
    evConsumption: 'Consumo di un’auto elettrica',
    flightDistance: 'Distanza del volo',
    floorArea: 'Superficie del pavimento',
    flowSpeed: 'Velocità media della corrente',
    foodEnergy: 'Energia dal cibo al giorno',
    forestArea: 'Superficie forestale mondiale',
    fuelConsumption: 'Consumo di carburante',
    fuelPerPassengerKm: 'Carburante per passeggero e chilometro',
    grainDiameter: 'Diametro di un granello',
    grainMass: 'Massa di un chicco',
    gravity: 'Accelerazione di gravità',
    hairDensity: 'Capelli per centimetro quadrato',
    heartRate: 'Frequenza cardiaca a riposo',
    hoursPerDay: 'Ore in un giorno',
    hoursPerDayRate: 'Ore in un giorno',
    hoursPerYear: 'Ore in un anno',
    householdSize: 'Persone per famiglia',
    iceFreeLand: 'Superficie delle terre emerse senza ghiaccio',
    inhabitants: 'Abitanti',
    jarVolume: 'Volume del barattolo',
    joulesPerKcal: 'Joule in una chilocaloria',
    joulesPerWh: 'Joule in un wattora',
    lifetime: 'Durata della vita',
    lifetimeDistance: 'Chilometri percorsi in tutta la vita',
    lifetimeGiven: 'Durata della vita',
    liftHeight: 'Altezza di dieci piani',
    liftedMass: 'Massa sollevata (quattro persone)',
    lightSpeed: 'Velocità della luce',
    lightSpeedKm: 'Velocità della luce',
    litresPerM3: 'Litri in un metro cubo',
    minutesPerDay: 'Minuti in un giorno',
    minutesPerHour: 'Minuti in un’ora',
    minutesPerYear: 'Minuti in un anno',
    molarMass: 'Massa di una mole d’acqua',
    moonDistance: 'Distanza Terra–Luna',
    nailPerDay: 'Crescita al giorno',
    oceanArea: 'Superficie degli oceani',
    oceanDepth: 'Profondità media degli oceani',
    orbitLength: 'Lunghezza di un’orbita',
    orbitsPerDay: 'Orbite al giorno',
    packing: 'Quota del barattolo occupata dai granelli (il resto è aria)',
    panelArea: 'Superficie del pannello',
    panelEfficiency: 'Efficienza del pannello',
    passengers: 'Passeggeri',
    peoplePerVehicle: 'Persone per veicolo (media mondiale)',
    petrolEnergy: 'Energia in un litro di benzina',
    petrolEnergyWh: 'Energia in un litro di benzina',
    pianoShare: 'Pianoforti per famiglia',
    pitchLength: 'Lunghezza del campo',
    pitchWidth: 'Larghezza del campo',
    pupilsPerTeacher: 'Alunni per insegnante',
    rainfall: 'Pioggia annua (altezza d’acqua)',
    ratedSunlight: 'Luce solare su cui si basa la potenza nominale',
    redCellCount: 'Globuli rossi per microlitro di sangue',
    redCellShare: 'Quota dei globuli rossi su tutte le cellule',
    replacementYears: 'Anni prima di sostituire un telefono',
    riceMass: 'Riso nel sacchetto',
    riverDepth: 'Profondità media del fiume',
    riverWidth: 'Larghezza del fiume',
    roofArea: 'Superficie del tetto vista dall’alto',
    rotationTime: 'Durata di una rotazione',
    scalpArea: 'Superficie del cuoio capelluto con capelli',
    schoolAgeShare: 'Quota di abitanti tra 6 e 17 anni',
    seaLevelPressure: 'Pressione atmosferica al livello del mare',
    seawaterDensity: 'Densità dell’acqua di mare',
    secondsPerDay: 'Secondi in un giorno',
    sheetThickness: 'Spessore di un foglio',
    sleepPerDay: 'Sonno al giorno',
    smartphoneShare: 'Quota di persone che usano uno smartphone',
    speakingRate: 'Velocità di parola',
    specificHeat: 'Calore specifico dell’acqua',
    sphereFactor: 'Fattore sfera (6/π: una pallina riempie circa metà del suo cubo)',
    stackHeight: 'Altezza della pila',
    stepLength: 'Lunghezza di un passo',
    stepsPerDay: 'Passi al giorno',
    strokeVolume: 'Sangue per battito (gittata sistolica)',
    sunDistance: 'Distanza Sole–Terra',
    sunPower: 'Potenza irradiata dal Sole',
    sunRadius: 'Raggio del Sole',
    talkTime: 'Tempo passato a parlare al giorno',
    temperatureRise: 'Aumento di temperatura',
    treeDensity: 'Alberi per ettaro di foresta',
    tripsPerYear: 'Viaggi di passeggeri all’anno',
    tuningsPerPiano: 'Accordature per pianoforte all’anno',
    tuningsPerTuner: 'Accordature per accordatore all’anno (4 al giorno, 200 giorni lavorativi)',
    workerLife: 'Vita adulta di un’operaia estiva',
    worldPopulation: 'Popolazione mondiale'
  },
  tasks: {
    'rain-roof': {
      title: 'Pioggia su un tetto a Londra',
      question: 'Quanti litri di pioggia cadono in un anno sul tetto di una casa unifamiliare a Londra?',
      explain:
        'La pioggia si misura come un’altezza: la media di lungo periodo di Londra, circa 630 mm all’anno, equivale a uno strato d’acqua di 0,63 m se nulla scorresse via. Conta la superficie del tetto vista dall’alto (la sua impronta), non quella inclinata, più grande, perché la pioggia cade verticalmente. Nonostante la sua fama, Londra riceve circa metà della pioggia di New York: lì piove spesso, ma poco. Il fattore incerto è la superficie del tetto.'
    },
    'pitch-crowd': {
      title: 'Persone su un campo da calcio',
      question: 'Quante persone in piedi entrano in un campo da calcio?',
      explain:
        'Un campo standard misura 105 m × 68 m, circa 7.100 m². Conta soprattutto quanto stanno strette le persone: 2 per m² è un pubblico comodo, 4 è spalla a spalla, e 5 per m² è il limite massimo che chi pianifica la sicurezza delle folle usa per le zone in piedi; oltre diventa pericoloso. Quindi «entrare» copre un fattore da 2 a 3.'
    },
    'rice-grains': {
      title: 'Chicchi in un sacchetto di riso',
      question: 'Quanti chicchi di riso ci sono in un sacchetto da 1 kg?',
      explain:
        'Gli agronomi pesano il riso come «peso di mille semi»: la maggior parte delle varietà ha 15–35 g ogni 1.000 chicchi, quindi un chicco pesa circa 25 mg. 1.000 g diviso 0,025 g dà 40.000. Un trucco per le cose minuscole: pesa o conta un piccolo campione e moltiplica.'
    },
    'lifetime-drinking': {
      title: 'Quanto si beve in una vita',
      question: 'Quanti litri beve una persona nell’arco della vita (tutte le bevande insieme)?',
      explain:
        'L’Autorità europea per la sicurezza alimentare indica un apporto adeguato di acqua totale di 2,0 L al giorno per le donne e 2,5 L per gli uomini; circa il 70–80 % viene dalle bevande, il resto dal cibo. Sono circa 1,4–2,0 L di bevande al giorno. In 75 anni si arriva a circa 44.000 litri: una piccola piscina.'
    },
    'paper-stack': {
      title: 'Un metro di carta',
      question: 'Quanti fogli di normale carta per stampante formano una pila alta 1 metro?',
      explain:
        'La carta standard da 80 g/m² è spessa circa un decimo di millimetro (i produttori indicano 100–110 µm). Una risma da 500 fogli è alta circa 5 cm, quindi 1 m sono 20 risme: circa 10.000 fogli. Le cose sottili si misurano meglio in blocco: misura la risma, poi dividi.'
    },
    'room-air': {
      title: 'L’aria di un soggiorno',
      question: 'Quanti chilogrammi pesa tutta l’aria di un soggiorno tipico?',
      explain:
        'L’aria sembra non pesare nulla, ma un metro cubo a temperatura ambiente e al livello del mare pesa circa 1,2 kg. Una stanza di 25 m² alta 2,5 m contiene circa 62 m³ d’aria: circa 75 kg, quanto un adulto. L’incertezza sta nelle dimensioni della stanza; la densità dell’aria è un dato fisico.'
    },
    'words-per-day': {
      title: 'Parole dette in un giorno',
      question: 'Quante parole pronuncia in un giorno un adulto medio?',
      explain:
        'Uno studio che ha registrato brevi spezzoni audio di quasi 400 studenti per diversi giorni ha trovato che donne e uomini dicevano entrambi circa 16.000 parole al giorno; l’idea diffusa di 20.000 per le donne contro 7.000 per gli uomini era sbagliata. Le persone differiscono enormemente (da qualche centinaio a oltre 40.000 parole), quindi l’intervallo è ampio. In una conversazione si dicono circa 110–170 parole al minuto, quindi 16.000 parole sono circa due ore di parlato effettivo.'
    },
    'sand-jar': {
      title: 'Granelli di sabbia in un barattolo',
      question: 'Quanti granelli di sabbia ci sono in un barattolo da un litro pieno di sabbia asciutta?',
      explain:
        'Immagina ogni granello come una pallina di diametro d: un litro (un milione di millimetri cubi) contiene circa 0,6 × 1.000.000 × 6/π ÷ d³ granelli. Il diametro compare al cubo, quindi domina tutto: la sabbia è fatta di granelli da 0,06 a 2 mm, e dimezzare d moltiplica il numero per otto. Una sabbia media (0,25–0,5 mm) dà da 10 a 70 milioni di granelli, una sabbia grossa da uno a dieci milioni.'
    },
    heartbeats: {
      title: 'Battiti in una vita',
      question: 'Quante volte batte un cuore umano nell’arco di una vita?',
      explain:
        'Circa 70 battiti al minuto fanno circa 100.000 al giorno e 37 milioni all’anno. In 75 anni si arriva vicino a tre miliardi di battiti. Il cuore batte più veloce nell’infanzia e durante lo sforzo e più lento nel sonno, quindi 70 è una media ragionevole su tutta la vita.'
    },
    'scalp-hairs': {
      title: 'Capelli su una testa',
      question: 'Quanti capelli ha in testa un adulto (con una capigliatura completa)?',
      explain:
        'Il dato consueto è di circa 100.000 capelli, di solito tra 80.000 e 150.000; chi è biondo tende ad avere più capelli e più sottili, chi ha i capelli rossi meno capelli e più spessi. Un pezzo di cuoio capelluto grande come un palmo misura circa 100 cm², e la parte della testa con i capelli ne vale sei o sette.'
    },
    'breaths-day': {
      title: 'Respiri in un giorno',
      question: 'Quanti respiri fa un adulto in un giorno?',
      explain:
        'Un adulto a riposo respira da 12 a 20 volte al minuto. Un giorno ha 1.440 minuti, quindi sono circa 17.000–29.000 respiri. Contare i propri respiri per un minuto è un buon modo per verificare da sé un fattore.'
    },
    'blood-pumped': {
      title: 'Sangue pompato in un giorno',
      question: 'Quanti litri di sangue pompa un cuore a riposo in un giorno?',
      explain:
        'Ogni battito spinge fuori circa 70 mL; a 70 battiti al minuto sono circa 5 litri al minuto, tutto il sangue del corpo una volta al minuto. In un giorno si arriva a circa 7.000 litri, abbastanza per riempire un grande serbatoio. I medici la chiamano gittata cardiaca: 4–8 litri al minuto a riposo.'
    },
    'ants-earth': {
      title: 'Formiche sulla Terra',
      question: 'Quante formiche vivono sulla Terra?',
      explain:
        'Uno studio del 2022 ha riunito centinaia di conteggi sul campo da tutti i continenti e ha stimato circa 20 milioni di miliardi (2 × 10¹⁶) di formiche: circa 2,5 milioni per persona, con una massa totale superiore a quella di tutti gli uccelli e i mammiferi selvatici insieme. Distribuite sulle terre senza ghiaccio, sono in media circa 150 formiche per metro quadrato, per lo più nelle foreste tropicali e nelle savane. Gli autori definiscono la cifra prudente.'
    },
    'trees-earth': {
      title: 'Alberi sulla Terra',
      question: 'Quanti alberi ci sono sulla Terra?',
      explain:
        'Uno studio del 2015 ha combinato più di 400.000 aree forestali con mappe satellitari e ha contato circa 3.000 miliardi di alberi (tronchi più spessi di 10 cm all’altezza del petto): oltre 400 per persona e sette volte più delle stime precedenti. Le foreste del mondo coprono circa 4 miliardi di ettari, quindi in media circa 700–800 alberi per ettaro (un albero ogni 13 m²).'
    },
    'cloud-mass': {
      title: 'L’acqua di una nuvola',
      question: 'Quante tonnellate pesa l’acqua di una piccola nuvola di bel tempo, soffice?',
      explain:
        'Un tipico cumulo di bel tempo è largo circa 1 km, quindi è grande circa un chilometro cubo: un miliardo di metri cubi. Ognuno contiene solo circa mezzo grammo di goccioline minuscole, ma tutte insieme fanno circa 500 tonnellate d’acqua, quanto un centinaio di elefanti. La nuvola galleggia perché le goccioline sono minuscole e l’aria intorno sale.'
    },
    'amazon-day': {
      title: 'Il Rio delle Amazzoni in un giorno',
      question: 'Quanti metri cubi d’acqua riversa il Rio delle Amazzoni nell’oceano Atlantico in un giorno medio?',
      explain:
        'Portata = larghezza × profondità × velocità. Vicino alla città di Óbidos il Rio delle Amazzoni si stringe in un unico alveo largo solo circa 2 km, ma profondo decine di metri, e scorre fino a 2 m/s. Alla foce trasporta in media circa 206.000 m³ al secondo: circa 18 miliardi di m³ al giorno, più o meno un quinto di tutta l’acqua dei fiumi che arriva agli oceani. Larghezza, profondità e velocità del modello sono valori indicativi; il riferimento è la media misurata.'
    },
    'bee-colony': {
      title: 'Api in una colonia',
      question: 'Quante api operaie vivono in una colonia forte di api mellifere all’inizio dell’estate?',
      explain:
        'In equilibrio il numero di api vive è uguale al ritmo con cui ne arrivano di nuove moltiplicato per quanto vive ciascuna (la stessa regola stima le code nei negozi o le auto su una strada). Nel pieno della stagione una regina depone fino a circa 1.500 uova al giorno, e un’operaia estiva vive da adulta solo circa cinque settimane. Ne risultano circa 50.000, e gli apicoltori ne contano da 50.000 a 80.000 nelle colonie forti.'
    },
    'body-cells': {
      title: 'Cellule del corpo umano',
      question: 'Da quante cellule umane è composto il corpo di un adulto (circa 70 kg)?',
      explain:
        'Sorpresa: dividere la massa del corpo per quella di una cellula «tipica» porta fuori strada, perché per numero la maggior parte delle nostre cellule sono minuscoli globuli rossi. Un esame del sangue ne conta circa 5 milioni per microlitro; con 5 litri di sangue sono 25.000 miliardi, l’84 % di tutte le nostre cellule secondo un censimento del 2016. Il totale è di circa 30.000 miliardi di cellule umane (più un numero simile di batteri).'
    },
    'nail-growth': {
      title: 'La crescita di un’unghia',
      question: 'Di quanti millimetri cresce un’unghia della mano in un anno?',
      explain:
        'Un’unghia della mano cresce di circa un decimo di millimetro al giorno: 3,5 mm al mese in uno studio su giovani adulti sani, più del doppio delle unghie dei piedi. Sono circa 4 cm all’anno. I ritmi piccoli diventano visibili quando li si moltiplica per un tempo lungo.'
    },
    'lift-ride': {
      title: 'L’energia di una corsa in ascensore',
      question: 'Quanti wattora di energia elettrica usa un ascensore per portare quattro persone su di dieci piani?',
      explain:
        'Sollevare una massa m di un’altezza h richiede almeno m·g·h: 300 kg × 9,81 m/s² × 30 m ≈ 88 kJ, circa 25 Wh. Motore e ingranaggi ne perdono una parte, quindi circa 50 Wh: l’energia che una lampadina LED da 10 W consuma in cinque ore. Gli ascensori veri sono più complicati: un contrappeso bilancia la cabina vuota più circa metà del carico, e luci ed elettronica in standby spesso consumano in un anno più energia delle corse stesse.'
    },
    'phone-charges': {
      title: 'Ricariche del telefono con 1 kWh',
      question: 'Quante ricariche complete di smartphone si ottengono da 1 kWh di elettricità?',
      explain:
        'Una batteria da 4.000–5.000 mAh a 3,85 V immagazzina 15–19 Wh (mAh × V = mWh). Con un po’ di perdite nel caricabatterie, una ricarica preleva circa 20 Wh dalla presa, quindi un chilowattora, meno di quanto una famiglia tipica consumi in un giorno, ricarica un telefono circa 50 volte.'
    },
    'ev-litre': {
      title: 'Un’auto elettrica con un litro',
      question: 'Quanti chilometri potrebbe percorrere un’auto elettrica con l’energia contenuta in un litro di benzina?',
      explain:
        'Un litro di benzina contiene circa 32 MJ di energia chimica, cioè 8,9 kWh. Un’auto elettrica piccola o media consuma 13–25 kWh ogni 100 km nelle prove su strada, perdite di ricarica comprese. L’energia di un litro la porterebbe quindi a circa 50 km, mentre un’auto a benzina ne ricava solo 15–20 km, perché un motore trasforma in calore la maggior parte dell’energia del carburante.'
    },
    'tea-energy': {
      title: 'L’energia per una tazza di tè',
      question: 'Quanti wattora servono per scaldare l’acqua di una tazza di tè dalla temperatura del rubinetto fino all’ebollizione?',
      explain:
        'Scaldare 1 kg d’acqua di 1 °C costa 4,19 kJ. Una tazza da 0,25 kg scaldata di circa 80 °C richiede 84 kJ = 23 Wh: un bollitore da 2 kW ci mette circa 40 secondi. In pratica spesso si bolle il doppio dell’acqua che si versa, e il bollitore stesso si scalda: i modi più comuni per raddoppiare il dato.'
    },
    'airliner-fuel': {
      title: 'Carburante da Londra a New York',
      question: 'Quanti litri di cherosene brucia un aereo a fusoliera larga pieno (circa 300 passeggeri) volando da Londra a New York?',
      explain:
        'I moderni aerei a lungo raggio bruciano circa 3 litri per passeggero ogni 100 km (una compagnia indica 2,9 per il suo modello più recente; gli aerei più vecchi consumano di più). Londra–New York sono circa 5.500 km lungo l’arco di cerchio massimo. 300 × 0,03 × 5.540 ≈ 50.000 litri: ben più di un’autocisterna, circa 40 tonnellate di carburante.'
    },
    'aa-petrol': {
      title: 'Pile contro benzina',
      question: 'Quante pile alcaline AA contengono tanta energia quanto un litro di benzina?',
      explain:
        'Una pila alcalina AA ha circa 2,5–2,8 Ah e fornisce in media circa 1,2 V mentre si scarica, quindi circa 3 Wh (meno sotto carico elevato). Un litro di benzina contiene circa 8.900 Wh: quanto circa 3.000 pile, che peserebbero circa 70 kg. Ecco perché i carburanti sono così difficili da sostituire.'
    },
    'solar-panel': {
      title: 'Un metro quadrato di pannello solare',
      question: 'Quanti chilowattora di elettricità produce un metro quadrato di pannello solare in un anno, in media per i nuovi impianti solari nel mondo?',
      explain:
        'I pannelli sono valutati in pieno sole, 1.000 W per metro quadrato; un pannello moderno ne trasforma in elettricità circa un quinto, quindi circa 210 W nominali per m². Ma ci sono la notte, le nuvole e il sole basso d’inverno: nel mondo i nuovi impianti solari forniscono in media solo circa il 16 % della loro potenza nominale. Sulle 8.760 ore di un anno sono circa 290 kWh per metro quadrato, più o meno quanto consuma un frigorifero in un anno. Nei deserti soleggiati è di più, nelle regioni nuvolose di meno.'
    },
    'body-power': {
      title: 'Il calore di un corpo',
      question: 'Quanti watt di calore emette in media un corpo umano?',
      explain:
        'Quasi tutta l’energia del cibo che usiamo finisce in calore. 2.000 kcal al giorno sono 8,4 MJ; distribuiti sugli 86.400 secondi di un giorno, fanno circa 100 W. Una persona emette più o meno il calore di una vecchia lampadina a incandescenza, ed è per questo che una sala piena si scalda.'
    },
    'car-lifetime-fuel': {
      title: 'Il carburante di una vita d’auto',
      question: 'Quanti litri di benzina brucia un’auto a benzina in tutta la sua vita?',
      explain:
        'Un’auto percorre di solito 150.000–300.000 km prima della rottamazione, e un’auto a benzina consuma circa 5–10 litri ogni 100 km. Ne risultano circa 14.000 litri: circa 280 pieni da 50 litri.'
    },
    'piano-tuners': {
      title: 'Accordatori di pianoforte in una città',
      question: 'Quanti accordatori di pianoforte a tempo pieno può tenere occupati una città di un milione di abitanti?',
      explain:
        'La domanda classica di Enrico Fermi. Con 2,5 persone per famiglia, un milione di persone vive in 400.000 famiglie; se una su venti ha un pianoforte, sono 20.000 pianoforti. Accordati una volta all’anno, fanno 20.000 accordature. Un accordatore ne fa circa quattro al giorno, circa 800 all’anno, quindi la città ne ha bisogno di circa 25. Non c’è un dato ufficiale con cui confrontare: il punto è che ogni fattore si può stimare e gli errori in direzioni opposte in parte si compensano. La dimensione delle famiglie varia molto nel mondo, da circa 2 a oltre 5 persone.'
    },
    'births-day': {
      title: 'Nascite in un giorno',
      question: 'Quanti bambini nascono ogni giorno nel mondo?',
      explain:
        'L’ONU conta circa 132 milioni di nascite all’anno, circa 16 ogni 1.000 persone. Diviso per 365 giorni sono circa 360.000 al giorno, quattro al secondo. Ogni giorno muoiono circa 170.000 persone; per questo la popolazione mondiale cresce ancora, anche se più lentamente di prima.'
    },
    'birthdays-today': {
      title: 'Compleanni di oggi',
      question: 'Quante persone al mondo compiono gli anni oggi?',
      explain:
        'I compleanni si distribuiscono quasi uniformemente durante l’anno (alcuni mesi hanno qualche punto percentuale di nascite in più), quindi in un giorno qualsiasi compie gli anni circa una persona su 365: circa 22 milioni, più della popolazione della maggior parte dei paesi.'
    },
    'lifetime-sleep': {
      title: 'Anni passati a dormire',
      question: 'Quanti anni di una vita di 75 anni passa una persona a dormire?',
      explain:
        'La parte del giorno passata a dormire è la parte della vita passata a dormire. Gli adulti dormono circa 7–8 ore, i neonati e i bambini molto di più, quindi circa un terzo della vita: circa 25 anni.'
    },
    'people-airborne': {
      title: 'Persone in volo',
      question: 'In media, quante persone si trovano in ogni momento a bordo di un aereo passeggeri in volo?',
      explain:
        'Le compagnie aeree hanno trasportato circa 4,9 miliardi di passeggeri nel 2024. Un viaggio medio è di circa 1.900 km, a circa 800 km/h circa 2,4 ore. Le ore-passeggero di un anno divise per le ore di un anno danno quanti sono in volo contemporaneamente: circa 1,3 milioni, la popolazione di una grande città, in volo (di più di giorno, meno di notte).'
    },
    'lifetime-walking': {
      title: 'Camminare in una vita',
      question: 'Quanti chilometri percorre a piedi una persona nell’arco della vita?',
      explain:
        'I dati degli smartphone di 700.000 persone in 111 paesi hanno mostrato una media di circa 5.000 passi al giorno (i telefoni perdono alcuni passi, quindi il dato reale è un po’ più alto). A 0,7 m per passo sono 3,5 km al giorno e quasi 100.000 km in 75 anni: circa due giri e mezzo intorno alla Terra.'
    },
    'smartphones-year': {
      title: 'Smartphone venduti in un anno',
      question: 'Quanti smartphone nuovi si vendono nel mondo in un anno?',
      explain:
        'Le società di ricerca hanno contato circa 1,25 miliardi di smartphone spediti nel 2025, un numero rimasto tra 1,2 e 1,5 miliardi per un decennio. Un modello di sostituzione lo spiega: se circa metà delle persone usa uno smartphone e lo cambia ogni tre o quattro anni, ne servono circa 1,2–1,3 miliardi nuovi ogni anno.'
    },
    'teachers-city': {
      title: 'Insegnanti in una città',
      question: 'Di quanti insegnanti ha bisogno una città di un milione di abitanti per i suoi alunni dai 6 ai 17 anni?',
      explain:
        'I bambini sotto i 15 anni sono circa il 17 % della popolazione nei paesi OCSE e circa il 25 % nel mondo, quindi i dodici anni scolastici dai 6 ai 17 coprono più o meno il 12–20 % degli abitanti. Nei paesi OCSE ci sono in media circa 14 alunni per insegnante nella scuola primaria e 13 nella secondaria di primo grado, da circa 7 in alcuni paesi a oltre 20 in altri. Un milione di persone ha quindi bisogno di circa 10.000 insegnanti. I fattori incerti sono la quota di bambini e il numero di alunni per insegnante, che variano molto tra i paesi.'
    },
    'world-cars': {
      title: 'Veicoli a motore nel mondo',
      question: 'Quanti veicoli a motore (auto, furgoni, camion, autobus) sono in uso nel mondo?',
      explain:
        'L’associazione dei costruttori di auto contava circa 1,1 miliardi di veicoli nel 2011 e circa 1,5 miliardi nel 2023: uno ogni cinque o sei persone. La media nasconde differenze enormi: in molti paesi ricchi c’è più di un veicolo ogni due persone, in molti paesi poveri meno di uno ogni venti.'
    },
    'sunlight-time': {
      title: 'Il viaggio della luce del Sole',
      question: 'Quanti secondi impiega la luce del Sole a raggiungere la Terra?',
      explain:
        'La Terra dista circa 150 milioni di km dal Sole (1 unità astronomica) e la luce percorre quasi 300.000 km al secondo, quindi la luce del Sole ha circa 8 minuti e 20 secondi quando arriva. Durante l’anno la distanza cambia di circa il 3 %, quindi il tempo varia tra circa 490 e 508 secondi.'
    },
    'earths-in-sun': {
      title: 'Terre dentro il Sole',
      question: 'In volume, quante Terre entrerebbero nel Sole?',
      explain:
        'Il raggio del Sole è circa 109 volte quello della Terra. Il volume cresce con il cubo del raggio, quindi il volume del Sole è 109 × 109 × 109 ≈ 1,3 milioni di Terre. Un piccolo errore nel rapporto dei raggi conta tre volte: un rapporto di 100 darebbe 1 milione, uno di 150 darebbe 3,4 milioni.'
    },
    'drive-to-moon': {
      title: 'In auto fino alla Luna',
      question: 'Quanti giorni servirebbero per arrivare in auto alla Luna a 100 km/h costanti, senza fermarsi?',
      explain:
        'La Luna dista in media 384.400 km, circa dieci giri intorno alla Terra. A 100 km/h sono 3.844 ore, cioè circa 160 giorni di guida senza sosta: più di cinque mesi.'
    },
    'drop-molecules': {
      title: 'Molecole in una goccia',
      question: 'Quante molecole d’acqua ci sono in una sola goccia d’acqua?',
      explain:
        'Una goccia è di circa 0,05 mL (20 gocce fanno un millilitro) e pesa 0,05 g. 18 g d’acqua sono una mole, 6 × 10²³ molecole. Quindi una goccia contiene circa 1,7 × 10²¹ molecole: più molecole di quante gocce d’acqua ci siano in un grande lago.'
    },
    'equator-speed': {
      title: 'Velocità all’equatore',
      question: 'A quanti chilometri all’ora si muove un punto dell’equatore per la rotazione della Terra?',
      explain:
        'L’equatore è lungo circa 40.000 km: il metro un tempo fu definito in modo che un quarto di meridiano misurasse 10.000 km. Un giro dura circa un giorno, quindi un punto dell’equatore viaggia a circa 1.670 km/h, più veloce del suono. Non lo sentiamo perché il moto è regolare.'
    },
    'iss-day': {
      title: 'La stazione spaziale in un giorno',
      question: 'Quanti chilometri percorre in un giorno la Stazione spaziale internazionale?',
      explain:
        'La stazione orbita a circa 420 km dal suolo, quindi la sua orbita è solo un po’ più lunga dell’equatore: circa 42.700 km. Completa un giro in circa 92 minuti, 15,5 al giorno, volando a circa 7,7 km al secondo. In un giorno percorre circa 660.000 km: la distanza fino alla Luna e gran parte del ritorno.'
    },
    'atmosphere-mass': {
      title: 'La massa dell’atmosfera',
      question: 'Quanti chilogrammi pesa l’intera atmosfera terrestre?',
      explain:
        'La pressione atmosferica è il peso di tutta l’aria sopra ogni metro quadrato: circa 10 tonnellate per m². Moltiplicando per la superficie della Terra (510 milioni di km²) e dividendo per g si ottengono circa 5,3 × 10¹⁸ kg. Il valore misurato è 5,1 × 10¹⁸ kg, un po’ meno, perché montagne e altopiani sporgono nell’aria.'
    },
    'sun-mass-loss': {
      title: 'Il Sole trasforma massa in luce',
      question: 'Quanti chilogrammi di massa trasforma il Sole in luce ogni secondo?',
      explain:
        'La E = mc² di Einstein vale in entrambe le direzioni: irradiare energia significa perdere massa. Il Sole irradia 3,8 × 10²⁶ watt; dividendo per c² (9 × 10¹⁶ m²/s²) si ottengono circa 4,3 miliardi di kg al secondo. Eppure, su tutta la vita del Sole finora, ciò fa meno di un decimo dell’uno per cento della sua massa.'
    },
    'ocean-mass': {
      title: 'L’acqua degli oceani',
      question: 'Quanti chilogrammi d’acqua contengono tutti gli oceani della Terra?',
      explain:
        'Gli oceani coprono il 71 % della Terra, circa 361 milioni di km², con una profondità media di circa 3,7 km. Sono 1,33 miliardi di km³ d’acqua; a poco più di una tonnellata per metro cubo pesa circa 1,4 × 10²¹ kg, eppure è solo circa lo 0,02 % della massa della Terra.'
    }
  }
};
