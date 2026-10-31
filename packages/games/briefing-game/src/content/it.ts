import type { ContentText } from './types';

export const content: ContentText = {
  supplierDelay: {
    title: 'Ritardo di un fornitore prima di un lancio',
    situation: 'La tua azienda lancia una nuova lampada da scrivania il 14 maggio. Il fornitore delle teste delle lampade segnala un ritardo. Prepara un briefing.',
    recipient: 'la responsabile di prodotto',
    cards: {
      c1: 'La nuova lampada da scrivania esce il 14 maggio; 350 clienti l’hanno già preordinata.',
      c2: 'Il fornitore ha spedito solo 200 delle 500 teste di lampada ordinate.',
      c3: 'Appena arrivano i pezzi, il nostro laboratorio può montare 100 lampade al giorno.',
      c4: 'Il fornitore non ha ancora indicato una data per spedire le teste rimanenti.',
      c5: 'Il fornitore prevede di spedire il resto la settimana prossima, probabilmente martedì.',
      c6: 'Se i pezzi arrivano dopo il 10 maggio, le lampade non si possono montare in tempo per il lancio.',
      c7: 'La pubblicità del lancio è prenotata per il 14 maggio; spostarla costerebbe una penale di 800 euro.',
      c8: 'Il marketing deve sapere entro venerdì se la data di lancio regge.',
      c9: 'Jonas dell’ufficio acquisti può chiamare il fornitore domattina e chiedere una data certa.',
      c10: 'Il fornitore si è trasferito l’anno scorso in un nuovo palazzo di uffici.',
      c11: 'Finora sono state spedite solo 200 delle 500 teste di lampada ordinate.',
      c12: 'Sinceramente, questo fornitore è sempre stato un po’ caotico.'
    },
    decisions: {
      right: 'Mantenere il lancio al 14 maggio o spostarlo di una settimana?',
      notTheirs: 'Quale corriere deve usare il fornitore?',
      premature: 'Dobbiamo sostituire questo fornitore per tutti i prodotti futuri?'
    },
    actions: {
      concrete: 'Jonas chiama il fornitore domani alle 9:00 e comunica la data confermata alla responsabile di prodotto entro le 12:00.',
      vague: 'Qualcuno dovrebbe tenere d’occhio il fornitore.',
      outOfScope: 'Iniziare a progettare la collezione di lampade dell’anno prossimo.'
    }
  },
  basement: {
    title: 'Cantina allagata in una casa condivisa',
    situation: 'Dopo una forte pioggia c’è acqua nella cantina della casa che condividi con altre persone. Prepara un briefing.',
    recipient: 'il padrone di casa',
    cards: {
      c1: 'Cinque persone condividono la casa; in cantina ci sono la caldaia e gli scatoloni di tutti.',
      c2: 'Stamattina in cantina c’erano circa 10 cm d’acqua.',
      c3: 'Stamattina abbiamo staccato la corrente della cantina per precauzione.',
      c4: 'Nessuno sa ancora se la caldaia è stata danneggiata.',
      c5: 'Probabilmente l’acqua ha smesso di salire; a mezzogiorno era uguale a stamattina.',
      c6: 'Per giovedì è prevista altra pioggia, e l’acqua potrebbe risalire.',
      c7: 'La caldaia è a 15 cm dal pavimento, quindi qualche centimetro d’acqua in più la raggiungerebbe.',
      c8: 'L’idraulico può venire questa settimana solo se il padrone di casa approva il costo dell’uscita entro domani.',
      c9: 'Una coinquilina che lavora da casa potrebbe far entrare l’idraulico mercoledì.',
      c10: 'Le pareti della cantina sono state imbiancate l’ultima volta nel 2015.',
      c11: 'Quando abbiamo controllato stamattina, la cantina era sotto 10 cm d’acqua.',
      c12: 'Questa casa è sempre stata umida e nessuno fa mai niente.'
    },
    decisions: {
      right: 'Approvare il costo dell’uscita dell’idraulico per questa settimana?',
      notTheirs: 'Quale coinquilino deve spostare per primo i suoi scatoloni?',
      premature: 'Bisogna impermeabilizzare e ristrutturare tutta la cantina?'
    },
    actions: {
      concrete: 'La coinquilina che lavora da casa prenota l’idraulico per mercoledì e oggi manda il preventivo al padrone di casa.',
      vague: 'Ce ne occuperemo prima o poi.',
      outOfScope: 'Organizzare una festa in casa per tirare su il morale a tutti.'
    }
  },
  schoolTrip: {
    title: 'Gita scolastica e allerta meteo',
    situation: 'Una classe di 24 alunni deve fare un’escursione in collina venerdì. È stata emessa un’allerta meteo. Prepara un briefing.',
    recipient: 'la dirigente scolastica',
    cards: {
      c1: 'La classe di 24 alunni di 11 anni è iscritta a un’escursione a piedi venerdì, con tre adulti accompagnatori.',
      c2: 'Il servizio meteo ha emesso un’allerta temporale per venerdì pomeriggio.',
      c3: 'Il museo della scienza in città ha ancora posto per la visita di una classe venerdì.',
      c4: 'Le previsioni non dicono ancora se il temporale arriverà prima o dopo mezzogiorno.',
      c5: 'Il guardaparco pensa che il sentiero principale resterà molto probabilmente aperto.',
      c6: 'Il vento forte può far cadere rami sul sentiero nel bosco.',
      c7: 'L’unico rifugio lungo il percorso è a 40 minuti a piedi dalla fine del sentiero, troppo lontano da raggiungere in fretta durante un temporale.',
      c8: 'Bisogna dire alla ditta di autobus entro mercoledì sera se la gita si fa; fino ad allora la disdetta è gratuita.',
      c9: 'La maestra può controllare le previsioni aggiornate mercoledì a mezzogiorno.',
      c10: 'La classe ha votato per l’escursione già a settembre.',
      c11: 'Secondo il servizio meteo, venerdì pomeriggio è atteso un temporale.',
      c12: 'I bambini saranno terribilmente delusi se annulliamo.'
    },
    decisions: {
      right: 'Fare l’escursione, ripiegare sul museo o annullare la gita?',
      notTheirs: 'Che cosa devono portare gli alunni per pranzo?',
      premature: 'La scuola dovrebbe eliminare d’ora in poi tutte le uscite all’aperto?'
    },
    actions: {
      concrete: 'La maestra controlla le previsioni mercoledì alle 12:00 e manda una raccomandazione alla dirigente entro le 14:00.',
      vague: 'Vediamo che tempo fa.',
      outOfScope: 'Iniziare a organizzare la festa della scuola dell’anno prossimo.'
    }
  },
  volunteers: {
    title: 'Giornata di pulizia con pochi volontari',
    situation: 'La tua associazione di quartiere organizza sabato la pulizia del parco. Si sono iscritti troppo pochi volontari. Prepara un briefing.',
    recipient: 'la presidente dell’associazione',
    cards: {
      c1: 'La pulizia annuale del parco è sabato dalle 10:00 alle 13:00; il comune fornisce sacchi e guanti.',
      c2: 'Finora si sono iscritti 9 volontari; ne avevamo previsti 20.',
      c3: 'Il comune ritira i sacchi pieni solo sabato alle 13:00.',
      c4: 'La squadra di calcio giovanile forse manda dei volontari, ma l’allenatore non ha ancora risposto.',
      c5: 'Alcuni vicini hanno detto che probabilmente passeranno se fa bel tempo.',
      c6: 'In 9 riusciamo a pulire solo circa metà del parco.',
      c7: 'Nessuno è stato ancora incaricato di prendere i guanti al centro civico, che sabato chiude alle 9:30.',
      c8: 'Possiamo ridurre la pulizia alla zona del parco giochi oppure spostarla al sabato successivo.',
      c9: 'Due volontari si sono offerti di attaccare manifesti nel quartiere domani.',
      c10: 'La pulizia dell’anno scorso è finita con una grigliata.',
      c11: 'Si sono iscritti solo 9 dei 20 volontari previsti.',
      c12: 'Alla gente ormai non importa più niente del proprio quartiere.'
    },
    decisions: {
      right: 'Fare una pulizia più piccola questo sabato o spostarla di una settimana?',
      notTheirs: 'Il comune deve cambiare gli orari di ritiro dei sacchi?',
      premature: 'L’associazione deve ingaggiare un’impresa di pulizie nei prossimi anni?'
    },
    actions: {
      concrete: 'I due volontari attaccano i manifesti domani, e il segretario scrive oggi all’allenatore di calcio e riferisce entro giovedì.',
      vague: 'Dovremmo trovare più gente in qualche modo.',
      outOfScope: 'Iniziare a organizzare la festa d’estate dell’associazione.'
    }
  },
  release: {
    title: 'Rilascio software con un test fallito',
    situation: 'Il tuo team vuole rilasciare martedì una nuova versione di un’app di prenotazioni. Un test automatico fallisce. Prepara un briefing.',
    recipient: 'il product manager',
    cards: {
      c1: 'La nuova versione aggiunge il pagamento online ed è stata annunciata ai clienti per martedì.',
      c2: 'Uno dei 640 test automatici fallisce: il rimborso di una prenotazione annullata.',
      c3: 'L’errore compare solo per i pagamenti in valuta estera.',
      c4: 'Non sappiamo ancora se il bug è nel nostro codice o nel sistema di test del fornitore dei pagamenti.',
      c5: 'Lo sviluppatore prevede che la correzione richieda circa un giorno, ma non ha ancora guardato il codice.',
      c6: 'Se il bug è reale, alcuni clienti potrebbero ricevere un rimborso sbagliato.',
      c7: 'Circa il 15% delle prenotazioni è pagato in valuta estera, quindi il bug colpirebbe molti clienti.',
      c8: 'Possiamo rilasciare martedì con i pagamenti in valuta estera disattivati oppure rinviare l’intero rilascio.',
      c9: 'Lo sviluppatore può controllare oggi pomeriggio i log di test del fornitore dei pagamenti.',
      c10: 'La nuova schermata di pagamento usa la nuova tonalità di blu dell’azienda.',
      c11: 'C’è un solo test rosso: i rimborsi delle prenotazioni annullate.',
      c12: 'Quel test è sempre stato ballerino; io lo ignorerei e basta.'
    },
    decisions: {
      right: 'Rilasciare martedì senza pagamenti in valuta estera o rinviare il rilascio?',
      notTheirs: 'Quale tecnica di programmazione deve usare lo sviluppatore per la correzione?',
      premature: 'Dobbiamo passare a un altro fornitore di pagamenti?'
    },
    actions: {
      concrete: 'Lo sviluppatore controlla oggi pomeriggio i log del fornitore e dice al product manager entro le 17:00 se il bug è nostro.',
      vague: 'Qualcuno darà un’occhiata al test.',
      outOfScope: 'Iniziare a scrivere le note di rilascio della versione dopo la prossima.'
    }
  },
  careAppointment: {
    title: 'Un colloquio di consulenza sull’assistenza per la nonna',
    situation: 'Tua nonna ha lunedì un appuntamento con un servizio di consulenza sull’assistenza. La famiglia deve decidere chi la accompagna. Prepara un briefing. (Si tratta di organizzazione, non di questioni mediche.)',
    recipient: 'tuo fratello, che condivide con te la decisione',
    cards: {
      c1: 'La nonna ha appuntamento con il servizio di consulenza lunedì alle 10:00 per parlare di aiuto a domicilio.',
      c2: 'Ha chiesto che un familiare la accompagni.',
      c3: 'La lettera dice di portare l’elenco dei farmaci e la tessera sanitaria.',
      c4: 'Non è ancora chiaro se la mamma può prendersi il lunedì libero.',
      c5: 'Si dice che il centro abbia un ascensore, ma nessuno ha controllato.',
      c6: 'Se nessuno può andare, il prossimo appuntamento libero è tra sei settimane.',
      c7: 'La nonna si stanca in fretta, e il viaggio in autobus fino al centro dura 50 minuti a tratta.',
      c8: 'Il servizio deve sapere entro venerdì se il colloquio sarà in presenza o in videochiamata.',
      c9: 'Potresti chiamare la mamma stasera e chiederle di lunedì.',
      c10: 'La vicina della nonna ha preso da poco un nuovo cane.',
      c11: 'Vorrebbe che qualcuno della famiglia andasse con lei.',
      c12: 'Secondo me questi servizi di consulenza non aiutano mai davvero.'
    },
    decisions: {
      right: 'Chi accompagna la nonna lunedì, e in presenza o in video?',
      notTheirs: 'Che tipo di aiuto a domicilio deve ricevere la nonna?',
      premature: 'La nonna dovrebbe trasferirsi in una casa di riposo?'
    },
    actions: {
      concrete: 'Chiami la mamma stasera e dici a tuo fratello entro mercoledì sera chi può andare.',
      vague: 'In qualche modo ci organizzeremo.',
      outOfScope: 'Iniziare a organizzare la festa di compleanno della nonna.'
    }
  },
  cafeFreezer: {
    title: 'Congelatore guasto in un piccolo bar',
    situation: 'Lavori in un piccolo bar. Stamattina il congelatore non era abbastanza freddo. La titolare è via fino a domani. Prepara un briefing.',
    recipient: 'la titolare del bar',
    cards: {
      c1: 'Il bar vende gelato artigianale; il congelatore contiene la scorta di circa una settimana.',
      c2: 'Alle 7:00 il congelatore segnava −2 °C invece dei soliti −18 °C.',
      c3: 'Alle 7:30 abbiamo portato il gelato nel congelatore del panificio accanto.',
      c4: 'Non sappiamo se il gelato si è sciolto durante la notte.',
      c5: 'Il servizio di riparazione probabilmente potrà venire giovedì.',
      c6: 'Il gelato che si è sciolto non si può vendere, quindi forse dovremo buttare la scorta.',
      c7: 'Il panificio rivuole il suo spazio sabato, quindi il nostro gelato può restare lì solo fino ad allora.',
      c8: 'Il servizio di riparazione fissa una visita solo dopo che la titolare approva l’uscita da 90 euro.',
      c9: 'Il barista può leggere oggi pomeriggio il registro della temperatura del congelatore.',
      c10: 'Le nuove lavagne del menù arrivano la settimana prossima.',
      c11: 'Stamattina il congelatore segnava −2 °C invece di −18 °C.',
      c12: 'Quel congelatore è stato un cattivo acquisto fin dal primo giorno.'
    },
    decisions: {
      right: 'Approvare l’uscita da 90 euro per la riparazione?',
      notTheirs: 'Quali torte deve vendere il panificio questa settimana?',
      premature: 'Il bar dovrebbe smettere del tutto di vendere gelato?'
    },
    actions: {
      concrete: 'Il barista legge il registro della temperatura oggi pomeriggio e manda il risultato alla titolare entro le 16:00.',
      vague: 'Lo teniamo d’occhio.',
      outOfScope: 'Rifare il sito web del bar.'
    }
  },
  tournament: {
    title: 'Nuova sede per un torneo di scacchi',
    situation: 'Il tuo circolo di scacchi organizza domenica un torneo giovanile. L’aula magna della scuola che avevate prenotato non è più disponibile. Prepara un briefing.',
    recipient: 'il direttivo del circolo',
    cards: {
      c1: 'Al torneo giovanile di domenica sono iscritti 48 giocatori di sei circoli.',
      c2: 'La scuola ha annullato la nostra prenotazione dell’aula per un’infiltrazione dal tetto.',
      c3: 'La biblioteca comunale offre gratis la sua sala eventi, ma ci stanno solo 32 giocatori.',
      c4: 'Il centro sportivo forse ha una sala libera, ma non ha ancora risposto alla nostra email.',
      c5: 'Il custode crede che l’aula possa essere riparata in tempo, ma nessuno l’ha confermato.',
      c6: 'Se le famiglie vengono a sapere del cambio troppo tardi, alcuni giocatori potrebbero presentarsi alla vecchia sede.',
      c7: 'Diverse famiglie fanno più di 100 km e hanno già prenotato il treno, quindi un cambio di data le colpirebbe più di tutti.',
      c8: 'Gli inviti con la sede definitiva devono partire entro mercoledì.',
      c9: 'Il segretario del circolo può chiamare il centro sportivo domattina.',
      c10: 'La vetrina dei trofei del circolo è stata pulita il mese scorso.',
      c11: 'La scuola ha revocato la nostra prenotazione dell’aula.',
      c12: 'Non avremmo mai dovuto fidarci di quella scuola.'
    },
    decisions: {
      right: 'Spostarsi in un’altra sede, limitare il torneo a 32 giocatori o rinviarlo?',
      notTheirs: 'Quando deve riparare il tetto la scuola?',
      premature: 'Il circolo dovrebbe costruirsi una sede propria?'
    },
    actions: {
      concrete: 'Il segretario chiama il centro sportivo domani alle 9:00 e riferisce al direttivo entro le 12:00.',
      vague: 'Aspettiamo e vediamo cosa salta fuori.',
      outOfScope: 'Ordinare nuove scacchiere per il circolo.'
    }
  }
};
