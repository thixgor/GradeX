import {
  aplicarRecorte,
  embaralhar,
  gerador,
  normalizar,
  type Ocorrencia,
  type RecorteQuiz,
} from './recorte-quiz'
import { getMarkerInsight, type MarkerInsight } from './insights'

export type { Ocorrencia, RecorteQuiz } from './recorte-quiz'

/**
 * Montagem e comentário das questões do quiz de identificação.
 *
 * A prancha marcada é, por natureza, uma pergunta: existe um número apontando
 * para algo e um nome do outro lado. Este módulo inverte a ordem — mostra o
 * marcador sozinho e pede o nome —, e devolve, junto da resposta, um comentário
 * escrito como um professor comentaria: por que é aquela, por que não são as
 * outras, e o que costuma ser cobrado dali.
 *
 * O recorte, a contagem e o sorteio reprodutível ficam em `recorte-quiz`, que a
 * tela de configuração usa sozinha — sem arrastar o dicionário de estruturas,
 * que só a rodada precisa.
 */

/* ══════════════════════════ Montagem da questão ══════════════════════════ */

export interface Alternativa {
  texto: string
  correta: boolean
  /** Ficha da estrutura da alternativa — alimenta o comentário. */
  insight: MarkerInsight | null
}

export interface QuestaoQuiz {
  id: string
  ocorrencia: Ocorrencia
  insight: MarkerInsight
  alternativas: Alternativa[]
  /** Índice da alternativa correta em `alternativas`. */
  correta: number
}

const ALTERNATIVAS_POR_QUESTAO = 4

/**
 * Fichas memoizadas.
 *
 * Montar os distratores varre o universo inteiro procurando estruturas da mesma
 * classe, e cada consulta de classe passa pelo dicionário. Sem cache, uma rodada
 * de vinte questões recalcularia a mesma ficha dezenas de milhares de vezes.
 */
const cacheFichas = new Map<string, MarkerInsight>()

function fichaDe(ocorrencia: Ocorrencia): MarkerInsight {
  const chave = `${ocorrencia.pecaId}:${ocorrencia.marcador.title}`
  const guardada = cacheFichas.get(chave)
  if (guardada) return guardada

  const ficha = getMarkerInsight(ocorrencia.marcador, {
    sistema: ocorrencia.sistemaSlug,
    caminho: ocorrencia.caminho,
    prancha: ocorrencia.pecaTitulo,
  })
  cacheFichas.set(chave, ficha)
  return ficha
}

/**
 * Distratores em camadas, da melhor para a pior qualidade.
 *
 * A camada boa é a própria prancha: as outras estruturas ali estão à vista, são
 * vizinhas de verdade e obrigam o aluno a olhar a peça em vez de eliminar pelo
 * absurdo. Só quando a prancha não tem candidatos suficientes é que o sorteio
 * abre para a coleção, para a mesma classe estrutural e, por último, para o
 * sistema inteiro.
 */
function montarDistratores(alvo: Ocorrencia, universo: Ocorrencia[], sortear: () => number): Ocorrencia[] {
  const nomeAlvo = normalizar(alvo.marcador.title)
  const vistos = new Set([nomeAlvo])
  const escolhidos: Ocorrencia[] = []
  const classeAlvo = fichaDe(alvo).classeId

  const camadas: Ocorrencia[][] = [
    universo.filter(item => item.pecaId === alvo.pecaId),
    universo.filter(item => item.colecaoSlug === alvo.colecaoSlug),
    universo.filter(item => item.sistemaSlug === alvo.sistemaSlug && fichaDe(item).classeId === classeAlvo),
    universo.filter(item => item.sistemaSlug === alvo.sistemaSlug),
    universo,
  ]

  for (const camada of camadas) {
    if (escolhidos.length >= ALTERNATIVAS_POR_QUESTAO - 1) break
    for (const candidato of embaralhar(camada, sortear)) {
      if (escolhidos.length >= ALTERNATIVAS_POR_QUESTAO - 1) break
      const nome = normalizar(candidato.marcador.title)
      if (vistos.has(nome)) continue
      // Nomes que só diferem por lado ou por número ("Costela I" x "Costela II")
      // viram pegadinha injusta quando a peça não mostra a diferença.
      if (nome.includes(nomeAlvo) || nomeAlvo.includes(nome)) continue
      vistos.add(nome)
      escolhidos.push(candidato)
    }
  }

  return escolhidos
}

