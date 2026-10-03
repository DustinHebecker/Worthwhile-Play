# Product reference conversation

> Origin of Worthwhile Play: the design conversation (German) that produced the implementation brief.
> It is kept as **design rationale and detailed game descriptions**. Where it conflicts with
> [`docs/spec/implementation-brief.md`](../spec/implementation-brief.md), the brief wins.
> Web-citation markers from the original tool output were removed; the claims about studies,
> model sizes and browser support reflect the state at the time of the conversation and must be
> re-verified before being quoted in user-facing text.


---

## Prompt 1

> Ich würde gerne eine downloadbare webapp bauen mit einigen spielen.
> es sollen keine attention/zeit grabbing oder werbevideo zeigende spiele ohne mehrwert sein. die spiele sollten problemlösungsfähigkeiten und logisches denken fördern, unterhaltsam sein, aber auch entweder sehr kurz oder jeder zeit pausierbar.
> mach mir einige vorschläge. das downloadbar ist optional, schließe keine spiele aus, welche das nicht ermöglichen würden, sondern nenne es explizit als limitation.


### Response 1

Das Konzept ist sinnvoll, gerade wenn du dich bewusst von typischen Mobile-Games abgrenzen willst: keine künstlichen Wartezeiten, keine Daily-Streaks, keine Lootboxen, keine Werbung, sondern Spiele mit echtem kognitivem Mehrwert und klaren Endpunkten.

Ich würde die App nicht als Sammlung von „Brain Training“-Minispielen vermarkten, sondern eher als Sammlung guter Denkspiele, die nebenbei Problemlösen trainieren. Sonst wirkt es schnell wie Lumosity.

#### Gute Spielideen

| Spielidee | Kernmechanik | Trainiert | Dauer | Offline/downloadbar |
|---|---|---|---:|---|
| **Mini-Sokoban** | Kisten durch ein Labyrinth schieben | Planung, Vorausdenken | 2–15 min | ✅ sehr gut |
| **Bridges / Hashi** | Inseln mit Brücken nach Zahlenregeln verbinden | Logik, Constraint Solving | 3–15 min | ✅ |
| **Slitherlink** | Eine einzige geschlossene Linie anhand von Zahlen erzeugen | Deduktion | 3–20 min | ✅ |
| **Nonogram / Picross** | Pixelbild anhand von Zeilen-/Spaltenhinweisen rekonstruieren | Logik, Mustererkennung | 2–30 min | ✅ |
| **Einstein-Rätsel** | Personen, Orte, Eigenschaften aus Hinweisen kombinieren | Deduktion, Ausschlusslogik | 5–20 min | ✅ |
| **Mastermind++** | Geheimen Code anhand partieller Rückmeldung finden | Hypothesentesten | 1–5 min | ✅ |
| **Lights Out** | Lichter durch lokale Zustandsänderungen ausschalten | Zustandsräume, Algebra | 1–10 min | ✅ |
| **River Crossing** | Personen/Objekte unter Regeln über einen Fluss bringen | Planung, Constraints | 1–10 min | ✅ |
| **Rush-Hour-artig** | Blockiertes Objekt durch Verschieben anderer Blöcke befreien | räumliches Denken | 1–10 min | ✅ |
| **Towers / Skyscrapers** | Zahlenraster mit Sichtbarkeitsregeln lösen | kombinatorische Logik | 5–20 min | ✅ |
| **Minesweeper ohne Glück** | Nur garantiert lösbare Felder | probabilistisches/constraint Denken | 2–15 min | ✅ |
| **Circuit Puzzle** | Leitungen drehen, sodass ein funktionierendes Netz entsteht | räumliche Logik, Graphen | 2–10 min | ✅ |

Davon würde ich einige besonders hervorheben.

##### 1. Constraint Grid

Das wäre eine modernere Variante der klassischen Einstein-Rätsel.

Beispiel:

> Anna, Ben und Clara besitzen jeweils ein Tier und wohnen jeweils in einer anderen Etage.  
> Anna wohnt nicht oben.  
> Die Person mit der Katze wohnt über Ben.  
> Clara besitzt keinen Hund.

Der Nutzer füllt eine kleine Matrix aus:

- ✓ möglich/bestätigt
- × ausgeschlossen

Der interessante Teil: Die Rätsel lassen sich automatisch generieren und anschließend von einem Solver auf **Eindeutigkeit** prüfen.

Das macht das Spiel praktisch unendlich erweiterbar, ohne auf zufällige oder unfaire Rätsel angewiesen zu sein.

**Sehr guter Kandidat für deine App.**

---

##### 2. Logic Path

Eine Mischung aus Labyrinth und Programmierung.

Der Spieler steuert nicht direkt eine Figur, sondern definiert vorher eine Sequenz:

`↑ ↑ → ↓ →`

Dann wird sie ausgeführt.

Später kommen Bedingungen hinzu:

> Falls Feld rot → links drehen  
> Falls Wand → weiter geradeaus

Damit kannst du langsam Konzepte einführen wie:

- Algorithmen
- Bedingungen
- Schleifen
- Funktionen
- Optimierung

Das kann sehr unterhaltsam werden, ohne wie ein Programmierkurs zu wirken.

---

##### 3. Minimal Proof

Hier bekommt man eine Behauptung und einige Regeln.

Zum Beispiel:

```
A → B
B → C
A
```

Aufgabe:

> Beweise C mit möglichst wenigen Schritten.

Später könnte das deutlich spielerischer dargestellt werden:

```
Schlüssel öffnet Tür
Tür führt zum Raum
Schlüssel vorhanden
```

oder sogar als grafisches Node-System.

Trainiert:

- formale Logik
- Kausalitätsketten
- strukturiertes Argumentieren

Für eine Zielgruppe mit technischem Interesse wäre das vermutlich ziemlich attraktiv.

---

##### 4. Systems Puzzle

Das wäre etwas ungewöhnlicher.

Der Spieler bekommt ein kleines System:

```
Tank A → Tank B
Tank B → Tank C

Ventil 1 steuert A→B
Ventil 2 steuert B→C
```

Ziel:

> Fülle C mit genau 4 Litern.

Später können hinzukommen:

- Rückkopplungen
- begrenzte Ressourcen
- Schalter
- Verzögerungen
- Prioritäten

Damit trainierst du eher **Systemdenken** als klassische Puzzle-Logik.

Das würde deine Sammlung deutlich von gewöhnlichen Puzzle-Apps unterscheiden.

---

##### 5. Debug the System

Man sieht ein System oder einen kleinen Algorithmus, der eigentlich funktionieren sollte.

