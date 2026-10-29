import type { Db } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS } from '@/lib/flashcard-manual'
import { ACTIVITY_COLLECTION } from '@/lib/tracking/activity-events'
import { MINDMAP_COLLECTIONS } from '@/lib/mindmap'
import { COLECAO_XP, atualizarPerfilDeXp, garantirIndicesDoXp, type PerfilDeXp } from './perfis'
import { VERSAO_DAS_REGRAS, hojeEmSaoPaulo, mesDe, semanaDe } from './regras'
import { EVENTOS_COM_XP } from './extrato'

/**
 * A varredura do XP — quem coloca no ranking, com o XP retroativo, as pessoas
 * que ainda não voltaram ao site.
 *
 * Ela não anda pela lista inteira de contas: a maioria dos cadastros nunca
 * estudou e teria XP zero. Primeiro pergunta às próprias fontes quem tem
 * histórico (um `distinct` por coleção, servido pelos índices de usuário) e
 * só calcula essas pessoas — as sem retrato primeiro, depois os retratos mais
 * velhos. Uma trava em `xp_varredura` garante uma varredura por vez, venha ela
 * do cron ou de alguém abrindo o ranking.
 */

const COLECAO_ESTADO = 'xp_varredura'
/**
 * Retrato com mais de 24 h é refeito pela varredura. Mais que isso é gasto à
 * toa: o XP só muda quando a pessoa estuda, e quem estuda está no site — o
 * `/api/xp/eu` já refaz o retrato dela. A varredura existe para quem nunca foi
 * calculado (o retroativo) e para as raras mudanças sem visita (a nota de uma
 * prova liberada depois).
 */
const IDADE_MAXIMA_MS = 24 * 60 * 60 * 1000
const SIMULTANEOS = 6

interface Estado {
  _id: string
  ate?: Date
  pendentes?: number
  ativos?: number
  atualizadoEm?: Date
}

let candidatosEmMemoria: { ids: string[]; expiraEm: number } | null = null

/** Quem tem algum histórico que vale XP — de todas as fontes, sem repetição. */
async function pessoasComHistorico(db: Db): Promise<string[]> {
  if (candidatosEmMemoria && candidatosEmMemoria.expiraEm > Date.now()) return candidatosEmMemoria.ids
  const distintos = (colecao: string, campo: string, filtro: Record<string, unknown> = {}) =>
    db
      .collection(colecao)
      .distinct(campo, filtro)
      .catch((err) => {
        console.error(`[xp] distinct em ${colecao} falhou:`, err)
        return [] as unknown[]
      })
  const listas = await Promise.all([
    distintos('banco_resolucoes', 'userId'),
    distintos('submissions', 'userId'),
    distintos(FLASHCARD_MANUAL_COLLECTIONS.sessions, 'userId'),
    distintos('aulas_progresso', 'usuarioId', { concluida: true }),
    distintos('focus-sessions', 'userId'),
    distintos(ACTIVITY_COLLECTION, 'userId', { kind: { $in: [...EVENTOS_COM_XP] } }),
    distintos('forum_posts', 'authorId'),
    distintos('forum_comments', 'authorId'),
    distintos(MINDMAP_COLLECTIONS.maps, 'ownerId'),
  ])
  const ids = new Set<string>()
  for (const lista of listas) {
    for (const id of lista) {
      const texto = id == null ? '' : String(id)
      if (/^[a-f0-9]{24}$/i.test(texto)) ids.add(texto)
    }
  }
  candidatosEmMemoria = { ids: Array.from(ids), expiraEm: Date.now() + 10 * 60_000 }
  return candidatosEmMemoria.ids
}

/** Quem falta calcular (sem retrato) e quem está velho, nesta ordem. */
async function filaDaVarredura(db: Db, agora: Date) {
  const [ativos, retratos] = await Promise.all([
    pessoasComHistorico(db),
    db
      .collection<PerfilDeXp>(COLECAO_XP)
      .find({}, { projection: { _id: 0, userId: 1, atualizadoEm: 1, versao: 1 } })
      .toArray(),
  ])
  const quando = new Map(retratos.map((r) => [r.userId, r.versao === VERSAO_DAS_REGRAS ? new Date(r.atualizadoEm).getTime() : 0]))
  const semRetrato: string[] = []
  const velhos: Array<{ id: string; em: number }> = []
  for (const id of ativos) {
    const em = quando.get(id)
    if (em === undefined) semRetrato.push(id)
    else if (agora.getTime() - em > IDADE_MAXIMA_MS) velhos.push({ id, em })
  }
  velhos.sort((a, b) => a.em - b.em)
  return { fila: [...semRetrato, ...velhos.map((v) => v.id)], pendentes: semRetrato.length, ativos: ativos.length }
}

