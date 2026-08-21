/**
 * Progresso do aluno — onde parou, quanto assistiu, o que concluiu.
 *
 * O modelo antigo guardava conclusão como um array dentro da própria aula
 * (`aulas_postagens.usuariosConcluidos: string[]`). Isso resolve "concluiu?" e
 * mais nada: não sabe em que segundo a pessoa parou, não sabe quanto ela viu,
 * e cresce dentro do documento da aula — uma aula com 5 mil alunos vira um
 * documento com 5 mil IDs, carregado inteiro toda vez que alguém abre a aula.
 *
 * Aqui o progresso vira o que ele é: um registro por (usuário, aula), na
 * coleção `aulas_progresso`. É o que sustenta continuar de onde parou (§7),
 * porcentagem por aula/módulo/curso (§8), retomada entre aparelhos (§32) e
 * conclusão automática por percentual (§34).
 *
 * Módulo puro de propósito — a matemática de progresso é exatamente o tipo de
 * coisa que quebra em silêncio (divisão por zero num vídeo sem duração, barra
 * passando de 100%, "concluído" que volta para 99%) e que testes pegam de
 * graça.
 */

/** Percentual assistido a partir do qual a aula conta como concluída (§34). */
export const PERCENTUAL_CONCLUSAO_PADRAO = 90

/**
 * Abaixo disto, "continuar de onde parou" é ruído: a pessoa mal começou e
 * retomar aos 4 segundos é pior do que começar do início.
 */
export const SEGUNDOS_MINIMOS_PARA_RETOMAR = 15

/**
 * Perto do fim, retomar joga a pessoa nos créditos. Se faltam menos que isto
 * para acabar, o certo é oferecer a próxima aula, não a retomada.
 */
export const SEGUNDOS_DE_FOLGA_NO_FIM = 20

export interface ProgressoDaAula {
  aulaId: string
  usuarioId: string
  /** Última posição do vídeo, em segundos. */
  posicaoSegundos: number
  /** Duração conhecida do vídeo, em segundos. `0` quando ainda não se sabe. */
  duracaoSegundos: number
  /** Maior percentual já alcançado (não regride se a pessoa voltar o vídeo). */
  percentual: number
  concluida: boolean
  concluidaEm?: Date | null
  /** Marcada à mão pelo aluno, não pelo player (§34). */
  concluidaManualmente?: boolean
  atualizadoEm: Date
}

/** Percentual assistido, protegido contra vídeo sem duração e contra >100. */
export function calcularPercentual(posicaoSegundos: number, duracaoSegundos: number): number {
  const posicao = Math.max(0, Number(posicaoSegundos) || 0)
  const duracao = Math.max(0, Number(duracaoSegundos) || 0)
  // Sem duração conhecida não dá para inventar percentual. Devolver 0 é
  // honesto; devolver qualquer outra coisa pinta barra de progresso com chute.
  if (duracao <= 0) return 0
  return Math.min(100, Math.round((posicao / duracao) * 100))
}

/**
 * A aula deve contar como concluída?
 *
 * O percentual só cresce: quem assistiu 95% e voltou para rever os 10% iniciais
 * não "desconclui" a aula. Por isso a decisão usa o maior percentual já
 * atingido, não o atual.
 */
export function deveConcluir(
  percentualMaximo: number,
  limite = PERCENTUAL_CONCLUSAO_PADRAO,
): boolean {
  const alvo = Math.min(100, Math.max(1, Number(limite) || PERCENTUAL_CONCLUSAO_PADRAO))
  return Number(percentualMaximo || 0) >= alvo
}

/**
 * Aplica uma batida do player sobre o progresso guardado.
 *
 * Recebe o estado anterior (ou `null` na primeira vez) e devolve o novo. Toda a
 * regra de "não regredir" mora aqui, num lugar só — se ficasse espalhada pelo
 * handler da API, cada rota que salvasse progresso teria a sua versão da regra.
 */
export function aplicarBatida(
  anterior: ProgressoDaAula | null,
  batida: {
    posicaoSegundos: number
    duracaoSegundos?: number
    limiteConclusao?: number
    agora?: Date
  },
): Pick<ProgressoDaAula, 'posicaoSegundos' | 'duracaoSegundos' | 'percentual' | 'concluida' | 'concluidaEm' | 'atualizadoEm'> {
  const agora = batida.agora || new Date()
  const posicao = Math.max(0, Number(batida.posicaoSegundos) || 0)
  // A duração pode chegar depois (o player só sabe quando o metadata carrega),
  // então nunca deixamos uma batida sem duração apagar a que já tínhamos.
  const duracao = Math.max(
    0,
    Number(batida.duracaoSegundos) || anterior?.duracaoSegundos || 0,
  )

  const percentualAgora = calcularPercentual(posicao, duracao)
  const percentual = Math.max(percentualAgora, anterior?.percentual || 0)

  // Conclusão manual do aluno não é revogada por ele reabrir a aula no início.
  const jaConcluida = anterior?.concluida === true
  const concluida = jaConcluida || deveConcluir(percentual, batida.limiteConclusao)

  return {
    posicaoSegundos: posicao,
    duracaoSegundos: duracao,
    percentual,
    concluida,
    concluidaEm: concluida ? (anterior?.concluidaEm || agora) : null,
    atualizadoEm: agora,
  }
}

