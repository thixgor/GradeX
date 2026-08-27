/**
 * Gerador de cronograma com prioridade da ementa e repetição espaçada.
 *
 * O gerador antigo enfileirava módulos e derramava horas nos dias até acabar o
 * calendário. Isso produz um plano que o aluno cumpre uma vez e esquece: sem
 * revisão, a curva do esquecimento come quase tudo antes da prova.
 *
 * Aqui o cronograma tem duas correntes:
 *
 * - **Conteúdo novo**, na ordem da ementa, mas com prioridade puxando para
 *   frente o que a coordenação marcou como Alta. Cada módulo é fatiado em
 *   blocos de no máximo 2h — estudar 8h seguidas do mesmo assunto é o mesmo
 *   erro em outra escala.
 * - **Revisões**, agendadas automaticamente depois que o módulo é fechado, em
 *   intervalos crescentes. Elas têm precedência sobre conteúdo novo quando o
 *   dia aperta: adiar revisão é perder o estudo que já foi feito, adiar
 *   conteúdo novo só move a fila.
 *
 * A escada de revisão sai da prioridade: assunto Alta é revisado cinco vezes,
 * assunto Baixa duas. Um item sem prioridade declarada usa a escada do meio,
 * que é a regra combinada — "se não tiver estabelecido, faça como normal".
 */

import type { StudyTime, UserDifficulty } from '@/lib/cronograma-types'
import type { EmentaTopico, Prioridade } from './tipos'
import { ESTILO_PRIORIDADE } from './tipos'
import { diaDaSemana, diasEntre, isDiaValido, somarDias } from './brasilia'

// ── Constantes de ritmo ─────────────────────────────────────────────────────

/** Nenhum bloco de estudo passa disso. Acima de 2h a atenção já caiu. */
const MAX_HORAS_BLOCO = 2

/** Piso de um bloco: menos que isso não vale o custo de trocar de assunto. */
const MIN_HORAS_BLOCO = 0.5

/**
 * Escadas de repetição espaçada, em dias após fechar o módulo.
 *
 * Os intervalos seguem a progressão clássica (1-3-7-16-35): cada revisão
 * bem-sucedida mais que dobra o prazo até a próxima. Prioridade Alta percorre
 * a escada inteira; Baixa para no segundo degrau, porque revisar cinco vezes
 * um assunto secundário é tempo tirado do que cai na prova.
 */
const ESCADA_REVISAO: Record<Prioridade, number[]> = {
  alta: [1, 3, 7, 16, 35],
  media: [1, 5, 14],
  normal: [1, 5, 14],
  baixa: [2, 12],
}

/**
 * Fração das horas do módulo que cada degrau da escada custa.
 *
 * Revisar é sempre mais barato que aprender, e fica mais barato a cada volta —
 * na quinta passada o assunto se relê em minutos. Somados, os cinco degraus da
 * escada Alta custam ~60% do estudo original, e os três da escada do meio,
 * ~45%. Números maiores que isso transformam o plano num cronograma de
 * revisão com conteúdo novo de sobremesa.
 */
const CUSTO_REVISAO = [0.2, 0.15, 0.1, 0.08, 0.07]

/** Uma revisão pode escorregar até esses dias à frente se o dia devido lotou. */
const FOLGA_REVISAO = 3

/** Dias antes de uma avaliação em que o conteúdo cobrado é puxado para frente. */
const JANELA_PRE_AVALIACAO = 21

const PESO_DIFICULDADE: Record<UserDifficulty, number> = {
  facil: 0.8,
  medio: 1,
  dificil: 1.3,
}

const DIAS_CHAVE: Array<keyof StudyTime> = [
  'domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado',
]

const DIAS_ROTULO: Record<keyof StudyTime, string> = {
  domingo: 'Domingo',
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
}

// ── Tipos ───────────────────────────────────────────────────────────────────

export type TipoAtividade = 'estudo' | 'revisao' | 'reta-final'

export interface AtividadeGerada {
  id: string
  /** Campos herdados do formato antigo — o visualizador e o PDF leem daqui. */
  topico: string
  subtopico: string
  modulo: string
  dificuldadeUsuario: UserDifficulty
  horas: number
  descricao: string
  concluido: boolean
  // ── Novos ──
  tipo: TipoAtividade
  prioridade: Prioridade
  moduloId: string
  /** Em revisões: qual degrau da escada (1 = primeira revisão). */
  etapa?: number
  /** Em reta final: título da avaliação que motivou o bloco. */
  avaliacao?: string
}

