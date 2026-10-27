import { isIP } from 'net'
import type { PaymentOrderType } from './types'

/**
 * Dados de apoio ao antifraude do Mercado Pago no pagamento com cartão.
 *
 * `cc_rejected_high_risk` é o motor de risco do MP recusando a transação pelo
 * PERFIL, não o banco: o cartão pode estar perfeito. O que pesa contra é a
 * transação chegar "anônima" — sem IP do comprador, sem telefone, sem há
 * quanto tempo a conta existe, com um item genérico. Tudo aqui é o que a
 * "qualidade da integração" do Mercado Pago pede em `additional_info`.
 *
 * Nenhum destes campos é obrigatório: valor estranho é descartado e o
 * pagamento segue sem ele. Arquivo puro — testável sem SDK nem banco.
 */

/** Perfil do comprador logado, lido do cadastro (ver perfil-do-comprador.ts). */
export interface PerfilAntifraude {
  /** Telefone com DDD, como está no cadastro. */
  phone?: string
  /** Quando a conta foi criada — conta antiga pesa a favor. */
  registeredAt?: Date
}

/** Item do pedido para `additional_info.items`. */
export interface ItemAntifraude {
  id: string
  title: string
  quantity: number
  unitPrice: number
  categoryId?: string
}

/** Endereço de entrega (loja de impressos) para `additional_info.shipments`. */
export interface EnderecoDeEntrega {
  zipCode: string
  streetName: string
  streetNumber: string
  complement?: string
  city?: string
  federalUnit?: string
}

/**
 * IP público do comprador (`additional_info.ip_address`). Só um IP de verdade
 * passa: 'unknown', lista com vírgula ou lixo no header ficam de fora.
 */
export function ipDoComprador(ip: string | null | undefined): string | undefined {
  const limpo = String(ip || '').split(',')[0].trim()
  return limpo && isIP(limpo) ? limpo : undefined
}

/**
 * Telefone brasileiro no formato do MP (`{ area_code, number }`). Aceita com
 * ou sem +55, com máscara. Fora do padrão (DDD + 8 ou 9 dígitos) → descartado.
 */
export function telefoneParaMercadoPago(phone: string | null | undefined): { area_code: string; number: string } | undefined {
  let digitos = String(phone || '').replace(/\D/g, '')
  if (digitos.length >= 12 && digitos.startsWith('55')) digitos = digitos.slice(2)
  if (digitos.length === 11 || digitos.length === 12) digitos = digitos.replace(/^0/, '')
  if (digitos.length !== 10 && digitos.length !== 11) return undefined
  const ddd = digitos.slice(0, 2)
  if (!/^[1-9][1-9]$/.test(ddd)) return undefined
  return { area_code: ddd, number: digitos.slice(2) }
}

/**
 * Categoria do item (`category_id`) por tipo de pedido. "learnings" é a de
 * cursos e material de estudo — antes tudo ia como "services", que não diz ao
 * antifraude o que está sendo vendido.
 */
export function categoriaDoPedido(type: PaymentOrderType | string | undefined): string {
  switch (type) {
    case 'donation':
      return 'donations'
    case 'raffle':
      return 'others'
    default:
      return 'learnings'
  }
}

/**
 * `additional_info.items`. Os itens reais do pedido quando a soma bate com o
 * valor cobrado; a diferença POSITIVA (taxa do cartão, frete) entra como item
 * próprio. Sem itens, ou com desconto que não dá para repartir, um item só com
 * o total — o MP compara a soma dos itens com `transaction_amount`.
 */
export function itensParaMercadoPago(input: {
  referencia: string
  descricao: string
  valor: number
  categoria: string
  itens?: ItemAntifraude[]
}): Array<Record<string, any>> {
  const titulo = (s: string) => String(s || 'Compra').replace(/\s+/g, ' ').trim().slice(0, 250) || 'Compra'
  const unico = [
    {
      id: input.referencia,
      title: titulo(input.descricao),
      description: titulo(input.descricao),
      category_id: input.categoria,
      quantity: 1,
      unit_price: centavos(input.valor),
    },
  ]
  const validos = (input.itens || []).filter(
    it => it && Number.isFinite(it.unitPrice) && it.unitPrice > 0 && Number.isInteger(it.quantity) && it.quantity > 0
  )
  if (validos.length === 0 || validos.length > 50) return unico

  const linhas = validos.map(it => ({
    id: String(it.id || input.referencia).slice(0, 120),
    title: titulo(it.title),
    description: titulo(it.title),
    category_id: it.categoryId || input.categoria,
    quantity: it.quantity,
    unit_price: centavos(it.unitPrice),
  }))
  const soma = centavos(linhas.reduce((s, l) => s + l.unit_price * l.quantity, 0))
  const diferenca = centavos(input.valor - soma)
  if (diferenca < 0) return unico
  if (diferenca > 0) {
    linhas.push({
      id: `${input.referencia}-taxa`,
      title: 'Taxas e frete',
      description: 'Taxas e frete',
      category_id: input.categoria,
      quantity: 1,
      unit_price: diferenca,
    })
  }
  return linhas
}

/**
 * Modo do 3DS 2.0 (`three_d_secure_mode`). Com "optional", o motor de risco,
 * em vez de recusar como `cc_rejected_high_risk`, pode pedir que o comprador
 * confirme a compra no app/SMS do banco — e a compra é aprovada. É a
 * recomendação do próprio MP. `MERCADOPAGO_3DS_MODE=off` desliga.
 */
export function modoTresDS(): 'optional' | 'mandatory' | undefined {
  const v = String(process.env.MERCADOPAGO_3DS_MODE || 'optional').trim().toLowerCase()
  if (v === 'mandatory') return 'mandatory'
  if (v === 'off' || v === 'not_supported' || v === 'false' || v === '0') return undefined
  return 'optional'
}

/**
 * O MP rejeitou o campo do 3DS (conta sem 3DS habilitado, por exemplo)? Nesse
 * caso nenhum pagamento foi criado e dá para refazer a chamada sem ele.
 */
export function erroDoCampoTresDS(err: unknown): boolean {
  const e = err as any
  const status = Number(e?.status ?? e?.statusCode ?? e?.response?.status)
  if (Number.isFinite(status) && status >= 500) return false
  const raw = e?.cause ?? e?.response?.cause ?? e?.error?.cause
  const causas: any[] = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : []
  const textos = [e?.message, e?.error, ...causas.map(c => c?.description)].map(t => String(t || ''))
  return textos.some(t => /three_d_secure|3ds/i.test(t))
}

/** Desafio do 3DS que o comprador precisa concluir no banco. */
export interface DesafioTresDS {
  url: string
  creq: string
}

export function desafioTresDS(p: any): DesafioTresDS | undefined {
  const info = p?.three_ds_info
  const url = typeof info?.external_resource_url === 'string' ? info.external_resource_url : ''
  const creq = typeof info?.creq === 'string' ? info.creq : ''
  if (!url || !creq || !/^https:\/\//i.test(url)) return undefined
  if (p?.status !== 'pending' || p?.status_detail !== 'pending_challenge') return undefined
  return { url, creq }
}

function centavos(n: number): number {
  return Math.round(Number(n || 0) * 100) / 100
}
