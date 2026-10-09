import type { ContentText } from './types';

export const content: ContentText = {
  launch: {
    title: 'Aggiornamento sul lancio dell’app',
    context: 'Un’e-mail della responsabile di progetto a tutto il team.',
    sentences: {
      s1: 'Ciao a tutti, spero che abbiate passato un bel fine settimana al sole.',
      s2: 'Il lancio della nostra app di prenotazione passa dal 2 aprile al 14 maggio.',
      s3: 'Il motivo è che il fornitore dei pagamenti non ha ancora completato la certificazione di sicurezza, e senza di essa non possiamo incassare.',
      s4: 'Il fornitore dice di avere un arretrato di richieste.',
      s5: 'Il team di design userà le settimane in più per rifinire le schermate di benvenuto.',
      s6: 'I nostri 300 beta tester possono continuare a usare la versione di prova fino al lancio.',
      s7: 'Un concorrente ha lanciato un’app simile l’anno scorso e gli sono serviti tre tentativi.',
      s8: 'Il marketing deve spostare la campagna, quindi decidete entro venerdì il nuovo avvio della campagna.',
      s9: 'Il budget resta invariato, perché l’agenzia non fa pagare lo spostamento della campagna.',
      s10: 'La certificazione vera e propria dura circa tre settimane una volta iniziata.',
      s11: 'Grazie ancora per tutto il vostro lavoro!',
      s12: 'Mercoledì vi mando un piano di progetto aggiornato.'
    },
    bullets: {
      gold1: 'Il lancio passa dal 2 aprile al 14 maggio.',
      gold2: 'Causa: la certificazione di sicurezza del fornitore dei pagamenti non è completata.',
      gold3: 'Il marketing deve decidere entro venerdì il nuovo avvio della campagna.',
      minor: 'Il team di design rifinirà le schermate di benvenuto.',
      distort: 'L’app non ha superato il controllo di sicurezza.',
      dup: 'Il lancio è in ritardo.',
      subtle: 'Il lancio passa dal 2 aprile al 4 maggio.'
    },
    bulletNotes: {
      distort: 'Il testo dice che la certificazione non è ancora completata, non che l’app abbia fallito un controllo.',
      dup: 'Ripete il punto sulla nuova data ma senza la data, e spreca un posto.',
      subtle: 'Quasi, ma la nuova data è il 14 maggio, non il 4.'
    },
    summaries: {
      faithful: 'Il lancio passa al 14 maggio perché la certificazione del fornitore dei pagamenti non è completata, e il marketing deve decidere entro venerdì il nuovo avvio della campagna.',
      vague: 'Ci sono alcuni cambiamenti nei tempi del lancio di cui il team dovrebbe essere al corrente.',
      drops: 'Poiché il fornitore dei pagamenti non è ancora pronto, il lancio è stato rinviato, ma il budget resta invariato.',
      adds: 'Il lancio passa al 14 maggio perché la certificazione del fornitore dei pagamenti non è completata, e il ritardo renderà il progetto più costoso.',
      subtle: 'Il lancio passa al 14 maggio perché la nostra app non ha superato la certificazione del fornitore dei pagamenti, e il marketing deve decidere entro venerdì il nuovo avvio della campagna.'
    },
    summaryNotes: {
      drops: 'Mancano la nuova data e la decisione che il marketing deve prendere.',
      adds: 'Il testo dice che il budget resta invariato; l’aumento dei costi è inventato.',
      subtle: 'L’app non ha fallito niente: la certificazione semplicemente non è ancora finita.'
    },
    task: 'Il team marketing deve agire in base a questa frase.',
    oneLiner: 'Spostate il lancio a maggio.',
    details: {
      d1: 'La nuova data esatta: 14 maggio',
      d2: 'Chi deve agire: il marketing sposta la campagna',
      d3: 'La scadenza: decidere entro venerdì il nuovo avvio della campagna',
      d4: 'Perché il fornitore è in ritardo',
      d5: 'I piani del team di design per le schermate di benvenuto',
      d6: 'Il fine settimana di sole'
    },
    versions: {
      actionable: 'Il lancio passa dal 2 aprile al 14 maggio. Marketing: spostate la campagna e decidete entro venerdì la nuova data di avvio. Il budget resta invariato.',
      vague: 'Spostiamo il lancio a maggio. Adattate i vostri piani di conseguenza e fateci sapere se c’è qualcosa.',
      invented: 'Il lancio passa al 1° maggio. Marketing: annullate la campagna e preparatene una nuova entro fine mese.'
    },
    versionNote: 'La nuova data è il 14 maggio, non il 1°, e la campagna viene spostata, non annullata.'
  },
  library: {
    title: 'Lavori in biblioteca',
    context: 'Un avviso sulla porta della biblioteca di quartiere.',
    sentences: {
      s1: 'In tanti ci avete detto quanto amate le vecchie poltrone dell’angolo lettura.',
      s2: 'Dal 3 giugno la biblioteca resterà chiusa per lavori per otto settimane.',
      s3: 'Verrà riparato il tetto, e l’edificio avrà un ascensore e una nuova illuminazione.',
      s4: 'Durante la chiusura, un bibliobus sosterà in piazza del mercato ogni martedì.',
      s5: 'Il bibliobus porta circa 2.000 libri e può ordinare qualsiasi titolo dalla biblioteca centrale.',
      s6: 'Tutti i prestiti in scadenza durante la chiusura vengono prorogati automaticamente, quindi nessuno paga penali.',
      s7: 'I libri si possono anche restituire in qualsiasi momento nella cassetta per le restituzioni accanto al municipio.',
      s8: 'Il municipio stesso è stato ristrutturato in modo simile dieci anni fa.',
      s9: 'I nostri e-book e audiolibri restano disponibili online come sempre.',
      s10: 'Non vediamo già l’ora del festival estivo della lettura del prossimo anno.',
      s11: 'I lavori sono pagati da un fondo regionale per l’edilizia.'
    },
    bullets: {
      gold1: 'Chiusa per lavori otto settimane dal 3 giugno.',
      gold2: 'Un bibliobus sosta in piazza del mercato ogni martedì.',
      gold3: 'I prestiti in scadenza durante la chiusura sono prorogati automaticamente.',
      minor: 'L’edificio avrà una nuova illuminazione.',
      distort: 'Tutti i servizi della biblioteca si fermano per otto settimane.',
      dup: 'La biblioteca resterà chiusa per un po’.',
      subtle: 'Chiusa per lavori sei settimane dal 3 giugno.'
    },
    bulletNotes: {
      distort: 'Non è vero: il bibliobus e la cassetta per le restituzioni funzionano anche durante la chiusura.',
      dup: 'Ripete la chiusura senza data di inizio né durata.',
      subtle: 'Quasi, ma la chiusura dura otto settimane, non sei.'
    },
    summaries: {
      faithful: 'La biblioteca chiude per otto settimane dal 3 giugno; nel frattempo un bibliobus viene in piazza del mercato ogni martedì e i prestiti in scadenza sono prorogati automaticamente.',
      vague: 'Quest’estate ci saranno alcuni cambiamenti in biblioteca, quindi tenete gli occhi aperti.',
      drops: 'La biblioteca verrà ristrutturata e avrà un tetto riparato, un ascensore e una nuova illuminazione.',
      adds: 'La biblioteca chiude per otto settimane dal 3 giugno e, dopo la riapertura, farà pagare una piccola quota per i prestiti.',
      subtle: 'Poiché il tetto non è sicuro, la biblioteca chiude per otto settimane dal 3 giugno; nel frattempo un bibliobus viene in piazza del mercato ogni martedì.'
    },
    summaryNotes: {
      drops: 'Descrive i lavori, ma non quando chiude la biblioteca né cosa possono fare i lettori nel frattempo.',
      adds: 'L’avviso non parla di nessuna quota dopo la riapertura.',
      subtle: 'L’avviso dice che il tetto verrà riparato, non che non è sicuro: questa causa è aggiunta.'
    },
    task: 'Un vicino che vuole continuare a prendere libri in prestito ti chiede informazioni.',
    oneLiner: 'La biblioteca è chiusa d’estate.',
    details: {
      d1: 'Quando esattamente: otto settimane dal 3 giugno',
      d2: 'Dove prendere libri nel frattempo: il bibliobus in piazza del mercato il martedì',
      d3: 'Dove restituirli: la cassetta accanto al municipio',
      d4: 'Che cosa comprendono i lavori',
      d5: 'Le poltrone dell’angolo lettura',
      d6: 'Il festival della lettura del prossimo anno'
    },
    versions: {
      actionable: 'Dal 3 giugno la biblioteca è chiusa per otto settimane. Puoi prendere libri dal bibliobus in piazza del mercato ogni martedì e restituirli quando vuoi nella cassetta accanto al municipio. I prestiti in scadenza in quel periodo sono prorogati automaticamente.',
      vague: 'La biblioteca resterà chiusa per un po’ d’estate per dei lavori. Ci saranno altre possibilità, quindi guarda l’avviso.',
      invented: 'Dal 3 giugno la biblioteca è chiusa per otto settimane. Puoi prendere libri dal bibliobus alla stazione ogni venerdì. Restituisci tutti i libri prima della chiusura.'
    },
    versionNote: 'Il bibliobus sosta in piazza del mercato il martedì, e nessuno deve restituire i libri prima della chiusura.'
  },
  leaves: {
    title: 'Perché le foglie cambiano colore',
    context: 'Un breve articolo di una rivista di natura per lettori curiosi.',
    sentences: {
      s1: 'L’autunno è per molti la stagione preferita per le lunghe passeggiate.',
      s2: 'Le foglie sono verdi perché contengono molta clorofilla, il pigmento con cui le piante catturano la luce del sole.',
      s3: 'Quando le giornate si accorciano, molti alberi smettono di produrre clorofilla e la scompongono.',
      s4: 'I pigmenti gialli e arancioni, chiamati carotenoidi, erano nella foglia da sempre; diventano visibili solo quando il verde svanisce.',
      s5: 'I carotenoidi sono lo stesso tipo di pigmento che rende arancioni le carote.',
      s6: 'Il rosso è diverso: alcuni alberi, come molti aceri, producono in autunno nuovi pigmenti rossi.',
      s7: 'I ricercatori pensano che questi pigmenti rossi possano proteggere la foglia dalla luce forte mentre l’albero recupera i nutrienti.',
      s8: 'Le giornate di sole e le notti fresche di solito rendono i rossi più accesi.',
      s9: 'In alcune regioni i boschi colorati attirano ogni anno molti turisti.',
      s10: 'Infine, nel punto in cui la foglia si attacca al ramo si forma un sottile strato di cellule, e la foglia cade.',
      s11: 'Non dimenticate una giacca calda se uscite a guardare gli alberi.'
    },
    bullets: {
      gold1: 'In autunno gli alberi smettono di produrre la clorofilla verde e la scompongono.',
      gold2: 'I pigmenti gialli e arancioni c’erano da sempre e diventano visibili.',
      gold3: 'Alcuni alberi, come gli aceri, producono nuovi pigmenti rossi.',
      minor: 'Si forma un sottile strato di cellule e la foglia cade.',
      distort: 'Tutti i colori dell’autunno sono pigmenti nuovi prodotti dall’albero.',
      dup: 'Le foglie perdono il colore verde.',
      subtle: 'I pigmenti rossi proteggono la foglia dalla luce forte.'
    },
    bulletNotes: {
      distort: 'Solo i rossi sono nuovi; il giallo e l’arancione erano nella foglia da sempre.',
      dup: 'Dice meno del punto sulla clorofilla e spreca un posto.',
      subtle: 'Il testo dice solo che i ricercatori pensano che i pigmenti rossi possano proteggere la foglia; questo punto lo presenta come un fatto.'
    },
    summaries: {
      faithful: 'In autunno molti alberi scompongono la clorofilla verde, e così diventano visibili i pigmenti gialli e arancioni presenti da sempre, mentre alcuni alberi producono anche nuovi pigmenti rossi.',
      vague: 'Le foglie cambiano colore in autunno per vari processi naturali dell’albero.',
      drops: 'In autunno le foglie diventano gialle, arancioni e rosse, e poi cadono dagli alberi.',
      adds: 'In autunno molti alberi scompongono la clorofilla verde, e così diventano visibili i pigmenti gialli e arancioni, e più le foglie sono rosse, più freddo sarà l’inverno.',
      subtle: 'In autunno molti alberi scompongono la clorofilla verde, e così diventano visibili i pigmenti gialli e arancioni, e le notti fredde spingono gli alberi a produrre pigmenti rossi.'
    },
    summaryNotes: {
      drops: 'Descrive ciò che vediamo, ma non perché succede.',
      adds: 'Il testo non dice nulla sul prevedere l’inverno.',
      subtle: 'Le notti fresche di solito rendono solo più accesi i rossi; il testo non dice che causino i pigmenti rossi.'
    },
    task: 'Un’insegnante vuole spiegare questa frase alla classe usando foglie vere.',
    oneLiner: 'La clorofilla si scompone, così emergono altri colori.',
    details: {
      d1: 'Che cos’è la clorofilla: il pigmento verde che cattura la luce del sole',
      d2: 'Che il giallo e l’arancione erano nella foglia da sempre',
      d3: 'Che alcuni alberi, come gli aceri, producono nuovi pigmenti rossi',
      d4: 'Che l’autunno è una stagione amata per passeggiare',
      d5: 'Che fuori serve una giacca calda',
      d6: 'Come la foglia alla fine cade'
    },
    versions: {
      actionable: 'Le foglie sono verdi per via della clorofilla, un pigmento che cattura la luce del sole. In autunno molti alberi smettono di produrla e la scompongono. Allora diventano visibili i pigmenti gialli e arancioni che c’erano da sempre, e alcuni alberi, come gli aceri, producono nuovi pigmenti rossi.',
      vague: 'In autunno le foglie cambiano perché il verde se ne va e vengono fuori altri colori. La natura è affascinante.',
      invented: 'Le foglie sono verdi per via della clorofilla. In autunno il gelo congela la clorofilla, e poi l’albero dipinge le foglie di giallo, arancione e rosso con pigmenti nuovi.'
    },
    versionNote: 'Il testo non dice che il gelo congela la clorofilla, e solo i rossi sono pigmenti nuovi.'
  },
  club: {
    title: 'Riunione del direttivo della società sportiva',
    context: 'Il verbale di una riunione del direttivo di una società sportiva, inviato a tutti i soci.',
    sentences: {
      s1: 'La riunione si è tenuta nella club house ed è iniziata un po’ in ritardo per una partita di calcio.',
      s2: 'Il direttivo propone di portare la quota annuale da 60 a 66 euro dal prossimo gennaio.',
      s3: 'Il motivo è che l’affitto della palestra è aumentato del 15 per cento.',
      s4: 'La quota non cambia da otto anni.',
      s5: 'I soci sotto i 18 anni continueranno a pagare la vecchia quota.',
      s6: 'I soci voteranno la proposta all’assemblea generale del 12 marzo.',
      s7: 'Il direttivo ha parlato anche di nuove reti per i campi da tennis, ma ha rinviato la decisione.',
      s8: 'Se la proposta verrà respinta, il direttivo valuterà invece di tagliare alcuni orari di allenamento.',
      s9: 'Una società vicina ha di recente aumentato anch’essa la quota, a 75 euro.',
      s10: 'La palestra appartiene al comune, che stabilisce l’affitto.',
      s11: 'Un grande grazie alla squadra giovanile per le torte buonissime!'
    },
    bullets: {
      gold1: 'Proposta: la quota annuale sale da 60 a 66 euro da gennaio.',
      gold2: 'I soci sotto i 18 anni continuano a pagare la vecchia quota.',
      gold3: 'I soci votano all’assemblea generale del 12 marzo.',
      minor: 'Si è parlato di nuove reti per i campi da tennis.',
      distort: 'Il direttivo ha deciso di aumentare la quota.',
      dup: 'La quota associativa potrebbe aumentare.',
      subtle: 'Proposta: la quota annuale sale da 60 a 76 euro da gennaio.'
    },
    bulletNotes: {
      distort: 'Non è ancora deciso niente: è una proposta, e la votano i soci.',
      dup: 'Una ripetizione più vaga del punto sulla quota, senza importi.',
      subtle: 'Quasi, ma la quota proposta è di 66 euro, non di 76.'
    },
    summaries: {
      faithful: 'Poiché l’affitto della palestra è aumentato, il direttivo propone di portare la quota annuale da 60 a 66 euro da gennaio, esclusi i minori di 18 anni, e i soci voteranno il 12 marzo.',
      vague: 'Il direttivo ha parlato di questioni economiche e di alcuni cambiamenti per i soci.',
      drops: 'Poiché l’affitto della palestra è aumentato, le finanze della società sono state il tema principale della riunione del direttivo.',
      adds: 'Il direttivo propone di portare la quota annuale da 60 a 66 euro da gennaio, e chi non paga entro marzo perde l’iscrizione.',
      subtle: 'Poiché l’affitto della palestra è aumentato, il direttivo ha deciso di portare la quota annuale da 60 a 66 euro da gennaio, esclusi i minori di 18 anni.'
    },
    summaryNotes: {
      drops: 'Mancano la nuova quota proposta e la votazione del 12 marzo.',
      adds: 'Il verbale non dice nulla sulla perdita dell’iscrizione.',
      subtle: 'È solo una proposta che i soci devono ancora votare, quindi «ha deciso» è sbagliato.'
    },
    task: 'Un socio ti chiede che cosa significa per lui.',
    oneLiner: 'Le quote aumentano.',
    details: {
      d1: 'Gli importi: da 60 a 66 euro l’anno',
      d2: 'Che è una proposta, votata all’assemblea del 12 marzo',
      d3: 'Che i soci sotto i 18 anni mantengono la vecchia quota',
      d4: 'Che la riunione è iniziata in ritardo',
      d5: 'Le torte della squadra giovanile',
      d6: 'La discussione sulle reti da tennis'
    },
    versions: {
      actionable: 'Il direttivo propone di portare la quota annuale da 60 a 66 euro da gennaio, perché l’affitto della palestra è aumentato. I soci sotto i 18 anni mantengono la vecchia quota. Non è ancora deciso niente: puoi votare all’assemblea generale del 12 marzo.',
      vague: 'Le quote aumentano l’anno prossimo perché è diventato tutto più caro. Altre informazioni arriveranno prima o poi.',
      invented: 'Da gennaio la quota sale da 60 a 66 euro per tutti. Modifica il tuo bonifico prima dell’assemblea generale del 12 marzo.'
    },
    versionNote: 'Tratta una proposta come già decisa e dimentica che i soci sotto i 18 anni mantengono la vecchia quota.'
  },
  trip: {
    title: 'Cambiamento per la gita di classe',
    context: 'Un messaggio di un insegnante ai genitori di una classe.',
    sentences: {
      s1: 'Spero che i bambini siano emozionati per la gita quanto me!',
      s2: 'A causa di uno sciopero dei treni, andremo al mare in pullman invece che in treno.',
      s3: 'Questo significa che partiamo un’ora prima del previsto.',
      s4: 'Il punto di ritrovo non è più la stazione, ma il parcheggio dietro la scuola.',
      s5: 'La ditta di pullman ha molta esperienza con i gruppi scolastici.',
      s6: 'Il ritorno di venerdì resta come previsto.',
      s7: 'Non ci sono costi aggiuntivi per le famiglie: la scuola copre la differenza.',
      s8: 'Il viaggio in pullman dura circa 40 minuti in più del treno.',
      s9: 'La classe dell’anno scorso è andata in montagna, ed è stata anche quella una bellissima gita.',
      s10: 'A metà strada c’è una breve sosta in un’area di servizio.',
      s11: 'Grazie a tutti per l’aiuto con le liste dei bagagli.'
    },
    bullets: {
      gold1: 'Pullman invece del treno per uno sciopero dei treni.',
      gold2: 'Partenza un’ora prima, dal parcheggio dietro la scuola.',
      gold3: 'Nessun costo aggiuntivo per le famiglie.',
      minor: 'La ditta di pullman ha esperienza con i gruppi scolastici.',
      distort: 'La gita viene accorciata a causa dello sciopero.',
      dup: 'I piani di viaggio sono cambiati.',
      subtle: 'Partenza due ore prima, dal parcheggio dietro la scuola.'
    },
    bulletNotes: {
      distort: 'Cambia solo l’andata; la gita non viene accorciata.',
      dup: 'Dice solo che qualcosa è cambiato, cosa che gli altri punti già mostrano.',
      subtle: 'Quasi, ma la partenza è un’ora prima, non due.'
    },
    summaries: {
      faithful: 'A causa di uno sciopero dei treni, la classe viaggia in pullman e parte un’ora prima dal parcheggio dietro la scuola, senza costi aggiuntivi per le famiglie.',
      vague: 'Ci sono alcuni cambiamenti nell’organizzazione della gita che i genitori dovrebbero conoscere.',
      drops: 'A causa di uno sciopero dei treni, la classe andrà al mare in pullman, cosa che non costa nulla in più alle famiglie.',
      adds: 'A causa di uno sciopero dei treni, la classe viaggia in pullman e parte un’ora prima dal parcheggio dietro la scuola, e i genitori pagano un piccolo supplemento.',
      subtle: 'Poiché il pullman è più veloce del treno, la classe viaggia in pullman e parte un’ora prima dal parcheggio dietro la scuola, senza costi aggiuntivi per le famiglie.'
    },
    summaryNotes: {
      drops: 'Manca ciò che i genitori devono fare: la partenza anticipata e il nuovo punto di ritrovo.',
      adds: 'Il messaggio dice che la scuola copre la differenza, quindi non c’è nessun supplemento.',
      subtle: 'Il motivo è lo sciopero dei treni, e il pullman è perfino più lento del treno.'
    },
    task: 'Un genitore che non ha visto il messaggio chiede a un altro cosa fare.',
    oneLiner: 'La classe adesso va in pullman.',
    details: {
      d1: 'Il nuovo punto di ritrovo: il parcheggio dietro la scuola',
      d2: 'Il nuovo orario: un’ora prima del previsto',
      d3: 'Che non ci sono costi aggiuntivi',
      d4: 'Che la ditta di pullman è esperta',
      d5: 'Perché non vanno in treno',
      d6: 'Che l’insegnante non vede l’ora di partire'
    },
    versions: {
      actionable: 'La classe va in pullman. Porta tuo figlio al parcheggio dietro la scuola, non alla stazione, un’ora prima del previsto. Non costa niente in più, e il ritorno di venerdì non cambia.',
      vague: 'C’è uno sciopero, quindi adesso vanno in pullman. Orari e luoghi sono un po’ diversi, guarda cosa ha scritto l’insegnante.',
      invented: 'La classe va in pullman. Porta tuo figlio alla stazione un’ora prima e dagli un po’ di soldi per il biglietto del pullman.'
    },
    versionNote: 'Il ritrovo è al parcheggio dietro la scuola, non alla stazione, e la scuola copre i costi.'
  },
  bikes: {
    title: 'Bici elettriche nel bike sharing',
    context: 'Un annuncio del servizio di bike sharing di una città ai suoi utenti.',
    sentences: {
      s1: 'Andare in bici è un ottimo modo per restare attivi e scoprire la città.',
      s2: 'Dal 1° luglio il nostro bike sharing aggiunge 200 bici elettriche alla flotta.',
      s3: 'Una bici elettrica costa 20 centesimi al minuto; le bici normali mantengono il prezzo attuale.',
      s4: 'Per sbloccare una bici elettrica serve l’ultima versione della nostra app.',
      s5: 'Le bici elettriche hanno un’autonomia di circa 60 chilometri per ricarica.',
      s6: 'Le bici elettriche vanno riconsegnate in una delle 12 stazioni di ricarica; non si possono lasciare altrove.',
      s7: 'Una mappa delle stazioni di ricarica si trova nell’app.',
      s8: 'Se una bici elettrica viene lasciata fuori da una stazione, si paga una penale di 10 euro.',
      s9: 'Diverse altre città hanno introdotto servizi simili negli ultimi anni.',
      s10: 'Le bici sono state provate da 50 volontari durante l’inverno.',
      s11: 'Grazie per pedalare con noi!'
    },
    bullets: {
      gold1: 'Dal 1° luglio: 200 bici elettriche a 20 centesimi al minuto.',
      gold2: 'Per sbloccarle serve l’ultima versione dell’app.',
      gold3: 'Le bici elettriche vanno riconsegnate in una delle 12 stazioni di ricarica.',
      minor: 'Una mappa delle stazioni di ricarica è nell’app.',
      distort: 'Le bici elettriche sostituiscono quelle normali.',
      dup: 'Ci sono bici nuove.',
      subtle: 'Dal 1° luglio: 200 bici elettriche a 25 centesimi al minuto.'
    },
    bulletNotes: {
      distort: 'Le bici elettriche si aggiungono; quelle normali restano, al prezzo attuale.',
      dup: 'Una ripetizione più vaga del primo punto, senza data, numero né prezzo.',
      subtle: 'Quasi, ma il prezzo è di 20 centesimi al minuto, non 25.'
    },
    summaries: {
      faithful: 'Dal 1° luglio ci sono 200 bici elettriche a 20 centesimi al minuto; si sbloccano con l’ultima versione dell’app e vanno riconsegnate in una delle 12 stazioni di ricarica.',
      vague: 'Il bike sharing introduce quest’estate una novità che potrebbe interessare gli utenti.',
      drops: 'Il bike sharing aggiunge 200 bici elettriche con un’autonomia di circa 60 chilometri, così i tragitti lunghi diventano più facili.',
      adds: 'Dal 1° luglio ci sono 200 bici elettriche a 20 centesimi al minuto, e le bici normali saranno eliminate l’anno prossimo.',
      subtle: 'Dal 1° luglio ci sono 200 bici elettriche a 20 centesimi al minuto; si sbloccano con l’ultima versione dell’app e si possono riconsegnare in qualsiasi stazione.'
    },
    summaryNotes: {
      drops: 'Mancano il prezzo e ciò che gli utenti devono fare: aggiornare l’app e riconsegnare le bici in una stazione di ricarica.',
      adds: 'L’annuncio non dice da nessuna parte che le bici normali saranno eliminate.',
      subtle: 'Le bici elettriche si possono riconsegnare solo nelle 12 stazioni di ricarica, non in qualsiasi stazione.'
    },
    task: 'Un’amica vuole provare una bici elettrica la settimana prossima.',
    oneLiner: 'Adesso ci sono le bici elettriche.',
    details: {
      d1: 'Il prezzo: 20 centesimi al minuto',
      d2: 'Che per sbloccarle serve l’ultima versione dell’app',
      d3: 'Che le bici elettriche vanno riportate a una stazione di ricarica',
      d4: 'Che andare in bici tiene attivi',
      d5: 'Quante bici elettriche ci sono in tutto',
      d6: 'Che le bici normali mantengono il prezzo'
    },
    versions: {
      actionable: 'Dal 1° luglio puoi noleggiare bici elettriche a 20 centesimi al minuto. Prima aggiorna l’app, perché per sbloccarle serve l’ultima versione. Alla fine riporta la bici in una delle 12 stazioni di ricarica indicate sulla mappa dell’app.',
      vague: 'Adesso ci sono le bici elettriche, e sono facilissime da usare. Scarica l’app e parti.',
      invented: 'Dal 1° luglio puoi noleggiare bici elettriche a 20 centesimi al minuto senza l’app, e alla fine lasciarle dove vuoi in città.'
    },
    versionNote: 'Per sbloccarle serve l’ultima versione dell’app, e le bici vanno riportate a una stazione di ricarica.'
  }
};
