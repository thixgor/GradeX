import { ObjectId, type Db } from 'mongodb'
import { PRESENCE_WINDOW_MS } from './shared'
import { normalizarCaminho } from './atividade'
import { EXAM_ATTEMPTS_COLLECTION, LIVE_THRESHOLD_MS } from '@/lib/tracking/exam-attempts'

export { currentPagePath } from './caminho'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Presença — lado do servidor
 * ───────────────────────────────────────────────────────────────
 *  Uma pessoa está online se QUALQUER aparelho dela deu sinal de
 *  vida na janela. O sinal é `sessions.lastActiveAt`, carimbado por
 *  toda requisição autenticada — não por login.
 *
 *  Antes o painel usava `users.lastLoginAt`, o que errava dos dois
 *  lados: quem entrou às 8h e passou a manhã inteira fazendo prova
 *  não aparecia, e quem logou e fechou a aba em seguida continuava
 *  "online" por dez minutos.
 * ═══════════════════════════════════════════════════════════════
 */

/** Janela do "online agora", com escape por env (sem novo deploy). */
export function presenceWindowMs(): number {
  const minutes = Number(process.env.PRESENCE_WINDOW_MINUTES)
  if (Number.isFinite(minutes) && minutes >= 1 && minutes <= 60) {
    return Math.round(minutes) * 60 * 1000
  }
  return PRESENCE_WINDOW_MS
}

/*
 * Anti-repique por instância de lambda.
 *
 * O ping do client já é espaçado, mas nada impede duas abas correrem
 * juntas, um retry de rede duplicar o envio ou o mesmo carimbo chegar
 * pelo caminho natural (`getSession`) e pelo ping quase ao mesmo tempo.
 * Como um carimbo vale por minutos, gravar duas vezes no mesmo minuto
 * é escrita jogada fora — e escrita no Atlas é o único custo real
 * desta funcionalidade.
 */
const TOUCH_THROTTLE_MS = 45 * 1000
const lastTouchByJti = new Map<string, number>()

function sweepTouchCache(now: number): void {
  if (lastTouchByJti.size < 500) return
  for (const [jti, at] of lastTouchByJti) {
    if (now - at > TOUCH_THROTTLE_MS) lastTouchByJti.delete(jti)
  }
}

/**
 * Carimba a sessão como viva. Devolve `true` se foi ao banco.
 *
 * Um único `updateOne` pelo índice único de `jti`, sem nenhuma leitura
 * antes: sessão revogada simplesmente não casa com o filtro e o update
 * vira no-op — é o mesmo enforcement de sempre, de graça.
 */
export async function touchPresence(db: Db, jti: string, path?: string): Promise<boolean> {
  const now = Date.now()
  const last = lastTouchByJti.get(jti)
  if (last && now - last < TOUCH_THROTTLE_MS) return false

  lastTouchByJti.set(jti, now)
  sweepTouchCache(now)

  const set: Record<string, unknown> = { lastActiveAt: new Date(now) }
  // Só grava o caminho quando ele foi de fato deduzido: sobrescrever com
  // vazio apagaria a última página conhecida e a lista do admin voltaria a
  // dizer só "está no site".
  const caminho = normalizarCaminho(path)
  if (caminho) set.lastPath = caminho

  await db
    .collection('sessions')
    .updateOne({ jti, revokedAt: { $exists: false } }, { $set: set })
  return true
}

export interface OnlineDevice {
  userId: string
  lastActiveAt: number
  deviceName: string
}

export interface OnlinePresence {
  lastActiveAt: number
  devices: number
  deviceName: string
  /** Última página conhecida — o que vira "o que está fazendo" na tela. */
  lastPath: string
}

export interface OnlineSnapshot {
  /** Ids distintos de usuários com pelo menos um aparelho vivo. */
  userIds: string[]
  /** Aparelhos vivos (uma pessoa com celular + notebook conta 2 aqui). */
  devices: number
  byUser: Map<string, OnlinePresence>
  since: Date
}

