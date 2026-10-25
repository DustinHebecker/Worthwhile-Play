import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'El paquete azul',
      story: 'Ha llegado a la tienda de la esquina un paquete sin remitente. Tiene que venir de uno de los almacenes que reparten en esta calle.',
      lead: 'Los paquetes de esta calle vienen de:',
      hyps: { north: 'Almacén Norte', south: 'Almacén Sur', east: 'Almacén Este' },
      clues: {
        blue: { label: 'Envuelto en papel azul', seen: 'El paquete está envuelto en papel azul.', notSeen: 'El paquete no está envuelto en papel azul.' },
        'brown-tape': { label: 'Cerrado con cinta marrón', seen: 'Está cerrado con cinta marrón.', notSeen: 'No está cerrado con cinta marrón.' },
        smudge: { label: 'Etiqueta emborronada', seen: 'La etiqueta de la dirección está emborronada.', notSeen: 'La etiqueta de la dirección está limpia.' },
        string: { label: 'Atado con cuerda', seen: 'Está atado con cuerda.', notSeen: 'No está atado con cuerda.' },
        tuesday: { label: 'Llegó un martes', seen: 'Llegó un martes. Todos los almacenes reparten todos los días laborables.', notSeen: 'Llegó un martes. Todos los almacenes reparten todos los días laborables.' },
        'echo-blue': { label: 'La vecina también lo vio', seen: 'La vecina también dice que el paquete era azul: vio el mismo paquete.', notSeen: 'La vecina también dice que el paquete era azul: vio el mismo paquete.' }
      }
    },
    'c-garden': {
      title: 'Las fresas mordisqueadas',
      story: 'Durante la noche alguien se ha comido parte de las fresas. En este jardín se sabe que algunos visitantes las picotean.',
      lead: 'Las noches en que se mordisquean las fresas, el visitante es:',
      hyps: { birds: 'Pájaros', snails: 'Caracoles', hedgehog: 'Un erizo' },
      clues: {
        slime: { label: 'Rastro brillante', seen: 'Hay un rastro brillante en el camino.', notSeen: 'No hay ningún rastro brillante.' },
        pecks: { label: 'Pequeños picotazos', seen: 'La fruta tiene pequeños picotazos.', notSeen: 'No hay picotazos.' },
        droppings: { label: 'Excrementos bajo el seto', seen: 'Hay excrementos bajo el seto.', notSeen: 'No hay nada bajo el seto.' },
        'net-moved': { label: 'Red apartada', seen: 'La red sobre el bancal está apartada.', notSeen: 'La red sigue en su sitio.' },
        rain: { label: 'Anoche llovió', seen: 'Anoche llovió: con lluvia salen todos.', notSeen: 'Anoche llovió: con lluvia salen todos.' },
        'echo-slime': { label: 'Visto otra vez por la mañana', seen: 'Tu vecino te señala el mismo rastro brillante.', notSeen: 'Tu vecino te señala el mismo rastro brillante.' }
      }
    },
    'c-cups': {
      title: 'La taza agrietada',
      story: 'Un cliente devuelve una taza con una grieta fina. Todas las máquinas del taller hacen la misma taza, pero cada una tiene sus manías.',
      lead: 'Las tazas del taller las hace:',
      hyps: { a: 'La máquina A', b: 'La máquina B', c: 'La máquina C' },
      clues: {
        crack: { label: 'Grieta fina', seen: 'La taza tiene una grieta fina.', notSeen: 'La taza tiene una grieta fina.' },
        glaze: { label: 'Esmalte más oscuro', seen: 'El esmalte es algo más oscuro de lo normal.', notSeen: 'El esmalte se ve normal.' },
        stamp: { label: 'Sello nítido en la base', seen: 'El sello del fabricante en la base es nítido.', notSeen: 'El sello de la base está borroso.' },
        handle: { label: 'Asa algo descentrada', seen: 'El asa está algo descentrada.', notSeen: 'El asa está recta.' },
        box: { label: 'En una caja gris', seen: 'Llegó en la caja gris de siempre, como las tazas de todas las máquinas.', notSeen: 'Llegó en la caja gris de siempre, como las tazas de todas las máquinas.' }
      }
    },
    'c-key': {
      title: 'La llave perdida',
      story: 'La llave de repuesto ha vuelto a desaparecer. Casi siempre está en uno de los mismos pocos sitios.',
      lead: 'Cuando la llave desaparece, aparece:',
      hyps: { coat: 'En el abrigo', car: 'En el coche', office: 'En la oficina' },
      clues: {
        'search-coat': { label: 'Un vistazo rápido al abrigo la encuentra', seen: 'Encuentras la llave en el abrigo.', notSeen: 'Miras rápido los bolsillos del abrigo: no hay llave. Un vistazo rápido puede pasarla por alto.' },
        'search-car': { label: 'Un vistazo rápido al coche la encuentra', seen: 'Encuentras la llave en el coche.', notSeen: 'Miras rápido en el coche: no hay llave. Un vistazo rápido puede pasarla por alto.' },
        jingle: { label: 'Un tintineo en el pasillo', seen: 'Recuerdas un tintineo al colgar el abrigo.', notSeen: 'No recuerdas ningún tintineo.' },
        drove: { label: 'Ayer condujiste', seen: 'Ayer condujiste.', notSeen: 'Ayer no condujiste.' },
        'office-day': { label: 'Estuviste en la oficina', seen: 'Ayer estuviste en la oficina.', notSeen: 'Ayer trabajaste desde casa.' },
        weekday: { label: 'Es un día laborable', seen: 'Hoy es un día laborable: eso no cambia dónde acaban las llaves.', notSeen: 'Hoy es un día laborable: eso no cambia dónde acaban las llaves.' }
      }
    },
    'c-coin': {
      title: 'La moneda de la feria',
      story: 'Encontraste una moneda antigua en un puesto de feria que vende artículos de magia. A simple vista no se distingue de una moneda normal, así que la lanzas.',
      lead: 'Las monedas de la caja de monedas antiguas del puesto son:',
      hyps: { ordinary: 'Una moneda normal', weighted: 'Una moneda trucada', 'two-headed': 'Una moneda con dos caras' },
      clues: {
        toss1: { label: 'Cara en el primer lanzamiento', seen: 'Primer lanzamiento: cara.', notSeen: 'Primer lanzamiento: cruz.' },
        toss2: { label: 'Cara en el segundo lanzamiento', seen: 'Segundo lanzamiento: cara.', notSeen: 'Segundo lanzamiento: cruz.' },
        toss3: { label: 'Cara en el tercer lanzamiento', seen: 'Tercer lanzamiento: cara.', notSeen: 'Tercer lanzamiento: cruz.' },
        toss4: { label: 'Cara en el cuarto lanzamiento', seen: 'Cuarto lanzamiento: cara.', notSeen: 'Cuarto lanzamiento: cruz.' }
      }
    },
    'c-message': {
      title: 'El mensaje «del club»',
      story: 'Un mensaje dice venir de tu club deportivo y te pide que confirmes tu inscripción.',
      lead: 'Los mensajes que dicen venir del club son:',
      hyps: { real: 'De verdad del club', fake: 'Falsos' },
      clues: {
        link: { label: 'Contiene un enlace', seen: 'Contiene un enlace.', notSeen: 'No contiene ningún enlace.' },
        sender: { label: 'Remitente desconocido', seen: 'La dirección del remitente no es la habitual del club.', notSeen: 'La dirección del remitente es la habitual.' },
        hurry: { label: 'Te mete prisa', seen: 'Dice que debes responder hoy.', notSeen: 'No pone ningún plazo.' },
        'your-name': { label: 'Usa tu nombre', seen: 'Te saluda por tu nombre.', notSeen: 'Solo dice «Estimado socio».' },
        evening: { label: 'Llegó por la tarde', seen: 'Llegó por la tarde: los dos tipos llegan a cualquier hora.', notSeen: 'Llegó por la tarde: los dos tipos llegan a cualquier hora.' }
      }
    },
    'c-oven': {
      title: 'El pan quemado',
      story: 'Un pan de la hornada de esta mañana salió quemado por un lado. La panadería hornea en dos hornos.',
      lead: 'Los panes de aquí se hornean en:',
      hyps: { old: 'El horno viejo', new: 'El horno nuevo' },
      clues: {
        'burnt-side': { label: 'Quemado por un lado', seen: 'Está quemado por un lado.', notSeen: 'Está quemado por un lado.' },
        'pale-top': { label: 'Parte de arriba pálida', seen: 'La parte de arriba está pálida.', notSeen: 'La parte de arriba está dorada por igual.' },
        'tray-mark': { label: 'Marca de las bandejas nuevas', seen: 'La base muestra el dibujo de las bandejas nuevas.', notSeen: 'La base es lisa.' },
        early: { label: 'De la primera hornada', seen: 'Salió de la primera hornada.', notSeen: 'Salió de una hornada posterior.' },
        seeds: { label: 'Semillas por encima', seen: 'Lleva semillas por encima: los dos hornos hacen pan con semillas.', notSeen: 'Lleva semillas por encima: los dos hornos hacen pan con semillas.' }
      }
    },
    'c-beep': {
      title: 'El pitido débil en la radio',
      story: 'El receptor del club de radio captó un pitido débil y regular. La mayoría de estos pitidos son interferencias, pero también pasa por encima un pequeño satélite.',
      lead: 'Los pitidos débiles y regulares en este receptor son:',
      hyps: { satellite: 'Una señal de un pequeño satélite', interference: 'Una interferencia corriente' },
      clues: {
        'pass-time': { label: 'Durante un paso del satélite', seen: 'Llegó cuando el satélite debía pasar por encima.', notSeen: 'Llegó cuando no tocaba ningún paso.' },
        drift: { label: 'El tono se desplaza despacio', seen: 'El tono se desplaza despacio, como el de una fuente en movimiento.', notSeen: 'El tono se mantiene fijo.' },
        fades: { label: 'Se apaga al cabo de un rato', seen: 'Se apaga al cabo de unos diez minutos.', notSeen: 'Sigue sin parar.' },
        rhythm: { label: 'Un ritmo regular', seen: 'Pita con un ritmo regular: ambos lo hacen.', notSeen: 'Pita con un ritmo regular: ambos lo hacen.' },
        'other-receiver': { label: 'Un segundo receptor lo oye', seen: 'Un socio del club al otro lado de la ciudad también lo oye.', notSeen: 'El receptor del otro lado de la ciudad no oye nada.' }
      }
    },
    'c-rain': {
      title: '¿Llovió por la noche?',
      story: 'Pasaste la noche fuera y quieres saber si los plantones recibieron lluvia o hay que regarlos ahora.',
      lead: 'Las noches en esta época del año:',
      hyps: { rained: 'Llovió', dry: 'No llovió' },
      clues: {
        'wet-grass': { label: 'Hierba mojada', seen: 'La hierba está mojada (el rocío también la moja).', notSeen: 'La hierba está seca.' },
        gauge: { label: 'Agua en el pluviómetro', seen: 'Hay agua en el pluviómetro.', notSeen: 'El pluviómetro está vacío.' },
        puddle: { label: 'Charco junto a la verja', seen: 'Hay un charco junto a la verja.', notSeen: 'No hay ningún charco junto a la verja.' },
        'snails-out': { label: 'Caracoles en el camino', seen: 'Hay caracoles en el camino.', notSeen: 'No hay caracoles en el camino.' },
        wind: { label: 'Hojas en la mesa', seen: 'El viento ha llevado hojas a la mesa: hizo viento en cualquier caso.', notSeen: 'El viento ha llevado hojas a la mesa: hizo viento en cualquier caso.' }
      }
    },
    'c-bird': {
      title: '¿Qué pájaro estaba en el comedero?',
      story: 'Solo viste un momento un pajarillo marrón en el comedero antes de que se fuera volando. Las proporciones son inventadas para este comedero; las reales varían según el lugar.',
      lead: 'Los pequeños visitantes marrones de este comedero son:',
      hyps: { finch: 'Un pinzón', sparrow: 'Un gorrión' },
      clues: {
        'red-patch': { label: 'Un destello rojo', seen: 'Viste un destello rojo en su cabeza.', notSeen: 'No viste nada rojo.' },
        ground: { label: 'Comió en el suelo', seen: 'Comió en el suelo bajo el comedero.', notSeen: 'Comió en el propio comedero.' },
        song: { label: 'Un canto trinado', seen: 'Soltó un canto trinado.', notSeen: 'Solo piaba.' },
        group: { label: 'Vino en grupo', seen: 'Vino con un grupito.', notSeen: 'Vino solo.' },
        morning: { label: 'Por la mañana', seen: 'Era temprano por la mañana: los dos vienen a esa hora.', notSeen: 'Era temprano por la mañana: los dos vienen a esa hora.' }
      }
    },
    'c-plant': {
      title: 'La planta mustia',
      story: 'La planta de la oficina está mustia y tiene hojas amarillas. En esta oficina suele ser una de dos cosas.',
      lead: 'Cuando las plantas de aquí se ponen mustias, la causa es:',
      hyps: { water: 'Demasiada agua', light: 'Poca luz' },
      clues: {
        'wet-soil': { label: 'Tierra mojada', seen: 'La tierra sigue mojada dos días después de regar.', notSeen: 'La tierra está seca.' },
        leaning: { label: 'Se inclina hacia la ventana', seen: 'Se inclina hacia la ventana.', notSeen: 'Está recta.' },
        'soft-stem': { label: 'Base del tallo blanda', seen: 'La base del tallo está blanda.', notSeen: 'El tallo está firme.' },
        'pale-new': { label: 'Hojas nuevas pálidas', seen: 'Las hojas nuevas son pálidas y pequeñas.', notSeen: 'Las hojas nuevas se ven sanas.' },
        'pot-colour': { label: 'Una maceta azul', seen: 'Está en una maceta azul: eso no cambia nada.', notSeen: 'Está en una maceta azul: eso no cambia nada.' }
      }
    },
    'c-bus': {
      title: '¿Por qué llegó tarde el autobús?',
      story: 'Tu autobús llegó esta mañana con cuarenta minutos de retraso.',
      lead: 'Cuando este autobús llega muy tarde, la razón es:',
      hyps: { jam: 'Un atasco', breakdown: 'Una avería' },
      clues: {
        'others-late': { label: 'Otros autobuses también tarde', seen: 'Otros autobuses de la misma calle también llegaron tarde.', notSeen: 'Otros autobuses de la calle llegaron a su hora.' },
        replacement: { label: 'Vino otro autobús', seen: 'Vino un autobús distinto del habitual.', notSeen: 'Vino el autobús de siempre.' },
        announcement: { label: 'Un aviso', seen: 'La pantalla decía: retraso por una avería técnica.', notSeen: 'La pantalla no daba ningún motivo.' },
        'rush-hour': { label: 'En hora punta', seen: 'Era hora punta.', notSeen: 'Era un momento tranquilo del día.' },
        rain: { label: 'Llovía', seen: 'Llovía: en esta parada eso no cambia nada.', notSeen: 'Llovía: en esta parada eso no cambia nada.' }
      }
    }
  },
