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
    'c-cups': {
      title: 'La tazza incrinata',
      story: 'Un cliente riporta una tazza con una crepa sottile. Tutte le macchine del laboratorio fanno la stessa tazza, ma ognuna ha le sue manie.',
      lead: 'Le tazze del laboratorio sono fatte dalla:',
      hyps: { a: 'Macchina A', b: 'Macchina B', c: 'Macchina C' },
      clues: {
        crack: { label: 'Crepa sottile', seen: 'La tazza ha una crepa sottile.', notSeen: 'La tazza ha una crepa sottile.' },
        glaze: { label: 'Smalto più scuro', seen: 'Lo smalto è un po’ più scuro del solito.', notSeen: 'Lo smalto sembra normale.' },
        stamp: { label: 'Timbro nitido sulla base', seen: 'Il timbro del produttore sulla base è nitido.', notSeen: 'Il timbro sulla base è sbavato.' },
        handle: { label: 'Manico un po’ storto', seen: 'Il manico è un po’ fuori centro.', notSeen: 'Il manico è dritto.' },
        box: { label: 'In una scatola grigia', seen: 'È arrivata nella solita scatola grigia, come le tazze di tutte le macchine.', notSeen: 'È arrivata nella solita scatola grigia, come le tazze di tutte le macchine.' }
      }
    },
    'c-key': {
      title: 'La chiave scomparsa',
      story: 'La chiave di riserva è sparita di nuovo. Quasi sempre è in uno dei soliti pochi posti.',
      lead: 'Quando la chiave sparisce, salta fuori:',
      hyps: { coat: 'Nella giacca', car: 'In macchina', office: 'In ufficio' },
      clues: {
        'search-coat': { label: 'Una ricerca veloce nella giacca la trova', seen: 'Trovi la chiave nella giacca.', notSeen: 'Controlli in fretta le tasche della giacca: niente chiave. Una ricerca veloce può non vederla.' },
        'search-car': { label: 'Un’occhiata veloce in macchina la trova', seen: 'Trovi la chiave in macchina.', notSeen: 'Dai un’occhiata veloce in macchina: niente chiave. Un’occhiata veloce può non vederla.' },
        jingle: { label: 'Un tintinnio nell’ingresso', seen: 'Ricordi un tintinnio quando la giacca è stata appesa.', notSeen: 'Non ricordi nessun tintinnio.' },
        drove: { label: 'Ieri hai guidato', seen: 'Ieri hai guidato.', notSeen: 'Ieri non hai guidato.' },
        'office-day': { label: 'Eri in ufficio', seen: 'Ieri eri in ufficio.', notSeen: 'Ieri hai lavorato da casa.' },
        weekday: { label: 'È un giorno feriale', seen: 'Oggi è un giorno feriale: non cambia dove finiscono le chiavi.', notSeen: 'Oggi è un giorno feriale: non cambia dove finiscono le chiavi.' }
      }
    },
    'c-coin': {
      title: 'La moneta della fiera',
      story: 'Hai trovato una vecchia moneta a una bancarella della fiera che vende oggetti per giochi di prestigio. A occhio non si distingue da una moneta normale, quindi la lanci.',
      lead: 'Le monete nella scatola delle monete vecchie della bancarella sono:',
      hyps: { ordinary: 'Una moneta normale', weighted: 'Una moneta truccata', 'two-headed': 'Una moneta con due teste' },
      clues: {
        toss1: { label: 'Testa al primo lancio', seen: 'Primo lancio: testa.', notSeen: 'Primo lancio: croce.' },
        toss2: { label: 'Testa al secondo lancio', seen: 'Secondo lancio: testa.', notSeen: 'Secondo lancio: croce.' },
        toss3: { label: 'Testa al terzo lancio', seen: 'Terzo lancio: testa.', notSeen: 'Terzo lancio: croce.' },
        toss4: { label: 'Testa al quarto lancio', seen: 'Quarto lancio: testa.', notSeen: 'Quarto lancio: croce.' }
      }
    },
    'c-message': {
      title: 'Il messaggio «del club»',
      story: 'Un messaggio dice di arrivare dal tuo club sportivo e ti chiede di confermare l’iscrizione.',
      lead: 'I messaggi che dicono di venire dal club sono:',
      hyps: { real: 'Davvero del club', fake: 'Falsi' },
      clues: {
        link: { label: 'Contiene un link', seen: 'Contiene un link.', notSeen: 'Non contiene link.' },
        sender: { label: 'Mittente sconosciuto', seen: 'L’indirizzo del mittente non è quello solito del club.', notSeen: 'L’indirizzo del mittente è quello solito.' },
        hurry: { label: 'Mette fretta', seen: 'Dice che devi rispondere oggi.', notSeen: 'Non dà scadenze.' },
        'your-name': { label: 'Usa il tuo nome', seen: 'Ti saluta per nome.', notSeen: 'Dice solo «Gentile socio».' },
        evening: { label: 'Arrivato di sera', seen: 'È arrivato di sera: entrambi i tipi arrivano a qualsiasi ora.', notSeen: 'È arrivato di sera: entrambi i tipi arrivano a qualsiasi ora.' }
      }
    },
    'c-oven': {
      title: 'Il pane bruciato',
      story: 'Un pane dell’infornata di stamattina è uscito bruciato da un lato. Il panificio cuoce in due forni.',
      lead: 'I pani qui sono cotti nel:',
      hyps: { old: 'Forno vecchio', new: 'Forno nuovo' },
      clues: {
        'burnt-side': { label: 'Bruciato da un lato', seen: 'È bruciato da un lato.', notSeen: 'È bruciato da un lato.' },
        'pale-top': { label: 'Superficie pallida', seen: 'La superficie è pallida.', notSeen: 'La superficie è dorata in modo uniforme.' },
        'tray-mark': { label: 'Segno delle teglie nuove', seen: 'Il fondo mostra il disegno delle teglie nuove.', notSeen: 'Il fondo è liscio.' },
        early: { label: 'Della prima infornata', seen: 'Viene dalla prima infornata.', notSeen: 'Viene da un’infornata successiva.' },
        seeds: { label: 'Semi sopra', seen: 'Ha dei semi sopra: entrambi i forni cuociono pane ai semi.', notSeen: 'Ha dei semi sopra: entrambi i forni cuociono pane ai semi.' }
      }
    },
    'c-beep': {
      title: 'Il debole bip alla radio',
      story: 'Il ricevitore del club radio ha captato un bip debole e regolare. Quasi sempre bip così sono disturbi, ma sopra passa anche un piccolo satellite.',
      lead: 'I bip deboli e regolari su questo ricevitore sono:',
      hyps: { satellite: 'Un segnale di un piccolo satellite', interference: 'Un disturbo qualunque' },
      clues: {
        'pass-time': { label: 'Durante un passaggio del satellite', seen: 'È arrivato quando il satellite doveva passare sopra.', notSeen: 'È arrivato quando non era previsto alcun passaggio.' },
        drift: { label: 'Il tono scivola piano', seen: 'Il tono scivola piano, come quello di una sorgente in movimento.', notSeen: 'Il tono resta fisso.' },
        fades: { label: 'Svanisce dopo un po’', seen: 'Svanisce dopo una decina di minuti.', notSeen: 'Continua senza fermarsi.' },
        rhythm: { label: 'Un ritmo regolare', seen: 'Fa bip con un ritmo regolare: lo fanno entrambi.', notSeen: 'Fa bip con un ritmo regolare: lo fanno entrambi.' },
        'other-receiver': { label: 'Un secondo ricevitore lo sente', seen: 'Un socio del club dall’altra parte della città lo sente anche lui.', notSeen: 'Il ricevitore dall’altra parte della città non sente nulla.' }
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
  },
checks: {
    'k-picnic': {
      title: 'All’aperto o nella sala?',
      story: 'Il picnic di quartiere è questo pomeriggio. Puoi farlo sul prato o prenotare la sala di quartiere.',
      lead: 'I pomeriggi in questo periodo dell’anno sono:',
      hyps: { dry: 'Asciutti', rain: 'Piovosi' },
      question: 'Quanto è probabile un pomeriggio asciutto?',
      options: { outdoors: 'Picnic sul prato', hall: 'Prenotare la sala', tent: 'Montare un tendone sul prato' },
      checks: {
        sky: { label: 'Guardare il cielo a mezzogiorno', yes: 'Nuvole scure a mezzogiorno.', no: 'Niente nuvole scure a mezzogiorno.' },
        barometer: { label: 'Guardare il barometro', yes: 'Il barometro scende.', no: 'Il barometro è stabile.' },
        farmer: { label: 'Chiedere al contadino vicino', yes: 'Il contadino si aspetta pioggia.', no: 'Il contadino si aspetta un pomeriggio asciutto.' },
        service: { label: 'Chiamare il servizio meteo', yes: 'Il servizio meteo avvisa di pioggia.', no: 'Il servizio meteo non dà avvisi.' },
        swallows: { label: 'Osservare le rondini', yes: 'Le rondini volano basse.', no: 'Le rondini volano alte.' }
      }
    },
    'k-bike': {
      title: 'Comprare la bici usata?',
      story: 'Una bici usata è in vendita a buon prezzo. Le bici così di solito sono a posto, ma alcune hanno danni nascosti.',
      lead: 'Le bici usate come questa sono:',
      hyps: { sound: 'A posto', damaged: 'Con danni nascosti' },
      question: 'Quanto è probabile che la bici sia a posto?',
      options: { buy: 'Comprarla', skip: 'Lasciarla', 'offer-less': 'Offrire meno e correre il rischio' },
      checks: {
        ride: { label: 'Fare un giro di prova', yes: 'Il giro di prova è fluido.', no: 'Il giro di prova è a scossoni.' },
        chain: { label: 'Guardare la catena', yes: 'La catena è arrugginita.', no: 'La catena è pulita.' },
        receipts: { label: 'Chiedere le ricevute delle riparazioni', yes: 'Il venditore ha le ricevute delle riparazioni.', no: 'Il venditore non ha ricevute.' },
        mechanic: { label: 'Pagare un meccanico per un controllo', yes: 'Il meccanico trova un problema.', no: 'Il meccanico non trova nulla.' },
        'seller-says': { label: 'Chiedere al venditore', yes: 'Il venditore dice che è a posto.', no: 'Il venditore non ne è sicuro.' }
      }
    },
    'k-seeds': {
      title: 'Seminare i semi vecchi?',
      story: 'Nel capanno è saltata fuori una bustina di semi dimenticata. Seminarli richiede un fine settimana; i semi nuovi costano poco.',
      lead: 'Le bustine dimenticate come questa sono:',
      hyps: { good: 'Ancora buone', dead: 'Quasi tutti morti' },
      question: 'Quanto è probabile che i semi siano ancora buoni?',
      options: { sow: 'Seminare i semi vecchi', fresh: 'Comprare semi nuovi' },
      checks: {
        float: { label: 'Metterne alcuni in acqua', yes: 'La maggior parte affonda.', no: 'La maggior parte galleggia.' },
        sprout: { label: 'Provarne alcuni su un panno umido', yes: 'La maggior parte germoglia.', no: 'Ne germogliano pochi.' },
        date: { label: 'Leggere la data sulla bustina', yes: 'La data è recente.', no: 'La data è vecchia.' },
        shrivelled: { label: 'Guardare i semi da vicino', yes: 'I semi sembrano raggrinziti.', no: 'I semi sembrano pieni.' },
        smell: { label: 'Annusarli', yes: 'Hanno un odore fresco.', no: 'Sanno di muffa.' }
      }
    },
    'k-melon': {
      title: 'Comprare questo melone?',
      story: 'Al mercato è rimasto un melone a buon prezzo.',
      lead: 'I meloni rimasti a quest’ora su questa bancarella sono:',
      hyps: { ripe: 'Maturi', unripe: 'Non ancora maturi' },
      question: 'Quanto è probabile che il melone sia maturo?',
      options: { buy: 'Comprarlo', leave: 'Lasciarlo' },
      checks: {
        knock: { label: 'Bussarci sopra', yes: 'Suona vuoto.', no: 'Suona sordo.' },
        smell: { label: 'Annusarlo', yes: 'Ha un profumo dolce.', no: 'Non sa quasi di niente.' },
        'soft-end': { label: 'Premere l’estremità', yes: 'L’estremità cede un po’.', no: 'L’estremità è dura.' },
        taste: { label: 'Assaggiare una fetta dalla stessa cassetta', yes: 'La fetta è dolce.', no: 'La fetta è insipida.' },
        sticker: { label: 'Leggere l’etichetta', yes: 'Ha un’etichetta «maturo».', no: 'Non ha etichette.' }
      }
    },
    'k-bread': {
      title: 'Cuocere di più per il mercato?',
      story: 'Domani è giorno di mercato. Il pane in più si vende bene in una giornata affollata, ma diventa raffermo in una tranquilla.',
      lead: 'I giorni di mercato qui sono:',
      hyps: { busy: 'Affollati', quiet: 'Tranquilli' },
      question: 'Quanto è probabile un giorno di mercato affollato?',
      options: { extra: 'Cuocere molto di più', normal: 'Cuocere la quantità solita', 'little-extra': 'Cuocere un po’ di più' },
      checks: {
        calendar: { label: 'Guardare il calendario della città', yes: 'Il calendario segnala un evento.', no: 'Il calendario non segnala nulla.' },
        neighbour: { label: 'Chiedere al banco dei formaggi', yes: 'Il banco dei formaggi si aspetta molta gente.', no: 'Il banco dei formaggi si aspetta una giornata tranquilla.' },
        sunny: { label: 'Leggere le previsioni', yes: 'È previsto sole.', no: 'Sono previste nuvole.' },
        office: { label: 'Chiamare l’ufficio del mercato', yes: 'L’ufficio del mercato si aspetta molti visitatori.', no: 'L’ufficio del mercato si aspetta il solito.' },
        'last-week': { label: 'Ripensare alla settimana scorsa', yes: 'La settimana scorsa era affollata.', no: 'La settimana scorsa era tranquilla.' }
      }
    },
    'k-laptop': {
      title: 'Ripararlo da soli?',
      story: 'Il portatile si spegne a caso. Ripararlo a casa costa poco se il guasto è piccolo, ma è fatica sprecata se è grave.',
      lead: 'I guasti come questo sono:',
      hyps: { minor: 'Un guasto piccolo', major: 'Un guasto grave' },
      question: 'Quanto è probabile un guasto piccolo?',
      options: { repair: 'Ripararlo a casa', shop: 'Portarlo in assistenza', wait: 'Aspettare e osservare' },
      checks: {
        'error-code': { label: 'Riavviare e osservare', yes: 'Compare un codice di errore.', no: 'Non compare nessun codice di errore.' },
        diagnostics: { label: 'Avviare lo strumento di diagnosi', yes: 'Lo strumento segnala un guasto.', no: 'Lo strumento non segnala nulla.' },
        cable: { label: 'Cambiare il cavo di alimentazione', yes: 'Con un altro cavo funziona.', no: 'Continua a spegnersi.' },
        fan: { label: 'Ascoltare la ventola', yes: 'La ventola fa un rumore di sfregamento.', no: 'La ventola suona normale.' },
        forum: { label: 'Leggere il forum', yes: 'Altri con questo modello dicono che era una cosa piccola.', no: 'Altri con questo modello riportano cause diverse.' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: 'Il sensore dei lampioni',
      story: 'Il comune controlla i suoi vecchi lampioni con un sensore. Di tutti i lampioni, {f} sono davvero guasti. Il sensore segnala {s} dei lampioni guasti, ma per errore segnala anche {q} di quelli funzionanti. Il lampione {lamp} è appena stato segnalato.',
      questions: { q1: 'Il lampione {lamp} è più probabilmente guasto o funzionante?', q2: 'Quanto è probabile che il lampione {lamp} sia guasto?' },
      options: { faulty: 'Più probabilmente guasto', working: 'Più probabilmente funzionante' },
      explain: 'Conta i lampioni segnalati: {k} dei {n} lampioni segnalati sono davvero guasti, quindi la probabilità è {p}. Se ci si possa fidare di una segnalazione dipende da quanto sono rari i guasti, non solo da quanto è buono il sensore.',
      labels: { faulty: 'Lampioni guasti', working: 'Lampioni funzionanti', fit: 'segnalati' }
    },
    't-wheel': {
      title: 'La ruota',
      story: 'Una ruota equa ha {k} settori uguali, e {r} di essi mostrano una stella. Gli ultimi {s} giri hanno tutti mancato la stella.',
      questions: { q1: 'Al prossimo giro, una stella è…', q2: 'Quanto è probabile una stella al prossimo giro?' },
      options: { more: 'più probabile del solito', less: 'meno probabile del solito', same: 'probabile come sempre' },
      explain: 'La ruota non ha memoria: ogni giro ricomincia da capo, quindi la stella esce ancora nel {p} dei casi.',
      labels: { spins: 'I giri mancati e il prossimo' }
    },
    't-sequence': {
      title: 'Quale risultato è più probabile?',
      story: 'Una moneta equa viene lanciata {n} volte (● testa, ○ croce). Due risultati possibili: A {a} e B {b}.',
      questions: { q1: 'Quale risultato esatto è più probabile?', q2: 'Quanto è probabile esattamente il risultato B?' },
      options: { a: 'A', b: 'B', same: 'Sono ugualmente probabili' },
      explain: 'Ci sono {total} risultati possibili, e ognuno esatto ha la stessa probabilità, {p}. B sembra più tipico solo perché i risultati misti, come gruppo, sono frequenti.',
      labels: { a: 'A', b: 'B' }
    },
    't-conjunction': {
      title: 'Pioggia e vento',
      story: 'Le previsioni di domani danno alla pioggia una probabilità del {a}. Qui, nei giorni di pioggia c’è vento nel {b} dei casi; nei giorni asciutti, nel {w} dei casi.',
      questions: { q1: 'Che cosa è più probabile domani?', q2: 'Quanto è probabile un giorno con pioggia e vento?' },
      options: { windy: 'Un giorno ventoso', both: 'Un giorno con pioggia e vento', same: 'Uguali' },
      explain: 'Immagina {days} giorni come domani: {both} hanno pioggia e vento, ma {windy} sono ventosi in tutto. Ogni giorno con pioggia e vento è anche un giorno ventoso, quindi «pioggia e vento» non può mai essere più probabile di «vento».',
      labels: { windy: 'Ventoso', calm: 'Calmo', rainy: 'Giorni di pioggia', dry: 'Giorni asciutti' }
    },
    't-simpson': {
      title: 'I due servizi di consegna',
      story: 'Due servizi di consegna riferiscono quante volte sono stati puntuali il mese scorso. Servizio A: tratte brevi {aSk} su {aSn}, tratte lunghe {aLk} su {aLn}. Servizio B: tratte brevi {bSk} su {bSn}, tratte lunghe {bLk} su {bLn}.',
      questions: { q1: 'Quale servizio è stato puntuale più spesso in totale?', q2: 'Il tuo pacco fa una tratta lunga. Quale servizio ha il risultato migliore sulle tratte lunghe?' },
      options: { a: 'Il servizio A', b: 'Il servizio B', same: 'Uguali' },
      explain: 'A è migliore sulle tratte brevi e su quelle lunghe, eppure B è migliore in totale ({b} contro {a} consegne puntuali), perché B fa soprattutto le tratte brevi, più facili. Confronta ciò che è confrontabile.',
      labels: { a: 'Servizio A', b: 'Servizio B', short: 'Tratte brevi', long: 'Tratte lunghe', overall: 'In totale' }
    },
    't-paw': {
      title: 'L’impronta nella farina',
      story: 'Stanotte qualcuno ha camminato nella farina sul pavimento del panificio. L’impronta corrisponde al gatto dei vicini. Solo {r} gatti hanno un’impronta così. Circa {n} gatti vivono abbastanza vicino da poter essere entrati.',
      questions: { q1: '«Solo {r}» vuol dire che era quasi certamente il gatto dei vicini?', q2: 'Quanto è probabile che fosse il gatto dei vicini? Supponi che ogni gatto dei dintorni avesse la stessa probabilità di entrare.' },
      options: { yes: 'Sì, sicuro al {sure} circa', no: 'No, molto meno sicuro di così' },
      explain: 'Tra i {n} gatti dei dintorni, circa {others} altri hanno anche loro un’impronta che corrisponde. Il gatto dei vicini è solo uno dei tanti che vanno bene: {p}.',
      labels: { neighbour: 'Notti in cui è entrato il gatto dei vicini', others: 'Notti in cui è entrato un altro gatto', fit: 'l’impronta corrisponde' }
    },
    't-bakery': {
      title: 'Il panificio piccolo e quello grande',
      story: 'Due panifici vendono pane di segale e di frumento. In media metà dei pani venduti è di segale, e ogni pane è una scelta a sé. Il panificio piccolo vende {n1} pani al giorno, quello grande {n2}.',
      questions: { q1: 'Quale panificio ha più giorni in cui oltre il {t} dei pani venduti è di segale?', q2: 'In quale quota dei giorni il panificio piccolo vende oltre il {t} di segale?' },
      options: { small: 'Il panificio piccolo', large: 'Il panificio grande', same: 'Più o meno uguale' },
      explain: 'I campioni piccoli oscillano di più. Il panificio piccolo ha giorni così nel {small} dei casi, quello grande solo nel {large}.',
      labels: { small: 'Panificio piccolo', large: 'Panificio grande' }
    },
    't-drawers': {
      title: 'Il custode che sa',
      story: 'Uno di {n} cassetti chiusi contiene la chiave. Indichi un cassetto. Il custode, che sa dov’è la chiave, apre allora {opened} degli altri cassetti, tutti vuoti, e ne lascia chiuso esattamente un altro. Fa sempre così e non apre mai il tuo.',
      questions: { q1: 'Tenere il tuo cassetto o passare all’altro chiuso?', q2: 'Quanto è probabile che la chiave sia nell’altro cassetto chiuso?' },
      options: { switch: 'Cambiare', keep: 'Tenere il mio cassetto', same: 'Non fa differenza' },
      explain: 'Immagina {total} partite. La tua prima scelta è giusta solo in una parte di esse. Nelle altre {wins}, il custode deve lasciare chiuso il cassetto con la chiave, quindi cambiare vince: {p}.',
      labels: { right: 'Partite in cui la tua prima scelta ha la chiave', wrong: 'Partite in cui non ce l’ha', fit: 'cambiare vince' }
    },
    't-week': {
      title: 'Almeno un giorno di pioggia',
      story: 'Progetti un viaggio di {m} giorni. Ogni giorno ha una probabilità di pioggia del {q}, indipendente dagli altri giorni.',
      questions: { q1: 'Quanto è probabile almeno un giorno di pioggia?' },
      options: {},
      explain: 'Sommare le probabilità darebbe {sum}, e non può essere giusto. Moltiplica invece le probabilità di un giorno asciutto: nessuna pioggia ha una probabilità del {none}, quindi almeno un giorno di pioggia ha {p}.',
      labels: { step: 'Ancora asciutto dopo il giorno {n}' }
    },
    't-numbers': {
      title: 'Lo stesso numero due volte',
      story: 'Ognuna di {g} persone sceglie in segreto, a caso, un numero intero da uno a {r}.',
      questions: { q1: 'Quanto è probabile che almeno due scelgano lo stesso numero? Prima la tua sensazione:', q2: 'Ora la tua stima: quanto è probabile almeno un numero in comune?' },
      options: { low: 'Meno di una su quattro', even: 'Più o meno metà e metà', high: 'Più di tre su quattro' },
      explain: 'Con {g} persone ci sono {pairs} coppie che potrebbero coincidere, quindi una coincidenza arriva prima di quanto sembri: {p}.',
      labels: { step: 'Tutti diversi tra i primi {n}' }
    },
    't-tyres': {
      title: 'Meno forature',
      story: 'Un nuovo tipo di pneumatico riduce le forature da {b} a {a} ogni cento corse. Il produttore la chiama una riduzione del {rel}.',
      questions: { q1: 'Su {rides} corse, quante forature in meno?' },
      options: {},
      explain: 'Su {rides} corse ci sono {old} forature prima e {new} dopo: {fewer} in meno. «Il {rel} in meno» suona grande; quello che noti è la variazione assoluta.',
      labels: { old: 'Pneumatici vecchi', new: 'Pneumatici nuovi', fit: 'forature' }
    },
    't-dice': {
      title: 'Due dadi',
      story: 'Lanci due dadi normali e sommi i punti.',
      questions: { q1: 'Quale somma è più probabile: {s1} o {s2}?', q2: 'Quanto è probabile la somma {s1}?' },
      options: { first: '{s1}', second: '{s2}', same: 'Ugualmente probabili' },
      explain: 'Dei trentasei risultati ugualmente probabili, {c1} danno {s1} e {c2} danno {s2}.',
      labels: {}
    }
  }
};
