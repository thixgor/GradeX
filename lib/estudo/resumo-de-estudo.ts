import { ObjectId, type Db } from 'mongodb'
import { computeStreak, dayKey } from '@/lib/streak'
import { FLASHCARD_MANUAL_COLLECTIONS } from '@/lib/flashcard-manual'
import { FLASHCARD_SPACED_PROGRESS_COLLECTION } from '@/lib/flashcard-spaced-repetition'
import { ACTIVITY_COLLECTION } from '@/lib/tracking/activity-events'
import { medirEntrega, type QuestaoParaMedir, type RespostaParaMedir } from '@/lib/provas/desempenho-da-entrega'
import { notaLiberadaParaOAluno } from '@/lib/provas/nota-da-prova'
import type { Exam } from '@/lib/types'

/**
 * Tudo o que a pessoa estudou, de todas as frentes, numa leitura só.
 *
 * O perfil e o painel liam só duas fontes — provas e banco — e as duas mal:
 * prova contava as questões deixadas em branco e nunca o acerto; o banco
 * dividia os acertos pelo total de resoluções, discursivas incluídas (que não
 * têm "certo"), o que puxava a taxa para baixo. Flashcards, materiais,
 * anatomia e sessões de foco não apareciam em lugar nenhum, embora o histórico
 * de quase todos já estivesse gravado. Este módulo é a fonte única dos dois
 * endpoints (`/api/user/statistics` e `/api/user/performance`), para o número
 * do painel e o do perfil não poderem mais discordar.
 *
 * As consultas são independentes e saem num `Promise.all`; cada uma agrega no
 * Mongo e devolve linhas por dia (ou por dia e recurso), nunca o documento
 * inteiro.
 */

const FUSO = 'America/Sao_Paulo'

export const AREAS_DE_ESTUDO = ['banco', 'provas', 'flashcards', 'materiais', 'anatomia'] as const
export type AreaDeEstudo = (typeof AREAS_DE_ESTUDO)[number]

/**
 * Um dia de estudo. Cada área conta na própria unidade natural — questão
 * resolvida, carta revisada, material aberto, prancha estudada ou questão do
 * quiz — e a soma é "ações de estudo". Os minutos de foco ficam de fora da
 * soma porque são outra grandeza.
 */
export type DiaDeEstudo = Record<AreaDeEstudo, number> & { focoMin: number }

export interface ResumoDeEstudo {
  provas: {
    entregues: number
    respondidas: number
    objetivasRespondidas: number
    acertos: number
    acuracia: number | null
    /** Entregas cujo acerto só aparece quando a prova terminar. */
    aguardandoTermino: number
  }
  banco: {
    resolucoes: number
    questoes: number
    objetivas: number
    acertos: number
    erros: number
    discursivas: number
    acuracia: number | null
  }
  flashcards: {
    revisoes: number
    lembrei: number
    errei: number
    acuracia: number | null
    cartas: number
    dominadas: number
    noCaderno: number
  }
  materiais: { estudados: number; aberturas: number }
  anatomia: {
    pranchas: number
    quizzes: number
    quizQuestoes: number
    quizAcertos: number
    acuracia: number | null
  }
  foco: { sessoes: number; minutos: number; minutosNaSemana: number; minutosHoje: number }
  geral: {
    /** Questões respondidas: provas + banco + quiz de anatomia. */
    questoes: number
    /** Acerto nas questões objetivas dessas três fontes. */
    acuracia: number | null
    acoes: number
    diasAtivos: number
    sequencia: number
    maiorSequencia: number
    estudouHoje: boolean
  }
  /**
   * Acerto de cada prova cuja nota já pode ser mostrada, da mais antiga à mais
   * nova. É a curva de evolução: vale para toda prova com objetivas, e não só
   * para as poucas corrigidas por TRI (a nota TRI vem junto quando existe).
   */
  notasDasProvas: Array<{ date: string; acerto: number; acertos: number; objetivas: number; tri: number | null; examId: string }>
  /** Um registro por dia com atividade (chave YYYY-MM-DD no fuso de SP). */
  porDia: Record<string, DiaDeEstudo>
}

export function percentual(parte: number, todo: number): number | null {
  return todo > 0 ? Math.round((parte / todo) * 100) : null
}

export function diaVazio(): DiaDeEstudo {
  return { banco: 0, provas: 0, flashcards: 0, materiais: 0, anatomia: 0, focoMin: 0 }
}

