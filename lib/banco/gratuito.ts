/**
 * A experiência gratuita do Banco de Questões.
 *
 * O modelo antigo era: a pessoa abria a página, um modal pedia que ela
 * escolhesse um PERÍODO da grade da faculdade, e o servidor sorteava 5 questões
 * daquele período — para sempre. Três coisas davam errado nisso, e todas antes
 * de ela ver uma questão:
 *
 * 1. a primeira tela pedia um nome interno ("SOI I") que quem chega de fora não
 *    conhece, e não havia como voltar atrás depois de escolher;
 * 2. se o período tivesse menos de 5 questões, a resposta era um erro pedindo
 *    para escolher outro — a plataforma culpando a pessoa pelo próprio catálogo;
 * 3. as 5 questões eram SORTEADAS. A amostra grátis caía em assuntos aleatórios,
 *    quase nunca no que a pessoa queria testar, que é justamente a única coisa
 *    que faria ela assinar.
 *
 * O modelo novo: o catálogo inteiro fica visível (módulos, tópicos, contagens,
 * enunciado nenhum) e a pessoa ESCOLHE quais questões abrir, até o limite. Cada
 * questão aberta fica desbloqueada para sempre — inclusive a resposta comentada,
 * que é o que mostra o valor do produto.
 *
 * Este arquivo não importa nada: é lido pela tela e pelas rotas, que precisam
 * dar exatamente o mesmo saldo — senão a tela promete uma questão que o servidor
 * recusa.
 */

/** Quantas questões alguém sem assinatura pode abrir, escolhendo quais. */
export const LIMITE_GRATUITO = 10

export interface EstadoGratuito {
  /** Ids já abertos — permanentes. */
  desbloqueadas: string[]
  limite: number
}

/**
 * O saldo da pessoa, fundindo o modelo novo com o antigo.
 *
 * `freeQuestionsByPeriod` é o campo do sorteio por período. Ele continua sendo
 * lido e as questões dele entram como já desbloqueadas: quem chegou ontem não
 * pode abrir a página hoje e descobrir que perdeu o que já tinha visto (§45).
 */
export function lerEstadoGratuito(usuario: {
  bancoQuestoesLiberadas?: unknown
  freeQuestionsByPeriod?: Record<string, string[] | undefined> | null
}): EstadoGratuito {
  const novas = Array.isArray(usuario?.bancoQuestoesLiberadas)
    ? (usuario.bancoQuestoesLiberadas as unknown[]).map((i) => String(i))
    : []

  const legadas: string[] = []
  const porPeriodo = usuario?.freeQuestionsByPeriod
  if (porPeriodo && typeof porPeriodo === 'object') {
    for (const lista of Object.values(porPeriodo)) {
      if (Array.isArray(lista)) legadas.push(...lista.map((i) => String(i)))
    }
  }

  return {
    desbloqueadas: Array.from(new Set([...novas, ...legadas])).filter(Boolean),
    limite: LIMITE_GRATUITO,
  }
}

export function jaDesbloqueada(estado: EstadoGratuito, questaoId: string): boolean {
  return estado.desbloqueadas.includes(questaoId)
}

export function restantes(estado: EstadoGratuito): number {
  return Math.max(0, estado.limite - estado.desbloqueadas.length)
}

export interface ResultadoDeAbertura {
  /** Pode ver a questão inteira agora? */
  liberada: boolean
  /** Precisa gravar o id? Falso quando já estava aberta — reabrir não consome saldo. */
  gravar: boolean
  motivo?: string
}

/**
 * Tentar abrir uma questão.
 *
 * Reabrir uma questão já aberta nunca consome saldo. Se consumisse, a pessoa
 * seria punida por voltar para reler a explicação — que é exatamente o momento
 * em que o produto está se vendendo.
 */
export function tentarAbrir(estado: EstadoGratuito, questaoId: string): ResultadoDeAbertura {
  if (jaDesbloqueada(estado, questaoId)) return { liberada: true, gravar: false }
  if (restantes(estado) <= 0) {
    return {
      liberada: false,
      gravar: false,
      motivo: 'Você já usou suas questões gratuitas.',
    }
  }
  return { liberada: true, gravar: true }
}

/** A frase do contador. Fala em questões, não em porcentagem — é o que dá para agir. */
export function descreverSaldo(estado: EstadoGratuito): string {
  const sobrando = restantes(estado)
  if (sobrando === estado.limite) {
    return `Você tem ${estado.limite} questões gratuitas para abrir as que quiser.`
  }
  if (sobrando === 0) return 'Você abriu suas 10 questões gratuitas.'
  if (sobrando === 1) return 'Resta 1 questão gratuita.'
  return `Restam ${sobrando} questões gratuitas.`
}

/**
 * O que o cartão de uma questão mostra para quem ainda não abriu.
 *
 * Metadado sim, enunciado não: é o suficiente para ESCOLHER onde gastar o saldo
 * — que é a diferença entre uma amostra e um sorteio — sem entregar o banco
 * inteiro para quem não assinou.
 */
export function resumoBloqueado(questao: {
  moduloNome?: string
  topicoNome?: string
  subtopicoNome?: string
  tipo?: string
  dificuldade?: string
  ano?: number
}): { caminho: string; etiquetas: string[] } {
  const caminho = [questao.moduloNome, questao.topicoNome, questao.subtopicoNome]
    .filter(Boolean)
    .join(' › ')

  const etiquetas: string[] = []
  if (questao.tipo) etiquetas.push(questao.tipo === 'discursiva' ? 'Discursiva' : 'Objetiva')
  if (questao.dificuldade) {
    etiquetas.push(
      questao.dificuldade === 'facil' ? 'Fácil' : questao.dificuldade === 'dificil' ? 'Difícil' : 'Média',
    )
  }
  if (questao.ano) etiquetas.push(String(questao.ano))
  return { caminho, etiquetas }
}
