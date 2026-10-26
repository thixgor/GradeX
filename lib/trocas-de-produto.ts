/**
 * Troca de produto feita pelo admin: a pessoa tem um material (ou pacote) e
 * passa a ter outro no lugar.
 *
 * O acesso mora em `material_purchases`, então a troca é: a compra antiga sai
 * de `completed` para `swapped` (o acesso some) e nasce uma compra nova do item
 * novo, carregando o que a antiga tinha de dinheiro e de prazo — valor pago,
 * pedido de origem e, se houver, a janela de acesso por tempo. Os dois
 * registros apontam um para o outro, e a troca fica registrada em
 * `trocas_de_produto`.
 *
 * Por que não editar o item da compra antiga no lugar: o pedido de origem
 * continua apontando para o item antigo (`refId`), e é por ele que o estorno e
 * os relatórios encontram a venda. Com dois registros ligados, o histórico diz
 * o que foi comprado e o que a pessoa tem hoje.
 */

import { Db, ObjectId } from 'mongodb'
import type { MaterialPurchase } from './types'

export const TROCAS_COLLECTION = 'trocas_de_produto'

export type ItemTrocavel = 'material' | 'package'

/** Como o novo item se compara ao antigo, pelo preço de catálogo. */
export type RelacaoDePreco = 'mais_caro' | 'mais_barato' | 'mesmo_preco'

/**
 * O que acontece com a diferença de preço. Só faz sentido quando há diferença
 * — e define a frase que a pessoa lê no e-mail.
 *
 *  - `cortesia`: o novo é mais caro e a diferença fica por conta da casa.
 *  - `diferenca_paga`: o novo é mais caro e a diferença já foi paga/combinada.
 *  - `sem_reembolso`: o novo é mais barato e o valor pago não muda.
 *  - `reembolso_combinado`: o novo é mais barato e a devolução foi combinada.
 */
export type TratamentoDaDiferenca = 'cortesia' | 'diferenca_paga' | 'sem_reembolso' | 'reembolso_combinado'

export const TRATAMENTOS_POR_RELACAO: Record<RelacaoDePreco, TratamentoDaDiferenca[]> = {
  mais_caro: ['cortesia', 'diferenca_paga'],
  mais_barato: ['sem_reembolso', 'reembolso_combinado'],
  mesmo_preco: [],
}

export const ROTULO_DO_TRATAMENTO: Record<TratamentoDaDiferenca, string> = {
  cortesia: 'Sem custo para o aluno (upgrade de cortesia)',
  diferenca_paga: 'Diferença já paga ou combinada à parte',
  sem_reembolso: 'Sem devolução da diferença',
  reembolso_combinado: 'Devolução da diferença combinada à parte',
}

export interface ComparacaoDeTroca {
  /** Preço de catálogo do item que a pessoa tinha. */
  precoAntigo: number
  /** Preço de catálogo do item que ela passa a ter. */
  precoNovo: number
  /** Quanto ela pagou na compra original (0 em concessão do admin). */
  valorPago: number
  /** precoNovo − precoAntigo. Positivo = o novo é mais caro. */
  diferenca: number
  relacao: RelacaoDePreco
}

function centavos(valor: number) {
  return Math.round(Number(valor || 0) * 100) / 100
}

/** Preço de catálogo: item grátis vale 0, seja qual for o `price` gravado. */
export function precoDeCatalogo(item: { pricing?: string; price?: number } | null | undefined): number {
  if (!item || item.pricing !== 'paid') return 0
  return Math.max(0, centavos(Number(item.price || 0)))
}

export function compararPrecos(input: { precoAntigo: number; precoNovo: number; valorPago: number }): ComparacaoDeTroca {
  const precoAntigo = Math.max(0, centavos(input.precoAntigo))
  const precoNovo = Math.max(0, centavos(input.precoNovo))
  const diferenca = centavos(precoNovo - precoAntigo)
  const relacao: RelacaoDePreco = diferenca > 0 ? 'mais_caro' : diferenca < 0 ? 'mais_barato' : 'mesmo_preco'
  return {
    precoAntigo,
    precoNovo,
    valorPago: Math.max(0, centavos(input.valorPago)),
    diferenca,
    relacao,
  }
}

/**
 * O tratamento escolhido serve para esta relação de preço? Sem diferença, não
 * há o que tratar; com diferença, vale o primeiro da lista quando nada (ou algo
 * incompatível) foi escolhido.
 */
export function normalizarTratamento(
  relacao: RelacaoDePreco,
  escolhido?: string | null
): TratamentoDaDiferenca | null {
  const permitidos = TRATAMENTOS_POR_RELACAO[relacao]
  if (permitidos.length === 0) return null
  return permitidos.includes(escolhido as TratamentoDaDiferenca)
    ? (escolhido as TratamentoDaDiferenca)
    : permitidos[0]
}

function formatarReais(valor: number) {
  return `R$ ${Math.abs(centavos(valor)).toFixed(2).replace('.', ',')}`
}

