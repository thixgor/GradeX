/**
 * Permissões modulares de plano.
 *
 * ## O problema que isto resolve
 *
 * Até aqui todo plano pago concedia o mesmo cargo (`plus`) e, com ele, a
 * plataforma inteira sem teto. Preço e duração eram as únicas coisas que
 * variavam de um plano para outro. Não dava para montar um plano mais barato
 * que libera o Banco de Questões mas não os materiais, nem um plano de entrada
 * com 15 downloads de prova por dia.
 *
 * Cada plano passa a carregar um bloco `permissoes`: uma regra por área da
 * plataforma, com liberação (sim/não) e teto opcional (X por janela de tempo).
 *
 * ## Convivência com os limites que já existiam
 *
 * A plataforma já tem tetos por cargo em `lib/tier-limits.ts`,
 * `lib/flashcard-limits.ts` e no Plus+ Guard (`lib/plus-guard.ts`). Dois
 * sistemas medindo a mesma coisa dariam mensagens contraditórias ("ilimitado"
 * numa tela, "limite atingido" na outra), então a regra é uma só:
 *
 *  - `ativo: false` (o padrão, e o estado de todo plano já existente) — nada
 *    muda. O cargo manda, exatamente como antes desta funcionalidade.
 *  - `ativo: true` — para as áreas cobertas aqui, **a regra do plano substitui**
 *    o teto do cargo. Não há soma, não há "o menor dos dois": quem responde é
 *    o plano. Isso mantém a conta que o admin vê no editor igual à que o aluno
 *    vê na tela.
 *
 * O Plus+ Guard continua valendo por cima em qualquer cenário — ele não é teto
 * de plano, é antifraude (rajada, marca d'água, janela de arrependimento), e
 * some junto com o acervo se for desligado.
 *
 * ## Este arquivo é isomórfico
 *
 * Só tipos e funções puras: o editor do admin e as rotas de servidor consomem
 * daqui. Quem toca no banco é `lib/plan-entitlements-server.ts`.
 */

import type { AccountType } from './types'
import { normalizeAccountType, PLUS_TIER } from './account-tier'
import { getTierLimits, MINDMAP_FREE_LIMIT } from './tier-limits'
import { getFlashcardLimits } from './flashcard-limits'

/** Sobe quando o formato do bloco muda de forma incompatível. */
export const PLAN_PERMISSIONS_VERSION = 1

// ─── Áreas cobertas ───────────────────────────────────────────────────────────

export type PlanFeatureKey =
  | 'materiais'
  | 'provasPdf'
  | 'bancoQuestoes'
  | 'manualClinico'
  | 'cronogramas'
  | 'provasIa'
  | 'flashcardsIa'
  | 'mapasMentais'
  | 'aulas'

export const PLAN_FEATURE_KEYS: PlanFeatureKey[] = [
  'materiais',
  'provasPdf',
  'bancoQuestoes',
  'manualClinico',
  'cronogramas',
  'provasIa',
  'flashcardsIa',
  'mapasMentais',
  'aulas',
]

// ─── Janelas de tempo ─────────────────────────────────────────────────────────

/**
 * `total` é vitalício (o acervo inteiro da conta). As demais são janelas
 * deslizantes — "nas últimas 24h", não "desde a meia-noite".
 *
 * A escolha é deliberada: janela deslizante não tem o pico da virada do dia,
 * em que a pessoa esgota a cota às 23h50 e volta a ter tudo dez minutos
 * depois. Também dispensa cron de reset e campo de contador no usuário — a
 * conta sai de uma consulta indexada no log de uso.
 */
export type PlanLimitPeriod = 'hora' | 'dia' | 'semana' | 'mes' | 'total'

export const PLAN_LIMIT_PERIODS: PlanLimitPeriod[] = ['hora', 'dia', 'semana', 'mes', 'total']

export const PLAN_LIMIT_PERIOD_LABELS: Record<PlanLimitPeriod, string> = {
  hora: 'por hora',
  dia: 'por dia',
  semana: 'por semana',
  mes: 'por mês',
  total: 'no total (vitalício)',
}

