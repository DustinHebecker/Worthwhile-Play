# Sense of Time (`timeline`): content (178 events)

Status: **implemented, 2026-10-26.** Researched by the planner of the new-games pipeline (game 5); every date re-checked and the owner's decisions applied by the implementer the same day (§ 3a, § 6). Source for `packages/games/timeline/src/events.ts` (language-neutral data) and `src/content/<locale>.ts` (wording). Design: [timeline.md](timeline.md).

The list is kept as structured data in a scratchpad script that writes both `events.ts`, `content/en.ts` and this file, so the canonical numbers below were computed, not typed; `test/content.test.ts` re-checks every rule of § 1.

## 1. How to read this file

| Field | Meaning |
|---|---|
| `id` | Stable id (stored in saves; never renamed or removed — a withdrawn event gets `retired: true`). |
| **Shown date** | How the date reads in English after answering. "about … (range …)" = approximate, with the accepted range; a single year = known to the year; "(span)" = the event lasted from … to …. |
| Data literal | What goes into `events.ts`. `year Y [LO…HI]`: **astronomical years** (integers): 1 CE = 1, 1 BCE = 0, 2 BCE = −1, so *n* BCE = 1 − *n*; `LO` is the older end. `ago A [OLD…YOUNG]`: years before present as the source states them ("before present" = before 1950, the convention of radiocarbon dating and geology); the code converts with `year = 1950 − ago` (design § 5.1). No bracket = known to the year. `span …`: the event lasted from the first to the second value; for scoring and the axis its whole interval counts and its midpoint is its position. |
| `cat` | `earth` (Earth and life), `science` (science and medicine), `tech` (technology), `culture` (art, writing, buildings, music), `explore` (journeys and exploration), `everyday` (food, money, games, sport, daily life), `history` (rulers, wars, politics; at most 10 %, owner decision). |
| `region` | Where it happened: `africa`, `americas`, `asia`, `europe`, `oceania` (UN M49 macro-regions; Cyprus, the Caucasus and Turkey count as Asia) or `world` (global, oceans, Antarctica, space, or no single region). |
| `tier` | 1 = widely known anchor (easy), 2 = known to many (medium), 3 = less known or surprising (hard). |
| Title | Shown **before** answering; must never contain its own date (test). Own wording. |
| Note | One sentence shown **after** answering. Own wording, may contain numbers. |
| Source | Bibliographic reference(s) for the date (facts are not copyrightable; nothing is copied). |
| Check | **✓** = the date was checked on 2026-10-26: by the planner against the cited sources, or by the implementer against the reference article named after "re-checked" (that article is now cited as well; `checked` in `events.ts`). No date is unchecked. |

**Era** (for the `span` setting) is derived from `y`: `deep` if 1,000,000 years ago or older (`y ≤ 1950 − 1,000,000`), `early` if `y < 500`, `middle` if `y < 1800`, else `modern`.

**Display regimes** (design § 5.3): `y < −9999` (older than 10,000 BCE) is shown as "years ago"; otherwise as a calendar year (BCE, or CE without a marker from 1000 CE on).

## 2. Statistics

Events: **178** (138 points, 40 spans). Checked by the planner or when added: **52**; re-checked by the implementer: **126**; unchecked: 0. Rulers, wars and politics (`history`): 8 (4.5 %). Curated "surprising pairs": 12.

### 2.1 Era × region

| Era | africa | americas | asia | europe | oceania | world | total |
|---|---|---|---|---|---|---|---|
| deep | 3 | 9 | 3 | 1 | 2 | 10 | 28 |
| early | 10 | 8 | 17 | 7 | 2 | 3 | 47 |
| middle | 5 | 7 | 20 | 12 | 2 | 1 | 47 |
| modern | 4 | 11 | 13 | 16 | 3 | 9 | 56 |
| **all** | **22** | **35** | **53** | **36** | **9** | **23** | **178** |

Human history only (early, middle, modern; 150 events): africa 19 (13 %), americas 26 (17 %), asia 50 (33 %), europe 35 (23 %), oceania 7 (5 %), world 13 (9 %). Europe is about a quarter of the human events; Asia, Africa, the Americas and Oceania together about two thirds.

### 2.2 Era × category

| Era | earth | science | tech | culture | explore | everyday | history |
|---|---|---|---|---|---|---|---|
| deep | 25 | 0 | 2 | 0 | 1 | 0 | 0 |
| early | 4 | 5 | 7 | 19 | 3 | 6 | 3 |
| middle | 1 | 13 | 7 | 14 | 6 | 3 | 3 |
| modern | 7 | 19 | 10 | 6 | 6 | 6 | 2 |
| **all** | **37** | **37** | **26** | **39** | **16** | **15** | **8** |

### 2.3 Era × tier and verification

| Era | tier 1 | tier 2 | tier 3 | spans | ✓ planner / when added | ✓ re-checked |
|---|---|---|---|---|---|---|
| deep | 5 | 16 | 7 | 4 | 12 | 16 |
| early | 11 | 23 | 13 | 13 | 19 | 28 |
| middle | 10 | 30 | 7 | 18 | 16 | 31 |
| modern | 16 | 32 | 8 | 5 | 5 | 51 |

## 3. Events

Each block: **title** (shown before answering) · shown date · canonical `y [lo, hi]` · cat · region · tier · check; then the note (shown after answering) and the source.

### 3.1 Deep time: Earth and life (1 million years ago and older) — 28 events

**`earth-forms`** — The Earth forms from dust and rock around the young Sun  
about 4.54 billion years ago (range 4.59–4.49 billion years ago) · `ago 4.54e9 [4.59e9…4.49e9]` · earth · world · tier 1 · ✓  
*Note:* Radiometric ages of meteorites and of the oldest Earth and Moon samples agree on about 4.54 billion years, give or take some 50 million.  
*Source:* Dalrymple, G. B. (2001), "The age of the Earth in the twentieth century: a problem (mostly) solved", Geological Society, London, Special Publications 190: 205–221; USGS, "Age of the Earth" (pubs.usgs.gov/gip/geotime/age.html).

**`moon-forms`** — The Moon forms after a giant collision with the young Earth  
about 4.51 billion years ago (range 4.53–4.35 billion years ago) · `ago 4.51e9 [4.53e9…4.35e9]` · earth · world · tier 2 · ✓ re-checked against Wikipedia, "Origin of the Moon"  
*Note:* The leading explanation is that a body about the size of Mars struck the Earth and the debris gathered into the Moon; published ages range from about 4.53 to 4.35 billion years.  
*Source:* Barboni, M. et al. (2017), "Early formation of the Moon 4.51 billion years ago", Science Advances 3: e1602365; Canup, R. & Asphaug, E. (2001), Nature 412: 708–712; Wikipedia, "Origin of the Moon".

**`oldest-zircon`** — The oldest known pieces of the Earth crystallise: tiny zircon grains later found in the Jack Hills of Western Australia  
about 4.40 billion years ago (range 4.41–4.37 billion years ago) · `ago 4.4e9 [4.41e9…4.37e9]` · earth · oceania · tier 3 · ✓ re-checked against Wikipedia, "Jack Hills"  
*Note:* The grains are smaller than a grain of sand, yet they show that solid crust and probably liquid water existed only about 150 million years after the Earth formed.  
*Source:* Wilde, S. A. et al. (2001), Nature 409: 175–178; Valley, J. W. et al. (2014), "Hadean age for a post-magma-ocean zircon confirmed by atom-probe tomography", Nature Geoscience 7: 219–223; Wikipedia, "Jack Hills".

**`first-life`** — The oldest widely accepted traces of life: layered mounds built by microbes in the Pilbara, Western Australia  
about 3.48 billion years ago (range 3.50–3.43 billion years ago) · `ago 3.48e9 [3.5e9…3.43e9]` · earth · oceania · tier 2 · ✓ re-checked against Wikipedia, "Dresser Formation"  
*Note:* These stromatolites were built by mats of microbes; older claims of 3.7 billion years and more exist but are still debated.  
*Source:* Djokic, T. et al. (2017), "Earliest signs of life on land preserved in ca. 3.5 Ga hot spring deposits", Nature Communications 8: 15263; Allwood, A. C. et al. (2006), Nature 441: 714–718; Wikipedia, "Dresser Formation".

**`oxygen`** — The Great Oxidation Event: oxygen starts to build up in the air  
about 2.40 billion years ago (range 2.46–2.22 billion years ago) · `ago 2.4e9 [2.46e9…2.22e9]` · earth · world · tier 2 · ✓ re-checked against Wikipedia, "Great Oxidation Event"  
*Note:* Oxygen made by microbes began to accumulate in the atmosphere; the change took place over about 200 million years.  
*Source:* Poulton, S. W. et al. (2021), "A 200-million-year delay in permanent atmospheric oxygenation", Nature 592: 232–236; Gumsley, A. P. et al. (2017), PNAS 114: 1811–1816; Wikipedia, "Great Oxidation Event".

**`snowball`** — "Snowball Earth": ice sheets reach the tropics  
720–635 million years ago (span) · `span ago 7.2e8…6.35e8` · earth · world · tier 3 · ✓ re-checked against Wikipedia, "Cryogenian"  
*Note:* During the Cryogenian period the Earth went through at least two glaciations so extensive that ice reached the Equator.  
*Source:* International Commission on Stratigraphy, International Chronostratigraphic Chart v2024/12 (Cryogenian: 720 to about 635 Ma); Hoffman, P. F. et al. (2017), Science Advances 3: e1600983.

**`ediacaran`** — Some of the first large, complex living things grow on the seafloor at Mistaken Point, Newfoundland  
about 570 million years ago (range 574–564 million years ago) · `ago 5.7e8 [5.74e8…5.64e8]` · earth · americas · tier 3 · ✓  
*Note:* The frond-shaped Ediacaran organisms of Mistaken Point were buried by volcanic ash, which allows unusually precise dating.  
*Source:* Matthews, J. J. et al. (2021), "A chronostratigraphic framework for the rise of the Ediacaran macrobiota: new constraints from Mistaken Point Ecological Reserve, Newfoundland", GSA Bulletin 133: 612–624 (574.17 ± 0.66 to 564.13 ± 0.65 Ma).

**`cambrian`** — The "Cambrian explosion": most major groups of animals appear in the fossil record  
539–515 million years ago (span) · `span ago 5.39e8…5.15e8` · earth · world · tier 2 · ✓  
*Note:* Within a geologically short time, animals with shells, legs and eyes appear; the Chengjiang fossils of Yunnan (China) are one famous window on it.  
*Source:* International Commission on Stratigraphy, Chart v2024/12 (base of the Cambrian 538.8 ± 0.2 Ma); Wikipedia, "Geologic time scale" (checked 2026-10-26); Hou, X. et al. (2017), The Cambrian Fossils of Chengjiang, China, 2nd ed., Wiley.

**`land-plants`** — The first plants on land leave their spores in rocks now found in Argentina  
about 471 million years ago (range 473–465 million years ago) · `ago 4.71e8 [4.73e8…4.65e8]` · earth · americas · tier 2 · ✓ re-checked against Wikipedia, "Embryophyte"  
*Note:* The oldest known spores of land plants are tiny and belong to plants like liverworts, only a few centimetres tall.  
*Source:* Rubinstein, C. V. et al. (2010), "Early Middle Ordovician evidence for land plants in Argentina (eastern Gondwana)", New Phytologist 188: 365–369; Wikipedia, "Embryophyte".

**`first-sharks`** — The earliest known shark-like scales  
about 450 million years ago (range 455–445 million years ago) · `ago 4.5e8 [4.55e8…4.45e8]` · earth · world · tier 3 · ✓  
*Note:* A few scales from the Late Ordovician are the oldest fossil evidence of sharks or their close relatives; sharks are older than trees.  
*Source:* Natural History Museum, London, "Shark evolution: a 450 million year timeline" (nhm.ac.uk, checked 2026-10-26).

**`oldest-forest`** — The oldest known fossil forest grows near what is now Cairo, New York  
about 386 million years ago (range 388–384 million years ago) · `ago 3.86e8 [3.88e8…3.84e8]` · earth · americas · tier 3 · ✓  
*Note:* Fossil root systems of early trees, including Archaeopteris, show that forests existed a few million years earlier than previously known.  
*Source:* Stein, W. E. et al. (2020), "Mid-Devonian Archaeopteris roots signal revolutionary change in earliest fossil forests", Current Biology 30: 421–431.

