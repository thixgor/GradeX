/**
 * Oferta exclusiva: um carrinho que o admin monta para UMA pessoa, com um
 * cupom só dela (ou um cupom existente), entregue por e-mail e pelo sino.
 *
 * A oferta não é um checkout paralelo. A página `/oferta/[id]` mostra os itens
 * com o preço que essa pessoa pagaria hoje e, no botão de compra, põe os itens
 * no carrinho normal e abre `/materiais/checkout?cart=1&coupon=…` — que aplica
 * o cupom sozinho. Preço, lote, ProUni e cupom continuam sendo decididos pelo
 * mesmo checkout de sempre; aqui só se monta a vitrine.
 *
 * O cupom criado pela oferta é de escopo `specific` (só os itens da oferta),
 * preso à conta da pessoa (`allowedUserIds`/`allowedUserEmails`) e pode ter
 * limite de usos e prazo — quando esgota ou vence, a oferta continua de pé,
 * só que pelo preço cheio, e a página diz isso.
 */

import { Db, ObjectId } from 'mongodb'
import { randomBytes } from 'crypto'
import {
  CouponError,
  getCouponLabel,
  isCouponExpired,
  isCouponUsageExhausted,
  normalizeCouponCode,
  roundMoney,
  validateCouponForCheckout,
  type Coupon,
} from './coupons'
import { resolveMaterialCart, type MaterialCartSkippedItem } from './material-cart'

export const OFERTAS_COLLECTION = 'ofertas_exclusivas'
export const MAX_ITENS_DA_OFERTA = 20
export const OFERTA_TITULO_MAX = 80
export const OFERTA_MENSAGEM_MAX = 600
export const OFERTA_TITULO_PADRAO = 'Uma oferta só para você'

export interface ItemDaOferta {
  itemType: 'material' | 'package'
  itemId: string
  titulo: string
}

