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
  }
};
