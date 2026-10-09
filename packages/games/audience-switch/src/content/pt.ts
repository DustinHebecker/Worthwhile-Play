import type { ContentText } from './types';

export const content: ContentText = {
  migration: {
    title: 'Migração de base de dados',
    situation: 'A sua equipa está a mudar a base de dados de clientes para um novo sistema. Os testes encontraram um problema e a mudança vai atrasar. Explique isso.',
    facts: {
      newDate: 'A mudança passa dois dias para a frente: quinta-feira em vez de terça-feira.',
      cause: 'Os testes encontraram um erro até agora desconhecido com caracteres especiais como ü ou é.',
      noLoss: 'Não se perderam dados.',
      encoding: 'O script de importação lê o texto com a codificação de caracteres errada.',
      apology: 'Pedimos desculpa pelo incómodo.',
      regression: 'Um novo teste automático verifica agora os caracteres especiais.',
      buffer: 'Os dois dias cabem na margem de tempo do projeto, sem custos adicionais.',
      library: 'A conversão errada vem de uma biblioteca escolhida há anos.'
    },
    reasons: {
      'developer.cause': 'Os programadores precisam de saber o que os testes encontraram de facto.',
      'developer.encoding': 'É a causa de fundo em que vão trabalhar.',
      'developer.apology': 'Um pedido de desculpa aos clientes não ajuda uma colega a corrigir o erro.',
      'developer.regression': 'Precisam de saber que o erro já está coberto por um teste.',
      'developer.buffer': 'A margem de tempo e o orçamento são assunto da gestora de projeto.',
      'projectManager.newDate': 'A gestora de projeto planeia com a nova data.',
      'projectManager.noLoss': 'Uma perda de dados mudaria completamente o risco, por isso precisa de ouvir que não houve.',
      'projectManager.encoding': 'O pormenor da codificação não muda nenhuma decisão de planeamento.',
      'projectManager.apology': 'O pedido de desculpa é para os clientes; a gestora de projeto precisa de factos.',
      'projectManager.buffer': 'Saber se o prazo e o orçamento se mantêm é exatamente a sua pergunta.',
      'projectManager.library': 'Quem escolheu uma biblioteca há anos não ajuda a planear agora.',
      'customer.newDate': 'O cliente precisa da nova data, não do tipo de erro.',
      'customer.noLoss': 'A sua primeira preocupação são os seus dados, e estão seguros.',
      'customer.cause': 'Os pormenores do erro preocupam os clientes sem os ajudar.',
      'customer.encoding': 'Os detalhes técnicos internos não dizem nada ao cliente.',
      'customer.regression': 'Os testes internos não são assunto do cliente.',
      'customer.buffer': 'As margens e os custos internos não dizem respeito ao cliente.',
      'customer.library': 'Culpar uma biblioteca antiga soa a desculpa.'
    },
    messages: {
      'developer.fit': 'Aviso: o script de importação lê o texto com a codificação errada, por isso caracteres especiais como ü e é ficam estragados. Um teste de regressão já cobre isso; a mudança passa para quinta-feira.',
      'developer.missing': 'Pequeno atraso na migração, nada de grave. Pormenores mais tarde.',
      'developer.condescending': 'Caracteres especiais são letras como o ü que não estão no alfabeto básico. Os computadores guardam as letras como números e, às vezes, os números baralham-se.',
      'projectManager.fit': 'A migração passa de terça para quinta-feira. Não se perderam dados e os dois dias cabem na nossa margem sem custos adicionais. Causa: um erro com caracteres especiais, agora coberto por um teste.',
      'projectManager.tooMuch': 'O script de importação descodifica a entrada como Latin-1 em vez de UTF-8, o que estraga os caracteres multibyte; estamos a corrigir o leitor e a acrescentar um teste de regressão.',
      'projectManager.missing': 'Encontrámos um erro e estamos a tratar dele. Depois dizemos alguma coisa.',
      'customer.fit': 'Os seus dados estão seguros. Para garantir que cada nome e cada morada são transferidos corretamente, adiamos a mudança de terça para quinta-feira. Até lá, tudo funciona como habitualmente.',
      'customer.tooMuch': 'O nosso script de importação usou a codificação de caracteres errada, o que danificou os caracteres especiais nos testes, por isso a migração precisa de mais dois dias da nossa margem.',
      'customer.condescending': 'Não se preocupe com a parte técnica, é complicada. Saiba apenas que vai demorar um pouco mais.'
    }
  },
  skyBlue: {
    title: 'Porque é que o céu é azul',
    situation: 'Alguém lhe pergunta porque é que o céu é azul. Conhece a física por trás disso. Explique.',
    facts: {
      sunlight: 'A luz do sol contém todas as cores.',
      scatter: 'O ar dispersa a luz azul muito mais do que a vermelha.',
      rayleigh: 'Esta dispersão de Rayleigh cresce com a quarta potência da frequência (1/λ⁴).',
      sunset: 'Ao pôr do sol, a luz atravessa mais ar, por isso o céu fica vermelho e laranja.',
      everywhere: 'A luz azul dispersa chega aos olhos vinda de todas as direções, por isso o céu inteiro parece azul.',
      violet: 'O violeta dispersa-se ainda mais, mas a luz do sol tem menos violeta e os nossos olhos são menos sensíveis a ele.',
      molecules: 'A dispersão vem das moléculas de azoto e de oxigénio, muito mais pequenas do que o comprimento de onda da luz.',
      ocean: 'O céu é azul porque reflete o mar.'
    },
    reasons: {
      'child.sunlight': 'As crianças precisam primeiro da surpresa: a luz branca do sol esconde todas as cores.',
      'child.scatter': 'É a ideia central, dita com palavras simples.',
      'child.rayleigh': 'Com uma fórmula, perde-se logo a atenção de uma criança.',
      'child.everywhere': 'Explica o que veem: azul para onde quer que olhem.',
      'child.violet': 'O pormenor do violeta confunde mais do que ajuda nesta idade.',
      'child.molecules': 'Moléculas e comprimentos de onda são demasiado abstratos para uma criança.',
      'layperson.sunlight': 'Sem isto, «a luz azul é dispersa» não faz sentido.',
      'layperson.scatter': 'É a resposta propriamente dita, em palavras do dia a dia.',
      'layperson.rayleigh': 'A fórmula não acrescenta nada que um leigo possa usar.',
      'expert.rayleigh': 'Um especialista espera o mecanismo exato e a sua dependência do comprimento de onda.',
      'expert.everywhere': 'Isto é óbvio para um especialista e só lhe faz perder tempo.',
      'expert.violet': 'Os especialistas conhecem a objeção óbvia, «porque não violeta?» — responda-lhe.',
      'expert.molecules': 'Nomear os dispersores e a relação de tamanhos torna a explicação precisa.',
      ocean: 'É um mito comum; a cor não vem do mar.'
    },
    messages: {
      'child.fit': 'A luz do sol parece branca, mas na verdade tem todas as cores misturadas. Quando passa pelo ar, a parte azul é a que mais salta de um lado para o outro, por isso o azul chega aos teus olhos de todo o céu.',
      'child.tooMuch': 'A luz azul tem um comprimento de onda mais curto, e a dispersão de Rayleigh cresce com um a dividir pelo comprimento de onda à quarta.',
      'child.missing': 'O céu é assim e pronto. Sempre foi azul.',
      'layperson.fit': 'A luz do sol contém todas as cores. O ar dispersa a luz azul com muito mais força do que a vermelha, por isso chega-nos luz azul de todas as partes do céu.',
      'layperson.tooMuch': 'É dispersão de Rayleigh: a intensidade varia com 1/λ⁴, por isso os comprimentos de onda curtos dominam a radiância difusa do céu.',
      'layperson.condescending': 'É um bocadinho complicado para quem não é cientista. Digamos só que o ar o torna azul.',
      'expert.fit': 'Dispersão de Rayleigh por moléculas de N₂ e O₂, proporcional a 1/λ⁴. O violeta dispersa-se ainda mais, mas o espetro solar tem menos violeta e os nossos cones são menos sensíveis a ele.',
      'expert.condescending': 'Imagine a luz do sol como uma caixa de lápis de cor! O ar gosta sobretudo de brincar com o lápis azul.',
      'expert.missing': 'O ar dispersa mais a luz azul, é por isso.'
    }
  },
  clubRoof: {
    title: 'O telhado do clube',
    situation: 'O telhado da sede do seu clube desportivo precisa de uma reparação urgente e custa mais do que o previsto. Explique isso.',
    facts: {
      cost: 'A reparação custa 8.000 euros, mais 3.000 do que o orçamentado.',
      decision: 'A direção tem de decidir até sexta-feira se transfere 3.000 euros do orçamento da festa de verão.',
      storage: 'A arrecadação do material fica fechada até à reparação; o resto da sede está aberto.',
      fees: 'As quotas dos sócios não mudam.',
      schedule: 'O telhador começa a 12 de maio e precisa de quatro dias; o parque de estacionamento é necessário para o andaime.',
      tiles: 'As telhas novas são de betão cor de antracite.',
      reserve: 'Usar antes o fundo de reserva deixá-lo-ia abaixo do mínimo obrigatório.',
      volunteer: 'Um sócio ofereceu-se para reparar o telhado de graça, mas não é telhador.'
    },
    reasons: {
      'executive.cost': 'A direção precisa do valor e da derrapagem para avaliar.',
      'executive.decision': 'É a decisão que tem de tomar, com o respetivo prazo.',
      'executive.storage': 'O uso diário das salas não é assunto da direção.',
      'executive.schedule': 'Os dias exatos da obra são tarefa do coordenador.',
      'executive.tiles': 'O tipo e a cor das telhas não influenciam a decisão.',
      'executive.reserve': 'Explica porque é que a alternativa óbvia não é opção.',
      'projectManager.fees': 'As quotas não têm nada a ver com a organização da reparação.',
      'projectManager.schedule': 'É exatamente destas datas e do estacionamento que o coordenador trata.',
      'projectManager.reserve': 'O financiamento é decisão da direção, não do coordenador.',
      'layperson.storage': 'Os sócios querem saber o que podem e não podem usar.',
      'layperson.fees': 'O seu próprio dinheiro é a primeira pergunta.',
      'layperson.tiles': 'Os pormenores do material não interessam aos sócios.',
      'layperson.reserve': 'As regras do fundo de reserva são pormenores financeiros internos.',
      volunteer: 'Uma oferta sem a qualificação adequada só abre um debate inútil; não é uma opção real.'
    },
    messages: {
      'executive.fit': 'É preciso decidir até sexta-feira: a reparação do telhado custa 8.000 euros, mais 3.000 do que o orçamentado. Propomos transferir 3.000 do orçamento da festa de verão, porque o fundo de reserva ficaria abaixo do mínimo.',
      'executive.tooMuch': 'O telhador começa a 12 de maio com telhas de betão cor de antracite; o andaime fica quatro dias no parque de estacionamento e a arrecadação fica fechada até lá.',
      'executive.missing': 'O telhado vai ficar mais caro. Vamos mantendo-vos informados.',
      'projectManager.fit': 'O telhador começa a 12 de maio e precisa de quatro dias. Por favor, deixe o parque livre para o andaime a partir de 11 de maio.',
      'projectManager.tooMuch': 'A reparação custa 8.000 euros, mais 3.000 do que o orçamento; a direção talvez transfira dinheiro da festa, porque a reserva não pode descer abaixo do mínimo, e as quotas mantêm-se.',
      'projectManager.missing': 'Algures em maio vai haver obras no telhado.',
      'layperson.fit': 'O telhado da sede vai ser reparado em maio. Até lá, a arrecadação do material fica fechada; tudo o resto está aberto como de costume. As quotas não mudam.',
      'layperson.tooMuch': 'A reparação custa 8.000 euros, mais 3.000 do que o orçamento; a direção está a estudar uma transferência do orçamento da festa, porque a reserva não pode descer abaixo do mínimo.',
      'layperson.condescending': 'Não se preocupem com o telhado, a direção trata das coisas de adultos.'
    }
  },
  shopOutage: {
    title: 'Falha da loja online',
    situation: 'A loja online da sua empresa esteve em baixo três horas ontem. Explique o que aconteceu.',
    facts: {
      duration: 'A loja esteve em baixo três horas ontem à noite.',
      revenue: 'Perderam-se encomendas no valor de cerca de 40.000 euros.',
      cause: 'Um certificado de segurança expirado bloqueou os pagamentos.',
      fixed: 'O certificado foi renovado; a loja voltou a funcionar normalmente.',
      renewal: 'A renovação vai ser automatizada, com um aviso duas semanas antes; isso leva um dia à equipa.',
      voucher: 'Os clientes cuja encomenda falhou recebem por e-mail um vale de 10%.',
      approval: 'Pede-se à administração que aprove 5.000 euros para uma melhor monitorização.',
      competitor: 'A loja de um concorrente teve uma falha semelhante no mês passado.'
    },
    reasons: {
      'projectManager.cause': 'A gestora de projeto precisa da causa para avaliar a correção.',
      'projectManager.renewal': 'É o trabalho que tem de planear: um dia da equipa.',
      'projectManager.voucher': 'Os vales são tratados pelo apoio ao cliente, não pelo projeto.',
      'executive.duration': 'A administração precisa da dimensão do incidente.',
      'executive.revenue': 'Para a administração, o impacto no negócio vem primeiro.',
      'executive.cause': 'O pormenor técnico não muda a sua decisão; «uma renovação esquecida» chega.',
      'executive.renewal': 'Precisa de ouvir que não volta a acontecer.',
      'executive.approval': 'É a decisão que tem de tomar.',
      'customer.revenue': 'A receita que perderam não é problema do cliente.',
      'customer.cause': 'As causas técnicas não ajudam os clientes.',
      'customer.fixed': 'Os clientes querem saber primeiro que podem voltar a comprar.',
      'customer.renewal': 'As mudanças de processos internos não dizem respeito aos clientes.',
      'customer.voucher': 'É o que recebem, e devem estar atentos ao e-mail.',
      'customer.approval': 'Decisões internas de orçamento não são para os clientes.',
      competitor: 'Apontar para os outros soa a desculpa e não muda nada.'
    },
    messages: {
      'projectManager.fit': 'A falha de três horas de ontem deveu-se a um certificado de segurança expirado que bloqueou os pagamentos. Para não se repetir, vamos automatizar a renovação com aviso prévio; isso leva um dia à equipa neste sprint.',
      'projectManager.tooMuch': 'Perdemos cerca de 40.000 euros em encomendas, os clientes recebem um vale de 10% por e-mail e um concorrente teve o mesmo problema no mês passado.',
      'projectManager.missing': 'A loja teve um pequeno soluço ontem, já está tudo bem.',
      'executive.fit': 'Ontem a loja esteve em baixo três horas; perdemos cerca de 40.000 euros em encomendas. A causa foi uma renovação de rotina esquecida, que já está automatizada. Para detetar estes problemas mais cedo, pedimos a aprovação de 5.000 euros para monitorização.',
      'executive.tooMuch': 'O certificado TLS do gateway de pagamento expirou às 18:02; agora renovamo-lo automaticamente pelo protocolo ACME, com alertas 14 dias antes.',
      'executive.missing': 'Houve um pequeno problema técnico ontem. Está resolvido.',
      'customer.fit': 'Pedimos desculpa: ontem à noite a nossa loja esteve indisponível durante algumas horas. Já está tudo a funcionar. Se a sua encomenda falhou, vai receber por e-mail um vale de 10%.',
      'customer.tooMuch': 'Um certificado de segurança expirado parou o nosso sistema de pagamentos; perdemos cerca de 40.000 euros e agora renovamos os certificados automaticamente.',
      'customer.condescending': 'Avariou uma coisa técnica, nada que fosse perceber. Tente outra vez e pronto.'
    }
  },
  signalFault: {
    title: 'Avaria de sinalização ferroviária',
    situation: 'Uma avaria de sinalização está a perturbar uma linha ferroviária. Trabalha para a empresa ferroviária. Explique a situação.',
    facts: {
      delay: 'Os comboios desta linha têm cerca de 40 minutos de atraso.',
      bus: 'Há autocarros de substituição a partir do largo da estação a cada 20 minutos.',
      tickets: 'Os bilhetes também são válidos nos autocarros e em comboios posteriores.',
      signal: 'O sinal 14 no entroncamento está sempre vermelho após uma avaria num cabo.',
      singleTrack: 'Os comboios passam o troço por uma só via, a passo de peão, com ordem escrita.',
      repair: 'Os técnicos preveem que a reparação demore mais cerca de quatro horas.',
      construction: 'Provavelmente foram obras de outra empresa que danificaram o cabo.',
      staff: 'Dois técnicos estão de baixa esta semana.'
    },
    reasons: {
      'layperson.delay': 'Os passageiros querem saber primeiro quanto vão atrasar.',
      'layperson.bus': 'Diz-lhes o que podem fazer já.',
      'layperson.tickets': 'Responde à preocupação de precisarem de um bilhete novo.',
      'layperson.signal': 'Os números dos sinais não dizem nada aos passageiros.',
      'layperson.singleTrack': 'As regras de circulação não ajudam os passageiros.',
      'layperson.construction': 'Especular sobre culpas não ajuda os passageiros e pode estar errado.',
      'layperson.staff': 'Os assuntos de pessoal interno não são da conta dos passageiros.',
      'expert.tickets': 'As regras dos bilhetes não afetam a circulação dos comboios.',
      'expert.signal': 'O colega precisa do local e da avaria exatos.',
      'expert.singleTrack': 'É a regra de circulação que tem de aplicar.',
      'expert.repair': 'Planeia o horário em função do fim previsto.',
      'expert.staff': 'A situação do pessoal não muda a forma como o troço é explorado.',
      'executive.delay': 'A administração precisa da dimensão da perturbação.',
      'executive.tickets': 'A aceitação de bilhetes é uma regra padrão, não um tema da administração.',
      'executive.repair': 'Precisa de saber quanto tempo dura o impacto.',
      'executive.construction': 'Um possível dano causado por terceiros conta para a responsabilidade e os custos.'
    },
    messages: {
      'layperson.fit': 'Os comboios desta linha têm cerca de 40 minutos de atraso. Há autocarros de substituição a partir do largo da estação a cada 20 minutos, e o seu bilhete é válido neles.',
      'layperson.tooMuch': 'O sinal 14 no entroncamento está sempre vermelho após uma avaria num cabo; os comboios circulam por uma só via a passo de peão com ordem escrita.',
      'layperson.missing': 'Pedimos paciência, há uma avaria técnica.',
      'expert.fit': 'Sinal 14 no entroncamento preso no vermelho após avaria de cabo. Circulação em via única a passo de peão com ordem escrita; a reparação deve demorar mais cerca de quatro horas.',
      'expert.condescending': 'Um sinal é como um semáforo para comboios. Um deles avariou, por isso os comboios têm de andar devagar.',
      'expert.missing': 'Há um problema na linha e os comboios estão atrasados. Há autocarros.',
      'executive.fit': 'Uma avaria de cabo vai perturbar a linha mais cerca de quatro horas; os comboios têm cerca de 40 minutos de atraso. Provavelmente foram obras de outra empresa que danificaram o cabo, por isso estamos a verificar a responsabilidade.',
      'executive.tooMuch': 'Sinal 14 sempre vermelho; via única a passo de peão com ordem escrita; autocarros a cada 20 minutos a partir do largo; bilhetes válidos nos autocarros.',
      'executive.missing': 'Pequeno problema de sinalização, a equipa está a tratar.'
    }
  },
  kettleLid: {
    title: 'A tampa da chaleira',
    situation: 'A sua empresa descobriu que a tampa de um modelo de chaleira elétrica se pode soltar. Explique isso.',
    facts: {
      batches: 'Só são afetadas as chaleiras com os números de lote 2301 a 2315 (impressos por baixo da base).',
      risk: 'A tampa pode abrir ao servir, e a água quente pode salpicar.',
      stop: 'Deixe de usar uma chaleira afetada até ser substituída.',
      hinge: 'Um pino de plástico da dobradiça foi fabricado 0,2 mm mais fino do que devia.',
      free: 'A substituição é gratuita, incluindo o envio.',
      cost: 'A troca vai custar à empresa cerca de 120.000 euros.',
      supplier: 'Os pinos vieram de um fornecedor novo cujas amostras tinham passado na inspeção.',
      injuries: 'Até agora não há feridos conhecidos.'
    },
    reasons: {
      'customer.batches': 'Os clientes têm de conseguir verificar se a sua chaleira é afetada.',
      'customer.risk': 'Precisam de perceber porque é que isto importa.',
      'customer.stop': 'É a ação que os mantém seguros.',
      'customer.hinge': 'Pormenores em milímetros não ajudam os clientes.',
      'customer.free': 'Saber que não custa nada tira uma razão para esperar.',
      'customer.cost': 'Os custos da empresa não são problema do cliente.',
      'customer.supplier': 'Pormenores sobre o fornecedor soam a passar a culpa.',
      'executive.risk': 'A administração tem de perceber primeiro o risco de segurança.',
      'executive.hinge': 'A medida exata é para os engenheiros.',
      'executive.cost': 'O impacto financeiro faz parte da sua decisão.',
      'executive.injuries': 'Haver ou não feridos muda a urgência e a resposta.',
      'expert.stop': 'As instruções para clientes não ajudam a analisar o defeito.',
      'expert.hinge': 'A engenheira precisa do defeito exato.',
      'expert.free': 'As condições de envio não importam para a análise técnica.',
      'expert.cost': 'Os custos da recolha não são precisos para corrigir a peça.',
      'expert.supplier': 'Mostra onde o controlo de qualidade tem de mudar.'
    },
    messages: {
      'customer.fit': 'Verifique o número de lote por baixo da sua chaleira. Se estiver entre 2301 e 2315, deixe de a usar: a tampa pode abrir ao servir. Substituímo-la gratuitamente, incluindo o envio.',
      'customer.tooMuch': 'Um pino de dobradiça de um fornecedor novo era 0,2 mm mais fino; a troca vai custar-nos cerca de 120.000 euros.',
      'customer.condescending': 'Algumas chaleiras talvez tenham um probleminha. Não precisa de perceber os pormenores; devolva-a se quiser.',
      'executive.fit': 'Problema de segurança: nos lotes 2301 a 2315, a tampa da chaleira pode abrir ao servir água quente. Até agora não há feridos conhecidos. A troca vai custar cerca de 120.000 euros.',
      'executive.tooMuch': 'O diâmetro do pino da dobradiça está 0,2 mm abaixo da tolerância; as amostras do fornecedor novo cumpriam a especificação, por isso suspeitamos de desgaste da ferramenta.',
      'executive.missing': 'Vamos substituir algumas chaleiras por precaução.',
      'expert.fit': 'Os pinos de dobradiça do fornecedor novo são 0,2 mm mais finos, por isso a tampa pode abrir ao servir. Lotes afetados: 2301 a 2315. As amostras deles passaram, por isso a nossa inspeção de receção tem de mudar.',
      'expert.missing': 'Algumas tampas estão soltas; os clientes recebem uma substituição gratuita.',
      'expert.condescending': 'Uma dobradiça é a peça que deixa a tampa rodar. Se for demasiado fina, não segura bem.'
    }
  }
};
