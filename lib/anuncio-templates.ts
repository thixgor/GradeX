/**
 * Modelos persuasivos para o conteúdo dos anúncios.
 *
 * Cada modelo aplica UMA técnica clássica de persuasão em vendas e diz, em
 * `comoFunciona`, por que ela funciona — a ideia é que quem escreve o anúncio
 * escolha pelo efeito desejado, não pelo texto que "parece bonito".
 *
 * Convenções de escrita dos modelos:
 *
 *  - Os trechos a trocar vêm em [COLCHETES MAIÚSCULOS]. É o que sinaliza, de
 *    relance, o que ainda é rascunho — e o formulário avisa quando sobra algum.
 *  - O corpo usa a formatação simples do editor (`lib/anuncio-formatacao.ts`):
 *    **negrito**, `- item`, `> citação`, `-# letra miúda`, linha em branco entre
 *    parágrafos. Nada de HTML — o modelo cai no campo de texto do admin e tem de
 *    ser fácil de editar ali.
 *  - Promessa vaga não vende e ainda gera reclamação: todo modelo pede número,
 *    prazo ou condição concreta no lugar do superlativo.
 */

export interface AnuncioTemplate {
  id: string
  nome: string
  /** Nome da técnica, como aparece na etiqueta do card. */
  tecnica: string
  /** Por que a técnica funciona, em uma frase. */
  comoFunciona: string
  /** Situação em que este modelo é a melhor escolha. */
  quandoUsar: string
  /** Chamada curta para o banner (fica no lugar do título derivado da URL). */
  titulo: string
  /** Texto do botão do banner. */
  ctaTexto: string
  /** Título do modal. */
  modalTitulo: string
  /** Corpo do modal, na formatação simples do editor (ver `lib/anuncio-formatacao.ts`). */
  modalConteudo: string
  /** Texto do botão final do modal. */
  modalBotaoTexto: string
}

