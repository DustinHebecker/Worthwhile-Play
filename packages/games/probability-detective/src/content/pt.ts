import type { ContentText } from './types';

export const content: ContentText = {
  templates: {
    'c-parcel': {
      title: 'O pacote azul',
      story: 'Chegou à loja da esquina um pacote sem remetente. Ele só pode vir de um dos armazéns que fazem entregas nesta rua.',
      lead: 'Os pacotes desta rua vêm de:',
      hyps: { north: 'Armazém Norte', south: 'Armazém Sul', east: 'Armazém Leste' },
      clues: {
        blue: { label: 'Embrulhado em papel azul', seen: 'O pacote está embrulhado em papel azul.', notSeen: 'O pacote não está embrulhado em papel azul.' },
        'brown-tape': { label: 'Fechado com fita marrom', seen: 'Está fechado com fita marrom.', notSeen: 'Não está fechado com fita marrom.' },
        smudge: { label: 'Etiqueta borrada', seen: 'A etiqueta do endereço está borrada.', notSeen: 'A etiqueta do endereço está limpa.' },
        string: { label: 'Amarrado com barbante', seen: 'Está amarrado com barbante.', notSeen: 'Não está amarrado com barbante.' },
        tuesday: { label: 'Chegou numa terça-feira', seen: 'Chegou numa terça-feira. Todos os armazéns entregam em todos os dias úteis.', notSeen: 'Chegou numa terça-feira. Todos os armazéns entregam em todos os dias úteis.' },
        'echo-blue': { label: 'A vizinha também viu', seen: 'A vizinha também diz que o pacote era azul — ela viu o mesmo pacote.', notSeen: 'A vizinha também diz que o pacote era azul — ela viu o mesmo pacote.' }
      }
    },
    'c-garden': {
      title: 'Os morangos mordiscados',
      story: 'Durante a noite alguém mexeu nos morangos. Neste jardim, alguns tipos de visitantes gostam de beliscá-los.',
      lead: 'Nas noites em que os morangos são mordiscados, o visitante é:',
      hyps: { birds: 'Pássaros', snails: 'Caracóis', hedgehog: 'Um ouriço' },
      clues: {
        slime: { label: 'Rastro brilhante', seen: 'Há um rastro brilhante no caminho.', notSeen: 'Não há rastro brilhante.' },
        pecks: { label: 'Pequenas bicadas', seen: 'As frutas têm pequenas bicadas.', notSeen: 'Não há bicadas.' },
        droppings: { label: 'Fezes sob a sebe', seen: 'Há fezes sob a sebe.', notSeen: 'Não há nada sob a sebe.' },
        'net-moved': { label: 'Rede afastada', seen: 'A rede sobre o canteiro foi afastada.', notSeen: 'A rede continua no lugar.' },
        rain: { label: 'Choveu à noite', seen: 'Choveu à noite — com chuva, todos saem.', notSeen: 'Choveu à noite — com chuva, todos saem.' },
        'echo-slime': { label: 'Visto de novo de manhã', seen: 'Seu vizinho mostra o mesmo rastro brilhante.', notSeen: 'Seu vizinho mostra o mesmo rastro brilhante.' }
      }
    },
    'c-cups': {
      title: 'A xícara trincada',
      story: 'Um cliente devolve uma xícara com uma trinca fina. Todas as máquinas da oficina fazem a mesma xícara, mas cada uma tem suas manias.',
      lead: 'As xícaras da oficina são feitas pela:',
      hyps: { a: 'Máquina A', b: 'Máquina B', c: 'Máquina C' },
      clues: {
        crack: { label: 'Trinca fina', seen: 'A xícara tem uma trinca fina.', notSeen: 'A xícara tem uma trinca fina.' },
        glaze: { label: 'Esmalte mais escuro', seen: 'O esmalte está um pouco mais escuro que o normal.', notSeen: 'O esmalte parece normal.' },
        stamp: { label: 'Carimbo nítido na base', seen: 'O carimbo do fabricante na base está nítido.', notSeen: 'O carimbo na base está borrado.' },
        handle: { label: 'Alça um pouco fora do centro', seen: 'A alça está um pouco fora do centro.', notSeen: 'A alça está reta.' },
        box: { label: 'Numa caixa cinza', seen: 'Ela veio na caixa cinza de sempre, como as xícaras de todas as máquinas.', notSeen: 'Ela veio na caixa cinza de sempre, como as xícaras de todas as máquinas.' }
      }
    },
    'c-key': {
      title: 'A chave sumida',
      story: 'A chave reserva sumiu de novo. Ela quase sempre está em um dos mesmos poucos lugares.',
      lead: 'Quando a chave some, ela aparece:',
      hyps: { coat: 'No casaco', car: 'No carro', office: 'No escritório' },
      clues: {
        'search-coat': { label: 'Uma busca rápida no casaco a encontra', seen: 'Você encontra a chave no casaco.', notSeen: 'Você olha rápido os bolsos do casaco: nada de chave. Uma busca rápida pode deixá-la passar.' },
        'search-car': { label: 'Uma olhada rápida no carro a encontra', seen: 'Você encontra a chave no carro.', notSeen: 'Você dá uma olhada rápida no carro: nada de chave. Uma olhada rápida pode deixá-la passar.' },
        jingle: { label: 'Um tilintar no corredor', seen: 'Você se lembra de um tilintar quando o casaco foi pendurado.', notSeen: 'Você não se lembra de nenhum tilintar.' },
        drove: { label: 'Você dirigiu ontem', seen: 'Você dirigiu ontem.', notSeen: 'Você não dirigiu ontem.' },
        'office-day': { label: 'Você esteve no escritório', seen: 'Você esteve no escritório ontem.', notSeen: 'Você trabalhou de casa ontem.' },
        weekday: { label: 'É dia útil', seen: 'Hoje é dia útil: isso não muda onde as chaves vão parar.', notSeen: 'Hoje é dia útil: isso não muda onde as chaves vão parar.' }
      }
    },
    'c-coin': {
      title: 'A moeda da feira',
      story: 'Você achou uma moeda antiga numa barraca de feira que vende artigos de mágica. A olho nu não dá para distingui-la de uma moeda comum, então você a joga.',
      lead: 'As moedas da caixa de moedas antigas da barraca são:',
      hyps: { ordinary: 'Uma moeda comum', weighted: 'Uma moeda viciada', 'two-headed': 'Uma moeda de duas caras' },
      clues: {
        toss1: { label: 'Cara no primeiro lançamento', seen: 'Primeiro lançamento: cara.', notSeen: 'Primeiro lançamento: coroa.' },
        toss2: { label: 'Cara no segundo lançamento', seen: 'Segundo lançamento: cara.', notSeen: 'Segundo lançamento: coroa.' },
        toss3: { label: 'Cara no terceiro lançamento', seen: 'Terceiro lançamento: cara.', notSeen: 'Terceiro lançamento: coroa.' },
        toss4: { label: 'Cara no quarto lançamento', seen: 'Quarto lançamento: cara.', notSeen: 'Quarto lançamento: coroa.' }
      }
    },
    'c-message': {
      title: 'A mensagem “do clube”',
      story: 'Uma mensagem diz vir do seu clube esportivo e pede que você confirme sua inscrição.',
      lead: 'As mensagens que dizem vir do clube são:',
      hyps: { real: 'Do clube de verdade', fake: 'Falsas' },
      clues: {
        link: { label: 'Tem um link', seen: 'Ela tem um link.', notSeen: 'Ela não tem link.' },
        sender: { label: 'Remetente desconhecido', seen: 'O endereço do remetente não é o de sempre do clube.', notSeen: 'O endereço do remetente é o de sempre.' },
        hurry: { label: 'Pede pressa', seen: 'Diz que você precisa responder hoje.', notSeen: 'Não dá prazo nenhum.' },
        'your-name': { label: 'Usa seu nome', seen: 'Cumprimenta você pelo nome.', notSeen: 'Diz só “Prezado sócio”.' },
        evening: { label: 'Chegou à noite', seen: 'Chegou à noite: os dois tipos chegam a qualquer hora.', notSeen: 'Chegou à noite: os dois tipos chegam a qualquer hora.' }
      }
    },
    'c-oven': {
      title: 'O pão queimado',
      story: 'Um pão da fornada desta manhã saiu queimado de um lado. A padaria assa em dois fornos.',
      lead: 'Os pães daqui são assados no:',
      hyps: { old: 'Forno velho', new: 'Forno novo' },
      clues: {
        'burnt-side': { label: 'Queimado de um lado', seen: 'Está queimado de um lado.', notSeen: 'Está queimado de um lado.' },
        'pale-top': { label: 'Parte de cima pálida', seen: 'A parte de cima está pálida.', notSeen: 'A parte de cima está dourada por igual.' },
        'tray-mark': { label: 'Marca das assadeiras novas', seen: 'O fundo mostra o desenho das assadeiras novas.', notSeen: 'O fundo é liso.' },
        early: { label: 'Da primeira fornada', seen: 'Veio da primeira fornada.', notSeen: 'Veio de uma fornada posterior.' },
        seeds: { label: 'Sementes por cima', seen: 'Tem sementes por cima: os dois fornos assam pão com sementes.', notSeen: 'Tem sementes por cima: os dois fornos assam pão com sementes.' }
      }
    },
    'c-beep': {
      title: 'O bipe fraco no rádio',
      story: 'O receptor do clube de rádio captou um bipe fraco e regular. A maioria desses bipes é interferência, mas um pequeno satélite também passa por cima.',
      lead: 'Bipes fracos e regulares neste receptor são:',
      hyps: { satellite: 'Um sinal de um pequeno satélite', interference: 'Interferência comum' },
      clues: {
        'pass-time': { label: 'Durante uma passagem do satélite', seen: 'Veio quando o satélite devia estar passando por cima.', notSeen: 'Veio quando não havia passagem prevista.' },
        drift: { label: 'O tom desliza devagar', seen: 'O tom desliza devagar, como o de uma fonte em movimento.', notSeen: 'O tom fica estável.' },
        fades: { label: 'Some depois de um tempo', seen: 'Some depois de uns dez minutos.', notSeen: 'Continua sem parar.' },
        rhythm: { label: 'Um ritmo regular', seen: 'Bipa num ritmo regular: os dois fazem isso.', notSeen: 'Bipa num ritmo regular: os dois fazem isso.' },
        'other-receiver': { label: 'Um segundo receptor ouve', seen: 'Um sócio do clube do outro lado da cidade também ouve.', notSeen: 'O receptor do outro lado da cidade não ouve nada.' }
      }
    },
    'c-rain': {
      title: 'Choveu durante a noite?',
      story: 'Você passou a noite fora e quer saber se as mudas receberam chuva ou se precisam ser regadas agora.',
      lead: 'Noites nesta época do ano:',
      hyps: { rained: 'Choveu', dry: 'Ficou seco' },
      clues: {
        'wet-grass': { label: 'Grama molhada', seen: 'A grama está molhada (o orvalho também a molha).', notSeen: 'A grama está seca.' },
        gauge: { label: 'Água no pluviômetro', seen: 'Há água no pluviômetro.', notSeen: 'O pluviômetro está vazio.' },
        puddle: { label: 'Poça junto ao portão', seen: 'Há uma poça junto ao portão.', notSeen: 'Não há poça junto ao portão.' },
        'snails-out': { label: 'Caracóis no caminho', seen: 'Há caracóis no caminho.', notSeen: 'Não há caracóis no caminho.' },
        wind: { label: 'Folhas na mesa', seen: 'O vento levou folhas para a mesa — ventou de qualquer forma.', notSeen: 'O vento levou folhas para a mesa — ventou de qualquer forma.' }
      }
    },
    'c-bird': {
      title: 'Que pássaro estava no comedouro?',
      story: 'Você viu só de relance um passarinho marrom no comedouro antes que ele voasse. As proporções são inventadas para este comedouro; as reais variam de lugar para lugar.',
      lead: 'Os pequenos visitantes marrons deste comedouro são:',
      hyps: { finch: 'Um tentilhão', sparrow: 'Um pardal' },
      clues: {
        'red-patch': { label: 'Um lampejo vermelho', seen: 'Você viu um lampejo vermelho na cabeça dele.', notSeen: 'Você não viu nada vermelho.' },
        ground: { label: 'Comeu no chão', seen: 'Ele comeu no chão, sob o comedouro.', notSeen: 'Ele comeu no próprio comedouro.' },
        song: { label: 'Um canto gorjeado', seen: 'Ele soltou um canto gorjeado.', notSeen: 'Ele só piou.' },
        group: { label: 'Veio em bando', seen: 'Ele veio com um pequeno bando.', notSeen: 'Ele veio sozinho.' },
        morning: { label: 'De manhã', seen: 'Era cedo pela manhã — os dois vêm nesse horário.', notSeen: 'Era cedo pela manhã — os dois vêm nesse horário.' }
      }
    },
    'c-plant': {
      title: 'A planta murcha',
      story: 'A planta do escritório está murcha e com folhas amarelas. Neste escritório, costuma ser uma de duas coisas.',
      lead: 'Quando as plantas daqui murcham, a causa é:',
      hyps: { water: 'Água demais', light: 'Pouca luz' },
      clues: {
        'wet-soil': { label: 'Terra molhada', seen: 'A terra ainda está molhada dois dias depois da rega.', notSeen: 'A terra está seca.' },
        leaning: { label: 'Inclinada para a janela', seen: 'Ela se inclina para a janela.', notSeen: 'Ela está reta.' },
        'soft-stem': { label: 'Base do caule mole', seen: 'A base do caule está mole.', notSeen: 'O caule está firme.' },
        'pale-new': { label: 'Folhas novas pálidas', seen: 'As folhas novas estão pálidas e pequenas.', notSeen: 'As folhas novas parecem saudáveis.' },
        'pot-colour': { label: 'Um vaso azul', seen: 'Ela está num vaso azul — isso não muda nada.', notSeen: 'Ela está num vaso azul — isso não muda nada.' }
      }
    },
    'c-bus': {
      title: 'Por que o ônibus atrasou?',
      story: 'Seu ônibus chegou quarenta minutos atrasado hoje de manhã.',
      lead: 'Quando este ônibus atrasa muito, o motivo é:',
      hyps: { jam: 'Um engarrafamento', breakdown: 'Uma pane' },
      clues: {
        'others-late': { label: 'Outros ônibus também atrasados', seen: 'Outros ônibus na mesma via também estavam atrasados.', notSeen: 'Os outros ônibus da via estavam no horário.' },
        replacement: { label: 'Veio outro ônibus', seen: 'Veio um ônibus diferente do de sempre.', notSeen: 'Veio o ônibus de sempre.' },
        announcement: { label: 'Um aviso', seen: 'O painel dizia: atraso por falha técnica.', notSeen: 'O painel não deu motivo.' },
        'rush-hour': { label: 'Na hora do rush', seen: 'Era hora do rush.', notSeen: 'Era um horário tranquilo do dia.' },
        rain: { label: 'Estava chovendo', seen: 'Estava chovendo — neste ponto isso não faz diferença.', notSeen: 'Estava chovendo — neste ponto isso não faz diferença.' }
      }
    }
  },
checks: {
    'k-picnic': {
      title: 'Ao ar livre ou no salão?',
      story: 'O piquenique do bairro é hoje à tarde. Você pode fazê-lo no gramado ou reservar o salão comunitário.',
      lead: 'As tardes nesta época do ano são:',
      hyps: { dry: 'Secas', rain: 'Chuvosas' },
      question: 'Qual a probabilidade de uma tarde seca?',
      options: { outdoors: 'Piquenique no gramado', hall: 'Reservar o salão', tent: 'Montar uma tenda no gramado' },
      checks: {
        sky: { label: 'Olhar o céu ao meio-dia', yes: 'Nuvens escuras ao meio-dia.', no: 'Sem nuvens escuras ao meio-dia.' },
        barometer: { label: 'Olhar o barômetro', yes: 'O barômetro está caindo.', no: 'O barômetro está estável.' },
        farmer: { label: 'Perguntar ao agricultor vizinho', yes: 'O agricultor espera chuva.', no: 'O agricultor espera uma tarde seca.' },
        service: { label: 'Ligar para o serviço de meteorologia', yes: 'O serviço de meteorologia avisa de chuva.', no: 'O serviço de meteorologia não dá aviso.' },
        swallows: { label: 'Observar as andorinhas', yes: 'As andorinhas voam baixo.', no: 'As andorinhas voam alto.' }
      }
    },
    'k-bike': {
      title: 'Comprar a bicicleta usada?',
      story: 'Uma bicicleta usada está à venda por um bom preço. Bicicletas assim costumam estar boas, mas algumas têm danos escondidos.',
      lead: 'Bicicletas usadas como esta estão:',
      hyps: { sound: 'Em bom estado', damaged: 'Com dano escondido' },
      question: 'Qual a probabilidade de a bicicleta estar em bom estado?',
      options: { buy: 'Comprar', skip: 'Deixar', 'offer-less': 'Oferecer menos e correr o risco' },
      checks: {
        ride: { label: 'Fazer um teste', yes: 'O teste é suave.', no: 'O teste é trepidante.' },
        chain: { label: 'Olhar a corrente', yes: 'A corrente está enferrujada.', no: 'A corrente está limpa.' },
        receipts: { label: 'Pedir notas de conserto', yes: 'O vendedor tem notas de conserto.', no: 'O vendedor não tem notas.' },
        mechanic: { label: 'Pagar um mecânico para olhar', yes: 'O mecânico encontra um problema.', no: 'O mecânico não encontra nada.' },
        'seller-says': { label: 'Perguntar ao vendedor', yes: 'O vendedor diz que está boa.', no: 'O vendedor não tem certeza.' }
      }
    },
    'k-seeds': {
      title: 'Plantar as sementes velhas?',
      story: 'Um pacote de sementes esquecido apareceu no galpão. Plantá-las toma um fim de semana; sementes novas custam um pouco.',
      lead: 'Pacotes esquecidos como este estão:',
      hyps: { good: 'Ainda bons', dead: 'Quase todas mortas' },
      question: 'Qual a probabilidade de as sementes ainda estarem boas?',
      options: { sow: 'Plantar as sementes velhas', fresh: 'Comprar sementes novas' },
      checks: {
        float: { label: 'Pôr algumas na água', yes: 'A maioria afunda.', no: 'A maioria boia.' },
        sprout: { label: 'Testar algumas num pano úmido', yes: 'A maioria germina.', no: 'Poucas germinam.' },
        date: { label: 'Ler a data do pacote', yes: 'A data é recente.', no: 'A data é antiga.' },
        shrivelled: { label: 'Olhar as sementes de perto', yes: 'As sementes parecem murchas.', no: 'As sementes parecem cheias.' },
        smell: { label: 'Cheirá-las', yes: 'Têm cheiro de fresco.', no: 'Têm cheiro de mofo.' }
      }
    },
    'k-melon': {
      title: 'Comprar este melão?',
      story: 'Na feira, sobrou um melão por um bom preço.',
      lead: 'Os melões que sobram a esta hora nesta barraca estão:',
      hyps: { ripe: 'Maduros', unripe: 'Ainda verdes' },
      question: 'Qual a probabilidade de o melão estar maduro?',
      options: { buy: 'Comprar', leave: 'Deixar' },
      checks: {
        knock: { label: 'Dar batidinhas', yes: 'Soa oco.', no: 'Soa abafado.' },
        smell: { label: 'Cheirá-lo', yes: 'Tem cheiro doce.', no: 'Quase não tem cheiro.' },
        'soft-end': { label: 'Apertar a ponta', yes: 'A ponta cede um pouco.', no: 'A ponta está dura.' },
        taste: { label: 'Provar uma fatia da mesma caixa', yes: 'A fatia é doce.', no: 'A fatia é sem graça.' },
        sticker: { label: 'Ler a etiqueta', yes: 'Tem uma etiqueta de “maduro”.', no: 'Não tem etiqueta.' }
      }
    },
    'k-bread': {
      title: 'Assar a mais para a feira?',
      story: 'Amanhã é dia de feira. Pão a mais vende bem num dia cheio, mas fica velho num dia calmo.',
      lead: 'Os dias de feira aqui são:',
      hyps: { busy: 'Cheios', quiet: 'Calmos' },
      question: 'Qual a probabilidade de um dia de feira cheio?',
      options: { extra: 'Assar muito a mais', normal: 'Assar a quantidade de sempre', 'little-extra': 'Assar um pouco a mais' },
      checks: {
        calendar: { label: 'Ver a agenda da cidade', yes: 'A agenda anuncia um evento.', no: 'A agenda não anuncia nada.' },
        neighbour: { label: 'Perguntar à barraca de queijos', yes: 'A barraca de queijos espera muita gente.', no: 'A barraca de queijos espera um dia calmo.' },
        sunny: { label: 'Ler a previsão', yes: 'Há sol previsto.', no: 'Há nuvens previstas.' },
        office: { label: 'Ligar para o escritório da feira', yes: 'O escritório da feira espera muitos visitantes.', no: 'O escritório da feira espera o de sempre.' },
        'last-week': { label: 'Pensar na semana passada', yes: 'A semana passada foi cheia.', no: 'A semana passada foi calma.' }
      }
    },
    'k-laptop': {
      title: 'Consertar você mesmo?',
      story: 'O notebook desliga ao acaso. Um conserto em casa sai barato se o defeito for pequeno, mas é esforço perdido se for grande.',
      lead: 'Defeitos como este são:',
      hyps: { minor: 'Um defeito pequeno', major: 'Um defeito grande' },
      question: 'Qual a probabilidade de um defeito pequeno?',
      options: { repair: 'Consertar em casa', shop: 'Levar a uma assistência', wait: 'Esperar e observar' },
      checks: {
        'error-code': { label: 'Reiniciar e observar', yes: 'Aparece um código de erro.', no: 'Não aparece código de erro.' },
        diagnostics: { label: 'Rodar a ferramenta de diagnóstico', yes: 'A ferramenta aponta uma falha.', no: 'A ferramenta não aponta nada.' },
        cable: { label: 'Trocar o cabo de energia', yes: 'Com outro cabo funciona.', no: 'Continua desligando.' },
        fan: { label: 'Escutar a ventoinha', yes: 'A ventoinha faz um ruído de atrito.', no: 'A ventoinha soa normal.' },
        forum: { label: 'Ler o fórum', yes: 'Outros com este modelo dizem que era algo pequeno.', no: 'Outros com este modelo relatam causas variadas.' }
      }
    }
  },
  traps: {
    't-sensor': {
      title: 'O sensor de postes',
      story: 'A prefeitura verifica seus postes de luz antigos com um sensor. De todos os postes, {f} estão realmente com defeito. O sensor aponta {s} dos postes com defeito, mas também aponta por engano {q} dos que funcionam. O poste {lamp} acabou de ser apontado.',
      questions: { q1: 'É mais provável que o poste {lamp} esteja com defeito ou funcionando?', q2: 'Qual a probabilidade de o poste {lamp} estar com defeito?' },
      options: { faulty: 'Mais provável com defeito', working: 'Mais provável funcionando' },
      explain: 'Conte os postes apontados: {k} dos {n} postes apontados estão realmente com defeito, então a probabilidade é {p}. Se dá para confiar num alerta depende de quão raros são os postes com defeito, não só de quão bom é o sensor.',
      labels: { faulty: 'Postes com defeito', working: 'Postes funcionando', fit: 'apontados' }
    },
    't-wheel': {
      title: 'A roleta',
      story: 'Uma roleta justa tem {k} setores iguais, e {r} deles mostram uma estrela. Os últimos {s} giros erraram a estrela.',
      questions: { q1: 'No próximo giro, uma estrela é…', q2: 'Qual a probabilidade de uma estrela no próximo giro?' },
      options: { more: 'mais provável que o normal', less: 'menos provável que o normal', same: 'tão provável quanto sempre' },
      explain: 'A roleta não tem memória: cada giro começa do zero, então a estrela continua saindo {p} das vezes.',
      labels: { spins: 'Os giros errados e o próximo' }
    },
    't-sequence': {
      title: 'Qual resultado é mais provável?',
      story: 'Uma moeda justa é lançada {n} vezes (● cara, ○ coroa). Dois resultados possíveis: A {a} e B {b}.',
      questions: { q1: 'Qual resultado exato é mais provável?', q2: 'Qual a probabilidade de exatamente o resultado B?' },
      options: { a: 'A', b: 'B', same: 'Os dois são igualmente prováveis' },
      explain: 'Há {total} resultados possíveis, e cada resultado exato tem a mesma chance, {p}. B só parece mais típico porque os resultados misturados, como grupo, são comuns.',
      labels: { a: 'A', b: 'B' }
    },
    't-conjunction': {
      title: 'Chuva e vento',
      story: 'A previsão de amanhã dá à chuva uma chance de {a}. Aqui, nos dias de chuva venta {b} das vezes; nos dias secos, {w} das vezes.',
      questions: { q1: 'O que é mais provável amanhã?', q2: 'Qual a probabilidade de um dia com chuva e vento?' },
      options: { windy: 'Um dia com vento', both: 'Um dia com chuva e vento', same: 'Os dois iguais' },
      explain: 'Imagine {days} dias como amanhã: {both} têm chuva e vento, mas {windy} têm vento no total. Todo dia com chuva e vento é também um dia com vento, então “chuva e vento” nunca pode ser mais provável que “vento”.',
      labels: { windy: 'Com vento', calm: 'Sem vento', rainy: 'Dias de chuva', dry: 'Dias secos' }
    },
    't-simpson': {
      title: 'As duas transportadoras',
      story: 'Duas transportadoras informam quantas vezes chegaram no horário no mês passado. Transportadora A: rotas curtas {aSk} de {aSn}, rotas longas {aLk} de {aLn}. Transportadora B: rotas curtas {bSk} de {bSn}, rotas longas {bLk} de {bLn}.',
      questions: { q1: 'Qual transportadora chegou no horário mais vezes no total?', q2: 'Sua encomenda vai por uma rota longa. Qual transportadora tem o melhor histórico em rotas longas?' },
      options: { a: 'A transportadora A', b: 'A transportadora B', same: 'As duas iguais' },
      explain: 'A é melhor nas rotas curtas e nas longas, e mesmo assim B é melhor no total ({b} contra {a} entregas no horário), porque B faz sobretudo as rotas curtas, mais fáceis. Compare o que é comparável.',
      labels: { a: 'Transportadora A', b: 'Transportadora B', short: 'Rotas curtas', long: 'Rotas longas', overall: 'No total' }
    },
    't-paw': {
      title: 'A pegada na farinha',
      story: 'Durante a noite, alguém pisou na farinha do chão da padaria. A pegada combina com o gato dos vizinhos. Só {r} gatos têm uma pegada assim. Cerca de {n} gatos moram perto o bastante para ter entrado.',
      questions: { q1: '“Só {r}” significa que foi quase certamente o gato dos vizinhos?', q2: 'Qual a probabilidade de ter sido o gato dos vizinhos? Suponha que todo gato próximo tinha a mesma chance de entrar.' },
      options: { yes: 'Sim, com uns {sure} de certeza', no: 'Não, com bem menos certeza' },
      explain: 'Entre os {n} gatos próximos, uns {others} outros também têm uma pegada que combina. O gato dos vizinhos é só um entre vários que se encaixam: {p}.',
      labels: { neighbour: 'Noites em que o gato dos vizinhos entrou', others: 'Noites em que outro gato entrou', fit: 'a pegada combina' }
    },
    't-bakery': {
      title: 'A padaria pequena e a grande',
      story: 'Duas padarias vendem pão de centeio e de trigo. Em média, metade dos pães vendidos é de centeio, e cada pão é uma escolha separada. A padaria pequena vende {n1} pães por dia; a grande, {n2}.',
      questions: { q1: 'Qual padaria tem mais dias em que mais de {t} dos pães vendidos são de centeio?', q2: 'Em que parte dos dias a padaria pequena vende mais de {t} de centeio?' },
      options: { small: 'A padaria pequena', large: 'A padaria grande', same: 'Mais ou menos igual' },
      explain: 'Amostras pequenas oscilam mais. A padaria pequena tem dias assim {small} das vezes; a grande, só {large}.',
      labels: { small: 'Padaria pequena', large: 'Padaria grande' }
    },
    't-drawers': {
      title: 'O zelador que sabe',
      story: 'Uma de {n} gavetas fechadas guarda a chave. Você aponta uma gaveta. O zelador, que sabe onde está a chave, abre então {opened} das outras gavetas, todas vazias, e deixa exatamente outra fechada. Ele sempre faz assim e nunca abre a sua.',
      questions: { q1: 'Ficar com a sua gaveta ou trocar pela outra fechada?', q2: 'Qual a probabilidade de a chave estar na outra gaveta fechada?' },
      options: { switch: 'Trocar', keep: 'Ficar com a minha', same: 'Tanto faz' },
      explain: 'Imagine {total} partidas. Sua primeira escolha acerta só numa parte delas. Nas outras {wins}, o zelador precisa deixar fechada a gaveta da chave, então trocar ganha: {p}.',
      labels: { right: 'Partidas em que sua primeira escolha tem a chave', wrong: 'Partidas em que não tem', fit: 'trocar ganha' }
    },
    't-week': {
      title: 'Pelo menos um dia de chuva',
      story: 'Você planeja uma viagem de {m} dias. Cada dia tem uma chance de chuva de {q}, independente dos outros dias.',
      questions: { q1: 'Qual a probabilidade de pelo menos um dia de chuva?' },
      options: {},
      explain: 'Somar as chances daria {sum}, e isso não pode estar certo. Multiplique as chances de um dia seco: nenhuma chuva tem uma chance de {none}, então pelo menos um dia de chuva tem {p}.',
      labels: { step: 'Ainda seco depois do dia {n}' }
    },
    't-numbers': {
      title: 'O mesmo número duas vezes',
      story: 'Cada uma de {g} pessoas escolhe em segredo, ao acaso, um número inteiro de um a {r}.',
      questions: { q1: 'Qual a probabilidade de pelo menos duas escolherem o mesmo número? Primeiro sua intuição:', q2: 'Agora sua estimativa: qual a probabilidade de pelo menos um número repetido?' },
      options: { low: 'Menos de uma em quatro', even: 'Mais ou menos meio a meio', high: 'Mais de três em quatro' },
      explain: 'Com {g} pessoas há {pairs} pares que podem coincidir, então uma coincidência chega mais cedo do que parece: {p}.',
      labels: { step: 'Todos diferentes entre os primeiros {n}' }
    },
    't-tyres': {
      title: 'Metade dos furos',
      story: 'Um novo tipo de pneu reduz os furos de {b} para {a} a cada cem viagens. O fabricante chama isso de {rel} menos furos.',
      questions: { q1: 'Em {rides} viagens, quantos furos a menos?' },
      options: {},
      explain: 'Em {rides} viagens há {old} furos antes e {new} depois: {fewer} a menos. “{rel} menos” parece muito; o que você percebe é a mudança absoluta.',
      labels: { old: 'Pneus antigos', new: 'Pneus novos', fit: 'furos' }
    },
    't-dice': {
      title: 'Dois dados',
      story: 'Você joga dois dados comuns e soma os pontos.',
      questions: { q1: 'Qual soma é mais provável: {s1} ou {s2}?', q2: 'Qual a probabilidade da soma {s1}?' },
      options: { first: '{s1}', second: '{s2}', same: 'Igualmente prováveis' },
      explain: 'Dos trinta e seis resultados igualmente prováveis, {c1} dão {s1} e {c2} dão {s2}.',
      labels: {}
    }
  }
};