/** Frase do e-mail sobre o preço. Nunca promete o que o admin não escolheu. */
export function fraseDaDiferenca(comparacao: ComparacaoDeTroca, tratamento: TratamentoDaDiferenca | null): string {
  const valor = formatarReais(comparacao.diferenca)
  if (comparacao.relacao === 'mesmo_preco') {
    return 'Os dois produtos têm o mesmo valor, então nada muda no que você pagou.'
  }
  if (comparacao.relacao === 'mais_caro') {
    return tratamento === 'diferenca_paga'
      ? `O novo produto custa ${valor} a mais que o anterior; essa diferença já foi acertada com a nossa equipe.`
      : `O novo produto custa ${valor} a mais que o anterior, e essa diferença fica por nossa conta: você não paga nada a mais.`
  }
  return tratamento === 'reembolso_combinado'
    ? `O novo produto custa ${valor} a menos que o anterior; a devolução dessa diferença segue o que foi combinado com a nossa equipe.`
    : `O novo produto custa ${valor} a menos que o anterior. O valor que você pagou não muda.`
}

/** Campos da compra antiga que acompanham o acesso para o item novo. */
const CAMPOS_QUE_ACOMPANHAM = [
  'userId',
  'userName',
  'userEmail',
  'price',
  'provider',
  'providerOrderId',
  'providerPaymentId',
  'purchasedAt',
  // Acesso por tempo: a janela é da compra, não do item. O id da versão fica
  // para trás porque pertence ao catálogo do item antigo.
  'accessMode',
  'accessVersionLabel',
  'accessDuration',
  'accessDurationMinutes',
  'accessStartsAt',
  'accessExpiresAt',
  'downloadDisabled',
] as const

export function montarCompraDaTroca(
  antiga: Partial<MaterialPurchase> & { _id?: any },
  novo: { itemType: ItemTrocavel; itemId: string; itemTitle: string },
  admin: { userId: string; name: string },
  agora: Date
): Omit<MaterialPurchase, '_id'> {
  const herdado: Record<string, unknown> = {}
  for (const campo of CAMPOS_QUE_ACOMPANHAM) {
    if (antiga[campo] !== undefined && antiga[campo] !== null) herdado[campo] = antiga[campo]
  }
  return {
    ...(herdado as Partial<MaterialPurchase>),
    userId: String(antiga.userId || ''),
    userName: antiga.userName || '',
    userEmail: antiga.userEmail || '',
    price: Number(antiga.price || 0),
    purchasedAt: antiga.purchasedAt || agora,
    itemType: novo.itemType,
    itemId: novo.itemId,
    itemTitle: novo.itemTitle,
    status: 'completed',
    source: 'swap',
    swappedFromPurchaseId: String(antiga._id),
    swappedFromItem: {
      itemType: antiga.itemType as ItemTrocavel,
      itemId: String(antiga.itemId || ''),
      itemTitle: antiga.itemTitle || '',
    },
    swappedAt: agora,
    swappedBy: admin.userId,
    swappedByName: admin.name,
  }
}

export interface RegistroDeTroca {
  _id?: ObjectId
  userId: string
  userName: string
  userEmail: string
  compraAntigaId: string
  compraNovaId: string
  de: { itemType: ItemTrocavel; itemId: string; itemTitle: string }
  para: { itemType: ItemTrocavel; itemId: string; itemTitle: string }
  comparacao: ComparacaoDeTroca
  tratamento: TratamentoDaDiferenca | null
  observacao?: string
  emailEnviado: boolean
  emailErro?: string
  adminId: string
  adminName: string
  criadoEm: Date
}

/**
 * A pessoa já tem o item novo por outro caminho (compra direta, ou um pacote
 * que o contém)? A compra que está sendo trocada não conta: trocar um pacote
 * por um dos materiais dele é permitido.
 */
export async function jaPossuiFora(
  db: Db,
  input: { userId: string; ignorarCompraId: string; itemType: ItemTrocavel; itemId: string }
): Promise<boolean> {
  const compras = await db
    .collection('material_purchases')
    .find({
      userId: input.userId,
      status: 'completed',
      itemType: { $in: ['material', 'package'] },
      _id: { $ne: new ObjectId(input.ignorarCompraId) },
    })
    .project({ itemType: 1, itemId: 1 })
    .toArray()

  if (compras.some((c: any) => c.itemType === input.itemType && String(c.itemId) === input.itemId)) return true
  if (input.itemType !== 'material') return false

  const pacotes = compras
    .filter((c: any) => c.itemType === 'package' && ObjectId.isValid(String(c.itemId)))
    .map((c: any) => new ObjectId(String(c.itemId)))
  if (pacotes.length === 0) return false
  const contem = await db
    .collection('material_packages')
    .findOne({ _id: { $in: pacotes }, materialIds: input.itemId }, { projection: { _id: 1 } })
  return Boolean(contem)
}
