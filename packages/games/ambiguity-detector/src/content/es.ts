import type { LocaleContent } from './items';

export const content: LocaleContent = {
  'finish-tomorrow': {
    context: 'Tu jefa de equipo te escribe en el chat del equipo. Ahora mismo trabajas en tres informes distintos.',
    text: 'Por favor, termina esto mañana.',
    ask: { what: '¿Cuál de los tres informes quieres decir?' },
    given: { when: 'El día está claro: mañana.', who: 'El mensaje va dirigido directamente a ti.' },
    replies: {
      clear: 'Claro. ¿Cuál de los tres informes: el de presupuesto, el de ventas o el de personal?',
      vague: '¡Vale, hecho!',
      assume: 'Sin problema, mañana termino el informe de ventas.'
    }
  },
  'concert-entrance': {
    context: 'Un amigo te escribe sobre el concierto del sábado, que empieza a las 20:00. La sala tiene cuatro entradas.',
    text: 'Quedamos en la entrada antes del concierto.',
    ask: { when: '¿A qué hora quedamos, cuánto antes de las 20:00?', where: '¿En cuál de las cuatro entradas?' },
    given: { what: 'Lo que se plantea está claro: verse antes del concierto.' },
    replies: {
      clear: '¡Buena idea! ¿En qué entrada y a qué hora? ¿Te va bien a las 19:30?',
      vague: '¡Perfecto, nos vemos allí!',
      rude: 'Siempre dices cosas así. ¡Sé preciso por una vez!'
    }
  },
  'party-photos': {
    context: 'Tu tía te escribe después de una fiesta familiar en la que hiciste unas 200 fotos.',
    text: '¿Me mandas las fotos del domingo?',
    ask: { what: '¿Las 200 o solo algunas, por ejemplo aquellas en las que sales tú?', format: '¿Cómo te las mando: con un enlace de descarga, por correo o en papel?' },
    given: { who: 'Está claro quién debe enviarlas: tú.' },
    replies: {
      clear: '¡Claro! ¿Las 200 o una selección? ¿Y te va bien un enlace de descarga?',
      vague: 'Claro, ya te las mandaré.',
      assume: 'Te he encargado copias en papel de las 200 fotos.'
    }
  },
  'water-plants': {
    context: 'Tu vecina se va mañana de viaje dos semanas. Tú tienes su llave de repuesto.',
    text: '¿Podrías regar las plantas mientras estoy fuera?',
    ask: { when: '¿Cada cuánto necesitan agua: todos los días o dos veces por semana?', where: '¿Qué plantas: las de dentro, las del balcón o todas?' },
    given: { what: 'La tarea está clara: regar las plantas.', who: 'Te lo piden directamente a ti.' },
    replies: {
      clear: '¡Con gusto! ¿Qué plantas, y cada cuánto las riego?',
      vague: 'Claro, sin problema.',
      assume: 'Claro, regaré las plantas del balcón todas las tardes.'
    }
  },
  'train-tickets': {
    context: 'Tú y una amiga planeáis un fin de semana en la playa. Ella escribe:',
    text: 'Yo reservo el hotel. ¿Puedes reservar tú el tren?',
    ask: { when: '¿Qué día y más o menos a qué hora vamos y volvemos?' },
    given: { what: 'La tarea está clara: billetes de tren para el viaje.', who: 'Te toca a ti reservarlos.' },
    replies: {
      clear: '¡Sí! ¿Qué día y a qué hora quieres salir, y cuándo volvemos?',
      vague: 'Vale, lo hago.',
      assume: 'Hecho: viernes a las 5:30 de la mañana, en primera clase.'
    }
  },
  'bins-tonight': {
    context: 'Un mensaje en el chat de grupo de cinco compañeros de piso.',
    text: 'Esta noche alguien tiene que sacar la basura.',
    ask: { who: '¿Quién exactamente lo hace esta noche? ¿A quién le toca?' },
    given: { what: 'La tarea está clara: sacar la basura.', when: 'El momento está claro: esta noche.' },
    replies: {
      clear: '¿Quién lo hace esta noche? ¿Hay un turno que podamos consultar?',
      vague: 'Sí, alguien debería.',
      rude: 'Yo seguro que no. Arregladlo entre vosotros.'
    }
  },
  'school-form': {
    context: 'Un aviso de la maestra de tu hijo en la app del colegio. Esta semana tu hijo trajo dos formularios: uno para una excursión y otro para las fotos de clase.',
    text: 'Por favor, devuelvan el formulario firmado antes del jueves.',
    ask: { what: '¿Qué formulario: el de la excursión o el de las fotos?', format: '¿Lo entrego en papel o como foto en la app?' },
    given: { when: 'El plazo está claro: el jueves.' },
    replies: {
      clear: '¡Gracias! ¿Qué formulario, el de la excursión o el de las fotos? ¿Y en papel o por la app?',
      vague: 'Vale, anotado.',
      assume: 'Hecho: he firmado los dos formularios y he subido fotos de ellos.'
    }
  },
  'holiday-keys': {
    context: 'Has alquilado un piso de vacaciones. La anfitriona te escribe el día antes de tu llegada.',
    text: 'Le dejaré las llaves.',
    ask: { where: '¿Dónde exactamente dejará las llaves?' },
    given: { what: 'Está claro de qué se trata: las llaves.', who: 'La anfitriona las deja ella misma.' },
    replies: {
      clear: '¡Gracias! ¿Dónde estarán exactamente: en una caja de llaves o con algún vecino?',
      vague: '¡Genial, gracias!',
      assume: 'Perfecto, las cogeré de debajo del felpudo.'
    }
  },
  'project-slides': {
    context: 'Tu jefa te escribe el martes por la mañana.',
    text: '¿Puedes preparar unas diapositivas sobre el proyecto?',
    ask: {
      when: '¿Para cuándo necesitas las diapositivas?',
      audience: '¿Quién las verá: el equipo, la dirección o el cliente?',
      scope: '¿Qué extensión: unas pocas diapositivas o una presentación completa?',
      purpose: '¿Qué debe lograr: informar del estado o llevar a una decisión?'
    },
    given: { what: 'El resultado está claro: diapositivas sobre el proyecto.', who: 'Te lo piden directamente a ti.' },
    replies: {
      clear: 'Con gusto. ¿Para quién, para cuándo, más o menos de qué extensión, y debe llevar a una decisión o solo informar?',
      vague: 'Claro, haré unas diapositivas.',
      assume: 'Prepararé 40 diapositivas para la reunión del consejo del viernes.'
    }
  },
  'cafe-website': {
    context: 'La dueña de una pequeña cafetería te escribe a ti, el diseñador web que hizo su página.',
    text: 'La web se ve rara, ¿puedes arreglarla?',
    ask: {
      what: '¿Qué se ve mal exactamente: el texto, las imágenes o la maquetación?',
      where: '¿En qué página y en qué dispositivo lo ves?',
      priority: '¿Es urgente? ¿Impide que los clientes hagan pedidos?'
    },
    given: { who: 'Te lo piden a ti, como diseñador de la web.' },
    replies: {
      clear: '¡Vaya, lo siento! ¿Qué se ve mal exactamente, en qué página y dispositivo? ¿Y les impide a los clientes hacer pedidos?',
      vague: 'Le echo un vistazo.',
      assume: 'Esta semana rediseño toda la web.'
    }
  },
  'walk-report': {
    context: 'La presidenta de tu club de senderismo te escribe después de la excursión de primavera.',
    text: '¿Podrías escribir una breve crónica de la excursión?',
    ask: {
      when: '¿Para cuándo necesitas la crónica?',
      format: '¿Solo texto o con fotos? ¿Para imprimir o para la web?',
      audience: '¿Quién la leerá: los socios o el periódico local?'
    },
    given: { what: 'El resultado está claro: una crónica de la excursión.', scope: '“Breve” da una extensión aproximada; aun así podrías confirmar el número de palabras.' },
    replies: {
      clear: '¡Con gusto! ¿Para quién es, para cuándo la necesitas y añado fotos?',
      vague: 'Vale, escribiré algo.',
      assume: 'Mañana mando al periódico una crónica de tres páginas con 50 fotos.'
    }
  },
  'office-paper': {
    context: 'La responsable de la oficina escribe en el canal del equipo.',
    text: 'Se está acabando el papel de la impresora, que alguien pida más, por favor.',
    ask: {
      when: '¿Para cuándo lo necesitamos?',
      who: '¿Quién debe hacer el pedido?',
      scope: '¿Cuánto pedimos?'
    },
    given: { what: 'Está claro qué hace falta: papel de impresora.' },
    replies: {
      clear: 'Puedo pedirlo yo. ¿Cuántos paquetes, y para cuándo los necesitamos?',
      vague: 'Sí, alguien debería.',
      assume: 'He pedido 100 cajas; llegan el mes que viene.'
    }
  },
  'anniversary': {
    context: 'Tu pareja te llama. Dentro de dos meses sus padres cumplen 40 años de casados.',
    text: 'Deberíamos organizar algo para mis padres.',
    ask: {
      what: '¿En qué piensas: una cena, una fiesta o un regalo?',
      when: '¿Cuándo: el mismo día o un fin de semana cercano?',
      who: '¿Quién se encarga de qué: tú, yo, tus hermanos?',
      scope: '¿De qué tamaño: solo la familia o muchos invitados?'
    },
    given: { audience: 'Está claro para quién: los padres.', purpose: 'El motivo está claro: el 40 aniversario de boda.' },
    replies: {
      clear: '¡Qué buena idea! ¿Qué tienes en mente, cuándo, para cuántas personas y quién hace qué?',
      vague: 'Sí, deberíamos.',
      assume: 'He reservado un restaurante para 60 personas el sábado que viene.'
    }
  },
  'customer-reply': {
    context: 'Tu jefa te reenvía la queja de un cliente por un envío que lleva dos semanas de retraso.',
    text: 'Por favor, contesta al cliente.',
    ask: {
      what: '¿Qué puedo ofrecerle: una disculpa, un descuento, una nueva fecha de entrega?',
      when: '¿Con qué urgencia: hoy mismo?',
      format: '¿Le llamo o le escribo?'
    },
    given: { audience: 'Está claro a quién: al cliente.', purpose: 'El motivo está claro: el retraso del envío.' },
    replies: {
      clear: 'De acuerdo. ¿Le llamo o le escribo, para cuándo, y qué puedo ofrecerle?',
      vague: 'Vale.',
      assume: 'Le he prometido al cliente el reembolso completo y envíos gratis durante un año.'
    }
  },
  'shop-translation': {
    context: 'Una amiga que tiene una pequeña tienda en línea te escribe porque hablas español.',
    text: '¿Podrías traducirme los textos de la tienda?',
    ask: {
      when: '¿Para cuándo necesitas la traducción?',
      audience: '¿Tus clientes están en España o en Latinoamérica?',
      scope: '¿Qué textos y cuántos: las descripciones de productos, toda la web?'
    },
    given: { what: 'La tarea está clara: una traducción al español.', who: 'Te lo piden directamente a ti.' },
    replies: {
      clear: '¡Te ayudo con gusto! ¿Qué textos, para cuándo, y tus clientes están en España o en Latinoamérica?',
      vague: 'Claro, mándamelo cuando sea.',
      assume: 'Claro, para mañana traduzco toda la web al español, al portugués y al francés.'
    }
  },
  'basement': {
    context: 'El conserje de tu edificio escribe a todos los vecinos.',
    text: 'Por favor, saquen sus cosas del sótano.',
    ask: {
      when: '¿Para cuándo tiene que estar vacío el sótano?',
      where: '¿Dónde podemos guardar nuestras cosas mientras tanto?',
      purpose: '¿Cuál es el motivo, y es solo por un tiempo?'
    },
    given: { what: 'Está claro a qué se refiere: las cosas propias del sótano.', who: 'Se lo piden a todos los vecinos.' },
    replies: {
      clear: 'Gracias por avisar. ¿Para cuándo, por qué motivo, y hay algún sitio donde guardar nuestras cosas mientras tanto?',
      vague: 'Vale.',
      rude: 'Yo no pienso sacar nada. Busquen otra solución.'
    }
  },
  'board-report': {
    context: 'Tu jefa te escribe el miércoles. La semana pasada te dijo que el informe trimestral va al consejo de dirección y que puede tener como máximo dos páginas.',
    text: 'Por favor, mándame el informe antes del viernes.',
    ask: {
      format: '¿Lo quieres en un archivo editable o en PDF?',
      criterion: '¿Qué cifras o apartados debe incluir para estar completo?'
    },
    given: {
      what: 'Está claro qué informe: el trimestral.',
      when: 'El plazo está claro: el viernes.',
      audience: 'Dicho antes: el informe va al consejo de dirección.',
      scope: 'Dicho antes: como máximo dos páginas.'
    },
    replies: {
      clear: 'De acuerdo. ¿Qué apartados debe incluir, y lo quieres en archivo editable o en PDF?',
      vague: 'Claro, antes del viernes.',
      redundant: '¿Para quién es, qué extensión debe tener y a qué informe te refieres?'
    }
  },
  'school-pickup': {
    context: 'Tu hermana te escribe. Sus dos hijos salen del colegio a las 15:00 todos los días; los martes el mayor tiene entrenamiento de fútbol hasta las 17:00.',
    text: '¿Puedes recoger a los niños el martes?',
    ask: {
      where: '¿Adónde los llevo después: a tu casa o a la mía?',
      scope: '¿A los dos o solo al pequeño, ya que el mayor tiene fútbol?'
    },
    given: { when: 'Se sabe por el contexto: el colegio termina a las 15:00.', who: 'Te lo piden directamente a ti.' },
    replies: {
      clear: 'Sí, puedo. ¿A los dos o solo al pequeño? ¿Y los llevo a tu casa o a la mía?',
      vague: 'Sí, claro.',
      redundant: '¿A qué hora salen del colegio, y qué día?'
    }
  },
  'checkout-bug': {
    context: 'Una responsable de producto comenta en el gestor de incidencias del equipo, en un ticket titulado «El botón de pago no hace nada en móviles desde la actualización 2.3».',
    text: 'Urgente, arreglad esto lo antes posible, por favor.',
    ask: {
      who: '¿Quién del equipo se encarga?',
      criterion: '¿En qué móviles y navegadores debe funcionar antes de cerrar el ticket?'
    },
    given: {
      what: 'El título del ticket nombra el problema.',
      where: 'El título dice dónde: en móviles.',
      priority: '«Urgente» deja clara la prioridad.'
    },
    replies: {
      clear: 'Vamos con ello. ¿Quién se encarga? ¿Y qué móviles y navegadores debemos probar antes de cerrar el ticket?',
      vague: 'Lo miramos.',
      redundant: '¿Qué está roto exactamente, y es urgente?'
    }
  },
  'client-room': {
    context: 'Tu compañera Ana te escribe. La semana que viene la visitan dos clientes; serán solo ellos tres.',
    text: '¿Podrías reservarme una sala de reuniones para la semana que viene?',
    ask: {
      when: '¿Qué día, a qué hora y para cuánto tiempo?',
      format: '¿Necesitas una pantalla o equipo de videoconferencia?'
    },
    given: {
      what: 'La tarea está clara: reservar una sala de reuniones.',
      who: 'Te toca a ti reservarla.',
      scope: 'Se sabe por el contexto: tres personas.'
    },
    replies: {
      clear: 'Claro. ¿Qué día y a qué hora, cuánto tiempo, y necesitas pantalla?',
      vague: 'Vale, reservaré algo.',
      redundant: '¿Cuántas personas vienen y para qué necesitas la sala?'
    }
  },
  'newsletter': {
    context: 'El editor del boletín de tu club deportivo te escribe. El boletín llega a todos los socios el primer lunes de cada mes; cada artículo tiene unas 200 palabras.',
    text: '¿Podrías escribir algo sobre los nuevos horarios de entrenamiento?',
    ask: {
      what: '¿Pongo el horario nuevo completo o solo lo que ha cambiado?',
      when: '¿Para cuándo necesitas mi texto? La fecha del boletín no es mi plazo de entrega.'
    },
    given: { audience: 'Se sabe por el contexto: todos los socios.', scope: 'Se sabe por el contexto: unas 200 palabras.' },
    replies: {
      clear: 'Con gusto. ¿Para cuándo lo necesitas, y pongo el horario completo o solo los cambios?',
      vague: 'Claro, escribiré algo.',
      redundant: '¿Quién lee el boletín y qué extensión debe tener el texto?'
    }
  },
  'airport': {
    context: 'Tu prima te manda los datos de su vuelo: aterriza el sábado a las 14:20, terminal 2. Se quedará una semana en tu casa.',
    text: '¿Puedes recogerme?',
    ask: { scope: '¿Vienes sola, y cuánto equipaje traes? ¿Cabe en un coche pequeño?' },
    given: {
      when: 'Se sabe por los datos del vuelo: el sábado a las 14:20.',
      where: 'Se sabe por los datos del vuelo: terminal 2.',
      purpose: 'Se sabe por el contexto: se queda en tu casa, así que está claro adónde ir.'
    },
    replies: {
      clear: '¡Claro! ¿Vienes sola, y cuánto equipaje traes?',
      vague: 'Sí, nos vemos.',
      redundant: '¿Cuándo aterrizas y en qué terminal?'
    }
  },
  'contract-check': {
    context: 'Un compañero de compras te envía por correo un contrato de proveedor de 30 páginas. Asunto: «Revisar el apartado 7 (responsabilidad) antes del jueves a mediodía».',
    text: 'Échale un vistazo, por favor.',
    ask: {
      format: '¿Cómo quieres mis comentarios: en el documento o en un correo breve?',
      criterion: '¿En qué me fijo: riesgos, redacción poco clara o los importes?'
    },
    given: { what: 'El asunto nombra la parte: el apartado 7.', when: 'El asunto nombra el plazo: el jueves a mediodía.' },
    replies: {
      clear: 'Lo tendrás antes del jueves a mediodía. ¿En qué me fijo en el apartado 7, y quieres comentarios en el archivo o un resumen breve?',
      vague: 'Le echo un vistazo.',
      redundant: '¿Qué parte debo leer y para cuándo?'
    }
  },
  'shared-dinner': {
    context: 'Lina escribe en el chat de grupo de cuatro amigos. Hoy mismo han quedado todos para cenar en su casa el sábado a las 19:00.',
    text: '¿Puede traer algo cada uno?',
    ask: {
      what: '¿Qué trae cada uno: un entrante, el postre o bebidas?',
      criterion: '¿Hay algo que alguien no pueda o no quiera comer?'
    },
    given: { when: 'Ya acordado: el sábado a las 19:00.', where: 'Ya acordado: en casa de Lina.' },
    replies: {
      clear: '¡Claro! ¿Nos repartimos entrante, postre y bebidas? ¿Y hay algo que alguien no pueda comer?',
      vague: 'Claro, llevaré algo.',
      redundant: '¿Dónde quedamos y a qué hora?'
    }
  }
};