**`tiktaalik`** — Tiktaalik, a fish with limb-like fins, lives in what is now Arctic Canada  
about 375 million years ago (range 376–374 million years ago) · `ago 3.75e8 [3.76e8…3.74e8]` · earth · americas · tier 2 · ✓ re-checked against Wikipedia, "Tiktaalik"  
*Note:* Tiktaalik had gills and scales, but also a neck and sturdy fins with wrist-like bones: a step between fish and four-legged animals.  
*Source:* Daeschler, E. B., Shubin, N. H. & Jenkins, F. A. (2006), "A Devonian tetrapod-like fish and the evolution of the tetrapod body plan", Nature 440: 757–763; Wikipedia, "Tiktaalik".

**`great-dying`** — The largest mass extinction: most species in the sea die out at the end of the Permian  
about 251.9 million years ago (range 252.0–251.8 million years ago) · `ago 2.519e8 [2.52e8…2.518e8]` · earth · world · tier 2 · ✓ re-checked against Wikipedia, "Permian–Triassic extinction event"  
*Note:* Huge volcanic eruptions in Siberia are the main suspect; roughly four in five marine species disappeared.  
*Source:* International Commission on Stratigraphy, Chart v2024/12 (base of the Triassic 251.902 ± 0.024 Ma); Burgess, S. D. et al. (2014), PNAS 111: 3316–3321; Wikipedia, "Permian–Triassic extinction event".

**`first-dinosaurs`** — Some of the earliest known dinosaurs live in Ischigualasto, Argentina  
about 230 million years ago (range 233–228 million years ago) · `ago 2.3e8 [2.33e8…2.28e8]` · earth · americas · tier 1 · ✓  
*Note:* Early dinosaurs such as Eoraptor and Herrerasaurus were small to medium-sized and shared their world with many other reptiles.  
*Source:* Martínez, R. N. et al. (2011), "A basal dinosaur from the dawn of the dinosaur era in southwestern Pangaea", Science 331: 206–210.

**`first-mammals`** — Small, shrew-like early mammals such as Morganucodon appear  
about 205 million years ago (range 210–200 million years ago) · `ago 2.05e8 [2.1e8…2e8]` · earth · world · tier 2 · ✓ re-checked against Wikipedia, "Morganucodon" — note corrected: "about 140 million years" (205 → 66 Ma)  
*Note:* Early mammals were mostly small, probably active at night, and lived alongside the dinosaurs for about 140 million years.  
*Source:* Kemp, T. S. (2005), The Origin and Evolution of Mammals, Oxford University Press; Kielan-Jaworowska, Z., Cifelli, R. & Luo, Z.-X. (2004), Mammals from the Age of Dinosaurs, Columbia University Press; Wikipedia, "Morganucodon".

**`atlantic-opens`** — The supercontinent Pangaea splits and the Atlantic Ocean begins to open  
about 190 million years ago (range 200–175 million years ago) · `ago 1.9e8 [2e8…1.75e8]` · earth · world · tier 2 · ✓ re-checked against Wikipedia, "Atlantic Ocean"  
*Note:* The Atlantic still widens by a few centimetres a year, about as fast as fingernails grow.  
*Source:* Labails, C. et al. (2010), "An alternative early opening scenario for the Central Atlantic Ocean", Earth and Planetary Science Letters 297: 355–368.

**`stegosaurus`** — Stegosaurus, with its plates and spiked tail, lives in western North America  
155–145 million years ago (span) · `span ago 1.55e8…1.45e8` · earth · americas · tier 2 · ✓ re-checked against Wikipedia, "Stegosaurus" — changed: span 155–150 → 155–145 Ma (Kimmeridgian–Tithonian)  
*Note:* Stegosaurus fossils come mainly from the Morrison Formation of the western United States; related finds come from Portugal.  
*Source:* Maidment, S. C. R. et al. (2015), "Bodyplan of Stegosaurus stenops", PLoS ONE 10: e0138352; Wikipedia, "Stegosaurus".

**`archaeopteryx`** — Archaeopteryx, a feathered dinosaur close to the first birds, lives in what is now Bavaria  
about 150 million years ago (range 152–148 million years ago) · `ago 1.5e8 [1.52e8…1.48e8]` · earth · europe · tier 2 · ✓ re-checked against Wikipedia, "Archaeopteryx"  
*Note:* Its fossils from the fine limestone of Solnhofen show feathers, teeth and a long bony tail.  
*Source:* Rauhut, O. W. M., Foth, C. & Tischlinger, H. (2018), "The oldest Archaeopteryx", PeerJ 6: e4191; Wikipedia, "Archaeopteryx".

**`flowers`** — Some of the oldest known flowering plants (Archaefructus) grow in Liaoning, China  
about 125 million years ago (range 126–124 million years ago) · `ago 1.25e8 [1.26e8…1.24e8]` · earth · asia · tier 2 · ✓ re-checked against Wikipedia, "Archaefructus"  
*Note:* Flowering plants spread late in the age of dinosaurs; today they make up most plant species.  
*Source:* Sun, G. et al. (2002), "Archaefructaceae, a new basal angiosperm family", Science 296: 899–904; Wikipedia, "Archaefructus".

**`t-rex`** — Tyrannosaurus rex lives in western North America  
68–66 million years ago (span) · `span ago 6.8e7…6.6e7` · earth · americas · tier 1 · ✓ re-checked against Wikipedia, "Tyrannosaurus"  
*Note:* T. rex lived only in the last few million years before the asteroid impact; it lived closer in time to us than to Stegosaurus.  
*Source:* Wikipedia, "Tyrannosaurus" (Maastrichtian, about 68–66 Ma); Fowler, D. W. (2017), PLoS ONE 12: e0188426.

**`dino-extinction`** — An asteroid strikes Chicxulub (Mexico) and the non-bird dinosaurs die out  
about 66.0 million years ago (range 66.05–65.95 million years ago) · `ago 6.6e7 [6.605e7…6.595e7]` · earth · americas · tier 1 · ✓  
*Note:* The impact left a crater about 180 km wide; birds are the dinosaurs that survived.  
*Source:* Renne, P. R. et al. (2013), "Time scales of critical events around the Cretaceous-Paleogene boundary", Science 339: 684–687 (66.043 ± 0.011 Ma); ICS Chart v2024/12.

**`himalaya`** — India collides with Asia and the Himalayas begin to rise  
about 52 million years ago (range 55–50 million years ago) · `ago 5.2e7 [5.5e7…5e7]` · earth · asia · tier 2 · ✓  
*Note:* The most often quoted age of the collision is 55 to 50 million years ago; how to define "collision" is still debated, and the mountains are still rising.  
*Source:* Najman, Y. et al. (2010), "Timing of India-Asia collision", Journal of Geophysical Research 115: B12416; Hu, X. et al. (2016), Earth-Science Reviews 160: 264–299.

**`antarctic-ice`** — A lasting ice sheet forms on Antarctica  
about 33.9 million years ago (range 34.1–33.6 million years ago) · `ago 3.39e7 [3.41e7…3.36e7]` · earth · world · tier 3 · ✓ re-checked against Wikipedia, "Antarctic ice sheet"  
*Note:* As carbon dioxide fell and ocean currents changed, Antarctica froze over; it has been covered by ice ever since.  
*Source:* Zachos, J. et al. (2001), "Trends, rhythms, and aberrations in global climate 65 Ma to present", Science 292: 686–693; ICS Chart v2024/12 (Eocene/Oligocene boundary 33.9 Ma); Wikipedia, "Antarctic ice sheet".

**`stone-tools`** — The oldest known stone tools are made at Lomekwi, Kenya  
about 3.3 million years ago (range 3.4–3.2 million years ago) · `ago 3.3e6 [3.4e6…3.2e6]` · tech · africa · tier 2 · ✓  
*Note:* They are older than the earliest known members of our genus Homo, so they were probably made by earlier human relatives.  
*Source:* Harmand, S. et al. (2015), "3.3-million-year-old stone tools from Lomekwi 3, West Turkana, Kenya", Nature 521: 310–315.

**`lucy`** — "Lucy", an early human relative (Australopithecus afarensis), lives in the Afar region of Ethiopia  
about 3.18 million years ago (range 3.22–3.18 million years ago) · `ago 3.18e6 [3.22e6…3.18e6]` · earth · africa · tier 1 · ✓ re-checked against Wikipedia, "Lucy (hominid)" — source title updated  
*Note:* Lucy walked upright but had a brain about the size of a chimpanzee's; her skeleton is about 40 % complete.  
*Source:* Johanson, D. C. & Taieb, M. (1976), Nature 260: 293–297; Wikipedia, "Lucy (hominid)" (3.22–3.18 Ma).

**`panama`** — The Isthmus of Panama closes and joins North and South America  
about 2.8 million years ago (range 3.0–2.7 million years ago) · `ago 2.8e6 [3e6…2.7e6]` · earth · americas · tier 3 · ✓  
*Note:* Animals could now walk between the continents, and the ocean currents of the Atlantic and Pacific were separated.  
*Source:* O'Dea, A. et al. (2016), "Formation of the Isthmus of Panama", Science Advances 2: e1600883.

**`dmanisi`** — Early humans reach the Caucasus: tools and fossils at Dmanisi, Georgia  
about 1.8 million years ago (range 1.85–1.77 million years ago) · `ago 1.8e6 [1.85e6…1.77e6]` · explore · asia · tier 2 · ✓  
*Note:* Dmanisi holds the oldest human fossils known outside Africa; even older stone tools have since been reported from China.  
*Source:* Ferring, R. et al. (2011), "Earliest human occupations at Dmanisi (Georgian Caucasus) dated to 1.85–1.78 Ma", PNAS 108: 10432–10436.

**`fire`** — The earliest secure evidence of fire used by human relatives (Wonderwerk Cave, South Africa)  
about 1.0 million years ago (range 1.07–0.9 million years ago) · `ago 1e6 [1.07e6…900000]` · tech · africa · tier 2 · ✓  
*Note:* Burned bone and plant ash inside the cave show that fires burned there, probably tended by Homo erectus.  
*Source:* Berna, F. et al. (2012), "Microstratigraphic evidence of in situ fire in the Acheulean strata of Wonderwerk Cave", PNAS 109: E1215–E1220.

### 3.2 Early humans and the ancient world (from 1 million years ago to 499 CE) — 47 events

**`homo-sapiens`** — The oldest known fossils of our own species, Homo sapiens, are left at Jebel Irhoud, Morocco  
about 315,000 years ago (range 349,000–281,000 years ago) · `ago 315000 [349000…281000]` · earth · africa · tier 1 · ✓  
*Note:* Our species is older than once thought and its early fossils come from several parts of Africa.  
*Source:* Richter, D. et al. (2017), "The age of the hominin fossils from Jebel Irhoud, Morocco, and the origins of the Middle Stone Age", Nature 546: 293–296.

**`blombos`** — The oldest known drawing: a cross-hatched pattern in red ochre on a stone flake (Blombos Cave, South Africa)  
about 73,000 years ago (range 75,000–71,000 years ago) · `ago 73000 [75000…71000]` · culture · africa · tier 2 · ✓  
*Note:* Nine fine lines were drawn with an ochre crayon on a smoothed stone surface.  
*Source:* Henshilwood, C. S. et al. (2018), "An abstract drawing from the 73,000-year-old levels at Blombos Cave, South Africa", Nature 562: 115–118.

**`australia`** — People are living in Australia, having crossed the sea from Southeast Asia  
about 55,000 years ago (range 65,000–47,000 years ago) · `ago 55000 [65000…47000]` · explore · oceania · tier 2 · ✓  
*Note:* Sites in northern Australia show people there by at least about 50,000 years ago, possibly 65,000; the exact date is debated.  
*Source:* Clarkson, C. et al. (2017), "Human occupation of northern Australia by 65,000 years ago", Nature 547: 306–310; O'Connell, J. F. et al. (2018), PNAS 115: 8482–8490.

**`sulawesi-art`** — The oldest known figurative painting: a pig and human-like figures in a cave on Sulawesi, Indonesia  
about 53,500 years ago (range 55,800–51,200 years ago) · `ago 53500 [55800…51200]` · culture · asia · tier 2 · ✓  
*Note:* The painting is at least 51,200 years old; the oldest known pictures of animals are in Southeast Asia, not in Europe.  
*Source:* Oktaviana, A. A. et al. (2024), "Narrative cave art in Indonesia by 51,200 years ago", Nature 631: 814–818.