/** Pega a trava por `ms`. `false` se outra varredura está rodando. */
async function pegarTrava(db: Db, ms: number): Promise<boolean> {
  const agora = new Date()
  try {
    await db.collection<Estado>(COLECAO_ESTADO).findOneAndUpdate(
      { _id: 'trava', $or: [{ ate: { $lt: agora } }, { ate: { $exists: false } }] },
      { $set: { ate: new Date(agora.getTime() + ms) } },
      { upsert: true },
    )
    return true
  } catch (err: any) {
    // A trava existe e não venceu: o upsert bate no _id e falha com 11000.
    if (err?.code === 11000) return false
    throw err
  }
}

async function soltarTrava(db: Db) {
  await db.collection<Estado>(COLECAO_ESTADO).updateOne({ _id: 'trava' }, { $set: { ate: new Date(0) } }).catch(() => {})
}

export interface ResultadoDaVarredura {
  rodou: boolean
  processados: number
  falhas: number
  pendentes: number
  ativos: number
  ms: number
}

/** Calcula quem falta, dentro do orçamento de tempo. */
export async function varrerXp(db: Db, { orcamentoMs }: { orcamentoMs: number }): Promise<ResultadoDaVarredura> {
  const inicio = Date.now()
  await garantirIndicesDoXp(db)
  if (!(await pegarTrava(db, orcamentoMs + 15_000))) {
    return { rodou: false, processados: 0, falhas: 0, pendentes: -1, ativos: -1, ms: Date.now() - inicio }
  }

  let processados = 0
  let falhas = 0
  const agora = new Date()
  try {
    const { fila, pendentes, ativos } = await filaDaVarredura(db, agora)
    for (let i = 0; i < fila.length && Date.now() - inicio < orcamentoMs; i += SIMULTANEOS) {
      const fatia = fila.slice(i, i + SIMULTANEOS)
      const resultados = await Promise.allSettled(fatia.map((id) => atualizarPerfilDeXp(db, id)))
      resultados.forEach((r, k) => {
        if (r.status === 'rejected') falhas++
        // Conta apagada que deixou histórico: um retrato vazio, para não voltar à fila.
        else if (r.value === null) void marcarSemConta(db, fatia[k], agora)
      })
      processados += fatia.length
    }
    const restantes = Math.max(0, pendentes - processados)
    await db.collection<Estado>(COLECAO_ESTADO).updateOne(
      { _id: 'estado' },
      { $set: { pendentes: restantes, ativos, atualizadoEm: new Date() } },
      { upsert: true },
    )
    return { rodou: true, processados, falhas, pendentes: restantes, ativos, ms: Date.now() - inicio }
  } finally {
    await soltarTrava(db)
  }
}

async function marcarSemConta(db: Db, userId: string, agora: Date) {
  const hoje = hojeEmSaoPaulo(agora)
  await db
    .collection(COLECAO_XP)
    .updateOne(
      { userId },
      {
        $set: {
          userId, nome: 'Conta removida', total: 0, elegivel: false, versao: VERSAO_DAS_REGRAS, atualizadoEm: agora,
          semana: { chave: semanaDe(hoje), xp: 0 }, mes: { chave: mesDe(hoje), xp: 0 }, hoje: { chave: hoje, xp: 0 },
        },
      },
      { upsert: true },
    )
    .catch(() => {})
}

/**
 * Quantos com histórico ainda não têm XP calculado — o que o ranking mostra
 * como "calculando…". Lido do estado gravado pela última varredura; `null`
 * quando nenhuma rodou ainda (aí também está tudo por calcular).
 */
export async function estadoDaVarredura(db: Db): Promise<{ pendentes: number | null; ativos: number | null }> {
  const estado = await db.collection<Estado>(COLECAO_ESTADO).findOne({ _id: 'estado' })
  return { pendentes: estado?.pendentes ?? null, ativos: estado?.ativos ?? null }
}
