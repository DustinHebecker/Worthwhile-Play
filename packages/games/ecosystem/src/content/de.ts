import type { ContentText } from './types';

export const content: ContentText = {
  weeks: { one: '{n} Woche', other: '{n} Wochen' },
  species: {
    algae: { name: 'Grünalgen', about: 'Winzige Pflanzen, die im Wasser schweben. Sie wachsen schnell mit Nährstoffen und Licht; Wasserflöhe und Schnecken fressen sie. Viele Algen färben das Wasser grün und beschatten die Pflanzen darunter.' },
    bluegreen: { name: 'Blaualgen', about: 'Eigentlich Bakterien (Cyanobakterien). Sie wachsen langsam, brauchen nährstoffreiches Wasser und werden kaum gefressen – deshalb blühen sie, wenn sich Nährstoffe anhäufen.' },
    duckweed: { name: 'Wasserlinsen', about: 'Kleine schwimmende Blättchen. In nährstoffreichem Wasser bedecken sie die Oberfläche und beschatten alles darunter.' },
    pondweed: { name: 'Laichkraut', about: 'Unterwasserpflanzen, im Schlamm verwurzelt. Sie brauchen klares Wasser für Licht, nehmen den Algen Nährstoffe weg und bieten Wasserflöhen ein Versteck vor Fischen.' },
    fleas: { name: 'Wasserflöhe', about: 'Winzige Krebstiere (Daphnien), die Algen abweiden. Kleinfische fressen sie, aber im Laichkraut und im Schlamm bleiben viele außer Reichweite.' },
    snails: { name: 'Schlammschnecken', about: 'Sie fressen abgestorbene Pflanzenreste und ein paar Algen. Kleinfische fressen einige von ihnen.' },
    minnows: { name: 'Kleinfische', about: 'Sie jagen Wasserflöhe und einige Schnecken. Ihre Jungen brauchen etwa sechs Wochen zum Heranwachsen. Hechte fressen sie.' },
    pike: { name: 'Hechte', about: 'Ein großer Jäger, der Kleinfische frisst. Junge Hechte brauchen etwa zwanzig Wochen zum Heranwachsen.' },
    grass: { name: 'Gräser', about: 'Hoch und schnellwüchsig auf nährstoffreichem Boden. Sie beschatten die niedrigen Pflanzen und verbrauchen viel Wasser.' },
    flowers: { name: 'Wildblumen', about: 'Niedrige Pflanzen, die auf magerem Boden gut gedeihen. Sie brauchen Licht, deshalb verdrängt hohes Gras sie. Blattläuse und Kaninchen fressen sie.' },
    clover: { name: 'Klee', about: 'Eine niedrige Pflanze, die ihren Stickstoff selbst aus der Luft holt, auf reichem Boden weniger. Ihre abgestorbenen Blätter düngen den Boden für die Nachbarn. Kaninchen mögen sie am liebsten.' },
    aphids: { name: 'Blattläuse', about: 'Winzige Insekten, die Pflanzensaft saugen, vor allem an Wildblumen. Sie vermehren sich sehr schnell. Marienkäfer fressen sie.' },
    ladybirds: { name: 'Marienkäfer', about: 'Käfer, die Blattläuse fressen. Ihre Larven brauchen etwa drei Wochen zum Heranwachsen, deshalb reagieren sie verzögert auf mehr Blattläuse.' },
    rabbits: { name: 'Kaninchen', about: 'Sie fressen zuerst Klee, dann Wildblumen und Gras. Ihre Jungen brauchen etwa fünf Wochen zum Heranwachsen. Füchse jagen sie; einige sind in ihren Bauen immer sicher.' },
    foxes: { name: 'Füchse', about: 'Sie jagen Kaninchen. Junge Füchse brauchen etwa ein halbes Jahr zum Heranwachsen.' },
    worms: { name: 'Regenwürmer', about: 'Sie fressen abgestorbene Blätter und machen daraus wieder Nährstoffe, die Pflanzen nutzen können.' }
  },
  challenges: {
    'fleas-arrive': {
      title: 'Wasserflöhe kommen an',
      situation: 'Ein junger Teich hat nur Grünalgen. Wasserflöhe gelangen hinein, eingeschleppt von einem Vogel.',
      think: 'Wer frisst die Algen? Was passiert mit den Wasserflöhen, wenn die Algen weniger werden?',
      explain: 'Die Wasserflöhe vermehren sich an den Algen, bis sie so schnell fressen, wie die Algen nachwachsen. Von da an bestimmen die Wasserflöhe, nicht die Nährstoffe, wie viele Algen es gibt: ein ausgleichender Kreislauf (B1). Das Wasser wird klar und bleibt klar.',
      real: 'In echten Teichen sorgen Fische und Jahreszeiten meist dafür, dass es nicht so glatt läuft.'
    },
    'enrich-swings': {
      title: 'Mehr Futter für alle',
      situation: 'Starker Zufluss von einem Feld beginnt, einen Teich mit Algen und Wasserflöhen zu düngen.',
      think: 'Mehr Nährstoffe ernähren mehr Algen. Was machen die Wasserflöhe mit mehr Algen, und was machen die Algen dann?',
      explain: 'Mehr Nährstoffe lassen die Algen davonziehen; die Wasserflöhe folgen, fressen die Algen herunter und hungern dann; die Algen erholen sich, und alles beginnt von vorn. Reicheres Wasser ließ das System schwanken, statt es zur Ruhe kommen zu lassen. Ökologen nennen das das Paradox der Anreicherung (B1).',
      real: 'In echten Teichen dämpfen oder verändern viel mehr Arten und die Jahreszeiten diese Schwankungen.'
    },
    'fish-stocked': {
      title: 'Fische im Teich',
      situation: 'Jemand setzt Kleinfische in einen Teich, in dem es keine gab.',
      think: 'Fische fressen Wasserflöhe. Wer frisst die Algen, und was passiert mit ihnen?',
      explain: 'Die Fische fressen Wasserflöhe, also weiden weniger Wasserflöhe die Algen ab, und die Algen wachsen. Eine Änderung oben erreicht das untere Ende der Nahrungskette: eine trophische Kaskade. Sie baut sich langsam auf, weil junge Fische Wochen zum Heranwachsen brauchen.',
      real: 'In echten Teichen wirbeln Fische auch den Schlamm auf, was das Wasser noch mehr trübt.'
    },
    'pike-return': {
      title: 'Hechte kommen zurück',
      situation: 'Ein paar junge Hechte werden in einen Teich voller Kleinfische gesetzt.',
      think: 'Folge der Kette: Hechte, Kleinfische, Wasserflöhe, Algen.',
      explain: 'Hechte fressen Kleinfische; weniger Kleinfische lassen mehr Wasserflöhe übrig; mehr Wasserflöhe fressen mehr Algen. Jeder Schritt dreht die Richtung um, also gehen die Algen zurück. Es dauert lange, weil junge Hechte etwa zwanzig Wochen zum Heranwachsen brauchen.',
      real: 'In echten Seen werden Kleinfische entnommen oder Hechte eingesetzt, um das Wasser zu klären – mit gemischtem und oft kurzem Erfolg.'
    },
    'algae-treatment': {
      title: 'Eine schnelle Lösung für grünes Wasser',
      situation: 'Der Teich wird behandelt: Neun von zehn Algen sterben und sinken ab, bleiben aber im Wasser.',
      think: 'Wohin gehen die Nährstoffe in den toten Algen? Und was ist mit den Wasserflöhen passiert, während die Algen fehlten?',
      explain: 'Die toten Algen verrotten in wenigen Tagen und geben ihre Nährstoffe ans Wasser zurück. Die Wasserflöhe hungerten, während die Algen fehlten, also hält eine Weile niemand die Algen in Schach, und sie schießen über das alte Maß hinaus. Eine Lösung, die das Symptom beseitigt, aber nicht die Nährstoffe, hält nicht.',
      real: 'In echten Teichen verbrauchen verrottende Algen auch Sauerstoff, was Fischen schaden kann.'
    },
    'slow-runoff': {
      title: 'Ein Feld bachaufwärts',
      situation: 'Ein neues Feld bachaufwärts beginnt, in den klaren Teich zu entwässern.',
      think: 'Was machen mehr Nährstoffe mit den Algen, und was machen mehr Algen mit dem Laichkraut darunter?',
      explain: 'Monatelang scheint nichts zu passieren: Das Laichkraut sieht nach einem halben Jahr sogar gut aus. Inzwischen häufen sich Nährstoffe in Wasser und Schlamm an. Wenn die Algen schließlich gewinnen, übernimmt ein verstärkender Kreislauf: mehr Algen, mehr Schatten, weniger Laichkraut, weniger Verstecke für Wasserflöhe, noch mehr Algen (R1, R2). Der Umschwung ist schnell; die Ursache war langsam.',
      real: 'In echten Seen sind solche Umschwünge von klarem zu grünem Wasser gut belegt, oft nach Jahren langsamer Veränderung.'
    },
    'no-way-back': {
      title: 'Der Zufluss hört auf',
      situation: 'Zwei Jahre später wird der Zufluss ganz gestoppt. Kommt das Laichkraut zurück?',
      think: 'Ist noch Laichkraut übrig, das nachwachsen kann? Was hält das Wasser jetzt grün?',
      explain: 'Den Zufluss zu stoppen beseitigt die Ursache, aber der Teich bleibt grün: Die Algen beschatten den Grund, und es ist kein Laichkraut mehr übrig, das nachwachsen könnte. Der verstärkende Kreislauf (R1) hält den Teich jetzt im grünen Zustand. Der Weg zurück braucht mehr, als die Änderung rückgängig zu machen, zum Beispiel neu gepflanztes Laichkraut.',
      real: 'In echten Seen dauert die Erholung nach dem Abstellen der Nährstoffe oft viele Jahre, und manchmal werden Pflanzen neu gesetzt.'
    },
    shade: {
      title: 'Ein Baum über dem Teich',
      situation: 'Ein Baum wächst über den Teich und beschattet ihn.',
      think: 'Laichkraut braucht Licht am Grund. Was nimmt ihm sonst noch Licht weg?',
      explain: 'Weniger Licht bremst das Laichkraut, sodass es die Algen weniger zurückhält. Algen und Wasserflöhe beginnen zu schwanken, und jeder Algenschub beschattet das Laichkraut weiter (R1): Es geht Schritt für Schritt zurück.',
      real: 'In echten Teichen würde fallendes Laub des Baums auch Nährstoffe eintragen.'
    },
    spray: {
      title: 'Spritzen gegen Blattläuse',
      situation: 'Die Wiese wird gegen Blattläuse gespritzt: Neun von zehn Blattläusen und auch neun von zehn Marienkäfern sterben.',
      think: 'Wer wächst schneller nach: die Blattläuse oder die Marienkäfer, die sie fressen?',
      explain: 'Das Spritzen tötete die Blattläuse und die Marienkäfer, die sie fressen. Blattläuse vermehren sich viel schneller als Marienkäfer, also kamen sie zuerst zurück, ohne dass sie jemand aufhielt – und die Wildblumen zahlten dafür. Ökologen nennen das Schädlingsrückkehr (B2 mit Verzögerung).',
      real: 'Auf echten Feldern schadet Spritzen auch Bienen und anderen Insekten, und Schädlinge können resistent werden.'
    },
    'no-foxes': {
      title: 'Die Füchse gehen',
      situation: 'Die Füchse verlassen die Wiese.',
      think: 'Wer hat die Kaninchen in Schach gehalten? Was fressen mehr Kaninchen zuerst?',
      explain: 'Ohne Füchse fehlt der ausgleichende Kreislauf, der die Kaninchen in Schach hielt (B2). Die Kaninchen vermehren sich und fressen den Klee, ihr Lieblingsfutter, bis wenig übrig ist.',
      real: 'In echten Landschaften wandern Kaninchen auch ab, und Krankheiten können ihre Zahl senken.'
    },
    fertilise: {
      title: 'Ein wenig Dünger',
      situation: 'Der Landwirt streut jede Woche etwas Dünger.',
      think: 'Welche Pflanze profitiert am meisten von reichem Boden, und was macht sie mit den niedrigen Pflanzen?',
      explain: 'Dünger nährt vor allem die Gräser. Höheres Gras beschattet Klee und Wildblumen, und der Klee verliert seinen Vorteil: Auf reichem Boden hilft es nicht mehr, Stickstoff selbst zu holen. Mehr Futter für die Wiese bedeutet weniger Pflanzenarten.',
      real: 'In echten Wiesen ist Stickstoff aus Dünger und aus der Luft ein Hauptgrund für verschwundene Wildblumen.'
    },
    drought: {
      title: 'Ein trockener Sommer',
      situation: 'Zwölf trockene Wochen, dann wieder normaler Regen.',
      think: 'Was brauchen die Gräser außer Nährstoffen? Was passiert, wenn der Regen zurückkommt?',
      explain: 'Ohne Regen trocknet der Boden aus, und die Gräser wachsen langsamer und schrumpfen. Wenn der Regen zurückkommt, füllt sich der Boden, und die Gräser wachsen nach, sogar über ihr altes Maß hinaus, weil sich im Boden Nährstoffe angesammelt haben, die sie nicht nutzen konnten.',
      real: 'In echten Wiesen kann eine lange Dürre auch Pflanzen töten und anderen Platz machen.'
    },
    'clover-poor': {
      title: 'Klee für eine magere Wiese',
      situation: 'In eine magere Wiese mit Wildblumen wird Klee gesät.',
      think: 'Klee holt Stickstoff aus der Luft. Wohin geht dieser Stickstoff, wenn seine Blätter absterben?',
      explain: 'Klee bringt neuen Stickstoff in die Wiese. Wenn seine Blätter absterben, machen Regenwürmer daraus Nährstoffe, die die Wildblumen nutzen. Die Nachbarn profitieren, langsam, über den Boden: eine Kette mit Verzögerung.',
      real: 'In der echten Landwirtschaft wird Klee genau aus diesem Grund gesät.'
    },
    'worms-gone': {
      title: 'Wo sind die Regenwürmer?',
      situation: 'Die Regenwürmer verschwinden aus der Wiese.',
      think: 'Wer macht abgestorbene Blätter wieder zu Pflanzennahrung? Welche Pflanze ist darauf nicht angewiesen?',
      explain: 'Ohne Regenwürmer häufen sich abgestorbene Blätter an, und ihre Nährstoffe bleiben darin gebunden. Die Gräser hungern. Klee holt seinen Stickstoff selbst und gewinnt: eine Nebenwirkung, mit der kaum jemand rechnet.',
      real: 'In echten Böden zersetzen viel mehr Tiere, Pilze und Bakterien die abgestorbenen Blätter.'
    },
    'foxes-return': {
      title: 'Die Füchse kommen zurück',
      situation: 'Füchse kehren auf eine Wiese zurück, die von Kaninchen überrannt ist.',
      think: 'Wie lange brauchen junge Füchse zum Heranwachsen? Was bedeuten weniger Kaninchen für den Klee?',
      explain: 'Zuerst passiert wenig: Junge Füchse brauchen etwa ein halbes Jahr zum Heranwachsen. Dann drücken die Füchse die Kaninchen herunter (B2), und der Klee, befreit vom Abfressen, kommt langsam zurück. Die Wirkung kommt Jahre nach der Ursache.',
      real: 'In echten Landschaften jagen Füchse auch andere Tiere, und Kaninchen finden neue Lebensräume.'
    },
    'ladybirds-gone': {
      title: 'Marienkäfer eingesammelt',
      situation: 'Die meisten Marienkäfer werden für einen Garten anderswo eingesammelt.',
      think: 'Wer frisst die Blattläuse? Wie schnell können die übrigen Marienkäfer zurückkommen?',
      explain: 'Ohne Marienkäfer vermehren sich die Blattläuse. Die wenigen übrigen Marienkäfer finden jetzt reichlich Futter, und ihre Zahl wächst mit Verzögerung nach. Dann drücken sie die Blattläuse wieder herunter (B2).',
      real: 'In echten Gärten helfen auch andere Blattlausjäger wie Schwebfliegen und Vögel.'
    }
  },
  goals: {
    'save-pondweed': {
      story: 'Ein neues Feld bachaufwärts beginnt, in den klaren Teich zu entwässern. Halte das Laichkraut zwei Jahre lang am Leben, während der Zufluss weitergeht.',
      target: 'Laichkraut jede Woche mindestens {v} bis Woche {w}.',
      hint: 'Algen sind ein Symptom. Was nährt sie, und wie bald muss sich das ändern?',
      explain: 'Das Laichkraut geht erst zurück, wenn die Algen es beschatten, und die Algen wachsen aus den Nährstoffen, die das Feld bringt. Setze an der Ursache an, und das früh: Wenn das Laichkraut schwach aussieht, hat der verstärkende Kreislauf schon übernommen.',
      plans: {
        buffer: 'Ein Pufferstreifen aus Pflanzen am Feldrand fängt den Großteil des Zuflusses ab, bevor er den Teich erreicht. Früh genug angelegt, ziehen die Algen nie davon.',
        ditch: 'Den Graben zu schließen stoppt den Zufluss ganz, also ziehen die Algen nie davon.'
      }
    },
    'clear-pond': {
      story: 'Der Teich ist nach zwei Jahren Zufluss grün geworden. Mach das Wasser wieder klar, mit wachsendem Laichkraut, zwölf Wochen am Stück.',
      target: 'Algen (Grün- und Blaualgen) höchstens {v} und Laichkraut mindestens {p}, zwölf Wochen am Stück, bis Woche {w}.',
      hint: 'Algen sind ein Symptom. Was nährt sie? Und was hält sie klein, wenn das Wasser klar ist?',
      explain: 'Der grüne Zustand erhält sich selbst: Algen beschatten die Pflanzen, die sie zurückhalten würden. Klares Wasser braucht, dass die Ursache wegfällt (der Zufluss), dass die gespeicherten Nährstoffe herausgeholt oder ausgespült werden, und dass das Laichkraut zurückkommt – damit der verstärkende Kreislauf in Richtung klares Wasser dreht.',
      plans: {
        restore: 'Zufluss stoppen, den nährstoffreichen Schlamm ausbaggern, Laichkraut pflanzen und die meisten Kleinfische herausnehmen (damit mehr Wasserflöhe die Algen abweiden). Zusammen drehen sie den Kreislauf in Richtung klares Wasser.',
        flush: 'Den Zufluss stoppen und eine Weile einen Bach Nährstoffe und Algen ausspülen lassen, dann Laichkraut ins klare Wasser pflanzen.'
      }
    },
    'protect-flowers': {
      story: 'Ein Nachbar hat die Wiese gerade gespritzt: Die meisten Blattläuse und die meisten Marienkäfer sind tot. Erhalte die Wildblumen ein Jahr lang.',
      target: 'Wildblumen jede Woche mindestens {v} bis Woche {w}.',
      hint: 'Die Blattläuse kommen schneller zurück als die Marienkäfer. Wann würden neue Marienkäfer etwas zu fressen finden?',
      explain: 'Die Blattläuse erholen sich vor ihren Jägern. Zu früh ausgesetzte Marienkäfer verhungern, weil es noch keine Blattläuse gibt; zu spät ausgesetzt, sind die Wildblumen schon abgefressen. Der Zeitpunkt entscheidet.',
      plans: {
        ladybirds: 'Nach etwa zehn Wochen ausgesetzt, wenn die Blattläuse zurück sind, aber noch nicht auf dem Höhepunkt, finden die Marienkäfer sofort Futter und stoppen die Blattläuse rechtzeitig.'
      }
    },
    'bring-back-clover': {
      story: 'Ohne Füchse haben Kaninchen den Klee fast ganz abgefressen. Bring den Klee innerhalb von vier Jahren acht Wochen am Stück zurück.',
      target: 'Klee mindestens {v}, acht Wochen am Stück, bis Woche {w}.',
      hint: 'Kaninchen zu entfernen hilft nur eine Weile. Was hat sie früher in Schach gehalten?',
      explain: 'Kaninchen vermehren sich schnell, also verschafft das Entfernen einiger nur Zeit. Eine dauerhafte Änderung braucht den ausgleichenden Kreislauf zurück: Füchse. Junge Füchse brauchen ein halbes Jahr zum Heranwachsen, also kommt der Klee erst Jahre später zurück.',
      plans: {
        foxes: 'Füchse allein reichen, aber es braucht Geduld: Sie drücken die Kaninchen nur langsam herunter.',
        foxesRabbits: 'Füchse und die Hälfte der Kaninchen umsiedeln: Die Füchse haben weniger Kaninchen aufzuholen.',
        foxesRabbitsClover: 'Füchse, die meisten Kaninchen umsiedeln und Klee säen: der schnellste Weg, weil der Klee einen Vorsprung bekommt, während die Füchse heranwachsen.'
      }
    }
  },
  loops: {
    graze: 'Wasserflöhe weiden die Algen ab; weniger Algen, weniger Wasserflöhe.',
    fishFleas: 'Kleinfische fressen Wasserflöhe; weniger Wasserflöhe, weniger junge Fische.',
    pikeFish: 'Hechte fressen Kleinfische; weniger Kleinfische, weniger junge Hechte.',
    clearWater: 'Algen beschatten das Laichkraut; Laichkraut hält die Algen zurück. Wer vorn liegt, zieht weiter davon.',
    shelter: 'Laichkraut versteckt Wasserflöhe vor Fischen, und Wasserflöhe fressen Algen.',
    recycle: 'Tote Algen verrotten und nähren neue Algen.',
    aphidsFlowers: 'Blattläuse leben von den Wildblumen; weniger Wildblumen, weniger Blattläuse.',
    ladybirdsAphids: 'Marienkäfer fressen Blattläuse; weniger Blattläuse, weniger junge Marienkäfer.',
    rabbitsClover: 'Kaninchen fressen den Klee; weniger Klee, weniger junge Kaninchen.',
    foxesRabbits: 'Füchse jagen Kaninchen; weniger Kaninchen, weniger junge Füchse.',
    thirst: 'Gräser verbrauchen das Bodenwasser; trockener Boden bremst die Gräser.',
    wormsDead: 'Regenwürmer fressen abgestorbene Blätter; weniger abgestorbene Blätter, weniger Regenwürmer.',
    flowerUptake: 'Wildblumen nehmen die Nährstoffe auf, aus denen sie wachsen.'
  }
};