**`flutes`** — The oldest known musical instruments: flutes of bird bone and mammoth ivory (Swabian Jura, Germany)  
about 42,500 years ago (range 43,000–42,000 years ago) · `ago 42500 [43000…42000]` · culture · europe · tier 2 · ✓  
*Note:* Holes were carefully drilled so that the flutes could play several notes.  
*Source:* Higham, T. et al. (2012), "Testing models for the beginnings of the Aurignacian and the advent of figurative art and music", Journal of Human Evolution 62: 664–676.

**`chauvet`** — Lions, horses and rhinos are painted in Chauvet Cave, France  
about 35,000 years ago (range 37,000–33,500 years ago) · `ago 35000 [37000…33500]` · culture · europe · tier 2 · ✓ re-checked against Wikipedia, "Chauvet Cave"  
*Note:* The paintings were made in two main phases and were sealed by a rock fall, which kept them intact.  
*Source:* Quiles, A. et al. (2016), "A high-precision chronological model for the decorated Upper Paleolithic cave of Chauvet-Pont d'Arc", PNAS 113: 4670–4675; Wikipedia, "Chauvet Cave".

**`last-glacial-max`** — Ice sheets reach their greatest size in the last ice age  
26,500–19,000 years ago (span) · `span ago 26500…19000` · earth · world · tier 2 · ✓ re-checked against Wikipedia, "Last Glacial Maximum"  
*Note:* Sea level was about 120 m lower than today, so people could walk from Asia to America and from mainland Asia to many islands.  
*Source:* Clark, P. U. et al. (2009), "The Last Glacial Maximum", Science 325: 710–714.

**`pottery`** — The oldest known pottery is made in Xianrendong Cave, China  
about 20,000 years ago (range 20,500–19,000 years ago) · `ago 20000 [20500…19000]` · tech · asia · tier 2 · ✓  
*Note:* Hunter-gatherers made cooking pots about 10,000 years before farming began in the region.  
*Source:* Wu, X. et al. (2012), "Early pottery at 20,000 years ago in Xianrendong Cave, China", Science 336: 1696–1700.

**`bread`** — The oldest known bread: flatbread baked by hunter-gatherers at Shubayqa, Jordan  
about 14,400 years ago (range 14,600–14,200 years ago) · `ago 14400 [14600…14200]` · everyday · asia · tier 2 · ✓  
*Note:* It was made from wild cereals and tubers, thousands of years before anyone farmed.  
*Source:* Arranz-Otaegui, A. et al. (2018), "Archaeobotanical evidence reveals the origins of bread 14,400 years ago in northeastern Jordan", PNAS 115: 7925–7930.

**`clovis`** — Clovis spear points are made across North America  
13,050–12,750 years ago (span) · `span ago 13050…12750` · tech · americas · tier 3 · ✓  
*Note:* The finely flaked Clovis points were made for only about 300 years; people had reached the Americas earlier.  
*Source:* Waters, M. R. et al. (2020), "The age of Clovis — 13,050 to 12,750 cal yr B.P.", Science Advances 6: eaaz0455.

**`farming`** — Farming begins in the Fertile Crescent: wheat, barley and lentils are sown  
about 9500 BCE (range 10000–9000 BCE) · `year -9499 [-9999…-8999]` · everyday · asia · tier 1 · ✓ re-checked against Wikipedia, "Neolithic Revolution"  
*Note:* Farming started independently in several regions of the world; this region of Southwest Asia is one of the earliest.  
*Source:* Zeder, M. A. (2011), "The origins of agriculture in the Near East", Current Anthropology 52 (S4): S221–S235; Wikipedia, "Neolithic Revolution".

**`holocene`** — The last ice age ends and the present warm period, the Holocene, begins  
about 9700 BCE (range 9800–9600 BCE) · `year -9699 [-9799…-9599]` · earth · world · tier 2 · ✓ re-checked against Wikipedia, "Holocene"  
*Note:* Geologists date the start to 11,700 years before the year 2000, from layers in a Greenland ice core.  
*Source:* Walker, M. et al. (2009), "Formal definition and dating of the GSSP for the base of the Holocene using the Greenland NGRIP ice core", Journal of Quaternary Science 24: 3–17.

**`gobekli`** — Great stone circles with carved pillars are built at Göbekli Tepe, Turkey  
about 9600 BCE (range 9750–9300 BCE) · `year -9599 [-9749…-9299]` · culture · asia · tier 2 · ✓  
*Note:* Its builders were still hunters and gatherers; the site is about 7,000 years older than Stonehenge's large stones.  
*Source:* Dietrich, O. et al. (2013), "The role of cult and feasting in the emergence of Neolithic communities", Antiquity 86: 674–695; German Archaeological Institute, "The Tepe Telegrams: dating" (dainst.blog, checked 2026-10-26).

**`cat`** — A person is buried together with a cat on Cyprus  
about 7500 BCE (range 7600–7200 BCE) · `year -7499 [-7599…-7199]` · everyday · asia · tier 3 · ✓ re-checked against Wikipedia, "Cat" — changed: range 7600–7300 → 7600–7200 BCE (burial dated 7500–7200 BCE)  
*Note:* Cats do not live wild on Cyprus, so people must have brought them by boat; this is the oldest known close bond between people and cats.  
*Source:* Vigne, J.-D. et al. (2004), "Early taming of the cat in Cyprus", Science 304: 259; Wikipedia, "Cat".

**`maize`** — Maize is domesticated from a wild grass, teosinte, in southern Mexico  
about 6750 BCE (range 7100–6500 BCE) · `year -6749 [-7099…-6499]` · everyday · americas · tier 2 · ✓ re-checked against Wikipedia, "Maize"  
*Note:* Teosinte has a few hard kernels per ear; people turned it into maize over thousands of years.  
*Source:* Matsuoka, Y. et al. (2002), PNAS 99: 6080–6084; Piperno, D. R. et al. (2009), "Starch grain and phytolith evidence for early ninth millennium B.P. maize from the Central Balsas River Valley, Mexico", PNAS 106: 5019–5024; Wikipedia, "Maize".

**`dufuna`** — The Dufuna canoe is carved from a single tree trunk in what is now Nigeria  
about 6300 BCE (range 6556–6005 BCE) · `year -6299 [-6555…-6004]` · tech · africa · tier 3 · ✓  
*Note:* It is the oldest known boat in Africa and one of the oldest in the world; it was found in 1987 by a herder digging a well.  
*Source:* Breunig, P. (1996), "The 8000-year-old dugout canoe from Dufuna (NE Nigeria)", in Pwiti, G. & Soper, R. (eds.), Aspects of African Archaeology, University of Zimbabwe Publications; Wikipedia, "Dufuna canoe" (checked 2026-10-26).

**`wheel`** — The first wheeled vehicles appear in Mesopotamia and Europe  
about 3500 BCE (range 3600–3300 BCE) · `year -3499 [-3599…-3299]` · tech · world · tier 1 · ✓ re-checked against Wikipedia, "Wheel"  
*Note:* Wheels and carts appear at about the same time over a wide area, so it is unclear where they were first made.  
*Source:* Anthony, D. W. (2007), The Horse, the Wheel, and Language, Princeton University Press, ch. 4; Bakker, J. A. et al. (1999), Antiquity 73: 778–790.

**`cacao`** — The oldest known use of cacao, in the upper Amazon (Santa Ana–La Florida, Ecuador)  
about 3400 BCE (range 3500–3350 BCE) · `year -3399 [-3499…-3349]` · everyday · americas · tier 3 · ✓  
*Note:* Residues in pots show that people of the Mayo-Chinchipe culture used cacao about 1,500 years before it appears in Mexico.  
*Source:* Zarrillo, S. et al. (2018), "The use and domestication of Theobroma cacao during the mid-Holocene in the upper Amazon", Nature Ecology & Evolution 2: 1879–1888.

**`egypt-writing`** — The earliest Egyptian hieroglyphs are written on small labels in a tomb at Abydos  
about 3250 BCE (range 3400–3150 BCE) · `year -3249 [-3399…-3149]` · culture · africa · tier 2 · ✓ re-checked against Wikipedia, "Egyptian hieroglyphs" — changed: range 3320–3150 → 3400–3150 BCE (Abydos labels dated 3400–3200 BCE)  
*Note:* Writing appeared in Egypt and in Mesopotamia at roughly the same time, in different forms.  
*Source:* Dreyer, G. (1998), Umm el-Qaab I, Mainz: von Zabern; Baines, J. (2004), "The earliest Egyptian writing", in Houston, S. (ed.), The First Writing, Cambridge University Press; Wikipedia, "Egyptian hieroglyphs".

**`cuneiform`** — Writing develops in Mesopotamia: clay tablets from the city of Uruk  
about 3200 BCE (range 3400–3100 BCE) · `year -3199 [-3399…-3099]` · culture · asia · tier 1 · ✓ re-checked against Wikipedia, "Cuneiform"  
*Note:* The first tablets mostly count goods such as grain and sheep; stories and letters came later.  
*Source:* Woods, C. (ed.) (2010), Visible Language: Inventions of Writing in the Ancient Middle East and Beyond, Oriental Institute, University of Chicago; Wikipedia, "Cuneiform".

**`great-pyramid`** — The Great Pyramid of Giza is completed  
about 2560 BCE (range 2600–2500 BCE) · `year -2559 [-2599…-2499]` · culture · africa · tier 1 · ✓ re-checked against Wikipedia, "Great Pyramid of Giza"  
*Note:* For almost 4,000 years it was the tallest structure built by people.  
*Source:* Lehner, M. (1997), The Complete Pyramids, Thames & Hudson; Wikipedia, "Great Pyramid of Giza".

**`stonehenge`** — The large sarsen stones of Stonehenge are raised (England)  
about 2500 BCE (range 2600–2400 BCE) · `year -2499 [-2599…-2399]` · culture · europe · tier 1 · ✓ re-checked against Wikipedia, "Stonehenge"  
*Note:* The earliest earthwork there is about 500 years older; the big stones came later.  
*Source:* English Heritage, "History of Stonehenge"; Darvill, T. et al. (2012), "Stonehenge remodelled", Antiquity 86: 1021–1040.

**`caral`** — Caral, one of the oldest cities of the Americas, flourishes in the Supe Valley of Peru  
2600–2000 BCE (span) · `span year -2599…-1999` · culture · americas · tier 3 · ✓  
*Note:* Caral had pyramids, plazas and irrigation, at about the same time as the Great Pyramid of Giza.  
*Source:* Shady Solís, R., Haas, J. & Creamer, W. (2001), "Dating Caral, a preceramic site in the Supe Valley on the central coast of Peru", Science 292: 723–726.

**`indus`** — Planned cities of the Indus civilisation, such as Mohenjo-daro and Harappa, flourish  
2600–1900 BCE (span) · `span year -2599…-1899` · culture · asia · tier 2 · ✓ re-checked against Wikipedia, "Indus Valley Civilisation"  
*Note:* The cities had straight streets, brick houses, wells and covered drains.  
*Source:* Possehl, G. L. (2002), The Indus Civilization: A Contemporary Perspective, AltaMira Press; Wikipedia, "Indus Valley Civilisation".

**`mammoths`** — The last woolly mammoths die out on Wrangel Island in the Arctic Ocean  
about 2050 BCE (range 2200–1900 BCE) · `year -2049 [-2199…-1899]` · earth · asia · tier 2 · ✓  
*Note:* Mammoths survived on this island for about 6,000 years after rising seas cut it off (about 10,000 years ago) — still alive when the Great Pyramid was built.  
*Source:* Arppe, L. et al. (2019), "Thriving or surviving? The isotopic record of the Wrangel Island woolly mammoth population", Quaternary Science Reviews 222: 105884; University of Tübingen press release, 7 Oct 2019 (checked 2026-10-26); Dehasque, M. et al. (2024), "Temporal dynamics of woolly mammoth genome erosion prior to extinction", Cell 187: 3531–3540 (isolation about 10,000 years ago, survival for about 6,000 years; reviewer check 2026-10-27).

**`plimpton`** — A Babylonian scribe writes a clay tablet listing right-angled triangles in whole numbers (Plimpton 322)  
about 1790 BCE (range 1822–1762 BCE) · `year -1789 [-1821…-1761]` · science · asia · tier 3 · ✓ re-checked against Wikipedia, "Plimpton 322"  
*Note:* The tablet lists number triples such as those used in the Pythagorean theorem, more than a thousand years before Pythagoras.  
*Source:* Robson, E. (2001), "Neither Sherlock Holmes nor Babylon: a reassessment of Plimpton 322", Historia Mathematica 28: 167–206.

