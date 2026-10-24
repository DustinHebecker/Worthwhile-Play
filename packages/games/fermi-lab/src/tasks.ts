/**
 * The tasks, language-neutral (design § 11.1): ids, category, level, the reference answer with its plausible range,
 * the reference decomposition and the sources. Transcribed from `docs/design/fermi-lab-content.md`, which holds the
 * research notes; `test/content.test.ts` checks the arithmetic (the reference product lies within 0.05 decades of
 * the central value, units cancel) and the ranges.
 *
 * Wording (question, factor names, explanation) lives in `content/<locale>.ts` (ADR 0011). Citations (`cite`) are
 * bibliographic data — author, title, publisher — and stay in their original language in every locale.
 */

export const CATEGORIES = ['everyday', 'nature', 'technology', 'society', 'space'] as const;
export type Category = (typeof CATEGORIES)[number];
export type Level = 1 | 2 | 3;
export type Power = -3 | -2 | -1 | 1 | 2 | 3;
export const POWERS: readonly Power[] = [1, -1, 2, -2, 3, -3];

export interface Factor {
  readonly id: string;
  readonly value: number;
  readonly low: number;
  readonly high: number;
  readonly unit: string;
  readonly power: Power;
  /** A conversion, definition or value given in the question: pre-filled, no uncertainty. */
  readonly fixed?: true;
}

/**
 * - `cited`: a published source (`cite`, usually `url`).
 * - `standard`: a standard reference value (SI, IAU, CODATA, clinical reference ranges, school physics tables).
 * - `assumption`: a reasoned assumption, no single published figure.
 * - `approximate`: a commonly given value that was not separately verified.
 * - `derived`: implied by the other figures of the task.
 */
export type SourceType = 'cited' | 'standard' | 'assumption' | 'approximate' | 'derived';

export interface Source {
  /** A factor id, or `answer` for the reference answer. */
  readonly about: string;
  readonly type: SourceType;
  readonly cite?: string;
  readonly url?: string;
}

export interface Task {
  readonly id: string;
  readonly category: Category;
  readonly level: Level;
  /** `measured`: the central value is a measured or official figure; `model`: the result of the reference model. */
  readonly kind: 'measured' | 'model';
  readonly confidence: 'high' | 'medium' | 'low';
  readonly answer: { readonly central: number; readonly low: number; readonly high: number; readonly unit: string };
  readonly factors: readonly Factor[];
  readonly sources: readonly Source[];
}

const f = (id: string, value: number, low: number, high: number, unit: string, power: Power = 1): Factor => ({ id, value, low, high, unit, power });
const fixed = (id: string, value: number, unit: string, power: Power = 1): Factor => ({ id, value, low: value, high: value, unit, power, fixed: true });

const LITRES_PER_M3 = (power: Power = 1) => fixed('litresPerM3', 1000, 'L/m³', power);
const DAYS_PER_YEAR = (power: Power = 1) => fixed('daysPerYear', 365, 'day/year', power);
const LIFETIME = f('lifetime', 75, 65, 85, 'year');
const WORLD_POPULATION = f('worldPopulation', 8.2e9, 8.0e9, 8.3e9, 'person');
const WPP = 'UN World Population Prospects 2024 (review yearly)';
const WPP_URL = 'https://population.un.org/wpp/';
const NASA_EARTH = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html';

