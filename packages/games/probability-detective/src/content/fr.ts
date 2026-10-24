import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'Le colis bleu',
      story: 'Un colis sans expéditeur est arrivé à l’épicerie du coin. Il vient forcément de l’un des entrepôts qui livrent cette rue.',
      lead: 'Les colis de cette rue viennent de :',
      hyps: { north: 'Entrepôt Nord', south: 'Entrepôt Sud', east: 'Entrepôt Est' },
      clues: {
        blue: { label: 'Emballé dans du papier bleu', seen: 'Le colis est emballé dans du papier bleu.', notSeen: 'Le colis n’est pas emballé dans du papier bleu.' },
        'brown-tape': { label: 'Fermé au ruban marron', seen: 'Il est fermé avec du ruban adhésif marron.', notSeen: 'Il n’est pas fermé avec du ruban adhésif marron.' },
        smudge: { label: 'Étiquette tachée', seen: 'L’étiquette d’adresse est tachée.', notSeen: 'L’étiquette d’adresse est propre.' },
        string: { label: 'Ficelé', seen: 'Il est ficelé.', notSeen: 'Il n’est pas ficelé.' },
        tuesday: { label: 'Arrivé un mardi', seen: 'Il est arrivé un mardi. Tous les entrepôts livrent chaque jour ouvré.', notSeen: 'Il est arrivé un mardi. Tous les entrepôts livrent chaque jour ouvré.' },
        'echo-blue': { label: 'La voisine l’a vu aussi', seen: 'La voisine dit aussi que le colis était bleu – elle a vu le même colis.', notSeen: 'La voisine dit aussi que le colis était bleu – elle a vu le même colis.' }
      }
    },
    'c-garden': {
      title: 'Les fraises grignotées',
      story: 'Quelqu’un s’est servi dans les fraises pendant la nuit. Dans ce jardin, quelques sortes de visiteurs en sont friands.',
      lead: 'Les nuits où des fraises sont grignotées, le visiteur est :',
      hyps: { birds: 'Des oiseaux', snails: 'Des escargots', hedgehog: 'Un hérisson' },
      clues: {
        slime: { label: 'Trace brillante', seen: 'Il y a une trace brillante sur l’allée.', notSeen: 'Il n’y a pas de trace brillante.' },
        pecks: { label: 'Petits coups de bec', seen: 'Les fruits portent de petits coups de bec.', notSeen: 'Il n’y a pas de coups de bec.' },
        droppings: { label: 'Crottes sous la haie', seen: 'Il y a des crottes sous la haie.', notSeen: 'Il n’y a rien sous la haie.' },
        'net-moved': { label: 'Filet écarté', seen: 'Le filet au-dessus du carré est écarté.', notSeen: 'Le filet est toujours en place.' },
        rain: { label: 'Il a plu cette nuit', seen: 'Il a plu cette nuit – tous sortent sous la pluie.', notSeen: 'Il a plu cette nuit – tous sortent sous la pluie.' },
        'echo-slime': { label: 'Revu le matin', seen: 'Ton voisin te montre la même trace brillante.', notSeen: 'Ton voisin te montre la même trace brillante.' }
      }
    },
    'c-rain': {
      title: 'A-t-il plu cette nuit ?',
      story: 'Tu étais absent cette nuit et tu veux savoir si les semis ont reçu de la pluie ou s’il faut les arroser maintenant.',
      lead: 'Les nuits à cette période de l’année :',
      hyps: { rained: 'Il a plu', dry: 'C’est resté sec' },
      clues: {
        'wet-grass': { label: 'Herbe mouillée', seen: 'L’herbe est mouillée (la rosée la mouille aussi).', notSeen: 'L’herbe est sèche.' },
        gauge: { label: 'Eau dans le pluviomètre', seen: 'Il y a de l’eau dans le pluviomètre.', notSeen: 'Le pluviomètre est vide.' },
        puddle: { label: 'Flaque près du portail', seen: 'Il y a une flaque près du portail.', notSeen: 'Il n’y a pas de flaque près du portail.' },
        'snails-out': { label: 'Escargots sur l’allée', seen: 'Des escargots sont sortis sur l’allée.', notSeen: 'Il n’y a pas d’escargots sur l’allée.' },
        wind: { label: 'Feuilles sur la table', seen: 'Des feuilles ont été soufflées sur la table – il a venté de toute façon.', notSeen: 'Des feuilles ont été soufflées sur la table – il a venté de toute façon.' }
      }
    },
    'c-bird': {
      title: 'Quel oiseau était à la mangeoire ?',
      story: 'Tu n’as aperçu qu’un instant un petit oiseau brun à la mangeoire avant qu’il s’envole. Les parts sont inventées pour cette mangeoire ; les vraies varient selon le lieu.',
      lead: 'Les petits visiteurs bruns de cette mangeoire sont :',
      hyps: { finch: 'Un pinson', sparrow: 'Un moineau' },
      clues: {
        'red-patch': { label: 'Un éclat rouge', seen: 'Tu as vu un éclat rouge sur sa tête.', notSeen: 'Tu n’as vu aucun rouge.' },
        ground: { label: 'A mangé au sol', seen: 'Il a mangé au sol sous la mangeoire.', notSeen: 'Il a mangé sur la mangeoire même.' },
        song: { label: 'Un chant gazouillant', seen: 'Il a lancé un chant gazouillant.', notSeen: 'Il a seulement pépié.' },
        group: { label: 'Venu en groupe', seen: 'Il est venu avec un petit groupe.', notSeen: 'Il est venu seul.' },
        morning: { label: 'Le matin', seen: 'C’était tôt le matin – les deux viennent à cette heure-là.', notSeen: 'C’était tôt le matin – les deux viennent à cette heure-là.' }
      }
    },
    'c-plant': {
      title: 'La plante qui s’affaisse',
      story: 'La plante du bureau s’affaisse et a des feuilles jaunes. Dans ce bureau, c’est généralement l’une de deux choses.',
      lead: 'Quand les plantes s’affaissent ici, la cause est :',
      hyps: { water: 'Trop d’eau', light: 'Trop peu de lumière' },
      clues: {
        'wet-soil': { label: 'Terre humide', seen: 'La terre est encore humide deux jours après l’arrosage.', notSeen: 'La terre est sèche.' },
        leaning: { label: 'Penchée vers la fenêtre', seen: 'Elle penche vers la fenêtre.', notSeen: 'Elle se tient droite.' },
        'soft-stem': { label: 'Pied de tige mou', seen: 'Le pied de la tige est mou.', notSeen: 'La tige est ferme.' },
        'pale-new': { label: 'Nouvelles feuilles pâles', seen: 'Les nouvelles feuilles sont pâles et petites.', notSeen: 'Les nouvelles feuilles ont l’air saines.' },
        'pot-colour': { label: 'Un pot bleu', seen: 'Elle est dans un pot bleu – cela ne change rien.', notSeen: 'Elle est dans un pot bleu – cela ne change rien.' }
      }
    },
    'c-bus': {
      title: 'Pourquoi le bus était-il en retard ?',
      story: 'Ton bus est arrivé avec quarante minutes de retard ce matin.',
      lead: 'Quand ce bus a beaucoup de retard, la raison est :',
      hyps: { jam: 'Un embouteillage', breakdown: 'Une panne' },
      clues: {
        'others-late': { label: 'D’autres bus en retard aussi', seen: 'D’autres bus sur la même route étaient aussi en retard.', notSeen: 'Les autres bus de la route étaient à l’heure.' },
        replacement: { label: 'Un autre bus est venu', seen: 'Un autre bus que d’habitude est venu.', notSeen: 'Le bus habituel est venu.' },
        announcement: { label: 'Une annonce', seen: 'L’écran indiquait : retard dû à un incident technique.', notSeen: 'L’écran ne donnait aucune raison.' },
        'rush-hour': { label: 'À l’heure de pointe', seen: 'C’était l’heure de pointe.', notSeen: 'C’était un moment calme de la journée.' },
        rain: { label: 'Il pleuvait', seen: 'Il pleuvait – à cet arrêt, cela ne change rien.', notSeen: 'Il pleuvait – à cet arrêt, cela ne change rien.' }
      }
    }
  }
};
