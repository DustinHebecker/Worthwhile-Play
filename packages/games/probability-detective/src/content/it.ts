import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'Il pacco blu',
      story: 'Al negozio all’angolo è arrivato un pacco senza mittente. Deve venire da uno dei magazzini che consegnano in questa via.',
      lead: 'I pacchi di questa via arrivano da:',
      hyps: { north: 'Magazzino Nord', south: 'Magazzino Sud', east: 'Magazzino Est' },
      clues: {
        blue: { label: 'Incartato in carta blu', seen: 'Il pacco è incartato in carta blu.', notSeen: 'Il pacco non è incartato in carta blu.' },
        'brown-tape': { label: 'Chiuso con nastro marrone', seen: 'È chiuso con nastro adesivo marrone.', notSeen: 'Non è chiuso con nastro adesivo marrone.' },
        smudge: { label: 'Etichetta sbavata', seen: 'L’etichetta dell’indirizzo è sbavata.', notSeen: 'L’etichetta dell’indirizzo è pulita.' },
        string: { label: 'Legato con lo spago', seen: 'È legato con lo spago.', notSeen: 'Non è legato con lo spago.' },
        tuesday: { label: 'Arrivato di martedì', seen: 'È arrivato di martedì. Tutti i magazzini consegnano ogni giorno feriale.', notSeen: 'È arrivato di martedì. Tutti i magazzini consegnano ogni giorno feriale.' },
        'echo-blue': { label: 'Anche la vicina l’ha visto', seen: 'Anche la vicina dice che il pacco era blu: ha visto lo stesso pacco.', notSeen: 'Anche la vicina dice che il pacco era blu: ha visto lo stesso pacco.' }
      }
    },
    'c-garden': {
      title: 'Le fragole rosicchiate',
      story: 'Durante la notte qualcuno ha mangiato le fragole. In questo giardino alcuni tipi di visitatori ne vanno ghiotti.',
      lead: 'Nelle notti in cui le fragole vengono rosicchiate, il visitatore è:',
      hyps: { birds: 'Uccelli', snails: 'Lumache', hedgehog: 'Un riccio' },
      clues: {
        slime: { label: 'Scia lucida', seen: 'Sul vialetto c’è una scia lucida.', notSeen: 'Non c’è nessuna scia lucida.' },
        pecks: { label: 'Piccole beccate', seen: 'I frutti hanno piccole beccate.', notSeen: 'Non ci sono beccate.' },
        droppings: { label: 'Escrementi sotto la siepe', seen: 'Sotto la siepe ci sono escrementi.', notSeen: 'Sotto la siepe non c’è niente.' },
        'net-moved': { label: 'Rete spostata', seen: 'La rete sopra l’aiuola è spostata.', notSeen: 'La rete è ancora al suo posto.' },
        rain: { label: 'Stanotte ha piovuto', seen: 'Stanotte ha piovuto: con la pioggia escono tutti.', notSeen: 'Stanotte ha piovuto: con la pioggia escono tutti.' },
        'echo-slime': { label: 'Rivista al mattino', seen: 'Il tuo vicino ti indica la stessa scia lucida.', notSeen: 'Il tuo vicino ti indica la stessa scia lucida.' }
      }
    },
    'c-rain': {
      title: 'Ha piovuto stanotte?',
      story: 'Sei stato via per la notte e vuoi sapere se le piantine hanno ricevuto pioggia o vanno annaffiate adesso.',
      lead: 'Le notti in questo periodo dell’anno:',
      hyps: { rained: 'Ha piovuto', dry: 'È rimasto asciutto' },
      clues: {
        'wet-grass': { label: 'Erba bagnata', seen: 'L’erba è bagnata (anche la rugiada la bagna).', notSeen: 'L’erba è asciutta.' },
        gauge: { label: 'Acqua nel pluviometro', seen: 'C’è acqua nel pluviometro.', notSeen: 'Il pluviometro è vuoto.' },
        puddle: { label: 'Pozzanghera al cancello', seen: 'C’è una pozzanghera al cancello.', notSeen: 'Non c’è nessuna pozzanghera al cancello.' },
        'snails-out': { label: 'Lumache sul vialetto', seen: 'Ci sono lumache sul vialetto.', notSeen: 'Non ci sono lumache sul vialetto.' },
        wind: { label: 'Foglie sul tavolo', seen: 'Il vento ha portato foglie sul tavolo: c’era vento in ogni caso.', notSeen: 'Il vento ha portato foglie sul tavolo: c’era vento in ogni caso.' }
      }
    },
    'c-bird': {
      title: 'Quale uccello era alla mangiatoia?',
      story: 'Hai visto solo di sfuggita un piccolo uccello marrone alla mangiatoia prima che volasse via. Le quote sono inventate per questa mangiatoia; quelle reali cambiano da luogo a luogo.',
      lead: 'I piccoli visitatori marroni di questa mangiatoia sono:',
      hyps: { finch: 'Un fringuello', sparrow: 'Un passero' },
      clues: {
        'red-patch': { label: 'Un lampo di rosso', seen: 'Hai visto un lampo di rosso sulla sua testa.', notSeen: 'Non hai visto niente di rosso.' },
        ground: { label: 'Ha mangiato a terra', seen: 'Ha mangiato a terra sotto la mangiatoia.', notSeen: 'Ha mangiato sulla mangiatoia.' },
        song: { label: 'Un canto cinguettante', seen: 'Ha fatto un canto cinguettante.', notSeen: 'Ha solo pigolato.' },
        group: { label: 'È arrivato in gruppo', seen: 'È arrivato con un piccolo gruppo.', notSeen: 'È arrivato da solo.' },
        morning: { label: 'Al mattino', seen: 'Era mattina presto: a quell’ora vengono entrambi.', notSeen: 'Era mattina presto: a quell’ora vengono entrambi.' }
      }
    },
    'c-plant': {
      title: 'La pianta afflosciata',
      story: 'La pianta dell’ufficio è afflosciata e ha foglie gialle. In questo ufficio di solito è una di due cose.',
      lead: 'Quando qui le piante si afflosciano, la causa è:',
      hyps: { water: 'Troppa acqua', light: 'Troppo poca luce' },
      clues: {
        'wet-soil': { label: 'Terra bagnata', seen: 'La terra è ancora bagnata due giorni dopo l’annaffiatura.', notSeen: 'La terra è asciutta.' },
        leaning: { label: 'Piegata verso la finestra', seen: 'Si piega verso la finestra.', notSeen: 'Sta dritta.' },
        'soft-stem': { label: 'Base dello stelo molle', seen: 'La base dello stelo è molle.', notSeen: 'Lo stelo è sodo.' },
        'pale-new': { label: 'Foglie nuove pallide', seen: 'Le foglie nuove sono pallide e piccole.', notSeen: 'Le foglie nuove sembrano sane.' },
        'pot-colour': { label: 'Un vaso blu', seen: 'È in un vaso blu: questo non cambia niente.', notSeen: 'È in un vaso blu: questo non cambia niente.' }
      }
    },
    'c-bus': {
      title: 'Perché l’autobus era in ritardo?',
      story: 'Stamattina il tuo autobus è arrivato con quaranta minuti di ritardo.',
      lead: 'Quando questo autobus è molto in ritardo, il motivo è:',
      hyps: { jam: 'Un ingorgo', breakdown: 'Un guasto' },
      clues: {
        'others-late': { label: 'Anche altri autobus in ritardo', seen: 'Anche altri autobus sulla stessa strada erano in ritardo.', notSeen: 'Gli altri autobus sulla strada erano puntuali.' },
        replacement: { label: 'È arrivato un altro autobus', seen: 'È arrivato un autobus diverso dal solito.', notSeen: 'È arrivato il solito autobus.' },
        announcement: { label: 'Un avviso', seen: 'Il display diceva: ritardo per un guasto tecnico.', notSeen: 'Il display non dava alcun motivo.' },
        'rush-hour': { label: 'All’ora di punta', seen: 'Era l’ora di punta.', notSeen: 'Era un momento tranquillo della giornata.' },
        rain: { label: 'Pioveva', seen: 'Pioveva: a questa fermata non fa differenza.', notSeen: 'Pioveva: a questa fermata non fa differenza.' }
      }
    }
  }
};
