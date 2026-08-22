import { Db, ObjectId } from 'mongodb'
import type { ManualClinicoPlanKey } from '@/lib/types'
import {
  computeProuniDiscount,
  getProuniDiscountLabel,
  PROUNI_MAX_PENDING_PER_USER,
  PROUNI_MAX_REQUESTS_PER_DAY,
  PROUNI_PROGRAM_LABELS,
  PROUNI_REJECTED_COOLDOWN_HOURS,
  ProuniError,
  type ProuniDiscountType,
  type ProuniGrantUsage,
  type ProuniItemType,
  type ProuniProgram,
  type ProuniRequestStatus,
} from '@/lib/prouni-shared'

// Reexportado para quem já importa tudo de `@/lib/prouni-fies` continuar
// funcionando: a divisão em dois arquivos é detalhe de empacotamento, não uma
// mudança de API.
export * from '@/lib/prouni-shared'

/**
 * Desconto PROUNI/FIES — regras, documentos e ciclo de vida.
 *
 * ## O problema que isto resolve
 *
 * Cupom não serve para benefício socioeconômico. Um cupom é um código: quem
 * recebe repassa, e o desconto pensado para o bolsista vaza para o grupo do
 * WhatsApp inteiro. Lote também não serve — ele vale para todo mundo ao mesmo
 * tempo. O que falta é um desconto que só existe DEPOIS de alguém provar a
 * condição, e que vale para uma pessoa e um produto: nada de código, nada de
 * link compartilhável.
 *
 * Por isso o benefício aqui tem duas metades separadas de propósito:
 *
 * 1. **A oferta** (`prouni_benefits`): o admin liga o desconto no produto X
 *    (opcional — sem registro, o produto simplesmente não oferece nada). É só
 *    a promessa: "este item tem X% para bolsista".
 *
 * 2. **A concessão** (o campo `grant` dentro de `prouni_requests`): nasce
 *    quando um admin aprova a solicitação de UMA pessoa. É ela que desconta de
 *    verdade no checkout, e ela morre ao ser usada.
 *
 * A oferta pode ser alterada ou desligada a qualquer momento sem tocar em quem
 * já foi aprovado: a concessão carrega uma *fotografia* das condições no
 * momento do aceite. Quem foi aprovado com 40% continua com 40% mesmo que o
 * admin baixe a oferta para 20% no dia seguinte — e o inverso também vale, o
 * que impede que mexer na oferta vire desconto retroativo não intencional.
 *
 * ## Sobrepor lotes
 *
 * O benefício aceita as duas leituras de "sobrepor", porque as duas são
 * legítimas em campanhas diferentes:
 *
 * - `stackWithTier: false` (padrão) → vale o MAIOR desconto entre lote, cupom e
 *   PROUNI. O bolsista nunca paga mais que qualquer outro comprador.
 * - `stackWithTier: true` → o PROUNI incide sobre o preço JÁ com o lote
 *   aplicado (lote + PROUNI empilhados). Nesse caso o cupom sai de cena: três
 *   descontos somados no mesmo item é o caminho mais curto para vender a R$ 0
 *   por engano.
 *
 * ## Sobre os comprovantes
 *
 * Os anexos são documento pessoal (termo de bolsa, contrato FIES, muitas vezes
 * com CPF e endereço). Eles vão para o Blob com `access: 'private'` e nunca são
 * expostos por URL direta: o admin os lê por uma rota autenticada que faz o
 * proxy dos bytes. E são descartáveis por construção — depois da análise o
 * admin apaga os arquivos e a solicitação continua íntegra, com o histórico do
 * que foi decidido, sem guardar o documento de ninguém por tempo indeterminado.
 */

export const PROUNI_BENEFITS_COLLECTION = 'prouni_benefits'
export const PROUNI_REQUESTS_COLLECTION = 'prouni_requests'

