import 'server-only'

/**
 * Quem pode conversar com o Dom.
 *
 * Regra do produto: **Plus+, Quest+ (e admin) ou quem comprou um material nos
 * últimos 7 dias**. A compra recente conta só se for compra paga de verdade —
 * resgate pelo Plus+ (`source: 'plus'`), entrega manual do admin e troca não
 * abrem a porta, senão um único resgate valeria uma semana de IA para sempre.
 *
 * Cada chamada do Dom já é uma ida à IA; duas consultas indexadas ao Mongo
 * (usuário + última compra, em paralelo) não pesam perto disso, então não há
 * cache por pessoa aqui — o acesso reflete na hora a compra ou o vencimento.
 */

import { ObjectId, type Db } from 'mongodb'
import { getAccountTypeLabel, isPaidAccount } from '@/lib/account-tier'
import { getUserCurrentPeriodo } from '@/lib/user-periodo'
import { DIAS_DE_ACESSO_POR_COMPRA } from './config'

export interface UsuarioDoDom {
  id: string
  nome: string
  primeiroNome: string
  email: string
  isAdmin: boolean
  accountType: string
  plano: string
  periodo: number | null
  profissao: string | null
  faculdade: string | null
  assinaturaAte: Date | null
  suspensoAte: Date | null
}

export interface AcessoAoDom {
  liberado: boolean
  motivo?: 'sem-plano' | 'suspenso' | 'banido' | 'inexistente'
  usuario: UsuarioDoDom | null
  /** Até quando vale o acesso que veio de uma compra (null se veio do plano). */
  acessoPorCompraAte: Date | null
}

const PROJECAO = {
  name: 1, email: 1, role: 1, accountType: 1, banned: 1, periodoBase: 1, periodoBaseRef: 1,
  profession: 1, afyaUnit: 1, institution: 1, premiumExpiresAt: 1, questExpiresAt: 1, domSuspensoAte: 1,
} as const

export function primeiroNomeDe(nome: string): string {
  const primeiro = String(nome || '').trim().split(/\s+/)[0] || ''
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase()
}

export async function verificarAcessoAoDom(db: Db, userId: string, email?: string): Promise<AcessoAoDom> {
  if (!ObjectId.isValid(userId)) return { liberado: false, motivo: 'inexistente', usuario: null, acessoPorCompraAte: null }
  const desde = new Date(Date.now() - DIAS_DE_ACESSO_POR_COMPRA * 86_400_000)
  const donos: object[] = [{ userId }]
  if (email) donos.push({ userEmail: String(email).toLowerCase() })

  const [doc, compra] = await Promise.all([
    db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: PROJECAO }),
    db.collection('material_purchases').findOne(
      {
        $or: donos,
        status: 'completed',
        source: { $nin: ['plus', 'manual', 'swap'] },
        purchasedAt: { $gte: desde },
      },
      { projection: { purchasedAt: 1 }, sort: { purchasedAt: -1 } },
    ),
  ])
  if (!doc) return { liberado: false, motivo: 'inexistente', usuario: null, acessoPorCompraAte: null }

  const isAdmin = doc.role === 'admin'
  const suspensoAte = doc.domSuspensoAte ? new Date(doc.domSuspensoAte) : null
  const usuario: UsuarioDoDom = {
    id: userId,
    nome: String(doc.name || ''),
    primeiroNome: primeiroNomeDe(doc.name),
    email: String(doc.email || ''),
    isAdmin,
    accountType: String(doc.accountType || 'gratuito'),
    plano: getAccountTypeLabel(doc.accountType, isAdmin),
    periodo: getUserCurrentPeriodo(doc as any),
    profissao: doc.profession || null,
    faculdade: doc.afyaUnit || doc.institution || null,
    assinaturaAte: doc.premiumExpiresAt ? new Date(doc.premiumExpiresAt) : doc.questExpiresAt ? new Date(doc.questExpiresAt) : null,
    suspensoAte: suspensoAte && suspensoAte.getTime() > Date.now() ? suspensoAte : null,
  }

  if (doc.banned) return { liberado: false, motivo: 'banido', usuario, acessoPorCompraAte: null }
  if (usuario.suspensoAte && !isAdmin) return { liberado: false, motivo: 'suspenso', usuario, acessoPorCompraAte: null }
  if (isPaidAccount(doc.accountType, isAdmin)) return { liberado: true, usuario, acessoPorCompraAte: null }
  if (compra?.purchasedAt) {
    const ate = new Date(new Date(compra.purchasedAt).getTime() + DIAS_DE_ACESSO_POR_COMPRA * 86_400_000)
    return { liberado: true, usuario, acessoPorCompraAte: ate }
  }
  return { liberado: false, motivo: 'sem-plano', usuario, acessoPorCompraAte: null }
}
