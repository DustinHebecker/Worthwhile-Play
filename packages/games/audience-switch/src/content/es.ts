import type { ContentText } from './types';

export const content: ContentText = {
  migration: {
    title: 'Migración de base de datos',
    situation: 'Tu equipo está trasladando la base de datos de clientes a un sistema nuevo. Las pruebas han encontrado un problema y el cambio se retrasa. Explícalo.',
    facts: {
      newDate: 'El cambio se retrasa dos días: el jueves en lugar del martes.',
      cause: 'Las pruebas encontraron un error desconocido hasta ahora con caracteres especiales como ü o é.',
      noLoss: 'No se ha perdido ningún dato.',
      encoding: 'El script de importación lee el texto con una codificación de caracteres incorrecta.',
      apology: 'Sentimos las molestias.',
      regression: 'Una nueva prueba automática comprueba ahora los caracteres especiales.',
      buffer: 'Los dos días caben en el margen de tiempo del proyecto, sin coste adicional.',
      library: 'La conversión errónea viene de una biblioteca elegida hace años.'
    },
    reasons: {
      'developer.cause': 'Los desarrolladores necesitan saber qué encontraron realmente las pruebas.',
      'developer.encoding': 'Es la causa de fondo en la que van a trabajar.',
      'developer.apology': 'Una disculpa a los clientes no ayuda a una compañera a corregir el error.',
      'developer.regression': 'Necesitan saber que el error ya está cubierto por una prueba.',
      'developer.buffer': 'El margen de tiempo y el presupuesto son asunto de la jefa de proyecto.',
      'projectManager.newDate': 'La jefa de proyecto planifica con la nueva fecha.',
      'projectManager.noLoss': 'Una pérdida de datos cambiaría el riesgo por completo, así que necesita oír que no la hay.',
      'projectManager.encoding': 'El detalle de la codificación no cambia ninguna decisión de planificación.',
      'projectManager.apology': 'La disculpa es para los clientes; la jefa de proyecto necesita hechos.',
      'projectManager.buffer': 'Si el calendario y el presupuesto se mantienen es justo su pregunta.',
      'projectManager.library': 'Quién eligió una biblioteca hace años no ayuda ahora a planificar.',
      'customer.newDate': 'El cliente necesita la nueva fecha, no el tipo de error.',
      'customer.noLoss': 'Su primera preocupación son sus datos, y están a salvo.',
      'customer.cause': 'Los detalles del error preocupan al cliente sin ayudarle.',
      'customer.encoding': 'Los detalles técnicos internos no le dicen nada al cliente.',
      'customer.regression': 'Las pruebas internas no son asunto del cliente.',
      'customer.buffer': 'Los márgenes y costes internos no le incumben al cliente.',
      'customer.library': 'Culpar a una biblioteca antigua suena a excusa.'
    },
    messages: {
      'developer.fit': 'Aviso: el script de importación lee el texto con la codificación equivocada, así que caracteres especiales como ü y é se rompen. Ya hay una prueba de regresión que lo cubre; el cambio pasa al jueves.',
      'developer.missing': 'Pequeño retraso en la migración, nada grave. Detalles más adelante.',
      'developer.condescending': 'Los caracteres especiales son letras como la ü que no están en el alfabeto básico. Los ordenadores guardan las letras como números y a veces los números se mezclan.',
      'projectManager.fit': 'La migración pasa del martes al jueves. No se ha perdido ningún dato y los dos días caben en nuestro margen sin coste adicional. Causa: un error con caracteres especiales, ya cubierto por una prueba.',
      'projectManager.tooMuch': 'El script de importación decodifica la entrada como Latin-1 en vez de UTF-8, de modo que los caracteres multibyte se corrompen; estamos parcheando el lector y añadiendo una prueba de regresión.',
      'projectManager.missing': 'Hemos encontrado un error y estamos trabajando en ello. Ya te avisaremos.',
      'customer.fit': 'Sus datos están a salvo. Para asegurarnos de que cada nombre y cada dirección se transfieran correctamente, trasladamos el cambio del martes al jueves. Hasta entonces, todo funciona como siempre.',
      'customer.tooMuch': 'Nuestro script de importación usó una codificación de caracteres incorrecta que dañó los caracteres especiales en las pruebas, así que la migración necesita dos días más de nuestro margen.',
      'customer.condescending': 'No se preocupe por la parte técnica, es complicada. Solo sepa que tardará un poco más.'
    }
  },
  skyBlue: {
    title: 'Por qué el cielo es azul',
    situation: 'Alguien te pregunta por qué el cielo es azul. Conoces la física que hay detrás. Explícalo.',
    facts: {
      sunlight: 'La luz del sol contiene todos los colores.',
      scatter: 'El aire dispersa la luz azul mucho más que la roja.',
      rayleigh: 'Esta dispersión de Rayleigh crece con la cuarta potencia de la frecuencia (1/λ⁴).',
      sunset: 'Al atardecer, la luz atraviesa más aire, por eso el cielo se vuelve rojo y naranja.',
      everywhere: 'La luz azul dispersada llega a tus ojos desde todas las direcciones, por eso todo el cielo se ve azul.',
      violet: 'El violeta se dispersa aún más, pero la luz del sol tiene menos violeta y nuestros ojos son menos sensibles a él.',
      molecules: 'La dispersión la producen moléculas de nitrógeno y oxígeno, mucho más pequeñas que la longitud de onda de la luz.',
      ocean: 'El cielo es azul porque refleja el mar.'
    },
    reasons: {
      'child.sunlight': 'Los niños necesitan primero la sorpresa: la luz blanca del sol esconde todos los colores.',
      'child.scatter': 'Es la idea central, dicha con palabras sencillas.',
      'child.rayleigh': 'Con una fórmula se pierde a un niño al instante.',
      'child.everywhere': 'Explica lo que ven: azul mires donde mires.',
      'child.violet': 'El detalle del violeta confunde más de lo que ayuda a esa edad.',
      'child.molecules': 'Las moléculas y las longitudes de onda son demasiado abstractas para un niño.',
      'layperson.sunlight': 'Sin esto, «se dispersa la luz azul» no tiene sentido.',
      'layperson.scatter': 'Es la respuesta en sí, con palabras cotidianas.',
      'layperson.rayleigh': 'La fórmula no aporta nada que un profano pueda usar.',
      'expert.rayleigh': 'Un experto espera el mecanismo preciso y cómo depende de la longitud de onda.',
      'expert.everywhere': 'Es obvio para un experto y le hace perder el tiempo.',
      'expert.violet': 'Los expertos conocen la objeción evidente, «¿por qué no violeta?»: respóndela.',
      'expert.molecules': 'Nombrar a los dispersores y la relación de tamaños hace precisa la explicación.',
      ocean: 'Es un mito muy extendido; el color no viene del mar.'
    },
    messages: {
      'child.fit': 'La luz del sol parece blanca, pero en realidad lleva todos los colores mezclados. Cuando viaja por el aire, la parte azul es la que más rebota de un lado a otro, así que el azul te llega a los ojos desde todo el cielo.',
      'child.tooMuch': 'La luz azul tiene una longitud de onda más corta, y la dispersión de Rayleigh crece con uno entre la longitud de onda a la cuarta.',
      'child.missing': 'El cielo es así y ya está. Siempre ha sido azul.',
      'layperson.fit': 'La luz del sol contiene todos los colores. El aire dispersa la luz azul mucho más que la roja, así que nos llega luz azul desde todas partes del cielo.',
      'layperson.tooMuch': 'Es dispersión de Rayleigh: la intensidad escala con 1/λ⁴, de modo que las longitudes de onda cortas dominan la radiancia difusa del cielo.',
      'layperson.condescending': 'Es un poco complicado para quien no es científico. Digamos simplemente que el aire lo vuelve azul.',
      'expert.fit': 'Dispersión de Rayleigh por moléculas de N₂ y O₂, proporcional a 1/λ⁴. El violeta se dispersa aún más, pero el espectro solar tiene menos violeta y nuestros conos son menos sensibles a él.',
      'expert.condescending': '¡Imagina la luz del sol como una caja de lápices de colores! Al aire le gusta jugar sobre todo con el lápiz azul.',
      'expert.missing': 'El aire dispersa más la luz azul, por eso.'
    }
  },
  clubRoof: {
    title: 'El tejado del club',
    situation: 'El tejado de la sede de tu club deportivo necesita una reparación urgente y cuesta más de lo previsto. Explícalo.',
    facts: {
      cost: 'La reparación cuesta 8.000 euros, 3.000 más de lo presupuestado.',
      decision: 'La junta directiva debe decidir antes del viernes si traslada 3.000 euros del presupuesto de la fiesta de verano.',
      storage: 'El almacén de material permanece cerrado hasta la reparación; el resto de la sede está abierto.',
      fees: 'Las cuotas de socio no cambian.',
      schedule: 'El techador empieza el 12 de mayo y necesita cuatro días; el aparcamiento hace falta para el andamio.',
      tiles: 'Las tejas nuevas son de hormigón en color antracita.',
      reserve: 'Usar el fondo de reserva lo dejaría por debajo del mínimo obligatorio.',
      volunteer: 'Un socio se ofreció a reparar el tejado gratis él mismo, pero no es techador.'
    },
    reasons: {
      'executive.cost': 'La junta necesita la cantidad y el sobrecoste para valorarlo.',
      'executive.decision': 'Es la decisión que tiene que tomar, con su plazo.',
      'executive.storage': 'El uso diario de las salas no es un tema de la junta.',
      'executive.schedule': 'Los días exactos de obra son tarea del coordinador.',
      'executive.tiles': 'El tipo y el color de las tejas no influyen en la decisión.',
      'executive.reserve': 'Explica por qué la alternativa obvia no es una opción.',
      'projectManager.fees': 'Las cuotas no tienen nada que ver con organizar la reparación.',
      'projectManager.schedule': 'El coordinador organiza justo estas fechas y el aparcamiento.',
      'projectManager.reserve': 'La financiación la decide la junta, no el coordinador.',
      'layperson.storage': 'Los socios quieren saber qué pueden usar y qué no.',
      'layperson.fees': 'Su propio dinero es su primera pregunta.',
      'layperson.tiles': 'Los detalles del material no importan a los socios.',
      'layperson.reserve': 'Las reglas del fondo de reserva son detalles financieros internos.',
      volunteer: 'Una oferta sin la cualificación adecuada solo abre un debate inútil; no es una opción real.'
    },
    messages: {
      'executive.fit': 'Hace falta una decisión antes del viernes: la reparación del tejado cuesta 8.000 euros, 3.000 más de lo presupuestado. Proponemos trasladar 3.000 del presupuesto de la fiesta de verano, porque el fondo de reserva quedaría por debajo de su mínimo.',
      'executive.tooMuch': 'El techador empieza el 12 de mayo con tejas de hormigón antracita; el andamio estará cuatro días en el aparcamiento y el almacén seguirá cerrado hasta entonces.',
      'executive.missing': 'El tejado sale más caro. Os mantendremos informados.',
      'projectManager.fit': 'El techador empieza el 12 de mayo y necesita cuatro días. Por favor, deja libre el aparcamiento para el andamio a partir del 11 de mayo.',
      'projectManager.tooMuch': 'La reparación cuesta 8.000 euros, 3.000 por encima del presupuesto; quizá la junta traslade dinero de la fiesta, porque la reserva no puede bajar de su mínimo, y las cuotas no cambian.',
      'projectManager.missing': 'En mayo habrá alguna obra en el tejado.',
      'layperson.fit': 'El tejado de la sede se reparará en mayo. Hasta entonces, el almacén de material sigue cerrado; todo lo demás está abierto como siempre. Las cuotas de socio no cambian.',
      'layperson.tooMuch': 'La reparación cuesta 8.000 euros, 3.000 por encima del presupuesto; la junta estudia un traslado desde el presupuesto de la fiesta, porque la reserva no puede bajar de su mínimo.',
      'layperson.condescending': 'No os preocupéis por el tejado, la junta se encarga de las cosas de mayores.'
    }
  },
  shopOutage: {
    title: 'Caída de la tienda online',
    situation: 'La tienda online de tu empresa estuvo caída tres horas ayer. Explica lo que pasó.',
    facts: {
      duration: 'La tienda estuvo caída tres horas ayer por la tarde.',
      revenue: 'Se perdieron pedidos por unos 40.000 euros.',
      cause: 'Un certificado de seguridad caducado bloqueó los pagos.',
      fixed: 'El certificado se ha renovado; la tienda vuelve a funcionar con normalidad.',
      renewal: 'La renovación se automatizará con un aviso dos semanas antes; al equipo le lleva un día.',
      voucher: 'Los clientes cuyo pedido falló reciben por correo un vale del 10 %.',
      approval: 'Se pide a la dirección que apruebe 5.000 euros para una mejor monitorización.',
      competitor: 'La tienda de un competidor tuvo una caída parecida el mes pasado.'
    },
    reasons: {
      'projectManager.cause': 'La jefa de proyecto necesita la causa para valorar la solución.',
      'projectManager.renewal': 'Es el trabajo que tiene que planificar: un día del equipo.',
      'projectManager.voucher': 'Los vales los gestiona atención al cliente, no el proyecto.',
      'executive.duration': 'La dirección necesita la magnitud del incidente.',
      'executive.revenue': 'Para la dirección, el impacto en el negocio va primero.',
      'executive.cause': 'El detalle técnico no cambia su decisión; «una renovación olvidada» basta.',
      'executive.renewal': 'Necesita oír que no volverá a pasar.',
      'executive.approval': 'Es la decisión que tiene que tomar.',
      'customer.revenue': 'Tus ingresos perdidos no son asunto del cliente.',
      'customer.cause': 'Las causas técnicas no ayudan a los clientes.',
      'customer.fixed': 'Los clientes quieren saber primero que pueden volver a comprar.',
      'customer.renewal': 'Los cambios de procesos internos no le incumben al cliente.',
      'customer.voucher': 'Es lo que reciben, y deben estar atentos al correo.',
      'customer.approval': 'Las decisiones internas de presupuesto no son para los clientes.',
      competitor: 'Señalar a otros suena a excusa y no cambia nada.'
    },
    messages: {
      'projectManager.fit': 'La caída de tres horas de ayer se debió a un certificado de seguridad caducado que bloqueó los pagos. Para que no se repita, automatizamos la renovación con aviso previo; al equipo le lleva un día de este sprint.',
      'projectManager.tooMuch': 'Perdimos unos 40.000 euros en pedidos, los clientes reciben un vale del 10 % por correo y un competidor tuvo el mismo problema el mes pasado.',
      'projectManager.missing': 'La tienda tuvo un pequeño tropiezo ayer, ya está todo bien.',
      'executive.fit': 'Ayer la tienda estuvo caída tres horas; perdimos unos 40.000 euros en pedidos. La causa fue una renovación rutinaria olvidada, que ya está automatizada. Para detectar antes este tipo de problemas, les pedimos que aprueben 5.000 euros para monitorización.',
      'executive.tooMuch': 'El certificado TLS de la pasarela de pago caducó a las 18:02; ahora lo renovamos automáticamente con el protocolo ACME, con alertas 14 días antes.',
      'executive.missing': 'Ayer hubo un pequeño problema técnico. Ya está resuelto.',
      'customer.fit': 'Lo sentimos: ayer por la tarde nuestra tienda no estuvo disponible durante unas horas. Todo vuelve a funcionar. Si su pedido falló, recibirá por correo un vale del 10 %.',
      'customer.tooMuch': 'Un certificado de seguridad caducado detuvo nuestro sistema de pagos; perdimos unos 40.000 euros y ahora renovamos los certificados automáticamente.',
      'customer.condescending': 'Se rompió algo técnico, nada que usted fuera a entender. Simplemente vuelva a intentarlo.'
    }
  },
  signalFault: {
    title: 'Avería de señal en el tren',
    situation: 'Una avería de señal interrumpe una línea de tren. Trabajas para la compañía ferroviaria. Explica la situación.',
    facts: {
      delay: 'Los trenes de esta línea llevan unos 40 minutos de retraso.',
      bus: 'Hay autobuses de sustitución cada 20 minutos desde la explanada de la estación.',
      tickets: 'Los billetes también son válidos en los autobuses y en trenes posteriores.',
      signal: 'La señal 14 del cruce marca rojo fijo tras una avería en un cable.',
      singleTrack: 'Los trenes cruzan el tramo por una sola vía a paso de persona, con orden escrita.',
      repair: 'Los técnicos calculan que la reparación durará unas cuatro horas más.',
      construction: 'Probablemente unas obras de otra empresa dañaron el cable.',
      staff: 'Dos técnicos están de baja esta semana.'
    },
    reasons: {
      'layperson.delay': 'Los viajeros quieren saber primero cuánto retraso tendrán.',
      'layperson.bus': 'Les dice qué pueden hacer ahora mismo.',
      'layperson.tickets': 'Responde a la duda de si necesitan un billete nuevo.',
      'layperson.signal': 'Los números de señal no les dicen nada a los viajeros.',
      'layperson.singleTrack': 'Las normas de circulación no ayudan a los viajeros.',
      'layperson.construction': 'Especular sobre culpas no ayuda a los viajeros y puede ser falso.',
      'layperson.staff': 'La plantilla interna no es asunto de los viajeros.',
      'expert.tickets': 'Las normas de billetes no afectan a la circulación de trenes.',
      'expert.signal': 'El compañero necesita el lugar y la avería exactos.',
      'expert.singleTrack': 'Es la norma de circulación que debe aplicar.',
      'expert.repair': 'Planifica el horario en torno al final previsto.',
      'expert.staff': 'La plantilla no cambia cómo se circula por el tramo.',
      'executive.delay': 'La dirección necesita la magnitud de la interrupción.',
      'executive.tickets': 'Aceptar billetes es una norma estándar, no un tema de dirección.',
      'executive.repair': 'Necesita saber cuánto durará el impacto.',
      'executive.construction': 'Un posible daño causado por terceros importa para la responsabilidad y los costes.'
    },
    messages: {
      'layperson.fit': 'Los trenes de esta línea llevan unos 40 minutos de retraso. Hay autobuses de sustitución cada 20 minutos desde la explanada de la estación, y su billete es válido en ellos.',
      'layperson.tooMuch': 'La señal 14 del cruce marca rojo fijo tras una avería en un cable; los trenes pasan por una sola vía a paso de persona con orden escrita.',
      'layperson.missing': 'Les rogamos paciencia, hay una incidencia técnica.',
      'expert.fit': 'La señal 14 del cruce está bloqueada en rojo tras una avería de cable. Circulación por vía única a paso de persona con orden escrita; la reparación durará previsiblemente unas cuatro horas más.',
      'expert.condescending': 'Una señal es como un semáforo para trenes. Una está rota, así que los trenes tienen que ir despacio.',
      'expert.missing': 'Hay un problema en la línea y los trenes van con retraso. Hay autobuses.',
      'executive.fit': 'Una avería de cable afectará a la línea unas cuatro horas más; los trenes llevan unos 40 minutos de retraso. Probablemente unas obras de otra empresa dañaron el cable, así que estamos revisando la responsabilidad.',
      'executive.tooMuch': 'La señal 14 marca rojo fijo; circulación por vía única a paso de persona con orden escrita; autobuses cada 20 minutos desde la explanada; billetes válidos en los autobuses.',
      'executive.missing': 'Pequeño problema de señales, el equipo se está ocupando.'
    }
  },
  kettleLid: {
    title: 'La tapa del hervidor',
    situation: 'Tu empresa ha descubierto que la tapa de un modelo de hervidor puede soltarse. Explícalo.',
    facts: {
      batches: 'Solo están afectados los hervidores con números de lote del 2301 al 2315 (impresos bajo la base).',
      risk: 'La tapa puede abrirse al servir, así que puede salpicar agua caliente.',
      stop: 'Deje de usar un hervidor afectado hasta que se lo sustituyan.',
      hinge: 'Un pasador de plástico de la bisagra se fabricó 0,2 mm más fino de lo debido.',
      free: 'La sustitución es gratuita, envío incluido.',
      cost: 'El cambio costará a la empresa unos 120.000 euros.',
      supplier: 'Los pasadores venían de un proveedor nuevo cuyas muestras habían pasado la inspección.',
      injuries: 'Hasta ahora no se conocen heridos.'
    },
    reasons: {
      'customer.batches': 'Los clientes tienen que poder comprobar si su hervidor está afectado.',
      'customer.risk': 'Necesitan entender por qué importa.',
      'customer.stop': 'Es la acción que los mantiene a salvo.',
      'customer.hinge': 'Los detalles en milímetros no ayudan a los clientes.',
      'customer.free': 'Saber que no cuesta nada elimina un motivo para esperar.',
      'customer.cost': 'Los costes de la empresa no son asunto del cliente.',
      'customer.supplier': 'Los detalles del proveedor suenan a echar la culpa a otro.',
      'executive.risk': 'La dirección debe entender primero el riesgo para la seguridad.',
      'executive.hinge': 'La medida exacta es cosa de ingenieros.',
      'executive.cost': 'El impacto económico forma parte de su decisión.',
      'executive.injuries': 'Que haya o no heridos cambia la urgencia y la respuesta.',
      'expert.stop': 'Las instrucciones para clientes no ayudan a analizar el defecto.',
      'expert.hinge': 'La ingeniera necesita el defecto exacto.',
      'expert.free': 'Las condiciones de envío no importan para el análisis técnico.',
      'expert.cost': 'Los costes de la retirada no hacen falta para mejorar la pieza.',
      'expert.supplier': 'Muestra dónde debe cambiar el control de calidad.'
    },
    messages: {
      'customer.fit': 'Compruebe el número de lote bajo su hervidor. Si está entre 2301 y 2315, deje de usarlo: la tapa puede abrirse al servir. Se lo sustituiremos gratis, envío incluido.',
      'customer.tooMuch': 'Un pasador de bisagra de un proveedor nuevo era 0,2 mm demasiado fino; el cambio nos costará unos 120.000 euros.',
      'customer.condescending': 'Puede que algunos hervidores tengan un problemita. No hace falta que entienda los detalles; devuélvalo si quiere.',
      'executive.fit': 'Problema de seguridad: en los lotes 2301 a 2315, la tapa del hervidor puede abrirse al servir agua caliente. Hasta ahora no se conocen heridos. El cambio costará unos 120.000 euros.',
      'executive.tooMuch': 'El diámetro del pasador de la bisagra está 0,2 mm por debajo de la tolerancia; las muestras del proveedor nuevo cumplían la especificación, así que sospechamos desgaste de la herramienta.',
      'executive.missing': 'Vamos a sustituir algunos hervidores por precaución.',
      'expert.fit': 'Los pasadores de bisagra del proveedor nuevo son 0,2 mm demasiado finos, así que la tapa puede abrirse al servir. Lotes afectados: 2301 a 2315. Sus muestras pasaron, así que nuestra inspección de entrada tiene que cambiar.',
      'expert.missing': 'Algunas tapas están flojas; los clientes reciben una sustitución gratuita.',
      'expert.condescending': 'Una bisagra es la pieza que permite que la tapa gire. Si es demasiado fina, no sujeta bien.'
    }
  }
};
