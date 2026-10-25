import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'Das blaue Paket',
      story: 'Im Laden an der Ecke ist ein Paket ohne Absender angekommen. Es muss aus einem der Lager stammen, die diese Straße beliefern.',
      lead: 'Pakete in dieser Straße kommen aus:',
      hyps: { north: 'Lager Nord', south: 'Lager Süd', east: 'Lager Ost' },
      clues: {
        blue: { label: 'In blaues Papier gewickelt', seen: 'Das Paket ist in blaues Papier gewickelt.', notSeen: 'Das Paket ist nicht in blaues Papier gewickelt.' },
        'brown-tape': { label: 'Mit braunem Klebeband', seen: 'Es ist mit braunem Klebeband verschlossen.', notSeen: 'Es ist nicht mit braunem Klebeband verschlossen.' },
        smudge: { label: 'Verschmiertes Etikett', seen: 'Das Adressetikett ist verschmiert.', notSeen: 'Das Adressetikett ist sauber.' },
        string: { label: 'Mit Schnur verschnürt', seen: 'Es ist mit Schnur verschnürt.', notSeen: 'Es ist nicht verschnürt.' },
        tuesday: { label: 'An einem Dienstag gekommen', seen: 'Es kam an einem Dienstag. Alle Lager liefern an jedem Werktag.', notSeen: 'Es kam an einem Dienstag. Alle Lager liefern an jedem Werktag.' },
        'echo-blue': { label: 'Die Nachbarin hat es auch gesehen', seen: 'Die Nachbarin sagt auch, das Paket sei blau gewesen – sie hat dasselbe Paket gesehen.', notSeen: 'Die Nachbarin sagt auch, das Paket sei blau gewesen – sie hat dasselbe Paket gesehen.' }
      }
    },
    'c-garden': {
      title: 'Die angeknabberten Erdbeeren',
      story: 'Über Nacht war jemand an den Erdbeeren. In diesem Garten naschen bekanntlich ein paar Arten von Besuchern daran.',
      lead: 'In Nächten, in denen Erdbeeren angeknabbert werden, war der Besucher:',
      hyps: { birds: 'Vögel', snails: 'Schnecken', hedgehog: 'Ein Igel' },
      clues: {
        slime: { label: 'Glänzende Spur', seen: 'Auf dem Weg ist eine glänzende Spur.', notSeen: 'Es gibt keine glänzende Spur.' },
        pecks: { label: 'Kleine Pickspuren', seen: 'Die Früchte haben kleine Pickspuren.', notSeen: 'Es gibt keine Pickspuren.' },
        droppings: { label: 'Kot unter der Hecke', seen: 'Unter der Hecke liegt Kot.', notSeen: 'Unter der Hecke liegt nichts.' },
        'net-moved': { label: 'Netz zur Seite geschoben', seen: 'Das Netz über dem Beet ist zur Seite geschoben.', notSeen: 'Das Netz liegt noch an seinem Platz.' },
        rain: { label: 'Es hat letzte Nacht geregnet', seen: 'Letzte Nacht hat es geregnet – bei Regen kommen alle heraus.', notSeen: 'Letzte Nacht hat es geregnet – bei Regen kommen alle heraus.' },
        'echo-slime': { label: 'Am Morgen noch einmal gesehen', seen: 'Dein Nachbar zeigt dir dieselbe glänzende Spur.', notSeen: 'Dein Nachbar zeigt dir dieselbe glänzende Spur.' }
      }
    },
    'c-cups': {
      title: 'Die Tasse mit dem Haarriss',
      story: 'Jemand bringt eine Tasse mit einem Haarriss zurück. Alle Maschinen der Werkstatt machen dieselbe Tasse, aber jede hat ihre Eigenheiten.',
      lead: 'Die Tassen der Werkstatt stammen von:',
      hyps: { a: 'Maschine A', b: 'Maschine B', c: 'Maschine C' },
      clues: {
        crack: { label: 'Haarriss', seen: 'Die Tasse hat einen Haarriss.', notSeen: 'Die Tasse hat einen Haarriss.' },
        glaze: { label: 'Dunklere Glasur', seen: 'Die Glasur ist etwas dunkler als sonst.', notSeen: 'Die Glasur sieht normal aus.' },
        stamp: { label: 'Scharfer Stempel am Boden', seen: 'Der Herstellerstempel am Boden ist scharf.', notSeen: 'Der Stempel am Boden ist verschwommen.' },
        handle: { label: 'Henkel leicht schief', seen: 'Der Henkel sitzt leicht schief.', notSeen: 'Der Henkel sitzt gerade.' },
        box: { label: 'In einer grauen Schachtel', seen: 'Sie kam in der üblichen grauen Schachtel – wie die Tassen aller Maschinen.', notSeen: 'Sie kam in der üblichen grauen Schachtel – wie die Tassen aller Maschinen.' }
      }
    },
    'c-key': {
      title: 'Der verschwundene Schlüssel',
      story: 'Der Ersatzschlüssel ist schon wieder weg. Fast immer liegt er an einem der üblichen Orte.',
      lead: 'Wenn der Schlüssel fehlt, taucht er auf:',
      hyps: { coat: 'In der Jacke', car: 'Im Auto', office: 'Im Büro' },
      clues: {
        'search-coat': { label: 'Kurzes Suchen in der Jacke findet ihn', seen: 'Du findest den Schlüssel in der Jacke.', notSeen: 'Du schaust kurz in die Jackentaschen: kein Schlüssel. Ein kurzer Blick kann ihn übersehen.' },
        'search-car': { label: 'Kurzer Blick ins Auto findet ihn', seen: 'Du findest den Schlüssel im Auto.', notSeen: 'Du schaust kurz ins Auto: kein Schlüssel. Ein kurzer Blick kann ihn übersehen.' },
        jingle: { label: 'Ein Klimpern im Flur', seen: 'Du erinnerst dich an ein Klimpern, als die Jacke aufgehängt wurde.', notSeen: 'Du erinnerst dich an kein Klimpern.' },
        drove: { label: 'Du bist gestern gefahren', seen: 'Du bist gestern Auto gefahren.', notSeen: 'Du bist gestern nicht Auto gefahren.' },
        'office-day': { label: 'Du warst im Büro', seen: 'Du warst gestern im Büro.', notSeen: 'Du hast gestern von zu Hause gearbeitet.' },
        weekday: { label: 'Es ist ein Werktag', seen: 'Heute ist ein Werktag – das ändert nichts daran, wo Schlüssel landen.', notSeen: 'Heute ist ein Werktag – das ändert nichts daran, wo Schlüssel landen.' }
      }
    },
    'c-coin': {
      title: 'Die Münze vom Jahrmarkt',
      story: 'Du hast an einem Jahrmarktstand für Zauberzubehör eine alte Münze gefunden. Mit bloßem Auge kannst du sie nicht von einer gewöhnlichen unterscheiden, also wirfst du sie.',
      lead: 'Die Münzen in der Altmünzenkiste des Stands sind:',
      hyps: { ordinary: 'Eine gewöhnliche Münze', weighted: 'Eine gezinkte Münze', 'two-headed': 'Eine Münze mit zwei Köpfen' },
      clues: {
        toss1: { label: 'Kopf beim ersten Wurf', seen: 'Erster Wurf: Kopf.', notSeen: 'Erster Wurf: Zahl.' },
        toss2: { label: 'Kopf beim zweiten Wurf', seen: 'Zweiter Wurf: Kopf.', notSeen: 'Zweiter Wurf: Zahl.' },
        toss3: { label: 'Kopf beim dritten Wurf', seen: 'Dritter Wurf: Kopf.', notSeen: 'Dritter Wurf: Zahl.' },
        toss4: { label: 'Kopf beim vierten Wurf', seen: 'Vierter Wurf: Kopf.', notSeen: 'Vierter Wurf: Zahl.' }
      }
    },
    'c-message': {
      title: 'Die Nachricht vom „Verein“',
      story: 'Eine Nachricht gibt an, von deinem Sportverein zu kommen, und bittet dich, deine Mitgliedschaft zu bestätigen.',
      lead: 'Nachrichten, die angeblich vom Verein kommen, sind:',
      hyps: { real: 'Wirklich vom Verein', fake: 'Eine Fälschung' },
      clues: {
        link: { label: 'Enthält einen Link', seen: 'Sie enthält einen Link.', notSeen: 'Sie enthält keinen Link.' },
        sender: { label: 'Unbekannte Absenderadresse', seen: 'Die Absenderadresse ist nicht die übliche des Vereins.', notSeen: 'Die Absenderadresse ist die übliche.' },
        hurry: { label: 'Drängt zur Eile', seen: 'Sie verlangt eine Antwort noch heute.', notSeen: 'Sie setzt keine Frist.' },
        'your-name': { label: 'Nennt deinen Namen', seen: 'Sie spricht dich mit deinem Namen an.', notSeen: 'Sie sagt nur „Liebes Mitglied“.' },
        evening: { label: 'Kam am Abend', seen: 'Sie kam am Abend – beide Arten kommen zu jeder Zeit.', notSeen: 'Sie kam am Abend – beide Arten kommen zu jeder Zeit.' }
      }
    },
    'c-oven': {
      title: 'Das angebrannte Brot',
      story: 'Ein Brot aus der heutigen Morgenladung ist auf einer Seite angebrannt. Die Bäckerei backt in zwei Öfen.',
      lead: 'Die Brote hier werden gebacken im:',
      hyps: { old: 'Alten Ofen', new: 'Neuen Ofen' },
      clues: {
        'burnt-side': { label: 'Auf einer Seite angebrannt', seen: 'Es ist auf einer Seite angebrannt.', notSeen: 'Es ist auf einer Seite angebrannt.' },
        'pale-top': { label: 'Blasse Oberseite', seen: 'Die Oberseite ist blass.', notSeen: 'Die Oberseite ist gleichmäßig braun.' },
        'tray-mark': { label: 'Muster der neuen Bleche', seen: 'Die Unterseite zeigt das Muster der neuen Bleche.', notSeen: 'Die Unterseite ist glatt.' },
        early: { label: 'Aus der ersten Ladung', seen: 'Es kam aus der ersten Ladung.', notSeen: 'Es kam aus einer späteren Ladung.' },
        seeds: { label: 'Körner obendrauf', seen: 'Es hat Körner obendrauf – beide Öfen backen Körnerbrot.', notSeen: 'Es hat Körner obendrauf – beide Öfen backen Körnerbrot.' }
      }
    },
    'c-beep': {
      title: 'Der leise Piepton im Funkgerät',
      story: 'Der Empfänger des Funkvereins hat ein leises, regelmäßiges Piepen aufgefangen. Meist sind solche Töne Störungen, aber es fliegt auch ein kleiner Satellit vorbei.',
      lead: 'Leise regelmäßige Pieptöne an diesem Empfänger sind:',
      hyps: { satellite: 'Ein Signal eines kleinen Satelliten', interference: 'Eine gewöhnliche Störung' },
      clues: {
        'pass-time': { label: 'Während eines Überflugs', seen: 'Es kam, als der Satellit über uns sein sollte.', notSeen: 'Es kam, als kein Überflug anstand.' },
        drift: { label: 'Der Ton wandert langsam', seen: 'Der Ton wandert langsam, wie bei einer bewegten Quelle.', notSeen: 'Der Ton bleibt gleich.' },
        fades: { label: 'Wird nach einer Weile leiser', seen: 'Es verklingt nach etwa zehn Minuten.', notSeen: 'Es hört nicht auf.' },
        rhythm: { label: 'Ein gleichmäßiger Rhythmus', seen: 'Es piept in gleichmäßigem Rhythmus – beide tun das.', notSeen: 'Es piept in gleichmäßigem Rhythmus – beide tun das.' },
        'other-receiver': { label: 'Ein zweiter Empfänger hört es', seen: 'Ein Vereinsmitglied am anderen Ende der Stadt hört es auch.', notSeen: 'Der Empfänger am anderen Ende der Stadt hört nichts.' }
      }
    },
    'c-rain': {
      title: 'Hat es nachts geregnet?',
      story: 'Du warst über Nacht weg und willst wissen, ob die Setzlinge Regen bekommen haben oder jetzt gegossen werden müssen.',
      lead: 'Nächte zu dieser Jahreszeit:',
      hyps: { rained: 'Es hat geregnet', dry: 'Es blieb trocken' },
      clues: {
        'wet-grass': { label: 'Nasses Gras', seen: 'Das Gras ist nass (auch Tau macht es nass).', notSeen: 'Das Gras ist trocken.' },
        gauge: { label: 'Wasser im Regenmesser', seen: 'Im Regenmesser steht Wasser.', notSeen: 'Der Regenmesser ist leer.' },
        puddle: { label: 'Pfütze am Tor', seen: 'Am Tor ist eine Pfütze.', notSeen: 'Am Tor ist keine Pfütze.' },
        'snails-out': { label: 'Schnecken auf dem Weg', seen: 'Auf dem Weg sind Schnecken unterwegs.', notSeen: 'Auf dem Weg sind keine Schnecken.' },
        wind: { label: 'Blätter auf dem Tisch', seen: 'Blätter sind auf den Tisch geweht – windig war es so oder so.', notSeen: 'Blätter sind auf den Tisch geweht – windig war es so oder so.' }
      }
    },
    'c-bird': {
      title: 'Welcher Vogel war am Futterhaus?',
      story: 'Du hast nur kurz einen kleinen braunen Vogel am Futterhaus gesehen, bevor er wegflog. Die Anteile hier sind für dieses Futterhaus erfunden; echte schwanken von Ort zu Ort.',
      lead: 'Kleine braune Besucher an diesem Futterhaus sind:',
      hyps: { finch: 'Ein Fink', sparrow: 'Ein Spatz' },
      clues: {
        'red-patch': { label: 'Etwas Rotes', seen: 'Du hast etwas Rotes an seinem Kopf gesehen.', notSeen: 'Du hast gar nichts Rotes gesehen.' },
        ground: { label: 'Am Boden gefressen', seen: 'Er hat am Boden unter dem Futterhaus gefressen.', notSeen: 'Er hat direkt am Futterhaus gefressen.' },
        song: { label: 'Ein zwitschernder Gesang', seen: 'Er hat zwitschernd gesungen.', notSeen: 'Er hat nur gepiepst.' },
        group: { label: 'Kam mit einer Gruppe', seen: 'Er kam mit einer kleinen Gruppe.', notSeen: 'Er kam allein.' },
        morning: { label: 'Am Morgen', seen: 'Es war früh am Morgen – da kommen beide.', notSeen: 'Es war früh am Morgen – da kommen beide.' }
      }
    },
    'c-plant': {
      title: 'Die hängende Zimmerpflanze',
      story: 'Die Büropflanze lässt die Blätter hängen und hat gelbe Blätter. In diesem Büro ist es meist eines von zwei Dingen.',
      lead: 'Wenn Pflanzen hier hängen, liegt es an:',
      hyps: { water: 'Zu viel Wasser', light: 'Zu wenig Licht' },
      clues: {
        'wet-soil': { label: 'Nasse Erde', seen: 'Die Erde ist zwei Tage nach dem Gießen noch nass.', notSeen: 'Die Erde ist trocken.' },
        leaning: { label: 'Neigt sich zum Fenster', seen: 'Sie neigt sich zum Fenster.', notSeen: 'Sie steht gerade.' },
        'soft-stem': { label: 'Weicher Stängelansatz', seen: 'Der Stängel ist unten weich.', notSeen: 'Der Stängel ist fest.' },
        'pale-new': { label: 'Blasse neue Blätter', seen: 'Die neuen Blätter sind blass und klein.', notSeen: 'Die neuen Blätter sehen gesund aus.' },
        'pot-colour': { label: 'Ein blauer Topf', seen: 'Sie steht in einem blauen Topf – das ändert nichts.', notSeen: 'Sie steht in einem blauen Topf – das ändert nichts.' }
      }
    },
    'c-bus': {
      title: 'Warum kam der Bus zu spät?',
      story: 'Dein Bus kam heute Morgen vierzig Minuten zu spät.',
      lead: 'Wenn dieser Bus sehr spät kommt, ist der Grund:',
      hyps: { jam: 'Ein Stau', breakdown: 'Eine Panne' },
      clues: {
        'others-late': { label: 'Andere Busse auch verspätet', seen: 'Andere Busse auf derselben Straße waren auch verspätet.', notSeen: 'Andere Busse auf der Straße waren pünktlich.' },
        replacement: { label: 'Ein anderer Bus kam', seen: 'Es kam ein anderer Bus als sonst.', notSeen: 'Es kam der übliche Bus.' },
        announcement: { label: 'Eine Anzeige', seen: 'Die Anzeige meldete: Verspätung wegen einer technischen Störung.', notSeen: 'Die Anzeige nannte keinen Grund.' },
        'rush-hour': { label: 'Im Berufsverkehr', seen: 'Es war Berufsverkehr.', notSeen: 'Es war eine ruhige Tageszeit.' },
        rain: { label: 'Es regnete', seen: 'Es regnete – an dieser Haltestelle macht das keinen Unterschied.', notSeen: 'Es regnete – an dieser Haltestelle macht das keinen Unterschied.' }
      }
    }
  },