**`oracle-bones`** — The oldest known Chinese writing is carved on oracle bones at Anyang  
1250–1050 BCE (span) · `span year -1249…-1049` · culture · asia · tier 2 · ✓ re-checked against Wikipedia, "Oracle bone script"  
*Note:* The characters asked questions about harvests, weather and health; many are ancestors of characters still used today.  
*Source:* Keightley, D. N. (1978), Sources of Shang History, University of California Press; Wikipedia, "Oracle bone script".

**`olmec`** — Colossal stone heads are carved by the Olmec at San Lorenzo, Mexico  
1200–900 BCE (span) · `span year -1199…-899` · culture · americas · tier 3 · ✓ re-checked against Wikipedia, "San Lorenzo Tenochtitlán"  
*Note:* The largest heads weigh many tonnes; the basalt was moved from mountains dozens of kilometres away.  
*Source:* Diehl, R. A. (2004), The Olmecs: America's First Civilization, Thames & Hudson; Wikipedia, "San Lorenzo Tenochtitlán".

**`nok`** — Terracotta sculptures of the Nok culture are made in central Nigeria  
900 BCE–1 CE (span) · `span year -899…1` · culture · africa · tier 3 · ✓ re-checked against Wikipedia, "Nok culture"  
*Note:* They are among the oldest known large sculptures of sub-Saharan Africa.  
*Source:* Breunig, P. & Rupp, N. (2016), "An outline of recent studies on the Nigerian Nok culture", Journal of African Archaeology 14: 237–255.

**`lapita`** — Lapita seafarers found the first settlement in Tonga  
about 888 BCE (range 896–880 BCE) · `year -887 [-895…-879]` · explore · oceania · tier 3 · ✓  
*Note:* Coral files from the founding layer at Nukuleka were dated very precisely; Lapita voyagers were ancestors of the Polynesians.  
*Source:* Burley, D., Weisler, M. I. & Zhao, J. (2012), "High precision U/Th dating of first Polynesian settlement", PLoS ONE 7: e48769 (2838 ± 8 BP).

**`olympics`** — The first Olympic Games recorded at Olympia, Greece  
about 776 BCE (range 790–760 BCE) · `year -775 [-789…-759]` · everyday · europe · tier 1 · ✓ re-checked against Wikipedia, "Ancient Olympic Games"  
*Note:* This is the traditional date from ancient lists of winners; games may have been held there earlier.  
*Source:* Wikipedia, "Ancient Olympic Games"; Golden, M. (2004), Sport in the Ancient World from A to Z, Routledge.

**`nazca`** — Huge lines and figures are drawn in the desert of southern Peru (Nazca lines)  
500 BCE–500 CE (span) · `span year -499…500` · culture · americas · tier 2 · ✓ re-checked against Wikipedia, "Nazca lines"  
*Note:* Removing dark surface stones uncovered lighter ground; some figures are hundreds of metres long.  
*Source:* UNESCO World Heritage List no. 700, "Lines and Geoglyphs of Nasca and Palpa"; Wikipedia, "Nazca lines".

**`alexander`** — Lifetime of Alexander the Great, king of Macedon  
356–323 BCE (span) · `span year -355…-322` · history · europe · tier 1 · ✓  
*Note:* His campaigns from Greece to the Indus created one of the largest empires of the ancient world; it split into rival kingdoms soon after his death.  
*Source:* Wikipedia, "Alexander the Great" (checked 2026-10-26); Bosworth, A. B. (1988), Conquest and Empire: The Reign of Alexander the Great, Cambridge University Press.

**`euclid`** — Euclid writes his Elements in Alexandria  
about 300 BCE (range 310–280 BCE) · `year -299 [-309…-279]` · science · africa · tier 3 · ✓ re-checked against Wikipedia, "Euclid"  
*Note:* The Elements built geometry from a few basic statements and was used as a textbook for more than 2,000 years.  
*Source:* Heath, T. L. (1908), The Thirteen Books of Euclid's Elements, Cambridge University Press; Wikipedia, "Euclid".

**`ashoka`** — Ashoka rules the Maurya Empire in South Asia  
268–232 BCE (span) · `span year -267…-231` · history · asia · tier 2 · ✓  
*Note:* After a brutal war against Kalinga he had edicts carved on rocks and pillars across his empire, calling for restraint and tolerance; they are among the oldest deciphered texts of India.  
*Source:* Wikipedia, "Ashoka" (reign c. 268–232 BCE; checked 2026-10-26); Thapar, R. (1961), Aśoka and the Decline of the Mauryas, Oxford University Press.

**`eratosthenes`** — Eratosthenes estimates the size of the Earth from shadows in Egypt  
about 240 BCE (range 250–230 BCE) · `year -239 [-249…-229]` · science · africa · tier 2 · ✓ re-checked against Wikipedia, "Eratosthenes"  
*Note:* He compared the Sun's angle in Syene and Alexandria; his result was within roughly 2–15 % of the true value, depending on the length of his unit (reviewer check 2026-10-27 against Wikipedia, "Earth's circumference": −2.4 % to +0.8 % with a stadion of 155–160 m, 10–15 % with the Olympic or Italian stadion).  
*Source:* Wikipedia, "Eratosthenes"; Dutka, J. (1993), "Eratosthenes' measurement of the Earth reconsidered", Archive for History of Exact Sciences 46: 55–66.

**`terracotta`** — The Terracotta Army is made for the tomb of China's first emperor  
246–208 BCE (span) · `span year -245…-207` · culture · asia · tier 1 · ✓ re-checked against Wikipedia, "Terracotta Army"  
*Note:* Thousands of life-size clay soldiers, each with its own face, were buried near Xi'an.  
*Source:* UNESCO World Heritage List no. 441, "Mausoleum of the First Qin Emperor"; Wikipedia, "Terracotta Army".

**`zhang-qian`** — Zhang Qian travels from China to Central Asia, opening contacts that grow into the Silk Roads  
138–126 BCE (span) · `span year -137…-125` · explore · asia · tier 3 · ✓ re-checked against Wikipedia, "Zhang Qian"  
*Note:* He was held captive for years on the way; his reports made the Han court aware of the lands to the west.  
*Source:* Wikipedia, "Zhang Qian"; Hansen, V. (2012), The Silk Road: A New History, Oxford University Press.

**`cleopatra`** — Lifetime of Cleopatra VII, the last ruler of Ptolemaic Egypt  
69–30 BCE (span) · `span year -68…-29` · culture · africa · tier 1 · ✓ re-checked against Wikipedia, "Cleopatra"  
*Note:* She lived closer in time to the first Moon landing than to the building of the Great Pyramid.  
*Source:* Wikipedia, "Cleopatra"; Roller, D. W. (2010), Cleopatra: A Biography, Oxford University Press.

**`long-count`** — The earliest known date in the Mesoamerican Long Count calendar is carved at Chiapa de Corzo, Mexico  
36 BCE · `year -35` · science · americas · tier 3 · ✓ re-checked against Wikipedia, "Mesoamerican Long Count calendar"  
*Note:* The Long Count counts days from a fixed starting point, like a very long odometer.  
*Source:* Wikipedia, "Mesoamerican Long Count calendar" (Stela 2, Chiapa de Corzo: 7.16.3.2.13, December 36 BCE).

**`nero-fire`** — A great fire destroys much of Rome during the reign of Emperor Nero  
64 CE · `year 64` · history · europe · tier 2 · ✓  
*Note:* The fire burned for about nine days; Nero, emperor from 54 to 68 CE, then built his vast Golden House on part of the cleared land.  
*Source:* Tacitus, Annals 15.38–44; Wikipedia, "Great Fire of Rome" (checked 2026-10-26).

**`teotihuacan`** — The Pyramid of the Sun is built at Teotihuacan, Mexico  
about 200 CE (range 100–310 CE) · `year 200 [100…310]` · culture · americas · tier 2 · ✓  
*Note:* Its date is debated (1st century, or about 170–310 CE by recent excavations); Teotihuacan was one of the largest cities in the world at its height.  
*Source:* Sugiyama, N., Sugiyama, S. & Sarabia G., A. (2013), "Inside the Sun Pyramid at Teotihuacan, Mexico: 2008–2011 excavations and preliminary results", Latin American Antiquity 24: 403–432; Sload, R. (2015), "When was the Sun Pyramid built?", Latin American Antiquity 26: 221–241.

**`cai-lun`** — Cai Lun presents an improved way of making paper to the Han court  
105 CE · `year 105` · tech · asia · tier 1 · ✓ re-checked against Wikipedia, "Cai Lun"  
*Note:* Older paper fragments exist, but his method, using bark, hemp and old rags, made paper practical.  
*Source:* Fan Ye, Book of the Later Han (Hou Hanshu), biography of Cai Lun; Tsien, T.-H. (1985), Paper and Printing, in Needham, J. (ed.), Science and Civilisation in China 5/1, Cambridge University Press.

**`pantheon`** — The Pantheon in Rome is completed  
about 125 CE (range 113–128 CE) · `year 125 [113…128]` · tech · europe · tier 2 · ✓ re-checked against Wikipedia, "Pantheon, Rome"  
*Note:* Its concrete dome is still the largest dome of unreinforced concrete in the world.  
*Source:* Wikipedia, "Pantheon, Rome"; MacDonald, W. L. (1976), The Pantheon: Design, Meaning, and Progeny, Harvard University Press.

**`zhang-heng`** — Zhang Heng builds an instrument that signals distant earthquakes  
132 CE · `year 132` · tech · asia · tier 2 · ✓ re-checked against Wikipedia, "Zhang Heng"  
*Note:* A ball dropping from one of eight dragon mouths showed that an earthquake had happened, and roughly from which direction.  
*Source:* Wikipedia, "Zhang Heng"; Needham, J. (1959), Science and Civilisation in China 3, Cambridge University Press, pp. 626–635.

**`aksum`** — The great stone stelae of Aksum are raised in northern Ethiopia  
about 330 CE (range 250–400 CE) · `year 330 [250…400]` · culture · africa · tier 3 · ✓  
*Note:* The tallest stele was about 33 m long; it probably fell while being raised.  
*Source:* UNESCO World Heritage List no. 15, "Aksum"; Phillipson, D. W. (2012), Foundations of an African Civilisation: Aksum and the Northern Horn, James Currey (largest stelae: late 3rd to mid-4th century).

**`aryabhata`** — Aryabhata completes his book on mathematics and astronomy in India  
499 CE · `year 499` · science · asia · tier 2 · ✓ re-checked against Wikipedia, "Aryabhatiya"  
*Note:* Among other things he explained the daily movement of the stars by the turning of the Earth.  
*Source:* Wikipedia, "Aryabhata"; Plofker, K. (2009), Mathematics in India, Princeton University Press; Wikipedia, "Aryabhatiya".

### 3.3 500 to 1799 — 47 events

**`chess`** — The first clear mentions of chaturanga, the ancestor of chess, appear in India  
about 600 CE (range 550–650 CE) · `year 600 [550…650]` · everyday · asia · tier 2 · ✓ re-checked against Wikipedia, "Chaturanga"  
*Note:* From India the game travelled to Persia and on to the Arab world and Europe, changing its rules along the way.  
*Source:* Murray, H. J. R. (1913), A History of Chess, Oxford University Press; Wikipedia, "Chaturanga".

**`brahmagupta`** — Brahmagupta writes down rules for calculating with zero and negative numbers  
628 CE · `year 628` · science · asia · tier 2 · ✓ re-checked against Wikipedia, "Brahmasphutasiddhanta"  
*Note:* His book treats zero as a number in its own right, not only as an empty place.  
*Source:* Plofker, K. (2009), Mathematics in India, Princeton University Press; Wikipedia, "Brahmagupta"; Wikipedia, "Brahmasphutasiddhanta".

**`al-khwarizmi`** — Al-Khwarizmi writes his book on algebra in Baghdad  
about 820 CE (range 813–833 CE) · `year 820 [813…833]` · science · asia · tier 2 · ✓ re-checked against Wikipedia, "The Compendious Book on Calculation by Completion and Balancing"  
*Note:* The word "algebra" comes from its title, and the word "algorithm" from his name.  
*Source:* Wikipedia, "Al-Khwarizmi"; Rashed, R. (2009), Al-Khwarizmi: The Beginnings of Algebra, Saqi; Wikipedia, "The Compendious Book on Calculation by Completion and Balancing".