const HORA_MS = 60 * 60 * 1000
const DIA_MS = 24 * HORA_MS

export const PLAN_LIMIT_PERIOD_MS: Record<Exclude<PlanLimitPeriod, 'total'>, number> = {
  hora: HORA_MS,
  dia: DIA_MS,
  semana: 7 * DIA_MS,
  mes: 30 * DIA_MS,
}

/** Início da janela deslizante, ou `null` para `total` (sem início). */
export function inicioDaJanela(periodo: PlanLimitPeriod, agora: Date = new Date()): Date | null {
  if (periodo === 'total') return null
  return new Date(agora.getTime() - PLAN_LIMIT_PERIOD_MS[periodo])
}

// ─── Regra por área ───────────────────────────────────────────────────────────

export interface PlanFeatureRule {
  /** Área liberada para quem tem o plano. */
  liberado: boolean
  /** Teto na janela. `0` = sem teto. */
  limite: number
  periodo: PlanLimitPeriod
}

export type ManualClinicoModuleKey =
  | 'patologias'
  | 'ferramentas'
  | 'farmacologia'
  | 'anatomia3d'
  | 'histologia'
  | 'exames'
  | 'radiologia'
  | 'eletro'
  | 'pdfCompleto'

export const MANUAL_CLINICO_MODULE_KEYS: ManualClinicoModuleKey[] = [
  'patologias',
  'ferramentas',
  'farmacologia',
  'anatomia3d',
  'histologia',
  'exames',
  'radiologia',
  'eletro',
  'pdfCompleto',
]

export type ManualClinicoModules = Record<ManualClinicoModuleKey, boolean>

export interface PlanPermissions {
  versao: number
  /**
   * Interruptor mestre. Desligado, o plano se comporta exatamente como antes
   * desta funcionalidade — quem manda são os limites do cargo.
   */
  ativo: boolean
  regras: Record<PlanFeatureKey, PlanFeatureRule>
  manualClinicoModulos: ManualClinicoModules
  atualizadoEm?: Date
}

// ─── Metadados para a interface do admin ──────────────────────────────────────

export interface PlanFeatureDefinition {
  key: PlanFeatureKey
  label: string
  descricao: string
  /** Substantivo contado no teto ("15 <unidade> por dia"). */
  unidade: string
  /** Áreas sem teto são só liga/desliga. */
  suportaLimite: boolean
  /** Sugestão exibida no campo de teto. */
  exemplo?: string
}

export const PLAN_FEATURE_DEFINITIONS: PlanFeatureDefinition[] = [
  {
    key: 'materiais',
    label: 'Materiais da plataforma',
    descricao:
      'Resgate e download do acervo — inclui os flashcards manuais vendidos na loja, que são materiais como qualquer outro.',
    unidade: 'downloads',
    suportaLimite: true,
    exemplo: 'ex.: 10 downloads por dia',
  },
  {
    key: 'provasPdf',
    label: 'Download de PDF das provas',
    descricao: 'Baixar prova, gabarito, resposta comentada e pacote de grupo em PDF.',
    unidade: 'downloads',
    suportaLimite: true,
    exemplo: 'ex.: 15 downloads por dia',
  },
  {
    key: 'bancoQuestoes',
    label: 'Banco de Questões',
    descricao: 'Abrir questões do banco, listas, histórico e estatísticas.',
    unidade: 'questões',
    suportaLimite: true,
    exemplo: 'ex.: 300 questões por dia',
  },
  {
    key: 'manualClinico',
    label: 'Manual Clínico',
    descricao:
      'Acesso ao Manual incluso na assinatura. Com a área liberada, escolha abaixo quais funções entram.',
    unidade: 'aberturas',
    suportaLimite: false,
  },
  {
    key: 'cronogramas',
    label: 'Cronogramas',
    descricao: 'Criação de cronogramas de estudo.',
    unidade: 'cronogramas',
    suportaLimite: true,
    exemplo: 'ex.: 3 cronogramas por mês',
  },
  {
    key: 'provasIa',
    label: 'Provas por IA',
    descricao: 'Geração de provas pessoais com inteligência artificial.',
    unidade: 'provas',
    suportaLimite: true,
    exemplo: 'ex.: 5 provas por dia',
  },
  {
    key: 'flashcardsIa',
    label: 'Flashcards por IA',
    descricao: 'Geração de decks de flashcards com inteligência artificial.',
    unidade: 'decks',
    suportaLimite: true,
    exemplo: 'ex.: 10 decks por dia',
  },
  {
    key: 'mapasMentais',
    label: 'Mapas mentais',
    descricao: 'Criação de mapas mentais no editor.',
    unidade: 'mapas',
    suportaLimite: true,
    exemplo: 'ex.: 20 mapas no total',
  },
  {
    key: 'aulas',
    label: 'Aulas',
    descricao: 'Aulas ao vivo e gravadas liberadas pela assinatura.',
    unidade: 'aulas',
    suportaLimite: false,
  },
]

