import { describe, expect, it } from 'vitest'
import { MAX_CONVERSAS_POR_PESSOA, MAX_FALAS_GUARDADAS, idDeConversaValido, registrarTroca, tituloDaConversa } from '@/lib/dom/historico'

/** Mongo de mentira: guarda as chamadas e devolve o necessário. */
function bancoFalso({ novo, total }: { novo: boolean; total: number }) {
  const chamadas: Record<string, any[]> = { updateOne: [], deleteMany: [], skip: [] }
  const colecao = {
    updateOne: async (...a: any[]) => (chamadas.updateOne.push(a), { upsertedCount: novo ? 1 : 0 }),
    find: () => ({
      sort: () => ({
        skip: (n: number) => (chamadas.skip.push(n), {
          project: () => ({ toArray: async () => Array.from({ length: Math.max(0, total - n) }, (_, i) => ({ _id: `velha${i}` })) }),
        }),
      }),
    }),
    deleteMany: async (...a: any[]) => (chamadas.deleteMany.push(a), { deletedCount: a[0]._id.$in.length }),
  }
  return { db: { collection: () => colecao } as any, chamadas }
}

const troca = { userId: 'u1', nome: 'Ana', email: 'a@x.com', conversaId: 'c123abc', modo: 'geral' as const, aluno: 'O que é a bomba H+/K+?', dom: 'É a $H^+/K^+$ ATPase…', motor: 'gemini' }

describe('histórico do Dom no servidor', () => {
  it('guarda pergunta e resposta, só as últimas 40 falas', async () => {
    const { db, chamadas } = bancoFalso({ novo: false, total: 3 })
    await registrarTroca(db, troca)
    const [filtro, atualizacao, opcoes] = chamadas.updateOne[0]
    expect(filtro).toEqual({ userId: 'u1', conversaId: 'c123abc' })
    expect(opcoes).toEqual({ upsert: true })
    expect(atualizacao.$push.falas.$slice).toBe(-MAX_FALAS_GUARDADAS)
    expect(atualizacao.$push.falas.$each.map((f: any) => f.papel)).toEqual(['aluno', 'dom'])
    expect(atualizacao.$inc).toEqual({ totalDeFalas: 2, alertas: 0 })
    expect(chamadas.deleteMany).toHaveLength(0) // conversa já existia: nada a podar
  })

  it('conversa nova apaga as que passaram de 25', async () => {
    const { db, chamadas } = bancoFalso({ novo: true, total: 27 })
    await registrarTroca(db, { ...troca, alerta: 'injecao-de-prompt' })
    expect(chamadas.skip[0]).toBe(MAX_CONVERSAS_POR_PESSOA)
    expect(chamadas.deleteMany[0][0]._id.$in).toEqual(['velha0', 'velha1'])
    expect(chamadas.updateOne[0][1].$inc.alertas).toBe(1)
  })

  it('erro no banco não derruba a conversa', async () => {
    const db = { collection: () => ({ updateOne: async () => { throw new Error('fora do ar') } }) } as any
    await expect(registrarTroca(db, troca)).resolves.toBeUndefined()
  })

  it('id de conversa e título', () => {
    expect(idDeConversaValido('cm3x9k2abcd')).toBe('cm3x9k2abcd')
    expect(idDeConversaValido('{"$gt":""}')).toBeNull()
    expect(idDeConversaValido({ $ne: 1 })).toBeNull()
    expect(tituloDaConversa('quero   estudar ciclo cardíaco')).toBe('quero estudar ciclo cardíaco')
    expect(tituloDaConversa('oi', 'Ciclo cardíaco')).toBe('Socrático: Ciclo cardíaco')
  })
})