Beispiel:

```
Input: 5

x = input
while x > 0:
    x = x + 1
```

Frage:

> Warum terminiert das Programm nicht?

Aber das muss nicht als Code auftreten.

Beispiel:

> Eine Fabrik produziert 10 Einheiten pro Minute.  
> Ein Lager transportiert 8 Einheiten pro Minute ab.  
> Warum läuft das Lager irgendwann über?

Später:

> Ändere genau **eine** Regel, um das Problem zu beheben.

Das trainiert Fehlersuche statt nur Konstruktion. Das ist überraschend selten in Spielen.

---

##### 6. Graph Detective

Du hast ein Netzwerk aus Punkten und Kanten.

Beispielsweise:

- Städte und Straßen
- Computer und Netzwerkverbindungen
- Menschen und Kommunikationswege

Aufgaben:

> Welche Verbindung muss ausfallen, damit A nicht mehr mit B verbunden ist?

oder:

> Füge genau eine Verbindung hinzu, damit das Netzwerk redundant wird.

Damit lassen sich spielerisch Themen vermitteln wie:

- shortest path
- connectivity
- redundancy
- bottlenecks
- graph traversal

Und das ohne sichtbare Mathematik.

---

##### 7. Rule Discovery

Das halte ich ebenfalls für sehr interessant.

Der Spieler sieht Beispiele:

```
2 → 4
3 → 6
5 → 10
```

und muss die Regel erkennen.

Aber interessanter wären mehrdeutige Fälle:

```
2 → 4
3 → 9
4 → 16
```

Dann kann der Spieler selbst Tests durchführen:

> Was ergibt 5?

Das Spiel antwortet:

`25`

Der Spieler versucht mit möglichst wenigen Experimenten die Regel herauszufinden.

Das trainiert explizit **wissenschaftliches Hypothesentesten**.

Man könnte sogar bewerten:

> Wie viel Information liefert dein nächstes Experiment?

Das wäre fast ein spielerischer Einstieg in **Value of Information**.

---

##### 8. Black Box

Noch konsequenter wäre:

```
Input → ??? → Output
```

Der Spieler darf Eingaben auswählen.

Zum Beispiel:

```
1 → 3
2 → 5
4 → 9
```

und muss herausfinden:

`f(x)=2x+1`

Später können es sein:

- boolesche Funktionen
- kleine Zustandsautomaten
- Sortierregeln
- Filter
- mehrdimensionale Inputs

Das kann von sehr leicht bis extrem anspruchsvoll skalieren.

---

#### Besonders passend finde ich außerdem Meta-Puzzles

Du könntest Spiele nicht komplett isolieren.

Beispielsweise bekommt man in einem Puzzle:

> `A = 7`

In einem anderen:

> `B = 3`

und ein späteres Rätsel nutzt:

> `A × B`

Das erzeugt Progression, ohne künstliche Progression wie XP oder Daily Rewards.

Man löst schlicht immer komplexere Probleme.

#### Eine mögliche Startsammlung

Für eine erste Version würde ich nicht 30 Spiele bauen, sondern etwa diese 8:

1. **Sokoban** – räumliche Planung  
2. **Nonogram** – Deduktion  
3. **Constraint Grid** – klassische Logik  
4. **Black Box** – Hypothesenbildung  
5. **Logic Path** – algorithmisches Denken  
6. **Graph Detective** – Netzwerke/Systeme  
7. **Debug the System** – Fehlersuche  
8. **Mastermind** – kurze Hypothesentests  

Damit deckst du bereits sehr unterschiedliche Denkprozesse ab.

##### Was ich bewusst nicht einbauen würde

Nicht unbedingt schlechte Spiele, aber sie passen weniger zu deinem Ziel:

- Sudoku als Hauptfeature — extrem übersättigt
- Memory — eher Gedächtnistraining als Problemlösen
- Reaktionsspiele — kaum Transfer
- Wordle-Klone — oft eher Sprach-/Wissensspiel
- endlose Match-3-Spiele
- Idle Games
- tägliche Aufgaben als Voraussetzung
- künstliche XP/Coins
- zufällige Difficulty-Spikes

Ein **Streak-Zähler** wäre für dein Konzept sogar kontraproduktiv.

#### Technisch ist fast alles davon problemlos downloadbar

Wenn du mit „Webapp“ eine PWA meinst, kannst du praktisch alle oben genannten Spiele vollständig lokal ausführen.

Typische Architektur:

```text
PWA
├── UI
├── Game Engine
├── Puzzle Generator
├── Solver / Validator
├── LocalStorage / IndexedDB
└── Service Worker
```

Damit funktioniert die App nach einmaligem Laden auch offline.

Bei generierten Rätseln kannst du sogar:

```text
Generator
    ↓
Puzzle
    ↓
Solver
    ↓
genau eine Lösung?
    ├─ nein → verwerfen
    └─ ja → anzeigen
```

Damit brauchst du keinen Server.

Die wichtigste **Limitation** gäbe es bei Spielen, die ein LLM oder externe Multiplayer-Komponenten verwenden. Beispielsweise ein frei formuliertes Deduktionsspiel mit KI-Charakteren wäre ohne lokales Modell nicht vollständig offline. Solche Spiele würde ich trotzdem nicht grundsätzlich ausschließen, sondern in der App klar als **„requires internet“** kennzeichnen.

Ein aus meiner Sicht besonders starkes Alleinstellungsmerkmal wäre, die Sammlung nicht nach Spielen zu kategorisieren, sondern nach **Denkfähigkeiten**:

**Deduction · Planning · Systems Thinking · Hypothesis Testing · Algorithms · Spatial Reasoning · Debugging**

Dann ist die App weniger eine zufällige Puzzle-Sammlung und eher eine Art **„Playground for Thinking“** – ohne daraus ein pseudowissenschaftliches Gehirntraining zu machen.


---

## Prompt 2

> Okay, lass uns alle nehmen, wenn mir etwas nicht gefällt, kann ich es später wieder raus nehmen.
> Bitte auch gedächniss training integrieren und vorschlagen. mindestens memory und auch etwas um gesichter und namen zu lernen.
> Ziel ist kein USP (meine anforderungen erlauben keine monetarisierung), sondern ein produktiver zeitvertreib der mich nicht in doom scrolling oder dauer rewards fängt und mir zeit stiehlt.
> Sind die vorschläge nur gefühlt mehrwert generierend und so vermarktbar oder gibt es hier nachweise ?
> gibt es möglichkeit ki spiele kostenlos zu integrieren oder wäre eine api notwendig ?
> für circuit puzzel gerne eine laser version ergänzen.
> gerne hätte ich auch etwas strategisches.
> z.b. einen 2D c&c clone, um zeit constraints zu lösen sm besten rundenbasiert.
> die grafischen elemente könnte man recyclen für ein tower defense spiel.
> ggf. auch eine kombination aus td und c&c.
> gerne hätte ich noch etwas zum trainieren/fördern von aufmerksamkeit spanne und adressaten gerechter kommunikation.