checks: {
    'k-picnic': {
      title: 'Draußen oder im Saal?',
      story: 'Das Nachbarschaftspicknick ist heute Nachmittag. Du kannst es auf der Wiese machen oder den Gemeindesaal buchen.',
      lead: 'Nachmittage zu dieser Jahreszeit sind:',
      hyps: { dry: 'Trocken', rain: 'Regnerisch' },
      question: 'Wie wahrscheinlich ist ein trockener Nachmittag?',
      options: { outdoors: 'Picknick auf der Wiese', hall: 'Den Saal buchen', tent: 'Ein Zelt auf der Wiese aufstellen' },
      checks: {
        sky: { label: 'Mittags den Himmel ansehen', yes: 'Dunkle Wolken bis Mittag.', no: 'Keine dunklen Wolken bis Mittag.' },
        barometer: { label: 'Aufs Barometer schauen', yes: 'Das Barometer fällt.', no: 'Das Barometer bleibt gleich.' },
        farmer: { label: 'Den Landwirt nebenan fragen', yes: 'Der Landwirt erwartet Regen.', no: 'Der Landwirt erwartet einen trockenen Nachmittag.' },
        service: { label: 'Den Wetterdienst anrufen', yes: 'Der Wetterdienst warnt vor Regen.', no: 'Der Wetterdienst gibt keine Warnung.' },
        swallows: { label: 'Die Schwalben beobachten', yes: 'Die Schwalben fliegen tief.', no: 'Die Schwalben fliegen hoch.' }
      }
    },
    'k-bike': {
      title: 'Das gebrauchte Fahrrad kaufen?',
      story: 'Ein gebrauchtes Fahrrad wird günstig angeboten. Solche Räder sind meist in Ordnung, manche haben aber versteckte Schäden.',
      lead: 'Gebrauchte Räder wie dieses sind:',
      hyps: { sound: 'In Ordnung', damaged: 'Versteckter Schaden' },
      question: 'Wie wahrscheinlich ist es, dass das Rad in Ordnung ist?',
      options: { buy: 'Kaufen', skip: 'Stehen lassen', 'offer-less': 'Weniger bieten und das Risiko tragen' },
      checks: {
        ride: { label: 'Eine Probefahrt machen', yes: 'Die Probefahrt läuft ruhig.', no: 'Die Probefahrt ruckelt.' },
        chain: { label: 'Die Kette ansehen', yes: 'Die Kette ist rostig.', no: 'Die Kette ist sauber.' },
        receipts: { label: 'Nach Reparaturbelegen fragen', yes: 'Der Verkäufer hat Reparaturbelege.', no: 'Der Verkäufer hat keine Belege.' },
        mechanic: { label: 'Einen Mechaniker draufschauen lassen', yes: 'Der Mechaniker findet ein Problem.', no: 'Der Mechaniker findet nichts.' },
        'seller-says': { label: 'Den Verkäufer fragen', yes: 'Der Verkäufer sagt, es sei in Ordnung.', no: 'Der Verkäufer ist unsicher.' }
      }
    },
    'k-seeds': {
      title: 'Die alten Samen säen?',
      story: 'Im Schuppen ist eine vergessene Samentüte aufgetaucht. Das Säen kostet ein Wochenende; frische Samen kosten ein wenig.',
      lead: 'Vergessene Tüten wie diese sind:',
      hyps: { good: 'Noch gut', dead: 'Größtenteils tot' },
      question: 'Wie wahrscheinlich ist es, dass die Samen noch gut sind?',
      options: { sow: 'Die alten Samen säen', fresh: 'Frische Samen kaufen' },
      checks: {
        float: { label: 'Einige ins Wasser legen', yes: 'Die meisten Samen sinken.', no: 'Die meisten Samen schwimmen.' },
        sprout: { label: 'Ein paar auf feuchtem Tuch testen', yes: 'Die meisten keimen.', no: 'Nur wenige keimen.' },
        date: { label: 'Das Datum auf der Tüte lesen', yes: 'Das Datum ist neu.', no: 'Das Datum ist alt.' },
        shrivelled: { label: 'Die Samen genau ansehen', yes: 'Die Samen sehen verschrumpelt aus.', no: 'Die Samen sehen prall aus.' },
        smell: { label: 'Daran riechen', yes: 'Sie riechen frisch.', no: 'Sie riechen muffig.' }
      }
    },
    'k-melon': {
      title: 'Diese Melone kaufen?',
      story: 'Auf dem Markt liegt noch eine Melone zu einem guten Preis.',
      lead: 'Melonen, die um diese Zeit an diesem Stand übrig sind, sind:',
      hyps: { ripe: 'Reif', unripe: 'Noch nicht reif' },
      question: 'Wie wahrscheinlich ist es, dass die Melone reif ist?',
      options: { buy: 'Kaufen', leave: 'Liegen lassen' },
      checks: {
        knock: { label: 'Daraufklopfen', yes: 'Sie klingt hohl.', no: 'Sie klingt dumpf.' },
        smell: { label: 'Daran riechen', yes: 'Sie riecht süß.', no: 'Sie riecht nach kaum etwas.' },
        'soft-end': { label: 'Auf das Ende drücken', yes: 'Das Ende gibt etwas nach.', no: 'Das Ende ist hart.' },
        taste: { label: 'Eine Scheibe aus derselben Kiste probieren', yes: 'Die Scheibe ist süß.', no: 'Die Scheibe ist fade.' },
        sticker: { label: 'Den Aufkleber lesen', yes: 'Sie hat einen „reif“-Aufkleber.', no: 'Sie hat keinen Aufkleber.' }
      }
    },
    'k-bread': {
      title: 'Extra backen für den Markt?',
      story: 'Morgen ist Markttag. Zusätzliches Brot verkauft sich an einem vollen Tag gut, wird an einem ruhigen aber alt.',
      lead: 'Markttage hier sind:',
      hyps: { busy: 'Voll', quiet: 'Ruhig' },
      question: 'Wie wahrscheinlich ist ein voller Markttag?',
      options: { extra: 'Viel mehr backen', normal: 'Die übliche Menge backen', 'little-extra': 'Etwas mehr backen' },
      checks: {
        calendar: { label: 'Den Stadtkalender ansehen', yes: 'Der Kalender nennt eine Veranstaltung.', no: 'Der Kalender nennt nichts.' },
        neighbour: { label: 'Den Käsestand fragen', yes: 'Der Käsestand erwartet viele Leute.', no: 'Der Käsestand erwartet einen ruhigen Tag.' },
        sunny: { label: 'Die Vorhersage lesen', yes: 'Es ist Sonne vorhergesagt.', no: 'Es sind Wolken vorhergesagt.' },
        office: { label: 'Das Marktbüro anrufen', yes: 'Das Marktbüro erwartet viele Besucher.', no: 'Das Marktbüro erwartet das Übliche.' },
        'last-week': { label: 'An letzte Woche denken', yes: 'Letzte Woche war viel los.', no: 'Letzte Woche war es ruhig.' }
      }
    },
    'k-laptop': {
      title: 'Selbst reparieren?',
      story: 'Der Laptop schaltet sich zufällig ab. Eine Reparatur zu Hause ist günstig, wenn der Fehler klein ist, aber vergebliche Mühe, wenn er groß ist.',
      lead: 'Fehler wie dieser sind:',
      hyps: { minor: 'Ein kleiner Fehler', major: 'Ein großer Fehler' },
      question: 'Wie wahrscheinlich ist ein kleiner Fehler?',
      options: { repair: 'Zu Hause reparieren', shop: 'In die Werkstatt bringen', wait: 'Abwarten und beobachten' },
      checks: {
        'error-code': { label: 'Neu starten und zuschauen', yes: 'Ein Fehlercode erscheint.', no: 'Kein Fehlercode erscheint.' },
        diagnostics: { label: 'Das Diagnoseprogramm laufen lassen', yes: 'Das Programm meldet einen Fehler.', no: 'Das Programm meldet nichts.' },
        cable: { label: 'Das Netzkabel tauschen', yes: 'Mit einem anderen Kabel läuft er.', no: 'Er schaltet sich weiter ab.' },
        fan: { label: 'Auf den Lüfter hören', yes: 'Der Lüfter macht ein schleifendes Geräusch.', no: 'Der Lüfter klingt normal.' },
        forum: { label: 'Im Forum lesen', yes: 'Andere mit diesem Modell sagen, es war etwas Kleines.', no: 'Andere mit diesem Modell berichten von verschiedenen Ursachen.' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: 'Der Lampensensor',
      story: 'Die Stadt prüft ihre alten Straßenlampen mit einem Sensor. Von allen Lampen sind {f} wirklich defekt. Der Sensor meldet {s} der defekten Lampen, aber versehentlich auch {q} der funktionierenden. Lampe {lamp} wurde gerade gemeldet.',
      questions: { q1: 'Ist Lampe {lamp} eher defekt oder eher in Ordnung?', q2: 'Wie wahrscheinlich ist es, dass Lampe {lamp} defekt ist?' },
      options: { faulty: 'Eher defekt', working: 'Eher in Ordnung' },
      explain: 'Zähle die gemeldeten Lampen: {k} der {n} gemeldeten Lampen sind wirklich defekt, die Wahrscheinlichkeit ist also {p}. Ob man einer Meldung trauen kann, hängt davon ab, wie selten defekte Lampen sind – nicht nur davon, wie gut der Sensor ist.',
      labels: { faulty: 'Defekte Lampen', working: 'Funktionierende Lampen', fit: 'gemeldet' }
    },
    't-wheel': {
      title: 'Das Glücksrad',
      story: 'Ein faires Drehrad hat {k} gleich große Felder, {r} davon zeigen einen Stern. Die letzten {s} Drehungen haben den Stern alle verfehlt.',
      questions: { q1: 'Bei der nächsten Drehung ist ein Stern …', q2: 'Wie wahrscheinlich ist ein Stern bei der nächsten Drehung?' },
      options: { more: 'wahrscheinlicher als sonst', less: 'unwahrscheinlicher als sonst', same: 'genauso wahrscheinlich wie immer' },
      explain: 'Das Rad hat kein Gedächtnis: Jede Drehung fängt neu an, also kommt ein Stern weiterhin in {p} der Fälle.',
      labels: { spins: 'Die verfehlten Drehungen und die nächste' }
    },
    't-sequence': {
      title: 'Welches Ergebnis ist wahrscheinlicher?',
      story: 'Eine faire Münze wird {n}-mal geworfen (● Kopf, ○ Zahl). Zwei mögliche Ergebnisse: A {a} und B {b}.',
      questions: { q1: 'Welches genaue Ergebnis ist wahrscheinlicher?', q2: 'Wie wahrscheinlich ist genau Ergebnis B?' },
      options: { a: 'A', b: 'B', same: 'Beide sind gleich wahrscheinlich' },
      explain: 'Es gibt {total} mögliche Ergebnisse, und jedes genaue hat dieselbe Wahrscheinlichkeit, {p}. B wirkt nur typischer, weil gemischte Ergebnisse als Gruppe häufig sind.',
      labels: { a: 'A', b: 'B' }
    },
    't-conjunction': {
      title: 'Regen und Wind',
      story: 'Die Vorhersage für morgen gibt Regen eine Chance von {a}. An Regentagen ist es hier in {b} der Fälle windig, an trockenen Tagen in {w} der Fälle.',
      questions: { q1: 'Was ist morgen wahrscheinlicher?', q2: 'Wie wahrscheinlich ist ein Tag, der regnerisch und windig ist?' },
      options: { windy: 'Ein windiger Tag', both: 'Ein regnerischer und windiger Tag', same: 'Beides gleich' },
      explain: 'Stell dir {days} Tage wie morgen vor: {both} sind regnerisch und windig, aber insgesamt {windy} windig. Jeder regnerische und windige Tag ist auch ein windiger Tag, also kann „regnerisch und windig“ nie wahrscheinlicher sein als „windig“.',
      labels: { windy: 'Windig', calm: 'Windstill', rainy: 'Regentage', dry: 'Trockene Tage' }
    },
    't-simpson': {
      title: 'Die zwei Lieferdienste',
      story: 'Zwei Lieferdienste berichten, wie oft sie letzten Monat pünktlich waren. Dienst A: kurze Strecken {aSk} von {aSn}, lange Strecken {aLk} von {aLn}. Dienst B: kurze Strecken {bSk} von {bSn}, lange Strecken {bLk} von {bLn}.',
      questions: { q1: 'Welcher Dienst war insgesamt öfter pünktlich?', q2: 'Dein Paket geht über eine lange Strecke. Welcher Dienst ist auf langen Strecken besser?' },
      options: { a: 'Dienst A', b: 'Dienst B', same: 'Beide gleich' },
      explain: 'A ist auf kurzen und auf langen Strecken besser, und doch ist B insgesamt besser ({b} gegenüber {a} pünktlichen Lieferungen), weil B meistens die leichteren kurzen Strecken fährt. Vergleiche Gleiches mit Gleichem.',
      labels: { a: 'Dienst A', b: 'Dienst B', short: 'Kurze Strecken', long: 'Lange Strecken', overall: 'Insgesamt' }
    },
    't-paw': {
      title: 'Der Pfotenabdruck im Mehl',
      story: 'Über Nacht ist jemand durch das Mehl auf dem Boden der Bäckerei gelaufen. Der Pfotenabdruck passt zur Katze der Nachbarn. Nur {r} Katzen haben einen solchen Abdruck. Etwa {n} Katzen wohnen nah genug, um hereingekommen zu sein.',
      questions: { q1: 'Heißt „nur {r}“, dass es fast sicher die Katze der Nachbarn war?', q2: 'Wie wahrscheinlich ist es, dass es die Katze der Nachbarn war? Nimm an, dass jede Katze in der Nähe gleich wahrscheinlich hereinkam.' },
      options: { yes: 'Ja, zu etwa {sure} sicher', no: 'Nein, viel weniger sicher' },
      explain: 'Unter {n} Katzen in der Nähe haben etwa {others} weitere ebenfalls einen passenden Abdruck. Die Katze der Nachbarn ist nur eine von mehreren, die passen: {p}.',
      labels: { neighbour: 'Nächte, in denen die Katze der Nachbarn hereinkam', others: 'Nächte, in denen eine andere Katze hereinkam', fit: 'Abdruck passt' }
    },
    't-bakery': {
      title: 'Die kleine und die große Bäckerei',
      story: 'Zwei Bäckereien verkaufen Roggen- und Weizenbrote. Im Durchschnitt ist die Hälfte der verkauften Brote Roggenbrot, und jedes Brot ist eine eigene Wahl. Die kleine Bäckerei verkauft {n1} Brote am Tag, die große {n2}.',
      questions: { q1: 'Welche Bäckerei hat mehr Tage, an denen mehr als {t} der verkauften Brote Roggenbrote sind?', q2: 'An welchem Anteil der Tage verkauft die kleine Bäckerei mehr als {t} Roggen?' },
      options: { small: 'Die kleine Bäckerei', large: 'Die große Bäckerei', same: 'Ungefähr gleich' },
      explain: 'Kleine Stichproben schwanken stärker. Die kleine Bäckerei hat solche Tage in {small} der Fälle, die große nur in {large}.',
      labels: { small: 'Kleine Bäckerei', large: 'Große Bäckerei' }
    },
    't-drawers': {
      title: 'Der Hausmeister, der es weiß',
      story: 'Eine von {n} geschlossenen Schubladen enthält den Schlüssel. Du zeigst auf eine Schublade. Der Hausmeister, der weiß, wo der Schlüssel ist, öffnet dann {opened} der anderen Schubladen, alle leer, und lässt genau eine andere geschlossen. Er macht es immer so und öffnet nie deine.',
      questions: { q1: 'Bei deiner Schublade bleiben oder zur anderen geschlossenen wechseln?', q2: 'Wie wahrscheinlich ist es, dass der Schlüssel in der anderen geschlossenen Schublade liegt?' },
      options: { switch: 'Wechseln', keep: 'Bei meiner bleiben', same: 'Es macht keinen Unterschied' },
      explain: 'Stell dir {total} Spiele vor. Deine erste Wahl trifft nur in einigen davon. In den anderen {wins} muss der Hausmeister die Schublade mit dem Schlüssel geschlossen lassen, also gewinnt das Wechseln: {p}.',
      labels: { right: 'Spiele, in denen deine erste Wahl den Schlüssel hat', wrong: 'Spiele, in denen nicht', fit: 'Wechseln gewinnt' }
    },
    't-week': {
      title: 'Mindestens ein Regentag',
      story: 'Du planst eine Reise von {m} Tagen. Jeder Tag hat eine Regenchance von {q}, unabhängig von den anderen Tagen.',
      questions: { q1: 'Wie wahrscheinlich ist mindestens ein Regentag?' },
      options: {},
      explain: 'Die Chancen zu addieren ergäbe {sum}, und das kann nicht stimmen. Multipliziere stattdessen die Chancen für trockene Tage: Gar kein Regen hat eine Chance von {none}, mindestens ein Regentag also {p}.',
      labels: { step: 'Noch trocken nach Tag {n}' }
    },
    't-numbers': {
      title: 'Zweimal dieselbe Zahl',
      story: 'Jede von {g} Personen wählt heimlich und zufällig eine ganze Zahl von eins bis {r}.',
      questions: { q1: 'Wie wahrscheinlich ist es, dass mindestens zwei dieselbe Zahl wählen? Zuerst dein Bauchgefühl:', q2: 'Jetzt deine Schätzung: Wie wahrscheinlich ist mindestens eine gemeinsame Zahl?' },
      options: { low: 'Weniger als eins zu vier', even: 'Ungefähr halbe-halbe', high: 'Mehr als drei zu vier' },
      explain: 'Bei {g} Personen gibt es {pairs} Paare, die übereinstimmen könnten, darum kommt eine Übereinstimmung früher, als es sich anfühlt: {p}.',
      labels: { step: 'Alle verschieden unter den ersten {n}' }
    },
    't-tyres': {
      title: 'Weniger Platten',
      story: 'Eine neue Reifenart senkt die Platten von {b} auf {a} je hundert Fahrten. Der Hersteller nennt das {rel} weniger Platten.',
      questions: { q1: 'Wie viele Platten weniger gibt es auf {rides} Fahrten?' },
      options: {},
      explain: 'Auf {rides} Fahrten gibt es vorher {old} Platten und nachher {new}: {fewer} weniger. „{rel} weniger“ klingt groß; was du merkst, ist die absolute Änderung.',
      labels: { old: 'Alte Reifen', new: 'Neue Reifen', fit: 'Platten' }
    },
    't-dice': {
      title: 'Zwei Würfel',
      story: 'Du wirfst zwei gewöhnliche Würfel und addierst die Augenzahlen.',
      questions: { q1: 'Welche Summe ist wahrscheinlicher: {s1} oder {s2}?', q2: 'Wie wahrscheinlich ist die Summe {s1}?' },
      options: { first: '{s1}', second: '{s2}', same: 'Gleich wahrscheinlich' },
      explain: 'Von den sechsunddreißig gleich wahrscheinlichen Ergebnissen ergeben {c1} die Summe {s1} und {c2} die Summe {s2}.',
      labels: {}
    }
  }
};