checks: {
    'k-picnic': {
      title: '¿Al aire libre o en el salón?',
      story: 'La merienda del barrio es esta tarde. Puedes hacerla en el césped o reservar el salón vecinal.',
      lead: 'Las tardes en esta época del año son:',
      hyps: { dry: 'Secas', rain: 'Lluviosas' },
      question: '¿Qué probabilidad hay de una tarde seca?',
      options: { outdoors: 'Merienda en el césped', hall: 'Reservar el salón', tent: 'Montar una carpa en el césped' },
      checks: {
        sky: { label: 'Mirar el cielo a mediodía', yes: 'Nubes oscuras a mediodía.', no: 'Sin nubes oscuras a mediodía.' },
        barometer: { label: 'Mirar el barómetro', yes: 'El barómetro baja.', no: 'El barómetro se mantiene.' },
        farmer: { label: 'Preguntar al granjero de al lado', yes: 'El granjero espera lluvia.', no: 'El granjero espera una tarde seca.' },
        service: { label: 'Llamar al servicio meteorológico', yes: 'El servicio meteorológico avisa de lluvia.', no: 'El servicio meteorológico no da ningún aviso.' },
        swallows: { label: 'Observar las golondrinas', yes: 'Las golondrinas vuelan bajo.', no: 'Las golondrinas vuelan alto.' }
      }
    },
    'k-bike': {
      title: '¿Comprar la bici de segunda mano?',
      story: 'Se vende una bici de segunda mano a buen precio. Las bicis así suelen estar bien, pero algunas tienen daños ocultos.',
      lead: 'Las bicis de segunda mano como esta están:',
      hyps: { sound: 'En buen estado', damaged: 'Con daños ocultos' },
      question: '¿Qué probabilidad hay de que la bici esté en buen estado?',
      options: { buy: 'Comprarla', skip: 'Dejarla', 'offer-less': 'Ofrecer menos y asumir el riesgo' },
      checks: {
        ride: { label: 'Dar una vuelta de prueba', yes: 'La vuelta de prueba va suave.', no: 'La vuelta de prueba da tumbos.' },
        chain: { label: 'Mirar la cadena', yes: 'La cadena está oxidada.', no: 'La cadena está limpia.' },
        receipts: { label: 'Pedir facturas de reparación', yes: 'El vendedor tiene facturas de reparación.', no: 'El vendedor no tiene facturas.' },
        mechanic: { label: 'Pagar a un mecánico para que la mire', yes: 'El mecánico encuentra un problema.', no: 'El mecánico no encuentra nada.' },
        'seller-says': { label: 'Preguntar al vendedor', yes: 'El vendedor dice que está bien.', no: 'El vendedor no está seguro.' }
      }
    },
    'k-seeds': {
      title: '¿Sembrar las semillas viejas?',
      story: 'En el cobertizo apareció un sobre de semillas olvidado. Sembrarlas lleva un fin de semana; las semillas nuevas cuestan un poco.',
      lead: 'Los sobres olvidados como este están:',
      hyps: { good: 'Todavía bien', dead: 'Casi todas muertas' },
      question: '¿Qué probabilidad hay de que las semillas estén todavía bien?',
      options: { sow: 'Sembrar las viejas', fresh: 'Comprar semillas nuevas' },
      checks: {
        float: { label: 'Poner algunas en agua', yes: 'La mayoría se hunden.', no: 'La mayoría flotan.' },
        sprout: { label: 'Probar unas pocas en un paño húmedo', yes: 'La mayoría germinan.', no: 'Germinan pocas.' },
        date: { label: 'Leer la fecha del sobre', yes: 'La fecha es reciente.', no: 'La fecha es antigua.' },
        shrivelled: { label: 'Mirar las semillas de cerca', yes: 'Las semillas parecen arrugadas.', no: 'Las semillas parecen llenas.' },
        smell: { label: 'Olerlas', yes: 'Huelen a fresco.', no: 'Huelen a humedad.' }
      }
    },
    'k-melon': {
      title: '¿Comprar este melón?',
      story: 'En el mercado queda un melón a buen precio.',
      lead: 'Los melones que quedan a esta hora en este puesto están:',
      hyps: { ripe: 'Maduros', unripe: 'Todavía verdes' },
      question: '¿Qué probabilidad hay de que el melón esté maduro?',
      options: { buy: 'Comprarlo', leave: 'Dejarlo' },
      checks: {
        knock: { label: 'Darle golpecitos', yes: 'Suena hueco.', no: 'Suena sordo.' },
        smell: { label: 'Olerlo', yes: 'Huele dulce.', no: 'Apenas huele a nada.' },
        'soft-end': { label: 'Apretar la punta', yes: 'La punta cede un poco.', no: 'La punta está dura.' },
        taste: { label: 'Probar una tajada de la misma caja', yes: 'La tajada es dulce.', no: 'La tajada es sosa.' },
        sticker: { label: 'Leer la pegatina', yes: 'Lleva una pegatina de «maduro».', no: 'No lleva pegatina.' }
      }
    },
    'k-bread': {
      title: '¿Hornear de más para el mercado?',
      story: 'Mañana es día de mercado. El pan extra se vende bien en un día concurrido, pero se queda duro en uno tranquilo.',
      lead: 'Los días de mercado aquí son:',
      hyps: { busy: 'Concurridos', quiet: 'Tranquilos' },
      question: '¿Qué probabilidad hay de un día de mercado concurrido?',
      options: { extra: 'Hornear mucho más', normal: 'Hornear lo de siempre', 'little-extra': 'Hornear un poco más' },
      checks: {
        calendar: { label: 'Consultar la agenda del pueblo', yes: 'La agenda anuncia un evento.', no: 'La agenda no anuncia nada.' },
        neighbour: { label: 'Preguntar al puesto de quesos', yes: 'El puesto de quesos espera mucha gente.', no: 'El puesto de quesos espera un día tranquilo.' },
        sunny: { label: 'Leer el pronóstico', yes: 'Se pronostica sol.', no: 'Se pronostican nubes.' },
        office: { label: 'Llamar a la oficina del mercado', yes: 'La oficina del mercado espera muchos visitantes.', no: 'La oficina del mercado espera lo de siempre.' },
        'last-week': { label: 'Pensar en la semana pasada', yes: 'La semana pasada hubo mucha gente.', no: 'La semana pasada fue tranquila.' }
      }
    },
    'k-laptop': {
      title: '¿Repararlo tú mismo?',
      story: 'El portátil se apaga al azar. Repararlo en casa sale barato si la avería es leve, pero es un esfuerzo perdido si es grave.',
      lead: 'Las averías como esta son:',
      hyps: { minor: 'Una avería leve', major: 'Una avería grave' },
      question: '¿Qué probabilidad hay de una avería leve?',
      options: { repair: 'Repararlo en casa', shop: 'Llevarlo a una tienda', wait: 'Esperar y observar' },
      checks: {
        'error-code': { label: 'Reiniciar y observar', yes: 'Aparece un código de error.', no: 'No aparece ningún código de error.' },
        diagnostics: { label: 'Usar la herramienta de diagnóstico', yes: 'La herramienta informa de un fallo.', no: 'La herramienta no informa de nada.' },
        cable: { label: 'Cambiar el cable de corriente', yes: 'Con otro cable funciona.', no: 'Sigue apagándose.' },
        fan: { label: 'Escuchar el ventilador', yes: 'El ventilador hace un ruido de roce.', no: 'El ventilador suena normal.' },
        forum: { label: 'Leer el foro', yes: 'Otros con este modelo dicen que fue algo leve.', no: 'Otros con este modelo cuentan causas diversas.' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: 'El sensor de farolas',
      story: 'El ayuntamiento revisa sus farolas viejas con un sensor. De todas las farolas, {f} están realmente averiadas. El sensor señala {s} de las averiadas, pero por error también señala {q} de las que funcionan. Acaban de señalar la farola {lamp}.',
      questions: { q1: '¿Es más probable que la farola {lamp} esté averiada o que funcione?', q2: '¿Qué probabilidad hay de que la farola {lamp} esté averiada?' },
      options: { faulty: 'Más probable que esté averiada', working: 'Más probable que funcione' },
      explain: 'Cuenta las farolas señaladas: {k} de las {n} señaladas están realmente averiadas, así que la probabilidad es {p}. Que una señal sea fiable depende de lo raras que sean las farolas averiadas, no solo de lo bueno que sea el sensor.',
      labels: { faulty: 'Farolas averiadas', working: 'Farolas que funcionan', fit: 'señaladas' }
    },
    't-wheel': {
      title: 'La ruleta',
      story: 'Una ruleta justa tiene {k} sectores iguales, y {r} de ellos muestran una estrella. Las últimas {s} tiradas fallaron la estrella.',
      questions: { q1: 'En la próxima tirada, una estrella es…', q2: '¿Qué probabilidad hay de una estrella en la próxima tirada?' },
      options: { more: 'más probable de lo normal', less: 'menos probable de lo normal', same: 'igual de probable que siempre' },
      explain: 'La ruleta no tiene memoria: cada tirada empieza de cero, así que la estrella sigue saliendo en {p} de las veces.',
      labels: { spins: 'Las tiradas falladas y la siguiente' }
    },
    't-sequence': {
      title: '¿Qué resultado es más probable?',
      story: 'Se lanza una moneda justa {n} veces (● cara, ○ cruz). Dos resultados posibles: A {a} y B {b}.',
      questions: { q1: '¿Qué resultado exacto es más probable?', q2: '¿Qué probabilidad tiene exactamente el resultado B?' },
      options: { a: 'A', b: 'B', same: 'Los dos son igual de probables' },
      explain: 'Hay {total} resultados posibles, y cada uno exacto tiene la misma probabilidad, {p}. B solo parece más típico porque los resultados mezclados, como grupo, son frecuentes.',
      labels: { a: 'A', b: 'B' }
    },
    't-conjunction': {
      title: 'Lluvia y viento',
      story: 'El pronóstico de mañana da a la lluvia una probabilidad de {a}. Aquí, en los días de lluvia hace viento {b} de las veces; en los días secos, {w} de las veces.',
      questions: { q1: '¿Qué es más probable mañana?', q2: '¿Qué probabilidad hay de un día con lluvia y viento?' },
      options: { windy: 'Un día con viento', both: 'Un día con lluvia y viento', same: 'Los dos igual' },
      explain: 'Imagina {days} días como mañana: {both} tienen lluvia y viento, pero {windy} tienen viento en total. Todo día con lluvia y viento es también un día con viento, así que «lluvia y viento» nunca puede ser más probable que «viento».',
      labels: { windy: 'Con viento', calm: 'Sin viento', rainy: 'Días de lluvia', dry: 'Días secos' }
    },
    't-simpson': {
      title: 'Los dos servicios de reparto',
      story: 'Dos servicios de reparto informan de cuántas veces llegaron puntuales el mes pasado. Servicio A: rutas cortas {aSk} de {aSn}, rutas largas {aLk} de {aLn}. Servicio B: rutas cortas {bSk} de {bSn}, rutas largas {bLk} de {bLn}.',
      questions: { q1: '¿Qué servicio fue puntual más a menudo en total?', q2: 'Tu paquete va por una ruta larga. ¿Qué servicio tiene mejor historial en rutas largas?' },
      options: { a: 'El servicio A', b: 'El servicio B', same: 'Los dos igual' },
      explain: 'A es mejor en rutas cortas y en rutas largas, y aun así B es mejor en total ({b} frente a {a} repartos puntuales), porque B hace sobre todo las rutas cortas, más fáciles. Compara lo comparable.',
      labels: { a: 'Servicio A', b: 'Servicio B', short: 'Rutas cortas', long: 'Rutas largas', overall: 'En total' }
    },
    't-paw': {
      title: 'La huella en la harina',
      story: 'Esta noche alguien caminó sobre la harina del suelo de la panadería. La huella coincide con el gato de los vecinos. Solo {r} gatos tienen una huella así. Cerca viven unos {n} gatos que podrían haber entrado.',
      questions: { q1: '¿Significa «solo {r}» que casi seguro fue el gato de los vecinos?', q2: '¿Qué probabilidad hay de que fuera el gato de los vecinos? Supón que cualquier gato cercano tenía la misma probabilidad de entrar.' },
      options: { yes: 'Sí, con una seguridad de {sure}', no: 'No, con mucha menos seguridad' },
      explain: 'Entre los {n} gatos cercanos, unos {others} más tienen también una huella que coincide. El gato de los vecinos es solo uno de varios que encajan: {p}.',
      labels: { neighbour: 'Noches en que entró el gato de los vecinos', others: 'Noches en que entró otro gato', fit: 'la huella coincide' }
    },
    't-bakery': {
      title: 'La panadería pequeña y la grande',
      story: 'Dos panaderías venden pan de centeno y de trigo. De media, la mitad de los panes vendidos son de centeno, y cada pan es una elección aparte. La panadería pequeña vende {n1} panes al día; la grande, {n2}.',
      questions: { q1: '¿Qué panadería tiene más días en los que más de {t} de los panes vendidos son de centeno?', q2: '¿En qué parte de los días vende la panadería pequeña más de {t} de centeno?' },
      options: { small: 'La panadería pequeña', large: 'La panadería grande', same: 'Más o menos igual' },
      explain: 'Las muestras pequeñas oscilan más. La panadería pequeña tiene esos días {small} de las veces; la grande, solo {large}.',
      labels: { small: 'Panadería pequeña', large: 'Panadería grande' }
    },
    't-drawers': {
      title: 'El conserje que lo sabe',
      story: 'Uno de {n} cajones cerrados guarda la llave. Señalas un cajón. El conserje, que sabe dónde está la llave, abre entonces {opened} de los otros cajones, todos vacíos, y deja cerrado exactamente otro. Siempre lo hace así y nunca abre el tuyo.',
      questions: { q1: '¿Te quedas con tu cajón o cambias al otro cerrado?', q2: '¿Qué probabilidad hay de que la llave esté en el otro cajón cerrado?' },
      options: { switch: 'Cambiar', keep: 'Quedarme con mi cajón', same: 'Da igual' },
      explain: 'Imagina {total} partidas. Tu primera elección acierta solo en una parte. En las otras {wins}, el conserje tiene que dejar cerrado el cajón de la llave, así que cambiar gana: {p}.',
      labels: { right: 'Partidas en que tu primera elección tiene la llave', wrong: 'Partidas en que no', fit: 'cambiar gana' }
    },
    't-week': {
      title: 'Al menos un día de lluvia',
      story: 'Planeas un viaje de {m} días. Cada día tiene una probabilidad de lluvia de {q}, independiente de los demás días.',
      questions: { q1: '¿Qué probabilidad hay de al menos un día de lluvia?' },
      options: {},
      explain: 'Sumar las probabilidades daría {sum}, y eso no puede ser. Multiplica en cambio las probabilidades de un día seco: ninguna lluvia tiene una probabilidad de {none}, así que al menos un día de lluvia tiene {p}.',
      labels: { step: 'Todavía seco tras el día {n}' }
    },
    't-numbers': {
      title: 'El mismo número dos veces',
      story: 'Cada una de {g} personas elige en secreto, al azar, un número entero del uno al {r}.',
      questions: { q1: '¿Qué probabilidad hay de que al menos dos elijan el mismo número? Primero tu intuición:', q2: 'Ahora tu estimación: ¿qué probabilidad hay de al menos un número compartido?' },
      options: { low: 'Menos de una entre cuatro', even: 'Más o menos mitad y mitad', high: 'Más de tres entre cuatro' },
      explain: 'Con {g} personas hay {pairs} parejas que podrían coincidir, así que una coincidencia llega antes de lo que parece: {p}.',
      labels: { step: 'Todos distintos entre los primeros {n}' }
    },
    't-tyres': {
      title: 'Menos pinchazos',
      story: 'Un nuevo tipo de neumático reduce los pinchazos de {b} a {a} por cada cien trayectos. El fabricante lo llama {rel} menos pinchazos.',
      questions: { q1: 'En {rides} trayectos, ¿cuántos pinchazos menos hay?' },
      options: {},
      explain: 'En {rides} trayectos hay {old} pinchazos antes y {new} después: {fewer} menos. «{rel} menos» suena grande; lo que notas es el cambio absoluto.',
      labels: { old: 'Neumáticos antiguos', new: 'Neumáticos nuevos', fit: 'pinchazos' }
    },
    't-dice': {
      title: 'Dos dados',
      story: 'Lanzas dos dados normales y sumas los puntos.',
      questions: { q1: '¿Qué suma es más probable: {s1} o {s2}?', q2: '¿Qué probabilidad tiene la suma {s1}?' },
      options: { first: '{s1}', second: '{s2}', same: 'Igual de probables' },
      explain: 'De los treinta y seis resultados igual de probables, {c1} dan {s1} y {c2} dan {s2}.',
      labels: {}
    }
  }
};