export interface DiaGerado {
  dia: string
  data: string
  horasDisponivel: number
  atividades: AtividadeGerada[]
}

export interface AvaliacaoNoPlano {
  titulo: string
  data: string
  itensEmenta?: string[]
}

export interface EntradaGerador {
  topicos: EmentaTopico[]
  tempoEstudo: StudyTime
  /** "AAAA-MM-DD". O plano nunca começa antes disso. */
  dataInicio: string
  /** "AAAA-MM-DD" opcional: teto para CONTEÚDO NOVO (revisões podem passar). */
  dataTermino?: string
  avaliacoes?: AvaliacaoNoPlano[]
  /** Desligar deixa o plano só com conteúdo novo (comportamento antigo). */
  revisaoEspacada?: boolean
}

export interface ResultadoGerador {
  dias: DiaGerado[]
  totalHoras: number
  horasEstudo: number
  horasRevisao: number
  /** Horas de conteúdo que não couberam até `dataTermino`. */
  horasNaoAlocadas: number
  modulosNaoAlocados: number
  /** Último dia com atividade, "AAAA-MM-DD", ou null se o plano saiu vazio. */
  dataFim: string | null
  totalModulos: number
}

interface TarefaModulo {
  moduloId: string
  topico: string
  subtopico: string
  modulo: string
  prioridade: Prioridade
  dificuldade: UserDifficulty
  horas: number
  /** Posição na ementa: preserva a sequência pedagógica dentro da prioridade. */
  ordemEmenta: number
  /** Data da avaliação mais próxima que cobra este módulo, se houver. */
  prazo?: string
}

interface RevisaoPendente {
  tarefa: TarefaModulo
  etapa: number
  horas: number
  /** Dias de folga que ainda restam para ela escorregar antes de ser perdida. */
  folga: number
}

// ── Achatamento da ementa ───────────────────────────────────────────────────

/**
 * Transforma a árvore marcada pelo aluno numa fila de módulos.
 *
 * Um módulo entra quando ele próprio está incluído; tópico e subtópico servem
 * de atalho de seleção na interface, mas não vetam o filho já marcado — quem
 * clicou no módulo quis o módulo.
 */
export function achatarSelecao(topicos: EmentaTopico[], avaliacoes: AvaliacaoNoPlano[] = []): TarefaModulo[] {
  const tarefas: TarefaModulo[] = []
  let ordem = 0

  // id da ementa → data da avaliação mais próxima que o cobra.
  const prazoPorItem = new Map<string, string>()
  for (const avaliacao of avaliacoes) {
    if (!isDiaValido(avaliacao.data)) continue
    for (const id of avaliacao.itensEmenta ?? []) {
      const atual = prazoPorItem.get(id)
      if (!atual || avaliacao.data < atual) prazoPorItem.set(id, avaliacao.data)
    }
  }

  for (const topico of topicos) {
    for (const sub of topico.subtopicos) {
      for (const modulo of sub.modulos) {
        ordem += 1
        if (!modulo.incluido) continue

        const dificuldade = ((modulo as any).dificuldadeUsuario as UserDifficulty) || 'medio'
        const horas = Math.max(
          MIN_HORAS_BLOCO,
          Math.round(modulo.horasEstimadas * PESO_DIFICULDADE[dificuldade] * 2) / 2,
        )

        // O prazo mais apertado entre o do módulo, o do subtópico e o do tópico.
        const prazos = [prazoPorItem.get(modulo.id), prazoPorItem.get(sub.id), prazoPorItem.get(topico.id)]
          .filter((d): d is string => Boolean(d))
          .sort()

        tarefas.push({
          moduloId: modulo.id,
          topico: topico.nome,
          subtopico: sub.nome,
          modulo: modulo.nome,
          prioridade: modulo.prioridade ?? 'normal',
          dificuldade,
          horas,
          ordemEmenta: ordem,
          prazo: prazos[0],
        })
      }
    }
  }

  return tarefas
}

/**
 * Ordem em que o conteúdo novo é estudado.
 *
 * Prova marcada manda: um módulo cobrado numa avaliação das próximas semanas
 * vem antes de qualquer coisa, ordenado pela data da prova. Fora dessa janela,
 * a prioridade da ementa decide, e a ordem original da ementa desempata — sem
 * isso um plano de Medicina começaria por seis módulos de "Alta" tirados de
 * seis sistemas diferentes, o que não é uma sequência de estudo.
 */
