/**
 * Aplicação das permissões modulares de plano no servidor.
 *
 * Três responsabilidades, nesta ordem:
 *
 *  1. **Resolver** quais permissões valem para uma conta — ou seja: qual plano
 *     ela comprou (`user.premiumPlanType`) e o que aquele plano libera.
 *  2. **Contar** o que ela já consumiu na janela da regra.
 *  3. **Decidir** e **registrar**, em duas etapas separadas.
 *
 * A separação entre decidir e registrar copia o que o Plus+ Guard já faz, e
 * pelo mesmo motivo: se a geração do PDF (ou a chamada à IA) falhar no meio, a
 * cota não pode ter sido queimada. Quem libera o recurso chama
 * `registrarUsoDoPlano` depois, quando o entregou de fato.
 *
 * ## De onde sai a contagem
 *
 * Duas fontes, escolhidas pela janela da regra:
 *
 *  - **`total` (vitalício)** — conta a coleção real (cronogramas do usuário,
 *    provas pessoais, decks, mapas). É a fonte da verdade para "quantos você
 *    tem", é o que a tela já mostra, e vale para o acervo criado antes de estas
 *    permissões existirem.
 *  - **janela deslizante (hora/dia/semana/mês)** — conta `plan_usage_events`,
 *    um log append-only escrito no momento do consumo. Precisa ser um log
 *    próprio: contar a coleção real numa janela deixaria a pessoa apagar e
 *    recriar para zerar o contador, o que num teto por dia é o buraco inteiro.
 *
 * Downloads (materiais e PDF de provas) não têm coleção real de "posse", então
 * usam o log nas duas situações.
 *
 * ## Custo
 *
 * Cada checagem é um `countDocuments` num índice composto
 * (`userId + feature + createdAt`), e o catálogo de planos fica memoizado por
 * 30s na instância. Uma checagem por ação do usuário, nenhuma varredura.
 */

import { ObjectId, type Db } from 'mongodb'
import { invalidarCacheDeServidor, memoizarPorTempo } from './cache-de-servidor'
import {
  MANUAL_CLINICO_MODULE_KEYS,
  PLAN_FEATURE_DEFINITION_BY_KEY,
  inicioDaJanela,
  mensagemDeBloqueio,
  mensagemDeLimite,
  normalizePlanPermissions,
  permissoesLiberadas,
  regraDaArea,
  type ManualClinicoModuleKey,
  type PlanFeatureKey,
  type PlanLimitPeriod,
  type PlanPermissions,
} from './plan-entitlements'
import type { PlanConfig, User } from './types'

/** Log append-only de consumo, base de toda janela deslizante. */
export const PLAN_USAGE_COLLECTION = 'plan_usage_events'

export interface PlanUsageEvent {
  _id?: ObjectId
  userId: string
  feature: PlanFeatureKey
  /** Id do recurso consumido — permite não cobrar duas vezes pelo mesmo item. */
  recurso?: string
  planoTipo?: string | null
  createdAt: Date
}

// ─── Resolução ────────────────────────────────────────────────────────────────

export interface ContextoDePermissoes {
  userId: string
  isAdmin: boolean
  /**
   * As permissões efetivas. Quando `aplicavel` é falso este objeto é apenas o
   * "tudo liberado" e não deve ser usado para decidir nada — o caminho legado
   * (limites por cargo) continua no comando.
   */
  permissoes: PlanPermissions
  /**
   * O plano da conta ativou as permissões modulares? Só aqui elas mandam.
   */
  aplicavel: boolean
  planoTipo: string | null
  planoNome: string | null
}

/** Contexto neutro: nada a aplicar, tudo segue como antes. */
function contextoNeutro(userId: string, isAdmin: boolean): ContextoDePermissoes {
  return {
    userId,
    isAdmin,
    permissoes: permissoesLiberadas(),
    aplicavel: false,
    planoTipo: null,
    planoNome: null,
  }
}