### Response 2

Ja. Mit deiner Zielsetzung würde ich die Leitlinie etwas verändern:

> **Die App soll nicht versprechen, dich „schlauer“ zu machen. Sie soll Zeit, die sonst leicht in passiven Konsum fließt, durch aktive kognitive Tätigkeit ersetzen.**

Dafür spricht wissenschaftlich deutlich mehr als für klassische „Brain Training improves IQ“-Claims.

#### 1. Was ist tatsächlich wissenschaftlich belegt?

Die unbequeme Antwort lautet: **Bei vielen Denkspielen ist der Nutzen real, aber spezifischer als das Marketing suggeriert.**

Eine Meta-Analyse von 2026 über 133 Studien und 14.245 Personen fand kleine positive Zusammenhänge bzw. Trainingseffekte bei Gedächtnis, räumlichen Fähigkeiten, visueller Aufmerksamkeit, kognitiver Kontrolle und Intelligenzmaßen. Die Effekte sind aber klein und heterogen. 

Das große Problem ist **Far Transfer**:

> Wenn du Sokoban spielst, wirst du ziemlich sicher besser in Sokoban und ähnlichen Planungsproblemen. Daraus folgt aber nicht automatisch, dass du anschließend allgemein intelligenter bist oder bessere geschäftliche Entscheidungen triffst.

Meta-Analysen zu Working-Memory-Training finden große Verbesserungen auf den trainierten Aufgaben, kleinere Effekte auf ähnliche Aufgaben und praktisch keinen überzeugenden Transfer auf Intelligenz, Lesen, Mathematik oder andere weit entfernte Fähigkeiten.  Eine umfangreiche methodische Kritik kommt sogar zum Schluss, dass robuster Far Transfer aus allgemeinem Cognitive Training bislang kaum nachweisbar ist. 

Ich würde die Spiele deshalb so klassifizieren:

| Kategorie | Was wir vernünftig behaupten können | Evidenz |
|---|---|---:|
| Gedächtnisaufgaben | trainieren genau diese Erinnerungsleistung | 🟢 gut |
| Gesichter + Namen | konkrete Lernstrategien können helfen | 🟢 gut |
| räumliche Logik | verbessert meist ähnliche räumlich-logische Aufgaben | 🟢 gut |
| Aufmerksamkeit | spezifische Aufmerksamkeitsleistungen trainierbar | 🟡–🟢 |
| Strategie | Planung/Task-Switching werden stark beansprucht; Transfer möglich, aber unsicher | 🟡 |
| Problemlösen | gute Übung im jeweiligen Problemraum | 🟡 |
| Kommunikation | konkrete Kommunikationsfähigkeiten können direkt geübt werden | 🟡–🟢 |
| allgemeine Intelligenz | „macht dich schlauer“ | 🔴 nicht seriös belegbar |
| generelle Aufmerksamkeitsspanne | allgemeiner dauerhafter Transfer | 🔴/🟡 schwach belegt |

Das stört dein Konzept aber kaum. Dein Vergleich ist nicht:

> Spiel vs. nichts.

Sondern eher:

> **15 Minuten aktives Problemlösen vs. 15 Minuten Shorts scrollen.**

Und dafür muss Sokoban nicht deinen IQ erhöhen, um die sinnvollere Aktivität zu sein.

---

### 2. Master-Liste der Spiele

Ich würde zunächst wirklich alle aufnehmen und später aussortieren.

| Bereich | Spiel |
|---|---|
| Logik | Sokoban |
| | Bridges / Hashi |
| | Slitherlink |
| | Nonogram |
| | Einstein / Constraint Grid |
| | Mastermind |
| | Lights Out |
| | River Crossing |
| | Rush Hour |
| | Skyscrapers |
| | deterministisches Minesweeper |
| räumliches Denken | Circuit Puzzle |
| | **Laser Circuit / Mirrors** |
| Algorithmen | Logic Path |
| | Minimal Proof |
| Systeme | Systems Puzzle |
| | Debug the System |
| | Graph Detective |
| wissenschaftliches Denken | Rule Discovery |
| | Black Box |
| Gedächtnis | klassisches Memory |
| | **Faces & Names** |
| | Spatial Memory |
| | Sequence Memory |
| | Prospective Memory |
| | Association/Mnemonic Game |
| | optional N-back |
| Aufmerksamkeit | Signal Watch |
| | Deep Reading |
| | Distractor Control |
| | Peripheral Search |
| Kommunikation | Audience Switch |
| | Compression Challenge |
| | Briefing Game |
| | Ambiguity Detector |
| Strategie | **Turn-based C&C** |
| | Tower Defense |
| | **C&C/TD Hybrid** |

Damit hättest du schon ungefähr 30 verschiedene Spielmodi.

---

### 3. Gedächtnis

#### Memory

Das klassische Karten-Memory würde ich definitiv aufnehmen.

Es trainiert unmittelbar:

- Positionserinnerung
- visuelles Arbeitsgedächtnis
- Abruf
- Strategie beim Enkodieren

Ich würde allerdings Varianten einbauen.

**Bild → Bild**

klassisches Memory.

**Wort → Bild**

z. B. `Birke ↔ Bild einer Birke`.

**Begriff → Definition**

z. B.

`Opportunity Cost ↔ Wert der besten nicht gewählten Alternative`

Damit wird aus demselben Spielprinzip optional ein echtes Lernwerkzeug.

---

### 4. Faces & Names

Das gefällt mir besonders, weil es eine sehr konkrete Alltagsfähigkeit ist.

Zum Beispiel erscheinen:

**Sarah – 34 – Architektin**

mit einem synthetischen Gesicht.

Später:

> Wie heißt diese Person?

Noch später:

> Welche Person war Sarah?

Oder:

> Sarah arbeitet als …?

Wichtig wäre aber, nicht nur stupide Wiederholung zu verwenden.

Eine randomisierte Studie von 2026 fand für das Lernen von Gesicht-Namens-Zuordnungen bessere Ergebnisse durch **mnemonische Strategien** als durch einfaches schrittweises Cueing; der Vorteil war auch einen Monat später messbar.  Frühere Studien zeigen zudem Vorteile, wenn Namen semantisch verarbeitet, Gesichtsmerkmale bewusst analysiert und Assoziationen selbst erzeugt werden. 

