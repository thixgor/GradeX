'use client'

import { useEffect, useState } from 'react'
import type { ProuniDiscountType, ProuniItemType } from '@/lib/prouni-shared'

/**
 * O desconto PROUNI/FIES desta conta neste item, para a TELA.
 *
 * O servidor sempre aplicou a concessão na hora de cobrar — quem não sabia
 * dela era a interface. O resultado era o pior tipo de silêncio numa página de
 * pagamento: quem passou dias esperando a análise abria o checkout e via o
 * preço cheio, indistinguível de o benefício ter sumido. Cada tela resolvia (ou
 * não) isso do seu jeito; aqui a pergunta é feita uma vez só, no mesmo formato
 * que `combineDiscountsWithProuni` espera receber.
 *
 * O que sai daqui NÃO é preço, é insumo de conta. Quem cobra continua sendo o
 * servidor, que recalcula tudo do zero e ignora qualquer número vindo do
 * navegador — esta é a mesma aritmética, só que a tempo de a pessoa ver.
 */

export interface ProuniConcessaoNaTela {
  discountType: ProuniDiscountType
  discountValue: number
  stackWithTier: boolean
  discountLabel: string
  /** `null` quando a concessão não tem prazo. */
  expiresAt: string | null
}

export interface ProuniBeneficioNaTela {
  discountLabel: string
  stackWithTier: boolean
  instructions: string
  /** Vazio = a oferta vale para todos os planos do Manual Clínico. */
  allowedManualPlans: string[]
}

export interface UseProuniGrantResult {
  /** A oferta do produto, quando o admin configurou uma e ela está ativa. */
  beneficio: ProuniBeneficioNaTela | null
  /** A concessão desta conta, já filtrada pelo que o servidor aceitaria. */
  concessao: ProuniConcessaoNaTela | null
  carregando: boolean
}

/**
 * @param manualPlanKey plano escolhido do Manual Clínico. A oferta pode
 * restringir os planos alcançados, e a mesma restrição roda no servidor
 * (`findUsableProuniGrant`): sem ela aqui, a tela do vitalício anunciaria um
 * desconto aprovado para o semestral que a cobrança não daria.
 */
export function useProuniGrant(
  itemType: ProuniItemType | null | undefined,
  itemId: string | null | undefined,
  manualPlanKey?: string | null
): UseProuniGrantResult {
  const [beneficio, setBeneficio] = useState<ProuniBeneficioNaTela | null>(null)
  const [concessao, setConcessao] = useState<ProuniConcessaoNaTela | null>(null)
  const [carregando, setCarregando] = useState(Boolean(itemType && itemId))

  useEffect(() => {
    if (!itemType || !itemId) {
      setBeneficio(null)
      setConcessao(null)
      setCarregando(false)
      return
    }

    let ativo = true
    setCarregando(true)
    fetch(
      `/api/prouni/beneficio?itemType=${encodeURIComponent(itemType)}&itemId=${encodeURIComponent(itemId)}`,
      { cache: 'no-store' }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!ativo) return
        setBeneficio(
          json?.benefit
            ? {
                discountLabel: String(json.benefit.discountLabel || ''),
                stackWithTier: json.benefit.stackWithTier === true,
                instructions: String(json.benefit.instructions || ''),
                allowedManualPlans: Array.isArray(json.benefit.allowedManualPlans)
                  ? json.benefit.allowedManualPlans.map(String)
                  : [],
              }
            : null
        )
        setConcessao(extrairConcessao(json))
      })
      // Silêncio proposital: isto decora uma tela de compra. Se a rota piscar,
      // o produto continua à venda pelo preço cheio, que é o pior caso honesto.
      .catch(() => {})
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [itemType, itemId])

  // A restrição de plano vem da oferta, mas o plano escolhido muda sem refazer
  // a busca — por isso ela é aplicada na leitura, e não dentro do efeito.
  const permitidos = beneficio?.allowedManualPlans || []
  const barradoPeloPlano =
    itemType === 'manual_clinico' &&
    permitidos.length > 0 &&
    (!manualPlanKey || !permitidos.includes(manualPlanKey))

  return { beneficio, concessao: barradoPeloPlano ? null : concessao, carregando }
}

/**
 * A concessão só entra na conta se o servidor também a aceitaria: aprovada,
 * ainda não gasta e dentro do prazo. Anunciar uma concessão já usada seria
 * prometer um preço que a cobrança não honraria.
 */
function extrairConcessao(json: any): ProuniConcessaoNaTela | null {
  const pedido = json?.request
  if (!pedido || pedido.status !== 'approved') return null

  const grant = pedido.grant
  if (!grant) return null
  if (grant.usage !== 'available' && grant.usage !== 'reserved') return null
  if (!(Number(grant.discountValue) > 0)) return null

  if (grant.expiresAt) {
    const expiraEm = new Date(grant.expiresAt).getTime()
    if (!Number.isNaN(expiraEm) && expiraEm <= Date.now()) return null
  }

  return {
    discountType: grant.discountType as ProuniDiscountType,
    discountValue: Number(grant.discountValue),
    stackWithTier: grant.stackWithTier === true,
    discountLabel: String(grant.discountLabel || ''),
    expiresAt: grant.expiresAt || null,
  }
}
