/**
 * Plus+ Guard — proteção contra extração em massa e reembolso oportunista.
 *
 * ## O problema
 *
 * O Plus+ libera 100% do acervo (Manual Clínico, materiais, flashcards, aulas,
 * mapas mentais, provas por IA, cronogramas). O art. 49 do CDC dá 7 dias de
 * arrependimento em compra online. Sem trava, o roteiro do abuso é trivial:
 *
 *   1. assina o Plus+;
 *   2. baixa o acervo inteiro em algumas horas;
 *   3. pede reembolso no dia 6;
 *   4. fica com tudo, de graça.
 *
 * ## A resposta
 *
 * Não dá (nem convém) recusar o direito de arrependimento. O que dá é tornar a
 * extração em massa impossível dentro da janela em que o reembolso é garantido,
 * e deixar prova do que foi consumido:
 *
 *  - **Cota escalonada.** Nos primeiros `refundWindowDays` a conta tem uma cota
 *    apertada (hora/dia/semana + teto absoluto na janela). Depois que a janela
 *    fecha e o dinheiro está seguro, a cota sobe para o uso normal. Um aluno de
 *    verdade não sente; um raspador bate na parede no primeiro dia.
 *  - **Corte por hora.** Mata o script automatizado sem punir quem baixa o
 *    material da semana de uma vez.
 *  - **Marca d'água identificada.** Todo PDF sai com o fingerprint do usuário,
 *    então o arquivo vazado aponta para a conta de origem.
 *  - **Score de risco.** Rajadas, IPs demais e volume acima do padrão somam
 *    pontos; ao cruzar o limite a conta é sinalizada (e, se o admin quiser,
 *    tem o download bloqueado até revisão).
 *  - **Log server-side de consumo.** É a evidência para contestar o estorno no
 *    Mercado Pago: "esse usuário baixou 180 arquivos em 4 dias".
 *  - **Clawback.** Reembolso aprovado derruba o cargo e revoga o que a
 *    assinatura liberou.
 *  - **Carência pós-reembolso.** Quem já pediu reembolso não reassina no dia
 *    seguinte para repetir a rodada.
 *
 * Tudo é configurável em /admin/settings → Plus+.
 */

import { Db, ObjectId } from 'mongodb'
import { getDb } from './mongodb'
import { isPlusAccount, normalizeAccountType } from './account-tier'
import { contaEhPaga } from './cargos-server'
import type {
  PlusDownloadKind,
  PlusDownloadLog,
  PlusDownloadQuota,
  PlusGuardDecision,
  PlusGuardSettings,
  User,
} from './types'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS

/**
 * Padrões pensados para não incomodar o aluno real e travar o raspador.
 *
 * Referência de uso legítimo: um assinante ativo baixa algo entre 5 e 15
 * arquivos por dia em semana de prova. As cotas da janela de arrependimento
 * ficam confortavelmente acima disso; o teto de 120 na janela inteira é ~1/10
 * do acervo, o que torna a "baixa tudo e pede reembolso" inviável.
 */
export const DEFAULT_PLUS_GUARD: PlusGuardSettings = {
  enabled: true,
  refundWindowDays: 7,
  trialWindow: {
    perHour: 12,
    perDay: 25,
    perWeek: 120,
  },
  steadyState: {
    perHour: 40,
    perDay: 150,
    perWeek: 600,
  },
  refundWindowTotalCap: 120,
  maxDevices: 3,
  riskScoreThreshold: 70,
  autoBlockOnRisk: false,
  enforceWatermark: true,
  revokeOnRefund: true,
  refundCooldownDays: 90,
  quotaMessage:
    'Você atingiu o limite de downloads deste período. O limite existe para proteger o acervo e aumenta automaticamente após os primeiros dias de assinatura.',
}

/** Mescla o que está salvo no banco com os padrões (campo a campo). */
export function mergePlusGuardSettings(saved?: Partial<PlusGuardSettings> | null): PlusGuardSettings {
  if (!saved) return { ...DEFAULT_PLUS_GUARD }
  return {
    ...DEFAULT_PLUS_GUARD,
    ...saved,
    trialWindow: { ...DEFAULT_PLUS_GUARD.trialWindow, ...(saved.trialWindow || {}) },
    steadyState: { ...DEFAULT_PLUS_GUARD.steadyState, ...(saved.steadyState || {}) },
  }
}