Das Spiel könnte deshalb fragen:

> Was fällt dir an Sarahs Gesicht auf?

und danach:

> Baue selbst eine Assoziation zu „Sarah“.

Zum Beispiel:

**Sarah → Sahara → sandfarbene Jacke**

Die App sollte die Assoziation nicht zwingend selbst erzeugen. Das **Selbsterzeugen** scheint ein wichtiger Teil des Lernens zu sein.

Das ist eines der Spiele, bei denen ich relativ guten realen Nutzen erwarten würde.

---

### 5. Prospective Memory

Das würde ich zusätzlich aufnehmen.

Es trainiert:

> „Wenn X passiert, muss ich Y machen.“

Beispiel:

> Sobald irgendwo ein gelbes Fahrzeug erscheint, drücke 🔔.

Dann macht man zwei Minuten lang eine andere Aufgabe.

Plötzlich erscheint das gelbe Fahrzeug.

Das entspricht eher Dingen wie:

> „Wenn ich nach Hause komme, muss ich den Brief einwerfen.“

als klassisches Memory.

---

### 6. Laser Circuit

Das würde ich als eigene Variante des Circuit-Puzzles machen.

Beispiel:

```text
Laser ───► / ───► \
               │
               ▼
             Target
```

Elemente:

- Spiegel
- Splitter
- Farbfilter
- Prismen
- Einweg-Spiegel
- Sensoren
- Schalter
- Blocker

Später:

```text
Red + Blue → Purple target
```

oder:

> Triff drei Sensoren gleichzeitig.

Das eröffnet sehr viele logisch-räumliche Puzzletypen.

Und es ist grafisch wesentlich attraktiver als klassische Leiterplatten.

---

### 7. Das Strategiespiel: Turn-based C&C

Die Idee finde ich für deine Anforderungen besser als ein echtes RTS.

Ich würde daraus ungefähr Folgendes machen:

##### **Tactical Command**

2D-Karte, beispielsweise 30 × 30 Felder.

Du hast:

```text
Base
Harvester
Infantry
Tank
Artillery
Engineer
Scout
```

sowie:

```text
Power
Resources
Vision
Terrain
Range
Armor
```

Aber alles ist **rundenbasiert**.

Eine Runde könnte z. B. sein:

> Du darfst 8 Aktionen durchführen.

Damit verschwindet die Echtzeitkomponente von C&C.

Das Interessante wird:

- Ressourcenallokation
- Exploration
- Positionierung
- Opportunity Costs
- Vorausplanung
- Produktion
- Verteidigung vs. Expansion

Und du kannst jederzeit schließen.

Es gibt tatsächlich zumindest einzelne experimentelle Hinweise auf kognitive Effekte von Strategiespielen: In einer randomisierten Studie spielten Nicht-Gamerinnen 40 Stunden StarCraft; bestimmte Varianten verbesserten anschließend Maße kognitiver Flexibilität stärker als die Kontrollbedingung. Die Studie war aber klein und die Population sehr spezifisch, also kein Beweis dafür, dass ein C&C-Klon allgemein die Exekutivfunktionen verbessert. 

Für mich wäre der Nutzen hier eher unmittelbar:

**Das Spiel selbst besteht aus Planung und Ressourcenentscheidungen.**

Das genügt.

---

### 8. Tower Defense und C&C zusammenführen

Hier kannst du technisch sehr viel wiederverwenden:

```text
Map
Units
Turrets
Projectiles
Pathfinding
Damage System
Fog of War
Terrain
Sprite System
Effects
UI
AI
```

Daraus entstehen gleich drei Spiele.

##### Tower Defense

Klassisch:

```text
Base ← Enemy Waves
```

Aber ohne Endless Mode.

Beispielsweise:

> Überlebe genau 12 Runden mit 1.000 Credits.

---

##### C&C

Du kontrollierst mobile Einheiten und Produktion.

---

##### Hybrid

Das könnte sogar das interessanteste sein.

Beispiel:

Du verteidigst deine Basis gegen periodische Angriffe.

Gleichzeitig kannst du:

- Scouts schicken
- Ressourcenfelder erobern
- gegnerische Produktionsstätten ausschalten
- defensive Türme bauen
- mobile Armee einsetzen

Damit entsteht die Entscheidung:

> Investiere ich meine 500 Credits in zwei Panzer oder einen weiteren Verteidigungsturm?

Genau solche Trade-offs machen Strategiespiele interessant.

---

### 9. Aufmerksamkeitsspanne

Hier würde ich sehr vorsichtig mit Versprechen sein.

Es gibt durchaus Attention-Training. Ein relativ gut untersuchtes Paradigma ist das **Useful Field of View Training (UFOV)**. Eine Meta-Analyse über 17 randomisierte Studien fand Verbesserungen bei Verarbeitungsgeschwindigkeit und Aufmerksamkeit und sogar einige reale funktionelle Effekte, allerdings hauptsächlich bei älteren Erwachsenen. 

Das lässt sich also nicht einfach auf einen gesunden 30- oder 40-Jährigen übertragen.

Ich würde drei Spiele bauen.

##### Signal Watch

Ein sehr ruhiges Spielfeld.

Viele irrelevante Dinge geschehen.

Selten erscheint ein relevantes Signal.

Du musst es erkennen.

Nicht hektisch und keine Reward-Kaskade.

Beispielsweise:

```text
Session:

3 min
5 min
8 min
12 min
```

Nicht:

> „Noch eine Runde! Bonus ×7!“

---

##### Deep Read

Das halte ich für dein eigentliches Ziel sogar für besser.

Du bekommst einen interessanten Text mit beispielsweise 800 Wörtern.

Danach Fragen zu:

- Kernaussage
- Details
- Argumentstruktur
- Widersprüchen

Später:

> Schreibe die Kernaussage in einem Satz.

Damit übst du gleichzeitig:

**Aufmerksamkeit + Verständnis + Kommunikation.**

---

##### Distractor Control

Du bearbeitest eine einfache, längere Aufgabe.

Dabei erscheinen absichtlich irrelevante Hinweise:

```text
+1 Punkt!
Neue Nachricht!
Bonus!
Klicke hier!
```

Die korrekte Aktion ist:

> **gar nichts tun.**

Das finde ich konzeptionell sehr passend für eine App gegen Doomscrolling.

---

### 10. Kommunikation

Hier sehe ich großes Potenzial.

#### Audience Switch

Du bekommst eine Information:

> Eine Datenbankmigration benötigt voraussichtlich zwei zusätzliche Tage, weil die Tests einen bisher unbekannten Fehler bei Sonderzeichen gefunden haben. Es besteht kein Datenverlust.

Dann:

> Erkläre das einem Entwickler.

Danach:

> Erkläre das dem Projektleiter.

Danach:

> Erkläre es einem Kunden.

Oder:

> Erkläre Quantenverschränkung einem Achtjährigen.

Das Ziel ist nicht nur Vereinfachung.

Es geht darum:

- Was weiß der Empfänger?
- Was interessiert ihn?
- Welche Entscheidung muss er treffen?
- Welche Information braucht er **nicht**?

Das ist eine sehr reale Kommunikationskompetenz.

---

#### Compression Challenge

Die gleiche Information muss dargestellt werden als:

```text
500 Wörter
↓
100 Wörter
↓
3 Bulletpoints
↓
1 Satz
```

Oder umgekehrt:

> Erkläre diesen Einzeiler so, dass jemand ihn tatsächlich umsetzen kann.

---

#### Ambiguity Detector

Beispiel:

> „Bitte mach das morgen fertig.“

Frage:

> Welche Information fehlt?

Mögliche Antwort:

- Was genau?
- bis wann morgen?
- welches Ergebnisformat?
- welche Priorität?

Das trainiert etwas, das bei Kommunikation oft wichtiger ist als schöne Formulierungen:

**fehlende Information erkennen.**

---

### 11. Hier würde KI tatsächlich Mehrwert liefern

Und: **Nein, du brauchst dafür nicht zwingend eine API.**

Mittlerweile können kleine Sprachmodelle direkt im Browser laufen.

**WebLLM** führt LLMs vollständig im Browser mittels WebGPU aus und unterstützt unter anderem Modelle aus den Familien Qwen, Llama, Gemma, Phi und Mistral. Es gibt keine notwendige Serverkomponente. 

Auch **Transformers.js** kann Modelle direkt mit WebGPU oder alternativ teilweise WASM im Browser ausführen. 

Damit wäre beispielsweise möglich:

```text
Web-App
   │
   ├── normale Spiele
   │
   └── AI Engine
          │
          └── Qwen/Phi/Gemma lokal
```

Nach dem ersten Modelldownload kann WebLLM Modelle im Browser-Cache, IndexedDB oder OPFS halten; Service Worker werden ebenfalls unterstützt. 

##### Der Haken

Ein lokales LLM bedeutet:

**größerer Download + RAM/VRAM-Verbrauch + langsamere Mobilgeräte.**

Und WebGPU ist noch nicht universell: Hugging Face bezifferte die weltweite Browserunterstützung im März 2026 auf ungefähr 85 %. 

Deshalb würde ich die Architektur so bauen:

```text
Core games
100 % offline
keine KI nötig

        ↓

optional AI module
lokales kleines Modell

        ↓

optional später
Cloud-LLM/API
```

Also **AI enhancement, nicht AI dependency**.

---

### 12. Besonders für Kommunikation braucht man nicht einmal zwingend ein großes LLM

Du könntest einen Großteil deterministisch bewerten:

```text
Satzlänge
Wortanzahl
Jargon
Lesbarkeit
passive Sprache
wichtige Begriffe enthalten?
Call-to-action vorhanden?
Risiko genannt?
Entscheidungsbedarf genannt?
```

Dazu ein kleines lokales Embedding-Modell, um semantisch zu prüfen:

> Hat der Nutzer die wesentlichen Aussagen tatsächlich erwähnt?

Solche kleineren Transformer-Modelle kann Transformers.js problemlos direkt im Browser betreiben. 

Ein LLM könnte danach optional qualitative Rückmeldung liefern.

Ich würde **niemals nur ein LLM sagen lassen „8/10 Kommunikation“**, weil diese Bewertung zu instabil ist.

---

### 13. Ein wichtiges Designprinzip für deine App

Ich würde sogar explizit Funktionen einbauen, die normale Game-Designer vermeiden würden:

```text
✓ jederzeit pausierbar
✓ kein Daily Reward
✓ keine Streak
✓ keine Lootbox
✓ keine Coins fürs Wiederkommen
✓ kein Endless Feed
✓ kein automatisches „Next Game“
✓ kein FOMO
✓ keine Push-Nachrichten
✓ keine Variable-Ratio-Rewards
```

Nach einem Spiel:

> **Finished.**

Darunter vielleicht:

`Noch eine Aufgabe`

aber nicht automatisch starten.

Und bei längeren Sessions:

> „Du spielst seit 20 Minuten.“

Nicht als paternalistische Sperre, sondern schlicht als Information.

Das wäre für mich der eigentliche rote Faden des Projekts:

**Spiele, die deine Aufmerksamkeit benutzen, ohne darum zu kämpfen, sie möglichst lange zu behalten.**

Und wissenschaftlich würde ich die Produktbeschreibung bewusst auf **„practice“**, **„challenges“**, **„active leisure“** und **„skill-specific training“** beschränken – nicht auf „improve your brain“. Das passt deutlich besser zum tatsächlichen Stand der Forschung.


---

## Prompt 3

> Die memory varrianten finde ich sehr gut, hier könnte sprachen lernen inkludiert werden, ggf. sogar audio.
> Geographie, fachvokabular (ki, coorporate, etc.), etc.
> webllm finde ich interessant, aber ist das wirklich leistungsfähig genug ? wie viel speicher/zeit wird benötigt ?
> c&c sollte kein reiner klon sein, sondern eine neue komponente enthalten. also neue mechanik oder einheit(art) oder ähnliches oder alles davon.
> der td + c&c merge stelle ich mir so vor.
> basis bau + towerbau. gegner macht das gleiche, produktionsstätten bauen angrifswellen.
> dann 4 modi, externe angriffswelle klein:
> Splitt path, verteilt auf eigene basis und gegner. verteidigung nur durch tower.
> groß:
> gleich, aber man selber und der gegner schicken eine eigene angriffswelle zur verteidigung gegen die externe welle. die größe wird durch Produktionskapazitäten bestimmt. man hilft sich indirekt, überlebende gegner kämpfen mit den jeweiligen towern.
> dann vs. klein:
> Man selbst und gegner schicken nicht interagierende (ggf. nacheinander) angriffswellen verteidigen mit towers.
> groß:
> die wellen laufen ineinander und nur überlebende einheiten (also nur eine seite) greifen weiter an und müssen mit towern verteidigt werden.
>
> Für TD selbst sollten auch mechanismen über 2-3 verschiedene tower und upgrades enthalten sein. aber auch nicht nur el-td.
>
> Gut ich denke damit haben wir jetzt einiges zusammen.
> das will ich umsetzen lassen.
> 1 orcestrator, subagenten je für tests und mini spiele, bei den größeren spielen eigene neue kontexte, gemeinsammes gitrepo, deployment auf cloudflare. Methoden wie tdd, sampling mutation testimg, fuzzing, etc.
> modularer aufbau jedes spiel sollte auch alleine funktionieren. webapp und installation als pwa möglich.
> umsetzung lasse ich durch einen agenten in der cloud machen, ich werde ihm diese Unterhaltung als Referenz geben.