/**
 * Catálogo de planos do admin, memoizado por 30s.
 *
 * É dado impessoal (o mesmo para todo mundo), então cabe na memória curta do
 * servidor. A janela é curta o bastante para o admin ver a edição valendo
 * quase imediatamente, e longa o bastante para uma tela cheia de checagens não
 * bater no Atlas uma vez por checagem.
 */
const CHAVE_DO_CATALOGO = 'plan-entitlements:catalogo'

/**
 * Descarta o catálogo memoizado. Chamado pela rota que grava os planos, para
 * que a edição do admin valha na requisição seguinte em vez de depender do
 * TTL — quem acabou de salvar precisa poder conferir na hora.
 */
export function invalidarCatalogoDePlanos(): void {
  invalidarCacheDeServidor(CHAVE_DO_CATALOGO)
}

async function lerCatalogoDePlanos(db: Db): Promise<PlanConfig[]> {
  return memoizarPorTempo(CHAVE_DO_CATALOGO, 30_000, async () => {
    const settings = await db
      .collection('admin_settings')
      .findOne({}, { projection: { planos: 1 } })
    return (settings?.planos || []) as PlanConfig[]
  })
}

export interface DadosDaConta {
  userId: string
  role?: string | null
  accountType?: string | null
  premiumPlanType?: string | null
}

/**
 * Descobre as permissões que valem para uma conta.
 *
 * Admin nunca é limitado — é a mesma regra de todo o resto da plataforma, e
 * sem ela o admin não consegue conferir nem o próprio catálogo.
 */
export async function resolverPermissoes(
  db: Db,
  conta: DadosDaConta,
): Promise<ContextoDePermissoes> {
  const isAdmin = conta.role === 'admin'
  if (isAdmin) return contextoNeutro(conta.userId, true)

  const tipo = conta.premiumPlanType ? String(conta.premiumPlanType) : null
  if (!tipo) return contextoNeutro(conta.userId, false)

  let catalogo: PlanConfig[]
  try {
    catalogo = await lerCatalogoDePlanos(db)
  } catch (erro) {
    // Falha de leitura não pode fechar a plataforma para quem paga: sem
    // catálogo, o caminho legado assume e ninguém perde acesso.
    console.error('[plan-entitlements] falha ao ler catálogo de planos:', erro)
    return contextoNeutro(conta.userId, false)
  }

  const plano = catalogo.find(p => String(p.tipo) === tipo)
  if (!plano) return contextoNeutro(conta.userId, false)

  const permissoes = normalizePlanPermissions(plano.permissoes)
  if (!permissoes.ativo) return contextoNeutro(conta.userId, false)

  return {
    userId: conta.userId,
    isAdmin: false,
    permissoes,
    aplicavel: true,
    planoTipo: String(plano.tipo),
    planoNome: plano.nome || plano.periodo || String(plano.tipo),
  }
}

/** Atalho que busca a conta quando o caller ainda não a carregou. */
export async function resolverPermissoesPorUsuario(
  db: Db,
  userId: string,
): Promise<ContextoDePermissoes> {
  if (!ObjectId.isValid(userId)) return contextoNeutro(userId, false)
  const user = await db.collection<User>('users').findOne(
    { _id: new ObjectId(userId) as any },
    { projection: { role: 1, accountType: 1, premiumPlanType: 1 } },
  )
  if (!user) return contextoNeutro(userId, false)
  return resolverPermissoes(db, {
    userId,
    role: user.role,
    accountType: user.accountType,
    premiumPlanType: user.premiumPlanType as string | null,
  })
}

// ─── Contagem ─────────────────────────────────────────────────────────────────

/**
 * Coleção real que representa a posse vitalícia de cada área, quando existe.
 *
 * Downloads não aparecem aqui: baixar não é possuir, e um teto vitalício de
 * downloads é contagem de eventos, não de itens.
 */
const POSSE_VITALICIA: Partial<
  Record<PlanFeatureKey, (userId: string) => { colecao: string; filtro: Record<string, unknown> }>
