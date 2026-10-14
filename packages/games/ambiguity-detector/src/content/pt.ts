import type { LocaleContent } from './items';

export const content: LocaleContent = {
  'finish-tomorrow': {
    context: 'A líder da sua equipe escreve para você no chat da equipe. No momento você está trabalhando em três relatórios diferentes.',
    text: 'Por favor, termine isto amanhã.',
    ask: { what: 'Qual dos três relatórios você quer dizer?', when: 'Até que horas amanhã: de manhã ou até o fim do dia?' },
    given: { who: 'A mensagem é dirigida diretamente a você.' },
    replies: {
      clear: 'Claro. Qual dos três relatórios: o de orçamento, o de vendas ou o de pessoal? E até que horas amanhã?',
      vague: 'Ok, pode deixar!',
      assume: 'Sem problema, termino o relatório de vendas amanhã.'
    }
  },
  'concert-entrance': {
    context: 'Um amigo escreve sobre o show de sábado, que começa às 20h. O local tem quatro entradas.',
    text: 'Vamos nos encontrar na entrada antes do show.',
    ask: { when: 'A que horas nos encontramos, quanto tempo antes das 20h?', where: 'Em qual das quatro entradas?' },
    given: { what: 'O plano está claro: encontrar-se antes do show.' },
    replies: {
      clear: 'Boa ideia! Qual entrada e a que horas? Às 19h30 está bom?',
      vague: 'Combinado, até lá!',
      rude: 'Você sempre fala assim. Seja preciso pelo menos uma vez!'
    }
  },
  'party-photos': {
    context: 'Sua tia escreve para você depois de uma festa de família em que você tirou umas 200 fotos.',
    text: 'Você pode me mandar as fotos de domingo?',
    ask: { what: 'Todas as 200 ou só algumas, por exemplo aquelas em que você aparece?', format: 'Como envio: por link de download, por e-mail ou impressas?' },
    given: { who: 'Está claro quem deve enviar: você.' },
    replies: {
      clear: 'Claro! Todas as 200 ou uma seleção? E um link de download serve para você?',
      vague: 'Claro, mando qualquer dia.',
      assume: 'Já encomendei a impressão das 200 fotos para você.'
    }
  },
  'water-plants': {
    context: 'Sua vizinha vai viajar amanhã por duas semanas. Você tem a chave reserva dela.',
    text: 'Você poderia regar as plantas enquanto eu estiver fora?',
    ask: { when: 'Com que frequência: todo dia ou duas vezes por semana?', where: 'Quais plantas: as de dentro, as da varanda ou todas?' },
    given: { what: 'A tarefa está clara: regar as plantas.', who: 'O pedido é feito diretamente a você.' },
    replies: {
      clear: 'Com prazer! Quais plantas, e com que frequência devo regar?',
      vague: 'Claro, sem problema.',
      assume: 'Claro, vou regar as plantas da varanda toda noite.'
    }
  },
  'train-tickets': {
    context: 'Você e uma amiga estão planejando um fim de semana na praia. Ela escreve:',
    text: 'Eu reservo o hotel. Você pode reservar o trem?',
    ask: { when: 'Em que dia e mais ou menos a que horas vamos e voltamos?' },
    given: { what: 'A tarefa está clara: passagens de trem para a viagem.', who: 'Cabe a você reservar.' },
    replies: {
      clear: 'Sim! Em que dia e a que horas você quer sair, e quando voltamos?',
      vague: 'Ok, eu faço isso.',
      assume: 'Feito: sexta-feira às 5h30 da manhã, primeira classe.'
    }
  },
  'bins-tonight': {
    context: 'Uma mensagem no grupo de cinco pessoas que dividem um apartamento.',
    text: 'Alguém precisa levar o lixo para fora hoje à noite.',
    ask: { who: 'Quem exatamente faz isso hoje? De quem é a vez?' },
    given: { what: 'A tarefa está clara: levar o lixo para fora.', when: 'O momento está dito: hoje à noite.' },
    replies: {
      clear: 'Quem faz hoje à noite? Temos uma escala que possamos consultar?',
      vague: 'É, alguém deveria.',
      rude: 'Eu é que não. Resolvam entre vocês.'
    }
  },
  'school-form': {
    context: 'Um aviso da professora do seu filho no aplicativo da escola. Nesta semana seu filho trouxe dois formulários: um para um passeio e outro para as fotos da turma.',
    text: 'Por favor, devolvam o formulário assinado até quinta-feira.',
    ask: { what: 'Qual formulário: o do passeio ou o das fotos?', format: 'Devolvo em papel ou como foto no aplicativo?' },
    given: { when: 'O prazo está dito: quinta-feira.' },
    replies: {
      clear: 'Obrigado! Qual formulário, o do passeio ou o das fotos? E em papel ou pelo aplicativo?',
      vague: 'Ok, anotado.',
      assume: 'Feito: assinei os dois formulários e enviei fotos deles.'
    }
  },
  'holiday-keys': {
    context: 'Você alugou um apartamento para as férias. A anfitriã escreve no dia anterior à sua chegada.',
    text: 'Vou deixar as chaves para você.',
    ask: { where: 'Onde exatamente você vai deixar as chaves?' },
    given: { what: 'Está claro do que se trata: as chaves.', who: 'A própria anfitriã vai deixá-las.' },
    replies: {
      clear: 'Obrigado! Onde exatamente elas vão estar: num cofre de chaves ou com um vizinho?',
      vague: 'Ótimo, obrigado!',
      assume: 'Perfeito, pego debaixo do capacho.'
    }
  },
  'project-slides': {
    context: 'Sua gestora escreve para você na terça de manhã.',
    text: 'Você pode montar alguns slides sobre o projeto?',
    ask: {
      when: 'Para quando você precisa dos slides?',
      audience: 'Quem vai ver: a equipe, a diretoria ou o cliente?',
      scope: 'Qual o tamanho: alguns slides ou uma apresentação completa?',
      purpose: 'Qual o objetivo: atualizar o andamento ou chegar a uma decisão?'
    },
    given: { what: 'A entrega está clara: slides sobre o projeto.', who: 'O pedido é feito diretamente a você.' },
    replies: {
      clear: 'Com prazer. Para quem, para quando, mais ou menos de que tamanho, e deve levar a uma decisão ou só informar?',
      vague: 'Claro, faço uns slides.',
      assume: 'Vou preparar 40 slides para a reunião do conselho na sexta.'
    }
  },
  'cafe-website': {
    context: 'A dona de um pequeno café escreve para você, o web designer que fez o site dela.',
    text: 'O site está com uma cara estranha, você pode consertar?',
    ask: {
      what: 'O que exatamente está errado: o texto, as imagens ou o layout?',
      where: 'Em qual página e em qual aparelho você vê isso?',
      priority: 'É urgente? Isso impede os clientes de fazer pedidos?'
    },
    given: { who: 'O pedido é feito a você, como designer do site.' },
    replies: {
      clear: 'Poxa, que pena! O que exatamente está errado, em qual página e aparelho? E isso impede os clientes de fazer pedidos?',
      vague: 'Vou dar uma olhada.',
      assume: 'Vou redesenhar o site inteiro esta semana.'
    }
  },
  'walk-report': {
    context: 'A presidente do seu clube de caminhada escreve depois do passeio de primavera.',
    text: 'Você poderia escrever um relato curto sobre a caminhada?',
    ask: {
      when: 'Para quando você precisa do relato?',
      format: 'Só texto ou com fotos? Para impressão ou para o site?',
      audience: 'Quem vai ler: os sócios ou o jornal local?'
    },
    given: { what: 'A entrega está clara: um relato da caminhada.', scope: '“Curto” dá um tamanho aproximado; ainda assim você poderia confirmar o número de palavras.' },
    replies: {
      clear: 'Com prazer! Para quem é, para quando você precisa, e devo incluir fotos?',
      vague: 'Ok, vou escrever alguma coisa.',
      assume: 'Amanhã mando ao jornal um relato de três páginas com 50 fotos.'
    }
  },
  'office-paper': {
    context: 'A gerente do escritório escreve no canal da equipe.',
    text: 'O papel da impressora está acabando, alguém, por favor, peça mais.',
    ask: {
      when: 'Para quando precisamos?',
      who: 'Quem deve fazer o pedido?',
      scope: 'Quanto devemos pedir?'
    },
    given: { what: 'Está claro o que falta: papel para a impressora.' },
    replies: {
      clear: 'Eu posso pedir. Quantos pacotes, e para quando precisamos?',
      vague: 'É, alguém deveria.',
      assume: 'Pedi 100 caixas; chegam no mês que vem.'
    }
  },
  'anniversary': {
    context: 'Seu companheiro liga para você. Daqui a dois meses os pais dele fazem 40 anos de casados.',
    text: 'A gente devia organizar alguma coisa para os meus pais.',
    ask: {
      what: 'Em que você está pensando: um jantar, uma festa ou um presente?',
      when: 'Quando: no próprio dia ou num fim de semana próximo?',
      who: 'Quem cuida de quê: você, eu, seus irmãos?',
      scope: 'De que tamanho: só a família ou muitos convidados?'
    },
    given: { audience: 'Está claro para quem: os pais.', purpose: 'A ocasião está clara: os 40 anos de casamento.' },
    replies: {
      clear: 'Que ideia boa! O que você tem em mente, quando, para quantas pessoas, e quem faz o quê?',
      vague: 'É, devíamos.',
      assume: 'Reservei um restaurante para 60 pessoas no sábado que vem.'
    }
  },
  'customer-reply': {
    context: 'Sua gestora encaminha para você a reclamação de um cliente cuja entrega está duas semanas atrasada.',
    text: 'Por favor, dê um retorno ao cliente.',
    ask: {
      what: 'O que posso oferecer: um pedido de desculpas, um desconto, uma nova data de entrega?',
      when: 'Com que urgência: ainda hoje?',
      format: 'Ligo ou escrevo?'
    },
    given: { audience: 'Está claro com quem falar: o cliente.', purpose: 'O motivo está claro: a entrega atrasada.' },
    replies: {
      clear: 'Pode deixar. Ligo ou mando e-mail, até quando, e o que posso oferecer?',
      vague: 'Ok.',
      assume: 'Prometi ao cliente reembolso total e frete grátis por um ano.'
    }
  },
  'shop-translation': {
    context: 'Uma amiga que tem uma pequena loja online escreve porque você fala espanhol.',
    text: 'Você poderia traduzir os textos da loja para mim?',
    ask: {
      when: 'Para quando você precisa da tradução?',
      audience: 'Seus clientes estão na Espanha ou na América Latina?',
      scope: 'Quais textos e quantos: descrições de produtos, o site inteiro?'
    },
    given: { what: 'A tarefa está clara: uma tradução para o espanhol.', who: 'O pedido é feito diretamente a você.' },
    replies: {
      clear: 'Ajudo com prazer! Quais textos, para quando, e seus clientes estão na Espanha ou na América Latina?',
      vague: 'Claro, me manda qualquer hora.',
      assume: 'Claro, até amanhã traduzo o site inteiro para espanhol, português e francês.'
    }
  },
  'basement': {
    context: 'O zelador do seu prédio escreve para todos os moradores.',
    text: 'Por favor, retirem seus pertences do porão.',
    ask: {
      when: 'Até quando o porão precisa estar vazio?',
      where: 'Onde podemos guardar nossas coisas enquanto isso?',
      purpose: 'Qual é o motivo, e é só por um tempo?'
    },
    given: { what: 'Está claro o que se quer dizer: as próprias coisas no porão.', who: 'O pedido é para todos os moradores.' },
    replies: {
      clear: 'Obrigado pelo aviso. Até quando, por qual motivo, e há algum lugar onde possamos guardar nossas coisas enquanto isso?',
      vague: 'Ok.',
      rude: 'Não vou tirar nada. Achem outra solução.'
    }
  },
  'board-report': {
    context: 'Sua gestora escreve na quarta-feira. Na semana passada ela disse que o relatório trimestral vai para o conselho e deve ter no máximo duas páginas.',
    text: 'Por favor, me mande o relatório até sexta.',
    ask: {
      format: 'Você quer um arquivo editável ou um PDF?',
      criterion: 'Quais números ou seções ele precisa ter para estar completo?'
    },
    given: {
      what: 'Está claro qual relatório: o trimestral.',
      when: 'O prazo está dito: sexta.',
      audience: 'Dito antes: o relatório vai para o conselho.',
      scope: 'Dito antes: no máximo duas páginas.'
    },
    replies: {
      clear: 'Pode deixar. Quais seções ele precisa ter, e você quer um arquivo editável ou um PDF?',
      vague: 'Claro, até sexta.',
      redundant: 'Para quem é, de que tamanho, e de qual relatório você está falando?'
    }
  },
  'school-pickup': {
    context: 'Sua irmã escreve para você. Os dois filhos dela saem da escola às 15h todos os dias; às terças o mais velho tem treino de futebol até as 17h.',
    text: 'Você pode buscar as crianças na terça?',
    ask: {
      where: 'Para onde eu levo depois: para a sua casa ou para a minha?',
      scope: 'Os dois, ou só o mais novo, já que o mais velho tem futebol?'
    },
    given: { when: 'Sabe-se pelo contexto: a escola termina às 15h.', who: 'O pedido é feito diretamente a você.' },
    replies: {
      clear: 'Posso, sim. Os dois ou só o mais novo? E levo para a sua casa ou para a minha?',
      vague: 'Claro.',
      redundant: 'A que horas eles saem da escola, e em que dia?'
    }
  },
  'checkout-bug': {
    context: 'Uma gerente de produto comenta no sistema de bugs da equipe, num chamado com o título “Botão de pagamento não faz nada no celular desde a atualização 2.3”.',
    text: 'Urgente, por favor corrijam isso o quanto antes.',
    ask: {
      who: 'Quem da equipe assume?',
      criterion: 'Em quais celulares e navegadores precisa funcionar antes de fecharmos o chamado?'
    },
    given: {
      what: 'O título do chamado nomeia o problema.',
      where: 'O título diz onde: no celular.',
      priority: '“Urgente” deixa clara a prioridade.'
    },
    replies: {
      clear: 'Estamos nisso. Quem assume? E quais celulares e navegadores devemos testar antes de fechar o chamado?',
      vague: 'Vamos ver isso.',
      redundant: 'O que exatamente está quebrado, e é urgente?'
    }
  },
  'client-room': {
    context: 'Sua colega Ana escreve para você. Na semana que vem ela recebe dois clientes; serão só os três.',
    text: 'Você poderia reservar uma sala de reunião para mim na semana que vem?',
    ask: {
      when: 'Em que dia, a que horas e por quanto tempo?',
      format: 'Você precisa de tela ou equipamento de vídeo?'
    },
    given: {
      what: 'A tarefa está clara: reservar uma sala de reunião.',
      who: 'Cabe a você reservar.',
      scope: 'Sabe-se pelo contexto: três pessoas.'
    },
    replies: {
      clear: 'Claro. Que dia e que horas, por quanto tempo, e você precisa de tela?',
      vague: 'Ok, reservo alguma coisa.',
      redundant: 'Quantas pessoas vêm, e para que você precisa da sala?'
    }
  },
  'newsletter': {
    context: 'O editor do boletim do seu clube esportivo escreve para você. O boletim sai para todos os sócios na primeira segunda-feira de cada mês; cada artigo tem cerca de 200 palavras.',
    text: 'Você poderia escrever algo sobre os novos horários de treino?',
    ask: {
      what: 'Coloco a grade nova completa ou só o que mudou?',
      when: 'Para quando você precisa do meu texto? A data do boletim não é o meu prazo.'
    },
    given: { audience: 'Sabe-se pelo contexto: todos os sócios.', scope: 'Sabe-se pelo contexto: cerca de 200 palavras.' },
    replies: {
      clear: 'Com prazer. Para quando você precisa, e coloco a grade completa ou só as mudanças?',
      vague: 'Claro, escrevo alguma coisa.',
      redundant: 'Quem lê o boletim, e de que tamanho deve ser o texto?'
    }
  },
  'airport': {
    context: 'Sua prima manda os dados do voo: pouso no sábado às 14h20, terminal 2. Ela vai ficar uma semana na sua casa.',
    text: 'Você pode me buscar?',
    ask: { scope: 'Você vem sozinha, e quanta bagagem traz? Cabe num carro pequeno?' },
    given: {
      when: 'Sabe-se pelos dados do voo: sábado às 14h20.',
      where: 'Sabe-se pelos dados do voo: terminal 2.',
      purpose: 'Sabe-se pelo contexto: ela vai ficar na sua casa, então o destino está claro.'
    },
    replies: {
      clear: 'Claro! Você vem sozinha, e quanta bagagem traz?',
      vague: 'Sim, até lá.',
      redundant: 'Quando você pousa, e em qual terminal?'
    }
  },
  'contract-check': {
    context: 'Um colega de compras manda por e-mail um contrato de fornecedor de 30 páginas. Assunto: “Por favor, revisar a cláusula 7 (responsabilidade) até quinta ao meio-dia”.',
    text: 'Dá uma olhada, por favor.',
    ask: {
      format: 'Como você quer meu retorno: comentários no documento ou um e-mail curto?',
      criterion: 'No que devo prestar atenção: riscos, redação pouco clara ou os valores?'
    },
    given: { what: 'O assunto nomeia a parte: a cláusula 7.', when: 'O assunto nomeia o prazo: quinta ao meio-dia.' },
    replies: {
      clear: 'Faço até quinta ao meio-dia. No que devo me concentrar na cláusula 7, e você quer comentários no arquivo ou um resumo curto?',
      vague: 'Vou dar uma olhada.',
      redundant: 'Qual parte devo ler, e até quando?'
    }
  },
  'shared-dinner': {
    context: 'Lina escreve no grupo de quatro amigos. Hoje mais cedo todos combinaram um jantar na casa dela no sábado às 19h.',
    text: 'Cada um pode trazer alguma coisa?',
    ask: {
      what: 'O que cada um traz: entrada, sobremesa ou bebidas?',
      criterion: 'Tem alguma coisa que alguém não pode ou não come?'
    },
    given: { when: 'Já combinado: sábado às 19h.', where: 'Já combinado: na casa da Lina.' },
    replies: {
      clear: 'Claro! Vamos dividir entre entrada, sobremesa e bebidas? E tem algo que alguém não pode comer?',
      vague: 'Claro, levo alguma coisa.',
      redundant: 'Onde vamos nos encontrar, e a que horas?'
    }
  }
};
