import type { ContentText } from './types';

export const content: ContentText = {
  launch: {
    title: 'Neuigkeiten zum App-Start',
    context: 'Eine E-Mail der Projektleiterin an das ganze Team.',
    sentences: {
      s1: 'Hallo zusammen, ich hoffe, ihr hattet ein schönes Wochenende in der Sonne.',
      s2: 'Der Start unserer Buchungs-App verschiebt sich vom 2. April auf den 14. Mai.',
      s3: 'Der Grund: Der Zahlungsanbieter hat seine Sicherheitszertifizierung noch nicht abgeschlossen, und ohne sie können wir keine Zahlungen annehmen.',
      s4: 'Der Anbieter sagt, er habe einen Rückstau an Anträgen.',
      s5: 'Das Designteam nutzt die zusätzlichen Wochen, um die Einstiegsbildschirme zu verfeinern.',
      s6: 'Unsere 300 Betatester können die Testversion bis zum Start weiter nutzen.',
      s7: 'Ein Konkurrent hat letztes Jahr eine ähnliche App gestartet und brauchte drei Anläufe.',
      s8: 'Das Marketing muss die Kampagne verschieben; bitte entscheidet bis Freitag über den neuen Kampagnenstart.',
      s9: 'Das Budget bleibt gleich, weil die Agentur für das Verschieben der Kampagne nichts berechnet.',
      s10: 'Die Zertifizierung selbst dauert etwa drei Wochen, sobald sie beginnt.',
      s11: 'Nochmals danke für eure großartige Arbeit!',
      s12: 'Am Mittwoch schicke ich einen aktualisierten Projektplan.'
    },
    bullets: {
      gold1: 'Der Start verschiebt sich vom 2. April auf den 14. Mai.',
      gold2: 'Grund: Die Sicherheitszertifizierung des Zahlungsanbieters ist nicht abgeschlossen.',
      gold3: 'Das Marketing muss bis Freitag über den neuen Kampagnenstart entscheiden.',
      minor: 'Das Designteam verfeinert die Einstiegsbildschirme.',
      distort: 'Die App ist durch die Sicherheitsprüfung gefallen.',
      dup: 'Der Start verzögert sich.',
      subtle: 'Der Start verschiebt sich vom 2. April auf den 4. Mai.'
    },
    bulletNotes: {
      distort: 'Im Text steht, dass die Zertifizierung noch nicht abgeschlossen ist – nicht, dass die App eine Prüfung nicht bestanden hat.',
      dup: 'Wiederholt den Punkt zum neuen Termin, aber ohne Datum – und verschenkt damit einen Platz.',
      subtle: 'Fast richtig, aber der neue Termin ist der 14. Mai, nicht der 4. Mai.'
    },
    summaries: {
      faithful: 'Der Start verschiebt sich auf den 14. Mai, weil die Zertifizierung des Zahlungsanbieters nicht abgeschlossen ist, und das Marketing muss bis Freitag über den neuen Kampagnenstart entscheiden.',
      vague: 'Beim Zeitplan für den Start gibt es einige Änderungen, über die das Team Bescheid wissen sollte.',
      drops: 'Weil der Zahlungsanbieter noch nicht so weit ist, wurde der Start verschoben, aber das Budget bleibt gleich.',
      adds: 'Der Start verschiebt sich auf den 14. Mai, weil die Zertifizierung des Zahlungsanbieters nicht abgeschlossen ist, und die Verzögerung macht das Projekt teurer.',
      subtle: 'Der Start verschiebt sich auf den 14. Mai, weil unsere App bei der Zertifizierung des Zahlungsanbieters durchgefallen ist, und das Marketing muss bis Freitag über den neuen Kampagnenstart entscheiden.'
    },
    summaryNotes: {
      drops: 'Es fehlen der neue Termin und die Entscheidung, die das Marketing treffen muss.',
      adds: 'Laut Text bleibt das Budget gleich; höhere Kosten sind erfunden.',
      subtle: 'Die App ist nirgends durchgefallen: Die Zertifizierung ist einfach noch nicht abgeschlossen.'
    },
    task: 'Das Marketingteam muss nach diesem Einzeiler handeln.',
    oneLiner: 'Verschiebt den Start auf Mai.',
    details: {
      d1: 'Der genaue neue Termin: 14. Mai',
      d2: 'Wer handeln muss: Das Marketing verschiebt die Kampagne',
      d3: 'Die Frist: bis Freitag über den neuen Kampagnenstart entscheiden',
      d4: 'Warum der Anbieter im Verzug ist',
      d5: 'Die Pläne des Designteams für die Einstiegsbildschirme',
      d6: 'Das sonnige Wochenende'
    },
    versions: {
      actionable: 'Der Start verschiebt sich vom 2. April auf den 14. Mai. Marketing: Bitte verschiebt die Kampagne und entscheidet bis Freitag über den neuen Starttermin. Das Budget bleibt gleich.',
      vague: 'Wir verschieben den Start auf Mai. Bitte passt eure Pläne entsprechend an und meldet euch, falls etwas ist.',
      invented: 'Der Start verschiebt sich auf den 1. Mai. Marketing: Bitte sagt die Kampagne ab und plant bis Monatsende eine neue.'
    },
    versionNote: 'Der neue Termin ist der 14. Mai, nicht der 1. Mai, und die Kampagne wird verschoben, nicht abgesagt.'
  },
  library: {
    title: 'Renovierung der Bücherei',
    context: 'Ein Aushang an der Tür der Stadtteilbücherei.',
    sentences: {
      s1: 'Viele von Ihnen haben uns erzählt, wie sehr Sie die alten Sessel in der Leseecke lieben.',
      s2: 'Ab dem 3. Juni ist die Bücherei wegen Renovierung acht Wochen lang geschlossen.',
      s3: 'Das Dach wird repariert, und das Gebäude bekommt einen Aufzug und neue Beleuchtung.',
      s4: 'Während der Schließung hält jeden Dienstag ein Bücherbus auf dem Marktplatz.',
      s5: 'Der Bus hat etwa 2.000 Bücher an Bord und kann jeden Titel aus der Zentralbibliothek bestellen.',
      s6: 'Alle Ausleihen, die während der Schließung fällig würden, werden automatisch verlängert, sodass niemand Mahngebühren zahlt.',
      s7: 'Bücher können außerdem jederzeit in den Rückgabekasten neben dem Rathaus gelegt werden.',
      s8: 'Das Rathaus selbst wurde vor zehn Jahren auf ähnliche Weise renoviert.',
      s9: 'Unsere E-Books und Hörbücher sind wie gewohnt online verfügbar.',
      s10: 'Wir freuen uns schon auf das Sommerlesefest im nächsten Jahr.',
      s11: 'Die Renovierung wird aus einem regionalen Baufonds bezahlt.'
    },
    bullets: {
      gold1: 'Ab 3. Juni acht Wochen wegen Renovierung geschlossen.',
      gold2: 'Jeden Dienstag hält ein Bücherbus auf dem Marktplatz.',
      gold3: 'Ausleihen, die in der Schließzeit fällig werden, verlängern sich automatisch.',
      minor: 'Das Gebäude bekommt neue Beleuchtung.',
      distort: 'Alle Angebote der Bücherei ruhen acht Wochen lang.',
      dup: 'Die Bücherei ist eine Weile geschlossen.',
      subtle: 'Ab 3. Juni sechs Wochen wegen Renovierung geschlossen.'
    },
    bulletNotes: {
      distort: 'Stimmt nicht: Bücherbus und Rückgabekasten funktionieren während der Schließung weiter.',
      dup: 'Wiederholt die Schließung ohne Beginn und ohne Dauer.',
      subtle: 'Fast richtig, aber die Schließung dauert acht Wochen, nicht sechs.'
    },
    summaries: {
      faithful: 'Die Bücherei schließt ab dem 3. Juni für acht Wochen; in der Zeit kommt jeden Dienstag ein Bus auf den Marktplatz, und fällige Ausleihen werden automatisch verlängert.',
      vague: 'In der Bücherei ändert sich im Sommer einiges, also halten Sie die Augen offen.',
      drops: 'Die Bücherei wird renoviert und bekommt ein repariertes Dach, einen Aufzug und neue Beleuchtung.',
      adds: 'Die Bücherei schließt ab dem 3. Juni für acht Wochen und verlangt nach der Wiedereröffnung eine kleine Gebühr für Ausleihen.',
      subtle: 'Weil das Dach unsicher ist, schließt die Bücherei ab dem 3. Juni für acht Wochen; in der Zeit kommt jeden Dienstag ein Bus auf den Marktplatz.'
    },
    summaryNotes: {
      drops: 'Es beschreibt die Bauarbeiten, aber nicht, wann die Bücherei schließt oder was Lesende in der Zeit tun können.',
      adds: 'Im Aushang steht nichts von Gebühren nach der Wiedereröffnung.',
      subtle: 'Im Aushang steht, dass das Dach repariert wird, nicht, dass es unsicher ist – dieser Grund ist hinzugedichtet.'
    },
    task: 'Ein Nachbar, der weiter Bücher ausleihen möchte, fragt Sie danach.',
    oneLiner: 'Die Bücherei ist im Sommer zu.',
    details: {
      d1: 'Wann genau: acht Wochen ab dem 3. Juni',
      d2: 'Wo man solange ausleiht: im Bus auf dem Marktplatz, dienstags',
      d3: 'Wo man Bücher zurückgibt: im Kasten neben dem Rathaus',
      d4: 'Was bei der Renovierung gemacht wird',
      d5: 'Die Sessel in der Leseecke',
      d6: 'Das Lesefest im nächsten Jahr'
    },
    versions: {
      actionable: 'Ab dem 3. Juni ist die Bücherei acht Wochen geschlossen. Ausleihen kannst du jeden Dienstag im Bücherbus auf dem Marktplatz, zurückgeben jederzeit im Kasten neben dem Rathaus. Was in der Zeit fällig wird, verlängert sich automatisch.',
      vague: 'Die Bücherei ist im Sommer wegen Bauarbeiten eine Weile zu. Es gibt andere Möglichkeiten, schau am besten auf den Aushang.',
      invented: 'Ab dem 3. Juni ist die Bücherei acht Wochen geschlossen. Ausleihen kannst du jeden Freitag im Bücherbus am Bahnhof. Bitte gib vor der Schließung alle Bücher zurück.'
    },
    versionNote: 'Der Bus hält dienstags auf dem Marktplatz, und niemand muss vor der Schließung Bücher zurückgeben.'
  },
  leaves: {
    title: 'Warum sich Blätter verfärben',
    context: 'Ein kurzer Artikel aus einem Naturmagazin für neugierige Leser.',
    sentences: {
      s1: 'Der Herbst ist für viele die liebste Jahreszeit für lange Spaziergänge.',
      s2: 'Blätter sind grün, weil sie viel Chlorophyll enthalten, den Farbstoff, mit dem Pflanzen Sonnenlicht einfangen.',
      s3: 'Wenn die Tage kürzer werden, hören viele Bäume auf, Chlorophyll zu bilden, und bauen es ab.',
      s4: 'Gelbe und orange Farbstoffe, die Carotinoide, waren die ganze Zeit im Blatt; sie werden erst sichtbar, wenn das Grün verblasst.',
      s5: 'Carotinoide sind dieselbe Art Farbstoff, die Karotten orange macht.',
      s6: 'Rot ist anders: Manche Bäume, etwa viele Ahornarten, bilden im Herbst neue rote Farbstoffe.',
      s7: 'Forschende vermuten, dass diese roten Farbstoffe das Blatt vor starkem Licht schützen könnten, während der Baum Nährstoffe zurückholt.',
      s8: 'Sonnige Tage und kühle Nächte machen das Rot meist kräftiger.',
      s9: 'In manchen Gegenden locken bunte Wälder jedes Jahr viele Touristen an.',
      s10: 'Zum Schluss bildet sich eine dünne Zellschicht dort, wo das Blatt am Zweig sitzt, und das Blatt fällt ab.',
      s11: 'Vergessen Sie keine warme Jacke, wenn Sie hinausgehen, um die Bäume anzuschauen.'
    },
    bullets: {
      gold1: 'Im Herbst bilden Bäume kein grünes Chlorophyll mehr und bauen es ab.',
      gold2: 'Gelbe und orange Farbstoffe waren schon immer da und werden sichtbar.',
      gold3: 'Manche Bäume, etwa Ahorn, bilden neue rote Farbstoffe.',
      minor: 'Eine dünne Zellschicht bildet sich, und das Blatt fällt ab.',
      distort: 'Alle Herbstfarben sind neue Farbstoffe, die der Baum bildet.',
      dup: 'Blätter verlieren ihre grüne Farbe.',
      subtle: 'Rote Farbstoffe schützen das Blatt vor starkem Licht.'
    },
    bulletNotes: {
      distort: 'Nur das Rot ist neu; Gelb und Orange waren die ganze Zeit im Blatt.',
      dup: 'Sagt weniger als der Punkt zum Chlorophyll und verschenkt einen Platz.',
      subtle: 'Im Text steht nur, dass Forschende vermuten, die roten Farbstoffe könnten das Blatt schützen; dieser Punkt stellt es als Tatsache hin.'
    },
    summaries: {
      faithful: 'Im Herbst bauen viele Bäume ihr grünes Chlorophyll ab, wodurch gelbe und orange Farbstoffe sichtbar werden, die schon immer da waren, während manche Bäume zusätzlich neue rote bilden.',
      vague: 'Blätter verfärben sich im Herbst wegen verschiedener natürlicher Vorgänge im Baum.',
      drops: 'Im Herbst werden die Blätter gelb, orange und rot, und dann fallen sie von den Bäumen.',
      adds: 'Im Herbst bauen viele Bäume ihr grünes Chlorophyll ab, wodurch gelbe und orange Farbstoffe sichtbar werden, und je röter die Blätter, desto kälter der kommende Winter.',
      subtle: 'Im Herbst bauen viele Bäume ihr grünes Chlorophyll ab, wodurch gelbe und orange Farbstoffe sichtbar werden, und kalte Nächte bringen die Bäume dazu, rote zu bilden.'
    },
    summaryNotes: {
      drops: 'Es beschreibt, was wir sehen, aber nicht, warum es passiert.',
      adds: 'Im Text steht nichts über eine Vorhersage des Winters.',
      subtle: 'Kühle Nächte machen das Rot nur meist kräftiger; dass sie die roten Farbstoffe verursachen, steht nicht im Text.'
    },
    task: 'Eine Lehrerin möchte diesen Einzeiler einer Klasse mit echten Blättern erklären.',
    oneLiner: 'Das Chlorophyll wird abgebaut, also zeigen sich andere Farben.',
    details: {
      d1: 'Was Chlorophyll ist: der grüne Farbstoff, der Sonnenlicht einfängt',
      d2: 'Dass Gelb und Orange die ganze Zeit im Blatt waren',
      d3: 'Dass manche Bäume, etwa Ahorn, neue rote Farbstoffe bilden',
      d4: 'Dass der Herbst eine beliebte Zeit für Spaziergänge ist',
      d5: 'Dass man draußen eine warme Jacke braucht',
      d6: 'Wie das Blatt am Ende abfällt'
    },
    versions: {
      actionable: 'Blätter sind grün wegen Chlorophyll, einem Farbstoff, der Sonnenlicht einfängt. Im Herbst bilden viele Bäume keins mehr und bauen es ab. Dann werden gelbe und orange Farbstoffe sichtbar, die schon immer da waren, und manche Bäume wie der Ahorn bilden neue rote.',
      vague: 'Im Herbst verändern sich die Blätter, weil das Grün verschwindet und andere Farben herauskommen. So faszinierend ist die Natur.',
      invented: 'Blätter sind grün wegen Chlorophyll. Im Herbst lässt der Frost das Chlorophyll gefrieren, und dann färbt der Baum seine Blätter mit neuen Farbstoffen gelb, orange und rot.'
    },
    versionNote: 'Im Text steht nicht, dass Frost das Chlorophyll gefrieren lässt, und nur das Rot ist ein neuer Farbstoff.'
  },
  club: {
    title: 'Vorstandssitzung im Sportverein',
    context: 'Das Protokoll einer Vorstandssitzung eines Sportvereins, an alle Mitglieder verschickt.',
    sentences: {
      s1: 'Die Sitzung fand im Vereinsheim statt und begann wegen eines Fußballspiels etwas später.',
      s2: 'Der Vorstand schlägt vor, den Jahresbeitrag ab nächstem Januar von 60 auf 66 Euro zu erhöhen.',
      s3: 'Der Grund ist, dass die Miete für die Sporthalle um 15 Prozent gestiegen ist.',
      s4: 'Der Beitrag ist seit acht Jahren unverändert.',
      s5: 'Mitglieder unter 18 zahlen weiterhin den alten Beitrag.',
      s6: 'Die Mitglieder stimmen auf der Mitgliederversammlung am 12. März über den Vorschlag ab.',
      s7: 'Der Vorstand sprach außerdem über neue Netze für die Tennisplätze, vertagte aber die Entscheidung.',
      s8: 'Wird der Vorschlag abgelehnt, prüft der Vorstand stattdessen, einige Trainingszeiten zu streichen.',
      s9: 'Ein Nachbarverein hat seinen Beitrag kürzlich ebenfalls erhöht, auf 75 Euro.',
      s10: 'Die Halle gehört der Stadt, die auch die Miete festlegt.',
      s11: 'Vielen Dank an die Jugendmannschaft für die leckeren Kuchen!'
    },
    bullets: {
      gold1: 'Vorschlag: Der Jahresbeitrag steigt ab Januar von 60 auf 66 Euro.',
      gold2: 'Mitglieder unter 18 zahlen weiter den alten Beitrag.',
      gold3: 'Abgestimmt wird auf der Mitgliederversammlung am 12. März.',
      minor: 'Es wurde über neue Netze für die Tennisplätze gesprochen.',
      distort: 'Der Vorstand hat beschlossen, den Beitrag zu erhöhen.',
      dup: 'Der Mitgliedsbeitrag könnte steigen.',
      subtle: 'Vorschlag: Der Jahresbeitrag steigt ab Januar von 60 auf 76 Euro.'
    },
    bulletNotes: {
      distort: 'Noch ist nichts beschlossen: Es ist ein Vorschlag, über den die Mitglieder abstimmen.',
      dup: 'Eine vagere Wiederholung des Beitragspunkts, ohne Beträge.',
      subtle: 'Fast richtig, aber der vorgeschlagene Beitrag ist 66 Euro, nicht 76.'
    },
    summaries: {
      faithful: 'Weil die Hallenmiete gestiegen ist, schlägt der Vorstand vor, den Jahresbeitrag ab Januar von 60 auf 66 Euro zu erhöhen, unter 18 ausgenommen, und die Mitglieder stimmen am 12. März darüber ab.',
      vague: 'Der Vorstand hat über Geldfragen und einige Änderungen für Mitglieder gesprochen.',
      drops: 'Weil die Miete für die Sporthalle gestiegen ist, waren die Vereinsfinanzen das Hauptthema der Vorstandssitzung.',
      adds: 'Der Vorstand schlägt vor, den Jahresbeitrag ab Januar von 60 auf 66 Euro zu erhöhen, und wer bis März nicht zahlt, verliert seine Mitgliedschaft.',
      subtle: 'Weil die Hallenmiete gestiegen ist, hat der Vorstand beschlossen, den Jahresbeitrag ab Januar von 60 auf 66 Euro zu erhöhen, unter 18 ausgenommen.'
    },
    summaryNotes: {
      drops: 'Es fehlen der vorgeschlagene neue Beitrag und die Abstimmung am 12. März.',
      adds: 'Im Protokoll steht nichts davon, dass jemand seine Mitgliedschaft verliert.',
      subtle: 'Es ist nur ein Vorschlag, über den die Mitglieder noch abstimmen – „hat beschlossen“ ist also falsch.'
    },
    task: 'Ein Mitglied fragt Sie, was das für es bedeutet.',
    oneLiner: 'Die Beiträge steigen.',
    details: {
      d1: 'Die Beträge: von 60 auf 66 Euro im Jahr',
      d2: 'Dass es ein Vorschlag ist, über den am 12. März abgestimmt wird',
      d3: 'Dass Mitglieder unter 18 den alten Beitrag behalten',
      d4: 'Dass die Sitzung später begann',
      d5: 'Die Kuchen der Jugendmannschaft',
      d6: 'Das Gespräch über Tennisnetze'
    },
    versions: {
      actionable: 'Der Vorstand schlägt vor, den Jahresbeitrag ab Januar von 60 auf 66 Euro zu erhöhen, weil die Hallenmiete gestiegen ist. Mitglieder unter 18 zahlen weiter den alten Beitrag. Noch ist nichts beschlossen: Du kannst auf der Mitgliederversammlung am 12. März abstimmen.',
      vague: 'Die Beiträge steigen nächstes Jahr, weil alles teurer geworden ist. Mehr Infos kommen irgendwann.',
      invented: 'Ab Januar steigt der Beitrag für alle von 60 auf 66 Euro. Bitte passe deine Überweisung vor der Mitgliederversammlung am 12. März an.'
    },
    versionNote: 'Es behandelt einen Vorschlag als beschlossen und vergisst, dass Mitglieder unter 18 den alten Beitrag behalten.'
  },
  trip: {
    title: 'Änderung bei der Klassenfahrt',
    context: 'Eine Nachricht eines Lehrers an die Eltern einer Schulklasse.',
    sentences: {
      s1: 'Ich hoffe, die Kinder freuen sich genauso auf die Fahrt wie ich!',
      s2: 'Wegen eines Bahnstreiks fahren wir mit dem Reisebus statt mit dem Zug an die Küste.',
      s3: 'Dadurch fahren wir eine Stunde früher los als geplant.',
      s4: 'Treffpunkt ist nicht mehr der Bahnhof, sondern der Parkplatz hinter der Schule.',
      s5: 'Das Busunternehmen hat viel Erfahrung mit Schulgruppen.',
      s6: 'Die Rückfahrt am Freitag bleibt wie geplant.',
      s7: 'Für die Familien entstehen keine Mehrkosten; die Schule übernimmt die Differenz.',
      s8: 'Die Busfahrt dauert etwa 40 Minuten länger als die Zugfahrt.',
      s9: 'Die Klasse vom letzten Jahr war in den Bergen, das war auch eine tolle Fahrt.',
      s10: 'Auf halber Strecke gibt es eine kurze Pause an einer Raststätte.',
      s11: 'Danke euch allen für die Hilfe bei den Packlisten.'
    },
    bullets: {
      gold1: 'Reisebus statt Zug wegen eines Bahnstreiks.',
      gold2: 'Abfahrt eine Stunde früher, vom Parkplatz hinter der Schule.',
      gold3: 'Keine Mehrkosten für die Familien.',
      minor: 'Das Busunternehmen hat Erfahrung mit Schulgruppen.',
      distort: 'Die Fahrt wird wegen des Streiks verkürzt.',
      dup: 'Die Reisepläne haben sich geändert.',
      subtle: 'Abfahrt zwei Stunden früher, vom Parkplatz hinter der Schule.'
    },
    bulletNotes: {
      distort: 'Nur die Hinfahrt ändert sich; die Fahrt wird nicht verkürzt.',
      dup: 'Sagt nur, dass sich etwas geändert hat – das zeigen die anderen Punkte schon.',
      subtle: 'Fast richtig, aber die Abfahrt ist eine Stunde früher, nicht zwei.'
    },
    summaries: {
      faithful: 'Wegen eines Bahnstreiks fährt die Klasse mit dem Reisebus, eine Stunde früher, ab dem Parkplatz hinter der Schule, ohne Mehrkosten für die Familien.',
      vague: 'Bei der Organisation der Fahrt gibt es ein paar Änderungen, die Eltern kennen sollten.',
      drops: 'Wegen eines Bahnstreiks fährt die Klasse mit dem Reisebus an die Küste, was die Familien nichts extra kostet.',
      adds: 'Wegen eines Bahnstreiks fährt die Klasse mit dem Reisebus, eine Stunde früher, ab dem Parkplatz hinter der Schule, und die Eltern zahlen einen kleinen Aufpreis.',
      subtle: 'Weil der Bus schneller ist als der Zug, fährt die Klasse mit dem Reisebus, eine Stunde früher, ab dem Parkplatz hinter der Schule, ohne Mehrkosten für die Familien.'
    },
    summaryNotes: {
      drops: 'Es fehlt, was Eltern tun müssen: die frühere Abfahrt und der neue Treffpunkt.',
      adds: 'Laut Nachricht übernimmt die Schule die Differenz – es gibt also keinen Aufpreis.',
      subtle: 'Der Grund ist der Bahnstreik, und der Bus ist sogar langsamer als der Zug.'
    },
    task: 'Ein Elternteil hat die Nachricht verpasst und fragt einen anderen, was zu tun ist.',
    oneLiner: 'Die Klasse fährt jetzt mit dem Bus.',
    details: {
      d1: 'Der neue Treffpunkt: der Parkplatz hinter der Schule',
      d2: 'Die neue Zeit: eine Stunde früher als geplant',
      d3: 'Dass keine Mehrkosten entstehen',
      d4: 'Dass das Busunternehmen erfahren ist',
      d5: 'Warum sie nicht mit dem Zug fahren',
      d6: 'Dass sich der Lehrer auf die Fahrt freut'
    },
    versions: {
      actionable: 'Die Klasse fährt mit dem Reisebus. Bring dein Kind eine Stunde früher als geplant zum Parkplatz hinter der Schule, nicht zum Bahnhof. Es kostet nichts extra, und die Rückfahrt am Freitag bleibt gleich.',
      vague: 'Es wird gestreikt, deshalb fahren sie jetzt mit dem Bus. Zeiten und Orte sind etwas anders, schau am besten nach, was der Lehrer geschrieben hat.',
      invented: 'Die Klasse fährt mit dem Reisebus. Bring dein Kind eine Stunde früher zum Bahnhof und gib ihm etwas Geld für die Busfahrkarte mit.'
    },
    versionNote: 'Treffpunkt ist der Parkplatz hinter der Schule, nicht der Bahnhof, und die Schule übernimmt die Kosten.'
  },
  bikes: {
    title: 'E-Bikes im Fahrradverleih',
    context: 'Eine Mitteilung des städtischen Fahrradverleihs an seine Nutzerinnen und Nutzer.',
    sentences: {
      s1: 'Radfahren ist eine tolle Möglichkeit, aktiv zu bleiben und die Stadt zu entdecken.',
      s2: 'Ab dem 1. Juli ergänzt unser Fahrradverleih seine Flotte um 200 E-Bikes.',
      s3: 'Ein E-Bike kostet 20 Cent pro Minute; die normalen Räder behalten ihren bisherigen Preis.',
      s4: 'Zum Entsperren eines E-Bikes brauchen Sie die neueste Version unserer App.',
      s5: 'Die E-Bikes haben eine Reichweite von etwa 60 Kilometern pro Akkuladung.',
      s6: 'E-Bikes müssen an einer von 12 Ladestationen zurückgegeben werden; anderswo dürfen sie nicht abgestellt werden.',
      s7: 'Eine Karte der Ladestationen finden Sie in der App.',
      s8: 'Wird ein E-Bike außerhalb einer Station abgestellt, fällt eine Gebühr von 10 Euro an.',
      s9: 'Mehrere andere Städte haben in den letzten Jahren ähnliche Angebote eingeführt.',
      s10: 'Die Räder wurden im Winter von 50 Freiwilligen getestet.',
      s11: 'Danke, dass Sie mit uns fahren!'
    },
    bullets: {
      gold1: 'Ab 1. Juli: 200 E-Bikes für 20 Cent pro Minute.',
      gold2: 'Zum Entsperren braucht man die neueste App-Version.',
      gold3: 'E-Bikes müssen an einer von 12 Ladestationen zurückgegeben werden.',
      minor: 'Eine Karte der Ladestationen ist in der App.',
      distort: 'Die E-Bikes ersetzen die normalen Räder.',
      dup: 'Es gibt neue Räder.',
      subtle: 'Ab 1. Juli: 200 E-Bikes für 25 Cent pro Minute.'
    },
    bulletNotes: {
      distort: 'Die E-Bikes kommen dazu; die normalen Räder bleiben, zum bisherigen Preis.',
      dup: 'Eine vagere Wiederholung des ersten Punkts, ohne Datum, Anzahl oder Preis.',
      subtle: 'Fast richtig, aber der Preis ist 20 Cent pro Minute, nicht 25.'
    },
    summaries: {
      faithful: 'Ab dem 1. Juli gibt es 200 E-Bikes für 20 Cent pro Minute; zum Entsperren braucht man die neueste App, und zurückgegeben werden sie an einer von 12 Ladestationen.',
      vague: 'Der Fahrradverleih führt diesen Sommer etwas Neues ein, das für Nutzer interessant sein könnte.',
      drops: 'Der Fahrradverleih ergänzt 200 E-Bikes mit einer Reichweite von etwa 60 Kilometern, sodass längere Fahrten leichter werden.',
      adds: 'Ab dem 1. Juli gibt es 200 E-Bikes für 20 Cent pro Minute, und die normalen Räder werden nächstes Jahr abgeschafft.',
      subtle: 'Ab dem 1. Juli gibt es 200 E-Bikes für 20 Cent pro Minute; zum Entsperren braucht man die neueste App, und zurückgeben kann man sie an jeder Radstation.'
    },
    summaryNotes: {
      drops: 'Es fehlen der Preis und das, was Nutzer tun müssen: die App aktualisieren und E-Bikes an einer Ladestation zurückgeben.',
      adds: 'In der Mitteilung steht nichts davon, dass die normalen Räder abgeschafft werden.',
      subtle: 'E-Bikes können nur an den 12 Ladestationen zurückgegeben werden, nicht an jeder Station.'
    },
    task: 'Eine Freundin möchte nächste Woche ein E-Bike ausprobieren.',
    oneLiner: 'Es gibt jetzt E-Bikes.',
    details: {
      d1: 'Der Preis: 20 Cent pro Minute',
      d2: 'Dass man zum Entsperren die neueste App-Version braucht',
      d3: 'Dass E-Bikes zurück an eine Ladestation müssen',
      d4: 'Dass Radfahren aktiv hält',
      d5: 'Wie viele E-Bikes es insgesamt gibt',
      d6: 'Dass die normalen Räder ihren Preis behalten'
    },
    versions: {
      actionable: 'Ab dem 1. Juli kannst du E-Bikes für 20 Cent pro Minute leihen. Aktualisiere zuerst die App, denn zum Entsperren brauchst du die neueste Version. Danach gibst du das Rad an einer der 12 Ladestationen zurück, die auf der Karte in der App stehen.',
      vague: 'Es gibt jetzt E-Bikes, und die sind ganz einfach. Hol dir einfach die App und fahr los.',
      invented: 'Ab dem 1. Juli kannst du E-Bikes für 20 Cent pro Minute ohne App leihen und sie danach überall in der Stadt abstellen.'
    },
    versionNote: 'Zum Entsperren braucht man die neueste App, und die Räder müssen zurück an eine Ladestation.'
  }
};