> = {
  cronogramas: userId => ({ colecao: 'cronogramas', filtro: { usuarioId: userId } }),
  provasIa: userId => ({
    colecao: 'exams',
    filtro: { isPersonalExam: true, createdBy: userId },
  }),
  flashcardsIa: userId => ({ colecao: 'flashcardDecks', filtro: { userId } }),
  mapasMentais: userId => ({ colecao: 'mindMaps', filtro: { ownerId: userId } }),
}

/** Quanto a conta já consumiu de uma área na janela da regra. */
export async function contarUso(
  db: Db,
  userId: string,
  feature: PlanFeatureKey,
  periodo: PlanLimitPeriod,
  agora: Date = new Date(),
): Promise<number> {
  if (periodo === 'total') {
    const posse = POSSE_VITALICIA[feature]
    if (posse) {
      const { colecao, filtro } = posse(userId)
      return db.collection(colecao).countDocuments(filtro as any)
    }
    return db.collection<PlanUsageEvent>(PLAN_USAGE_COLLECTION).countDocuments({ userId, feature })
  }

  const desde = inicioDaJanela(periodo, agora)!
  return db
    .collection<PlanUsageEvent>(PLAN_USAGE_COLLECTION)
    .countDocuments({ userId, feature, createdAt: { $gte: desde } })
}

// ─── Decisão ──────────────────────────────────────────────────────────────────

export interface VeredictoDoPlano {
  permitido: boolean
  /** Falso quando as permissões modulares nem se aplicam a esta conta. */
  aplicavel: boolean
  motivo?: 'bloqueado' | 'limite'
  mensagem?: string
  limite?: number
  usado?: number
  restante?: number
  periodo?: PlanLimitPeriod
  /** Quando a janela deslizante devolve a cota (ausente em `total`). */
  renovaEm?: Date
}

const LIBERADO: VeredictoDoPlano = { permitido: true, aplicavel: false }

export interface OpcoesDeAvaliacao {
  /**
   * Recurso já contabilizado antes não deve custar de novo (reabrir a mesma
   * questão do Banco, rebaixar o mesmo material). Quando informado, um evento
   * com o mesmo `recurso` dentro da janela libera sem consumir cota.
   */
  recurso?: string
  /** Quantas unidades esta ação consome. Padrão 1. */
  quantidade?: number
  agora?: Date
}

/**
 * Esta conta pode consumir mais uma unidade desta área agora?
 *
 * Não registra nada — ver `registrarUsoDoPlano`.
 */
export async function avaliarUsoDoPlano(
  db: Db,
  contexto: ContextoDePermissoes,
  feature: PlanFeatureKey,
  opcoes: OpcoesDeAvaliacao = {},
): Promise<VeredictoDoPlano> {
  if (!contexto.aplicavel || contexto.isAdmin) return LIBERADO

  const regra = regraDaArea(contexto.permissoes, feature)
  if (!regra.liberado) {
    return {
      permitido: false,
      aplicavel: true,
      motivo: 'bloqueado',
      mensagem: mensagemDeBloqueio(feature, contexto.planoNome),
    }
  }

  const suportaLimite = PLAN_FEATURE_DEFINITION_BY_KEY[feature].suportaLimite
  if (!suportaLimite || regra.limite <= 0) {
    return { permitido: true, aplicavel: true }
  }

  const agora = opcoes.agora ?? new Date()

  // Recurso já pago nesta janela: libera sem tocar na cota.
  if (opcoes.recurso) {
    const jaContado = await contarRecurso(db, contexto.userId, feature, regra.periodo, opcoes.recurso, agora)
    if (jaContado > 0) {
      const usado = await contarUso(db, contexto.userId, feature, regra.periodo, agora)
      return {
        permitido: true,
        aplicavel: true,
        limite: regra.limite,
        usado,
        restante: Math.max(0, regra.limite - usado),
        periodo: regra.periodo,
      }
    }
  }

  const quantidade = Math.max(1, Math.floor(opcoes.quantidade ?? 1))
  const usado = await contarUso(db, contexto.userId, feature, regra.periodo, agora)

  if (usado + quantidade > regra.limite) {
    const veredicto: VeredictoDoPlano = {
      permitido: false,
      aplicavel: true,
      motivo: 'limite',
      mensagem: mensagemDeLimite(feature, regra.limite, regra.periodo),
      limite: regra.limite,
      usado,
      restante: Math.max(0, regra.limite - usado),
      periodo: regra.periodo,
    }
    if (regra.periodo !== 'total') {
      veredicto.renovaEm = await proximaRenovacao(db, contexto.userId, feature, regra.periodo, agora)
    }
    return veredicto
  }

  return {
    permitido: true,
    aplicavel: true,
    limite: regra.limite,
    usado,
    restante: Math.max(0, regra.limite - usado - quantidade),
    periodo: regra.periodo,
  }
}

