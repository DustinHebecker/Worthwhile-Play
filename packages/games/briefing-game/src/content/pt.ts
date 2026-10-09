import type { ContentText } from './types';

export const content: ContentText = {
  supplierDelay: {
    title: 'Atraso de um fornecedor antes de um lançamento',
    situation: 'Sua empresa lança uma nova luminária de mesa em 14 de maio. O fornecedor das cúpulas avisa que vai atrasar. Prepare um briefing.',
    recipient: 'a gerente de produto',
    cards: {
      c1: 'A nova luminária de mesa será lançada em 14 de maio; 350 clientes já fizeram a pré-encomenda.',
      c2: 'O fornecedor só enviou 200 das 500 cúpulas que encomendamos.',
      c3: 'Assim que as peças chegarem, nossa oficina consegue montar 100 luminárias por dia.',
      c4: 'O fornecedor ainda não deu uma data para enviar as cúpulas restantes.',
      c5: 'O fornecedor espera enviar o restante na semana que vem, provavelmente na terça-feira.',
      c6: 'Se as peças chegarem depois de 10 de maio, as luminárias não poderão ser montadas a tempo do lançamento.',
      c7: 'O anúncio do lançamento está reservado para 14 de maio; mudar a data custaria uma taxa de 800 euros.',
      c8: 'O marketing precisa saber até sexta-feira se a data de lançamento se mantém.',
      c9: 'Jonas, do setor de compras, pode ligar para o fornecedor amanhã de manhã e pedir uma data firme.',
      c10: 'O fornecedor mudou-se para um novo prédio de escritórios no ano passado.',
      c11: 'Até agora, só foram enviadas 200 das 500 cúpulas encomendadas.',
      c12: 'Sinceramente, esse fornecedor sempre foi meio desorganizado.'
    },
    decisions: {
      right: 'Manter o lançamento em 14 de maio ou adiá-lo uma semana?',
      notTheirs: 'Qual transportadora o fornecedor deve usar?',
      premature: 'Devemos substituir esse fornecedor para todos os produtos futuros?'
    },
    actions: {
      concrete: 'Jonas liga para o fornecedor amanhã às 9:00 e informa a data confirmada à gerente de produto até as 12:00.',
      vague: 'Alguém deveria ficar de olho no fornecedor.',
      outOfScope: 'Começar a desenhar a coleção de luminárias do ano que vem.'
    }
  },
  basement: {
    title: 'Porão alagado numa casa compartilhada',
    situation: 'Depois de uma chuva forte, há água parada no porão da casa que você divide com outras pessoas. Prepare um briefing.',
    recipient: 'o proprietário',
    cards: {
      c1: 'Cinco pessoas dividem a casa; no porão ficam a caldeira e as caixas de todos.',
      c2: 'Hoje de manhã havia cerca de 10 cm de água no porão.',
      c3: 'Hoje de manhã desligamos a energia do porão por precaução.',
      c4: 'Ninguém sabe ainda se a caldeira foi danificada.',
      c5: 'A água provavelmente parou de subir; ao meio-dia parecia igual à manhã.',
      c6: 'Há previsão de mais chuva para quinta-feira, e a água pode voltar a subir.',
      c7: 'A caldeira fica a 15 cm do chão, então mais alguns centímetros de água chegariam até ela.',
      c8: 'O encanador só pode vir esta semana se o proprietário aprovar a taxa de visita até amanhã.',
      c9: 'Uma moradora que trabalha de casa poderia abrir a porta para o encanador na quarta-feira.',
      c10: 'As paredes do porão foram pintadas pela última vez em 2015.',
      c11: 'Quando olhamos hoje de manhã, o porão estava com 10 cm de água.',
      c12: 'Esta casa sempre foi úmida, e ninguém nunca faz nada.'
    },
    decisions: {
      right: 'Aprovar a taxa de visita do encanador para esta semana?',
      notTheirs: 'Qual morador deve tirar suas caixas primeiro?',
      premature: 'O porão inteiro deve ser impermeabilizado e reformado?'
    },
    actions: {
      concrete: 'A moradora que trabalha de casa agenda o encanador para quarta-feira e envia hoje o orçamento ao proprietário.',
      vague: 'A gente resolve isso uma hora dessas.',
      outOfScope: 'Planejar uma festa em casa para animar todo mundo.'
    }
  },
  schoolTrip: {
    title: 'Passeio escolar e alerta meteorológico',
    situation: 'Uma turma de 24 alunos vai fazer uma caminhada nas colinas na sexta-feira. Foi emitido um alerta meteorológico. Prepare um briefing.',
    recipient: 'a diretora da escola',
    cards: {
      c1: 'A turma de 24 alunos de 11 anos está inscrita para uma caminhada na sexta-feira, com três adultos acompanhantes.',
      c2: 'O serviço meteorológico emitiu um alerta de tempestade para a tarde de sexta-feira.',
      c3: 'O museu de ciências da cidade ainda tem vaga para a visita de uma turma na sexta-feira.',
      c4: 'A previsão ainda não diz se a tempestade chega antes ou depois do meio-dia.',
      c5: 'O guarda do parque acha que a trilha principal muito provavelmente continuará aberta.',
      c6: 'Ventos fortes podem derrubar galhos na trilha da floresta.',
      c7: 'O único abrigo do percurso fica a 40 minutos a pé do fim da trilha, longe demais para chegar rápido numa tempestade.',
      c8: 'É preciso avisar a empresa de ônibus até quarta à noite se o passeio vai acontecer; até lá o cancelamento é gratuito.',
      c9: 'A professora da turma pode consultar a previsão atualizada na quarta ao meio-dia.',
      c10: 'A turma votou pela caminhada ainda em setembro.',
      c11: 'Segundo o serviço meteorológico, espera-se uma tempestade na tarde de sexta-feira.',
      c12: 'As crianças vão ficar muito decepcionadas se cancelarmos.'
    },
    decisions: {
      right: 'Fazer a caminhada, trocar pelo museu ou cancelar o passeio?',
      notTheirs: 'O que os alunos devem levar para o almoço?',
      premature: 'A escola deveria cancelar de agora em diante todos os passeios ao ar livre?'
    },
    actions: {
      concrete: 'A professora consulta a previsão na quarta às 12:00 e envia uma recomendação à diretora até as 14:00.',
      vague: 'Vamos ver como fica o tempo.',
      outOfScope: 'Começar a organizar a festa da escola do ano que vem.'
    }
  },
  volunteers: {
    title: 'Mutirão de limpeza com poucos voluntários',
    situation: 'A associação de moradores do seu bairro faz no sábado uma limpeza do parque. Poucos voluntários se inscreveram. Prepare um briefing.',
    recipient: 'a presidente da associação',
    cards: {
      c1: 'A limpeza anual do parque é no sábado, das 10:00 às 13:00; a prefeitura fornece sacos e luvas.',
      c2: 'Até agora 9 voluntários se inscreveram; tínhamos planejado 20.',
      c3: 'A prefeitura só recolhe os sacos cheios no sábado às 13:00.',
      c4: 'O time juvenil de futebol talvez mande ajudantes, mas o técnico ainda não respondeu.',
      c5: 'Alguns vizinhos disseram que provavelmente vão aparecer se fizer tempo bom.',
      c6: 'Com 9 pessoas, só conseguimos limpar mais ou menos metade do parque.',
      c7: 'Ninguém foi designado ainda para buscar as luvas no centro comunitário, que fecha às 9:30 no sábado.',
      c8: 'Podemos reduzir a limpeza à área do parquinho ou passá-la para o sábado seguinte.',
      c9: 'Dois voluntários se ofereceram para colar cartazes no bairro amanhã.',
      c10: 'A limpeza do ano passado terminou com um churrasco.',
      c11: 'Só 9 dos 20 voluntários previstos se inscreveram.',
      c12: 'As pessoas simplesmente não ligam mais para o próprio bairro.'
    },
    decisions: {
      right: 'Fazer uma limpeza menor neste sábado ou adiá-la uma semana?',
      notTheirs: 'A prefeitura deve mudar o horário de coleta dos sacos?',
      premature: 'A associação deve contratar uma empresa de limpeza nos próximos anos?'
    },
    actions: {
      concrete: 'Os dois voluntários colam os cartazes amanhã, e o secretário escreve hoje para o técnico de futebol e dá um retorno até quinta-feira.',
      vague: 'Precisamos arranjar mais gente de algum jeito.',
      outOfScope: 'Começar a planejar a festa de verão da associação.'
    }
  },
  release: {
    title: 'Lançamento de software com um teste falhando',
    situation: 'Sua equipe quer publicar na terça-feira uma nova versão de um aplicativo de reservas. Um teste automatizado falha. Prepare um briefing.',
    recipient: 'o gerente de produto',
    cards: {
      c1: 'A nova versão acrescenta pagamento on-line e já foi anunciada aos clientes para terça-feira.',
      c2: 'Um de 640 testes automatizados falha: o reembolso de uma reserva cancelada.',
      c3: 'A falha só aparece em pagamentos em moeda estrangeira.',
      c4: 'Ainda não sabemos se o erro está no nosso código ou no sistema de testes do provedor de pagamento.',
      c5: 'O desenvolvedor estima que a correção leve cerca de um dia, mas ainda não olhou o código.',
      c6: 'Se o erro for real, alguns clientes podem receber um reembolso com valor errado.',
      c7: 'Cerca de 15% das reservas são pagas em moeda estrangeira, então o erro afetaria muitos clientes.',
      c8: 'Podemos publicar na terça com pagamentos em moeda estrangeira desativados ou adiar toda a versão.',
      c9: 'O desenvolvedor pode verificar hoje à tarde os registros de teste do provedor de pagamento.',
      c10: 'A nova tela de pagamento usa o novo tom de azul da empresa.',
      c11: 'Só um teste está vermelho: reembolsos de reservas canceladas.',
      c12: 'Esse teste sempre foi instável; eu simplesmente o ignoraria.'
    },
    decisions: {
      right: 'Publicar na terça sem pagamentos em moeda estrangeira ou adiar a versão?',
      notTheirs: 'Que técnica de programação o desenvolvedor deve usar na correção?',
      premature: 'Devemos trocar de provedor de pagamento?'
    },
    actions: {
      concrete: 'O desenvolvedor verifica hoje à tarde os registros do provedor e diz ao gerente de produto até as 17:00 se o erro é nosso.',
      vague: 'Alguém vai dar uma olhada no teste.',
      outOfScope: 'Começar a escrever as notas de versão da versão depois da próxima.'
    }
  },
  careAppointment: {
    title: 'Uma consulta de orientação sobre cuidados para a avó',
    situation: 'Sua avó tem na segunda-feira uma consulta num serviço de orientação sobre cuidados. A família precisa combinar quem vai com ela. Prepare um briefing. (Trata-se de organização, não de questões médicas.)',
    recipient: 'seu irmão, que divide a decisão com você',
    cards: {
      c1: 'A avó tem consulta no serviço de orientação na segunda-feira às 10:00 para falar sobre ajuda em casa.',
      c2: 'Ela pediu que um membro da família a acompanhe.',
      c3: 'A carta diz para levar a lista de remédios e a carteirinha do plano de saúde.',
      c4: 'Ainda não se sabe se a mãe consegue folga na segunda-feira.',
      c5: 'Dizem que o centro tem elevador, mas ninguém confirmou.',
      c6: 'Se ninguém puder ir, a próxima vaga é só daqui a seis semanas.',
      c7: 'A avó se cansa rápido, e a viagem de ônibus até o centro leva 50 minutos cada trecho.',
      c8: 'O serviço precisa saber até sexta-feira se a consulta será presencial ou por videochamada.',
      c9: 'Você poderia ligar para a mãe hoje à noite e perguntar sobre segunda-feira.',
      c10: 'A vizinha da avó arranjou um cachorro novo há pouco tempo.',
      c11: 'Ela gostaria que alguém da família fosse com ela.',
      c12: 'Na minha opinião, esses serviços de orientação nunca ajudam de verdade.'
    },
    decisions: {
      right: 'Quem acompanha a avó na segunda-feira, e presencialmente ou por vídeo?',
      notTheirs: 'Que tipo de ajuda em casa a avó deve receber?',
      premature: 'A avó deveria se mudar para uma casa de repouso?'
    },
    actions: {
      concrete: 'Você liga para a mãe hoje à noite e diz ao seu irmão até quarta à noite quem pode ir.',
      vague: 'A gente dá um jeito.',
      outOfScope: 'Começar a planejar a festa de aniversário da avó.'
    }
  },
  cafeFreezer: {
    title: 'Freezer quebrado num pequeno café',
    situation: 'Você trabalha num pequeno café. Hoje de manhã o freezer não estava gelando o suficiente. A dona está fora até amanhã. Prepare um briefing.',
    recipient: 'a dona do café',
    cards: {
      c1: 'O café vende sorvete caseiro; o freezer guarda o estoque de mais ou menos uma semana.',
      c2: 'Às 7:00 o freezer marcava −2 °C em vez dos −18 °C de sempre.',
      c3: 'Às 7:30 levamos o sorvete para o freezer da padaria ao lado.',
      c4: 'Não sabemos se o sorvete descongelou durante a noite.',
      c5: 'A assistência técnica provavelmente vai poder vir na quinta-feira.',
      c6: 'Sorvete que descongelou não pode ser vendido, então talvez tenhamos de jogar o estoque fora.',
      c7: 'A padaria precisa do espaço de volta no sábado, então nosso sorvete só pode ficar lá até lá.',
      c8: 'A assistência técnica só marca a visita depois que a dona aprovar a taxa de 90 euros.',
      c9: 'A barista pode ler hoje à tarde o registro de temperatura do freezer.',
      c10: 'Os novos quadros de cardápio do café chegam na semana que vem.',
      c11: 'Hoje de manhã o freezer indicava −2 °C em vez de −18 °C.',
      c12: 'Esse freezer foi uma péssima compra desde o primeiro dia.'
    },
    decisions: {
      right: 'Aprovar a taxa de visita de 90 euros para o conserto?',
      notTheirs: 'Que bolos a padaria deve vender esta semana?',
      premature: 'O café deveria parar de vender sorvete de vez?'
    },
    actions: {
      concrete: 'A barista lê o registro de temperatura hoje à tarde e manda o resultado para a dona por mensagem até as 16:00.',
      vague: 'A gente fica de olho.',
      outOfScope: 'Redesenhar o site do café.'
    }
  },
  tournament: {
    title: 'Novo local para um torneio de xadrez',
    situation: 'Seu clube de xadrez organiza no domingo um torneio juvenil. O salão da escola que vocês reservaram não está mais disponível. Prepare um briefing.',
    recipient: 'a diretoria do clube',
    cards: {
      c1: 'O torneio juvenil de domingo tem 48 jogadores inscritos de seis clubes.',
      c2: 'A escola cancelou nossa reserva do salão por causa de uma goteira no telhado.',
      c3: 'A biblioteca municipal oferece sua sala de eventos de graça, mas ela só comporta 32 jogadores.',
      c4: 'O centro esportivo talvez tenha uma sala livre, mas ainda não respondeu ao nosso e-mail.',
      c5: 'O zelador acredita que o salão poderia ser consertado a tempo, mas ninguém confirmou.',
      c6: 'Se as famílias souberem da mudança tarde demais, alguns jogadores podem ir ao local antigo.',
      c7: 'Várias famílias viajam mais de 100 km e já compraram passagens de trem, então mudar a data as prejudicaria mais.',
      c8: 'Os convites com o local definitivo precisam ser enviados até quarta-feira.',
      c9: 'O secretário do clube pode ligar para o centro esportivo amanhã de manhã.',
      c10: 'A vitrine de troféus do clube foi limpa no mês passado.',
      c11: 'A escola retirou nossa reserva do salão.',
      c12: 'Nunca devíamos ter confiado naquela escola.'
    },
    decisions: {
      right: 'Mudar para outro local, limitar o torneio a 32 jogadores ou adiá-lo?',
      notTheirs: 'Quando a escola deve consertar o telhado?',
      premature: 'O clube deveria construir sua própria sede?'
    },
    actions: {
      concrete: 'O secretário liga para o centro esportivo amanhã às 9:00 e informa a diretoria até as 12:00.',
      vague: 'Vamos esperar para ver o que aparece.',
      outOfScope: 'Encomendar jogos de xadrez novos para o clube.'
    }
  }
};
