/**
 * O upgrade do Quest+ para o Plus+.
 *
 * ## Por que existe
 *
 * Quem já paga o Quest+ e queria a plataforma inteira não tinha por onde: /buy
 * dizia "você já tem um plano ativo" e mandava para o WhatsApp. Agora existe
 * um caminho de um clique, com um preço só para eles (desconto configurável em
 * /admin/settings), e o servidor cuida de tudo que fazia o upgrade "na mão"
 * dar errado.
 *
 * ## As regras que não podem quebrar
 *
 * 1. **O desconto é do servidor.** A tela mostra o preço de upgrade, mas quem
 *    cobra é `/api/payments/orders`, que confere de novo se a conta é Quest+
 *    vigente e se o plano entra na oferta. Preço do cliente não vale nada.
 * 2. **Descontos não somam: vence o maior.** O mesmo princípio de cupom ×
 *    PROUNI (`combineDiscountsWithProuni`). O upgrade disputa com o que o
 *    cupom/benefício já daria; o menor preço final é o cobrado. Ver
 *    `aplicarUpgradeAoPreco`.
 * 3. **Ninguém perde o que já pagou.** O Plus+ começa no pagamento. O Quest+
 *    que a pessoa tinha fica guardado em `questAntesDoUpgrade`: se ainda
 *    sobrar Quest+ quando o Plus+ acabar (ou se ela pedir reembolso nos 7
 *    dias), a conta volta para o Quest+ até a data já paga, em vez de cair
 *    para gratuita. Ver `retornoAoQuest`.
 * 4. **Ninguém paga dois.** A renovação automática do Quest+ é encerrada no
 *    Mercado Pago quando o upgrade é aprovado (lib/upgrade-quest-server.ts).
 *
 * ## A janela da oferta
 *
 * A contagem regressiva é por pessoa e determinística (`prazoDaOferta`): a
 * mesma conta vê o mesmo prazo no celular, no computador e no e-mail, sem
 * gravar nada no banco. Quando a janela fecha, abre-se a seguinte — o preço
 * continua valendo, porque a regra 1 nunca olha o relógio. Assim o contador
 * nunca pode prometer um preço que o checkout recuse.
 *
 * Este arquivo é isomórfico: só tipos e funções puras. Quem lê o banco é
 * `lib/upgrade-quest-server.ts`.
 */

import { normalizeAccountType, PLUS_TIER, QUEST_TIER } from './account-tier'

// ─── Configuração (admin_settings.upgradeQuest) ──────────────────────────────

export interface ConfigDoUpgradeQuest {
  /** Desligado: Quest+ compra o Plus+ pelo preço cheio, sem página de oferta. */
  ativo: boolean
  /** Desconto sobre o preço do plano Plus+, em pontos percentuais inteiros. */
  descontoPercentual: number
  /**
   * Tipos dos planos Plus+ que entram na oferta. Vazio = todos os Plus+
   * visíveis em /buy. Um plano oculto só entra se for listado aqui — é o jeito
   * de ter um plano "só de upgrade".
   */
  planos: string[]
  /** Plano que a página de upgrade abre selecionado. Vazio = o anual/destaque. */
  planoPadrao: string
  /** A contagem regressiva da página e do e-mail. */
  urgencia: {
    ativa: boolean
    /** Tamanho da janela, em horas. */
    horas: number
  }
}

/**
 * 30%: o bastante para pesar contra quem já paga uma fatia e "vai pensar", e
 * pouco o bastante para não ensinar a base a esperar promoção. É o padrão de
 * upgrade de SaaS de consumo (20–40%), no meio da faixa.
 */
export const UPGRADE_QUEST_PADRAO: ConfigDoUpgradeQuest = {
  ativo: true,
  descontoPercentual: 30,
  planos: [],
  planoPadrao: '',
  urgencia: { ativa: true, horas: 48 },
}

export const LIMITES_DO_UPGRADE = {
  descontoMinimo: 5,
  descontoMaximo: 80,
  horasMinimas: 6,
  horasMaximas: 168,
} as const

const FORMATO_DE_TIPO = /^[A-Za-z0-9_-]{1,60}$/

function inteiroEntre(valor: unknown, minimo: number, maximo: number, padrao: number): number {
  const n = Math.round(Number(valor))
  if (!Number.isFinite(n)) return padrao
  return Math.min(maximo, Math.max(minimo, n))
}