/** Sanitiza o payload do admin — números negativos/absurdos viram o padrão. */
export function sanitizePlusGuardSettings(input: any): PlusGuardSettings {
  const num = (v: any, fallback: number, max = 100_000) => {
    const n = Number(v)
    if (!Number.isFinite(n) || n < 0 || n > max) return fallback
    return Math.floor(n)
  }
  const quota = (v: any, fallback: PlusDownloadQuota): PlusDownloadQuota => ({
    perHour: num(v?.perHour, fallback.perHour),
    perDay: num(v?.perDay, fallback.perDay),
    perWeek: num(v?.perWeek, fallback.perWeek),
  })

  return {
    enabled: input?.enabled !== false,
    refundWindowDays: num(input?.refundWindowDays, DEFAULT_PLUS_GUARD.refundWindowDays, 365),
    trialWindow: quota(input?.trialWindow, DEFAULT_PLUS_GUARD.trialWindow),
    steadyState: quota(input?.steadyState, DEFAULT_PLUS_GUARD.steadyState),
    refundWindowTotalCap: num(input?.refundWindowTotalCap, DEFAULT_PLUS_GUARD.refundWindowTotalCap),
    maxDevices: num(input?.maxDevices, DEFAULT_PLUS_GUARD.maxDevices, 20),
    riskScoreThreshold: num(input?.riskScoreThreshold, DEFAULT_PLUS_GUARD.riskScoreThreshold, 1000),
    autoBlockOnRisk: !!input?.autoBlockOnRisk,
    enforceWatermark: input?.enforceWatermark !== false,
    revokeOnRefund: input?.revokeOnRefund !== false,
    refundCooldownDays: num(input?.refundCooldownDays, DEFAULT_PLUS_GUARD.refundCooldownDays, 3650),
    quotaMessage: String(input?.quotaMessage || DEFAULT_PLUS_GUARD.quotaMessage).slice(0, 500),
    atualizadoEm: new Date(),
  }
}

export async function getPlusGuardSettings(db?: Db): Promise<PlusGuardSettings> {
  try {
    const database = db ?? (await getDb())
    const settings = await database
      .collection('admin_settings')
      .findOne({}, { projection: { plusGuard: 1 } })
    return mergePlusGuardSettings(settings?.plusGuard)
  } catch (err) {
    console.error('[plus-guard] falha ao ler settings, usando padrão:', err)
    return { ...DEFAULT_PLUS_GUARD }
  }
}

// ─── Janela de arrependimento ─────────────────────────────────────────────────

/**
 * A assinatura ainda está dentro do prazo em que o reembolso é garantido?
 *
 * Conta a partir de `premiumActivatedAt` (quando o cargo foi concedido). Sem
 * essa data — conta antiga ou concedida manualmente — assume fora da janela:
 * é a leitura conservadora, já que não houve pagamento recente para estornar.
 */
export function isInRefundWindow(user: Pick<User, 'premiumActivatedAt'>, settings: PlusGuardSettings): boolean {
  if (!user?.premiumActivatedAt) return false
  const activated = new Date(user.premiumActivatedAt).getTime()
  if (!Number.isFinite(activated)) return false
  return Date.now() - activated < settings.refundWindowDays * DAY_MS
}

/** Quando a janela de arrependimento fecha (para exibir ao usuário). */
export function getRefundWindowEnd(
  user: Pick<User, 'premiumActivatedAt'>,
  settings: PlusGuardSettings,
): Date | null {
  if (!user?.premiumActivatedAt) return null
  return new Date(new Date(user.premiumActivatedAt).getTime() + settings.refundWindowDays * DAY_MS)
}

// ─── Decisão de download ──────────────────────────────────────────────────────

export interface PlusGuardCheckParams {
  userId: string
  /** Evita uma segunda ida ao banco quando o caller já carregou o usuário. */
  user?: Partial<User> | null
  isAdmin?: boolean
  db?: Db
}