export const ANUNCIO_TEMPLATES: AnuncioTemplate[] = [
  {
    id: 'escassez',
    nome: 'Vagas ou estoque limitado',
    tecnica: 'Escassez',
    comoFunciona: 'O que é raro parece mais valioso, e a decisão de adiar deixa de ser gratuita.',
    quandoUsar: 'Turma com vagas contadas, lote promocional, tiragem física limitada.',
    titulo: 'Restam [Nº] vagas de [TOTAL] em [PRODUTO]',
    ctaTexto: 'Garantir vaga',
    modalTitulo: 'Sobraram [Nº] vagas de [PRODUTO]',
    modalConteudo:
      'Abrimos **[TOTAL] vagas** para [PRODUTO] e **[Nº] ainda estão livres**.\n\n' +
      'O limite não é estratégia de venda: [MOTIVO REAL DO LIMITE — correção individual, tiragem impressa, turma pequena].\n\n' +
      '- [O QUE A PESSOA RECEBE — item 1]\n- [ITEM 2]\n- [ITEM 3]\n\n' +
      '-# Quando as vagas acabarem, a próxima abertura é só em [PRÓXIMA DATA].',
    modalBotaoTexto: 'Pegar uma das [Nº] vagas',
  },
  {
    id: 'urgencia',
    nome: 'Prazo com data e hora',
    tecnica: 'Urgência',
    comoFunciona: 'Prazo definido transforma "depois eu vejo" em uma decisão que precisa ser tomada agora.',
    quandoUsar: 'Promoção com data de fim, lote que vira preço cheio, inscrição que encerra.',
    titulo: '[PRODUTO] por [PREÇO] até [DIA] às [HORA]',
    ctaTexto: 'Aproveitar agora',
    modalTitulo: 'Acaba [DIA], às [HORA]',
    modalConteudo:
      'Até **[DIA], [HORA]**, [PRODUTO] sai por **[PREÇO PROMOCIONAL]** no lugar de [PREÇO CHEIO].\n\n' +
      'Depois desse horário o valor volta para [PREÇO CHEIO] — sem prorrogação, porque [MOTIVO].\n\n' +
      '- [BENEFÍCIO CONCRETO 1]\n- [BENEFÍCIO CONCRETO 2]',
    modalBotaoTexto: 'Quero antes de [DIA]',
  },
  {
    id: 'prova-social',
    nome: 'Quantos já usam',
    tecnica: 'Prova social',
    comoFunciona: 'Diante da dúvida, a escolha dos semelhantes vira atalho de decisão — e reduz o medo de errar sozinho.',
    quandoUsar: 'Produto já validado, com número de alunos, notas ou depoimentos reais.',
    titulo: '[Nº] estudantes já usam [PRODUTO]',
    ctaTexto: 'Ver por quê',
    modalTitulo: 'O que [Nº] estudantes já resolveram com [PRODUTO]',
    modalConteudo:
      '**[Nº] estudantes de [CURSO/PERÍODO]** já usam [PRODUTO]. A nota média que eles dão é **[NOTA]/5**.\n\n' +
      '> [DEPOIMENTO CURTO E REAL] — [NOME], [PERÍODO]º período\n\n' +
      'O relato mais frequente: [RESULTADO QUE MAIS APARECE NOS FEEDBACKS].',
    modalBotaoTexto: 'Entrar para os [Nº]',
  },
  {
    id: 'autoridade',
    nome: 'Quem assina o conteúdo',
    tecnica: 'Autoridade',
    comoFunciona: 'Credencial verificável tira o peso de julgar o conteúdo de quem ainda não sabe o suficiente para julgá-lo.',
    quandoUsar: 'Material revisado por especialista, aula com convidado, conteúdo com fonte citável.',
    titulo: '[PRODUTO], revisado por [ESPECIALISTA]',
    ctaTexto: 'Conhecer o material',
    modalTitulo: 'Conteúdo revisado por quem vive a área',
    modalConteudo:
      '[PRODUTO] foi escrito e revisado por **[NOME], [TITULAÇÃO/ESPECIALIDADE]**.\n\n' +
      '- Referências: [FONTES USADAS — diretriz, tratado, ano]\n- Atualizado em: [MÊS/ANO]\n- Revisão: [COMO É FEITA A REVISÃO]\n\n' +
      'É o tipo de material que você pode citar no [APG/SEMINÁRIO/PROVA] sem precisar conferir em outro lugar.',
    modalBotaoTexto: 'Ver o conteúdo',
  },
  {
    id: 'aversao-perda',
    nome: 'O custo de não fazer nada',
    tecnica: 'Aversão à perda',
    comoFunciona: 'Perder dói cerca de duas vezes mais do que ganhar o mesmo valor agrada — então o custo de ficar parado convence mais que o benefício.',
    quandoUsar: 'Conteúdo ligado a prova próxima, prazo de matrícula, revisão que fecha ciclo.',
    titulo: 'O que você perde sem [PRODUTO] até [DATA]',
    ctaTexto: 'Não quero perder',
    modalTitulo: 'A conta de deixar para depois',
    modalConteudo:
      'Faltam **[Nº] dias** para [EVENTO — prova, entrega, encerramento].\n\n' +
      'Sem [PRODUTO], o caminho costuma ser: [O QUE A PESSOA FAZ HOJE] — que custa **[TEMPO/DINHEIRO GASTO]** e ainda deixa [LACUNA].\n\n' +
      'Com ele: [RESULTADO CONCRETO, COM NÚMERO].\n\n' +
      '-# Nenhuma mágica: [LIMITAÇÃO HONESTA DO PRODUTO].',
    modalBotaoTexto: 'Resolver isso agora',
  },
  {
    id: 'ancoragem',
    nome: 'Comparação de preço',
    tecnica: 'Ancoragem',
    comoFunciona: 'O primeiro número apresentado vira a régua: todo valor depois dele parece caro ou barato por comparação.',
    quandoUsar: 'Pacote com desconto, produto mais barato que a alternativa de fora.',
    titulo: '[PREÇO CHEIO] → [PREÇO ATUAL] em [PRODUTO]',
    ctaTexto: 'Ver o preço',
    modalTitulo: 'Quanto custa, comparado com o quê',
    modalConteudo:
      'Comprando separado: **[SOMA DAS PARTES]**.\n\n' +
      'No pacote [PRODUTO]: **[PREÇO ATUAL]** — [PERCENTUAL]% a menos.\n\n' +
      '- [ITEM 1] — [VALOR AVULSO]\n- [ITEM 2] — [VALOR AVULSO]\n- [ITEM 3] — [VALOR AVULSO]\n\n' +
      'Dá **[VALOR POR MÊS/POR DIA]** — menos que [COMPARAÇÃO DO COTIDIANO].',
    modalBotaoTexto: 'Quero por [PREÇO ATUAL]',
  },
  {
    id: 'reciprocidade',
    nome: 'Amostra antes da compra',
    tecnica: 'Reciprocidade',
    comoFunciona: 'Receber algo útil de graça cria disposição para retribuir — e ainda prova a qualidade antes do pagamento.',
    quandoUsar: 'Material com prévia liberada, aula aberta, capítulo de amostra.',
    titulo: '[Nº] páginas de [PRODUTO], liberadas',
    ctaTexto: 'Ler a prévia',
    modalTitulo: 'Leia antes de decidir',
    modalConteudo:
      'As **[Nº] primeiras páginas** de [PRODUTO] estão liberadas, sem cadastro extra e sem pagar nada.\n\n' +
      'Escolhemos justamente [TRECHO ESCOLHIDO — o capítulo mais difícil, o resumo de X], para você julgar pelo que interessa.\n\n' +
      'Se servir, o material completo tem [O QUE MAIS VEM JUNTO].',
    modalBotaoTexto: 'Abrir a prévia',
  },
  {
    id: 'curiosidade',
    nome: 'Lacuna de curiosidade',
    tecnica: 'Curiosidade (efeito Zeigarnik)',
    comoFunciona: 'Uma pergunta aberta fica incomodando até ser respondida — e o clique é o jeito mais rápido de fechá-la.',
    quandoUsar: 'Conteúdo com um insight forte, erro comum, pegadinha de prova.',
    titulo: '[ERRO COMUM] derruba mais gente que [ASSUNTO DIFÍCIL]',
    ctaTexto: 'Descobrir',
    modalTitulo: 'O detalhe que quase todo mundo erra em [ASSUNTO]',
    modalConteudo:
      'Em [Nº] correções de [PROVA/SIMULADO], **[PERCENTUAL]%** das pessoas erraram [PONTO ESPECÍFICO] — e quase sempre pelo mesmo motivo.\n\n' +
      'O motivo é [RESUMO DA CAUSA, SEM ENTREGAR A SOLUÇÃO INTEIRA].\n\n' +
      'Em [PRODUTO] isso está explicado em [ONDE], com [O QUE TEM LÁ — esquema, caso, questão comentada].',
    modalBotaoTexto: 'Ver a explicação',
  },
  {
    id: 'novidade',
    nome: 'Lançamento',
    tecnica: 'Novidade',
    comoFunciona: 'O que é novo chama atenção por si só e dá a quem chega primeiro a sensação de vantagem.',
    quandoUsar: 'Área nova na plataforma, funcionalidade recém-lançada, material inédito.',
    titulo: 'Novo: [PRODUTO] já está no ar',
    ctaTexto: 'Conhecer',
    modalTitulo: '[PRODUTO] acabou de entrar na plataforma',
    modalConteudo:
      'Lançamos [PRODUTO] em [DATA]. Em resumo: **[O QUE É, EM UMA FRASE]**.\n\n' +
      '- [O QUE DÁ PARA FAZER 1]\n- [O QUE DÁ PARA FAZER 2]\n- [O QUE DÁ PARA FAZER 3]\n\n' +
      'Já está incluso em [PLANO/CONDIÇÃO]. Encontrou algo estranho? [COMO RELATAR].',
    modalBotaoTexto: 'Abrir [PRODUTO]',
  },
  {
    id: 'pertencimento',
    nome: 'Feito para o seu período',
    tecnica: 'Identificação e pertencimento',
    comoFunciona: 'Quando a mensagem descreve a situação exata de quem lê, ela deixa de soar como anúncio e passa a soar como resposta.',
    quandoUsar: 'Anúncio segmentado por período — combine com a segmentação de períodos abaixo.',
    titulo: 'Para quem está no [Nº]º período',
    ctaTexto: 'Ver o que tem',
    modalTitulo: 'Montado para o [Nº]º período',
    modalConteudo:
      'Se você está em [MÓDULO/DISCIPLINA ATUAL], provavelmente está lidando com **[DOR ESPECÍFICA DO PERÍODO]**.\n\n' +
      '[PRODUTO] cobre exatamente: [TÓPICO 1], [TÓPICO 2] e [TÓPICO 3] — na ordem em que caem em [PROVA/APG].\n\n' +
      'Quem está em outro período pode usar, mas o recorte foi feito pensando no seu.',
    modalBotaoTexto: 'Ver conteúdo do [Nº]º período',
  },
  {
    id: 'garantia',
    nome: 'Risco zero',
    tecnica: 'Redução de risco',
    comoFunciona: 'Tirar o medo do arrependimento remove a última objeção de quem já quer comprar.',
    quandoUsar: 'Produto pago com garantia, reembolso ou teste gratuito.',
    titulo: '[Nº] dias de garantia em [PRODUTO]',
    ctaTexto: 'Testar sem risco',
    modalTitulo: 'Se não servir, você pede o dinheiro de volta',
    modalConteudo:
      'Você tem **[Nº] dias** para usar [PRODUTO] inteiro. Não gostou, devolvemos [VALOR/PERCENTUAL] — [COMO PEDIR, EM UMA FRASE].\n\n' +
      'Sem formulário de retenção, sem ligação, sem pergunta constrangedora.\n\n' +
      '-# Condições: [CONDIÇÕES REAIS DA GARANTIA].',
    modalBotaoTexto: 'Começar sem risco',
  },
  {
    id: 'passo-simples',
    nome: 'Primeiro passo pequeno',
    tecnica: 'Compromisso e coerência',
    comoFunciona: 'Um primeiro passo pequeno é fácil de aceitar, e quem começa tende a seguir para manter a própria decisão de pé.',
    quandoUsar: 'Hábito que você quer criar — cronograma, revisão diária, primeiro deck.',
    titulo: 'Comece com [AÇÃO DE 2 MINUTOS]',
    ctaTexto: 'Fazer o primeiro passo',
    modalTitulo: 'Dois minutos hoje, o resto vem depois',
    modalConteudo:
      'Não é para reorganizar sua vida de estudos agora. É só **[AÇÃO PEQUENA E CONCRETA]** — leva [TEMPO].\n\n' +
      'Depois disso, a plataforma cuida de [O QUE ACONTECE SOZINHO — lembrete, revisão programada, próximo passo].\n\n' +
      'Quem faz esse primeiro passo costuma [RESULTADO OBSERVADO].',
    modalBotaoTexto: 'Levar [TEMPO] e começar',
  },
]

/** Marcador de rascunho que sobrou no texto, ex.: "[PRODUTO]". */
const PLACEHOLDER_REGEX = /\[[^\]\n]{2,60}\]/g

/** Lista os [MARCADORES] ainda não preenchidos nos textos informados. */
export function listarPlaceholders(...textos: Array<string | undefined>): string[] {
  const encontrados = new Set<string>()
  for (const texto of textos) {
    if (!texto) continue
    for (const match of texto.match(PLACEHOLDER_REGEX) ?? []) {
      encontrados.add(match)
    }
  }
  return Array.from(encontrados)
}