export const PLAN_FEATURE_DEFINITION_BY_KEY: Record<PlanFeatureKey, PlanFeatureDefinition> =
  PLAN_FEATURE_DEFINITIONS.reduce((acc, def) => {
    acc[def.key] = def
    return acc
  }, {} as Record<PlanFeatureKey, PlanFeatureDefinition>)

export interface ManualClinicoModuleDefinition {
  key: ManualClinicoModuleKey
  label: string
  descricao: string
  href?: string
}

export const MANUAL_CLINICO_MODULE_DEFINITIONS: ManualClinicoModuleDefinition[] = [
  {
    key: 'patologias',
    label: 'Patologias',
    descricao: 'O corpo do Manual: 220+ patologias aprofundadas.',
    href: '/manual-clinico',
  },
  {
    key: 'ferramentas',
    label: 'Ferramentas Clínicas',
    descricao: 'Calculadoras e escores (gasometria, sepse, função renal).',
    href: '/manual-clinico/ferramentas',
  },
  {
    key: 'farmacologia',
    label: 'Farmacologia',
    descricao: 'Fármacos por classe, posologia e calculadora de dose.',
    href: '/manual-clinico/farmacologia',
  },
  {
    key: 'anatomia3d',
    label: 'Domine Anatomia',
    descricao: 'Atlas anatômico com modelos 3D.',
    href: '/anatomia',
  },
  {
    key: 'histologia',
    label: 'Manual da Histologia',
    descricao: 'Microscópio virtual e lâminas reais.',
    href: '/manual-clinico/histologia',
  },
  {
    key: 'exames',
    label: 'Exames Laboratoriais',
    descricao: 'Interpretação laboratorial e Laboratório Virtual.',
    href: '/manual-clinico/exames-laboratoriais',
  },
  {
    key: 'radiologia',
    label: 'Manual de Radiologia',
    descricao: 'Tomografia e Raio-X, corte a corte.',
    href: '/manual-clinico/radiologia',
  },
  {
    key: 'eletro',
    label: 'Manual do Eletrocardiograma',
    descricao: 'Simulador interativo de ECG com 12 derivações.',
    href: '/manual-clinico/eletrocardiograma',
  },
  {
    key: 'pdfCompleto',
    label: 'PDF do Manual completo',
    descricao: 'Baixar o Manual inteiro em PDF com marca d’água.',
  },
]

// ─── Construção de valores padrão ─────────────────────────────────────────────

function regra(liberado: boolean, limite = 0, periodo: PlanLimitPeriod = 'dia'): PlanFeatureRule {
  return { liberado, limite: Math.max(0, Math.floor(limite)), periodo }
}

export function todosOsModulosDoManual(valor: boolean): ManualClinicoModules {
  return MANUAL_CLINICO_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = valor
    return acc
  }, {} as ManualClinicoModules)
}

/**
 * Permissões que reproduzem o comportamento de hoje: tudo liberado, sem teto.
 *
 * É o que um plano `plus` vale antes de qualquer edição — por isso ligar o
 * interruptor sem mexer em mais nada não tira nada de ninguém.
 */
