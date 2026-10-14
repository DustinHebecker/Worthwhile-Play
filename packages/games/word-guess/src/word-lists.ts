/**
 * Answer word lists, authored by hand for this project (no third-party word lists,
 * hence no licence obligations). Criteria: common, unambiguous everyday words; no
 * proper nouns, no offensive or sensitive words, no plural-only filler. German lists
 * contain no "ß" (it has no capital letter in common use and is rarely typed);
 * Ä, Ö and Ü are separate letters with their own keys.
 *
 * Words are stored lowercase, separated by whitespace (initially sorted). The order is part
 * of the save format (a save stores the index of the answer), so only ever APPEND
 * words to a list in a new state version — never reorder or remove.
 */
export const WORD_SOURCE = {
  en: {
    5: `
    about above actor acute adapt adore adult after again agent agile agree ahead alarm album alert alike alive
    alley allow alone along aloud alter amber amend angel angle angry ankle anvil apart apple apply apron arena
    argue arise arrow aside asset attic audio avoid awake award aware awful bacon badge badly bagel baker banjo
    barge basic basin batch baton beach beard beast begin being belly below bench berry bingo birch birth bison
    black blade blame blank blast blend bless blind blink bliss block bloom bluff blunt blush board boast bonus
    boost booth bound boxer brace braid brain brake brand brass brave bread break brick bride brief brine bring
    brisk broad brook broom brown brush build bulky bumpy bunch burst cabin cable cadet camel canal candy canoe
    cargo carol carry catch cause cedar chain chair chalk chant charm chart chase cheap check cheek cheer chess
    chest chief child chili chill chime chirp choir chord cider civic civil claim clash class clean clear clerk
    click cliff climb cling clock close cloth cloud clove clown coach coast cobra cocoa comet comic comma coral
    couch count court cover craft crane crash crate crawl cream creek crisp crowd crown crumb crust cubic cumin
    curly curve cycle daily dairy daisy dance decay decor delay delta dense depth diary digit diner diver dizzy
    dodge donor doubt dough dozen draft drain drama drape dream dress drift drill drink drive drone dwell eager
    eagle early earth easel eight elbow elder elect elite ember empty enjoy enter entry epoch equal equip erase
    error essay event exact exist extra fable faint fairy faith false fancy fault feast fence ferry fetch fever
    field fiery fifty final flair flame flank flash flask fleet flint float flock flood floor flora flour fluid
    flute foamy focus foggy folly force forge forty forum found frame fresh frill front frost froth fruit fudge
    funny gauge gecko ghost giant glade glare glass gleam glide globe gloom glory gloss glove gnome goose gourd
    grace grade grain grand grant grape graph grasp grass gravy great green greet grill grind groan group grove
    guard guava guess guest guide habit handy happy hardy harsh hatch haven hazel heart heavy hedge hefty hello
    heron hinge hobby hoist honey horse hotel hound house hover human humid husky icing ideal igloo image index
    inlet inner input issue ivory jazzy jelly jewel joint jolly judge juice juicy jumbo kayak kiosk kneel knife
    knock koala label ladle laser latch layer leafy learn least ledge legal lemon lemur level lever light lilac
    limit linen lingo liver llama lobby local lodge lofty logic loose loyal lucky lunar lunch lyric magic major
    mango manor maple march marry marsh mason match maybe mayor medal medic melon mercy merit merry messy metal
    metro might mimic minor mixer model moist money month moose moral motel motor motto mound mount mouse mouth
    movie muddy mural music naval nerve never niece nifty night noble noise north novel nudge nurse nylon oasis
    occur ocean offer often olive onion opera optic orbit order organ other otter ounce outer owner paint panda
    panel pansy paper parka party pasta paste patch pause peace peach pearl pecan pedal penny perch perky petal
    piano picky piece pilot pinch pitch pixel pizza place plaid plain plane plank plant plate plaza plead pluck
    plume plush point poise polar polka poppy porch pouch pound power prawn press price pride prime print prism
    prize proof proud prune pulse punch pupil puppy purse quail quake queen quest queue quick quiet quilt quirk
    quite quota quote radar radio raise rally ramen ranch range rapid raven razor reach react ready realm rebel
    recap refer regal relax relay reply rhyme rider ridge right rigid rinse risky rival river roast robin robot
    rocky roomy roost rough round route royal rugby ruler rural rusty salad salsa salty sandy satin sauce sauna
    scale scarf scene scent scone scoop scope score scout scrap sedan seize sense serve seven shade shake shaky
    shape share shark sharp shelf shell shift shine shiny shirt shock shore short shout shrub sieve sight silky
    silly since siren sixty skate skill skirt slack slant slate sleek sleep sleet slice slick slide slime sling
    slope sloth small smart smell smile smoke snack snail snake sneak snore snowy soapy sober solar solid solve
    sonic sound south space spade spare spark speak speed spell spend spice spicy spiky spill spine spire spoon
    sport spray squad squid stack staff stage stain stair stake stale stalk stall stamp stand stark start state
    steak steam steel steep steer stern stick still sting stone stool stork storm story stout stove strap straw
    stray strip stuck study stump style sugar suite sunny super surge swamp sweep sweet swift swing swirl syrup
    table tangy tapir taste tasty teach teddy tempo tenor tense tenth thank theme thick thing think third thorn
    three throw thumb thyme tidal tiger timer tired toast today token tonic tooth topaz topic torch total touch
    tough towel tower trace track trade trail train trait tread treat trend trial tribe trick trout truce truck
    truly trunk trust truth tulip tutor twice twine twist uncle under unify union unite unity until upper upset
    urban usage usual valid value valve vault venue verge verse video villa vinyl viper visit vista vital vivid
    vocal voice voter wacky wafer wagon waist waltz waste watch water weary weave wedge weird whale wheat wheel
    while whirl whisk white whole widen width windy witty woman woody world worry worth wrist write wrong yearn
    yeast yield young youth zebra
`,
    6: `
    absent accent accept access across action active actual advice afford afraid agency agenda almost always
    amount anchor animal annual answer anyone appeal around arrive artist aspect assist attach attend author
    autumn avenue backup badger ballet bamboo banana banner barely barrel basket battle beauty become before
    behalf behind belief belong beside better beyond bitter border borrow bottle bottom bounce branch breath
    breeze bridge bright broken bronze bubble bucket budget buffet bundle burden butter button cactus camera
    campus candle canvas carbon career carpet carrot castle casual celery cellar cement cereal chance change
    charge cheese cherry choice choose chorus cinema circle circus clever client closet clumsy coffee collar
    colony column comedy common cookie copper corner cotton county couple course cousin cradle create credit
    crisis custom damage dancer danger debate decade decide defeat defend degree demand depend desert design
    desire detail device dinner direct divide doctor dollar domain donkey double dragon drawer driver during
    easily editor effect effort eighty either eleven empire enable energy engine enough entire escape estate
    expand expect expert export fabric factor fairly family famous farmer father fellow figure filter finger
    finish flight flower follow forest forget formal format fossil foster fourth freeze friend frozen funnel
    future galaxy garage garden garlic gather gentle giggle ginger glance global golden gravel ground growth
    guitar hammer handle happen hardly health height helmet hiking hollow honest ignore impact import income
    indeed infant inform insect inside invite island itself jacket jigsaw jungle junior kettle kindly kitten
    ladder lately launch lawyer leader league legend lesson letter liquid listen little lizard locate lonely
    luxury magnet manage manner marble margin market master matter meadow medium member memory mental mentor
    method middle mighty minute mirror mobile modern moment monkey mostly mother motion muffin murmur museum
    mutual myself narrow nation native nature nearby nearly needle normal notice number object obtain office
    online option orange origin outfit oxygen oyster packet palace parade parent parrot pebble pencil people
    pepper period permit person pickle picnic pillow planet player please pledge plenty pocket poetry polite
    potato powder prefer pretty prince profit proper public puzzle rabbit random rarely rather reader reason
    recipe record reduce reform refuse region relief remain remedy remote repair repeat report rescue resort
    result retire return reveal review reward rhythm ribbon riddle rocket rubber saddle safety sailor salmon
    sample sandal scheme school screen script season second secret select senior series settle shadow shield
    shower signal silver simple singer single sister sketch slight smooth soccer social socket spider spirit
    splash spread spring square stable statue steady stitch street strong studio submit subtle summer summit
    sunset supply surely survey switch symbol system tablet talent target temple tenant tender tennis thirty
    thread throne ticket timber tissue toggle tomato tongue toward travel treaty tunnel turtle twelve twenty
    unique unlock update useful valley velvet vendor violin virtue vision volume voyage waffle walnut wander
    warmth weekly weight window winner winter wisdom within wizard wonder wooden worker writer yellow yogurt
    zipper
`
  },
  de: {
    5: `
    abend achse acker adler alarm alter ampel angel angst anker anzug apfel ärger asche atlas backe baden bauch
    bauen bauer beere beruf besen beton biene birke birne blase blatt blech blick blind blitz blond bluff blume
    bluse blüte boden bogen bohne borke brand braun braut breit brett brief brise brühe brust bucht bühne busch
    chaos dampf datum dauer decke deich delle dicht diele dosis draht drang druck durst ebene eiche eifer eilig
    eimer eisen elend engel enkel erbse ernte essen essig etage fabel faden fahne fähre falke farbe fasan faser
    faust fazit feder fegen feier feind felge ferne ferse feuer figur fisch flach flair fleck flora flöte flott
    fluss fokus folge forst forum frage fremd frist front frost frust fuchs fülle funke gabel gasse geben gebet
    gehen geige geist gerät geste gilde glanz glatt glied glück gnade gramm grill groll grube grund gunst gurke
    haben hafen hafer hagel haken halde halle handy harfe haube hauch hebel heben hecke heide herde hilfe hirse
    hitze hobby hobel höhle holen honig hören hotel hügel humor hütte ideal imker index insel jacht jacke jäger
    jubel juwel kabel kader kakao kälte kamel kamin kampf kanal kanne kante kappe karre karte kasse kater katze
    kauen kegel kelch kerbe kerze kette kiste klage klang klaue kleid klein klima klotz kluft knall knauf knick
    knopf koala kobra kohle kokon komet kopie krach kraft krake krank kranz kraut kreis kreuz krise krone kröte
    kübel küche kugel kühle kunde kunst kuppe kurve küste labor lachs laden lager lampe länge larve laser latte
    laube lauch laune leben leber leder legen lehre leine leise lesen licht liebe liege limit linde linie linse
    lippe liste loben locke loipe lotse luchs lücke lunge lyrik macht magen mähen malen mango manko mappe marke
    markt maske masse matte mauer meile meise menge messe meter miene miete milch minze mitte mixer möbel möhre
    mokka molch monat moped moral motor motte mücke mühle mulde mumie münze musik mütze nabel nacht nadel nagel
    nagen nager nähen narbe natur nebel neffe neige nelke niere notiz nudel obhut olive onkel optik orden orgel
    orkan ozean pacht paket palme panda panik panne parka party pasta paste pause pedal pegel perle pfahl pfand
    pfeil pferd pflug pfote phase pilot pinie piste pizza plage plane platz pokal polar polka porto preis prinz
    prise probe profi prosa puder pulli pumpe punkt puppe qualm quark quote radio rampe range rasen raten ratte
    rauch raupe raute recht reden regal regen regie reihe reise rente revue riese rille rinde rinne rippe robbe
    rolle roman rotor rubin ruder rufen ruhig ruine rumpf runde sache sagen sägen sahne salat salbe samen sauna
    schaf schal schar schau schön schub schuh sechs seele segel sehen seide seife seite senke sense serie serum
    silbe skala socke sohle sonne sorge sorte spalt spatz speck speer spiel spion spitz sport spott spule staat
    stadt stahl stall stamm stand stark start staub steig steil stein stern stich stiel stier stift still stirn
    stock stoff stolz stroh strom stube stufe stuhl stumm sturm suche summe sumpf suppe szene tafel tanne tante
    tarif tasse taste tatze taube teich tempo tenor thema thron tiger tinte tisch titel toast toben tonne topas
    torte trage trank traum trend treue trick trieb troll truhe trupp tücke tulpe umbau umweg unfug union vater
    villa visum vogel vokal waage wache wachs wagen walze wange wanne wanze wärme watte weben weich weide weile
    weise welle welpe werft wesen wespe weste wette wiege wiese wille winde wolke wolle wonne wrack wucht wunde
    würde wurst zacke zange zebra zeche zeder zeile zelle zeuge ziege zitat zunft zunge zwang zweig zwerg zwölf
`,
    6: `
    anfang arbeit auster ausweg backen bäcker bagger balken banane becher bellen besuch beutel biegen bilanz
    binden bitten bitter blasen blühen bohren braten brücke bruder büchse butter dackel danken daumen deckel
    decken denken dichte doktor donner drache drehen dünger dunkel dusche effekt einsam fabrik fackel fahren
    faktor fallen falter fangen farbig fassen feiern felsen fichte fieber filter finden finger fliege flocke
    flügel folgen fragen frosch frucht fühlen führen füllen funken futter garage garten gebiet geduld gefühl
    gegend geheim gelenk gemüse genuss gerade gerste gesang gewinn gitter glocke golden graben haften hälfte
    hammer handel hängen hantel heftig heimat heiter heizen helfen hengst herbst hering himmel hirsch hobeln
    hoffen hummel hunger hüpfen insekt jubeln kaffee kamera kapsel karren kasten kaufen kehren keller kennen
    kessel kiefer kissen kitsch klasse kleben klinge knolle knoten kochen kocher koffer kolben körper kosten
    krabbe kragen kralle kredit kreide kuchen kummer kürbis küssen kutter lachen landen lappen lärche lassen
    laufen läufer lehrer leicht leihen leiste leiter lenken lerche lernen lieben limone locker löffel lustig
    machen magnet mangel mantel marmor melone messen messer metall mieten mieter minute mittag modell morgen
    mörtel muster mutter mythos nehmen nicken nische norden nuance nummer öffnen ordner packen paddel palast
    papier passen pfanne pfeife pflege pinsel planet platte podest poesie posten pracht praxis presse putzen
    puzzle quader qualle quelle rabatt radler rahmen rakete rassel rätsel rechen regnen reifen reisen reiten
    rennen retten riegel riemen risiko ritter rollen roller rosine rubrik rücken rudern rühren salbei sattel
    sauber schach scharf schatz schere schief schiff schild schirm schlaf schlag schlau schmal schnee schnur
    schock schote schräg schrei schuld schule schutz schwan schwer segeln segler sektor selten senden sessel
    setzen sichel sicher sieger signal silber singen sinken sitzen sommer sonnig sorgen spange spaten speise
    sperre spinne spitze sprung spülen stange stapel status stehen steuer storch strand streik streng strich
    strick studie stunde suchen talent tanker tanzen tapfer tasche teilen teller tempel tennis termin testen
    tomate traube trauer tresor tunnel turnen tusche umfang unheil urlaub urteil verein vorrat waffel wagnis
    wählen walzer wappen warten wärter wasser wecken wecker weiher weizen werben werfen wetten wetter wiegen
    wiesel wimper winkel winken winter wirbel wissen witzig wohnen wunder wunsch würfel wurzel zahlen zählen
    zauber zeigen zeiger zettel ziegel ziehen zielen ziffer zimmer zirkel zirkus zither zornig zucken zucker
    zufall
`
  }
} as const;
