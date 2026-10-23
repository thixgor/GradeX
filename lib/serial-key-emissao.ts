/**
 * Emissão de Serial Keys pelo administrador.
 *
 * Uma key emitida aqui é uma CORTESIA: não tem pagamento por trás, mas ativa
 * pelo mesmo fluxo universal de uma key de compra (`grant` + link de
 * ativação), então serve para tudo que o site vende — material, flashcards,
 * pacote, Manual Clínico e Plus+ —, inclusive com acesso por tempo.
 *
 * Quem pede só escolhe o produto; o que a key concede é montado aqui, a partir
 * do banco, e nunca do que o navegador mandou além dos ids.
 *
 * Usado por /admin/keys e pelo botão "Gerar serial key" de /admin/materiais.
 */

import { randomBytes } from 'crypto'
import { ObjectId, type Db } from 'mongodb'
import { isPlusAccount, normalizeAccountType, PLUS_LABEL } from './account-tier'
import {
  getManualClinicoConfig,
  getManualClinicoPlan,
  MANUAL_CLINICO_PLAN_KEYS,
} from './manual-clinico-product'
import {
  durationToApproxMinutes,
  formatDuration,
  getActiveTimedAccessVersions,
  hasDuration,
  normalizeDuration,
  type TimedAccessDuration,
} from './material-timed-access'
import {
  getActivationUrl,
  getAppUrl,
  insertAdminSerialKey,
  isValidEmail,
  productTypeLabel,
  sanitizeName,
} from './serial-keys'
import type { ManualClinicoPlanKey, SerialKey, SerialKeyGrant } from './types'

/** Teto por pedido: um lote para uma turma, não um gerador em massa. */
export const MAX_KEYS_POR_EMISSAO = 100

/** De onde o admin pediu — só para o registro (`source`) da key. */
export const ORIGENS_DE_EMISSAO = ['admin_keys', 'admin_materiais'] as const
export type OrigemDeEmissao = (typeof ORIGENS_DE_EMISSAO)[number]

/**
 * Versão de acesso por tempo criada na hora pelo admin. Todas as cortesias de
 * prazo personalizado de um item dividem este id: duas cortesias para a mesma
 * pessoa SOMAM o prazo (como uma renovação), e nenhuma delas sobrescreve uma
 * compra vitalícia, que mora em outra linha de `material_purchases`.
 */
export const VERSAO_CORTESIA_ID = 'cortesia-admin'

// ── Pedido ───────────────────────────────────────────────────────────────────

export type AcessoDeEmissao =
  | { modo: 'vitalicio' }
  | { modo: 'versao'; versionId: string }
  | { modo: 'personalizado'; duracao: TimedAccessDuration }

export type ProdutoDeEmissao =
  | { productType: 'material' | 'package'; itemId: string; acesso: AcessoDeEmissao }
  | { productType: 'manual_clinico'; planKey: ManualClinicoPlanKey }
  /** `duracao` ausente = a do plano; `{ meses: 0, dias: 0 }` = vitalício. */
  | { productType: 'plus'; planId: string; duracao?: { meses: number; dias: number } }

export interface PedidoDeEmissao {
  produto: ProdutoDeEmissao
  quantidade: number
  /** Só com quantidade 1 — um lote é para distribuir, não para uma pessoa. */
  destinatario?: { nome: string; email: string }
  enviarEmail: boolean
  restringirAoEmail: boolean
  nota?: string
  origem: OrigemDeEmissao
}

type Leitura<T> = { ok: true; valor: T } | { ok: false; erro: string }

