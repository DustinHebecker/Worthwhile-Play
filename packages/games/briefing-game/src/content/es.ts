import type { ContentText } from './types';

export const content: ContentText = {
  supplierDelay: {
    title: 'Retraso de un proveedor antes de un lanzamiento',
    situation: 'Tu empresa lanza una nueva lámpara de escritorio el 14 de mayo. El proveedor de los cabezales avisa de un retraso. Prepara un informe.',
    recipient: 'la jefa de producto',
    cards: {
      c1: 'La nueva lámpara de escritorio sale el 14 de mayo; 350 clientes la han reservado.',
      c2: 'El proveedor solo ha enviado 200 de los 500 cabezales que pedimos.',
      c3: 'Cuando lleguen las piezas, nuestro taller puede montar 100 lámparas al día.',
      c4: 'El proveedor aún no ha dado fecha para enviar los cabezales restantes.',
      c5: 'El proveedor espera enviar el resto la semana que viene, probablemente el martes.',
      c6: 'Si las piezas llegan después del 10 de mayo, las lámparas no se podrán montar a tiempo para el lanzamiento.',
      c7: 'El anuncio del lanzamiento está contratado para el 14 de mayo; cambiarlo costaría una tasa de 800 euros.',
      c8: 'Marketing necesita saber antes del viernes si se mantiene la fecha de lanzamiento.',
      c9: 'Jonas, de compras, puede llamar mañana por la mañana al proveedor y pedir una fecha firme.',
      c10: 'El proveedor se mudó el año pasado a un nuevo edificio de oficinas.',
      c11: 'Hasta ahora solo se han enviado 200 de los 500 cabezales pedidos.',
      c12: 'Sinceramente, este proveedor siempre ha sido un poco caótico.'
    },
    decisions: {
      right: '¿Mantener el lanzamiento el 14 de mayo o retrasarlo una semana?',
      notTheirs: '¿Qué empresa de transporte debe usar el proveedor?',
      premature: '¿Deberíamos sustituir a este proveedor para todos los productos futuros?'
    },
    actions: {
      concrete: 'Jonas llama mañana a las 9:00 al proveedor y comunica la fecha confirmada a la jefa de producto antes de las 12:00.',
      vague: 'Alguien debería vigilar al proveedor.',
      outOfScope: 'Empezar a diseñar la colección de lámparas del año que viene.'
    }
  },
  basement: {
    title: 'Sótano inundado en un piso compartido',
    situation: 'Tras una lluvia intensa hay agua en el sótano de la casa que compartes con otras personas. Prepara un informe.',
    recipient: 'el casero',
    cards: {
      c1: 'Cinco personas comparten la casa; en el sótano están la caldera y las cajas de todos.',
      c2: 'Esta mañana había unos 10 cm de agua en el sótano.',
      c3: 'Esta mañana cortamos la luz del sótano por precaución.',
      c4: 'Nadie sabe todavía si la caldera ha sufrido daños.',
      c5: 'Probablemente el agua ya no sube; a mediodía se veía igual que por la mañana.',
      c6: 'Se prevé más lluvia el jueves, y el agua podría volver a subir.',
      c7: 'La caldera está a 15 cm del suelo, así que unos centímetros más de agua la alcanzarían.',
      c8: 'El fontanero solo puede venir esta semana si el casero aprueba el coste del desplazamiento antes de mañana.',
      c9: 'Una compañera que teletrabaja podría abrirle al fontanero el miércoles.',
      c10: 'Las paredes del sótano se pintaron por última vez en 2015.',
      c11: 'Cuando miramos esta mañana, el sótano tenía 10 cm de agua.',
      c12: 'Esta casa siempre ha tenido humedad y nadie hace nunca nada.'
    },
    decisions: {
      right: '¿Aprobar el coste del desplazamiento del fontanero para esta semana?',
      notTheirs: '¿Qué compañero debe sacar primero sus cajas?',
      premature: '¿Hay que impermeabilizar y reformar todo el sótano?'
    },
    actions: {
      concrete: 'La compañera que teletrabaja reserva al fontanero para el miércoles y envía hoy el presupuesto al casero.',
      vague: 'Ya nos ocuparemos en algún momento.',
      outOfScope: 'Organizar una fiesta en casa para animar a todos.'
    }
  },
  schoolTrip: {
    title: 'Excursión escolar y aviso meteorológico',
    situation: 'Una clase de 24 alumnos va a ir de excursión a la sierra el viernes. Se ha emitido un aviso meteorológico. Prepara un informe.',
    recipient: 'la directora del colegio',
    cards: {
      c1: 'La clase de 24 alumnos de 11 años tiene reservada una excursión a pie el viernes, con tres adultos acompañantes.',
      c2: 'El servicio meteorológico ha emitido un aviso de tormenta para el viernes por la tarde.',
      c3: 'El museo de ciencias de la ciudad todavía tiene sitio para una visita escolar el viernes.',
      c4: 'La previsión aún no dice si la tormenta llegará antes o después del mediodía.',
      c5: 'El guarda del parque cree que el sendero principal muy probablemente seguirá abierto.',
      c6: 'El viento fuerte puede hacer caer ramas en el sendero del bosque.',
      c7: 'El único refugio de la ruta está a 40 minutos a pie del final del sendero, demasiado lejos para llegar rápido con tormenta.',
      c8: 'Hay que decirle a la empresa de autobuses antes del miércoles por la noche si la excursión se hace; hasta entonces se puede anular gratis.',
      c9: 'La tutora puede consultar la previsión actualizada el miércoles a mediodía.',
      c10: 'La clase votó por la excursión ya en septiembre.',
      c11: 'Según el servicio meteorológico, se espera una tormenta el viernes por la tarde.',
      c12: 'Los niños se van a llevar una decepción terrible si cancelamos.'
    },
    decisions: {
      right: '¿Hacer la excursión, cambiar al museo o cancelarla?',
      notTheirs: '¿Qué deben llevar los alumnos para comer?',
      premature: '¿Debería el colegio suprimir a partir de ahora todas las salidas al aire libre?'
    },
    actions: {
      concrete: 'La tutora consulta la previsión el miércoles a las 12:00 y envía una recomendación a la directora antes de las 14:00.',
      vague: 'A ver qué tiempo hace.',
      outOfScope: 'Empezar a organizar la fiesta del colegio del año que viene.'
    }
  },
  volunteers: {
    title: 'Jornada de limpieza con pocos voluntarios',
    situation: 'Tu asociación de vecinos organiza el sábado una limpieza del parque. Se han apuntado muy pocos voluntarios. Prepara un informe.',
    recipient: 'la presidenta de la asociación',
    cards: {
      c1: 'La limpieza anual del parque es el sábado de 10:00 a 13:00; el ayuntamiento pone bolsas y guantes.',
      c2: 'De momento se han apuntado 9 voluntarios; contábamos con 20.',
      c3: 'El ayuntamiento recoge las bolsas llenas solo el sábado a las 13:00.',
      c4: 'Puede que el equipo juvenil de fútbol mande ayudantes, pero el entrenador aún no ha contestado.',
      c5: 'Varios vecinos dijeron que probablemente se pasarán si hace buen tiempo.',
      c6: 'Con 9 personas solo podemos limpiar más o menos la mitad del parque.',
      c7: 'Aún no hay nadie encargado de recoger los guantes en el centro cívico, que cierra el sábado a las 9:30.',
      c8: 'Podemos reducir la limpieza a la zona del parque infantil o pasarla al sábado siguiente.',
      c9: 'Dos voluntarios se han ofrecido a poner carteles en el barrio mañana.',
      c10: 'La limpieza del año pasado terminó con una barbacoa.',
      c11: 'Solo se han inscrito 9 de los 20 voluntarios previstos.',
      c12: 'A la gente ya no le importa nada su barrio.'
    },
    decisions: {
      right: '¿Hacer una limpieza más pequeña este sábado o retrasarla una semana?',
      notTheirs: '¿Debe el ayuntamiento cambiar su horario de recogida de bolsas?',
      premature: '¿Debería la asociación contratar una empresa de limpieza en los próximos años?'
    },
    actions: {
      concrete: 'Los dos voluntarios ponen carteles mañana, y el secretario escribe hoy al entrenador de fútbol e informa antes del jueves.',
      vague: 'Deberíamos conseguir más gente como sea.',
      outOfScope: 'Empezar a planificar la fiesta de verano de la asociación.'
    }
  },
  release: {
    title: 'Lanzamiento de software con una prueba fallida',
    situation: 'Tu equipo quiere publicar el martes una nueva versión de una aplicación de reservas. Falla una prueba automática. Prepara un informe.',
    recipient: 'el responsable de producto',
    cards: {
      c1: 'La nueva versión añade el pago en línea y se ha anunciado a los clientes para el martes.',
      c2: 'Falla una de 640 pruebas automáticas: el reembolso de una reserva cancelada.',
      c3: 'El fallo solo aparece en pagos en moneda extranjera.',
      c4: 'Aún no sabemos si el error está en nuestro código o en el sistema de pruebas del proveedor de pagos.',
      c5: 'El desarrollador calcula que el arreglo llevará un día, pero todavía no ha mirado el código.',
      c6: 'Si el error es real, algunos clientes podrían recibir un reembolso por un importe equivocado.',
      c7: 'Alrededor del 15 % de las reservas se pagan en moneda extranjera, así que el error afectaría a muchos clientes.',
      c8: 'Podemos publicar el martes con los pagos en moneda extranjera desactivados o aplazar toda la versión.',
      c9: 'El desarrollador puede revisar esta tarde los registros de prueba del proveedor de pagos.',
      c10: 'La nueva pantalla de pago usa el nuevo tono de azul de la empresa.',
      c11: 'Hay una sola prueba en rojo: los reembolsos de reservas canceladas.',
      c12: 'Esa prueba siempre ha sido poco fiable; yo la ignoraría sin más.'
    },
    decisions: {
      right: '¿Publicar el martes sin pagos en moneda extranjera o aplazar la versión?',
      notTheirs: '¿Qué técnica de programación debe usar el desarrollador para el arreglo?',
      premature: '¿Deberíamos cambiar a otro proveedor de pagos?'
    },
    actions: {
      concrete: 'El desarrollador revisa esta tarde los registros del proveedor y le dice al responsable de producto antes de las 17:00 si el error es nuestro.',
      vague: 'Alguien echará un vistazo a la prueba.',
      outOfScope: 'Empezar a escribir las notas de la versión siguiente a la próxima.'
    }
  },
  careAppointment: {
    title: 'Una cita de orientación sobre cuidados para la abuela',
    situation: 'Tu abuela tiene el lunes una cita con un servicio de orientación sobre cuidados. La familia tiene que decidir quién la acompaña. Prepara un informe. (Se trata de organizarse, no de cuestiones médicas.)',
    recipient: 'tu hermano, que comparte contigo la decisión',
    cards: {
      c1: 'La abuela tiene cita con el servicio de orientación el lunes a las 10:00 para hablar de ayuda en casa.',
      c2: 'Ha pedido que la acompañe una persona de la familia.',
      c3: 'La carta dice que lleve su lista de medicamentos y su tarjeta sanitaria.',
      c4: 'Aún no está claro si mamá puede pedir el lunes libre en el trabajo.',
      c5: 'Dicen que el centro tiene ascensor, pero nadie lo ha comprobado.',
      c6: 'Si nadie puede ir, la próxima cita libre es dentro de seis semanas.',
      c7: 'La abuela se cansa enseguida, y el trayecto en autobús hasta el centro dura 50 minutos cada vez.',
      c8: 'El servicio necesita saber antes del viernes si la cita será presencial o por videollamada.',
      c9: 'Podrías llamar a mamá esta noche y preguntarle por el lunes.',
      c10: 'La vecina de la abuela tiene un perro nuevo desde hace poco.',
      c11: 'Le gustaría que alguien de la familia fuera con ella.',
      c12: 'En mi opinión, estos servicios de orientación nunca ayudan de verdad.'
    },
    decisions: {
      right: '¿Quién acompaña a la abuela el lunes, y en persona o por videollamada?',
      notTheirs: '¿Qué tipo de ayuda en casa debe recibir la abuela?',
      premature: '¿Debería la abuela mudarse a una residencia?'
    },
    actions: {
      concrete: 'Llamas a mamá esta noche y le dices a tu hermano antes del miércoles por la noche quién puede ir.',
      vague: 'Ya lo arreglaremos de alguna manera.',
      outOfScope: 'Empezar a planear la fiesta de cumpleaños de la abuela.'
    }
  },
  cafeFreezer: {
    title: 'Congelador averiado en una cafetería pequeña',
    situation: 'Trabajas en una cafetería pequeña. Esta mañana el congelador no enfriaba lo suficiente. La dueña está fuera hasta mañana. Prepara un informe.',
    recipient: 'la dueña de la cafetería',
    cards: {
      c1: 'La cafetería vende helado casero; el congelador guarda unas existencias de una semana.',
      c2: 'A las 7:00 el congelador marcaba −2 °C en lugar de los −18 °C habituales.',
      c3: 'A las 7:30 llevamos el helado al congelador de la panadería de al lado.',
      c4: 'No sabemos si el helado se descongeló durante la noche.',
      c5: 'El servicio técnico probablemente podrá venir el jueves.',
      c6: 'El helado descongelado no se puede vender, así que quizá tengamos que tirar las existencias.',
      c7: 'La panadería necesita recuperar su espacio el sábado, así que nuestro helado solo puede quedarse allí hasta entonces.',
      c8: 'El servicio técnico solo reservará una visita cuando la dueña apruebe el desplazamiento de 90 euros.',
      c9: 'La barista puede leer esta tarde el registro de temperatura del congelador.',
      c10: 'Las nuevas pizarras del menú llegan la semana que viene.',
      c11: 'Esta mañana el congelador marcaba −2 °C en vez de −18 °C.',
      c12: 'Ese congelador fue una mala compra desde el primer día.'
    },
    decisions: {
      right: '¿Aprobar el desplazamiento de 90 euros para la reparación?',
      notTheirs: '¿Qué pasteles debe vender la panadería esta semana?',
      premature: '¿Debería la cafetería dejar de vender helado por completo?'
    },
    actions: {
      concrete: 'La barista lee esta tarde el registro de temperatura y le manda el resultado a la dueña antes de las 16:00.',
      vague: 'Lo tendremos vigilado.',
      outOfScope: 'Rediseñar la página web de la cafetería.'
    }
  },
  tournament: {
    title: 'Nuevo lugar para un torneo de ajedrez',
    situation: 'Tu club de ajedrez organiza el domingo un torneo juvenil. El salón del colegio que reservasteis ya no está disponible. Prepara un informe.',
    recipient: 'la junta del club',
    cards: {
      c1: 'Para el torneo juvenil del domingo hay 48 jugadores inscritos de seis clubes.',
      c2: 'El colegio ha cancelado nuestra reserva del salón por una gotera en el tejado.',
      c3: 'La biblioteca municipal ofrece gratis su sala de actos, pero solo caben 32 jugadores.',
      c4: 'Puede que el polideportivo tenga una sala libre, pero aún no ha respondido a nuestro correo.',
      c5: 'El conserje cree que el salón podría estar reparado a tiempo, pero nadie lo ha confirmado.',
      c6: 'Si las familias se enteran del cambio demasiado tarde, algunos jugadores podrían ir al lugar antiguo.',
      c7: 'Varias familias viajan más de 100 km y ya han reservado el tren, así que un cambio de fecha les perjudicaría más que a nadie.',
      c8: 'Las invitaciones con el lugar definitivo tienen que enviarse antes del miércoles.',
      c9: 'El secretario del club puede llamar al polideportivo mañana por la mañana.',
      c10: 'La vitrina de trofeos del club se limpió el mes pasado.',
      c11: 'El colegio ha anulado nuestra reserva del salón.',
      c12: 'Nunca deberíamos habernos fiado de ese colegio.'
    },
    decisions: {
      right: '¿Cambiar a otro lugar, limitar el torneo a 32 jugadores o aplazarlo?',
      notTheirs: '¿Cuándo debe reparar el colegio su tejado?',
      premature: '¿Debería el club construir su propia sede?'
    },
    actions: {
      concrete: 'El secretario llama mañana a las 9:00 al polideportivo e informa a la junta antes de las 12:00.',
      vague: 'Esperemos a ver qué sale.',
      outOfScope: 'Pedir juegos de ajedrez nuevos para el club.'
    }
  }
};
