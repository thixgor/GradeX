import { ObjectId, type Db } from 'mongodb'
import { getUserCurrentPeriodo } from '@/lib/user-periodo'
import { montarExtratoDeXp } from './extrato'
import {
  AREAS_DE_XP,
  VERSAO_DAS_REGRAS,
  hojeEmSaoPaulo,
  mesDe,
  nivelDe,
  nomeDoRanking,
  semanaDe,
  xpDoPeriodo,
  type AreaDeXp,
  type ExtratoDeXp,
  type FonteDeXp,
} from './regras'

/**
 * O retrato de XP de cada pessoa (`xp_perfis`) — o que o ranking ordena.
 *
 * O XP de verdade é sempre o calculado do histórico (`montarExtratoDeXp`); o
 * retrato é só a última conta guardada, para o ranking não precisar refazer o
 * histórico de milhares de pessoas a cada visita. Ele é refeito:
 *
 * - quando a própria pessoa abre o site (o `XpProvider` pede `/api/xp/eu`, que
 *   refaz se o retrato tem mais de um minuto e meio);
 * - pela varredura de hora em hora (`/api/cron/xp`), que percorre todas as
 *   contas — é ela que coloca no ranking, já com o XP retroativo, quem ainda
 *   não voltou ao site desde que o sistema entrou no ar.
 */

export const COLECAO_XP = 'xp_perfis'
const DIAS_GUARDADOS = 371

export interface PerfilDeXp {
  userId: string
  nome: string
  avatar: string | null
  faculdade: string | null
  periodo: number | null
  profissao: string | null
  total: number
  nivel: number
  liga: string
  semana: { chave: string; xp: number }
  mes: { chave: string; xp: number }
  hoje: { chave: string; xp: number }
  porArea: Record<AreaDeXp, number>
  porDia: Record<string, number>
  quantidades: Partial<Record<FonteDeXp, number>>
  sequenciaAtual: number
  maiorSequencia: number
  diasAtivos: number
  /** Escolheu não aparecer pelo nome no ranking. */
  oculto: boolean
  /** Entra no ranking: conta comum, não banida, com algum XP. */
  elegivel: boolean
  versao: number
  atualizadoEm: Date
}

let indicesGarantidos = false
let indicesDasFontes = false

/**
 * Índices do ranking e das fontes que o extrato lê por pessoa — uma vez por
 * instância, não por requisição. Ficam aqui (e não só em `mongodb-indexes.ts`,
 * que em produção só roda com `npm run db:indexes`) para ninguém precisar
 * lembrar de rodar nada: sem eles a varredura do XP leria o fórum e as aulas
 * inteiros para cada conta. `createIndex` de um índice que já existe só
 * confirma e volta.
 *
 * Os do ranking (`xp_perfis`, coleção nova e pequena) são esperados: o índice
 * único de `userId` é o que impede retrato duplicado. Os das fontes saem em
 * segundo plano — o primeiro de uma coleção grande (os logs do leitor de PDF)
 * pode levar segundos, e a consulta funciona sem ele enquanto isso.
 */
export async function garantirIndicesDoXp(db: Db): Promise<void> {
  if (!indicesDasFontes) {
    indicesDasFontes = true
    void Promise.all([
      db.collection('forum_posts').createIndex({ authorId: 1, createdAt: -1 }),
      db.collection('forum_comments').createIndex({ authorId: 1, createdAt: -1 }),
      db.collection('aulas_progresso').createIndex({ usuarioId: 1, concluida: 1 }),
      db.collection('aulas_postagens').createIndex({ usuariosConcluidos: 1 }),
      db.collection('material_pdf_viewer_logs').createIndex({ userId: 1, action: 1, createdAt: -1 }),
    ]).catch((err) => {
      indicesDasFontes = false
      console.error('[xp] falha ao criar índices das fontes:', err)
    })
  }
  if (indicesGarantidos) return
  try {
    const col = db.collection(COLECAO_XP)
    await Promise.all([
      col.createIndex({ userId: 1 }, { unique: true }),
      col.createIndex({ elegivel: 1, total: -1 }),
      col.createIndex({ elegivel: 1, 'semana.chave': 1, 'semana.xp': -1 }),
      col.createIndex({ elegivel: 1, 'mes.chave': 1, 'mes.xp': -1 }),
      col.createIndex({ elegivel: 1, faculdade: 1, total: -1 }),
      col.createIndex({ elegivel: 1, faculdade: 1, 'semana.chave': 1, 'semana.xp': -1 }),
      col.createIndex({ elegivel: 1, faculdade: 1, 'mes.chave': 1, 'mes.xp': -1 }),
    ])
    indicesGarantidos = true
  } catch (err) {
    console.error('[xp] falha ao garantir índices:', err)
  }
}

interface UsuarioParaXp {
  _id: ObjectId
  name?: string
  avatar?: string
  afyaUnit?: string
  periodoBase?: number
  periodoBaseRef?: string
  profession?: string
  role?: string
  banned?: boolean
  xpRankingOculto?: boolean
}

const PROJECAO_DO_USUARIO = {
  name: 1, avatar: 1, afyaUnit: 1, periodoBase: 1, periodoBaseRef: 1, profession: 1, role: 1, banned: 1, xpRankingOculto: 1,
} as const

