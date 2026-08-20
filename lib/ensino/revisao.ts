/**
 * Área de Revisão (§16, §17, §18).
 *
 * APRENDER E REVISAR SÃO DUAS COISAS
 *
 * Aprender é conteúdo novo, e a ferramenta é a Trilha com a aula completa.
 * Revisar é voltar ao que já se estudou, e as ferramentas são outras — a Aula
 * Resumo, o PDF, os flashcards. Misturar as duas experiências numa tela só
 * produz o que a área antiga tinha: uma lista de vídeos que não distingue "não
 * vi ainda" de "vi e preciso fixar".
 *
 * A MESMA BASE ALIMENTA AS DUAS
 *
 * Nada é duplicado. A revisão é uma LEITURA diferente do mesmo acervo: as
 * aulas concluídas, com os recursos de revisão que cada uma já tem. Se uma aula
 * ganha um deck de flashcards amanhã, ela aparece melhor na revisão sem
 * ninguém cadastrar nada de novo.
 *
 * O CRITÉRIO DE PRIORIDADE
 *
 * Sem desempenho de questões (que ainda não está ligado — §18), o melhor sinal
 * disponível é o TEMPO desde a conclusão, temperado por dois ajustes honestos:
 * conteúdo que a pessoa deixou pela metade sobe (é dívida aberta), e conteúdo
 * sem nenhum recurso de revisão desce (não há o que revisar ali além de rever
 * o vídeo inteiro). Quando o desempenho chegar, ele entra como mais um termo —
 * a assinatura de `ordenarParaRevisao` já prevê isso.
 *
 * Módulo puro. Nenhuma consulta, nenhuma data "de hoje" escondida: o `agora`
 * entra por parâmetro para o teste conseguir simular três meses.
 */

const DIA_EM_MS = 24 * 60 * 60 * 1000

/** O que a revisão precisa saber sobre uma aula já estudada. */
export interface AulaRevisavel {
  aulaId: string
  titulo: string
  /** Localização legível: "Cardiologia · Insuficiência Cardíaca". */
  localizacao?: string
  concluida: boolean
  percentual: number
  /** Última interação do aluno com a aula. */
  atualizadoEm: Date | string
  concluidaEm?: Date | string | null
  temResumo: boolean
  temPdf: boolean
  temFlashcards: boolean
  /** Sinal futuro de desempenho: 0 (péssimo) a 1 (dominado). */
  desempenho?: number | null
}

export interface ItemDeRevisao extends AulaRevisavel {
  /** Dias desde a última interação. */
  diasParado: number
  /** Quanto esta aula pede revisão, de 0 a 100. */
  prioridade: number
  /** A frase que a tela mostra: "Estudada há 3 meses". */
  motivo: string
  /** Ferramentas de revisão disponíveis, na ordem de menor esforço. */
  ferramentas: Array<'resumo' | 'flashcards' | 'pdf' | 'aula'>
}

function paraData(valor: Date | string | null | undefined): number {
  if (!valor) return 0
  const data = valor instanceof Date ? valor : new Date(valor)
  const tempo = data.getTime()
  return Number.isNaN(tempo) ? 0 : tempo
}

function diasEntre(inicio: number, agora: number): number {
  if (!inicio) return 0
  return Math.max(0, Math.floor((agora - inicio) / DIA_EM_MS))
}

