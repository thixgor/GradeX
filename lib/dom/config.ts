/**
 * Dom — o assistente de IA da DomineAqui. Números e nomes num lugar só.
 *
 * Client-safe (sem `server-only`): a tela mostra os mesmos tetos que a rota
 * aplica. Os tetos vêm do ambiente para o admin poder apertar ou soltar sem
 * deploy de código; os padrões cabem no nível GRATUITO do Gemini.
 *
 * ## A conta dos tetos (Gemini Free, out/2026)
 *
 * O Flash-Lite gratuito aguenta ~15 pedidos por minuto e ~1.000 por dia por
 * projeto. O Dom é uma chamada por mensagem (a busca de destinos, o contexto e
 * as fontes são montados no servidor sem IA), então:
 *
 * - **por pessoa**: 25 mensagens por dia e 5 por minuto. Dá uma sessão de
 *   estudo socrática inteira (~12 trocas) e ainda sobra para tirar dúvida do
 *   site. Quem precisa de mais que isso está usando o Dom para outra coisa.
 * - **global no Gemini**: 900 por dia e 12 por minuto — abaixo do teto do
 *   Google, para o 429 nunca chegar ao aluno. Passou disso, a mensagem vai
 *   para o AI Gateway da Vercel (pago, com o próprio teto diário de 300).
 *   Estourou os dois, o Dom avisa que volta amanhã — melhor do que conta
 *   surpresa.
 * - **busca no Google** (fontes atualizadas): só em pergunta de conteúdo de
 *   saúde, 8 por pessoa e 350 no total por dia. Sem ela as fontes continuam
 *   saindo como buscas prontas no PubMed/SciELO dos últimos cinco anos.
 */

export const NOME_DO_ASSISTENTE = 'Dom'
export const NOME_DO_PRODUTO = 'DomineAqui AI'

function inteiroDoAmbiente(nome: string, padrao: number, minimo = 0, maximo = 100_000): number {
  const bruto = typeof process !== 'undefined' ? process.env?.[nome] : undefined
  const n = Number(bruto)
  if (!bruto || !Number.isFinite(n)) return padrao
  return Math.min(maximo, Math.max(minimo, Math.trunc(n)))
}

export const LIMITES_DO_DOM = {
  /** Mensagens por pessoa por dia (dia de São Paulo). */
  porDia: inteiroDoAmbiente('DOM_LIMITE_DIARIO', 25, 1, 500),
  /** Mensagens por pessoa por minuto. */
  porMinuto: inteiroDoAmbiente('DOM_LIMITE_POR_MINUTO', 5, 1, 60),
  /** Chamadas ao Gemini por dia, somando todo mundo. */
  geminiPorDia: inteiroDoAmbiente('DOM_TETO_GEMINI_DIA', 900, 0, 1_000_000),
  /** Chamadas ao Gemini por minuto, somando todo mundo. */
  geminiPorMinuto: inteiroDoAmbiente('DOM_TETO_GEMINI_MINUTO', 12, 1, 10_000),
  /** Chamadas ao AI Gateway (reserva paga) por dia. */
  gatewayPorDia: inteiroDoAmbiente('DOM_TETO_GATEWAY_DIA', 300, 0, 1_000_000),
  /** Buscas no Google (fontes) por pessoa por dia. */
  buscasPorPessoa: inteiroDoAmbiente('DOM_BUSCAS_POR_PESSOA', 8, 0, 200),
  /** Buscas no Google por dia, somando todo mundo. */
  buscasPorDia: inteiroDoAmbiente('DOM_BUSCAS_DIA', 350, 0, 100_000),
} as const

/** Tamanho máximo de uma mensagem do aluno (caracteres). */
export const MAX_CARACTERES_MENSAGEM = 600
/** Quantas mensagens anteriores vão junto (o resto o Dom esquece de propósito). */
export const MAX_HISTORICO = 8
/** Teto de caracteres de cada mensagem antiga reenviada. */
export const MAX_CARACTERES_HISTORICO = 700

/** Incidentes de segurança em 24 h que suspendem o Dom para a pessoa. */
export const INCIDENTES_PARA_SUSPENDER = 3
/** Duração da suspensão automática. */
export const SUSPENSAO_MS = 24 * 60 * 60 * 1000

/** Janela da regra "comprou um material nos últimos 3 dias". */
export const DIAS_DE_ACESSO_POR_COMPRA = 3

export type ModoDoDom = 'geral' | 'socratico' | 'material'

export type HumorDoDom = 'feliz' | 'pensando' | 'explicando' | 'animado' | 'preocupado' | 'orgulhoso'
export const HUMORES: HumorDoDom[] = ['feliz', 'pensando', 'explicando', 'animado', 'preocupado', 'orgulhoso']

/** Etapas da escada socrática — o "porquê do porquê". */
export const ETAPAS_SOCRATICAS = ['diagnostico', 'conceito', 'porque', 'porque-do-porque', 'aplicacao', 'sintese'] as const
export type EtapaSocratica = (typeof ETAPAS_SOCRATICAS)[number]

export const ROTULO_DA_ETAPA: Record<EtapaSocratica, string> = {
  diagnostico: 'O que você já sabe',
  conceito: 'Conceito',
  porque: 'O porquê',
  'porque-do-porque': 'O porquê do porquê',
  aplicacao: 'Aplicação clínica',
  sintese: 'Síntese',
}

export type BaseDeReferencia = 'pubmed' | 'scielo' | 'diretriz' | 'livro'

export interface FonteDoDom {
  titulo: string
  url: string
  /** De onde veio: busca do Google (citação real da resposta) ou busca pronta numa base. */
  origem: 'web' | BaseDeReferencia
  /** Texto curto exibido no botão ("PubMed · últimos 5 anos"). */
  detalhe?: string
}

export interface DestinoDoDom {
  href: string
  titulo: string
  /** Área exclusiva de assinante e a pessoa não tem: a tela mostra a oferta junto. */
  exclusivo?: boolean
}

/** Corpo que a rota `POST /api/dom` devolve. */
export interface RespostaDoDom {
  texto: string
  humor: HumorDoDom
  destino?: DestinoDoDom | null
  fontes: FonteDoDom[]
  sugestoes: string[]
  socratico?: { etapa: EtapaSocratica; progresso: number } | null
  restantes: number
  /** Qual motor respondeu (para o painel; a tela não mostra). */
  motor?: 'gemini' | 'gateway' | 'local'
}

/** Corpo de `GET /api/dom/status`. */
export interface StatusDoDom {
  liberado: boolean
  motivo?: 'sem-plano' | 'suspenso' | 'nao-autenticado'
  primeiroNome: string
  plano: string
  /** Identificação anônima da conta (hash curto): separa as conversas salvas no aparelho. */
  conta?: string
  periodo?: number | null
  /** Para o painel mostrar nível, liga, sequência e posição (o Dom sabe disso). */
  xp?: { total: number; nivel: number; liga: string; semana: number; sequencia: number; posicaoSemana: number | null; posicaoGeral: number | null } | null
  restantes: number
  limiteDiario: number
  suspensoAte?: string | null
  /** Chegou pela compra de material: até quando vale. */
  acessoPorCompraAte?: string | null
}
