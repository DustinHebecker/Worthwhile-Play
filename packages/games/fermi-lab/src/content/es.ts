import type { ContentText } from './types';

export const content: ContentText = {
  counts: {
    day: { one: 'día', many: 'días', other: 'días' },
    year: { one: 'año', many: 'años', other: 'años' },
    ant: { one: 'hormiga', many: 'hormigas', other: 'hormigas' },
    battery: { one: 'pila', many: 'pilas', other: 'pilas' },
    beat: { one: 'latido', many: 'latidos', other: 'latidos' },
    bee: { one: 'abeja', many: 'abejas', other: 'abejas' },
    birth: { one: 'nacimiento', many: 'nacimientos', other: 'nacimientos' },
    breath: { one: 'respiración', many: 'respiraciones', other: 'respiraciones' },
    cell: { one: 'célula', many: 'células', other: 'células' },
    charge: { one: 'carga', many: 'cargas', other: 'cargas' },
    earth: { one: 'Tierra', many: 'Tierras', other: 'Tierras' },
    egg: { one: 'huevo', many: 'huevos', other: 'huevos' },
    grain: { one: 'grano', many: 'granos', other: 'granos' },
    hair: { one: 'pelo', many: 'pelos', other: 'pelos' },
    household: { one: 'hogar', many: 'hogares', other: 'hogares' },
    molecule: { one: 'molécula', many: 'moléculas', other: 'moléculas' },
    orbit: { one: 'órbita', many: 'órbitas', other: 'órbitas' },
    passenger: { one: 'pasajero', many: 'pasajeros', other: 'pasajeros' },
    person: { one: 'persona', many: 'personas', other: 'personas' },
    phone: { one: 'teléfono', many: 'teléfonos', other: 'teléfonos' },
    piano: { one: 'piano', many: 'pianos', other: 'pianos' },
    pupil: { one: 'alumno', many: 'alumnos', other: 'alumnos' },
    sheet: { one: 'hoja', many: 'hojas', other: 'hojas' },
    step: { one: 'paso', many: 'pasos', other: 'pasos' },
    teacher: { one: 'docente', many: 'docentes', other: 'docentes' },
    tree: { one: 'árbol', many: 'árboles', other: 'árboles' },
    trip: { one: 'viaje', many: 'viajes', other: 'viajes' },
    tuner: { one: 'afinador', many: 'afinadores', other: 'afinadores' },
    tuning: { one: 'afinación', many: 'afinaciones', other: 'afinaciones' },
    vehicle: { one: 'vehículo', many: 'vehículos', other: 'vehículos' },
    word: { one: 'palabra', many: 'palabras', other: 'palabras' }
  },
  ratios: {
    high: { one: '{n} vez demasiado alto.', many: '{n} veces demasiado alto.', other: '{n} veces demasiado alto.' },
    low: { one: '{n} vez demasiado bajo.', many: '{n} veces demasiado bajo.', other: '{n} veces demasiado bajo.' },
    rowHigh: { one: '{n} vez demasiado alto', many: '{n} veces demasiado alto', other: '{n} veces demasiado alto' },
    rowLow: { one: '{n} vez demasiado bajo', many: '{n} veces demasiado bajo', other: '{n} veces demasiado bajo' },
    biasHigh: { one: 'En promedio, tus respuestas fueron {n} vez demasiado altas.', many: 'En promedio, tus respuestas fueron {n} veces demasiado altas.', other: 'En promedio, tus respuestas fueron {n} veces demasiado altas.' },
    biasLow: { one: 'En promedio, tus respuestas fueron {n} vez demasiado bajas.', many: 'En promedio, tus respuestas fueron {n} veces demasiado bajas.', other: 'En promedio, tus respuestas fueron {n} veces demasiado bajas.' }
  },
  factors: {
    aaEnergy: 'Energía que entrega una pila AA',
    airDensity: 'Densidad del aire',
    airTime: 'Tiempo medio en el aire por viaje',
    antDensity: 'Hormigas por metro cuadrado de tierra, en promedio',
    avogadro: 'Constante de Avogadro',
    batteryEnergy: 'Energía de la batería de un teléfono',
    birthRate: 'Nacimientos por persona y año (tasa de natalidad)',
    bloodVolume: 'Volumen de sangre',
    breathRate: 'Respiraciones por minuto en reposo',
    capacityFactor: 'Potencia media como fracción de la potencia nominal (factor de capacidad)',
    carSpeed: 'Velocidad',
    ceilingHeight: 'Altura del techo',
    chargeEfficiency: 'Eficiencia de carga',
    cloudVolume: 'Volumen de la nube',
    cloudWater: 'Agua líquida por metro cúbico de nube',
    crowdDensity: 'Personas por metro cuadrado (multitud densa de pie)',
    cupWater: 'Agua para una taza',
    daysPerYear: 'Días de un año',
    daysPerYearPlain: 'Días de un año',
    drinksPerDay: 'Bebidas al día',
    driveEfficiency: 'Eficiencia del motor y la transmisión',
    dropMass: 'Masa de una gota',
    earthRadius: 'Radio de la Tierra',
    earthSurface: 'Superficie de la Tierra',
    eggsPerDay: 'Huevos que pone la reina al día',
    energyAvailable: 'Energía disponible',
    equatorLength: 'Longitud del ecuador',
    evConsumption: 'Consumo de un coche eléctrico',
    flightDistance: 'Distancia del vuelo',
    floorArea: 'Superficie del suelo',
    flowSpeed: 'Velocidad media de la corriente',
    foodEnergy: 'Energía de los alimentos al día',
    forestArea: 'Superficie forestal del mundo',
    fuelConsumption: 'Consumo de combustible',
    fuelPerPassengerKm: 'Combustible por pasajero y kilómetro',
    grainDiameter: 'Diámetro de un grano',
    grainMass: 'Masa de un grano',
    gravity: 'Aceleración de la gravedad',
    hairDensity: 'Pelos por centímetro cuadrado',
    heartRate: 'Frecuencia cardiaca en reposo',
    hoursPerDay: 'Horas de un día',
    hoursPerDayRate: 'Horas de un día',
    hoursPerYear: 'Horas de un año',
    householdSize: 'Personas por hogar',
    iceFreeLand: 'Superficie terrestre sin hielo',
    inhabitants: 'Habitantes',
    jarVolume: 'Volumen del frasco',
    joulesPerKcal: 'Julios en una kilocaloría',
    joulesPerWh: 'Julios en un vatio-hora',
    lifetime: 'Duración de la vida',
    lifetimeDistance: 'Distancia recorrida en toda su vida',
    lifetimeGiven: 'Duración de la vida',
    liftHeight: 'Altura de diez pisos',
    liftedMass: 'Masa elevada (cuatro personas)',
    lightSpeed: 'Velocidad de la luz',
    lightSpeedKm: 'Velocidad de la luz',
    litresPerM3: 'Litros en un metro cúbico',
    minutesPerDay: 'Minutos de un día',
    minutesPerHour: 'Minutos de una hora',
    minutesPerYear: 'Minutos de un año',
    molarMass: 'Masa de un mol de agua',
    moonDistance: 'Distancia Tierra–Luna',
    nailPerDay: 'Crecimiento por día',
    oceanArea: 'Superficie de los océanos',
    oceanDepth: 'Profundidad media de los océanos',
    orbitLength: 'Longitud de una órbita',
    orbitsPerDay: 'Órbitas por día',
    packing: 'Parte del frasco ocupada por granos (el resto es aire)',
    panelArea: 'Superficie del panel',
    panelEfficiency: 'Eficiencia del panel',
    passengers: 'Pasajeros',
    peoplePerVehicle: 'Personas por vehículo (media mundial)',
    petrolEnergy: 'Energía de un litro de gasolina',
    petrolEnergyWh: 'Energía de un litro de gasolina',
    pianoShare: 'Pianos por hogar',
    pitchLength: 'Largo del campo',
    pitchWidth: 'Ancho del campo',
    pupilsPerTeacher: 'Alumnos por docente',
    rainfall: 'Lluvia anual (altura de agua)',
    ratedSunlight: 'Luz solar en la que se basa la potencia del panel',
    redCellCount: 'Glóbulos rojos por microlitro de sangre',
    redCellShare: 'Fracción de glóbulos rojos entre todas las células',
    replacementYears: 'Años hasta reemplazar un teléfono',
    riceMass: 'Arroz en la bolsa',
    riverDepth: 'Profundidad media del río',
    riverWidth: 'Ancho del río',
    roofArea: 'Superficie del tejado vista desde arriba',
    rotationTime: 'Duración de una rotación',
    scalpArea: 'Superficie del cuero cabelludo con pelo',
    schoolAgeShare: 'Fracción de habitantes de 6 a 17 años',
    seaLevelPressure: 'Presión del aire al nivel del mar',
    seawaterDensity: 'Densidad del agua de mar',
    secondsPerDay: 'Segundos de un día',
    sheetThickness: 'Grosor de una hoja',
    sleepPerDay: 'Sueño al día',
    smartphoneShare: 'Fracción de personas que usan un smartphone',
    speakingRate: 'Velocidad del habla',
    specificHeat: 'Calor específico del agua',
    sphereFactor: 'Factor de esfera (6/π: una bola llena aproximadamente la mitad de su cubo)',
    stackHeight: 'Altura de la pila',
    stepLength: 'Longitud de un paso',
    stepsPerDay: 'Pasos al día',
    strokeVolume: 'Sangre por latido (volumen sistólico)',
    sunDistance: 'Distancia Sol–Tierra',
    sunPower: 'Potencia radiada por el Sol',
    sunRadius: 'Radio del Sol',
    talkTime: 'Tiempo hablando al día',
    temperatureRise: 'Aumento de temperatura',
    treeDensity: 'Árboles por hectárea de bosque',
    tripsPerYear: 'Viajes de pasajeros por año',
    tuningsPerPiano: 'Afinaciones por piano y año',
    tuningsPerTuner: 'Afinaciones por afinador y año (4 al día, 200 días laborables)',
    workerLife: 'Vida adulta de una obrera de verano',
    worldPopulation: 'Población mundial'
  },
  tasks: {
    'rain-roof': {
      title: 'Lluvia sobre un tejado en Londres',
      question: '¿Cuántos litros de lluvia caen en un año sobre el tejado de una casa unifamiliar en Londres?',
      explain:
        'La lluvia se mide como una altura: la media a largo plazo de Londres, unos 630 mm al año, equivale a una capa de agua de 0,63 m si nada se escurriera. Lo que cuenta es la superficie del tejado vista desde arriba (su planta), no la superficie inclinada, más grande, porque la lluvia cae en vertical. Pese a su fama, Londres recibe más o menos la mitad de lluvia que Nueva York: allí llueve a menudo, pero poco. El factor incierto es la superficie del tejado.'
    },
    'pitch-crowd': {
      title: 'Gente en un campo de fútbol',
      question: '¿Cuántas personas de pie caben en un campo de fútbol?',
      explain:
        'Un campo estándar mide 105 m × 68 m, unos 7.100 m². Lo que más importa es lo juntas que estén las personas: 2 por m² es un público cómodo, 4 es hombro con hombro y 5 por m² es el límite superior que usan los planificadores de seguridad para zonas de pie; por encima resulta peligroso. Así que «caber» abarca un factor de 2 a 3.'
    },
    'rice-grains': {
      title: 'Granos en una bolsa de arroz',
      question: '¿Cuántos granos de arroz hay en una bolsa de 1 kg?',
      explain:
        'Los agrónomos pesan el arroz como «peso de mil granos»: la mayoría de las variedades tienen entre 15 y 35 g por cada 1.000 granos, así que un grano pesa unos 25 mg. 1.000 g entre 0,025 g dan 40.000. Un truco para cosas diminutas: pesar o contar un lote pequeño y escalar.'
    },
    'lifetime-drinking': {
      title: 'Lo que se bebe en una vida',
      question: '¿Cuántos litros bebe una persona a lo largo de su vida (todas las bebidas juntas)?',
      explain:
        'La Autoridad Europea de Seguridad Alimentaria fija una ingesta adecuada de agua total de 2,0 L al día para las mujeres y 2,5 L para los hombres; un 70–80 % procede de las bebidas y el resto de la comida. Eso son entre 1,4 y 2,0 L de bebida al día. En 75 años suma unos 44.000 litros: una piscina pequeña.'
    },
    'paper-stack': {
      title: 'Un metro de papel',
      question: '¿Cuántas hojas de papel de impresora normal forman una pila de 1 metro de altura?',
      explain:
        'El papel estándar de 80 g/m² tiene un grosor de una décima de milímetro (los fabricantes indican 100–110 µm). Un paquete de 500 hojas mide unos 5 cm de alto, así que 1 m son 20 paquetes: unas 10.000 hojas. Las cosas finas se miden mejor en conjunto: mide el paquete y divide.'
    },
    'room-air': {
      title: 'El aire de una sala de estar',
      question: '¿Cuántos kilogramos pesa todo el aire de una sala de estar típica?',
      explain:
        'El aire parece no pesar nada, pero un metro cúbico a temperatura ambiente y al nivel del mar pesa unos 1,2 kg. Una sala de 25 m² con 2,5 m de altura contiene unos 62 m³ de aire: unos 75 kg, lo mismo que un adulto. Lo incierto es el tamaño de la sala; la densidad del aire es un hecho físico.'
    },
    'words-per-day': {
      title: 'Palabras dichas en un día',
      question: '¿Cuántas palabras dice un adulto medio en un día?',
      explain:
        'Un estudio que grabó fragmentos breves de audio de casi 400 estudiantes durante varios días halló que mujeres y hombres decían por igual unas 16.000 palabras al día; la idea popular de 20.000 para las mujeres frente a 7.000 para los hombres era falsa. Las personas difieren muchísimo (de unos pocos cientos a más de 40.000 palabras), así que el rango es amplio. En una conversación se dicen unas 110–170 palabras por minuto, de modo que 16.000 palabras son unas dos horas de habla real.'
    },
    'sand-jar': {
      title: 'Granos de arena en un frasco',
      question: '¿Cuántos granos de arena hay en un frasco de un litro lleno de arena seca?',
      explain:
        'Imagina cada grano como una bolita de diámetro d: un litro (un millón de milímetros cúbicos) contiene unos 0,6 × 1.000.000 × 6/π ÷ d³ granos. El diámetro aparece al cubo, así que lo domina todo: la arena son granos de 0,06 a 2 mm, y reducir d a la mitad multiplica el número por ocho. La arena media (0,25–0,5 mm) da entre 10 y 70 millones de granos; la gruesa, entre uno y diez millones.'
    },
    heartbeats: {
      title: 'Latidos en una vida',
      question: '¿Cuántas veces late un corazón humano a lo largo de una vida?',
      explain:
        'Unos 70 latidos por minuto suman unos 100.000 al día y 37 millones al año. En 75 años son casi tres mil millones de latidos. El corazón late más rápido en la infancia y al hacer ejercicio y más despacio al dormir, así que 70 es una media razonable para toda la vida.'
    },
    'scalp-hairs': {
      title: 'Pelos en la cabeza',
      question: '¿Cuántos pelos tiene un adulto en la cabeza (con todo su pelo)?',
      explain:
        'La cifra habitual es de unos 100.000 pelos, normalmente entre 80.000 y 150.000; las personas rubias suelen tener más pelos y más finos, las pelirrojas menos y más gruesos. Un trozo de cuero cabelludo del tamaño de la palma mide unos 100 cm², y la parte con pelo de la cabeza equivale a seis o siete de ellos.'
    },
    'breaths-day': {
      title: 'Respiraciones en un día',
      question: '¿Cuántas veces respira un adulto en un día?',
      explain:
        'Un adulto en reposo respira de 12 a 20 veces por minuto. Un día tiene 1.440 minutos, así que son entre 17.000 y 29.000 respiraciones. Contar tus propias respiraciones durante un minuto es una buena forma de comprobar tú mismo un factor.'
    },
    'blood-pumped': {
      title: 'Sangre bombeada en un día',
      question: '¿Cuántos litros de sangre bombea un corazón en reposo en un día?',
      explain:
        'Cada latido impulsa unos 70 mL; a 70 latidos por minuto son unos 5 litros por minuto, todo el volumen de sangre del cuerpo una vez por minuto. En un día suma unos 7.000 litros, suficiente para llenar un gran depósito de agua. Los médicos lo llaman gasto cardiaco: entre 4 y 8 litros por minuto en reposo.'
    },
    'ants-earth': {
      title: 'Hormigas en la Tierra',
      question: '¿Cuántas hormigas viven en la Tierra?',
      explain:
        'Un estudio de 2022 reunió cientos de recuentos de campo de todos los continentes y estimó unos 20.000 billones (2 × 10¹⁶) de hormigas: unos 2,5 millones por persona, con más masa total que todas las aves y mamíferos salvajes juntos. Repartidas por la tierra sin hielo, son en promedio unas 150 hormigas por metro cuadrado, la mayoría en bosques tropicales y sabanas. Los autores consideran la cifra conservadora.'
    },
    'trees-earth': {
      title: 'Árboles en la Tierra',
      question: '¿Cuántos árboles hay en la Tierra?',
      explain:
        'Un estudio de 2015 combinó más de 400.000 parcelas forestales con mapas de satélite y contó unos 3 billones de árboles (troncos de más de 10 cm de grosor a la altura del pecho): más de 400 por persona y siete veces más que las estimaciones anteriores. Los bosques del mundo cubren unos 4.000 millones de hectáreas, así que eso supone en promedio unos 700–800 árboles por hectárea (un árbol cada 13 m²).'
    },
    'cloud-mass': {
      title: 'El agua de una nube',
      question: '¿Cuántas toneladas pesa el agua de una pequeña nube de buen tiempo, esponjosa?',
      explain:
        'Un cúmulo de buen tiempo típico mide alrededor de 1 km, es decir, más o menos un kilómetro cúbico: mil millones de metros cúbicos. Cada uno contiene solo medio gramo de gotitas diminutas, pero en total son unas 500 toneladas de agua, tanto como un centenar de elefantes. Flota porque las gotitas son diminutas y el aire a su alrededor asciende.'
    },
    'amazon-day': {
      title: 'El Amazonas en un día',
      question: '¿Cuántos metros cúbicos de agua vierte el río Amazonas en el océano Atlántico en un día medio?',
      explain:
        'Caudal = ancho × profundidad × velocidad. Cerca de la ciudad de Óbidos, el Amazonas se estrecha en un solo cauce de apenas unos 2 km de ancho, pero de decenas de metros de profundidad, y fluye hasta a 2 m/s. En su desembocadura lleva en promedio unos 206.000 m³ por segundo: unos 18.000 millones de m³ al día, aproximadamente una quinta parte de toda el agua fluvial que llega a los océanos. El ancho, la profundidad y la velocidad del modelo son valores ilustrativos aproximados; la referencia es la media medida.'
    },
    'bee-colony': {
      title: 'Abejas en una colonia',
      question: '¿Cuántas obreras viven en una colonia fuerte de abejas melíferas a principios del verano?',
      explain:
        'En equilibrio, el número de abejas vivas es igual al ritmo al que llegan nuevas multiplicado por lo que vive cada una (la misma regla estima las colas en una tienda o los coches en una carretera). En plena temporada, una reina pone hasta unos 1.500 huevos al día, y una obrera de verano solo vive unas cinco semanas como adulta. Eso da unas 50.000, y los apicultores cuentan entre 50.000 y 80.000 en colonias fuertes.'
    },
    'body-cells': {
      title: 'Células del cuerpo humano',
      question: '¿De cuántas células humanas está formado el cuerpo de un adulto (unos 70 kg)?',
      explain:
        'Sorpresa: dividir la masa del cuerpo entre la de una célula «típica» da una respuesta equivocada, porque por número la mayoría de nuestras células son diminutos glóbulos rojos. Un análisis de sangre cuenta unos 5 millones por microlitro; con 5 litros de sangre son 25 billones, el 84 % de todas nuestras células según un recuento de 2016. El total ronda los 30 billones de células humanas (más un número parecido de bacterias).'
    },
    'nail-growth': {
      title: 'Crecimiento de una uña',
      question: '¿Cuántos milímetros crece una uña de la mano en un año?',
      explain:
        'Una uña de la mano crece una décima de milímetro al día: 3,5 mm al mes en un estudio con adultos jóvenes sanos, más del doble de rápido que las de los pies. Eso son unos 4 cm al año. Los ritmos pequeños se hacen visibles al multiplicarlos por mucho tiempo.'
    },
    'lift-ride': {
      title: 'Energía para un viaje en ascensor',
      question: '¿Cuántos vatios-hora de energía eléctrica gasta un ascensor para subir a cuatro personas diez pisos?',
      explain:
        'Levantar una masa m una altura h requiere al menos m·g·h: 300 kg × 9,81 m/s² × 30 m ≈ 88 kJ, unos 25 Wh. El motor y los engranajes pierden parte, así que unos 50 Wh: la energía que gasta una bombilla LED de 10 W en cinco horas. Los ascensores reales son más complicados: un contrapeso equilibra la cabina vacía más la mitad de la carga, y las luces y la electrónica en espera a menudo gastan al año más energía que los viajes.'
    },
    'phone-charges': {
      title: 'Cargas de móvil con 1 kWh',
      question: '¿Cuántas cargas completas de smartphone se obtienen con 1 kWh de electricidad?',
      explain:
        'Una batería de móvil de 4.000–5.000 mAh a 3,85 V almacena 15–19 Wh (mAh × V = mWh). Con algo de pérdida en el cargador, una carga toma unos 20 Wh del enchufe, así que un kilovatio-hora, menos de lo que gasta un hogar típico en un día, carga un móvil unas 50 veces.'
    },
    'ev-litre': {
      title: 'Un coche eléctrico con un litro',
      question: '¿Cuántos kilómetros podría recorrer un coche eléctrico con la energía que contiene un litro de gasolina?',
      explain:
        'Un litro de gasolina contiene unos 32 MJ de energía química, es decir, 8,9 kWh. Un coche eléctrico pequeño o mediano gasta entre 13 y 25 kWh cada 100 km en pruebas reales, incluidas las pérdidas de carga. La energía de un litro lo llevaría unos 50 km, mientras que un coche de gasolina saca solo 15–20 km de ella, porque un motor convierte la mayor parte de la energía en calor.'
    },
    'tea-energy': {
      title: 'Energía para una taza de té',
      question: '¿Cuántos vatios-hora hacen falta para calentar el agua de una taza de té desde la temperatura del grifo hasta que hierva?',
      explain:
        'Calentar 1 kg de agua 1 °C cuesta 4,19 kJ. Una taza de 0,25 kg calentada unos 80 °C necesita 84 kJ = 23 Wh: un hervidor de 2 kW tarda unos 40 segundos. En la práctica solemos hervir el doble de agua de la que servimos, y el propio hervidor se calienta: las formas más comunes de duplicar la cifra.'
    },
    'airliner-fuel': {
      title: 'Combustible de Londres a Nueva York',
      question: '¿Cuántos litros de queroseno quema un avión de fuselaje ancho lleno (unos 300 pasajeros) en un vuelo de Londres a Nueva York?',
      explain:
        'Los aviones modernos de largo recorrido gastan unos 3 litros por pasajero cada 100 km (una aerolínea indica 2,9 para su modelo más nuevo; los aviones más antiguos gastan más). Londres–Nueva York son unos 5.500 km por el círculo máximo. 300 × 0,03 × 5.540 ≈ 50.000 litros: bastante más que un camión cisterna, unas 40 toneladas de combustible.'
    },
    'aa-petrol': {
      title: 'Pilas contra gasolina',
      question: '¿Cuántas pilas alcalinas AA almacenan tanta energía como un litro de gasolina?',
      explain:
        'Una pila alcalina AA tiene unos 2,5–2,8 Ah y entrega de media unos 1,2 V mientras se descarga, así que unos 3 Wh (menos con cargas altas). Un litro de gasolina contiene unos 8.900 Wh: tanto como unas 3.000 pilas, que pesarían unos 70 kg. Por eso es tan difícil sustituir los combustibles.'
    },
    'solar-panel': {
      title: 'Un metro cuadrado de panel solar',
      question: '¿Cuántos kilovatios-hora de electricidad produce un metro cuadrado de panel solar en un año, en promedio para las nuevas plantas solares del mundo?',
      explain:
        'Los paneles se valoran a pleno sol, 1.000 W por metro cuadrado; un panel moderno convierte en electricidad alrededor de una quinta parte, es decir, unos 210 W nominales por m². Pero hay noche, nubes y sol bajo en invierno: en el mundo, las nuevas plantas solares entregan en promedio solo un 16 % de su potencia nominal. En las 8.760 horas de un año eso da unos 290 kWh por metro cuadrado, más o menos lo que gasta un frigorífico en un año. En los desiertos soleados es más; en las regiones nubladas, menos.'
    },
    'body-power': {
      title: 'El calor que da un cuerpo',
      question: '¿Cuántos vatios de calor desprende de media un cuerpo humano?',
      explain:
        'Casi toda la energía de los alimentos que usamos acaba convertida en calor. 2.000 kcal al día son 8,4 MJ; repartidos en los 86.400 segundos de un día, son unos 100 W. Una persona desprende más o menos el calor de una bombilla incandescente antigua; por eso se calienta una sala llena.'
    },
    'car-lifetime-fuel': {
      title: 'Combustible de toda la vida de un coche',
      question: '¿Cuántos litros de gasolina quema un coche de gasolina en toda su vida?',
      explain:
        'Un coche suele recorrer entre 150.000 y 300.000 km antes de ir al desguace, y uno de gasolina gasta unos 5–10 litros cada 100 km. Eso da unos 14.000 litros: unos 280 depósitos llenos de 50 litros.'
    },
    'piano-tuners': {
      title: 'Afinadores de piano en una ciudad',
      question: '¿Cuántos afinadores de piano a tiempo completo puede mantener ocupados una ciudad de un millón de habitantes?',
      explain:
        'La pregunta clásica de Enrico Fermi. Con 2,5 personas por hogar, un millón de personas viven en 400.000 hogares; si uno de cada veinte tiene piano, son 20.000 pianos. Afinados una vez al año, son 20.000 afinaciones. Un afinador hace unas cuatro al día, unas 800 al año, así que la ciudad necesita unos 25. No hay una cifra oficial con la que comparar: la idea es que cada factor se puede estimar y que los errores en sentidos opuestos se compensan en parte. El tamaño de los hogares varía mucho en el mundo, de unas 2 a más de 5 personas.'
    },
    'births-day': {
      title: 'Nacimientos en un día',
      question: '¿Cuántos bebés nacen cada día en el mundo?',
      explain:
        'La ONU cuenta unos 132 millones de nacimientos al año, unos 16 por cada 1.000 personas. Dividido entre 365 días son unos 360.000 al día, cuatro por segundo. Cada día mueren unas 170.000 personas; por eso la población mundial sigue creciendo, aunque más despacio que antes.'
    },
    'birthdays-today': {
      title: 'Cumpleaños de hoy',
      question: '¿Cuántas personas en el mundo cumplen años hoy?',
      explain:
        'Los cumpleaños se reparten casi por igual a lo largo del año (algunos meses tienen un pequeño porcentaje más de nacimientos), así que en un día cualquiera cumple años más o menos una de cada 365 personas: unos 22 millones, más que la población de la mayoría de los países.'
    },
    'lifetime-sleep': {
      title: 'Años durmiendo',
      question: '¿Cuántos años de una vida de 75 años pasa una persona durmiendo?',
      explain:
        'La parte del día que pasamos durmiendo es la parte de la vida que pasamos durmiendo. Los adultos duermen unas 7–8 horas, los bebés y los niños mucho más, así que alrededor de un tercio de la vida: unos 25 años.'
    },
    'people-airborne': {
      title: 'Gente en el aire',
      question: 'En promedio, ¿cuántas personas van a bordo de un avión de pasajeros en vuelo en un momento dado?',
      explain:
        'Las aerolíneas transportaron unos 4.900 millones de pasajeros en 2024. Un viaje medio tiene unos 1.900 km; a unos 800 km/h son unas 2,4 horas. Las horas-pasajero de un año divididas entre las horas de un año dan cuántos están en el aire a la vez: unos 1,3 millones, la población de una gran ciudad, volando (más de día, menos de noche).'
    },
    'lifetime-walking': {
      title: 'Lo que se camina en una vida',
      question: '¿Cuántos kilómetros camina una persona a lo largo de su vida?',
      explain:
        'Los datos de smartphones de 700.000 personas en 111 países mostraron una media de unos 5.000 pasos al día (los móviles se pierden algunos pasos, así que la cifra real es algo mayor). A 0,7 m por paso son 3,5 km al día y casi 100.000 km en 75 años: unas dos vueltas y media a la Tierra.'
    },
    'smartphones-year': {
      title: 'Smartphones vendidos en un año',
      question: '¿Cuántos smartphones nuevos se venden en el mundo en un año?',
      explain:
        'Las consultoras contaron unos 1.250 millones de smartphones enviados en 2025, una cifra que lleva una década entre 1.200 y 1.500 millones. Un modelo de reposición lo explica: si más o menos la mitad de la gente usa un smartphone y lo cambia cada tres o cuatro años, hacen falta entre 1.200 y 1.300 millones nuevos cada año.'
    },
    'teachers-city': {
      title: 'Docentes en una ciudad',
      question: '¿Cuántos docentes necesita una ciudad de un millón de habitantes para sus alumnos de 6 a 17 años?',
      explain:
        'Los menores de 15 años son alrededor del 17 % de la población en los países de la OCDE y alrededor del 25 % en el mundo, así que los doce años escolares de los 6 a los 17 abarcan más o menos el 12–20 % de los habitantes. En los países de la OCDE hay de media unos 14 alumnos por docente en primaria y 13 en la secundaria inferior, desde unos 7 en algunos países hasta más de 20 en otros. Un millón de personas necesita, pues, unos 10.000 docentes. Los factores inciertos son la proporción de niños y el número de alumnos por docente, que varían mucho entre países.'
    },
    'world-cars': {
      title: 'Vehículos de motor en el mundo',
      question: '¿Cuántos vehículos de motor (coches, furgonetas, camiones, autobuses) están en uso en el mundo?',
      explain:
        'La asociación de fabricantes de automóviles contó unos 1.100 millones de vehículos en 2011 y unos 1.500 millones en 2023: uno por cada cinco o seis personas. La media oculta enormes diferencias: en muchos países ricos hay más de un vehículo por cada dos personas; en muchos países pobres, menos de uno por cada veinte.'
    },
    'sunlight-time': {
      title: 'El viaje de la luz del Sol',
      question: '¿Cuántos segundos tarda la luz del Sol en llegar a la Tierra?',
      explain:
        'La Tierra está a unos 150 millones de km del Sol (1 unidad astronómica) y la luz recorre casi 300.000 km por segundo, así que la luz del Sol tiene unos 8 minutos y 20 segundos cuando llega. A lo largo del año la distancia cambia un 3 %, de modo que el tiempo varía entre unos 490 y 508 segundos.'
    },
    'earths-in-sun': {
      title: 'Tierras dentro del Sol',
      question: 'En volumen, ¿cuántas Tierras cabrían dentro del Sol?',
      explain:
        'El radio del Sol es unas 109 veces el de la Tierra. El volumen crece con el cubo del radio, así que el volumen del Sol es 109 × 109 × 109 ≈ 1,3 millones de Tierras. Un pequeño error en la razón de los radios cuenta tres veces: una razón de 100 daría 1 millón, una de 150 daría 3,4 millones.'
    },
    'drive-to-moon': {
      title: 'En coche hasta la Luna',
      question: '¿Cuántos días se tardaría en llegar en coche a la Luna a 100 km/h constantes, sin parar?',
      explain:
        'La Luna está de media a 384.400 km, unas diez vueltas a la Tierra. A 100 km/h son 3.844 horas, o unos 160 días conduciendo sin parar: más de cinco meses.'
    },
    'drop-molecules': {
      title: 'Moléculas en una gota',
      question: '¿Cuántas moléculas de agua hay en una sola gota de agua?',
      explain:
        'Una gota tiene unos 0,05 mL (20 gotas hacen un mililitro) y pesa 0,05 g. 18 g de agua son un mol, 6 × 10²³ moléculas. Así que una gota contiene unas 1,7 × 10²¹ moléculas: más moléculas que gotas de agua hay en un lago grande.'
    },
    'equator-speed': {
      title: 'Velocidad en el ecuador',
      question: '¿A cuántos kilómetros por hora se mueve un punto del ecuador por el giro de la Tierra?',
      explain:
        'El ecuador mide unos 40.000 km: el metro se definió en su día para que un cuarto de meridiano midiera 10.000 km. Una vuelta dura más o menos un día, así que un punto del ecuador viaja a unos 1.670 km/h, más rápido que el sonido. No lo notamos porque el movimiento es uniforme.'
    },
    'iss-day': {
      title: 'La estación espacial en un día',
      question: '¿Cuántos kilómetros recorre la Estación Espacial Internacional en un día?',
      explain:
        'La estación gira a unos 420 km sobre el suelo, así que su órbita es solo un poco más larga que el ecuador: unos 42.700 km. Da una vuelta en unos 92 minutos, 15,5 al día, volando a unos 7,7 km por segundo. En un día recorre unos 660.000 km: la distancia hasta la Luna y casi toda la vuelta.'
    },
    'atmosphere-mass': {
      title: 'La masa de la atmósfera',
      question: '¿Cuántos kilogramos pesa toda la atmósfera de la Tierra?',
      explain:
        'La presión del aire es el peso de todo el aire que hay sobre cada metro cuadrado: unas 10 toneladas por m². Multiplicando por la superficie de la Tierra (510 millones de km²) y dividiendo por g se obtienen unos 5,3 × 10¹⁸ kg. El valor medido es 5,1 × 10¹⁸ kg, algo menos, porque las montañas y las tierras altas sobresalen en el aire.'
    },
    'sun-mass-loss': {
      title: 'El Sol convierte masa en luz',
      question: '¿Cuántos kilogramos de masa convierte el Sol en luz cada segundo?',
      explain:
        'La E = mc² de Einstein funciona en ambos sentidos: radiar energía significa perder masa. El Sol radia 3,8 × 10²⁶ vatios; dividiendo por c² (9 × 10¹⁶ m²/s²) salen unos 4.300 millones de kg por segundo. Aun así, en toda la vida del Sol hasta ahora eso suma menos de una décima parte del uno por ciento de su masa.'
    },
    'ocean-mass': {
      title: 'El agua de los océanos',
      question: '¿Cuántos kilogramos de agua hay en todos los océanos de la Tierra?',
      explain:
        'Los océanos cubren el 71 % de la Tierra, unos 361 millones de km², con una profundidad media de unos 3,7 km. Son 1.330 millones de km³ de agua; a algo más de una tonelada por metro cúbico pesa unos 1,4 × 10²¹ kg, y aun así es solo un 0,02 % de la masa de la Tierra.'
    }
  }
};