/**
 * Pode liberar mais um download para esta conta agora?
 *
 * Não registra nada — quem libera o arquivo chama `recordPlusDownload()`
 * depois. Separar as duas etapas evita queimar cota quando a geração do PDF
 * falha no meio.
 */
export async function checkPlusDownloadAllowance({
  userId,
  user,
  isAdmin,
  db,
}: PlusGuardCheckParams): Promise<PlusGuardDecision> {
  if (isAdmin) return { allowed: true }

  const database = db ?? (await getDb())
  const settings = await getPlusGuardSettings(database)
  if (!settings.enabled) return { allowed: true }

  let userDoc = user
  if (!userDoc && ObjectId.isValid(userId)) {
    userDoc = (await database.collection<User>('users').findOne(
      { _id: new ObjectId(userId) as any },
      { projection: { accountType: 1, premiumActivatedAt: 1, plusDownloadsBlocked: 1, plusDownloadsBlockedReason: 1 } },
    )) as Partial<User> | null
  }
  if (!userDoc) return { allowed: true }

  // Bloqueio manual do admin ou automático por risco.
  if (userDoc.plusDownloadsBlocked) {
    return {
      allowed: false,
      reason: 'risk_blocked',
      message:
        userDoc.plusDownloadsBlockedReason ||
        'Downloads temporariamente suspensos nesta conta por atividade atípica. Fale com o suporte.',
    }
  }

  /*
   * As cotas do Guard valem para quem paga — Plus+ e Quest. Gratuito/trial já
   * são barrados antes, pelos limites de plano.
   *
   * Quest entrou aqui de propósito: ele vende só o Banco de Questões, mas o
   * risco de "assina, extrai tudo, pede reembolso no dia 6" é o mesmo — só
   * que sobre um acervo menor. A cota é a mesma do Plus+ porque o padrão de
   * uso legítimo (alguns downloads por dia numa semana de prova) não muda
   * com o tamanho do produto; o que protege é o teto, não o preço pago.
   *
   * "Paga" sai do registro de cargos, e não de uma lista fixa: um cargo pago
   * criado em `/admin/cargos` nasce protegido, sem ninguém precisar lembrar
   * de vir aqui adicioná-lo.
   */
  if (!(await contaEhPaga(userDoc.accountType, database))) return { allowed: true }

  const inWindow = isInRefundWindow(userDoc as User, settings)
  const quota = inWindow ? settings.trialWindow : settings.steadyState

  const now = Date.now()
  const logs = database.collection<PlusDownloadLog>('plus_download_logs')

  const [hourCount, dayCount, weekCount] = await Promise.all([
    logs.countDocuments({ userId, createdAt: { $gte: new Date(now - HOUR_MS) } }),
    logs.countDocuments({ userId, createdAt: { $gte: new Date(now - DAY_MS) } }),
    logs.countDocuments({ userId, createdAt: { $gte: new Date(now - WEEK_MS) } }),
  ])

  if (quota.perHour > 0 && hourCount >= quota.perHour) {
    return deny('hourly_quota', settings, new Date(now + HOUR_MS))
  }
  if (quota.perDay > 0 && dayCount >= quota.perDay) {
    return deny('daily_quota', settings, new Date(now + DAY_MS))
  }
  if (quota.perWeek > 0 && weekCount >= quota.perWeek) {
    return deny('weekly_quota', settings, new Date(now + WEEK_MS))
  }

  // Teto absoluto da janela de arrependimento: independe de hora/dia/semana.
  // É o que garante que ninguém leva o acervo antes de o reembolso expirar.
  if (inWindow && settings.refundWindowTotalCap > 0) {
    const windowStart = new Date(userDoc.premiumActivatedAt as Date)
    const windowTotal = await logs.countDocuments({ userId, createdAt: { $gte: windowStart } })
    if (windowTotal >= settings.refundWindowTotalCap) {
      const end = getRefundWindowEnd(userDoc as User, settings)
      return {
        allowed: false,
        reason: 'refund_window_cap',
        retryAt: end || undefined,
        message: `Você atingiu o limite de downloads dos primeiros ${settings.refundWindowDays} dias de assinatura. O limite é liberado automaticamente${
          end ? ` em ${end.toLocaleDateString('pt-BR')}` : ''
        }.`,
      }
    }
  }

  const remaining = Math.max(
    0,
    Math.min(
      quota.perHour > 0 ? quota.perHour - hourCount : Infinity,
      quota.perDay > 0 ? quota.perDay - dayCount : Infinity,
      quota.perWeek > 0 ? quota.perWeek - weekCount : Infinity,
    ),
  )

  return { allowed: true, remaining: Number.isFinite(remaining) ? remaining : undefined }
}