**`dated-print`** — The oldest surviving printed book that bears its date is printed in China (a scroll found near Dunhuang)  
868 CE · `year 868` · tech · asia · tier 2 · ✓  
*Note:* It was printed from carved wooden blocks; its last lines give a date equal to 11 May 868.  
*Source:* British Library, Or.8210/P.2; Wikipedia, "Diamond Sutra" (checked 2026-10-26).

**`genji`** — Murasaki Shikibu writes The Tale of Genji in Japan  
about 1008 (range 1000–1012) · `year 1008 [1000…1012]` · culture · asia · tier 2 · ✓ re-checked against Wikipedia, "The Tale of Genji"  
*Note:* It is often called one of the first novels; parts of it were being read at the court by 1008.  
*Source:* Wikipedia, "The Tale of Genji"; Shirane, H. (1987), The Bridge of Dreams, Stanford University Press.

**`al-haytham`** — Ibn al-Haytham writes his Book of Optics in Cairo  
1011–1021 (span) · `span year 1011…1021` · science · africa · tier 2 · ✓ re-checked against Wikipedia, "Book of Optics"  
*Note:* He argued that we see because light enters the eye, and tested ideas with careful experiments.  
*Source:* Wikipedia, "Book of Optics"; Sabra, A. I. (1989), The Optics of Ibn al-Haytham, Warburg Institute.

**`ibn-sina`** — Ibn Sina completes his Canon of Medicine  
about 1025 (range 1020–1025) · `year 1025 [1020…1025]` · science · asia · tier 2 · ✓ re-checked against Wikipedia, "The Canon of Medicine"  
*Note:* The book was used to teach medicine in Asia, Africa and Europe for about 600 years.  
*Source:* Wikipedia, "The Canon of Medicine"; Gutas, D., "Ibn Sina", Stanford Encyclopedia of Philosophy.

**`vinland`** — Norse people cut wood at L'Anse aux Meadows in Newfoundland, Canada  
1021 · `year 1021` · explore · americas · tier 2 · ✓  
*Note:* Tree rings marked by a burst of radiation from the Sun in 993 allowed the year to be counted exactly.  
*Source:* Kuitems, M. et al. (2022), "Evidence for European presence in the Americas in AD 1021", Nature 601: 388–391 (online 20 Oct 2021).

**`paper-money`** — The first paper money issued by a government (jiaozi) appears in Sichuan, China  
about 1024 (range 1023–1024) · `year 1024 [1023…1024]` · everyday · asia · tier 2 · ✓  
*Note:* Merchants had issued paper notes before; the state then took over and printed standard notes.  
*Source:* Wikipedia, "Jiaozi (currency)" (checked 2026-10-26); von Glahn, R. (2016), An Economic History of China, Cambridge University Press.

**`bi-sheng`** — Bi Sheng invents movable type made of baked clay  
1041–1048 (span) · `span year 1041…1048` · tech · asia · tier 2 · ✓  
*Note:* Each character was a separate piece that could be reused — about four centuries before Gutenberg's press.  
*Source:* Shen Kuo, Dream Pool Essays (1088); Wikipedia, "Bi Sheng" and "Shen Kuo" (checked 2026-10-26).

**`cahokia`** — Cahokia, a city of earthen mounds near the Mississippi River, is at its largest  
1050–1200 (span) · `span year 1050…1200` · culture · americas · tier 3 · ✓ re-checked against Wikipedia, "Cahokia"  
*Note:* Its biggest mound, Monks Mound, covers more ground than the Great Pyramid of Giza.  
*Source:* Pauketat, T. R. (2009), Cahokia: Ancient America's Great City on the Mississippi, Viking; UNESCO World Heritage List no. 198.

**`supernova`** — Chinese astronomers record a "guest star" so bright it is seen in daylight  
1054 · `year 1054` · science · asia · tier 2 · ✓  
*Note:* It was a supernova, an exploding star; its remains are the Crab Nebula.  
*Source:* Stephenson, F. R. & Green, D. A. (2003), "The historical supernovae", arXiv:astro-ph/0301603 (checked 2026-10-26).

**`compass`** — Shen Kuo describes the magnetic needle compass  
about 1088 (range 1086–1093) · `year 1088 [1086…1093]` · tech · asia · tier 2 · ✓  
*Note:* He also noted that the needle does not point exactly north — about a century before the first European account of a compass.  
*Source:* Shen Kuo, Dream Pool Essays (c. 1088); Wikipedia, "Shen Kuo" (checked 2026-10-26).

**`oxford`** — Teaching is under way at Oxford, England  
1096 · `year 1096` · culture · europe · tier 3 · ✓ re-checked against Wikipedia, "University of Oxford"  
*Note:* Oxford has no single founding date; 1096 is the earliest evidence of teaching there.  
*Source:* University of Oxford, "Introduction and history" (ox.ac.uk).

**`great-zimbabwe`** — The stone walls of Great Zimbabwe are built  
1100–1450 (span) · `span year 1100…1450` · culture · africa · tier 2 · ✓  
*Note:* Its walls were built without mortar; the city was a centre of trade reaching to the Indian Ocean.  
*Source:* UNESCO World Heritage List no. 364, "Great Zimbabwe National Monument" (checked 2026-10-26).

**`angkor`** — Angkor Wat is built in Cambodia  
1113–1150 (span) · `span year 1113…1150` · culture · asia · tier 2 · ✓ re-checked against Wikipedia, "Angkor Wat"  
*Note:* It is the largest religious monument in the world by area and appears on Cambodia's flag.  
*Source:* UNESCO World Heritage List no. 668, "Angkor"; Wikipedia, "Angkor Wat".

**`rapa-nui`** — Polynesian voyagers reach Rapa Nui (Easter Island)  
about 1200 (range 1150–1290) · `year 1200 [1150…1290]` · explore · oceania · tier 3 · ✓  
*Note:* Rapa Nui is one of the most remote inhabited islands; it was reached in canoes across thousands of kilometres of ocean.  
*Source:* Hunt, T. L. & Lipo, C. P. (2006), "Late colonization of Easter Island", Science 311: 1603–1606; Wilmshurst, J. M. et al. (2011), PNAS 108: 1815–1820.

**`al-jazari`** — Al-Jazari finishes his book of ingenious mechanical devices  
1206 · `year 1206` · tech · asia · tier 3 · ✓ re-checked against Wikipedia, "Ismail al-Jazari"  
*Note:* It describes water clocks, pumps and automatons with drawings detailed enough to rebuild them.  
*Source:* Hill, D. R. (trans.) (1974), The Book of Knowledge of Ingenious Mechanical Devices, Reidel; Wikipedia, "Ismail al-Jazari".

**`genghis-khan`** — Temüjin is proclaimed Genghis Khan, ruler of the Mongols  
1206 · `year 1206` · history · asia · tier 1 · ✓  
*Note:* His campaigns began the Mongol Empire, which became the largest contiguous land empire in history; the conquests cost millions of lives.  
*Source:* Wikipedia, "Genghis Khan" (checked 2026-10-26); May, T. (2018), The Mongol Empire, Edinburgh University Press.

**`aotearoa`** — Polynesian voyagers settle Aotearoa New Zealand  
1230–1282 (span) · `span year 1230…1282` · explore · oceania · tier 2 · ✓  
*Note:* New Zealand was one of the last large land areas on Earth to be settled by people.  
*Source:* Wilmshurst, J. M. et al. (2011), "High-precision radiocarbon dating shows recent and rapid initial human colonization of East Polynesia", PNAS 108: 1815–1820.

**`tenochtitlan`** — Tenochtitlan is founded on an island in Lake Texcoco (today Mexico City)  
about 1325 (range 1320–1350) · `year 1325 [1320…1350]` · culture · americas · tier 2 · ✓ re-checked against Wikipedia, "Tenochtitlan"  
*Note:* 1325 is the traditional date; the city grew to perhaps 200,000 people with causeways and floating gardens.  
*Source:* Wikipedia, "Tenochtitlan"; Smith, M. E. (2012), The Aztecs, 3rd ed., Wiley-Blackwell.

**`mansa-musa`** — Mansa Musa, ruler of the Mali Empire, travels through Cairo to Mecca with a caravan carrying a great deal of gold  
1324–1325 (span) · `span year 1324…1325` · history · africa · tier 2 · ✓  
*Note:* His lavish spending in Cairo was remembered for years; Mali was then one of the main sources of the gold traded around the Mediterranean.  
*Source:* Wikipedia, "Mansa Musa" (checked 2026-10-26); Gomez, M. A. (2018), African Dominion: A New History of Empire in Early and Medieval West Africa, Princeton University Press.

**`ibn-battuta`** — Ibn Battuta travels from Morocco across Africa and Asia  
1325–1354 (span) · `span year 1325…1354` · explore · africa · tier 2 · ✓ re-checked against Wikipedia, "Ibn Battuta"  
*Note:* Over about 29 years he journeyed perhaps 100,000 km, as far as China and the Maldives.  
*Source:* Dunn, R. E. (2012), The Adventures of Ibn Battuta, 3rd ed., University of California Press.

**`zheng-he`** — Zheng He leads seven great sea voyages from China to the Indian Ocean and East Africa  
1405–1433 (span) · `span year 1405…1433` · explore · asia · tier 2 · ✓ re-checked against Wikipedia, "Zheng He"  
*Note:* His fleets reached Arabia and the coast of today's Kenya and Somalia.  
*Source:* Dreyer, E. L. (2007), Zheng He: China and the Oceans in the Early Ming Dynasty, Pearson Longman.

**`ulugh-beg`** — Ulugh Beg builds his observatory in Samarkand  
about 1424 (range 1420–1429) · `year 1424 [1420…1429]` · science · asia · tier 3 · ✓  
*Note:* Its huge curved instrument helped to measure the length of the year to within about a minute.  
*Source:* Wikipedia, "Ulugh Beg Observatory" (checked 2026-10-26); MacTutor History of Mathematics, "Ulugh Beg".

**`machu-picchu`** — Machu Picchu is in use as an Inca royal estate in the Andes  
1420–1530 (span) · `span year 1420…1530` · culture · americas · tier 1 · ✓  
*Note:* Radiocarbon dates of burials show it was in use about 20 years earlier than written records suggested.  
*Source:* Burger, R. L. et al. (2021), "New AMS dates for Machu Picchu", Antiquity 95: 1265–1279.

**`coffee`** — The first reliable records of coffee drinking come from Yemen  
about 1450 (range 1430–1470) · `year 1450 [1430…1470]` · everyday · asia · tier 2 · ✓  
*Note:* From Yemen the drink spread to Mecca, Cairo and Istanbul, and later to the rest of the world.  
*Source:* Wikipedia, "Coffee" (checked 2026-10-26); Hattox, R. S. (1985), Coffee and Coffeehouses, University of Washington Press.

**`hangul`** — Scholars working for King Sejong create Hangul, the Korean alphabet  
about 1443 (range 1443–1446) · `year 1443 [1443…1446]` · culture · asia · tier 1 · ✓ re-checked against Wikipedia, "Hangul"  
*Note:* It was designed so that ordinary people could learn to read quickly; it was made public in 1446.  
*Source:* Wikipedia, "Hangul"; Kim-Renaud, Y.-K. (ed.) (1997), The Korean Alphabet, University of Hawai'i Press.

**`leonardo`** — Lifetime of Leonardo da Vinci, painter and inventor  
1452–1519 (span) · `span year 1452…1519` · culture · europe · tier 1 · ✓ re-checked against Wikipedia, "Leonardo da Vinci"  
*Note:* He filled thousands of notebook pages with studies of anatomy, water and machines.  
*Source:* Wikipedia, "Leonardo da Vinci"; Kemp, M. (2006), Leonardo da Vinci, Oxford University Press.

**`gutenberg`** — The Gutenberg Bible is printed with movable metal type in Mainz  
about 1455 (range 1454–1455) · `year 1455 [1454…1455]` · tech · europe · tier 1 · ✓ re-checked against Wikipedia, "Gutenberg Bible"  
*Note:* Gutenberg combined metal type, an oil-based ink and a press; printed books spread quickly across Europe.  
*Source:* Wikipedia, "Gutenberg Bible"; Man, J. (2002), The Gutenberg Revolution, Review.

