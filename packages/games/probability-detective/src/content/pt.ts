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
  }
};
