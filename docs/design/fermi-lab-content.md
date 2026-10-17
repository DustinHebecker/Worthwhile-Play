# Estimation Lab (`fermi-lab`): content (46 tasks)

Status: **researched draft, 2026-10-17**. This is the source for `packages/games/fermi-lab/src/tasks.ts` (language-neutral numbers) and `src/content/<locale>.ts` (wording). Design: [fermi-lab.md](fermi-lab.md).

## How to read this file

Each task is one YAML block. The implementer turns it into TypeScript by hand or with a one-off script. The English wording here is the reference for translation; the numbers, units and ids are language-neutral and go into `tasks.ts`.

| Field | Meaning |
|---|---|
| `id` | Stable id (stored in saves, never renamed). |
| `category` | `everyday`, `nature` (nature and the human body), `technology` (technology and energy), `society`, `space` (space and physics). |
| `level` | 1 = two or three familiar factors; 2 = three or four factors, one of them unfamiliar; 3 = big exponents, unfamiliar quantities or a physics law. |
| `kind` | `measured`: the central value is a measured or official figure. `model`: no single measured value exists; the central value is the result of the reference model with sourced or clearly reasoned inputs. The game says which kind it is. |
| `answer` | `central`, plausible `low` and `high`, and `unit`. The **range** is what the game calls "plausible" (it covers real variation: house sizes, people, years). Scoring always uses the distance to `central` in powers of ten. |
| `model` | The reference decomposition. Each factor has a `value`, a plausible `low` and `high`, a `unit` and an `exp` (power: 1 multiply, −1 divide, 2/3 square/cube, −2 divide by the square). `fixed: true` marks a conversion, definition or value given in the question; the builder pre-fills it and the sensitivity chart leaves it out. |
| `explain` | The short explanation shown after answering. |
| `sources` | One source per key factor. "Std." marks a standard reference value (SI definitions, IAU/CODATA constants, school physics tables) that needs no web citation. |
| `confidence` | `high`: physical constants or official statistics; `medium`: published studies or estimates that differ by up to ~30 %; `low`: a model with assumptions only (`kind: model`). |

Units in `unit` strings use the symbols of the unit table in the design document (§ 7.2). Count words (`person`, `piano`, `grain`…) are **labels only**: they make a unit readable and are ignored by the unit algebra (they are dimensionless). `year` means 365 days.

