import type { ContentText } from './types';

export const content: ContentText = {
  supplierDelay: {
    title: 'Retard d’un fournisseur avant un lancement',
    situation: 'Ton entreprise lance une nouvelle lampe de bureau le 14 mai. Le fournisseur des têtes de lampe annonce un retard. Prépare un briefing.',
    recipient: 'la responsable produit',
    cards: {
      c1: 'La nouvelle lampe de bureau sort le 14 mai ; 350 clients l’ont précommandée.',
      c2: 'Le fournisseur n’a expédié que 200 des 500 têtes de lampe commandées.',
      c3: 'Une fois les pièces arrivées, notre atelier peut monter 100 lampes par jour.',
      c4: 'Le fournisseur n’a pas encore donné de date pour l’envoi des têtes restantes.',
      c5: 'Le fournisseur s’attend à expédier le reste la semaine prochaine, probablement mardi.',
      c6: 'Si les pièces arrivent après le 10 mai, les lampes ne pourront pas être montées à temps pour le lancement.',
      c7: 'La publicité du lancement est réservée pour le 14 mai ; la déplacer coûterait 800 euros de frais.',
      c8: 'Le marketing doit savoir d’ici vendredi si la date de lancement tient.',
      c9: 'Jonas, des achats, peut appeler le fournisseur demain matin pour demander une date ferme.',
      c10: 'Le fournisseur a emménagé dans un nouvel immeuble de bureaux l’an dernier.',
      c11: 'Pour l’instant, seules 200 des 500 têtes de lampe commandées ont été expédiées.',
      c12: 'Franchement, ce fournisseur a toujours été un peu désorganisé.'
    },
    decisions: {
      right: 'Maintenir le lancement au 14 mai, ou le repousser d’une semaine ?',
      notTheirs: 'Quel transporteur le fournisseur doit-il utiliser ?',
      premature: 'Faut-il remplacer ce fournisseur pour tous les produits à venir ?'
    },
    actions: {
      concrete: 'Jonas appelle le fournisseur demain à 9:00 et communique la date confirmée à la responsable produit avant 12:00.',
      vague: 'Quelqu’un devrait garder un œil sur le fournisseur.',
      outOfScope: 'Commencer à dessiner la collection de lampes de l’an prochain.'
    }
  },
  basement: {
    title: 'Cave inondée dans une colocation',
    situation: 'Après de fortes pluies, de l’eau stagne dans la cave de la maison que tu partages en colocation. Prépare un briefing.',
    recipient: 'le propriétaire',
    cards: {
      c1: 'Cinq personnes partagent la maison ; la cave abrite la chaudière et les cartons de chacun.',
      c2: 'Ce matin, il y avait environ 10 cm d’eau dans la cave.',
      c3: 'Ce matin, nous avons coupé l’électricité de la cave par précaution.',
      c4: 'Personne ne sait encore si la chaudière a été endommagée.',
      c5: 'L’eau ne monte probablement plus ; à midi, c’était pareil que le matin.',
      c6: 'D’autres pluies sont annoncées pour jeudi, et l’eau pourrait remonter.',
      c7: 'La chaudière est à 15 cm du sol, donc quelques centimètres d’eau de plus l’atteindraient.',
      c8: 'Le plombier ne peut venir cette semaine que si le propriétaire valide les frais de déplacement d’ici demain.',
      c9: 'Une colocataire en télétravail pourrait ouvrir au plombier mercredi.',
      c10: 'Les murs de la cave ont été repeints pour la dernière fois en 2015.',
      c11: 'Quand nous avons vérifié ce matin, la cave était sous 10 cm d’eau.',
      c12: 'Cette maison a toujours été humide, et personne ne fait jamais rien.'
    },
    decisions: {
      right: 'Valider les frais de déplacement du plombier pour cette semaine ?',
      notTheirs: 'Quel colocataire doit déplacer ses cartons en premier ?',
      premature: 'Faut-il étanchéifier et rénover toute la cave ?'
    },
    actions: {
      concrete: 'La colocataire en télétravail réserve le plombier pour mercredi et envoie le devis au propriétaire aujourd’hui.',
      vague: 'On s’en occupera à un moment donné.',
      outOfScope: 'Organiser une fête à la maison pour remonter le moral de tout le monde.'
    }
  },
  schoolTrip: {
    title: 'Sortie scolaire et alerte météo',
    situation: 'Une classe de 24 élèves doit partir en randonnée dans les collines vendredi. Une alerte météo a été émise. Prépare un briefing.',
    recipient: 'la directrice de l’école',
    cards: {
      c1: 'La classe de 24 élèves de 11 ans est inscrite à une randonnée vendredi, avec trois adultes accompagnateurs.',
      c2: 'Le service météo a émis une alerte tempête pour vendredi après-midi.',
      c3: 'Le musée des sciences de la ville a encore de la place pour une visite de classe vendredi.',
      c4: 'Les prévisions ne disent pas encore si la tempête arrivera avant ou après midi.',
      c5: 'Le garde du parc pense que le sentier principal restera très probablement ouvert.',
      c6: 'Le vent fort peut faire tomber des branches sur le sentier forestier.',
      c7: 'Le seul abri du parcours est à 40 minutes à pied de la fin du sentier, trop loin pour l’atteindre vite en cas de tempête.',
      c8: 'Il faut dire à la compagnie de cars d’ici mercredi soir si la sortie a lieu ; jusque-là, l’annulation est gratuite.',
      c9: 'L’enseignante peut consulter les prévisions mises à jour mercredi midi.',
      c10: 'La classe a voté pour la randonnée dès septembre.',
      c11: 'D’après le service météo, une tempête est attendue vendredi après-midi.',
      c12: 'Les enfants seront terriblement déçus si on annule.'
    },
    decisions: {
      right: 'Maintenir la randonnée, passer au musée ou annuler la sortie ?',
      notTheirs: 'Que doivent emporter les élèves pour le déjeuner ?',
      premature: 'L’école doit-elle supprimer désormais toutes les sorties en plein air ?'
    },
    actions: {
      concrete: 'L’enseignante consulte les prévisions mercredi à 12:00 et envoie une recommandation à la directrice avant 14:00.',
      vague: 'On verra bien quel temps il fera.',
      outOfScope: 'Commencer à préparer la fête de l’école de l’an prochain.'
    }
  },
  volunteers: {
    title: 'Journée de nettoyage en manque de bénévoles',
    situation: 'Ton association de quartier organise samedi un nettoyage du parc. Trop peu de bénévoles se sont inscrits. Prépare un briefing.',
    recipient: 'la présidente de l’association',
    cards: {
      c1: 'Le nettoyage annuel du parc a lieu samedi de 10:00 à 13:00 ; la ville fournit sacs et gants.',
      c2: 'Pour l’instant, 9 bénévoles se sont inscrits ; nous en avions prévu 20.',
      c3: 'La ville ne ramasse les sacs pleins que samedi à 13:00.',
      c4: 'L’équipe de foot des jeunes pourrait envoyer des bénévoles, mais l’entraîneur n’a pas encore répondu.',
      c5: 'Plusieurs voisins ont dit qu’ils passeraient probablement s’il fait beau.',
      c6: 'À 9 personnes, nous ne pouvons nettoyer qu’environ la moitié du parc.',
      c7: 'Personne n’a encore été désigné pour aller chercher les gants à la maison de quartier, qui ferme à 9:30 le samedi.',
      c8: 'Nous pouvons soit réduire le nettoyage à l’aire de jeux, soit le reporter au samedi suivant.',
      c9: 'Deux bénévoles ont proposé de poser des affiches dans le quartier demain.',
      c10: 'Le nettoyage de l’an dernier s’est terminé par un barbecue.',
      c11: 'Seuls 9 des 20 bénévoles prévus se sont inscrits.',
      c12: 'Les gens se fichent complètement de leur quartier maintenant.'
    },
    decisions: {
      right: 'Faire un nettoyage réduit ce samedi, ou le reporter d’une semaine ?',
      notTheirs: 'La ville doit-elle changer ses horaires de ramassage des sacs ?',
      premature: 'L’association doit-elle faire appel à une entreprise de nettoyage les prochaines années ?'
    },
    actions: {
      concrete: 'Les deux bénévoles posent les affiches demain, et le secrétaire écrit aujourd’hui à l’entraîneur de foot et fait un retour d’ici jeudi.',
      vague: 'Il faudrait trouver plus de monde, d’une manière ou d’une autre.',
      outOfScope: 'Commencer à organiser la fête d’été de l’association.'
    }
  },
  release: {
    title: 'Mise en production avec un test en échec',
    situation: 'Ton équipe veut publier mardi une nouvelle version d’une application de réservation. Un test automatique échoue. Prépare un briefing.',
    recipient: 'le chef de produit',
    cards: {
      c1: 'La nouvelle version ajoute le paiement en ligne et a été annoncée aux clients pour mardi.',
      c2: 'Un test automatique sur 640 échoue : le remboursement d’une réservation annulée.',
      c3: 'L’échec n’apparaît que pour les paiements en devise étrangère.',
      c4: 'Nous ne savons pas encore si le bug vient de notre code ou du système de test du prestataire de paiement.',
      c5: 'Le développeur pense que la correction prendra environ une journée, mais il n’a pas encore regardé le code.',
      c6: 'Si le bug est réel, certains clients pourraient être remboursés d’un mauvais montant.',
      c7: 'Environ 15 % des réservations sont payées en devise étrangère, donc le bug toucherait beaucoup de clients.',
      c8: 'Nous pouvons publier mardi en désactivant les paiements en devise étrangère, ou reporter toute la version.',
      c9: 'Le développeur peut consulter cet après-midi les journaux de test du prestataire de paiement.',
      c10: 'Le nouvel écran de paiement utilise le nouveau bleu de l’entreprise.',
      c11: 'Un seul test est rouge : les remboursements de réservations annulées.',
      c12: 'Ce test a toujours été capricieux ; moi, je l’ignorerais.'
    },
    decisions: {
      right: 'Publier mardi sans paiements en devise étrangère, ou reporter la version ?',
      notTheirs: 'Quelle technique de programmation le développeur doit-il utiliser pour la correction ?',
      premature: 'Faut-il changer de prestataire de paiement ?'
    },
    actions: {
      concrete: 'Le développeur consulte cet après-midi les journaux du prestataire et dit au chef de produit avant 17:00 si le bug vient de chez nous.',
      vague: 'Quelqu’un regardera le test.',
      outOfScope: 'Commencer à rédiger les notes de version de la version d’après.'
    }
  },
  careAppointment: {
    title: 'Un rendez-vous de conseil en aide à domicile pour grand-mère',
    situation: 'Ta grand-mère a lundi un rendez-vous avec un service de conseil en aide à domicile. La famille doit décider qui l’accompagne. Prépare un briefing. (Il s’agit d’organisation, pas de questions médicales.)',
    recipient: 'ton frère, qui partage la décision avec toi',
    cards: {
      c1: 'Grand-mère a rendez-vous avec le service de conseil lundi à 10:00 pour parler d’aide à domicile.',
      c2: 'Elle a demandé qu’un membre de la famille l’accompagne.',
      c3: 'La lettre dit d’apporter sa liste de médicaments et sa carte d’assurance maladie.',
      c4: 'On ne sait pas encore si maman peut prendre son lundi.',
      c5: 'Le centre aurait un ascenseur, mais personne n’a vérifié.',
      c6: 'Si personne ne peut y aller, le prochain rendez-vous libre est dans six semaines.',
      c7: 'Grand-mère se fatigue vite, et le trajet en bus jusqu’au centre dure 50 minutes dans chaque sens.',
      c8: 'Le service doit savoir d’ici vendredi si le rendez-vous a lieu sur place ou en visio.',
      c9: 'Tu pourrais appeler maman ce soir pour lui demander pour lundi.',
      c10: 'La voisine de grand-mère a récemment adopté un nouveau chien.',
      c11: 'Elle aimerait que quelqu’un de la famille vienne avec elle.',
      c12: 'À mon avis, ces services de conseil ne servent jamais vraiment à rien.'
    },
    decisions: {
      right: 'Qui accompagne grand-mère lundi, et sur place ou en visio ?',
      notTheirs: 'Quel type d’aide à domicile grand-mère doit-elle recevoir ?',
      premature: 'Grand-mère doit-elle entrer en maison de retraite ?'
    },
    actions: {
      concrete: 'Tu appelles maman ce soir et tu dis à ton frère d’ici mercredi soir qui peut y aller.',
      vague: 'On va bien s’arranger d’une façon ou d’une autre.',
      outOfScope: 'Commencer à organiser la fête d’anniversaire de grand-mère.'
    }
  },
  cafeFreezer: {
    title: 'Congélateur en panne dans un petit café',
    situation: 'Tu travailles dans un petit café. Ce matin, le congélateur ne refroidissait pas assez. La patronne est absente jusqu’à demain. Prépare un briefing.',
    recipient: 'la patronne du café',
    cards: {
      c1: 'Le café vend des glaces maison ; le congélateur contient environ une semaine de stock.',
      c2: 'À 7:00, le congélateur affichait −2 °C au lieu des −18 °C habituels.',
      c3: 'À 7:30, nous avons mis les glaces dans le congélateur de la boulangerie voisine.',
      c4: 'Nous ne savons pas si les glaces ont décongelé pendant la nuit.',
      c5: 'Le service de réparation pourra probablement venir jeudi.',
      c6: 'Une glace qui a décongelé ne doit pas être vendue, donc nous devrons peut-être jeter le stock.',
      c7: 'La boulangerie a besoin de récupérer sa place samedi, donc nos glaces ne peuvent y rester que jusque-là.',
      c8: 'Le service de réparation ne fixera une visite que lorsque la patronne aura validé le déplacement à 90 euros.',
      c9: 'Le barista peut lire cet après-midi le relevé de température du congélateur.',
      c10: 'Les nouvelles ardoises du menu arrivent la semaine prochaine.',
      c11: 'Ce matin, le congélateur indiquait −2 °C au lieu de −18 °C.',
      c12: 'Ce congélateur a été un mauvais achat dès le premier jour.'
    },
    decisions: {
      right: 'Valider le déplacement à 90 euros pour la réparation ?',
      notTheirs: 'Quels gâteaux la boulangerie doit-elle vendre cette semaine ?',
      premature: 'Le café doit-il arrêter complètement de vendre des glaces ?'
    },
    actions: {
      concrete: 'Le barista lit le relevé de température cet après-midi et envoie le résultat à la patronne par SMS avant 16:00.',
      vague: 'On garde un œil dessus.',
      outOfScope: 'Refaire le site web du café.'
    }
  },
  tournament: {
    title: 'Nouveau lieu pour un tournoi d’échecs',
    situation: 'Ton club d’échecs organise dimanche un tournoi pour les jeunes. La salle d’école réservée n’est plus disponible. Prépare un briefing.',
    recipient: 'le bureau du club',
    cards: {
      c1: 'Le tournoi jeunes de dimanche compte 48 joueurs inscrits venant de six clubs.',
      c2: 'L’école a annulé notre réservation de la salle à cause d’une fuite dans le toit.',
      c3: 'La bibliothèque municipale propose gratuitement sa salle, mais elle ne peut accueillir que 32 joueurs.',
      c4: 'Le centre sportif aurait peut-être une salle libre, mais il n’a pas encore répondu à notre e-mail.',
      c5: 'Le gardien pense que la salle de l’école pourrait être réparée à temps, mais personne ne l’a confirmé.',
      c6: 'Si les familles apprennent le changement trop tard, certains joueurs risquent de se présenter à l’ancien lieu.',
      c7: 'Plusieurs familles font plus de 100 km et ont déjà réservé leur train, donc un changement de date les pénaliserait le plus.',
      c8: 'Les invitations avec le lieu définitif doivent partir d’ici mercredi.',
      c9: 'Le secrétaire du club peut appeler le centre sportif demain matin.',
      c10: 'La vitrine des trophées du club a été nettoyée le mois dernier.',
      c11: 'L’école a annulé notre réservation de salle.',
      c12: 'Nous n’aurions jamais dû compter sur cette école.'
    },
    decisions: {
      right: 'Changer de lieu, limiter le tournoi à 32 joueurs ou le reporter ?',
      notTheirs: 'Quand l’école doit-elle réparer son toit ?',
      premature: 'Le club doit-il construire son propre local ?'
    },
    actions: {
      concrete: 'Le secrétaire appelle le centre sportif demain à 9:00 et fait son rapport au bureau avant 12:00.',
      vague: 'Attendons de voir ce qui se présente.',
      outOfScope: 'Commander de nouveaux jeux d’échecs pour le club.'
    }
  }
};
