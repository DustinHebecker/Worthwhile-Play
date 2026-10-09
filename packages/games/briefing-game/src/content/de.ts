import type { ContentText } from './types';

export const content: ContentText = {
  supplierDelay: {
    title: 'Lieferverzug vor einem Produktstart',
    situation: 'Deine Firma bringt am 14. Mai eine neue Schreibtischlampe auf den Markt. Der Lieferant der Lampenköpfe meldet eine Verzögerung. Bereite ein Briefing vor.',
    recipient: 'die Produktleiterin',
    cards: {
      c1: 'Die neue Schreibtischlampe kommt am 14. Mai auf den Markt; 350 Kundinnen und Kunden haben sie vorbestellt.',
      c2: 'Der Lieferant hat erst 200 der 500 bestellten Lampenköpfe verschickt.',
      c3: 'Sobald die Teile da sind, kann unsere Werkstatt 100 Lampen pro Tag montieren.',
      c4: 'Der Lieferant hat noch kein Datum für den Versand der restlichen Lampenköpfe genannt.',
      c5: 'Der Lieferant erwartet, den Rest nächste Woche zu verschicken, wahrscheinlich am Dienstag.',
      c6: 'Kommen die Teile nach dem 10. Mai, können die Lampen nicht rechtzeitig zum Start montiert werden.',
      c7: 'Die Werbung zum Start ist für den 14. Mai gebucht; eine Verschiebung würde 800 Euro Gebühr kosten.',
      c8: 'Das Marketing muss bis Freitag wissen, ob der Starttermin hält.',
      c9: 'Jonas aus dem Einkauf kann morgen früh beim Lieferanten anrufen und nach einem festen Termin fragen.',
      c10: 'Der Lieferant ist letztes Jahr in ein neues Bürogebäude umgezogen.',
      c11: 'Bisher wurden nur 200 der 500 bestellten Lampenköpfe verschickt.',
      c12: 'Ehrlich gesagt war dieser Lieferant schon immer etwas chaotisch.'
    },
    decisions: {
      right: 'Start am 14. Mai beibehalten oder um eine Woche verschieben?',
      notTheirs: 'Welche Spedition soll der Lieferant nehmen?',
      premature: 'Sollen wir diesen Lieferanten für alle künftigen Produkte ersetzen?'
    },
    actions: {
      concrete: 'Jonas ruft morgen um 9:00 beim Lieferanten an und teilt der Produktleiterin bis 12:00 den bestätigten Termin mit.',
      vague: 'Jemand sollte den Lieferanten im Auge behalten.',
      outOfScope: 'Mit dem Entwurf der Lampenkollektion fürs nächste Jahr beginnen.'
    }
  },
  basement: {
    title: 'Überfluteter Keller in der WG',
    situation: 'Nach starkem Regen steht Wasser im Keller des Hauses, in dem du in einer WG wohnst. Bereite ein Briefing vor.',
    recipient: 'der Vermieter',
    cards: {
      c1: 'Fünf Leute teilen sich das Haus; im Keller stehen die Heizung und die Kisten aller Bewohner.',
      c2: 'Heute Morgen standen etwa 10 cm Wasser im Keller.',
      c3: 'Wir haben heute Morgen vorsichtshalber den Strom im Keller abgeschaltet.',
      c4: 'Noch weiß niemand, ob der Heizkessel beschädigt ist.',
      c5: 'Das Wasser steigt wahrscheinlich nicht mehr; mittags sah es aus wie am Morgen.',
      c6: 'Für Donnerstag ist weiterer Regen angesagt, und das Wasser könnte wieder steigen.',
      c7: 'Der Heizkessel steht 15 cm über dem Boden; ein paar Zentimeter mehr Wasser würden ihn erreichen.',
      c8: 'Der Installateur kann nur diese Woche kommen, wenn der Vermieter die Anfahrtskosten bis morgen freigibt.',
      c9: 'Ein Mitbewohner, der von zu Hause arbeitet, könnte den Installateur am Mittwoch hereinlassen.',
      c10: 'Die Kellerwände wurden zuletzt 2015 gestrichen.',
      c11: 'Als wir heute Morgen nachgesehen haben, stand der Keller 10 cm unter Wasser.',
      c12: 'Dieses Haus war schon immer feucht, und nie tut jemand etwas dagegen.'
    },
    decisions: {
      right: 'Die Anfahrtskosten des Installateurs für diese Woche freigeben?',
      notTheirs: 'Welcher Mitbewohner soll seine Kisten zuerst wegräumen?',
      premature: 'Soll der ganze Keller abgedichtet und saniert werden?'
    },
    actions: {
      concrete: 'Der Mitbewohner im Homeoffice bestellt den Installateur für Mittwoch und schickt dem Vermieter heute den Kostenvoranschlag.',
      vague: 'Wir kümmern uns irgendwann darum.',
      outOfScope: 'Eine Hausparty planen, um alle aufzumuntern.'
    }
  },
  schoolTrip: {
    title: 'Klassenausflug und Unwetterwarnung',
    situation: 'Eine Klasse mit 24 Schülerinnen und Schülern soll am Freitag in den Hügeln wandern. Es gibt eine Unwetterwarnung. Bereite ein Briefing vor.',
    recipient: 'die Schulleiterin',
    cards: {
      c1: 'Die Klasse mit 24 Kindern im Alter von 11 Jahren ist am Freitag für eine Wanderung angemeldet, mit drei Begleitpersonen.',
      c2: 'Der Wetterdienst hat für Freitagnachmittag eine Sturmwarnung herausgegeben.',
      c3: 'Das Naturkundemuseum in der Stadt hat am Freitag noch Platz für einen Klassenbesuch.',
      c4: 'Die Vorhersage sagt noch nicht, ob der Sturm vor oder nach Mittag kommt.',
      c5: 'Der Parkranger meint, der Hauptweg bleibe höchstwahrscheinlich offen.',
      c6: 'Starker Wind kann auf dem Waldweg Äste herunterbrechen lassen.',
      c7: 'Die einzige Schutzhütte auf der Strecke liegt 40 Gehminuten vom Wegende entfernt – zu weit, um sie bei Sturm schnell zu erreichen.',
      c8: 'Das Busunternehmen muss bis Mittwochabend erfahren, ob der Ausflug stattfindet; bis dahin ist die Absage kostenlos.',
      c9: 'Die Klassenlehrerin kann am Mittwochmittag die aktuelle Vorhersage prüfen.',
      c10: 'Die Klasse hat schon im September für die Wanderung gestimmt.',
      c11: 'Laut Wetterdienst wird am Freitagnachmittag ein Sturm erwartet.',
      c12: 'Die Kinder werden furchtbar enttäuscht sein, wenn wir absagen.'
    },
    decisions: {
      right: 'Wanderung durchführen, ins Museum ausweichen oder den Ausflug absagen?',
      notTheirs: 'Was sollen die Kinder als Mittagessen einpacken?',
      premature: 'Soll die Schule ab jetzt alle Ausflüge ins Freie streichen?'
    },
    actions: {
      concrete: 'Die Klassenlehrerin prüft am Mittwoch um 12:00 die Vorhersage und schickt der Schulleiterin bis 14:00 eine Empfehlung.',
      vague: 'Mal sehen, wie das Wetter wird.',
      outOfScope: 'Mit der Planung des Schulfests im nächsten Jahr beginnen.'
    }
  },
  volunteers: {
    title: 'Aufräumtag mit zu wenig Helfern',
    situation: 'Dein Nachbarschaftsverein veranstaltet am Samstag einen Aufräumtag im Park. Es haben sich zu wenige Freiwillige gemeldet. Bereite ein Briefing vor.',
    recipient: 'die Vereinsvorsitzende',
    cards: {
      c1: 'Der jährliche Aufräumtag im Park ist am Samstag von 10:00 bis 13:00; die Stadt stellt Säcke und Handschuhe.',
      c2: 'Bisher haben sich 9 Freiwillige angemeldet; geplant waren 20.',
      c3: 'Die Stadt holt die vollen Säcke nur am Samstag um 13:00 ab.',
      c4: 'Die Jugendfußballmannschaft könnte Helfer schicken, aber der Trainer hat noch nicht geantwortet.',
      c5: 'Mehrere Nachbarn sagten, sie kämen wahrscheinlich vorbei, wenn das Wetter schön ist.',
      c6: 'Mit 9 Leuten schaffen wir nur etwa die Hälfte des Parks.',
      c7: 'Noch ist niemand bestimmt, der die Handschuhe im Gemeinschaftszentrum abholt, das samstags um 9:30 schließt.',
      c8: 'Wir können den Aufräumtag entweder auf den Spielplatzbereich verkleinern oder auf den Samstag danach verschieben.',
      c9: 'Zwei Freiwillige haben angeboten, morgen in der Nachbarschaft Plakate aufzuhängen.',
      c10: 'Der Aufräumtag im letzten Jahr endete mit einem Grillfest.',
      c11: 'Nur 9 der 20 eingeplanten Freiwilligen haben sich angemeldet.',
      c12: 'Den Leuten ist ihre Nachbarschaft einfach egal geworden.'
    },
    decisions: {
      right: 'Diesen Samstag einen kleineren Aufräumtag machen oder um eine Woche verschieben?',
      notTheirs: 'Soll die Stadt ihre Abholzeiten für die Säcke ändern?',
      premature: 'Soll der Verein künftig eine Reinigungsfirma beauftragen?'
    },
    actions: {
      concrete: 'Die beiden Freiwilligen hängen morgen Plakate auf, und der Schriftführer schreibt heute dem Fußballtrainer und meldet sich bis Donnerstag zurück.',
      vague: 'Wir sollten irgendwie mehr Leute gewinnen.',
      outOfScope: 'Mit der Planung des Sommerfests des Vereins beginnen.'
    }
  },
  release: {
    title: 'Software-Release mit einem fehlschlagenden Test',
    situation: 'Dein Team will am Dienstag eine neue Version einer Buchungs-App veröffentlichen. Ein automatischer Test schlägt fehl. Bereite ein Briefing vor.',
    recipient: 'die Produktmanagerin',
    cards: {
      c1: 'Die neue Version bringt Online-Zahlung und ist den Kunden für Dienstag angekündigt.',
      c2: 'Einer von 640 automatischen Tests schlägt fehl: die Erstattung einer stornierten Buchung.',
      c3: 'Der Fehler tritt nur bei Zahlungen in einer Fremdwährung auf.',
      c4: 'Wir wissen noch nicht, ob der Fehler in unserem Code oder im Testsystem des Zahlungsanbieters liegt.',
      c5: 'Der Entwickler rechnet mit etwa einem Tag für die Korrektur, hat sich den Code aber noch nicht angesehen.',
      c6: 'Wenn der Fehler echt ist, könnten manche Kunden einen falschen Betrag erstattet bekommen.',
      c7: 'Etwa 15 % der Buchungen werden in Fremdwährung bezahlt; der Fehler würde also viele Kunden treffen.',
      c8: 'Wir können am Dienstag mit abgeschalteten Fremdwährungszahlungen veröffentlichen oder das ganze Release verschieben.',
      c9: 'Der Entwickler kann heute Nachmittag die Testprotokolle des Zahlungsanbieters prüfen.',
      c10: 'Die neue Bezahlseite nutzt den neuen Blauton der Firma.',
      c11: 'Ein einziger Test ist rot: Erstattungen für stornierte Buchungen.',
      c12: 'Dieser Test war schon immer unzuverlässig; ich würde ihn einfach ignorieren.'
    },
    decisions: {
      right: 'Am Dienstag ohne Fremdwährungszahlungen veröffentlichen oder das Release verschieben?',
      notTheirs: 'Mit welcher Programmiertechnik soll der Entwickler den Fehler beheben?',
      premature: 'Sollen wir zu einem anderen Zahlungsanbieter wechseln?'
    },
    actions: {
      concrete: 'Der Entwickler prüft heute Nachmittag die Testprotokolle des Anbieters und sagt der Produktmanagerin bis 17:00, ob der Fehler bei uns liegt.',
      vague: 'Jemand schaut sich den Test mal an.',
      outOfScope: 'Mit den Release-Notes für die übernächste Version beginnen.'
    }
  },
  careAppointment: {
    title: 'Ein Pflegeberatungstermin für Oma',
    situation: 'Deine Großmutter hat am Montag einen Termin bei einer Pflegeberatung. Die Familie muss klären, wer sie begleitet. Bereite ein Briefing vor. (Es geht ums Organisieren, nicht um medizinische Fragen.)',
    recipient: 'dein Bruder, der die Entscheidung mit dir teilt',
    cards: {
      c1: 'Oma hat am Montag um 10:00 einen Termin bei der Pflegeberatung, um über Hilfe zu Hause zu sprechen.',
      c2: 'Sie hat darum gebeten, dass ein Familienmitglied mitkommt.',
      c3: 'Im Brief steht, sie solle ihre Medikamentenliste und ihre Versichertenkarte mitbringen.',
      c4: 'Noch ist unklar, ob Mama am Montag freinehmen kann.',
      c5: 'Die Beratungsstelle soll einen Aufzug haben, aber niemand hat es nachgeprüft.',
      c6: 'Wenn niemand mitkann, ist der nächste freie Termin erst in sechs Wochen.',
      c7: 'Oma wird schnell müde, und die Busfahrt zur Beratungsstelle dauert pro Strecke 50 Minuten.',
      c8: 'Die Pflegeberatung muss bis Freitag wissen, ob der Termin vor Ort oder per Videoanruf stattfindet.',
      c9: 'Du könntest heute Abend Mama anrufen und nach Montag fragen.',
      c10: 'Omas Nachbarin hat sich kürzlich einen neuen Hund angeschafft.',
      c11: 'Sie möchte, dass jemand aus der Familie sie begleitet.',
      c12: 'Meiner Meinung nach bringen solche Beratungen sowieso nie wirklich etwas.'
    },
    decisions: {
      right: 'Wer begleitet Oma am Montag, und vor Ort oder per Video?',
      notTheirs: 'Welche Art von Hilfe zu Hause soll Oma bekommen?',
      premature: 'Soll Oma in ein Pflegeheim ziehen?'
    },
    actions: {
      concrete: 'Du rufst heute Abend Mama an und sagst deinem Bruder bis Mittwochabend, wer mitgehen kann.',
      vague: 'Das kriegen wir schon irgendwie hin.',
      outOfScope: 'Mit der Planung von Omas Geburtstagsfeier beginnen.'
    }
  },
  cafeFreezer: {
    title: 'Defekte Tiefkühltruhe in einem kleinen Café',
    situation: 'Du arbeitest in einem kleinen Café. Heute Morgen war die Tiefkühltruhe nicht kalt genug. Die Inhaberin ist bis morgen weg. Bereite ein Briefing vor.',
    recipient: 'die Café-Inhaberin',
    cards: {
      c1: 'Das Café verkauft selbst gemachtes Eis; die Truhe fasst etwa den Vorrat einer Woche.',
      c2: 'Um 7:00 zeigte die Truhe −2 °C statt der üblichen −18 °C.',
      c3: 'Wir haben das Eis um 7:30 in die Tiefkühltruhe der Bäckerei nebenan gebracht.',
      c4: 'Wir wissen nicht, ob das Eis in der Nacht angetaut ist.',
      c5: 'Der Reparaturdienst kann wahrscheinlich am Donnerstag kommen.',
      c6: 'Angetautes Eis darf nicht verkauft werden; vielleicht müssen wir den Vorrat wegwerfen.',
      c7: 'Die Bäckerei braucht ihren Platz in der Truhe am Samstag zurück; unser Eis kann also nur bis dahin bleiben.',
      c8: 'Der Reparaturdienst bucht erst einen Termin, wenn die Inhaberin die Anfahrtspauschale von 90 Euro freigibt.',
      c9: 'Die Baristin kann heute Nachmittag das Temperaturprotokoll der Truhe auslesen.',
      c10: 'Die neuen Menütafeln des Cafés kommen nächste Woche.',
      c11: 'Heute Morgen zeigte die Truhe −2 °C statt −18 °C.',
      c12: 'Diese Truhe war vom ersten Tag an ein Fehlkauf.'
    },
    decisions: {
      right: 'Die Anfahrtspauschale von 90 Euro für die Reparatur freigeben?',
      notTheirs: 'Welche Kuchen soll die Bäckerei diese Woche verkaufen?',
      premature: 'Soll das Café ganz aufhören, Eis zu verkaufen?'
    },
    actions: {
      concrete: 'Die Baristin liest heute Nachmittag das Temperaturprotokoll aus und schreibt der Inhaberin das Ergebnis bis 16:00.',
      vague: 'Wir behalten das im Auge.',
      outOfScope: 'Die Website des Cafés neu gestalten.'
    }
  },
  tournament: {
    title: 'Neuer Ort für ein Schachturnier',
    situation: 'Dein Schachverein richtet am Sonntag ein Jugendturnier aus. Die gebuchte Schulaula steht nicht mehr zur Verfügung. Bereite ein Briefing vor.',
    recipient: 'der Vereinsvorstand',
    cards: {
      c1: 'Für das Jugendturnier am Sonntag sind 48 Spielerinnen und Spieler aus sechs Vereinen angemeldet.',
      c2: 'Die Schule hat unsere Buchung der Aula wegen eines undichten Dachs abgesagt.',
      c3: 'Die Stadtbücherei bietet ihren Veranstaltungsraum kostenlos an, aber er fasst nur 32 Spieler.',
      c4: 'Das Sportzentrum hätte vielleicht einen freien Raum, hat auf unsere E-Mail aber noch nicht geantwortet.',
      c5: 'Der Hausmeister glaubt, die Aula könnte rechtzeitig repariert werden, aber bestätigt hat das niemand.',
      c6: 'Erfahren die Familien zu spät von der Änderung, stehen manche Spieler vielleicht am alten Ort.',
      c7: 'Mehrere Familien reisen mehr als 100 km an und haben ihre Züge schon gebucht; eine Terminverschiebung würde sie am härtesten treffen.',
      c8: 'Die Einladungen mit dem endgültigen Ort müssen bis Mittwoch raus.',
      c9: 'Der Schriftführer des Vereins kann morgen früh beim Sportzentrum anrufen.',
      c10: 'Die Pokalvitrine des Vereins wurde letzten Monat geputzt.',
      c11: 'Die Schule hat unsere Buchung für die Aula storniert.',
      c12: 'Wir hätten uns nie auf diese Schule verlassen sollen.'
    },
    decisions: {
      right: 'An einen anderen Ort ausweichen, das Turnier auf 32 Spieler begrenzen oder es verschieben?',
      notTheirs: 'Wann soll die Schule ihr Dach reparieren?',
      premature: 'Soll der Verein ein eigenes Vereinsheim bauen?'
    },
    actions: {
      concrete: 'Der Schriftführer ruft morgen um 9:00 beim Sportzentrum an und berichtet dem Vorstand bis 12:00.',
      vague: 'Abwarten, was sich ergibt.',
      outOfScope: 'Neue Schachspiele für den Verein bestellen.'
    }
  }
};