**Checks already run on this file** (Python script in the planner's scratchpad, to be re-implemented as a unit test in `test/content.test.ts`): every reference model's product, converted to the answer unit, lies within 0.05 decades (12 %) of `central`; units cancel to the answer unit; `low ≤ central ≤ high` for the answer and `low ≤ value ≤ high` for every factor; ids unique; at least 8 tasks per category, every level present in every category, and 14–17 tasks per level overall. (Note for a YAML-based import: YAML 1.1 reads `2.0e16` without an exponent sign as a string; convert numbers explicitly.)

**Data that changes over time** carries a year in `sources` and is listed in § "Review schedule" at the end.

---

## Everyday (8)

```yaml
id: rain-roof
category: everyday
level: 1
kind: measured
question: How many litres of rain fall on the roof of a detached house in London in one year?
answer: { central: 63000, low: 35000, high: 140000, unit: L/year }
model:
  - { name: "Roof area seen from above", value: 100, low: 60, high: 200, unit: m², exp: 1 }
  - { name: "Yearly rainfall (height of water)", value: 0.63, low: 0.60, high: 0.72, unit: m/year, exp: 1 }
  - { name: "Litres in a cubic metre", value: 1000, low: 1000, high: 1000, unit: L/m³, exp: 1, fixed: true }
explain: >
  Rainfall is measured as a height: London's long-term average of about 630 mm a year means a layer
  0.63 m deep if nothing ran off. What counts is the roof's area seen from above, not the larger sloping
  surface: rain falls vertically. Despite its rainy reputation, London gets only about half as much rain
  as New York: it rains often there, but lightly. The roof area is the uncertain factor.
sources:
  - "Rainfall: Met Office climate averages 1991–2020, Kew Gardens 627.5 mm a year (Northolt 663.3, Hampstead 722.1); note that London receives about half the rain of New York City; via Wikipedia \"Climate of London\", https://en.wikipedia.org/wiki/Climate_of_London (verified 2026-10-17)."
  - "Roof footprint: assumption (detached houses typically 80–150 m² footprint including overhang)."
  - "1 m³ = 1000 L: Std. (SI)."
confidence: high
# Owner decision 2026-10-17: Berlin replaced by London (world city, internationally meaningful).
```

```yaml
id: pitch-crowd
category: everyday
level: 1
kind: model
question: How many standing people fit on a football pitch?
answer: { central: 29000, low: 13000, high: 40000, unit: person }
model:
  - { name: "Pitch length", value: 105, low: 100, high: 110, unit: m, exp: 1 }
  - { name: "Pitch width", value: 68, low: 64, high: 75, unit: m, exp: 1 }
  - { name: "People per square metre (dense standing crowd)", value: 4, low: 2, high: 5, unit: person/m², exp: 1 }
explain: >
  A standard pitch is 105 m × 68 m, about 7,100 m². How tightly people stand matters most: 2 per m²
  is a comfortable event crowd, 4 is shoulder to shoulder, and 5 per m² is the upper limit crowd-safety
  planners use for standing areas; beyond that it becomes dangerous. So "fit" spans a factor of 2–3.
sources:
  - "Pitch dimensions: IFAB Laws of the Game, Law 1 (international matches 100–110 m × 64–75 m); 105 × 68 m is the FIFA stadium recommendation."
  - "Crowd density: G. Keith Still, static crowd density, https://gkstill.com/Support/crowd-density/CrowdDensity-1.html (5 per m² upper limit; 2 per m² typical safety assessment)."
confidence: medium
```

```yaml
id: rice-grains
category: everyday
level: 1
kind: measured
question: How many grains of rice are in a 1 kg bag?
answer: { central: 40000, low: 28000, high: 67000, unit: grain }
model:
  - { name: "Rice in the bag", value: 1000, low: 1000, high: 1000, unit: g, exp: 1, fixed: true }
  - { name: "Mass of one grain", value: 0.025, low: 0.015, high: 0.035, unit: g/grain, exp: -1 }
explain: >
  Agronomists weigh rice as "thousand-grain weight": most varieties fall between about 15 and 35 g per
  1,000 grains, so one grain is roughly 25 mg. Dividing 1,000 g by 0.025 g gives 40,000. A trick for
  tiny things: weigh or count a small batch and scale up.
sources:
  - "Thousand-grain weight: USDA GRIN descriptor KERNELWTR, https://npgstest.ars-grin.gov/gringlobal/descriptordetail?id=75038 ; Genesys descriptor \"1000 Grain Weight\", https://www.genesys-pgr.org/descriptors/cad89840-7c2c-4101-953e-8d0bf1a052e1 (most accessions ~16–34 g)."
confidence: medium
```

```yaml
id: lifetime-drinking
category: everyday
level: 1
kind: model
question: How many litres does a person drink in a lifetime (all drinks together)?
answer: { central: 44000, low: 25000, high: 80000, unit: L }
model:
  - { name: "Drinks per day", value: 1.6, low: 1.0, high: 2.5, unit: L/day, exp: 1 }
  - { name: "Days in a year", value: 365, low: 365, high: 365, unit: day/year, exp: 1, fixed: true }
  - { name: "Lifetime", value: 75, low: 65, high: 85, unit: year, exp: 1 }
explain: >
  The European Food Safety Authority's adequate intake for total water is 2.0 L a day for women and
  2.5 L for men, of which about 70–80 % comes from drinks and the rest from food. That is roughly
  1.4–2.0 L of drinks a day. Over 75 years that is around 44,000 litres: a small swimming pool.
sources:
  - "Water intake: EFSA Scientific Opinion on Dietary Reference Values for water (2010), as summarised in https://pmc.ncbi.nlm.nih.gov/articles/PMC4472938/ (AI 2.0 / 2.5 L total water; fluids 70–80 %)."
  - "Lifetime: assumption (world life expectancy about 73 years, UN WPP 2024)."
confidence: medium
```

```yaml
id: paper-stack
category: everyday
level: 1
kind: measured
question: How many sheets of ordinary printer paper make a stack 1 metre high?
answer: { central: 9500, low: 8500, high: 11000, unit: sheet }
model:
  - { name: "Stack height", value: 1, low: 1, high: 1, unit: m, exp: 1, fixed: true }
  - { name: "Thickness of one sheet", value: 0.105, low: 0.095, high: 0.115, unit: mm/sheet, exp: -1 }
explain: >
  Standard 80 g/m² paper is about a tenth of a millimetre thick (manufacturers list 100–110 µm).
  A pack of 500 sheets is about 5 cm high, so 1 m is 20 packs: roughly 10,000 sheets. Thin things are
  easier to measure in bulk: measure the pack, then divide.
sources:
  - "Thickness: manufacturer datasheets for 80 g/m² copy paper (e.g. 103–110 µm); summary in the planner's search notes."
confidence: high
```

```yaml
id: room-air
category: everyday
level: 2
kind: model
question: How much does all the air in a typical living room weigh?
answer: { central: 75, low: 30, high: 150, unit: kg }
model:
  - { name: "Floor area", value: 25, low: 12, high: 40, unit: m², exp: 1 }
  - { name: "Ceiling height", value: 2.5, low: 2.3, high: 3.0, unit: m, exp: 1 }
  - { name: "Density of air", value: 1.2, low: 1.15, high: 1.25, unit: kg/m³, exp: 1 }
explain: >
  Air feels weightless, but a cubic metre of it at room temperature and sea level weighs about
  1.2 kg. A 25 m² room with a 2.5 m ceiling holds about 62 m³ of air: around 75 kg, as much as
  an adult. The room's size is the uncertain part; the density of air is a physical fact.
sources:
  - "Air density: Std. (dry air at 20 °C and 101.325 kPa: 1.204 kg/m³)."
  - "Room size: assumption."
confidence: high
```

```yaml
id: words-per-day
category: everyday
level: 2
kind: measured
question: How many words does an average adult speak in one day?
answer: { central: 16000, low: 8000, high: 30000, unit: word/day }
model:
  - { name: "Time spent talking per day", value: 2, low: 1, high: 3.5, unit: h/day, exp: 1 }
  - { name: "Minutes in an hour", value: 60, low: 60, high: 60, unit: min/h, exp: 1, fixed: true }
  - { name: "Speaking rate", value: 135, low: 110, high: 170, unit: word/min, exp: 1 }
explain: >
  A study that recorded short audio snippets of almost 400 students over several days found that women
  and men both spoke about 16,000 words a day — the popular claim of 20,000 versus 7,000 was wrong.
  People differ enormously (from a few hundred to over 40,000), so the range is wide. Conversation runs
  at roughly 110–170 words a minute, so 16,000 words is about two hours of actual talking.
sources:
  - "Words per day: Mehl, Vazire, Ramírez-Esparza, Slatcher, Pennebaker (2007), \"Are women really more talkative than men?\", Science 317:82; press release https://news.utexas.edu/2007/07/05/do-women-really-talk-more-than-men-research-refutes-popular-beliefs"
  - "Speaking rate: approximate (conversational speech is commonly given as 110–170 words per minute; not separately verified, marked approximate)."
confidence: medium
```

```yaml
id: sand-jar
category: everyday
level: 3
kind: model
question: How many grains of sand are in a one-litre jar of dry sand?
answer: { central: 9000000, low: 1000000, high: 80000000, unit: grain }
model:
  - { name: "Jar volume", value: 1, low: 1, high: 1, unit: L, exp: 1, fixed: true }
  - { name: "Share of the jar filled by grains (the rest is air)", value: 0.6, low: 0.55, high: 0.65, unit: 1, exp: 1 }
  - { name: "Sphere factor (6/π, a sphere fills about half of its cube)", value: 1.91, low: 1.91, high: 1.91, unit: 1, exp: 1, fixed: true }
  - { name: "Grain diameter", value: 0.5, low: 0.25, high: 1.0, unit: mm, exp: -3 }
explain: >
  Treat each grain as a small ball of diameter d: one litre (a million cubic millimetres) holds about
  0.6 × 1,000,000 × 6/π ÷ d³ grains. The diameter appears cubed, so it dominates everything: sand is
  defined as grains from 0.06 to 2 mm, and halving d multiplies the count by eight. Medium sand
  (0.25–0.5 mm) gives 10–70 million, coarse sand about one to ten million.
sources:
  - "Grain sizes: Std. (Wentworth/ISO 14688 sand fraction 0.063–2 mm; medium sand 0.25–0.5 mm)."
  - "Packing fraction: Std. (random packing of spheres 0.55–0.64)."
confidence: medium
```

## Nature and the human body (11)

```yaml
id: heartbeats
category: nature
level: 1
kind: model
question: How many times does a human heart beat in a lifetime?
answer: { central: 2800000000, low: 2000000000, high: 3500000000, unit: beat }
model:
  - { name: "Resting heart rate", value: 70, low: 60, high: 80, unit: beat/min, exp: 1 }
  - { name: "Minutes in a year (60 × 24 × 365)", value: 525600, low: 525600, high: 525600, unit: min/year, exp: 1, fixed: true }
  - { name: "Lifetime", value: 75, low: 65, high: 85, unit: year, exp: 1 }
explain: >
  About 70 beats a minute adds up to about 100,000 a day and 37 million a year. Over 75 years that
  is close to three billion beats. Heart rate is higher in childhood and during exercise, lower in
  sleep, so 70 is a reasonable lifetime average.
sources:
  - "Resting heart rate 60–100: Std. (clinical reference range; e.g. cardiac-output summaries cited in the planner notes)."
confidence: high
```

```yaml
id: scalp-hairs
category: nature
level: 2
kind: measured
question: How many hairs are on an adult's head (with a full head of hair)?
answer: { central: 100000, low: 80000, high: 150000, unit: hair }
model:
  - { name: "Scalp area with hair", value: 650, low: 500, high: 800, unit: cm², exp: 1 }
  - { name: "Hairs per square centimetre", value: 150, low: 100, high: 220, unit: hair/cm², exp: 1 }
explain: >
  The usual figure is about 100,000 hairs, with a typical range of 80,000–150,000; people with fair
  hair tend to have more, thinner hairs and people with red hair fewer, thicker ones. A hand-sized
  patch of scalp is about 100 cm², and the hairy part of the head is six or seven of those.
sources:
  - "Hair count: commonly cited clinical range 80,000–150,000 follicles, average ~100,000 (dermatology references; the hair-colour differences come from older compilations and are approximate)."
  - "Scalp area and density: approximate (not separately verified; chosen consistent with the count)."
confidence: medium
```

```yaml
id: breaths-day
category: nature
level: 1
kind: model
question: How many breaths does an adult take in one day?
answer: { central: 22000, low: 17000, high: 29000, unit: breath/day }
model:
  - { name: "Breaths per minute at rest", value: 15, low: 12, high: 20, unit: breath/min, exp: 1 }
  - { name: "Minutes in a day", value: 1440, low: 1440, high: 1440, unit: min/day, exp: 1, fixed: true }
explain: >
  A resting adult breathes 12–20 times a minute. A day has 1,440 minutes, so that is about 17,000 to
  29,000 breaths. Counting your own breaths for one minute is a good way to check one factor.
sources:
  - "Respiratory rate 12–20 per minute: Std. (clinical reference range for adults at rest)."
confidence: high
```

```yaml
id: blood-pumped
category: nature
level: 2
kind: measured
question: How many litres of blood does a resting heart pump in one day?
answer: { central: 7200, low: 5500, high: 11500, unit: L/day }
model:
  - { name: "Blood per beat (stroke volume)", value: 70, low: 60, high: 100, unit: mL/beat, exp: 1 }
  - { name: "Heart rate", value: 70, low: 60, high: 80, unit: beat/min, exp: 1 }
  - { name: "Minutes in a day", value: 1440, low: 1440, high: 1440, unit: min/day, exp: 1, fixed: true }
explain: >
  Each beat pushes about 70 mL; at 70 beats a minute that is about 5 litres a minute — the body's
  whole blood volume once a minute. Over a day it adds up to around 7,000 litres, enough to fill a
  large water tank. Physicians call this the cardiac output: 4–8 L per minute at rest.
sources:
  - "Stroke volume 60–100 mL, cardiac output 4–8 L/min (≈ 5 L/min typical): Std. (physiology reference values)."
confidence: high
```

```yaml
id: ants-earth
category: nature
level: 3
kind: measured
question: How many ants live on Earth?
answer: { central: 2.0e16, low: 5.0e15, high: 5.0e16, unit: ant }
model:
  - { name: "Ice-free land area", value: 1.3e14, low: 1.2e14, high: 1.35e14, unit: m², exp: 1 }
  - { name: "Average ants per square metre of land", value: 150, low: 40, high: 400, unit: ant/m², exp: 1 }
explain: >
  A 2022 study pooled hundreds of field counts from all continents and estimated about 20 quadrillion
  (2 × 10¹⁶) ants — roughly 2.5 million for every person, with more total biomass than all wild birds
  and mammals together. Spread over the ice-free land, that is about 150 ants per square metre on
  average, most of them in tropical forests and savannahs. The authors call the figure conservative.
sources:
  - "Ant count: Schultheiss et al. (2022), \"The abundance, biomass, and distribution of ants on Earth\", PNAS 119(40); press release https://www.uni-wuerzburg.de/en/news-and-events/news/detail/news/wie-viele-ameisen-gibt-es-eigentlich/"
  - "Land area: Std. (Earth's land 1.49 × 10⁸ km², minus about 1.6 × 10⁷ km² of ice sheets)."
  - "Ants per m²: implied by the two figures above (not an independent measurement)."
confidence: medium
```

```yaml
id: trees-earth
category: nature
level: 2
kind: measured
question: How many trees are there on Earth?
answer: { central: 3.0e12, low: 2.0e12, high: 4.0e12, unit: tree }
model:
  - { name: "Forest area", value: 4.1e9, low: 3.9e9, high: 4.2e9, unit: ha, exp: 1 }
  - { name: "Trees per hectare of forest", value: 740, low: 300, high: 1500, unit: tree/ha, exp: 1 }
explain: >
  A 2015 study combined more than 400,000 forest plots with satellite maps and counted about
  3.04 trillion trees (stems thicker than 10 cm at chest height) — over 400 per person, seven times
  more than earlier estimates. The world's forests cover about 4 billion hectares, so the count
  means roughly 700–800 trees per hectare (one tree per 13 m²) on average.
sources:
  - "Tree count: Crowther et al. (2015), \"Mapping tree density at a global scale\", Nature 525:201; https://news.yale.edu/2015/09/02/seeing-forest-and-trees-all-3-trillion-them"
  - "Forest area: FAO Global Forest Resources Assessment 2020 (4.06 billion ha, 31 % of land), https://doi.org/10.4060/ca9825en"
  - "Trees per hectare: implied (the study also counts trees outside forests, so this is an upper-side average)."
confidence: medium
```

```yaml
id: cloud-mass
category: nature
level: 2
kind: model
question: How much does the water in a small, fluffy fair-weather cloud weigh?
answer: { central: 500, low: 100, high: 2000, unit: t }
model:
  - { name: "Cloud volume", value: 1, low: 0.3, high: 3, unit: km³, exp: 1 }
  - { name: "Liquid water per cubic metre of cloud", value: 0.5, low: 0.2, high: 1.0, unit: g/m³, exp: 1 }
explain: >
  A typical fair-weather cumulus is about 1 km across, so about a cubic kilometre: a billion cubic
  metres. Each holds only about half a gram of tiny droplets, yet together that is about 500 tonnes
  of water — as heavy as about a hundred elephants, floating because the droplets are tiny and the
  air around them rises.
sources:
  - "Cloud estimate (1 km³, 0.5 g/m³, ~500 t): USGS Water Science School, https://www.usgs.gov/media/images/how-much-does-a-cloud-weigh ; Library of Congress Everyday Mysteries, https://www.loc.gov/everyday-mysteries/meteorology-climatology/item/how-much-does-a-cloud-weigh/ (after M. LeMone, NCAR)."
confidence: medium
```

```yaml
id: amazon-day
category: nature
level: 3
kind: measured
question: How many cubic metres of water does the Amazon River pour into the Atlantic Ocean on an average day?
answer: { central: 1.8e10, low: 1.0e10, high: 2.6e10, unit: m³/day }
model:
  - { name: "Width of the river", value: 2300, low: 2000, high: 2600, unit: m, exp: 1 }
  - { name: "Average depth of the river", value: 45, low: 30, high: 60, unit: m, exp: 1 }
  - { name: "Average flow speed", value: 2.0, low: 0.75, high: 2.3, unit: m/s, exp: 1 }
  - { name: "Seconds in a day", value: 86400, low: 86400, high: 86400, unit: s/day, exp: 1, fixed: true }
explain: >
  Flow = width × depth × speed. Near the town of Óbidos the Amazon squeezes into a single channel only
  about 2 km wide but tens of metres deep, flowing at up to 2 m/s. At its mouth it carries on average about
  206,000 m³ every second: about 18 billion m³ a day, roughly a fifth of all the river water that reaches
  the oceans. Width, depth and speed are rough illustrative values; the central answer is the measured mean.
sources:
  - "Mean discharge at the mouth about 206,000 m³/s (1972–2003, ±6 %): Callède et al. (2010), \"Les apports en eau de l'Amazone à l'Océan Atlantique\", Revue des sciences de l'eau 23(3), https://horizon.documentation.ird.fr/exl-doc/pleins_textes/divers17-08/010051056.pdf ; commonly cited values 205,000–224,000 m³/s, e.g. Wikipedia \"Amazon River\" (about 20 % of global river discharge), https://en.wikipedia.org/wiki/Amazon_River (verified 2026-10-17). 206,000 × 86,400 = 1.78 × 10¹⁰ m³/day."
  - "Width at Óbidos about 2 km: Encyclopaedia Britannica, \"Óbidos\", https://www.britannica.com/place/Obidos"
  - "Mean velocity at the Óbidos cross-section 0.735–2.27 m/s (low to high flow): Acta Scientiarum. Technology, https://periodicos.uem.br/actascitechnol/index.php/ActaSciTechnol/article/download/45703/751375149037/751375185441"
  - "Depth: approximate (illustrative mean depth of the Óbidos channel; not separately verified)."
confidence: medium
# Owner decision 2026-10-17: the Rhine (regional) replaced by a world-famous river.
```

```yaml
id: bee-colony
category: nature
level: 2
kind: model
question: How many worker bees live in a strong honeybee colony in early summer?
answer: { central: 50000, low: 20000, high: 80000, unit: bee }
model:
  - { name: "Eggs the queen lays per day", value: 1500, low: 1000, high: 2500, unit: egg/day, exp: 1 }
  - { name: "Adult life of a summer worker", value: 35, low: 15, high: 42, unit: day, exp: 1 }
explain: >
  In a steady state, the number of bees alive equals the rate at which new ones arrive times how
  long each one lives (the same rule estimates queues in shops or cars on a road). A queen lays up to
  about 1,500 eggs a day at the peak; a summer worker lives only about five weeks as an adult. That
  gives around 50,000 — and beekeepers report 50,000–80,000 in strong colonies.
sources:
  - "Egg-laying and colony size: University of Delaware, Mid-Atlantic Apiculture (MAAREC), \"The Colony and Its Organization\", https://canr.udel.edu/maarec/honey-bee-biology/the-colony-and-its-organization/ (up to 1,500 eggs/day; up to 80,000 workers)."
  - "Worker lifespan in summer: PBS Nature honeybee guide (15–38 days), https://www.pbs.org/wnet/nature/animal-guide-honeybee/499 ; University of Arizona activity sheet (average 42 days), https://cales.arizona.edu/pubs/insects/ahb/act12.html"
confidence: medium
```

```yaml
id: body-cells
category: nature
level: 3
kind: measured
question: How many human cells make up the body of an adult (about 70 kg)?
answer: { central: 3.0e13, low: 2.0e13, high: 4.0e13, unit: cell }
model:
  - { name: "Blood volume", value: 5, low: 4.5, high: 5.5, unit: L, exp: 1 }
  - { name: "Red blood cells per microlitre of blood", value: 5000000, low: 4200000, high: 5900000, unit: cell/µL, exp: 1 }
  - { name: "Red blood cells as share of all cells", value: 0.84, low: 0.84, high: 0.84, unit: 1, exp: -1, fixed: true }
explain: >
  Surprise: dividing body mass by the mass of a "typical" cell gives the wrong answer, because by
  number most of our cells are tiny red blood cells. A blood test counts about 5 million of them per
  microlitre; with 5 litres of blood that is 25 trillion — 84 % of all our cells, according to a 2016
  census. The total is about 30 trillion human cells (plus a similar number of bacteria).
sources:
  - "Cell count 3.0 × 10¹³ and 84 % red blood cells: Sender, Fuchs, Milo (2016), \"Revised estimates for the number of human and bacteria cells in the body\", PLoS Biology 14(8):e1002533."
  - "Red-cell count 4.2–5.9 million/µL, blood volume ~5 L: Std. (clinical reference values)."
confidence: high
```

```yaml
id: nail-growth
category: nature
level: 1
kind: measured
question: How many millimetres does a fingernail grow in one year?
answer: { central: 42, low: 25, high: 55, unit: mm/year }
model:
  - { name: "Growth per day", value: 0.115, low: 0.07, high: 0.15, unit: mm/day, exp: 1 }
  - { name: "Days in a year", value: 365, low: 365, high: 365, unit: day/year, exp: 1, fixed: true }
explain: >
  A fingernail grows about a tenth of a millimetre a day — 3.5 mm a month in a study of healthy young
  adults, more than twice as fast as toenails. That is about 4 cm a year. Small rates become
  visible when multiplied by a long time.
sources:
  - "Growth rate 3.47 mm/month: Yaemsiri et al. (2010), J Eur Acad Dermatol Venereol 24(4):420–423; BioNumbers 112380, https://bionumbers.hms.harvard.edu/bionumber.aspx?id=112380 (older studies 1.9–4.4 mm/month)."
confidence: high
```

## Technology and energy (9)

```yaml
id: lift-ride
category: technology
level: 2
kind: model
question: How much electrical energy does a lift use to carry four people up ten floors?
answer: { central: 50, low: 10, high: 150, unit: Wh }
model:
  - { name: "Mass lifted (four people)", value: 300, low: 250, high: 350, unit: kg, exp: 1 }
  - { name: "Gravitational acceleration", value: 9.81, low: 9.81, high: 9.81, unit: m/s², exp: 1, fixed: true }
  - { name: "Height of ten floors", value: 30, low: 27, high: 35, unit: m, exp: 1 }
  - { name: "Efficiency of motor and drive", value: 0.5, low: 0.3, high: 0.8, unit: 1, exp: -1 }
  - { name: "Joules in a watt-hour", value: 3600, low: 3600, high: 3600, unit: J/Wh, exp: -1, fixed: true }
explain: >
  Lifting a mass m by a height h needs at least m·g·h: 300 kg × 9.81 × 30 m ≈ 88 kJ, about 25 Wh. The
  motor and gears lose part of that, so roughly 50 Wh — the energy of a 10 W LED bulb for five hours.
  Real lifts are more complicated: a counterweight balances the empty car (plus about half the load),
  so a full car going up and an empty one going down cost similar amounts, and lights and electronics
  on standby often use more energy over a year than the rides themselves.
sources:
  - "Physics: Std. (potential energy m·g·h; g = 9.81 m/s²; 1 Wh = 3600 J)."
  - "Real lifts: ISO 25745-2 calculation method, worked example of an office lift ≈ 42 Wh per trip (planner's arithmetic from Elevator World, https://elevatorworld.com/article/an-improved-and-more-accurate-method-to-calculate-the-energy-consumption-of-a-lift ); standby share ~70 % in residential lifts (Elevator World on VDI 4707, https://elevatorworld.com/?p=41492 ). Per-trip values vary widely; marked uncertain."
confidence: low
```

```yaml
id: phone-charges
category: technology
level: 1
kind: model
question: How many full smartphone charges can you get from 1 kWh of electricity?
answer: { central: 50, low: 30, high: 90, unit: charge }
model:
  - { name: "Energy available", value: 1, low: 1, high: 1, unit: kWh, exp: 1, fixed: true }
  - { name: "Battery energy of one phone", value: 17, low: 11, high: 22, unit: Wh/charge, exp: -1 }
  - { name: "Charging efficiency", value: 0.85, low: 0.7, high: 0.9, unit: 1, exp: 1 }
explain: >
  A phone battery of 4,000–5,000 mAh at 3.85 V stores 15–19 Wh (mAh × V = mWh). With some loss in
  the charger, one charge takes about 20 Wh from the socket, so a kilowatt-hour — less than a typical
  household uses in a day — charges a phone about 50 times.
sources:
  - "Battery energy: Std. (energy = charge × voltage; typical 2020s phone batteries 4,000–5,000 mAh at 3.85 V nominal, from manufacturer specifications; approximate)."
  - "Charging efficiency: approximate (typical 70–90 %; not separately verified)."
confidence: medium
```

```yaml
id: ev-litre
category: technology
level: 2
kind: model
question: How far can an electric car drive on the energy contained in one litre of petrol?
answer: { central: 52, low: 35, high: 70, unit: km }
model:
  - { name: "Energy in one litre of petrol", value: 8.9, low: 8.8, high: 9.2, unit: kWh, exp: 1 }
  - { name: "Electric car consumption", value: 0.17, low: 0.13, high: 0.25, unit: kWh/km, exp: -1 }
explain: >
  One litre of petrol holds about 32 MJ of chemical energy, which is 8.9 kWh. A small to medium
  electric car uses 13–25 kWh per 100 km in real-world tests (including charging losses). So the
  energy of one litre would move it about 50 km — while a petrol car gets 15–20 km from it, because
  an engine turns most of the fuel's energy into heat.
sources:
  - "Petrol energy (lower heating value ~32 MJ/L): US DOE Bioenergy conversion factors (115,000 Btu/gal = 32 MJ/L); TU Delft OCW energy units table."
  - "EV consumption: ADAC Ecotest results (e.g. 2024: best 16.0 kWh/100 km, large cars above 25), https://www.automotiveworld.com/news-releases/peugeot-e-208-and-e-308-ranked-the-most-efficient-cars-on-the-market-in-the-adac-2024-ecotest/"
confidence: high
```

```yaml
id: tea-energy
category: technology
level: 2
kind: measured
question: How much energy does it take to heat the water for one cup of tea from tap temperature to boiling?
answer: { central: 23, low: 15, high: 40, unit: Wh }
model:
  - { name: "Water (one cup)", value: 0.25, low: 0.2, high: 0.4, unit: kg, exp: 1 }
  - { name: "Specific heat of water", value: 4186, low: 4186, high: 4186, unit: J/(kg·K), exp: 1, fixed: true }
  - { name: "Temperature rise", value: 80, low: 75, high: 90, unit: K, exp: 1 }
  - { name: "Joules in a watt-hour", value: 3600, low: 3600, high: 3600, unit: J/Wh, exp: -1, fixed: true }
explain: >
  Heating 1 kg of water by 1 °C takes 4.19 kJ. A cup of 0.25 kg heated by about 80 °C needs
  84 kJ = 23 Wh: a 2 kW kettle needs about 40 seconds for it. In practice people often boil twice as
  much water as they pour, and the kettle itself warms up — the commonest way to double the figure.
sources:
  - "Specific heat of water 4.186 kJ/(kg·K): Std."
  - "Cup and temperatures: assumption (tap water 10–20 °C)."
confidence: high
```

```yaml
id: airliner-fuel
category: technology
level: 3
kind: model
question: How many litres of jet fuel does a full wide-body airliner (about 300 passengers) burn flying from London to New York?
answer: { central: 50000, low: 30000, high: 80000, unit: L }
model:
  - { name: "Passengers", value: 300, low: 250, high: 350, unit: passenger, exp: 1 }
  - { name: "Fuel per passenger per kilometre", value: 0.03, low: 0.025, high: 0.045, unit: L/(passenger·km), exp: 1 }
  - { name: "Flight distance", value: 5540, low: 5540, high: 5800, unit: km, exp: 1 }
explain: >
  Modern long-haul jets burn about 3 litres per passenger per 100 km (one airline quotes 2.9 for its newest
  type; older aircraft use more). London–New York is about 5,500 km along the great circle.
  300 × 0.03 × 5,540 ≈ 50,000 litres: well over one road tanker, roughly 40 tonnes of fuel.
sources:
  - "Fuel per passenger: Lufthansa Group, \"A350 facts and figures\" (2.9 L per passenger per 100 km), https://www.lufthansagroup.com/media/newsroom/north-america/2019/q1/A350_Facts_and_figures_ENG_final.pdf"
  - "Distance: Std. (great-circle distance LHR–JFK = 5,540 km by the haversine formula from the airport coordinates; route calculators give 5,539 km). Real routes are a little longer."
confidence: medium
# Owner decision 2026-10-17: Frankfurt–New York replaced by London–New York (the busiest transatlantic route).
```

```yaml
id: aa-petrol
category: technology
level: 3
kind: model
question: How many AA alkaline batteries hold as much energy as one litre of petrol?
answer: { central: 3000, low: 2000, high: 4500, unit: battery }
model:
  - { name: "Energy in one litre of petrol", value: 8900, low: 8800, high: 9200, unit: Wh, exp: 1 }
  - { name: "Energy delivered by one AA battery", value: 3, low: 2, high: 4.2, unit: Wh/battery, exp: -1 }
explain: >
  An AA alkaline cell is rated about 2.5–2.8 Ah and delivers on average about 1.2 V as it runs down,
  so about 3 Wh (less under heavy load). A litre of petrol holds about 8,900 Wh: the same as some
  3,000 batteries, which would weigh about 70 kg. This is why fuels are so hard to replace.
sources:
  - "AA capacity 2,450–2,800 mAh: manufacturer datasheets and retailer specifications (e.g. Farnell alkaline AA datasheet, https://www.farnell.com/datasheets/86310.pdf ); Wh value derived (approximate)."
  - "Petrol energy: as in task ev-litre."
confidence: medium
```

```yaml
id: solar-panel
category: technology
level: 2
kind: model
question: How much electricity does one square metre of solar panel produce in a year, on average for new solar farms around the world, in kilowatt-hours?
answer: { central: 290, low: 150, high: 450, unit: kWh/year }
model:
  - { name: "Sunlight on which panel ratings are based", value: 1000, low: 1000, high: 1000, unit: W/m², exp: 1, fixed: true }
  - { name: "Panel area", value: 1, low: 1, high: 1, unit: m², exp: 1, fixed: true }
  - { name: "Panel efficiency", value: 0.21, low: 0.18, high: 0.23, unit: 1, exp: 1 }
  - { name: "Average output as a share of the rated power (capacity factor)", value: 0.16, low: 0.10, high: 0.25, unit: 1, exp: 1 }
  - { name: "Hours in a year", value: 8760, low: 8760, high: 8760, unit: h/year, exp: 1, fixed: true }
explain: >
  Panels are rated in full sunlight of 1,000 W per square metre; a modern panel turns about a fifth of it
  into electricity, about 210 W per m². But there is night, cloud and low winter sun: worldwide, new solar
  farms deliver on average only about 16 % of their rated power. Over the 8,760 hours of a year that gives
  about 290 kWh per square metre, roughly what a fridge uses in a year. In sunny deserts it is more, in
  cloudy regions less.
sources:
  - "Capacity factor: IRENA, Renewable Power Generation Costs in 2023 (global weighted-average capacity factor of new utility-scale PV 16.2 % in 2023, 13.8 % in 2010), reported by pv magazine, https://www.pv-magazine.com/2024/09/27/global-average-solar-lcoe-stood-at-0-044-kwh-in-2023-says-irena/ (verified 2026-10-17)."
  - "Rated sunlight 1,000 W/m²: Std. (standard test conditions, IEC 61215)."
  - "Panel efficiency: approximate (commercial modules of the 2020s about 20–23 %)."
confidence: medium
# Owner decision 2026-10-17: reframed from "in Germany" (DWD irradiation) to the world average of new solar farms.
# Check: 1000 × 1 × 0.21 × 0.16 × 8760 Wh = 294 kWh (0.006 decades from 290).
```

```yaml
id: body-power
category: technology
level: 3
kind: measured
question: What is the average heat output of a human body, in watts?
answer: { central: 100, low: 70, high: 150, unit: W }
model:
  - { name: "Food energy per day", value: 2000, low: 1600, high: 3000, unit: kcal/day, exp: 1 }
  - { name: "Joules in a kilocalorie", value: 4184, low: 4184, high: 4184, unit: J/kcal, exp: 1, fixed: true }
  - { name: "Seconds in a day", value: 86400, low: 86400, high: 86400, unit: s/day, exp: -1, fixed: true }
explain: >
  Almost all the food energy we use ends up as heat. 2,000 kcal a day is 8.4 MJ; spread over the
  86,400 seconds of a day that is about 100 W — a person is roughly an old-fashioned light bulb, which is
  why a full room warms up.
sources:
  - "Conversion 1 kcal = 4.184 kJ: Std. Daily energy need 2,000 kcal: reference value used on food labels (EU Regulation 1169/2011, Annex XIII)."
confidence: high
```

```yaml
id: car-lifetime-fuel
category: technology
level: 1
kind: model
question: How many litres of fuel does a petrol car burn over its whole life?
answer: { central: 14000, low: 7000, high: 30000, unit: L }
model:
  - { name: "Distance driven over its life", value: 200000, low: 150000, high: 300000, unit: km, exp: 1 }
  - { name: "Fuel consumption", value: 0.07, low: 0.05, high: 0.1, unit: L/km, exp: 1 }
explain: >
  A car is typically driven 150,000–300,000 km before it is scrapped, and a petrol car uses about
  5–10 litres per 100 km. That gives about 14,000 litres: some 280 full 50-litre tanks.
sources:
  - "Lifetime distance and consumption: assumptions (typical values; no single official figure). Marked as a model answer."
confidence: low
```

## Society (9)

```yaml
id: piano-tuners
category: society
level: 2
kind: model
question: How many full-time piano tuners can a city of one million people keep busy?
answer: { central: 25, low: 8, high: 100, unit: tuner }
model:
  - { name: "Inhabitants", value: 1000000, low: 1000000, high: 1000000, unit: person, exp: 1, fixed: true }
  - { name: "People per household", value: 2.5, low: 2, high: 5, unit: person/household, exp: -1 }
  - { name: "Pianos per household", value: 0.05, low: 0.02, high: 0.1, unit: piano/household, exp: 1 }
  - { name: "Tunings per piano per year", value: 1, low: 0.5, high: 1.5, unit: tuning/(piano·year), exp: 1 }
  - { name: "Tunings one tuner does per year (4 a day, 200 working days)", value: 800, low: 600, high: 1000, unit: tuning/(tuner·year), exp: -1 }
explain: >
  Enrico Fermi's classic question. With 2.5 people per household, a million people live in 400,000
  households; one in twenty with a piano gives 20,000 pianos and 20,000 tunings a year. A tuner manages
  about four a day, some 800 a year, so the city needs about 25. There is no official count: the point is
  that every factor can be guessed and errors in different directions partly cancel. Household size varies
  a lot around the world, from about 2 to over 5.
sources:
  - "Household size: UN DESA, Household Size and Composition Around the World 2017 (country averages 2 to 9 persons; most of Europe, North America and Japan below 3), https://www.un.org/en/development/desa/population/publications/pdf/popfacts/PopFacts_2017-2.pdf (verified 2026-10-17)."
  - "Piano share, tunings per year, tuner workload: assumptions (no reliable statistics found; model answer)."
confidence: low
# Owner decision 2026-10-17: German household size (2.0, Destatis) replaced by a world-oriented 2.5 (range 2–5).
```

```yaml
id: births-day
category: society
level: 2
kind: measured
question: How many babies are born worldwide every day?
answer: { central: 360000, low: 330000, high: 390000, unit: birth/day }
model:
  - { name: "World population", value: 8.2e9, low: 8.0e9, high: 8.3e9, unit: person, exp: 1 }
  - { name: "Births per person per year (crude birth rate)", value: 0.016, low: 0.015, high: 0.018, unit: 1/year, exp: 1 }
  - { name: "Days in a year", value: 365, low: 365, high: 365, unit: day/year, exp: -1, fixed: true }
explain: >
  The UN counts about 132 million births a year — about 16 per 1,000 people. Divided by 365 days that
  is about 360,000 a day, or four every second. About 170,000 people die each day, which is why the
  world population is still growing, though more slowly than before.
sources:
  - "Births ~132 million/year, crude birth rate 16.0 ‰, deaths ~62 million/year: UN World Population Prospects 2024, via INED, https://www.ined.fr/en/everything_about_population/data/all-countries and Statistics Times, https://www.statisticstimes.com/m/demographics/world-death-and-birth-rate.php (year-dependent; review)."
confidence: high
```

```yaml
id: birthdays-today
category: society
level: 1
kind: measured
question: How many people in the world have their birthday today?
answer: { central: 22000000, low: 20000000, high: 24000000, unit: person }
model:
  - { name: "World population", value: 8.2e9, low: 8.0e9, high: 8.3e9, unit: person, exp: 1 }
  - { name: "Days in a year", value: 365, low: 365, high: 365, unit: 1, exp: -1, fixed: true }
explain: >
  Birthdays are spread almost evenly over the year (some months have a few per cent more births), so
  about one person in 365 has a birthday on any given day: about 22 million — more than the population of
  most countries.
sources:
  - "World population ~8.2 billion (2025): UN World Population Prospects 2024 (review yearly)."
confidence: high
```

```yaml
id: lifetime-sleep
category: society
level: 1
kind: model
question: How many years of a 75-year life does a person spend asleep?
answer: { central: 25, low: 20, high: 30, unit: year }
model:
  - { name: "Lifetime", value: 75, low: 75, high: 75, unit: year, exp: 1, fixed: true }
  - { name: "Sleep per day", value: 8, low: 6.5, high: 9.5, unit: h, exp: 1 }
  - { name: "Hours in a day", value: 24, low: 24, high: 24, unit: h, exp: -1, fixed: true }
explain: >
  The share of the day spent asleep is the share of life spent asleep. Adults sleep about 7–8 hours,
  babies and children much more, so about a third of life: some 25 years.
sources:
  - "Sleep duration: approximate (adults commonly 7–8 h; children 9–14 h); simple proportion."
confidence: medium
```

```yaml
id: people-airborne
category: society
level: 3
kind: model
question: On average, how many people are on board a passenger plane in the air at any moment?
answer: { central: 1300000, low: 700000, high: 2000000, unit: person }
model:
  - { name: "Passenger trips per year", value: 4.9e9, low: 4.5e9, high: 5.0e9, unit: trip/year, exp: 1 }
  - { name: "Average time in the air per trip", value: 2.4, low: 1.5, high: 3, unit: h/trip, exp: 1 }
  - { name: "Hours in a year", value: 8760, low: 8760, high: 8760, unit: h/year, exp: -1, fixed: true }
explain: >
  Airlines carried about 4.9 billion passengers in 2024. An average trip is about 1,900 km, at roughly
  800 km/h some 2.4 hours. Passenger-hours per year divided by the hours in a year gives the number
  in the air at once: about 1.3 million — the population of a large city, flying. (By day there are
  more, at night fewer.)
sources:
  - "Passengers 2024 ≈ 4.9 billion: IATA, https://www.iata.org/en/pressroom/2025-releases/2025-01-30-01/ (reported via news coverage, e.g. https://newmobility.news/en/2025/01/31/iata-never-as-many-airline-passengers-as-in-2024/ )."
  - "Average trip ≈ 1,930 km: ICAO 2019 (8,686 billion passenger-km ÷ 4.5 billion passengers), https://icao.int/annual-report-2019/Pages/the-world-of-air-transport-in-2019.aspx ; cruising speed ~800 km/h approximate."
confidence: medium
```

```yaml
id: lifetime-walking
category: society
level: 2
kind: model
question: How many kilometres does a person walk in a lifetime?
answer: { central: 96000, low: 40000, high: 200000, unit: km }
model:
  - { name: "Steps per day", value: 5000, low: 3000, high: 10000, unit: step/day, exp: 1 }
  - { name: "Step length", value: 0.7, low: 0.6, high: 0.8, unit: m/step, exp: 1 }
  - { name: "Days in a year", value: 365, low: 365, high: 365, unit: day/year, exp: 1, fixed: true }
  - { name: "Lifetime", value: 75, low: 65, high: 85, unit: year, exp: 1 }
explain: >
  Smartphone data from 700,000 people in 111 countries showed an average of about 5,000 steps a day
  (phones miss some steps, so the true figure is somewhat higher). At 0.7 m a step that is 3.5 km a day
  and nearly 100,000 km in 75 years: about two and a half times around the Earth.
sources:
  - "Steps per day: Althoff et al. (2017), \"Large-scale physical activity data reveal worldwide activity inequality\", Nature 547:336; summary https://www.nih.gov/node/34651"
  - "Step length: approximate (adult walking step 0.6–0.8 m)."
confidence: medium
```

```yaml
id: smartphones-year
category: society
level: 3
kind: measured
question: How many new smartphones are sold worldwide in one year?
answer: { central: 1.25e9, low: 0.9e9, high: 1.6e9, unit: phone/year }
model:
  - { name: "World population", value: 8.2e9, low: 8.0e9, high: 8.3e9, unit: person, exp: 1 }
  - { name: "Share of people using a smartphone", value: 0.55, low: 0.45, high: 0.7, unit: 1, exp: 1 }
  - { name: "Years before a phone is replaced", value: 3.6, low: 2.5, high: 5, unit: year, exp: -1 }
explain: >
  Market researchers count about 1.25 billion smartphones shipped in 2025, a number that has stayed
  between 1.2 and 1.5 billion for a decade. A replacement model explains it: if about half of all
  people use a smartphone and replace it every three to four years, about 1.2–1.3 billion new ones
  are needed each year.
sources:
  - "Shipments 2025 ≈ 1.25 billion: IDC forecast December 2025 and preliminary full-year data, https://www.idc.com/promo/smartphone-market-share ; https://www.malaysianwireless.com/2025/12/idc-billion-smartphones-ship-worldwide/ (review yearly)."
  - "Smartphone share and replacement cycle: approximate (chosen to be consistent; not separately verified)."
confidence: medium
```

```yaml
id: teachers-city
category: society
level: 1
kind: model
question: How many school teachers does a city of one million people need for its pupils aged 6 to 17?
answer: { central: 10000, low: 4500, high: 30000, unit: teacher }
model:
  - { name: "Inhabitants", value: 1000000, low: 1000000, high: 1000000, unit: person, exp: 1, fixed: true }
  - { name: "Share of inhabitants aged 6 to 17", value: 0.14, low: 0.10, high: 0.22, unit: pupil/person, exp: 1 }
  - { name: "Pupils per teacher", value: 14, low: 7, high: 23, unit: pupil/teacher, exp: -1 }
explain: >
  Children under 15 make up about 17 % of the population in OECD countries and about 25 % worldwide, so the
  twelve school years from 6 to 17 cover roughly 12–20 % of the inhabitants. Across OECD countries there are
  on average about 14 pupils per teacher in primary school and 13 in lower secondary school, from about 7 to
  over 20. A million people therefore need roughly 10,000 teachers.
sources:
  - "Pupils per teacher: OECD, Education at a Glance 2024, indicator D2 (average 14 in primary, 13 in lower secondary, 2022 data; later editions: from 7 in Greece to 23 in Mexico), https://www.oecd.org/en/publications/education-at-a-glance-2024_c00cad36-en/full-report/what-is-the-student-teacher-ratio-and-how-large-are-classes-and-schools_bb95b097 (verified 2026-10-17)."
  - "Share aged 6–17: derived (OECD young population 0–14: 17.3 % in 2022, OECD Data; world 25 %, World Bank 2022 via Wikipedia \"European countries by percent of population aged 0-14\"; twelve of fifteen cohorts ≈ 14 % for the OECD, up to about 20 % worldwide)."
confidence: medium
# Owner decision 2026-10-17: replaces city-water (German household water use, Umweltbundesamt), which had no
# comparable world or OECD figure.
```

```yaml
id: world-cars
category: society
level: 2
kind: measured
question: How many motor vehicles (cars, vans, lorries, buses) are in use worldwide?
answer: { central: 1.5e9, low: 1.1e9, high: 1.9e9, unit: vehicle }
model:
  - { name: "World population", value: 8.2e9, low: 8.0e9, high: 8.3e9, unit: person, exp: 1 }
  - { name: "People per vehicle (world average)", value: 5.5, low: 4, high: 7.5, unit: person/vehicle, exp: -1 }
explain: >
  The car makers' association counted about 1.1 billion vehicles in 2011 and about 1.5 billion by
  2023 — about one for every five or six people. The average hides huge differences: in many rich
  countries there is more than one vehicle for every two people, in many poor countries fewer than
  one per twenty.
sources:
  - "Vehicles in use: OICA (2011: 1,097 million), https://www.oica.net/wp-content/uploads/2013/09/OICA-Francfort-2013ok.pdf ; ≈ 1.55 billion 2023 per OICA as cited by Wikipedia \"Motor vehicle\", https://en.wikipedia.org/wiki/Motor_vehicle (secondary; review)."
confidence: medium
```

## Space and physics (9)

```yaml
id: sunlight-time
category: space
level: 1
kind: measured
question: How many seconds does sunlight take to reach the Earth?
answer: { central: 499, low: 490, high: 508, unit: s }
model:
  - { name: "Distance Sun–Earth", value: 149600000, low: 147100000, high: 152100000, unit: km, exp: 1 }
  - { name: "Speed of light", value: 299792, low: 299792, high: 299792, unit: km/s, exp: -1, fixed: true }
explain: >
  The Earth is about 150 million km from the Sun (1 astronomical unit) and light travels almost
  300,000 km a second, so sunlight is about 8 minutes 20 seconds old when it arrives. Over the year the
  distance changes by about 3 %, so the time varies between about 490 and 508 seconds.
sources:
  - "1 au = 149,597,870.7 km: Std. (IAU 2012). Speed of light 299,792.458 km/s: Std. (SI definition). Perihelion/aphelion 147.1/152.1 million km: NASA Earth Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html"
confidence: high
```

```yaml
id: earths-in-sun
category: space
level: 3
kind: measured
question: By volume, how many Earths would fit inside the Sun?
answer: { central: 1300000, low: 1250000, high: 1350000, unit: 1 }
model:
  - { name: "Radius of the Sun", value: 695700, low: 695700, high: 695700, unit: km, exp: 3 }
  - { name: "Radius of the Earth", value: 6371, low: 6371, high: 6371, unit: km, exp: -3 }
explain: >
  The Sun's radius is about 109 times the Earth's. Volume grows with the cube of the radius, so the
  Sun's volume is 109 × 109 × 109 ≈ 1.3 million Earths. Getting the ratio of radii a little wrong
  matters three times over: a radius ratio of 100 would give 1 million, one of 150 would give 3.4
  million.
sources:
  - "Nominal solar radius 695,700 km: Std. (IAU 2015 Resolution B3). Mean Earth radius 6,371 km: NASA Earth Fact Sheet."
confidence: high
```

```yaml
id: drive-to-moon
category: space
level: 1
kind: measured
question: How many days would it take to drive to the Moon at a steady 100 km/h, without stopping?
answer: { central: 160, low: 150, high: 170, unit: day }
model:
  - { name: "Distance Earth–Moon", value: 384400, low: 363000, high: 406000, unit: km, exp: 1 }
  - { name: "Speed", value: 100, low: 100, high: 100, unit: km/h, exp: -1, fixed: true }
  - { name: "Hours in a day", value: 24, low: 24, high: 24, unit: h/day, exp: -1, fixed: true }
explain: >
  The Moon is on average 384,400 km away — about ten times around the Earth. At 100 km/h that is
  3,844 hours, or about 160 days of non-stop driving: more than five months.
sources:
  - "Mean Earth–Moon distance 384,400 km (perigee ~363,000, apogee ~406,000): NASA Moon Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html"
confidence: high
```

```yaml
id: drop-molecules
category: space
level: 3
kind: measured
question: How many water molecules are in a single drop of water?
answer: { central: 1.7e21, low: 1.0e21, high: 3.3e21, unit: molecule }
model:
  - { name: "Mass of a drop", value: 0.05, low: 0.03, high: 0.1, unit: g, exp: 1 }
  - { name: "Molar mass of water", value: 18, low: 18, high: 18, unit: g/mol, exp: -1, fixed: true }
  - { name: "Avogadro constant", value: 6.022e23, low: 6.022e23, high: 6.022e23, unit: molecule/mol, exp: 1, fixed: true }
explain: >
  A drop is about 0.05 mL (20 drops make a millilitre), which weighs 0.05 g. 18 g of water is one mole,
  6 × 10²³ molecules. So a drop holds about 1.7 × 10²¹ molecules — more molecules than there are
  drops of water in a large lake.
sources:
  - "Avogadro constant 6.02214076 × 10²³ /mol: Std. (SI definition). Molar mass of water 18.015 g/mol: Std."
  - "Drop volume ~0.05 mL: Std. (pharmacopoeia standard dropper: 20 drops per mL)."
confidence: high
```

```yaml
id: equator-speed
category: space
level: 2
kind: measured
question: How fast does a point on the equator move because the Earth spins, in km/h?
answer: { central: 1670, low: 1660, high: 1680, unit: km/h }
model:
  - { name: "Circumference of the Earth at the equator", value: 40075, low: 40075, high: 40075, unit: km, exp: 1 }
  - { name: "Length of one rotation", value: 24, low: 23.93, high: 24, unit: h, exp: -1 }
explain: >
  The equator is about 40,000 km long — the metre was once defined so that a quarter meridian is
  10,000 km. One turn takes a day, so a point on the equator travels about 1,670 km/h: faster than
  the speed of sound. We do not feel it because the motion is steady.
sources:
  - "Equatorial radius 6,378.137 km (circumference 40,075 km): Std. (WGS 84). Sidereal day 23.93 h: NASA Earth Fact Sheet."
confidence: high
```

```yaml
id: iss-day
category: space
level: 2
kind: measured
question: How many kilometres does the International Space Station travel in one day?
answer: { central: 660000, low: 650000, high: 675000, unit: km/day }
model:
  - { name: "Orbits per day", value: 15.5, low: 15.5, high: 15.9, unit: orbit/day, exp: 1 }
  - { name: "Length of one orbit (2π × (6,371 + 420) km)", value: 42700, low: 42500, high: 42800, unit: km/orbit, exp: 1 }
explain: >
  The station circles about 420 km above the ground, so its orbit is only slightly longer than the
  equator: about 42,700 km. It completes an orbit in about 92 minutes, 15.5 a day, flying at about
  7.7 km/s. In one day it covers about 660,000 km — the distance to the Moon and most of the way back.
sources:
  - "Orbits per day 15.5–15.9, period 90–93 min: NASA Earth Observatory / JSC, \"Space Station Orbit Tutorial\", https://eol.jsc.nasa.gov/Tools/orbitTutorial.htm ; altitude about 400–420 km (varies with reboosts)."
confidence: high
```

```yaml
id: atmosphere-mass
category: space
level: 3
kind: measured
question: What is the total mass of the Earth's atmosphere, in kilograms?
answer: { central: 5.1e18, low: 5.0e18, high: 5.3e18, unit: kg }
model:
  - { name: "Air pressure at sea level", value: 101325, low: 101325, high: 101325, unit: Pa, exp: 1, fixed: true }
  - { name: "Surface area of the Earth", value: 5.1e14, low: 5.1e14, high: 5.1e14, unit: m², exp: 1 }
  - { name: "Gravitational acceleration", value: 9.81, low: 9.81, high: 9.81, unit: m/s², exp: -1, fixed: true }
explain: >
  Air pressure is the weight of all the air above each square metre: about 10 tonnes per m². Multiply
  by the Earth's surface (510 million km²) and divide by g: about 5.3 × 10¹⁸ kg. The measured value is
  5.1 × 10¹⁸ kg, slightly less because mountains and high ground stick up into the air.
sources:
  - "Atmosphere mass 5.1 × 10¹⁸ kg, surface pressure: NASA Earth Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html ; standard atmosphere 101,325 Pa and g = 9.80665 m/s²: Std."
confidence: high
```

```yaml
id: sun-mass-loss
category: space
level: 3
kind: measured
question: How many kilograms of mass does the Sun turn into light every second?
answer: { central: 4.3e9, low: 4.2e9, high: 4.3e9, unit: kg/s }
model:
  - { name: "Power radiated by the Sun", value: 3.828e26, low: 3.828e26, high: 3.828e26, unit: W, exp: 1 }
  - { name: "Speed of light", value: 299792458, low: 299792458, high: 299792458, unit: m/s, exp: -2, fixed: true }
explain: >
  Einstein's E = mc² works both ways: radiating energy means losing mass. The Sun radiates
  3.8 × 10²⁶ watts; dividing by c² (9 × 10¹⁶ m²/s²) gives about 4.3 billion kg every second — yet over
  the Sun's whole life so far that is less than a tenth of a per cent of its mass.
sources:
  - "Nominal solar luminosity 3.828 × 10²⁶ W: Std. (IAU 2015 Resolution B3). c = 299,792,458 m/s: Std."
confidence: high
```

```yaml
id: ocean-mass
category: space
level: 3
kind: measured
question: How many kilograms of water are in all the Earth's oceans?
answer: { central: 1.4e21, low: 1.3e21, high: 1.45e21, unit: kg }
model:
  - { name: "Ocean area", value: 3.61e14, low: 3.6e14, high: 3.62e14, unit: m², exp: 1 }
  - { name: "Average ocean depth", value: 3682, low: 3600, high: 3800, unit: m, exp: 1 }
  - { name: "Density of seawater", value: 1025, low: 1020, high: 1030, unit: kg/m³, exp: 1 }
explain: >
  The oceans cover 71 % of the Earth, about 361 million km², with an average depth of about 3.7 km.
  That is 1.33 billion km³ of water; at just over a tonne per cubic metre it weighs about 1.4 × 10²¹ kg —
  yet that is only about 0.02 % of the Earth's mass.
sources:
  - "Average depth 3,682 m and volume 1.332 × 10⁹ km³ (Charette & Smith 2010): NOAA Ocean Explorer, https://oceanexplorer.noaa.gov/facts/ocean-depth.html ; NIST, https://www.nist.gov/pml/owm/how-deep-are-earths-oceans"
  - "Ocean area 361 million km², seawater density ~1,025 kg/m³: Std."
confidence: high
```

---

## Verification notes

Verified by web search on 2026-10-17 (sources above): London rainfall (Met Office via Wikipedia), crowd density, rice grain weight, EFSA water intake, Mehl 2007, paper thickness, ant count, tree count, FAO forest area, cloud mass, Amazon mean discharge (IRD), width and velocity at Óbidos, bee colony biology, human cell count, nail growth, lift energy method, petrol energy, EV consumption, AA capacity, IRENA solar capacity factor, airline passengers and passenger-km, A350 fuel per passenger, world births and deaths, OECD pupil–teacher ratios, OECD and world young-population shares, UN household sizes, vehicles in use, steps per day, atmosphere mass, ocean depth and volume, ISS orbits.

Standard values used without a search (textbook or SI/IAU constants): air density, specific heat of water, g, speed of light, astronomical unit, solar and Earth radii, Earth–Moon distance, equatorial circumference, Avogadro constant, molar mass of water, kcal, standard atmosphere, sand grain classes, packing fraction, respiratory and heart-rate reference ranges, blood values, LHR–JFK distance (computed), IFAB pitch sizes.

**Not verified / approximate (marked in the task):** speaking rate (words-per-day), scalp area and hair density (scalp-hairs), river depth (amazon-day, illustrative only), phone battery and charging efficiency, panel efficiency (solar-panel), car lifetime distance, piano ownership and tuner workload (no statistics found; model answer), smartphone share and replacement cycle, average airborne time per trip (derived from ICAO 2019 distance and an assumed speed).

## Internationalisation (owner decision, 2026-10-17)

Tasks that only made sense with German context were replaced or reframed, and every replaced number was
re-verified by web search on 2026-10-17 (sources in the blocks above): `rain-roof` (Berlin → London),
`rhine-day` → `amazon-day`, `solar-panel` (Germany → world average of new solar farms), `city-water` →
`teachers-city`, `airliner-fuel` (Frankfurt → London), `piano-tuners` (household size). The code checks in
`packages/games/fermi-lab/test/content.test.ts` pass for all 46 tasks (largest deviation of a reference
product from its central value: 0.021 decades, `bee-colony`).

## Review schedule

Values that drift: world population (births-day, birthdays-today, smartphones-year, world-cars), births per year, air passengers, smartphone shipments, vehicles in use, the solar capacity factor (IRENA, yearly), OECD pupil–teacher ratios. Review these once a year; a change within the plausible range needs no update.