export const TASKS: readonly Task[] = [
  /* ---------------- Everyday ---------------- */
  {
    id: 'rain-roof',
    category: 'everyday',
    level: 1,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 63_000, low: 35_000, high: 140_000, unit: 'L/year' },
    factors: [f('roofArea', 100, 60, 200, 'm²'), f('rainfall', 0.63, 0.6, 0.72, 'm/year'), LITRES_PER_M3()],
    sources: [
      { about: 'rainfall', type: 'cited', cite: 'Met Office climate averages 1991–2020: Kew Gardens 627.5 mm a year (other London stations about 600–720 mm); comparison with New York, via Wikipedia "Climate of London"', url: 'https://en.wikipedia.org/wiki/Climate_of_London' },
      { about: 'roofArea', type: 'assumption' },
      { about: 'litresPerM3', type: 'standard', cite: 'SI' }
    ]
  },
  {
    id: 'pitch-crowd',
    category: 'everyday',
    level: 1,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 29_000, low: 13_000, high: 40_000, unit: 'person' },
    factors: [f('pitchLength', 105, 100, 110, 'm'), f('pitchWidth', 68, 64, 75, 'm'), f('crowdDensity', 4, 2, 5, 'person/m²')],
    sources: [
      { about: 'pitchLength', type: 'cited', cite: 'IFAB, Laws of the Game, Law 1 (international matches 100–110 m × 64–75 m); FIFA stadium recommendation 105 × 68 m' },
      { about: 'crowdDensity', type: 'cited', cite: 'G. Keith Still, Crowd density (5 per m² upper limit for standing areas)', url: 'https://gkstill.com/Support/crowd-density/CrowdDensity-1.html' }
    ]
  },
  {
    id: 'rice-grains',
    category: 'everyday',
    level: 1,
    kind: 'measured',
    confidence: 'medium',
    answer: { central: 40_000, low: 28_000, high: 67_000, unit: 'grain' },
    factors: [fixed('riceMass', 1000, 'g'), f('grainMass', 0.025, 0.015, 0.035, 'g/grain', -1)],
    sources: [
      { about: 'grainMass', type: 'cited', cite: 'USDA GRIN-Global descriptor KERNELWTR (thousand-grain weight of rice accessions, mostly about 16–34 g)', url: 'https://npgstest.ars-grin.gov/gringlobal/descriptordetail?id=75038' },
      { about: 'grainMass', type: 'cited', cite: 'Genesys, descriptor "1000 Grain Weight"', url: 'https://www.genesys-pgr.org/descriptors/cad89840-7c2c-4101-953e-8d0bf1a052e1' }
    ]
  },
  {
    id: 'lifetime-drinking',
    category: 'everyday',
    level: 1,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 44_000, low: 25_000, high: 80_000, unit: 'L' },
    factors: [f('drinksPerDay', 1.6, 1.0, 2.5, 'L/day'), DAYS_PER_YEAR(), LIFETIME],
    sources: [
      { about: 'drinksPerDay', type: 'cited', cite: 'EFSA, Scientific Opinion on Dietary Reference Values for water (2010): adequate intake 2.0 L (women) and 2.5 L (men) of total water, 70–80 % from drinks; summarised in Popkin et al.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4472938/' },
      { about: 'lifetime', type: 'assumption', cite: 'world life expectancy about 73 years, UN World Population Prospects 2024' }
    ]
  },
  {
    id: 'paper-stack',
    category: 'everyday',
    level: 1,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 9_500, low: 8_500, high: 11_000, unit: 'sheet' },
    factors: [fixed('stackHeight', 1, 'm'), f('sheetThickness', 0.105, 0.095, 0.115, 'mm/sheet', -1)],
    sources: [{ about: 'sheetThickness', type: 'cited', cite: 'Manufacturer datasheets for 80 g/m² copy paper (thickness about 100–110 µm)' }]
  },
  {
    id: 'room-air',
    category: 'everyday',
    level: 2,
    kind: 'model',
    confidence: 'high',
    answer: { central: 75, low: 30, high: 150, unit: 'kg' },
    factors: [f('floorArea', 25, 12, 40, 'm²'), f('ceilingHeight', 2.5, 2.3, 3.0, 'm'), f('airDensity', 1.2, 1.15, 1.25, 'kg/m³')],
    sources: [
      { about: 'airDensity', type: 'standard', cite: 'dry air at 20 °C and 101.325 kPa: 1.204 kg/m³' },
      { about: 'floorArea', type: 'assumption' }
    ]
  },
  {
    id: 'words-per-day',
    category: 'everyday',
    level: 2,
    kind: 'measured',
    confidence: 'medium',
    answer: { central: 16_000, low: 8_000, high: 30_000, unit: 'word/day' },
    factors: [f('talkTime', 2, 1, 3.5, 'h/day'), fixed('minutesPerHour', 60, 'min/h'), f('speakingRate', 135, 110, 170, 'word/min')],
    sources: [
      { about: 'answer', type: 'cited', cite: 'Mehl, Vazire, Ramírez-Esparza, Slatcher, Pennebaker (2007), "Are women really more talkative than men?", Science 317:82 (women 16,215, men 15,669 words a day), as reported by ScienceDaily', url: 'https://www.sciencedaily.com/releases/2007/07/070705152953.htm' },
      { about: 'speakingRate', type: 'approximate' }
    ]
  },
  {
    id: 'sand-jar',
    category: 'everyday',
    level: 3,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 9_000_000, low: 1_000_000, high: 80_000_000, unit: 'grain' },
    factors: [fixed('jarVolume', 1, 'L'), f('packing', 0.6, 0.55, 0.65, '1'), fixed('sphereFactor', 1.91, '1'), f('grainDiameter', 0.5, 0.25, 1.0, 'mm', -3)],
    sources: [
      { about: 'grainDiameter', type: 'standard', cite: 'Wentworth scale / ISO 14688: sand 0.063–2 mm, medium sand 0.25–0.5 mm' },
      { about: 'packing', type: 'standard', cite: 'random packing of spheres 0.55–0.64' }
    ]
  },

  /* ---------------- Nature and the human body ---------------- */
  {
    id: 'heartbeats',
    category: 'nature',
    level: 1,
    kind: 'model',
    confidence: 'high',
    answer: { central: 2.8e9, low: 2.0e9, high: 3.5e9, unit: 'beat' },
    factors: [f('heartRate', 70, 60, 80, 'beat/min'), fixed('minutesPerYear', 525_600, 'min/year'), LIFETIME],
    sources: [{ about: 'heartRate', type: 'standard', cite: 'clinical reference range for the resting heart rate of adults, 60–100 per minute' }]
  },
  {
    id: 'scalp-hairs',
    category: 'nature',
    level: 2,
    kind: 'measured',
    confidence: 'medium',
    answer: { central: 100_000, low: 80_000, high: 150_000, unit: 'hair' },
    factors: [f('scalpArea', 650, 500, 800, 'cm²'), f('hairDensity', 150, 100, 220, 'hair/cm²')],
    sources: [
      { about: 'answer', type: 'approximate', cite: 'commonly cited dermatology range 80,000–150,000 hairs, average about 100,000' },
      { about: 'scalpArea', type: 'approximate' }
    ]
  },
  {
    id: 'breaths-day',
    category: 'nature',
    level: 1,
    kind: 'model',
    confidence: 'high',
    answer: { central: 22_000, low: 17_000, high: 29_000, unit: 'breath/day' },
    factors: [f('breathRate', 15, 12, 20, 'breath/min'), fixed('minutesPerDay', 1440, 'min/day')],
    sources: [{ about: 'breathRate', type: 'standard', cite: 'clinical reference range for adults at rest, 12–20 per minute' }]
  },
  {
    id: 'blood-pumped',
    category: 'nature',
    level: 2,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 7_200, low: 5_500, high: 11_500, unit: 'L/day' },
    factors: [f('strokeVolume', 70, 60, 100, 'mL/beat'), f('heartRate', 70, 60, 80, 'beat/min'), fixed('minutesPerDay', 1440, 'min/day')],
    sources: [{ about: 'strokeVolume', type: 'standard', cite: 'physiology reference values: stroke volume 60–100 mL, cardiac output 4–8 L/min' }]
  },
  {
    id: 'ants-earth',
    category: 'nature',
    level: 3,
    kind: 'measured',
    confidence: 'medium',
    answer: { central: 2.0e16, low: 5.0e15, high: 5.0e16, unit: 'ant' },
    factors: [f('iceFreeLand', 1.3e14, 1.2e14, 1.35e14, 'm²'), f('antDensity', 150, 40, 400, 'ant/m²')],
    sources: [
      { about: 'answer', type: 'cited', cite: 'Schultheiss et al. (2022), "The abundance, biomass, and distribution of ants on Earth", PNAS 119(40)', url: 'https://www.uni-wuerzburg.de/en/news-and-events/news/detail/news/wie-viele-ameisen-gibt-es-eigentlich/' },
      { about: 'iceFreeLand', type: 'standard', cite: 'land area 1.49 × 10⁸ km² minus about 1.6 × 10⁷ km² of ice sheets' },
      { about: 'antDensity', type: 'derived' }
    ]
  },
  {
    id: 'trees-earth',
    category: 'nature',
    level: 2,
    kind: 'measured',
    confidence: 'medium',
    answer: { central: 3.0e12, low: 2.0e12, high: 4.0e12, unit: 'tree' },
    factors: [f('forestArea', 4.1e9, 3.9e9, 4.2e9, 'ha'), f('treeDensity', 740, 300, 1500, 'tree/ha')],
    sources: [
      { about: 'answer', type: 'cited', cite: 'Crowther et al. (2015), "Mapping tree density at a global scale", Nature 525:201', url: 'https://news.yale.edu/2015/09/02/seeing-forest-and-trees-all-3-trillion-them' },
      { about: 'forestArea', type: 'cited', cite: 'FAO, Global Forest Resources Assessment 2020 (4.06 billion ha, 31 % of the land)', url: 'https://doi.org/10.4060/ca9825en' },
      { about: 'treeDensity', type: 'derived' }
    ]
  },
  {
    id: 'cloud-mass',
    category: 'nature',
    level: 2,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 500, low: 100, high: 2000, unit: 't' },
    factors: [f('cloudVolume', 1, 0.3, 3, 'km³'), f('cloudWater', 0.5, 0.2, 1.0, 'g/m³')],
    sources: [
      { about: 'answer', type: 'cited', cite: 'USGS Water Science School, "How much does a cloud weigh?"', url: 'https://www.usgs.gov/media/images/how-much-does-a-cloud-weigh' },
      { about: 'answer', type: 'cited', cite: 'Library of Congress, Everyday Mysteries (after M. LeMone, NCAR)', url: 'https://www.loc.gov/everyday-mysteries/meteorology-climatology/item/how-much-does-a-cloud-weigh/' }
    ]
  },
  {
    id: 'amazon-day',
    category: 'nature',
    level: 3,
    kind: 'measured',
    confidence: 'medium',
    answer: { central: 1.8e10, low: 1.0e10, high: 2.6e10, unit: 'm³/day' },
    factors: [f('riverWidth', 2300, 2000, 2600, 'm'), f('riverDepth', 45, 30, 60, 'm'), f('flowSpeed', 2.0, 0.75, 2.3, 'm/s'), fixed('secondsPerDay', 86_400, 's/day')],
    sources: [
      { about: 'answer', type: 'cited', cite: 'Callède et al. (2010), "Les apports en eau de l’Amazone à l’Océan Atlantique", Revue des sciences de l’eau 23(3): mean discharge at the mouth about 206,000 m³/s (1972–2003)', url: 'https://horizon.documentation.ird.fr/exl-doc/pleins_textes/divers17-08/010051056.pdf' },
      { about: 'answer', type: 'cited', cite: 'Wikipedia, "Amazon River" (about a fifth of all river water reaching the oceans)', url: 'https://en.wikipedia.org/wiki/Amazon_River' },
      { about: 'riverWidth', type: 'cited', cite: 'Encyclopaedia Britannica, "Óbidos" (the Amazon narrows to about 2 km)', url: 'https://www.britannica.com/place/Obidos' },
      { about: 'flowSpeed', type: 'cited', cite: 'Acta Scientiarum. Technology: mean velocity at the Óbidos cross-section 0.74–2.27 m/s', url: 'https://periodicos.uem.br/actascitechnol/index.php/ActaSciTechnol/article/download/45703/751375149037/751375185441' },
      { about: 'riverDepth', type: 'approximate' }
    ]
  },
  {
    id: 'bee-colony',
    category: 'nature',
    level: 2,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 50_000, low: 20_000, high: 80_000, unit: 'bee' },
    factors: [f('eggsPerDay', 1500, 1000, 2500, 'egg/day'), f('workerLife', 35, 15, 42, 'day')],
    sources: [
      { about: 'eggsPerDay', type: 'cited', cite: 'University of Delaware, MAAREC, "The Colony and Its Organization" (up to 1,500 eggs a day; up to 80,000 workers)', url: 'https://canr.udel.edu/maarec/honey-bee-biology/the-colony-and-its-organization/' },
      { about: 'workerLife', type: 'cited', cite: 'PBS Nature, honeybee guide (15–38 days in summer)', url: 'https://www.pbs.org/wnet/nature/animal-guide-honeybee/499' },
      { about: 'workerLife', type: 'cited', cite: 'University of Arizona, activity sheet (average 42 days)', url: 'https://cales.arizona.edu/pubs/insects/ahb/act12.html' }
    ]
  },
  {
    id: 'body-cells',
    category: 'nature',
    level: 3,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 3.0e13, low: 2.0e13, high: 4.0e13, unit: 'cell' },
    factors: [f('bloodVolume', 5, 4.5, 5.5, 'L'), f('redCellCount', 5e6, 4.2e6, 5.9e6, 'cell/µL'), fixed('redCellShare', 0.84, '1', -1)],
    sources: [
      { about: 'answer', type: 'cited', cite: 'Sender, Fuchs, Milo (2016), "Revised estimates for the number of human and bacteria cells in the body", PLoS Biology 14(8):e1002533', url: 'https://doi.org/10.1371/journal.pbio.1002533' },
      { about: 'redCellCount', type: 'standard', cite: 'clinical reference values: 4.2–5.9 million red cells per µL, blood volume about 5 L' }
    ]
  },
  {
    id: 'nail-growth',
    category: 'nature',
    level: 1,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 42, low: 25, high: 55, unit: 'mm/year' },
    factors: [f('nailPerDay', 0.115, 0.07, 0.15, 'mm/day'), DAYS_PER_YEAR()],
    sources: [{ about: 'nailPerDay', type: 'cited', cite: 'Yaemsiri et al. (2010), J Eur Acad Dermatol Venereol 24(4):420–423 (3.47 mm a month); BioNumbers 112380', url: 'https://bionumbers.hms.harvard.edu/bionumber.aspx?id=112380' }]
  },

  /* ---------------- Technology and energy ---------------- */
  {
    id: 'lift-ride',
    category: 'technology',
    level: 2,
    kind: 'model',
    confidence: 'low',
    answer: { central: 50, low: 10, high: 150, unit: 'Wh' },
    factors: [f('liftedMass', 300, 250, 350, 'kg'), fixed('gravity', 9.81, 'm/s²'), f('liftHeight', 30, 27, 35, 'm'), f('driveEfficiency', 0.5, 0.3, 0.8, '1', -1), fixed('joulesPerWh', 3600, 'J/Wh', -1)],
    sources: [
      { about: 'gravity', type: 'standard', cite: 'potential energy m·g·h; g = 9.81 m/s²; 1 Wh = 3,600 J' },
      { about: 'answer', type: 'cited', cite: 'Elevator World, ISO 25745-2 calculation example (an office lift about 42 Wh per trip)', url: 'https://elevatorworld.com/article/an-improved-and-more-accurate-method-to-calculate-the-energy-consumption-of-a-lift' },
      { about: 'driveEfficiency', type: 'assumption' }
    ]
  },
  {
    id: 'phone-charges',
    category: 'technology',
    level: 1,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 50, low: 30, high: 90, unit: 'charge' },
    factors: [fixed('energyAvailable', 1, 'kWh'), f('batteryEnergy', 17, 11, 22, 'Wh/charge', -1), f('chargeEfficiency', 0.85, 0.7, 0.9, '1')],
    sources: [
      { about: 'batteryEnergy', type: 'standard', cite: 'energy = charge × voltage; typical 2020s phone batteries 4,000–5,000 mAh at 3.85 V (manufacturer specifications)' },
      { about: 'chargeEfficiency', type: 'approximate' }
    ]
  },
  {
    id: 'ev-litre',
    category: 'technology',
    level: 2,
    kind: 'model',
    confidence: 'high',
    answer: { central: 52, low: 35, high: 70, unit: 'km' },
    factors: [f('petrolEnergy', 8.9, 8.8, 9.2, 'kWh'), f('evConsumption', 0.17, 0.13, 0.25, 'kWh/km', -1)],
    sources: [
      { about: 'petrolEnergy', type: 'cited', cite: 'US DOE, Bioenergy conversion factors (gasoline about 115,000 Btu/gal ≈ 32 MJ/L, lower heating value)' },
      { about: 'evConsumption', type: 'cited', cite: 'ADAC Ecotest 2024 results (best 16.0 kWh/100 km, large cars above 25)', url: 'https://www.automotiveworld.com/news-releases/peugeot-e-208-and-e-308-ranked-the-most-efficient-cars-on-the-market-in-the-adac-2024-ecotest/' }
    ]
  },
  {
    id: 'tea-energy',
    category: 'technology',
    level: 2,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 23, low: 15, high: 40, unit: 'Wh' },
    factors: [f('cupWater', 0.25, 0.2, 0.4, 'kg'), fixed('specificHeat', 4186, 'J/(kg·K)'), f('temperatureRise', 80, 75, 90, 'K'), fixed('joulesPerWh', 3600, 'J/Wh', -1)],
    sources: [
      { about: 'specificHeat', type: 'standard', cite: 'specific heat of water 4.186 kJ/(kg·K)' },
      { about: 'temperatureRise', type: 'assumption', cite: 'tap water 10–20 °C' }
    ]
  },
  {
    id: 'airliner-fuel',
    category: 'technology',
    level: 3,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 50_000, low: 30_000, high: 80_000, unit: 'L' },
    factors: [f('passengers', 300, 250, 350, 'passenger'), f('fuelPerPassengerKm', 0.03, 0.025, 0.045, 'L/(passenger·km)'), f('flightDistance', 5540, 5540, 5800, 'km')],
    sources: [
      { about: 'fuelPerPassengerKm', type: 'cited', cite: 'Lufthansa Group, "A350 facts and figures" (2.9 L per passenger per 100 km)', url: 'https://www.lufthansagroup.com/media/newsroom/north-america/2019/q1/A350_Facts_and_figures_ENG_final.pdf' },
      { about: 'flightDistance', type: 'standard', cite: 'great-circle distance London Heathrow–New York JFK ≈ 5,540 km (computed from the airport coordinates)' }
    ]
  },
  {
    id: 'aa-petrol',
    category: 'technology',
    level: 3,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 3000, low: 2000, high: 4500, unit: 'battery' },
    factors: [f('petrolEnergyWh', 8900, 8800, 9200, 'Wh'), f('aaEnergy', 3, 2, 4.2, 'Wh/battery', -1)],
    sources: [
      { about: 'aaEnergy', type: 'cited', cite: 'Alkaline AA datasheets (2,450–2,800 mAh), e.g. Farnell; watt-hours derived', url: 'https://www.farnell.com/datasheets/86310.pdf' },
      { about: 'petrolEnergyWh', type: 'cited', cite: 'US DOE, Bioenergy conversion factors (gasoline ≈ 32 MJ/L)' }
    ]
  },
  {
    id: 'solar-panel',
    category: 'technology',
    level: 2,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 290, low: 150, high: 450, unit: 'kWh/year' },
    factors: [fixed('ratedSunlight', 1000, 'W/m²'), fixed('panelArea', 1, 'm²'), f('panelEfficiency', 0.21, 0.18, 0.23, '1'), f('capacityFactor', 0.16, 0.1, 0.25, '1'), fixed('hoursPerYear', 8760, 'h/year')],
    sources: [
      { about: 'capacityFactor', type: 'cited', cite: 'IRENA, Renewable Power Generation Costs in 2023: global weighted-average capacity factor of new utility-scale solar PV 16.2 % (13.8 % in 2010), as reported by pv magazine', url: 'https://www.pv-magazine.com/2024/09/27/global-average-solar-lcoe-stood-at-0-044-kwh-in-2023-says-irena/' },
      { about: 'ratedSunlight', type: 'standard', cite: 'standard test conditions for solar modules: 1,000 W/m², 25 °C (IEC 61215)' },
      { about: 'panelEfficiency', type: 'approximate', cite: 'commercial modules of the 2020s about 20–23 %' }
    ]
  },
  {
    id: 'body-power',
    category: 'technology',
    level: 3,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 100, low: 70, high: 150, unit: 'W' },
    factors: [f('foodEnergy', 2000, 1600, 3000, 'kcal/day'), fixed('joulesPerKcal', 4184, 'J/kcal'), fixed('secondsPerDay', 86_400, 's/day', -1)],
    sources: [
      { about: 'joulesPerKcal', type: 'standard', cite: '1 kcal = 4.184 kJ' },
      { about: 'foodEnergy', type: 'cited', cite: 'reference intake of 2,000 kcal used on food labels (EU Regulation 1169/2011, Annex XIII; also the US FDA Daily Values)' }
    ]
  },
  {
    id: 'car-lifetime-fuel',
    category: 'technology',
    level: 1,
    kind: 'model',
    confidence: 'low',
    answer: { central: 14_000, low: 7_000, high: 30_000, unit: 'L' },
    factors: [f('lifetimeDistance', 200_000, 150_000, 300_000, 'km'), f('fuelConsumption', 0.07, 0.05, 0.1, 'L/km')],
    sources: [{ about: 'lifetimeDistance', type: 'assumption' }, { about: 'fuelConsumption', type: 'assumption' }]
  },

  /* ---------------- Society ---------------- */
  {
    id: 'piano-tuners',
    category: 'society',
    level: 2,
    kind: 'model',
    confidence: 'low',
    answer: { central: 25, low: 8, high: 100, unit: 'tuner' },
    factors: [
      fixed('inhabitants', 1_000_000, 'person'),
      f('householdSize', 2.5, 2, 5, 'person/household', -1),
      f('pianoShare', 0.05, 0.02, 0.1, 'piano/household'),
      f('tuningsPerPiano', 1, 0.5, 1.5, 'tuning/(piano·year)'),
      f('tuningsPerTuner', 800, 600, 1000, 'tuning/(tuner·year)', -1)
    ],
    sources: [
      { about: 'householdSize', type: 'cited', cite: 'UN DESA, Household Size and Composition Around the World 2017 (country averages from about 2 to 9 people per household; most of Europe, North America and Japan below 3)', url: 'https://www.un.org/en/development/desa/population/publications/pdf/popfacts/PopFacts_2017-2.pdf' },
      { about: 'pianoShare', type: 'assumption' },
      { about: 'tuningsPerTuner', type: 'assumption' }
    ]
  },
  {
    id: 'births-day',
    category: 'society',
    level: 2,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 360_000, low: 330_000, high: 390_000, unit: 'birth/day' },
    factors: [WORLD_POPULATION, f('birthRate', 0.016, 0.015, 0.018, '1/year'), DAYS_PER_YEAR(-1)],
    sources: [
      { about: 'birthRate', type: 'cited', cite: 'UN World Population Prospects 2024 via INED (about 132 million births a year, 16 per 1,000; review yearly)', url: 'https://www.ined.fr/en/everything_about_population/data/all-countries' },
      { about: 'worldPopulation', type: 'cited', cite: WPP, url: WPP_URL }
    ]
  },
  {
    id: 'birthdays-today',
    category: 'society',
    level: 1,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 22_000_000, low: 20_000_000, high: 24_000_000, unit: 'person' },
    factors: [WORLD_POPULATION, fixed('daysPerYearPlain', 365, '1', -1)],
    sources: [{ about: 'worldPopulation', type: 'cited', cite: WPP, url: WPP_URL }]
  },
  {
    id: 'lifetime-sleep',
    category: 'society',
    level: 1,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 25, low: 20, high: 30, unit: 'year' },
    factors: [fixed('lifetimeGiven', 75, 'year'), f('sleepPerDay', 8, 6.5, 9.5, 'h'), fixed('hoursPerDay', 24, 'h', -1)],
    sources: [{ about: 'sleepPerDay', type: 'approximate', cite: 'adults commonly 7–8 h, children 9–14 h' }]
  },
  {
    id: 'people-airborne',
    category: 'society',
    level: 3,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 1_300_000, low: 700_000, high: 2_000_000, unit: 'person' },
    factors: [f('tripsPerYear', 4.9e9, 4.5e9, 5.0e9, 'trip/year'), f('airTime', 2.4, 1.5, 3, 'h/trip'), fixed('hoursPerYear', 8760, 'h/year', -1)],
    sources: [
      { about: 'tripsPerYear', type: 'cited', cite: 'IATA, press release of 30 January 2025 (about 4.9 billion passengers in 2024), reported by New Mobility News', url: 'https://newmobility.news/en/2025/01/31/iata-never-as-many-airline-passengers-as-in-2024/' },
      { about: 'airTime', type: 'cited', cite: 'ICAO Annual Report 2019 (8,686 billion passenger-km ÷ 4.5 billion passengers ≈ 1,930 km a trip); cruising speed about 800 km/h assumed', url: 'https://icao.int/annual-report-2019/Pages/the-world-of-air-transport-in-2019.aspx' }
    ]
  },
  {
    id: 'lifetime-walking',
    category: 'society',
    level: 2,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 96_000, low: 40_000, high: 200_000, unit: 'km' },
    factors: [f('stepsPerDay', 5000, 3000, 10_000, 'step/day'), f('stepLength', 0.7, 0.6, 0.8, 'm/step'), DAYS_PER_YEAR(), LIFETIME],
    sources: [
      { about: 'stepsPerDay', type: 'cited', cite: 'Althoff et al. (2017), "Large-scale physical activity data reveal worldwide activity inequality", Nature 547:336', url: 'https://www.nih.gov/node/34651' },
      { about: 'stepLength', type: 'approximate' }
    ]
  },
  {
    id: 'smartphones-year',
    category: 'society',
    level: 3,
    kind: 'measured',
    confidence: 'medium',
    answer: { central: 1.25e9, low: 0.9e9, high: 1.6e9, unit: 'phone/year' },
    factors: [WORLD_POPULATION, f('smartphoneShare', 0.55, 0.45, 0.7, '1'), f('replacementYears', 3.6, 2.5, 5, 'year', -1)],
    sources: [
      { about: 'answer', type: 'cited', cite: 'IDC, smartphone shipments 2025 (about 1.25 billion; review yearly)', url: 'https://www.idc.com/promo/smartphone-market-share' },
      { about: 'smartphoneShare', type: 'approximate' },
      { about: 'replacementYears', type: 'approximate' }
    ]
  },
  {
    id: 'teachers-city',
    category: 'society',
    level: 1,
    kind: 'model',
    confidence: 'medium',
    answer: { central: 10_000, low: 4_500, high: 30_000, unit: 'teacher' },
    factors: [fixed('inhabitants', 1_000_000, 'person'), f('schoolAgeShare', 0.14, 0.1, 0.22, 'pupil/person'), f('pupilsPerTeacher', 14, 7, 23, 'pupil/teacher', -1)],
    sources: [
      { about: 'pupilsPerTeacher', type: 'cited', cite: 'OECD, Education at a Glance 2024, indicator D2 (on average 14 students per teacher in primary and 13 in lower secondary education; from about 7 to 23 across countries)', url: 'https://www.oecd.org/en/publications/education-at-a-glance-2024_c00cad36-en/full-report/what-is-the-student-teacher-ratio-and-how-large-are-classes-and-schools_bb95b097' },
      { about: 'schoolAgeShare', type: 'derived', cite: 'from the share of children under 15: 17 % in OECD countries (OECD, young population 2022), about 25 % worldwide (World Bank 2022)' }
    ]
  },
  {
    id: 'world-cars',
    category: 'society',
    level: 2,
    kind: 'measured',
    confidence: 'medium',
    answer: { central: 1.5e9, low: 1.1e9, high: 1.9e9, unit: 'vehicle' },
    factors: [WORLD_POPULATION, f('peoplePerVehicle', 5.5, 4, 7.5, 'person/vehicle', -1)],
    sources: [
      { about: 'answer', type: 'cited', cite: 'OICA, vehicles in use (2011: 1,097 million)', url: 'https://www.oica.net/wp-content/uploads/2013/09/OICA-Francfort-2013ok.pdf' },
      { about: 'answer', type: 'cited', cite: 'Wikipedia, "Motor vehicle" (about 1.55 billion in 2023, citing OICA; review)', url: 'https://en.wikipedia.org/wiki/Motor_vehicle' }
    ]
  },

  /* ---------------- Space and physics ---------------- */
  {
    id: 'sunlight-time',
    category: 'space',
    level: 1,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 499, low: 490, high: 508, unit: 's' },
    factors: [f('sunDistance', 149_600_000, 147_100_000, 152_100_000, 'km'), fixed('lightSpeedKm', 299_792, 'km/s', -1)],
    sources: [
      { about: 'sunDistance', type: 'standard', cite: '1 au = 149,597,870.7 km (IAU 2012)' },
      { about: 'sunDistance', type: 'cited', cite: 'NASA, Earth Fact Sheet (perihelion 147.1, aphelion 152.1 million km)', url: NASA_EARTH },
      { about: 'lightSpeedKm', type: 'standard', cite: 'SI definition: 299,792.458 km/s' }
    ]
  },
  {
    id: 'earths-in-sun',
    category: 'space',
    level: 3,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 1_300_000, low: 1_250_000, high: 1_350_000, unit: 'earth' },
    factors: [f('sunRadius', 695_700, 695_700, 695_700, 'km', 3), f('earthRadius', 6371, 6371, 6371, 'km', -3)],
    sources: [
      { about: 'sunRadius', type: 'standard', cite: 'nominal solar radius 695,700 km (IAU 2015 Resolution B3)' },
      { about: 'earthRadius', type: 'cited', cite: 'NASA, Earth Fact Sheet (mean radius 6,371 km)', url: NASA_EARTH }
    ]
  },
  {
    id: 'drive-to-moon',
    category: 'space',
    level: 1,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 160, low: 150, high: 170, unit: 'day' },
    factors: [f('moonDistance', 384_400, 363_000, 406_000, 'km'), fixed('carSpeed', 100, 'km/h', -1), fixed('hoursPerDayRate', 24, 'h/day', -1)],
    sources: [{ about: 'moonDistance', type: 'cited', cite: 'NASA, Moon Fact Sheet (mean 384,400 km; perigee about 363,000, apogee about 406,000 km)', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' }]
  },
  {
    id: 'drop-molecules',
    category: 'space',
    level: 3,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 1.7e21, low: 1.0e21, high: 3.3e21, unit: 'molecule' },
    factors: [f('dropMass', 0.05, 0.03, 0.1, 'g'), fixed('molarMass', 18, 'g/mol', -1), fixed('avogadro', 6.022e23, 'molecule/mol')],
    sources: [
      { about: 'avogadro', type: 'standard', cite: 'SI definition: 6.02214076 × 10²³ per mol; molar mass of water 18.015 g/mol' },
      { about: 'dropMass', type: 'standard', cite: 'pharmacopoeia standard dropper: 20 drops per mL' }
    ]
  },
  {
    id: 'equator-speed',
    category: 'space',
    level: 2,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 1670, low: 1660, high: 1680, unit: 'km/h' },
    factors: [f('equatorLength', 40_075, 40_075, 40_075, 'km'), f('rotationTime', 24, 23.93, 24, 'h', -1)],
    sources: [
      { about: 'equatorLength', type: 'standard', cite: 'WGS 84 equatorial radius 6,378.137 km' },
      { about: 'rotationTime', type: 'cited', cite: 'NASA, Earth Fact Sheet (sidereal day 23.93 h)', url: NASA_EARTH }
    ]
  },
  {
    id: 'iss-day',
    category: 'space',
    level: 2,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 660_000, low: 650_000, high: 675_000, unit: 'km/day' },
    factors: [f('orbitsPerDay', 15.5, 15.5, 15.9, 'orbit/day'), f('orbitLength', 42_700, 42_500, 42_800, 'km/orbit')],
    sources: [{ about: 'orbitsPerDay', type: 'cited', cite: 'NASA Johnson Space Center, "Space Station Orbit Tutorial" (90–93 minutes an orbit; altitude about 400–420 km)', url: 'https://eol.jsc.nasa.gov/Tools/orbitTutorial.htm' }]
  },
  {
    id: 'atmosphere-mass',
    category: 'space',
    level: 3,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 5.1e18, low: 5.0e18, high: 5.3e18, unit: 'kg' },
    factors: [fixed('seaLevelPressure', 101_325, 'Pa'), f('earthSurface', 5.1e14, 5.1e14, 5.1e14, 'm²'), fixed('gravity', 9.81, 'm/s²', -1)],
    sources: [
      { about: 'answer', type: 'cited', cite: 'NASA, Earth Fact Sheet (atmosphere 5.1 × 10¹⁸ kg)', url: NASA_EARTH },
      { about: 'seaLevelPressure', type: 'standard', cite: 'standard atmosphere 101,325 Pa; g = 9.80665 m/s²' }
    ]
  },
  {
    id: 'sun-mass-loss',
    category: 'space',
    level: 3,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 4.3e9, low: 4.2e9, high: 4.3e9, unit: 'kg/s' },
    factors: [f('sunPower', 3.828e26, 3.828e26, 3.828e26, 'W'), fixed('lightSpeed', 299_792_458, 'm/s', -2)],
    sources: [{ about: 'sunPower', type: 'standard', cite: 'nominal solar luminosity 3.828 × 10²⁶ W (IAU 2015 Resolution B3); c = 299,792,458 m/s' }]
  },
  {
    id: 'ocean-mass',
    category: 'space',
    level: 3,
    kind: 'measured',
    confidence: 'high',
    answer: { central: 1.4e21, low: 1.3e21, high: 1.45e21, unit: 'kg' },
    factors: [f('oceanArea', 3.61e14, 3.6e14, 3.62e14, 'm²'), f('oceanDepth', 3682, 3600, 3800, 'm'), f('seawaterDensity', 1025, 1020, 1030, 'kg/m³')],
    sources: [
      { about: 'oceanDepth', type: 'cited', cite: 'NOAA Ocean Exploration (average depth 3,682 m, volume 1.332 × 10⁹ km³; Charette & Smith 2010)', url: 'https://oceanexplorer.noaa.gov/facts/ocean-depth.html' },
      { about: 'oceanArea', type: 'standard', cite: 'ocean area 361 million km²; seawater about 1,025 kg/m³' }
    ]
  }
];

const BY_ID = new Map(TASKS.map((t) => [t.id, t]));

export const taskById = (id: string): Task | undefined => BY_ID.get(id);
