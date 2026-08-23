import { describe, expect, it } from 'vitest'
import { checkPlusDownloadAllowance } from '@/lib/plus-guard'
import type { AccountType, User } from '@/lib/types'

/**
 * O Plus+ Guard depois do Quest.
 *
 * O Guard inteiro era gated em `isPlusAccount()`: quem não fosse Plus+ saía
 * liberado sem cota, sem log, sem risco — porque até aqui só o Plus+ tinha
 * conteúdo que valia a pena proteger. O Quest quebra essa premissa: ele vende
 * o Banco de Questões avulso, e a exportação de listas em PDF
 * (`app/api/banco/listas/[id]/pdf`) é exatamente o tipo de superfície que o
 * Guard existe para conter — "assina, extrai tudo, pede reembolso no dia 6".
 *
 * Este teste prende o que importa: a cota agora vale para Quest tanto quanto
 * para Plus+, e gratuito/trial continuam de fora (eles nunca tiveram cargo
 * pago para o Guard proteger).
 */
function bancoFalso(logs: Array<{ userId: string; createdAt: Date }>, plusGuard?: Record<string, any>) {
  return {
    collection(nome: string) {
      if (nome === 'admin_settings') {
        return { findOne: async () => ({ plusGuard }) }
      }
      if (nome === 'plus_download_logs') {
        return {
          countDocuments: async (filtro: any) =>
            logs.filter(l => {
              if (filtro.userId && l.userId !== filtro.userId) return false
              const desde = filtro.createdAt?.$gte
              if (desde && l.createdAt < new Date(desde)) return false
              return true
            }).length,
        }
      }
      return { countDocuments: async () => 0, findOne: async () => null }
    },
  } as any
}

const QUOTA_APERTADA = { steadyState: { perHour: 0, perDay: 1, perWeek: 0 } }

describe('Plus+ Guard cobre o Quest', () => {
  it('barra um Quest fora da janela de reembolso que já bateu a cota do dia', async () => {
    const userId = '507f1f77bcf86cd799439011'
    const usuario: Partial<User> = { accountType: 'quest', premiumActivatedAt: new Date('2020-01-01') }
    const db = bancoFalso([{ userId, createdAt: new Date() }], QUOTA_APERTADA)

    const decisao = await checkPlusDownloadAllowance({ userId, user: usuario, db })

    expect(decisao.allowed).toBe(false)
    expect(decisao.reason).toBe('daily_quota')
  })

  it('libera um Quest ainda dentro da cota do dia', async () => {
    const userId = '507f1f77bcf86cd799439011'
    const usuario: Partial<User> = { accountType: 'quest', premiumActivatedAt: new Date('2020-01-01') }
    const db = bancoFalso([], QUOTA_APERTADA)

    const decisao = await checkPlusDownloadAllowance({ userId, user: usuario, db })

    expect(decisao.allowed).toBe(true)
  })

  it('continua liberando gratuito e trial sem cota — eles nunca tiveram cargo pago aqui', async () => {
    const userId = '507f1f77bcf86cd799439011'
    // Mesmo cenário de log "estourado" do primeiro teste, mas sem cargo pago.
    const logsEstourados = [{ userId, createdAt: new Date() }]

    for (const accountType of ['gratuito', 'trial'] as AccountType[]) {
      const db = bancoFalso(logsEstourados, QUOTA_APERTADA)
      const decisao = await checkPlusDownloadAllowance({
        userId,
        user: { accountType, premiumActivatedAt: new Date('2020-01-01') } as Partial<User>,
        db,
      })
      expect(decisao.allowed, accountType).toBe(true)
    }
  })

  it('mantém o comportamento de sempre para o Plus+', async () => {
    const userId = '507f1f77bcf86cd799439011'
    const usuario: Partial<User> = { accountType: 'plus', premiumActivatedAt: new Date('2020-01-01') }
    const db = bancoFalso([{ userId, createdAt: new Date() }], QUOTA_APERTADA)

    const decisao = await checkPlusDownloadAllowance({ userId, user: usuario, db })

    expect(decisao.allowed).toBe(false)
    expect(decisao.reason).toBe('daily_quota')
  })
})