function retratoDe(usuario: UsuarioParaXp, extrato: ExtratoDeXp, agora: Date): PerfilDeXp {
  const periodo = xpDoPeriodo(extrato.porDia, agora)
  const nivel = nivelDe(extrato.total)
  const corte = new Date(agora.getTime() - DIAS_GUARDADOS * 86_400_000).toISOString().slice(0, 10)
  const porDia = Object.fromEntries(Object.entries(extrato.porDia).filter(([dia]) => dia >= corte))
  const quantidades = Object.fromEntries(
    Object.entries(extrato.quantidades).filter(([, n]) => n > 0),
  ) as Partial<Record<FonteDeXp, number>>
  const hoje = hojeEmSaoPaulo(agora)

  return {
    userId: String(usuario._id),
    nome: nomeDoRanking(usuario.name),
    avatar: usuario.avatar || null,
    faculdade: usuario.profession === 'academico' && usuario.afyaUnit ? usuario.afyaUnit : null,
    periodo: getUserCurrentPeriodo(usuario, agora),
    profissao: usuario.profession || null,
    total: extrato.total,
    nivel: nivel.nivel,
    liga: nivel.liga.id,
    semana: periodo.semana,
    mes: periodo.mes,
    hoje: { chave: hoje, xp: periodo.hoje },
    porArea: extrato.porArea,
    porDia,
    quantidades,
    sequenciaAtual: extrato.sequenciaAtual,
    maiorSequencia: extrato.maiorSequencia,
    diasAtivos: extrato.diasAtivos,
    oculto: usuario.xpRankingOculto === true,
    elegivel: usuario.role !== 'admin' && usuario.banned !== true && extrato.total > 0,
    versao: VERSAO_DAS_REGRAS,
    atualizadoEm: agora,
  }
}

/** Refaz o XP de uma pessoa a partir do histórico e grava o retrato. */
export async function atualizarPerfilDeXp(
  db: Db,
  userId: string,
  { agora = new Date(), usuario }: { agora?: Date; usuario?: UsuarioParaXp | null } = {},
): Promise<PerfilDeXp | null> {
  if (!ObjectId.isValid(userId)) return null
  const [dono, extrato] = await Promise.all([
    usuario !== undefined
      ? Promise.resolve(usuario)
      : db.collection<UsuarioParaXp>('users').findOne({ _id: new ObjectId(userId) }, { projection: PROJECAO_DO_USUARIO }),
    montarExtratoDeXp(db, userId, { agora }),
  ])
  if (!dono) return null
  const retrato = retratoDe(dono, extrato, agora)
  await db.collection<PerfilDeXp>(COLECAO_XP).updateOne({ userId: retrato.userId }, { $set: retrato }, { upsert: true })
  return retrato
}

/**
 * O retrato da pessoa, refeito se estiver velho, de outra versão das regras,
 * ou de outra semana (a semana virou e o XP da semana precisa zerar).
 */
export async function obterPerfilDeXp(
  db: Db,
  userId: string,
  { maxIdadeMs = 90_000, agora = new Date() }: { maxIdadeMs?: number; agora?: Date } = {},
): Promise<PerfilDeXp | null> {
  await garantirIndicesDoXp(db)
  const guardado = await db.collection<PerfilDeXp>(COLECAO_XP).findOne({ userId })
  const hoje = hojeEmSaoPaulo(agora)
  const fresco =
    guardado &&
    guardado.versao === VERSAO_DAS_REGRAS &&
    guardado.hoje?.chave === hoje &&
    agora.getTime() - new Date(guardado.atualizadoEm).getTime() < maxIdadeMs
  if (fresco) return guardado
  return atualizarPerfilDeXp(db, userId, { agora })
}

export type Periodo = 'semana' | 'mes' | 'geral'

/** O campo ordenado e o filtro de cada período do ranking. */
export function campoDoPeriodo(periodo: Periodo, agora: Date = new Date()) {
  const hoje = hojeEmSaoPaulo(agora)
  if (periodo === 'semana') return { campo: 'semana.xp', filtro: { 'semana.chave': semanaDe(hoje) } }
  if (periodo === 'mes') return { campo: 'mes.xp', filtro: { 'mes.chave': mesDe(hoje) } }
  return { campo: 'total', filtro: {} }
}

export function xpNoPeriodo(perfil: Pick<PerfilDeXp, 'total' | 'semana' | 'mes'>, periodo: Periodo, agora: Date = new Date()): number {
  const hoje = hojeEmSaoPaulo(agora)
  if (periodo === 'semana') return perfil.semana?.chave === semanaDe(hoje) ? perfil.semana.xp : 0
  if (periodo === 'mes') return perfil.mes?.chave === mesDe(hoje) ? perfil.mes.xp : 0
  return perfil.total
}

/** Zera as áreas que faltarem (retratos de uma versão antiga). */
export function porAreaCompleto(porArea: Partial<Record<AreaDeXp, number>> | undefined): Record<AreaDeXp, number> {
  return Object.fromEntries(AREAS_DE_XP.map((a) => [a, porArea?.[a] || 0])) as Record<AreaDeXp, number>
}

export { PROJECAO_DO_USUARIO }
export type { UsuarioParaXp }
