import type { ContentText } from './types';

export const content: ContentText = {
  migration: {
    title: 'Migration de base de données',
    situation: 'Ton équipe transfère la base de données clients vers un nouveau système. Les tests ont trouvé un problème et la bascule est retardée. Explique-le.',
    facts: {
      newDate: 'La bascule est décalée de deux jours : jeudi au lieu de mardi.',
      cause: 'Les tests ont trouvé un bug jusqu’ici inconnu avec des caractères spéciaux comme ü ou é.',
      noLoss: 'Aucune donnée n’a été perdue.',
      encoding: 'Le script d’import lit le texte avec le mauvais encodage de caractères.',
      apology: 'Nous sommes désolés pour la gêne occasionnée.',
      regression: 'Un nouveau test automatique vérifie désormais les caractères spéciaux.',
      buffer: 'Les deux jours tiennent dans la marge de temps du projet, sans surcoût.',
      library: 'La conversion fautive vient d’une bibliothèque choisie il y a des années.'
    },
    reasons: {
      'developer.cause': 'Les développeurs doivent savoir ce que les tests ont réellement trouvé.',
      'developer.encoding': 'C’est la cause profonde sur laquelle ils vont travailler.',
      'developer.apology': 'Des excuses aux clients n’aident pas une collègue à corriger le bug.',
      'developer.regression': 'Ils doivent savoir que le bug est désormais couvert par un test.',
      'developer.buffer': 'La marge de temps et le budget relèvent de la cheffe de projet.',
      'projectManager.newDate': 'La cheffe de projet planifie avec la nouvelle date.',
      'projectManager.noLoss': 'Une perte de données changerait complètement le risque ; elle doit donc entendre qu’il n’y en a pas.',
      'projectManager.encoding': 'Le détail de l’encodage ne change aucune décision de planification.',
      'projectManager.apology': 'Les excuses s’adressent aux clients ; la cheffe de projet a besoin de faits.',
      'projectManager.buffer': 'Savoir si le calendrier et le budget tiennent, c’est justement sa question.',
      'projectManager.library': 'Qui a choisi une bibliothèque il y a des années n’aide pas à planifier maintenant.',
      'customer.newDate': 'Le client a besoin de la nouvelle date, pas du type de bug.',
      'customer.noLoss': 'Son premier souci, ce sont ses données, et elles sont en sécurité.',
      'customer.cause': 'Les détails du bug inquiètent les clients sans les aider.',
      'customer.encoding': 'Les rouages techniques ne disent rien au client.',
      'customer.regression': 'Les tests internes ne concernent pas le client.',
      'customer.buffer': 'Les marges et coûts internes ne regardent pas le client.',
      'customer.library': 'Accuser une vieille bibliothèque sonne comme une excuse.'
    },
    messages: {
      'developer.fit': 'Pour info : le script d’import lit le texte avec le mauvais encodage, donc les caractères spéciaux comme ü et é sont cassés. Un test de non-régression le couvre maintenant ; la bascule passe à jeudi.',
      'developer.missing': 'Petit retard sur la migration, rien de grave. Détails plus tard.',
      'developer.condescending': 'Les caractères spéciaux sont des lettres comme ü qui ne font pas partie de l’alphabet de base. Les ordinateurs stockent les lettres sous forme de nombres, et parfois les nombres se mélangent.',
      'projectManager.fit': 'La migration passe de mardi à jeudi. Aucune donnée n’a été perdue, et les deux jours tiennent dans notre marge sans surcoût. Cause : un bug avec les caractères spéciaux, désormais couvert par un test.',
      'projectManager.tooMuch': 'Le script d’import décode l’entrée en Latin-1 au lieu d’UTF-8, ce qui abîme les caractères multi-octets ; nous corrigeons le lecteur et ajoutons un test de non-régression.',
      'projectManager.missing': 'Nous avons trouvé un bug et nous y travaillons. On te tient au courant.',
      'customer.fit': 'Vos données sont en sécurité. Pour que chaque nom et chaque adresse soient repris correctement, nous décalons la bascule de mardi à jeudi. D’ici là, tout fonctionne comme d’habitude.',
      'customer.tooMuch': 'Notre script d’import utilisait le mauvais encodage de caractères, ce qui a abîmé les caractères spéciaux lors des tests ; la migration a donc besoin de deux jours de plus pris sur notre marge.',
      'customer.condescending': 'Ne vous souciez pas de la partie technique, c’est compliqué. Sachez seulement que ce sera un peu plus tard.'
    }
  },
  skyBlue: {
    title: 'Pourquoi le ciel est bleu',
    situation: 'Quelqu’un te demande pourquoi le ciel est bleu. Tu connais la physique derrière. Explique-le.',
    facts: {
      sunlight: 'La lumière du soleil contient toutes les couleurs.',
      scatter: 'L’air diffuse beaucoup plus la lumière bleue que la rouge.',
      rayleigh: 'Cette diffusion de Rayleigh croît avec la puissance quatre de la fréquence (1/λ⁴).',
      sunset: 'Au coucher du soleil, la lumière traverse plus d’air, alors le ciel devient rouge et orange.',
      everywhere: 'La lumière bleue diffusée arrive à tes yeux de toutes les directions, donc tout le ciel paraît bleu.',
      violet: 'Le violet est encore plus diffusé, mais la lumière du soleil en contient moins et nos yeux y sont moins sensibles.',
      molecules: 'La diffusion est due aux molécules d’azote et d’oxygène, bien plus petites que la longueur d’onde de la lumière.',
      ocean: 'Le ciel est bleu parce qu’il reflète la mer.'
    },
    reasons: {
      'child.sunlight': 'L’enfant a d’abord besoin de la surprise : la lumière blanche cache toutes les couleurs.',
      'child.scatter': 'C’est l’idée centrale, dite avec des mots simples.',
      'child.rayleigh': 'Avec une formule, on perd un enfant tout de suite.',
      'child.everywhere': 'Cela explique ce qu’il voit : du bleu partout où il regarde.',
      'child.violet': 'Le détail du violet embrouille plus qu’il n’aide à cet âge.',
      'child.molecules': 'Molécules et longueurs d’onde sont trop abstraites pour un enfant.',
      'layperson.sunlight': 'Sans cela, « la lumière bleue est diffusée » n’a pas de sens.',
      'layperson.scatter': 'C’est la vraie réponse, avec des mots de tous les jours.',
      'layperson.rayleigh': 'La formule n’apporte rien d’utile à un non-spécialiste.',
      'expert.rayleigh': 'Un expert attend le mécanisme précis et sa dépendance à la longueur d’onde.',
      'expert.everywhere': 'C’est évident pour un expert et lui fait perdre du temps.',
      'expert.violet': 'Les experts connaissent l’objection évidente, « pourquoi pas violet ? » : réponds-y.',
      'expert.molecules': 'Nommer les diffuseurs et le rapport de tailles rend l’explication précise.',
      ocean: 'C’est une idée reçue répandue ; la couleur ne vient pas de la mer.'
    },
    messages: {
      'child.fit': 'La lumière du soleil a l’air blanche, mais en vrai toutes les couleurs y sont mélangées. Quand elle traverse l’air, c’est la partie bleue qui rebondit le plus dans tous les sens, alors le bleu arrive à tes yeux de partout dans le ciel.',
      'child.tooMuch': 'La lumière bleue a une longueur d’onde plus courte, et la diffusion de Rayleigh croît comme un sur la longueur d’onde à la puissance quatre.',
      'child.missing': 'Le ciel est comme ça, c’est tout. Il a toujours été bleu.',
      'layperson.fit': 'La lumière du soleil contient toutes les couleurs. L’air diffuse beaucoup plus la lumière bleue que la rouge, donc de la lumière bleue nous arrive de toutes les parties du ciel.',
      'layperson.tooMuch': 'C’est la diffusion de Rayleigh : l’intensité varie en 1/λ⁴, donc les courtes longueurs d’onde dominent la luminance diffuse du ciel.',
      'layperson.condescending': 'C’est un peu compliqué pour les non-scientifiques. Disons simplement que l’air le rend bleu.',
      'expert.fit': 'Diffusion de Rayleigh par les molécules de N₂ et d’O₂, proportionnelle à 1/λ⁴. Le violet est encore plus diffusé, mais le spectre solaire en contient moins et nos cônes y sont moins sensibles.',
      'expert.condescending': 'Imagine la lumière du soleil comme une boîte de crayons de couleur ! L’air adore jouer avec le crayon bleu.',
      'expert.missing': 'L’air diffuse davantage la lumière bleue, voilà pourquoi.'
    }
  },
  clubRoof: {
    title: 'Le toit du club',
    situation: 'Le toit du local de ton club sportif doit être réparé d’urgence, et cela coûte plus cher que prévu. Explique-le.',
    facts: {
      cost: 'La réparation coûte 8 000 euros, soit 3 000 de plus que prévu au budget.',
      decision: 'Le comité doit décider d’ici vendredi s’il transfère 3 000 euros du budget de la fête d’été.',
      storage: 'Le local de matériel reste fermé jusqu’à la réparation ; le reste du club est ouvert.',
      fees: 'Les cotisations ne changent pas.',
      schedule: 'Le couvreur commence le 12 mai et a besoin de quatre jours ; le parking sert à l’échafaudage.',
      tiles: 'Les nouvelles tuiles sont des tuiles en béton couleur anthracite.',
      reserve: 'Utiliser plutôt la réserve la ferait passer sous le minimum obligatoire.',
      volunteer: 'Un membre a proposé de réparer le toit lui-même gratuitement, mais il n’est pas couvreur.'
    },
    reasons: {
      'executive.cost': 'Le comité a besoin du montant et du dépassement pour juger.',
      'executive.decision': 'C’est la décision qu’il doit prendre, avec son échéance.',
      'executive.storage': 'L’usage quotidien des salles n’est pas une question pour le comité.',
      'executive.schedule': 'Les jours exacts des travaux sont l’affaire du coordinateur.',
      'executive.tiles': 'Le type et la couleur des tuiles ne changent pas la décision.',
      'executive.reserve': 'Cela explique pourquoi l’alternative évidente n’est pas possible.',
      'projectManager.fees': 'Les cotisations n’ont rien à voir avec l’organisation de la réparation.',
      'projectManager.schedule': 'Le coordinateur organise justement ces dates et le parking.',
      'projectManager.reserve': 'Le financement est la décision du comité, pas du coordinateur.',
      'layperson.storage': 'Les membres veulent savoir ce qu’ils peuvent utiliser ou non.',
      'layperson.fees': 'Leur propre argent est leur première question.',
      'layperson.tiles': 'Les détails de matériaux n’intéressent pas les membres.',
      'layperson.reserve': 'Les règles de la réserve sont des détails financiers internes.',
      volunteer: 'Une offre sans la qualification nécessaire ne fait que lancer un débat inutile ; ce n’est pas une vraie option.'
    },
    messages: {
      'executive.fit': 'Décision nécessaire d’ici vendredi : la réparation du toit coûte 8 000 euros, 3 000 de plus que prévu. Nous proposons de transférer 3 000 euros du budget de la fête d’été, car la réserve passerait sinon sous son minimum.',
      'executive.tooMuch': 'Le couvreur commence le 12 mai avec des tuiles en béton anthracite ; l’échafaudage reste quatre jours sur le parking et le local de matériel reste fermé d’ici là.',
      'executive.missing': 'Le toit coûte plus cher. Nous vous tenons au courant.',
      'projectManager.fit': 'Le couvreur commence le 12 mai et a besoin de quatre jours. Merci de libérer le parking pour l’échafaudage à partir du 11 mai.',
      'projectManager.tooMuch': 'La réparation coûte 8 000 euros, 3 000 au-dessus du budget ; le comité transférera peut-être de l’argent de la fête, car la réserve ne doit pas passer sous son minimum, et les cotisations restent les mêmes.',
      'projectManager.missing': 'Il y aura des travaux sur le toit à un moment en mai.',
      'layperson.fit': 'Le toit du club sera réparé en mai. D’ici là, le local de matériel reste fermé ; tout le reste est ouvert comme d’habitude. Les cotisations ne changent pas.',
      'layperson.tooMuch': 'La réparation coûte 8 000 euros, 3 000 au-dessus du budget ; le comité envisage un transfert depuis le budget de la fête, car la réserve ne doit pas passer sous son minimum.',
      'layperson.condescending': 'Ne vous inquiétez pas pour le toit, le comité s’occupe des affaires de grands.'
    }
  },
  shopOutage: {
    title: 'Panne de la boutique en ligne',
    situation: 'La boutique en ligne de ton entreprise a été en panne pendant trois heures hier. Explique ce qui s’est passé.',
    facts: {
      duration: 'La boutique a été en panne trois heures hier soir.',
      revenue: 'Environ 40 000 euros de commandes ont été perdus.',
      cause: 'Un certificat de sécurité expiré a bloqué les paiements.',
      fixed: 'Le certificat a été renouvelé ; la boutique fonctionne de nouveau normalement.',
      renewal: 'Le renouvellement sera automatisé, avec une alerte deux semaines avant ; cela prend une journée à l’équipe.',
      voucher: 'Les clients dont la commande a échoué reçoivent un bon de réduction de 10 % par e-mail.',
      approval: 'La direction est priée d’approuver 5 000 euros pour une meilleure surveillance.',
      competitor: 'La boutique d’un concurrent a eu une panne similaire le mois dernier.'
    },
    reasons: {
      'projectManager.cause': 'La cheffe de projet a besoin de la cause pour juger la correction.',
      'projectManager.renewal': 'C’est le travail qu’elle doit planifier : une journée de l’équipe.',
      'projectManager.voucher': 'Les bons sont gérés par le service client, pas par le projet.',
      'executive.duration': 'La direction a besoin de l’ampleur de l’incident.',
      'executive.revenue': 'Pour la direction, l’impact sur l’activité passe en premier.',
      'executive.cause': 'Le détail technique ne change pas sa décision ; « un renouvellement oublié » suffit.',
      'executive.renewal': 'Elle doit entendre que cela ne se reproduira pas.',
      'executive.approval': 'C’est la décision qu’elle doit prendre.',
      'customer.revenue': 'Ton chiffre d’affaires perdu ne concerne pas le client.',
      'customer.cause': 'Les causes techniques n’aident pas les clients.',
      'customer.fixed': 'Les clients veulent d’abord savoir qu’ils peuvent de nouveau commander.',
      'customer.renewal': 'Les changements de processus internes ne regardent pas les clients.',
      'customer.voucher': 'C’est ce qu’ils reçoivent, et ils doivent guetter l’e-mail.',
      'customer.approval': 'Les décisions budgétaires internes ne sont pas pour les clients.',
      competitor: 'Montrer les autres du doigt sonne comme une excuse et ne change rien.'
    },
    messages: {
      'projectManager.fit': 'La panne de trois heures d’hier venait d’un certificat de sécurité expiré qui a bloqué les paiements. Pour éviter que cela se reproduise, nous automatisons le renouvellement avec une alerte anticipée ; cela prend une journée à l’équipe dans ce sprint.',
      'projectManager.tooMuch': 'Nous avons perdu environ 40 000 euros de commandes, les clients reçoivent un bon de 10 % par e-mail, et un concurrent a eu le même problème le mois dernier.',
      'projectManager.missing': 'La boutique a eu un petit hoquet hier, tout va bien maintenant.',
      'executive.fit': 'Hier, la boutique a été en panne pendant trois heures ; nous avons perdu environ 40 000 euros de commandes. La cause est un renouvellement de routine oublié, désormais automatisé. Pour détecter ce genre de problème plus tôt, nous vous demandons d’approuver 5 000 euros pour la surveillance.',
      'executive.tooMuch': 'Le certificat TLS de la passerelle de paiement a expiré à 18 h 02 ; nous le renouvelons désormais automatiquement via le protocole ACME, avec des alertes 14 jours avant.',
      'executive.missing': 'Il y a eu un petit problème technique hier. Il est réglé.',
      'customer.fit': 'Toutes nos excuses : hier soir, notre boutique a été indisponible pendant quelques heures. Tout fonctionne de nouveau. Si votre commande a échoué, vous recevrez un bon de réduction de 10 % par e-mail.',
      'customer.tooMuch': 'Un certificat de sécurité expiré a bloqué notre système de paiement ; nous avons perdu environ 40 000 euros et renouvelons désormais les certificats automatiquement.',
      'customer.condescending': 'Un truc technique est tombé en panne, rien que vous puissiez comprendre. Réessayez, c’est tout.'
    }
  },
  signalFault: {
    title: 'Panne de signalisation',
    situation: 'Une panne de signalisation perturbe une ligne de train. Tu travailles pour la compagnie ferroviaire. Explique la situation.',
    facts: {
      delay: 'Les trains de cette ligne ont environ 40 minutes de retard.',
      bus: 'Des bus de remplacement partent du parvis de la gare toutes les 20 minutes.',
      tickets: 'Les billets sont aussi valables dans les bus et dans les trains suivants.',
      signal: 'Le signal 14 à la bifurcation reste au rouge après un défaut de câble.',
      singleTrack: 'Les trains franchissent la section sur une seule voie, au pas, avec un ordre écrit.',
      repair: 'Les techniciens estiment que la réparation durera encore environ quatre heures.',
      construction: 'Des travaux d’une autre entreprise ont probablement endommagé le câble.',
      staff: 'Deux techniciens sont en arrêt maladie cette semaine.'
    },
    reasons: {
      'layperson.delay': 'Les voyageurs veulent d’abord savoir combien de retard ils auront.',
      'layperson.bus': 'Cela leur dit ce qu’ils peuvent faire tout de suite.',
      'layperson.tickets': 'Cela répond à la crainte de devoir racheter un billet.',
      'layperson.signal': 'Les numéros de signaux ne disent rien aux voyageurs.',
      'layperson.singleTrack': 'Les règles d’exploitation n’aident pas les voyageurs.',
      'layperson.construction': 'Spéculer sur les responsabilités n’aide pas les voyageurs et peut être faux.',
      'layperson.staff': 'Les effectifs internes ne concernent pas les voyageurs.',
      'expert.tickets': 'Les règles de billetterie n’influencent pas la circulation des trains.',
      'expert.signal': 'Le collègue a besoin de l’endroit et du défaut exacts.',
      'expert.singleTrack': 'C’est la règle d’exploitation qu’il doit appliquer.',
      'expert.repair': 'Il organise l’horaire autour de la fin prévue.',
      'expert.staff': 'Les effectifs ne changent pas la manière d’exploiter la section.',
      'executive.delay': 'La direction a besoin de l’ampleur de la perturbation.',
      'executive.tickets': 'L’acceptation des billets est une règle standard, pas un sujet de direction.',
      'executive.repair': 'Elle doit savoir combien de temps durera l’impact.',
      'executive.construction': 'Un éventuel dommage causé par un tiers compte pour la responsabilité et les coûts.'
    },
    messages: {
      'layperson.fit': 'Les trains de cette ligne ont environ 40 minutes de retard. Des bus de remplacement partent du parvis de la gare toutes les 20 minutes, et votre billet y est valable.',
      'layperson.tooMuch': 'Le signal 14 à la bifurcation reste au rouge après un défaut de câble ; les trains circulent sur une seule voie, au pas, avec un ordre écrit.',
      'layperson.missing': 'Merci de votre patience, une perturbation technique est en cours.',
      'expert.fit': 'Signal 14 à la bifurcation bloqué au rouge après un défaut de câble. Circulation en voie unique au pas avec ordre écrit ; réparation prévue pour encore environ quatre heures.',
      'expert.condescending': 'Un signal, c’est comme un feu tricolore pour les trains. L’un d’eux est cassé, donc les trains doivent rouler lentement.',
      'expert.missing': 'Il y a un problème sur la ligne et les trains sont en retard. Des bus circulent.',
      'executive.fit': 'Un défaut de câble perturbera la ligne encore environ quatre heures ; les trains ont environ 40 minutes de retard. Des travaux d’une autre entreprise ont probablement endommagé le câble, nous examinons donc la question de la responsabilité.',
      'executive.tooMuch': 'Signal 14 au rouge fixe ; voie unique au pas avec ordre écrit ; bus toutes les 20 minutes depuis le parvis ; billets valables dans les bus.',
      'executive.missing': 'Petit souci de signal, l’équipe s’en occupe.'
    }
  },
  kettleLid: {
    title: 'Couvercle de bouilloire',
    situation: 'Ton entreprise a découvert que le couvercle d’un modèle de bouilloire peut se détacher. Explique-le.',
    facts: {
      batches: 'Seules les bouilloires portant les numéros de lot 2301 à 2315 sont concernées (imprimés sous le socle).',
      risk: 'Le couvercle peut s’ouvrir en versant, et de l’eau chaude peut gicler.',
      stop: 'N’utilisez plus une bouilloire concernée jusqu’à son remplacement.',
      hinge: 'Une goupille de charnière en plastique a été fabriquée 0,2 mm trop fine.',
      free: 'Le remplacement est gratuit, frais d’envoi compris.',
      cost: 'L’échange coûtera environ 120 000 euros à l’entreprise.',
      supplier: 'Les goupilles venaient d’un nouveau fournisseur dont les échantillons avaient passé le contrôle.',
      injuries: 'Aucune blessure n’est connue à ce jour.'
    },
    reasons: {
      'customer.batches': 'Les clients doivent pouvoir vérifier si leur bouilloire est concernée.',
      'customer.risk': 'Ils doivent comprendre pourquoi c’est important.',
      'customer.stop': 'C’est le geste qui les protège.',
      'customer.hinge': 'Les détails au millimètre n’aident pas les clients.',
      'customer.free': 'Savoir que c’est gratuit enlève une raison d’attendre.',
      'customer.cost': 'Les coûts de l’entreprise ne concernent pas le client.',
      'customer.supplier': 'Les détails sur le fournisseur donnent l’impression de rejeter la faute.',
      'executive.risk': 'La direction doit d’abord comprendre le risque pour la sécurité.',
      'executive.hinge': 'La cote exacte, c’est pour les ingénieurs.',
      'executive.cost': 'L’impact financier fait partie de sa décision.',
      'executive.injuries': 'Savoir si quelqu’un a été blessé change l’urgence et la réponse.',
      'expert.stop': 'Les consignes aux clients n’aident pas à analyser le défaut.',
      'expert.hinge': 'L’ingénieure a besoin du défaut exact.',
      'expert.free': 'Les conditions d’envoi ne comptent pas pour l’analyse technique.',
      'expert.cost': 'Les coûts du rappel ne servent pas à corriger la pièce.',
      'expert.supplier': 'Cela montre où le contrôle qualité doit changer.'
    },
    messages: {
      'customer.fit': 'Vérifiez le numéro de lot sous votre bouilloire. S’il est compris entre 2301 et 2315, ne l’utilisez plus : le couvercle peut s’ouvrir en versant. Nous la remplaçons gratuitement, frais d’envoi compris.',
      'customer.tooMuch': 'Une goupille de charnière d’un nouveau fournisseur était 0,2 mm trop fine ; l’échange va nous coûter environ 120 000 euros.',
      'customer.condescending': 'Certaines bouilloires ont peut-être un tout petit souci. Pas besoin de comprendre les détails ; renvoyez-la si vous voulez.',
      'executive.fit': 'Problème de sécurité : sur les lots 2301 à 2315, le couvercle de la bouilloire peut s’ouvrir en versant de l’eau chaude. Aucune blessure connue à ce jour. L’échange coûtera environ 120 000 euros.',
      'executive.tooMuch': 'Le diamètre de la goupille est 0,2 mm sous la tolérance ; les échantillons du nouveau fournisseur étaient conformes, nous soupçonnons donc une usure de l’outil.',
      'executive.missing': 'Nous remplaçons quelques bouilloires par précaution.',
      'expert.fit': 'Les goupilles de charnière du nouveau fournisseur sont 0,2 mm trop fines, donc le couvercle peut s’ouvrir en versant. Lots concernés : 2301 à 2315. Leurs échantillons avaient passé le contrôle, notre contrôle à réception doit donc changer.',
      'expert.missing': 'Certains couvercles ont du jeu ; les clients reçoivent un remplacement gratuit.',
      'expert.condescending': 'Une charnière, c’est la pièce qui permet au couvercle de tourner. Si elle est trop fine, elle tient mal.'
    }
  }
};