function inteiro(v: unknown, min: number, max: number): number {
  const n = Math.floor(Number(v))
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function lerAcesso(raw: any): Leitura<AcessoDeEmissao> {
  const modo = String(raw?.modo || 'vitalicio')
  if (modo === 'vitalicio') return { ok: true, valor: { modo: 'vitalicio' } }
  if (modo === 'versao') {
    const versionId = String(raw?.versionId || '').trim()
    if (!versionId) return { ok: false, erro: 'Escolha a versão de acesso.' }
    return { ok: true, valor: { modo: 'versao', versionId } }
  }
  if (modo === 'personalizado') {
    const duracao = normalizeDuration(raw?.duracao)
    if (!hasDuration(duracao)) return { ok: false, erro: 'Informe a duração do acesso.' }
    return { ok: true, valor: { modo: 'personalizado', duracao } }
  }
  return { ok: false, erro: 'Modo de acesso inválido.' }
}

function lerProduto(raw: any): Leitura<ProdutoDeEmissao> {
  const productType = String(raw?.productType || '')

  if (productType === 'material' || productType === 'package' || productType === 'flashcard') {
    const itemId = String(raw?.itemId || '')
    if (!ObjectId.isValid(itemId)) return { ok: false, erro: 'Escolha o material ou pacote.' }
    const acesso = lerAcesso(raw?.acesso)
    if (!acesso.ok) return acesso
    return {
      ok: true,
      // Flashcard é um material: quem decide o rótulo é o item, no banco.
      valor: { productType: productType === 'package' ? 'package' : 'material', itemId, acesso: acesso.valor },
    }
  }

  if (productType === 'manual_clinico') {
    const planKey = String(raw?.planKey || 'vitalicio') as ManualClinicoPlanKey
    if (!MANUAL_CLINICO_PLAN_KEYS.includes(planKey)) return { ok: false, erro: 'Plano do Manual Clínico inválido.' }
    return { ok: true, valor: { productType: 'manual_clinico', planKey } }
  }

  if (productType === 'plus') {
    const planId = String(raw?.planId || '').trim()
    if (!planId) return { ok: false, erro: `Escolha o plano ${PLUS_LABEL}.` }
    const d = raw?.duracao
    const duracao = d && typeof d === 'object'
      ? { meses: inteiro(d.meses, 0, 120), dias: inteiro(d.dias, 0, 3650) }
      : undefined
    return { ok: true, valor: { productType: 'plus', planId, ...(duracao ? { duracao } : {}) } }
  }

  return { ok: false, erro: 'Tipo de produto inválido.' }
}

/** Valida o corpo do POST de emissão. Pura: não toca no banco. */
export function lerPedidoDeEmissao(body: unknown): Leitura<PedidoDeEmissao> {
  const raw = (body && typeof body === 'object' ? body : {}) as any
  const produto = lerProduto(raw.produto)
  if (!produto.ok) return produto

  const quantidade = inteiro(raw.quantidade ?? 1, 1, MAX_KEYS_POR_EMISSAO)

  const email = String(raw.destinatario?.email || '').trim().toLowerCase()
  const nome = sanitizeName(raw.destinatario?.nome || '')
  if (email && !isValidEmail(email)) return { ok: false, erro: 'E-mail do destinatário inválido.' }
  if (email && quantidade > 1) {
    return { ok: false, erro: 'Destinatário só vale para uma key. Para um lote, gere sem e-mail e distribua os links.' }
  }

  const enviarEmail = raw.enviarEmail === true
  const restringirAoEmail = raw.restringirAoEmail === true
  if ((enviarEmail || restringirAoEmail) && !email) {
    return { ok: false, erro: 'Informe o e-mail do destinatário.' }
  }

  const origem = (ORIGENS_DE_EMISSAO as readonly string[]).includes(raw.origem)
    ? (raw.origem as OrigemDeEmissao)
    : 'admin_keys'
  const nota = String(raw.nota || '').replace(/\s+/g, ' ').trim().slice(0, 280)

  return {
    ok: true,
    valor: {
      produto: produto.valor,
      quantidade,
      ...(email ? { destinatario: { nome, email } } : {}),
      enviarEmail,
      restringirAoEmail,
      ...(nota ? { nota } : {}),
      origem,
    },
  }
}

// ── O que a key concede ──────────────────────────────────────────────────────

export interface ConcessaoMontada {
  grant: SerialKeyGrant
  productTitle: string
  type: SerialKey['type']
}

/**
 * Monta a `grant` a partir do banco. Aceita itens gratuitos e planos
 * desligados no catálogo — é cortesia, o admin decide —, mas nunca um id que
 * não existe.
 */
export async function montarConcessao(db: Db, produto: ProdutoDeEmissao): Promise<ConcessaoMontada> {
  if (produto.productType === 'plus') {
    const settings = await db.collection('admin_settings').findOne({}, { projection: { planos: 1 } })
    const plano = ((settings?.planos || []) as any[]).find(
      (p) => String(p.tipo) === produto.planId && isPlusAccount(p.role)
    )
    if (!plano) throw new Error(`Plano ${PLUS_LABEL} não encontrado.`)
    const meses = produto.duracao ? produto.duracao.meses : Number(plano.durationMonths || 0)
    const dias = produto.duracao ? produto.duracao.dias : 0
    const grant: SerialKeyGrant = {
      productType: 'plus',
      role: normalizeAccountType(plano.role),
      planId: String(plano.tipo),
      durationMonths: meses,
      ...(dias > 0 ? { durationDays: dias } : {}),
    }
    return {
      grant,
      productTitle: `${plano.nome || `Assinatura ${PLUS_LABEL}`} — ${rotuloDaDuracaoDoPlano(meses, dias)}`,
      type: 'plus',
    }
  }

  if (produto.productType === 'manual_clinico') {
    const config = await getManualClinicoConfig(db)
    const plan = getManualClinicoPlan(config, produto.planKey)
    if (!plan || plan.key !== produto.planKey) throw new Error('Plano do Manual Clínico não encontrado.')
    return {
      grant: { productType: 'manual_clinico', manualClinicoPlanKey: plan.key },
      productTitle: `${config.label} — ${plan.label}`,
      type: 'custom',
    }
  }

  const itemType = produto.productType === 'package' ? 'package' : 'material'
  const item = await db
    .collection(itemType === 'package' ? 'material_packages' : 'materials')
    .findOne({ _id: new ObjectId(produto.itemId) })
  if (!item) throw new Error(itemType === 'package' ? 'Pacote não encontrado.' : 'Material não encontrado.')

  const title = String(item.title || (itemType === 'package' ? 'Pacote' : 'Material'))
  const isFlashcard =
    itemType === 'material' &&
    (Boolean(item.linkedDeckSlug) || item.type === 'flashcard_deck' || item.materialType === 'flashcard_deck')
  const productType = itemType === 'package' ? 'package' : isFlashcard ? 'flashcard' : 'material'

  const base: SerialKeyGrant = {
    productType,
    itemType,
    itemId: produto.itemId,
    itemTitle: title,
    ...(item.linkedDeckSlug ? { linkedDeckSlug: String(item.linkedDeckSlug) } : {}),
  }

  const { acesso } = produto
  if (acesso.modo === 'vitalicio') {
    return { grant: base, productTitle: title, type: 'custom' }
  }

  let versionId: string
  let versionLabel: string
  let duracao: TimedAccessDuration
  if (acesso.modo === 'versao') {
    const versao = getActiveTimedAccessVersions(item).find((v) => v.id === acesso.versionId)
    if (!versao) throw new Error('Essa versão de acesso não existe mais neste item.')
    versionId = versao.id
    versionLabel = versao.label
    duracao = normalizeDuration(versao)
  } else {
    duracao = acesso.duracao
    versionId = VERSAO_CORTESIA_ID
    versionLabel = `Cortesia — ${formatDuration(duracao)}`
  }

  return {
    grant: {
      ...base,
      accessMode: 'timed',
      accessVersionId: versionId,
      accessVersionLabel: versionLabel,
      accessDuration: duracao,
      accessDurationMinutes: durationToApproxMinutes(duracao),
    },
    productTitle: `${title} — ${versionLabel}`,
    type: 'custom',
  }
}

function rotuloDaDuracaoDoPlano(meses: number, dias: number): string {
  if (meses <= 0 && dias <= 0) return 'vitalício'
  const partes: string[] = []
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`)
  if (dias > 0) partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`)
  return partes.join(' e ')
}

