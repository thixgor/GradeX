/**
 * Leitura de progresso de um cronograma.
 *
 * Existe porque a mesma pergunta é feita em três telas — a lista de planos, a
 * barra de foco da página inicial e o plano aberto — e antes cada uma
 * respondia do seu jeito, contando atividades num laço próprio. O resultado
 * era que o card dizia "42%" e a tela do plano dizia outra coisa assim que uma
 * das duas ganhava um caso novo.
 *
 * Mais importante: percentual sozinho não responde a pergunta que o aluno faz
 * de verdade, que é *"estou em dia?"*. Um plano de 60 dias com 20% feito está
 * ótimo na primeira semana e perdido na quinta. Por isso tudo aqui é medido
 * contra HOJE — o que venceu e não foi feito é `atrasadas`, e é esse número
 * que a interface mostra em destaque.
 *
 * Módulo puro e client-safe: nada de `mongodb`, nada de `Date` local (o
 * calendário do aluno é o de Brasília, e quem decide isso é quem chama).
 */

export type TipoAtividade = 'estudo' | 'revisao' | 'reta-final'

export interface AtividadeDoPlano {
  id: string
  modulo?: string
  topico?: string
  subtopico?: string
  horas?: number
  concluido?: boolean
  tipo?: TipoAtividade
}

export interface DiaDoPlano {
  /** "AAAA-MM-DD" no fuso de Brasília. */
  data: string
  horasDisponivel?: number
  atividades?: AtividadeDoPlano[]
}

export interface PlanoBruto {
  _id?: string
  titulo?: string
  totalHoras?: number
  concluido?: boolean
  cronograma?: DiaDoPlano[]
}

/** Carga de estudo de um dia, somada de todos os planos ativos. */
export interface CargaDoDia {
  horas: number
  itens: number
  concluidos: number
}

export interface ResumoPlano {
  total: number
  feitas: number
  percentual: number
  revisoes: number
  /** Vencidas: agendadas antes de hoje e ainda abertas. É o número que importa. */
  atrasadas: number
  horasAtrasadas: number
  /** O que está marcado para hoje. */
  hojeTotal: number
  hojeFeitas: number
  hojeHoras: number
  inicio?: string
  fim?: string
  /** Primeiro dia com atividade em aberto, de hoje em diante. */
  proximoDia?: string
  /** O plano ainda não começou (todo ele está no futuro). */
  naoComecou: boolean
  /** Nada mais a fazer. */
  terminado: boolean
  /** Nada vencido em aberto e ainda há trabalho pela frente. */
  emDia: boolean
}

const VAZIO: ResumoPlano = {
  total: 0,
  feitas: 0,
  percentual: 0,
  revisoes: 0,
  atrasadas: 0,
  horasAtrasadas: 0,
  hojeTotal: 0,
  hojeFeitas: 0,
  hojeHoras: 0,
  naoComecou: false,
  terminado: true,
  emDia: true,
}

/** Meia hora é a menor unidade que o gerador produz; arredondar evita "2.9999h". */
function meiaHora(valor: number): number {
  return Math.round(valor * 2) / 2
}

export function resumirPlano(plano: PlanoBruto | null | undefined, hoje: string): ResumoPlano {
  const dias = plano?.cronograma ?? []
  if (dias.length === 0) return { ...VAZIO }

  let total = 0
  let feitas = 0
  let revisoes = 0
  let atrasadas = 0
  let horasAtrasadas = 0
  let hojeTotal = 0
  let hojeFeitas = 0
  let hojeHoras = 0
  let inicio: string | undefined
  let fim: string | undefined
  let proximoDia: string | undefined

  for (const dia of dias) {
    const atividades = dia.atividades ?? []
    if (atividades.length === 0) continue

    if (!inicio || dia.data < inicio) inicio = dia.data
    if (!fim || dia.data > fim) fim = dia.data

    let abertasNoDia = 0

    for (const atividade of atividades) {
      const horas = Number(atividade.horas) || 0
      total += 1
      if (atividade.concluido) feitas += 1
      else abertasNoDia += 1
      if (atividade.tipo === 'revisao') revisoes += 1

      if (dia.data < hoje && !atividade.concluido) {
        atrasadas += 1
        horasAtrasadas += horas
      }

      if (dia.data === hoje) {
        hojeTotal += 1
        hojeHoras += horas
        if (atividade.concluido) hojeFeitas += 1
      }
    }

    if (abertasNoDia > 0 && dia.data >= hoje && (!proximoDia || dia.data < proximoDia)) {
      proximoDia = dia.data
    }
  }

  const terminado = total > 0 && feitas === total
  const naoComecou = !!inicio && inicio > hoje

  return {
    total,
    feitas,
    percentual: total === 0 ? 0 : Math.round((feitas / total) * 100),
    revisoes,
    atrasadas,
    horasAtrasadas: meiaHora(horasAtrasadas),
    hojeTotal,
    hojeFeitas,
    hojeHoras: meiaHora(hojeHoras),
    inicio,
    fim,
    proximoDia,
    naoComecou,
    terminado,
    emDia: atrasadas === 0,
  }
}

