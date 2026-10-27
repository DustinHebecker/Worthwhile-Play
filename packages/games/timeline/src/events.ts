/**
 * The events of Sense of Time (design § 18, content: docs/design/timeline-content.md): language-neutral data only.
 * Dates are stored as the cited sources state them: `unit: 'year'` = astronomical years (1 CE = 1, 1 BCE = 0,
 * n BCE = 1 − n); `unit: 'ago'` = years before present, counted from 1950 (radiocarbon and geology). `lo` is the
 * older end, so for `ago` values `lo ≥ at ≥ hi`. Spans have no `at` (their position is the midpoint).
 * Ids are stored in saves: never rename or remove one; a withdrawn event gets `retired: true`.
 * Titles and notes are per locale in `content/<locale>.ts`. Citations stay in their original language.
 * `checked`: the date of the last check of the date against the sources (all checked on the web on that day).
 * Records ("oldest known …") are re-checked once a year (content § 6).
 * Generated once from the content document; edit by hand from now on.
 */
import type { EventData, CuratedPair } from './types';

/** Content version of the event ids (stored in saves). */
export const CONTENT_ID = 'events-1';

export const EVENTS: readonly EventData[] = [
  {
    id: 'earth-forms', cat: 'earth', region: 'world', tier: 1, kind: 'point', unit: 'ago', at: 4.54e9, lo: 4.59e9, hi: 4.49e9,
    sources: ['Dalrymple, G. B. (2001), "The age of the Earth in the twentieth century: a problem (mostly) solved", Geological Society, London, Special Publications 190: 205–221', 'USGS, "Age of the Earth" (pubs.usgs.gov/gip/geotime/age.html)'],
    checked: '2026-10-26'
  },
  {
    id: 'moon-forms', cat: 'earth', region: 'world', tier: 2, kind: 'point', unit: 'ago', at: 4.51e9, lo: 4.53e9, hi: 4.35e9,
    sources: ['Barboni, M. et al. (2017), "Early formation of the Moon 4.51 billion years ago", Science Advances 3: e1602365', 'Canup, R. & Asphaug, E. (2001), Nature 412: 708–712', 'Wikipedia, "Origin of the Moon"'],
    checked: '2026-10-26'
  },
  {
    id: 'oldest-zircon', cat: 'earth', region: 'oceania', tier: 3, kind: 'point', unit: 'ago', at: 4.4e9, lo: 4.41e9, hi: 4.37e9,
    sources: ['Wilde, S. A. et al. (2001), Nature 409: 175–178', 'Valley, J. W. et al. (2014), "Hadean age for a post-magma-ocean zircon confirmed by atom-probe tomography", Nature Geoscience 7: 219–223', 'Wikipedia, "Jack Hills"'],
    checked: '2026-10-26'
  },
  {
    id: 'first-life', cat: 'earth', region: 'oceania', tier: 2, kind: 'point', unit: 'ago', at: 3.48e9, lo: 3.5e9, hi: 3.43e9,
    sources: ['Djokic, T. et al. (2017), "Earliest signs of life on land preserved in ca. 3.5 Ga hot spring deposits", Nature Communications 8: 15263', 'Allwood, A. C. et al. (2006), Nature 441: 714–718', 'Wikipedia, "Dresser Formation"'],
    checked: '2026-10-26'
  },
  {
    id: 'oxygen', cat: 'earth', region: 'world', tier: 2, kind: 'point', unit: 'ago', at: 2.4e9, lo: 2.46e9, hi: 2.22e9,
    sources: ['Poulton, S. W. et al. (2021), "A 200-million-year delay in permanent atmospheric oxygenation", Nature 592: 232–236', 'Gumsley, A. P. et al. (2017), PNAS 114: 1811–1816', 'Wikipedia, "Great Oxidation Event"'],
    checked: '2026-10-26'
  },
  {
    id: 'snowball', cat: 'earth', region: 'world', tier: 3, kind: 'span', unit: 'ago', lo: 7.2e8, hi: 6.35e8,
    sources: ['International Commission on Stratigraphy, International Chronostratigraphic Chart v2024/12 (Cryogenian: 720 to about 635 Ma)', 'Hoffman, P. F. et al. (2017), Science Advances 3: e1600983'],
    checked: '2026-10-26'
  },
  {
    id: 'ediacaran', cat: 'earth', region: 'americas', tier: 3, kind: 'point', unit: 'ago', at: 5.7e8, lo: 5.74e8, hi: 5.64e8,
    sources: ['Matthews, J. J. et al. (2021), "A chronostratigraphic framework for the rise of the Ediacaran macrobiota: new constraints from Mistaken Point Ecological Reserve, Newfoundland", GSA Bulletin 133: 612–624 (574.17 ± 0.66 to 564.13 ± 0.65 Ma)'],
    checked: '2026-10-26'
  },
  {
    id: 'cambrian', cat: 'earth', region: 'world', tier: 2, kind: 'span', unit: 'ago', lo: 5.39e8, hi: 5.15e8,
    sources: ['International Commission on Stratigraphy, Chart v2024/12 (base of the Cambrian 538.8 ± 0.2 Ma)', 'Wikipedia, "Geologic time scale" (checked 2026-10-26)', 'Hou, X. et al. (2017), The Cambrian Fossils of Chengjiang, China, 2nd ed., Wiley'],
    checked: '2026-10-26'
  },
  {
    id: 'land-plants', cat: 'earth', region: 'americas', tier: 2, kind: 'point', unit: 'ago', at: 4.71e8, lo: 4.73e8, hi: 4.65e8,
    sources: ['Rubinstein, C. V. et al. (2010), "Early Middle Ordovician evidence for land plants in Argentina (eastern Gondwana)", New Phytologist 188: 365–369', 'Wikipedia, "Embryophyte"'],
    checked: '2026-10-26'
  },
  {
    id: 'first-sharks', cat: 'earth', region: 'world', tier: 3, kind: 'point', unit: 'ago', at: 4.5e8, lo: 4.55e8, hi: 4.45e8,
    sources: ['Natural History Museum, London, "Shark evolution: a 450 million year timeline" (nhm.ac.uk, checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'oldest-forest', cat: 'earth', region: 'americas', tier: 3, kind: 'point', unit: 'ago', at: 3.86e8, lo: 3.88e8, hi: 3.84e8,
    sources: ['Stein, W. E. et al. (2020), "Mid-Devonian Archaeopteris roots signal revolutionary change in earliest fossil forests", Current Biology 30: 421–431'],
    checked: '2026-10-26'
  },
  {
    id: 'tiktaalik', cat: 'earth', region: 'americas', tier: 2, kind: 'point', unit: 'ago', at: 3.75e8, lo: 3.76e8, hi: 3.74e8,
    sources: ['Daeschler, E. B., Shubin, N. H. & Jenkins, F. A. (2006), "A Devonian tetrapod-like fish and the evolution of the tetrapod body plan", Nature 440: 757–763', 'Wikipedia, "Tiktaalik"'],
    checked: '2026-10-26'
  },
  {
    id: 'great-dying', cat: 'earth', region: 'world', tier: 2, kind: 'point', unit: 'ago', at: 2.519e8, lo: 2.52e8, hi: 2.518e8,
    sources: ['International Commission on Stratigraphy, Chart v2024/12 (base of the Triassic 251.902 ± 0.024 Ma)', 'Burgess, S. D. et al. (2014), PNAS 111: 3316–3321', 'Wikipedia, "Permian–Triassic extinction event"'],
    checked: '2026-10-26'
  },
  {
    id: 'first-dinosaurs', cat: 'earth', region: 'americas', tier: 1, kind: 'point', unit: 'ago', at: 2.3e8, lo: 2.33e8, hi: 2.28e8,
    sources: ['Martínez, R. N. et al. (2011), "A basal dinosaur from the dawn of the dinosaur era in southwestern Pangaea", Science 331: 206–210'],
    checked: '2026-10-26'
  },
  {
    id: 'first-mammals', cat: 'earth', region: 'world', tier: 2, kind: 'point', unit: 'ago', at: 2.05e8, lo: 2.1e8, hi: 2e8,
    sources: ['Kemp, T. S. (2005), The Origin and Evolution of Mammals, Oxford University Press', 'Kielan-Jaworowska, Z., Cifelli, R. & Luo, Z.-X. (2004), Mammals from the Age of Dinosaurs, Columbia University Press', 'Wikipedia, "Morganucodon"'],
    checked: '2026-10-26'
  },
  {
    id: 'atlantic-opens', cat: 'earth', region: 'world', tier: 2, kind: 'point', unit: 'ago', at: 1.9e8, lo: 2e8, hi: 1.75e8,
    sources: ['Labails, C. et al. (2010), "An alternative early opening scenario for the Central Atlantic Ocean", Earth and Planetary Science Letters 297: 355–368'],
    checked: '2026-10-26'
  },
  {
    id: 'stegosaurus', cat: 'earth', region: 'americas', tier: 2, kind: 'span', unit: 'ago', lo: 1.55e8, hi: 1.45e8,
    sources: ['Maidment, S. C. R. et al. (2015), "Bodyplan of Stegosaurus stenops", PLoS ONE 10: e0138352', 'Wikipedia, "Stegosaurus"'],
    checked: '2026-10-26'
  },
  {
    id: 'archaeopteryx', cat: 'earth', region: 'europe', tier: 2, kind: 'point', unit: 'ago', at: 1.5e8, lo: 1.52e8, hi: 1.48e8,
    sources: ['Rauhut, O. W. M., Foth, C. & Tischlinger, H. (2018), "The oldest Archaeopteryx", PeerJ 6: e4191', 'Wikipedia, "Archaeopteryx"'],
    checked: '2026-10-26'
  },
  {
    id: 'flowers', cat: 'earth', region: 'asia', tier: 2, kind: 'point', unit: 'ago', at: 1.25e8, lo: 1.26e8, hi: 1.24e8,
    sources: ['Sun, G. et al. (2002), "Archaefructaceae, a new basal angiosperm family", Science 296: 899–904', 'Wikipedia, "Archaefructus"'],
    checked: '2026-10-26'
  },
  {
    id: 't-rex', cat: 'earth', region: 'americas', tier: 1, kind: 'span', unit: 'ago', lo: 6.8e7, hi: 6.6e7,
    sources: ['Wikipedia, "Tyrannosaurus" (Maastrichtian, about 68–66 Ma)', 'Fowler, D. W. (2017), PLoS ONE 12: e0188426'],
    checked: '2026-10-26'
  },
  {
    id: 'dino-extinction', cat: 'earth', region: 'americas', tier: 1, kind: 'point', unit: 'ago', at: 6.6e7, lo: 6.605e7, hi: 6.595e7,
    sources: ['Renne, P. R. et al. (2013), "Time scales of critical events around the Cretaceous-Paleogene boundary", Science 339: 684–687 (66.043 ± 0.011 Ma)', 'ICS Chart v2024/12'],
    checked: '2026-10-26'
  },
  {
    id: 'himalaya', cat: 'earth', region: 'asia', tier: 2, kind: 'point', unit: 'ago', at: 5.2e7, lo: 5.5e7, hi: 5e7,
    sources: ['Najman, Y. et al. (2010), "Timing of India-Asia collision", Journal of Geophysical Research 115: B12416', 'Hu, X. et al. (2016), Earth-Science Reviews 160: 264–299'],
    checked: '2026-10-26'
  },
  {
    id: 'antarctic-ice', cat: 'earth', region: 'world', tier: 3, kind: 'point', unit: 'ago', at: 3.39e7, lo: 3.41e7, hi: 3.36e7,
    sources: ['Zachos, J. et al. (2001), "Trends, rhythms, and aberrations in global climate 65 Ma to present", Science 292: 686–693', 'ICS Chart v2024/12 (Eocene/Oligocene boundary 33.9 Ma)', 'Wikipedia, "Antarctic ice sheet"'],
    checked: '2026-10-26'
  },
  {
    id: 'stone-tools', cat: 'tech', region: 'africa', tier: 2, kind: 'point', unit: 'ago', at: 3.3e6, lo: 3.4e6, hi: 3.2e6,
    sources: ['Harmand, S. et al. (2015), "3.3-million-year-old stone tools from Lomekwi 3, West Turkana, Kenya", Nature 521: 310–315'],
    checked: '2026-10-26'
  },
  {
    id: 'lucy', cat: 'earth', region: 'africa', tier: 1, kind: 'point', unit: 'ago', at: 3.18e6, lo: 3.22e6, hi: 3.18e6,
    sources: ['Johanson, D. C. & Taieb, M. (1976), Nature 260: 293–297', 'Wikipedia, "Lucy (hominid)" (3.22–3.18 Ma)'],
    checked: '2026-10-26'
  },
  {
    id: 'panama', cat: 'earth', region: 'americas', tier: 3, kind: 'point', unit: 'ago', at: 2.8e6, lo: 3e6, hi: 2.7e6,
    sources: ['O\'Dea, A. et al. (2016), "Formation of the Isthmus of Panama", Science Advances 2: e1600883'],
    checked: '2026-10-26'
  },
  {
    id: 'dmanisi', cat: 'explore', region: 'asia', tier: 2, kind: 'point', unit: 'ago', at: 1.8e6, lo: 1.85e6, hi: 1.77e6,
    sources: ['Ferring, R. et al. (2011), "Earliest human occupations at Dmanisi (Georgian Caucasus) dated to 1.85–1.78 Ma", PNAS 108: 10432–10436'],
    checked: '2026-10-26'
  },
  {
    id: 'fire', cat: 'tech', region: 'africa', tier: 2, kind: 'point', unit: 'ago', at: 1e6, lo: 1.07e6, hi: 900000,
    sources: ['Berna, F. et al. (2012), "Microstratigraphic evidence of in situ fire in the Acheulean strata of Wonderwerk Cave", PNAS 109: E1215–E1220'],
    checked: '2026-10-26'
  },
  {
    id: 'homo-sapiens', cat: 'earth', region: 'africa', tier: 1, kind: 'point', unit: 'ago', at: 315000, lo: 349000, hi: 281000,
    sources: ['Richter, D. et al. (2017), "The age of the hominin fossils from Jebel Irhoud, Morocco, and the origins of the Middle Stone Age", Nature 546: 293–296'],
    checked: '2026-10-26'
  },
  {
    id: 'blombos', cat: 'culture', region: 'africa', tier: 2, kind: 'point', unit: 'ago', at: 73000, lo: 75000, hi: 71000,
    sources: ['Henshilwood, C. S. et al. (2018), "An abstract drawing from the 73,000-year-old levels at Blombos Cave, South Africa", Nature 562: 115–118'],
    checked: '2026-10-26'
  },
  {
    id: 'sulawesi-art', cat: 'culture', region: 'asia', tier: 2, kind: 'point', unit: 'ago', at: 53500, lo: 55800, hi: 51200,
    sources: ['Oktaviana, A. A. et al. (2024), "Narrative cave art in Indonesia by 51,200 years ago", Nature 631: 814–818'],
    checked: '2026-10-26'
  },
  {
    id: 'australia', cat: 'explore', region: 'oceania', tier: 2, kind: 'point', unit: 'ago', at: 55000, lo: 65000, hi: 47000,
    sources: ['Clarkson, C. et al. (2017), "Human occupation of northern Australia by 65,000 years ago", Nature 547: 306–310', 'O\'Connell, J. F. et al. (2018), PNAS 115: 8482–8490'],
    checked: '2026-10-26'
  },
  {
    id: 'flutes', cat: 'culture', region: 'europe', tier: 2, kind: 'point', unit: 'ago', at: 42500, lo: 43000, hi: 42000,
    sources: ['Higham, T. et al. (2012), "Testing models for the beginnings of the Aurignacian and the advent of figurative art and music", Journal of Human Evolution 62: 664–676'],
    checked: '2026-10-26'
  },
  {
    id: 'chauvet', cat: 'culture', region: 'europe', tier: 2, kind: 'point', unit: 'ago', at: 35000, lo: 37000, hi: 33500,
    sources: ['Quiles, A. et al. (2016), "A high-precision chronological model for the decorated Upper Paleolithic cave of Chauvet-Pont d\'Arc", PNAS 113: 4670–4675', 'Wikipedia, "Chauvet Cave"'],
    checked: '2026-10-26'
  },
  {
    id: 'last-glacial-max', cat: 'earth', region: 'world', tier: 2, kind: 'span', unit: 'ago', lo: 26500, hi: 19000,
    sources: ['Clark, P. U. et al. (2009), "The Last Glacial Maximum", Science 325: 710–714'],
    checked: '2026-10-26'
  },
  {
    id: 'pottery', cat: 'tech', region: 'asia', tier: 2, kind: 'point', unit: 'ago', at: 20000, lo: 20500, hi: 19000,
    sources: ['Wu, X. et al. (2012), "Early pottery at 20,000 years ago in Xianrendong Cave, China", Science 336: 1696–1700'],
    checked: '2026-10-26'
  },
  {
    id: 'bread', cat: 'everyday', region: 'asia', tier: 2, kind: 'point', unit: 'ago', at: 14400, lo: 14600, hi: 14200,
    sources: ['Arranz-Otaegui, A. et al. (2018), "Archaeobotanical evidence reveals the origins of bread 14,400 years ago in northeastern Jordan", PNAS 115: 7925–7930'],
    checked: '2026-10-26'
  },
  {
    id: 'clovis', cat: 'tech', region: 'americas', tier: 3, kind: 'span', unit: 'ago', lo: 13050, hi: 12750,
    sources: ['Waters, M. R. et al. (2020), "The age of Clovis — 13,050 to 12,750 cal yr B.P.", Science Advances 6: eaaz0455'],
    checked: '2026-10-26'
  },
  {
    id: 'holocene', cat: 'earth', region: 'world', tier: 2, kind: 'point', unit: 'year', at: -9699, lo: -9799, hi: -9599,
    sources: ['Walker, M. et al. (2009), "Formal definition and dating of the GSSP for the base of the Holocene using the Greenland NGRIP ice core", Journal of Quaternary Science 24: 3–17'],
    checked: '2026-10-26'
  },
  {
    id: 'gobekli', cat: 'culture', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: -9599, lo: -9749, hi: -9299,
    sources: ['Dietrich, O. et al. (2013), "The role of cult and feasting in the emergence of Neolithic communities", Antiquity 86: 674–695', 'German Archaeological Institute, "The Tepe Telegrams: dating" (dainst.blog, checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'farming', cat: 'everyday', region: 'asia', tier: 1, kind: 'point', unit: 'year', at: -9499, lo: -9999, hi: -8999,
    sources: ['Zeder, M. A. (2011), "The origins of agriculture in the Near East", Current Anthropology 52 (S4): S221–S235', 'Wikipedia, "Neolithic Revolution"'],
    checked: '2026-10-26'
  },
  {
    id: 'cat', cat: 'everyday', region: 'asia', tier: 3, kind: 'point', unit: 'year', at: -7499, lo: -7599, hi: -7199,
    sources: ['Vigne, J.-D. et al. (2004), "Early taming of the cat in Cyprus", Science 304: 259', 'Wikipedia, "Cat"'],
    checked: '2026-10-26'
  },
  {
    id: 'maize', cat: 'everyday', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: -6749, lo: -7099, hi: -6499,
    sources: ['Matsuoka, Y. et al. (2002), PNAS 99: 6080–6084', 'Piperno, D. R. et al. (2009), "Starch grain and phytolith evidence for early ninth millennium B.P. maize from the Central Balsas River Valley, Mexico", PNAS 106: 5019–5024', 'Wikipedia, "Maize"'],
    checked: '2026-10-26'
  },
  {
    id: 'dufuna', cat: 'tech', region: 'africa', tier: 3, kind: 'point', unit: 'year', at: -6299, lo: -6555, hi: -6004,
    sources: ['Breunig, P. (1996), "The 8000-year-old dugout canoe from Dufuna (NE Nigeria)", in Pwiti, G. & Soper, R. (eds.), Aspects of African Archaeology, University of Zimbabwe Publications', 'Wikipedia, "Dufuna canoe" (checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'cacao', cat: 'everyday', region: 'americas', tier: 3, kind: 'point', unit: 'year', at: -3399, lo: -3499, hi: -3349,
    sources: ['Zarrillo, S. et al. (2018), "The use and domestication of Theobroma cacao during the mid-Holocene in the upper Amazon", Nature Ecology & Evolution 2: 1879–1888'],
    checked: '2026-10-26'
  },
  {
    id: 'wheel', cat: 'tech', region: 'world', tier: 1, kind: 'point', unit: 'year', at: -3499, lo: -3599, hi: -3299,
    sources: ['Anthony, D. W. (2007), The Horse, the Wheel, and Language, Princeton University Press, ch. 4', 'Bakker, J. A. et al. (1999), Antiquity 73: 778–790'],
    checked: '2026-10-26'
  },
  {
    id: 'egypt-writing', cat: 'culture', region: 'africa', tier: 2, kind: 'point', unit: 'year', at: -3249, lo: -3399, hi: -3149,
    sources: ['Dreyer, G. (1998), Umm el-Qaab I, Mainz: von Zabern', 'Baines, J. (2004), "The earliest Egyptian writing", in Houston, S. (ed.), The First Writing, Cambridge University Press', 'Wikipedia, "Egyptian hieroglyphs"'],
    checked: '2026-10-26'
  },
  {
    id: 'cuneiform', cat: 'culture', region: 'asia', tier: 1, kind: 'point', unit: 'year', at: -3199, lo: -3399, hi: -3099,
    sources: ['Woods, C. (ed.) (2010), Visible Language: Inventions of Writing in the Ancient Middle East and Beyond, Oriental Institute, University of Chicago', 'Wikipedia, "Cuneiform"'],
    checked: '2026-10-26'
  },
  {
    id: 'caral', cat: 'culture', region: 'americas', tier: 3, kind: 'span', unit: 'year', lo: -2599, hi: -1999,
    sources: ['Shady Solís, R., Haas, J. & Creamer, W. (2001), "Dating Caral, a preceramic site in the Supe Valley on the central coast of Peru", Science 292: 723–726'],
    checked: '2026-10-26'
  },
  {
    id: 'great-pyramid', cat: 'culture', region: 'africa', tier: 1, kind: 'point', unit: 'year', at: -2559, lo: -2599, hi: -2499,
    sources: ['Lehner, M. (1997), The Complete Pyramids, Thames & Hudson', 'Wikipedia, "Great Pyramid of Giza"'],
    checked: '2026-10-26'
  },
  {
    id: 'stonehenge', cat: 'culture', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: -2499, lo: -2599, hi: -2399,
    sources: ['English Heritage, "History of Stonehenge"', 'Darvill, T. et al. (2012), "Stonehenge remodelled", Antiquity 86: 1021–1040'],
    checked: '2026-10-26'
  },
  {
    id: 'indus', cat: 'culture', region: 'asia', tier: 2, kind: 'span', unit: 'year', lo: -2599, hi: -1899,
    sources: ['Possehl, G. L. (2002), The Indus Civilization: A Contemporary Perspective, AltaMira Press', 'Wikipedia, "Indus Valley Civilisation"'],
    checked: '2026-10-26'
  },
  {
    id: 'mammoths', cat: 'earth', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: -2049, lo: -2199, hi: -1899,
    sources: ['Arppe, L. et al. (2019), "Thriving or surviving? The isotopic record of the Wrangel Island woolly mammoth population", Quaternary Science Reviews 222: 105884', 'University of Tübingen press release, 7 Oct 2019 (checked 2026-10-26)', 'Dehasque, M. et al. (2024), "Temporal dynamics of woolly mammoth genome erosion prior to extinction", Cell 187: 3531–3540'],
    checked: '2026-10-26'
  },
  {
    id: 'plimpton', cat: 'science', region: 'asia', tier: 3, kind: 'point', unit: 'year', at: -1789, lo: -1821, hi: -1761,
    sources: ['Robson, E. (2001), "Neither Sherlock Holmes nor Babylon: a reassessment of Plimpton 322", Historia Mathematica 28: 167–206'],
    checked: '2026-10-26'
  },
  {
    id: 'oracle-bones', cat: 'culture', region: 'asia', tier: 2, kind: 'span', unit: 'year', lo: -1249, hi: -1049,
    sources: ['Keightley, D. N. (1978), Sources of Shang History, University of California Press', 'Wikipedia, "Oracle bone script"'],
    checked: '2026-10-26'
  },
  {
    id: 'olmec', cat: 'culture', region: 'americas', tier: 3, kind: 'span', unit: 'year', lo: -1199, hi: -899,
    sources: ['Diehl, R. A. (2004), The Olmecs: America\'s First Civilization, Thames & Hudson', 'Wikipedia, "San Lorenzo Tenochtitlán"'],
    checked: '2026-10-26'
  },
  {
    id: 'lapita', cat: 'explore', region: 'oceania', tier: 3, kind: 'point', unit: 'year', at: -887, lo: -895, hi: -879,
    sources: ['Burley, D., Weisler, M. I. & Zhao, J. (2012), "High precision U/Th dating of first Polynesian settlement", PLoS ONE 7: e48769 (2838 ± 8 BP)'],
    checked: '2026-10-26'
  },
  {
    id: 'olympics', cat: 'everyday', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: -775, lo: -789, hi: -759,
    sources: ['Wikipedia, "Ancient Olympic Games"', 'Golden, M. (2004), Sport in the Ancient World from A to Z, Routledge'],
    checked: '2026-10-26'
  },
  {
    id: 'nok', cat: 'culture', region: 'africa', tier: 3, kind: 'span', unit: 'year', lo: -899, hi: 1,
    sources: ['Breunig, P. & Rupp, N. (2016), "An outline of recent studies on the Nigerian Nok culture", Journal of African Archaeology 14: 237–255'],
    checked: '2026-10-26'
  },
  {
    id: 'euclid', cat: 'science', region: 'africa', tier: 3, kind: 'point', unit: 'year', at: -299, lo: -309, hi: -279,
    sources: ['Heath, T. L. (1908), The Thirteen Books of Euclid\'s Elements, Cambridge University Press', 'Wikipedia, "Euclid"'],
    checked: '2026-10-26'
  },
  {
    id: 'eratosthenes', cat: 'science', region: 'africa', tier: 2, kind: 'point', unit: 'year', at: -239, lo: -249, hi: -229,
    sources: ['Wikipedia, "Eratosthenes"', 'Dutka, J. (1993), "Eratosthenes\' measurement of the Earth reconsidered", Archive for History of Exact Sciences 46: 55–66'],
    checked: '2026-10-26'
  },
  {
    id: 'terracotta', cat: 'culture', region: 'asia', tier: 1, kind: 'span', unit: 'year', lo: -245, hi: -207,
    sources: ['UNESCO World Heritage List no. 441, "Mausoleum of the First Qin Emperor"', 'Wikipedia, "Terracotta Army"'],
    checked: '2026-10-26'
  },
  {
    id: 'nazca', cat: 'culture', region: 'americas', tier: 2, kind: 'span', unit: 'year', lo: -499, hi: 500,
    sources: ['UNESCO World Heritage List no. 700, "Lines and Geoglyphs of Nasca and Palpa"', 'Wikipedia, "Nazca lines"'],
    checked: '2026-10-26'
  },
  {
    id: 'zhang-qian', cat: 'explore', region: 'asia', tier: 3, kind: 'span', unit: 'year', lo: -137, hi: -125,
    sources: ['Wikipedia, "Zhang Qian"', 'Hansen, V. (2012), The Silk Road: A New History, Oxford University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'cleopatra', cat: 'culture', region: 'africa', tier: 1, kind: 'span', unit: 'year', lo: -68, hi: -29,
    sources: ['Wikipedia, "Cleopatra"', 'Roller, D. W. (2010), Cleopatra: A Biography, Oxford University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'long-count', cat: 'science', region: 'americas', tier: 3, kind: 'point', unit: 'year', at: -35, lo: -35, hi: -35,
    sources: ['Wikipedia, "Mesoamerican Long Count calendar" (Stela 2, Chiapa de Corzo: 7.16.3.2.13, December 36 BCE)'],
    checked: '2026-10-26'
  },
  {
    id: 'cai-lun', cat: 'tech', region: 'asia', tier: 1, kind: 'point', unit: 'year', at: 105, lo: 105, hi: 105,
    sources: ['Fan Ye, Book of the Later Han (Hou Hanshu), biography of Cai Lun', 'Tsien, T.-H. (1985), Paper and Printing, in Needham, J. (ed.), Science and Civilisation in China 5/1, Cambridge University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'pantheon', cat: 'tech', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 125, lo: 113, hi: 128,
    sources: ['Wikipedia, "Pantheon, Rome"', 'MacDonald, W. L. (1976), The Pantheon: Design, Meaning, and Progeny, Harvard University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'zhang-heng', cat: 'tech', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 132, lo: 132, hi: 132,
    sources: ['Wikipedia, "Zhang Heng"', 'Needham, J. (1959), Science and Civilisation in China 3, Cambridge University Press, pp. 626–635'],
    checked: '2026-10-26'
  },
  {
    id: 'teotihuacan', cat: 'culture', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 200, lo: 1, hi: 310,
    sources: ['Sugiyama, N., Sugiyama, S. & Sarabia G., A. (2013), "Inside the Sun Pyramid at Teotihuacan, Mexico: 2008–2011 excavations and preliminary results", Latin American Antiquity 24: 403–432', 'Sload, R. (2015), "When was the Sun Pyramid built?", Latin American Antiquity 26: 221–241'],
    checked: '2026-10-26'
  },
  {
    id: 'aksum', cat: 'culture', region: 'africa', tier: 3, kind: 'point', unit: 'year', at: 330, lo: 250, hi: 400,
    sources: ['UNESCO World Heritage List no. 15, "Aksum"', 'Phillipson, D. W. (2012), Foundations of an African Civilisation: Aksum and the Northern Horn, James Currey (largest stelae: late 3rd to mid-4th century)'],
    checked: '2026-10-26'
  },
  {
    id: 'aryabhata', cat: 'science', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 499, lo: 499, hi: 499,
    sources: ['Wikipedia, "Aryabhata"', 'Plofker, K. (2009), Mathematics in India, Princeton University Press', 'Wikipedia, "Aryabhatiya"'],
    checked: '2026-10-26'
  },
  {
    id: 'chess', cat: 'everyday', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 600, lo: 550, hi: 650,
    sources: ['Murray, H. J. R. (1913), A History of Chess, Oxford University Press', 'Wikipedia, "Chaturanga"'],
    checked: '2026-10-26'
  },
  {
    id: 'brahmagupta', cat: 'science', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 628, lo: 628, hi: 628,
    sources: ['Plofker, K. (2009), Mathematics in India, Princeton University Press', 'Wikipedia, "Brahmagupta"', 'Wikipedia, "Brahmasphutasiddhanta"'],
    checked: '2026-10-26'
  },
  {
    id: 'al-khwarizmi', cat: 'science', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 820, lo: 813, hi: 833,
    sources: ['Wikipedia, "Al-Khwarizmi"', 'Rashed, R. (2009), Al-Khwarizmi: The Beginnings of Algebra, Saqi', 'Wikipedia, "The Compendious Book on Calculation by Completion and Balancing"'],
    checked: '2026-10-26'
  },
  {
    id: 'dated-print', cat: 'tech', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 868, lo: 868, hi: 868,
    sources: ['British Library, Or.8210/P.2', 'Wikipedia, "Diamond Sutra" (checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'genji', cat: 'culture', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1008, lo: 1000, hi: 1012,
    sources: ['Wikipedia, "The Tale of Genji"', 'Shirane, H. (1987), The Bridge of Dreams, Stanford University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'al-haytham', cat: 'science', region: 'africa', tier: 2, kind: 'span', unit: 'year', lo: 1011, hi: 1021,
    sources: ['Wikipedia, "Book of Optics"', 'Sabra, A. I. (1989), The Optics of Ibn al-Haytham, Warburg Institute'],
    checked: '2026-10-26'
  },
  {
    id: 'vinland', cat: 'explore', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 1021, lo: 1021, hi: 1021,
    sources: ['Kuitems, M. et al. (2022), "Evidence for European presence in the Americas in AD 1021", Nature 601: 388–391 (online 20 Oct 2021)'],
    checked: '2026-10-26'
  },
  {
    id: 'paper-money', cat: 'everyday', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1024, lo: 1023, hi: 1024,
    sources: ['Wikipedia, "Jiaozi (currency)" (checked 2026-10-26); von Glahn, R. (2016), An Economic History of China, Cambridge University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'ibn-sina', cat: 'science', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1025, lo: 1020, hi: 1025,
    sources: ['Wikipedia, "The Canon of Medicine"', 'Gutas, D., "Ibn Sina", Stanford Encyclopedia of Philosophy'],
    checked: '2026-10-26'
  },
  {
    id: 'bi-sheng', cat: 'tech', region: 'asia', tier: 2, kind: 'span', unit: 'year', lo: 1041, hi: 1048,
    sources: ['Shen Kuo, Dream Pool Essays (1088)', 'Wikipedia, "Bi Sheng" and "Shen Kuo" (checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'supernova', cat: 'science', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1054, lo: 1054, hi: 1054,
    sources: ['Stephenson, F. R. & Green, D. A. (2003), "The historical supernovae", arXiv:astro-ph/0301603 (checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'cahokia', cat: 'culture', region: 'americas', tier: 3, kind: 'span', unit: 'year', lo: 1050, hi: 1200,
    sources: ['Pauketat, T. R. (2009), Cahokia: Ancient America\'s Great City on the Mississippi, Viking', 'UNESCO World Heritage List no. 198'],
    checked: '2026-10-26'
  },
  {
    id: 'compass', cat: 'tech', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1088, lo: 1086, hi: 1093,
    sources: ['Shen Kuo, Dream Pool Essays (c. 1088)', 'Wikipedia, "Shen Kuo" (checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'oxford', cat: 'culture', region: 'europe', tier: 3, kind: 'point', unit: 'year', at: 1096, lo: 1096, hi: 1096,
    sources: ['University of Oxford, "Introduction and history" (ox.ac.uk)'],
    checked: '2026-10-26'
  },
  {
    id: 'angkor', cat: 'culture', region: 'asia', tier: 2, kind: 'span', unit: 'year', lo: 1113, hi: 1150,
    sources: ['UNESCO World Heritage List no. 668, "Angkor"', 'Wikipedia, "Angkor Wat"'],
    checked: '2026-10-26'
  },
  {
    id: 'great-zimbabwe', cat: 'culture', region: 'africa', tier: 2, kind: 'span', unit: 'year', lo: 1100, hi: 1450,
    sources: ['UNESCO World Heritage List no. 364, "Great Zimbabwe National Monument" (checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'al-jazari', cat: 'tech', region: 'asia', tier: 3, kind: 'point', unit: 'year', at: 1206, lo: 1206, hi: 1206,
    sources: ['Hill, D. R. (trans.) (1974), The Book of Knowledge of Ingenious Mechanical Devices, Reidel', 'Wikipedia, "Ismail al-Jazari"'],
    checked: '2026-10-26'
  },
  {
    id: 'rapa-nui', cat: 'explore', region: 'oceania', tier: 3, kind: 'point', unit: 'year', at: 1200, lo: 1150, hi: 1290,
    sources: ['Hunt, T. L. & Lipo, C. P. (2006), "Late colonization of Easter Island", Science 311: 1603–1606', 'Wilmshurst, J. M. et al. (2011), PNAS 108: 1815–1820'],
    checked: '2026-10-26'
  },
  {
    id: 'aotearoa', cat: 'explore', region: 'oceania', tier: 2, kind: 'span', unit: 'year', lo: 1230, hi: 1282,
    sources: ['Wilmshurst, J. M. et al. (2011), "High-precision radiocarbon dating shows recent and rapid initial human colonization of East Polynesia", PNAS 108: 1815–1820'],
    checked: '2026-10-26'
  },
  {
    id: 'tenochtitlan', cat: 'culture', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 1325, lo: 1320, hi: 1350,
    sources: ['Wikipedia, "Tenochtitlan"', 'Smith, M. E. (2012), The Aztecs, 3rd ed., Wiley-Blackwell'],
    checked: '2026-10-26'
  },
  {
    id: 'ibn-battuta', cat: 'explore', region: 'africa', tier: 2, kind: 'span', unit: 'year', lo: 1325, hi: 1354,
    sources: ['Dunn, R. E. (2012), The Adventures of Ibn Battuta, 3rd ed., University of California Press', 'Wikipedia, "Ibn Battuta" (about 117,000 km)'],
    checked: '2026-10-26'
  },
  {
    id: 'zheng-he', cat: 'explore', region: 'asia', tier: 2, kind: 'span', unit: 'year', lo: 1405, hi: 1433,
    sources: ['Dreyer, E. L. (2007), Zheng He: China and the Oceans in the Early Ming Dynasty, Pearson Longman'],
    checked: '2026-10-26'
  },
  {
    id: 'machu-picchu', cat: 'culture', region: 'americas', tier: 1, kind: 'span', unit: 'year', lo: 1420, hi: 1530,
    sources: ['Burger, R. L. et al. (2021), "New AMS dates for Machu Picchu", Antiquity 95: 1265–1279'],
    checked: '2026-10-26'
  },
  {
    id: 'ulugh-beg', cat: 'science', region: 'asia', tier: 3, kind: 'point', unit: 'year', at: 1424, lo: 1420, hi: 1429,
    sources: ['Wikipedia, "Ulugh Beg Observatory" (checked 2026-10-26)', 'MacTutor History of Mathematics, "Ulugh Beg"'],
    checked: '2026-10-26'
  },
  {
    id: 'hangul', cat: 'culture', region: 'asia', tier: 1, kind: 'point', unit: 'year', at: 1443, lo: 1443, hi: 1446,
    sources: ['Wikipedia, "Hangul"', 'Kim-Renaud, Y.-K. (ed.) (1997), The Korean Alphabet, University of Hawai\'i Press'],
    checked: '2026-10-26'
  },
  {
    id: 'coffee', cat: 'everyday', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1450, lo: 1430, hi: 1470,
    sources: ['Wikipedia, "Coffee" (checked 2026-10-26)', 'Hattox, R. S. (1985), Coffee and Coffeehouses, University of Washington Press'],
    checked: '2026-10-26'
  },
  {
    id: 'gutenberg', cat: 'tech', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: 1455, lo: 1454, hi: 1455,
    sources: ['Wikipedia, "Gutenberg Bible"', 'Man, J. (2002), The Gutenberg Revolution, Review'],
    checked: '2026-10-26'
  },
  {
    id: 'leonardo', cat: 'culture', region: 'europe', tier: 1, kind: 'span', unit: 'year', lo: 1452, hi: 1519,
    sources: ['Wikipedia, "Leonardo da Vinci"', 'Kemp, M. (2006), Leonardo da Vinci, Oxford University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'circumnavigation', cat: 'explore', region: 'world', tier: 1, kind: 'span', unit: 'year', lo: 1519, hi: 1522,
    sources: ['Wikipedia, "Magellan expedition"', 'Bergreen, L. (2003), Over the Edge of the World, Morrow'],
    checked: '2026-10-26'
  },
  {
    id: 'kabuki', cat: 'culture', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1603, lo: 1603, hi: 1603,
    sources: ['Wikipedia, "Izumo no Okuni" and "Kabuki" (checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'galileo-moons', cat: 'science', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: 1610, lo: 1610, hi: 1610,
    sources: ['Galilei, G. (1610), Sidereus Nuncius', 'Wikipedia, "Galilean moons"'],
    checked: '2026-10-26'
  },
  {
    id: 'taj-mahal', cat: 'culture', region: 'asia', tier: 1, kind: 'span', unit: 'year', lo: 1632, hi: 1653,
    sources: ['UNESCO World Heritage List no. 252, "Taj Mahal"', 'Wikipedia, "Taj Mahal"'],
    checked: '2026-10-26'
  },
  {
    id: 'newton', cat: 'science', region: 'europe', tier: 2, kind: 'span', unit: 'year', lo: 1643, hi: 1727,
    sources: ['Wikipedia, "Isaac Newton"', 'Westfall, R. S. (1980), Never at Rest, Cambridge University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'sor-juana', cat: 'culture', region: 'americas', tier: 3, kind: 'span', unit: 'year', lo: 1648, hi: 1695,
    sources: ['Wikipedia, "Juana Inés de la Cruz"', 'Paz, O. (1982), Sor Juana Inés de la Cruz o las trampas de la fe, Seix Barral'],
    checked: '2026-10-26'
  },
  {
    id: 'dodo', cat: 'earth', region: 'africa', tier: 2, kind: 'point', unit: 'year', at: 1662, lo: 1662, hi: 1662,
    sources: ['Cheke, A. S. (1987), in Diamond, A. W. (ed.), Studies of Mascarene Island Birds, Cambridge University Press', 'Roberts, D. L. & Solow, A. R. (2003), "When did the dodo become extinct?", Nature 426: 245', 'Wikipedia, "Dodo"'],
    checked: '2026-10-26'
  },
  {
    id: 'leeuwenhoek', cat: 'science', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1676, lo: 1676, hi: 1676,
    sources: ['Lane, N. (2015), "The unseen world: reflections on Leeuwenhoek (1677)", Philosophical Transactions of the Royal Society B 370: 20140344', 'Wikipedia, "Antonie van Leeuwenhoek"'],
    checked: '2026-10-26'
  },
  {
    id: 'piano', cat: 'culture', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1700, lo: 1698, hi: 1700,
    sources: ['Wikipedia, "Bartolomeo Cristofori"', 'Pollens, S. (1995), The Early Pianoforte, Cambridge University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'newcomen', cat: 'tech', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1712, lo: 1712, hi: 1712,
    sources: ['Wikipedia, "Newcomen atmospheric engine"', 'Rolt, L. T. C. & Allen, J. S. (1977), The Steam Engine of Thomas Newcomen, Moorland'],
    checked: '2026-10-26'
  },
  {
    id: 'franklin', cat: 'science', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 1752, lo: 1752, hi: 1752,
    sources: ['Wikipedia, "Kite experiment"', 'Franklin Institute, "Ben Franklin\'s kite experiment"'],
    checked: '2026-10-26'
  },
  {
    id: 'mozart', cat: 'culture', region: 'europe', tier: 1, kind: 'span', unit: 'year', lo: 1756, hi: 1791,
    sources: ['Wikipedia, "Wolfgang Amadeus Mozart"', 'Solomon, M. (1995), Mozart: A Life, HarperCollins'],
    checked: '2026-10-26'
  },
  {
    id: 'wang-zhenyi', cat: 'science', region: 'asia', tier: 3, kind: 'span', unit: 'year', lo: 1768, hi: 1797,
    sources: ['Wikipedia, "Wang Zhenyi (astronomer)"', 'Peterson, B. B. (ed.) (2000), Notable Women of China, M. E. Sharpe'],
    checked: '2026-10-26'
  },
  {
    id: 'uranus', cat: 'science', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1781, lo: 1781, hi: 1781,
    sources: ['Wikipedia, "Uranus"', 'Herschel, W. (1781), Philosophical Transactions 71: 492–501'],
    checked: '2026-10-26'
  },
  {
    id: 'balloon', cat: 'tech', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1783, lo: 1783, hi: 1783,
    sources: ['Wikipedia, "Montgolfier brothers"'],
    checked: '2026-10-26'
  },
  {
    id: 'vaccine', cat: 'science', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: 1796, lo: 1796, hi: 1796,
    sources: ['Riedel, S. (2005), "Edward Jenner and the history of smallpox and vaccination", Baylor University Medical Center Proceedings 18: 21–25'],
    checked: '2026-10-26'
  },
  {
    id: 'battery', cat: 'science', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1800, lo: 1799, hi: 1800,
    sources: ['Wikipedia, "Voltaic pile"'],
    checked: '2026-10-26'
  },
  {
    id: 'anaesthesia', cat: 'science', region: 'asia', tier: 3, kind: 'point', unit: 'year', at: 1804, lo: 1804, hi: 1804,
    sources: ['Izuo, M. (2004), "Medical history: Seishu Hanaoka and his success in breast cancer surgery under general anesthesia two hundred years ago", Breast Cancer 11: 319–324'],
    checked: '2026-10-26'
  },
  {
    id: 'tambora', cat: 'earth', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1815, lo: 1815, hi: 1815,
    sources: ['Oppenheimer, C. (2003), "Climatic, environmental and human consequences of the largest known historic eruption: Tambora volcano (Indonesia) 1815", Progress in Physical Geography 27: 230–259', 'Wikipedia, "1815 eruption of Mount Tambora"'],
    checked: '2026-10-26'
  },
  {
    id: 'railway', cat: 'tech', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: 1825, lo: 1825, hi: 1825,
    sources: ['Wikipedia, "Stockton and Darlington Railway"'],
    checked: '2026-10-26'
  },
  {
    id: 'photograph', cat: 'tech', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1827, lo: 1826, hi: 1827,
    sources: ['Harry Ransom Center, University of Texas, "The Niépce Heliograph"', 'Wikipedia, "View from the Window at Le Gras"'],
    checked: '2026-10-26'
  },
  {
    id: 'braille', cat: 'everyday', region: 'europe', tier: 3, kind: 'point', unit: 'year', at: 1829, lo: 1829, hi: 1829,
    sources: ['Wikipedia, "Braille"', 'Mellor, C. M. (2006), Louis Braille: A Touch of Genius, National Braille Press'],
    checked: '2026-10-26'
  },
  {
    id: 'great-wave', cat: 'culture', region: 'asia', tier: 1, kind: 'point', unit: 'year', at: 1831, lo: 1830, hi: 1832,
    sources: ['British Museum, "Under the wave off Kanagawa"', 'Wikipedia, "The Great Wave off Kanagawa"'],
    checked: '2026-10-26'
  },
  {
    id: 'lovelace', cat: 'science', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1843, lo: 1843, hi: 1843,
    sources: ['Wikipedia, "Ada Lovelace"', 'Hollings, C., Martin, U. & Rice, A. (2018), Ada Lovelace: The Making of a Computer Scientist, Bodleian Library'],
    checked: '2026-10-26'
  },
  {
    id: 'fax', cat: 'tech', region: 'europe', tier: 3, kind: 'point', unit: 'year', at: 1843, lo: 1843, hi: 1843,
    sources: ['Wikipedia, "Fax" (British patent 9745, 1843)'],
    checked: '2026-10-26'
  },
  {
    id: 'telegraph', cat: 'tech', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 1844, lo: 1844, hi: 1844,
    sources: ['Library of Congress, "Samuel F. B. Morse Papers"', 'Wikipedia, "Electrical telegraph"'],
    checked: '2026-10-26'
  },
  {
    id: 'darwin', cat: 'science', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: 1859, lo: 1859, hi: 1859,
    sources: ['Wikipedia, "On the Origin of Species"'],
    checked: '2026-10-26'
  },
  {
    id: 'periodic-table', cat: 'science', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1869, lo: 1869, hi: 1869,
    sources: ['Wikipedia, "Dmitri Mendeleev"', 'Gordin, M. D. (2004), A Well-Ordered Thing, Basic Books'],
    checked: '2026-10-26'
  },
  {
    id: 'curie', cat: 'science', region: 'europe', tier: 2, kind: 'span', unit: 'year', lo: 1867, hi: 1934,
    sources: ['Nobel Prize Outreach, "Marie Curie — Biographical" (nobelprize.org)'],
    checked: '2026-10-26'
  },
  {
    id: 'telephone', cat: 'tech', region: 'americas', tier: 1, kind: 'point', unit: 'year', at: 1876, lo: 1876, hi: 1876,
    sources: ['Wikipedia, "Invention of the telephone"'],
    checked: '2026-10-26'
  },
  {
    id: 'krakatoa', cat: 'earth', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1883, lo: 1883, hi: 1883,
    sources: ['Winchester, S. (2003), Krakatoa, HarperCollins', 'Wikipedia, "1883 eruption of Krakatoa"'],
    checked: '2026-10-26'
  },
  {
    id: 'car', cat: 'tech', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: 1886, lo: 1885, hi: 1886,
    sources: ['Wikipedia, "Benz Patent-Motorwagen"'],
    checked: '2026-10-26'
  },
  {
    id: 'ramanujan', cat: 'science', region: 'asia', tier: 2, kind: 'span', unit: 'year', lo: 1887, hi: 1920,
    sources: ['Kanigel, R. (1991), The Man Who Knew Infinity, Scribner', 'Wikipedia, "Srinivasa Ramanujan"'],
    checked: '2026-10-26'
  },
  {
    id: 'flying-doctor', cat: 'everyday', region: 'oceania', tier: 3, kind: 'point', unit: 'year', at: 1928, lo: 1928, hi: 1928,
    sources: ['Royal Flying Doctor Service, "Our history" (flyingdoctor.org.au)', 'Wikipedia, "Royal Flying Doctor Service"'],
    checked: '2026-10-26'
  },
  {
    id: 'x-rays', cat: 'science', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1895, lo: 1895, hi: 1895,
    sources: ['Wikipedia, "X-ray"', 'Nobel Prize in Physics 1901 (nobelprize.org)'],
    checked: '2026-10-26'
  },
  {
    id: 'wright', cat: 'tech', region: 'americas', tier: 1, kind: 'point', unit: 'year', at: 1903, lo: 1903, hi: 1903,
    sources: ['Smithsonian National Air and Space Museum, "1903 Wright Flyer"'],
    checked: '2026-10-26'
  },
  {
    id: 'relativity', cat: 'science', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 1905, lo: 1905, hi: 1905,
    sources: ['Wikipedia, "Annus mirabilis papers"', 'Wikipedia, "Special relativity"'],
    checked: '2026-10-26'
  },
  {
    id: 'kahlo', cat: 'culture', region: 'americas', tier: 2, kind: 'span', unit: 'year', lo: 1907, hi: 1954,
    sources: ['Wikipedia, "Frida Kahlo"', 'Herrera, H. (1983), Frida: A Biography of Frida Kahlo, Harper & Row'],
    checked: '2026-10-26'
  },
  {
    id: 'tunguska', cat: 'earth', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1908, lo: 1908, hi: 1908,
    sources: ['Wikipedia, "Tunguska event"', 'NASA Science, "The Tunguska impact — 100 years later" (2008)'],
    checked: '2026-10-26'
  },
  {
    id: 'south-pole', cat: 'explore', region: 'world', tier: 1, kind: 'point', unit: 'year', at: 1911, lo: 1911, hi: 1911,
    sources: ['Wikipedia, "Amundsen\'s South Pole expedition"'],
    checked: '2026-10-26'
  },
  {
    id: 'indian-film', cat: 'culture', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1913, lo: 1913, hi: 1913,
    sources: ['Wikipedia, "Raja Harishchandra"', 'Rajadhyaksha, A. & Willemen, P. (1999), Encyclopaedia of Indian Cinema, BFI'],
    checked: '2026-10-26'
  },
  {
    id: 'tagore', cat: 'culture', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1913, lo: 1913, hi: 1913,
    sources: ['Nobel Prize Outreach, "The Nobel Prize in Literature 1913" (nobelprize.org)', 'Wikipedia, "Rabindranath Tagore"'],
    checked: '2026-10-26'
  },
  {
    id: 'passenger-pigeon', cat: 'earth', region: 'americas', tier: 3, kind: 'point', unit: 'year', at: 1914, lo: 1914, hi: 1914,
    sources: ['Smithsonian Institution Archives, "Martha, the last passenger pigeon"', 'Wikipedia, "Passenger pigeon"'],
    checked: '2026-10-26'
  },
  {
    id: 'panama-canal', cat: 'tech', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 1914, lo: 1914, hi: 1914,
    sources: ['Panama Canal Authority, "History"', 'Wikipedia, "Panama Canal"'],
    checked: '2026-10-26'
  },
  {
    id: 'insulin', cat: 'science', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 1922, lo: 1922, hi: 1922,
    sources: ['Nobel Prize in Physiology or Medicine 1923 (nobelprize.org)', 'Bliss, M. (1982), The Discovery of Insulin, University of Toronto Press', 'Wikipedia, "Insulin (medication)"'],
    checked: '2026-10-26'
  },
  {
    id: 'penicillin', cat: 'science', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: 1928, lo: 1928, hi: 1928,
    sources: ['Nobel Prize in Physiology or Medicine 1945 (nobelprize.org)', 'Wikipedia, "Penicillin"'],
    checked: '2026-10-26'
  },
  {
    id: 'expanding-universe', cat: 'science', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 1929, lo: 1929, hi: 1929,
    sources: ['Hubble, E. (1929), PNAS 15: 168–173', 'IAU Resolution B4 (2018), "Hubble–Lemaître law"', 'Wikipedia, "Hubble\'s law"'],
    checked: '2026-10-26'
  },
  {
    id: 'world-cup', cat: 'everyday', region: 'americas', tier: 1, kind: 'point', unit: 'year', at: 1930, lo: 1930, hi: 1930,
    sources: ['FIFA, "1930 FIFA World Cup Uruguay" (fifa.com)'],
    checked: '2026-10-26'
  },
  {
    id: 'thylacine', cat: 'earth', region: 'oceania', tier: 2, kind: 'point', unit: 'year', at: 1936, lo: 1936, hi: 1936,
    sources: ['Australian Museum, "Thylacine"', 'Wikipedia, "Thylacine"'],
    checked: '2026-10-26'
  },
  {
    id: 'transistor', cat: 'tech', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 1947, lo: 1947, hi: 1947,
    sources: ['Nobel Prize in Physics 1956 (nobelprize.org)', 'Wikipedia, "History of the transistor"'],
    checked: '2026-10-26'
  },
  {
    id: 'everest', cat: 'explore', region: 'asia', tier: 1, kind: 'point', unit: 'year', at: 1953, lo: 1953, hi: 1953,
    sources: ['Wikipedia, "1953 British Mount Everest expedition"'],
    checked: '2026-10-26'
  },
  {
    id: 'dna', cat: 'science', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: 1953, lo: 1953, hi: 1953,
    sources: ['Watson, J. D. & Crick, F. H. C. (1953), Nature 171: 737–738', 'Franklin, R. E. & Gosling, R. G. (1953), Nature 171: 740–741', 'Wikipedia, "Molecular Structure of Nucleic Acids"'],
    checked: '2026-10-26'
  },
  {
    id: 'sputnik', cat: 'explore', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1957, lo: 1957, hi: 1957,
    sources: ['NASA History Office, "Sputnik and the origins of the Space Age"', 'Wikipedia, "Sputnik 1"'],
    checked: '2026-10-26'
  },
  {
    id: 'instant-noodles', cat: 'everyday', region: 'asia', tier: 2, kind: 'point', unit: 'year', at: 1958, lo: 1958, hi: 1958,
    sources: ['Wikipedia, "Momofuku Ando"', 'Cup Noodles Museum, Osaka Ikeda'],
    checked: '2026-10-26'
  },
  {
    id: 'achebe', cat: 'culture', region: 'africa', tier: 2, kind: 'point', unit: 'year', at: 1958, lo: 1958, hi: 1958,
    sources: ['Wikipedia, "Things Fall Apart"'],
    checked: '2026-10-26'
  },
  {
    id: 'gagarin', cat: 'explore', region: 'asia', tier: 1, kind: 'point', unit: 'year', at: 1961, lo: 1961, hi: 1961,
    sources: ['Wikipedia, "Vostok 1"', 'NASA, "Yuri Gagarin: first man in space"'],
    checked: '2026-10-26'
  },
  {
    id: 'ir8', cat: 'everyday', region: 'asia', tier: 3, kind: 'point', unit: 'year', at: 1966, lo: 1966, hi: 1966,
    sources: ['International Rice Research Institute, "Changing the world with seeds: the breeding history of IR8" (ricetoday.irri.org, checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'heart-transplant', cat: 'science', region: 'africa', tier: 2, kind: 'point', unit: 'year', at: 1967, lo: 1967, hi: 1967,
    sources: ['Wikipedia, "Heart transplantation"', 'Groote Schuur Hospital Heart of Cape Town Museum'],
    checked: '2026-10-26'
  },
  {
    id: 'moon-landing', cat: 'explore', region: 'world', tier: 1, kind: 'point', unit: 'year', at: 1969, lo: 1969, hi: 1969,
    sources: ['NASA, "Apollo 11 mission overview"'],
    checked: '2026-10-26'
  },
  {
    id: 'opera-house', cat: 'culture', region: 'oceania', tier: 2, kind: 'point', unit: 'year', at: 1973, lo: 1973, hi: 1973,
    sources: ['UNESCO World Heritage List no. 166 rev, "Sydney Opera House"'],
    checked: '2026-10-26'
  },
  {
    id: 'green-belt', cat: 'earth', region: 'africa', tier: 3, kind: 'point', unit: 'year', at: 1977, lo: 1977, hi: 1977,
    sources: ['The Green Belt Movement, "Our history" (greenbeltmovement.org)', 'Nobel Peace Prize 2004 (nobelprize.org)'],
    checked: '2026-10-26'
  },
  {
    id: 'voyager', cat: 'explore', region: 'world', tier: 2, kind: 'point', unit: 'year', at: 1977, lo: 1977, hi: 1977,
    sources: ['NASA Jet Propulsion Laboratory, "Voyager mission overview"', 'Wikipedia, "Voyager program"'],
    checked: '2026-10-26'
  },
  {
    id: 'smallpox', cat: 'science', region: 'world', tier: 2, kind: 'point', unit: 'year', at: 1980, lo: 1980, hi: 1980,
    sources: ['World Health Organization, "Smallpox" (who.int)'],
    checked: '2026-10-26'
  },
  {
    id: 'ozone', cat: 'earth', region: 'world', tier: 3, kind: 'point', unit: 'year', at: 1985, lo: 1985, hi: 1985,
    sources: ['Farman, J. C., Gardiner, B. G. & Shanklin, J. D. (1985), Nature 315: 207–210', 'Wikipedia, "Ozone depletion"'],
    checked: '2026-10-26'
  },
  {
    id: 'www', cat: 'tech', region: 'europe', tier: 1, kind: 'point', unit: 'year', at: 1991, lo: 1991, hi: 1991,
    sources: ['CERN, "A short history of the Web" (home.cern)', 'Wikipedia, "World Wide Web"'],
    checked: '2026-10-26'
  },
  {
    id: 'genome', cat: 'science', region: 'world', tier: 2, kind: 'point', unit: 'year', at: 2003, lo: 2003, hi: 2003,
    sources: ['National Human Genome Research Institute, "Human Genome Project fact sheet"', 'Nurk, S. et al. (2022), Science 376: 44–53'],
    checked: '2026-10-26'
  },
  {
    id: 'm-pesa', cat: 'everyday', region: 'africa', tier: 2, kind: 'point', unit: 'year', at: 2007, lo: 2007, hi: 2007,
    sources: ['Wikipedia, "M-Pesa"', 'Suri, T. & Jack, W. (2016), Science 354: 1288–1292'],
    checked: '2026-10-26'
  },
  {
    id: 'higgs', cat: 'science', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 2012, lo: 2012, hi: 2012,
    sources: ['CERN, "The Higgs boson" (home.cern)'],
    checked: '2026-10-26'
  },
  {
    id: 'gravitational-waves', cat: 'science', region: 'americas', tier: 2, kind: 'point', unit: 'year', at: 2015, lo: 2015, hi: 2015,
    sources: ['Abbott, B. P. et al. (LIGO and Virgo) (2016), Physical Review Letters 116: 061102', 'Wikipedia, "First observation of gravitational waves"'],
    checked: '2026-10-26'
  },
  {
    id: 'black-hole-image', cat: 'science', region: 'world', tier: 2, kind: 'point', unit: 'year', at: 2019, lo: 2019, hi: 2019,
    sources: ['Event Horizon Telescope Collaboration (2019), Astrophysical Journal Letters 875: L1'],
    checked: '2026-10-26'
  },
  {
    id: 'alexander', cat: 'history', region: 'europe', tier: 1, kind: 'span', unit: 'year', lo: -355, hi: -322,
    sources: ['Wikipedia, "Alexander the Great" (checked 2026-10-26)', 'Bosworth, A. B. (1988), Conquest and Empire: The Reign of Alexander the Great, Cambridge University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'ashoka', cat: 'history', region: 'asia', tier: 2, kind: 'span', unit: 'year', lo: -267, hi: -231,
    sources: ['Wikipedia, "Ashoka" (reign c. 268–232 BCE; checked 2026-10-26)', 'Thapar, R. (1961), Aśoka and the Decline of the Mauryas, Oxford University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'nero-fire', cat: 'history', region: 'europe', tier: 2, kind: 'point', unit: 'year', at: 64, lo: 64, hi: 64,
    sources: ['Tacitus, Annals 15.38–44', 'Wikipedia, "Great Fire of Rome" (checked 2026-10-26)'],
    checked: '2026-10-26'
  },
  {
    id: 'genghis-khan', cat: 'history', region: 'asia', tier: 1, kind: 'point', unit: 'year', at: 1206, lo: 1206, hi: 1206,
    sources: ['Wikipedia, "Genghis Khan" (checked 2026-10-26)', 'May, T. (2018), The Mongol Empire, Edinburgh University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'mansa-musa', cat: 'history', region: 'africa', tier: 2, kind: 'span', unit: 'year', lo: 1324, hi: 1325,
    sources: ['Wikipedia, "Mansa Musa" (checked 2026-10-26)', 'Gomez, M. A. (2018), African Dominion: A New History of Empire in Early and Medieval West Africa, Princeton University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'haiti', cat: 'history', region: 'americas', tier: 2, kind: 'span', unit: 'year', lo: 1791, hi: 1804,
    sources: ['Wikipedia, "Haitian Revolution" (checked 2026-10-26)', 'Dubois, L. (2004), Avengers of the New World, Harvard University Press'],
    checked: '2026-10-26'
  },
  {
    id: 'ww1', cat: 'history', region: 'world', tier: 1, kind: 'span', unit: 'year', lo: 1914, hi: 1918,
    sources: ['Wikipedia, "World War I" (checked 2026-10-26)', 'Strachan, H. (2003), The First World War, Simon & Schuster'],
    checked: '2026-10-26'
  },
  {
    id: 'ww2', cat: 'history', region: 'world', tier: 1, kind: 'span', unit: 'year', lo: 1939, hi: 1945,
    sources: ['Wikipedia, "World War II" and "The Holocaust" (checked 2026-10-26)', 'Weinberg, G. L. (1994), A World at Arms, Cambridge University Press'],
    checked: '2026-10-26'
  }
];

/** Curated "surprising pairs" for "Which came first?" (design § 9.3): the older event first. */
export const CURATED: readonly CuratedPair[] = [
  { id: 'cleopatra-moon', older: 'cleopatra', newer: 'moon-landing' },
  { id: 'pyramid-mammoth', older: 'great-pyramid', newer: 'mammoths' },
  { id: 'stego-trex', older: 'stegosaurus', newer: 't-rex' },
  { id: 'sharks-forest', older: 'first-sharks', newer: 'oldest-forest' },
  { id: 'bread-farming', older: 'bread', newer: 'farming' },
  { id: 'pottery-farming', older: 'pottery', newer: 'farming' },
  { id: 'oxford-tenochtitlan', older: 'oxford', newer: 'tenochtitlan' },
  { id: 'bisheng-gutenberg', older: 'bi-sheng', newer: 'gutenberg' },
  { id: 'fax-telephone', older: 'fax', newer: 'telephone' },
  { id: 'gobekli-stonehenge', older: 'gobekli', newer: 'stonehenge' },
  { id: 'sulawesi-chauvet', older: 'sulawesi-art', newer: 'chauvet' },
  { id: 'anaesthesia-railway', older: 'anaesthesia', newer: 'railway' }
];
