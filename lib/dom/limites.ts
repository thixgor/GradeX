import 'server-only'

/**
 * Cotas e incidentes do Dom.
 *
 * - `dom_uso` — um documento por pessoa por dia (`<userId>|<AAAA-MM-DD>`), com
 *   mensagens, buscas e tokens. A cota diária é consumida num único
 *   `updateOne` com filtro `mensagens < teto` + upsert: duas mensagens
 *   simultâneas não passam juntas do teto (a segunda cai na chave duplicada).
 * - `dom_global` — um documento por dia com o total de chamadas a cada motor,
 *   que é o que mantém o projeto dentro do nível gratuito do Gemini.
 * - `dom_incidentes` — tentativas de exploit, para o painel do admin. Três
 *   graves em 24 h suspendem o Dom para a pessoa (`users.domSuspensoAte`).
 *
 * O dia é o de São Paulo (`hojeEmSaoPaulo`), o mesmo do XP: a cota vira à
 * meia-noite do aluno, não à das 21 h de Greenwich.
 */

import type { Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { logAdminSecurityEvent } from '@/lib/admin-audit'
import { hojeEmSaoPaulo } from '@/lib/xp/regras'
import { INCIDENTES_PARA_SUSPENDER, LIMITES_DO_DOM, SUSPENSAO_MS, type ModoDoDom } from './config'
import type { Ataque } from './guarda'

export const COLECAO_USO = 'dom_uso'
export const COLECAO_GLOBAL = 'dom_global'
export const COLECAO_INCIDENTES = 'dom_incidentes'

const DIAS_GUARDADOS_USO = 40
const DIAS_GUARDADOS_INCIDENTES = 180

let indicesGarantidos = false

/** Uma vez por instância (ver a regra do `createIndex` no CLAUDE.md). */
export async function garantirIndicesDoDom(db: Db): Promise<void> {
  if (indicesGarantidos) return
  indicesGarantidos = true
  try {
    await Promise.all([
      db.collection(COLECAO_USO).createIndex({ expiraEm: 1 }, { expireAfterSeconds: 0 }),
      db.collection(COLECAO_USO).createIndex({ dia: 1 }),
      db.collection(COLECAO_GLOBAL).createIndex({ expiraEm: 1 }, { expireAfterSeconds: 0 }),
      db.collection(COLECAO_INCIDENTES).createIndex({ createdAt: -1 }),
      db.collection(COLECAO_INCIDENTES).createIndex({ userId: 1, createdAt: -1 }),
      db.collection(COLECAO_INCIDENTES).createIndex({ createdAt: 1 }, { expireAfterSeconds: DIAS_GUARDADOS_INCIDENTES * 86_400 }),
    ])
  } catch (erro) {
    indicesGarantidos = false
    console.error('[dom] índices:', erro instanceof Error ? erro.message : erro)
  }
}

function expiraEm(dias: number): Date {
  return new Date(Date.now() + dias * 86_400_000)
}

function chaveDoDia(userId: string, dia = hojeEmSaoPaulo()): string {
  return `${userId}|${dia}`
}

export async function mensagensRestantes(db: Db, userId: string): Promise<number> {
  const doc = await db.collection<{ _id: string; mensagens?: number }>(COLECAO_USO).findOne(
    { _id: chaveDoDia(userId) },
    { projection: { mensagens: 1 } },
  )
  return Math.max(0, LIMITES_DO_DOM.porDia - (doc?.mensagens || 0))
}

export type ResultadoDaCota =
  | { ok: true; restantes: number }
  | { ok: false; motivo: 'dia' | 'minuto'; retryAfterSeconds: number }

/** Consome uma mensagem da pessoa. Chamado ANTES da IA; `devolverMensagem` se a IA falhar. */
export async function consumirMensagem(db: Db, userId: string): Promise<ResultadoDaCota> {
  const minuto = await checkRateLimit(`dom:${userId}`, 'dom:minuto', LIMITES_DO_DOM.porMinuto, 60_000)
  if (!minuto.success) {
    const espera = minuto.resetAt ? Math.ceil((minuto.resetAt.getTime() - Date.now()) / 1000) : 60
    return { ok: false, motivo: 'minuto', retryAfterSeconds: Math.max(1, espera) }
  }
  const dia = hojeEmSaoPaulo()
  try {
    const r = await db.collection<{ _id: string; mensagens: number }>(COLECAO_USO).findOneAndUpdate(
      { _id: chaveDoDia(userId, dia), mensagens: { $lt: LIMITES_DO_DOM.porDia } },
      {
        $inc: { mensagens: 1 },
        $set: { userId, dia, atualizadoEm: new Date(), expiraEm: expiraEm(DIAS_GUARDADOS_USO) },
      },
      { upsert: true, returnDocument: 'after', projection: { mensagens: 1 } },
    )
    return { ok: true, restantes: Math.max(0, LIMITES_DO_DOM.porDia - (r?.mensagens || 1)) }
  } catch (erro: any) {
    if (erro?.code === 11000) return { ok: false, motivo: 'dia', retryAfterSeconds: segundosAteAmanha() }
    // Banco instável: falha aberta, como o `checkRateLimit` — o teto global
    // ainda segura o gasto.
    console.error('[dom] cota diária:', erro?.message || erro)
    return { ok: true, restantes: LIMITES_DO_DOM.porDia }
  }
}

export async function devolverMensagem(db: Db, userId: string): Promise<void> {
  await db
    .collection<{ _id: string }>(COLECAO_USO)
    .updateOne({ _id: chaveDoDia(userId), mensagens: { $gt: 0 } }, { $inc: { mensagens: -1 } })
    .catch(() => {})
}

function segundosAteAmanha(): number {
  // Meia-noite de São Paulo (UTC-3, sem horário de verão desde 2019).
  const agora = new Date()
  const sp = new Date(agora.getTime() - 3 * 3_600_000)
  const amanha = Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), sp.getUTCDate() + 1) + 3 * 3_600_000
  return Math.max(60, Math.ceil((amanha - agora.getTime()) / 1000))
}