// ── Emissão ──────────────────────────────────────────────────────────────────

export interface EmissorDaKey {
  userId: string
  name: string
}

/** Gera as keys do pedido. Um lote leva um `batchId` comum. */
export async function emitirSerialKeys(
  db: Db,
  pedido: PedidoDeEmissao,
  emissor: EmissorDaKey
): Promise<SerialKey[]> {
  const concessao = await montarConcessao(db, pedido.produto)
  const batchId = pedido.quantidade > 1 ? `lote-${randomBytes(6).toString('hex')}` : undefined

  const keys: SerialKey[] = []
  for (let i = 0; i < pedido.quantidade; i++) {
    keys.push(
      await insertAdminSerialKey(db, {
        type: concessao.type,
        grant: concessao.grant,
        productTitle: concessao.productTitle,
        generatedBy: emissor.userId,
        generatedByName: emissor.name || 'Administrador',
        source: pedido.origem,
        buyerName: pedido.destinatario?.nome,
        buyerEmail: pedido.destinatario?.email,
        restrictActivationToBuyerEmail: pedido.restringirAoEmail,
        batchId,
        adminNote: pedido.nota,
      })
    )
  }
  return keys
}

// ── Leitura para o painel ────────────────────────────────────────────────────

/**
 * Link que ativa a key. Keys com token abrem direto; as antigas, sem token,
 * caem na mesma página com a key preenchida — que também ativa.
 */
