import type { LocaleContent } from './items';

export const content: LocaleContent = {
  'finish-tomorrow': {
    context: 'Ta responsable d’équipe t’écrit dans le chat de l’équipe. Tu travailles en ce moment sur trois rapports différents.',
    text: 'Merci de finir ça demain.',
    ask: { what: 'Duquel des trois rapports parles-tu ?', when: 'Pour quelle heure demain : le matin ou en fin de journée ?' },
    given: { who: 'Le message t’est adressé directement.' },
    replies: {
      clear: 'D’accord. Duquel des trois rapports parles-tu : budget, ventes ou personnel ? Et pour quelle heure demain ?',
      vague: 'OK, ça marche !',
      assume: 'Pas de souci, je finis le rapport des ventes demain.'
    }
  },
  'concert-entrance': {
    context: 'Un ami t’écrit au sujet du concert de samedi, qui commence à 20 h. La salle a quatre entrées.',
    text: 'On se retrouve à l’entrée avant le concert.',
    ask: { when: 'À quelle heure, combien de temps avant 20 h ?', where: 'Laquelle des quatre entrées ?' },
    given: { what: 'Ce qui est prévu est clair : se retrouver avant le concert.' },
    replies: {
      clear: 'Bonne idée ! Quelle entrée et à quelle heure ? 19 h 30, ça te va ?',
      vague: 'Ça marche, à plus !',
      rude: 'Tu dis toujours des trucs comme ça. Sois précis pour une fois !'
    }
  },
  'party-photos': {
    context: 'Ta tante t’écrit après une fête de famille où tu as pris environ 200 photos.',
    text: 'Tu peux m’envoyer les photos de dimanche ?',
    ask: { what: 'Les 200, ou seulement certaines, par exemple celles où tu apparais ?', format: 'Comment te les envoyer : lien de téléchargement, e-mail ou tirages papier ?' },
    given: { who: 'Il est clair qui doit les envoyer : toi.' },
    replies: {
      clear: 'Bien sûr ! Les 200 ou une sélection ? Et un lien de téléchargement, ça te va ?',
      vague: 'Bien sûr, je les enverrai un de ces jours.',
      assume: 'Je t’ai commandé des tirages des 200 photos.'
    }
  },
  'water-plants': {
    context: 'Ta voisine part demain en voyage pour deux semaines. Tu as son double de clés.',
    text: 'Tu pourrais arroser les plantes pendant mon absence ?',
    ask: { when: 'À quelle fréquence : tous les jours ou deux fois par semaine ?', where: 'Quelles plantes : à l’intérieur, sur le balcon ou les deux ?' },
    given: { what: 'La tâche est claire : arroser les plantes.', who: 'C’est à toi qu’on le demande.' },
    replies: {
      clear: 'Avec plaisir ! Quelles plantes, et à quelle fréquence dois-je les arroser ?',
      vague: 'Bien sûr, pas de problème.',
      assume: 'Bien sûr, j’arroserai les plantes du balcon tous les soirs.'
    }
  },
  'train-tickets': {
    context: 'Une amie et toi préparez un week-end à la mer. Elle écrit :',
    text: 'Je réserve l’hôtel. Tu peux réserver le train ?',
    ask: { when: 'Quel jour et vers quelle heure part-on, et quand rentre-t-on ?' },
    given: { what: 'La tâche est claire : les billets de train du voyage.', who: 'C’est à toi de les réserver.' },
    replies: {
      clear: 'Oui ! Quel jour et à quelle heure veux-tu partir, et quand rentrons-nous ?',
      vague: 'OK, je m’en occupe.',
      assume: 'C’est fait : vendredi à 5 h 30 du matin, en première classe.'
    }
  },
  'bins-tonight': {
    context: 'Un message dans le groupe de discussion de cinq colocataires.',
    text: 'Quelqu’un doit sortir les poubelles ce soir.',
    ask: { who: 'Qui exactement s’en charge ce soir ? C’est le tour de qui ?' },
    given: { what: 'La tâche est claire : sortir les poubelles.', when: 'Le moment est indiqué : ce soir.' },
    replies: {
      clear: 'Qui s’en charge ce soir ? Il y a un planning qu’on peut consulter ?',
      vague: 'Oui, quelqu’un devrait le faire.',
      rude: 'En tout cas pas moi. Débrouillez-vous entre vous.'
    }
  },
  'school-form': {
    context: 'Un message de l’enseignante de ton enfant dans l’application de l’école. Cette semaine, ton enfant a rapporté deux formulaires : un pour une sortie et un pour les photos de classe.',
    text: 'Merci de rendre le formulaire signé d’ici jeudi.',
    ask: { what: 'De quel formulaire s’agit-il : celui de la sortie ou celui des photos ?', format: 'Dois-je le rendre sur papier ou en photo dans l’application ?' },
    given: { when: 'La date limite est indiquée : jeudi.' },
    replies: {
      clear: 'Merci ! De quel formulaire s’agit-il, la sortie ou les photos ? Et sur papier ou via l’application ?',
      vague: 'D’accord, c’est noté.',
      assume: 'C’est fait : j’ai signé les deux formulaires et envoyé des photos.'
    }
  },
  'holiday-keys': {
    context: 'Tu as loué un appartement de vacances. L’hôtesse t’écrit la veille de ton arrivée.',
    text: 'Je vous laisserai les clés.',
    ask: { where: 'Où exactement laisserez-vous les clés ?' },
    given: { what: 'On sait de quoi il s’agit : les clés.', who: 'L’hôtesse les dépose elle-même.' },
    replies: {
      clear: 'Merci ! Où seront-elles exactement : dans une boîte à clés ou chez un voisin ?',
      vague: 'Super, merci !',
      assume: 'Parfait, je les prendrai sous le paillasson.'
    }
  },
  'project-slides': {
    context: 'Ta responsable t’écrit mardi matin.',
    text: 'Tu peux préparer quelques diapos sur le projet ?',
    ask: {
      when: 'Pour quand te faut-il les diapos ?',
      audience: 'Qui va les voir : l’équipe, la direction ou le client ?',
      scope: 'Quelle longueur : quelques diapos ou une présentation complète ?',
      purpose: 'Quel est l’objectif : faire un point ou obtenir une décision ?'
    },
    given: { what: 'Le livrable est clair : des diapos sur le projet.', who: 'C’est à toi qu’on le demande.' },
    replies: {
      clear: 'Avec plaisir. Pour qui, pour quand, à peu près quelle longueur, et faut-il aboutir à une décision ou juste informer ?',
      vague: 'Bien sûr, je fais quelques diapos.',
      assume: 'Je prépare 40 diapos pour le conseil d’administration de vendredi.'
    }
  },
  'cafe-website': {
    context: 'La propriétaire d’un petit café t’écrit, à toi, le webdesigner qui a créé son site.',
    text: 'Le site a l’air bizarre, tu peux arranger ça ?',
    ask: {
      what: 'Qu’est-ce qui ne va pas exactement : le texte, les images ou la mise en page ?',
      where: 'Sur quelle page et sur quel appareil le vois-tu ?',
      priority: 'Est-ce urgent ? Est-ce que ça empêche les clients de commander ?'
    },
    given: { who: 'C’est à toi qu’on le demande, en tant que créateur du site.' },
    replies: {
      clear: 'Désolé ! Qu’est-ce qui ne va pas exactement, sur quelle page et quel appareil ? Et est-ce que ça empêche les clients de commander ?',
      vague: 'Je vais regarder.',
      assume: 'Je refais tout le site cette semaine.'
    }
  },
  'walk-report': {
    context: 'La présidente de ton club de randonnée t’écrit après la sortie de printemps.',
    text: 'Tu pourrais écrire un petit compte rendu de la randonnée ?',
    ask: {
      when: 'Pour quand te faut-il le compte rendu ?',
      format: 'Seulement du texte ou avec des photos ? Pour l’impression ou pour le site ?',
      audience: 'Qui va le lire : les membres ou le journal local ?'
    },
    given: { what: 'Le livrable est clair : un compte rendu de la randonnée.', scope: '« Petit » donne une longueur approximative ; tu pourrais quand même demander un nombre de mots.' },
    replies: {
      clear: 'Volontiers ! Pour qui est-ce, pour quand, et dois-je ajouter des photos ?',
      vague: 'D’accord, j’écrirai quelque chose.',
      assume: 'J’envoie demain au journal un compte rendu de trois pages avec 50 photos.'
    }
  },
  'office-paper': {
    context: 'La responsable de bureau écrit dans le canal de l’équipe.',
    text: 'On n’a bientôt plus de papier pour l’imprimante, que quelqu’un en commande, svp.',
    ask: {
      when: 'Pour quand en a-t-on besoin ?',
      who: 'Qui doit passer la commande ?',
      scope: 'Combien faut-il en commander ?'
    },
    given: { what: 'On sait ce qu’il faut : du papier pour l’imprimante.' },
    replies: {
      clear: 'Je peux commander. Combien de ramettes, et pour quand en a-t-on besoin ?',
      vague: 'Oui, quelqu’un devrait le faire.',
      assume: 'J’ai commandé 100 cartons ; ils arrivent le mois prochain.'
    }
  },
  'anniversary': {
    context: 'Ton conjoint t’appelle. Dans deux mois, ses parents fêtent leurs 40 ans de mariage.',
    text: 'On devrait organiser quelque chose pour mes parents.',
    ask: {
      what: 'À quoi penses-tu : un dîner, une fête ou un cadeau ?',
      when: 'Quand : le jour même ou un week-end proche ?',
      who: 'Qui s’occupe de quoi : toi, moi, tes frères et sœurs ?',
      scope: 'Quelle taille : juste la famille ou beaucoup d’invités ?'
    },
    given: { audience: 'On sait pour qui : les parents.', purpose: 'L’occasion est claire : les 40 ans de mariage.' },
    replies: {
      clear: 'Belle idée ! À quoi penses-tu, quand, pour combien de personnes, et qui fait quoi ?',
      vague: 'Oui, on devrait.',
      assume: 'J’ai réservé un restaurant pour 60 personnes samedi prochain.'
    }
  },
  'customer-reply': {
    context: 'Ta responsable te transfère la réclamation d’un client dont la livraison a deux semaines de retard.',
    text: 'Merci de recontacter le client.',
    ask: {
      what: 'Que puis-je proposer : des excuses, une remise, une nouvelle date de livraison ?',
      when: 'Dans quel délai : aujourd’hui ?',
      format: 'Je l’appelle ou je lui écris ?'
    },
    given: { audience: 'On sait qui contacter : le client.', purpose: 'Le motif est clair : la livraison en retard.' },
    replies: {
      clear: 'Je m’en occupe. Appel ou e-mail, pour quand, et que puis-je lui proposer ?',
      vague: 'OK.',
      assume: 'J’ai promis au client un remboursement complet et la livraison gratuite pendant un an.'
    }
  },
  'shop-translation': {
    context: 'Une amie qui tient une petite boutique en ligne t’écrit parce que tu parles espagnol.',
    text: 'Tu pourrais me traduire les textes de la boutique ?',
    ask: {
      when: 'Pour quand te faut-il la traduction ?',
      audience: 'Tes clients sont-ils en Espagne ou en Amérique latine ?',
      scope: 'Quels textes et combien : les fiches produits, tout le site ?'
    },
    given: { what: 'La tâche est claire : une traduction vers l’espagnol.', who: 'C’est à toi qu’on le demande.' },
    replies: {
      clear: 'Avec plaisir ! Quels textes, pour quand, et tes clients sont-ils en Espagne ou en Amérique latine ?',
      vague: 'Bien sûr, envoie-moi ça un de ces jours.',
      assume: 'Bien sûr, d’ici demain je traduis tout le site en espagnol, en portugais et en français.'
    }
  },
  'basement': {
    context: 'Le gardien de ton immeuble écrit à tous les habitants.',
    text: 'Merci de vider vos affaires de la cave.',
    ask: {
      when: 'Pour quand la cave doit-elle être vide ?',
      where: 'Où pouvons-nous mettre nos affaires en attendant ?',
      purpose: 'Quelle est la raison, et est-ce seulement temporaire ?'
    },
    given: { what: 'On sait de quoi il s’agit : ses propres affaires dans la cave.', who: 'Tous les habitants sont concernés.' },
    replies: {
      clear: 'Merci de l’information. Pour quand, pour quelle raison, et y a-t-il un endroit où stocker nos affaires en attendant ?',
      vague: 'D’accord.',
      rude: 'Je ne bouge rien du tout. Trouvez une autre solution.'
    }
  },
  'board-report': {
    context: 'Ta responsable t’écrit mercredi. La semaine dernière, elle t’a dit que le rapport trimestriel est destiné au conseil d’administration et ne doit pas dépasser deux pages.',
    text: 'Merci de m’envoyer le rapport d’ici vendredi.',
    ask: {
      format: 'Tu veux un fichier modifiable ou un PDF ?',
      criterion: 'Quels chiffres ou quelles parties doit-il contenir pour être complet ?'
    },
    given: {
      what: 'On sait de quel rapport il s’agit : le rapport trimestriel.',
      when: 'La date limite est indiquée : vendredi.',
      audience: 'Déjà dit : le rapport va au conseil d’administration.',
      scope: 'Déjà dit : deux pages au maximum.'
    },
    replies: {
      clear: 'C’est noté. Quelles parties doivent y figurer, et tu veux un fichier modifiable ou un PDF ?',
      vague: 'Bien sûr, d’ici vendredi.',
      redundant: 'C’est pour qui, quelle longueur, et de quel rapport parles-tu ?'
    }
  },
  'school-pickup': {
    context: 'Ta sœur t’écrit. Ses deux enfants finissent l’école à 15 h tous les jours ; le mardi, l’aîné a foot jusqu’à 17 h.',
    text: 'Tu peux aller chercher les enfants mardi ?',
    ask: {
      where: 'Où dois-je les emmener ensuite : chez toi ou chez moi ?',
      scope: 'Les deux, ou seulement le plus jeune, puisque l’aîné a foot ?'
    },
    given: { when: 'Connu par le contexte : l’école finit à 15 h.', who: 'C’est à toi qu’on le demande.' },
    replies: {
      clear: 'Oui, je peux. Les deux ou seulement le plus jeune ? Et je les ramène chez toi ou chez moi ?',
      vague: 'Oui, bien sûr.',
      redundant: 'À quelle heure finit l’école, et quel jour ?'
    }
  },
  'checkout-bug': {
    context: 'Une cheffe de produit commente, dans l’outil de suivi des bugs de l’équipe, un ticket intitulé « Le bouton de paiement ne fait rien sur mobile depuis la mise à jour 2.3 ».',
    text: 'Urgent, merci de corriger ça au plus vite.',
    ask: {
      who: 'Qui dans l’équipe s’en charge ?',
      criterion: 'Sur quels téléphones et navigateurs cela doit-il fonctionner avant de fermer le ticket ?'
    },
    given: {
      what: 'Le titre du ticket nomme le problème.',
      where: 'Le titre dit où : sur mobile.',
      priority: '« Urgent » rend la priorité claire.'
    },
    replies: {
      clear: 'On s’en occupe. Qui le prend ? Et quels téléphones et navigateurs faut-il tester avant de fermer le ticket ?',
      vague: 'On va regarder.',
      redundant: 'Qu’est-ce qui ne marche pas exactement, et est-ce urgent ?'
    }
  },
  'client-room': {
    context: 'Ta collègue Ana t’écrit. La semaine prochaine, elle reçoit deux clients ; ils ne seront que tous les trois.',
    text: 'Tu pourrais me réserver une salle de réunion pour la semaine prochaine ?',
    ask: {
      when: 'Quel jour, à quelle heure et pour combien de temps ?',
      format: 'As-tu besoin d’un écran ou d’un équipement vidéo ?'
    },
    given: {
      what: 'La tâche est claire : réserver une salle de réunion.',
      who: 'C’est à toi de la réserver.',
      scope: 'Connu par le contexte : trois personnes.'
    },
    replies: {
      clear: 'Bien sûr. Quel jour et à quelle heure, pour combien de temps, et as-tu besoin d’un écran ?',
      vague: 'D’accord, je réserve quelque chose.',
      redundant: 'Combien de personnes viennent, et pourquoi as-tu besoin de la salle ?'
    }
  },
  'newsletter': {
    context: 'Le rédacteur de la lettre d’information de ton club de sport t’écrit. La lettre part à tous les membres le premier lundi de chaque mois ; chaque article fait environ 200 mots.',
    text: 'Tu pourrais écrire quelque chose sur les nouveaux horaires d’entraînement ?',
    ask: {
      what: 'Faut-il donner tout le nouveau planning ou seulement ce qui change ?',
      when: 'Pour quand te faut-il mon texte ? La date de parution n’est pas ma date limite.'
    },
    given: { audience: 'Connu par le contexte : tous les membres du club.', scope: 'Connu par le contexte : environ 200 mots.' },
    replies: {
      clear: 'Volontiers. Pour quand te le faut-il, et je mets tout le planning ou seulement les changements ?',
      vague: 'Bien sûr, j’écrirai quelque chose.',
      redundant: 'Qui lit la lettre, et quelle longueur doit faire le texte ?'
    }
  },
  'airport': {
    context: 'Ta cousine t’envoie les détails de son vol : atterrissage samedi à 14 h 20, terminal 2. Elle loge chez toi pendant une semaine.',
    text: 'Tu peux venir me chercher ?',
    ask: { scope: 'Tu viens seule, et combien de bagages as-tu ? Est-ce que ça rentre dans une petite voiture ?' },
    given: {
      when: 'Connu par les détails du vol : samedi à 14 h 20.',
      where: 'Connu par les détails du vol : terminal 2.',
      purpose: 'Connu par le contexte : elle loge chez toi, la destination est donc claire.'
    },
    replies: {
      clear: 'Bien sûr ! Tu viens seule, et combien de bagages as-tu ?',
      vague: 'Oui, à samedi.',
      redundant: 'Tu atterris quand, et à quel terminal ?'
    }
  },
  'contract-check': {
    context: 'Un collègue des achats t’envoie par e-mail un contrat fournisseur de 30 pages. Objet : « Merci de vérifier l’article 7 (responsabilité) d’ici jeudi midi ».',
    text: 'Tu peux y jeter un œil ?',
    ask: {
      format: 'Comment veux-tu mon retour : des commentaires dans le document ou un court e-mail ?',
      criterion: 'À quoi dois-je faire attention : les risques, les formulations floues ou les montants ?'
    },
    given: { what: 'L’objet nomme la partie : l’article 7.', when: 'L’objet nomme la date limite : jeudi midi.' },
    replies: {
      clear: 'Ce sera fait d’ici jeudi midi. Sur quoi dois-je me concentrer dans l’article 7, et tu préfères des commentaires dans le fichier ou un court résumé ?',
      vague: 'Je vais regarder.',
      redundant: 'Quelle partie dois-je lire, et pour quand ?'
    }
  },
  'shared-dinner': {
    context: 'Lina écrit dans le groupe de discussion de quatre amis. Plus tôt dans la journée, tout le monde a convenu de dîner chez elle samedi à 19 h.',
    text: 'Chacun peut apporter quelque chose ?',
    ask: {
      what: 'Qu’est-ce que chacun apporte : une entrée, un dessert ou des boissons ?',
      criterion: 'Y a-t-il quelque chose que quelqu’un ne peut pas ou ne veut pas manger ?'
    },
    given: { when: 'Déjà convenu : samedi à 19 h.', where: 'Déjà convenu : chez Lina.' },
    replies: {
      clear: 'Avec plaisir ! On se répartit entrée, dessert et boissons ? Et y a-t-il quelque chose que quelqu’un ne peut pas manger ?',
      vague: 'Bien sûr, j’apporterai quelque chose.',
      redundant: 'On se retrouve où, et à quelle heure ?'
    }
  }
};