### Response 3

Ja. An diesem Punkt würde ich die Unterhaltung als **Produktvision** behandeln und dem Agenten zusätzlich eine klarere technische Spezifikation geben. Ein paar Entscheidungen würde ich vorab festziehen.

#### WebLLM: brauchbar, aber gezielt einsetzen

WebLLM ist inzwischen technisch ernstzunehmend: Inferenz läuft vollständig über WebGPU im Browser, unterstützt Streaming, strukturierte JSON-Ausgabe, Worker/Service Worker und aktuelle Modellfamilien. 

Für unsere Anwendung sehe ich drei Größenklassen:

| Modellklasse | Download grob | GPU/RAM grob | Für uns |
|---|---:|---:|---|
| ~0,3–0,6B | 0,2–0,4 GB | ~0,4–1 GB | Klassifikation, sehr einfache Bewertung |
| ~1–2B | ~0,8–1,2 GB | ~1,5–2 GB | **Sweet Spot** |
| ~3–4B | ~2 GB | ~2,3–4 GB | bessere Texte, mobil problematischer |
| 7–8B | ~4–5 GB | ~4–6+ GB | Desktop, für PWA ungeeignet als Default |

Konkret hat das derzeitige WebLLM-kompatible Qwen3-0.6B-q4-Modell etwa **352 MB**, Qwen3-1.7B etwa **984 MB**. Zum Vergleich gibt WebLLM für ein 3B-Llama-Modell rund 2,26 GB VRAM und für 7–8B-Modelle meist 4–6 GB an. 

Bei 100 Mbit/s wären die reinen theoretischen Downloadzeiten ungefähr:

- 352 MB → ~28 s
- 984 MB → ~79 s

Danach liegt das Modell im Browsercache und muss nicht jedes Mal neu heruntergeladen werden. WebLLM unterstützt dafür Cache/IndexedDB sowie Worker und Service Worker. 

Die tatsächliche Inferenzgeschwindigkeit schwankt allerdings extrem. Ein dokumentierter WebLLM-Test eines 3B-Modells kam auf einem AMD-680M-System auf ~18 Token/s, auf einem Pixel 8 Pro dagegen nur auf rund 5 Token/s. Das ist kein kontrollierter allgemeiner Benchmark, zeigt aber die Größenordnung und vor allem die Geräteabhängigkeit. 

**Daraus würde ich eine Architekturentscheidung machen:** WebLLM ist ein optional herunterladbares „AI Pack“. Die App selbst benötigt es nie.

Für Kommunikation wären 1–2B lokal interessant für:

- Zielgruppenfeedback
- Erkennen fehlender Informationen
- Bewertung einer Zusammenfassung
- Generieren neuer Kommunikationsszenarien
- semantischen Vergleich mit einer Musterlösung

Die wichtigen Messwerte wie Länge, Jargon, Kernaussagen oder Lesbarkeit sollten trotzdem deterministisch berechnet werden.

---

### Memory wird eigentlich ein Lernsystem

Hier würde ich deinen Gedanken weiterführen: **Memory ist nur eine Präsentationsform eines generischen Lernkarten-Systems.**

Ein Datensatz könnte enthalten:

```text
front:
    text
    image
    audio

back:
    text
    image
    audio

metadata:
    category
    difficulty
    language
    tags
```

Damit bekommen wir ohne neue Game-Engine:

- Bild ↔ Bild
- Gesicht ↔ Name
- Englisch ↔ Deutsch
- Deutsch ↔ Französisch
- Wort ↔ Aussprache
- Flagge ↔ Land
- Land ↔ Hauptstadt
- Land ↔ Position auf Karte
- Fachbegriff ↔ Definition
- KI-Begriff ↔ Erklärung
- Corporate Buzzword ↔ Bedeutung
- Formel ↔ Bedeutung
- Person ↔ Funktion

##### Audio

Drei Ebenen:

1. mitgelieferte Audiodateien → garantiert offline
2. Browser-/OS-Sprachausgabe → praktisch kostenlos, Qualität/Offline-Verfügbarkeit geräteabhängig
3. später optionale Content-Packs

Sehr sinnvoll wäre auch:

> **Eigene Decks importieren**

beispielsweise CSV/JSON.

Damit kann dieselbe App plötzlich auch persönliche Fachvokabeln lernen.

Spaced Repetition kann man ergänzen, **aber ohne Streaks, Notifications und künstlichen Druck**. Einfach ein optionaler „Wiederholen“-Modus.

---

### Strategie: kein C&C-Klon

Hier würde ich deine Basiskomponente nehmen, aber einen eigenen Kern hinzufügen.

Mein Favorit wäre:

#### Command Network + simultaneous turns

Einheiten erhalten Befehle nicht magisch.

```text
HQ
 │
 ├── Relay
 │     ├── Tank
 │     └── Infantry
 │
 └── Tower
       └── Artillery
```

Einheiten benötigen Verbindung zum eigenen **Command Network**.

Innerhalb des Netzes kannst du in jeder Runde neue Befehle geben.

Außerhalb:

> Einheit führt ihre zuletzt definierte Doktrin weiter aus.

Beispielsweise:

```text
Advance
Hold
Retreat below 30 % HP
Prioritize armor
Escort unit X
Seek cover
```

Das erzeugt interessante neue Einheiten:

- Relay Vehicle
- Command Vehicle
- Scout Drone
- Jammer
- Hacker/EW
- Engineer

Ein Jammer könnte beispielsweise einen Teil des gegnerischen Command Networks unterbrechen.

Damit entsteht etwas, das C&C so nicht hat:

> **Information und Kommunikation werden selbst zur Ressource.**

Und es passt sehr gut zum Problemlösungscharakter der gesamten App.

##### Zweite Besonderheit: simultane Auflösung

Beide Spieler planen:

```text
PLAN
↓
LOCK
↓
RESOLVE
```

Erst danach werden die Befehle gleichzeitig ausgeführt.

Dadurch wird es eher:

**C&C × Into the Breach × Brettspiel**