export function linkDeAtivacao(serial: Pick<SerialKey, 'key' | 'activationToken'>): string {
  return serial.activationToken
    ? getActivationUrl(serial.activationToken)
    : `${getAppUrl()}/ativar?key=${encodeURIComponent(serial.key)}`
}

/** "Vitalício", "Acesso 30 dias", "Plus+ por 7 dias", "Trial 7 dias"… */
export function rotuloDoAcesso(serial: SerialKey): string {
  const g = serial.grant
  if (!g) {
    // Keys antigas de /admin/keys: só tipo e duração fixos.
    if (serial.type === 'plus' || serial.type === 'premium') return `${PLUS_LABEL} vitalício`
    if (serial.type === 'trial') return serial.trialSubtype === 'teste' ? 'Trial de teste (2 min)' : 'Trial 7 dias'
    const d = serial.customDurationDays || 0
    const h = serial.customDurationHours || 0
    const m = serial.customDurationMinutes || 0
    return `Trial ${formatDuration({ years: 0, months: 0, days: d, hours: h, minutes: m })}`
  }
  if (g.productType === 'manual_clinico') return `Plano ${g.manualClinicoPlanKey || 'vitalicio'}`
  if (g.productType === 'plus' || g.productType === 'premium' || g.productType === 'essential') {
    return rotuloDaDuracaoDoPlano(g.durationMonths || 0, g.durationDays || 0)
  }
  if (g.accessMode === 'timed' && (g.accessDuration || g.accessDurationMinutes)) {
    const d = g.accessDuration ? normalizeDuration(g.accessDuration) : normalizeDuration({ minutes: g.accessDurationMinutes })
    return `Acesso por ${formatDuration(d)}`
  }
  return 'Vitalício'
}

export type EstadoDaKey = 'unactivated' | 'activated' | 'cancelled'

export function estadoDaKey(serial: SerialKey): EstadoDaKey {
  if (serial.status === 'cancelled') return 'cancelled'
  if (serial.status === 'activated' || serial.used) return 'activated'
  return 'unactivated'
}

