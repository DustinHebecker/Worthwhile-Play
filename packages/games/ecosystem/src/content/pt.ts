import type { ContentText } from './types';

export const content: ContentText = {
  weeks: { one: '{n} semana', many: '{n} semanas', other: '{n} semanas' },
  species: {
    algae: { name: 'Algas verdes', about: 'Plantinhas minúsculas que flutuam na água. Crescem rápido com nutrientes e luz; pulgas-d’água e caramujos as comem. Muitas algas deixam a água verde e fazem sombra nas plantas de baixo.' },
    bluegreen: { name: 'Algas azuis', about: 'Na verdade são bactérias (cianobactérias). Crescem devagar, precisam de água rica e quase ninguém as come, por isso florescem quando os nutrientes se acumulam.' },
    duckweed: { name: 'Lentilhas-d’água', about: 'Folhinhas flutuantes. Em água rica cobrem a superfície e fazem sombra em tudo o que está embaixo.' },
    pondweed: { name: 'Espiga-d’água', about: 'Plantas submersas enraizadas na lama (gênero Potamogeton). Precisam de água limpa para receber luz, tiram nutrientes das algas e dão às pulgas-d’água um esconderijo contra os peixes.' },
    fleas: { name: 'Pulgas-d’água', about: 'Pequenos crustáceos (Daphnia) que pastam as algas. Os peixes pequenos as comem, mas na espiga-d’água e na lama muitas ficam fora de alcance.' },
    snails: { name: 'Caramujos', about: 'Comem restos de plantas mortas e algumas algas. Os peixes pequenos comem alguns deles.' },
    minnows: { name: 'Peixes pequenos', about: 'Caçam pulgas-d’água e alguns caramujos. Os filhotes levam cerca de seis semanas para crescer. Os lúcios os comem.' },
    pike: { name: 'Lúcios', about: 'Um grande caçador que come peixes pequenos. Os lúcios jovens levam cerca de vinte semanas para crescer.' },
    grass: { name: 'Capins', about: 'Altos e de crescimento rápido em solo rico. Fazem sombra nas plantas baixas e gastam muita água.' },
    flowers: { name: 'Flores silvestres', about: 'Plantas baixas que vão bem em solo pobre. Precisam de luz, por isso o capim alto as expulsa. Pulgões e coelhos as comem.' },
    clover: { name: 'Trevo', about: 'Uma planta baixa que tira seu próprio nitrogênio do ar, menos em solo rico. Suas folhas mortas adubam o solo para as vizinhas. É o que os coelhos mais gostam de comer.' },
    aphids: { name: 'Pulgões', about: 'Insetos minúsculos que sugam a seiva, principalmente das flores silvestres. Multiplicam-se muito rápido. As joaninhas os comem.' },
    ladybirds: { name: 'Joaninhas', about: 'Besouros que comem pulgões. As larvas levam cerca de três semanas para crescer, por isso reagem com atraso a mais pulgões.' },
    rabbits: { name: 'Coelhos', about: 'Comem primeiro o trevo, depois as flores silvestres e o capim. Os filhotes levam cerca de cinco semanas para crescer. As raposas os caçam; alguns sempre ficam a salvo nas tocas.' },
    foxes: { name: 'Raposas', about: 'Caçam coelhos. As raposas jovens levam cerca de meio ano para crescer.' },
    worms: { name: 'Minhocas', about: 'Comem folhas mortas e as transformam de novo em nutrientes que as plantas podem usar.' }
  },
  challenges: {
    'fleas-arrive': {
      title: 'Chegam as pulgas-d’água',
      situation: 'Uma lagoa nova só tem algas verdes. Pulgas-d’água chegam, trazidas por uma ave.',
      think: 'Quem come as algas? O que acontece com as pulgas-d’água quando as algas diminuem?',
      explain: 'As pulgas-d’água se multiplicam com as algas até comerem tão rápido quanto as algas crescem. A partir daí são as pulgas, e não os nutrientes, que definem quantas algas existem: um ciclo de equilíbrio (B1). A água fica limpa e continua limpa.',
      real: 'Em lagoas reais, os peixes e as estações costumam impedir que tudo seja tão certinho.'
    },
    'enrich-swings': {
      title: 'Mais comida para todos',
      situation: 'Um escoamento forte de uma lavoura começa a adubar uma lagoa com algas e pulgas-d’água.',
      think: 'Mais nutrientes alimentam mais algas. O que as pulgas fazem com mais algas, e o que as algas fazem depois?',
      explain: 'Mais nutrientes deixam as algas dispararem; as pulgas vão atrás, comem as algas e depois passam fome; as algas se recuperam e tudo recomeça. A água mais rica fez o sistema oscilar em vez de se acomodar. Os ecólogos chamam isso de paradoxo do enriquecimento (B1).',
      real: 'Em lagoas reais, muito mais espécies e as estações amortecem ou mudam essas oscilações.'
    },
    'fish-stocked': {
      title: 'Peixes na lagoa',
      situation: 'Alguém solta peixes pequenos numa lagoa que não tinha nenhum.',
      think: 'Os peixes comem pulgas-d’água. Quem come as algas, e o que acontece com elas?',
      explain: 'Os peixes comem as pulgas-d’água, então menos pulgas pastam as algas, e as algas crescem. Uma mudança no topo chega à base da cadeia alimentar: uma cascata trófica. Ela se forma devagar, porque os peixes jovens levam semanas para crescer.',
      real: 'Em lagoas reais, os peixes também revolvem a lama, o que turva ainda mais a água.'
    },
    'pike-return': {
      title: 'Os lúcios voltam',
      situation: 'Alguns lúcios jovens são soltos numa lagoa cheia de peixes pequenos.',
      think: 'Siga a cadeia: lúcios, peixes pequenos, pulgas-d’água, algas.',
      explain: 'Os lúcios comem os peixes pequenos; menos peixes pequenos deixam mais pulgas-d’água; mais pulgas comem mais algas. Cada passo inverte a direção, por isso as algas diminuem. Demora porque os lúcios jovens precisam de cerca de vinte semanas para crescer.',
      real: 'Em lagos reais, tiram-se peixes pequenos ou soltam-se lúcios para clarear a água, com sucesso variável e muitas vezes passageiro.'
    },
    'algae-treatment': {
      title: 'Uma solução rápida para a água verde',
      situation: 'A lagoa é tratada: nove em cada dez algas morrem e afundam, mas continuam na água.',
      think: 'Para onde vão os nutrientes das algas mortas? E o que aconteceu com as pulgas-d’água enquanto as algas sumiram?',
      explain: 'As algas mortas apodrecem em poucos dias e devolvem os nutrientes à água. As pulgas passaram fome enquanto faltavam algas, então por um tempo ninguém segura as algas, e elas passam do nível anterior. Uma solução que tira o sintoma, mas não os nutrientes, não dura.',
      real: 'Em lagoas reais, as algas apodrecendo também gastam oxigênio, o que pode prejudicar os peixes.'
    },
    'slow-runoff': {
      title: 'Uma lavoura rio acima',
      situation: 'Uma lavoura nova rio acima começa a escoar para a lagoa limpa.',
      think: 'O que mais nutrientes fazem com as algas, e o que mais algas fazem com a espiga-d’água embaixo delas?',
      explain: 'Por meses parece que nada acontece: a espiga-d’água até parece bem depois de meio ano. Enquanto isso, os nutrientes se acumulam na água e na lama, até que as lentilhas-d’água e as algas azuis, que precisam de água rica, disparem e façam sombra na espiga-d’água. Então um ciclo de reforço assume: menos espiga-d’água, mais algas, mais sombra (R1). A virada é rápida; a causa foi lenta.',
      real: 'Em lagos reais, essas viradas de água limpa para água verde são bem documentadas, muitas vezes depois de anos de mudança lenta.'
    },
    'no-way-back': {
      title: 'O escoamento para',
      situation: 'Dois anos depois, o escoamento é totalmente cortado. A espiga-d’água vai voltar?',
      think: 'Sobrou alguma espiga-d’água para rebrotar? O que mantém a água verde agora?',
      explain: 'Cortar o escoamento tira a causa, mas a lagoa continua verde: as algas fazem sombra no fundo e não sobrou espiga-d’água para rebrotar. O ciclo de reforço (R1) agora prende a lagoa no estado verde. Voltar exige mais do que desfazer a mudança, por exemplo replantar a espiga-d’água.',
      real: 'Em lagos reais, a recuperação depois de cortar os nutrientes costuma levar muitos anos, e às vezes as plantas são replantadas.'
    },
    shade: {
      title: 'Uma árvore sobre a lagoa',
      situation: 'Uma árvore cresce sobre a lagoa e faz sombra nela.',
      think: 'A espiga-d’água precisa de luz no fundo. O que mais tira a luz dela?',
      explain: 'Menos luz freia a espiga-d’água, que passa a segurar menos as algas. As algas e as pulgas começam a oscilar, e cada surto de algas faz mais sombra na espiga-d’água (R1): ela cai degrau por degrau.',
      real: 'Em lagoas reais, as folhas que caem da árvore também trariam nutrientes.'
    },
    spray: {
      title: 'Pulverizar contra pulgões',
      situation: 'O prado é pulverizado contra pulgões: morrem nove em cada dez pulgões e também nove em cada dez joaninhas.',
      think: 'Quem se recupera mais rápido: os pulgões ou as joaninhas que os comem?',
      explain: 'A pulverização matou os pulgões e as joaninhas que os comem. Os pulgões se multiplicam muito mais rápido que as joaninhas, então voltaram primeiro, sem ninguém para pará-los, e as flores silvestres pagaram o preço. Os ecólogos chamam isso de ressurgência de pragas (B2 com atraso).',
      real: 'Em lavouras reais, a pulverização também prejudica abelhas e outros insetos, e as pragas podem ficar resistentes.'
    },
    'no-foxes': {
      title: 'As raposas vão embora',
      situation: 'As raposas deixam o prado.',
      think: 'Quem mantinha os coelhos sob controle? O que mais coelhos comem primeiro?',
      explain: 'Sem raposas, some o ciclo de equilíbrio que mantinha os coelhos sob controle (B2). Os coelhos se multiplicam e comem o trevo, sua comida favorita, até sobrar pouco.',
      real: 'Em paisagens reais, os coelhos também vão para outros lugares, e doenças podem reduzir seu número.'
    },
    fertilise: {
      title: 'Um pouco de adubo',
      situation: 'O agricultor espalha um pouco de adubo toda semana.',
      think: 'Qual planta mais se beneficia de solo rico, e o que ela faz com as plantas baixas?',
      explain: 'O adubo alimenta principalmente os capins. O capim mais alto faz sombra no trevo, que é baixo, e o trevo perde sua vantagem: em solo rico, fazer o próprio nitrogênio já não ajuda. Mais comida para o prado não significa mais de cada planta.',
      real: 'Em prados reais, o nitrogênio do adubo e do ar é uma das principais causas da perda de flores silvestres.'
    },
    drought: {
      title: 'Um verão seco',
      situation: 'Doze semanas secas, depois chuva normal de novo.',
      think: 'Do que os capins precisam além de nutrientes? O que acontece quando a chuva volta?',
      explain: 'Sem chuva o solo seca, e os capins crescem mais devagar e encolhem. Quando a chuva volta, o solo se enche e os capins voltam a crescer, até acima do nível antigo, porque os nutrientes se acumularam no solo enquanto eles não podiam usá-los.',
      real: 'Em prados reais, uma seca longa também pode matar plantas e abrir espaço para outras.'
    },
    'clover-poor': {
      title: 'Trevo para um prado pobre',
      situation: 'Semeia-se trevo num prado pobre de flores silvestres.',
      think: 'O trevo tira nitrogênio do ar. Para onde vai esse nitrogênio quando as folhas morrem?',
      explain: 'O trevo traz nitrogênio novo para o prado. Quando as folhas morrem, as minhocas as transformam em nutrientes que as flores silvestres usam. As vizinhas se beneficiam, devagar, pelo solo: uma cadeia com atraso.',
      real: 'Na agricultura real, o trevo é semeado justamente por esse motivo.'
    },
    'worms-gone': {
      title: 'Cadê as minhocas?',
      situation: 'As minhocas desaparecem do prado.',
      think: 'Quem transforma folhas mortas de novo em alimento para as plantas? Qual planta não depende disso?',
      explain: 'Sem minhocas, as folhas mortas se acumulam e seus nutrientes ficam presos. Os capins passam fome. O trevo faz seu próprio nitrogênio, então ganha: um efeito colateral que pouca gente espera.',
      real: 'Em solos reais, muito mais animais, fungos e bactérias decompõem as folhas mortas.'
    },
    'foxes-return': {
      title: 'As raposas voltam',
      situation: 'As raposas voltam a um prado tomado por coelhos.',
      think: 'Quanto tempo as raposas jovens levam para crescer? O que menos coelhos significam para o trevo?',
      explain: 'No começo acontece pouco: as raposas jovens levam cerca de meio ano para crescer. Depois as raposas reduzem os coelhos (B2), e o trevo, livre de ser comido, volta devagar. O efeito chega anos depois da causa.',
      real: 'Em paisagens reais, as raposas também caçam outros animais, e os coelhos encontram novos lugares para viver.'
    },
    'ladybirds-gone': {
      title: 'Joaninhas recolhidas',
      situation: 'A maioria das joaninhas é recolhida para um jardim em outro lugar.',
      think: 'Quem come os pulgões? E do que os pulgões precisam para continuar se multiplicando?',
      explain: 'Sem joaninhas, os pulgões se multiplicam e devoram as flores silvestres. Com menos comida, eles voltam a cair (B1): aqui é a comida que os freia, não os predadores. As poucas joaninhas que sobraram continuam poucas por meses.',
      real: 'Em jardins reais, outros caçadores de pulgões, como moscas-das-flores e pássaros, também ajudam.'
    }
  },
  goals: {
    'save-pondweed': {
      story: 'Uma lavoura nova rio acima começa a escoar para a lagoa limpa. Mantenha a espiga-d’água viva por dois anos enquanto o escoamento continua.',
      target: 'Espiga-d’água com pelo menos {v} toda semana até a semana {w}.',
      hint: 'As algas são um sintoma. O que as alimenta, e quão cedo isso precisa mudar?',
      explain: 'A espiga-d’água só cai quando algo faz sombra nela: as lentilhas-d’água e as algas, que crescem com os nutrientes que a lavoura traz. Ataque a causa, e cedo: quando a espiga-d’água parece fraca, o ciclo de reforço já assumiu.',
      plans: {
        buffer: 'Uma faixa de plantas na beira da lavoura segura a maior parte do escoamento antes que chegue à lagoa. Feita a tempo, as algas nunca disparam.',
        ditch: 'Fechar a vala corta totalmente o escoamento, então as algas nunca disparam.'
      }
    },
    'clear-pond': {
      story: 'A lagoa ficou verde depois de dois anos de escoamento. Deixe a água limpa de novo, com a espiga-d’água crescendo, por doze semanas seguidas.',
      target: 'Algas (verdes e azuis) no máximo {v} e espiga-d’água pelo menos {p}, por doze semanas seguidas, até a semana {w}.',
      hint: 'As algas são um sintoma. O que as alimenta? E o que as mantém baixas depois que a água ficar limpa?',
      explain: 'O estado verde se sustenta sozinho: as algas fazem sombra nas plantas que as segurariam. Para limpar a água é preciso tirar a causa (o escoamento), retirar ou lavar os nutrientes acumulados e trazer de volta a espiga-d’água, para que o ciclo de reforço gire para a água limpa.',
      plans: {
        restore: 'Cortar o escoamento, dragar a lama rica em nutrientes, plantar a espiga-d’água e tirar a maioria dos peixes pequenos (para que mais pulgas-d’água pastem as algas). Juntos, eles giram o ciclo para a água limpa.',
        flush: 'Cortar o escoamento e deixar um córrego lavar os nutrientes e as algas por um tempo; depois plantar a espiga-d’água na água limpa.'
      }
    },
    'protect-flowers': {
      story: 'Um vizinho acabou de pulverizar o prado: a maioria dos pulgões e a maioria das joaninhas morreram. Mantenha as flores silvestres por um ano.',
      target: 'Flores silvestres com pelo menos {v} toda semana até a semana {w}.',
      hint: 'Os pulgões voltam mais rápido que as joaninhas. Quando novas joaninhas encontrariam o que comer?',
      explain: 'Os pulgões se recuperam antes de seus caçadores. Soltas cedo demais, as joaninhas passam fome porque ainda não há pulgões; soltas tarde demais, as flores silvestres já foram comidas. O momento decide.',
      plans: {
        ladybirds: 'Soltas depois de umas dez semanas, quando os pulgões já voltaram mas antes do pico, as joaninhas encontram comida na hora e param os pulgões a tempo.'
      }
    },
    'bring-back-clover': {
      story: 'Sem raposas, os coelhos quase acabaram com o trevo. Traga o trevo de volta por oito semanas seguidas em até quatro anos.',
      target: 'Trevo com pelo menos {v}, por oito semanas seguidas, até a semana {w}.',
      hint: 'Tirar coelhos só ajuda por um tempo. O que os mantinha sob controle antes?',
      explain: 'Os coelhos se multiplicam rápido, então tirar alguns só ganha tempo. Uma mudança duradoura precisa da volta do ciclo de equilíbrio: as raposas. As raposas jovens levam meio ano para crescer, então o trevo só volta anos depois.',
      plans: {
        foxes: 'Só as raposas bastam, mas é preciso paciência: elas reduzem os coelhos devagar.',
        foxesRabbits: 'Raposas e levar metade dos coelhos: as raposas têm menos coelhos para alcançar.',
        foxesRabbitsClover: 'Raposas, levar a maioria dos coelhos e semear trevo: o caminho mais rápido, porque o trevo sai na frente enquanto as raposas crescem.'
      }
    }
  },
  loops: {
    graze: 'As pulgas-d’água pastam as algas; menos algas, menos pulgas.',
    fishFleas: 'Os peixes pequenos comem pulgas-d’água; menos pulgas, menos peixes jovens.',
    pikeFish: 'Os lúcios comem peixes pequenos; menos peixes pequenos, menos lúcios jovens.',
    clearWater: 'As algas fazem sombra na espiga-d’água; a espiga-d’água segura as algas. Quem está na frente se distancia ainda mais.',
    shelter: 'A espiga-d’água esconde as pulgas-d’água dos peixes, e as pulgas comem algas.',
    recycle: 'As algas mortas apodrecem e alimentam novas algas.',
    aphidsFlowers: 'Os pulgões vivem das flores silvestres; menos flores, menos pulgões.',
    ladybirdsAphids: 'As joaninhas comem pulgões; menos pulgões, menos joaninhas jovens.',
    rabbitsClover: 'Os coelhos comem o trevo; menos trevo, menos filhotes de coelho.',
    foxesRabbits: 'As raposas caçam coelhos; menos coelhos, menos raposas jovens.',
    thirst: 'Os capins gastam a água do solo; o solo seco freia os capins.',
    wormsDead: 'As minhocas comem folhas mortas; menos folhas mortas, menos minhocas.',
    flowerUptake: 'As flores silvestres absorvem os nutrientes de que crescem.'
  }
};