export interface ProuniBenefit {
  _id?: string | ObjectId
  itemType: ProuniItemType
  itemId: string
  itemTitle: string
  discountType: ProuniDiscountType
  discountValue: number
  /** Ver o bloco "Sobrepor lotes" no topo do arquivo. */
  stackWithTier: boolean
  /** Planos do Manual Clínico alcançados. Vazio/ausente = todos. */
  allowedManualPlans?: ManualClinicoPlanKey[] | null
  /** Dias de validade da concessão aprovada. `null` = sem prazo. */
  grantValidityDays?: number | null
  /** Texto do admin exibido na página exclusiva do produto. */
  instructions?: string
  isActive: boolean
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export interface ProuniAttachment {
  id: string
  blobUrl: string
  blobPathname: string
  filename: string
  contentType: string
  sizeBytes: number
  uploadedAt: Date
}

export interface ProuniApplicant {
  fullName: string
  /** 11 dígitos, sem pontuação. */
  cpf: string
  email: string
  phone: string
  dateOfBirth: Date
  institution: string
  courseName?: string
}

export interface ProuniTermsAcceptance {
  programTerms: boolean
  platformTerms: boolean
  version: string
  acceptedAt: Date
  ip?: string
  userAgent?: string
}

export interface ProuniGrant {
  discountType: ProuniDiscountType
  discountValue: number
  stackWithTier: boolean
  usage: ProuniGrantUsage
  expiresAt?: Date | null
  /** Pedido que reservou a concessão (liberada de volta se o pagamento falhar). */
  reservedOrderId?: string | null
  reservedAt?: Date | null
  usedAt?: Date | null
  usedOrderId?: string | null
  /** Por que a reserva foi desfeita (Pix vencido, cartão recusado, estorno). */
  releaseReason?: string | null
  approvedBy: string
  approvedByName: string
  approvedAt: Date
}

export interface ProuniRequest {
  _id?: string | ObjectId
  userId: string
  userName: string
  userEmail: string
  itemType: ProuniItemType
  itemId: string
  itemTitle: string
  program: ProuniProgram
  applicant: ProuniApplicant
  attachments: ProuniAttachment[]
  /** Marca que os arquivos foram apagados do Blob após a análise. */
  attachmentsPurgedAt?: Date | null
  attachmentsPurgedBy?: string | null
  terms: ProuniTermsAcceptance
  status: ProuniRequestStatus
  reviewNotes?: string
  reviewedBy?: string
  reviewedByName?: string
  reviewedAt?: Date
  grant?: ProuniGrant | null
  /** Só para correlacionar abuso; não é exibido em lugar nenhum. */
  requestIp?: string
  createdAt: Date
  updatedAt: Date
}

/* =================== OFERTA (benefício por produto) =================== */

export function isProuniBenefitLive(benefit: ProuniBenefit | null | undefined): benefit is ProuniBenefit {
  if (!benefit) return false
  if (benefit.isActive === false) return false
  return Number(benefit.discountValue || 0) > 0
}

export async function getProuniBenefit(
  db: Db,
  itemType: ProuniItemType,
  itemId: string
): Promise<ProuniBenefit | null> {
  if (!itemType || !itemId) return null
  const doc = await db.collection<ProuniBenefit>(PROUNI_BENEFITS_COLLECTION).findOne({
    itemType,
    itemId: String(itemId),
  })
  return doc || null
}

/** Só devolve a oferta se ela está de pé — usado por tudo que é público. */
export async function getLiveProuniBenefit(
  db: Db,
  itemType: ProuniItemType,
  itemId: string
): Promise<ProuniBenefit | null> {
  const benefit = await getProuniBenefit(db, itemType, itemId)
  return isProuniBenefitLive(benefit) ? benefit : null
}

export function serializeProuniBenefit(benefit: ProuniBenefit) {
  return {
    id: String(benefit._id || ''),
    itemType: benefit.itemType,
    itemId: benefit.itemId,
    itemTitle: benefit.itemTitle || '',
    discountType: benefit.discountType,
    discountValue: Number(benefit.discountValue || 0),
    discountLabel: getProuniDiscountLabel(benefit),
    stackWithTier: benefit.stackWithTier === true,
    allowedManualPlans: benefit.allowedManualPlans || [],
    grantValidityDays: benefit.grantValidityDays ?? null,
    instructions: benefit.instructions || '',
    isActive: benefit.isActive !== false,
    createdByName: benefit.createdByName || '',
    createdAt: toIso(benefit.createdAt),
    updatedAt: toIso(benefit.updatedAt),
  }
}

function toIso(value: Date | string | undefined | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/* =================== CONCESSÃO (desconto individual aprovado) =================== */

export function isProuniGrantUsable(request: ProuniRequest | null | undefined, now = new Date()): boolean {
  if (!request || request.status !== 'approved') return false
  const grant = request.grant
  if (!grant) return false
  if (grant.usage !== 'available' && grant.usage !== 'reserved') return false
  if (Number(grant.discountValue || 0) <= 0) return false
  if (grant.expiresAt) {
    const expiresAt = grant.expiresAt instanceof Date ? grant.expiresAt : new Date(grant.expiresAt)
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt <= now) return false
  }
  return true
}

/**
 * A concessão desta pessoa para este item, se existir e ainda valer.
 *
 * Chave dupla (`userId` + item) de propósito: o benefício é pessoal e
 * intransferível, então não há busca por código, por e-mail ou por qualquer
 * coisa que alguém possa digitar. Não existe entrada para "usar o desconto de
 * outra pessoa" — ela simplesmente não foi construída.
 */
export async function findUsableProuniGrant(
  db: Db,
  input: {
    userId: string
    itemType: ProuniItemType
    itemId: string
    manualPlanKey?: ManualClinicoPlanKey | string
    now?: Date
  }
): Promise<ProuniRequest | null> {
  if (!input.userId) return null
  const now = input.now || new Date()
  const request = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).findOne({
    userId: String(input.userId),
    itemType: input.itemType,
    itemId: String(input.itemId),
    status: 'approved',
    'grant.usage': { $in: ['available', 'reserved'] },
  } as any)