als einfach ein langsames RTS.

---

### TD + Strategy Hybrid

Deine vier Modi würde ich exakt als Kern übernehmen.

#### External — Small

```text
        External wave
             │
          SPLITTER
          /      \
       50 %      50 %
        ↓          ↓
      YOU        ENEMY

     Towers only
```

Man hilft sich indirekt, weil ein schwacher Gegner auch weniger externe Einheiten vernichtet.

---

#### External — Large

Gleiche externe Welle.

Zusätzlich schicken beide Seiten eine mobile Verteidigungsarmee.

Produktionskapazität bestimmt deren Größe.

Überlebende Einheiten:

- kehren zurück
- oder verstärken die nächste Phase

Damit lohnt sich nicht einfach maximales Tower-Spamming.

---

#### VS — Small

Beide produzieren Angriffswellen.

```text
YOUR WAVE ─────────► enemy towers

enemy wave ────────► YOUR TOWERS
```

Die Wellen treffen sich nicht.

Damit ist es fast ein gegenseitiges Tower-Defense-Spiel.

---

#### VS — Large

Hier wird es interessant:

```text
YOUR ARMY ─────► ◄───── ENEMY ARMY
                  │
                battle
                  │
                  ▼
             survivors
                  │
                  ▼
             enemy base
```

Die Armeen kämpfen zuerst gegeneinander.

Nur die überlebende Seite erreicht die gegnerischen Verteidigungsanlagen.

Damit entstehen drei konkurrierende Investitionen:

```text
Production
     vs
Army quality
     vs
Static defense
```

Und zusätzlich:

```text
Economy
Command network
Research
```

Das kann ziemlich tief werden, obwohl die Runden kurz bleiben.

---

### Tower Defense nicht zu simpel

Ich würde zunächst ungefähr **5 Grundtypen** einbauen, nicht zwanzig.

##### Gun

billig, schnell, Allrounder.

Upgrades etwa:

```text
Gun
├── Gatling → Rate of fire
└── Cannon → Armor penetration
```

##### Artillery

langsam, Splash Damage.

```text
Artillery
├── Howitzer → range
└── Mortar → splash
```

##### Laser

kontinuierlicher Schaden.

```text
Laser
├── Focus → single-target DPS
└── Prism → chain/reflection
```

Damit kann gleichzeitig Technik aus dem Laser-Puzzle wiederverwendet werden.

##### Support

kein direkter Schaden.

Zum Beispiel:

- slow
- targeting bonus
- repair
- power
- command relay

##### Specialist

z. B.:

- EMP
- anti-air/drone
- jammer
- shield

Damit erhältst du schon interessante Kombinatorik.

---

### Gemeinsame Strategy Engine

Ganz wichtig für den Agenten:

Nicht bauen:

```text
tower-defense/
strategy/
hybrid/
```

mit drei unterschiedlichen Implementierungen.

Sondern:

```text
strategy-engine/
    map
    pathfinding
    units
    towers
    production
    projectiles
    combat
    economy
    command-network
    AI
    simulation
```

Darauf:

```text
TD mode
Strategy mode
Hybrid modes
```

Das spart später massiv Arbeit.

---

### Technische Architektur

Ich würde dem Agenten ungefähr diese Struktur vorgeben:

```text
repo/
│
├── apps/
│   └── web/
│
├── packages/
│   ├── game-core/
│   ├── ui/
│   ├── persistence/
│   ├── audio/
│   ├── ai/
│   ├── learning-content/
│   │
│   ├── games/
│   │   ├── sokoban/
│   │   ├── nonogram/
│   │   ├── mastermind/
│   │   ├── memory/
│   │   ├── faces-names/
│   │   ├── constraint-grid/
│   │   ├── ...
│   │   └── strategy/
│   │
│   └── testing/
│
└── e2e/
```

Jedes Spiel implementiert einen gemeinsamen Vertrag:

```text
GameModule

metadata()
initialize()
newGame(seed)
pause()
resume()
serialize()
restore()
reset()
dispose()
```

plus Capability Flags:

```text
offline
audio
webgpu
aiOptional
pauseable
typicalDuration
skills[]
```

Damit kann jedes Spiel:

- innerhalb der Haupt-App
- über eine direkte URL
- und prinzipiell als Standalone-Build

laufen.

---

### Determinismus als Architekturprinzip

Gerade mit deinen Testanforderungen würde ich soweit möglich **keinen impliziten Zufall** erlauben.

Statt:

```js
Math.random()
```

immer:

```text
seed → PRNG → game
```

Damit lässt sich jeder Bug reproduzieren:

```text
game = mastermind
seed = 719381723
difficulty = hard
```

Das ist für automatische Agentenentwicklung extrem wertvoll.

Beim Strategiespiel sollte sogar die komplette Simulation bei gleichem:

```text
seed + state + actions
```

bitgenau bzw. zumindest logisch deterministisch reproduzierbar sein.

---

### Testing

Deine Idee mit mehreren Testmethoden würde ich ausdrücklich festschreiben.

##### Für alle Spiele

**TDD**, wo Regeln klar spezifizierbar sind.

Dazu:

**Property-based testing / fuzzing**

Beispielsweise:

> Nach einem legalen Sokoban-Zug existiert der Spieler genau einmal.

oder:

> Ein generiertes Nonogramm darf nie mehr als die vorgesehene Lösung besitzen.

Geeignete Bibliothek im TS-Ökosystem beispielsweise `fast-check`.

##### Generated puzzles

Immer:

```text
Generator
↓
Independent Solver
↓
valid?
↓
unique?
↓
difficulty check
```

Generator und Validator sollten möglichst nicht dieselbe Implementierungslogik verwenden.

##### Mutation Testing

Nicht für jedes UI-File.

Sondern gezielt:

- Solver
- Combat Engine
- Score-/Regellogik
- Generatoren
- Persistence
- Command Network

Das ist dort sehr wertvoll.

##### E2E

Playwright:

- jedes Spiel öffnet
- neues Spiel starten
- pausieren
- Browser schließen/reload
- fortsetzen
- Offline-Modus
- Mobile viewport
- Desktop viewport
- Touch
- Keyboard

---

### AI-Tests

LLM-Ausgaben nie mit:

```text
expectedOutput === actualOutput
```

testen.

Stattdessen möglichst:

```text
JSON Schema
required concepts
forbidden concepts
length limits
deterministic metrics
semantic similarity thresholds
```

Und zusätzlich ein kleines golden evaluation set.

---

### Orchestrator + Subagents

Dein Ansatz passt hier sehr gut.