async function contarRecurso(
  db: Db,
  userId: string,
  feature: PlanFeatureKey,
  periodo: PlanLimitPeriod,
  recurso: string,
  agora: Date,
): Promise<number> {
  const filtro: Record<string, unknown> = { userId, feature, recurso }
  const desde = inicioDaJanela(periodo, agora)
  if (desde) filtro.createdAt = { $gte: desde }
  return db.collection<PlanUsageEvent>(PLAN_USAGE_COLLECTION).countDocuments(filtro as any, { limit: 1 })
}

/**
 * Quando a primeira unidade da janela sai dela — é o instante exato em que a
 * cota volta a ter espaço. Cair de volta no fim nominal da janela quando não
 * há evento é só o pior caso.
 */
async function proximaRenovacao(
  db: Db,
  userId: string,
  feature: PlanFeatureKey,
  periodo: PlanLimitPeriod,
  agora: Date,
): Promise<Date | undefined> {
  if (periodo === 'total') return undefined
  const desde = inicioDaJanela(periodo, agora)!
  const duracao = agora.getTime() - desde.getTime()
  const maisAntigo = await db
    .collection<PlanUsageEvent>(PLAN_USAGE_COLLECTION)
    .findOne(
      { userId, feature, createdAt: { $gte: desde } },
      { sort: { createdAt: 1 }, projection: { createdAt: 1 } },
    )
  const base = maisAntigo?.createdAt ? new Date(maisAntigo.createdAt).getTime() : agora.getTime()
  return new Date(base + duracao)
}

// ─── Registro ─────────────────────────────────────────────────────────────────

/**
 * Grava o consumo. Best-effort, como o log do Plus+ Guard: a pessoa já recebeu
 * o que pediu, e derrubar a resposta agora só produziria um erro sem sentido.
 * Uma falha aqui afrouxa a cota até a janela seguinte, nunca fecha a porta.
 */
export async function registrarUsoDoPlano(
  db: Db,
  contexto: ContextoDePermissoes,
  feature: PlanFeatureKey,
  opcoes: { recurso?: string } = {},
): Promise<void> {
  if (!contexto.aplicavel || contexto.isAdmin) return

  const regra = regraDaArea(contexto.permissoes, feature)
  // Sem teto configurado não há o que contar — e gravar por gravar encheria a
  // coleção com o volume inteiro da plataforma.
  //
  // Com teto vitalício o evento é gravado mesmo a contagem saindo da coleção
  // real: é o que faz o histórico já existir se o admin trocar depois a janela
  // para "por dia", em vez de a cota começar do zero naquele instante.
  if (!regra.liberado || regra.limite <= 0) return
  if (!PLAN_FEATURE_DEFINITION_BY_KEY[feature].suportaLimite) return

  try {
    await garantirIndices(db)
    await db.collection<PlanUsageEvent>(PLAN_USAGE_COLLECTION).insertOne({
      userId: contexto.userId,
      feature,
      recurso: opcoes.recurso,
      planoTipo: contexto.planoTipo,
      createdAt: new Date(),
    } as PlanUsageEvent)
  } catch (erro) {
    console.error('[plan-entitlements] falha ao registrar uso:', erro)
  }
}