export function totalDoDia(dia: DiaDeEstudo | undefined): number {
  if (!dia) return 0
  return AREAS_DE_ESTUDO.reduce((soma, area) => soma + (dia[area] || 0), 0)
}

const porDiaNoFuso = (campo: unknown) => ({ $dateToString: { format: '%Y-%m-%d', date: campo, timezone: FUSO } })

/** Texto com algo além de espaço — sem projetar a redação inteira. */
const temTexto = (campo: string) => ({
  $gt: [
    {
      $strLenCP: {
        $trim: { input: { $cond: [{ $eq: [{ $type: campo }, 'string'] }, campo, ''] } },
      },
    },
    0,
  ],
})

type LinhaDeEntrega = {
  examId: string
  submittedAt?: Date
  triScore?: number
  respostas: RespostaParaMedir[]
}

type LinhaDoBanco = { _id: string; total: number; objetivas: number; acertos: number }
type LinhaDeCartas = { _id: string; total: number; errei: number }
type LinhaDeEvento = { _id: { kind: string; dia: string; recurso: string }; n: number; acertos: number; total: number }
type LinhaDeFoco = { _id: string; ms: number; n: number }

async function seguro<T>(consulta: Promise<T>, vazio: T): Promise<T> {
  try {
    return await consulta
  } catch (error) {
    // Coleção que ainda não existe nesta base, ou uma falha pontual de uma das
    // fontes: o resumo sai sem ela em vez de derrubar a tela inteira.
    console.error('[resumo-de-estudo] fonte indisponível:', error)
    return vazio
  }
}