  if (!isProuniGrantUsable(request, now)) return null

  // Restrição por plano do Manual Clínico: o benefício aprovado para o plano
  // semestral não pode virar desconto no vitalício.
  if (input.itemType === 'manual_clinico') {
    const benefit = await getProuniBenefit(db, 'manual_clinico', String(input.itemId))
    const allowed = benefit?.allowedManualPlans || []
    if (allowed.length > 0) {
      const planKey = input.manualPlanKey as ManualClinicoPlanKey | undefined
      if (!planKey || !allowed.includes(planKey)) return null
    }
  }

  return request
}

/**
 * Prende a concessão ao pedido recém-criado.
 *
 * O `filter` repete as condições de uso: entre a leitura e esta escrita cabe um
 * segundo checkout da mesma conta em outra aba, e sem a repetição os dois
 * pedidos sairiam com o mesmo desconto de uso único.
 */
export async function reserveProuniGrant(
  db: Db,
  input: { requestId: string; userId: string; orderId: string }
): Promise<boolean> {
  if (!ObjectId.isValid(input.requestId)) return false
  const now = new Date()
  const result = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).updateOne(
    {
      _id: new ObjectId(input.requestId) as any,
      userId: String(input.userId),
      status: 'approved',
      'grant.usage': 'available',
    } as any,
    {
      $set: {
        'grant.usage': 'reserved',
        'grant.reservedOrderId': input.orderId,
        'grant.reservedAt': now,
        updatedAt: now,
      },
    } as any
  )
  return result.modifiedCount === 1
}

/**
 * Pagamento aprovado: a concessão foi gasta e não volta.
 *
 * `updateMany` porque um carrinho pode carregar o benefício de vários itens no
 * mesmo pedido — com `updateOne`, os demais voltariam para a pessoa como se
 * nunca tivessem sido usados.
 */
export async function consumeProuniGrant(db: Db, orderId?: string) {
  if (!orderId) return
  const now = new Date()
  await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).updateMany(
    { 'grant.reservedOrderId': orderId, 'grant.usage': 'reserved' } as any,
    {
      $set: {
        'grant.usage': 'used',
        'grant.usedAt': now,
        'grant.usedOrderId': orderId,
        updatedAt: now,
      },
    } as any
  )
}

/**
 * Pagamento falhou/estornou: devolve o benefício para a pessoa.
 *
 * Sem isso, um Pix que expirou consumiria em silêncio um desconto que a pessoa
 * levou dias de análise para conseguir — e a única saída seria abrir outra
 * solicitação e reenviar os documentos.
 */
