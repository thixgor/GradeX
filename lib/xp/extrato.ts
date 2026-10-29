import { ObjectId, type Db } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS } from '@/lib/flashcard-manual'
import { FLASHCARD_SPACED_PROGRESS_COLLECTION } from '@/lib/flashcard-spaced-repetition'
import { ACTIVITY_COLLECTION } from '@/lib/tracking/activity-events'
import { medirEntrega, type QuestaoParaMedir, type RespostaParaMedir } from '@/lib/provas/desempenho-da-entrega'
import { notaLiberadaParaOAluno } from '@/lib/provas/nota-da-prova'
import { MINDMAP_COLLECTIONS } from '@/lib/mindmap'
import type { Exam } from '@/lib/types'
import { calcularXp, type ExtratoDeXp, type FonteDeXp, type Registro } from './regras'

/**
 * Lê o histórico inteiro de uma pessoa e devolve o XP dela.
 *
 * Cada fonte é uma agregação no Mongo que devolve linhas por dia (nunca o
 * documento inteiro), e todas saem num `Promise.all`. O resultado vira uma
 * lista de `Registro` — "no dia tal, tantas unidades de tal fonte" — que a
 * parte pura (`calcularXp`, em `regras.ts`) transforma em XP com tetos e
 * constância. É a mesma ideia do resumo de estudo (`lib/estudo/resumo-de-estudo.ts`),
 * com o que o XP precisa a mais: acerto por dia, aulas, Manual, fórum, mapas e
 * os eventos de jogos e quizzes.
 *
 * Fontes e anti-farm:
 * - banco: cada questão conta **uma vez por dia** (refazer até acertar não soma);
 * - provas: acerto só entra quando a nota já pode ser mostrada ao aluno — a
 *   mesma regra da tela de resultado. Antes disso conta a resposta, não o acerto;
 * - eventos de abertura e de quiz vêm do cliente: contam uma vez por recurso
 *   por dia, e o acerto de um quiz é o melhor do dia, não a soma das tentativas.
 */

const FUSO = 'America/Sao_Paulo'
const porDiaNoFuso = (campo: unknown) => ({ $dateToString: { format: '%Y-%m-%d', date: campo, timezone: FUSO } })

async function seguro<T>(consulta: Promise<T>, vazio: T): Promise<T> {
  try {
    return await consulta
  } catch (error) {
    // Coleção que ainda não existe nesta base: o XP sai sem ela.
    console.error('[xp] fonte indisponível:', error)
    return vazio
  }
}

/** Tipos de evento do cliente que dão XP (ver `lib/xp/eventos-cliente.ts`). */
export const EVENTOS_COM_XP = [
  'material_open',
  'manual_patologia_open',
  'manual_section_open',
  'anatomia_open',
  'anatomia_quiz',
  'ferramenta_open',
  'xp_quiz',
  'xp_licao',
  'xp_jogo',
] as const

type LinhaDeEntrega = { examId: string; submittedAt?: Date; respostas: RespostaParaMedir[] }
type LinhaDoBanco = { _id: string; acertos: number; erros: number; discursivas: number }
type LinhaDeCartas = { _id: string; total: number; errei: number }
type LinhaDeEvento = { _id: { kind: string; dia: string }; recursos: number; acertos: number; total: number }

