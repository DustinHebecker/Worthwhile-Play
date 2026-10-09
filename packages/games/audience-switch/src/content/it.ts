import type { ContentText } from './types';

export const content: ContentText = {
  migration: {
    title: 'Migrazione del database',
    situation: 'Il tuo team sta trasferendo il database clienti su un nuovo sistema. I test hanno trovato un problema e il passaggio slitta. Spiegalo.',
    facts: {
      newDate: 'Il passaggio slitta di due giorni: giovedì invece di martedì.',
      cause: 'I test hanno trovato un bug finora sconosciuto con caratteri speciali come ü o é.',
      noLoss: 'Nessun dato è andato perso.',
      encoding: 'Lo script di importazione legge il testo con la codifica dei caratteri sbagliata.',
      apology: 'Ci scusiamo per il disagio.',
      regression: 'Un nuovo test automatico ora controlla i caratteri speciali.',
      buffer: 'I due giorni rientrano nel margine di tempo del progetto, senza costi aggiuntivi.',
      library: 'La conversione errata viene da una libreria scelta anni fa.'
    },
    reasons: {
      'developer.cause': 'Gli sviluppatori devono sapere che cosa hanno trovato davvero i test.',
      'developer.encoding': 'È la causa di fondo su cui lavoreranno.',
      'developer.apology': 'Scusarsi con i clienti non aiuta una collega a correggere il bug.',
      'developer.regression': 'Devono sapere che il bug ora è coperto da un test.',
      'developer.buffer': 'Margine di tempo e budget sono affare della capoprogetto.',
      'projectManager.newDate': 'La capoprogetto pianifica con la nuova data.',
      'projectManager.noLoss': 'Una perdita di dati cambierebbe completamente il rischio, quindi deve sentirsi dire che non c’è.',
      'projectManager.encoding': 'Il dettaglio sulla codifica non cambia nessuna decisione di pianificazione.',
      'projectManager.apology': 'Le scuse sono per i clienti; la capoprogetto ha bisogno di fatti.',
      'projectManager.buffer': 'Se tempi e budget reggono è proprio la sua domanda.',
      'projectManager.library': 'Chi ha scelto una libreria anni fa non aiuta a pianificare adesso.',
      'customer.newDate': 'Il cliente ha bisogno della nuova data, non del tipo di bug.',
      'customer.noLoss': 'La sua prima preoccupazione sono i suoi dati, e sono al sicuro.',
      'customer.cause': 'I dettagli del bug preoccupano i clienti senza aiutarli.',
      'customer.encoding': 'I dettagli tecnici interni non dicono nulla al cliente.',
      'customer.regression': 'I test interni non riguardano il cliente.',
      'customer.buffer': 'Margini e costi interni non riguardano il cliente.',
      'customer.library': 'Dare la colpa a una vecchia libreria suona come una scusa.'
    },
    messages: {
      'developer.fit': 'Per info: lo script di importazione legge il testo con la codifica sbagliata, quindi caratteri speciali come ü ed é si rompono. Ora c’è un test di regressione che lo copre; il passaggio slitta a giovedì.',
      'developer.missing': 'Piccolo ritardo sulla migrazione, niente di grave. Dettagli più avanti.',
      'developer.condescending': 'I caratteri speciali sono lettere come la ü che non sono nell’alfabeto di base. I computer salvano le lettere come numeri, e a volte i numeri si confondono.',
      'projectManager.fit': 'La migrazione slitta da martedì a giovedì. Nessun dato è andato perso e i due giorni rientrano nel nostro margine senza costi aggiuntivi. Causa: un bug con i caratteri speciali, ora coperto da un test.',
      'projectManager.tooMuch': 'Lo script di importazione decodifica l’input come Latin-1 invece che UTF-8, quindi i caratteri multibyte si rovinano; stiamo correggendo il lettore e aggiungendo un test di regressione.',
      'projectManager.missing': 'Abbiamo trovato un bug e ci stiamo lavorando. Ti faremo sapere.',
      'customer.fit': 'I suoi dati sono al sicuro. Per essere certi che ogni nome e ogni indirizzo vengano trasferiti correttamente, spostiamo il passaggio da martedì a giovedì. Fino ad allora, tutto funziona come sempre.',
      'customer.tooMuch': 'Il nostro script di importazione usava la codifica dei caratteri sbagliata, che ha danneggiato i caratteri speciali nei test, quindi la migrazione richiede altri due giorni del nostro margine.',
      'customer.condescending': 'Non si preoccupi della parte tecnica, è complicata. Sappia solo che ci vorrà un po’ di più.'
    }
  },
  skyBlue: {
    title: 'Perché il cielo è blu',
    situation: 'Qualcuno ti chiede perché il cielo è blu. Conosci la fisica che c’è dietro. Spiegalo.',
    facts: {
      sunlight: 'La luce del sole contiene tutti i colori.',
      scatter: 'L’aria diffonde la luce blu molto più di quella rossa.',
      rayleigh: 'Questa diffusione di Rayleigh cresce con la quarta potenza della frequenza (1/λ⁴).',
      sunset: 'Al tramonto la luce attraversa più aria, perciò il cielo diventa rosso e arancione.',
      everywhere: 'La luce blu diffusa arriva agli occhi da tutte le direzioni, per questo tutto il cielo sembra blu.',
      violet: 'Il viola viene diffuso ancora di più, ma la luce del sole ne contiene meno e i nostri occhi sono meno sensibili a esso.',
      molecules: 'La diffusione avviene sulle molecole di azoto e ossigeno, molto più piccole della lunghezza d’onda della luce.',
      ocean: 'Il cielo è blu perché riflette il mare.'
    },
    reasons: {
      'child.sunlight': 'Ai bambini serve prima la sorpresa: la luce bianca del sole nasconde tutti i colori.',
      'child.scatter': 'È l’idea centrale, detta con parole semplici.',
      'child.rayleigh': 'Con una formula si perde subito un bambino.',
      'child.everywhere': 'Spiega ciò che vedono: blu ovunque guardino.',
      'child.violet': 'Il dettaglio sul viola a questa età confonde più di quanto aiuti.',
      'child.molecules': 'Molecole e lunghezze d’onda sono troppo astratte per un bambino.',
      'layperson.sunlight': 'Senza questo, «la luce blu viene diffusa» non ha senso.',
      'layperson.scatter': 'È la risposta vera e propria, con parole di tutti i giorni.',
      'layperson.rayleigh': 'La formula non aggiunge nulla che un profano possa usare.',
      'expert.rayleigh': 'Un esperto si aspetta il meccanismo preciso e la sua dipendenza dalla lunghezza d’onda.',
      'expert.everywhere': 'Per un esperto è ovvio e gli fa perdere tempo.',
      'expert.violet': 'Gli esperti conoscono l’obiezione ovvia, «perché non viola?»: rispondi.',
      'expert.molecules': 'Nominare i diffusori e il rapporto di dimensioni rende la spiegazione precisa.',
      ocean: 'È un mito diffuso; il colore non viene dal mare.'
    },
    messages: {
      'child.fit': 'La luce del sole sembra bianca, ma in realtà ha dentro tutti i colori mescolati. Quando attraversa l’aria, la parte blu è quella che rimbalza di più da tutte le parti, così il blu arriva ai tuoi occhi da tutto il cielo.',
      'child.tooMuch': 'La luce blu ha una lunghezza d’onda più corta, e la diffusione di Rayleigh cresce come uno diviso la lunghezza d’onda alla quarta.',
      'child.missing': 'Il cielo è così e basta. È sempre stato blu.',
      'layperson.fit': 'La luce del sole contiene tutti i colori. L’aria diffonde la luce blu molto più di quella rossa, quindi la luce blu ci arriva da ogni parte del cielo.',
      'layperson.tooMuch': 'È diffusione di Rayleigh: l’intensità scala con 1/λ⁴, quindi le lunghezze d’onda corte dominano la radianza diffusa del cielo.',
      'layperson.condescending': 'È un po’ complicato per chi non è uno scienziato. Diciamo solo che è l’aria a renderlo blu.',
      'expert.fit': 'Diffusione di Rayleigh da molecole di N₂ e O₂, proporzionale a 1/λ⁴. Il viola è diffuso ancora di più, ma lo spettro solare ne contiene meno e i nostri coni sono meno sensibili.',
      'expert.condescending': 'Immagina la luce del sole come una scatola di pastelli! All’aria piace soprattutto giocare con il pastello blu.',
      'expert.missing': 'L’aria diffonde di più la luce blu, ecco perché.'
    }
  },
  clubRoof: {
    title: 'Il tetto della sede',
    situation: 'Il tetto della sede della tua società sportiva va riparato con urgenza e costa più del previsto. Spiegalo.',
    facts: {
      cost: 'La riparazione costa 8.000 euro, 3.000 in più del previsto a bilancio.',
      decision: 'Il consiglio direttivo deve decidere entro venerdì se spostare 3.000 euro dal budget della festa d’estate.',
      storage: 'Il magazzino attrezzi resta chiuso fino alla riparazione; il resto della sede è aperto.',
      fees: 'Le quote associative non cambiano.',
      schedule: 'Il copritetto inizia il 12 maggio e ha bisogno di quattro giorni; il parcheggio serve per il ponteggio.',
      tiles: 'Le nuove tegole sono in cemento color antracite.',
      reserve: 'Usare invece il fondo di riserva lo porterebbe sotto il minimo obbligatorio.',
      volunteer: 'Un socio si è offerto di riparare il tetto gratis da solo, ma non è un copritetto.'
    },
    reasons: {
      'executive.cost': 'Il consiglio ha bisogno della cifra e dello sforamento per valutare.',
      'executive.decision': 'È la decisione che deve prendere, con la scadenza.',
      'executive.storage': 'L’uso quotidiano delle stanze non è una questione da consiglio.',
      'executive.schedule': 'I giorni esatti dei lavori sono compito del coordinatore.',
      'executive.tiles': 'Tipo e colore delle tegole non influenzano la decisione.',
      'executive.reserve': 'Spiega perché l’alternativa ovvia non è un’opzione.',
      'projectManager.fees': 'Le quote non c’entrano nulla con l’organizzazione della riparazione.',
      'projectManager.schedule': 'Il coordinatore organizza proprio queste date e il parcheggio.',
      'projectManager.reserve': 'Il finanziamento lo decide il consiglio, non il coordinatore.',
      'layperson.storage': 'I soci vogliono sapere che cosa possono usare e che cosa no.',
      'layperson.fees': 'I loro soldi sono la prima domanda.',
      'layperson.tiles': 'I dettagli dei materiali non interessano ai soci.',
      'layperson.reserve': 'Le regole sul fondo di riserva sono dettagli finanziari interni.',
      volunteer: 'Un’offerta senza la qualifica adatta apre solo un dibattito inutile; non è una vera opzione.'
    },
    messages: {
      'executive.fit': 'Serve una decisione entro venerdì: la riparazione del tetto costa 8.000 euro, 3.000 in più del previsto. Proponiamo di spostare 3.000 dal budget della festa d’estate, perché il fondo di riserva scenderebbe sotto il minimo.',
      'executive.tooMuch': 'Il copritetto inizia il 12 maggio con tegole in cemento antracite; il ponteggio resta quattro giorni nel parcheggio e il magazzino attrezzi resta chiuso fino ad allora.',
      'executive.missing': 'Il tetto costerà di più. Vi terremo aggiornati.',
      'projectManager.fit': 'Il copritetto inizia il 12 maggio e ha bisogno di quattro giorni. Per favore, lascia libero il parcheggio per il ponteggio dall’11 maggio.',
      'projectManager.tooMuch': 'La riparazione costa 8.000 euro, 3.000 oltre il budget; forse il consiglio sposterà soldi dalla festa, perché la riserva non può scendere sotto il minimo, e le quote restano uguali.',
      'projectManager.missing': 'A maggio, prima o poi, ci saranno lavori sul tetto.',
      'layperson.fit': 'Il tetto della sede verrà riparato a maggio. Fino ad allora il magazzino attrezzi resta chiuso; tutto il resto è aperto come sempre. Le quote associative non cambiano.',
      'layperson.tooMuch': 'La riparazione costa 8.000 euro, 3.000 oltre il budget; il consiglio valuta uno spostamento dal budget della festa, perché la riserva non può scendere sotto il minimo.',
      'layperson.condescending': 'Non preoccupatevi del tetto, alle cose da grandi ci pensa il consiglio.'
    }
  },
  shopOutage: {
    title: 'Guasto del negozio online',
    situation: 'Il negozio online della tua azienda è rimasto fuori servizio per tre ore ieri. Spiega cosa è successo.',
    facts: {
      duration: 'Il negozio è rimasto fuori servizio tre ore ieri sera.',
      revenue: 'Sono andati persi ordini per circa 40.000 euro.',
      cause: 'Un certificato di sicurezza scaduto ha bloccato i pagamenti.',
      fixed: 'Il certificato è stato rinnovato; il negozio funziona di nuovo normalmente.',
      renewal: 'Il rinnovo verrà automatizzato, con un avviso due settimane prima; al team serve un giorno.',
      voucher: 'I clienti il cui ordine non è andato a buon fine ricevono via e-mail un buono del 10%.',
      approval: 'Si chiede alla direzione di approvare 5.000 euro per un monitoraggio migliore.',
      competitor: 'Il negozio di un concorrente ha avuto un guasto simile il mese scorso.'
    },
    reasons: {
      'projectManager.cause': 'La capoprogetto ha bisogno della causa per valutare la soluzione.',
      'projectManager.renewal': 'È il lavoro che deve pianificare: un giorno del team.',
      'projectManager.voucher': 'I buoni li gestisce il servizio clienti, non il progetto.',
      'executive.duration': 'La direzione ha bisogno della portata dell’incidente.',
      'executive.revenue': 'Per la direzione l’impatto sul business viene prima.',
      'executive.cause': 'Il dettaglio tecnico non cambia la sua decisione; «un rinnovo dimenticato» basta.',
      'executive.renewal': 'Deve sentirsi dire che non succederà di nuovo.',
      'executive.approval': 'È la decisione che deve prendere.',
      'customer.revenue': 'Il vostro fatturato perso non riguarda il cliente.',
      'customer.cause': 'Le cause tecniche non aiutano i clienti.',
      'customer.fixed': 'I clienti vogliono sapere prima di tutto che possono tornare a comprare.',
      'customer.renewal': 'I cambiamenti dei processi interni non riguardano i clienti.',
      'customer.voucher': 'È ciò che ricevono, e devono controllare l’e-mail.',
      'customer.approval': 'Le decisioni di budget interne non sono per i clienti.',
      competitor: 'Puntare il dito sugli altri suona come una scusa e non cambia nulla.'
    },
    messages: {
      'projectManager.fit': 'Il guasto di tre ore di ieri è dovuto a un certificato di sicurezza scaduto che ha bloccato i pagamenti. Per evitare che si ripeta, automatizziamo il rinnovo con un avviso anticipato; in questo sprint al team serve un giorno.',
      'projectManager.tooMuch': 'Abbiamo perso circa 40.000 euro di ordini, i clienti ricevono un buono del 10% via e-mail e un concorrente ha avuto lo stesso problema il mese scorso.',
      'projectManager.missing': 'Ieri il negozio ha avuto un piccolo singhiozzo, ora è tutto a posto.',
      'executive.fit': 'Ieri il negozio è rimasto fuori servizio tre ore; abbiamo perso circa 40.000 euro di ordini. La causa è un rinnovo di routine dimenticato, ora automatizzato. Per individuare prima problemi simili, vi chiediamo di approvare 5.000 euro per il monitoraggio.',
      'executive.tooMuch': 'Il certificato TLS del gateway di pagamento è scaduto alle 18:02; ora lo rinnoviamo automaticamente tramite il protocollo ACME, con avvisi 14 giorni prima.',
      'executive.missing': 'Ieri c’è stato un piccolo problema tecnico. È risolto.',
      'customer.fit': 'Ci scusiamo: ieri sera il nostro negozio non è stato disponibile per alcune ore. Ora tutto funziona di nuovo. Se il suo ordine non è andato a buon fine, riceverà via e-mail un buono del 10%.',
      'customer.tooMuch': 'Un certificato di sicurezza scaduto ha fermato il nostro sistema di pagamento; abbiamo perso circa 40.000 euro e ora rinnoviamo i certificati automaticamente.',
      'customer.condescending': 'Si è rotta una cosa tecnica, niente che lei possa capire. Riprovi e basta.'
    }
  },
  signalFault: {
    title: 'Guasto a un segnale ferroviario',
    situation: 'Un guasto a un segnale sta bloccando una linea ferroviaria. Lavori per la compagnia ferroviaria. Spiega la situazione.',
    facts: {
      delay: 'I treni su questa linea hanno circa 40 minuti di ritardo.',
      bus: 'Autobus sostitutivi partono dal piazzale della stazione ogni 20 minuti.',
      tickets: 'I biglietti valgono anche sugli autobus e sui treni successivi.',
      signal: 'Il segnale 14 al bivio resta fisso sul rosso dopo un guasto a un cavo.',
      singleTrack: 'I treni percorrono la tratta su un solo binario a passo d’uomo, con ordine scritto.',
      repair: 'I tecnici prevedono che la riparazione richieda ancora circa quattro ore.',
      construction: 'Probabilmente sono stati i lavori di un’altra impresa a danneggiare il cavo.',
      staff: 'Due tecnici sono in malattia questa settimana.'
    },
    reasons: {
      'layperson.delay': 'I passeggeri vogliono sapere prima di tutto quanto ritardo avranno.',
      'layperson.bus': 'Dice loro che cosa possono fare subito.',
      'layperson.tickets': 'Risponde al timore di dover comprare un nuovo biglietto.',
      'layperson.signal': 'I numeri dei segnali non dicono nulla ai passeggeri.',
      'layperson.singleTrack': 'Le regole di circolazione non aiutano i passeggeri.',
      'layperson.construction': 'Fare ipotesi sulle colpe non aiuta i passeggeri e può essere sbagliato.',
      'layperson.staff': 'Le questioni di personale interne non riguardano i passeggeri.',
      'expert.tickets': 'Le regole sui biglietti non influiscono sulla circolazione dei treni.',
      'expert.signal': 'Il collega ha bisogno del punto e del guasto esatti.',
      'expert.singleTrack': 'È la regola di circolazione che deve applicare.',
      'expert.repair': 'Pianifica l’orario in base alla fine prevista.',
      'expert.staff': 'La situazione del personale non cambia come si circola sulla tratta.',
      'executive.delay': 'La direzione ha bisogno della portata del disservizio.',
      'executive.tickets': 'L’accettazione dei biglietti è una regola standard, non un tema da direzione.',
      'executive.repair': 'Deve sapere quanto durerà l’impatto.',
      'executive.construction': 'Un possibile danno causato da terzi conta per responsabilità e costi.'
    },
    messages: {
      'layperson.fit': 'I treni su questa linea hanno circa 40 minuti di ritardo. Autobus sostitutivi partono dal piazzale della stazione ogni 20 minuti, e il suo biglietto vale anche lì.',
      'layperson.tooMuch': 'Il segnale 14 al bivio resta fisso sul rosso dopo un guasto a un cavo; i treni circolano su un solo binario a passo d’uomo con ordine scritto.',
      'layperson.missing': 'Vi preghiamo di pazientare, c’è un guasto tecnico.',
      'expert.fit': 'Segnale 14 al bivio bloccato sul rosso dopo un guasto al cavo. Circolazione su binario unico a passo d’uomo con ordine scritto; riparazione prevista ancora per circa quattro ore.',
      'expert.condescending': 'Un segnale è come un semaforo per i treni. Uno si è rotto, quindi i treni devono andare piano.',
      'expert.missing': 'C’è un problema sulla linea e i treni sono in ritardo. Ci sono gli autobus.',
      'executive.fit': 'Un guasto a un cavo disturberà la linea ancora per circa quattro ore; i treni hanno circa 40 minuti di ritardo. Probabilmente il cavo è stato danneggiato dai lavori di un’altra impresa, quindi stiamo verificando la responsabilità.',
      'executive.tooMuch': 'Segnale 14 fisso sul rosso; binario unico a passo d’uomo con ordine scritto; autobus ogni 20 minuti dal piazzale; biglietti validi sugli autobus.',
      'executive.missing': 'Piccolo problema a un segnale, il team ci sta lavorando.'
    }
  },
  kettleLid: {
    title: 'Il coperchio del bollitore',
    situation: 'La tua azienda ha scoperto che il coperchio di un modello di bollitore può staccarsi. Spiegalo.',
    facts: {
      batches: 'Sono interessati solo i bollitori con i numeri di lotto da 2301 a 2315 (stampati sotto la base).',
      risk: 'Il coperchio può aprirsi mentre si versa, e l’acqua calda può schizzare.',
      stop: 'Non usate un bollitore interessato finché non viene sostituito.',
      hinge: 'Un perno di plastica della cerniera è stato prodotto più sottile di 0,2 mm.',
      free: 'La sostituzione è gratuita, spedizione inclusa.',
      cost: 'La sostituzione costerà all’azienda circa 120.000 euro.',
      supplier: 'I perni venivano da un nuovo fornitore i cui campioni avevano superato il controllo.',
      injuries: 'Finora non si conoscono feriti.'
    },
    reasons: {
      'customer.batches': 'I clienti devono poter verificare se il loro bollitore è interessato.',
      'customer.risk': 'Devono capire perché è importante.',
      'customer.stop': 'È l’azione che li tiene al sicuro.',
      'customer.hinge': 'I dettagli in millimetri non aiutano i clienti.',
      'customer.free': 'Sapere che non costa nulla toglie un motivo per aspettare.',
      'customer.cost': 'I costi dell’azienda non riguardano il cliente.',
      'customer.supplier': 'I dettagli sul fornitore sembrano uno scaricabarile.',
      'executive.risk': 'La direzione deve capire prima di tutto il rischio per la sicurezza.',
      'executive.hinge': 'La misura esatta è roba da ingegneri.',
      'executive.cost': 'L’impatto economico fa parte della sua decisione.',
      'executive.injuries': 'Se qualcuno si è fatto male cambia l’urgenza e la risposta.',
      'expert.stop': 'Le istruzioni per i clienti non aiutano ad analizzare il difetto.',
      'expert.hinge': 'L’ingegnera ha bisogno del difetto esatto.',
      'expert.free': 'Le condizioni di spedizione non contano per l’analisi tecnica.',
      'expert.cost': 'I costi del richiamo non servono a correggere il pezzo.',
      'expert.supplier': 'Mostra dove deve cambiare il controllo qualità.'
    },
    messages: {
      'customer.fit': 'Controlli il numero di lotto sotto il bollitore. Se è tra 2301 e 2315, smetta di usarlo: il coperchio può aprirsi mentre versa. Lo sostituiamo gratuitamente, spedizione inclusa.',
      'customer.tooMuch': 'Un perno della cerniera di un nuovo fornitore era più sottile di 0,2 mm; la sostituzione ci costerà circa 120.000 euro.',
      'customer.condescending': 'Alcuni bollitori potrebbero avere un problemino. Non serve che capisca i dettagli; se vuole, lo rispedisca.',
      'executive.fit': 'Problema di sicurezza: nei lotti da 2301 a 2315 il coperchio del bollitore può aprirsi mentre si versa acqua calda. Finora nessun ferito noto. La sostituzione costerà circa 120.000 euro.',
      'executive.tooMuch': 'Il diametro del perno della cerniera è 0,2 mm sotto la tolleranza; i campioni del nuovo fornitore erano a specifica, quindi sospettiamo l’usura dello stampo.',
      'executive.missing': 'Sostituiamo alcuni bollitori per precauzione.',
      'expert.fit': 'I perni della cerniera del nuovo fornitore sono più sottili di 0,2 mm, quindi il coperchio può aprirsi mentre si versa. Lotti interessati: da 2301 a 2315. I loro campioni avevano superato il controllo, quindi il nostro controllo in accettazione deve cambiare.',
      'expert.missing': 'Alcuni coperchi sono allentati; i clienti ricevono una sostituzione gratuita.',
      'expert.condescending': 'Una cerniera è il pezzo che fa girare il coperchio. Se è troppo sottile, non tiene bene.'
    }
  }
};