export type Motor = 'gemini' | 'gateway'

/**
 * Reserva uma chamada no teto global do motor. `gemini` também respeita o teto
 * por minuto (o 429 do Google não pode chegar ao aluno). Devolve `false` se o
 * motor está cheio — quem chama tenta o próximo.
 */
export async function reservarMotor(db: Db, motor: Motor): Promise<boolean> {
  const teto = motor === 'gemini' ? LIMITES_DO_DOM.geminiPorDia : LIMITES_DO_DOM.gatewayPorDia
  if (teto <= 0) return false
  if (motor === 'gemini') {
    const minuto = await checkRateLimit('dom:global', 'dom:gemini-minuto', LIMITES_DO_DOM.geminiPorMinuto, 60_000)
    if (!minuto.success) return false
  }
  return incrementarGlobal(db, motor, teto)
}

/** Reserva uma busca no Google para a pessoa (teto pessoal e global). */
export async function reservarBusca(db: Db, userId: string): Promise<boolean> {
  if (LIMITES_DO_DOM.buscasPorPessoa <= 0 || LIMITES_DO_DOM.buscasPorDia <= 0) return false
  const pessoal = await db
    .collection<{ _id: string }>(COLECAO_USO)
    .updateOne(
      { _id: chaveDoDia(userId), $or: [{ buscas: { $exists: false } }, { buscas: { $lt: LIMITES_DO_DOM.buscasPorPessoa } }] },
      { $inc: { buscas: 1 } },
    )
    .catch(() => null)
  if (!pessoal?.modifiedCount) return false
  return incrementarGlobal(db, 'buscas', LIMITES_DO_DOM.buscasPorDia)
}