export async function releaseProuniGrant(db: Db, orderId?: string, reason = 'payment_failed') {
  if (!orderId) return
  const now = new Date()
  await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).updateMany(
    { 'grant.reservedOrderId': orderId, 'grant.usage': { $in: ['reserved', 'used'] } } as any,
    {
      $set: {
        'grant.usage': 'available',
        'grant.reservedOrderId': null,
        'grant.reservedAt': null,
        'grant.usedAt': null,
        'grant.usedOrderId': null,
        'grant.releaseReason': reason,
        updatedAt: now,
      },
    } as any
  )
}

/**
 * Gasta a concessão sem passar por um pedido do provedor.
 *
 * É o caminho do item que ficou R$ 0 — seja porque era barato e o benefício
 * cobriu tudo, seja porque somou com o lote. Não existe pagamento para
 * confirmar depois, então o consumo é imediato: sem isso, o desconto ficaria
 * "disponível" para sempre em quem já levou o produto de graça.
 */
export async function spendProuniGrantNow(
  db: Db,
  input: { requestId: string; userId: string; reference?: string }
): Promise<boolean> {
  if (!ObjectId.isValid(input.requestId)) return false
  const now = new Date()
  const result = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).updateOne(
    {
      _id: new ObjectId(input.requestId) as any,
      userId: String(input.userId),
      status: 'approved',
      'grant.usage': 'available',
    } as any,
    {
      $set: {
        'grant.usage': 'used',
        'grant.usedAt': now,
        'grant.usedOrderId': input.reference || 'free',
        updatedAt: now,
      },
    } as any
  )
  return result.modifiedCount === 1
}

/**
 * O que o checkout precisa saber sobre o benefício desta pessoa neste item.
 *
 * Devolve `null` quando não há nada a aplicar — e é chamado com `userId` sempre
 * vindo da sessão, nunca do corpo da requisição.
 */
export async function resolveProuniForCheckout(
  db: Db,
  input: {
    userId?: string | null
    itemType: ProuniItemType
    itemId: string
    manualPlanKey?: ManualClinicoPlanKey | string
    now?: Date
  }
): Promise<{
  requestId: string
  discountType: ProuniDiscountType
  discountValue: number
  stackWithTier: boolean
  program: ProuniProgram
} | null> {
  if (!input.userId) return null
  const request = await findUsableProuniGrant(db, {
    userId: String(input.userId),
    itemType: input.itemType,
    itemId: String(input.itemId),
    manualPlanKey: input.manualPlanKey,
    now: input.now,
  })
  if (!request?.grant) return null
  return {
    requestId: String(request._id),
    discountType: request.grant.discountType,
    discountValue: Number(request.grant.discountValue || 0),
    stackWithTier: request.grant.stackWithTier === true,
    program: request.program,
  }
}

/**
 * Versão em lote de `resolveProuniForCheckout`, para o carrinho.
 *
 * Um carrinho leva até 30 itens, e resolver um por um seria uma ida ao banco
 * por item — trinta consultas para montar uma tela de preço, repetidas a cada
 * recálculo. Aqui é uma consulta só, e o filtro por `userId` continua vindo da
 * sessão: em lote ou não, ninguém alcança a concessão de outra pessoa.
 *
 * A chave do mapa é `"<itemType>:<itemId>"`.
 */
export async function resolveProuniForCart(
  db: Db,
  input: {
    userId?: string | null
    items: Array<{ itemType: ProuniItemType; itemId: string }>
    now?: Date
  }
): Promise<Map<string, {
  requestId: string
  discountType: ProuniDiscountType
  discountValue: number
  stackWithTier: boolean
  program: ProuniProgram
}>> {
  const mapa = new Map<string, any>()
  if (!input.userId || input.items.length === 0) return mapa

  const now = input.now || new Date()
  const solicitacoes = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).find({
    userId: String(input.userId),
    status: 'approved',
    'grant.usage': { $in: ['available', 'reserved'] },
    $or: input.items.map((item) => ({ itemType: item.itemType, itemId: String(item.itemId) })),
  } as any).limit(input.items.length).toArray()

  for (const solicitacao of solicitacoes) {
    if (!isProuniGrantUsable(solicitacao, now) || !solicitacao.grant) continue
    mapa.set(`${solicitacao.itemType}:${solicitacao.itemId}`, {
      requestId: String(solicitacao._id),
      discountType: solicitacao.grant.discountType,
      discountValue: Number(solicitacao.grant.discountValue || 0),
      stackWithTier: solicitacao.grant.stackWithTier === true,
      program: solicitacao.program,
    })
  }
  return mapa
}