/**
 * Lê o que estiver gravado (ou nada) e devolve uma configuração sempre
 * completa e dentro dos limites. Serve para leitura e para o PUT do admin:
 * valor fora da faixa é puxado para a borda, nunca recusado em silêncio.
 */
export function normalizarConfigDoUpgrade(bruto: unknown): ConfigDoUpgradeQuest {
  const b = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, any>
  const urg = (b.urgencia && typeof b.urgencia === 'object' ? b.urgencia : {}) as Record<string, any>
  const p = UPGRADE_QUEST_PADRAO

  const planos = Array.isArray(b.planos)
    ? Array.from(new Set(b.planos.map((t: unknown) => String(t ?? '').trim()).filter((t: string) => FORMATO_DE_TIPO.test(t))))
    : p.planos
  const planoPadrao = typeof b.planoPadrao === 'string' && FORMATO_DE_TIPO.test(b.planoPadrao.trim()) ? b.planoPadrao.trim() : ''

  return {
    ativo: typeof b.ativo === 'boolean' ? b.ativo : p.ativo,
    descontoPercentual: inteiroEntre(
      b.descontoPercentual,
      LIMITES_DO_UPGRADE.descontoMinimo,
      LIMITES_DO_UPGRADE.descontoMaximo,
      p.descontoPercentual,
    ),
    planos: planos as string[],
    planoPadrao,
    urgencia: {
      ativa: typeof urg.ativa === 'boolean' ? urg.ativa : p.urgencia.ativa,
      horas: inteiroEntre(urg.horas, LIMITES_DO_UPGRADE.horasMinimas, LIMITES_DO_UPGRADE.horasMaximas, p.urgencia.horas),
    },
  }
}

// ─── Preço ────────────────────────────────────────────────────────────────────

function centavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

/** Preço do plano com o desconto de upgrade. Nunca negativo. */
export function precoDeUpgrade(preco: number, descontoPercentual: number): number {
  const base = Math.max(0, Number(preco) || 0)
  const pct = Math.min(100, Math.max(0, Number(descontoPercentual) || 0))
  return centavos(base * (1 - pct / 100))
}

/**
 * Vence o maior desconto — o upgrade ou o que cupom/PROUNI já deram.
 *
 * `precoAtual` é o resultado de `combineDiscountsWithProuni` (o preço com o
 * melhor entre cupom e benefício). Empate fica com o cupom/benefício: ele já
 * foi validado e reservado do jeito de sempre, e trocar por um desconto igual
 * só mudaria a atribuição da venda.
 */
export function aplicarUpgradeAoPreco(
  precoAtual: number,
  precoUpgrade: number | null | undefined,
): { preco: number; upgradeVenceu: boolean } {
  const atual = centavos(Math.max(0, Number(precoAtual) || 0))
  if (precoUpgrade == null || !Number.isFinite(precoUpgrade) || precoUpgrade <= 0) {
    return { preco: atual, upgradeVenceu: false }
  }
  const upgrade = centavos(precoUpgrade)
  return upgrade < atual ? { preco: upgrade, upgradeVenceu: true } : { preco: atual, upgradeVenceu: false }
}

// ─── Planos ───────────────────────────────────────────────────────────────────

/** O pedaço de `PlanConfig` que o upgrade usa. */
export interface PlanoDoUpgrade {
  tipo: string
  preco: number
  role?: string | null
  oculto?: boolean
  destaque?: boolean
  ordem?: number
  durationMonths?: number
}

/**
 * O plano entra na oferta? Precisa conceder o Plus+ (plano sem `role` vale
 * Plus+, como em `cargoDoPlano`) e ter preço. Com a lista do admin vazia,
 * valem os visíveis; com lista, só os listados — ocultos inclusive.
 */
export function planoElegivelAoUpgrade(plano: PlanoDoUpgrade | null | undefined, config: ConfigDoUpgradeQuest): boolean {
  if (!plano || !plano.tipo) return false
  if (normalizeAccountType(plano.role || PLUS_TIER) !== PLUS_TIER) return false
  if (!(Number(plano.preco) > 0)) return false
  return config.planos.length > 0 ? config.planos.includes(plano.tipo) : !plano.oculto
}

