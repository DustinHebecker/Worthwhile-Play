import type { LocaleContent } from './items';

export const content: LocaleContent = {
  'finish-tomorrow': {
    context: 'Deine Teamleiterin schreibt dir im Team-Chat. Du arbeitest gerade an drei verschiedenen Berichten.',
    text: 'Bitte mach das morgen fertig.',
    ask: { what: 'Welchen der drei Berichte meinst du?' },
    given: { when: 'Der Tag steht da: morgen.', who: 'Die Nachricht richtet sich direkt an dich.' },
    replies: {
      clear: 'Klar. Welchen der drei Berichte meinst du: Budget, Vertrieb oder Personal?',
      vague: 'Okay, mache ich!',
      assume: 'Kein Problem, ich mache den Vertriebsbericht morgen fertig.'
    }
  },
  'concert-entrance': {
    context: 'Ein Freund schreibt dir wegen des Konzerts am Samstag, das um 20 Uhr beginnt. Die Halle hat vier Eingänge.',
    text: 'Lass uns vor dem Konzert am Eingang treffen.',
    ask: { when: 'Um wie viel Uhr treffen wir uns, wie lange vor 20 Uhr?', where: 'An welchem der vier Eingänge?' },
    given: { what: 'Was geplant ist, ist klar: ein Treffen vor dem Konzert.' },
    replies: {
      clear: 'Gute Idee! Welcher Eingang und wann? Passt 19:30 Uhr?',
      vague: 'Klingt gut, bis dann!',
      rude: 'Immer schreibst du so was. Sag doch einmal genau, was du meinst!'
    }
  },
  'party-photos': {
    context: 'Deine Tante schreibt dir nach einer Familienfeier, auf der du etwa 200 Fotos gemacht hast.',
    text: 'Kannst du mir die Fotos von Sonntag schicken?',
    ask: { what: 'Alle 200 oder nur einige, zum Beispiel die, auf denen du zu sehen bist?', format: 'Wie soll ich sie schicken: als Download-Link, per E-Mail oder als Abzüge?' },
    given: { who: 'Klar ist, wer sie schicken soll: du.' },
    replies: {
      clear: 'Gern! Alle 200 oder eine Auswahl? Und ist ein Download-Link für dich in Ordnung?',
      vague: 'Klar, schicke ich irgendwann.',
      assume: 'Ich habe dir alle 200 Fotos als Abzüge bestellt.'
    }
  },
  'water-plants': {
    context: 'Deine Nachbarin fährt morgen für zwei Wochen weg. Du hast ihren Ersatzschlüssel.',
    text: 'Könntest du die Pflanzen gießen, während ich weg bin?',
    ask: { when: 'Wie oft brauchen sie Wasser: jeden Tag oder zweimal pro Woche?', where: 'Welche Pflanzen: drinnen, auf dem Balkon oder beides?' },
    given: { what: 'Die Aufgabe ist klar: Pflanzen gießen.', who: 'Du wirst direkt gefragt.' },
    replies: {
      clear: 'Gern! Welche Pflanzen, und wie oft soll ich gießen?',
      vague: 'Klar, kein Problem.',
      assume: 'Klar, ich gieße jeden Abend die Balkonpflanzen.'
    }
  },
  'train-tickets': {
    context: 'Du und eine Freundin plant ein Wochenende am Meer. Sie schreibt:',
    text: 'Ich buche das Hotel. Kannst du den Zug buchen?',
    ask: { when: 'An welchem Tag und ungefähr um welche Uhrzeit fahren wir hin und zurück?' },
    given: { what: 'Die Aufgabe ist klar: Zugtickets für die Reise.', who: 'Du sollst sie buchen.' },
    replies: {
      clear: 'Ja! An welchem Tag und um welche Uhrzeit willst du los, und wann fahren wir zurück?',
      vague: 'Okay, mache ich.',
      assume: 'Erledigt: Freitag um 5:30 Uhr morgens, erste Klasse.'
    }
  },
  'bins-tonight': {
    context: 'Eine Nachricht im Gruppenchat einer WG mit fünf Leuten.',
    text: 'Heute Abend muss jemand den Müll rausbringen.',
    ask: { who: 'Wer genau soll es heute machen? Wer ist dran?' },
    given: { what: 'Die Aufgabe ist klar: den Müll rausbringen.', when: 'Die Zeit steht da: heute Abend.' },
    replies: {
      clear: 'Wer soll es heute machen? Gibt es einen Plan, auf dem wir nachsehen können?',
      vague: 'Ja, jemand sollte das tun.',
      rude: 'Ich jedenfalls nicht. Klärt das unter euch.'
    }
  },
  'school-form': {
    context: 'Eine Nachricht der Lehrerin deines Kindes in der Schul-App. Diese Woche hat dein Kind zwei Formulare mitgebracht: eins für einen Ausflug und eins für Klassenfotos.',
    text: 'Bitte geben Sie das unterschriebene Formular bis Donnerstag zurück.',
    ask: { what: 'Welches Formular meinen Sie: das für den Ausflug oder das für die Fotos?', format: 'Soll ich es auf Papier abgeben oder als Foto in der App?' },
    given: { when: 'Die Frist steht da: Donnerstag.' },
    replies: {
      clear: 'Danke! Welches Formular meinen Sie, Ausflug oder Fotos? Und auf Papier oder über die App?',
      vague: 'Okay, notiert.',
      assume: 'Erledigt: Ich habe beide Formulare unterschrieben und Fotos davon hochgeladen.'
    }
  },
  'holiday-keys': {
    context: 'Du hast eine Ferienwohnung gemietet. Die Vermieterin schreibt dir am Tag vor deiner Ankunft.',
    text: 'Ich lege Ihnen die Schlüssel hin.',
    ask: { where: 'Wo genau legen Sie die Schlüssel hin?' },
    given: { what: 'Worum es geht, ist klar: die Schlüssel.', who: 'Die Vermieterin legt sie selbst hin.' },
    replies: {
      clear: 'Danke! Wo genau finde ich sie: in einem Schlüsselkasten oder bei Nachbarn?',
      vague: 'Super, danke!',
      assume: 'Perfekt, dann hole ich sie unter der Fußmatte.'
    }
  },
  'project-slides': {
    context: 'Deine Vorgesetzte schreibt dir am Dienstagmorgen.',
    text: 'Kannst du ein paar Folien zum Projekt zusammenstellen?',
    ask: {
      when: 'Bis wann brauchst du die Folien?',
      audience: 'Wer sieht sie: das Team, die Geschäftsleitung oder der Kunde?',
      scope: 'Wie umfangreich: ein paar Folien oder eine ganze Präsentation?',
      purpose: 'Was soll sie erreichen: einen Zwischenstand zeigen oder eine Entscheidung herbeiführen?'
    },
    given: { what: 'Das Ergebnis ist klar: Folien zum Projekt.', who: 'Du wirst direkt gefragt.' },
    replies: {
      clear: 'Gern. Für wen, bis wann, ungefähr wie lang, und soll es zu einer Entscheidung führen oder nur informieren?',
      vague: 'Klar, ich mache ein paar Folien.',
      assume: 'Ich bereite 40 Folien für die Vorstandssitzung am Freitag vor.'
    }
  },
  'cafe-website': {
    context: 'Die Inhaberin eines kleinen Cafés schreibt dir, dem Webdesigner, der ihre Website gebaut hat.',
    text: 'Die Website sieht komisch aus, kannst du das reparieren?',
    ask: {
      what: 'Was genau sieht falsch aus: Text, Bilder oder das Layout?',
      where: 'Auf welcher Seite und auf welchem Gerät siehst du es?',
      priority: 'Ist es dringend? Können Kunden deshalb nicht bestellen?'
    },
    given: { who: 'Du wirst gefragt, als Designer der Seite.' },
    replies: {
      clear: 'Oh, ärgerlich! Was genau sieht falsch aus, auf welcher Seite und welchem Gerät? Und können Kunden deshalb nicht bestellen?',
      vague: 'Ich schaue es mir an.',
      assume: 'Ich gestalte diese Woche die ganze Website neu.'
    }
  },
  'walk-report': {
    context: 'Die Vorsitzende deines Wandervereins schreibt dir nach der Frühjahrswanderung.',
    text: 'Könntest du einen kurzen Bericht über die Wanderung schreiben?',
    ask: {
      when: 'Bis wann brauchst du den Bericht?',
      format: 'Nur Text oder mit Fotos? Für den Druck oder für die Website?',
      audience: 'Wer liest ihn: die Mitglieder oder die Lokalzeitung?'
    },
    given: { what: 'Das Ergebnis ist klar: ein Bericht über die Wanderung.', scope: '„Kurz“ gibt eine grobe Länge vor; eine Wortzahl könntest du trotzdem erfragen.' },
    replies: {
      clear: 'Gern! Für wen ist er, bis wann brauchst du ihn, und soll ich Fotos dazunehmen?',
      vague: 'Okay, ich schreibe etwas.',
      assume: 'Ich schicke morgen einen dreiseitigen Bericht mit 50 Fotos an die Zeitung.'
    }
  },
  'office-paper': {
    context: 'Die Büroleitung schreibt im Team-Kanal.',
    text: 'Das Druckerpapier wird knapp, bitte bestellt jemand neues.',
    ask: {
      when: 'Bis wann brauchen wir es?',
      who: 'Wer soll die Bestellung aufgeben?',
      scope: 'Wie viel sollen wir bestellen?'
    },
    given: { what: 'Klar ist, was gebraucht wird: Druckerpapier.' },
    replies: {
      clear: 'Ich kann bestellen. Wie viele Packungen, und bis wann brauchen wir sie?',
      vague: 'Ja, das sollte jemand machen.',
      assume: 'Ich habe 100 Kartons bestellt; sie kommen nächsten Monat.'
    }
  },
  'anniversary': {
    context: 'Dein Partner ruft dich an. In zwei Monaten feiern seine Eltern ihren 40. Hochzeitstag.',
    text: 'Wir sollten etwas für meine Eltern organisieren.',
    ask: {
      what: 'Woran denkst du: ein Essen, ein Fest oder ein Geschenk?',
      when: 'Wann: am Tag selbst oder an einem Wochenende in der Nähe?',
      who: 'Wer kümmert sich um was: du, ich, deine Geschwister?',
      scope: 'Wie groß: nur die Familie oder viele Gäste?'
    },
    given: { audience: 'Klar ist, für wen: die Eltern.', purpose: 'Der Anlass ist klar: der 40. Hochzeitstag.' },
    replies: {
      clear: 'Schöne Idee! Woran denkst du, wann, für wie viele Leute, und wer übernimmt was?',
      vague: 'Ja, sollten wir.',
      assume: 'Ich habe für nächsten Samstag ein Restaurant für 60 Personen reserviert.'
    }
  },
  'customer-reply': {
    context: 'Deine Vorgesetzte leitet dir die Beschwerde eines Kunden weiter: Seine Lieferung ist zwei Wochen zu spät.',
    text: 'Bitte melde dich beim Kunden.',
    ask: {
      what: 'Was darf ich anbieten: eine Entschuldigung, einen Rabatt, einen neuen Liefertermin?',
      when: 'Wie schnell: noch heute?',
      format: 'Soll ich anrufen oder schreiben?'
    },
    given: { audience: 'Klar ist, an wen: an den Kunden.', purpose: 'Der Grund ist klar: die verspätete Lieferung.' },
    replies: {
      clear: 'Mache ich. Anrufen oder mailen, bis wann, und was kann ich ihm anbieten?',
      vague: 'Okay.',
      assume: 'Ich habe dem Kunden die volle Erstattung und ein Jahr kostenlosen Versand versprochen.'
    }
  },
  'shop-translation': {
    context: 'Eine Freundin mit einem kleinen Onlineshop schreibt dir, weil du Spanisch sprichst.',
    text: 'Könntest du die Shop-Texte für mich übersetzen?',
    ask: {
      when: 'Bis wann brauchst du die Übersetzung?',
      audience: 'Sind deine Kundinnen und Kunden in Spanien oder in Lateinamerika?',
      scope: 'Welche Texte und wie viele: Produktbeschreibungen, die ganze Seite?'
    },
    given: { what: 'Die Aufgabe ist klar: eine Übersetzung ins Spanische.', who: 'Du wirst direkt gefragt.' },
    replies: {
      clear: 'Helfe ich gern! Welche Texte, bis wann, und sind deine Kunden in Spanien oder in Lateinamerika?',
      vague: 'Klar, schick mir das irgendwann.',
      assume: 'Klar, ich übersetze bis morgen die ganze Seite ins Spanische, Portugiesische und Französische.'
    }
  },
  'basement': {
    context: 'Der Hausmeister deines Wohnhauses schreibt an alle Mietparteien.',
    text: 'Bitte räumen Sie Ihre Sachen aus dem Keller.',
    ask: {
      when: 'Bis wann muss der Keller leer sein?',
      where: 'Wo können wir unsere Sachen so lange unterstellen?',
      purpose: 'Was ist der Grund, und ist es nur vorübergehend?'
    },
    given: { what: 'Gemeint ist klar: die eigenen Sachen im Keller.', who: 'Alle Mietparteien sind gefragt.' },
    replies: {
      clear: 'Danke für die Info. Bis wann, aus welchem Grund, und gibt es einen Ort, an dem wir unsere Sachen so lange lagern können?',
      vague: 'Okay.',
      rude: 'Ich räume gar nichts. Suchen Sie sich eine andere Lösung.'
    }
  },
  'board-report': {
    context: 'Deine Vorgesetzte schreibt am Mittwoch. Letzte Woche hat sie dir gesagt, dass der Quartalsbericht an den Vorstand geht und höchstens zwei Seiten lang sein darf.',
    text: 'Bitte schick mir den Bericht bis Freitag.',
    ask: {
      format: 'Möchtest du eine bearbeitbare Datei oder ein PDF?',
      criterion: 'Welche Zahlen oder Abschnitte muss er enthalten, um vollständig zu sein?'
    },
    given: {
      what: 'Klar ist, welcher Bericht: der Quartalsbericht.',
      when: 'Die Frist steht da: Freitag.',
      audience: 'Schon bekannt: Der Bericht geht an den Vorstand.',
      scope: 'Schon bekannt: höchstens zwei Seiten.'
    },
    replies: {
      clear: 'Mache ich. Welche Abschnitte müssen hinein, und möchtest du eine bearbeitbare Datei oder ein PDF?',
      vague: 'Klar, bis Freitag.',
      redundant: 'Für wen ist er, wie lang soll er sein, und welchen Bericht meinst du?'
    }
  },
  'school-pickup': {
    context: 'Deine Schwester schreibt dir. Ihre zwei Kinder haben jeden Tag um 15 Uhr Schulschluss; dienstags hat das ältere Kind bis 17 Uhr Fußballtraining.',
    text: 'Kannst du am Dienstag die Kinder abholen?',
    ask: {
      where: 'Wohin soll ich sie danach bringen: zu dir nach Hause oder zu mir?',
      scope: 'Beide Kinder oder nur das jüngere, weil das ältere Fußball hat?'
    },
    given: { when: 'Aus dem Zusammenhang bekannt: Die Schule endet um 15 Uhr.', who: 'Du wirst direkt gefragt.' },
    replies: {
      clear: 'Ja, kann ich. Beide oder nur das jüngere? Und soll ich sie zu dir nach Hause oder zu mir bringen?',
      vague: 'Ja, klar.',
      redundant: 'Wann ist die Schule aus, und an welchem Tag?'
    }
  },
  'checkout-bug': {
    context: 'Eine Produktmanagerin kommentiert im Bugtracker des Teams ein Ticket mit dem Titel „Kauf-Button reagiert auf Handys nicht seit Update 2.3“.',
    text: 'Dringend, bitte so schnell wie möglich beheben.',
    ask: {
      who: 'Wer im Team soll es übernehmen?',
      criterion: 'Auf welchen Handys und Browsern muss es funktionieren, bevor wir das Ticket schließen?'
    },
    given: {
      what: 'Der Ticket-Titel nennt das Problem.',
      where: 'Der Titel sagt, wo: auf Handys.',
      priority: '„Dringend“ macht die Priorität klar.'
    },
    replies: {
      clear: 'Bin dran. Wer übernimmt es? Und welche Handys und Browser müssen wir testen, bevor wir das Ticket schließen?',
      vague: 'Wir schauen es uns an.',
      redundant: 'Was genau ist kaputt, und ist es dringend?'
    }
  },
  'client-room': {
    context: 'Deine Kollegin Ana schreibt dir. Sie bekommt nächste Woche Besuch von zwei Kunden; es werden nur die drei sein.',
    text: 'Könntest du mir für nächste Woche einen Besprechungsraum buchen?',
    ask: {
      when: 'An welchem Tag, um welche Uhrzeit und wie lange?',
      format: 'Brauchst du einen Bildschirm oder Videotechnik?'
    },
    given: {
      what: 'Die Aufgabe ist klar: einen Besprechungsraum buchen.',
      who: 'Du sollst ihn buchen.',
      scope: 'Aus dem Zusammenhang bekannt: drei Personen.'
    },
    replies: {
      clear: 'Klar. Welcher Tag und welche Uhrzeit, wie lange, und brauchst du einen Bildschirm?',
      vague: 'Okay, ich buche etwas.',
      redundant: 'Wie viele Leute kommen, und wofür brauchst du den Raum?'
    }
  },
  'newsletter': {
    context: 'Der Redakteur des Newsletters deines Sportvereins schreibt dir. Der Newsletter geht an jedem ersten Montag im Monat an alle Mitglieder; jeder Beitrag hat etwa 200 Wörter.',
    text: 'Könntest du etwas über die neuen Trainingszeiten schreiben?',
    ask: {
      what: 'Soll der komplette neue Plan hinein oder nur das, was sich geändert hat?',
      when: 'Bis wann brauchst du meinen Text? Der Erscheinungstag ist nicht meine Abgabefrist.'
    },
    given: { audience: 'Aus dem Zusammenhang bekannt: alle Vereinsmitglieder.', scope: 'Aus dem Zusammenhang bekannt: etwa 200 Wörter.' },
    replies: {
      clear: 'Gern. Bis wann brauchst du ihn, und soll ich den ganzen Plan oder nur die Änderungen aufführen?',
      vague: 'Klar, ich schreibe etwas.',
      redundant: 'Wer liest den Newsletter, und wie lang soll der Text sein?'
    }
  },
  'airport': {
    context: 'Deine Cousine schickt dir ihre Flugdaten: Landung am Samstag um 14:20 Uhr, Terminal 2. Sie wohnt eine Woche bei dir.',
    text: 'Kannst du mich abholen?',
    ask: { scope: 'Kommst du allein, und wie viel Gepäck hast du? Passt es in ein kleines Auto?' },
    given: {
      when: 'Aus den Flugdaten bekannt: Samstag um 14:20 Uhr.',
      where: 'Aus den Flugdaten bekannt: Terminal 2.',
      purpose: 'Aus dem Zusammenhang bekannt: Sie wohnt bei dir, das Ziel ist also klar.'
    },
    replies: {
      clear: 'Natürlich! Kommst du allein, und wie viel Gepäck hast du?',
      vague: 'Ja, bis dann.',
      redundant: 'Wann landest du, und an welchem Terminal?'
    }
  },
  'contract-check': {
    context: 'Ein Kollege aus dem Einkauf mailt dir einen 30-seitigen Liefervertrag. Betreff: „Bitte Abschnitt 7 (Haftung) bis Donnerstag 12 Uhr prüfen“.',
    text: 'Schau bitte mal drüber.',
    ask: {
      format: 'Wie möchtest du meine Rückmeldung: Kommentare im Dokument oder eine kurze E-Mail?',
      criterion: 'Worauf soll ich achten: Risiken, unklare Formulierungen oder die Beträge?'
    },
    given: { what: 'Der Betreff nennt den Teil: Abschnitt 7.', when: 'Der Betreff nennt die Frist: Donnerstag 12 Uhr.' },
    replies: {
      clear: 'Mache ich bis Donnerstag 12 Uhr. Worauf soll ich in Abschnitt 7 achten, und möchtest du Kommentare in der Datei oder eine kurze Zusammenfassung?',
      vague: 'Schaue ich mir an.',
      redundant: 'Welchen Teil soll ich lesen, und bis wann?'
    }
  },
  'shared-dinner': {
    context: 'Lina schreibt in den Gruppenchat von vier Freundinnen und Freunden. Heute haben alle ein Abendessen bei ihr am Samstag um 19 Uhr vereinbart.',
    text: 'Kann jeder etwas mitbringen?',
    ask: {
      what: 'Was soll jede und jeder mitbringen: Vorspeise, Nachtisch oder Getränke?',
      criterion: 'Gibt es etwas, das jemand nicht essen kann oder nicht isst?'
    },
    given: { when: 'Schon vereinbart: Samstag um 19 Uhr.', where: 'Schon vereinbart: bei Lina.' },
    replies: {
      clear: 'Gern! Teilen wir auf in Vorspeise, Nachtisch und Getränke? Und gibt es etwas, das jemand nicht essen kann?',
      vague: 'Klar, ich bringe was mit.',
      redundant: 'Wo treffen wir uns, und um wie viel Uhr?'
    }
  }
};