**`circumnavigation`** — The first voyage around the world (the Magellan–Elcano expedition)  
1519–1522 (span) · `span year 1519…1522` · explore · world · tier 1 · ✓ re-checked against Wikipedia, "Magellan expedition"  
*Note:* Of about 270 crew who set out, only 18 returned on one ship, led by Juan Sebastián Elcano after Magellan was killed.  
*Source:* Wikipedia, "Magellan expedition"; Bergreen, L. (2003), Over the Edge of the World, Morrow.

**`kabuki`** — Kabuki theatre begins with Izumo no Okuni's dance performances in Kyoto  
1603 · `year 1603` · culture · asia · tier 2 · ✓  
*Note:* Kabuki began as a theatre of women; later only men were allowed to perform it.  
*Source:* Wikipedia, "Izumo no Okuni" and "Kabuki" (checked 2026-10-26).

**`galileo-moons`** — Galileo Galilei sees four moons orbiting Jupiter through his telescope  
1610 · `year 1610` · science · europe · tier 1 · ✓ re-checked against Wikipedia, "Galilean moons"  
*Note:* Things orbiting another planet showed that not everything in the sky circles the Earth.  
*Source:* Galilei, G. (1610), Sidereus Nuncius; Wikipedia, "Galilean moons".

**`taj-mahal`** — The Taj Mahal is built in Agra, India  
1632–1653 (span) · `span year 1632…1653` · culture · asia · tier 1 · ✓ re-checked against Wikipedia, "Taj Mahal"  
*Note:* About 20,000 workers built the marble tomb and its gardens over some two decades.  
*Source:* UNESCO World Heritage List no. 252, "Taj Mahal"; Wikipedia, "Taj Mahal".

**`newton`** — Lifetime of Isaac Newton  
1643–1727 (span) · `span year 1643…1727` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "Isaac Newton"  
*Note:* He was born on 25 December 1642 in the Julian calendar then used in England — 4 January 1643 in today's calendar.  
*Source:* Wikipedia, "Isaac Newton"; Westfall, R. S. (1980), Never at Rest, Cambridge University Press.

**`sor-juana`** — Lifetime of Sor Juana Inés de la Cruz, poet and scholar in New Spain (today Mexico)  
1648–1695 (span) · `span year 1648…1695` · culture · americas · tier 3 · ✓ re-checked against Wikipedia, "Juana Inés de la Cruz"  
*Note:* Her birth year is given as 1648 or 1651; she defended the right of women to study.  
*Source:* Wikipedia, "Juana Inés de la Cruz"; Paz, O. (1982), Sor Juana Inés de la Cruz o las trampas de la fe, Seix Barral.

**`dodo`** — The last widely accepted sighting of the dodo, on Mauritius  
1662 · `year 1662` · earth · africa · tier 2 · ✓ re-checked against Wikipedia, "Dodo"  
*Note:* The dodo vanished less than a century after sailors first described it; rats, pigs and hunting were to blame.  
*Source:* Cheke, A. S. (1987), in Diamond, A. W. (ed.), Studies of Mascarene Island Birds, Cambridge University Press; Roberts, D. L. & Solow, A. R. (2003), "When did the dodo become extinct?", Nature 426: 245; Wikipedia, "Dodo".

**`leeuwenhoek`** — Antonie van Leeuwenhoek sees bacteria and other microbes through his own microscopes  
1676 · `year 1676` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "Antonie van Leeuwenhoek"  
*Note:* His single-lens microscopes magnified about 200 times; he called the tiny creatures "animalcules".  
*Source:* Lane, N. (2015), "The unseen world: reflections on Leeuwenhoek (1677)", Philosophical Transactions of the Royal Society B 370: 20140344; Wikipedia, "Antonie van Leeuwenhoek".

**`piano`** — Bartolomeo Cristofori builds the first piano in Florence  
about 1700 (range 1698–1700) · `year 1700 [1698…1700]` · culture · europe · tier 2 · ✓ re-checked against Wikipedia, "Bartolomeo Cristofori"  
*Note:* Unlike the harpsichord, it could play soft and loud — hence the name pianoforte.  
*Source:* Wikipedia, "Bartolomeo Cristofori"; Pollens, S. (1995), The Early Pianoforte, Cambridge University Press.

**`newcomen`** — Thomas Newcomen's steam engine pumps water out of a mine in England  
1712 · `year 1712` · tech · europe · tier 2 · ✓ re-checked against Wikipedia, "Newcomen atmospheric engine"  
*Note:* It was the first practical steam engine; James Watt made it much more efficient decades later.  
*Source:* Wikipedia, "Newcomen atmospheric engine"; Rolt, L. T. C. & Allen, J. S. (1977), The Steam Engine of Thomas Newcomen, Moorland.

**`franklin`** — Benjamin Franklin's experiments show that lightning is electricity  
1752 · `year 1752` · science · americas · tier 2 · ✓ re-checked against Wikipedia, "Kite experiment"  
*Note:* His lightning rods soon protected buildings on both sides of the Atlantic.  
*Source:* Wikipedia, "Kite experiment"; Franklin Institute, "Ben Franklin's kite experiment".

**`mozart`** — Lifetime of Wolfgang Amadeus Mozart, composer  
1756–1791 (span) · `span year 1756…1791` · culture · europe · tier 1 · ✓ re-checked against Wikipedia, "Wolfgang Amadeus Mozart"  
*Note:* In only 35 years he wrote more than 600 works.  
*Source:* Wikipedia, "Wolfgang Amadeus Mozart"; Solomon, M. (1995), Mozart: A Life, HarperCollins.

**`wang-zhenyi`** — Lifetime of Wang Zhenyi, astronomer and mathematician in China  
1768–1797 (span) · `span year 1768…1797` · science · asia · tier 3 · ✓ re-checked against Wikipedia, "Wang Zhenyi (astronomer)"  
*Note:* She used a lamp, a mirror and a round table to show how eclipses happen.  
*Source:* Wikipedia, "Wang Zhenyi (astronomer)"; Peterson, B. B. (ed.) (2000), Notable Women of China, M. E. Sharpe.

**`uranus`** — William Herschel discovers the planet Uranus  
1781 · `year 1781` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "Uranus"  
*Note:* It was the first planet found with a telescope; earlier people knew only the planets visible to the eye.  
*Source:* Wikipedia, "Uranus"; Herschel, W. (1781), Philosophical Transactions 71: 492–501.

**`balloon`** — People fly for the first time, in a hot-air balloon over Paris  
1783 · `year 1783` · tech · europe · tier 2 · ✓ re-checked against Wikipedia, "Montgolfier brothers"  
*Note:* The balloon was built by the Montgolfier brothers; the first passengers before that were a sheep, a duck and a rooster.  
*Source:* Wikipedia, "Montgolfier brothers".

**`haiti`** — The Haitian Revolution: enslaved people rise up against French colonial rule in Saint-Domingue  
1791–1804 (span) · `span year 1791…1804` · history · americas · tier 2 · ✓  
*Note:* It ended with the founding of Haiti, the first state founded after a successful uprising of enslaved people.  
*Source:* Wikipedia, "Haitian Revolution" (checked 2026-10-26); Dubois, L. (2004), Avengers of the New World, Harvard University Press.

**`vaccine`** — Edward Jenner tests the first vaccine, against smallpox  
1796 · `year 1796` · science · europe · tier 1 · ✓ re-checked against Wikipedia, "Edward Jenner"  
*Note:* Earlier, people in China, India and Africa had protected themselves by inoculation with smallpox material itself.  
*Source:* Riedel, S. (2005), "Edward Jenner and the history of smallpox and vaccination", Baylor University Medical Center Proceedings 18: 21–25.

### 3.4 1800 to today — 56 events

**`battery`** — Alessandro Volta builds the first electric battery  
about 1800 (range 1799–1800) · `year 1800 [1799…1800]` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "Voltaic pile"  
*Note:* His "pile" of metal discs and salty cardboard gave the first steady electric current.  
*Source:* Wikipedia, "Voltaic pile".

**`anaesthesia`** — Hanaoka Seishū operates on a patient under general anaesthesia in Japan  
1804 · `year 1804` · science · asia · tier 3 · ✓  
*Note:* He used a herbal mixture he had developed over about 20 years — four decades before ether was used in the United States.  
*Source:* Izuo, M. (2004), "Medical history: Seishu Hanaoka and his success in breast cancer surgery under general anesthesia two hundred years ago", Breast Cancer 11: 319–324.

**`tambora`** — Mount Tambora erupts in Indonesia; the next year has no real summer in many places  
1815 · `year 1815` · earth · asia · tier 2 · ✓ re-checked against Wikipedia, "1815 eruption of Mount Tambora"  
*Note:* It was the largest eruption in recorded history; ash in the air cooled the climate and ruined harvests far away.  
*Source:* Oppenheimer, C. (2003), "Climatic, environmental and human consequences of the largest known historic eruption: Tambora volcano (Indonesia) 1815", Progress in Physical Geography 27: 230–259; Wikipedia, "1815 eruption of Mount Tambora".

**`railway`** — The first public railway to use steam locomotives opens (Stockton and Darlington, England)  
1825 · `year 1825` · tech · europe · tier 1 · ✓ re-checked against Wikipedia, "Stockton and Darlington Railway"  
*Note:* Within 25 years railways linked many cities in Europe and North America.  
*Source:* Wikipedia, "Stockton and Darlington Railway".

**`photograph`** — Nicéphore Niépce takes the oldest surviving photograph with a camera  
about 1827 (range 1826–1827) · `year 1827 [1826…1827]` · tech · europe · tier 2 · ✓ re-checked against Wikipedia, "View from the Window at Le Gras"  
*Note:* The view from his window needed an exposure of many hours, perhaps days.  
*Source:* Harry Ransom Center, University of Texas, "The Niépce Heliograph"; Wikipedia, "View from the Window at Le Gras".

**`braille`** — Louis Braille publishes his system of raised dots for reading by touch  
1829 · `year 1829` · everyday · europe · tier 3 · ✓ re-checked against Wikipedia, "Braille"  
*Note:* He was 20 years old and had been blind since early childhood.  
*Source:* Wikipedia, "Braille"; Mellor, C. M. (2006), Louis Braille: A Touch of Genius, National Braille Press.

**`great-wave`** — Katsushika Hokusai's woodblock print The Great Wave off Kanagawa is published  
about 1831 (range 1830–1832) · `year 1831 [1830…1832]` · culture · asia · tier 1 · ✓ re-checked against Wikipedia, "The Great Wave off Kanagawa"  
*Note:* Thousands of copies were printed and sold cheaply; it became one of the most famous images in the world.  
*Source:* British Museum, "Under the wave off Kanagawa"; Wikipedia, "The Great Wave off Kanagawa".

**`lovelace`** — Ada Lovelace publishes the first program written for a computing machine  
1843 · `year 1843` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "Ada Lovelace"  
*Note:* Her notes on Charles Babbage's planned Analytical Engine included a method to calculate Bernoulli numbers.  
*Source:* Wikipedia, "Ada Lovelace"; Hollings, C., Martin, U. & Rice, A. (2018), Ada Lovelace: The Making of a Computer Scientist, Bodleian Library.

**`fax`** — Alexander Bain patents a way to send images over telegraph wires, a forerunner of the fax  
1843 · `year 1843` · tech · europe · tier 3 · ✓ re-checked against Wikipedia, "Fax"  
*Note:* The fax idea is older than the telephone by more than 30 years.  
*Source:* Wikipedia, "Fax" (British patent 9745, 1843).

**`telegraph`** — The first long-distance telegraph message is sent from Washington to Baltimore  
1844 · `year 1844` · tech · americas · tier 2 · ✓ re-checked against Wikipedia, "Electrical telegraph"  
*Note:* Messages that had taken days by horse now arrived in minutes.  
*Source:* Library of Congress, "Samuel F. B. Morse Papers"; Wikipedia, "Electrical telegraph".

**`darwin`** — Charles Darwin publishes On the Origin of Species  
1859 · `year 1859` · science · europe · tier 1 · ✓ re-checked against Wikipedia, "On the Origin of Species"  
*Note:* Alfred Russel Wallace had reached the same idea of natural selection independently.  
*Source:* Wikipedia, "On the Origin of Species".

**`curie`** — Lifetime of Marie Skłodowska-Curie, physicist and chemist  
1867–1934 (span) · `span year 1867…1934` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "Marie Curie"  
*Note:* She was the first person to win Nobel Prizes in two different sciences.  
*Source:* Nobel Prize Outreach, "Marie Curie — Biographical" (nobelprize.org).

