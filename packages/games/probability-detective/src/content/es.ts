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
  }
};