/** "há 3 dias", "há 2 meses" — a mesma escala em toda a área de revisão. */
export function tempoLegivel(dias: number): string {
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  const meses = Math.round(dias / 30)
  if (meses < 12) return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.round(meses / 12)
  return `há ${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

/**
 * A prioridade de revisão de uma aula.
 *
 * A escala satura em 90 dias porque, passado isso, "há três meses" e "há oito
 * meses" pedem a mesma coisa: rever. Continuar crescendo só faria a lista
 * ordenar por idade de acervo, empurrando para o fim tudo que a pessoa estudou
 * recentemente e de fato ainda vai cair na prova.
 */
export function calcularPrioridade(
  aula: AulaRevisavel,
  agora: number = Date.now(),
): { prioridade: number; diasParado: number; motivo: string } {
  const referencia = paraData(aula.concluidaEm) || paraData(aula.atualizadoEm)
  const diasParado = diasEntre(referencia, agora)

  // Base: 0 a 60 pontos conforme o tempo, saturando em 90 dias.
  let prioridade = Math.min(60, Math.round((diasParado / 90) * 60))
  let motivo = aula.concluida
    ? `Estudada ${tempoLegivel(diasParado)}`
    : `Interrompida ${tempoLegivel(diasParado)}`

  // Dívida aberta: começou e não terminou. Sobe, e o motivo muda — é a
  // informação mais acionável que a tela tem sobre esta aula.
  if (!aula.concluida && aula.percentual > 0) {
    prioridade += 25
    motivo = `Parou em ${aula.percentual}% ${tempoLegivel(diasParado)}`
  }

  // Desempenho ruim é o sinal mais forte que existe, quando existe (§18).
  if (typeof aula.desempenho === 'number' && aula.desempenho >= 0) {
    prioridade += Math.round((1 - Math.min(1, aula.desempenho)) * 30)
    if (aula.desempenho < 0.6) motivo = 'Você está errando bastante neste assunto'
  }

  // Sem resumo, PDF nem flashcards, revisar significa reassistir a aula inteira
  // — o caminho mais caro. Desce, mas não some: continua revisável.
  if (!aula.temResumo && !aula.temPdf && !aula.temFlashcards) prioridade -= 15

  return { prioridade: Math.max(0, Math.min(100, prioridade)), diasParado, motivo }
}

/** As ferramentas de revisão, da que custa menos tempo para a que custa mais. */
export function ferramentasDe(aula: AulaRevisavel): ItemDeRevisao['ferramentas'] {
  const lista: ItemDeRevisao['ferramentas'] = []
  if (aula.temResumo) lista.push('resumo')
  if (aula.temFlashcards) lista.push('flashcards')
  if (aula.temPdf) lista.push('pdf')
  lista.push('aula')
  return lista
}

/**
 * A fila de revisão, ordenada.
 *
 * Só entra o que a pessoa já viu: revisão de conteúdo nunca aberto não é
 * revisão, é a Trilha. Esse filtro é a fronteira entre a Área de Aprender e a
 * Área de Revisar, e ele mora aqui para as duas telas não discordarem.
 */
export function ordenarParaRevisao(
  aulas: AulaRevisavel[],
  opcoes: { agora?: number; limite?: number } = {},
): ItemDeRevisao[] {
  const agora = opcoes.agora ?? Date.now()

  const itens = aulas
    .filter((a) => a.concluida || a.percentual > 0)
    .map((aula) => {
      const { prioridade, diasParado, motivo } = calcularPrioridade(aula, agora)
      return { ...aula, prioridade, diasParado, motivo, ferramentas: ferramentasDe(aula) }
    })

  itens.sort(
    (a, b) =>
      b.prioridade - a.prioridade ||
      b.diasParado - a.diasParado ||
      a.titulo.localeCompare(b.titulo, 'pt-BR'),
  )

  return opcoes.limite ? itens.slice(0, Math.max(1, opcoes.limite)) : itens
}

/**
 * O que oferecer logo depois de concluir uma aula (§17).
 *
 * Discreto e opcional por decisão de produto: o aluno acabou de terminar, e
 * transformar isso numa lista de tarefas obrigatórias é o jeito mais rápido de
 * fazer a conclusão parecer punição. Devolve no máximo três atalhos, e nenhum
 * quando a aula não tem material de revisão — oferecer "reassistir o que você
 * acabou de assistir" é ruído.
 */
export function reforcoAposConcluir(aula: {
  aulaId: string
  temResumo: boolean
  temPdf: boolean
  temFlashcards: boolean
  resumoId?: string | null
}): Array<{ rotulo: string; href: string }> {
  const atalhos: Array<{ rotulo: string; href: string }> = []
  if (aula.temResumo && aula.resumoId) {
    atalhos.push({ rotulo: 'Assistir ao resumo', href: `/aulas/${aula.resumoId}` })
  }
  if (aula.temFlashcards) {
    atalhos.push({ rotulo: 'Revisar flashcards', href: `/aulas/${aula.aulaId}?aba=flashcards` })
  }
  if (aula.temPdf) {
    atalhos.push({ rotulo: 'Abrir o PDF', href: `/aulas/${aula.aulaId}?aba=pdf` })
  }
  return atalhos.slice(0, 3)
}