**`periodic-table`** — Dmitri Mendeleev presents his periodic table of the elements  
1869 · `year 1869` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "Dmitri Mendeleev"  
*Note:* He left gaps for elements not yet known and predicted their properties.  
*Source:* Wikipedia, "Dmitri Mendeleev"; Gordin, M. D. (2004), A Well-Ordered Thing, Basic Books.

**`telephone`** — Alexander Graham Bell patents the telephone  
1876 · `year 1876` · tech · americas · tier 1 · ✓ re-checked against Wikipedia, "Invention of the telephone"  
*Note:* Several inventors worked on telephones at the time; Bell's patent was granted first.  
*Source:* Wikipedia, "Invention of the telephone".

**`krakatoa`** — Krakatoa erupts in Indonesia  
1883 · `year 1883` · earth · asia · tier 2 · ✓ re-checked against Wikipedia, "1883 eruption of Krakatoa"  
*Note:* The final explosion was heard about 4,800 km away, on an island in the Indian Ocean.  
*Source:* Winchester, S. (2003), Krakatoa, HarperCollins; Wikipedia, "1883 eruption of Krakatoa".

**`car`** — Carl Benz builds his three-wheeled motor car  
about 1886 (range 1885–1886) · `year 1886 [1885…1886]` · tech · europe · tier 1 · ✓ re-checked against Wikipedia, "Benz Patent-Motorwagen" — changed: exact 1886 → about 1886 (1885–1886): built 1885, patented 1886  
*Note:* In 1888 Bertha Benz drove it about 100 km to show that it worked.  
*Source:* Wikipedia, "Benz Patent-Motorwagen".

**`ramanujan`** — Lifetime of Srinivasa Ramanujan, mathematician from India  
1887–1920 (span) · `span year 1887…1920` · science · asia · tier 2 · ✓ re-checked against Wikipedia, "Srinivasa Ramanujan"  
*Note:* Largely self-taught, he found thousands of results in number theory.  
*Source:* Kanigel, R. (1991), The Man Who Knew Infinity, Scribner; Wikipedia, "Srinivasa Ramanujan".

**`x-rays`** — Wilhelm Röntgen discovers X-rays  
1895 · `year 1895` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "X-ray"  
*Note:* Within months, doctors were using X-rays to find broken bones and bullets.  
*Source:* Wikipedia, "X-ray"; Nobel Prize in Physics 1901 (nobelprize.org).

**`wright`** — The Wright brothers make the first powered aeroplane flights  
1903 · `year 1903` · tech · americas · tier 1 · ✓ re-checked against Wikipedia, "Wright Flyer"  
*Note:* The first flight lasted 12 seconds and covered 37 metres.  
*Source:* Smithsonian National Air and Space Museum, "1903 Wright Flyer".

**`relativity`** — Albert Einstein publishes his special theory of relativity  
1905 · `year 1905` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "Special relativity"  
*Note:* In the same year he also published papers on light quanta and on the movement of tiny particles.  
*Source:* Wikipedia, "Annus mirabilis papers"; Wikipedia, "Special relativity".

**`kahlo`** — Lifetime of Frida Kahlo, painter from Mexico  
1907–1954 (span) · `span year 1907…1954` · culture · americas · tier 2 · ✓ re-checked against Wikipedia, "Frida Kahlo"  
*Note:* Many of her paintings are self-portraits, often painted while she was recovering from injuries.  
*Source:* Wikipedia, "Frida Kahlo"; Herrera, H. (1983), Frida: A Biography of Frida Kahlo, Harper & Row.

**`tunguska`** — A space rock explodes over Tunguska in Siberia and flattens a vast forest  
1908 · `year 1908` · earth · asia · tier 2 · ✓ re-checked against Wikipedia, "Tunguska event" — note corrected: "millions of trees over more than 2,000 km²" (the "80 million trees" figure is disputed)  
*Note:* Millions of trees were knocked down over more than 2,000 km², but no crater was found.  
*Source:* Wikipedia, "Tunguska event"; NASA Science, "The Tunguska impact — 100 years later" (2008).

**`south-pole`** — Roald Amundsen's team reaches the South Pole  
1911 · `year 1911` · explore · world · tier 1 · ✓ re-checked against Wikipedia, "Amundsen's South Pole expedition"  
*Note:* They travelled with skis and sled dogs and arrived five weeks before Robert Falcon Scott's team.  
*Source:* Wikipedia, "Amundsen's South Pole expedition".

**`indian-film`** — Raja Harishchandra, the first full-length Indian feature film, is shown  
1913 · `year 1913` · culture · asia · tier 2 · ✓ re-checked against Wikipedia, "Raja Harishchandra"  
*Note:* It was made by Dadasaheb Phalke; India now produces more films than any other country.  
*Source:* Wikipedia, "Raja Harishchandra"; Rajadhyaksha, A. & Willemen, P. (1999), Encyclopaedia of Indian Cinema, BFI.

**`tagore`** — Rabindranath Tagore becomes the first Nobel laureate from Asia  
1913 · `year 1913` · culture · asia · tier 2 · ✓ re-checked against Wikipedia, "Rabindranath Tagore"  
*Note:* He received the Prize in Literature; his songs are the national anthems of India and Bangladesh.  
*Source:* Nobel Prize Outreach, "The Nobel Prize in Literature 1913" (nobelprize.org); Wikipedia, "Rabindranath Tagore".

**`passenger-pigeon`** — Martha, the last passenger pigeon, dies at Cincinnati Zoo  
1914 · `year 1914` · earth · americas · tier 3 · ✓ re-checked against Wikipedia, "Passenger pigeon"  
*Note:* A century earlier, flocks of billions had darkened the sky for hours.  
*Source:* Smithsonian Institution Archives, "Martha, the last passenger pigeon"; Wikipedia, "Passenger pigeon".

**`panama-canal`** — The Panama Canal opens  
1914 · `year 1914` · tech · americas · tier 2 · ✓ re-checked against Wikipedia, "Panama Canal"  
*Note:* Ships between the Atlantic and the Pacific no longer had to sail around South America.  
*Source:* Panama Canal Authority, "History"; Wikipedia, "Panama Canal".

**`ww1`** — The First World War is fought  
1914–1918 (span) · `span year 1914…1918` · history · world · tier 1 · ✓  
*Note:* Fought mainly in Europe and the Middle East, it caused an estimated 15 to 22 million deaths, soldiers and civilians.  
*Source:* Wikipedia, "World War I" (checked 2026-10-26); Strachan, H. (2003), The First World War, Simon & Schuster.

**`insulin`** — Insulin is used for the first time to treat a person with diabetes, in Toronto  
1922 · `year 1922` · science · americas · tier 2 · ✓ re-checked against Wikipedia, "Insulin (medication)"  
*Note:* Before insulin, type 1 diabetes was almost always fatal.  
*Source:* Nobel Prize in Physiology or Medicine 1923 (nobelprize.org); Bliss, M. (1982), The Discovery of Insulin, University of Toronto Press; Wikipedia, "Insulin (medication)".

**`flying-doctor`** — A flying doctor service starts in outback Australia, bringing doctors to remote farms by plane  
1928 · `year 1928` · everyday · oceania · tier 3 · ✓ re-checked against Wikipedia, "Royal Flying Doctor Service"  
*Note:* Its first flight left Cloncurry, Queensland; radios powered by pedals let isolated families call for help.  
*Source:* Royal Flying Doctor Service, "Our history" (flyingdoctor.org.au); Wikipedia, "Royal Flying Doctor Service".

**`penicillin`** — Alexander Fleming notices that a mould kills bacteria: penicillin  
1928 · `year 1928` · science · europe · tier 1 · ✓ re-checked against Wikipedia, "Penicillin"  
*Note:* It took until the 1940s for Howard Florey, Ernst Chain and others to turn it into a medicine.  
*Source:* Nobel Prize in Physiology or Medicine 1945 (nobelprize.org); Wikipedia, "Penicillin".

**`expanding-universe`** — Edwin Hubble shows that distant galaxies are moving away from us  
1929 · `year 1929` · science · americas · tier 2 · ✓ re-checked against Wikipedia, "Hubble's law"  
*Note:* Georges Lemaître had published the same relation two years earlier; the universe is expanding.  
*Source:* Hubble, E. (1929), PNAS 15: 168–173; IAU Resolution B4 (2018), "Hubble–Lemaître law"; Wikipedia, "Hubble's law".

**`world-cup`** — The first football World Cup is played in Uruguay  
1930 · `year 1930` · everyday · americas · tier 1 · ✓ re-checked against Wikipedia, "1930 FIFA World Cup"  
*Note:* Thirteen teams took part; the host country won the final.  
*Source:* FIFA, "1930 FIFA World Cup Uruguay" (fifa.com).

**`thylacine`** — The last known thylacine ("Tasmanian tiger") dies in a zoo in Hobart  
1936 · `year 1936` · earth · oceania · tier 2 · ✓ re-checked against Wikipedia, "Thylacine"  
*Note:* It was the largest meat-eating marsupial of recent times.  
*Source:* Australian Museum, "Thylacine"; Wikipedia, "Thylacine".

**`ww2`** — The Second World War is fought  
1939–1945 (span) · `span year 1939…1945` · history · world · tier 1 · ✓  
*Note:* It began in Europe with the invasion of Poland by Nazi Germany under Adolf Hitler and ended with the surrender of Japan; an estimated 60 to 75 million people died, among them six million Jews murdered in the Holocaust.  
*Source:* Wikipedia, "World War II" and "The Holocaust" (checked 2026-10-26); Weinberg, G. L. (1994), A World at Arms, Cambridge University Press.

**`transistor`** — The transistor is invented at Bell Labs  
1947 · `year 1947` · tech · americas · tier 2 · ✓ re-checked against Wikipedia, "History of the transistor"  
*Note:* Today a single phone chip holds billions of transistors.  
*Source:* Nobel Prize in Physics 1956 (nobelprize.org); Wikipedia, "History of the transistor".

**`everest`** — Tenzing Norgay and Edmund Hillary reach the summit of Mount Everest  
1953 · `year 1953` · explore · asia · tier 1 · ✓ re-checked against Wikipedia, "1953 British Mount Everest expedition"  
*Note:* At 8,849 m it is the highest point above sea level on Earth.  
*Source:* Wikipedia, "1953 British Mount Everest expedition".

**`dna`** — The double-helix structure of DNA is published  
1953 · `year 1953` · science · europe · tier 1 · ✓ re-checked against Wikipedia, "Molecular Structure of Nucleic Acids"  
*Note:* James Watson and Francis Crick built their model using X-ray images made by Rosalind Franklin and Raymond Gosling.  
*Source:* Watson, J. D. & Crick, F. H. C. (1953), Nature 171: 737–738; Franklin, R. E. & Gosling, R. G. (1953), Nature 171: 740–741; Wikipedia, "Molecular Structure of Nucleic Acids".

**`sputnik`** — Sputnik 1, the first artificial satellite, is launched from Baikonur (Kazakhstan)  
1957 · `year 1957` · explore · asia · tier 2 · ✓ re-checked against Wikipedia, "Sputnik 1"  
*Note:* It circled the Earth every 96 minutes and sent out a simple beeping radio signal.  
*Source:* NASA History Office, "Sputnik and the origins of the Space Age"; Wikipedia, "Sputnik 1".

**`instant-noodles`** — Momofuku Ando sells the first instant noodles in Japan  
1958 · `year 1958` · everyday · asia · tier 2 · ✓ re-checked against Wikipedia, "Momofuku Ando"  
*Note:* His "Chicken Ramen" only needed hot water.  
*Source:* Wikipedia, "Momofuku Ando"; Cup Noodles Museum, Osaka Ikeda.

**`achebe`** — Chinua Achebe publishes the novel Things Fall Apart  
1958 · `year 1958` · culture · africa · tier 2 · ✓ re-checked against Wikipedia, "Things Fall Apart"  
*Note:* It has been translated into more than 50 languages and is one of the most read African novels.  
*Source:* Wikipedia, "Things Fall Apart".

**`gagarin`** — Yuri Gagarin becomes the first person in space  
1961 · `year 1961` · explore · asia · tier 1 · ✓ re-checked against Wikipedia, "Vostok 1"  
*Note:* His flight around the Earth lasted 108 minutes.  
*Source:* Wikipedia, "Vostok 1"; NASA, "Yuri Gagarin: first man in space".