Ich würde ungefähr so arbeiten lassen:

```text
ORCHESTRATOR
│
├── Architecture Agent
├── Test/QA Agent
├── PWA/Platform Agent
├── UI Agent
│
├── Sokoban Agent
├── Memory Agent
├── Nonogram Agent
├── ...
│
├── Strategy Context
│   ├── Simulation Agent
│   ├── AI Agent
│   └── Balance/Test Agent
│
└── AI/WebLLM Context
```

Wichtig:

**Mini-Spiel-Agenten dürfen nicht eigenmächtig Shared Core APIs ändern.**

Änderungen an:

```text
game-core
strategy-engine
persistence
design system
```

gehen zurück an den Orchestrator.

Sonst zerfällt ein Multi-Agent-Repo sehr schnell.

Für größere Komponenten wie Strategy oder WebLLM würde ich genau wie du vorschlägst **einen frischen großen Kontext** starten und nur Architekturentscheidungen sowie Interfaces hineinreichen.

---

### Git

Ich würde Subagents über getrennte Branches oder besser Worktrees isolieren:

```text
main
develop

feature/memory
feature/sokoban
feature/laser
feature/strategy-engine
...
```

Integration nur wenn:

```text
lint
typecheck
unit tests
property tests
mutation threshold where configured
Playwright
build
```

grün sind.

---

### PWA

Die Kern-App sollte nach Installation vollständig offline funktionieren.

Content Packs werden optional geladen:

```text
Core App          ~small
Geography Pack
English Pack
AI Vocabulary Pack
Corporate Pack
Faces Pack
Audio Pack

AI Model          350 MB–1 GB+
```

Das WebLLM-Modell würde ich **niemals ungefragt precachen**.

Statt:

> „Lokale KI aktivieren – zusätzlicher Download 984 MB“

Das entspricht auch deiner Philosophie: keine Tricks, keine versteckten Kosten.

---

### Cloudflare

Für das heutige Cloudflare-Setup würde ich nicht starr „Pages“ vorgeben. Für eine reine SPA/PWA funktioniert Pages weiterhin problemlos und hat Git-basierte Deployments sowie Preview Deployments. 

Cloudflare empfiehlt inzwischen für neue Anwendungen aber verstärkt **Workers + Static Assets**; das passt mit dem aktuellen Vite-Plugin direkt zu SPAs und erlaubt später ohne Architekturwechsel einen kleinen Backend-Worker hinzuzufügen. 

Ich würde deshalb wählen:

> **Vite + TypeScript + Cloudflare Workers Static Assets + PWA**

und den Worker zunächst praktisch leer lassen.

---

#### Was ich dem Orchestrator als oberste Produktregel geben würde

*(Earlier draft of the brief, superseded by [`docs/spec/implementation-brief.md`](../spec/implementation-brief.md).)*

Das würde ich zusätzlich zur Unterhaltung an den Orchestrator geben. Es verhindert vor allem, dass ein Coding-Agent aus „baue viele Spiele“ spontan 25 isolierte React-Komponenten erzeugt und erst hinterher versucht, daraus eine Architektur zu machen.


---

## Prompt 4

> okay, gib mir noch einen guten namen für das projekt. (ggf. mehrere vorschläge)
> Ergänze noch:
> Schach, x-o, 4-gewinnt und mind. 2 point and klick advantures einmal angelent an king quest 8 Maske der ewigkeit und einmal an TimeShift (Kern elemente sollten problem lösen, rätzel lösen, kombinatorik etc. sein), bei timeshift explizit auch zeit komponentn (reise, pause, fast forward, slow, backward)
> Alle spiele sollten zu jeden zeitpunkt schließbar und später fortgesetzt werden können.
> Impressum bitte aus https://home-workout-65g.pages.dev/ übernehmen und nicht ins repo puschen. hier das repo zum vgl.
> https://github.com/hebecked/Home-Workout
> Unabhängig davon, dass das projekt für mich ist, wird das repo public sein und die webseite auch, es sollte jeder verstehen und nutzen können.
> Bitte wie home workout mehrere sprachen unterstützen.


### Response 4

Als Namen würde ich etwas wählen, das **nicht nach „Brain Training“ klingt**, weil das Projekt deutlich breiter wird: Logik, Lernen, Strategie, Adventures, Schach und Kommunikation.

| Name | Einschätzung |
|---|---|
| **Reasoned Play** | **Mein Favorit.** Seriös, international verständlich, breit genug. Tagline: *Games worth your attention.* |
| **Playful Reason** | Etwas eigenständiger und spielerischer. |
| **Worthwhile Play** | Trifft dein eigentliches Ziel sehr direkt: sinnvoller Zeitvertreib. |
| **Logic & Leisure** | Klingt gut, ist aber für Adventures und Lernen etwas eng. |
| **Useful Interlude** | Ungewöhnlich; betont den Ersatz für Doomscrolling und kurze Pausen. |
| **Thinking Grounds** | Eher wie ein digitaler Spielplatz für Denkspiele. |

**Reasoned Play** würde ich aktuell nehmen, z. B. als Repo `reasoned-play`. Ein schneller Namenscheck spricht außerdem dafür, einige naheliegende Alternativen nicht zu verwenden: „Quiet Arcade“, „Deliberate Games“, „ThinkBreak“ und „Thought Arcade“ werden bereits anderweitig verwendet. 

Ich habe außerdem Home Workout geprüft. Dort sind aktuell 16 UI-Sprachen umgesetzt – Deutsch, Englisch, Niederländisch, Spanisch, Französisch, Russisch, vereinfachtes Chinesisch, Koreanisch, Japanisch, Arabisch, Portugiesisch, Italienisch, Polnisch, Türkisch, Ukrainisch und Hindi – mit BCP-47-basiertem Sprachmodell und RTL für Arabisch. Genau dieses Grundprinzip würde ich wiederverwenden, wobei **UI-Sprache und Lern-/Inhaltssprache strikt getrennt** sein sollten. 

Hier ist die entsprechend vollständig aktualisierte Spezifikation:

*(The full brief is stored in [`docs/spec/implementation-brief.md`](../spec/implementation-brief.md).)*

Ein Detail würde ich dem Agenten besonders hervorheben: Home Workout hat bereits genau einige technische Prinzipien, die du hier wieder brauchst – reload-sichere Sessions, PWA/Offline-Support, 16 Sprachen, lokales Speichern sowie Playwright, Vitest und Stryker-Mutation-Testing. Das Repo kann daher als **Architektur-/Qualitätsreferenz** dienen, ohne dass Reasoned Play strukturell davon abhängig sein muss. 