function ordenarTarefas(tarefas: TarefaModulo[], dataInicio: string): TarefaModulo[] {
  const comPrazo = (t: TarefaModulo) => {
    if (!t.prazo) return null
    const dias = diasEntre(dataInicio, t.prazo)
    return dias >= 0 && dias <= JANELA_PRE_AVALIACAO ? t.prazo : null
  }

  return [...tarefas].sort((a, b) => {
    const prazoA = comPrazo(a)
    const prazoB = comPrazo(b)
    if (prazoA && prazoB && prazoA !== prazoB) return prazoA < prazoB ? -1 : 1
    if (prazoA && !prazoB) return -1
    if (!prazoA && prazoB) return 1

    const ordemA = ESTILO_PRIORIDADE[a.prioridade].ordem
    const ordemB = ESTILO_PRIORIDADE[b.prioridade].ordem
    if (ordemA !== ordemB) return ordemA - ordemB

    return a.ordemEmenta - b.ordemEmenta
  })
}

// ── Geração ─────────────────────────────────────────────────────────────────

function horasDoDia(tempoEstudo: StudyTime, dia: string): number {
  const chave = DIAS_CHAVE[diaDaSemana(dia)]
  const horas = Number(tempoEstudo[chave])
  return Number.isFinite(horas) && horas > 0 ? Math.min(24, horas) : 0
}

function arredondar(horas: number): number {
  return Math.round(horas * 2) / 2
}

/**
 * Monta o cronograma dia a dia.
 *
 * A varredura é uma passada só, para frente. Isso é possível porque revisão
 * sempre cai DEPOIS do estudo que a originou: quando o dia N fecha um módulo,
 * as revisões dele entram no mapa dos dias N+1, N+3… que ainda nem foram
 * visitados. Um segundo passe nunca é necessário.
 */
