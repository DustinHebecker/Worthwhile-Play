import type { ContentText } from './types';

export const content: ContentText = {
  migration: {
    title: 'Datenbankmigration',
    situation: 'Dein Team zieht die Kundendatenbank auf ein neues System um. Die Tests haben ein Problem gefunden, die Umstellung verzögert sich. Erkläre es.',
    facts: {
      newDate: 'Die Umstellung verschiebt sich um zwei Tage: Donnerstag statt Dienstag.',
      cause: 'Die Tests haben einen bisher unbekannten Fehler bei Sonderzeichen wie ü oder é gefunden.',
      noLoss: 'Es sind keine Daten verloren gegangen.',
      encoding: 'Das Importskript liest Text in der falschen Zeichenkodierung.',
      apology: 'Wir entschuldigen uns für die Unannehmlichkeiten.',
      regression: 'Ein neuer automatischer Test prüft jetzt Sonderzeichen.',
      buffer: 'Die zwei Tage passen in den Zeitpuffer des Projekts, ohne Mehrkosten.',
      library: 'Die fehlerhafte Umwandlung stammt aus einer Bibliothek, die vor Jahren gewählt wurde.'
    },
    reasons: {
      'developer.cause': 'Entwickler müssen wissen, was die Tests tatsächlich gefunden haben.',
      'developer.encoding': 'Das ist die eigentliche Ursache, an der sie arbeiten werden.',
      'developer.apology': 'Eine Entschuldigung an Kunden hilft einer Kollegin nicht, den Fehler zu beheben.',
      'developer.regression': 'Sie müssen wissen, dass der Fehler jetzt durch einen Test abgedeckt ist.',
      'developer.buffer': 'Zeitpuffer und Budget sind Sache der Projektleitung.',
      'projectManager.newDate': 'Die Projektleitung plant mit dem neuen Termin.',
      'projectManager.noLoss': 'Datenverlust würde das Risiko völlig verändern, deshalb muss sie hören, dass es keinen gibt.',
      'projectManager.encoding': 'Das Detail zur Kodierung ändert keine Planungsentscheidung.',
      'projectManager.apology': 'Eine Entschuldigung ist für Kunden; die Projektleitung braucht Fakten.',
      'projectManager.buffer': 'Ob Zeitplan und Budget noch halten, ist genau ihre Frage.',
      'projectManager.library': 'Wer vor Jahren eine Bibliothek gewählt hat, hilft der Planung jetzt nicht.',
      'customer.newDate': 'Der Kunde braucht den neuen Termin, nicht die Fehlerklasse.',
      'customer.noLoss': 'Seine erste Sorge gilt seinen Daten – und die sind sicher.',
      'customer.cause': 'Fehlerdetails beunruhigen Kunden, ohne ihnen zu helfen.',
      'customer.encoding': 'Technische Interna sagen dem Kunden nichts.',
      'customer.regression': 'Interne Tests sind nicht Sache des Kunden.',
      'customer.buffer': 'Interne Puffer und Kosten gehen den Kunden nichts an.',
      'customer.library': 'Die Schuld auf eine alte Bibliothek zu schieben, klingt nach Ausrede.'
    },
    messages: {
      'developer.fit': 'Kurze Info: Das Importskript liest Text in der falschen Kodierung, deshalb gehen Sonderzeichen wie ü und é kaputt. Ein Regressionstest deckt das jetzt ab; die Umstellung verschiebt sich auf Donnerstag.',
      'developer.missing': 'Kleine Verzögerung bei der Migration, nichts Wildes. Details später.',
      'developer.condescending': 'Sonderzeichen sind Buchstaben wie ü, die nicht im Grundalphabet vorkommen. Computer speichern Buchstaben als Zahlen, und manchmal geraten die Zahlen durcheinander.',
      'projectManager.fit': 'Die Migration verschiebt sich von Dienstag auf Donnerstag. Es gingen keine Daten verloren, und die zwei Tage passen ohne Mehrkosten in unseren Puffer. Ursache: ein Fehler bei Sonderzeichen, jetzt durch einen Test abgedeckt.',
      'projectManager.tooMuch': 'Das Importskript dekodiert die Eingabe als Latin-1 statt UTF-8, dadurch werden Mehrbyte-Zeichen zerstört; wir patchen den Reader und ergänzen einen Regressionstest.',
      'projectManager.missing': 'Wir haben einen Fehler gefunden und arbeiten daran. Wir melden uns.',
      'customer.fit': 'Ihre Daten sind sicher. Damit jeder Name und jede Adresse korrekt übernommen wird, verschieben wir die Umstellung von Dienstag auf Donnerstag. Bis dahin funktioniert alles wie gewohnt.',
      'customer.tooMuch': 'Unser Importskript hat die falsche Zeichenkodierung verwendet, wodurch Sonderzeichen in Testläufen beschädigt wurden; die Migration braucht daher zwei zusätzliche Tage aus unserem Puffer.',
      'customer.condescending': 'Machen Sie sich keine Gedanken über die Technik, das ist kompliziert. Es dauert einfach etwas länger.'
    }
  },
  skyBlue: {
    title: 'Warum der Himmel blau ist',
    situation: 'Jemand fragt dich, warum der Himmel blau ist. Du kennst die Physik dahinter. Erkläre es.',
    facts: {
      sunlight: 'Sonnenlicht enthält alle Farben.',
      scatter: 'Luft streut blaues Licht viel stärker als rotes.',
      rayleigh: 'Diese Rayleigh-Streuung wächst mit der vierten Potenz der Frequenz (1/λ⁴).',
      sunset: 'Bei Sonnenuntergang legt das Licht mehr Weg durch die Luft zurück, deshalb wird der Himmel rot und orange.',
      everywhere: 'Gestreutes blaues Licht erreicht deine Augen aus allen Richtungen, deshalb wirkt der ganze Himmel blau.',
      violet: 'Violett wird noch stärker gestreut, aber Sonnenlicht enthält weniger Violett und unsere Augen sind dafür weniger empfindlich.',
      molecules: 'Die Streuung entsteht an Stickstoff- und Sauerstoffmolekülen, die viel kleiner sind als die Wellenlänge des Lichts.',
      ocean: 'Der Himmel ist blau, weil er das Meer spiegelt.'
    },
    reasons: {
      'child.sunlight': 'Kinder brauchen zuerst die Überraschung: Im weißen Sonnenlicht stecken alle Farben.',
      'child.scatter': 'Das ist die Kernidee, in einfachen Worten.',
      'child.rayleigh': 'Mit einer Formel verliert man ein Kind sofort.',
      'child.everywhere': 'Es erklärt, was sie sehen: Blau, wohin sie auch schauen.',
      'child.violet': 'Das Detail mit Violett verwirrt in diesem Alter mehr, als es hilft.',
      'child.molecules': 'Moleküle und Wellenlängen sind für ein Kind zu abstrakt.',
      'layperson.sunlight': 'Ohne das ergibt „blaues Licht wird gestreut“ keinen Sinn.',
      'layperson.scatter': 'Das ist die eigentliche Antwort, in Alltagssprache.',
      'layperson.rayleigh': 'Die Formel bringt Laien nichts, was sie nutzen können.',
      'expert.rayleigh': 'Eine Fachperson erwartet den genauen Mechanismus und seine Abhängigkeit von der Wellenlänge.',
      'expert.everywhere': 'Das ist für Fachleute selbstverständlich und kostet nur Zeit.',
      'expert.violet': 'Fachleute kennen den naheliegenden Einwand „Warum nicht violett?“ – beantworte ihn.',
      'expert.molecules': 'Die Streuer und das Größenverhältnis zu nennen, macht die Erklärung präzise.',
      ocean: 'Das ist ein verbreiteter Irrtum; die Farbe kommt nicht vom Meer.'
    },
    messages: {
      'child.fit': 'Sonnenlicht sieht weiß aus, aber eigentlich sind alle Farben darin gemischt. Wenn es durch die Luft fliegt, wird der blaue Teil am meisten herumgeschubst – deshalb kommt Blau von überall am Himmel zu deinen Augen.',
      'child.tooMuch': 'Blaues Licht hat eine kürzere Wellenlänge, und die Rayleigh-Streuung wächst mit eins durch die Wellenlänge hoch vier.',
      'child.missing': 'Der Himmel ist halt so. Er war schon immer blau.',
      'layperson.fit': 'Sonnenlicht enthält alle Farben. Die Luft streut blaues Licht viel stärker als rotes, deshalb erreicht uns blaues Licht aus jedem Teil des Himmels.',
      'layperson.tooMuch': 'Das ist Rayleigh-Streuung: Die Intensität skaliert mit 1/λ⁴, daher dominieren kurze Wellenlängen die diffuse Himmelsstrahlung.',
      'layperson.condescending': 'Das ist für Nicht-Wissenschaftler etwas kompliziert. Sagen wir einfach: Die Luft macht ihn blau.',
      'expert.fit': 'Rayleigh-Streuung an N₂- und O₂-Molekülen, proportional zu 1/λ⁴. Violett wird noch stärker gestreut, aber das Sonnenspektrum enthält weniger Violett und unsere Zapfen sind dafür weniger empfindlich.',
      'expert.condescending': 'Stell dir das Sonnenlicht als Schachtel Buntstifte vor! Die Luft spielt am liebsten mit dem blauen Stift.',
      'expert.missing': 'Die Luft streut blaues Licht stärker, deshalb.'
    }
  },
  clubRoof: {
    title: 'Dach des Vereinsheims',
    situation: 'Das Dach des Vereinsheims eures Sportvereins muss dringend repariert werden, und es kostet mehr als geplant. Erkläre es.',
    facts: {
      cost: 'Die Reparatur kostet 8.000 Euro, 3.000 mehr als geplant.',
      decision: 'Der Vorstand muss bis Freitag entscheiden, ob 3.000 Euro aus dem Budget für das Sommerfest umgeschichtet werden.',
      storage: 'Der Geräteraum bleibt bis zur Reparatur geschlossen; der Rest des Vereinsheims ist offen.',
      fees: 'Die Mitgliedsbeiträge ändern sich nicht.',
      schedule: 'Der Dachdecker beginnt am 12. Mai und braucht vier Tage; der Parkplatz wird für das Gerüst gebraucht.',
      tiles: 'Die neuen Ziegel sind anthrazitfarbene Betondachsteine.',
      reserve: 'Würde man stattdessen die Rücklage nutzen, fiele sie unter das vorgeschriebene Minimum.',
      volunteer: 'Ein Mitglied hat angeboten, das Dach kostenlos selbst zu reparieren, ist aber kein Dachdecker.'
    },
    reasons: {
      'executive.cost': 'Der Vorstand braucht den Betrag und die Überschreitung, um es zu beurteilen.',
      'executive.decision': 'Das ist die Entscheidung, die er treffen muss – samt Frist.',
      'executive.storage': 'Die tägliche Raumnutzung ist keine Frage für den Vorstand.',
      'executive.schedule': 'Die genauen Arbeitstage sind Aufgabe der Koordination.',
      'executive.tiles': 'Art und Farbe der Ziegel beeinflussen die Entscheidung nicht.',
      'executive.reserve': 'Es erklärt, warum die naheliegende Alternative nicht infrage kommt.',
      'projectManager.fees': 'Beiträge haben mit der Organisation der Reparatur nichts zu tun.',
      'projectManager.schedule': 'Genau diese Termine und den Parkplatz organisiert die Koordination.',
      'projectManager.reserve': 'Die Finanzierung entscheidet der Vorstand, nicht die Koordination.',
      'layperson.storage': 'Mitglieder wollen wissen, was sie nutzen können und was nicht.',
      'layperson.fees': 'Ihr eigenes Geld ist ihre erste Frage.',
      'layperson.tiles': 'Materialdetails sind für Mitglieder unwichtig.',
      'layperson.reserve': 'Regeln zur Rücklage sind interne Finanzdetails.',
      volunteer: 'Ein Angebot ohne passende Qualifikation löst nur eine sinnlose Debatte aus; es ist keine echte Option.'
    },
    messages: {
      'executive.fit': 'Entscheidung bis Freitag nötig: Die Dachreparatur kostet 8.000 Euro, 3.000 mehr als geplant. Wir schlagen vor, 3.000 aus dem Sommerfest-Budget umzuschichten, weil die Rücklage sonst unter ihr Minimum fiele.',
      'executive.tooMuch': 'Der Dachdecker beginnt am 12. Mai mit anthrazitfarbenen Betondachsteinen; das Gerüst steht vier Tage auf dem Parkplatz, und der Geräteraum bleibt bis dahin zu.',
      'executive.missing': 'Das Dach wird teurer. Wir halten euch auf dem Laufenden.',
      'projectManager.fit': 'Der Dachdecker beginnt am 12. Mai und braucht vier Tage. Bitte haltet den Parkplatz ab dem 11. Mai für das Gerüst frei.',
      'projectManager.tooMuch': 'Die Reparatur kostet 8.000 Euro, 3.000 über Plan; der Vorstand schichtet eventuell Geld vom Sommerfest um, weil die Rücklage nicht unter ihr Minimum fallen darf, und die Beiträge bleiben gleich.',
      'projectManager.missing': 'Im Mai stehen irgendwann Arbeiten am Dach an.',
      'layperson.fit': 'Das Dach des Vereinsheims wird im Mai repariert. Bis dahin bleibt der Geräteraum geschlossen; alles andere ist wie gewohnt offen. Die Mitgliedsbeiträge ändern sich nicht.',
      'layperson.tooMuch': 'Die Reparatur kostet 8.000 Euro, 3.000 über Plan; der Vorstand prüft eine Umschichtung aus dem Sommerfest-Budget, weil die Rücklage nicht unter ihr Minimum fallen darf.',
      'layperson.condescending': 'Macht euch keine Gedanken ums Dach, um den Erwachsenenkram kümmert sich der Vorstand.'
    }
  },
  shopOutage: {
    title: 'Ausfall des Onlineshops',
    situation: 'Der Onlineshop deiner Firma war gestern drei Stunden lang nicht erreichbar. Erkläre, was passiert ist.',
    facts: {
      duration: 'Der Shop war gestern Abend drei Stunden lang ausgefallen.',
      revenue: 'Bestellungen im Wert von etwa 40.000 Euro gingen verloren.',
      cause: 'Ein abgelaufenes Sicherheitszertifikat hat die Zahlungen gestoppt.',
      fixed: 'Das Zertifikat ist erneuert; der Shop funktioniert wieder normal.',
      renewal: 'Die Erneuerung wird automatisiert, mit einer Warnung zwei Wochen vorher; das kostet das Team einen Tag.',
      voucher: 'Kunden, deren Bestellung fehlschlug, erhalten per E-Mail einen Gutschein über 10 %.',
      approval: 'Die Geschäftsführung wird gebeten, 5.000 Euro für besseres Monitoring freizugeben.',
      competitor: 'Der Shop eines Mitbewerbers hatte letzten Monat einen ähnlichen Ausfall.'
    },
    reasons: {
      'projectManager.cause': 'Die Projektleitung braucht die Ursache, um die Lösung zu beurteilen.',
      'projectManager.renewal': 'Das ist die Arbeit, die sie einplanen muss: einen Tag des Teams.',
      'projectManager.voucher': 'Gutscheine erledigt der Kundenservice, nicht das Projekt.',
      'executive.duration': 'Die Geschäftsführung braucht das Ausmaß des Vorfalls.',
      'executive.revenue': 'Für die Geschäftsführung kommt die geschäftliche Auswirkung zuerst.',
      'executive.cause': 'Das technische Detail ändert ihre Entscheidung nicht; „eine versäumte Erneuerung“ genügt.',
      'executive.renewal': 'Sie muss hören, dass es nicht wieder passiert.',
      'executive.approval': 'Das ist die Entscheidung, die sie treffen muss.',
      'customer.revenue': 'Dein entgangener Umsatz ist nicht das Problem der Kunden.',
      'customer.cause': 'Technische Ursachen helfen Kunden nicht.',
      'customer.fixed': 'Kunden wollen zuerst wissen, dass sie wieder einkaufen können.',
      'customer.renewal': 'Interne Prozessänderungen gehen Kunden nichts an.',
      'customer.voucher': 'Das bekommen sie – und sie sollten nach der E-Mail schauen.',
      'customer.approval': 'Interne Budgetentscheidungen sind nichts für Kunden.',
      competitor: 'Auf andere zu zeigen, klingt nach Ausrede und ändert nichts.'
    },
    messages: {
      'projectManager.fit': 'Der dreistündige Ausfall gestern kam von einem abgelaufenen Sicherheitszertifikat, das die Zahlungen gestoppt hat. Damit es nicht wieder passiert, automatisieren wir die Erneuerung mit Vorwarnung; das kostet das Team in diesem Sprint einen Tag.',
      'projectManager.tooMuch': 'Wir haben Bestellungen für etwa 40.000 Euro verloren, Kunden bekommen einen 10-%-Gutschein per E-Mail, und ein Mitbewerber hatte letzten Monat dasselbe Problem.',
      'projectManager.missing': 'Der Shop hatte gestern einen kurzen Schluckauf, jetzt ist alles gut.',
      'executive.fit': 'Gestern war der Shop drei Stunden lang ausgefallen; uns sind Bestellungen für etwa 40.000 Euro entgangen. Ursache war eine versäumte Routine-Erneuerung, die jetzt automatisiert ist. Um solche Probleme früh zu erkennen, bitten wir um Freigabe von 5.000 Euro für Monitoring.',
      'executive.tooMuch': 'Das TLS-Zertifikat des Payment-Gateways lief um 18:02 Uhr ab; wir erneuern es jetzt automatisch über das ACME-Protokoll, mit Alarm 14 Tage vorher.',
      'executive.missing': 'Gestern gab es ein kleines technisches Problem. Es ist behoben.',
      'customer.fit': 'Entschuldigung: Gestern Abend war unser Shop einige Stunden nicht erreichbar. Jetzt funktioniert alles wieder. Falls Ihre Bestellung fehlgeschlagen ist, erhalten Sie per E-Mail einen Gutschein über 10 %.',
      'customer.tooMuch': 'Ein abgelaufenes Sicherheitszertifikat hat unser Zahlungssystem gestoppt; wir haben etwa 40.000 Euro verloren und erneuern Zertifikate jetzt automatisch.',
      'customer.condescending': 'Irgendein technisches Ding war kaputt, das würden Sie eh nicht verstehen. Versuchen Sie es einfach noch mal.'
    }
  },
  signalFault: {
    title: 'Signalstörung bei der Bahn',
    situation: 'Eine Signalstörung legt eine Bahnstrecke lahm. Du arbeitest bei der Bahn. Erkläre die Lage.',
    facts: {
      delay: 'Die Züge auf dieser Strecke sind etwa 40 Minuten verspätet.',
      bus: 'Ersatzbusse fahren alle 20 Minuten vom Bahnhofsvorplatz ab.',
      tickets: 'Fahrkarten gelten auch in den Bussen und in späteren Zügen.',
      signal: 'Signal 14 an der Abzweigung zeigt nach einem Kabelschaden dauerhaft Rot.',
      singleTrack: 'Die Züge passieren den Abschnitt eingleisig in Schrittgeschwindigkeit, mit schriftlichem Befehl.',
      repair: 'Die Technik rechnet damit, dass die Reparatur noch etwa vier Stunden dauert.',
      construction: 'Vermutlich hat eine Baustelle einer anderen Firma das Kabel beschädigt.',
      staff: 'Zwei Techniker sind diese Woche krank.'
    },
    reasons: {
      'layperson.delay': 'Fahrgäste wollen zuerst wissen, wie spät sie kommen.',
      'layperson.bus': 'Es sagt ihnen, was sie jetzt sofort tun können.',
      'layperson.tickets': 'Es beantwortet die Sorge, ob sie eine neue Fahrkarte brauchen.',
      'layperson.signal': 'Signalnummern sagen Fahrgästen nichts.',
      'layperson.singleTrack': 'Betriebsregeln helfen Fahrgästen nicht.',
      'layperson.construction': 'Spekulationen über Schuld helfen Fahrgästen nicht und können falsch sein.',
      'layperson.staff': 'Interne Personalfragen gehen Fahrgäste nichts an.',
      'expert.tickets': 'Fahrkartenregeln beeinflussen den Zugbetrieb nicht.',
      'expert.signal': 'Die Kollegin braucht genauen Ort und genaue Störung.',
      'expert.singleTrack': 'Das ist die Betriebsregel, die sie anwenden muss.',
      'expert.repair': 'Sie plant den Fahrplan um das erwartete Ende herum.',
      'expert.staff': 'Die Personallage ändert nicht, wie der Abschnitt betrieben wird.',
      'executive.delay': 'Die Leitung braucht das Ausmaß der Störung.',
      'executive.tickets': 'Die Anerkennung von Fahrkarten ist eine Standardregel, kein Leitungsthema.',
      'executive.repair': 'Sie muss wissen, wie lange die Auswirkungen dauern.',
      'executive.construction': 'Ein möglicher Schaden durch Dritte ist für Haftung und Kosten wichtig.'
    },
    messages: {
      'layperson.fit': 'Die Züge auf dieser Strecke sind etwa 40 Minuten verspätet. Ersatzbusse fahren alle 20 Minuten vom Bahnhofsvorplatz, und Ihre Fahrkarte gilt darin.',
      'layperson.tooMuch': 'Signal 14 an der Abzweigung zeigt nach einem Kabelschaden dauerhaft Rot; die Züge fahren eingleisig in Schrittgeschwindigkeit mit schriftlichem Befehl.',
      'layperson.missing': 'Bitte haben Sie Geduld, es liegt eine technische Störung vor.',
      'expert.fit': 'Signal 14 an der Abzweigung steht nach Kabelschaden auf Rot. Eingleisiger Betrieb in Schrittgeschwindigkeit mit schriftlichem Befehl; Reparatur dauert voraussichtlich noch etwa vier Stunden.',
      'expert.condescending': 'Ein Signal ist so etwas wie eine Ampel für Züge. Eins davon ist kaputt, deshalb müssen die Züge langsam fahren.',
      'expert.missing': 'Auf der Strecke gibt es ein Problem, die Züge sind verspätet. Busse fahren.',
      'executive.fit': 'Ein Kabelschaden stört die Strecke noch etwa vier Stunden; die Züge fahren rund 40 Minuten verspätet. Vermutlich hat eine Baustelle einer anderen Firma das Kabel beschädigt, wir prüfen die Haftung.',
      'executive.tooMuch': 'Signal 14 zeigt dauerhaft Rot; eingleisiger Betrieb in Schrittgeschwindigkeit mit schriftlichem Befehl; Busse alle 20 Minuten vom Vorplatz; Fahrkarten gelten in den Bussen.',
      'executive.missing': 'Kleines Signalproblem, das Team kümmert sich.'
    }
  },
  kettleLid: {
    title: 'Wasserkocher-Deckel',
    situation: 'Deine Firma hat festgestellt, dass sich der Deckel eines Wasserkocher-Modells lösen kann. Erkläre es.',
    facts: {
      batches: 'Betroffen sind nur Wasserkocher mit den Chargennummern 2301 bis 2315 (aufgedruckt unter dem Sockel).',
      risk: 'Der Deckel kann beim Ausgießen aufgehen, sodass heißes Wasser spritzen kann.',
      stop: 'Benutzen Sie einen betroffenen Wasserkocher nicht mehr, bis er ersetzt ist.',
      hinge: 'Ein Scharnierstift aus Kunststoff wurde 0,2 mm zu dünn gefertigt.',
      free: 'Der Ersatz ist kostenlos, einschließlich Versand.',
      cost: 'Der Austausch kostet die Firma etwa 120.000 Euro.',
      supplier: 'Die Stifte kamen von einem neuen Zulieferer, dessen Muster die Prüfung bestanden hatten.',
      injuries: 'Bisher sind keine Verletzungen bekannt.'
    },
    reasons: {
      'customer.batches': 'Kunden müssen prüfen können, ob ihr Wasserkocher betroffen ist.',
      'customer.risk': 'Sie müssen verstehen, warum es wichtig ist.',
      'customer.stop': 'Das ist die Handlung, die sie schützt.',
      'customer.hinge': 'Millimeterangaben helfen Kunden nicht.',
      'customer.free': 'Zu wissen, dass es nichts kostet, nimmt einen Grund zum Zögern.',
      'customer.cost': 'Die Kosten der Firma sind nicht das Problem der Kunden.',
      'customer.supplier': 'Details zum Zulieferer klingen danach, die Schuld abzuschieben.',
      'executive.risk': 'Die Geschäftsführung muss zuerst das Sicherheitsrisiko verstehen.',
      'executive.hinge': 'Das genaue Maß ist etwas für die Technik.',
      'executive.cost': 'Die finanzielle Auswirkung gehört zu ihrer Entscheidung.',
      'executive.injuries': 'Ob jemand verletzt wurde, ändert Dringlichkeit und Reaktion.',
      'expert.stop': 'Anweisungen für Kunden helfen nicht, den Fehler zu analysieren.',
      'expert.hinge': 'Die Ingenieurin braucht den genauen Fehler.',
      'expert.free': 'Versandbedingungen spielen für die technische Analyse keine Rolle.',
      'expert.cost': 'Die Kosten des Rückrufs braucht man nicht, um das Teil zu verbessern.',
      'expert.supplier': 'Es zeigt, wo sich die Qualitätsprüfung ändern muss.'
    },
    messages: {
      'customer.fit': 'Bitte prüfen Sie die Chargennummer unter Ihrem Wasserkocher. Liegt sie zwischen 2301 und 2315, benutzen Sie ihn nicht mehr: Der Deckel kann beim Ausgießen aufgehen. Wir ersetzen ihn kostenlos, inklusive Versand.',
      'customer.tooMuch': 'Ein Scharnierstift eines neuen Zulieferers war 0,2 mm zu dünn; der Austausch kostet uns etwa 120.000 Euro.',
      'customer.condescending': 'Manche Wasserkocher haben vielleicht ein winziges Problem. Die Details müssen Sie nicht verstehen; schicken Sie ihn zurück, wenn Sie möchten.',
      'executive.fit': 'Sicherheitsproblem: Bei den Chargen 2301 bis 2315 kann der Deckel beim Ausgießen von heißem Wasser aufgehen. Bisher keine Verletzungen bekannt. Der Austausch kostet etwa 120.000 Euro.',
      'executive.tooMuch': 'Der Durchmesser des Scharnierstifts liegt 0,2 mm unter der Toleranz; die Muster des neuen Zulieferers waren in Spezifikation, wir vermuten Werkzeugverschleiß.',
      'executive.missing': 'Wir tauschen vorsorglich einige Wasserkocher aus.',
      'expert.fit': 'Die Scharnierstifte des neuen Zulieferers sind 0,2 mm zu dünn, deshalb kann der Deckel beim Ausgießen aufgehen. Betroffene Chargen: 2301 bis 2315. Die Muster hatten bestanden, also muss sich unsere Wareneingangsprüfung ändern.',
      'expert.missing': 'Manche Deckel sind locker; Kunden bekommen kostenlosen Ersatz.',
      'expert.condescending': 'Ein Scharnier ist das Teil, mit dem sich der Deckel dreht. Wenn es zu dünn ist, hält es nicht gut.'
    }
  }
};