**`ir8`** — IR8, a high-yield rice, is released in the Philippines  
1966 · `year 1966` · everyday · asia · tier 3 · ✓  
*Note:* Short, sturdy rice like IR8 helped many countries in Asia to produce far more food.  
*Source:* International Rice Research Institute, "Changing the world with seeds: the breeding history of IR8" (ricetoday.irri.org, checked 2026-10-26).

**`heart-transplant`** — The first human heart transplant is performed in Cape Town  
1967 · `year 1967` · science · africa · tier 2 · ✓ re-checked against Wikipedia, "Heart transplantation"  
*Note:* The surgeon was Christiaan Barnard; the patient lived for 18 days.  
*Source:* Wikipedia, "Heart transplantation"; Groote Schuur Hospital Heart of Cape Town Museum.

**`moon-landing`** — People walk on the Moon for the first time (Apollo 11)  
1969 · `year 1969` · explore · world · tier 1 · ✓ re-checked against Wikipedia, "Apollo 11"  
*Note:* Twelve people walked on the Moon between 1969 and 1972.  
*Source:* NASA, "Apollo 11 mission overview".

**`opera-house`** — The Sydney Opera House opens  
1973 · `year 1973` · culture · oceania · tier 2 · ✓ re-checked against Wikipedia, "Sydney Opera House"  
*Note:* Its shell-shaped roofs were designed by the Danish architect Jørn Utzon.  
*Source:* UNESCO World Heritage List no. 166 rev, "Sydney Opera House".

**`green-belt`** — Wangari Maathai founds the Green Belt Movement in Kenya  
1977 · `year 1977` · earth · africa · tier 3 · ✓ re-checked against Wikipedia, "Green Belt Movement"  
*Note:* Women in the movement have planted tens of millions of trees.  
*Source:* The Green Belt Movement, "Our history" (greenbeltmovement.org); Nobel Peace Prize 2004 (nobelprize.org).

**`voyager`** — The space probes Voyager 1 and 2 are launched towards the outer planets  
1977 · `year 1977` · explore · world · tier 2 · ✓ re-checked against Wikipedia, "Voyager program"  
*Note:* Voyager 1 is now the most distant object made by people.  
*Source:* NASA Jet Propulsion Laboratory, "Voyager mission overview"; Wikipedia, "Voyager program".

**`smallpox`** — Smallpox is declared eradicated worldwide  
1980 · `year 1980` · science · world · tier 2 · ✓ re-checked against Wikipedia, "Smallpox"  
*Note:* It is the first human disease wiped out by vaccination; the last natural case was in Somalia in 1977.  
*Source:* World Health Organization, "Smallpox" (who.int).

**`ozone`** — Scientists report the ozone hole over Antarctica  
1985 · `year 1985` · earth · world · tier 3 · ✓ re-checked against Wikipedia, "Ozone depletion"  
*Note:* Two years later, countries agreed in the Montreal Protocol to phase out the chemicals that cause it.  
*Source:* Farman, J. C., Gardiner, B. G. & Shanklin, J. D. (1985), Nature 315: 207–210; Wikipedia, "Ozone depletion".

**`www`** — The World Wide Web becomes available to the public  
1991 · `year 1991` · tech · europe · tier 1 · ✓ re-checked against Wikipedia, "World Wide Web"  
*Note:* It was developed at CERN near Geneva, so that scientists could share documents through links.  
*Source:* CERN, "A short history of the Web" (home.cern); Wikipedia, "World Wide Web".

**`genome`** — The Human Genome Project completes its reading of human DNA  
2003 · `year 2003` · science · world · tier 2 · ✓  
*Note:* About 92 % was read in 2003; the last gaps were closed in 2022.  
*Source:* National Human Genome Research Institute, "Human Genome Project fact sheet"; Nurk, S. et al. (2022), Science 376: 44–53.

**`m-pesa`** — M-Pesa, a way to pay with simple mobile phones, launches in Kenya  
2007 · `year 2007` · everyday · africa · tier 2 · ✓ re-checked against Wikipedia, "M-Pesa"  
*Note:* People could send money by text message, even without a bank account.  
*Source:* Wikipedia, "M-Pesa"; Suri, T. & Jack, W. (2016), Science 354: 1288–1292.

**`higgs`** — The Higgs boson is discovered at CERN  
2012 · `year 2012` · science · europe · tier 2 · ✓ re-checked against Wikipedia, "Higgs boson"  
*Note:* Its existence had been predicted almost 50 years earlier.  
*Source:* CERN, "The Higgs boson" (home.cern).

**`gravitational-waves`** — Gravitational waves are detected for the first time  
2015 · `year 2015` · science · americas · tier 2 · ✓ re-checked against Wikipedia, "First observation of gravitational waves"  
*Note:* They came from two black holes merging more than a billion light-years away; the detection was announced in 2016.  
*Source:* Abbott, B. P. et al. (LIGO and Virgo) (2016), Physical Review Letters 116: 061102; Wikipedia, "First observation of gravitational waves".

**`black-hole-image`** — The first image of a black hole is published  
2019 · `year 2019` · science · world · tier 2 · ✓ re-checked against Wikipedia, "Event Horizon Telescope"  
*Note:* Radio telescopes on several continents worked together like one dish the size of the Earth.  
*Source:* Event Horizon Telescope Collaboration (2019), Astrophysical Journal Letters 875: L1.

## 3a. People and history (owner decision 2026-10-26)

The owner decided: "alle Personen, die es nachweislich gegeben hat, können genutzt werden, auch Kriegsherren (Alexander, Nero, Hitler etc.), Religion sollte keinen großen Fokus bekommen, sofern es nicht historisch sehr relevant und real ist. Lebende Personen ausschließen." Applied as follows:

- **Added** 8 sourced `history` events from four continents and the world wars, each with a scholarly or reference source and a Wikipedia article: `alexander` (Alexander the Great, 356–323 BCE), `ashoka` (Ashoka's reign, 268–232 BCE), `nero-fire` (the Great Fire of Rome under Nero, 64 CE), `genghis-khan` (Temüjin proclaimed Genghis Khan, 1206), `mansa-musa` (Mansa Musa's pilgrimage, 1324–1325), `haiti` (the Haitian Revolution, 1791–1804), `ww1` (1914–1918), `ww2` (1939–1945). Together 4.5 % of the events (limit 10 %, tested).
- **Wording:** factual and sober, in all 16 languages: what happened, where, and a consequence or a number from the sources (victims as ranges of estimates); no glorifying or judging adjectives, no battle detail, no images. The Second World War names Adolf Hitler and Nazi Germany and the six million Jews murdered in the Holocaust; the Mongol and First World War notes give the human cost.
- **Religion:** no religious founders or claims as subjects; religion appears only where it is historically very relevant and real (Ashoka's edicts, Mansa Musa's pilgrimage, Angkor Wat as a building).
- **Living people:** none as subjects. People named only in notes were checked too (James Watson, named in the DNA note, died on 6 November 2025).

## 4. Curated surprising pairs (mode "Which came first?")

Used preferentially (at most two per round) when both events are in the round's pool and the pair passes the difficulty's separation (design § 9.3). The insight is shown in the review. Each claim is re-computed by `test/content.test.ts` from the canonical numbers (column "Check").

| id | older | newer | insight (en) | check (computed from the data) |
|---|---|---|---|---|
| `cleopatra-moon` | `cleopatra` | `moon-landing` | Cleopatra lived closer in time to the first Moon landing than to the building of the Great Pyramid. | Cleopatra's birth (y -68) → Moon landing 2037 years < her death (y -29) − latest pyramid date (y -2499) = 2470 years |
| `pyramid-mammoth` | `great-pyramid` | `mammoths` | When the Great Pyramid was finished, woolly mammoths still lived on Wrangel Island. | older ends y -2499 < newer starts y -2199 |
| `stego-trex` | `stegosaurus` | `t-rex` | Tyrannosaurus rex lived closer in time to us than to Stegosaurus. | youngest Stegosaurus → oldest T. rex = 77 Ma > oldest T. rex → 1950 = 68 Ma |
| `sharks-forest` | `first-sharks` | `oldest-forest` | Sharks are older than trees: the first shark-like fish swam about 60 million years before the first forests grew. | gap 57–71 Ma |
| `bread-farming` | `bread` | `farming` | People baked bread more than 2,000 years before anyone farmed cereals. | older ends y -12250 < newer starts y -9999 |
| `pottery-farming` | `pottery` | `farming` | Pottery is older than farming: hunter-gatherers in China made cooking pots thousands of years before the first fields were sown. | gap 7,051–9,551 years |
| `oxford-tenochtitlan` | `oxford` | `tenochtitlan` | Teaching at Oxford began more than two centuries before Tenochtitlan was founded. | older ends y 1096 < newer starts y 1320 |
| `bisheng-gutenberg` | `bi-sheng` | `gutenberg` | Movable type was invented in China about four centuries before Gutenberg printed his Bible. | gap 406–414 years |
| `fax-telephone` | `fax` | `telephone` | The idea of the fax machine is older than the telephone. | older ends y 1843 < newer starts y 1876 |
| `gobekli-stonehenge` | `gobekli` | `stonehenge` | More time passed between Göbekli Tepe and the big stones of Stonehenge than between Stonehenge and today. | latest Göbekli date → earliest sarsens = 6700 years > latest sarsen date → 2026 = 4425 years |
| `sulawesi-chauvet` | `sulawesi-art` | `chauvet` | The oldest known animal paintings are in Indonesia, not in Europe. | older ends y -49250 < newer starts y -35050 |
| `anaesthesia-railway` | `anaesthesia` | `railway` | Surgery under general anaesthesia in Japan came before the first public steam railway. | older ends y 1804 < newer starts y 1825 |

## 5. Wording rules for titles and notes (all locales)

- **Own words**, short and concrete; no sentence copied from an encyclopedia or museum page. Titles name *what* happened and *where*, never *when* (no year, century, era name or "ancient"/"medieval" hint that gives the answer away; numbers that are not the date, such as "Apollo 11", are allowed).
- **Hedged where the science is hedged**: "oldest known", "earliest widely accepted", "traditional date", "debated". A record ("oldest …") always says "known".
- **Neutral and factual** (owner decision, § 3a): rulers, wars and politics are allowed as subjects (at most 10 %) and are worded soberly, with numbers as ranges of estimates; no religious founders or claims; religious buildings appear as architecture (Angkor Wat) without statements of belief; no living people as subjects.
- **People** are named in the conventional spelling of each language (transliterated where the script differs: ابن بطوطة, 伊本·白图泰, Ибн Баттута). Places use the language's exonym (Mainz/Magonza/Maguncia). Translators must not change places or numbers.
- **Numbers** in notes follow the locale's number format; translators keep the values.

## 6. Re-check list

1. Done on 2026-10-26: every date the planner marked ○ (126) was re-checked against a reference article (named in § 3 and now cited); changes: `stegosaurus` (span 155–150 → 155–145 million years ago), `cat` (range 7600–7300 → 7600–7200 BCE), `egypt-writing` (range 3320–3150 → 3400–3150 BCE), `car` (exact 1886 → about 1886, 1885–1886: built 1885, patented 1886), notes of `first-mammals` ("about 140 million years") and `tunguska` ("millions of trees over more than 2,000 km²"; the "80 million trees" figure is disputed), the source title of `lucy`. Nothing was dropped.
2. "Oldest known" records can be overtaken by new finds. Re-check these once a year (schedule in the content file header): `first-life`, `oldest-zircon`, `land-plants`, `first-sharks`, `oldest-forest`, `stone-tools`, `fire`, `homo-sapiens`, `blombos`, `sulawesi-art`, `flutes`, `pottery`, `bread`, `cat`, `dufuna`, `cacao`, `egypt-writing`, `cuneiform`, `dated-print`, `paper-money`, `anaesthesia`.
3. Debated dates carry wide ranges on purpose: `australia` (65,000–47,000 years ago), `himalaya`, `moon-forms`, `teotihuacan`, `caral`, `nok`, `rapa-nui`. If the consensus moves, widen or move the range — never narrow it to one side of an open debate.
4. Rejected during research (do not add without new evidence): Monte Verde (Chile, 14,500 years ago — challenged by a 2026 study in *Science*), the Ishango bone (age disputed), White Sands footprints (still discussed), "first city" claims in general.

## 7. Licence

The dates are facts (not copyrightable); the citations are bibliographic data. Titles, notes and insights are written for Worthwhile Play (project licence); non-en/de translations are AI-assisted until reviewed. No third-party text, table, image or dataset file is copied. The row for `docs/third-party.md` is in the design, Appendix A.