/** Linha da lista de /admin/keys. */
export function serializarKeyParaAdmin(serial: SerialKey) {
  const legado = !serial.grant
  return {
    id: String(serial._id),
    key: serial.key,
    link: linkDeAtivacao(serial),
    origin: serial.origin || 'admin',
    legado,
    productType: legado ? null : serial.productType || serial.grant?.productType || null,
    productTypeLabel: legado ? 'Conta (antiga)' : productTypeLabel(serial.productType || serial.grant?.productType),
    productTitle: legado ? '' : serial.productTitle || serial.grant?.itemTitle || '',
    itemId: serial.grant?.itemId || null,
    acesso: rotuloDoAcesso(serial),
    estado: estadoDaKey(serial),
    amount: serial.amount || 0,
    destinatarioNome: serial.buyerName || '',
    destinatarioEmail: serial.buyerEmail || '',
    restritaAoEmail: serial.restrictActivationToBuyerEmail === true,
    geradaPor: serial.generatedByName || '',
    geradaEm: serial.generatedAt,
    ativadaPor: serial.activatedByEmail || serial.usedByName || '',
    ativadaEm: serial.activatedAt || serial.usedAt || null,
    canceladaEm: serial.cancelledAt || null,
    lote: serial.batchId || null,
    nota: serial.adminNote || '',
    source: serial.source || null,
    emailsEnviados: (serial.emailHistory || []).filter((e) => e.status === 'sent').length,
    ultimoEmail: (serial.emailHistory || []).slice(-1)[0] || null,
  }
}

export type KeyDoAdmin = ReturnType<typeof serializarKeyParaAdmin>

// ── Catálogo do formulário ───────────────────────────────────────────────────

/** Tudo que pode virar key, no formato que o formulário de emissão precisa. */
export async function catalogoDeEmissao(db: Db) {
  const projecao = { title: 1, price: 1, pricing: 1, type: 1, linkedDeckSlug: 1, timedAccessVersions: 1, isHidden: 1 }
  const [materiais, pacotes, settings, manual] = await Promise.all([
    db.collection('materials').find({}, { projection: projecao }).sort({ title: 1 }).toArray(),
    db.collection('material_packages').find({}, { projection: { ...projecao, materialIds: 1 } }).sort({ title: 1 }).toArray(),
    db.collection('admin_settings').findOne({}, { projection: { planos: 1 } }),
    getManualClinicoConfig(db),
  ])

  const item = (doc: any, kind: 'material' | 'package') => ({
    id: String(doc._id),
    kind,
    title: String(doc.title || (kind === 'package' ? 'Pacote' : 'Material')),
    price: doc.pricing === 'free' ? 0 : Number(doc.price || 0),
    oculto: doc.isHidden === true,
    flashcard: kind === 'material' && (Boolean(doc.linkedDeckSlug) || doc.type === 'flashcard_deck'),
    ...(kind === 'package' ? { totalMateriais: Array.isArray(doc.materialIds) ? doc.materialIds.length : 0 } : {}),
    versoes: getActiveTimedAccessVersions(doc).map((v) => ({
      id: v.id,
      label: v.label,
      duracao: formatDuration(normalizeDuration(v)),
    })),
  })

  return {
    materiais: materiais.map((m) => item(m, 'material')),
    pacotes: pacotes.map((p) => item(p, 'package')),
    manualClinico: {
      label: manual.label,
      planos: (manual.plans || []).map((p) => ({
        key: p.key,
        label: p.label,
        duracao: p.durationMonths ? `${p.durationMonths} meses` : 'vitalício',
        ativo: p.enabled,
      })),
    },
    planosPlus: ((settings?.planos || []) as any[])
      .filter((p) => isPlusAccount(p.role))
      .map((p) => ({
        id: String(p.tipo),
        nome: String(p.nome || `Assinatura ${PLUS_LABEL}`),
        periodo: String(p.periodo || ''),
        durationMonths: Number(p.durationMonths || 0),
        oculto: p.oculto === true,
      })),
  }
}

export type CatalogoDeEmissao = Awaited<ReturnType<typeof catalogoDeEmissao>>
