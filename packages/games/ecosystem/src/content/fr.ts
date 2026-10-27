import type { ContentText } from './types';

export const content: ContentText = {
  weeks: { one: '{n} semaine', many: '{n} semaines', other: '{n} semaines' },
  species: {
    algae: { name: 'Algues vertes', about: 'De minuscules plantes qui flottent dans l’eau. Elles poussent vite avec des nutriments et de la lumière ; les daphnies et les escargots les mangent. Beaucoup d’algues rendent l’eau verte et font de l’ombre aux plantes du fond.' },
    bluegreen: { name: 'Algues bleu-vert', about: 'En réalité des bactéries (cyanobactéries). Elles poussent lentement, demandent une eau riche et ne sont presque pas mangées : elles prolifèrent quand les nutriments s’accumulent.' },
    duckweed: { name: 'Lentilles d’eau', about: 'De petites feuilles flottantes. Dans une eau riche, elles couvrent la surface et font de l’ombre à tout ce qui est dessous.' },
    pondweed: { name: 'Potamot', about: 'Des plantes immergées enracinées dans la vase. Elles ont besoin d’eau claire pour la lumière, prennent des nutriments aux algues et offrent aux daphnies un abri contre les poissons.' },
    fleas: { name: 'Daphnies', about: 'De minuscules crustacés (puces d’eau) qui broutent les algues. Les petits poissons les mangent, mais dans le potamot et la vase beaucoup restent hors d’atteinte.' },
    snails: { name: 'Limnées', about: 'Ces escargots d’eau mangent des débris de plantes mortes et quelques algues. Les petits poissons en mangent une partie.' },
    minnows: { name: 'Petits poissons', about: 'Ils chassent les daphnies et quelques escargots. Leurs petits mettent environ six semaines à grandir. Les brochets les mangent.' },
    pike: { name: 'Brochets', about: 'Un grand chasseur qui mange les petits poissons. Les jeunes brochets mettent environ vingt semaines à grandir.' },
    grass: { name: 'Graminées', about: 'Hautes et à croissance rapide sur sol riche. Elles font de l’ombre aux plantes basses et consomment beaucoup d’eau.' },
    flowers: { name: 'Fleurs sauvages', about: 'Des plantes basses qui prospèrent sur sol pauvre. Elles ont besoin de lumière, donc l’herbe haute les évince. Les pucerons et les lapins les mangent.' },
    clover: { name: 'Trèfle', about: 'Une plante basse qui tire son azote de l’air, moins sur sol riche. Ses feuilles mortes enrichissent le sol pour ses voisines. Les lapins l’aiment par-dessus tout.' },
    aphids: { name: 'Pucerons', about: 'De minuscules insectes qui sucent la sève, surtout des fleurs sauvages. Ils se multiplient très vite. Les coccinelles les mangent.' },
    ladybirds: { name: 'Coccinelles', about: 'Des coléoptères qui mangent les pucerons. Leurs larves mettent environ trois semaines à grandir, elles réagissent donc avec retard à davantage de pucerons.' },
    rabbits: { name: 'Lapins', about: 'Ils broutent d’abord le trèfle, puis les fleurs sauvages et l’herbe. Leurs petits mettent environ cinq semaines à grandir. Les renards les chassent ; certains sont toujours à l’abri dans leurs terriers.' },
    foxes: { name: 'Renards', about: 'Ils chassent les lapins. Les jeunes renards mettent environ six mois à grandir.' },
    worms: { name: 'Vers de terre', about: 'Ils mangent les feuilles mortes et les transforment à nouveau en nutriments utilisables par les plantes.' }
  },
  challenges: {
    'fleas-arrive': {
      title: 'Les daphnies arrivent',
      situation: 'Une jeune mare n’a que des algues vertes. Des daphnies y arrivent, apportées par un oiseau.',
      think: 'Qui mange les algues ? Que deviennent les daphnies quand les algues diminuent ?',
      explain: 'Les daphnies se multiplient sur les algues jusqu’à manger aussi vite que les algues poussent. Dès lors, ce sont les daphnies, et non les nutriments, qui fixent la quantité d’algues : une boucle d’équilibrage (B1). L’eau devient claire et le reste.',
      real: 'Dans de vraies mares, les poissons et les saisons empêchent en général que ce soit aussi net.'
    },
    'enrich-swings': {
      title: 'Plus de nourriture pour tous',
      situation: 'Un fort ruissellement venant d’un champ commence à enrichir une mare d’algues et de daphnies.',
      think: 'Plus de nutriments nourrissent plus d’algues. Que font les daphnies avec plus d’algues, et que font ensuite les algues ?',
      explain: 'Plus de nutriments laissent les algues prendre de l’avance ; les daphnies suivent, mangent les algues puis manquent de nourriture ; les algues se reprennent et tout recommence. Une eau plus riche a fait osciller le système au lieu de le stabiliser. Les écologues appellent cela le paradoxe de l’enrichissement (B1).',
      real: 'Dans de vraies mares, bien plus d’espèces et les saisons amortissent ou modifient ces oscillations.'
    },
    'fish-stocked': {
      title: 'Des poissons dans la mare',
      situation: 'Quelqu’un lâche de petits poissons dans une mare qui n’en avait pas.',
      think: 'Les poissons mangent les daphnies. Qui mange les algues, et que leur arrive-t-il ?',
      explain: 'Les poissons mangent les daphnies, donc moins de daphnies broutent les algues, et les algues poussent. Un changement en haut atteint le bas de la chaîne alimentaire : une cascade trophique. Elle se construit lentement, car les jeunes poissons mettent des semaines à grandir.',
      real: 'Dans de vraies mares, les poissons remuent aussi la vase, ce qui trouble encore plus l’eau.'
    },
    'pike-return': {
      title: 'Le retour des brochets',
      situation: 'Quelques jeunes brochets sont lâchés dans une mare pleine de petits poissons.',
      think: 'Suivez la chaîne : brochets, petits poissons, daphnies, algues.',
      explain: 'Les brochets mangent les petits poissons ; moins de petits poissons laissent plus de daphnies ; plus de daphnies mangent plus d’algues. Chaque étape inverse le sens, donc les algues baissent. Cela prend du temps, car les jeunes brochets mettent environ vingt semaines à grandir.',
      real: 'Dans de vrais lacs, on retire des petits poissons ou on ajoute des brochets pour éclaircir l’eau, avec un succès inégal et souvent bref.'
    },
    'algae-treatment': {
      title: 'Une solution rapide à l’eau verte',
      situation: 'La mare est traitée : neuf algues sur dix meurent et coulent, mais restent dans l’eau.',
      think: 'Où vont les nutriments des algues mortes ? Et qu’est-il arrivé aux daphnies pendant l’absence des algues ?',
      explain: 'Les algues mortes pourrissent en quelques jours et rendent leurs nutriments à l’eau. Les daphnies ont eu faim pendant l’absence des algues, donc pendant un temps personne ne les contient, et elles dépassent leur niveau d’avant. Une solution qui enlève le symptôme mais pas les nutriments ne dure pas.',
      real: 'Dans de vraies mares, les algues qui pourrissent consomment aussi de l’oxygène, ce qui peut nuire aux poissons.'
    },
    'slow-runoff': {
      title: 'Un champ en amont',
      situation: 'Un nouveau champ en amont commence à se déverser dans la mare claire.',
      think: 'Que font plus de nutriments aux algues, et que font plus d’algues au potamot en dessous ?',
      explain: 'Pendant des mois, rien ne semble se passer : le potamot a même l’air en forme au bout de six mois. Pendant ce temps, les nutriments s’accumulent dans l’eau et la vase, jusqu’à ce que les lentilles d’eau et les algues bleu-vert, qui ont besoin d’une eau riche, démarrent et fassent de l’ombre au potamot. Alors une boucle de renforcement prend le relais : moins de potamot, plus d’algues, plus d’ombre (R1). La bascule est rapide ; la cause était lente.',
      real: 'Dans de vrais lacs, de telles bascules d’une eau claire à une eau verte sont bien documentées, souvent après des années de changement lent.'
    },
    'no-way-back': {
      title: 'Le ruissellement s’arrête',
      situation: 'Deux ans plus tard, le ruissellement est complètement arrêté. Le potamot va-t-il revenir ?',
      think: 'Reste-t-il du potamot capable de repousser ? Qu’est-ce qui garde l’eau verte maintenant ?',
      explain: 'Arrêter le ruissellement supprime la cause, mais la mare reste verte : les algues font de l’ombre au fond et il ne reste aucun potamot pour repousser. La boucle de renforcement (R1) maintient désormais la mare dans son état vert. Revenir en arrière demande plus que d’annuler le changement, par exemple replanter du potamot.',
      real: 'Dans de vrais lacs, la récupération après l’arrêt des nutriments prend souvent de nombreuses années, et l’on replante parfois des plantes.'
    },
    shade: {
      title: 'Un arbre au-dessus de la mare',
      situation: 'Un arbre pousse au-dessus de la mare et lui fait de l’ombre.',
      think: 'Le potamot a besoin de lumière au fond. Qu’est-ce qui lui prend encore de la lumière ?',
      explain: 'Moins de lumière freine le potamot, qui retient donc moins les algues. Les algues et les daphnies se mettent à osciller, et chaque poussée d’algues fait encore plus d’ombre au potamot (R1) : il baisse par paliers.',
      real: 'Dans de vraies mares, les feuilles tombées de l’arbre apporteraient aussi des nutriments.'
    },
    spray: {
      title: 'Pulvériser contre les pucerons',
      situation: 'La prairie est traitée contre les pucerons : neuf pucerons sur dix et aussi neuf coccinelles sur dix meurent.',
      think: 'Qui repousse le plus vite : les pucerons ou les coccinelles qui les mangent ?',
      explain: 'Le traitement a tué les pucerons et les coccinelles qui les mangent. Les pucerons se multiplient bien plus vite que les coccinelles, donc ils sont revenus les premiers, sans personne pour les arrêter, et les fleurs sauvages en ont payé le prix. Les écologues parlent de résurgence des ravageurs (B2 avec délai).',
      real: 'Dans de vrais champs, les traitements nuisent aussi aux abeilles et aux autres insectes, et les ravageurs peuvent devenir résistants.'
    },
    'no-foxes': {
      title: 'Les renards s’en vont',
      situation: 'Les renards quittent la prairie.',
      think: 'Qui tenait les lapins en respect ? Que mangent d’abord plus de lapins ?',
      explain: 'Sans renards, la boucle d’équilibrage qui tenait les lapins en respect disparaît (B2). Les lapins se multiplient et broutent le trèfle, leur nourriture préférée, jusqu’à ce qu’il en reste peu.',
      real: 'Dans de vrais paysages, les lapins partent aussi ailleurs, et des maladies peuvent réduire leur nombre.'
    },
    fertilise: {
      title: 'Un peu d’engrais',
      situation: 'L’agriculteur épand un peu d’engrais chaque semaine.',
      think: 'Quelle plante profite le plus d’un sol riche, et que fait-elle aux plantes basses ?',
      explain: 'L’engrais nourrit surtout les graminées. Une herbe plus haute fait de l’ombre au trèfle, plus bas, et le trèfle perd son avantage : sur sol riche, fabriquer son propre azote ne l’aide plus. Plus de nourriture pour la prairie ne signifie pas plus de chaque plante.',
      real: 'Dans de vraies prairies, l’azote des engrais et de l’air est une cause majeure de la perte des fleurs sauvages.'
    },
    drought: {
      title: 'Un été sec',
      situation: 'Douze semaines sèches, puis à nouveau une pluie normale.',
      think: 'De quoi les graminées ont-elles besoin à part les nutriments ? Que se passe-t-il quand la pluie revient ?',
      explain: 'Sans pluie, le sol se dessèche et les graminées ralentissent et rétrécissent. Quand la pluie revient, le sol se remplit et les graminées repoussent, même au-delà de leur ancien niveau, car des nutriments se sont accumulés dans le sol pendant qu’elles ne pouvaient pas s’en servir.',
      real: 'Dans de vraies prairies, une longue sécheresse peut aussi tuer des plantes et laisser la place à d’autres.'
    },
    'clover-poor': {
      title: 'Du trèfle pour une prairie pauvre',
      situation: 'On sème du trèfle dans une prairie pauvre de fleurs sauvages.',
      think: 'Le trèfle tire l’azote de l’air. Où va cet azote quand ses feuilles meurent ?',
      explain: 'Le trèfle apporte du nouvel azote dans la prairie. Quand ses feuilles meurent, les vers de terre les transforment en nutriments que les fleurs sauvages utilisent. Les voisines en profitent, lentement, par le sol : une chaîne avec délai.',
      real: 'En agriculture, on sème du trèfle précisément pour cette raison.'
    },
    'worms-gone': {
      title: 'Où sont les vers de terre ?',
      situation: 'Les vers de terre disparaissent de la prairie.',
      think: 'Qui retransforme les feuilles mortes en nourriture pour les plantes ? Quelle plante n’en dépend pas ?',
      explain: 'Sans vers de terre, les feuilles mortes s’accumulent et leurs nutriments restent enfermés. Les graminées ont faim. Le trèfle fabrique son propre azote, donc il gagne : un effet secondaire que peu de gens attendent.',
      real: 'Dans de vrais sols, bien d’autres animaux, champignons et bactéries décomposent les feuilles mortes.'
    },
    'foxes-return': {
      title: 'Le retour des renards',
      situation: 'Des renards reviennent dans une prairie envahie par les lapins.',
      think: 'Combien de temps les jeunes renards mettent-ils à grandir ? Que signifient moins de lapins pour le trèfle ?',
      explain: 'D’abord, il se passe peu de chose : les jeunes renards mettent environ six mois à grandir. Puis les renards font baisser les lapins (B2), et le trèfle, libéré du broutage, revient lentement. L’effet arrive des années après la cause.',
      real: 'Dans de vrais paysages, les renards chassent aussi d’autres animaux, et les lapins trouvent de nouveaux endroits où vivre.'
    },
    'ladybirds-gone': {
      title: 'Coccinelles ramassées',
      situation: 'La plupart des coccinelles sont ramassées pour un jardin ailleurs.',
      think: 'Qui mange les pucerons ? Et de quoi les pucerons ont-ils besoin pour continuer à se multiplier ?',
      explain: 'Sans coccinelles, les pucerons se multiplient et dévorent les fleurs sauvages. Avec moins de nourriture, ils diminuent de nouveau (B1) : ici, c’est leur nourriture qui les freine, pas leurs prédateurs. Les quelques coccinelles restantes restent peu nombreuses pendant des mois.',
      real: 'Dans de vrais jardins, d’autres chasseurs de pucerons comme les syrphes et les oiseaux aident aussi.'
    }
  },
  goals: {
    'save-pondweed': {
      story: 'Un nouveau champ en amont commence à se déverser dans la mare claire. Gardez le potamot en vie pendant deux ans tandis que le ruissellement continue.',
      target: 'Potamot au moins {v} chaque semaine jusqu’à la semaine {w}.',
      hint: 'Les algues sont un symptôme. Qu’est-ce qui les nourrit, et combien de temps avant que cela doive changer ?',
      explain: 'Le potamot ne baisse que lorsque quelque chose lui fait de l’ombre : les lentilles d’eau et les algues, qui poussent grâce aux nutriments qu’apporte le champ. Agissez sur la cause, et tôt : quand le potamot semble faible, la boucle de renforcement a déjà pris le relais.',
      plans: {
        buffer: 'Une bande de plantes le long du champ retient la plus grande partie du ruissellement avant qu’il n’atteigne la mare. Assez tôt, les algues ne prennent jamais l’avantage.',
        ditch: 'Fermer le fossé arrête complètement le ruissellement, donc les algues ne prennent jamais l’avantage.'
      }
    },
    'clear-pond': {
      story: 'La mare est devenue verte après deux ans de ruissellement. Rendez l’eau claire, avec du potamot qui pousse, pendant douze semaines d’affilée.',
      target: 'Algues (vertes et bleu-vert) au plus {v} et potamot au moins {p}, douze semaines d’affilée, avant la semaine {w}.',
      hint: 'Les algues sont un symptôme. Qu’est-ce qui les nourrit ? Et qu’est-ce qui les maintient faibles une fois l’eau claire ?',
      explain: 'L’état vert s’entretient lui-même : les algues font de l’ombre aux plantes qui les freineraient. Pour éclaircir l’eau, il faut supprimer la cause (le ruissellement), retirer ou évacuer les nutriments stockés et faire revenir le potamot, pour que la boucle de renforcement tourne vers l’eau claire.',
      plans: {
        restore: 'Arrêter le ruissellement, curer la vase riche en nutriments, planter du potamot et retirer la plupart des petits poissons (pour que plus de daphnies broutent les algues). Ensemble, ils font tourner la boucle vers l’eau claire.',
        flush: 'Arrêter le ruissellement et laisser un ruisseau évacuer nutriments et algues pendant un temps, puis planter du potamot dans l’eau claire.'
      }
    },
    'protect-flowers': {
      story: 'Un voisin vient de traiter la prairie : la plupart des pucerons et la plupart des coccinelles sont morts. Préservez les fleurs sauvages pendant un an.',
      target: 'Fleurs sauvages au moins {v} chaque semaine jusqu’à la semaine {w}.',
      hint: 'Les pucerons reviennent plus vite que les coccinelles. Quand de nouvelles coccinelles trouveraient-elles de quoi manger ?',
      explain: 'Les pucerons se rétablissent avant leurs chasseurs. Lâchées trop tôt, les coccinelles meurent de faim faute de pucerons ; lâchées trop tard, les fleurs sauvages sont déjà mangées. Le moment décide.',
      plans: {
        ladybirds: 'Lâchées après une dizaine de semaines, quand les pucerons sont revenus mais avant leur pic, les coccinelles trouvent tout de suite à manger et arrêtent les pucerons à temps.'
      }
    },
    'bring-back-clover': {
      story: 'Sans renards, les lapins ont presque fait disparaître le trèfle. Faites revenir le trèfle pendant huit semaines d’affilée en moins de quatre ans.',
      target: 'Trèfle au moins {v}, huit semaines d’affilée, avant la semaine {w}.',
      hint: 'Retirer des lapins n’aide qu’un temps. Qu’est-ce qui les tenait en respect avant ?',
      explain: 'Les lapins se multiplient vite, donc en retirer quelques-uns ne fait que gagner du temps. Un changement durable demande le retour de la boucle d’équilibrage : les renards. Les jeunes renards mettent six mois à grandir, donc le trèfle revient des années plus tard.',
      plans: {
        foxes: 'Les renards seuls suffisent, mais il faut de la patience : ils font baisser les lapins lentement.',
        foxesRabbits: 'Des renards et la moitié des lapins déplacés : les renards ont moins de lapins à rattraper.',
        foxesRabbitsClover: 'Des renards, la plupart des lapins déplacés et du trèfle semé : la voie la plus rapide, car le trèfle prend de l’avance pendant que les renards grandissent.'
      }
    }
  },
  loops: {
    graze: 'Les daphnies broutent les algues ; moins d’algues, moins de daphnies.',
    fishFleas: 'Les petits poissons mangent les daphnies ; moins de daphnies, moins de jeunes poissons.',
    pikeFish: 'Les brochets mangent les petits poissons ; moins de petits poissons, moins de jeunes brochets.',
    clearWater: 'Les algues font de l’ombre au potamot ; le potamot freine les algues. Celui qui mène prend encore plus d’avance.',
    shelter: 'Le potamot cache les daphnies aux poissons, et les daphnies mangent les algues.',
    recycle: 'Les algues mortes pourrissent et nourrissent de nouvelles algues.',
    aphidsFlowers: 'Les pucerons vivent des fleurs sauvages ; moins de fleurs, moins de pucerons.',
    ladybirdsAphids: 'Les coccinelles mangent les pucerons ; moins de pucerons, moins de jeunes coccinelles.',
    rabbitsClover: 'Les lapins broutent le trèfle ; moins de trèfle, moins de jeunes lapins.',
    foxesRabbits: 'Les renards chassent les lapins ; moins de lapins, moins de jeunes renards.',
    thirst: 'Les graminées consomment l’eau du sol ; un sol sec freine les graminées.',
    wormsDead: 'Les vers de terre mangent les feuilles mortes ; moins de feuilles mortes, moins de vers.',
    flowerUptake: 'Les fleurs sauvages absorbent les nutriments dont elles poussent.'
  }
};