/**
 * A pessoa realmente COMEÇOU esta aula?
 *
 * Existe porque "tem registro de progresso" e "assistiu" não são a mesma
 * coisa. O player grava a cada dez segundos, ao pausar e ao sair; abrir uma
 * aula e deixar o vídeo rodar dois segundos enquanto se lê o título já produz
 * um registro, e num vídeo curto esses dois segundos arredondam para 1%. Com o
 * corte em `percentual > 0`, esse 1% bastava para a aula virar "continue de
 * onde parou" na home e para a Trilha inteira passar a se dizer iniciada.
 *
 * O corte é o mesmo `SEGUNDOS_MINIMOS_PARA_RETOMAR` de `podeRetomar`: um só
 * número decide onde a retomada começa a existir, e as duas perguntas
 * ("entrou na lista?" e "dá para retomar num ponto?") não podem discordar.
 *
 * Aula concluída conta como começada mesmo com posição zero: é o caso da
 * conclusão manual (§34) e o do vídeo em iframe, onde não há tempo para ler.
 */
export function comecouDeVerdade(
  progresso: { posicaoSegundos?: number; concluida?: boolean } | null | undefined,
): boolean {
  if (!progresso) return false
  if (progresso.concluida) return true
  return (Number(progresso.posicaoSegundos) || 0) >= SEGUNDOS_MINIMOS_PARA_RETOMAR
}

/**
 * Vale oferecer "continuar de 18:42"?
 *
 * Falso no começo (não há o que retomar) e no fim (retomar cairia nos créditos
 * — ali o próximo passo é a aula seguinte, não esta).
 */
export function podeRetomar(progresso: Pick<ProgressoDaAula, 'posicaoSegundos' | 'duracaoSegundos' | 'concluida'> | null): boolean {
  if (!progresso) return false
  if (progresso.concluida) return false
  if (progresso.posicaoSegundos < SEGUNDOS_MINIMOS_PARA_RETOMAR) return false
  if (progresso.duracaoSegundos > 0) {
    const restante = progresso.duracaoSegundos - progresso.posicaoSegundos
    if (restante <= SEGUNDOS_DE_FOLGA_NO_FIM) return false
  }
  return true
}

/** `1122` → `"18:42"`; passa a exibir horas só quando existem (`"1:05:03"`). */
export function formatarTempo(segundos: number): string {
  const total = Math.max(0, Math.floor(Number(segundos) || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const doisDigitos = (n: number) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${doisDigitos(m)}:${doisDigitos(s)}`
  return `${m}:${doisDigitos(s)}`
}

/* =================== AGREGADO DO CURSO =================== */

export interface ResumoDeProgresso {
  total: number
  concluidas: number
  percentual: number
  /** Aula que o aluno deve abrir agora: a em andamento, ou a próxima não vista. */
  proximaAulaId: string | null
}

/**
 * Progresso de um conjunto de aulas (módulo, seção ou curso inteiro).
 *
 * `aulasOrdenadas` precisa vir na ordem de estudo — é ela que define qual é "a
 * próxima". A regra de escolha: retomar a que está no meio ganha de começar uma
 * nova, porque terminar o que se começou é o passo com menos atrito.
 */
export function resumirProgresso(
  aulasOrdenadas: string[],
  progressoPorAula: Map<string, Pick<ProgressoDaAula, 'concluida' | 'percentual'>>,
): ResumoDeProgresso {
  const total = aulasOrdenadas.length
  if (total === 0) {
    return { total: 0, concluidas: 0, percentual: 0, proximaAulaId: null }
  }

  let concluidas = 0
  let emAndamento: string | null = null
  let primeiraNaoVista: string | null = null

  for (const aulaId of aulasOrdenadas) {
    const p = progressoPorAula.get(aulaId)
    if (p?.concluida) {
      concluidas += 1
      continue
    }
    if (p && p.percentual > 0 && emAndamento === null) emAndamento = aulaId
    if (!p && primeiraNaoVista === null) primeiraNaoVista = aulaId
  }

  // Curso terminado não aponta "próxima" — a tela deve comemorar, não empurrar.
  const proximaAulaId = concluidas === total
    ? null
    : emAndamento || primeiraNaoVista || aulasOrdenadas.find((id) => !progressoPorAula.get(id)?.concluida) || null

  return {
    total,
    concluidas,
    percentual: Math.round((concluidas / total) * 100),
    proximaAulaId,
  }
}