export async function montarResumoDeEstudo(
  db: Db,
  userId: string,
  { agora = new Date(), isAdmin = false }: { agora?: Date; isAdmin?: boolean } = {},
): Promise<ResumoDeEstudo> {
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null

  const [entregas, banco, cartas, progresso, eventos, leitor, foco] = await Promise.all([
    seguro(
      db
        .collection('submissions')
        .aggregate<LinhaDeEntrega>([
          { $match: { userId } },
          {
            $project: {
              _id: 0,
              examId: 1,
              submittedAt: 1,
              triScore: 1,
              // Só o que a medição lê: a alternativa marcada e se há texto.
              // Projetar `answers` inteiro traria redações e assinaturas.
              respostas: {
                $map: {
                  input: { $ifNull: ['$answers', []] },
                  as: 'r',
                  in: {
                    questionId: '$$r.questionId',
                    selectedAlternative: '$$r.selectedAlternative',
                    temTexto: { $or: [temTexto('$$r.discursiveText'), temTexto('$$r.essayText')] },
                  },
                },
              },
            },
          },
          { $sort: { submittedAt: 1 } },
        ])
        .toArray(),
      [] as LinhaDeEntrega[],
    ),
    userObjectId
      ? seguro(
          db
            .collection('banco_resolucoes')
            .aggregate<{ porDia: LinhaDoBanco[]; questoes: Array<{ n: number }>; discursivas: Array<{ n: number }> }>([
              { $match: { userId: userObjectId } },
              {
                $facet: {
                  porDia: [
                    {
                      $group: {
                        _id: porDiaNoFuso('$createdAt'),
                        total: { $sum: 1 },
                        // Discursiva não tem "certo": fica fora do denominador.
                        objetivas: { $sum: { $cond: [{ $eq: ['$tipo', 'discursiva'] }, 0, 1] } },
                        acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                      },
                    },
                  ],
                  questoes: [{ $group: { _id: '$questaoId' } }, { $count: 'n' }],
                  discursivas: [{ $match: { tipo: 'discursiva' } }, { $count: 'n' }],
                },
              },
            ])
            .toArray(),
          [],
        )
      : Promise.resolve([]),
    seguro(
      db
        .collection(FLASHCARD_MANUAL_COLLECTIONS.sessions)
        .aggregate<{ porDia: LinhaDeCartas[]; cartas: Array<{ n: number }> }>([
          { $match: { userId } },
          { $project: { _id: 0, entries: { cardId: 1, rating: 1, completedAt: 1 }, finishedAt: 1 } },
          { $unwind: '$entries' },
          {
            $facet: {
              porDia: [
                {
                  $group: {
                    _id: porDiaNoFuso({
                      $convert: { input: '$entries.completedAt', to: 'date', onError: '$finishedAt', onNull: '$finishedAt' },
                    }),
                    total: { $sum: 1 },
                    // `porrada` é o "Difícil" gravado com o nome antigo — o
                    // "não lembrei" que manda a carta para o caderno de erros.
                    errei: { $sum: { $cond: [{ $in: ['$entries.rating', ['porrada', 'DIFICIL']] }, 1, 0] } },
                  },
                },
              ],
              cartas: [{ $group: { _id: '$entries.cardId' } }, { $count: 'n' }],
            },
          },
        ])
        .toArray(),
      [],
    ),
    seguro(
      db
        .collection(FLASHCARD_SPACED_PROGRESS_COLLECTION)
        .aggregate<{ dominadas: number; noCaderno: number }>([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              // "Dominada": já saiu do aprendizado e só volta daqui a três
              // semanas ou mais — o mesmo corte que o Anki chama de madura.
              dominadas: {
                $sum: { $cond: [{ $and: [{ $eq: ['$state', 'review'] }, { $gte: ['$intervalDays', 21] }] }, 1, 0] },
              },
              noCaderno: { $sum: { $cond: [{ $eq: ['$rating', 'DIFICIL'] }, 1, 0] } },
            },
          },
        ])
        .toArray(),
      [],
    ),
    seguro(
      db
        .collection(ACTIVITY_COLLECTION)
        .aggregate<LinhaDeEvento>([
          {
            $match: {
              userId,
              $or: [
                // Abrir a página de um material que a pessoa não tem é olhar a
                // vitrine, não estudar.
                { kind: 'material_open', 'meta.temAcesso': true },
                { kind: { $in: ['anatomia_open', 'anatomia_quiz'] } },
              ],
            },
          },
          {
            $group: {
              _id: { kind: '$kind', dia: porDiaNoFuso('$createdAt'), recurso: '$resourceId' },
              n: { $sum: 1 },
              acertos: { $sum: { $ifNull: ['$meta.acertos', 0] } },
              total: { $sum: { $ifNull: ['$meta.total', 0] } },
            },
          },
        ])
        .toArray(),
      [] as LinhaDeEvento[],
    ),
    seguro(
      db
        .collection('material_pdf_viewer_logs')
        .aggregate<{ _id: { dia: string; recurso: string } }>([
          { $match: { userId, action: 'viewer_open' } },
          { $group: { _id: { dia: porDiaNoFuso('$createdAt'), recurso: { $toString: '$materialId' } } } },
        ])
        .toArray(),
      [] as Array<{ _id: { dia: string; recurso: string } }>,
    ),
    seguro(
      db
        .collection('focus-sessions')
        .aggregate<LinhaDeFoco>([
          { $match: { userId } },
          { $group: { _id: porDiaNoFuso('$startedAt'), ms: { $sum: '$totalTimeMs' }, n: { $sum: 1 } } },
        ])
        .toArray(),
      [] as LinhaDeFoco[],
    ),
  ])

  // ── Provas: a medição precisa das questões, e o acerto, da janela ──────────
  const idsDasProvas = Array.from(new Set(entregas.map(entrega => entrega.examId).filter(id => ObjectId.isValid(id))))
  const provas = idsDasProvas.length
    ? await seguro(
        db
          .collection<Exam>('exams')
          .find(
            { _id: { $in: idsDasProvas.map(id => new ObjectId(id)) } },
            {
              projection: {
                createdBy: 1,
                isPracticeExam: 1,
                isPersonalExam: 1,
                endTime: 1,
                'questions.id': 1,
                'questions.type': 1,
                'questions.alternatives.id': 1,
                'questions.alternatives.isCorrect': 1,
              },
            },
          )
          .toArray(),
        [],
      )
    : []
  const provaPorId = new Map(provas.map(prova => [String(prova._id), prova]))

  const porDia: Record<string, DiaDeEstudo> = {}
  const dia = (chave: string) => (porDia[chave] ||= diaVazio())

  const notasDasProvas: ResumoDeEstudo['notasDasProvas'] = []
  const resumoProvas = { entregues: entregas.length, respondidas: 0, objetivasRespondidas: 0, acertos: 0, acuracia: null as number | null, aguardandoTermino: 0 }
  for (const entrega of entregas) {
    const prova = provaPorId.get(entrega.examId)
    const medida = medirEntrega((prova?.questions || []) as QuestaoParaMedir[], entrega.respostas)
    resumoProvas.respondidas += medida.respondidas
    if (prova && notaLiberadaParaOAluno(prova, { userId, isAdmin, agora })) {
      resumoProvas.objetivasRespondidas += medida.objetivasRespondidas
      resumoProvas.acertos += medida.acertos
      if (medida.objetivasRespondidas > 0 && entrega.submittedAt) {
        notasDasProvas.push({
          date: new Date(entrega.submittedAt).toISOString(),
          acerto: Math.round((medida.acertos / medida.objetivasRespondidas) * 100),
          acertos: medida.acertos,
          objetivas: medida.objetivasRespondidas,
          tri: typeof entrega.triScore === 'number' ? Math.round(entrega.triScore) : null,
          examId: entrega.examId,
        })
      }
    } else if (medida.objetivasRespondidas > 0) {
      resumoProvas.aguardandoTermino++
    }
    if (entrega.submittedAt) dia(dayKey(new Date(entrega.submittedAt))).provas += medida.respondidas
  }
  resumoProvas.acuracia = percentual(resumoProvas.acertos, resumoProvas.objetivasRespondidas)

  // ── Banco ─────────────────────────────────────────────────────────────────
  const facetBanco = banco[0]
  const resumoBanco = { resolucoes: 0, questoes: facetBanco?.questoes?.[0]?.n || 0, objetivas: 0, acertos: 0, erros: 0, discursivas: facetBanco?.discursivas?.[0]?.n || 0, acuracia: null as number | null }
  for (const linha of facetBanco?.porDia || []) {
    resumoBanco.resolucoes += linha.total
    resumoBanco.objetivas += linha.objetivas
    resumoBanco.acertos += linha.acertos
    if (linha._id) dia(linha._id).banco += linha.total
  }
  resumoBanco.erros = resumoBanco.objetivas - resumoBanco.acertos
  resumoBanco.acuracia = percentual(resumoBanco.acertos, resumoBanco.objetivas)

  // ── Flashcards ────────────────────────────────────────────────────────────
  const facetCartas = cartas[0]
  const resumoCartas = { revisoes: 0, lembrei: 0, errei: 0, acuracia: null as number | null, cartas: facetCartas?.cartas?.[0]?.n || 0, dominadas: progresso[0]?.dominadas || 0, noCaderno: progresso[0]?.noCaderno || 0 }
  for (const linha of facetCartas?.porDia || []) {
    resumoCartas.revisoes += linha.total
    resumoCartas.errei += linha.errei
    if (linha._id) dia(linha._id).flashcards += linha.total
  }
  resumoCartas.lembrei = resumoCartas.revisoes - resumoCartas.errei
  resumoCartas.acuracia = percentual(resumoCartas.lembrei, resumoCartas.revisoes)

  // ── Materiais e anatomia ──────────────────────────────────────────────────
  // Um material conta uma vez por dia, venha a abertura da página ou do leitor.
  const materiaisDoDia = new Set<string>()
  const materiais = new Set<string>()
  let aberturas = 0
  const pranchas = new Set<string>()
  const resumoAnatomia = { pranchas: 0, quizzes: 0, quizQuestoes: 0, quizAcertos: 0, acuracia: null as number | null }

  const marcarMaterial = (chave: string, recurso: string) => {
    if (!chave || !recurso) return
    materiais.add(recurso)
    const marca = `${chave}|${recurso}`
    if (materiaisDoDia.has(marca)) return
    materiaisDoDia.add(marca)
    dia(chave).materiais += 1
  }

  for (const linha of eventos) {
    const { kind, dia: chave, recurso } = linha._id
    if (!chave) continue
    if (kind === 'material_open') {
      aberturas += linha.n
      marcarMaterial(chave, recurso)
    } else if (kind === 'anatomia_open') {
      if (recurso) pranchas.add(recurso)
      dia(chave).anatomia += 1
    } else if (kind === 'anatomia_quiz') {
      resumoAnatomia.quizzes += linha.n
      resumoAnatomia.quizQuestoes += linha.total
      resumoAnatomia.quizAcertos += linha.acertos
      dia(chave).anatomia += linha.total
    }
  }
  for (const linha of leitor) {
    aberturas += 1
    marcarMaterial(linha._id.dia, linha._id.recurso)
  }
  resumoAnatomia.pranchas = pranchas.size
  resumoAnatomia.acuracia = percentual(resumoAnatomia.quizAcertos, resumoAnatomia.quizQuestoes)

  // ── Foco ──────────────────────────────────────────────────────────────────
  const hoje = dayKey(agora)
  const semana = new Set(Array.from({ length: 7 }, (_, i) => dayKey(new Date(agora.getTime() - i * 86_400_000))))
  const resumoFoco = { sessoes: 0, minutos: 0, minutosNaSemana: 0, minutosHoje: 0 }
  for (const linha of foco) {
    if (!linha._id) continue
    const minutos = Math.round((linha.ms || 0) / 60_000)
    resumoFoco.sessoes += linha.n
    resumoFoco.minutos += minutos
    if (semana.has(linha._id)) resumoFoco.minutosNaSemana += minutos
    if (linha._id === hoje) resumoFoco.minutosHoje += minutos
    if (minutos > 0) dia(linha._id).focoMin += minutos
  }

  // ── Geral ─────────────────────────────────────────────────────────────────
  const diasComEstudo = Object.entries(porDia)
    .filter(([, valores]) => totalDoDia(valores) > 0 || valores.focoMin > 0)
    // Meio-dia em São Paulo: a data volta sempre para a mesma chave.
    .map(([chave]) => new Date(`${chave}T12:00:00-03:00`))
  const sequencia = computeStreak(diasComEstudo, agora)

  const questoes = resumoProvas.respondidas + resumoBanco.resolucoes + resumoAnatomia.quizQuestoes
  const acuracia = percentual(
    resumoProvas.acertos + resumoBanco.acertos + resumoAnatomia.quizAcertos,
    resumoProvas.objetivasRespondidas + resumoBanco.objetivas + resumoAnatomia.quizQuestoes,
  )

  return {
    provas: resumoProvas,
    banco: resumoBanco,
    flashcards: resumoCartas,
    materiais: { estudados: materiais.size, aberturas },
    anatomia: resumoAnatomia,
    foco: resumoFoco,
    geral: {
      questoes,
      acuracia,
      acoes: Object.values(porDia).reduce((soma, valores) => soma + totalDoDia(valores), 0),
      diasAtivos: diasComEstudo.length,
      sequencia: sequencia.current,
      maiorSequencia: sequencia.longest,
      estudouHoje: sequencia.activeToday,
    },
    notasDasProvas,
    porDia,
  }
}

