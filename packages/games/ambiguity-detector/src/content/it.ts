import type { LocaleContent } from './items';

export const content: LocaleContent = {
  'finish-tomorrow': {
    context: 'La tua responsabile di team ti scrive nella chat del team. In questo momento stai lavorando a tre relazioni diverse.',
    text: 'Per favore, finisci questo domani.',
    ask: { what: 'Quale delle tre relazioni intendi?' },
    given: { when: 'Il giorno è indicato: domani.', who: 'Il messaggio è rivolto direttamente a te.' },
    replies: {
      clear: 'Certo. Quale delle tre relazioni intendi: budget, vendite o personale?',
      vague: 'Ok, fatto!',
      assume: 'Nessun problema, domani finisco la relazione sulle vendite.'
    }
  },
  'concert-entrance': {
    context: 'Un amico ti scrive per il concerto di sabato, che inizia alle 20. La sala ha quattro ingressi.',
    text: 'Ci vediamo all’ingresso prima del concerto.',
    ask: { when: 'A che ora ci vediamo, quanto prima delle 20?', where: 'A quale dei quattro ingressi?' },
    given: { what: 'Il programma è chiaro: vedersi prima del concerto.' },
    replies: {
      clear: 'Bella idea! Quale ingresso e a che ora? Le 19:30 vanno bene?',
      vague: 'Perfetto, ci vediamo lì!',
      rude: 'Dici sempre cose così. Sii preciso per una volta!'
    }
  },
  'party-photos': {
    context: 'Tua zia ti scrive dopo una festa di famiglia in cui hai scattato circa 200 foto.',
    text: 'Mi mandi le foto di domenica?',
    ask: { what: 'Tutte e 200 o solo alcune, per esempio quelle in cui ci sei tu?', format: 'Come te le mando: con un link per scaricarle, per e-mail o stampate?' },
    given: { who: 'È chiaro chi deve mandarle: tu.' },
    replies: {
      clear: 'Certo! Tutte e 200 o una selezione? E un link per scaricarle ti va bene?',
      vague: 'Certo, te le mando prima o poi.',
      assume: 'Ti ho ordinato le stampe di tutte e 200 le foto.'
    }
  },
  'water-plants': {
    context: 'La tua vicina parte domani per un viaggio di due settimane. Tu hai la sua chiave di riserva.',
    text: 'Potresti innaffiare le piante mentre sono via?',
    ask: { when: 'Ogni quanto vanno innaffiate: tutti i giorni o due volte a settimana?', where: 'Quali piante: quelle in casa, quelle sul balcone o tutte?' },
    given: { what: 'Il compito è chiaro: innaffiare le piante.', who: 'Lo chiedono direttamente a te.' },
    replies: {
      clear: 'Volentieri! Quali piante, e ogni quanto le devo innaffiare?',
      vague: 'Certo, nessun problema.',
      assume: 'Certo, innaffierò le piante del balcone ogni sera.'
    }
  },
  'train-tickets': {
    context: 'Tu e un’amica state organizzando un fine settimana al mare. Lei scrive:',
    text: 'Io prenoto l’albergo. Puoi prenotare tu il treno?',
    ask: { when: 'Che giorno e più o meno a che ora partiamo e torniamo?' },
    given: { what: 'Il compito è chiaro: i biglietti del treno per il viaggio.', who: 'Tocca a te prenotarli.' },
    replies: {
      clear: 'Sì! Che giorno e a che ora vuoi partire, e quando torniamo?',
      vague: 'Ok, ci penso io.',
      assume: 'Fatto: venerdì alle 5:30 del mattino, prima classe.'
    }
  },
  'bins-tonight': {
    context: 'Un messaggio nella chat di gruppo di cinque coinquilini.',
    text: 'Stasera qualcuno deve portare fuori la spazzatura.',
    ask: { who: 'Chi esattamente lo fa stasera? A chi tocca?' },
    given: { what: 'Il compito è chiaro: portare fuori la spazzatura.', when: 'Il momento è indicato: stasera.' },
    replies: {
      clear: 'Chi lo fa stasera? C’è un turno che possiamo controllare?',
      vague: 'Sì, qualcuno dovrebbe.',
      rude: 'Io di sicuro no. Vedetevela tra voi.'
    }
  },
  'school-form': {
    context: 'Un avviso dell’insegnante di tuo figlio nell’app della scuola. Questa settimana tuo figlio ha portato a casa due moduli: uno per una gita e uno per le foto di classe.',
    text: 'Si prega di restituire il modulo firmato entro giovedì.',
    ask: { what: 'Quale modulo intende: quello della gita o quello delle foto?', format: 'Devo restituirlo su carta o come foto nell’app?' },
    given: { when: 'La scadenza è indicata: giovedì.' },
    replies: {
      clear: 'Grazie! Quale modulo intende, gita o foto? E su carta o tramite l’app?',
      vague: 'Ok, preso nota.',
      assume: 'Fatto: ho firmato entrambi i moduli e caricato le foto.'
    }
  },
  'holiday-keys': {
    context: 'Hai affittato un appartamento per le vacanze. La proprietaria ti scrive il giorno prima del tuo arrivo.',
    text: 'Le lascio le chiavi.',
    ask: { where: 'Dove esattamente lascerà le chiavi?' },
    given: { what: 'È chiaro di cosa si tratta: le chiavi.', who: 'Le lascia la proprietaria stessa.' },
    replies: {
      clear: 'Grazie! Dove saranno esattamente: in una cassetta portachiavi o da un vicino?',
      vague: 'Ottimo, grazie!',
      assume: 'Perfetto, le prendo sotto lo zerbino.'
    }
  },
  'project-slides': {
    context: 'La tua responsabile ti scrive martedì mattina.',
    text: 'Puoi preparare qualche slide sul progetto?',
    ask: {
      when: 'Per quando ti servono le slide?',
      audience: 'Chi le vedrà: il team, la direzione o il cliente?',
      scope: 'Quanto lunga: poche slide o una presentazione completa?',
      purpose: 'Qual è lo scopo: un aggiornamento o arrivare a una decisione?'
    },
    given: { what: 'Il risultato è chiaro: slide sul progetto.', who: 'Lo chiedono direttamente a te.' },
    replies: {
      clear: 'Volentieri. Per chi, per quando, più o meno quanto lunga, e deve portare a una decisione o solo informare?',
      vague: 'Certo, preparo qualche slide.',
      assume: 'Preparo 40 slide per il consiglio di amministrazione di venerdì.'
    }
  },
  'cafe-website': {
    context: 'La titolare di un piccolo bar ti scrive: sei il web designer che ha realizzato il suo sito.',
    text: 'Il sito ha un aspetto strano, puoi sistemarlo?',
    ask: {
      what: 'Che cosa esattamente non va: il testo, le immagini o l’impaginazione?',
      where: 'Su quale pagina e su quale dispositivo lo vedi?',
      priority: 'È urgente? Impedisce ai clienti di ordinare?'
    },
    given: { who: 'Lo chiedono a te, come designer del sito.' },
    replies: {
      clear: 'Mi dispiace! Che cosa esattamente non va, su quale pagina e dispositivo? E impedisce ai clienti di ordinare?',
      vague: 'Ci do un’occhiata.',
      assume: 'Questa settimana rifaccio da capo tutto il sito.'
    }
  },
  'walk-report': {
    context: 'La presidente del tuo gruppo escursionistico ti scrive dopo l’escursione di primavera.',
    text: 'Potresti scrivere un breve resoconto dell’escursione?',
    ask: {
      when: 'Per quando ti serve il resoconto?',
      format: 'Solo testo o con foto? Per la stampa o per il sito?',
      audience: 'Chi lo leggerà: i soci o il giornale locale?'
    },
    given: { what: 'Il risultato è chiaro: un resoconto dell’escursione.', scope: '“Breve” dà una lunghezza indicativa; puoi comunque chiedere il numero di parole.' },
    replies: {
      clear: 'Volentieri! Per chi è, per quando ti serve, e aggiungo delle foto?',
      vague: 'Ok, scriverò qualcosa.',
      assume: 'Domani mando al giornale un resoconto di tre pagine con 50 foto.'
    }
  },
  'office-paper': {
    context: 'La responsabile dell’ufficio scrive nel canale del team.',
    text: 'Sta finendo la carta per la stampante, qualcuno ne ordini dell’altra, per favore.',
    ask: {
      when: 'Per quando ci serve?',
      who: 'Chi deve fare l’ordine?',
      scope: 'Quanta ne ordiniamo?'
    },
    given: { what: 'È chiaro cosa serve: carta per la stampante.' },
    replies: {
      clear: 'Posso ordinarla io. Quante risme, e per quando ci servono?',
      vague: 'Sì, qualcuno dovrebbe.',
      assume: 'Ho ordinato 100 scatoloni; arrivano il mese prossimo.'
    }
  },
  'anniversary': {
    context: 'Il tuo compagno ti telefona. Tra due mesi i suoi genitori festeggiano 40 anni di matrimonio.',
    text: 'Dovremmo organizzare qualcosa per i miei genitori.',
    ask: {
      what: 'A cosa pensi: una cena, una festa o un regalo?',
      when: 'Quando: il giorno stesso o in un fine settimana vicino?',
      who: 'Chi si occupa di cosa: tu, io, i tuoi fratelli?',
      scope: 'Di che dimensioni: solo la famiglia o molti invitati?'
    },
    given: { audience: 'È chiaro per chi: i genitori.', purpose: 'L’occasione è chiara: i 40 anni di matrimonio.' },
    replies: {
      clear: 'Bella idea! A cosa pensi, quando, per quante persone, e chi fa cosa?',
      vague: 'Sì, dovremmo.',
      assume: 'Ho prenotato un ristorante per 60 persone sabato prossimo.'
    }
  },
  'customer-reply': {
    context: 'La tua responsabile ti inoltra il reclamo di un cliente la cui consegna è in ritardo di due settimane.',
    text: 'Per favore, ricontatta il cliente.',
    ask: {
      what: 'Che cosa posso offrire: delle scuse, uno sconto, una nuova data di consegna?',
      when: 'Con che urgenza: oggi stesso?',
      format: 'Lo chiamo o gli scrivo?'
    },
    given: { audience: 'È chiaro chi contattare: il cliente.', purpose: 'Il motivo è chiaro: la consegna in ritardo.' },
    replies: {
      clear: 'Va bene. Lo chiamo o gli scrivo, entro quando, e che cosa posso offrirgli?',
      vague: 'Ok.',
      assume: 'Ho promesso al cliente il rimborso completo e la spedizione gratuita per un anno.'
    }
  },
  'shop-translation': {
    context: 'Un’amica che ha un piccolo negozio online ti scrive perché parli spagnolo.',
    text: 'Potresti tradurmi i testi del negozio?',
    ask: {
      when: 'Per quando ti serve la traduzione?',
      audience: 'I tuoi clienti sono in Spagna o in America Latina?',
      scope: 'Quali testi e quanti: le descrizioni dei prodotti, tutto il sito?'
    },
    given: { what: 'Il compito è chiaro: una traduzione in spagnolo.', who: 'Lo chiedono direttamente a te.' },
    replies: {
      clear: 'Ti aiuto volentieri! Quali testi, per quando, e i tuoi clienti sono in Spagna o in America Latina?',
      vague: 'Certo, mandameli quando vuoi.',
      assume: 'Certo, entro domani traduco tutto il sito in spagnolo, portoghese e francese.'
    }
  },
  'basement': {
    context: 'Il custode del tuo condominio scrive a tutti i residenti.',
    text: 'Si prega di liberare la cantina dalle proprie cose.',
    ask: {
      when: 'Entro quando deve essere vuota la cantina?',
      where: 'Dove possiamo mettere le nostre cose nel frattempo?',
      purpose: 'Qual è il motivo, ed è solo per un periodo?'
    },
    given: { what: 'È chiaro cosa si intende: le proprie cose in cantina.', who: 'Lo chiedono a tutti i residenti.' },
    replies: {
      clear: 'Grazie dell’avviso. Entro quando, per quale motivo, e c’è un posto dove mettere le nostre cose nel frattempo?',
      vague: 'Ok.',
      rude: 'Io non sposto niente. Trovate un’altra soluzione.'
    }
  },
  'board-report': {
    context: 'La tua responsabile ti scrive mercoledì. La settimana scorsa ti ha detto che la relazione trimestrale va al consiglio di amministrazione e deve essere di due pagine al massimo.',
    text: 'Per favore, mandami la relazione entro venerdì.',
    ask: {
      format: 'Vuoi un file modificabile o un PDF?',
      criterion: 'Quali dati o sezioni deve contenere per essere completa?'
    },
    given: {
      what: 'È chiaro quale relazione: quella trimestrale.',
      when: 'La scadenza è indicata: venerdì.',
      audience: 'Detto prima: la relazione va al consiglio di amministrazione.',
      scope: 'Detto prima: due pagine al massimo.'
    },
    replies: {
      clear: 'Va bene. Quali sezioni deve contenere, e vuoi un file modificabile o un PDF?',
      vague: 'Certo, entro venerdì.',
      redundant: 'Per chi è, quanto deve essere lunga, e di quale relazione parli?'
    }
  },
  'school-pickup': {
    context: 'Tua sorella ti scrive. I suoi due figli escono da scuola alle 15 ogni giorno; il martedì il più grande ha allenamento di calcio fino alle 17.',
    text: 'Puoi andare a prendere i bambini martedì?',
    ask: {
      where: 'Dove li porto dopo: a casa tua o a casa mia?',
      scope: 'Tutti e due, o solo il più piccolo, visto che il grande ha calcio?'
    },
    given: { when: 'Si sa dal contesto: la scuola finisce alle 15.', who: 'Lo chiedono direttamente a te.' },
    replies: {
      clear: 'Sì, posso. Tutti e due o solo il piccolo? E li porto a casa tua o da me?',
      vague: 'Sì, certo.',
      redundant: 'A che ora escono da scuola, e che giorno?'
    }
  },
  'checkout-bug': {
    context: 'Una product manager commenta nel bug tracker del team un ticket intitolato «Il pulsante di pagamento non fa nulla sui telefoni dall’aggiornamento 2.3».',
    text: 'Urgente, per favore sistemate il prima possibile.',
    ask: {
      who: 'Chi del team se ne occupa?',
      criterion: 'Su quali telefoni e browser deve funzionare prima di chiudere il ticket?'
    },
    given: {
      what: 'Il titolo del ticket indica il problema.',
      where: 'Il titolo dice dove: sui telefoni.',
      priority: '«Urgente» rende chiara la priorità.'
    },
    replies: {
      clear: 'Ci lavoriamo. Chi se ne occupa? E quali telefoni e browser dobbiamo provare prima di chiudere il ticket?',
      vague: 'Ci diamo un’occhiata.',
      redundant: 'Che cosa esattamente non funziona, ed è urgente?'
    }
  },
  'client-room': {
    context: 'La tua collega Ana ti scrive. La settimana prossima riceve due clienti; saranno solo loro tre.',
    text: 'Potresti prenotarmi una sala riunioni per la settimana prossima?',
    ask: {
      when: 'Che giorno, a che ora e per quanto tempo?',
      format: 'Ti serve uno schermo o un’attrezzatura per videochiamate?'
    },
    given: {
      what: 'Il compito è chiaro: prenotare una sala riunioni.',
      who: 'Tocca a te prenotarla.',
      scope: 'Si sa dal contesto: tre persone.'
    },
    replies: {
      clear: 'Certo. Che giorno e a che ora, per quanto tempo, e ti serve uno schermo?',
      vague: 'Ok, prenoto qualcosa.',
      redundant: 'Quante persone vengono, e a cosa ti serve la sala?'
    }
  },
  'newsletter': {
    context: 'Il redattore della newsletter della tua società sportiva ti scrive. La newsletter arriva a tutti i soci il primo lunedì di ogni mese; ogni articolo è di circa 200 parole.',
    text: 'Potresti scrivere qualcosa sui nuovi orari degli allenamenti?',
    ask: {
      what: 'Metto tutto il nuovo calendario o solo ciò che è cambiato?',
      when: 'Per quando ti serve il mio testo? La data di uscita della newsletter non è la mia scadenza.'
    },
    given: { audience: 'Si sa dal contesto: tutti i soci.', scope: 'Si sa dal contesto: circa 200 parole.' },
    replies: {
      clear: 'Volentieri. Per quando ti serve, e metto tutto il calendario o solo le modifiche?',
      vague: 'Certo, scriverò qualcosa.',
      redundant: 'Chi legge la newsletter, e quanto deve essere lungo il testo?'
    }
  },
  'airport': {
    context: 'Tua cugina ti manda i dati del volo: atterraggio sabato alle 14:20, terminal 2. Starà da te per una settimana.',
    text: 'Puoi venire a prendermi?',
    ask: { scope: 'Vieni da sola, e quanti bagagli hai? Entrano in una macchina piccola?' },
    given: {
      when: 'Si sa dai dati del volo: sabato alle 14:20.',
      where: 'Si sa dai dati del volo: terminal 2.',
      purpose: 'Si sa dal contesto: starà da te, quindi la destinazione è chiara.'
    },
    replies: {
      clear: 'Certo! Vieni da sola, e quanti bagagli hai?',
      vague: 'Sì, a sabato.',
      redundant: 'Quando atterri, e a quale terminal?'
    }
  },
  'contract-check': {
    context: 'Un collega degli acquisti ti manda per e-mail un contratto di fornitura di 30 pagine. Oggetto: «Per favore, controlla l’articolo 7 (responsabilità) entro giovedì a mezzogiorno».',
    text: 'Dacci un’occhiata, per favore.',
    ask: {
      format: 'Come vuoi il mio riscontro: commenti nel documento o una breve e-mail?',
      criterion: 'A cosa devo fare attenzione: rischi, formulazioni poco chiare o gli importi?'
    },
    given: { what: 'L’oggetto indica la parte: l’articolo 7.', when: 'L’oggetto indica la scadenza: giovedì a mezzogiorno.' },
    replies: {
      clear: 'Lo faccio entro giovedì a mezzogiorno. Su cosa mi concentro nell’articolo 7, e preferisci commenti nel file o un breve riassunto?',
      vague: 'Ci do un’occhiata.',
      redundant: 'Quale parte devo leggere, e per quando?'
    }
  },
  'shared-dinner': {
    context: 'Lina scrive nella chat di gruppo di quattro amici. Oggi tutti si sono accordati per cenare da lei sabato alle 19.',
    text: 'Ognuno può portare qualcosa?',
    ask: {
      what: 'Che cosa porta ciascuno di noi: un antipasto, il dolce o le bevande?',
      criterion: 'C’è qualcosa che qualcuno non può o non vuole mangiare?'
    },
    given: { when: 'Già deciso: sabato alle 19.', where: 'Già deciso: a casa di Lina.' },
    replies: {
      clear: 'Volentieri! Ci dividiamo antipasto, dolce e bevande? E c’è qualcosa che qualcuno non può mangiare?',
      vague: 'Certo, porto qualcosa.',
      redundant: 'Dove ci vediamo, e a che ora?'
    }
  }
};
