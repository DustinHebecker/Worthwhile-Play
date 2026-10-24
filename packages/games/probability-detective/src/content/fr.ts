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
    'c-cups': {
      title: 'La tasse fêlée',
      story: 'Un client rapporte une tasse avec une fêlure fine. Toutes les machines de l’atelier fabriquent la même tasse, mais chacune a ses manies.',
      lead: 'Les tasses de l’atelier sont faites par :',
      hyps: { a: 'La machine A', b: 'La machine B', c: 'La machine C' },
      clues: {
        crack: { label: 'Fêlure fine', seen: 'La tasse a une fêlure fine.', notSeen: 'La tasse a une fêlure fine.' },
        glaze: { label: 'Émail plus sombre', seen: 'L’émail est un peu plus sombre que d’habitude.', notSeen: 'L’émail a l’air normal.' },
        stamp: { label: 'Tampon net sous la base', seen: 'Le tampon du fabricant sous la base est net.', notSeen: 'Le tampon sous la base est flou.' },
        handle: { label: 'Anse un peu décentrée', seen: 'L’anse est un peu décentrée.', notSeen: 'L’anse est droite.' },
        box: { label: 'Dans une boîte grise', seen: 'Elle est arrivée dans la boîte grise habituelle, comme les tasses de toutes les machines.', notSeen: 'Elle est arrivée dans la boîte grise habituelle, comme les tasses de toutes les machines.' }
      }
    },
    'c-key': {
      title: 'La clé disparue',
      story: 'La clé de secours a encore disparu. Elle est presque toujours à l’un des mêmes quelques endroits.',
      lead: 'Quand la clé disparaît, elle réapparaît :',
      hyps: { coat: 'Dans le manteau', car: 'Dans la voiture', office: 'Au bureau' },
      clues: {
        'search-coat': { label: 'Une fouille rapide du manteau la trouve', seen: 'Tu trouves la clé dans le manteau.', notSeen: 'Tu fouilles vite les poches du manteau : pas de clé. Une fouille rapide peut la manquer.' },
        'search-car': { label: 'Un coup d’œil rapide dans la voiture la trouve', seen: 'Tu trouves la clé dans la voiture.', notSeen: 'Tu jettes un coup d’œil dans la voiture : pas de clé. Un coup d’œil rapide peut la manquer.' },
        jingle: { label: 'Un tintement dans l’entrée', seen: 'Tu te souviens d’un tintement quand le manteau a été accroché.', notSeen: 'Tu ne te souviens d’aucun tintement.' },
        drove: { label: 'Tu as conduit hier', seen: 'Tu as conduit hier.', notSeen: 'Tu n’as pas conduit hier.' },
        'office-day': { label: 'Tu étais au bureau', seen: 'Tu étais au bureau hier.', notSeen: 'Tu as travaillé chez toi hier.' },
        weekday: { label: 'C’est un jour de semaine', seen: 'Aujourd’hui est un jour de semaine : cela ne change rien à l’endroit où finissent les clés.', notSeen: 'Aujourd’hui est un jour de semaine : cela ne change rien à l’endroit où finissent les clés.' }
      }
    },
    'c-coin': {
      title: 'La pièce de la fête foraine',
      story: 'Tu as trouvé une vieille pièce sur un stand de fête foraine qui vend des accessoires de magie. On ne peut pas la distinguer d’une pièce ordinaire à l’œil, alors tu la lances.',
      lead: 'Les pièces de la boîte de vieilles pièces du stand sont :',
      hyps: { ordinary: 'Une pièce ordinaire', weighted: 'Une pièce truquée', 'two-headed': 'Une pièce à deux faces' },
      clues: {
        toss1: { label: 'Face au premier lancer', seen: 'Premier lancer : face.', notSeen: 'Premier lancer : pile.' },
        toss2: { label: 'Face au deuxième lancer', seen: 'Deuxième lancer : face.', notSeen: 'Deuxième lancer : pile.' },
        toss3: { label: 'Face au troisième lancer', seen: 'Troisième lancer : face.', notSeen: 'Troisième lancer : pile.' },
        toss4: { label: 'Face au quatrième lancer', seen: 'Quatrième lancer : face.', notSeen: 'Quatrième lancer : pile.' }
      }
    },
    'c-message': {
      title: 'Le message « du club »',
      story: 'Un message dit venir de ton club de sport et te demande de confirmer ton adhésion.',
      lead: 'Les messages qui disent venir du club sont :',
      hyps: { real: 'Vraiment du club', fake: 'Un faux' },
      clues: {
        link: { label: 'Contient un lien', seen: 'Il contient un lien.', notSeen: 'Il ne contient pas de lien.' },
        sender: { label: 'Adresse d’expéditeur inconnue', seen: 'L’adresse de l’expéditeur n’est pas celle du club.', notSeen: 'L’adresse de l’expéditeur est la bonne.' },
        hurry: { label: 'Te presse', seen: 'Il dit que tu dois répondre aujourd’hui.', notSeen: 'Il ne fixe aucun délai.' },
        'your-name': { label: 'Utilise ton nom', seen: 'Il te salue par ton nom.', notSeen: 'Il dit seulement « Cher membre ».' },
        evening: { label: 'Arrivé le soir', seen: 'Il est arrivé le soir : les deux sortes arrivent à toute heure.', notSeen: 'Il est arrivé le soir : les deux sortes arrivent à toute heure.' }
      }
    },
    'c-oven': {
      title: 'Le pain brûlé',
      story: 'Un pain de la fournée de ce matin est sorti brûlé d’un côté. La boulangerie cuit dans deux fours.',
      lead: 'Les pains d’ici sont cuits dans :',
      hyps: { old: 'Le vieux four', new: 'Le nouveau four' },
      clues: {
        'burnt-side': { label: 'Brûlé d’un côté', seen: 'Il est brûlé d’un côté.', notSeen: 'Il est brûlé d’un côté.' },
        'pale-top': { label: 'Dessus pâle', seen: 'Le dessus est pâle.', notSeen: 'Le dessus est doré de façon égale.' },
        'tray-mark': { label: 'Motif des nouvelles plaques', seen: 'Le dessous montre le motif des nouvelles plaques.', notSeen: 'Le dessous est lisse.' },
        early: { label: 'De la première fournée', seen: 'Il vient de la première fournée.', notSeen: 'Il vient d’une fournée plus tardive.' },
        seeds: { label: 'Des graines dessus', seen: 'Il a des graines dessus : les deux fours cuisent du pain aux graines.', notSeen: 'Il a des graines dessus : les deux fours cuisent du pain aux graines.' }
      }
    },
    'c-beep': {
      title: 'Le faible bip à la radio',
      story: 'Le récepteur du club radio a capté un bip faible et régulier. La plupart de ces bips sont des parasites, mais un petit satellite passe aussi au-dessus.',
      lead: 'Les bips faibles et réguliers sur ce récepteur sont :',
      hyps: { satellite: 'Le signal d’un petit satellite', interference: 'Des parasites ordinaires' },
      clues: {
        'pass-time': { label: 'Pendant un passage du satellite', seen: 'Il est arrivé quand le satellite devait passer au-dessus.', notSeen: 'Il est arrivé quand aucun passage n’était prévu.' },
        drift: { label: 'Le son glisse lentement', seen: 'Le son glisse lentement, comme celui d’une source en mouvement.', notSeen: 'Le son reste stable.' },
        fades: { label: 'S’éteint au bout d’un moment', seen: 'Il s’éteint au bout d’environ dix minutes.', notSeen: 'Il continue.' },
        rhythm: { label: 'Un rythme régulier', seen: 'Il bipe à un rythme régulier : les deux le font.', notSeen: 'Il bipe à un rythme régulier : les deux le font.' },
        'other-receiver': { label: 'Un second récepteur l’entend', seen: 'Un membre du club à l’autre bout de la ville l’entend aussi.', notSeen: 'Le récepteur à l’autre bout de la ville n’entend rien.' }
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
  },
checks: {
    'k-picnic': {
      title: 'Dehors ou dans la salle ?',
      story: 'Le pique-nique du quartier a lieu cet après-midi. Tu peux le faire sur la pelouse ou réserver la salle municipale.',
      lead: 'Les après-midi à cette époque de l’année sont :',
      hyps: { dry: 'Secs', rain: 'Pluvieux' },
      question: 'Quelle est la probabilité d’un après-midi sec ?',
      options: { outdoors: 'Pique-nique sur la pelouse', hall: 'Réserver la salle', tent: 'Monter une tente sur la pelouse' },
      checks: {
        sky: { label: 'Regarder le ciel à midi', yes: 'Des nuages sombres à midi.', no: 'Pas de nuages sombres à midi.' },
        barometer: { label: 'Regarder le baromètre', yes: 'Le baromètre baisse.', no: 'Le baromètre est stable.' },
        farmer: { label: 'Demander à l’agriculteur voisin', yes: 'L’agriculteur s’attend à de la pluie.', no: 'L’agriculteur s’attend à un après-midi sec.' },
        service: { label: 'Appeler le service météo', yes: 'Le service météo annonce de la pluie.', no: 'Le service météo ne donne aucune alerte.' },
        swallows: { label: 'Observer les hirondelles', yes: 'Les hirondelles volent bas.', no: 'Les hirondelles volent haut.' }
      }
    },
    'k-bike': {
      title: 'Acheter le vélo d’occasion ?',
      story: 'Un vélo d’occasion est à vendre à bon prix. Les vélos de ce genre sont en général en bon état, mais certains ont des dégâts cachés.',
      lead: 'Les vélos d’occasion comme celui-ci sont :',
      hyps: { sound: 'En bon état', damaged: 'Avec des dégâts cachés' },
      question: 'Quelle est la probabilité que le vélo soit en bon état ?',
      options: { buy: 'L’acheter', skip: 'Le laisser', 'offer-less': 'Proposer moins et prendre le risque' },
      checks: {
        ride: { label: 'Faire un essai', yes: 'L’essai est fluide.', no: 'L’essai est cahoteux.' },
        chain: { label: 'Regarder la chaîne', yes: 'La chaîne est rouillée.', no: 'La chaîne est propre.' },
        receipts: { label: 'Demander les factures de réparation', yes: 'Le vendeur a des factures de réparation.', no: 'Le vendeur n’a pas de factures.' },
        mechanic: { label: 'Payer un mécanicien pour regarder', yes: 'Le mécanicien trouve un problème.', no: 'Le mécanicien ne trouve rien.' },
        'seller-says': { label: 'Demander au vendeur', yes: 'Le vendeur dit qu’il est en bon état.', no: 'Le vendeur n’est pas sûr.' }
      }
    },
    'k-seeds': {
      title: 'Semer les vieilles graines ?',
      story: 'Un sachet de graines oublié a refait surface dans la cabane. Les semer prend un week-end ; des graines neuves coûtent un peu.',
      lead: 'Les sachets oubliés comme celui-ci sont :',
      hyps: { good: 'Encore bons', dead: 'Presque tous morts' },
      question: 'Quelle est la probabilité que les graines soient encore bonnes ?',
      options: { sow: 'Semer les vieilles graines', fresh: 'Acheter des graines neuves' },
      checks: {
        float: { label: 'En mettre quelques-unes dans l’eau', yes: 'La plupart coulent.', no: 'La plupart flottent.' },
        sprout: { label: 'En essayer quelques-unes sur un linge humide', yes: 'La plupart germent.', no: 'Peu germent.' },
        date: { label: 'Lire la date du sachet', yes: 'La date est récente.', no: 'La date est ancienne.' },
        shrivelled: { label: 'Regarder les graines de près', yes: 'Les graines ont l’air ratatinées.', no: 'Les graines ont l’air bien pleines.' },
        smell: { label: 'Les sentir', yes: 'Elles sentent le frais.', no: 'Elles sentent le moisi.' }
      }
    },
    'k-melon': {
      title: 'Acheter ce melon ?',
      story: 'Au marché, il reste un melon à bon prix.',
      lead: 'Les melons qui restent à cette heure sur ce stand sont :',
      hyps: { ripe: 'Mûrs', unripe: 'Pas encore mûrs' },
      question: 'Quelle est la probabilité que le melon soit mûr ?',
      options: { buy: 'L’acheter', leave: 'Le laisser' },
      checks: {
        knock: { label: 'Tapoter dessus', yes: 'Il sonne creux.', no: 'Il sonne sourd.' },
        smell: { label: 'Le sentir', yes: 'Il sent bon et sucré.', no: 'Il ne sent presque rien.' },
        'soft-end': { label: 'Appuyer sur le bout', yes: 'Le bout cède un peu.', no: 'Le bout est dur.' },
        taste: { label: 'Goûter une tranche de la même caisse', yes: 'La tranche est sucrée.', no: 'La tranche est fade.' },
        sticker: { label: 'Lire l’étiquette', yes: 'Il a une étiquette « mûr ».', no: 'Il n’a pas d’étiquette.' }
      }
    },
    'k-bread': {
      title: 'Cuire plus pour le marché ?',
      story: 'Demain, c’est jour de marché. Le pain en plus se vend bien un jour d’affluence, mais rassit un jour calme.',
      lead: 'Les jours de marché ici sont :',
      hyps: { busy: 'Animés', quiet: 'Calmes' },
      question: 'Quelle est la probabilité d’un jour de marché animé ?',
      options: { extra: 'Cuire beaucoup plus', normal: 'Cuire la quantité habituelle', 'little-extra': 'Cuire un peu plus' },
      checks: {
        calendar: { label: 'Consulter l’agenda de la ville', yes: 'L’agenda annonce un événement.', no: 'L’agenda n’annonce rien.' },
        neighbour: { label: 'Demander au stand de fromages', yes: 'Le stand de fromages attend du monde.', no: 'Le stand de fromages attend une journée calme.' },
        sunny: { label: 'Lire la météo', yes: 'Du soleil est prévu.', no: 'Des nuages sont prévus.' },
        office: { label: 'Appeler le bureau du marché', yes: 'Le bureau du marché attend beaucoup de visiteurs.', no: 'Le bureau du marché attend une affluence habituelle.' },
        'last-week': { label: 'Penser à la semaine dernière', yes: 'La semaine dernière était animée.', no: 'La semaine dernière était calme.' }
      }
    },
    'k-laptop': {
      title: 'Le réparer soi-même ?',
      story: 'L’ordinateur portable s’éteint au hasard. Une réparation à la maison coûte peu si la panne est mineure, mais c’est un effort perdu si elle est grave.',
      lead: 'Les pannes comme celle-ci sont :',
      hyps: { minor: 'Une panne mineure', major: 'Une panne grave' },
      question: 'Quelle est la probabilité d’une panne mineure ?',
      options: { repair: 'Le réparer à la maison', shop: 'L’apporter à un atelier', wait: 'Attendre et observer' },
      checks: {
        'error-code': { label: 'Redémarrer et observer', yes: 'Un code d’erreur apparaît.', no: 'Aucun code d’erreur n’apparaît.' },
        diagnostics: { label: 'Lancer l’outil de diagnostic', yes: 'L’outil signale une panne.', no: 'L’outil ne signale rien.' },
        cable: { label: 'Changer le câble d’alimentation', yes: 'Il marche avec un autre câble.', no: 'Il s’éteint toujours.' },
        fan: { label: 'Écouter le ventilateur', yes: 'Le ventilateur fait un bruit de frottement.', no: 'Le ventilateur a un bruit normal.' },
        forum: { label: 'Lire le forum', yes: 'D’autres avec ce modèle disent que c’était mineur.', no: 'D’autres avec ce modèle citent des causes variées.' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: 'Le capteur des réverbères',
      story: 'La ville contrôle ses vieux réverbères avec un capteur. Parmi tous les réverbères, {f} sont vraiment en panne. Le capteur signale {s} des réverbères en panne, mais il signale aussi par erreur {q} de ceux qui marchent. Le réverbère {lamp} vient d’être signalé.',
      questions: { q1: 'Le réverbère {lamp} est-il plutôt en panne ou plutôt en état de marche ?', q2: 'Quelle est la probabilité que le réverbère {lamp} soit en panne ?' },
      options: { faulty: 'Plutôt en panne', working: 'Plutôt en état de marche' },
      explain: 'Compte les réverbères signalés : {k} des {n} réverbères signalés sont vraiment en panne, la probabilité est donc {p}. Qu’on puisse se fier à un signalement dépend de la rareté des pannes, pas seulement de la qualité du capteur.',
      labels: { faulty: 'Réverbères en panne', working: 'Réverbères qui marchent', fit: 'signalés' }
    },
    't-wheel': {
      title: 'La roue',
      story: 'Une roue équitable a {k} secteurs égaux, dont {r} montrent une étoile. Les {s} derniers tours ont tous manqué l’étoile.',
      questions: { q1: 'Au prochain tour, une étoile est…', q2: 'Quelle est la probabilité d’une étoile au prochain tour ?' },
      options: { more: 'plus probable que d’habitude', less: 'moins probable que d’habitude', same: 'aussi probable que toujours' },
      explain: 'La roue n’a pas de mémoire : chaque tour repart de zéro, donc l’étoile sort toujours {p} du temps.',
      labels: { spins: 'Les tours manqués et le suivant' }
    },
    't-sequence': {
      title: 'Quel résultat est le plus probable ?',
      story: 'On lance {n} fois une pièce équilibrée (● face, ○ pile). Deux résultats possibles : A {a} et B {b}.',
      questions: { q1: 'Quel résultat exact est le plus probable ?', q2: 'Quelle est la probabilité d’obtenir exactement le résultat B ?' },
      options: { a: 'A', b: 'B', same: 'Les deux sont aussi probables' },
      explain: 'Il y a {total} résultats possibles, et chaque résultat exact a la même probabilité, {p}. B semble seulement plus typique parce que les résultats mélangés, pris ensemble, sont fréquents.',
      labels: { a: 'A', b: 'B' }
    },
    't-conjunction': {
      title: 'Pluie et vent',
      story: 'La météo de demain donne à la pluie une probabilité de {a}. Ici, les jours de pluie, il y a du vent {b} du temps ; les jours secs, {w} du temps.',
      questions: { q1: 'Qu’est-ce qui est le plus probable demain ?', q2: 'Quelle est la probabilité d’un jour à la fois pluvieux et venteux ?' },
      options: { windy: 'Un jour venteux', both: 'Un jour pluvieux et venteux', same: 'Les deux pareils' },
      explain: 'Imagine {days} jours comme demain : {both} sont pluvieux et venteux, mais {windy} sont venteux en tout. Tout jour pluvieux et venteux est aussi un jour venteux, donc « pluvieux et venteux » ne peut jamais être plus probable que « venteux ».',
      labels: { windy: 'Venteux', calm: 'Calme', rainy: 'Jours de pluie', dry: 'Jours secs' }
    },
    't-simpson': {
      title: 'Les deux services de livraison',
      story: 'Deux services de livraison indiquent combien de fois ils ont été à l’heure le mois dernier. Service A : trajets courts {aSk} sur {aSn}, trajets longs {aLk} sur {aLn}. Service B : trajets courts {bSk} sur {bSn}, trajets longs {bLk} sur {bLn}.',
      questions: { q1: 'Quel service a été le plus souvent à l’heure au total ?', q2: 'Ton colis fait un long trajet. Quel service a le meilleur bilan sur les longs trajets ?' },
      options: { a: 'Le service A', b: 'Le service B', same: 'Les deux pareils' },
      explain: 'A est meilleur sur les trajets courts et sur les longs, et pourtant B est meilleur au total ({b} contre {a} livraisons à l’heure), parce que B fait surtout les trajets courts, plus faciles. Compare ce qui est comparable.',
      labels: { a: 'Service A', b: 'Service B', short: 'Trajets courts', long: 'Trajets longs', overall: 'Au total' }
    },
    't-paw': {
      title: 'L’empreinte dans la farine',
      story: 'Cette nuit, quelqu’un a marché dans la farine sur le sol de la boulangerie. L’empreinte correspond au chat des voisins. Seuls {r} chats ont une empreinte comme celle-là. Environ {n} chats vivent assez près pour être entrés.',
      questions: { q1: 'Est-ce que « seuls {r} » veut dire que c’était presque sûrement le chat des voisins ?', q2: 'Quelle est la probabilité que ce soit le chat des voisins ? Suppose que chaque chat du voisinage avait la même chance d’entrer.' },
      options: { yes: 'Oui, sûr à environ {sure}', no: 'Non, bien moins sûr que ça' },
      explain: 'Parmi les {n} chats du voisinage, environ {others} autres ont aussi une empreinte qui correspond. Le chat des voisins n’est qu’un parmi plusieurs qui conviennent : {p}.',
      labels: { neighbour: 'Nuits où le chat des voisins est entré', others: 'Nuits où un autre chat est entré', fit: 'l’empreinte correspond' }
    },
    't-bakery': {
      title: 'La petite et la grande boulangerie',
      story: 'Deux boulangeries vendent des pains de seigle et de froment. En moyenne, la moitié des pains vendus sont au seigle, et chaque pain est un choix séparé. La petite boulangerie vend {n1} pains par jour, la grande {n2}.',
      questions: { q1: 'Quelle boulangerie a le plus de jours où plus de {t} des pains vendus sont au seigle ?', q2: 'Quelle part des jours la petite boulangerie vend-elle plus de {t} de seigle ?' },
      options: { small: 'La petite boulangerie', large: 'La grande boulangerie', same: 'À peu près pareil' },
      explain: 'Les petits échantillons varient davantage. La petite boulangerie a de tels jours {small} du temps, la grande seulement {large}.',
      labels: { small: 'Petite boulangerie', large: 'Grande boulangerie' }
    },
    't-drawers': {
      title: 'Le gardien qui sait',
      story: 'L’un des {n} tiroirs fermés contient la clé. Tu montres un tiroir. Le gardien, qui sait où est la clé, ouvre alors {opened} des autres tiroirs, tous vides, et laisse exactement un autre tiroir fermé. Il fait toujours ainsi et n’ouvre jamais le tien.',
      questions: { q1: 'Garder ton tiroir ou changer pour l’autre tiroir fermé ?', q2: 'Quelle est la probabilité que la clé soit dans l’autre tiroir fermé ?' },
      options: { switch: 'Changer', keep: 'Garder mon tiroir', same: 'Ça ne change rien' },
      explain: 'Imagine {total} parties. Ton premier choix n’est bon que dans une partie d’entre elles. Dans les {wins} autres, le gardien doit laisser fermé le tiroir de la clé, donc changer gagne : {p}.',
      labels: { right: 'Parties où ton premier choix a la clé', wrong: 'Parties où il ne l’a pas', fit: 'changer gagne' }
    },
    't-week': {
      title: 'Au moins un jour de pluie',
      story: 'Tu prévois un voyage de {m} jours. Chaque jour a une probabilité de pluie de {q}, indépendamment des autres jours.',
      questions: { q1: 'Quelle est la probabilité d’au moins un jour de pluie ?' },
      options: {},
      explain: 'Additionner les probabilités donnerait {sum}, ce qui ne peut pas être juste. Multiplie plutôt les probabilités d’un jour sec : aucune pluie a une probabilité de {none}, donc au moins un jour de pluie a {p}.',
      labels: { step: 'Toujours sec après le jour {n}' }
    },
    't-numbers': {
      title: 'Deux fois le même nombre',
      story: 'Chacune de {g} personnes choisit en secret, au hasard, un nombre entier de un à {r}.',
      questions: { q1: 'Quelle est la probabilité qu’au moins deux d’entre elles choisissent le même nombre ? D’abord ton intuition :', q2: 'Maintenant ton estimation : quelle est la probabilité d’au moins un nombre commun ?' },
      options: { low: 'Moins d’une chance sur quatre', even: 'À peu près une chance sur deux', high: 'Plus de trois chances sur quatre' },
      explain: 'Avec {g} personnes, il y a {pairs} paires qui pourraient coïncider, donc une coïncidence arrive plus tôt qu’on ne le croit : {p}.',
      labels: { step: 'Tous différents parmi les {n} premiers' }
    },
    't-tyres': {
      title: 'Deux fois moins de crevaisons',
      story: 'Un nouveau type de pneu fait passer les crevaisons de {b} à {a} pour cent trajets. Le fabricant parle de {rel} de crevaisons en moins.',
      questions: { q1: 'Sur {rides} trajets, combien de crevaisons en moins ?' },
      options: {},
      explain: 'Sur {rides} trajets, il y a {old} crevaisons avant et {new} après : {fewer} de moins. « {rel} de moins » paraît énorme ; ce que tu remarques, c’est le changement absolu.',
      labels: { old: 'Anciens pneus', new: 'Nouveaux pneus', fit: 'crevaisons' }
    },
    't-dice': {
      title: 'Deux dés',
      story: 'Tu lances deux dés ordinaires et tu additionnes les points.',
      questions: { q1: 'Quelle somme est la plus probable : {s1} ou {s2} ?', q2: 'Quelle est la probabilité de la somme {s1} ?' },
      options: { first: '{s1}', second: '{s2}', same: 'Aussi probables' },
      explain: 'Sur les trente-six résultats également probables, {c1} donnent {s1} et {c2} donnent {s2}.',
      labels: {}
    }
  }
};