export function gerarCronograma(entrada: EntradaGerador): ResultadoGerador {
  const {
    topicos,
    tempoEstudo,
    dataInicio,
    dataTermino,
    avaliacoes = [],
    revisaoEspacada = true,
  } = entrada

  const inicio = isDiaValido(dataInicio) ? dataInicio : new Date().toISOString().slice(0, 10)
  const tetoConteudo = dataTermino && isDiaValido(dataTermino) && dataTermino >= inicio ? dataTermino : null

  const tarefas = ordenarTarefas(achatarSelecao(topicos, avaliacoes), inicio)
  const totalModulos = tarefas.length

  if (totalModulos === 0) {
    return {
      dias: [], totalHoras: 0, horasEstudo: 0, horasRevisao: 0,
      horasNaoAlocadas: 0, modulosNaoAlocados: 0, dataFim: null, totalModulos: 0,
    }
  }

  /** Horas que faltam estudar de cada tarefa, na ordem da fila. */
  const restante = tarefas.map(t => t.horas)
  let cursor = 0

  /** dia "AAAA-MM-DD" → revisões devidas nele. */
  const revisoesPorDia = new Map<string, RevisaoPendente[]>()

  /** Blocos de reta final: dia anterior a cada avaliação com conteúdo marcado. */
  const retaFinalPorDia = new Map<string, AvaliacaoNoPlano[]>()
  if (revisaoEspacada) {
    for (const avaliacao of avaliacoes) {
      if (!isDiaValido(avaliacao.data) || avaliacao.data <= inicio) continue
      const vespera = somarDias(avaliacao.data, -1)
      retaFinalPorDia.set(vespera, (retaFinalPorDia.get(vespera) ?? []).concat(avaliacao))
    }
  }

  const dias: DiaGerado[] = []
  let horasEstudo = 0
  let horasRevisao = 0

  /**
   * Teto duro de varredura. Dois anos cobre qualquer plano real e impede que
   * uma semana com 0h em todos os dias (aluno que zerou tudo) vire laço
   * infinito procurando capacidade que não existe.
   */
  const LIMITE_DIAS = 730
  let diaAtual = inicio
  let percorridos = 0

  const temConteudoPendente = () => cursor < tarefas.length
  const temRevisaoPendente = () => revisoesPorDia.size > 0
  const temRetaFinalPendente = () => retaFinalPorDia.size > 0

  while (percorridos < LIMITE_DIAS) {
    const acabouConteudo = !temConteudoPendente() || (tetoConteudo !== null && diaAtual > tetoConteudo)
    if (acabouConteudo && !temRevisaoPendente() && !temRetaFinalPendente()) break

    let capacidade = horasDoDia(tempoEstudo, diaAtual)
    const atividades: AtividadeGerada[] = []

    if (capacidade > 0) {
      // 1. Revisões devidas hoje. Vêm primeiro de propósito: o que já foi
      //    estudado só continua sabido se for revisto na hora certa.
      const devidas = revisoesPorDia.get(diaAtual) ?? []
      revisoesPorDia.delete(diaAtual)
      const naoCoube: RevisaoPendente[] = []

      for (const revisao of devidas) {
        if (capacidade < MIN_HORAS_BLOCO) {
          naoCoube.push(revisao)
          continue
        }
        const horas = arredondar(Math.min(revisao.horas, capacidade, MAX_HORAS_BLOCO))
        capacidade = arredondar(capacidade - horas)
        horasRevisao += horas
        atividades.push({
          id: `${revisao.tarefa.moduloId}-r${revisao.etapa}-${diaAtual}`,
          topico: revisao.tarefa.topico,
          subtopico: revisao.tarefa.subtopico,
          modulo: revisao.tarefa.modulo,
          dificuldadeUsuario: revisao.tarefa.dificuldade,
          horas,
          descricao: `Revisão ${revisao.etapa}ª — ${revisao.tarefa.modulo}`,
          concluido: false,
          tipo: 'revisao',
          prioridade: revisao.tarefa.prioridade,
          moduloId: revisao.tarefa.moduloId,
          etapa: revisao.etapa,
        })
      }

      // O que não coube escorrega para o próximo dia — enquanto houver folga.
      // Quando ela acaba a revisão é descartada em vez de empilhar: revisão
      // muito atrasada não recupera nada e só entulharia o plano à frente.
      for (const revisao of naoCoube) {
        if (revisao.folga <= 0) continue
        agendar(revisoesPorDia, somarDias(diaAtual, 1), { ...revisao, folga: revisao.folga - 1 })
      }

      // 2. Reta final: a véspera da prova é do conteúdo dela, não da fila.
      const provas = retaFinalPorDia.get(diaAtual) ?? []
      retaFinalPorDia.delete(diaAtual)
      for (const prova of provas) {
        if (capacidade < MIN_HORAS_BLOCO) break
        const horas = arredondar(Math.min(capacidade, MAX_HORAS_BLOCO))
        capacidade = arredondar(capacidade - horas)
        horasRevisao += horas
        atividades.push({
          id: `reta-final-${diaAtual}-${atividades.length}`,
          topico: prova.titulo,
          subtopico: 'Reta final',
          modulo: 'Revisão geral + questões',
          dificuldadeUsuario: 'medio',
          horas,
          descricao: `Véspera de ${prova.titulo}: revisão geral e resolução de questões`,
          concluido: false,
          tipo: 'reta-final',
          prioridade: 'alta',
          moduloId: `reta-final-${prova.data}`,
          avaliacao: prova.titulo,
        })
      }

      // 3. Conteúdo novo com o que sobrou do dia.
      const podeConteudoHoje = tetoConteudo === null || diaAtual <= tetoConteudo
      while (podeConteudoHoje && capacidade >= MIN_HORAS_BLOCO && cursor < tarefas.length) {
        const tarefa = tarefas[cursor]
        const horas = arredondar(Math.min(restante[cursor], capacidade, MAX_HORAS_BLOCO))
        if (horas < MIN_HORAS_BLOCO) break

        capacidade = arredondar(capacidade - horas)
        restante[cursor] = arredondar(restante[cursor] - horas)
        horasEstudo += horas

        atividades.push({
          id: `${tarefa.moduloId}-${diaAtual}-${atividades.length}`,
          topico: tarefa.topico,
          subtopico: tarefa.subtopico,
          modulo: tarefa.modulo,
          dificuldadeUsuario: tarefa.dificuldade,
          horas,
          descricao: `${tarefa.modulo} — ${tarefa.subtopico}`,
          concluido: false,
          tipo: 'estudo',
          prioridade: tarefa.prioridade,
          moduloId: tarefa.moduloId,
        })

        // Módulo fechado: é aqui que a escada de revisão dele nasce.
        if (restante[cursor] < MIN_HORAS_BLOCO) {
          if (revisaoEspacada) programarRevisoes(revisoesPorDia, tarefa, diaAtual)
          cursor += 1
        }
      }
    }

    if (atividades.length > 0) {
      dias.push({
        dia: DIAS_ROTULO[DIAS_CHAVE[diaDaSemana(diaAtual)]],
        data: diaAtual,
        horasDisponivel: horasDoDia(tempoEstudo, diaAtual),
        atividades,
      })
    }

    diaAtual = somarDias(diaAtual, 1)
    percorridos += 1
  }

  const horasNaoAlocadas = arredondar(
    restante.slice(cursor).reduce((soma, h) => soma + Math.max(0, h), 0),
  )

  return {
    dias,
    totalHoras: arredondar(horasEstudo + horasRevisao),
    horasEstudo: arredondar(horasEstudo),
    horasRevisao: arredondar(horasRevisao),
    horasNaoAlocadas,
    modulosNaoAlocados: Math.max(0, tarefas.length - cursor),
    dataFim: dias.length > 0 ? dias[dias.length - 1].data : null,
    totalModulos,
  }
}