function deny(
  reason: PlusGuardDecision['reason'],
  settings: PlusGuardSettings,
  retryAt: Date,
): PlusGuardDecision {
  return { allowed: false, reason, retryAt, message: settings.quotaMessage, remaining: 0 }
}

// ─── Registro de consumo ──────────────────────────────────────────────────────

export interface RecordDownloadParams {
  userId: string
  userEmail?: string
  userName?: string
  accountType?: string
  kind: PlusDownloadKind
  resourceId?: string
  resourceTitle?: string
  ip?: string
  userAgent?: string
  watermarkFingerprint?: string
  db?: Db
}

/**
 * Grava o download liberado e reavalia o risco da conta.
 *
 * Best-effort por design: se o log falhar, o usuário já recebeu o arquivo e
 * derrubar a resposta agora só produziria um erro sem sentido para ele. A
 * falha vai para o console e a cota se auto-corrige na próxima janela.
 */
export async function recordPlusDownload(params: RecordDownloadParams): Promise<void> {
  try {
    const database = params.db ?? (await getDb())
    const settings = await getPlusGuardSettings(database)

    let inRefundWindow = false
    if (ObjectId.isValid(params.userId)) {
      const user = await database.collection<User>('users').findOne(
        { _id: new ObjectId(params.userId) as any },
        { projection: { premiumActivatedAt: 1, accountType: 1 } },
      )
      if (user) inRefundWindow = isInRefundWindow(user as User, settings)
    }

    const log: Omit<PlusDownloadLog, '_id'> = {
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      accountType: normalizeAccountType(params.accountType),
      kind: params.kind,
      resourceId: params.resourceId,
      resourceTitle: params.resourceTitle,
      inRefundWindow,
      ip: params.ip,
      userAgent: params.userAgent?.slice(0, 300),
      watermarkFingerprint: params.watermarkFingerprint,
      createdAt: new Date(),
    }
    await database.collection<PlusDownloadLog>('plus_download_logs').insertOne(log as any)

    await ensurePlusGuardIndexes(database)
    await evaluatePlusRisk(params.userId, database, settings)
  } catch (err) {
    console.error('[plus-guard] falha ao registrar download:', err)
  }
}

let indexesEnsured = false
async function ensurePlusGuardIndexes(db: Db) {
  if (indexesEnsured) return
  try {
    const col = db.collection('plus_download_logs')
    await Promise.all([
      col.createIndex({ userId: 1, createdAt: -1 }),
      col.createIndex({ createdAt: -1 }),
      col.createIndex({ inRefundWindow: 1, createdAt: -1 }),
      // Guarda 1 ano: prazo confortável para contestar estorno e auditar.
      col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }),
    ])
    indexesEnsured = true
  } catch (err) {
    console.error('[plus-guard] ensureIndexes:', err)
  }
}

// ─── Score de risco ───────────────────────────────────────────────────────────

/**
 * Recalcula o risco da conta a partir das últimas 24h. Não é antifraude
 * sofisticada — é um sinal barato para o admin olhar a conta certa.
 *
 * Pontuação (0–100+):
 *  - volume nas últimas 24h contra a cota do momento;
 *  - rajada: muitos downloads na última hora;
 *  - IPs distintos em 24h (indício de conta compartilhada);
 *  - peso extra se tudo isso acontece dentro da janela de reembolso.
 */