export function permissoesLiberadas(): PlanPermissions {
  return {
    versao: PLAN_PERMISSIONS_VERSION,
    ativo: false,
    regras: PLAN_FEATURE_KEYS.reduce((acc, key) => {
      acc[key] = regra(true, 0, 'dia')
      return acc
    }, {} as Record<PlanFeatureKey, PlanFeatureRule>),
    manualClinicoModulos: todosOsModulosDoManual(true),
  }
}

/** Traduz um teto numérico legado (que pode ser `Infinity`) em regra. */
function deLimiteLegado(
  liberado: boolean,
  limite: number,
  periodo: PlanLimitPeriod,
): PlanFeatureRule {
  if (!liberado) return regra(false, 0, periodo)
  if (!Number.isFinite(limite)) return regra(true, 0, periodo)
  return regra(true, limite, periodo)
}

/**
 * Pré-carga do editor quando o admin liga o interruptor pela primeira vez.
 *
 * Espelha o que o cargo já concede hoje, para que ativar as permissões não
 * mude nada por acidente: o admin parte do estado atual e ajusta a partir
 * dele. Sem isso, um plano de cargo `gratuito` nasceria com a plataforma
 * inteira liberada só porque alguém clicou no interruptor.
 */
export function permissoesPadraoParaCargo(role?: AccountType | string | null): PlanPermissions {
  const cargo = normalizeAccountType(role)
  const base = permissoesLiberadas()

  if (cargo === PLUS_TIER) return base

  const tier = getTierLimits(cargo)
  const flashcards = getFlashcardLimits(cargo)

  // Gratuito e trial não têm acervo, PDF de prova, Manual nem aulas pela
  // assinatura — só o que a tabela de cargo concede.
  base.regras.materiais = regra(false, 0, 'dia')
  base.regras.provasPdf = regra(false, 0, 'dia')
  base.regras.bancoQuestoes = deLimiteLegado(tier.bancoQuestoes, Infinity, 'dia')
  base.regras.manualClinico = regra(false, 0, 'dia')
  base.regras.aulas = regra(false, 0, 'dia')
  base.regras.cronogramas = deLimiteLegado(true, tier.cronogramasTotal, 'total')
  base.regras.provasIa = Number.isFinite(tier.personalExamsTotal)
    ? deLimiteLegado(true, tier.personalExamsTotal, 'total')
    : deLimiteLegado(true, tier.personalExamsPerDay ?? Infinity, 'dia')
  base.regras.flashcardsIa = Number.isFinite(flashcards.totalDecksLifetime)
    ? deLimiteLegado(true, flashcards.totalDecksLifetime, 'total')
    : deLimiteLegado(true, flashcards.dailyDecks, 'dia')
  base.regras.mapasMentais = deLimiteLegado(true, MINDMAP_FREE_LIMIT, 'total')
  base.manualClinicoModulos = todosOsModulosDoManual(false)

  return base
}

// ─── Normalização e sanitização ───────────────────────────────────────────────

function periodoValido(valor: unknown, fallback: PlanLimitPeriod): PlanLimitPeriod {
  const v = String(valor || '').toLowerCase() as PlanLimitPeriod
  return PLAN_LIMIT_PERIODS.includes(v) ? v : fallback
}

/** Teto máximo aceito. Acima disto é engano de digitação, não intenção. */
const LIMITE_MAXIMO = 1_000_000

function limiteValido(valor: unknown): number {
  const n = Number(valor)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(LIMITE_MAXIMO, Math.floor(n))
}

function normalizarRegra(entrada: unknown, padrao: PlanFeatureRule, suportaLimite: boolean): PlanFeatureRule {
  const bruto = (entrada || {}) as Partial<PlanFeatureRule>
  const liberado = bruto.liberado === undefined ? padrao.liberado : !!bruto.liberado
  if (!suportaLimite) return { liberado, limite: 0, periodo: 'total' }
  return {
    liberado,
    limite: bruto.limite === undefined ? padrao.limite : limiteValido(bruto.limite),
    periodo: periodoValido(bruto.periodo, padrao.periodo),
  }
}