function agendar(mapa: Map<string, RevisaoPendente[]>, dia: string, revisao: RevisaoPendente) {
  mapa.set(dia, (mapa.get(dia) ?? []).concat(revisao))
}

function programarRevisoes(
  mapa: Map<string, RevisaoPendente[]>,
  tarefa: TarefaModulo,
  diaConclusao: string,
) {
  const escada = ESCADA_REVISAO[tarefa.prioridade] ?? ESCADA_REVISAO.normal

  escada.forEach((intervalo, indice) => {
    const fracao = CUSTO_REVISAO[Math.min(indice, CUSTO_REVISAO.length - 1)]
    const horas = Math.max(MIN_HORAS_BLOCO, arredondar(Math.min(tarefa.horas * fracao, MAX_HORAS_BLOCO)))
    agendar(mapa, somarDias(diaConclusao, intervalo), {
      tarefa,
      etapa: indice + 1,
      horas,
      folga: FOLGA_REVISAO,
    })
  })
}

// ── Estimativa para a interface ─────────────────────────────────────────────

export interface Estimativa {
  modulos: number
  horas: number
  horasSemana: number
  /** Semanas até fechar o conteúdo novo no ritmo escolhido. */
  semanas: number
  /** "AAAA-MM-DD" previsto para o último bloco de conteúdo. */
  terminoPrevisto: string | null
}

/**
 * Conta rápida para a tela de criação responder enquanto o aluno mexe nos
 * controles. Não roda o gerador inteiro de propósito: o cálculo precisa
 * acontecer a cada clique, e a resposta que importa ali é "isso cabe no meu
 * semestre?", não o plano dia a dia.
 */
export function estimar(
  topicos: EmentaTopico[],
  tempoEstudo: StudyTime,
  dataInicio: string,
  revisaoEspacada = true,
): Estimativa {
  const tarefas = achatarSelecao(topicos)
  const horasConteudo = tarefas.reduce((soma, t) => soma + t.horas, 0)

  // A revisão adiciona cerca da soma da escada de cada módulo. Aproximar por
  // fração da carga é o bastante para a frase da tela e evita simular tudo.
  const horasRevisao = revisaoEspacada
    ? tarefas.reduce((soma, t) => {
        const degraus = (ESCADA_REVISAO[t.prioridade] ?? ESCADA_REVISAO.normal).length
        const fracao = CUSTO_REVISAO.slice(0, degraus).reduce((a, b) => a + b, 0)
        return soma + Math.min(t.horas * fracao, MAX_HORAS_BLOCO * degraus)
      }, 0)
    : 0

  const horas = arredondar(horasConteudo + horasRevisao)
  const horasSemana = DIAS_CHAVE.reduce((soma, chave) => {
    const valor = Number(tempoEstudo[chave])
    return soma + (Number.isFinite(valor) && valor > 0 ? Math.min(24, valor) : 0)
  }, 0)

  if (horasSemana <= 0 || horas <= 0) {
    return { modulos: tarefas.length, horas, horasSemana, semanas: 0, terminoPrevisto: null }
  }

  const semanas = Math.ceil(horas / horasSemana)
  const base = isDiaValido(dataInicio) ? dataInicio : new Date().toISOString().slice(0, 10)

  return {
    modulos: tarefas.length,
    horas,
    horasSemana,
    semanas,
    terminoPrevisto: somarDias(base, semanas * 7),
  }
}
