import type { ContentText } from './types';

export const content: ContentText = {
  weeks: { one: '{n} settimana', many: '{n} settimane', other: '{n} settimane' },
  species: {
    algae: { name: 'Alghe verdi', about: 'Minuscole piante che fluttuano nell’acqua. Crescono in fretta con nutrienti e luce; le pulci d’acqua e le chiocciole le mangiano. Tante alghe rendono l’acqua verde e fanno ombra alle piante sotto.' },
    bluegreen: { name: 'Alghe azzurre', about: 'In realtà sono batteri (cianobatteri). Crescono piano, hanno bisogno di acqua ricca e quasi nessuno le mangia, quindi fioriscono quando i nutrienti si accumulano.' },
    duckweed: { name: 'Lenticchie d’acqua', about: 'Piccole foglie galleggianti. Nell’acqua ricca coprono la superficie e fanno ombra a tutto ciò che sta sotto.' },
    pondweed: { name: 'Brasca', about: 'Piante sommerse radicate nel fango. Hanno bisogno di acqua limpida per avere luce, tolgono nutrienti alle alghe e danno alle pulci d’acqua un rifugio dai pesci.' },
    fleas: { name: 'Pulci d’acqua', about: 'Minuscoli crostacei (dafnie) che brucano le alghe. I pesciolini le mangiano, ma tra la brasca e nel fango molte restano fuori portata.' },
    snails: { name: 'Chiocciole d’acqua', about: 'Mangiano resti di piante morte e qualche alga. I pesciolini ne mangiano una parte.' },
    minnows: { name: 'Pesciolini', about: 'Cacciano pulci d’acqua e qualche chiocciola. I piccoli impiegano circa sei settimane a crescere. I lucci li mangiano.' },
    pike: { name: 'Lucci', about: 'Un grande cacciatore che mangia i pesciolini. I giovani lucci impiegano circa venti settimane a crescere.' },
    grass: { name: 'Graminacee', about: 'Alte e a crescita rapida su suolo ricco. Fanno ombra alle piante basse e consumano molta acqua.' },
    flowers: { name: 'Fiori selvatici', about: 'Piante basse che stanno bene su suolo povero. Hanno bisogno di luce, quindi l’erba alta le scaccia. Afidi e conigli le mangiano.' },
    clover: { name: 'Trifoglio', about: 'Una pianta bassa che prende da sé l’azoto dall’aria, meno su suolo ricco. Le sue foglie morte concimano il suolo per le vicine. È il cibo preferito dei conigli.' },
    aphids: { name: 'Afidi', about: 'Minuscoli insetti che succhiano la linfa, soprattutto dei fiori selvatici. Si moltiplicano molto in fretta. Le coccinelle li mangiano.' },
    ladybirds: { name: 'Coccinelle', about: 'Coleotteri che mangiano afidi. Le larve impiegano circa tre settimane a crescere, quindi reagiscono in ritardo a un aumento di afidi.' },
    rabbits: { name: 'Conigli', about: 'Brucano prima il trifoglio, poi i fiori selvatici e l’erba. I piccoli impiegano circa cinque settimane a crescere. Le volpi li cacciano; alcuni sono sempre al sicuro nelle tane.' },
    foxes: { name: 'Volpi', about: 'Cacciano conigli. Le giovani volpi impiegano circa sei mesi a crescere.' },
    worms: { name: 'Lombrichi', about: 'Mangiano foglie morte e le trasformano di nuovo in nutrienti che le piante possono usare.' }
  },
  challenges: {
    'fleas-arrive': {
      title: 'Arrivano le pulci d’acqua',
      situation: 'Uno stagno giovane ha solo alghe verdi. Le pulci d’acqua ci arrivano, portate da un uccello.',
      think: 'Chi mangia le alghe? Cosa succede alle pulci d’acqua quando le alghe diminuiscono?',
      explain: 'Le pulci d’acqua si moltiplicano sulle alghe finché mangiano alla stessa velocità con cui le alghe crescono. Da lì in poi sono le pulci, non i nutrienti, a decidere quante alghe ci sono: un ciclo di bilanciamento (B1). L’acqua diventa limpida e resta limpida.',
      real: 'Negli stagni veri, i pesci e le stagioni di solito impediscono che tutto sia così ordinato.'
    },
    'enrich-swings': {
      title: 'Più cibo per tutti',
      situation: 'Un forte dilavamento da un campo comincia a concimare uno stagno con alghe e pulci d’acqua.',
      think: 'Più nutrienti nutrono più alghe. Cosa fanno le pulci con più alghe, e cosa fanno poi le alghe?',
      explain: 'Più nutrienti fanno scattare in avanti le alghe; le pulci le seguono, le mangiano e poi restano senza cibo; le alghe si riprendono e tutto ricomincia. L’acqua più ricca ha fatto oscillare il sistema invece di farlo assestare. Gli ecologi lo chiamano paradosso dell’arricchimento (B1).',
      real: 'Negli stagni veri, molte più specie e le stagioni smorzano o cambiano queste oscillazioni.'
    },
    'fish-stocked': {
      title: 'Pesci nello stagno',
      situation: 'Qualcuno libera dei pesciolini in uno stagno che non ne aveva.',
      think: 'I pesci mangiano le pulci d’acqua. Chi mangia le alghe, e cosa succede alle alghe?',
      explain: 'I pesci mangiano le pulci d’acqua, quindi meno pulci brucano le alghe, e le alghe crescono. Un cambiamento in cima arriva fino alla base della catena alimentare: una cascata trofica. Si costruisce piano, perché i pesciolini impiegano settimane a crescere.',
      real: 'Negli stagni veri, i pesci smuovono anche il fango, rendendo l’acqua ancora più torbida.'
    },
    'pike-return': {
      title: 'Tornano i lucci',
      situation: 'Alcuni giovani lucci vengono liberati in uno stagno pieno di pesciolini.',
      think: 'Segui la catena: lucci, pesciolini, pulci d’acqua, alghe.',
      explain: 'I lucci mangiano i pesciolini; meno pesciolini lasciano più pulci d’acqua; più pulci mangiano più alghe. Ogni passo inverte la direzione, quindi le alghe calano. Ci vuole tempo, perché i giovani lucci impiegano circa venti settimane a crescere.',
      real: 'Nei laghi veri si tolgono pesciolini o si aggiungono lucci per schiarire l’acqua, con successo variabile e spesso breve.'
    },
    'algae-treatment': {
      title: 'Una soluzione rapida per l’acqua verde',
      situation: 'Lo stagno viene trattato: nove alghe su dieci muoiono e affondano, ma restano nell’acqua.',
      think: 'Dove vanno i nutrienti delle alghe morte? E cosa è successo alle pulci d’acqua mentre le alghe mancavano?',
      explain: 'Le alghe morte marciscono in pochi giorni e restituiscono i nutrienti all’acqua. Le pulci hanno patito la fame mentre le alghe mancavano, quindi per un po’ nessuno trattiene le alghe, e superano il livello di prima. Una soluzione che toglie il sintomo ma non i nutrienti non dura.',
      real: 'Negli stagni veri, le alghe che marciscono consumano anche ossigeno, e questo può danneggiare i pesci.'
    },
    'slow-runoff': {
      title: 'Un campo a monte',
      situation: 'Un nuovo campo a monte comincia a scaricare nello stagno limpido.',
      think: 'Cosa fanno più nutrienti alle alghe, e cosa fanno più alghe alla brasca sotto di loro?',
      explain: 'Per mesi sembra che non succeda nulla: dopo sei mesi la brasca sembra perfino in forma. Intanto i nutrienti si accumulano nell’acqua e nel fango, finché le lenticchie d’acqua e le alghe azzurre, che hanno bisogno di acqua ricca, partono e fanno ombra alla brasca. Allora prende il sopravvento un ciclo di rinforzo: meno brasca, più alghe, più ombra (R1). La svolta è rapida; la causa era lenta.',
      real: 'Nei laghi veri, queste svolte dall’acqua limpida a quella verde sono ben documentate, spesso dopo anni di cambiamenti lenti.'
    },
    'no-way-back': {
      title: 'Il dilavamento si ferma',
      situation: 'Due anni dopo il dilavamento viene fermato del tutto. La brasca tornerà?',
      think: 'È rimasta della brasca che possa ricrescere? Cosa tiene verde l’acqua adesso?',
      explain: 'Fermare il dilavamento toglie la causa, ma lo stagno resta verde: le alghe fanno ombra al fondo e non è rimasta brasca che possa ricrescere. Il ciclo di rinforzo (R1) ora tiene lo stagno nello stato verde. Per tornare indietro non basta annullare il cambiamento: serve per esempio ripiantare la brasca.',
      real: 'Nei laghi veri, il recupero dopo aver fermato i nutrienti richiede spesso molti anni, e a volte si ripiantano le piante.'
    },
    shade: {
      title: 'Un albero sopra lo stagno',
      situation: 'Un albero cresce sopra lo stagno e gli fa ombra.',
      think: 'La brasca ha bisogno di luce sul fondo. Cos’altro le toglie luce?',
      explain: 'Meno luce frena la brasca, che quindi trattiene meno le alghe. Alghe e pulci cominciano a oscillare, e ogni ondata di alghe fa ancora più ombra alla brasca (R1): cala a scalini.',
      real: 'Negli stagni veri, anche le foglie che cadono dall’albero porterebbero nutrienti.'
    },
    spray: {
      title: 'Irrorare contro gli afidi',
      situation: 'Il prato viene irrorato contro gli afidi: muoiono nove afidi su dieci e anche nove coccinelle su dieci.',
      think: 'Chi si riprende prima: gli afidi o le coccinelle che li mangiano?',
      explain: 'Il trattamento ha ucciso gli afidi e le coccinelle che li mangiano. Gli afidi si moltiplicano molto più in fretta delle coccinelle, quindi sono tornati per primi, senza nessuno a fermarli, e i fiori selvatici ne hanno pagato il prezzo. Gli ecologi la chiamano recrudescenza dei parassiti (B2 con ritardo).',
      real: 'Nei campi veri, i trattamenti danneggiano anche api e altri insetti, e i parassiti possono diventare resistenti.'
    },
    'no-foxes': {
      title: 'Le volpi se ne vanno',
      situation: 'Le volpi lasciano il prato.',
      think: 'Chi teneva a bada i conigli? Se i conigli aumentano, cosa mangiano per primo?',
      explain: 'Senza volpi sparisce il ciclo di bilanciamento che teneva a bada i conigli (B2). I conigli si moltiplicano e brucano il trifoglio, il loro cibo preferito, finché ne resta poco.',
      real: 'Nei paesaggi veri, i conigli si spostano anche altrove, e le malattie possono ridurne il numero.'
    },
    fertilise: {
      title: 'Un po’ di concime',
      situation: 'L’agricoltore sparge un po’ di concime ogni settimana.',
      think: 'Quale pianta trae più vantaggio da un suolo ricco, e cosa fa alle piante basse?',
      explain: 'Il concime nutre soprattutto le graminacee. L’erba più alta fa ombra al trifoglio, che è basso, e il trifoglio perde il suo vantaggio: su suolo ricco, produrre da sé l’azoto non aiuta più. Più cibo per il prato non significa più di ogni pianta.',
      real: 'Nei prati veri, l’azoto dei concimi e dell’aria è una delle cause principali della scomparsa dei fiori selvatici.'
    },
    drought: {
      title: 'Un’estate secca',
      situation: 'Dodici settimane secche, poi di nuovo pioggia normale.',
      think: 'Di cosa hanno bisogno le graminacee oltre ai nutrienti? Cosa succede quando torna la pioggia?',
      explain: 'Senza pioggia il suolo si secca e le graminacee rallentano e si riducono. Quando la pioggia torna, il suolo si riempie e le graminacee ricrescono, perfino oltre il livello di prima, perché i nutrienti si sono accumulati nel suolo mentre non potevano usarli.',
      real: 'Nei prati veri, una lunga siccità può anche uccidere piante e lasciare spazio ad altre.'
    },
    'clover-poor': {
      title: 'Trifoglio per un prato povero',
      situation: 'Si semina trifoglio in un prato povero di fiori selvatici.',
      think: 'Il trifoglio prende l’azoto dall’aria. Dove va quell’azoto quando le sue foglie muoiono?',
      explain: 'Il trifoglio porta nuovo azoto nel prato. Quando le sue foglie muoiono, i lombrichi le trasformano in nutrienti che usano i fiori selvatici. Le vicine ne approfittano, piano, attraverso il suolo: una catena con ritardo.',
      real: 'Nell’agricoltura vera si semina il trifoglio proprio per questo motivo.'
    },
    'worms-gone': {
      title: 'Dove sono i lombrichi?',
      situation: 'I lombrichi spariscono dal prato.',
      think: 'Chi trasforma di nuovo le foglie morte in cibo per le piante? Quale pianta non dipende da questo?',
      explain: 'Senza lombrichi le foglie morte si accumulano e i loro nutrienti restano chiusi dentro. Le graminacee patiscono la fame. Il trifoglio si fa da sé l’azoto, quindi ci guadagna: un effetto collaterale che pochi si aspettano.',
      real: 'Nei suoli veri, molti più animali, funghi e batteri decompongono le foglie morte.'
    },
    'foxes-return': {
      title: 'Tornano le volpi',
      situation: 'Le volpi tornano in un prato invaso dai conigli.',
      think: 'Quanto impiegano le giovani volpi a crescere? Cosa significano meno conigli per il trifoglio?',
      explain: 'All’inizio succede poco: le giovani volpi impiegano circa sei mesi a crescere. Poi le volpi riducono i conigli (B2), e il trifoglio, libero dal pascolo, torna piano piano. L’effetto arriva anni dopo la causa.',
      real: 'Nei paesaggi veri, le volpi cacciano anche altri animali, e i conigli trovano nuovi posti dove vivere.'
    },
    'ladybirds-gone': {
      title: 'Coccinelle raccolte',
      situation: 'La maggior parte delle coccinelle viene raccolta per un giardino altrove.',
      think: 'Chi mangia gli afidi? E di che cosa hanno bisogno gli afidi per continuare a moltiplicarsi?',
      explain: 'Senza coccinelle, gli afidi si moltiplicano e divorano i fiori selvatici. Con meno cibo, calano di nuovo (B1): qui a fermarli è il cibo, non i loro predatori. Le poche coccinelle rimaste restano poche per mesi.',
      real: 'Nei giardini veri aiutano anche altri cacciatori di afidi, come i sirfidi e gli uccelli.'
    }
  },
  goals: {
    'save-pondweed': {
      story: 'Un nuovo campo a monte comincia a scaricare nello stagno limpido. Tieni in vita la brasca per due anni mentre il dilavamento continua.',
      target: 'Brasca almeno {v} ogni settimana fino alla settimana {w}.',
      hint: 'Le alghe sono un sintomo. Cosa le nutre, e quanto presto deve cambiare?',
      explain: 'La brasca cala solo quando qualcosa le fa ombra: le lenticchie d’acqua e le alghe, che crescono con i nutrienti che il campo porta. Agisci sulla causa, e presto: quando la brasca sembra debole, il ciclo di rinforzo ha già preso il sopravvento.',
      plans: {
        buffer: 'Una fascia di piante lungo il campo trattiene gran parte del dilavamento prima che raggiunga lo stagno. Fatta in tempo, le alghe non passano mai in vantaggio.',
        ditch: 'Chiudere il fosso ferma del tutto il dilavamento, quindi le alghe non passano mai in vantaggio.'
      }
    },
    'clear-pond': {
      story: 'Lo stagno è diventato verde dopo due anni di dilavamento. Rendi di nuovo limpida l’acqua, con la brasca che cresce, per dodici settimane di fila.',
      target: 'Alghe (verdi e azzurre) al massimo {v} e brasca almeno {p}, per dodici settimane di fila, entro la settimana {w}.',
      hint: 'Le alghe sono un sintomo. Cosa le nutre? E cosa le tiene basse una volta che l’acqua è limpida?',
      explain: 'Lo stato verde si mantiene da sé: le alghe fanno ombra alle piante che le tratterrebbero. Per schiarire l’acqua bisogna togliere la causa (il dilavamento), estrarre o portar via i nutrienti accumulati e riportare la brasca, così che il ciclo di rinforzo giri verso l’acqua limpida.',
      plans: {
        restore: 'Fermare il dilavamento, dragare il fango ricco di nutrienti, piantare la brasca e togliere la maggior parte dei pesciolini (così più pulci brucano le alghe). Insieme fanno girare il ciclo verso l’acqua limpida.',
        flush: 'Fermare il dilavamento e lasciare che un ruscello porti via per un po’ nutrienti e alghe, poi piantare la brasca nell’acqua limpida.'
      }
    },
    'protect-flowers': {
      story: 'Un vicino ha appena irrorato il prato: la maggior parte degli afidi e delle coccinelle è morta. Conserva i fiori selvatici per un anno.',
      target: 'Fiori selvatici almeno {v} ogni settimana fino alla settimana {w}.',
      hint: 'Gli afidi tornano prima delle coccinelle. Quando troverebbero da mangiare delle coccinelle nuove?',
      explain: 'Gli afidi si riprendono prima dei loro cacciatori. Liberate troppo presto, le coccinelle muoiono di fame perché gli afidi non ci sono ancora; liberate troppo tardi, i fiori selvatici sono già stati mangiati. Decide il momento.',
      plans: {
        ladybirds: 'Liberate dopo circa dieci settimane, quando gli afidi sono tornati ma prima del loro picco, le coccinelle trovano subito cibo e fermano gli afidi in tempo.'
      }
    },
    'bring-back-clover': {
      story: 'Senza volpi, i conigli hanno quasi finito il trifoglio. Riporta il trifoglio per otto settimane di fila entro quattro anni.',
      target: 'Trifoglio almeno {v}, per otto settimane di fila, entro la settimana {w}.',
      hint: 'Togliere conigli aiuta solo per un po’. Cosa li teneva a bada prima?',
      explain: 'I conigli si moltiplicano in fretta, quindi toglierne alcuni fa solo guadagnare tempo. Un cambiamento duraturo richiede il ritorno del ciclo di bilanciamento: le volpi. Le giovani volpi impiegano sei mesi a crescere, quindi il trifoglio torna solo anni dopo.',
      plans: {
        foxes: 'Bastano le volpi da sole, ma serve pazienza: riducono i conigli lentamente.',
        foxesRabbits: 'Volpi più lo spostamento di metà dei conigli: le volpi hanno meno conigli da raggiungere.',
        foxesRabbitsClover: 'Volpi, spostare la maggior parte dei conigli e seminare trifoglio: la strada più rapida, perché il trifoglio parte avvantaggiato mentre le volpi crescono.'
      }
    }
  },
  loops: {
    graze: 'Le pulci d’acqua brucano le alghe; meno alghe, meno pulci.',
    fishFleas: 'I pesciolini mangiano le pulci d’acqua; meno pulci, meno pesci giovani.',
    pikeFish: 'I lucci mangiano i pesciolini; meno pesciolini, meno lucci giovani.',
    clearWater: 'Le alghe fanno ombra alla brasca; la brasca trattiene le alghe. Chi è in vantaggio si allontana ancora di più.',
    shelter: 'La brasca nasconde le pulci d’acqua ai pesci, e le pulci mangiano le alghe.',
    recycle: 'Le alghe morte marciscono e nutrono nuove alghe.',
    aphidsFlowers: 'Gli afidi vivono dei fiori selvatici; meno fiori, meno afidi.',
    ladybirdsAphids: 'Le coccinelle mangiano gli afidi; meno afidi, meno coccinelle giovani.',
    rabbitsClover: 'I conigli brucano il trifoglio; meno trifoglio, meno coniglietti.',
    foxesRabbits: 'Le volpi cacciano i conigli; meno conigli, meno volpi giovani.',
    thirst: 'Le graminacee consumano l’acqua del suolo; il suolo secco frena le graminacee.',
    wormsDead: 'I lombrichi mangiano le foglie morte; meno foglie morte, meno lombrichi.',
    flowerUptake: 'I fiori selvatici assorbono i nutrienti con cui crescono.'
  }
};
