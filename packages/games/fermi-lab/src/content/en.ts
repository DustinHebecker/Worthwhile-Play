import type { ContentText } from './types';

/** English (source) wording; the reference for every translation. */
export const content: ContentText = {
  counts: {
    day: { one: 'day', other: 'days' },
    year: { one: 'year', other: 'years' },
    ant: { one: 'ant', other: 'ants' },
    battery: { one: 'battery', other: 'batteries' },
    beat: { one: 'beat', other: 'beats' },
    bee: { one: 'bee', other: 'bees' },
    birth: { one: 'birth', other: 'births' },
    breath: { one: 'breath', other: 'breaths' },
    cell: { one: 'cell', other: 'cells' },
    charge: { one: 'charge', other: 'charges' },
    earth: { one: 'Earth', other: 'Earths' },
    egg: { one: 'egg', other: 'eggs' },
    grain: { one: 'grain', other: 'grains' },
    hair: { one: 'hair', other: 'hairs' },
    household: { one: 'household', other: 'households' },
    molecule: { one: 'molecule', other: 'molecules' },
    orbit: { one: 'orbit', other: 'orbits' },
    passenger: { one: 'passenger', other: 'passengers' },
    person: { one: 'person', other: 'people' },
    phone: { one: 'phone', other: 'phones' },
    piano: { one: 'piano', other: 'pianos' },
    pupil: { one: 'pupil', other: 'pupils' },
    sheet: { one: 'sheet', other: 'sheets' },
    step: { one: 'step', other: 'steps' },
    teacher: { one: 'teacher', other: 'teachers' },
    tree: { one: 'tree', other: 'trees' },
    trip: { one: 'trip', other: 'trips' },
    tuner: { one: 'tuner', other: 'tuners' },
    tuning: { one: 'tuning', other: 'tunings' },
    vehicle: { one: 'vehicle', other: 'vehicles' },
    word: { one: 'word', other: 'words' }
  },
  ratios: {
    high: { one: '{n} time too high.', other: '{n} times too high.' },
    low: { one: '{n} time too low.', other: '{n} times too low.' },
    rowHigh: { one: '{n} time too high', other: '{n} times too high' },
    rowLow: { one: '{n} time too low', other: '{n} times too low' },
    biasHigh: { one: 'On average your answers were {n} time too high.', other: 'On average your answers were {n} times too high.' },
    biasLow: { one: 'On average your answers were {n} time too low.', other: 'On average your answers were {n} times too low.' }
  },
  factors: {
    aaEnergy: 'Energy delivered by one AA battery',
    airDensity: 'Density of air',
    airTime: 'Average time in the air per trip',
    antDensity: 'Average ants per square metre of land',
    avogadro: 'Avogadro constant',
    batteryEnergy: 'Battery energy of one phone',
    birthRate: 'Births per person per year (crude birth rate)',
    bloodVolume: 'Blood volume',
    breathRate: 'Breaths per minute at rest',
    capacityFactor: 'Average output as a share of the rated power (capacity factor)',
    carSpeed: 'Speed',
    ceilingHeight: 'Ceiling height',
    chargeEfficiency: 'Charging efficiency',
    cloudVolume: 'Volume of the cloud',
    cloudWater: 'Liquid water per cubic metre of cloud',
    crowdDensity: 'People per square metre (dense standing crowd)',
    cupWater: 'Water for one cup',
    daysPerYear: 'Days in a year',
    daysPerYearPlain: 'Days in a year',
    drinksPerDay: 'Drinks per day',
    driveEfficiency: 'Efficiency of motor and drive',
    dropMass: 'Mass of one drop',
    earthRadius: 'Radius of the Earth',
    earthSurface: 'Surface area of the Earth',
    eggsPerDay: 'Eggs the queen lays per day',
    energyAvailable: 'Energy available',
    equatorLength: 'Length of the equator',
    evConsumption: 'Consumption of an electric car',
    flightDistance: 'Flight distance',
    floorArea: 'Floor area',
    flowSpeed: 'Average flow speed',
    foodEnergy: 'Food energy per day',
    forestArea: 'Forest area of the world',
    fuelConsumption: 'Fuel consumption',
    fuelPerPassengerKm: 'Fuel per passenger per kilometre',
    grainDiameter: 'Diameter of one grain',
    grainMass: 'Mass of one grain',
    gravity: 'Gravitational acceleration',
    hairDensity: 'Hairs per square centimetre',
    heartRate: 'Heart rate at rest',
    hoursPerDay: 'Hours in a day',
    hoursPerDayRate: 'Hours in a day',
    hoursPerYear: 'Hours in a year',
    householdSize: 'People per household',
    iceFreeLand: 'Ice-free land area of the Earth',
    inhabitants: 'Inhabitants',
    jarVolume: 'Volume of the jar',
    joulesPerKcal: 'Joules in a kilocalorie',
    joulesPerWh: 'Joules in a watt-hour',
    lifetime: 'Lifetime',
    lifetimeDistance: 'Distance driven over its life',
    lifetimeGiven: 'Lifetime',
    liftHeight: 'Height of ten floors',
    liftedMass: 'Mass lifted (four people)',
    lightSpeed: 'Speed of light',
    lightSpeedKm: 'Speed of light',
    litresPerM3: 'Litres in a cubic metre',
    minutesPerDay: 'Minutes in a day',
    minutesPerHour: 'Minutes in an hour',
    minutesPerYear: 'Minutes in a year',
    molarMass: 'Mass of one mole of water',
    moonDistance: 'Distance from the Earth to the Moon',
    nailPerDay: 'Growth per day',
    oceanArea: 'Area of the oceans',
    oceanDepth: 'Average depth of the oceans',
    orbitLength: 'Length of one orbit',
    orbitsPerDay: 'Orbits per day',
    packing: 'Share of the jar filled by grains (the rest is air)',
    panelArea: 'Panel area',
    panelEfficiency: 'Panel efficiency',
    passengers: 'Passengers',
    peoplePerVehicle: 'People per vehicle (world average)',
    petrolEnergy: 'Energy in one litre of petrol',
    petrolEnergyWh: 'Energy in one litre of petrol',
    pianoShare: 'Pianos per household',
    pitchLength: 'Length of the pitch',
    pitchWidth: 'Width of the pitch',
    pupilsPerTeacher: 'Pupils per teacher',
    rainfall: 'Yearly rainfall (height of water)',
    ratedSunlight: 'Sunlight on which panel ratings are based',
    redCellCount: 'Red blood cells per microlitre of blood',
    redCellShare: 'Red blood cells as a share of all cells',
    replacementYears: 'Years before a phone is replaced',
    riceMass: 'Rice in the bag',
    riverDepth: 'Average depth of the river',
    riverWidth: 'Width of the river',
    roofArea: 'Roof area seen from above',
    rotationTime: 'Time for one rotation',
    scalpArea: 'Area of the scalp with hair',
    schoolAgeShare: 'Share of inhabitants aged 6 to 17',
    seaLevelPressure: 'Air pressure at sea level',
    seawaterDensity: 'Density of seawater',
    secondsPerDay: 'Seconds in a day',
    sheetThickness: 'Thickness of one sheet',
    sleepPerDay: 'Sleep per day',
    smartphoneShare: 'Share of people who use a smartphone',
    speakingRate: 'Speaking rate',
    specificHeat: 'Specific heat of water',
    sphereFactor: 'Sphere factor (6/π: a ball fills about half of its cube)',
    stackHeight: 'Height of the stack',
    stepLength: 'Length of one step',
    stepsPerDay: 'Steps per day',
    strokeVolume: 'Blood per heartbeat (stroke volume)',
    sunDistance: 'Distance from the Sun to the Earth',
    sunPower: 'Power radiated by the Sun',
    sunRadius: 'Radius of the Sun',
    talkTime: 'Time spent talking per day',
    temperatureRise: 'Temperature rise',
    treeDensity: 'Trees per hectare of forest',
    tripsPerYear: 'Passenger trips per year',
    tuningsPerPiano: 'Tunings per piano per year',
    tuningsPerTuner: 'Tunings one tuner does per year (4 a day, 200 working days)',
    workerLife: 'Adult life of a summer worker bee',
    worldPopulation: 'World population'
  },
  tasks: {
    'rain-roof': {
      title: 'Rain on a roof in London',
      question: 'How many litres of rain fall on the roof of a detached house in London in one year?',
      explain:
        'Rainfall is measured as a height: London’s long-term average of about 630 mm a year means a layer 0.63 m deep if nothing ran off. What counts is the roof’s area seen from above (its footprint), not the larger sloping surface, because rain falls vertically. Despite its rainy reputation, London gets only about half as much rain as New York: it rains often there, but lightly. The roof area is the uncertain factor.'
    },
    'pitch-crowd': {
      title: 'People on a football pitch',
      question: 'How many standing people fit on a football (soccer) pitch?',
      explain:
        'A standard pitch is 105 m × 68 m, about 7,100 m². How tightly people stand matters most: 2 per m² is a comfortable event crowd, 4 is shoulder to shoulder, and 5 per m² is the upper limit crowd-safety planners use for standing areas; beyond that it becomes dangerous. So “fit” spans a factor of 2 to 3.'
    },
    'rice-grains': {
      title: 'Grains in a bag of rice',
      question: 'How many grains of rice are in a 1 kg bag?',
      explain:
        'Agronomists weigh rice as “thousand-grain weight”: most varieties have 15 to 35 g per 1,000 grains, so one grain is roughly 25 mg. Dividing 1,000 g by 0.025 g gives 40,000. A trick for tiny things: weigh or count a small batch and scale up.'
    },
    'lifetime-drinking': {
      title: 'Drinks in a lifetime',
      question: 'How many litres does a person drink in a lifetime (all drinks together)?',
      explain:
        'The European Food Safety Authority’s adequate intake of total water is 2.0 L a day for women and 2.5 L for men; about 70–80 % of it comes from drinks, the rest from food. That is roughly 1.4–2.0 L of drinks a day. Over 75 years it adds up to around 44,000 litres: a small swimming pool.'
    },
    'paper-stack': {
      title: 'A metre of paper',
      question: 'How many sheets of ordinary printer paper make a stack 1 metre high?',
      explain:
        'Standard 80 g/m² paper is about a tenth of a millimetre thick (manufacturers list 100–110 µm). A pack of 500 sheets is about 5 cm high, so 1 m is 20 packs: roughly 10,000 sheets. Thin things are easier to measure in bulk: measure the pack, then divide.'
    },
    'room-air': {
      title: 'The air in a living room',
      question: 'How much does all the air in a typical living room weigh, in kilograms?',
      explain:
        'Air feels weightless, but a cubic metre of it at room temperature and sea level weighs about 1.2 kg. A 25 m² room with a 2.5 m ceiling holds about 62 m³ of air: around 75 kg, as much as an adult. The size of the room is the uncertain part; the density of air is a physical fact.'
    },
    'words-per-day': {
      title: 'Words spoken in a day',
      question: 'How many words does an average adult speak in one day?',
      explain:
        'A study that recorded short audio snippets of almost 400 students over several days found that women and men both spoke about 16,000 words a day; the popular claim of 20,000 for women against 7,000 for men was wrong. People differ enormously (from a few hundred to over 40,000 words), so the range is wide. Conversation runs at roughly 110–170 words a minute, so 16,000 words are about two hours of actual talking.'
    },
    'sand-jar': {
      title: 'Grains of sand in a jar',
      question: 'How many grains of sand are in a one-litre jar of dry sand?',
      explain:
        'Treat each grain as a small ball of diameter d: one litre (a million cubic millimetres) holds about 0.6 × 1,000,000 × 6/π ÷ d³ grains. The diameter appears cubed, so it dominates everything: sand means grains from 0.06 to 2 mm, and halving d multiplies the count by eight. Medium sand (0.25–0.5 mm) gives 10 to 70 million grains, coarse sand about one to ten million.'
    },
    heartbeats: {
      title: 'Heartbeats in a lifetime',
      question: 'How many times does a human heart beat in a lifetime?',
      explain:
        'About 70 beats a minute add up to about 100,000 a day and 37 million a year. Over 75 years that is close to three billion beats. The heart beats faster in childhood and during exercise and slower in sleep, so 70 is a reasonable lifetime average.'
    },
    'scalp-hairs': {
      title: 'Hairs on a head',
      question: 'How many hairs are on an adult’s head (with a full head of hair)?',
      explain:
        'The usual figure is about 100,000 hairs, with a typical range of 80,000 to 150,000; people with fair hair tend to have more, thinner hairs, people with red hair fewer, thicker ones. A palm-sized patch of scalp is about 100 cm², and the hairy part of the head is six or seven of those.'
    },
    'breaths-day': {
      title: 'Breaths in a day',
      question: 'How many breaths does an adult take in one day?',
      explain:
        'A resting adult breathes 12 to 20 times a minute. A day has 1,440 minutes, so that is about 17,000 to 29,000 breaths. Counting your own breaths for one minute is a good way to check one factor yourself.'
    },
    'blood-pumped': {
      title: 'Blood pumped in a day',
      question: 'How many litres of blood does a resting heart pump in one day?',
      explain:
        'Each beat pushes out about 70 mL; at 70 beats a minute that is about 5 litres a minute, the body’s whole blood volume once a minute. Over a day it adds up to around 7,000 litres, enough to fill a large water tank. Doctors call this the cardiac output: 4 to 8 litres a minute at rest.'
    },
    'ants-earth': {
      title: 'Ants on Earth',
      question: 'How many ants live on Earth?',
      explain:
        'A 2022 study pooled hundreds of field counts from all continents and estimated about 20 quadrillion (2 × 10¹⁶) ants: roughly 2.5 million for every person, with more total mass than all wild birds and mammals together. Spread over the ice-free land, that is about 150 ants per square metre on average, most of them in tropical forests and savannahs. The authors call the figure conservative.'
    },
    'trees-earth': {
      title: 'Trees on Earth',
      question: 'How many trees are there on Earth?',
      explain:
        'A 2015 study combined more than 400,000 forest plots with satellite maps and counted about 3 trillion trees (trunks thicker than 10 cm at chest height): over 400 per person and seven times more than earlier estimates. The world’s forests cover about 4 billion hectares, so this means roughly 700–800 trees per hectare (one tree per 13 m²) on average.'
    },
    'cloud-mass': {
      title: 'Water in a cloud',
      question: 'How much does the water in a small, fluffy fair-weather cloud weigh, in tonnes?',
      explain:
        'A typical fair-weather cumulus cloud is about 1 km across, so about a cubic kilometre: a billion cubic metres. Each holds only about half a gram of tiny droplets, yet together that is about 500 tonnes of water, as heavy as about a hundred elephants. It floats because the droplets are tiny and the air around them rises.'
    },
    'amazon-day': {
      title: 'The Amazon in a day',
      question: 'How many cubic metres of water does the Amazon River pour into the Atlantic Ocean on an average day?',
      explain:
        'Flow = width × depth × speed. Near the town of Óbidos the Amazon squeezes into a single channel only about 2 km wide but tens of metres deep, flowing at up to 2 m/s. At its mouth it carries on average about 206,000 m³ every second: about 18 billion m³ a day, roughly a fifth of all the river water that reaches the world’s oceans. The width, depth and speed in the model are rough, illustrative values; the central answer is the measured mean.'
    },
    'bee-colony': {
      title: 'Bees in a colony',
      question: 'How many worker bees live in a strong honeybee colony in early summer?',
      explain:
        'In a steady state, the number of bees alive equals the rate at which new ones arrive times how long each one lives (the same rule estimates queues in shops or cars on a road). At the peak a queen lays up to about 1,500 eggs a day, and a summer worker lives only about five weeks as an adult. That gives around 50,000, and beekeepers report 50,000 to 80,000 in strong colonies.'
    },
    'body-cells': {
      title: 'Cells in a human body',
      question: 'How many human cells make up the body of an adult (about 70 kg)?',
      explain:
        'Surprise: dividing the body’s mass by the mass of a “typical” cell gives the wrong answer, because by number most of our cells are tiny red blood cells. A blood test counts about 5 million of them per microlitre; with 5 litres of blood that is 25 trillion, which is 84 % of all our cells according to a 2016 census. The total is about 30 trillion human cells (plus a similar number of bacteria).'
    },
    'nail-growth': {
      title: 'Fingernail growth',
      question: 'How many millimetres does a fingernail grow in one year?',
      explain:
        'A fingernail grows about a tenth of a millimetre a day: 3.5 mm a month in a study of healthy young adults, more than twice as fast as toenails. That is about 4 cm a year. Small rates become visible when they are multiplied by a long time.'
    },
    'lift-ride': {
      title: 'Energy for a lift ride',
      question: 'How much electrical energy does a lift (elevator) use to carry four people up ten floors, in watt-hours?',
      explain:
        'Lifting a mass m by a height h needs at least m·g·h: 300 kg × 9.81 m/s² × 30 m ≈ 88 kJ, about 25 Wh. The motor and gears lose part of it, so roughly 50 Wh: the energy a 10 W LED lamp uses in five hours. Real lifts are more complicated: a counterweight balances the empty car plus about half the load, and lights and electronics on standby often use more energy over a year than the rides themselves.'
    },
    'phone-charges': {
      title: 'Phone charges from 1 kWh',
      question: 'How many full smartphone charges can you get from 1 kWh of electricity?',
      explain:
        'A phone battery of 4,000–5,000 mAh at 3.85 V stores 15–19 Wh (mAh × V = mWh). With some loss in the charger, one charge takes about 20 Wh from the socket, so one kilowatt-hour, less than a typical household uses in a day, charges a phone about 50 times.'
    },
    'ev-litre': {
      title: 'An electric car on one litre',
      question: 'How far could an electric car drive on the energy contained in one litre of petrol (gasoline), in kilometres?',
      explain:
        'One litre of petrol holds about 32 MJ of chemical energy, which is 8.9 kWh. A small to medium electric car uses 13–25 kWh per 100 km in real-world tests, including charging losses. So the energy of one litre would move it about 50 km, while a petrol car gets only 15–20 km from it, because an engine turns most of the fuel’s energy into heat.'
    },
    'tea-energy': {
      title: 'Energy for a cup of tea',
      question: 'How much energy does it take to heat the water for one cup of tea from tap temperature to boiling, in watt-hours?',
      explain:
        'Heating 1 kg of water by 1 °C takes 4.19 kJ. A cup of 0.25 kg heated by about 80 °C needs 84 kJ = 23 Wh: a 2 kW kettle needs about 40 seconds for it. In practice people often boil twice as much water as they pour, and the kettle itself warms up: the commonest ways to double the figure.'
    },
    'airliner-fuel': {
      title: 'Fuel from London to New York',
      question: 'How many litres of jet fuel does a full wide-body airliner (about 300 passengers) burn flying from London to New York?',
      explain:
        'Modern long-haul jets burn about 3 litres per passenger per 100 km (one airline quotes 2.9 for its newest type; older aircraft use more). London–New York is about 5,500 km along the great circle. 300 × 0.03 × 5,540 ≈ 50,000 litres: well over one road tanker, roughly 40 tonnes of fuel.'
    },
    'aa-petrol': {
      title: 'Batteries against petrol',
      question: 'How many AA alkaline batteries hold as much energy as one litre of petrol (gasoline)?',
      explain:
        'An AA alkaline cell is rated about 2.5–2.8 Ah and delivers on average about 1.2 V as it runs down, so about 3 Wh (less under heavy load). A litre of petrol holds about 8,900 Wh: as much as some 3,000 batteries, which would weigh about 70 kg. This is why fuels are so hard to replace.'
    },
    'solar-panel': {
      title: 'A square metre of solar panel',
      question: 'How much electricity does one square metre of solar panel produce in a year, on average for new solar farms around the world, in kilowatt-hours?',
      explain:
        'Panels are rated in full sunlight of 1,000 W per square metre; a modern panel turns about a fifth of it into electricity, so it is rated about 210 W per m². But there is night, cloud and low winter sun: worldwide, new solar farms deliver on average only about 16 % of their rated power. Over the 8,760 hours of a year that gives about 290 kWh per square metre, roughly what a fridge uses in a year. In sunny deserts it is more, in cloudy regions less.'
    },
    'body-power': {
      title: 'A body’s heat output',
      question: 'What is the average heat output of a human body, in watts?',
      explain:
        'Almost all the food energy we use ends up as heat. 2,000 kcal a day is 8.4 MJ; spread over the 86,400 seconds of a day that is about 100 W. A person gives off about as much heat as an old-fashioned light bulb, which is why a full room warms up.'
    },
    'car-lifetime-fuel': {
      title: 'A car’s lifetime fuel',
      question: 'How many litres of fuel does a petrol (gasoline) car burn over its whole life?',
      explain:
        'A car is typically driven 150,000–300,000 km before it is scrapped, and a petrol car uses about 5–10 litres per 100 km. That gives about 14,000 litres: some 280 full tanks of 50 litres.'
    },
    'piano-tuners': {
      title: 'Piano tuners in a city',
      question: 'How many full-time piano tuners can a city of one million people keep busy?',
      explain:
        'Enrico Fermi’s classic question. With 2.5 people per household, a million people live in 400,000 households; if one in twenty has a piano, that is 20,000 pianos. Tuned once a year, that is 20,000 tunings. A tuner manages about four a day, some 800 a year, so the city needs about 25. There is no official count to check against: the point is that every factor can be guessed, and errors in different directions partly cancel. Household size varies a lot around the world, from about 2 to over 5 people.'
    },
    'births-day': {
      title: 'Babies born each day',
      question: 'How many babies are born worldwide every day?',
      explain:
        'The UN counts about 132 million births a year, about 16 per 1,000 people. Divided by 365 days that is about 360,000 a day, or four every second. About 170,000 people die each day, which is why the world population is still growing, though more slowly than before.'
    },
    'birthdays-today': {
      title: 'Birthdays today',
      question: 'How many people in the world have their birthday today?',
      explain:
        'Birthdays are spread almost evenly over the year (some months have a few per cent more births), so about one person in 365 has a birthday on any given day: about 22 million, more than the population of most countries.'
    },
    'lifetime-sleep': {
      title: 'Years asleep',
      question: 'How many years of a 75-year life does a person spend asleep?',
      explain:
        'The share of the day spent asleep is the share of life spent asleep. Adults sleep about 7–8 hours, babies and children much more, so about a third of life: some 25 years.'
    },
    'people-airborne': {
      title: 'People in the air',
      question: 'On average, how many people are on board a passenger plane in the air at any moment?',
      explain:
        'Airlines carried about 4.9 billion passengers in 2024. An average trip is about 1,900 km, at roughly 800 km/h some 2.4 hours. The passenger-hours of a year divided by the hours in a year give the number in the air at once: about 1.3 million, the population of a large city, flying (more by day, fewer at night).'
    },
    'lifetime-walking': {
      title: 'Walking in a lifetime',
      question: 'How many kilometres does a person walk in a lifetime?',
      explain:
        'Smartphone data from 700,000 people in 111 countries showed an average of about 5,000 steps a day (phones miss some steps, so the true figure is somewhat higher). At 0.7 m a step that is 3.5 km a day and nearly 100,000 km in 75 years: about two and a half times around the Earth.'
    },
    'smartphones-year': {
      title: 'Smartphones sold in a year',
      question: 'How many new smartphones are sold worldwide in one year?',
      explain:
        'Market researchers counted about 1.25 billion smartphones shipped in 2025, a number that has stayed between 1.2 and 1.5 billion for a decade. A replacement model explains it: if about half of all people use a smartphone and replace it every three to four years, about 1.2–1.3 billion new ones are needed each year.'
    },
    'teachers-city': {
      title: 'Teachers in a city',
      question: 'How many school teachers does a city of one million people need for its pupils aged 6 to 17?',
      explain:
        'Children under 15 make up about 17 % of the population in OECD countries and about 25 % worldwide, so the twelve school years from 6 to 17 cover roughly 12–20 % of the inhabitants. Across OECD countries there are on average about 14 pupils per teacher in primary school and 13 in lower secondary school, from about 7 in some countries to over 20 in others. A million people therefore need roughly 10,000 teachers. The share of children and the number of pupils per teacher are the uncertain factors, and they differ a lot between countries.'
    },
    'world-cars': {
      title: 'Motor vehicles in the world',
      question: 'How many motor vehicles (cars, vans, lorries/trucks, buses) are in use worldwide?',
      explain:
        'The car makers’ association counted about 1.1 billion vehicles in 2011 and about 1.5 billion by 2023: one for every five or six people. The average hides huge differences: in many rich countries there is more than one vehicle for every two people, in many poor countries fewer than one for every twenty.'
    },
    'sunlight-time': {
      title: 'Sunlight’s journey',
      question: 'How many seconds does sunlight take to reach the Earth?',
      explain:
        'The Earth is about 150 million km from the Sun (1 astronomical unit) and light travels almost 300,000 km a second, so sunlight is about 8 minutes 20 seconds old when it arrives. Over the year the distance changes by about 3 %, so the time varies between about 490 and 508 seconds.'
    },
    'earths-in-sun': {
      title: 'Earths inside the Sun',
      question: 'By volume, how many Earths would fit inside the Sun?',
      explain:
        'The Sun’s radius is about 109 times the Earth’s. Volume grows with the cube of the radius, so the Sun’s volume is 109 × 109 × 109 ≈ 1.3 million Earths. A small error in the ratio of the radii counts three times over: a ratio of 100 would give 1 million, one of 150 would give 3.4 million.'
    },
    'drive-to-moon': {
      title: 'A drive to the Moon',
      question: 'How many days would it take to drive to the Moon at a steady 100 km/h, without stopping?',
      explain:
        'The Moon is on average 384,400 km away, about ten times around the Earth. At 100 km/h that is 3,844 hours, or about 160 days of non-stop driving: more than five months.'
    },
    'drop-molecules': {
      title: 'Molecules in a drop',
      question: 'How many water molecules are in a single drop of water?',
      explain:
        'A drop is about 0.05 mL (20 drops make a millilitre), which weighs 0.05 g. 18 g of water is one mole, 6 × 10²³ molecules. So a drop holds about 1.7 × 10²¹ molecules: more molecules than there are drops of water in a large lake.'
    },
    'equator-speed': {
      title: 'Speed at the equator',
      question: 'How fast does a point on the equator move because the Earth spins, in km/h?',
      explain:
        'The equator is about 40,000 km long: the metre was once defined so that a quarter of a meridian measures 10,000 km. One turn takes about a day, so a point on the equator travels at about 1,670 km/h, faster than the speed of sound. We do not feel it because the motion is steady.'
    },
    'iss-day': {
      title: 'The space station in a day',
      question: 'How many kilometres does the International Space Station travel in one day?',
      explain:
        'The station circles about 420 km above the ground, so its orbit is only slightly longer than the equator: about 42,700 km. It completes an orbit in about 92 minutes, 15.5 a day, flying at about 7.7 km a second. In one day it covers about 660,000 km: the distance to the Moon and most of the way back.'
    },
    'atmosphere-mass': {
      title: 'The mass of the atmosphere',
      question: 'What is the total mass of the Earth’s atmosphere, in kilograms?',
      explain:
        'Air pressure is the weight of all the air above each square metre: about 10 tonnes per m². Multiply by the Earth’s surface (510 million km²) and divide by g: about 5.3 × 10¹⁸ kg. The measured value is 5.1 × 10¹⁸ kg, slightly less because mountains and high ground stick up into the air.'
    },
    'sun-mass-loss': {
      title: 'The Sun turning mass into light',
      question: 'How many kilograms of mass does the Sun turn into light every second?',
      explain:
        'Einstein’s E = mc² works both ways: radiating energy means losing mass. The Sun radiates 3.8 × 10²⁶ watts; dividing by c² (9 × 10¹⁶ m²/s²) gives about 4.3 billion kg every second. Yet over the Sun’s whole life so far, that adds up to less than a tenth of a per cent of its mass.'
    },
    'ocean-mass': {
      title: 'Water in the oceans',
      question: 'How many kilograms of water are in all the Earth’s oceans?',
      explain:
        'The oceans cover 71 % of the Earth, about 361 million km², with an average depth of about 3.7 km. That is 1.33 billion km³ of water; at just over a tonne per cubic metre it weighs about 1.4 × 10²¹ kg, yet that is only about 0.02 % of the Earth’s mass.'
    }
  }
};