/** Metadados do pedido — o que a auditoria precisa para reconstruir o preço. */
export function prouniAnalyticsMetadata(
  applied?: { requestId: string; program: ProuniProgram; discountAmount: number } | null
) {
  if (!applied) return {}
  return {
    prouniRequestId: applied.requestId,
    prouniProgram: applied.program,
    prouniDiscountAmount: applied.discountAmount,
  }
}

/* =================== SOLICITAÇÃO =================== */

export function serializeProuniRequestForUser(request: ProuniRequest) {
  return {
    id: String(request._id || ''),
    itemType: request.itemType,
    itemId: request.itemId,
    itemTitle: request.itemTitle || '',
    program: request.program,
    status: request.status,
    // O usuário vê quantos anexos mandou, nunca as URLs.
    attachmentCount: (request.attachments || []).length,
    reviewNotes: request.reviewNotes || '',
    createdAt: toIso(request.createdAt),
    reviewedAt: toIso(request.reviewedAt),
    grant: request.grant
      ? {
          // Tipo e valor saem porque a tela de checkout precisa MOSTRAR o preço
          // com desconto antes de cobrar. É o benefício da própria pessoa: o
          // que ela vê aqui é o que o servidor vai aplicar, e o servidor
          // continua recalculando tudo do zero na hora de cobrar.
          discountType: request.grant.discountType,
          discountValue: Number(request.grant.discountValue || 0),
          discountLabel: getProuniDiscountLabel(request.grant),
          stackWithTier: request.grant.stackWithTier === true,
          usage: request.grant.usage,
          expiresAt: toIso(request.grant.expiresAt || null),
        }
      : null,
  }
}

export function serializeProuniRequestForAdmin(request: ProuniRequest) {
  return {
    id: String(request._id || ''),
    userId: request.userId,
    userName: request.userName || '',
    userEmail: request.userEmail || '',
    itemType: request.itemType,
    itemId: request.itemId,
    itemTitle: request.itemTitle || '',
    program: request.program,
    programLabel: PROUNI_PROGRAM_LABELS[request.program] || request.program,
    applicant: {
      fullName: request.applicant?.fullName || '',
      cpf: request.applicant?.cpf || '',
      email: request.applicant?.email || '',
      phone: request.applicant?.phone || '',
      dateOfBirth: toIso(request.applicant?.dateOfBirth),
      institution: request.applicant?.institution || '',
      courseName: request.applicant?.courseName || '',
    },
    attachments: (request.attachments || []).map((file) => ({
      id: file.id,
      filename: file.filename,
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
      uploadedAt: toIso(file.uploadedAt),
    })),
    attachmentsPurgedAt: toIso(request.attachmentsPurgedAt || null),
    terms: {
      version: request.terms?.version || '',
      acceptedAt: toIso(request.terms?.acceptedAt),
    },
    status: request.status,
    reviewNotes: request.reviewNotes || '',
    reviewedByName: request.reviewedByName || '',
    reviewedAt: toIso(request.reviewedAt),
    grant: request.grant
      ? {
          discountType: request.grant.discountType,
          discountValue: Number(request.grant.discountValue || 0),
          discountLabel: getProuniDiscountLabel(request.grant),
          stackWithTier: request.grant.stackWithTier === true,
          usage: request.grant.usage,
          expiresAt: toIso(request.grant.expiresAt || null),
          approvedByName: request.grant.approvedByName || '',
          approvedAt: toIso(request.grant.approvedAt),
          usedAt: toIso(request.grant.usedAt || null),
        }
      : null,
    createdAt: toIso(request.createdAt),
    updatedAt: toIso(request.updatedAt),
  }
}