export interface OfertaExclusiva {
  _id?: ObjectId
  userId: string
  userName: string
  userEmail: string
  titulo: string
  mensagem?: string
  itens: ItemDaOferta[]
  couponId?: string | null
  couponCode?: string | null
  /** O cupom nasceu com a oferta (e morre com ela, se for cancelada). */
  cupomCriadoPelaOferta?: boolean
  status: 'ativa' | 'cancelada'
  abertaEm?: Date | null
  emailEnviadoEm?: Date | null
  emailErro?: string | null
  canceladaEm?: Date | null
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export type EstadoDoCupom = 'ativo' | 'esgotado' | 'expirado' | 'inativo' | 'indisponivel'

export interface CupomDaVitrine {
  codigo: string
  rotulo: string
  estado: EstadoDoCupom
  /** Por que o cupom não vale agora (só quando `estado !== 'ativo'`). */
  motivo?: string
  validoAte: string | null
  usosRestantes: number | null
}

export interface ItemDaVitrine {
  itemType: 'material' | 'package'
  itemId: string
  titulo: string
  materialType?: string
  preco: number
  precoFinal: number
}

export interface VitrineDaOferta {
  itens: ItemDaVitrine[]
  /** Itens que já não entram na compra (já possui, incluso no Plus+, sumiu). */
  foraDaCompra: { itemType: 'material' | 'package'; itemId: string; titulo: string; motivo: string }[]
  subtotal: number
  desconto: number
  total: number
  cupom: CupomDaVitrine | null
}

const MOTIVO_FORA: Partial<Record<MaterialCartSkippedItem['reason'], string>> = {
  already_owned: 'Você já tem este item',
  plus_claimable: 'Incluso na sua assinatura Plus+ — resgate sem custo',
  included_in_cart_package: 'Já vem dentro de um pacote desta oferta',
  not_found: 'Item indisponível',
}

/** Código legível e difícil de adivinhar: OFERTA-7K2M9Q. */
export function gerarCodigoDaOferta(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(6)
  let sufixo = ''
  for (const byte of bytes) sufixo += alfabeto[byte % alfabeto.length]
  return `OFERTA-${sufixo}`
}

function dataIso(valor?: Date | string | null) {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data.toISOString()
}

/** Estado do cupom pelas regras que barram o resgate — mesma ordem do checkout. */
export function estadoDoCupom(cupom: Coupon, agora = new Date()): EstadoDoCupom {
  if (!cupom.isActive) return 'inativo'
  if (isCouponExpired(cupom, agora)) return 'expirado'
  if (isCouponUsageExhausted(cupom)) return 'esgotado'
  return 'ativo'
}

const MOTIVO_DO_ESTADO: Record<Exclude<EstadoDoCupom, 'ativo' | 'indisponivel'>, string> = {
  inativo: 'O cupom desta oferta foi desativado.',
  expirado: 'O prazo do cupom desta oferta terminou.',
  esgotado: 'O cupom desta oferta esgotou.',
}

export function usosRestantes(cupom: Pick<Coupon, 'usageLimit' | 'usageCount'>): number | null {
  if (typeof cupom.usageLimit !== 'number' || cupom.usageLimit <= 0) return null
  return Math.max(0, cupom.usageLimit - Number(cupom.usageCount || 0))
}

/**
 * Monta o que a pessoa vê: itens com preço de hoje para ela e o cupom aplicado
 * quando ele ainda vale. A validação do cupom é a do checkout
 * (`validateCouponForCheckout`), então a vitrine não promete desconto que o
 * pagamento recusaria.
 */
export async function montarVitrine(
  db: Db,
  oferta: Pick<OfertaExclusiva, 'userId' | 'userEmail' | 'itens' | 'couponId' | 'couponCode'>,
  agora = new Date()
): Promise<VitrineDaOferta> {
  const [resolucao, cupom] = await Promise.all([
    resolveMaterialCart(
      db,
      { userId: oferta.userId, email: oferta.userEmail, role: 'user' },
      oferta.itens.map((item) => ({ itemType: item.itemType, itemId: item.itemId }))
    ),
    oferta.couponId && ObjectId.isValid(oferta.couponId)
      ? db.collection<Coupon>('coupons').findOne({ _id: new ObjectId(oferta.couponId) as any })
      : Promise.resolve(null),
  ])

  const tituloSalvo = new Map(oferta.itens.map((item) => [`${item.itemType}:${item.itemId}`, item.titulo]))
  const foraDaCompra = resolucao.skippedItems
    .filter((item) => item.reason !== 'duplicate' && item.reason !== 'invalid')
    .map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      titulo: item.itemTitle || tituloSalvo.get(`${item.itemType}:${item.itemId}`) || 'Item',
      motivo: MOTIVO_FORA[item.reason] || 'Fora desta compra',
    }))

  const itens: ItemDaVitrine[] = resolucao.items.map((item) => ({
    itemType: item.itemType,
    itemId: item.itemId,
    titulo: item.itemTitle,
    materialType: item.materialType,
    preco: roundMoney(item.price),
    precoFinal: roundMoney(item.price),
  }))
  const subtotal = roundMoney(itens.reduce((soma, item) => soma + item.preco, 0))

  let cupomDaVitrine: CupomDaVitrine | null = null
  let desconto = 0
  if (cupom) {
    const estado = estadoDoCupom(cupom, agora)
    cupomDaVitrine = {
      codigo: cupom.codeNormalized,
      rotulo: getCouponLabel(cupom),
      estado,
      validoAte: dataIso(cupom.expiresAt),
      usosRestantes: usosRestantes(cupom),
    }
    if (estado !== 'ativo') {
      cupomDaVitrine.motivo = MOTIVO_DO_ESTADO[estado as keyof typeof MOTIVO_DO_ESTADO]
    } else if (subtotal > 0) {
      try {
        const validacao = await validateCouponForCheckout(db, {
          code: cupom.codeNormalized,
          amountBeforeCoupon: subtotal,
          userId: oferta.userId,
          userEmail: oferta.userEmail,
          now: agora,
          items: resolucao.payableItems.map((item) => ({
            itemType: item.itemType,
            itemId: item.itemId,
            itemTitle: item.itemTitle,
            materialType: item.materialType,
            price: item.price,
          })),
        })
        desconto = validacao.discountAmount
        const porItem = new Map(validacao.items.map((item) => [`${item.itemType}:${item.itemId}`, item.amountAfterDiscount]))
        for (const item of itens) {
          const final = porItem.get(`${item.itemType}:${item.itemId}`)
          if (typeof final === 'number') item.precoFinal = roundMoney(final)
        }
      } catch (erro) {
        if (!(erro instanceof CouponError)) throw erro
        cupomDaVitrine.estado = 'indisponivel'
        cupomDaVitrine.motivo = erro.message
      }
    }
  }

  return {
    itens,
    foraDaCompra,
    subtotal,
    desconto: roundMoney(desconto),
    total: roundMoney(subtotal - desconto),
    cupom: cupomDaVitrine,
  }
}