/**
 * "AAAA-MM-DD" → carga somada de TODOS os planos. É o que deixa o calendário
 * mostrar avaliação e estudo na mesma grade, que é como o aluno enxerga a
 * semana dele: a prova não acontece num calendário e o estudo em outro.
 */
export function agregarCarga(planos: PlanoBruto[]): Record<string, CargaDoDia> {
  const mapa: Record<string, CargaDoDia> = {}

  for (const plano of planos) {
    for (const dia of plano.cronograma ?? []) {
      const atual = mapa[dia.data] ?? { horas: 0, itens: 0, concluidos: 0 }
      for (const atividade of dia.atividades ?? []) {
        atual.horas += Number(atividade.horas) || 0
        atual.itens += 1
        if (atividade.concluido) atual.concluidos += 1
      }
      mapa[dia.data] = atual
    }
  }

  for (const dia of Object.values(mapa)) dia.horas = meiaHora(dia.horas)
  return mapa
}

export interface ResumoGeral {
  planos: number
  /** Planos que ainda têm o que fazer. */
  ativos: number
  total: number
  feitas: number
  percentual: number
  atrasadas: number
  hojeTotal: number
  hojeFeitas: number
  hojeHoras: number
  /** O plano que puxa a atenção: o mais atrasado; senão, o que tem tarefa hoje. */
  planoEmFoco?: { id: string; titulo: string }
}

/** A leitura do topo da página: um número por pergunta, somando todos os planos. */
export function resumirTudo(planos: PlanoBruto[], hoje: string): ResumoGeral {
  const geral: ResumoGeral = {
    planos: planos.length,
    ativos: 0,
    total: 0,
    feitas: 0,
    percentual: 0,
    atrasadas: 0,
    hojeTotal: 0,
    hojeFeitas: 0,
    hojeHoras: 0,
  }

  let melhorAtraso = 0
  let melhorHoje = 0

  for (const plano of planos) {
    const resumo = resumirPlano(plano, hoje)
    geral.total += resumo.total
    geral.feitas += resumo.feitas
    geral.atrasadas += resumo.atrasadas
    geral.hojeTotal += resumo.hojeTotal
    geral.hojeFeitas += resumo.hojeFeitas
    geral.hojeHoras += resumo.hojeHoras
    if (!resumo.terminado && resumo.total > 0) geral.ativos += 1

    const referencia = { id: String(plano._id ?? ''), titulo: plano.titulo ?? 'Cronograma' }
    // Atraso vence pendência de hoje: se algo venceu, é para lá que o aluno
    // deve ir primeiro — o dia de hoje ainda cabe, o de ontem não volta.
    if (resumo.atrasadas > melhorAtraso) {
      melhorAtraso = resumo.atrasadas
      geral.planoEmFoco = referencia
    } else if (melhorAtraso === 0 && resumo.hojeTotal - resumo.hojeFeitas > melhorHoje) {
      melhorHoje = resumo.hojeTotal - resumo.hojeFeitas
      geral.planoEmFoco = referencia
    }
  }

  geral.hojeHoras = meiaHora(geral.hojeHoras)
  geral.percentual = geral.total === 0 ? 0 : Math.round((geral.feitas / geral.total) * 100)
  return geral
}