export async function evaluatePlusRisk(
  userId: string,
  db?: Db,
  settingsArg?: PlusGuardSettings,
): Promise<number> {
  const database = db ?? (await getDb())
  const settings = settingsArg ?? (await getPlusGuardSettings(database))
  if (!ObjectId.isValid(userId)) return 0

  const users = database.collection<User>('users')
  const user = await users.findOne(
    { _id: new ObjectId(userId) as any },
    { projection: { accountType: 1, premiumActivatedAt: 1, plusDownloadsBlocked: 1 } },
  )
  // Mesmo critério de `checkPlusDownloadAllowance`: todo cargo pago do registro
  // acumula risco.
  if (!user) return 0
  if (!(await contaEhPaga(user.accountType, database))) return 0

  const logs = database.collection<PlusDownloadLog>('plus_download_logs')
  const now = Date.now()
  const since24h = new Date(now - DAY_MS)

  const recent = await logs
    .find({ userId, createdAt: { $gte: since24h } }, { projection: { ip: 1, createdAt: 1 } })
    .toArray()

  const inWindow = isInRefundWindow(user as User, settings)
  const quota = inWindow ? settings.trialWindow : settings.steadyState

  const dayCount = recent.length
  const hourCount = recent.filter(r => new Date(r.createdAt).getTime() >= now - HOUR_MS).length
  const distinctIps = new Set(recent.map(r => r.ip).filter(Boolean)).size

  let score = 0
  if (quota.perDay > 0) score += Math.min(40, (dayCount / quota.perDay) * 40)
  if (quota.perHour > 0) score += Math.min(30, (hourCount / quota.perHour) * 30)
  if (distinctIps > 3) score += Math.min(20, (distinctIps - 3) * 5)
  if (inWindow && dayCount > 0) score += 10

  const rounded = Math.round(score)
  const update: Record<string, any> = { plusRiskScore: rounded }

  const crossedThreshold = rounded >= settings.riskScoreThreshold
  if (crossedThreshold) {
    update.plusRiskFlaggedAt = new Date()
    if (settings.autoBlockOnRisk && !user.plusDownloadsBlocked) {
      update.plusDownloadsBlocked = true
      update.plusDownloadsBlockedReason =
        'Bloqueio automático por volume atípico de downloads. Fale com o suporte para reativar.'
    }
  }

  await users.updateOne({ _id: new ObjectId(userId) as any }, { $set: update })
  return rounded
}

// ─── Reembolso / estorno ──────────────────────────────────────────────────────

/**
 * Clawback: reembolso ou chargeback aprovado.
 *
 * Rebaixa a conta para gratuito, encerra a assinatura e registra o evento para
 * a carência de reassinatura. O log de downloads **não** é apagado — é
 * justamente o que sustenta a contestação do estorno.
 */
export async function applyPlusRefundClawback(
  userId: string,
  reason: string,
  db?: Db,
): Promise<{ revoked: boolean; downloadsInWindow: number; claimsRevoked: number }> {
  const database = db ?? (await getDb())
  const settings = await getPlusGuardSettings(database)
  if (!ObjectId.isValid(userId)) return { revoked: false, downloadsInWindow: 0, claimsRevoked: 0 }

  const users = database.collection<User>('users')
  const user = await users.findOne({ _id: new ObjectId(userId) as any })
  if (!user) return { revoked: false, downloadsInWindow: 0, claimsRevoked: 0 }

  const downloadsInWindow = await database
    .collection<PlusDownloadLog>('plus_download_logs')
    .countDocuments({ userId, inRefundWindow: true })

  if (!settings.revokeOnRefund) {
    await users.updateOne(
      { _id: new ObjectId(userId) as any },
      { $set: { plusRefundedAt: new Date() }, $inc: { plusRefundCount: 1 } },
    )
    // `revokeOnRefund` desligado: o cargo fica, então os resgates ficam também.
    return { revoked: false, downloadsInWindow, claimsRevoked: 0 }
  }

  await users.updateOne(
    { _id: new ObjectId(userId) as any },
    {
      $set: {
        accountType: 'gratuito',
        premiumPlanType: undefined as any,
        premiumExpiresAt: undefined as any,
        premiumActivatedAt: undefined as any,
        premiumPrice: undefined as any,
        mercadoPagoPreapprovalId: undefined as any,
        plusRefundedAt: new Date(),
        plusDownloadsBlockedReason: `Assinatura reembolsada (${reason}).`,
      },
      $inc: { plusRefundCount: 1 },
    },
  )

  // Encerra assinaturas ainda marcadas como ativas.
  await database.collection('subscriptions').updateMany(
    { userId, status: { $in: ['authorized', 'pending'] } },
    { $set: { status: 'cancelled', cancelReason: `refund:${reason}`, updatedAt: new Date() } },
  )

  // Devolveu o dinheiro, devolve o acervo: os materiais resgatados pela
  // assinatura são suspensos. Compra avulsa não entra nisso — é receita própria,
  // estornada (se for o caso) pelo fluxo de reembolso do próprio material.
  const { revokePlusClaims } = await import('./plus-claims')
  const claims = await revokePlusClaims(userId, `refund:${reason}`, database).catch(err => {
    console.error('[plus-guard] revogar resgates no clawback falhou:', err)
    return { count: 0, items: [] }
  })

  return { revoked: true, downloadsInWindow, claimsRevoked: claims.count }
}