export interface NovoCupomDaOferta {
  codigo?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  usageLimit: number | null
  expiresAt: Date | null
  /** Empilha com o lote vigente (cupom sobre o preço do lote). */
  stackWithTier?: boolean
}

/**
 * Cria o cupom de uma pessoa só para a oferta. Sem código digitado, gera um
 * (e tenta outro se, por azar, já existir).
 */
export async function criarCupomDaOferta(
  db: Db,
  input: {
    novo: NovoCupomDaOferta
    itens: ItemDaOferta[]
    userId: string
    userEmail: string
    userName: string
    ofertaId: string
    admin: { userId: string; name: string }
    agora: Date
  }
): Promise<Coupon & { _id: ObjectId }> {
  const digitado = normalizeCouponCode(input.novo.codigo || '')
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = digitado || gerarCodigoDaOferta()
    const cupom: Coupon = {
      code: codigo,
      codeNormalized: codigo,
      description: `Oferta exclusiva para ${input.userName || input.userEmail}`.slice(0, 140),
      discountType: input.novo.discountType,
      discountValue: input.novo.discountType === 'percentage'
        ? Math.min(100, Number(input.novo.discountValue))
        : Number(input.novo.discountValue),
      scope: 'specific',
      productRefs: input.itens.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        title: item.titulo,
        kind: item.itemType === 'package' ? 'package' : 'material',
      })),
      usageLimit: input.novo.usageLimit,
      perUserLimit: null,
      minimumCartAmount: null,
      firstPurchaseOnly: false,
      allowedAfyaUnits: [],
      allowedManualPlans: null,
      allowedUserIds: [input.userId],
      allowedUserEmails: input.userEmail ? [input.userEmail.trim().toLowerCase()] : [],
      ofertaId: input.ofertaId,
      stackWithTier: input.novo.stackWithTier === true,
      promo: null,
      usageCount: 0,
      expiresAt: input.novo.expiresAt,
      durationValue: null,
      durationUnit: null,
      isActive: true,
      createdBy: input.admin.userId,
      createdByName: input.admin.name,
      createdAt: input.agora,
      updatedAt: input.agora,
    }
    try {
      const inserido = await db.collection<Coupon>('coupons').insertOne(cupom as any)
      return { ...cupom, _id: inserido.insertedId as ObjectId }
    } catch (erro: any) {
      if (erro?.code !== 11000) throw erro
      if (digitado) throw new CouponError('Já existe um cupom com esse código.', 409)
    }
  }
  throw new CouponError('Não foi possível gerar um código livre. Tente de novo.', 500)
}

export type SituacaoDaOferta = 'cancelada' | 'comprada' | 'parcial' | 'aberta' | 'enviada'

/**
 * Situação para o painel. "Comprada" é olhar se a pessoa tem hoje os itens —
 * a oferta não se pendura no webhook de pagamento.
 */
export function situacaoDaOferta(
  oferta: Pick<OfertaExclusiva, 'status' | 'abertaEm' | 'itens'>,
  possuidos: Set<string>
): SituacaoDaOferta {
  if (oferta.status === 'cancelada') return 'cancelada'
  const total = oferta.itens.length
  const tem = oferta.itens.filter((item) => possuidos.has(`${item.itemType}:${item.itemId}`)).length
  if (total > 0 && tem === total) return 'comprada'
  if (tem > 0) return 'parcial'
  return oferta.abertaEm ? 'aberta' : 'enviada'
}

/** Itens (das ofertas dadas) que cada pessoa tem por compra direta concluída. */
export async function itensPossuidosPorPessoa(
  db: Db,
  ofertas: Pick<OfertaExclusiva, 'userId' | 'itens'>[]
): Promise<Map<string, Set<string>>> {
  const userIds = [...new Set(ofertas.map((o) => o.userId))]
  const itemIds = [...new Set(ofertas.flatMap((o) => o.itens.map((i) => i.itemId)))]
  const porPessoa = new Map<string, Set<string>>()
  if (userIds.length === 0 || itemIds.length === 0) return porPessoa

  const compras = await db
    .collection('material_purchases')
    .find({ userId: { $in: userIds }, itemId: { $in: itemIds }, status: 'completed' })
    .project({ userId: 1, itemType: 1, itemId: 1 })
    .toArray()
  for (const compra of compras as any[]) {
    const chave = String(compra.userId)
    if (!porPessoa.has(chave)) porPessoa.set(chave, new Set())
    porPessoa.get(chave)!.add(`${compra.itemType}:${compra.itemId}`)
  }
  return porPessoa
}
