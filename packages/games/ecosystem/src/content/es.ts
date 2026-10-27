import type { ContentText } from './types';

export const content: ContentText = {
  weeks: { one: '{n} semana', many: '{n} semanas', other: '{n} semanas' },
  species: {
    algae: { name: 'Algas verdes', about: 'Plantas diminutas que flotan en el agua. Crecen rápido con nutrientes y luz; las pulgas de agua y los caracoles se las comen. Muchas algas tiñen el agua de verde y dan sombra a las plantas de abajo.' },
    bluegreen: { name: 'Algas verdeazuladas', about: 'En realidad son bacterias (cianobacterias). Crecen despacio, necesitan agua rica y casi nadie se las come, así que proliferan cuando se acumulan nutrientes.' },
    duckweed: { name: 'Lentejas de agua', about: 'Hojitas flotantes. En agua rica cubren la superficie y dan sombra a todo lo de abajo.' },
    pondweed: { name: 'Espiga de agua', about: 'Plantas sumergidas que enraízan en el lodo. Necesitan agua clara para recibir luz, quitan nutrientes a las algas y dan a las pulgas de agua un refugio frente a los peces.' },
    fleas: { name: 'Pulgas de agua', about: 'Pequeños crustáceos (Daphnia) que pastan las algas. Los peces pequeños se las comen, pero en la espiga de agua y en el lodo muchas quedan fuera de su alcance.' },
    snails: { name: 'Caracoles de estanque', about: 'Comen restos de plantas muertas y algunas algas. Los peces pequeños se comen algunos.' },
    minnows: { name: 'Peces pequeños', about: 'Cazan pulgas de agua y algunos caracoles. Sus crías tardan unas seis semanas en crecer. Los lucios se los comen.' },
    pike: { name: 'Lucios', about: 'Un gran cazador que come peces pequeños. Los lucios jóvenes tardan unas veinte semanas en crecer.' },
    grass: { name: 'Hierbas', about: 'Altas y de crecimiento rápido en suelo rico. Dan sombra a las plantas bajas y gastan mucha agua.' },
    flowers: { name: 'Flores silvestres', about: 'Plantas bajas que prosperan en suelo pobre. Necesitan luz, así que la hierba alta las desplaza. Los pulgones y los conejos se las comen.' },
    clover: { name: 'Trébol', about: 'Una planta baja que obtiene su propio nitrógeno del aire, menos en suelo rico. Sus hojas muertas abonan el suelo para sus vecinas. Es lo que más les gusta a los conejos.' },
    aphids: { name: 'Pulgones', about: 'Insectos diminutos que chupan savia, sobre todo de las flores silvestres. Se multiplican muy rápido. Las mariquitas se los comen.' },
    ladybirds: { name: 'Mariquitas', about: 'Escarabajos que comen pulgones. Sus larvas tardan unas tres semanas en crecer, así que responden con retraso a un aumento de pulgones.' },
    rabbits: { name: 'Conejos', about: 'Comen primero trébol, luego flores silvestres y hierba. Sus crías tardan unas cinco semanas en crecer. Los zorros los cazan; algunos siempre están a salvo en sus madrigueras.' },
    foxes: { name: 'Zorros', about: 'Cazan conejos. Los zorros jóvenes tardan medio año en crecer.' },
    worms: { name: 'Lombrices', about: 'Comen hojas muertas y las convierten de nuevo en nutrientes que las plantas pueden usar.' }
  },
  challenges: {
    'fleas-arrive': {
      title: 'Llegan las pulgas de agua',
      situation: 'Un estanque joven solo tiene algas verdes. Llegan pulgas de agua, traídas por un ave.',
      think: '¿Quién come las algas? ¿Qué les pasa a las pulgas de agua cuando hay menos algas?',
      explain: 'Las pulgas de agua se multiplican con las algas hasta que comen tan rápido como crecen las algas. Desde entonces son las pulgas, no los nutrientes, las que fijan cuántas algas hay: un bucle de equilibrio (B1). El agua se aclara y sigue clara.',
      real: 'En estanques reales, los peces y las estaciones suelen impedir que todo sea tan ordenado.'
    },
    'enrich-swings': {
      title: 'Más comida para todos',
      situation: 'Una fuerte escorrentía de un campo empieza a abonar un estanque con algas y pulgas de agua.',
      think: 'Más nutrientes alimentan más algas. ¿Qué hacen las pulgas con más algas, y qué hacen luego las algas?',
      explain: 'Más nutrientes dejan que las algas se adelanten; las pulgas las siguen, se las comen y luego pasan hambre; las algas se recuperan y todo vuelve a empezar. El agua más rica hizo que el sistema oscilara en vez de asentarse. Los ecólogos lo llaman la paradoja del enriquecimiento (B1).',
      real: 'En estanques reales, muchas más especies y las estaciones amortiguan o cambian estas oscilaciones.'
    },
    'fish-stocked': {
      title: 'Peces en el estanque',
      situation: 'Alguien suelta peces pequeños en un estanque que no tenía.',
      think: 'Los peces comen pulgas de agua. ¿Quién come las algas y qué les pasa?',
      explain: 'Los peces comen pulgas de agua, así que menos pulgas pastan las algas, y las algas crecen. Un cambio arriba llega al fondo de la cadena alimentaria: una cascada trófica. Avanza despacio porque los peces jóvenes tardan semanas en crecer.',
      real: 'En estanques reales, los peces también remueven el lodo, lo que enturbia aún más el agua.'
    },
    'pike-return': {
      title: 'Vuelven los lucios',
      situation: 'Se sueltan unos lucios jóvenes en un estanque lleno de peces pequeños.',
      think: 'Sigue la cadena: lucios, peces pequeños, pulgas de agua, algas.',
      explain: 'Los lucios comen peces pequeños; menos peces pequeños dejan más pulgas de agua; más pulgas comen más algas. Cada paso invierte la dirección, así que las algas bajan. Tarda mucho porque los lucios jóvenes necesitan unas veinte semanas para crecer.',
      real: 'En lagos reales se retiran peces pequeños o se añaden lucios para aclarar el agua, con éxito desigual y a menudo breve.'
    },
    'algae-treatment': {
      title: 'Un arreglo rápido para el agua verde',
      situation: 'Se trata el estanque: nueve de cada diez algas mueren y se hunden, pero se quedan en el agua.',
      think: '¿Adónde van los nutrientes de las algas muertas? ¿Y qué les pasó a las pulgas mientras faltaban las algas?',
      explain: 'Las algas muertas se pudren en pocos días y devuelven sus nutrientes al agua. Las pulgas de agua pasaron hambre mientras faltaban las algas, así que durante un tiempo nadie las controla, y se pasan de su nivel anterior. Un arreglo que quita el síntoma pero no los nutrientes no dura.',
      real: 'En estanques reales, las algas en descomposición también consumen oxígeno, lo que puede dañar a los peces.'
    },
    'slow-runoff': {
      title: 'Un campo río arriba',
      situation: 'Un campo nuevo río arriba empieza a desaguar en el estanque claro.',
      think: '¿Qué hacen más nutrientes con las algas, y qué hacen más algas con la espiga de agua de abajo?',
      explain: 'Durante meses parece que no pasa nada: la espiga de agua incluso se ve bien al cabo de medio año. Mientras tanto, los nutrientes se acumulan en el agua y en el lodo, hasta que las lentejas de agua y las algas verdeazuladas, que necesitan agua rica, se disparan y dan sombra a la espiga de agua. Entonces un bucle de refuerzo toma el mando: menos espiga de agua, más algas, más sombra (R1). El vuelco es rápido; la causa fue lenta.',
      real: 'En lagos reales, estos vuelcos de agua clara a verde están bien documentados, a menudo tras años de cambio lento.'
    },
    'no-way-back': {
      title: 'Se acaba la escorrentía',
      situation: 'Dos años después se corta del todo la escorrentía. ¿Volverá la espiga de agua?',
      think: '¿Queda algo de espiga de agua que pueda rebrotar? ¿Qué mantiene ahora el agua verde?',
      explain: 'Cortar la escorrentía quita la causa, pero el estanque sigue verde: las algas dan sombra al fondo y no queda espiga de agua que pueda rebrotar. El bucle de refuerzo (R1) mantiene ahora el estanque en su estado verde. Volver atrás exige más que deshacer el cambio, por ejemplo replantar espiga de agua.',
      real: 'En lagos reales, la recuperación tras cortar los nutrientes suele tardar muchos años, y a veces se replantan plantas.'
    },
    shade: {
      title: 'Un árbol sobre el estanque',
      situation: 'Un árbol crece sobre el estanque y le da sombra.',
      think: 'La espiga de agua necesita luz en el fondo. ¿Qué otra cosa le quita luz?',
      explain: 'Menos luz frena la espiga de agua, que así frena menos a las algas. Las algas y las pulgas empiezan a oscilar, y cada brote de algas da más sombra a la espiga de agua (R1): baja paso a paso.',
      real: 'En estanques reales, las hojas que caen del árbol también aportarían nutrientes.'
    },
    spray: {
      title: 'Fumigar contra pulgones',
      situation: 'Se fumiga el prado contra los pulgones: mueren nueve de cada diez pulgones y también nueve de cada diez mariquitas.',
      think: '¿Quién se recupera antes: los pulgones o las mariquitas que se los comen?',
      explain: 'La fumigación mató a los pulgones y a las mariquitas que se los comen. Los pulgones se multiplican mucho más rápido que las mariquitas, así que volvieron primero, sin nadie que los frenara, y las flores silvestres lo pagaron. Los ecólogos lo llaman resurgencia de plagas (B2 con retraso).',
      real: 'En campos reales, fumigar también daña a las abejas y a otros insectos, y las plagas pueden volverse resistentes.'
    },
    'no-foxes': {
      title: 'Se van los zorros',
      situation: 'Los zorros abandonan el prado.',
      think: '¿Quién mantenía a raya a los conejos? ¿Qué comen primero más conejos?',
      explain: 'Sin zorros desaparece el bucle de equilibrio que mantenía a raya a los conejos (B2). Los conejos se multiplican y se comen el trébol, su comida favorita, hasta que queda poco.',
      real: 'En paisajes reales, los conejos también se marchan y las enfermedades pueden reducir su número.'
    },
    fertilise: {
      title: 'Un poco de abono',
      situation: 'El agricultor esparce algo de abono cada semana.',
      think: '¿Qué planta aprovecha más un suelo rico, y qué hace con las plantas bajas?',
      explain: 'El abono alimenta sobre todo a las hierbas. La hierba más alta da sombra al trébol, que es bajo, y el trébol pierde su ventaja: en suelo rico ya no le ayuda fabricar su propio nitrógeno. Más comida para el prado no significa más de cada planta.',
      real: 'En prados reales, el nitrógeno del abono y del aire es una causa principal de la pérdida de flores silvestres.'
    },
    drought: {
      title: 'Un verano seco',
      situation: 'Doce semanas secas y luego lluvia normal otra vez.',
      think: '¿Qué necesitan las hierbas además de nutrientes? ¿Qué pasa cuando vuelve la lluvia?',
      explain: 'Sin lluvia el suelo se seca y las hierbas crecen más despacio y se reducen. Cuando vuelve la lluvia, el suelo se llena y las hierbas vuelven a crecer, incluso por encima de su nivel anterior, porque los nutrientes se acumularon en el suelo mientras no podían usarlos.',
      real: 'En prados reales, una sequía larga también puede matar plantas y dejar sitio a otras.'
    },
    'clover-poor': {
      title: 'Trébol para un prado pobre',
      situation: 'Se siembra trébol en un prado pobre de flores silvestres.',
      think: 'El trébol saca nitrógeno del aire. ¿Adónde va ese nitrógeno cuando mueren sus hojas?',
      explain: 'El trébol trae nitrógeno nuevo al prado. Cuando mueren sus hojas, las lombrices las convierten en nutrientes que usan las flores silvestres. Las vecinas se benefician, despacio, a través del suelo: una cadena con retraso.',
      real: 'En la agricultura real se siembra trébol justo por este motivo.'
    },
    'worms-gone': {
      title: '¿Dónde están las lombrices?',
      situation: 'Las lombrices desaparecen del prado.',
      think: '¿Quién convierte las hojas muertas en alimento para las plantas? ¿Qué planta no depende de eso?',
      explain: 'Sin lombrices, las hojas muertas se acumulan y sus nutrientes quedan atrapados. Las hierbas pasan hambre. El trébol fabrica su propio nitrógeno, así que gana: un efecto secundario que pocos esperan.',
      real: 'En suelos reales, muchos más animales, hongos y bacterias descomponen las hojas muertas.'
    },
    'foxes-return': {
      title: 'Vuelven los zorros',
      situation: 'Los zorros vuelven a un prado invadido por conejos.',
      think: '¿Cuánto tardan en crecer los zorros jóvenes? ¿Qué significan menos conejos para el trébol?',
      explain: 'Al principio pasa poco: los zorros jóvenes tardan medio año en crecer. Luego los zorros reducen los conejos (B2), y el trébol, libre de pastoreo, vuelve poco a poco. El efecto llega años después de la causa.',
      real: 'En paisajes reales, los zorros también cazan otros animales y los conejos encuentran nuevos lugares donde vivir.'
    },
    'ladybirds-gone': {
      title: 'Mariquitas recogidas',
      situation: 'Se recogen la mayoría de las mariquitas para un jardín de otro lugar.',
      think: '¿Quién come los pulgones? ¿Y qué necesitan los pulgones para seguir multiplicándose?',
      explain: 'Sin mariquitas, los pulgones se multiplican y se comen las flores silvestres. Con menos comida, vuelven a bajar (B1): aquí los frena su comida, no sus cazadores. Las pocas mariquitas que quedan siguen siendo pocas durante meses.',
      real: 'En jardines reales también ayudan otros cazadores de pulgones, como los sírfidos y los pájaros.'
    }
  },
  goals: {
    'save-pondweed': {
      story: 'Un campo nuevo río arriba empieza a desaguar en el estanque claro. Mantén viva la espiga de agua durante dos años mientras sigue la escorrentía.',
      target: 'Espiga de agua al menos {v} cada semana hasta la semana {w}.',
      hint: 'Las algas son un síntoma. ¿Qué las alimenta, y cuánto antes debe cambiar?',
      explain: 'La espiga de agua solo baja cuando algo le da sombra: las lentejas de agua y las algas, que crecen con los nutrientes que trae el campo. Actúa sobre la causa, y pronto: cuando la espiga de agua parece débil, el bucle de refuerzo ya ha tomado el mando.',
      plans: {
        buffer: 'Una franja de plantas junto al campo atrapa la mayor parte de la escorrentía antes de que llegue al estanque. A tiempo, las algas nunca se adelantan.',
        ditch: 'Cerrar la acequia corta del todo la escorrentía, así que las algas nunca se adelantan.'
      }
    },
    'clear-pond': {
      story: 'El estanque se volvió verde tras dos años de escorrentía. Devuélvele el agua clara, con espiga de agua creciendo, durante doce semanas seguidas.',
      target: 'Algas (verdes y verdeazuladas) como máximo {v} y espiga de agua al menos {p}, doce semanas seguidas, antes de la semana {w}.',
      hint: 'Las algas son un síntoma. ¿Qué las alimenta? ¿Y qué las mantiene a raya cuando el agua ya está clara?',
      explain: 'El estado verde se mantiene solo: las algas dan sombra a las plantas que las frenarían. Para aclarar el agua hay que quitar la causa (la escorrentía), sacar o arrastrar los nutrientes acumulados y recuperar la espiga de agua, de modo que el bucle de refuerzo gire hacia el agua clara.',
      plans: {
        restore: 'Cortar la escorrentía, dragar el lodo rico en nutrientes, plantar espiga de agua y sacar la mayoría de los peces pequeños (para que más pulgas pasten las algas). Juntos giran el bucle hacia el agua clara.',
        flush: 'Cortar la escorrentía y dejar que un arroyo arrastre nutrientes y algas durante un tiempo; después plantar espiga de agua en el agua clara.'
      }
    },
    'protect-flowers': {
      story: 'Un vecino acaba de fumigar el prado: murieron la mayoría de los pulgones y la mayoría de las mariquitas. Conserva las flores silvestres durante un año.',
      target: 'Flores silvestres al menos {v} cada semana hasta la semana {w}.',
      hint: 'Los pulgones vuelven más rápido que las mariquitas. ¿Cuándo encontrarían comida unas mariquitas nuevas?',
      explain: 'Los pulgones se recuperan antes que sus cazadores. Las mariquitas soltadas demasiado pronto pasan hambre, porque aún no hay pulgones; soltadas demasiado tarde, las flores ya se han comido. El momento lo decide.',
      plans: {
        ladybirds: 'Soltadas a las diez semanas más o menos, cuando los pulgones ya han vuelto pero antes de su pico, las mariquitas encuentran comida enseguida y frenan a los pulgones a tiempo.'
      }
    },
    'bring-back-clover': {
      story: 'Sin zorros, los conejos casi han acabado con el trébol. Haz que el trébol vuelva durante ocho semanas seguidas en un plazo de cuatro años.',
      target: 'Trébol al menos {v}, ocho semanas seguidas, antes de la semana {w}.',
      hint: 'Quitar conejos solo ayuda un tiempo. ¿Qué los mantenía a raya antes?',
      explain: 'Los conejos se multiplican rápido, así que quitar algunos solo da tiempo. Un cambio duradero necesita que vuelva el bucle de equilibrio: los zorros. Los zorros jóvenes tardan medio año en crecer, así que el trébol vuelve años después.',
      plans: {
        foxes: 'Los zorros solos bastan, pero hace falta paciencia: reducen los conejos despacio.',
        foxesRabbits: 'Zorros y trasladar la mitad de los conejos: los zorros tienen menos conejos que alcanzar.',
        foxesRabbitsClover: 'Zorros, trasladar la mayoría de los conejos y sembrar trébol: la vía más rápida, porque el trébol toma ventaja mientras crecen los zorros.'
      }
    }
  },
  loops: {
    graze: 'Las pulgas de agua pastan las algas; menos algas, menos pulgas.',
    fishFleas: 'Los peces pequeños comen pulgas de agua; menos pulgas, menos peces jóvenes.',
    pikeFish: 'Los lucios comen peces pequeños; menos peces pequeños, menos lucios jóvenes.',
    clearWater: 'Las algas dan sombra a la espiga de agua; la espiga de agua frena a las algas. Quien va delante se adelanta aún más.',
    shelter: 'La espiga de agua esconde a las pulgas de los peces, y las pulgas comen algas.',
    recycle: 'Las algas muertas se pudren y alimentan algas nuevas.',
    aphidsFlowers: 'Los pulgones viven de las flores silvestres; menos flores, menos pulgones.',
    ladybirdsAphids: 'Las mariquitas comen pulgones; menos pulgones, menos mariquitas jóvenes.',
    rabbitsClover: 'Los conejos comen el trébol; menos trébol, menos conejos jóvenes.',
    foxesRabbits: 'Los zorros cazan conejos; menos conejos, menos zorros jóvenes.',
    thirst: 'Las hierbas gastan el agua del suelo; el suelo seco frena las hierbas.',
    wormsDead: 'Las lombrices comen hojas muertas; menos hojas muertas, menos lombrices.',
    flowerUptake: 'Las flores silvestres absorben los nutrientes con los que crecen.'
  }
};