/**
 * A conta está em carência por reembolso anterior? Consultado antes de deixar
 * assinar de novo — sem isso o mesmo usuário repete o ciclo todo mês.
 */
export async function checkRefundCooldown(
  userId: string,
  db?: Db,
): Promise<{ blocked: boolean; until?: Date; message?: string }> {
  const database = db ?? (await getDb())
  const settings = await getPlusGuardSettings(database)
  if (!settings.enabled || settings.refundCooldownDays <= 0) return { blocked: false }
  if (!ObjectId.isValid(userId)) return { blocked: false }

  const user = await database
    .collection<User>('users')
    .findOne({ _id: new ObjectId(userId) as any }, { projection: { plusRefundedAt: 1 } })
  if (!user?.plusRefundedAt) return { blocked: false }

  const until = new Date(new Date(user.plusRefundedAt).getTime() + settings.refundCooldownDays * DAY_MS)
  if (until.getTime() <= Date.now()) return { blocked: false }

  return {
    blocked: true,
    until,
    message: `Esta conta teve uma assinatura reembolsada recentemente. Novas assinaturas ficam disponíveis a partir de ${until.toLocaleDateString(
      'pt-BR',
    )}. Se precisar antes, fale com o suporte.`,
  }
}

// ─── Resumo para o admin / usuário ────────────────────────────────────────────

export interface PlusUsageSummary {
  accountType: string
  isPlus: boolean
  inRefundWindow: boolean
  refundWindowEndsAt: Date | null
  quota: PlusDownloadQuota
  used: { lastHour: number; today: number; thisWeek: number; refundWindowTotal: number }
  refundWindowTotalCap: number
  riskScore: number
  blocked: boolean
}

export async function getPlusUsageSummary(userId: string, db?: Db): Promise<PlusUsageSummary | null> {
  const database = db ?? (await getDb())
  if (!ObjectId.isValid(userId)) return null

  const settings = await getPlusGuardSettings(database)
  const user = await database.collection<User>('users').findOne({ _id: new ObjectId(userId) as any })
  if (!user) return null

  const inRefundWindow = isInRefundWindow(user as User, settings)
  const quota = inRefundWindow ? settings.trialWindow : settings.steadyState
  const logs = database.collection<PlusDownloadLog>('plus_download_logs')
  const now = Date.now()

  const [lastHour, today, thisWeek, refundWindowTotal] = await Promise.all([
    logs.countDocuments({ userId, createdAt: { $gte: new Date(now - HOUR_MS) } }),
    logs.countDocuments({ userId, createdAt: { $gte: new Date(now - DAY_MS) } }),
    logs.countDocuments({ userId, createdAt: { $gte: new Date(now - WEEK_MS) } }),
    user.premiumActivatedAt
      ? logs.countDocuments({ userId, createdAt: { $gte: new Date(user.premiumActivatedAt) } })
      : Promise.resolve(0),
  ])

  return {
    accountType: normalizeAccountType(user.accountType),
    isPlus: isPlusAccount(user.accountType),
    inRefundWindow,
    refundWindowEndsAt: getRefundWindowEnd(user as User, settings),
    quota,
    used: { lastHour, today, thisWeek, refundWindowTotal },
    refundWindowTotalCap: settings.refundWindowTotalCap,
    riskScore: user.plusRiskScore || 0,
    blocked: !!user.plusDownloadsBlocked,
  }
}
