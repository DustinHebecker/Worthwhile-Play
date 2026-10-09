import type { ContentText } from './types';

export const content: ContentText = {
  launch: {
    title: 'Novidades sobre o lançamento do app',
    context: 'Um e-mail da gerente de projeto para toda a equipe.',
    sentences: {
      s1: 'Oi, pessoal, espero que vocês tenham tido um ótimo fim de semana de sol.',
      s2: 'O lançamento do nosso app de reservas passa de 2 de abril para 14 de maio.',
      s3: 'O motivo é que o provedor de pagamentos ainda não concluiu a certificação de segurança, e sem ela não podemos receber pagamentos.',
      s4: 'O provedor diz que está com uma fila de pedidos acumulada.',
      s5: 'A equipe de design vai aproveitar as semanas extras para aprimorar as telas de boas-vindas.',
      s6: 'Nossos 300 testadores beta podem continuar usando a versão de teste até o lançamento.',
      s7: 'Um concorrente lançou um app parecido no ano passado e precisou de três tentativas.',
      s8: 'O marketing precisa remarcar a campanha, então, por favor, decidam até sexta-feira o novo início da campanha.',
      s9: 'O orçamento continua o mesmo, porque a agência não cobra nada para remarcar a campanha.',
      s10: 'A certificação em si leva cerca de três semanas depois que começa.',
      s11: 'Obrigada mais uma vez por todo o esforço de vocês!',
      s12: 'Na quarta-feira envio um plano de projeto atualizado.'
    },
    bullets: {
      gold1: 'O lançamento passa de 2 de abril para 14 de maio.',
      gold2: 'Causa: a certificação de segurança do provedor de pagamentos não foi concluída.',
      gold3: 'O marketing precisa decidir o novo início da campanha até sexta-feira.',
      minor: 'A equipe de design vai aprimorar as telas de boas-vindas.',
      distort: 'O app foi reprovado na verificação de segurança.',
      dup: 'O lançamento está atrasado.',
      subtle: 'O lançamento passa de 2 de abril para 4 de maio.'
    },
    bulletNotes: {
      distort: 'O texto diz que a certificação ainda não foi concluída, não que o app foi reprovado em alguma verificação.',
      dup: 'Repete o ponto da nova data sem a data, e assim desperdiça uma vaga.',
      subtle: 'Quase, mas a nova data é 14 de maio, não 4 de maio.'
    },
    summaries: {
      faithful: 'O lançamento passa para 14 de maio porque a certificação do provedor de pagamentos não foi concluída, e o marketing precisa decidir o novo início da campanha até sexta-feira.',
      vague: 'Há algumas mudanças no cronograma do lançamento que a equipe deveria conhecer.',
      drops: 'Como o provedor de pagamentos ainda não está pronto, o lançamento foi adiado, mas o orçamento continua o mesmo.',
      adds: 'O lançamento passa para 14 de maio porque a certificação do provedor de pagamentos não foi concluída, e o atraso vai deixar o projeto mais caro.',
      subtle: 'O lançamento passa para 14 de maio porque nosso app foi reprovado na certificação do provedor de pagamentos, e o marketing precisa decidir o novo início da campanha até sexta-feira.'
    },
    summaryNotes: {
      drops: 'Faltam a nova data e a decisão que o marketing precisa tomar.',
      adds: 'O texto diz que o orçamento continua o mesmo; o aumento de custos foi inventado.',
      subtle: 'O app não foi reprovado em nada: a certificação simplesmente ainda não terminou.'
    },
    task: 'A equipe de marketing precisa agir com base nesta frase.',
    oneLiner: 'Passem o lançamento para maio.',
    details: {
      d1: 'A nova data exata: 14 de maio',
      d2: 'Quem precisa agir: o marketing remarca a campanha',
      d3: 'O prazo: decidir o novo início da campanha até sexta-feira',
      d4: 'Por que o provedor está atrasado',
      d5: 'Os planos da equipe de design para as telas de boas-vindas',
      d6: 'O fim de semana de sol'
    },
    versions: {
      actionable: 'O lançamento passa de 2 de abril para 14 de maio. Marketing: por favor, remarquem a campanha e decidam a nova data de início até sexta-feira. O orçamento continua o mesmo.',
      vague: 'Vamos passar o lançamento para maio. Ajustem os planos de vocês e avisem se surgir alguma coisa.',
      invented: 'O lançamento passa para 1º de maio. Marketing: por favor, cancelem a campanha e planejem uma nova até o fim do mês.'
    },
    versionNote: 'A nova data é 14 de maio, não 1º de maio, e a campanha é remarcada, não cancelada.'
  },
  library: {
    title: 'Reforma da biblioteca',
    context: 'Um aviso na porta da biblioteca do bairro.',
    sentences: {
      s1: 'Muitos de vocês nos contaram o quanto adoram as poltronas antigas do cantinho de leitura.',
      s2: 'A partir de 3 de junho, a biblioteca ficará fechada para reforma por oito semanas.',
      s3: 'O telhado será consertado, e o prédio ganhará um elevador e iluminação nova.',
      s4: 'Durante o fechamento, um ônibus-biblioteca vai parar na praça do mercado todas as terças-feiras.',
      s5: 'O ônibus leva cerca de 2.000 livros e pode encomendar qualquer título da biblioteca central.',
      s6: 'Todos os empréstimos que venceriam durante o fechamento serão renovados automaticamente, então ninguém paga multa.',
      s7: 'Os livros também podem ser devolvidos a qualquer hora na caixa de devolução ao lado da prefeitura.',
      s8: 'A própria prefeitura passou por uma reforma parecida há dez anos.',
      s9: 'Nossos e-books e audiolivros continuam disponíveis on-line, como sempre.',
      s10: 'Já estamos ansiosos pelo festival de leitura de verão do ano que vem.',
      s11: 'A reforma é paga por um fundo regional de obras.'
    },
    bullets: {
      gold1: 'Fechada para reforma por oito semanas a partir de 3 de junho.',
      gold2: 'Um ônibus-biblioteca para na praça do mercado toda terça-feira.',
      gold3: 'Empréstimos que vencem durante o fechamento são renovados automaticamente.',
      minor: 'O prédio vai ganhar iluminação nova.',
      distort: 'Todos os serviços da biblioteca param por oito semanas.',
      dup: 'A biblioteca vai ficar fechada por um tempo.',
      subtle: 'Fechada para reforma por seis semanas a partir de 3 de junho.'
    },
    bulletNotes: {
      distort: 'Não é verdade: o ônibus e a caixa de devolução continuam funcionando durante o fechamento.',
      dup: 'Repete o fechamento sem a data de início e sem a duração.',
      subtle: 'Quase, mas o fechamento dura oito semanas, não seis.'
    },
    summaries: {
      faithful: 'A biblioteca fecha por oito semanas a partir de 3 de junho; enquanto isso, um ônibus vai à praça do mercado toda terça-feira e os empréstimos que vencem são renovados automaticamente.',
      vague: 'Haverá algumas mudanças na biblioteca neste verão, então fiquem atentos.',
      drops: 'A biblioteca vai passar por uma reforma e ganhar telhado consertado, elevador e iluminação nova.',
      adds: 'A biblioteca fecha por oito semanas a partir de 3 de junho e vai cobrar uma pequena taxa pelos empréstimos depois da reabertura.',
      subtle: 'Como o telhado não é seguro, a biblioteca fecha por oito semanas a partir de 3 de junho; enquanto isso, um ônibus vai à praça do mercado toda terça-feira.'
    },
    summaryNotes: {
      drops: 'Descreve a obra, mas não diz quando a biblioteca fecha nem o que os leitores podem fazer enquanto isso.',
      adds: 'O aviso não menciona nenhuma taxa depois da reabertura.',
      subtle: 'O aviso diz que o telhado será consertado, não que é inseguro; essa causa foi acrescentada.'
    },
    task: 'Um vizinho que quer continuar pegando livros emprestados pergunta sobre isso.',
    oneLiner: 'A biblioteca fecha no verão.',
    details: {
      d1: 'Quando exatamente: oito semanas a partir de 3 de junho',
      d2: 'Onde pegar livros enquanto isso: o ônibus na praça do mercado às terças',
      d3: 'Onde devolver: a caixa ao lado da prefeitura',
      d4: 'O que a reforma inclui',
      d5: 'As poltronas do cantinho de leitura',
      d6: 'O festival de leitura do ano que vem'
    },
    versions: {
      actionable: 'A partir de 3 de junho, a biblioteca fica fechada por oito semanas. Você pode pegar livros no ônibus-biblioteca na praça do mercado toda terça-feira e devolvê-los a qualquer hora na caixa ao lado da prefeitura. O que vencer nesse período é renovado automaticamente.',
      vague: 'A biblioteca vai fechar por um tempo no verão por causa de uma obra. Vai ter outras opções, então dá uma olhada no aviso.',
      invented: 'A partir de 3 de junho, a biblioteca fica fechada por oito semanas. Você pode pegar livros no ônibus-biblioteca na estação toda sexta-feira. Devolva todos os livros antes do fechamento.'
    },
    versionNote: 'O ônibus para na praça do mercado às terças, e ninguém precisa devolver livros antes do fechamento.'
  },
  leaves: {
    title: 'Por que as folhas mudam de cor',
    context: 'Um artigo curto de uma revista de natureza para leitores curiosos.',
    sentences: {
      s1: 'O outono é a estação favorita de muita gente para longas caminhadas.',
      s2: 'As folhas são verdes porque contêm muita clorofila, o pigmento que as plantas usam para captar a luz do sol.',
      s3: 'Quando os dias ficam mais curtos, muitas árvores param de produzir clorofila e a decompõem.',
      s4: 'Os pigmentos amarelos e laranja, chamados carotenoides, estavam na folha o tempo todo; só aparecem quando o verde desbota.',
      s5: 'Os carotenoides são o mesmo tipo de pigmento que deixa a cenoura laranja.',
      s6: 'O vermelho é diferente: algumas árvores, como muitos bordos, produzem novos pigmentos vermelhos no outono.',
      s7: 'Os pesquisadores acreditam que esses pigmentos vermelhos talvez protejam a folha da luz forte enquanto a árvore recolhe os nutrientes.',
      s8: 'Dias de sol e noites frescas costumam deixar os vermelhos mais vivos.',
      s9: 'Em algumas regiões, as florestas coloridas atraem muitos turistas todos os anos.',
      s10: 'Por fim, forma-se uma camada fina de células onde a folha se liga ao galho, e a folha cai.',
      s11: 'Não esqueça um casaco quente se sair para ver as árvores.'
    },
    bullets: {
      gold1: 'No outono, as árvores param de produzir clorofila verde e a decompõem.',
      gold2: 'Os pigmentos amarelos e laranja estavam lá o tempo todo e ficam visíveis.',
      gold3: 'Algumas árvores, como os bordos, produzem novos pigmentos vermelhos.',
      minor: 'Forma-se uma camada fina de células e a folha cai.',
      distort: 'Todas as cores do outono são pigmentos novos produzidos pela árvore.',
      dup: 'As folhas perdem a cor verde.',
      subtle: 'Os pigmentos vermelhos protegem a folha da luz forte.'
    },
    bulletNotes: {
      distort: 'Só os vermelhos são novos; o amarelo e o laranja estavam na folha o tempo todo.',
      dup: 'Diz menos que o ponto sobre a clorofila e desperdiça uma vaga.',
      subtle: 'O texto só diz que os pesquisadores acreditam que os pigmentos vermelhos talvez protejam a folha; este tópico afirma isso como fato.'
    },
    summaries: {
      faithful: 'No outono, muitas árvores decompõem a clorofila verde, o que revela pigmentos amarelos e laranja que estavam lá o tempo todo, enquanto algumas árvores também produzem novos pigmentos vermelhos.',
      vague: 'As folhas mudam de cor no outono por causa de vários processos naturais da árvore.',
      drops: 'No outono, as folhas ficam amarelas, laranja e vermelhas, e depois caem das árvores.',
      adds: 'No outono, muitas árvores decompõem a clorofila verde, o que revela pigmentos amarelos e laranja, e quanto mais vermelhas as folhas, mais frio será o inverno.',
      subtle: 'No outono, muitas árvores decompõem a clorofila verde, o que revela pigmentos amarelos e laranja, e as noites frias fazem as árvores produzirem pigmentos vermelhos.'
    },
    summaryNotes: {
      drops: 'Descreve o que vemos, mas não por que acontece.',
      adds: 'O texto não diz nada sobre prever o inverno.',
      subtle: 'As noites frescas só costumam deixar os vermelhos mais vivos; o texto não diz que elas causam os pigmentos vermelhos.'
    },
    task: 'Uma professora quer explicar esta frase para a turma usando folhas de verdade.',
    oneLiner: 'A clorofila se decompõe, e outras cores aparecem.',
    details: {
      d1: 'O que é a clorofila: o pigmento verde que capta a luz do sol',
      d2: 'Que o amarelo e o laranja estavam na folha o tempo todo',
      d3: 'Que algumas árvores, como os bordos, produzem novos pigmentos vermelhos',
      d4: 'Que o outono é uma estação popular para caminhadas',
      d5: 'Que é preciso um casaco quente lá fora',
      d6: 'Como a folha finalmente cai'
    },
    versions: {
      actionable: 'As folhas são verdes por causa da clorofila, um pigmento que capta a luz do sol. No outono, muitas árvores param de produzi-la e a decompõem. Aí aparecem os pigmentos amarelos e laranja que estavam lá o tempo todo, e algumas árvores, como os bordos, produzem novos pigmentos vermelhos.',
      vague: 'No outono as folhas mudam porque o verde vai embora e outras cores aparecem. A natureza é fascinante.',
      invented: 'As folhas são verdes por causa da clorofila. No outono, a geada congela a clorofila, e então a árvore pinta as folhas de amarelo, laranja e vermelho com pigmentos novos.'
    },
    versionNote: 'O texto não diz que a geada congela a clorofila, e só os vermelhos são pigmentos novos.'
  },
  club: {
    title: 'Reunião da diretoria do clube esportivo',
    context: 'A ata de uma reunião da diretoria de um clube esportivo, enviada a todos os sócios.',
    sentences: {
      s1: 'A reunião foi na sede do clube e começou um pouco atrasada por causa de um jogo de futebol.',
      s2: 'A diretoria propõe aumentar a anuidade de 60 para 66 euros a partir do próximo janeiro.',
      s3: 'O motivo é que o aluguel do ginásio subiu 15 por cento.',
      s4: 'A anuidade não muda há oito anos.',
      s5: 'Sócios com menos de 18 anos continuarão pagando o valor antigo.',
      s6: 'Os sócios vão votar a proposta na assembleia geral de 12 de março.',
      s7: 'A diretoria também discutiu redes novas para as quadras de tênis, mas adiou a decisão.',
      s8: 'Se a proposta for rejeitada, a diretoria vai estudar cortar alguns horários de treino.',
      s9: 'Um clube vizinho também aumentou a anuidade recentemente, para 75 euros.',
      s10: 'O ginásio pertence à prefeitura, que define o aluguel.',
      s11: 'Muito obrigado à equipe juvenil pelos bolos deliciosos!'
    },
    bullets: {
      gold1: 'Proposta: a anuidade sobe de 60 para 66 euros a partir de janeiro.',
      gold2: 'Sócios com menos de 18 anos continuam pagando o valor antigo.',
      gold3: 'Os sócios votam na assembleia geral de 12 de março.',
      minor: 'Discutiram redes novas para as quadras de tênis.',
      distort: 'A diretoria decidiu aumentar a anuidade.',
      dup: 'A anuidade pode subir.',
      subtle: 'Proposta: a anuidade sobe de 60 para 76 euros a partir de janeiro.'
    },
    bulletNotes: {
      distort: 'Nada foi decidido ainda: é uma proposta, e os sócios votam.',
      dup: 'Uma repetição mais vaga do ponto da anuidade, sem os valores.',
      subtle: 'Quase, mas a anuidade proposta é de 66 euros, não 76.'
    },
    summaries: {
      faithful: 'Como o aluguel do ginásio subiu, a diretoria propõe aumentar a anuidade de 60 para 66 euros a partir de janeiro, exceto para menores de 18 anos, e os sócios votam em 12 de março.',
      vague: 'A diretoria falou sobre questões de dinheiro e algumas mudanças para os sócios.',
      drops: 'Como o aluguel do ginásio subiu, as finanças do clube foram o principal assunto da reunião da diretoria.',
      adds: 'A diretoria propõe aumentar a anuidade de 60 para 66 euros a partir de janeiro, e quem não pagar até março perde a condição de sócio.',
      subtle: 'Como o aluguel do ginásio subiu, a diretoria decidiu aumentar a anuidade de 60 para 66 euros a partir de janeiro, exceto para menores de 18 anos.'
    },
    summaryNotes: {
      drops: 'Faltam a nova anuidade proposta e a votação de 12 de março.',
      adds: 'A ata não diz nada sobre perder a condição de sócio.',
      subtle: 'É só uma proposta que os sócios ainda vão votar, então “decidiu” está errado.'
    },
    task: 'Um sócio pergunta o que isso significa para ele.',
    oneLiner: 'A anuidade vai subir.',
    details: {
      d1: 'Os valores: de 60 para 66 euros por ano',
      d2: 'Que é uma proposta, votada na assembleia de 12 de março',
      d3: 'Que sócios com menos de 18 anos mantêm o valor antigo',
      d4: 'Que a reunião começou atrasada',
      d5: 'Os bolos da equipe juvenil',
      d6: 'A conversa sobre as redes de tênis'
    },
    versions: {
      actionable: 'A diretoria propõe aumentar a anuidade de 60 para 66 euros a partir de janeiro, porque o aluguel do ginásio subiu. Sócios com menos de 18 anos mantêm o valor antigo. Nada foi decidido ainda: você pode votar na assembleia geral de 12 de março.',
      vague: 'A anuidade vai subir no ano que vem porque tudo ficou mais caro. Mais informações virão em algum momento.',
      invented: 'A partir de janeiro, a anuidade sobe de 60 para 66 euros para todos. Por favor, ajuste sua transferência antes da assembleia geral de 12 de março.'
    },
    versionNote: 'Trata uma proposta como decidida e esquece que os sócios com menos de 18 anos mantêm o valor antigo.'
  },
  trip: {
    title: 'Mudança na excursão da turma',
    context: 'Uma mensagem de um professor para os pais de uma turma.',
    sentences: {
      s1: 'Espero que as crianças estejam tão animadas com a excursão quanto eu!',
      s2: 'Por causa de uma greve de trens, vamos para o litoral de ônibus fretado em vez de trem.',
      s3: 'Isso significa que saímos uma hora mais cedo do que o previsto.',
      s4: 'O ponto de encontro não é mais a estação, mas o estacionamento atrás da escola.',
      s5: 'A empresa de ônibus tem muita experiência com grupos escolares.',
      s6: 'A volta na sexta-feira continua como planejado.',
      s7: 'Não há custos extras para as famílias; a escola cobre a diferença.',
      s8: 'A viagem de ônibus leva cerca de 40 minutos a mais que a de trem.',
      s9: 'A turma do ano passado foi para as montanhas, e também foi uma ótima viagem.',
      s10: 'Há uma parada curta no meio do caminho, em um posto na estrada.',
      s11: 'Obrigado a todos pela ajuda com as listas de bagagem.'
    },
    bullets: {
      gold1: 'Ônibus em vez de trem por causa de uma greve de trens.',
      gold2: 'Saída uma hora mais cedo, do estacionamento atrás da escola.',
      gold3: 'Sem custos extras para as famílias.',
      minor: 'A empresa de ônibus tem experiência com grupos escolares.',
      distort: 'A excursão foi encurtada por causa da greve.',
      dup: 'Os planos de viagem mudaram.',
      subtle: 'Saída duas horas mais cedo, do estacionamento atrás da escola.'
    },
    bulletNotes: {
      distort: 'Só a ida muda; a excursão não foi encurtada.',
      dup: 'Diz apenas que algo mudou, o que os outros pontos já mostram.',
      subtle: 'Quase, mas a saída é uma hora mais cedo, não duas.'
    },
    summaries: {
      faithful: 'Por causa de uma greve de trens, a turma vai de ônibus fretado e sai uma hora mais cedo do estacionamento atrás da escola, sem custos extras para as famílias.',
      vague: 'Há algumas mudanças na organização da excursão que os pais deveriam conhecer.',
      drops: 'Por causa de uma greve de trens, a turma vai para o litoral de ônibus fretado, o que não custa nada a mais para as famílias.',
      adds: 'Por causa de uma greve de trens, a turma vai de ônibus fretado e sai uma hora mais cedo do estacionamento atrás da escola, e os pais pagam uma pequena taxa extra.',
      subtle: 'Como o ônibus é mais rápido que o trem, a turma vai de ônibus fretado e sai uma hora mais cedo do estacionamento atrás da escola, sem custos extras para as famílias.'
    },
    summaryNotes: {
      drops: 'Falta o que os pais precisam fazer: a saída mais cedo e o novo ponto de encontro.',
      adds: 'A mensagem diz que a escola cobre a diferença, então não há taxa.',
      subtle: 'O motivo é a greve de trens, e o ônibus é até mais lento que o trem.'
    },
    task: 'Uma mãe que perdeu a mensagem pergunta a outra o que fazer.',
    oneLiner: 'A turma agora vai de ônibus.',
    details: {
      d1: 'O novo ponto de encontro: o estacionamento atrás da escola',
      d2: 'O novo horário: uma hora mais cedo do que o previsto',
      d3: 'Que não há custos extras',
      d4: 'Que a empresa de ônibus é experiente',
      d5: 'Por que não vão de trem',
      d6: 'Que o professor está animado com a excursão'
    },
    versions: {
      actionable: 'A turma vai de ônibus fretado. Leve seu filho uma hora mais cedo do que o previsto ao estacionamento atrás da escola, não à estação. Não custa nada a mais, e a volta na sexta-feira não muda.',
      vague: 'Tem uma greve, então agora eles vão de ônibus. Os horários e os lugares mudaram um pouco, então dá uma olhada no que o professor escreveu.',
      invented: 'A turma vai de ônibus fretado. Leve seu filho à estação uma hora mais cedo e dê a ele um dinheirinho para a passagem do ônibus.'
    },
    versionNote: 'O ponto de encontro é o estacionamento atrás da escola, não a estação, e a escola cobre os custos.'
  },
  bikes: {
    title: 'Bicicletas elétricas no compartilhamento',
    context: 'Um anúncio do serviço de bicicletas compartilhadas de uma cidade para os usuários.',
    sentences: {
      s1: 'Pedalar é um ótimo jeito de se manter ativo e conhecer a cidade.',
      s2: 'A partir de 1º de julho, nosso serviço de bicicletas compartilhadas acrescenta 200 bicicletas elétricas à frota.',
      s3: 'Uma bicicleta elétrica custa 20 centavos por minuto; as bicicletas comuns mantêm o preço atual.',
      s4: 'Para desbloquear uma bicicleta elétrica, você precisa da versão mais recente do nosso app.',
      s5: 'As bicicletas elétricas têm autonomia de cerca de 60 quilômetros por carga.',
      s6: 'As bicicletas elétricas devem ser devolvidas em uma das 12 estações de recarga; não podem ser deixadas em nenhum outro lugar.',
      s7: 'Há um mapa das estações de recarga no app.',
      s8: 'Se uma bicicleta elétrica for deixada fora de uma estação, é cobrada uma taxa de 10 euros.',
      s9: 'Várias outras cidades lançaram serviços parecidos nos últimos anos.',
      s10: 'As bicicletas foram testadas por 50 voluntários durante o inverno.',
      s11: 'Obrigado por pedalar com a gente!'
    },
    bullets: {
      gold1: 'A partir de 1º de julho: 200 bicicletas elétricas a 20 centavos por minuto.',
      gold2: 'Para desbloquear, é preciso a versão mais recente do app.',
      gold3: 'As bicicletas elétricas devem ser devolvidas em uma das 12 estações de recarga.',
      minor: 'Há um mapa das estações de recarga no app.',
      distort: 'As bicicletas elétricas substituem as comuns.',
      dup: 'Há bicicletas novas.',
      subtle: 'A partir de 1º de julho: 200 bicicletas elétricas a 25 centavos por minuto.'
    },
    bulletNotes: {
      distort: 'As bicicletas elétricas são acrescentadas; as comuns ficam, pelo preço atual.',
      dup: 'Uma repetição mais vaga do primeiro ponto, sem data, número ou preço.',
      subtle: 'Quase, mas o preço é 20 centavos por minuto, não 25.'
    },
    summaries: {
      faithful: 'A partir de 1º de julho há 200 bicicletas elétricas a 20 centavos por minuto; elas são desbloqueadas com a versão mais recente do app e precisam ser devolvidas em uma das 12 estações de recarga.',
      vague: 'O serviço de bicicletas compartilhadas vai lançar neste verão uma novidade que pode interessar aos usuários.',
      drops: 'O serviço de bicicletas compartilhadas acrescenta 200 bicicletas elétricas com autonomia de cerca de 60 quilômetros, o que facilita trajetos mais longos.',
      adds: 'A partir de 1º de julho há 200 bicicletas elétricas a 20 centavos por minuto, e as bicicletas comuns serão retiradas no ano que vem.',
      subtle: 'A partir de 1º de julho há 200 bicicletas elétricas a 20 centavos por minuto; elas são desbloqueadas com a versão mais recente do app e podem ser devolvidas em qualquer estação de bicicletas.'
    },
    summaryNotes: {
      drops: 'Faltam o preço e o que os usuários precisam fazer: atualizar o app e devolver a bicicleta em uma estação de recarga.',
      adds: 'O anúncio não diz em lugar nenhum que as bicicletas comuns serão retiradas.',
      subtle: 'As bicicletas elétricas só podem ser devolvidas nas 12 estações de recarga, não em qualquer estação.'
    },
    task: 'Uma amiga quer experimentar uma bicicleta elétrica na semana que vem.',
    oneLiner: 'Agora tem bicicleta elétrica.',
    details: {
      d1: 'O preço: 20 centavos por minuto',
      d2: 'Que para desbloquear é preciso a versão mais recente do app',
      d3: 'Que as bicicletas elétricas precisam voltar a uma estação de recarga',
      d4: 'Que pedalar mantém a pessoa ativa',
      d5: 'Quantas bicicletas elétricas há no total',
      d6: 'Que as bicicletas comuns mantêm o preço'
    },
    versions: {
      actionable: 'A partir de 1º de julho você pode alugar bicicletas elétricas por 20 centavos por minuto. Atualize o app primeiro, porque precisa da versão mais recente para desbloquear. Depois, devolva a bicicleta em uma das 12 estações de recarga que aparecem no mapa do app.',
      vague: 'Agora tem bicicleta elétrica, e é bem fácil de usar. É só baixar o app e sair pedalando.',
      invented: 'A partir de 1º de julho você pode alugar bicicletas elétricas por 20 centavos por minuto sem o app e deixá-las em qualquer lugar da cidade depois.'
    },
    versionNote: 'É preciso a versão mais recente do app para desbloquear, e a bicicleta tem que voltar a uma estação de recarga.'
  }
};