/**
 * Lê os aparelhos vivos na janela e agrupa por pessoa.
 *
 * A consulta cai no índice de `lastActiveAt` (o mesmo do TTL das
 * sessões, já existente), então varre só as sessões da janela — algumas
 * dezenas de documentos minúsculos, não a coleção inteira. O `limit`
 * é um cinto de segurança contra uma janela mal configurada.
 */
export async function readOnlineDevices(
  db: Db,
  options: { windowMs?: number; limit?: number; now?: number } = {},
): Promise<OnlineSnapshot> {
  const now = options.now ?? Date.now()
  const since = new Date(now - (options.windowMs ?? presenceWindowMs()))

  const docs = await db
    .collection('sessions')
    .find(
      { lastActiveAt: { $gte: since } },
      {
        projection: {
          userId: 1,
          lastActiveAt: 1,
          deviceName: 1,
          lastPath: 1,
          revokedAt: 1,
          _id: 0,
        },
      },
    )
    .sort({ lastActiveAt: -1 })
    .limit(options.limit ?? 2000)
    .toArray()

  const byUser = new Map<string, OnlinePresence>()
  let devices = 0

  for (const doc of docs) {
    // Sessão derrubada (limite de aparelhos / logout forçado) não é
    // presença: ela para de ser carimbada, mas o último carimbo pode
    // ainda estar dentro da janela.
    if (doc.revokedAt) continue
    const userId = typeof doc.userId === 'string' ? doc.userId : ''
    if (!userId) continue

    devices += 1
    const at = doc.lastActiveAt ? new Date(doc.lastActiveAt).getTime() : 0
    const current = byUser.get(userId)
    if (!current) {
      byUser.set(userId, {
        lastActiveAt: at,
        devices: 1,
        deviceName: doc.deviceName || 'Dispositivo desconhecido',
        lastPath: typeof doc.lastPath === 'string' ? doc.lastPath : '',
      })
      continue
    }
    // Quem tem dois aparelhos vivos é descrito pelo mais recente: é nele que
    // a pessoa está de fato, e é lá que o admin vai encontrá-la.
    current.devices += 1
    if (at > current.lastActiveAt) {
      current.lastActiveAt = at
      current.deviceName = doc.deviceName || current.deviceName
      if (typeof doc.lastPath === 'string' && doc.lastPath) current.lastPath = doc.lastPath
    }
  }

  return { userIds: [...byUser.keys()], devices, byUser, since }
}

/**
 * Descarta os ids que não correspondem mais a uma conta ativa.
 *
 * Banido continua com cookie válido até a próxima navegação, e conta
 * apagada deixa a sessão órfã — nenhum dos dois deve inflar o número.
 * Uma consulta por `_id` sobre um punhado de ids: nada perto do
 * `countDocuments` na coleção inteira de usuários que havia antes.
 */
export async function filterActiveUserIds(db: Db, userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return []
  const objectIds = userIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))
  if (objectIds.length === 0) return []

  const rows = await db
    .collection('users')
    .find({ _id: { $in: objectIds }, banned: { $ne: true } }, { projection: { _id: 1 } })
    .toArray()

  return rows.map((row) => row._id.toString())
}

/**
 * Quem está com uma prova aberta neste instante (ids distintos).
 *
 * Sai de `exam_attempts` (heartbeat de 30s do aluno com a prova aberta)
 * e usa o índice `{ status, lastSeenAt }`. `$in` em vez de `$ne` para o
 * status justamente para o índice poder ser usado de verdade — e
 * `distinct` porque duas abas na mesma prova são uma pessoa só.
 */
export async function readLiveExamUserIds(db: Db, now = Date.now()): Promise<string[]> {
  const ids = await db.collection(EXAM_ATTEMPTS_COLLECTION).distinct('userId', {
    status: { $in: ['opened', 'in_progress'] },
    lastSeenAt: { $gte: new Date(now - LIVE_THRESHOLD_MS) },
  })
  return (ids as unknown[]).filter((id): id is string => typeof id === 'string' && !!id)
}
