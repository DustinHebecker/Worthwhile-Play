import type { ContentText } from './types';

export const content: ContentText = {
  launch: {
    title: 'Point sur le lancement de l’appli',
    context: 'Un e-mail de la cheffe de projet à toute l’équipe.',
    sentences: {
      s1: 'Bonjour à tous, j’espère que vous avez passé un bon week-end au soleil.',
      s2: 'Le lancement de notre appli de réservation passe du 2 avril au 14 mai.',
      s3: 'La raison : le prestataire de paiement n’a pas encore terminé sa certification de sécurité, et sans elle nous ne pouvons pas encaisser de paiements.',
      s4: 'Le prestataire dit avoir un retard dans le traitement des demandes.',
      s5: 'L’équipe design profitera des semaines supplémentaires pour peaufiner les écrans d’accueil.',
      s6: 'Nos 300 bêta-testeurs peuvent continuer à utiliser la version de test jusqu’au lancement.',
      s7: 'Un concurrent a lancé une appli similaire l’an dernier et il lui a fallu trois tentatives.',
      s8: 'Le marketing doit décaler la campagne : merci de décider du nouveau démarrage de la campagne d’ici vendredi.',
      s9: 'Le budget reste le même, car l’agence ne facture rien pour décaler la campagne.',
      s10: 'La certification elle-même prend environ trois semaines une fois lancée.',
      s11: 'Encore merci pour tout votre travail !',
      s12: 'J’enverrai un planning de projet mis à jour mercredi.'
    },
    bullets: {
      gold1: 'Le lancement passe du 2 avril au 14 mai.',
      gold2: 'Cause : la certification de sécurité du prestataire de paiement n’est pas terminée.',
      gold3: 'Le marketing doit décider du nouveau démarrage de la campagne d’ici vendredi.',
      minor: 'L’équipe design va peaufiner les écrans d’accueil.',
      distort: 'L’appli a échoué au contrôle de sécurité.',
      dup: 'Le lancement est retardé.',
      subtle: 'Le lancement passe du 2 avril au 4 mai.'
    },
    bulletNotes: {
      distort: 'Le texte dit que la certification n’est pas encore terminée, pas que l’appli a échoué à un contrôle.',
      dup: 'Reprend le point sur la nouvelle date, mais sans la date : une place perdue.',
      subtle: 'Presque, mais la nouvelle date est le 14 mai, pas le 4.'
    },
    summaries: {
      faithful: 'Le lancement passe au 14 mai parce que la certification du prestataire de paiement n’est pas terminée, et le marketing doit décider du nouveau démarrage de la campagne d’ici vendredi.',
      vague: 'Il y a quelques changements dans le calendrier du lancement dont l’équipe devrait être informée.',
      drops: 'Comme le prestataire de paiement n’est pas encore prêt, le lancement a été repoussé, mais le budget reste le même.',
      adds: 'Le lancement passe au 14 mai parce que la certification du prestataire de paiement n’est pas terminée, et ce retard va rendre le projet plus cher.',
      subtle: 'Le lancement passe au 14 mai parce que notre appli a échoué à la certification du prestataire de paiement, et le marketing doit décider du nouveau démarrage de la campagne d’ici vendredi.'
    },
    summaryNotes: {
      drops: 'Il manque la nouvelle date et la décision que le marketing doit prendre.',
      adds: 'Le texte dit que le budget reste le même ; la hausse des coûts est inventée.',
      subtle: 'L’appli n’a échoué à rien : la certification n’est simplement pas encore terminée.'
    },
    task: 'L’équipe marketing doit agir à partir de cette phrase.',
    oneLiner: 'Décalez le lancement en mai.',
    details: {
      d1: 'La nouvelle date exacte : le 14 mai',
      d2: 'Qui doit agir : le marketing décale la campagne',
      d3: 'L’échéance : décider du nouveau démarrage de la campagne d’ici vendredi',
      d4: 'Pourquoi le prestataire est en retard',
      d5: 'Les projets de l’équipe design pour les écrans d’accueil',
      d6: 'Le week-end ensoleillé'
    },
    versions: {
      actionable: 'Le lancement passe du 2 avril au 14 mai. Marketing : merci de décaler la campagne et de décider de la nouvelle date de démarrage d’ici vendredi. Le budget reste le même.',
      vague: 'Nous décalons le lancement en mai. Merci d’adapter vos plans en conséquence et de nous prévenir en cas de souci.',
      invented: 'Le lancement passe au 1er mai. Marketing : merci d’annuler la campagne et d’en préparer une nouvelle d’ici la fin du mois.'
    },
    versionNote: 'La nouvelle date est le 14 mai, pas le 1er, et la campagne est décalée, pas annulée.'
  },
  library: {
    title: 'Travaux à la bibliothèque',
    context: 'Une affiche sur la porte de la bibliothèque du quartier.',
    sentences: {
      s1: 'Vous êtes nombreux à nous dire combien vous aimez les vieux fauteuils du coin lecture.',
      s2: 'À partir du 3 juin, la bibliothèque sera fermée pour travaux pendant huit semaines.',
      s3: 'Le toit sera réparé, et le bâtiment sera doté d’un ascenseur et d’un nouvel éclairage.',
      s4: 'Pendant la fermeture, un bibliobus s’arrêtera sur la place du marché tous les mardis.',
      s5: 'Le bibliobus transporte environ 2 000 livres et peut commander n’importe quel titre à la bibliothèque centrale.',
      s6: 'Tous les prêts qui arriveraient à échéance pendant la fermeture sont prolongés automatiquement : personne ne paiera de pénalités.',
      s7: 'Les livres peuvent aussi être rendus à tout moment dans la boîte de retour à côté de la mairie.',
      s8: 'La mairie elle-même a été rénovée de la même façon il y a dix ans.',
      s9: 'Nos livres numériques et livres audio restent disponibles en ligne comme d’habitude.',
      s10: 'Nous avons déjà hâte d’être au festival de lecture de l’été prochain.',
      s11: 'Les travaux sont financés par un fonds régional pour les bâtiments.'
    },
    bullets: {
      gold1: 'Fermée pour travaux pendant huit semaines à partir du 3 juin.',
      gold2: 'Un bibliobus s’arrête sur la place du marché tous les mardis.',
      gold3: 'Les prêts arrivant à échéance pendant la fermeture sont prolongés automatiquement.',
      minor: 'Le bâtiment aura un nouvel éclairage.',
      distort: 'Tous les services de la bibliothèque s’arrêtent pendant huit semaines.',
      dup: 'La bibliothèque sera fermée un moment.',
      subtle: 'Fermée pour travaux pendant six semaines à partir du 3 juin.'
    },
    bulletNotes: {
      distort: 'Faux : le bibliobus et la boîte de retour continuent de fonctionner pendant la fermeture.',
      dup: 'Reprend la fermeture sans date de début ni durée.',
      subtle: 'Presque, mais la fermeture dure huit semaines, pas six.'
    },
    summaries: {
      faithful: 'La bibliothèque ferme huit semaines à partir du 3 juin ; entre-temps, un bibliobus vient sur la place du marché chaque mardi et les prêts qui arrivent à échéance sont prolongés automatiquement.',
      vague: 'Il y aura quelques changements à la bibliothèque cet été, alors restez attentifs.',
      drops: 'La bibliothèque va être rénovée et aura un toit réparé, un ascenseur et un nouvel éclairage.',
      adds: 'La bibliothèque ferme huit semaines à partir du 3 juin et fera payer un petit montant pour les prêts après sa réouverture.',
      subtle: 'Comme le toit est dangereux, la bibliothèque ferme huit semaines à partir du 3 juin ; entre-temps, un bibliobus vient sur la place du marché chaque mardi.'
    },
    summaryNotes: {
      drops: 'Elle décrit les travaux, mais ni quand la bibliothèque ferme ni ce que les lecteurs peuvent faire entre-temps.',
      adds: 'L’affiche ne parle d’aucun frais après la réouverture.',
      subtle: 'L’affiche dit que le toit sera réparé, pas qu’il est dangereux : cette cause est ajoutée.'
    },
    task: 'Un voisin qui veut continuer à emprunter des livres vous pose la question.',
    oneLiner: 'La bibliothèque est fermée cet été.',
    details: {
      d1: 'Quand exactement : huit semaines à partir du 3 juin',
      d2: 'Où emprunter entre-temps : au bibliobus sur la place du marché le mardi',
      d3: 'Où rendre les livres : dans la boîte à côté de la mairie',
      d4: 'Ce que comprennent les travaux',
      d5: 'Les fauteuils du coin lecture',
      d6: 'Le festival de lecture de l’an prochain'
    },
    versions: {
      actionable: 'À partir du 3 juin, la bibliothèque est fermée huit semaines. Tu peux emprunter des livres au bibliobus sur la place du marché chaque mardi et les rendre à tout moment dans la boîte à côté de la mairie. Les prêts qui arrivent à échéance pendant ce temps sont prolongés automatiquement.',
      vague: 'La bibliothèque sera fermée un moment cet été pour des travaux. Il y aura d’autres solutions, regarde l’affiche pour en savoir plus.',
      invented: 'À partir du 3 juin, la bibliothèque est fermée huit semaines. Tu peux emprunter des livres au bibliobus à la gare chaque vendredi. Rends tous tes livres avant la fermeture.'
    },
    versionNote: 'Le bibliobus s’arrête sur la place du marché le mardi, et personne ne doit rendre ses livres avant la fermeture.'
  },
  leaves: {
    title: 'Pourquoi les feuilles changent de couleur',
    context: 'Un court article d’un magazine nature pour lecteurs curieux.',
    sentences: {
      s1: 'L’automne est pour beaucoup la saison préférée des longues promenades.',
      s2: 'Les feuilles sont vertes parce qu’elles contiennent beaucoup de chlorophylle, le pigment qui permet aux plantes de capter la lumière du soleil.',
      s3: 'Quand les jours raccourcissent, beaucoup d’arbres cessent de fabriquer de la chlorophylle et la dégradent.',
      s4: 'Les pigments jaunes et orange, appelés caroténoïdes, étaient dans la feuille depuis le début ; ils ne deviennent visibles que lorsque le vert s’efface.',
      s5: 'Les caroténoïdes sont le même type de pigment que celui qui rend les carottes orange.',
      s6: 'Le rouge, c’est différent : certains arbres, comme beaucoup d’érables, fabriquent de nouveaux pigments rouges en automne.',
      s7: 'Les chercheurs pensent que ces pigments rouges pourraient protéger la feuille d’une lumière forte pendant que l’arbre récupère ses nutriments.',
      s8: 'Les journées ensoleillées et les nuits fraîches rendent généralement les rouges plus éclatants.',
      s9: 'Dans certaines régions, les forêts colorées attirent beaucoup de touristes chaque année.',
      s10: 'Enfin, une fine couche de cellules se forme là où la feuille rejoint la branche, et la feuille tombe.',
      s11: 'N’oubliez pas une veste chaude si vous sortez admirer les arbres.'
    },
    bullets: {
      gold1: 'En automne, les arbres cessent de fabriquer la chlorophylle verte et la dégradent.',
      gold2: 'Les pigments jaunes et orange étaient là depuis le début et deviennent visibles.',
      gold3: 'Certains arbres, comme les érables, fabriquent de nouveaux pigments rouges.',
      minor: 'Une fine couche de cellules se forme et la feuille tombe.',
      distort: 'Toutes les couleurs d’automne sont de nouveaux pigments fabriqués par l’arbre.',
      dup: 'Les feuilles perdent leur couleur verte.',
      subtle: 'Les pigments rouges protègent la feuille d’une lumière forte.'
    },
    bulletNotes: {
      distort: 'Seuls les rouges sont nouveaux ; le jaune et l’orange étaient dans la feuille depuis le début.',
      dup: 'Dit moins que le point sur la chlorophylle et fait perdre une place.',
      subtle: 'Le texte dit seulement que les chercheurs pensent que les pigments rouges pourraient protéger la feuille ; cette puce l’affirme comme un fait.'
    },
    summaries: {
      faithful: 'En automne, beaucoup d’arbres dégradent leur chlorophylle verte, ce qui fait apparaître des pigments jaunes et orange présents depuis le début, tandis que certains arbres fabriquent aussi de nouveaux pigments rouges.',
      vague: 'Les feuilles changent de couleur en automne à cause de divers processus naturels dans l’arbre.',
      drops: 'En automne, les feuilles deviennent jaunes, orange et rouges, puis elles tombent des arbres.',
      adds: 'En automne, beaucoup d’arbres dégradent leur chlorophylle verte, ce qui fait apparaître des pigments jaunes et orange, et plus les feuilles sont rouges, plus l’hiver sera froid.',
      subtle: 'En automne, beaucoup d’arbres dégradent leur chlorophylle verte, ce qui fait apparaître des pigments jaunes et orange, et les nuits froides poussent les arbres à fabriquer des pigments rouges.'
    },
    summaryNotes: {
      drops: 'Elle décrit ce que l’on voit, mais pas pourquoi cela se produit.',
      adds: 'Le texte ne dit rien sur la prévision de l’hiver.',
      subtle: 'Les nuits fraîches rendent seulement les rouges généralement plus éclatants ; le texte ne dit pas qu’elles causent les pigments rouges.'
    },
    task: 'Une enseignante veut expliquer cette phrase à sa classe avec de vraies feuilles.',
    oneLiner: 'La chlorophylle se dégrade, alors d’autres couleurs apparaissent.',
    details: {
      d1: 'Ce qu’est la chlorophylle : le pigment vert qui capte la lumière du soleil',
      d2: 'Que le jaune et l’orange étaient dans la feuille depuis le début',
      d3: 'Que certains arbres, comme les érables, fabriquent de nouveaux pigments rouges',
      d4: 'Que l’automne est une saison appréciée pour se promener',
      d5: 'Qu’il faut une veste chaude dehors',
      d6: 'Comment la feuille finit par tomber'
    },
    versions: {
      actionable: 'Les feuilles sont vertes grâce à la chlorophylle, un pigment qui capte la lumière du soleil. En automne, beaucoup d’arbres cessent d’en fabriquer et la dégradent. Les pigments jaunes et orange, présents depuis le début, deviennent alors visibles, et certains arbres, comme les érables, fabriquent de nouveaux pigments rouges.',
      vague: 'En automne, les feuilles changent parce que le vert s’en va et que d’autres couleurs ressortent. La nature est fascinante.',
      invented: 'Les feuilles sont vertes grâce à la chlorophylle. En automne, le gel fait geler la chlorophylle, puis l’arbre peint ses feuilles en jaune, orange et rouge avec de nouveaux pigments.'
    },
    versionNote: 'Le texte ne dit pas que le gel fait geler la chlorophylle, et seuls les rouges sont de nouveaux pigments.'
  },
  club: {
    title: 'Réunion du bureau du club sportif',
    context: 'Le compte rendu d’une réunion du bureau d’un club sportif, envoyé à tous les membres.',
    sentences: {
      s1: 'La réunion a eu lieu au club-house et a commencé un peu en retard à cause d’un match de football.',
      s2: 'Le bureau propose de faire passer la cotisation annuelle de 60 à 66 euros à partir de janvier prochain.',
      s3: 'La raison : le loyer du gymnase a augmenté de 15 pour cent.',
      s4: 'La cotisation n’a pas changé depuis huit ans.',
      s5: 'Les membres de moins de 18 ans continueront de payer l’ancienne cotisation.',
      s6: 'Les membres voteront sur la proposition lors de l’assemblée générale du 12 mars.',
      s7: 'Le bureau a aussi parlé de nouveaux filets pour les courts de tennis, mais a reporté la décision.',
      s8: 'Si la proposition est rejetée, le bureau envisagera plutôt de supprimer certains créneaux d’entraînement.',
      s9: 'Un club voisin a lui aussi augmenté récemment sa cotisation, à 75 euros.',
      s10: 'Le gymnase appartient à la commune, qui fixe le loyer.',
      s11: 'Un grand merci à l’équipe des jeunes pour les délicieux gâteaux !'
    },
    bullets: {
      gold1: 'Proposition : la cotisation annuelle passe de 60 à 66 euros à partir de janvier.',
      gold2: 'Les membres de moins de 18 ans continuent de payer l’ancienne cotisation.',
      gold3: 'Les membres votent lors de l’assemblée générale du 12 mars.',
      minor: 'On a parlé de nouveaux filets pour les courts de tennis.',
      distort: 'Le bureau a décidé d’augmenter la cotisation.',
      dup: 'La cotisation va peut-être augmenter.',
      subtle: 'Proposition : la cotisation annuelle passe de 60 à 76 euros à partir de janvier.'
    },
    bulletNotes: {
      distort: 'Rien n’est encore décidé : c’est une proposition, et les membres votent.',
      dup: 'Une reprise plus vague du point sur la cotisation, sans les montants.',
      subtle: 'Presque, mais la cotisation proposée est de 66 euros, pas de 76.'
    },
    summaries: {
      faithful: 'Comme le loyer du gymnase a augmenté, le bureau propose de faire passer la cotisation annuelle de 60 à 66 euros à partir de janvier, sauf pour les moins de 18 ans, et les membres voteront le 12 mars.',
      vague: 'Le bureau a parlé de questions d’argent et de quelques changements pour les membres.',
      drops: 'Comme le loyer du gymnase a augmenté, les finances du club ont été le sujet principal de la réunion du bureau.',
      adds: 'Le bureau propose de faire passer la cotisation annuelle de 60 à 66 euros à partir de janvier, et ceux qui ne paient pas avant mars perdront leur adhésion.',
      subtle: 'Comme le loyer du gymnase a augmenté, le bureau a décidé de faire passer la cotisation annuelle de 60 à 66 euros à partir de janvier, sauf pour les moins de 18 ans.'
    },
    summaryNotes: {
      drops: 'Il manque la nouvelle cotisation proposée et le vote du 12 mars.',
      adds: 'Le compte rendu ne dit rien sur la perte de l’adhésion.',
      subtle: 'Ce n’est qu’une proposition que les membres doivent encore voter : « a décidé » est donc faux.'
    },
    task: 'Un membre vous demande ce que cela signifie pour lui.',
    oneLiner: 'Les cotisations augmentent.',
    details: {
      d1: 'Les montants : de 60 à 66 euros par an',
      d2: 'Que c’est une proposition, votée lors de l’assemblée du 12 mars',
      d3: 'Que les membres de moins de 18 ans gardent l’ancienne cotisation',
      d4: 'Que la réunion a commencé en retard',
      d5: 'Les gâteaux de l’équipe des jeunes',
      d6: 'La discussion sur les filets de tennis'
    },
    versions: {
      actionable: 'Le bureau propose de faire passer la cotisation annuelle de 60 à 66 euros à partir de janvier, parce que le loyer du gymnase a augmenté. Les moins de 18 ans gardent l’ancienne cotisation. Rien n’est encore décidé : tu peux voter lors de l’assemblée générale du 12 mars.',
      vague: 'Les cotisations augmentent l’an prochain parce que tout est devenu plus cher. On aura plus d’infos plus tard.',
      invented: 'À partir de janvier, la cotisation passe de 60 à 66 euros pour tout le monde. Modifie ton virement avant l’assemblée générale du 12 mars.'
    },
    versionNote: 'Elle présente une proposition comme décidée et oublie que les moins de 18 ans gardent l’ancienne cotisation.'
  },
  trip: {
    title: 'Changement pour la sortie de classe',
    context: 'Un message d’un enseignant aux parents d’une classe.',
    sentences: {
      s1: 'J’espère que les enfants ont autant hâte que moi de partir !',
      s2: 'À cause d’une grève des trains, nous irons à la mer en car au lieu du train.',
      s3: 'Cela signifie que nous partons une heure plus tôt que prévu.',
      s4: 'Le point de rendez-vous n’est plus la gare, mais le parking derrière l’école.',
      s5: 'La compagnie de cars a beaucoup d’expérience avec les groupes scolaires.',
      s6: 'Le retour du vendredi reste comme prévu.',
      s7: 'Il n’y a pas de frais supplémentaires pour les familles ; l’école paie la différence.',
      s8: 'Le trajet en car dure environ 40 minutes de plus que le train.',
      s9: 'La classe de l’an dernier est allée à la montagne, ce qui était aussi un super voyage.',
      s10: 'Il y a une courte pause à mi-chemin, sur une aire d’autoroute.',
      s11: 'Merci à tous pour votre aide avec les listes de bagages.'
    },
    bullets: {
      gold1: 'Car au lieu du train à cause d’une grève des trains.',
      gold2: 'Départ une heure plus tôt, depuis le parking derrière l’école.',
      gold3: 'Pas de frais supplémentaires pour les familles.',
      minor: 'La compagnie de cars a l’habitude des groupes scolaires.',
      distort: 'La sortie est raccourcie à cause de la grève.',
      dup: 'Les plans de voyage ont changé.',
      subtle: 'Départ deux heures plus tôt, depuis le parking derrière l’école.'
    },
    bulletNotes: {
      distort: 'Seul le trajet aller change ; la sortie n’est pas raccourcie.',
      dup: 'Dit seulement que quelque chose a changé, ce que montrent déjà les autres points.',
      subtle: 'Presque, mais le départ est une heure plus tôt, pas deux.'
    },
    summaries: {
      faithful: 'À cause d’une grève des trains, la classe voyage en car et part une heure plus tôt du parking derrière l’école, sans frais supplémentaires pour les familles.',
      vague: 'Il y a quelques changements dans l’organisation de la sortie que les parents devraient connaître.',
      drops: 'À cause d’une grève des trains, la classe ira à la mer en car, ce qui ne coûte rien de plus aux familles.',
      adds: 'À cause d’une grève des trains, la classe voyage en car et part une heure plus tôt du parking derrière l’école, et les parents paient un petit supplément.',
      subtle: 'Comme le car est plus rapide que le train, la classe voyage en car et part une heure plus tôt du parking derrière l’école, sans frais supplémentaires pour les familles.'
    },
    summaryNotes: {
      drops: 'Il manque ce que les parents doivent faire : le départ plus tôt et le nouveau point de rendez-vous.',
      adds: 'Le message dit que l’école paie la différence : il n’y a donc pas de supplément.',
      subtle: 'La raison est la grève des trains, et le car est même plus lent que le train.'
    },
    task: 'Un parent qui a raté le message demande à un autre ce qu’il faut faire.',
    oneLiner: 'La classe part en car maintenant.',
    details: {
      d1: 'Le nouveau point de rendez-vous : le parking derrière l’école',
      d2: 'Le nouvel horaire : une heure plus tôt que prévu',
      d3: 'Qu’il n’y a pas de frais supplémentaires',
      d4: 'Que la compagnie de cars est expérimentée',
      d5: 'Pourquoi ils ne prennent pas le train',
      d6: 'Que l’enseignant a hâte de partir'
    },
    versions: {
      actionable: 'La classe part en car. Amène ton enfant une heure plus tôt que prévu au parking derrière l’école, pas à la gare. Ça ne coûte rien de plus, et le retour du vendredi ne change pas.',
      vague: 'Il y a une grève, alors ils prennent un car maintenant. Les horaires et les lieux changent un peu, regarde ce que l’enseignant a écrit.',
      invented: 'La classe part en car. Amène ton enfant à la gare une heure plus tôt et donne-lui un peu d’argent pour le billet de car.'
    },
    versionNote: 'Le rendez-vous est au parking derrière l’école, pas à la gare, et l’école prend les frais en charge.'
  },
  bikes: {
    title: 'Des vélos électriques en libre-service',
    context: 'Une annonce du service de vélos en libre-service d’une ville à ses usagers.',
    sentences: {
      s1: 'Le vélo est un excellent moyen de rester actif et de découvrir la ville.',
      s2: 'À partir du 1er juillet, notre service de vélos en libre-service ajoute 200 vélos électriques à sa flotte.',
      s3: 'Un vélo électrique coûte 20 centimes la minute ; les vélos classiques gardent leur prix actuel.',
      s4: 'Pour déverrouiller un vélo électrique, il faut la dernière version de notre appli.',
      s5: 'Les vélos électriques ont une autonomie d’environ 60 kilomètres par charge.',
      s6: 'Les vélos électriques doivent être rendus dans l’une des 12 stations de recharge ; on ne peut les laisser nulle part ailleurs.',
      s7: 'Une carte des stations de recharge se trouve dans l’appli.',
      s8: 'Si un vélo électrique est laissé hors d’une station, des frais de 10 euros sont facturés.',
      s9: 'Plusieurs autres villes ont lancé des services similaires ces dernières années.',
      s10: 'Les vélos ont été testés par 50 bénévoles pendant l’hiver.',
      s11: 'Merci de rouler avec nous !'
    },
    bullets: {
      gold1: 'Dès le 1er juillet : 200 vélos électriques à 20 centimes la minute.',
      gold2: 'Pour les déverrouiller, il faut la dernière version de l’appli.',
      gold3: 'Les vélos électriques se rendent dans l’une des 12 stations de recharge.',
      minor: 'Une carte des stations de recharge est dans l’appli.',
      distort: 'Les vélos électriques remplacent les vélos classiques.',
      dup: 'Il y a de nouveaux vélos.',
      subtle: 'Dès le 1er juillet : 200 vélos électriques à 25 centimes la minute.'
    },
    bulletNotes: {
      distort: 'Les vélos électriques s’ajoutent ; les vélos classiques restent, à leur prix actuel.',
      dup: 'Une reprise plus vague du premier point, sans date, nombre ni prix.',
      subtle: 'Presque, mais le prix est de 20 centimes la minute, pas 25.'
    },
    summaries: {
      faithful: 'Dès le 1er juillet, 200 vélos électriques sont disponibles à 20 centimes la minute ; il faut la dernière version de l’appli pour les déverrouiller et ils se rendent dans l’une des 12 stations de recharge.',
      vague: 'Le service de vélos en libre-service lance cet été une nouveauté qui pourrait intéresser les usagers.',
      drops: 'Le service de vélos en libre-service ajoute 200 vélos électriques d’une autonomie d’environ 60 kilomètres, ce qui facilite les longs trajets.',
      adds: 'Dès le 1er juillet, 200 vélos électriques sont disponibles à 20 centimes la minute, et les vélos classiques disparaîtront l’an prochain.',
      subtle: 'Dès le 1er juillet, 200 vélos électriques sont disponibles à 20 centimes la minute ; il faut la dernière version de l’appli pour les déverrouiller et on peut les rendre dans n’importe quelle station.'
    },
    summaryNotes: {
      drops: 'Il manque le prix et ce que les usagers doivent faire : mettre à jour l’appli et rendre les vélos dans une station de recharge.',
      adds: 'L’annonce ne dit nulle part que les vélos classiques vont disparaître.',
      subtle: 'Les vélos électriques ne peuvent être rendus que dans les 12 stations de recharge, pas dans n’importe quelle station.'
    },
    task: 'Une amie veut essayer un vélo électrique la semaine prochaine.',
    oneLiner: 'Il y a des vélos électriques maintenant.',
    details: {
      d1: 'Le prix : 20 centimes la minute',
      d2: 'Qu’il faut la dernière version de l’appli pour déverrouiller',
      d3: 'Que les vélos électriques doivent retourner à une station de recharge',
      d4: 'Que le vélo aide à rester actif',
      d5: 'Combien de vélos électriques il y a au total',
      d6: 'Que les vélos classiques gardent leur prix'
    },
    versions: {
      actionable: 'Dès le 1er juillet, tu peux louer des vélos électriques pour 20 centimes la minute. Mets d’abord l’appli à jour, car il faut la dernière version pour les déverrouiller. Ensuite, rends le vélo dans l’une des 12 stations de recharge indiquées sur la carte de l’appli.',
      vague: 'Il y a des vélos électriques maintenant, et ils sont très simples. Prends l’appli et c’est parti.',
      invented: 'Dès le 1er juillet, tu peux louer des vélos électriques pour 20 centimes la minute sans l’appli, et les laisser n’importe où en ville ensuite.'
    },
    versionNote: 'Il faut la dernière version de l’appli pour les déverrouiller, et ils doivent retourner à une station de recharge.'
  }
};