/**
 * Portões anti-enxurrada, verificados ANTES de aceitar uma solicitação.
 *
 * O rate limit por IP sozinho não resolve: quem quer entupir a fila de análise
 * troca de rede, e quem só está ansioso reenvia o mesmo pedido cinco vezes sem
 * nenhuma má intenção. As três regras abaixo miram os dois casos ao mesmo
 * tempo, e todas contam por CONTA, não por endereço.
 */
export async function assertProuniRequestAllowed(
  db: Db,
  input: { userId: string; itemType: ProuniItemType; itemId: string; now?: Date }
) {
  const now = input.now || new Date()
  const collection = db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION)

  const existing = await collection.findOne({
    userId: String(input.userId),
    itemType: input.itemType,
    itemId: String(input.itemId),
    status: { $in: ['pending', 'approved'] },
  } as any)

  if (existing?.status === 'pending') {
    throw new ProuniError('Você já tem uma solicitação em análise para este item.', 409)
  }
  if (existing?.status === 'approved' && isProuniGrantUsable(existing, now)) {
    throw new ProuniError('Seu desconto para este item já foi aprovado e está disponível no checkout.', 409)
  }

  // Recusa recente no mesmo item: a espera existe para que a segunda tentativa
  // venha com documento melhor, e não com o mesmo arquivo ilegível de novo.
  const lastRejected = await collection.findOne(
    {
      userId: String(input.userId),
      itemType: input.itemType,
      itemId: String(input.itemId),
      status: 'rejected',
    } as any,
    { sort: { reviewedAt: -1 } }
  )
  if (lastRejected?.reviewedAt) {
    const reviewedAt = lastRejected.reviewedAt instanceof Date
      ? lastRejected.reviewedAt
      : new Date(lastRejected.reviewedAt)
    const liberaEm = new Date(reviewedAt.getTime() + PROUNI_REJECTED_COOLDOWN_HOURS * 3_600_000)
    if (!Number.isNaN(liberaEm.getTime()) && liberaEm > now) {
      throw new ProuniError(
        `Sua solicitação anterior para este item foi recusada. Você poderá tentar de novo depois de ${liberaEm.toLocaleString('pt-BR')}.`,
        429
      )
    }
  }

  const [pendentes, ultimas24h] = await Promise.all([
    collection.countDocuments({ userId: String(input.userId), status: 'pending' } as any),
    collection.countDocuments({
      userId: String(input.userId),
      createdAt: { $gte: new Date(now.getTime() - 86_400_000) },
    } as any),
  ])

  if (pendentes >= PROUNI_MAX_PENDING_PER_USER) {
    throw new ProuniError(
      `Você já tem ${PROUNI_MAX_PENDING_PER_USER} solicitações em análise. Aguarde a resposta antes de enviar outra.`,
      429
    )
  }
  if (ultimas24h >= PROUNI_MAX_REQUESTS_PER_DAY) {
    throw new ProuniError('Limite diário de solicitações atingido. Tente novamente amanhã.', 429)
  }
}

/**
 * Índices da feature.
 *
 * O único ÚNICO é `(userId, itemType, itemId, status)` restrito a `pending`:
 * ele transforma "não pode haver duas solicitações abertas para o mesmo item"
 * numa garantia do banco, e não numa checagem que duas requisições simultâneas
 * conseguem furar. As demais só servem à listagem do admin e ao checkout.
 */
export async function ensureProuniIndexes(db: Db) {
  const requests = db.collection(PROUNI_REQUESTS_COLLECTION)
  const benefits = db.collection(PROUNI_BENEFITS_COLLECTION)
  await Promise.allSettled([
    benefits.createIndex({ itemType: 1, itemId: 1 }, { unique: true }),
    requests.createIndex(
      { userId: 1, itemType: 1, itemId: 1 },
      { unique: true, partialFilterExpression: { status: 'pending' } }
    ),
    requests.createIndex({ status: 1, createdAt: -1 }),
    requests.createIndex({ userId: 1, itemType: 1, itemId: 1, status: 1 }),
    requests.createIndex({ 'grant.reservedOrderId': 1 }),
  ])
}