export async function montarExtratoDeXp(
  db: Db,
  userId: string,
  { agora = new Date() }: { agora?: Date } = {},
): Promise<ExtratoDeXp> {
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null
  const registros: Registro[] = []
  const somar = (dia: string | null | undefined, fonte: FonteDeXp, quantidade: number) => {
    if (dia === undefined || quantidade <= 0) return
    registros.push({ dia, fonte, quantidade })
  }

  const [entregas, banco, cartas, dominadas, aulas, foco, eventos, leitor, posts, comentarios, mapas] =
    await Promise.all([
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
                respostas: {
                  $map: {
                    input: { $ifNull: ['$answers', []] },
                    as: 'r',
                    in: { questionId: '$$r.questionId', selectedAlternative: '$$r.selectedAlternative' },
                  },
                },
              },
            },
          ])
          .toArray(),
        [] as LinhaDeEntrega[],
      ),
      userObjectId
        ? seguro(
            db
              .collection('banco_resolucoes')
              .aggregate<LinhaDoBanco>([
                { $match: { userId: userObjectId } },
                // Uma vez por questão por dia: o melhor resultado do dia.
                {
                  $group: {
                    _id: { dia: porDiaNoFuso('$createdAt'), q: '$questaoId' },
                    disc: { $max: { $eq: ['$tipo', 'discursiva'] } },
                    ok: { $max: { $eq: ['$correta', true] } },
                  },
                },
                {
                  $group: {
                    _id: '$_id.dia',
                    acertos: { $sum: { $cond: [{ $and: ['$ok', { $not: ['$disc'] }] }, 1, 0] } },
                    erros: { $sum: { $cond: [{ $and: [{ $not: ['$ok'] }, { $not: ['$disc'] }] }, 1, 0] } },
                    discursivas: { $sum: { $cond: ['$disc', 1, 0] } },
                  },
                },
              ])
              .toArray(),
            [] as LinhaDoBanco[],
          )
        : Promise.resolve([] as LinhaDoBanco[]),
      seguro(
        db
          .collection(FLASHCARD_MANUAL_COLLECTIONS.sessions)
          .aggregate<LinhaDeCartas>([
            { $match: { userId } },
            { $project: { _id: 0, entries: { rating: 1, completedAt: 1 }, finishedAt: 1 } },
            { $unwind: '$entries' },
            {
              $group: {
                _id: porDiaNoFuso({
                  $convert: { input: '$entries.completedAt', to: 'date', onError: '$finishedAt', onNull: '$finishedAt' },
                }),
                total: { $sum: 1 },
                errei: { $sum: { $cond: [{ $in: ['$entries.rating', ['porrada', 'DIFICIL']] }, 1, 0] } },
              },
            },
          ])
          .toArray(),
        [] as LinhaDeCartas[],
      ),
      seguro(
        db
          .collection(FLASHCARD_SPACED_PROGRESS_COLLECTION)
          .aggregate<{ _id: string | null; n: number }>([
            { $match: { userId, state: 'review', intervalDays: { $gte: 21 } } },
            { $group: { _id: porDiaNoFuso('$lastReviewedAt'), n: { $sum: 1 } } },
          ])
          .toArray(),
        [] as Array<{ _id: string | null; n: number }>,
      ),
      seguro(
        (async () => {
          const novas = await db
            .collection('aulas_progresso')
            .aggregate<{ _id: string | null; n: number; ids: string[] }>([
              { $match: { usuarioId: userId, concluida: true } },
              {
                $group: {
                  _id: porDiaNoFuso({ $ifNull: ['$concluidaEm', '$atualizadoEm'] }),
                  n: { $sum: 1 },
                  ids: { $push: '$aulaId' },
                },
              },
            ])
            .toArray()
          // Conclusões do modelo antigo, sem data: contam no total, uma vez.
          const jaContadas = new Set(novas.flatMap((l) => l.ids))
          const legado = await db
            .collection('aulas_postagens')
            .find({ usuariosConcluidos: userId }, { projection: { _id: 1 } })
            .toArray()
          const semData = legado.filter((a) => !jaContadas.has(String(a._id))).length
          return { novas, semData }
        })(),
        { novas: [] as Array<{ _id: string | null; n: number; ids: string[] }>, semData: 0 },
      ),
      seguro(
        db
          .collection('focus-sessions')
          .aggregate<{ _id: string | null; ms: number }>([
            { $match: { userId } },
            { $group: { _id: porDiaNoFuso('$startedAt'), ms: { $sum: '$totalTimeMs' } } },
          ])
          .toArray(),
        [] as Array<{ _id: string | null; ms: number }>,
      ),
      seguro(
        db
          .collection(ACTIVITY_COLLECTION)
          .aggregate<LinhaDeEvento>([
            {
              $match: {
                userId,
                kind: { $in: [...EVENTOS_COM_XP] },
                // Abrir a página de um material que a pessoa não tem é vitrine.
                $or: [{ kind: { $ne: 'material_open' } }, { 'meta.temAcesso': true }],
              },
            },
            // Um recurso conta uma vez por dia; no quiz, vale a melhor tentativa.
            {
              $group: {
                _id: { kind: '$kind', dia: porDiaNoFuso('$createdAt'), r: '$resourceId' },
                acertos: { $max: { $ifNull: ['$meta.acertos', 0] } },
                total: { $max: { $ifNull: ['$meta.total', 0] } },
              },
            },
            {
              $group: {
                _id: { kind: '$_id.kind', dia: '$_id.dia' },
                recursos: { $sum: 1 },
                acertos: { $sum: '$acertos' },
                total: { $sum: '$total' },
              },
            },
          ])
          .toArray(),
        [] as LinhaDeEvento[],
      ),
      seguro(
        db
          .collection('material_pdf_viewer_logs')
          .aggregate<{ _id: string | null; n: number }>([
            { $match: { userId, action: 'viewer_open' } },
            { $group: { _id: { dia: porDiaNoFuso('$createdAt'), m: { $toString: '$materialId' } } } },
            { $group: { _id: '$_id.dia', n: { $sum: 1 } } },
          ])
          .toArray(),
        [] as Array<{ _id: string | null; n: number }>,
      ),
      seguro(
        db
          .collection('forum_posts')
          .aggregate<{ _id: string | null; n: number }>([
            { $match: { authorId: userId } },
            { $group: { _id: porDiaNoFuso('$createdAt'), n: { $sum: 1 } } },
          ])
          .toArray(),
        [] as Array<{ _id: string | null; n: number }>,
      ),
      seguro(
        db
          .collection('forum_comments')
          .aggregate<{ _id: string | null; n: number }>([
            { $match: { authorId: userId } },
            { $group: { _id: porDiaNoFuso('$createdAt'), n: { $sum: 1 } } },
          ])
          .toArray(),
        [] as Array<{ _id: string | null; n: number }>,
      ),
      seguro(
        (async () => {
          const meus = await db
            .collection(MINDMAP_COLLECTIONS.maps)
            .find({ ownerId: userId }, { projection: { _id: 1, createdAt: 1 } })
            .toArray()
          const criados = new Map<string, number>()
          for (const m of meus) {
            if (!m.createdAt) continue
            const dia = new Date(m.createdAt).toLocaleDateString('en-CA', { timeZone: FUSO })
            criados.set(dia, (criados.get(dia) || 0) + 1)
          }
          const curtidas = meus.length
            ? await db
                .collection(MINDMAP_COLLECTIONS.likes)
                .aggregate<{ _id: string | null; n: number }>([
                  // Curtir o próprio mapa não conta.
                  { $match: { mapId: { $in: meus.map((m) => String(m._id)) }, userId: { $ne: userId } } },
                  { $group: { _id: porDiaNoFuso('$createdAt'), n: { $sum: 1 } } },
                ])
                .toArray()
            : []
          return { criados, curtidas }
        })(),
        { criados: new Map<string, number>(), curtidas: [] as Array<{ _id: string | null; n: number }> },
      ),
    ])

  // ── Provas ────────────────────────────────────────────────────────────────
  const idsDasProvas = Array.from(new Set(entregas.map((e) => e.examId).filter((id) => ObjectId.isValid(id))))
  const provas = idsDasProvas.length
    ? await seguro(
        db
          .collection<Exam>('exams')
          .find(
            { _id: { $in: idsDasProvas.map((id) => new ObjectId(id)) } },
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
        [] as Exam[],
      )
    : []
  const provaPorId = new Map(provas.map((p) => [String(p._id), p]))

  for (const entrega of entregas) {
    if (!entrega.submittedAt) continue
    const dia = new Date(entrega.submittedAt).toLocaleDateString('en-CA', { timeZone: FUSO })
    const prova = provaPorId.get(entrega.examId)
    const medida = medirEntrega((prova?.questions || []) as QuestaoParaMedir[], entrega.respostas)
    somar(dia, 'prova_entrega', 1)
    somar(dia, 'prova_questao', medida.respondidas)
    if (prova && notaLiberadaParaOAluno(prova, { userId, isAdmin: false, agora })) {
      somar(dia, 'prova_acerto', medida.acertos)
      // Bônus de desempenho só em prova de verdade (10+ objetivas).
      if (medida.objetivasRespondidas >= 10) {
        const acerto = medida.acertos / medida.objetivasRespondidas
        if (acerto >= 0.7) somar(dia, 'prova_bonus_70', 1)
        if (acerto >= 0.85) somar(dia, 'prova_bonus_85', 1)
      }
    }
  }

  // ── Banco, cartas, aulas, foco ────────────────────────────────────────────
  for (const l of banco) {
    if (!l._id) continue
    somar(l._id, 'banco_acerto', l.acertos)
    somar(l._id, 'banco_erro', l.erros)
    somar(l._id, 'banco_discursiva', l.discursivas)
  }
  for (const l of cartas) {
    if (!l._id) continue
    somar(l._id, 'flash_revisao', l.total)
    somar(l._id, 'flash_lembrei', l.total - l.errei)
  }
  for (const l of dominadas) somar(l._id, 'flash_dominada', l.n)
  for (const l of aulas.novas) somar(l._id, 'aula_concluida', l.n)
  if (aulas.semData > 0) somar(null, 'aula_concluida', aulas.semData)
  for (const l of foco) {
    if (!l._id) continue
    somar(l._id, 'foco_minuto', Math.round((l.ms || 0) / 60_000))
  }

  // ── Eventos (Manual, materiais, anatomia, ferramentas, quizzes, jogos) ───
  const materiaisDoDia = new Map<string, number>()
  for (const l of eventos) {
    const { kind, dia } = l._id
    if (!dia) continue
    switch (kind) {
      case 'material_open':
        materiaisDoDia.set(dia, Math.max(materiaisDoDia.get(dia) || 0, l.recursos))
        break
      case 'manual_patologia_open':
        somar(dia, 'manual_patologia', l.recursos)
        break
      case 'manual_section_open':
        somar(dia, 'manual_secao', l.recursos)
        break
      case 'anatomia_open':
        somar(dia, 'anatomia_prancha', l.recursos)
        break
      case 'anatomia_quiz':
        somar(dia, 'anatomia_acerto', l.acertos)
        somar(dia, 'anatomia_erro', Math.max(0, l.total - l.acertos))
        break
      case 'ferramenta_open':
        somar(dia, 'ferramenta_dia', l.recursos)
        break
      case 'xp_quiz':
        somar(dia, 'quiz_acerto', l.acertos)
        somar(dia, 'quiz_erro', Math.max(0, l.total - l.acertos))
        break
      case 'xp_licao':
        somar(dia, 'licao_concluida', l.recursos)
        break
      case 'xp_jogo':
        somar(dia, 'jogo_vencido', l.recursos)
        break
    }
  }
  // O mesmo material aberto pela página e pelo leitor conta uma vez: fica o maior.
  for (const l of leitor) {
    if (!l._id) continue
    materiaisDoDia.set(l._id, Math.max(materiaisDoDia.get(l._id) || 0, l.n))
  }
  for (const [dia, n] of materiaisDoDia) somar(dia, 'material_dia', n)

  // ── Comunidade ────────────────────────────────────────────────────────────
  for (const l of posts) somar(l._id, 'forum_post', l.n)
  for (const l of comentarios) somar(l._id, 'forum_comentario', l.n)
  for (const [dia, n] of mapas.criados) somar(dia, 'mapa_criado', n)
  for (const l of mapas.curtidas) somar(l._id, 'mapa_curtido', l.n)

  return calcularXp(registros, agora)
}