/** Os planos da oferta, na ordem do catálogo. */
export function planosDoUpgrade<T extends PlanoDoUpgrade>(planos: T[] | null | undefined, config: ConfigDoUpgradeQuest): T[] {
  return (planos || [])
    .filter((p) => planoElegivelAoUpgrade(p, config))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
}

/**
 * O plano que abre selecionado: o escolhido pelo admin; senão o anual (o que
 * mais rende no upgrade); senão o destaque; senão o mais longo.
 */
export function planoPadraoDoUpgrade<T extends PlanoDoUpgrade>(planos: T[], config: ConfigDoUpgradeQuest): T | null {
  if (planos.length === 0) return null
  return (
    planos.find((p) => p.tipo === config.planoPadrao) ||
    planos.find((p) => Number(p.durationMonths) === 12) ||
    planos.find((p) => p.destaque) ||
    [...planos].sort((a, b) => duracaoParaOrdem(b) - duracaoParaOrdem(a))[0]
  )
}

/** Vitalício (0/ausente) é o "mais longo" de todos. */
function duracaoParaOrdem(p: PlanoDoUpgrade): number {
  const m = Number(p.durationMonths)
  return Number.isFinite(m) && m > 0 ? m : Number.MAX_SAFE_INTEGER
}

// ─── A janela da oferta ───────────────────────────────────────────────────────

const HORA_MS = 60 * 60 * 1000

/** FNV-1a de 32 bits: estável entre servidor, navegador e e-mail. */
function hash32(texto: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Quando fecha a janela da oferta desta pessoa (epoch ms).
 *
 * Cada conta tem a sua fase dentro do ciclo de `horas` (derivada do id), para
 * a base inteira não ver o contador zerar no mesmo minuto. O prazo é sempre
 * estritamente no futuro.
 */
export function prazoDaOferta(chave: string, agoraMs: number, horas: number): number {
  const janela = Math.max(1, horas) * HORA_MS
  const fase = hash32(chave || 'anonimo') % janela
  const decorrido = agoraMs - fase
  const ciclos = Math.floor(decorrido / janela) + 1
  return fase + ciclos * janela
}

// ─── A conta ──────────────────────────────────────────────────────────────────

/** O Quest+ que a pessoa tinha no momento do upgrade. Gravado na conta. */
export interface QuestAntesDoUpgrade {
  /** `null` = Quest+ vitalício. */
  expiresAt: Date | string | null
  planType?: string | null
  /** O pedido do upgrade — é ele que, estornado, devolve o Quest+. */
  orderId: string
  em: Date | string
}

interface ContaParaUpgrade {
  accountType?: string | null
  premiumExpiresAt?: Date | string | null
  questAntesDoUpgrade?: QuestAntesDoUpgrade | null
}

function data(v: Date | string | null | undefined): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Quest+ vigente: cargo Quest+ sem data (vitalício) ou com data no futuro. */
export function questVigente(conta: ContaParaUpgrade | null | undefined, agora: Date): boolean {
  if (!conta || normalizeAccountType(conta.accountType) !== QUEST_TIER) return false
  const expira = data(conta.premiumExpiresAt)
  return !expira || expira > agora
}

/**
 * Para onde vai uma conta Plus+ que perdeu o Plus+ (venceu ou foi estornado).
 *
 * Devolve o Quest+ guardado quando ele ainda vale; `null` quando não há o que
 * devolver — aí o destino é o gratuito de sempre. Só se aplica a conta que
 * está no Plus+: se o cargo atual é outro, o registro do upgrade é história.
 */
export function retornoAoQuest(
  conta: ContaParaUpgrade | null | undefined,
  agora: Date,
): { accountType: typeof QUEST_TIER; premiumExpiresAt: Date | null; premiumPlanType: string | null } | null {
  const guardado = conta?.questAntesDoUpgrade
  if (!conta || !guardado) return null
  if (normalizeAccountType(conta.accountType) !== PLUS_TIER) return null
  const expira = data(guardado.expiresAt)
  if (guardado.expiresAt != null && (!expira || expira <= agora)) return null
  return {
    accountType: QUEST_TIER,
    premiumExpiresAt: expira,
    premiumPlanType: guardado.planType || null,
  }
}