export function montarQuiz(
  ocorrencias: Ocorrencia[],
  recorte: RecorteQuiz,
  quantidade: number,
  semente: number,
): QuestaoQuiz[] {
  const sortear = gerador(semente)
  const universo = aplicarRecorte(ocorrencias, recorte)
  if (universo.length === 0) return []

  const questoes: QuestaoQuiz[] = []
  const usados = new Set<string>()

  for (const alvo of embaralhar(universo, sortear)) {
    if (questoes.length >= quantidade) break
    const nome = normalizar(alvo.marcador.title)
    // Uma estrutura por rodada: repetir "Processo Espinhoso" seis vezes numa
    // prova de vinte questões seria só perda de tempo do aluno.
    if (usados.has(nome)) continue

    const distratores = montarDistratores(alvo, universo, sortear)
    if (distratores.length < ALTERNATIVAS_POR_QUESTAO - 1) continue

    usados.add(nome)
    const insight = fichaDe(alvo)
    const alternativas = embaralhar(
      [
        { texto: alvo.marcador.title, correta: true, insight },
        ...distratores.map(item => ({ texto: item.marcador.title, correta: false, insight: fichaDe(item) })),
      ],
      sortear,
    )

    questoes.push({
      id: `${alvo.pecaId}:${nome}`,
      ocorrencia: alvo,
      insight,
      alternativas,
      correta: alternativas.findIndex(alternativa => alternativa.correta),
    })
  }

  return questoes
}

/* ══════════════════════════ Resposta comentada ══════════════════════════ */

export interface BlocoComentario {
  titulo: string
  texto: string
}

export interface ComentarioAlternativa {
  texto: string
  correta: boolean
  comentario: string
}

export interface Comentario {
  /** Frase de abertura, conversando com quem acabou de responder. */
  abertura: string
  /** Por que a resposta é aquela, olhando para a peça. */
  identificacao: string
  /** O aprofundamento propriamente dito. */
  blocos: BlocoComentario[]
  /** Comentário alternativa por alternativa. */
  alternativas: ComentarioAlternativa[]
  /** Fecho com a pérola que costuma ser cobrada. */
  fechamento: string
}

/** Escolhe um item da lista de forma estável a partir de um texto. */
function variar<T>(opcoes: T[], chave: string): T {
  let soma = 0
  for (let i = 0; i < chave.length; i++) soma = (soma * 31 + chave.charCodeAt(i)) >>> 0
  return opcoes[soma % opcoes.length]
}

const ABERTURAS_ACERTO = [
  'Isso aí. Mas vale entender por que era essa mesmo, porque acertar por eliminação não sustenta na prova prática.',
  'Exato. E já que você identificou, vamos aproveitar para amarrar o que costuma vir junto dessa estrutura.',
  'Certíssimo. Agora repare no que a peça está te mostrando, porque é isso que você vai reconhecer no cadáver e na imagem.',
  'É essa mesmo. Guarde o raciocínio que te levou até ela — é ele que se repete nas outras pranchas da região.',
]

const ABERTURAS_ERRO = [
  'Não é essa, e o erro aqui é comum. Vamos por partes, porque o caminho até a resposta é mais útil que a resposta.',
  'Escorregou nessa — e olha, é uma confusão clássica. Vale mais entender o que separa as duas do que decorar o nome.',
  'Ainda não. Antes de olhar o nome certo, repare no que a peça mostra: quase sempre a pista está na própria imagem.',
  'Passou perto. A boa notícia é que esse tipo de erro some quando você para de decorar nome e começa a ler a posição.',
]