/*
 * Memória curta por pessoa.
 *
 * O resumo são ~8 agregações; o painel e o perfil pedem o mesmo resumo em
 * sequência (`/api/user/statistics` ao abrir, `/api/user/performance` na aba
 * Desempenho), e voltar ao painel logo depois refaria tudo. Por 45 segundos a
 * mesma instância responde da memória. Não usa `memoizarPorTempo` porque a
 * chave é por pessoa: aqui há teto de entradas, para a memória da instância
 * não crescer com cada aluno que passou por ela. Quem grava estudo
 * (`esquecerResumoDeEstudo`) descarta a entrada, para a próxima leitura já
 * contar o que acabou de acontecer.
 */
const VALIDADE_DO_RESUMO_MS = 45_000
const MAXIMO_DE_RESUMOS = 300
const resumosEmMemoria = new Map<string, { expiraEm: number; valor: Promise<ResumoDeEstudo> }>()

export function obterResumoDeEstudo(
  db: Db,
  userId: string,
  opcoes: { agora?: Date; isAdmin?: boolean } = {},
): Promise<ResumoDeEstudo> {
  const chave = `${userId}:${opcoes.isAdmin ? 1 : 0}`
  const agora = Date.now()
  const guardado = resumosEmMemoria.get(chave)
  if (guardado && guardado.expiraEm > agora) return guardado.valor

  const valor = montarResumoDeEstudo(db, userId, opcoes).catch(erro => {
    resumosEmMemoria.delete(chave)
    throw erro
  })
  resumosEmMemoria.delete(chave)
  resumosEmMemoria.set(chave, { expiraEm: agora + VALIDADE_DO_RESUMO_MS, valor })
  // O Map guarda a ordem de inserção: a primeira chave é a mais antiga.
  while (resumosEmMemoria.size > MAXIMO_DE_RESUMOS) {
    const maisAntiga = resumosEmMemoria.keys().next().value
    if (maisAntiga === undefined) break
    resumosEmMemoria.delete(maisAntiga)
  }
  return valor
}

/** Chamado por quem grava estudo da pessoa (revisão, resolução, entrega, foco). */
export function esquecerResumoDeEstudo(userId: string): void {
  resumosEmMemoria.delete(`${userId}:0`)
  resumosEmMemoria.delete(`${userId}:1`)
}
