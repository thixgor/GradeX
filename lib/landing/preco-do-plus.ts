import { PLUS_TIER, normalizeAccountType } from '@/lib/account-tier'
import { apresentarPreco, linhaDeApoio, rotuloCurtoDePreco } from '@/lib/buy/pricing'
import type { PlanConfig } from '@/lib/types'

/**
 * O preço do Plus+ que a landing mostra no cartão do plano.
 *
 * O cartão dizia o que o Plus+ libera e mandava para "Ver os planos" — o custo
 * só aparecia um clique depois. Preço escondido até o fim do caminho é o
 * primeiro item de qualquer lista de dark patterns, e o visitante que não
 * sabe quanto custa simplesmente não clica. Agora o cartão diz o número.
 *
 * As regras são as de /buy (`lib/buy/pricing.ts`), para as duas telas nunca
 * falarem números diferentes:
 *   - lidera o menor equivalente mensal entre os planos Plus+ visíveis
 *     ("a partir de R$ 33,08/mês");
 *   - a linha de apoio diz a cobrança REAL daquele plano ("R$ 397,00
 *     cobrados de uma vez, a cada 12 meses") — o mensal sozinho seria
 *     promessa falsa;
 *   - plano oculto, de outro cargo (Quest+) ou sem preço fica de fora; sem
 *     nenhum plano válido, devolve `null` e o cartão segue sem número, como
 *     antes. Nunca um preço inventado.
 */
export interface PrecoDoPlus {
  /** "R$ 33,08/mês" ou "R$ 497,00 à vista". */
  chamada: string
  /** A cobrança de verdade, sempre visível junto da chamada. */
  apoio: string
}

export function precoDoPlus(planos: PlanConfig[] | null | undefined): PrecoDoPlus | null {
  if (!Array.isArray(planos)) return null

  const candidatos = planos
    .filter((p) => p && !p.oculto && Number(p.preco) > 0)
    .filter((p) => normalizeAccountType(p.role || PLUS_TIER) === PLUS_TIER)
    .map((p) => apresentarPreco({ preco: p.preco, precoOriginal: p.precoOriginal, durationMonths: p.durationMonths }))

  if (candidatos.length === 0) return null

  // Assinatura (mensal) antes de pagamento único: "a partir de X/mês" e "X à
  // vista" não se comparam pelo número.
  const assinaturas = candidatos.filter((c) => c.chamada.unidade === 'mes')
  const base = assinaturas.length > 0 ? assinaturas : candidatos
  const menor = base.reduce((a, b) => (b.chamada.valor < a.chamada.valor ? b : a))

  return { chamada: rotuloCurtoDePreco(menor), apoio: linhaDeApoio(menor) }
}