let indicesGarantidos = false
async function garantirIndices(db: Db) {
  if (indicesGarantidos) return
  try {
    const col = db.collection(PLAN_USAGE_COLLECTION)
    await Promise.all([
      col.createIndex({ userId: 1, feature: 1, createdAt: -1 }),
      col.createIndex({ userId: 1, feature: 1, recurso: 1 }),
      // Um teto vitalício conta a coleção real, não o log — então guardar o
      // evento por mais de um ano não serve a ninguém e só ocupa espaço.
      col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 }),
    ])
    indicesGarantidos = true
  } catch (erro) {
    console.error('[plan-entitlements] garantirIndices:', erro)
  }
}

// ─── Atalhos usados pelas rotas ───────────────────────────────────────────────

/**
 * A área faz parte do plano? Responde só a liberação, sem tocar em cota — é o
 * que interessa a quem só precisa saber se mostra ou esconde a seção.
 */
export function areaLiberada(contexto: ContextoDePermissoes, feature: PlanFeatureKey): boolean {
  if (!contexto.aplicavel || contexto.isAdmin) return true
  return regraDaArea(contexto.permissoes, feature).liberado
}

export function moduloDoManualLiberadoNoContexto(
  contexto: ContextoDePermissoes,
  modulo: ManualClinicoModuleKey,
): boolean {
  if (!contexto.aplicavel || contexto.isAdmin) return true
  if (!regraDaArea(contexto.permissoes, 'manualClinico').liberado) return false
  return contexto.permissoes.manualClinicoModulos[modulo] !== false
}

/**
 * Resposta HTTP padrão para uma área fechada ou uma cota estourada.
 *
 * Sai sempre com o mesmo formato — `requiresUpgrade`, `limit`, `used` — que as
 * telas já tratam para os limites de cargo. Assim a mensagem do plano cai nos
 * modais que já existem, sem UI nova para cada área.
 */
export function corpoDeRecusa(veredicto: VeredictoDoPlano) {
  return {
    error: veredicto.mensagem || 'Ação não permitida pelo seu plano.',
    requiresUpgrade: true,
    upgradeUrl: '/buy',
    planLimit: true,
    motivo: veredicto.motivo,
    limit: veredicto.limite,
    used: veredicto.usado,
    remaining: veredicto.restante,
    period: veredicto.periodo,
    renewsAt: veredicto.renovaEm ? veredicto.renovaEm.toISOString() : undefined,
  }
}

// ─── Resumo para telas ────────────────────────────────────────────────────────

export interface ResumoDeArea {
  feature: PlanFeatureKey
  liberado: boolean
  limite: number
  periodo: PlanLimitPeriod
  usado: number | null
  restante: number | null
}

export interface ResumoDePermissoes {
  aplicavel: boolean
  planoTipo: string | null
  planoNome: string | null
  areas: ResumoDeArea[]
  manualClinicoModulos: Record<ManualClinicoModuleKey, boolean>
}

/** Retrato completo para o perfil do aluno e para o painel do admin. */
export async function montarResumoDePermissoes(
  db: Db,
  contexto: ContextoDePermissoes,
): Promise<ResumoDePermissoes> {
  const areas: ResumoDeArea[] = []

  for (const def of Object.values(PLAN_FEATURE_DEFINITION_BY_KEY)) {
    const regra = regraDaArea(contexto.permissoes, def.key)
    const contaTeto = contexto.aplicavel && !contexto.isAdmin && regra.liberado && regra.limite > 0
    const usado = contaTeto
      ? await contarUso(db, contexto.userId, def.key, regra.periodo)
      : null
    areas.push({
      feature: def.key,
      liberado: contexto.aplicavel && !contexto.isAdmin ? regra.liberado : true,
      limite: contaTeto ? regra.limite : 0,
      periodo: regra.periodo,
      usado,
      restante: usado === null ? null : Math.max(0, regra.limite - usado),
    })
  }

  const modulos = MANUAL_CLINICO_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = moduloDoManualLiberadoNoContexto(contexto, key)
    return acc
  }, {} as Record<ManualClinicoModuleKey, boolean>)

  return {
    aplicavel: contexto.aplicavel && !contexto.isAdmin,
    planoTipo: contexto.planoTipo,
    planoNome: contexto.planoNome,
    areas,
    manualClinicoModulos: modulos,
  }
}