const FECHAMENTOS = [
  'Antes de seguir, teste-se: você consegue responder',
  'Fecha o raciocínio checando se você sabe dizer',
  'Vale sair desta questão sabendo responder',
  'O que essa estrutura costuma cobrar de você:',
]

/**
 * Monta a resposta comentada.
 *
 * A régua foi escrever como um professor comenta uma questão em voz alta: abre
 * conversando, mostra o raciocínio antes do nome, aprofunda, passa alternativa
 * por alternativa dizendo o que cada uma é de verdade — porque metade do
 * aprendizado de uma questão de identificação está nos distratores — e fecha com
 * o detalhe que costuma ser cobrado.
 */
export function comentar(questao: QuestaoQuiz, indiceEscolhido: number | null): Comentario {
  const { insight, ocorrencia } = questao
  const nome = ocorrencia.marcador.title
  const acertou = indiceEscolhido === questao.correta
  const chave = questao.id

  const abertura = acertou ? variar(ABERTURAS_ACERTO, chave) : variar(ABERTURAS_ERRO, chave)

  // Quando a ficha é curada, a identificação pode ser assertiva. Quando não é,
  // o texto de classe é genérico ("órgão de uma cavidade corporal…") e afirmar
  // aquilo como se fosse a definição da estrutura seria simplesmente errado —
  // aí vale mais a descrição do próprio acervo, que é específica.
  const definicao = insight.aprofundado ? insight.resumo : insight.notaAcervo || insight.resumo
  const identificacao = [
    `A estrutura marcada é **${nome}** — ${minusculaInicial(definicao)}`,
    insight.aprofundado ? `Na peça, você chega nela pela posição: ${minusculaInicial(insight.localizacao)}` : '',
    insight.contextoRegional
      ? `A prancha é de ${insight.regiao.toLowerCase()}, e isso ajuda a situar: ${minusculaInicial(insight.contextoRegional)}`
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const blocos: BlocoComentario[] = []

  if (insight.aprofundado || !insight.notaAcervo) {
    blocos.push({
      titulo: 'O que ela faz',
      texto: insight.aprofundado
        ? `${insight.funcao} Entender a função aqui não é detalhe: é ela que explica por que a estrutura tem a forma e a posição que você acabou de ver.`
        : insight.funcao,
    })
  }

  if (insight.vascularizacao) {
    blocos.push({
      titulo: insight.vasosRegionais ? 'Quem irriga a região' : 'Vascularização',
      texto: insight.vasosRegionais
        ? `${insight.vascularizacao} Vale a ressalva: essa é a irrigação da região demonstrada, o quadro geral em que a estrutura está inserida.`
        : `${insight.vascularizacao} Sangramento e isquemia seguem esse mapa — é por ele que se entende o que acontece quando o vaso falha.`,
    })
  }

  if (insight.inervacao) {
    blocos.push({
      titulo: insight.vasosRegionais ? 'Inervação da região' : 'Inervação',
      texto: `${insight.inervacao} Guarde a raiz junto do nervo: é a combinação dos dois que transforma um déficit no exame físico em um diagnóstico topográfico.`,
    })
  }

  if (insight.relacoes) {
    blocos.push({
      titulo: 'Com quem ela faz vizinhança',
      texto: `${insight.relacoes} Em anatomia, quase todo risco cirúrgico e quase todo achado de imagem nascem de uma relação de vizinhança como essa.`,
    })
  }

  if (insight.reparos) {
    blocos.push({
      titulo: 'Como achar isso no paciente',
      texto: `${insight.reparos} É o tipo de referência que separa quem sabe a prancha de quem sabe examinar.`,
    })
  }

  blocos.push({
    titulo: 'Por que isso importa na clínica',
    texto: insight.clinica,
  })

  if (insight.notaAcervo && insight.aprofundado) {
    blocos.push({ titulo: 'Nota do acervo', texto: insight.notaAcervo })
  }

  const alternativas: ComentarioAlternativa[] = questao.alternativas.map((alternativa, indice) => ({
    texto: alternativa.texto,
    correta: alternativa.correta,
    comentario: alternativa.correta
      ? `É esta. ${definicao}`
      : comentarDistrator(alternativa, insight, indice === indiceEscolhido, indice),
  }))

  // `pontos` são perguntas ("Origem, inserção e ação principal"), não afirmações.
  // Apresentá-las como pérola soava truncado; como autoteste, funcionam.
  const fechamento =
    insight.pontos.length > 0
      ? `${variar(FECHAMENTOS, chave)} ${insight.pontos.map(minusculaInicial).join('; ')}. Se travar em algum, é ali que vale voltar na prancha.`
      : `${variar(FECHAMENTOS, chave)} ${minusculaInicial(insight.resumo)}`

  return { abertura, identificacao, blocos, alternativas, fechamento }
}

/**
 * Comentário de um distrator.
 *
 * Metade do aprendizado de uma questão de identificação está aqui: saber por
 * que **não** é a outra estrutura é o que constrói o diagnóstico diferencial
 * anatômico. Por isso o critério de exclusão fica mais específico quanto mais
 * perto o distrator estiver da resposta.
 *
 * O cuidado extra é não repetir texto: três distratores da mesma classe e da
 * mesma região caem todos no mesmo molde, e o aluno lê a mesma frase três
 * vezes. Quando não há conteúdo específico sobre aquela estrutura, o comentário
 * encurta e muda de ângulo em vez de encher linguiça.
 */
function comentarDistrator(
  alternativa: Alternativa,
  correto: MarkerInsight,
  foiEscolhida: boolean,
  indice: number,
): string {
  const ficha = alternativa.insight
  const prefixo = foiEscolhida ? 'Foi a sua escolha. ' : ''

  if (!ficha) return `${prefixo}Não é esta: a estrutura marcada na peça é outra.`

  const mesmaRegiao = ficha.regiao === correto.regiao
  const mesmaClasse = ficha.classeId === correto.classeId
  // Só vale citar como definição o que é específico daquela estrutura: a ficha
  // curada ou a descrição do acervo. O texto de classe é o mesmo para dezenas
  // de marcadores e não diz nada sobre esta.
  const especifico = ficha.aprofundado ? ficha.resumo : ficha.notaAcervo || ''

  if (especifico) {
    if (mesmaRegiao && mesmaClasse) {
      return `${prefixo}Chega perto — mesma região, mesma natureza. ${especifico} O que decide é a posição do marcador na peça.`
    }
    if (mesmaRegiao) {
      return `${prefixo}Está na mesma região, mas é outra coisa: ${minusculaInicial(ficha.classe)}. ${especifico}`
    }
    if (mesmaClasse) {
      return `${prefixo}Mesma classe de estrutura, região diferente — pertence a ${ficha.regiao.toLowerCase()}. ${especifico}`
    }
    return `${prefixo}Não é esta. ${especifico}`
  }

  // Sem conteúdo específico, o comentário se apoia no que é verdadeiro e
  // verificável: a classe, a região e o fato de a peça estar mostrando outra
  // coisa. Alterna a formulação para não repetir nos distratores irmãos.
  const semConteudo = [
    `${prefixo}Também aparece nesta região, mas o marcador não está sobre ela — compare a posição das duas na prancha.`,
    `${prefixo}É ${minusculaInicial(ficha.classe)} ${mesmaRegiao ? 'da mesma região' : `de ${ficha.regiao.toLowerCase()}`}, e não o que o número está apontando.`,
    `${prefixo}Fica ${mesmaRegiao ? 'por perto na mesma prancha' : `em ${ficha.regiao.toLowerCase()}`}, mas não é a estrutura marcada aqui.`,
  ]
  return variar(semConteudo, `${alternativa.texto}${indice}`)
}

function minusculaInicial(texto: string) {
  if (!texto) return ''
  // Só rebaixa quando a primeira palavra não é nome próprio de estrutura
  // (as fichas começam com termos comuns: "Osso ímpar...", "Músculo...").
  return texto.charAt(0).toLocaleLowerCase('pt-BR') + texto.slice(1)
}
