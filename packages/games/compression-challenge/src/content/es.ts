import type { ContentText } from './types';

export const content: ContentText = {
  launch: {
    title: 'Novedades sobre el lanzamiento de la app',
    context: 'Un correo de la jefa de proyecto a todo el equipo.',
    sentences: {
      s1: 'Hola a todos, espero que hayáis tenido un buen fin de semana al sol.',
      s2: 'El lanzamiento de nuestra app de reservas pasa del 2 de abril al 14 de mayo.',
      s3: 'El motivo es que el proveedor de pagos aún no ha terminado su certificación de seguridad, y sin ella no podemos cobrar.',
      s4: 'El proveedor dice que tiene un atasco de solicitudes.',
      s5: 'El equipo de diseño aprovechará las semanas extra para pulir las pantallas de bienvenida.',
      s6: 'Nuestros 300 probadores beta pueden seguir usando la versión de prueba hasta el lanzamiento.',
      s7: 'Un competidor lanzó una app parecida el año pasado y necesitó tres intentos.',
      s8: 'Marketing tiene que mover la campaña, así que decidid el nuevo inicio de la campaña antes del viernes.',
      s9: 'El presupuesto no cambia, porque la agencia no cobra por mover la campaña.',
      s10: 'La certificación en sí dura unas tres semanas una vez que empieza.',
      s11: '¡Gracias otra vez por todo vuestro esfuerzo!',
      s12: 'El miércoles enviaré un plan de proyecto actualizado.'
    },
    bullets: {
      gold1: 'El lanzamiento pasa del 2 de abril al 14 de mayo.',
      gold2: 'Causa: la certificación de seguridad del proveedor de pagos no está terminada.',
      gold3: 'Marketing debe decidir el nuevo inicio de la campaña antes del viernes.',
      minor: 'El equipo de diseño pulirá las pantallas de bienvenida.',
      distort: 'La app ha suspendido el control de seguridad.',
      dup: 'El lanzamiento se retrasa.',
      subtle: 'El lanzamiento pasa del 2 de abril al 4 de mayo.'
    },
    bulletNotes: {
      distort: 'El texto dice que la certificación aún no ha terminado, no que la app haya suspendido una prueba.',
      dup: 'Repite el punto de la nueva fecha sin la fecha, así que desperdicia un hueco.',
      subtle: 'Casi, pero la nueva fecha es el 14 de mayo, no el 4.'
    },
    summaries: {
      faithful: 'El lanzamiento pasa al 14 de mayo porque la certificación del proveedor de pagos no está terminada, y marketing debe decidir el nuevo inicio de la campaña antes del viernes.',
      vague: 'Hay algunos cambios en el calendario del lanzamiento que el equipo debería conocer.',
      drops: 'Como el proveedor de pagos todavía no está listo, el lanzamiento se ha aplazado, pero el presupuesto no cambia.',
      adds: 'El lanzamiento pasa al 14 de mayo porque la certificación del proveedor de pagos no está terminada, y el retraso encarecerá el proyecto.',
      subtle: 'El lanzamiento pasa al 14 de mayo porque nuestra app suspendió la certificación del proveedor de pagos, y marketing debe decidir el nuevo inicio de la campaña antes del viernes.'
    },
    summaryNotes: {
      drops: 'Omite la nueva fecha y la decisión que tiene que tomar marketing.',
      adds: 'El texto dice que el presupuesto no cambia; el aumento de costes es inventado.',
      subtle: 'La app no ha suspendido nada: la certificación simplemente no ha terminado.'
    },
    task: 'El equipo de marketing tiene que actuar según esta frase.',
    oneLiner: 'Pasad el lanzamiento a mayo.',
    details: {
      d1: 'La nueva fecha exacta: 14 de mayo',
      d2: 'Quién tiene que actuar: marketing mueve la campaña',
      d3: 'El plazo: decidir el nuevo inicio de la campaña antes del viernes',
      d4: 'Por qué el proveedor va con retraso',
      d5: 'Los planes del equipo de diseño para las pantallas de bienvenida',
      d6: 'El fin de semana soleado'
    },
    versions: {
      actionable: 'El lanzamiento pasa del 2 de abril al 14 de mayo. Marketing: por favor, moved la campaña y decidid la nueva fecha de inicio antes del viernes. El presupuesto no cambia.',
      vague: 'Pasamos el lanzamiento a mayo. Ajustad vuestros planes en consecuencia y avisad si surge algo.',
      invented: 'El lanzamiento pasa al 1 de mayo. Marketing: por favor, cancelad la campaña y planificad una nueva antes de fin de mes.'
    },
    versionNote: 'La nueva fecha es el 14 de mayo, no el 1, y la campaña se mueve, no se cancela.'
  },
  library: {
    title: 'Reforma de la biblioteca',
    context: 'Un aviso en la puerta de la biblioteca del barrio.',
    sentences: {
      s1: 'Muchos nos habéis contado cuánto os gustan los viejos sillones del rincón de lectura.',
      s2: 'A partir del 3 de junio, la biblioteca cerrará por reforma durante ocho semanas.',
      s3: 'Se reparará el tejado, y el edificio tendrá ascensor e iluminación nueva.',
      s4: 'Durante el cierre, un bibliobús parará en la plaza del mercado todos los martes.',
      s5: 'El bibliobús lleva unos 2.000 libros y puede pedir cualquier título a la biblioteca central.',
      s6: 'Todos los préstamos que venzan durante el cierre se prorrogarán automáticamente, así que nadie pagará recargos.',
      s7: 'Los libros también se pueden devolver en cualquier momento en el buzón de devolución junto al ayuntamiento.',
      s8: 'El propio ayuntamiento se reformó de forma parecida hace diez años.',
      s9: 'Nuestros libros electrónicos y audiolibros siguen disponibles en línea como siempre.',
      s10: 'Ya estamos deseando que llegue el festival de lectura de verano del año que viene.',
      s11: 'La reforma se paga con un fondo regional de obras.'
    },
    bullets: {
      gold1: 'Cerrada por reforma ocho semanas a partir del 3 de junio.',
      gold2: 'Un bibliobús para en la plaza del mercado todos los martes.',
      gold3: 'Los préstamos que vencen durante el cierre se prorrogan automáticamente.',
      minor: 'El edificio tendrá iluminación nueva.',
      distort: 'Todos los servicios de la biblioteca se detienen ocho semanas.',
      dup: 'La biblioteca estará cerrada una temporada.',
      subtle: 'Cerrada por reforma seis semanas a partir del 3 de junio.'
    },
    bulletNotes: {
      distort: 'No es cierto: el bibliobús y el buzón de devolución siguen funcionando durante el cierre.',
      dup: 'Repite el cierre sin la fecha de inicio ni la duración.',
      subtle: 'Casi, pero el cierre dura ocho semanas, no seis.'
    },
    summaries: {
      faithful: 'La biblioteca cierra ocho semanas a partir del 3 de junio; mientras tanto, un bibliobús va a la plaza del mercado cada martes y los préstamos que vencen se prorrogan automáticamente.',
      vague: 'Habrá algunos cambios en la biblioteca este verano, así que estad atentos.',
      drops: 'La biblioteca se va a reformar y tendrá un tejado reparado, ascensor e iluminación nueva.',
      adds: 'La biblioteca cierra ocho semanas a partir del 3 de junio y, cuando reabra, cobrará una pequeña tarifa por los préstamos.',
      subtle: 'Como el tejado no es seguro, la biblioteca cierra ocho semanas a partir del 3 de junio; mientras tanto, un bibliobús va a la plaza del mercado cada martes.'
    },
    summaryNotes: {
      drops: 'Describe las obras, pero no cuándo cierra la biblioteca ni qué pueden hacer los lectores mientras tanto.',
      adds: 'El aviso no menciona ninguna tarifa tras la reapertura.',
      subtle: 'El aviso dice que se reparará el tejado, no que sea inseguro; esa causa es añadida.'
    },
    task: 'Un vecino que quiere seguir sacando libros te pregunta por ello.',
    oneLiner: 'La biblioteca cierra en verano.',
    details: {
      d1: 'Cuándo exactamente: ocho semanas a partir del 3 de junio',
      d2: 'Dónde sacar libros mientras tanto: el bibliobús en la plaza del mercado los martes',
      d3: 'Dónde devolverlos: el buzón junto al ayuntamiento',
      d4: 'Qué incluye la reforma',
      d5: 'Los sillones del rincón de lectura',
      d6: 'El festival de lectura del año que viene'
    },
    versions: {
      actionable: 'A partir del 3 de junio la biblioteca cierra ocho semanas. Puedes sacar libros del bibliobús en la plaza del mercado cada martes y devolverlos cuando quieras en el buzón junto al ayuntamiento. Los préstamos que venzan en ese tiempo se prorrogan solos.',
      vague: 'La biblioteca cerrará una temporada en verano por obras. Habrá otras opciones, así que mira el aviso para saber más.',
      invented: 'A partir del 3 de junio la biblioteca cierra ocho semanas. Puedes sacar libros del bibliobús en la estación cada viernes. Por favor, devuelve todos los libros antes del cierre.'
    },
    versionNote: 'El bibliobús para en la plaza del mercado los martes, y nadie tiene que devolver libros antes del cierre.'
  },
  leaves: {
    title: 'Por qué cambian de color las hojas',
    context: 'Un artículo breve de una revista de naturaleza para lectores curiosos.',
    sentences: {
      s1: 'El otoño es la estación favorita de mucha gente para dar largos paseos.',
      s2: 'Las hojas son verdes porque contienen mucha clorofila, el pigmento con el que las plantas captan la luz del sol.',
      s3: 'Cuando los días se acortan, muchos árboles dejan de producir clorofila y la descomponen.',
      s4: 'Los pigmentos amarillos y naranjas, llamados carotenoides, estaban en la hoja desde siempre; solo se ven cuando el verde se apaga.',
      s5: 'Los carotenoides son el mismo tipo de pigmento que hace naranjas a las zanahorias.',
      s6: 'El rojo es distinto: algunos árboles, como muchos arces, fabrican pigmentos rojos nuevos en otoño.',
      s7: 'Los investigadores creen que estos pigmentos rojos podrían proteger la hoja de la luz intensa mientras el árbol recupera nutrientes.',
      s8: 'Los días soleados y las noches frescas suelen hacer que los rojos sean más vivos.',
      s9: 'En algunas regiones, los bosques de colores atraen a muchos turistas cada año.',
      s10: 'Por último, se forma una fina capa de células donde la hoja se une a la rama, y la hoja cae.',
      s11: 'No olvides una chaqueta de abrigo si sales a mirar los árboles.'
    },
    bullets: {
      gold1: 'En otoño, los árboles dejan de producir clorofila verde y la descomponen.',
      gold2: 'Los pigmentos amarillos y naranjas estaban ahí desde siempre y se hacen visibles.',
      gold3: 'Algunos árboles, como los arces, fabrican pigmentos rojos nuevos.',
      minor: 'Se forma una fina capa de células y la hoja cae.',
      distort: 'Todos los colores de otoño son pigmentos nuevos que fabrica el árbol.',
      dup: 'Las hojas pierden su color verde.',
      subtle: 'Los pigmentos rojos protegen la hoja de la luz intensa.'
    },
    bulletNotes: {
      distort: 'Solo los rojos son nuevos; el amarillo y el naranja estaban en la hoja desde siempre.',
      dup: 'Dice menos que el punto sobre la clorofila y desperdicia un hueco.',
      subtle: 'El texto solo dice que los investigadores creen que los pigmentos rojos podrían proteger la hoja; esta viñeta lo presenta como un hecho.'
    },
    summaries: {
      faithful: 'En otoño muchos árboles descomponen su clorofila verde, lo que deja ver pigmentos amarillos y naranjas que estaban ahí desde siempre, mientras que algunos árboles fabrican además otros rojos nuevos.',
      vague: 'Las hojas cambian de color en otoño por diversos procesos naturales del árbol.',
      drops: 'En otoño, las hojas se vuelven amarillas, naranjas y rojas, y luego caen de los árboles.',
      adds: 'En otoño muchos árboles descomponen su clorofila verde, lo que deja ver pigmentos amarillos y naranjas, y cuanto más rojas las hojas, más frío será el invierno.',
      subtle: 'En otoño muchos árboles descomponen su clorofila verde, lo que deja ver pigmentos amarillos y naranjas, y las noches frías hacen que los árboles produzcan pigmentos rojos.'
    },
    summaryNotes: {
      drops: 'Describe lo que vemos, pero no por qué ocurre.',
      adds: 'El texto no dice nada sobre predecir el invierno.',
      subtle: 'Las noches frescas solo suelen avivar los rojos; el texto no dice que causen los pigmentos rojos.'
    },
    task: 'Una maestra quiere explicar esta frase a su clase con hojas de verdad.',
    oneLiner: 'La clorofila se descompone y aparecen otros colores.',
    details: {
      d1: 'Qué es la clorofila: el pigmento verde que capta la luz del sol',
      d2: 'Que el amarillo y el naranja estaban en la hoja desde siempre',
      d3: 'Que algunos árboles, como los arces, fabrican pigmentos rojos nuevos',
      d4: 'Que el otoño es una estación popular para pasear',
      d5: 'Que hace falta una chaqueta de abrigo fuera',
      d6: 'Cómo se desprende la hoja al final'
    },
    versions: {
      actionable: 'Las hojas son verdes por la clorofila, un pigmento que capta la luz del sol. En otoño muchos árboles dejan de producirla y la descomponen. Entonces se ven los pigmentos amarillos y naranjas que estaban ahí desde siempre, y algunos árboles, como los arces, fabrican otros rojos nuevos.',
      vague: 'En otoño las hojas cambian porque el verde se va y salen otros colores. Así de fascinante es la naturaleza.',
      invented: 'Las hojas son verdes por la clorofila. En otoño la helada congela la clorofila, y entonces el árbol pinta sus hojas de amarillo, naranja y rojo con pigmentos nuevos.'
    },
    versionNote: 'El texto no dice que la helada congele la clorofila, y solo los rojos son pigmentos nuevos.'
  },
  club: {
    title: 'Reunión de la junta del club deportivo',
    context: 'El acta de una reunión de la junta de un club deportivo, enviada a todos los socios.',
    sentences: {
      s1: 'La reunión se celebró en la sede del club y empezó un poco tarde por un partido de fútbol.',
      s2: 'La junta propone subir la cuota anual de 60 a 66 euros a partir del próximo enero.',
      s3: 'El motivo es que el alquiler del polideportivo ha subido un 15 por ciento.',
      s4: 'La cuota no ha cambiado en ocho años.',
      s5: 'Los socios menores de 18 seguirán pagando la cuota antigua.',
      s6: 'Los socios votarán la propuesta en la asamblea general del 12 de marzo.',
      s7: 'La junta también habló de redes nuevas para las pistas de tenis, pero aplazó la decisión.',
      s8: 'Si la propuesta se rechaza, la junta estudiará recortar algunos horarios de entrenamiento.',
      s9: 'Un club vecino también subió hace poco su cuota, hasta 75 euros.',
      s10: 'El polideportivo es del ayuntamiento, que fija el alquiler.',
      s11: '¡Muchas gracias al equipo juvenil por los deliciosos pasteles!'
    },
    bullets: {
      gold1: 'Propuesta: la cuota anual sube de 60 a 66 euros a partir de enero.',
      gold2: 'Los socios menores de 18 siguen pagando la cuota antigua.',
      gold3: 'Los socios lo votan en la asamblea general del 12 de marzo.',
      minor: 'Se habló de redes nuevas para las pistas de tenis.',
      distort: 'La junta ha decidido subir la cuota.',
      dup: 'Puede que suba la cuota de socio.',
      subtle: 'Propuesta: la cuota anual sube de 60 a 76 euros a partir de enero.'
    },
    bulletNotes: {
      distort: 'Aún no hay nada decidido: es una propuesta, y los socios la votan.',
      dup: 'Una repetición más vaga del punto de la cuota, sin importes.',
      subtle: 'Casi, pero la cuota propuesta es de 66 euros, no de 76.'
    },
    summaries: {
      faithful: 'Como ha subido el alquiler del polideportivo, la junta propone subir la cuota anual de 60 a 66 euros a partir de enero, salvo para los menores de 18, y los socios lo votarán el 12 de marzo.',
      vague: 'La junta habló de asuntos de dinero y de algunos cambios para los socios.',
      drops: 'Como ha subido el alquiler del polideportivo, las finanzas del club fueron el tema principal de la reunión de la junta.',
      adds: 'La junta propone subir la cuota anual de 60 a 66 euros a partir de enero, y quien no pague antes de marzo perderá su condición de socio.',
      subtle: 'Como ha subido el alquiler del polideportivo, la junta ha decidido subir la cuota anual de 60 a 66 euros a partir de enero, salvo para los menores de 18.'
    },
    summaryNotes: {
      drops: 'Omite la nueva cuota propuesta y la votación del 12 de marzo.',
      adds: 'El acta no dice nada de perder la condición de socio.',
      subtle: 'Es solo una propuesta que los socios aún tienen que votar, así que «ha decidido» es falso.'
    },
    task: 'Un socio te pregunta qué significa esto para él.',
    oneLiner: 'Suben las cuotas.',
    details: {
      d1: 'Los importes: de 60 a 66 euros al año',
      d2: 'Que es una propuesta que se vota en la asamblea del 12 de marzo',
      d3: 'Que los socios menores de 18 mantienen la cuota antigua',
      d4: 'Que la reunión empezó tarde',
      d5: 'Los pasteles del equipo juvenil',
      d6: 'La conversación sobre las redes de tenis'
    },
    versions: {
      actionable: 'La junta propone subir la cuota anual de 60 a 66 euros a partir de enero, porque ha subido el alquiler del polideportivo. Los menores de 18 mantienen la cuota antigua. Aún no hay nada decidido: puedes votarlo en la asamblea general del 12 de marzo.',
      vague: 'Las cuotas suben el año que viene porque todo está más caro. Ya darán más información en algún momento.',
      invented: 'A partir de enero la cuota sube de 60 a 66 euros para todos. Por favor, cambia tu transferencia antes de la asamblea general del 12 de marzo.'
    },
    versionNote: 'Trata una propuesta como si estuviera decidida y olvida que los menores de 18 mantienen la cuota antigua.'
  },
  trip: {
    title: 'Cambio en la excursión de clase',
    context: 'Un mensaje de un profesor a las familias de una clase.',
    sentences: {
      s1: '¡Espero que los niños tengan tantas ganas de excursión como yo!',
      s2: 'Por una huelga de trenes, iremos a la costa en autocar en lugar de en tren.',
      s3: 'Eso significa que salimos una hora antes de lo previsto.',
      s4: 'El punto de encuentro ya no es la estación, sino el aparcamiento detrás del colegio.',
      s5: 'La empresa de autocares tiene mucha experiencia con grupos escolares.',
      s6: 'La vuelta del viernes se mantiene como estaba prevista.',
      s7: 'No hay costes extra para las familias; el colegio paga la diferencia.',
      s8: 'El viaje en autocar dura unos 40 minutos más que el tren.',
      s9: 'La clase del año pasado fue a la montaña, y también fue un viaje estupendo.',
      s10: 'A mitad de camino hay una pausa corta en un área de servicio.',
      s11: 'Gracias a todos por vuestra ayuda con las listas de equipaje.'
    },
    bullets: {
      gold1: 'Autocar en lugar de tren por una huelga de trenes.',
      gold2: 'Salida una hora antes, desde el aparcamiento detrás del colegio.',
      gold3: 'Sin costes extra para las familias.',
      minor: 'La empresa de autocares tiene experiencia con grupos escolares.',
      distort: 'La excursión se acorta por la huelga.',
      dup: 'Los planes de viaje han cambiado.',
      subtle: 'Salida dos horas antes, desde el aparcamiento detrás del colegio.'
    },
    bulletNotes: {
      distort: 'Solo cambia el viaje de ida; la excursión no se acorta.',
      dup: 'Solo dice que algo ha cambiado, cosa que los otros puntos ya muestran.',
      subtle: 'Casi, pero la salida es una hora antes, no dos.'
    },
    summaries: {
      faithful: 'Por una huelga de trenes, la clase viaja en autocar y sale una hora antes desde el aparcamiento detrás del colegio, sin coste extra para las familias.',
      vague: 'Hay algunos cambios en la organización de la excursión que las familias deberían conocer.',
      drops: 'Por una huelga de trenes, la clase irá a la costa en autocar, lo que no cuesta nada extra a las familias.',
      adds: 'Por una huelga de trenes, la clase viaja en autocar y sale una hora antes desde el aparcamiento detrás del colegio, y las familias pagan un pequeño suplemento.',
      subtle: 'Como el autocar es más rápido que el tren, la clase viaja en autocar y sale una hora antes desde el aparcamiento detrás del colegio, sin coste extra para las familias.'
    },
    summaryNotes: {
      drops: 'Omite lo que las familias tienen que hacer: la salida más temprana y el nuevo punto de encuentro.',
      adds: 'El mensaje dice que el colegio paga la diferencia, así que no hay suplemento.',
      subtle: 'El motivo es la huelga de trenes, y el autocar es incluso más lento que el tren.'
    },
    task: 'Una madre que no vio el mensaje pregunta a otra qué hay que hacer.',
    oneLiner: 'La clase va ahora en autocar.',
    details: {
      d1: 'El nuevo punto de encuentro: el aparcamiento detrás del colegio',
      d2: 'La nueva hora: una hora antes de lo previsto',
      d3: 'Que no hay costes extra',
      d4: 'Que la empresa de autocares tiene experiencia',
      d5: 'Por qué no van en tren',
      d6: 'Que el profesor tiene ganas de excursión'
    },
    versions: {
      actionable: 'La clase va en autocar. Lleva a tu hijo una hora antes de lo previsto al aparcamiento detrás del colegio, no a la estación. No cuesta nada extra, y la vuelta del viernes no cambia.',
      vague: 'Hay huelga, así que ahora van en autocar. Las horas y los sitios cambian un poco, así que mira lo que escribió el profesor.',
      invented: 'La clase va en autocar. Lleva a tu hijo a la estación una hora antes y dale algo de dinero para el billete del autocar.'
    },
    versionNote: 'El punto de encuentro es el aparcamiento detrás del colegio, no la estación, y el colegio paga el coste.'
  },
  bikes: {
    title: 'Bicis eléctricas en la bici compartida',
    context: 'Un anuncio del servicio municipal de bicicletas compartidas a sus usuarios.',
    sentences: {
      s1: 'Ir en bici es una forma estupenda de mantenerse activo y descubrir la ciudad.',
      s2: 'A partir del 1 de julio, nuestro servicio de bicis compartidas añade 200 bicicletas eléctricas a su flota.',
      s3: 'Una bici eléctrica cuesta 20 céntimos por minuto; las bicis normales mantienen su precio actual.',
      s4: 'Para desbloquear una bici eléctrica necesitas la última versión de nuestra app.',
      s5: 'Las bicis eléctricas tienen una autonomía de unos 60 kilómetros por carga.',
      s6: 'Las bicis eléctricas deben devolverse en una de las 12 estaciones de carga; no se pueden dejar en ningún otro sitio.',
      s7: 'En la app hay un mapa de las estaciones de carga.',
      s8: 'Si se deja una bici eléctrica fuera de una estación, se cobra una tasa de 10 euros.',
      s9: 'Varias ciudades han introducido servicios parecidos en los últimos años.',
      s10: 'Las bicis las probaron 50 voluntarios durante el invierno.',
      s11: '¡Gracias por pedalear con nosotros!'
    },
    bullets: {
      gold1: 'Desde el 1 de julio: 200 bicis eléctricas a 20 céntimos por minuto.',
      gold2: 'Para desbloquearlas hace falta la última versión de la app.',
      gold3: 'Las bicis eléctricas se devuelven en una de las 12 estaciones de carga.',
      minor: 'En la app hay un mapa de las estaciones de carga.',
      distort: 'Las bicis eléctricas sustituyen a las normales.',
      dup: 'Hay bicis nuevas.',
      subtle: 'Desde el 1 de julio: 200 bicis eléctricas a 25 céntimos por minuto.'
    },
    bulletNotes: {
      distort: 'Las bicis eléctricas se añaden; las normales se quedan, con su precio actual.',
      dup: 'Una repetición más vaga del primer punto, sin fecha, número ni precio.',
      subtle: 'Casi, pero el precio es de 20 céntimos por minuto, no 25.'
    },
    summaries: {
      faithful: 'Desde el 1 de julio hay 200 bicis eléctricas a 20 céntimos por minuto; se desbloquean con la última versión de la app y deben devolverse en una de las 12 estaciones de carga.',
      vague: 'El servicio de bicis compartidas introduce este verano una novedad que puede interesar a los usuarios.',
      drops: 'El servicio de bicis compartidas añade 200 bicis eléctricas con unos 60 kilómetros de autonomía, así que los trayectos largos serán más fáciles.',
      adds: 'Desde el 1 de julio hay 200 bicis eléctricas a 20 céntimos por minuto, y las bicis normales desaparecerán el año que viene.',
      subtle: 'Desde el 1 de julio hay 200 bicis eléctricas a 20 céntimos por minuto; se desbloquean con la última versión de la app y pueden devolverse en cualquier estación de bicis.'
    },
    summaryNotes: {
      drops: 'Omite el precio y lo que deben hacer los usuarios: actualizar la app y devolver las bicis en una estación de carga.',
      adds: 'El anuncio no dice en ningún sitio que las bicis normales vayan a desaparecer.',
      subtle: 'Las bicis eléctricas solo se pueden devolver en las 12 estaciones de carga, no en cualquier estación.'
    },
    task: 'Una amiga quiere probar una bici eléctrica la semana que viene.',
    oneLiner: 'Ya hay bicis eléctricas.',
    details: {
      d1: 'El precio: 20 céntimos por minuto',
      d2: 'Que para desbloquearlas hace falta la última versión de la app',
      d3: 'Que deben volver a una estación de carga',
      d4: 'Que ir en bici te mantiene activo',
      d5: 'Cuántas bicis eléctricas hay en total',
      d6: 'Que las bicis normales mantienen su precio'
    },
    versions: {
      actionable: 'Desde el 1 de julio puedes alquilar bicis eléctricas a 20 céntimos por minuto. Primero actualiza la app, porque necesitas la última versión para desbloquearlas. Al terminar, devuelve la bici en una de las 12 estaciones de carga que salen en el mapa de la app.',
      vague: 'Ya hay bicis eléctricas y son muy fáciles de usar. Bájate la app y a pedalear.',
      invented: 'Desde el 1 de julio puedes alquilar bicis eléctricas a 20 céntimos por minuto sin la app, y al terminar puedes dejarlas en cualquier parte de la ciudad.'
    },
    versionNote: 'Hace falta la última versión de la app para desbloquearlas, y deben volver a una estación de carga.'
  }
};