/**
 * Completa um bloco vindo do banco (ou do formulário) com os padrões.
 *
 * Tolerante de propósito: o documento sobrevive a mudanças de código, então
 * uma área nova precisa aparecer liberada em planos gravados antes dela
 * existir — e um campo com lixo não pode derrubar a checagem de acesso.
 */
export function normalizePlanPermissions(entrada?: Partial<PlanPermissions> | null): PlanPermissions {
  const padrao = permissoesLiberadas()
  if (!entrada || typeof entrada !== 'object') {
    return { ...padrao, ativo: false }
  }

  const regrasBrutas = (entrada.regras || {}) as Record<string, unknown>
  const regras = PLAN_FEATURE_KEYS.reduce((acc, key) => {
    acc[key] = normalizarRegra(
      regrasBrutas[key],
      padrao.regras[key],
      PLAN_FEATURE_DEFINITION_BY_KEY[key].suportaLimite,
    )
    return acc
  }, {} as Record<PlanFeatureKey, PlanFeatureRule>)

  const modulosBrutos = (entrada.manualClinicoModulos || {}) as Record<string, unknown>
  const manualClinicoModulos = MANUAL_CLINICO_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = modulosBrutos[key] === undefined ? true : !!modulosBrutos[key]
    return acc
  }, {} as ManualClinicoModules)

  return {
    versao: PLAN_PERMISSIONS_VERSION,
    ativo: !!entrada.ativo,
    regras,
    manualClinicoModulos,
    atualizadoEm: entrada.atualizadoEm ? new Date(entrada.atualizadoEm) : undefined,
  }
}

/** Versão para a rota de escrita do admin: normaliza e carimba a data. */
export function sanitizePlanPermissions(entrada: unknown): PlanPermissions {
  const normalizado = normalizePlanPermissions(entrada as Partial<PlanPermissions>)
  return { ...normalizado, atualizadoEm: new Date() }
}

// ─── Consultas puras ──────────────────────────────────────────────────────────

export function regraDaArea(permissoes: PlanPermissions, feature: PlanFeatureKey): PlanFeatureRule {
  return permissoes.regras[feature] || permissoesLiberadas().regras[feature]
}

/** Frase pronta para o teto de uma área — usada no editor e nas mensagens. */
export function descreverRegra(permissoes: PlanPermissions, feature: PlanFeatureKey): string {
  const def = PLAN_FEATURE_DEFINITION_BY_KEY[feature]
  const r = regraDaArea(permissoes, feature)
  if (!r.liberado) return 'Bloqueado'
  if (!def.suportaLimite || r.limite <= 0) return 'Liberado, sem limite'
  return `${r.limite} ${def.unidade} ${PLAN_LIMIT_PERIOD_LABELS[r.periodo]}`
}

/** Mensagem mostrada ao aluno quando o teto do plano fecha a porta. */
export function mensagemDeLimite(
  feature: PlanFeatureKey,
  limite: number,
  periodo: PlanLimitPeriod,
): string {
  const def = PLAN_FEATURE_DEFINITION_BY_KEY[feature]
  const janela = PLAN_LIMIT_PERIOD_LABELS[periodo]
  if (periodo === 'total') {
    return `Você atingiu o limite do seu plano para ${def.label.toLowerCase()} (${limite} ${def.unidade} no total).`
  }
  return `Você atingiu o limite do seu plano para ${def.label.toLowerCase()} (${limite} ${def.unidade} ${janela}). O limite se renova automaticamente.`
}

/** Mensagem mostrada quando a área inteira não faz parte do plano. */
export function mensagemDeBloqueio(feature: PlanFeatureKey, nomeDoPlano?: string | null): string {
  const def = PLAN_FEATURE_DEFINITION_BY_KEY[feature]
  const plano = nomeDoPlano ? ` (${nomeDoPlano})` : ''
  return `${def.label} não faz parte do seu plano${plano}. Veja os planos disponíveis para liberar esta área.`
}