async function incrementarGlobal(db: Db, campo: string, teto: number): Promise<boolean> {
  const dia = hojeEmSaoPaulo()
  try {
    await db.collection<{ _id: string }>(COLECAO_GLOBAL).updateOne(
      { _id: dia, $or: [{ [campo]: { $exists: false } }, { [campo]: { $lt: teto } }] },
      { $inc: { [campo]: 1 }, $set: { expiraEm: expiraEm(DIAS_GUARDADOS_USO) } },
      { upsert: true },
    )
    return true
  } catch (erro: any) {
    if (erro?.code === 11000) return false
    console.error('[dom] teto global:', erro?.message || erro)
    return true
  }
}

/** Soma tokens e motor no uso do dia (melhor esforço, não espera). */
export function registrarUso(db: Db, userId: string, p: { motor: Motor | 'local'; entrada?: number; saida?: number }): void {
  const dia = hojeEmSaoPaulo()
  const inc: Record<string, number> = { [`motores.${p.motor}`]: 1 }
  if (p.entrada) inc.tokensEntrada = p.entrada
  if (p.saida) inc.tokensSaida = p.saida
  void db.collection<{ _id: string }>(COLECAO_USO).updateOne({ _id: chaveDoDia(userId, dia) }, { $inc: inc }).catch(() => {})
  void db
    .collection<{ _id: string }>(COLECAO_GLOBAL)
    .updateOne({ _id: dia }, { $inc: { mensagens: 1, tokensEntrada: p.entrada || 0, tokensSaida: p.saida || 0 } })
    .catch(() => {})
}

export interface Incidente {
  userId: string
  nome: string
  email: string
  tipo: Ataque['tipo'] | 'vazamento-de-prompt'
  gravidade: 1 | 2
  trecho: string
  mensagem: string
  modo: ModoDoDom
  rota?: string
  ip?: string
  createdAt: Date
  resolvido?: boolean
}

/**
 * Registra o incidente, avisa a trilha de segurança do painel e, na terceira
 * ocorrência grave em 24 h, suspende o Dom para a pessoa. Devolve se suspendeu.
 */
export async function registrarIncidente(db: Db, incidente: Omit<Incidente, 'createdAt'>): Promise<boolean> {
  const agora = new Date()
  await db
    .collection<Incidente>(COLECAO_INCIDENTES)
    .insertOne({ ...incidente, mensagem: incidente.mensagem.slice(0, 400), createdAt: agora })
    .catch((e) => console.error('[dom] incidente:', e?.message || e))
  void db
    .collection<{ _id: string }>(COLECAO_GLOBAL)
    .updateOne({ _id: hojeEmSaoPaulo() }, { $inc: { incidentes: 1 } })
    .catch(() => {})

  if (incidente.gravidade < 2) return false
  const graves = await db
    .collection(COLECAO_INCIDENTES)
    .countDocuments({ userId: incidente.userId, gravidade: 2, createdAt: { $gte: new Date(agora.getTime() - 86_400_000) } })
    .catch(() => 0)

  const suspender = graves >= INCIDENTES_PARA_SUSPENDER && ObjectId.isValid(incidente.userId)
  if (suspender) {
    await db
      .collection('users')
      .updateOne({ _id: new ObjectId(incidente.userId) }, { $set: { domSuspensoAte: new Date(agora.getTime() + SUSPENSAO_MS) } })
      .catch(() => {})
  }
  // Na trilha do painel vão o primeiro grave e a suspensão — o resto fica na
  // lista própria do Dom, para não afogar os eventos do portão do admin.
  if (graves === 1 || suspender) {
    void logAdminSecurityEvent({
      type: suspender ? 'dom_suspended' : 'dom_exploit',
      userId: incidente.userId,
      userName: incidente.nome,
      userEmail: incidente.email,
      ip: incidente.ip,
      meta: { tipo: incidente.tipo, trecho: incidente.trecho, graves24h: graves },
    })
  }
  return suspender
}
